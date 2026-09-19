const assert=require('assert');
const RK=require('../src/research-kernel.js');
const CE=require('../src/condition-engine.js');

function e(model,state,index,kind='transition',entityId=null,evidence={}){
  return RK.makeEvidence({
    id:[model,state,index,kind].join(':'),entityId:entityId||model+':1',
    model,state,index,detectedAt:index,evidenceStart:index,kind,timestamp:1700000000+index*86400,evidence
  });
}
const evidence=[
  e('support','candidate',2,'transition','support:a'),
  e('field','forming',3,'transition','field:a'),
  e('field','active',5,'transition','field:a'),
  e('sweep','event',6,'event','sweep:6'),
  e('support','validated',8,'transition','support:a'),
  e('echo','strong',6,'observation','echo:6'),
  e('echo','weak',7,'observation','echo:7'),
  e('field','broken',10,'transition','field:a'),
  e('support','broken',12,'transition','support:a')
];

assert.equal(CE.VERSION,'1.3.0');
assert.equal(CE.SEMANTICS_VERSION,'1.0.0');
assert.equal(CE.semantics({model:'support',state:'candidate'}),'state');
assert.equal(CE.semantics({model:'support',state:'broken'}),'transition_event');
assert.equal(CE.semantics({model:'sweep',state:'event'}),'event');
assert.equal(CE.semantics({model:'echo',state:'strong'}),'observation');

const support=CE.buildPresence(evidence,{model:'support',state:'candidate'},{knownThrough:14}).present;
assert.deepEqual(support.map((x,i)=>x?i:null).filter(x=>x!=null),[2,3,4,5,6,7]);

const sweep3=CE.buildPresence(evidence,{model:'sweep',state:'event',windowBars:3},{knownThrough:14}).present;
assert.deepEqual(sweep3.map((x,i)=>x?i:null).filter(x=>x!=null),[6,7,8,9]);

const combo=CE.episodesForConditions(evidence,[
  {model:'support',state:'candidate'},
  {model:'field',state:'active'}
],{knownThrough:14});
assert.deepEqual(combo,[{index:5,end:7,length:3}]);

// Prefix equivalence: future transitions cannot create an earlier condition episode.
const prefix=evidence.filter(x=>x.index<=7);
assert.deepEqual(
  CE.episodesForConditions(prefix,[{model:'support',state:'candidate'},{model:'field',state:'active'}],{knownThrough:7}),
  CE.episodesForConditions(evidence,[{model:'support',state:'candidate'},{model:'field',state:'active'}],{knownThrough:7})
);

const data=Array.from({length:20},(_,i)=>({t:1700000000+i*86400,o:100+i,h:102+i,l:99+i,c:101+i,v:1}));
const result=CE.evaluateConditions(data,evidence,[
  {model:'support',state:'candidate'},
  {model:'field',state:'active'}
],{knownThrough:19,horizons:[3,5]});
assert.equal(result.episodeCount,1);
assert.equal(result.baseline.episodeCount,1);
assert.equal(result.stats[3].n,1);
assert.equal(result.gate.level,'insufficient');
assert(Number.isFinite(result.stats[3].returnP25));

assert.equal(CE.sampleGate(4).level,'insufficient');
assert.equal(CE.sampleGate(5).level,'exploratory');
assert.equal(CE.sampleGate(20).level,'comparable');

const funnelEvidence=[
  e('support','candidate',2,'transition','support:a'),
  e('support','validated',6,'transition','support:a'),
  e('support','candidate',10,'transition','support:b'),
  e('support','validated',14,'transition','support:b'),
  e('field','active',3,'transition','field:a'),
  e('field','broken',4,'transition','field:a'),
  e('field','active',12,'transition','field:b'),
  e('field','broken',13,'transition','field:b'),
  e('sweep','event',3,'event','sweep:3')
];
const funnel=CE.sampleFunnel(funnelEvidence,[
  {model:'support',state:'candidate'},
  {model:'field',state:'active'},
  {model:'sweep',state:'event'}
],{knownThrough:20});
assert.deepEqual(funnel.map(x=>x.episodeCount),[2,2,1]);
assert.deepEqual(funnel.map(x=>x.removed),[0,0,1]);
assert(funnel.every((x,i)=>i===0||x.episodeCount<=funnel[i-1].episodeCount),'sample funnel must be monotonic');

