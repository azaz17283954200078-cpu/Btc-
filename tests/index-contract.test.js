const fs=require('fs');
const assert=require('assert');

const s=fs.readFileSync('index.html','utf8');
const engine=fs.readFileSync('src/model-engine.js','utf8');

for(const id of ['c','modelCanvas','scriptCanvas']){
  assert(s.includes('id="'+id+'"'),'missing canvas '+id);
}
assert(s.includes('<script src="src/research-kernel.js"></script>'),'Research Kernel script not loaded');
assert(s.includes('<script src="src/model-engine.js"></script>'),'shared Model Engine script not loaded');
assert(s.includes('window.__SL_MODEL_ENGINE__'),'shared Model Engine export missing');
assert(s.includes('window.__SL_EVIDENCE__'),'normalized evidence export missing');
assert(s.includes('window.__SL_EVIDENCE_LOG__'),'M2 historical evidence log export missing');
assert(s.includes('window.__SL_EVALUATION__'),'M3 evaluation export missing');
assert(s.includes('ME.run(D,{'),'Strategy Lab UI must execute shared Model Engine');

const baseStart=s.indexOf('function drawBase(){');
const baseEnd=s.indexOf('function findHoveredEcho',baseStart);
assert(baseStart>=0&&baseEnd>baseStart,'drawBase block missing');
const core=s.slice(baseStart,baseEnd);
for(const forbidden of ['.zones','.macro','bottomSigs','researchSigs','researchZones','SIG','modelCanvas','scriptCanvas']){
  assert(!core.includes(forbidden),'Chart Core contaminated by '+forbidden);
}

for(const id of ['modBasin','modSpring','modEcho','modAstro']){
  const m=s.match(new RegExp('id="'+id+'"[^>]*>'));
  assert(m,'missing '+id);
  assert(!/\bchecked\b/.test(m[0]),id+' must default OFF');
}

// Model implementation and causal history now live in the shared engine, not index.html.
assert(engine.includes('forward:echoForwardStats(j,follow,i)'),'Echo historical backtest must be bounded by evaluation bar');
assert(!engine.includes('forward:echoForwardStats(j,follow)'),'unbounded Echo historical forward lookup found');
assert(engine.includes("z.validatedAt=i"),'Support validated transition timestamp missing');
assert(engine.includes("z.confirmedAt=i"),'Macro confirmed transition timestamp missing');
assert(engine.includes('evidenceStart:z.evidenceStart??z.detectedAt??i'),'Support/Macro evidence origin missing');

for(const token of [
  "model:'support'",
  "model:'macro'",
  "model:'sweep'",
  "model:'basin'",
  "model:'field'",
  "model:'echo'",
  "model:'astro'"
]){
  assert(engine.includes(token),'missing evidence adapter '+token);
}

assert(engine.includes('function rememberEvidence(input)'),'M2 evidence recorder missing');
assert(engine.includes('function finalizeEvidenceTimeline()'),'M2 timeline finalizer missing');
for(const token of [
  "id:'support:'+z.born+':potential:'+i",
  "id:'support:'+z.born+':validated:'+i",
  "id:'macro:'+z.born+':candidate:'+i",
  "id:'macro:'+z.born+':confirmed:'+i",
  "id:'sweep:'+i",
  "function recordBasinStage(",
  "function recordFieldStage(",
  "id:'echo:'+i+':observation'",
  "id:'astro:'+i+':event'"
]){
  assert(engine.includes(token),'M2 model history hook missing: '+token);
}
assert(engine.includes("active.entityId,'broken',i"),'Field broken transition hook missing');

assert(engine.includes('const EVAL_HORIZONS=[3,5,10,20]'),'M3 standard horizons missing');
assert(engine.includes('function rebuildEvaluation()'),'M3 evaluation rebuild hook missing');
assert(engine.includes('RK.evaluateTimeline(D,EVIDENCE_LOG'),'M3 must evaluate directly from M2 timeline');
assert(engine.includes('finalizeEvidenceTimeline();\n  rebuildEvaluation();\n  rebuildEvidence();'),'M3 evaluation must run after timeline finalization');

// index.html must be an adapter, never a second copy of the models.
for(const forbidden of [
  'function basinCandidate(','function fieldBestCandidate(','function candleShapeSimilarity(',
  'function astroPos(','function rememberEvidence(','function rebuildEvaluation('
]){
  assert(!s.includes(forbidden),'duplicated model/research implementation remains in index: '+forbidden);
}

console.log('index-contract.test.js: OK');
