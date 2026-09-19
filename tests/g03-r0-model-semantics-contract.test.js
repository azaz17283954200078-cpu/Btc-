const fs=require('fs');
const assert=require('assert');
const RK=require('../src/research-kernel.js');
const MS=require('../src/model-semantics.js');
const CE=require('../src/condition-engine.js');

assert.equal(MS.VERSION,'1.0.0');
assert.deepEqual(MS.list().map(x=>x.model),['support','macro','sweep','basin','field','echo','astro']);
assert.equal(MS.validate().ok,true,MS.validate().errors.join(', '));

const expectedTypes={
  support:'lifecycle',
  macro:'lifecycle',
  sweep:'event',
  basin:'lifecycle',
  field:'lifecycle',
  echo:'analogy',
  astro:'external_time'
};
for(const [model,type] of Object.entries(expectedTypes)){
  const x=MS.get(model);
  assert(x,'missing semantics for '+model);
  assert.equal(x.researchType,type,'wrong research type for '+model);
  assert.equal(x.directionalClaim,false,model+' must not gain a directional claim');
  assert(x.primaryQuestion&&x.claim,model+' must explain question and claim');
}

// Research Kernel normalized states and the registry must agree on lifecycle terminal meaning.
assert.equal(RK.normalizeState('macro','confirmed'),'active');
assert.equal(RK.normalizeState('macro','failed'),'broken');
assert.equal(RK.normalizeState('macro','expired'),'broken');
assert(MS.get('macro').states.includes('active'));
assert(MS.get('macro').states.includes('broken'));

assert.deepEqual(MS.get('support').terminalStates,['broken']);
assert.deepEqual(MS.get('macro').terminalStates,['broken']);
assert.deepEqual(MS.get('basin').terminalStates,['exit']);
assert.deepEqual(MS.get('field').terminalStates,['broken']);

for(const model of ['support','macro','basin','field']){
  const rules=RK.LIFECYCLE_RULES[model];
  assert(rules,'kernel lifecycle rules missing '+model);
  const x=MS.get(model);
  for(const state of rules.terminal)assert(x.terminalStates.includes(state),'registry terminal mismatch '+model+':'+state);
}

// Condition Engine must consume the shared registry without changing protected R02 semantics.
assert.equal(CE.SEMANTICS_VERSION,MS.VERSION);
assert.equal(CE.semantics({model:'support',state:'candidate'}),'state');
assert.equal(CE.semantics({model:'support',state:'broken'}),'transition_event');
assert.equal(CE.semantics({model:'macro',state:'confirmed'}),'state');
assert.equal(CE.semantics({model:'macro',state:'failed'}),'transition_event');
assert.equal(CE.semantics({model:'basin',state:'exit'}),'transition_event');
assert.equal(CE.semantics({model:'field',state:'broken'}),'transition_event');
assert.equal(CE.semantics({model:'sweep',state:'event'}),'event');
assert.equal(CE.semantics({model:'echo',state:'strong'}),'observation');
assert.equal(CE.semantics({model:'astro',state:'event'}),'event');

assert.deepEqual(MS.allowedRelations('support'),['time','price_overlap']);
assert.deepEqual(MS.allowedRelations('macro'),['time','price_overlap']);
assert.deepEqual(MS.allowedRelations('basin'),['time','price_overlap']);
assert.deepEqual(MS.allowedRelations('sweep'),['time','price_touch']);
assert.deepEqual(MS.allowedRelations('field'),['time']);
assert.deepEqual(MS.allowedRelations('echo'),['time']);
assert.deepEqual(MS.allowedRelations('astro'),['time']);

// Strategy capability is deliberately constrained before the later Strategy Adapter iteration.
assert.deepEqual(MS.strategyRoles('support').entry,['validated']);
assert.deepEqual(MS.strategyRoles('macro').entry,['active']);
assert.deepEqual(MS.strategyRoles('sweep').entry,['event']);
assert.deepEqual(MS.strategyRoles('basin').entry,['active']);
assert.deepEqual(MS.strategyRoles('field').entry,['active']);
assert.deepEqual(MS.strategyRoles('echo').entry,[]);
assert.deepEqual(MS.strategyRoles('astro').entry,[]);
assert.deepEqual(MS.strategyRoles('echo').filter,['strong']);
assert.deepEqual(MS.strategyRoles('astro').filter,['event']);
assert(!MS.strategyRoles('astro').filter.includes('upcoming'),'future Astrology projection cannot become a historical strategy filter');

// Existing standardized price-geometry boundary remains unchanged.
assert.equal(MS.get('support').standardPriceGeometry,'zone');
assert.equal(MS.get('macro').standardPriceGeometry,'zone');
assert.equal(MS.get('basin').standardPriceGeometry,'zone');
assert.equal(MS.get('sweep').standardPriceGeometry,'event_range');
assert.equal(MS.get('field').standardPriceGeometry,null);

// Browser loads the registry before Condition Engine and exposes it as a shared module.
const html=fs.readFileSync('index.html','utf8');
const semPos=html.indexOf('src/model-semantics.js');
const cePos=html.indexOf('src/condition-engine.js');
assert(semPos>=0&&cePos>semPos,'Model Semantics must load before Condition Engine');
assert(html.includes('window.__SL_MODEL_SEMANTICS__=MS'),'browser semantics registry exposure missing');
assert(html.includes('function modelSemanticsHeaderHTML('),'single-model semantics explanation missing');
for(const phrase of ['研究型態','模型主張','模型本身沒有方向性主張']){
  assert(html.includes(phrase),'semantic education copy missing: '+phrase);
}

const a=html.lastIndexOf('<script>'),b=html.lastIndexOf('</script>');
new Function(html.slice(a+8,b));

console.log('g03-r0-model-semantics-contract.test.js: OK');
