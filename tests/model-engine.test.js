const assert=require('assert');
const RK=require('../src/research-kernel.js');
const ME=require('../src/model-engine.js');

assert.equal(ME.VERSION,'1.0.0');
assert(ME.DEFAULT_EXP.echo&&ME.DEFAULT_MACRO.p['1d']);

const data=[];
for(let i=0;i<520;i++){
  const trend=120-0.025*i;
  const wave=8*Math.sin(i/11)+3*Math.sin(i/3.7);
  const c=Math.max(10,trend+wave);
  const o=c+1.2*Math.sin(i/2.9);
  data.push({
    t:1609459200+i*86400,
    o,h:Math.max(o,c)+1.8,l:Math.min(o,c)-1.8,c,
    v:1000+80*Math.sin(i/7)
  });
}

const options={
  market:'TEST',timeframe:'1d',source:'synthetic',
  enabled:{support:true,macro:true,sweep:true,basin:true,field:true,echo:true,astro:true}
};
const a=ME.run(data,options);
const b=ME.run(data,options);

assert.equal(a.engineVersion,'1.0.0');
assert.equal(a.kernelVersion,'1.3.0');
assert.equal(a.rows.length,data.length);
assert.equal(a.parameterFingerprint,b.parameterFingerprint);
assert.deepEqual(a.evidenceLog,b.evidenceLog,'shared engine must be deterministic');
assert.deepEqual(a.evaluation,b.evaluation,'evaluation must be deterministic');
assert(a.evaluation&&a.evaluation.horizons.join(',')==='3,5,10,20');
assert(Array.isArray(a.evidenceErrors));
for(const e of a.evidenceLog){
  const v=RK.validateEvidence(e);
  assert(v.ok,'engine emitted invalid evidence: '+JSON.stringify(v.errors));
}

console.log('model-engine.test.js: OK');
