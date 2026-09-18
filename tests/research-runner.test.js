const assert=require('assert');
const fs=require('fs');
const Runner=require('../scripts/research-runner.js');
const ME=require('../src/model-engine.js');

function synthetic(n=420){
  const data=[];
  for(let i=0;i<n;i++){
    const c=100+0.03*i+7*Math.sin(i/10)+2.5*Math.sin(i/3.2);
    const o=c+Math.sin(i/4);
    data.push({t:1609459200+i*86400,o,h:Math.max(o,c)+1.4,l:Math.min(o,c)-1.4,c,v:1000+i});
  }
  return data;
}

(async()=>{
  const data=synthetic();
  const enabled={support:true,macro:true,sweep:true,basin:true,field:true,echo:true,astro:false};

  const direct=ME.run(data,{market:'TEST',timeframe:'1d',source:'fixture',enabled});
  const viaRunner=Runner.runResearch(data,{market:'TEST',timeframe:'1d',source:'fixture',enabled,parameterSet:'baseline'});

  assert.equal(viaRunner.modelVersion,direct.engineVersion);
  assert.equal(viaRunner.kernelVersion,direct.kernelVersion);
  assert.equal(viaRunner.parameterFingerprint,direct.parameterFingerprint);
  assert.deepEqual(viaRunner.evidence,direct.evidenceLog,'Runner and Lab engine must emit identical Evidence');
  assert.deepEqual(viaRunner.evaluation,direct.evaluation,'Runner and Lab engine must share Evaluation output');

  const batch=await Runner.runBatch({
    markets:['TEST'],
    timeframes:['1d','1w'],
    enabled,
    paramSets:[
      {name:'base'},
      {name:'echo-tight',exp:{echo:{similarity:.90}}}
    ],
    dataLoader:async(market,timeframe)=>({data,source:'fixture '+timeframe})
  });
  assert.equal(batch.runCount,4);
  assert.equal(batch.runs[0].modelVersion,ME.VERSION);
  assert.notEqual(
    batch.runs.find(x=>x.parameterSet==='base').parameterFingerprint,
    batch.runs.find(x=>x.parameterSet==='echo-tight').parameterFingerprint,
    'parameter sets require distinct fingerprints'
  );

  const newer=JSON.parse(JSON.stringify(batch));
  newer.engineVersion='future-test';
  newer.runs[0].summary.support.states.potential.count+=1;
  const cmp=Runner.compareDatasets(batch,newer);
  assert(cmp.pairs.length>=1);
  assert(cmp.pairs[0].left.modelVersion);
  assert(cmp.pairs[0].right.modelVersion);

  const source=fs.readFileSync('scripts/research-runner.js','utf8');
  assert(source.includes("require('../src/model-engine.js')"));
  assert(source.includes('ME.run(data,{'));
  for(const forbidden of ['function basinCandidate(','function fieldBestCandidate(','function astroPos(','function zoneCalc(']){
    assert(!source.includes(forbidden),'Runner must not duplicate model implementation: '+forbidden);
  }

  console.log('research-runner.test.js: OK');
})().catch(e=>{console.error(e);process.exit(1)});
