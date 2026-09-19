const fs=require('fs');
const assert=require('assert');
const Runner=require('../scripts/research-runner.js');
const CE=require('../src/condition-engine.js');

const data=Runner.parseCSV(fs.readFileSync('tests/fixtures/taiex_1d_fixed.csv','utf8')).slice(-1000);
const enabled={support:true,macro:true,sweep:true,basin:true,field:true,echo:true,astro:false};
const queries=[{
  name:'support candidate + field active',
  conditions:[{model:'support',state:'candidate'},{model:'field',state:'active'}],
  horizons:[3,5,10,20]
}];

const run=Runner.runResearch(data,{
  market:'TWII',timeframe:'1d',source:'M5 test',enabled,conditionQueries:queries
});
assert.equal(run.conditionEngineVersion,CE.VERSION);
assert.equal(run.conditional.length,1);
assert.equal(run.conditional[0].name,queries[0].name);
const x=run.conditional[0].result;
assert.deepEqual(x.conditions.map(c=>[c.model,c.state]),[['support','candidate'],['field','active']]);
assert(x.baseline.episodeCount>=x.episodeCount);
assert(['insufficient','exploratory','comparable'].includes(x.gate.level));
for(const h of [3,5,10,20]){
  assert(x.stats[h]);
  assert.equal(x.stats[h].n+x.stats[h].incomplete,x.episodeCount);
}
const direct=CE.evaluateConditions(data,run.evidence,queries[0].conditions,{horizons:[3,5,10,20],knownThrough:data.length-1});
assert.deepStrictEqual(x,direct,'Runner must use the exact shared Condition Engine result');

console.log('m5-runner.test.js: OK');
