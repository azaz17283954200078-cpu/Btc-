const assert=require('assert');
const RK=require('../src/research-kernel.js');

assert.equal(RK.VERSION,'1.2.0');

const e=RK.makeEvidence({
  model:'field',
  family:'structure',
  kind:'transition',
  entityId:'field:9',
  index:12,
  timestamp:123456,
  state:'invalidated',
  confidence:87,
  detectedAt:9,
  evidenceStart:4,
  evidence:{top:110,bot:90},
  invalidation:{kind:'body_break'},
  meta:{market:'BTC',timeframe:'1d'}
});
assert.equal(e.state,'broken');
assert.equal(e.kind,'transition');
assert.equal(e.entityId,'field:9');
assert.equal(e.confidence,87);
assert.equal(e.detectedAt,9);
assert.equal(e.evidenceStart,4);
assert.deepEqual(RK.validateEvidence(e),{ok:true,errors:[]});

const futureDetected=RK.makeEvidence({model:'support',index:5,state:'candidate',detectedAt:6,evidenceStart:2});
assert(RK.validateEvidence(futureDetected).errors.includes('detectedAt_after_index'));
const reversedOrigin=RK.makeEvidence({model:'support',index:8,state:'candidate',detectedAt:5,evidenceStart:6});
assert(RK.validateEvidence(reversedOrigin).errors.includes('evidenceStart_after_detectedAt'));

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
assert.equal(RK.forwardOutcome(data,2,3,4),null,'as-of evaluation must not see past knownThrough');
const asOf=RK.forwardOutcome(data,2,3,5);
assert(asOf&&asOf.futureEnd===5,'outcome is available exactly when the horizon has completed');

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

const timeline=[
  RK.makeEvidence({id:'b',model:'echo',kind:'observation',entityId:'echo:3',index:3,state:'weak',detectedAt:3,evidenceStart:1}),
  RK.makeEvidence({id:'a',model:'support',kind:'transition',entityId:'support:1',index:1,state:'potential',detectedAt:1,evidenceStart:1}),
  RK.makeEvidence({id:'c',model:'support',kind:'transition',entityId:'support:1',index:4,state:'candidate',detectedAt:4,evidenceStart:1})
];
const sorted=RK.sortTimeline(timeline);
assert.deepEqual(sorted.map(x=>x.id),['a','b','c']);
const byModel=RK.timelineByModel(timeline);
assert.equal(byModel.support.length,2);
assert.equal(byModel.echo.length,1);
const summary=RK.timelineSummary(timeline);
assert.equal(summary.total,3);
assert.equal(summary.models.support.states.potential,1);
assert.equal(summary.models.support.kinds.transition,2);

console.log('research-kernel.test.js: OK');
