const assert=require('assert');
const RK=require('../src/research-kernel.js');
const REL=require('../src/reliability-engine.js');

const data=Array.from({length:160},(_,i)=>{
  const c=100+i*.2;
  return{t:Date.UTC(2024,0,1)/1000+i*86400,o:c-.2,h:c+1,l:c-1,c,v:1000};
});
function ev(i){
  return RK.makeEvidence({
    id:'sweep:'+i,entityId:'sweep:'+i,model:'sweep',family:'event',kind:'event',
    index:i,detectedAt:i,evidenceStart:i,timestamp:data[i].t,state:'event',evidence:{priorLow:99,low:98,close:100}
  })
}
const evidence=[10,12,14,40,42,70,90,120,135,145].map(ev);
const x=REL.evaluateModelState(data,evidence,{
  model:'sweep',state:'event',horizon:10,market:'BTC',parameterStability:true
});

assert.equal(REL.VERSION,'1.0.0');
assert.equal(x.counts.total,10);
assert.equal(x.counts.complete,10);
assert(x.counts.nEff<10,'overlapping observation windows must reduce effective N');
assert(x.counts.nEff<=x.counts.complete);
assert.equal(x.independence.method,'overlap_cluster');
assert.equal(x.integrity.pass,true);
assert.equal(x.split.splitIndex,112);
assert(x.oos.validation.total>0,'chronological OOS must use the later part of the series');
assert(x.disclaimer.includes('不是模型準確率'));

const dense=Array.from({length:60},(_,k)=>ev(10+k*2)).filter(e=>e.index<150);
const y=REL.evaluateModelState(data,dense,{model:'sweep',state:'event',horizon:10,market:'BTC',parameterStability:true});
assert(y.weaknesses.includes('OVERLAP_HEAVY'),'heavy overlapping evidence must be diagnosed');

const broken=data.slice();
broken[30]={...broken[30],t:broken[29].t};
const bad=REL.dataIntegrity(broken,{market:'BTC'});
assert.equal(bad.pass,false);
assert(bad.errors.includes('DUPLICATE_TIMESTAMP'));

assert.deepEqual(REL.sampleBand(4).label,'個案級');
assert.deepEqual(REL.sampleBand(5).label,'探索');
assert.deepEqual(REL.sampleBand(20).label,'初步可比較');
assert.deepEqual(REL.sampleBand(50).label,'較充足');
assert.deepEqual(REL.sampleBand(100).label,'大量案例');

const plan=REL.splitPlan(data,.7);
assert(plan.calibrationEnd<plan.validationStart,'OOS split must preserve time order');

console.log('g03-r2-reliability-engine.test.js: OK');
