#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert');
const Runner=require('./research-runner.js');

const fixtures=[
  {name:'nasdaq',market:'IXIC',file:'tests/fixtures/nasdaq_1d_fixed.csv'},
  {name:'taiex',market:'TWII',file:'tests/fixtures/taiex_1d_fixed.csv'}
];

function macroInventory(evidence){
  const entities=new Map();
  for(const e of evidence.filter(x=>x.model==='macro'&&x.kind==='transition')){
    const key=e.entityId||e.id;
    if(!entities.has(key))entities.set(key,[]);
    entities.get(key).push(e);
  }
  let candidates=0,confirmed=0,failedBeforeConfirm=0,unresolved=0;
  for(const seq0 of entities.values()){
    const seq=seq0.slice().sort((a,b)=>(a.index??0)-(b.index??0));
    const cand=seq.find(e=>e.state==='candidate');
    if(!cand)continue;
    candidates++;
    const active=seq.find(e=>e.state==='active'&&(e.index??0)>=(cand.index??0));
    const broken=seq.find(e=>e.state==='broken'&&(e.index??0)>=(cand.index??0));
    if(active)confirmed++;
    else if(broken)failedBeforeConfirm++;
    else unresolved++;
  }
  return{candidates,confirmed,failedBeforeConfirm,unresolved};
}

for(const f of fixtures){
  const data=Runner.parseCSV(fs.readFileSync(f.file,'utf8'));
  const run=Runner.runResearch(data,{
    market:f.market,timeframe:'1d',source:'fixed-research-safety-fixture',
    enabled:{support:false,macro:true,sweep:false,basin:false,field:false,echo:false,astro:true}
  });
  assert.deepEqual(run.evidenceErrors,[],f.name+' emitted Evidence errors');

  const macro=macroInventory(run.evidence);
  assert.equal(macro.candidates,macro.confirmed+macro.failedBeforeConfirm+macro.unresolved,
    f.name+' Macro candidate lifecycle accounting is not exhaustive');

  const active=run.evaluation&&run.evaluation.models&&run.evaluation.models.macro&&
    run.evaluation.models.macro.states&&run.evaluation.models.macro.states.active;
  if(active){
    for(const [h,x] of Object.entries(active.horizons||{})){
      assert.equal(x.n+x.incomplete,active.count,f.name+' Macro confirmed horizon '+h+' count mismatch');
    }
  }

  const astroEvents=run.evidence.filter(e=>e.model==='astro'&&e.kind==='event');
  for(const e of astroEvents){
    assert.equal(e.state,'event',f.name+' historical Astro event must normalize to event');
    assert(Number(e.evidence&&e.evidence.eventCount)>=1,f.name+' Astro eventCount missing');
  }

  const projections=run.evidence.filter(e=>e.model==='astro'&&e.kind==='projection');
  const cutoff=data[data.length-1].t;
  for(const e of projections){
    assert.equal(e.state,'upcoming',f.name+' Astro projection must normalize to upcoming');
    const events=e.projection&&e.projection.events||[];
    for(const x of events)assert(x.t>cutoff,f.name+' projected event is not after data cutoff');
  }

  const evalAstro=run.evaluation&&run.evaluation.models&&run.evaluation.models.astro;
  assert(!evalAstro||!evalAstro.states||!evalAstro.states.upcoming,
    f.name+' Astro upcoming projection leaked into historical evaluation');

  console.log('G02_R2_SAFETY '+JSON.stringify({
    market:f.market,
    macro,
    macroConfirmed10:active&&active.horizons&&active.horizons[10]||null,
    astroEventBars:astroEvents.length,
    astroProjectionRecords:projections.length
  }));
}

console.log('g02-r2-research-safety-audit.js: OK');
