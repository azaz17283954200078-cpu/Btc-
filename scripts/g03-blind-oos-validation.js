#!/usr/bin/env node
'use strict';

const Runner=require('./research-runner.js');
const Presets=require('../src/model-presets.js');
const REL=require('../src/reliability-engine.js');
const RK=require('../src/research-kernel.js');
const ME=require('../src/model-engine.js');
const Matrix=require('./g03-reliability-matrix.js');
const Calibration=require('./g03-preset-calibration.js');

const CONTEXTS=Matrix.CONTEXTS;
const PRIMARY=Matrix.PRIMARY;

function enabledOnly(model){return Matrix.enabledOnly(model)}
function levelOf(p){return Matrix.levelOf(p)}
function summarizeOos(data,evidence,model,state,horizon,splitIndex){
  const rows=REL.matchingEvidence(evidence,model,state,data.length-1).filter(e=>e.index>=splitIndex),
        evaluated=RK.evaluateEvidence(data,rows,horizon,data.length-1),
        s=evaluated.summary;
  return{
    total:rows.length,
    complete:s?s.n:0,
    upRate:s?s.upRate:null,
    medianReturn:s?s.medianReturn:null,
    medianMFE:s?s.medianMFE:null,
    medianMAE:s?s.medianMAE:null
  }
}
async function buildValidation(options={}){
  const contexts=options.contexts||CONTEXTS,loader=options.dataLoader||Runner.loadMarketData,
        calibration=options.calibration||await Calibration.buildCalibration({contexts,dataLoader:loader}),
        cache=new Map(),
        report={
          schemaVersion:1,
          presetVersion:Presets.VERSION,
          modelVersion:ME.VERSION,
          reliabilityStandardVersion:REL.VERSION,
          generatedAt:new Date().toISOString(),
          splitRule:'Chronological 70% calibration / 30% blind validation; no random shuffle.',
          freezeRule:'Preset parameters and fingerprint are frozen before any OOS outcome summary is revealed.',
          selectionBasis:'Preset publication uses Evidence density, N_eff, lifecycle/coverage and parameter stability. OOS return metrics are reveal-only and never select the preset.',
          models:{}
        };

  for(const ctx of contexts){
    const key=ctx.market+'|'+ctx.timeframe;
    if(!cache.has(key)){
      const loaded=await loader(ctx.market,ctx.timeframe);
      cache.set(key,{source:loaded.source,data:loaded.data.slice(-ctx.bars)})
    }
  }

  for(const model of Object.keys(PRIMARY)){
    const presets={};
    for(const preset of Presets.list(model)){
      const rows=[];
      for(const ctx of contexts){
        const loaded=cache.get(ctx.market+'|'+ctx.timeframe),data=loaded.data,
              split=REL.splitPlan(data,.70),
              c=preset.config||{},
              runSpec={
                market:ctx.market,timeframe:ctx.timeframe,source:loaded.source,
                enabled:enabledOnly(model),parameterSet:model+':'+preset.id,
                zone:c.zone||{},macro:c.macro||{},sweep:c.sweep||{},exp:c.exp||{}
              },
              calibrationData=data.slice(0,split.splitIndex),
              frozen=Runner.runResearch(calibrationData,runSpec),
              full=Runner.runResearch(data,{...runSpec,parameterStability:true}),
              stableFingerprint=frozen.parameterFingerprint===full.parameterFingerprint,
              reliability=REL.evaluateModelState(data,full.evidence,{
                model,state:PRIMARY[model],horizon:10,market:ctx.market,timeframe:ctx.timeframe,
                knownThrough:data.length-1,parameterStability:true
              }),
              oos=summarizeOos(data,full.evidence,model,PRIMARY[model],10,split.splitIndex);
        rows.push({
          market:ctx.market,timeframe:ctx.timeframe,bars:data.length,
          calibrationRange:{start:split.calibrationStart,end:split.calibrationEnd,bars:split.splitIndex},
          validationRange:{start:split.validationStart,end:split.validationEnd,bars:data.length-split.splitIndex},
          parameterFingerprint:full.parameterFingerprint,
          frozenFingerprintMatches:stableFingerprint,
          calibration:{
            total:reliability.oos.calibration.total,
            complete:reliability.oos.calibration.complete,
            nEff:reliability.oos.calibration.nEff
          },
          validation:{
            total:reliability.oos.validation.total,
            complete:reliability.oos.validation.complete,
            nEff:reliability.oos.validation.nEff,
            outcome:oos
          },
          reliabilityLevel:reliability.level.label
        })
      }
      const agg=rows.reduce((a,x)=>{
        a.calibrationComplete+=x.calibration.complete;
        a.calibrationNEff+=x.calibration.nEff;
        a.oosComplete+=x.validation.complete;
        a.oosNEff+=x.validation.nEff;
        a.contextsWithOos+=x.validation.complete>0?1:0;
        a.fingerprintStable=a.fingerprintStable&&x.frozenFingerprintMatches;
        return a
      },{calibrationComplete:0,calibrationNEff:0,oosComplete:0,oosNEff:0,contextsWithOos:0,fingerprintStable:true});
      const cmeta=calibration.models[model]&&calibration.models[model].presets[preset.id];
      presets[preset.id]={
        level:levelOf(preset),title:preset.title,primaryState:PRIMARY[model],
        parameterStability:!!(cmeta&&cmeta.parameterStability),
        aggregate:agg,rows
      }
    }
    report.models[model]={primaryState:PRIMARY[model],presets}
  }

  report.allFrozen=Object.values(report.models).every(m=>Object.values(m.presets).every(p=>p.aggregate.fingerprintStable));
  report.allHaveOos=Object.values(report.models).every(m=>Object.values(m.presets).every(p=>p.aggregate.contextsWithOos>=1));
  report.allParameterStable=Object.values(report.models).every(m=>Object.values(m.presets).every(p=>p.parameterStability));
  return report
}

async function main(){
  const r=await buildValidation();
  const summary={
    presetVersion:r.presetVersion,
    allFrozen:r.allFrozen,
    allHaveOos:r.allHaveOos,
    allParameterStable:r.allParameterStable,
    models:Object.fromEntries(Object.entries(r.models).map(([m,x])=>[m,
      Object.fromEntries(Object.entries(x.presets).map(([id,p])=>[id,{
        level:p.level,parameterStability:p.parameterStability,
        calibrationComplete:p.aggregate.calibrationComplete,
        calibrationNEff:p.aggregate.calibrationNEff,
        oosComplete:p.aggregate.oosComplete,
        oosNEff:p.aggregate.oosNEff,
        contextsWithOos:p.aggregate.contextsWithOos,
        fingerprintStable:p.aggregate.fingerprintStable
      }]))
    ]))
  };
  console.log('G03_BLIND_OOS_SUMMARY '+JSON.stringify(summary));
  if(!r.allFrozen||!r.allHaveOos||!r.allParameterStable)process.exitCode=1
}

if(require.main===module)main().catch(e=>{console.error(e.stack||e);process.exit(1)});

module.exports={summarizeOos,buildValidation};
