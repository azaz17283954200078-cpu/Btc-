#!/usr/bin/env node
'use strict';

const Runner=require('./research-runner.js');
const Presets=require('../src/model-presets.js');
const ME=require('../src/model-engine.js');
const Matrix=require('./g03-reliability-matrix.js');

const CONTEXTS=Matrix.CONTEXTS;
const PRIMARY=Matrix.PRIMARY;

function clone(x){return JSON.parse(JSON.stringify(x))}
function deepAssign(target,patch){
  if(!patch||typeof patch!=='object')return target;
  for(const [k,v] of Object.entries(patch)){
    if(v&&typeof v==='object'&&!Array.isArray(v)){
      if(!target[k]||typeof target[k]!=='object'||Array.isArray(target[k]))target[k]={};
      deepAssign(target[k],v)
    }else target[k]=v
  }
  return target
}
function enabledOnly(model){return Matrix.enabledOnly(model)}
function perturbConfig(model,preset,dir,timeframe){
  const c=clone(preset.config||{});
  if(model==='support'){
    c.zone=c.zone||{};
    const base=Number(c.zone.pivot??ME.DEFAULT_ZONE.pivot);
    c.zone.pivot=Math.max(2,Math.round(base+dir));
  }else if(model==='macro'){
    c.macro=c.macro||{};c.macro.p=c.macro.p||{};
    const base={...(ME.DEFAULT_MACRO.p[timeframe]||ME.DEFAULT_MACRO.p['1d']),...(c.macro.p[timeframe]||{})};
    c.macro.p[timeframe]={...base,dd:Math.max(.03,Math.min(.8,base.dd+dir*.01))};
  }else if(model==='sweep'){
    c.sweep=c.sweep||{};
    const base=Number(c.sweep.minClosePosition??ME.DEFAULT_SWEEP.minClosePosition);
    c.sweep.minClosePosition=Math.max(.2,Math.min(.95,base+dir*.03));
  }else if(model==='basin'){
    c.exp=c.exp||{};c.exp.basin=c.exp.basin||{};
    const base=Number(c.exp.basin.threshold??ME.DEFAULT_EXP.basin.threshold);
    c.exp.basin.threshold=Math.max(40,Math.min(95,base+dir*2));
  }else if(model==='field'){
    c.exp=c.exp||{};c.exp.spring=c.exp.spring||{};
    const base=Number(c.exp.spring.minFitPct??ME.DEFAULT_EXP.spring.minFitPct);
    c.exp.spring.minFitPct=Math.max(50,Math.min(99,base+dir*2));
  }else if(model==='echo'){
    c.exp=c.exp||{};c.exp.echo=c.exp.echo||{};
    const base=Number(c.exp.echo.similarity??ME.DEFAULT_EXP.echo.similarity);
    c.exp.echo.similarity=Math.max(.5,Math.min(.98,base+dir*.02));
  }else if(model==='astro'){
    c.exp=c.exp||{};c.exp.astro=c.exp.astro||{};
    const base=Number(c.exp.astro.orb??ME.DEFAULT_EXP.astro.orb);
    c.exp.astro.orb=Math.max(.5,Math.min(10,base+dir*.5));
  }
  return c
}
function stateCount(run,model,state){
  const st=run.evaluation&&run.evaluation.models&&run.evaluation.models[model]&&run.evaluation.models[model].states&&run.evaluation.models[model].states[state];
  return st?st.count:0
}
async function buildCalibration(options={}){
  const contexts=options.contexts||CONTEXTS,loader=options.dataLoader||Runner.loadMarketData,cache=new Map(),
        report={
          schemaVersion:1,presetVersion:Presets.VERSION,modelVersion:ME.VERSION,
          generatedAt:new Date().toISOString(),
          objective:'Preserve model semantics while producing understandable loose/balanced/strict Evidence density and stable local parameter neighborhoods.',
          forbiddenObjective:'No forward return, up-rate, MFE, MAE or equity metric is used to select or reject a preset.',
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
      let baseTotal=0,lowTotal=0,highTotal=0,contextsWithSamples=0;
      const rows=[];
      for(const ctx of contexts){
        const loaded=cache.get(ctx.market+'|'+ctx.timeframe),base=preset.config||{},
              low=perturbConfig(model,preset,-1,ctx.timeframe),high=perturbConfig(model,preset,1,ctx.timeframe);
        const run=(cfg)=>Runner.runResearch(loaded.data,{
          market:ctx.market,timeframe:ctx.timeframe,source:loaded.source,
          enabled:enabledOnly(model),parameterSet:'calibration:'+model+':'+preset.id,
          zone:cfg.zone||{},macro:cfg.macro||{},sweep:cfg.sweep||{},exp:cfg.exp||{}
        });
        const b=stateCount(run(base),model,PRIMARY[model]),
              l=stateCount(run(low),model,PRIMARY[model]),
              h=stateCount(run(high),model,PRIMARY[model]);
        baseTotal+=b;lowTotal+=l;highTotal+=h;if(b>0)contextsWithSamples++;
        rows.push({market:ctx.market,timeframe:ctx.timeframe,base:b,neighborLow:l,neighborHigh:h})
      }
      const ratios=baseTotal?{low:lowTotal/baseTotal,high:highTotal/baseTotal}:{low:null,high:null},
            stable=baseTotal>0&&[ratios.low,ratios.high].every(x=>Number.isFinite(x)&&x>=.35&&x<=2.85);
      presets[preset.id]={
        level:Matrix.levelOf(preset),title:preset.title,
        primaryState:PRIMARY[model],baseCount:baseTotal,
        neighborCounts:{low:lowTotal,high:highTotal},
        neighborRatios:ratios,contextsWithSamples,
        parameterStability:stable,rows
      }
    }
    const order=['loose','balanced','strict'].map(level=>Object.values(presets).find(x=>x.level===level)),
          counts=order.map(x=>x?x.baseCount:0),
          monotonic=order.every(Boolean)&&counts[0]>=counts[1]&&counts[1]>=counts[2]&&counts[0]>counts[2];
    report.models[model]={primaryState:PRIMARY[model],monotonic,counts,presets}
  }
  report.allMonotonic=Object.values(report.models).every(x=>x.monotonic);
  report.allStable=Object.values(report.models).every(x=>Object.values(x.presets).every(p=>p.parameterStability));
  return report
}

async function main(){
  const r=await buildCalibration();
  const summary={
    presetVersion:r.presetVersion,allMonotonic:r.allMonotonic,allStable:r.allStable,
    models:Object.fromEntries(Object.entries(r.models).map(([m,x])=>[m,{
      monotonic:x.monotonic,counts:x.counts,
      presets:Object.fromEntries(Object.entries(x.presets).map(([id,p])=>[id,{
        level:p.level,baseCount:p.baseCount,neighborCounts:p.neighborCounts,
        neighborRatios:p.neighborRatios,parameterStability:p.parameterStability
      }]))
    }]))
  };
  console.log('G03_PRESET_CALIBRATION_SUMMARY '+JSON.stringify(summary));
  if(!r.allMonotonic||!r.allStable)process.exitCode=1
}

if(require.main===module)main().catch(e=>{console.error(e.stack||e);process.exit(1)});

module.exports={perturbConfig,stateCount,buildCalibration};
