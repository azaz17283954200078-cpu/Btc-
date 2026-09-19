const assert=require('assert');
const RR=require('../src/research-run.js');

const data=Array.from({length:30},(_,i)=>({t:1700000000+i*86400,o:100,h:102,l:99,c:101,v:1}));
const result={
  engineVersion:'x',
  kernelVersion:'k',
  parameterFingerprint:'fnv1a-test',
  evidenceLog:[{id:'a'},{id:'b'}],
  evidenceErrors:[]
};
const spec={
  market:'BTC',timeframe:'1d',source:'fixture',
  models:['support'],preset:'balanced',
  parameterSnapshot:{zone:{pivot:5}},
  conditionEngineVersion:'1.3.0',semanticsVersion:'1.0.0',reliabilityStandardVersion:'1.0.0',
  startedAt:'2026-09-19T10:00:00.000Z'
};
const a=RR.createCompleted(data,result,spec);
const b=RR.createCompleted(data,result,spec);

assert.equal(RR.VERSION,'1.0.0');
assert(a.runId!==b.runId,'rerunning the same frozen inputs must create a new Run ID');
assert.equal(a.locked,true);
assert.equal(a.status,'completed');
assert.equal(a.market,'BTC');
assert.equal(a.timeframe,'1d');
assert.equal(a.dataRange.bars,30);
assert.equal(a.knownThrough,29);
assert.equal(a.evidenceCount,2);
assert.equal(a.evidenceErrors,0);
assert.equal(a.parameterFingerprint,'fnv1a-test');
assert.deepEqual(a.parameterSnapshot,{zone:{pivot:5}});
assert(Object.isFrozen(a),'manifest must be immutable');
assert(Object.isFrozen(a.parameterSnapshot),'nested manifest state must be immutable');
assert.deepEqual(a.phases.map(x=>x.status),['completed','completed','completed','completed']);
for(const p of RR.PHASES){
  assert(p.education&&p.education.length>20,'each phase must teach why the phase exists');
}
assert(RR.explain(a).some(x=>x.education.includes('未來')||x.education.includes('當時')),'no-lookahead education missing');

console.log('g03-r1-runner-observatory-contract.test.js: OK');
