const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');

assert(/v(?:1\.\d+|2\.\d+) · G02-R[1-7] /.test(s),'G02 single-model version label missing');

for(const id of ['singleModelSelect','singleOverlayToggle','singleResearchBody','singleHandoffStatus']){
  assert(s.includes('id="'+id+'"'),'missing G02-R1 primary surface '+id);
}
for(const retired of ['evidenceDock','evidenceBackdrop','activeModelStack','researchStackSummary','researchFunnel']){
  assert(!s.includes('id="'+retired+'"'),'retired primary surface must not remain: '+retired);
}

// Four state domains are explicit and no longer overloaded into PINNED_RESEARCH.
for(const token of [
  "FOCUSED_MODEL='support'",
  "FOCUSED_EVIDENCE={mode:'now'",
  'SINGLE_RESEARCH_CONTEXT=null',
  'COMBINATION_HANDOFF_CONTEXT=null',
  'CONDITION_STACK=[]'
]){
  assert(s.includes(token),'missing separated research state '+token);
}

// Focus and visibility are separate: focused hidden models still run, but only visible models draw.
assert(s.includes("function isModelVisible(model){"),'visibility helper missing');
assert(s.includes("function shouldRunModel(model){"),'research-computation helper missing');
assert(s.includes("model===FOCUSED_MODEL"),'focused model must run even when overlay is hidden');
assert(s.includes("if(!isModelVisible('basin'))continue"),'Basin overlay visibility filter missing');
assert(s.includes("if(!isModelVisible('field'))continue"),'Field overlay visibility filter missing');
assert(s.includes("if(isModelVisible('macro'))for"),'Macro overlay visibility filter missing');
assert(s.includes("if(isModelVisible('support'))for"),'Support overlay visibility filter missing');
assert(s.includes("if(isModelVisible('sweep'))for"),'Sweep overlay visibility filter missing');
assert(s.includes("if(!model||!isModelVisible(model))continue"),'signal overlay visibility filter missing');

// "Now" must never silently fall back to latest history.
assert(s.includes("function openLatestResearch(model){focusSingleModel(model)}"),'model launcher must open current research, not latest history');
assert(s.includes('目前沒有形成可用 Evidence'),'explicit no-current-evidence state missing');
assert(s.includes('查看最近一次歷史案例 →'),'history fallback must be an explicit user action');

// One place, one flow: model explanation → one horizon → synchronized history case → advanced evidence.
assert(s.includes('一次只看一個時間距離'),'single-horizon interaction missing');
assert(s.includes('SINGLE_RESEARCH_HORIZON=10'),'single selected horizon state missing');
assert(s.includes('function stepHistoricalCase(delta){'),'history navigator missing');
assert(s.includes('主圖與右側目前指向同一個歷史案例。'),'chart/inspector synchronization explanation missing');
assert(s.includes('if(moveChart&&Number.isInteger(e.index))jumpToEvidence(e.index)'),'history selection must move chart');
assert(s.includes('if(hit&&hit.model)focusSingleEvidenceFromHit(hit)'),'chart model click must update the inspector');

// Single-model research produces a traceable handoff for the future combination workspace.
assert(s.includes('function buildSingleResearchContext(){'),'single research context builder missing');
for(const token of [
  "source:'single-model-research'",
  'parameterSnapshot:modelParameterSnapshot(FOCUSED_MODEL)',
  'parameterFingerprint:run.parameterFingerprint||null',
  "condition:{model:FOCUSED_MODEL,state:ev.state,windowBars:0,relation:'time'}",
  'knownThrough:D.length?D.length-1:null'
]){
  assert(s.includes(token),'handoff trace field missing: '+token);
}
assert(s.includes('CONDITION_STACK=[cloneObj(ctx.condition)]'),'handoff must seed future combination condition stack');
assert(s.includes('window.__SL_COMBINATION_HANDOFF__=COMBINATION_HANDOFF_CONTEXT'),'handoff must be inspectable');
assert(s.includes('這裡只準備研究單位，不會在單模型介面展開漏斗。'),'single-model surface must not expand combination UI');

// Changing model settings invalidates an old handoff rather than silently reusing stale params.
assert(s.includes("clearCombinationHandoff('模型設定已變更；若要進組合研究，請重新確認並準備一次。')"),
  'parameter changes must invalidate prepared handoff');

// Mobile remains the same inline architecture rather than another overlay/page.
assert(s.includes('.single-model-picker{grid-template-columns:1fr}'),'mobile inspector layout missing');
assert(!s.includes('id="evidenceDock"'),'mobile must not reintroduce Evidence Dock');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
assert(a>=0&&b>a,'inline app script missing');
new Function(s.slice(a+8,b));

console.log('g02-r1-single-model-contract.test.js: OK');
