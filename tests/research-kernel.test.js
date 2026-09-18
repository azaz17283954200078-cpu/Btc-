const assert=require('assert');
const RK=require('../src/research-kernel.js');

assert.equal(RK.VERSION,'1.0.0');

const e=RK.makeEvidence({
  model:'field',
  family:'structure',
  index:12,
  timestamp:123456,
  state:'invalidated',
  confidence:87,
  detectedAt:9,
  evidence:{top:110,bot:90},
  invalidation:{kind:'body_break'},
  meta:{market:'BTC',timeframe:'1d'}
});
assert.equal(e.state,'broken');
assert.equal(e.confidence,87);
assert.equal(e.detectedAt,9);
assert.deepEqual(RK.validateEvidence(e),{ok:true,errors:[]});

const clamped=RK.makeEvidence({model:'echo',index:1,state:'strong',confidence:140});
assert.equal(clamped.confidence,100);

const data=[];
for(let i=0;i<10;i++)data.push({c:100+i*2,h:101+i*2,l:99+i*2});
const o=RK.forwardOutcome(data,2,3);
assert.equal(o.futureEnd,5);
assert(Math.abs(o.return-(110/104-1))<1e-12);
assert(Math.abs(o.mfe-(111/104-1))<1e-12);
assert(Math.abs(o.mae-(105/104-1))<1e-12);
assert.equal(RK.forwardOutcome(data,8,3),null);

const e1=RK.makeEvidence({model:'support',index:1,state:'potential'});
const e2=RK.makeEvidence({model:'support',index:3,state:'candidate'});
const e3=RK.makeEvidence({model:'echo',index:2,state:'weak',confidence:61});
const latest=RK.latestByModel([e1,e2,e3]);
assert.equal(latest.support.index,3);
assert.equal(latest.echo.index,2);

const ev=RK.evaluateEvidence(data,[e1,e2,e3],2);
assert.equal(ev.horizon,2);
assert(ev.summary);
assert.equal(ev.summary.n,3);
assert(ev.summary.upRate>=0&&ev.summary.upRate<=1);

console.log('research-kernel.test.js: OK');
