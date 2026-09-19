#!/usr/bin/env node
'use strict';
const assert=require('assert');
const Runner=require('./research-runner.js');
const CE=require('../src/condition-engine.js');

const CONTEXTS=[
  {market:'BTC',timeframe:'1d',bars:1200},
  {market:'IXIC',timeframe:'1d',bars:1200},
  {market:'TWII',timeframe:'1d',bars:1200}
];
const enabled={support:true,macro:true,sweep:true,basin:true,field:true,echo:true,astro:true};

(async()=>{
  const report=[];
  for(const ctx of CONTEXTS){
    const loaded=await Runner.loadMarketData(ctx.market,ctx.timeframe),
          data=loaded.data.slice(-ctx.bars),
          run=Runner.runResearch(data,{market:ctx.market,timeframe:ctx.timeframe,source:loaded.source,enabled}),
          preferred=[{model:'support',state:'candidate'},{model:'field',state:'active'},{model:'echo',state:'strong'}];
    let anchor=preferred.find(c=>CE.episodesForConditions(run.evidence,[c],{knownThrough:data.length-1}).length>0);
    if(!anchor){
      const all=CE.candidateConditions(run.evidence);
      anchor=all.find(c=>CE.episodesForConditions(run.evidence,[c],{knownThrough:data.length-1}).length>0);
    }
    assert(anchor,ctx.market+' has no M5 anchor condition');
    const companions=CE.discoverCompanions(run.evidence,[anchor],{knownThrough:data.length-1,maxResults:8,minEpisodes:1});
    assert(companions.length,ctx.market+' has no overlapping companion Evidence');
    const pair=[anchor,companions[0].condition],
          result=CE.evaluateConditions(data,run.evidence,pair,{knownThrough:data.length-1});
    for(const h of result.horizons)assert.equal(result.stats[h].n+result.stats[h].incomplete,result.episodeCount);

    const checkpoint=Math.floor(data.length*.72),
          prefixEvidence=run.evidence.filter(e=>e.index<=checkpoint),
          fullEpisodes=CE.episodesForConditions(run.evidence,pair,{knownThrough:checkpoint}),
          prefixEpisodes=CE.episodesForConditions(prefixEvidence,pair,{knownThrough:checkpoint});
    assert.deepStrictEqual(prefixEpisodes,fullEpisodes,ctx.market+' condition history changed when future Evidence was present');

    report.push({
      market:ctx.market,timeframe:ctx.timeframe,
      anchor,companion:companions[0].condition,
      episodes:result.episodeCount,gate:result.gate.level,
      baselineEpisodes:result.baseline.episodeCount
    });
  }
  console.log('M5_CONDITION_AUDIT '+JSON.stringify(report));
  console.log('m5-condition-audit.js: OK');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
