#!/usr/bin/env node
'use strict';

const Runner=require('./research-runner.js');
const Presets=require('../src/model-presets.js');
const REL=require('../src/reliability-engine.js');

const CONTEXTS=[
  {market:'BTC',timeframe:'1d',bars:1800},{market:'BTC',timeframe:'1w',bars:700},
  {market:'IXIC',timeframe:'1d',bars:1800},{market:'TWII',timeframe:'1d',bars:1800},
  {market:'IXIC',timeframe:'1w',bars:700},{market:'TWII',timeframe:'1w',bars:700},
  {market:'IXIC',timeframe:'1m',bars:300},{market:'TWII',timeframe:'1m',bars:300}
];
const PRIMARY={support:'potential',macro:'candidate',sweep:'event',basin:'active',field:'active',echo:'strong',astro:'event'};

function levelOf(p){
  return p.level||(p.id==='sensitive'?'loose':p.id==='selective'?'strict':'balanced')
}
function enabledOnly(model){
  const out={support:false,macro:false,sweep:false,basin:false,field:false,echo:false,astro:false};
  out[model]=true;return out
}
function compact(r){
  return{
    standardVersion:r.standardVersion,
    level:r.level,
    sampleBand:r.sampleBand,
    counts:r.counts,
    integrity:{pass:r.integrity.pass,errors:r.integrity.errors,warnings:r.integrity.warnings},
    coverage:{spanYears:r.coverage.spanYears,yearsRepresented:r.coverage.yearsRepresented,maxYearShare:r.coverage.maxYearShare},
    lifecycle:r.lifecycle,
    split:r.split,
    oos:r.oos,
    parameterStability:r.parameterStability,
    weaknesses:r.weaknesses
  }
}
function aggregate(rows){
  return rows.reduce((a,x)=>{
    a.total+=x.reliability.counts.total;
    a.complete+=x.reliability.counts.complete;
    a.nEff+=x.reliability.counts.nEff;
    a.oosComplete+=x.reliability.oos.validation.complete;
    a.oosNEff+=x.reliability.oos.validation.nEff;
    if(x.reliability.counts.total>0)a.contextsWithSamples++;
    return a
  },{total:0,complete:0,nEff:0,oosComplete:0,oosNEff:0,contextsWithSamples:0})
}
async function buildMatrix(options={}){
  const contexts=options.contexts||CONTEXTS,loader=options.dataLoader||Runner.loadMarketData,
        cache=new Map(),cells=[];
  for(const ctx of contexts){
    const k=ctx.market+'|'+ctx.timeframe;
    if(!cache.has(k)){
      const loaded=await loader(ctx.market,ctx.timeframe);
      cache.set(k,{source:loaded.source,data:loaded.data.slice(-ctx.bars)});
    }
  }
  for(const model of Object.keys(PRIMARY)){
    for(const preset of Presets.list(model)){
      for(const ctx of contexts){
        const loaded=cache.get(ctx.market+'|'+ctx.timeframe),c=preset.config||{},
              run=Runner.runResearch(loaded.data,{
                market:ctx.market,timeframe:ctx.timeframe,source:loaded.source,
                enabled:enabledOnly(model),parameterSet:model+':'+preset.id,
                zone:c.zone||{},macro:c.macro||{},sweep:c.sweep||{},exp:c.exp||{},
                parameterStability:false
              }),
              rel=REL.evaluateModelState(loaded.data,run.evidence,{
                model,state:PRIMARY[model],horizon:10,market:ctx.market,
                knownThrough:loaded.data.length-1,parameterStability:false
              });
        cells.push({
          model,presetId:preset.id,presetLevel:levelOf(preset),
          market:ctx.market,timeframe:ctx.timeframe,bars:loaded.data.length,
          state:PRIMARY[model],parameterFingerprint:run.parameterFingerprint,
          reliability:compact(rel)
        })
      }
    }
  }

  const groups={};
  for(const cell of cells){
    const k=[cell.model,cell.market,cell.timeframe,cell.state].join('|');
    (groups[k]||(groups[k]=[])).push(cell)
  }
  const monotonic=[];
  for(const [key,rows] of Object.entries(groups)){
    const order=['loose','balanced','strict'].map(level=>rows.find(x=>x.presetLevel===level)).filter(Boolean),
          counts=order.map(x=>x.reliability.counts.total),
          pass=counts.length===3&&counts[0]>=counts[1]&&counts[1]>=counts[2];
    monotonic.push({key,counts,pass});
    for(const cell of rows){
      cell.weaknesses=REL.diagnosePresetCell(cell,rows);
    }
  }
  const byModelPreset={};
  for(const model of Object.keys(PRIMARY)){
    byModelPreset[model]={};
    for(const preset of Presets.list(model)){
      const rows=cells.filter(x=>x.model===model&&x.presetId===preset.id);
      byModelPreset[model][preset.id]={
        level:levelOf(preset),title:preset.title,aggregate:aggregate(rows)
      }
    }
  }
  const report={
    schemaVersion:1,
    reliabilityStandardVersion:REL.VERSION,
    presetVersion:Presets.VERSION,
    generatedAt:new Date().toISOString(),
    selectionBasis:'Evidence density, N_eff, lifecycle coverage, time coverage and OOS counts only. No return/up-rate/MFE/MAE metric participates in preset selection.',
    contexts,
    cells,
    byModelPreset,
    monotonic,
    allMonotonic:monotonic.every(x=>x.pass)
  };
  return report
}

async function main(){
  const report=await buildMatrix();
  const compactSummary={
    presetVersion:report.presetVersion,
    allMonotonic:report.allMonotonic,
    byModelPreset:report.byModelPreset,
    monotonicFailures:report.monotonic.filter(x=>!x.pass),
    weakCounts:Object.fromEntries(Object.keys(PRIMARY).map(model=>[
      model,
      Object.fromEntries(Presets.list(model).map(p=>[
        p.id,
        report.cells.filter(x=>x.model===model&&x.presetId===p.id&&x.weaknesses&&x.weaknesses.length).length
      ]))
    ]))
  };
  console.log('G03_RELIABILITY_MATRIX_SUMMARY '+JSON.stringify(compactSummary));
  if(!report.allMonotonic)process.exitCode=1;
}

if(require.main===module){
  main().catch(e=>{console.error(e.stack||e);process.exit(1)})
}

module.exports={CONTEXTS,PRIMARY,levelOf,enabledOnly,compact,aggregate,buildMatrix};
