#!/usr/bin/env node
'use strict';
const Runner=require('./research-runner.js');
const Presets=require('../src/model-presets.js');

const CONTEXTS=[
  {market:'IXIC',timeframe:'1d',bars:1800},{market:'TWII',timeframe:'1d',bars:1800},
  {market:'IXIC',timeframe:'1w',bars:700},{market:'TWII',timeframe:'1w',bars:700},
  {market:'IXIC',timeframe:'1m',bars:300},{market:'TWII',timeframe:'1m',bars:300}
];
const PRIMARY={support:'potential',macro:'candidate',sweep:'event',basin:'active',field:'active',echo:'strong',astro:'event'};
const ORDER={support:['sensitive','balanced','selective'],macro:['sensitive','balanced','selective'],sweep:['sensitive','balanced','selective'],basin:['sensitive','balanced','selective'],field:['sensitive','balanced','selective'],echo:['sensitive','balanced','selective'],astro:['sensitive','balanced','selective']};

function enabledOnly(model){const out={support:false,macro:false,sweep:false,basin:false,field:false,echo:false,astro:false};out[model]=true;return out}
function stateStats(run,model,state){
  const s=run.evaluation&&run.evaluation.models&&run.evaluation.models[model]&&run.evaluation.models[model].states&&run.evaluation.models[model].states[state];
  const h=s&&s.horizons&&s.horizons[10];
  return{count:s?s.count:0,n10:h?h.n:0,incomplete10:h?h.incomplete:0,median10:h?h.medianReturn:null};
}
function aggregate(rows){return rows.reduce((a,x)=>{a.count+=x.count;a.n10+=x.n10;a.errors+=x.errors;if(x.count>0)a.contextsWithSamples++;return a},{count:0,n10:0,errors:0,contextsWithSamples:0})}
function semanticOrder(model,byPreset){const ids=ORDER[model],vals=ids.map(id=>byPreset[id].aggregate.count);return{ids,values:vals,pass:vals[0]>=vals[1]&&vals[1]>=vals[2]&&vals[0]>vals[2]}}

(async()=>{
  const cache=new Map(),report={schemaVersion:1,presetVersion:Presets.VERSION,contexts:CONTEXTS,models:{}};
  for(const ctx of CONTEXTS){
    const k=ctx.market+'|'+ctx.timeframe;
    if(!cache.has(k)){
      const loaded=await Runner.loadMarketData(ctx.market,ctx.timeframe);
      cache.set(k,{source:loaded.source,data:loaded.data.slice(-ctx.bars)});
    }
  }
  for(const model of Object.keys(PRIMARY)){
    const byPreset={};
    for(const preset of Presets.list(model)){
      const rows=[];
      for(const ctx of CONTEXTS){
        const loaded=cache.get(ctx.market+'|'+ctx.timeframe),c=preset.config||{};
        const run=Runner.runResearch(loaded.data,{market:ctx.market,timeframe:ctx.timeframe,source:loaded.source,enabled:enabledOnly(model),parameterSet:model+':'+preset.id,zone:c.zone||{},macro:c.macro||{},sweep:c.sweep||{},exp:c.exp||{}});
        const st=stateStats(run,model,PRIMARY[model]);
        rows.push({market:ctx.market,timeframe:ctx.timeframe,bars:loaded.data.length,count:st.count,n10:st.n10,incomplete10:st.incomplete10,median10:st.median10,errors:run.evidenceErrors.length,fingerprint:run.parameterFingerprint});
      }
      byPreset[preset.id]={title:preset.title,intent:preset.intent,rows,aggregate:aggregate(rows)};
    }
    const ordering=semanticOrder(model,byPreset);
    const adequate=Object.values(byPreset).every(x=>x.aggregate.errors===0&&x.aggregate.count>=8&&x.aggregate.n10>=5&&x.aggregate.contextsWithSamples>=2);
    report.models[model]={primaryState:PRIMARY[model],ordering,adequate,byPreset};
  }
  report.allRuntimeClean=Object.values(report.models).every(x=>Object.values(x.byPreset).every(p=>p.aggregate.errors===0));
  report.allSemanticFit=Object.values(report.models).every(x=>x.ordering.pass&&x.adequate);
  console.log('M4_PRESET_RESEARCH_JSON_START');
  console.log(JSON.stringify(report,null,2));
  console.log('M4_PRESET_RESEARCH_JSON_END');
  if(!report.allRuntimeClean)process.exitCode=1;
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
