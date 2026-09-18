const assert=require('assert');
const RK=require('../src/research-kernel.js');

assert.equal(RK.VERSION,'1.3.0');

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

// M3 unified Evaluation Layer.
const evalData=[];
for(let i=0;i<30;i++)evalData.push({c:100+i,h:101+i,l:99+i});

const history=[
  RK.makeEvidence({id:'sp1-p',model:'support',kind:'transition',entityId:'sp1',index:1,state:'potential',detectedAt:1,evidenceStart:1}),
  RK.makeEvidence({id:'sp2-p',model:'support',kind:'transition',entityId:'sp2',index:2,state:'potential',detectedAt:2,evidenceStart:2}),
  RK.makeEvidence({id:'sp1-c',model:'support',kind:'transition',entityId:'sp1',index:3,state:'candidate',detectedAt:3,evidenceStart:1}),
  RK.makeEvidence({id:'sp2-b',model:'support',kind:'transition',entityId:'sp2',index:4,state:'broken',detectedAt:4,evidenceStart:2}),
  RK.makeEvidence({id:'sp1-v',model:'support',kind:'transition',entityId:'sp1',index:5,state:'validated',detectedAt:5,evidenceStart:1}),
  RK.makeEvidence({id:'mc1-c',model:'macro',kind:'transition',entityId:'mc1',index:6,state:'candidate',detectedAt:6,evidenceStart:6}),
  RK.makeEvidence({id:'mc1-a',model:'macro',kind:'transition',entityId:'mc1',index:8,state:'confirmed',detectedAt:8,evidenceStart:6}),
  RK.makeEvidence({id:'sp1-b',model:'support',kind:'transition',entityId:'sp1',index:9,state:'broken',detectedAt:9,evidenceStart:1}),
  RK.makeEvidence({id:'echo10',model:'echo',kind:'observation',entityId:'echo10',index:10,state:'strong',detectedAt:10,evidenceStart:4}),
  RK.makeEvidence({id:'astro20',model:'astro',kind:'projection',entityId:'astro20',index:20,state:'upcoming',detectedAt:20,evidenceStart:20})
];

const life=RK.evaluateLifecycle(history);
assert.equal(life.totalEntities,3);
assert.equal(life.models.support.entities,2);
assert.equal(life.models.support.resolvedEntities,2);
assert.equal(life.models.support.medianResolvedLifetimeBars,5);
assert.equal(life.models.support.states.potential.progressionRate,.5);
assert.equal(life.models.support.states.potential.failureRate,.5);
assert.equal(life.models.support.states.candidate.progressionRate,1);
assert.equal(life.models.macro.states.candidate.progressionRate,1);
assert.equal(life.models.macro.openEntities,1);
assert.equal(life.models.support.transitions['potential→candidate'].n,1);
assert.equal(life.models.support.transitions['candidate→validated'].medianBars,2);

const fullEval=RK.evaluateTimeline(evalData,history,{horizons:[3,5,10,20],knownThrough:15});
assert.deepEqual(fullEval.horizons,[3,5,10,20]);
assert.equal(fullEval.totalEvidence,10);
assert.equal(fullEval.evaluatedEvidence,9,'projection must be excluded from default market outcome evaluation');
assert.equal(fullEval.excludedEvidence,1);
assert.equal(fullEval.models.support.states.potential.count,2);
assert.equal(fullEval.models.support.states.potential.horizons[3].n,2);
assert.equal(fullEval.models.echo.states.strong.horizons[5].n,1);
assert.equal(fullEval.models.echo.states.strong.horizons[10].n,0);
assert.equal(fullEval.models.echo.states.strong.horizons[10].incomplete,1);
assert(fullEval.models.support.states.candidate.horizons[3].medianReturn>0);
assert.equal(fullEval.lifecycle.models.support.states.potential.progressionRate,.5);

const filtered=RK.filterTimeline(history,{model:'support',state:'candidate'});
assert.equal(filtered.length,1);
const supportCandidate=RK.evaluateHorizonSet(evalData,filtered,[3,5],15);
assert.equal(supportCandidate[3].n,1);
assert.equal(supportCandidate[5].n,1);

console.log('research-kernel.test.js: OK');
