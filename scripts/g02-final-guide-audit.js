#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert');
const Runner=require('./research-runner.js');

const fixtures=[
  {market:'IXIC',file:'tests/fixtures/nasdaq_1d_fixed.csv'},
  {market:'TWII',file:'tests/fixtures/taiex_1d_fixed.csv'}
];
const enabled={support:true,macro:true,sweep:true,basin:true,field:true,echo:true,astro:true};

let sawFailure=false,sawIncomplete=false,sawSmall=false,sawEchoTrace=false;
for(const f of fixtures){
  const data=Runner.parseCSV(fs.readFileSync(f.file,'utf8'));
  const run=Runner.runResearch(data,{market:f.market,timeframe:'1d',source:'g02-final-guide-audit',enabled});
  assert.deepEqual(run.evidenceErrors,[],f.market+' Evidence errors');

  for(const [model,m] of Object.entries(run.evaluation.models||{})){
    for(const [state,st] of Object.entries(m.states||{})){
      for(const [h,x] of Object.entries(st.horizons||{})){
        assert.equal(x.n+x.incomplete,st.count,f.market+' '+model+' '+state+' h'+h+' sample accounting');
        if(x.incomplete>0)sawIncomplete=true;
        if(x.n>0&&x.n<5)sawSmall=true;
      }
    }
  }

  if(run.evidence.some(e=>['broken'].includes(e.state)))sawFailure=true;

  const projections=run.evidence.filter(e=>e.model==='astro'&&e.kind==='projection');
  for(const p of projections){
    const st=run.evaluation.models&&run.evaluation.models.astro&&run.evaluation.models.astro.states;
    assert(!st||!st.upcoming,'Astrology projection leaked into historical Evaluation');
    for(const ev of (p.projection&&p.projection.events)||[])assert(ev.t>data[data.length-1].t,'Astrology projection not after data cutoff');
  }

  for(const e of run.evidence.filter(e=>e.model==='echo'&&e.kind==='observation')){
    const bm=e.evidence&&e.evidence.bestMatch;
    if(!bm)continue;
    sawEchoTrace=true;
    assert(Number.isInteger(bm.start)&&Number.isInteger(bm.end),'Echo best-match indices missing');
    assert(bm.end<e.evidenceStart,'Echo historical match overlaps current pattern');
    assert(bm.parts&&['o','c','h','l'].every(k=>Number.isFinite(bm.parts[k])),'Echo comparison parts missing');
  }

  console.log('G02_FINAL_FIXTURE '+JSON.stringify({
    market:f.market,
    evidence:run.evidence.length,
    models:Object.fromEntries(Object.entries(run.evaluation.models||{}).map(([k,v])=>[k,v.count]))
  }));
}

// Explicit no-event/no-bottom scenario: stable candles should not fabricate Sweep or Macro evidence.
const flat=[];
for(let i=0;i<260;i++)flat.push({t:1609459200+i*86400,o:100,h:101,l:99,c:100,v:1000});
const none=Runner.runResearch(flat,{
  market:'FLAT',timeframe:'1d',source:'g02-no-event-fixture',
  enabled:{support:false,macro:true,sweep:true,basin:false,field:false,echo:false,astro:false}
});
assert.equal((none.evidence||[]).filter(e=>e.model==='sweep').length,0,'flat series fabricated Liquidity Sweep');
assert.equal((none.evidence||[]).filter(e=>e.model==='macro').length,0,'flat series fabricated Macro Bottom');

assert(sawFailure,'final fixtures did not exercise any failure state');
assert(sawIncomplete,'final fixtures did not exercise incomplete future observations');
assert(sawSmall,'final fixtures did not exercise a small completed sample');
assert(sawEchoTrace,'final fixtures did not exercise enriched Echo trace');

console.log('G02_FINAL_SCENARIOS '+JSON.stringify({failure:sawFailure,incomplete:sawIncomplete,smallSample:sawSmall,echoTrace:sawEchoTrace,noEvent:true}));
console.log('g02-final-guide-audit.js: OK');