const companions=CE.discoverCompanions(evidence,{model:'support',state:'candidate'},{knownThrough:14,maxResults:10});
assert(companions.some(x=>x.condition.model==='field'&&x.condition.state==='active'));
assert(companions.some(x=>x.condition.model==='sweep'&&x.condition.state==='event'));

// 價格關係：第一個支撐案例與盆地有價格交集，第二個只有時間重疊、價格不重疊。
const relationEvidence=[
  e('support','candidate',2,'transition','support:r1',{bot:100,top:110}),
  e('support','validated',8,'transition','support:r1',{bot:100,top:110}),
  e('support','candidate',10,'transition','support:r2',{bot:200,top:210}),
  e('support','validated',16,'transition','support:r2',{bot:200,top:210}),
  e('basin','forming',3,'transition','basin:r1',{bot:104,top:108}),
  e('basin','active',7,'transition','basin:r1',{bot:104,top:108}),
  e('basin','forming',11,'transition','basin:r2',{bot:220,top:230}),
  e('basin','active',15,'transition','basin:r2',{bot:220,top:230}),
  e('sweep','event',5,'event','sweep:r1',{priorLow:106,low:102,close:109}),
  e('sweep','event',12,'event','sweep:r2',{priorLow:225,low:218,close:226})
];
const timeOnly=CE.episodesForConditions(relationEvidence,[
  {model:'support',state:'candidate'},
  {model:'basin',state:'forming'}
],{knownThrough:18});
assert.equal(timeOnly.length,2,'pure time overlap should keep both anchor episodes');

const priceOverlap=CE.episodesForConditions(relationEvidence,[
  {model:'support',state:'candidate'},
  {model:'basin',state:'forming',relation:'price_overlap'}
],{knownThrough:18});
assert.equal(priceOverlap.length,1,'price overlap should remove the spatially separate basin case');

const priceTouch=CE.episodesForConditions(relationEvidence,[
  {model:'support',state:'candidate'},
  {model:'basin',state:'forming',relation:'price_overlap'},
  {model:'sweep',state:'event',relation:'price_touch'}
],{knownThrough:18});
assert.equal(priceTouch.length,1,'sweep excursion should enter the shared structure region');

const snap=CE.relationSnapshotAtIndex(relationEvidence,[
  {model:'support',state:'candidate'},
  {model:'basin',state:'forming',relation:'price_overlap'},
  {model:'sweep',state:'event',relation:'price_touch'}
],5,{knownThrough:18});
assert.equal(snap.match,true);
assert.deepEqual([snap.region.low,snap.region.high],[104,108]);
assert.deepEqual([snap.lastOverlap.low,snap.lastOverlap.high],[104,106]);

assert.deepEqual(
  CE.availableRelations(relationEvidence,[{model:'support',state:'candidate'}],{model:'basin',state:'forming'},{knownThrough:18}),
  ['time','price_overlap']
);
assert.deepEqual(
  CE.availableRelations(relationEvidence,[{model:'support',state:'candidate'}],{model:'sweep',state:'event'},{knownThrough:18}),
  ['time','price_touch']
);
assert.equal(CE.suggestRelation(relationEvidence,[{model:'support',state:'candidate'}],{model:'basin',state:'forming'},{knownThrough:18}),'price_overlap');
assert.equal(CE.suggestRelation(relationEvidence,[{model:'support',state:'candidate'}],{model:'sweep',state:'event'},{knownThrough:18}),'price_touch');

const priceFunnel=CE.sampleFunnel(relationEvidence,[
  {model:'support',state:'candidate'},
  {model:'basin',state:'forming',relation:'price_overlap'},
  {model:'sweep',state:'event',relation:'price_touch'}
],{knownThrough:18});
assert.deepEqual(priceFunnel.map(x=>x.episodeCount),[2,1,1]);
assert(priceFunnel[1].example&&priceFunnel[1].example.match,'price funnel should expose a traceable example');
assert(priceFunnel.every((x,i)=>i===0||x.episodeCount<=priceFunnel[i-1].episodeCount),'price funnel must remain monotonic');

console.log('condition-engine.test.js: OK');
