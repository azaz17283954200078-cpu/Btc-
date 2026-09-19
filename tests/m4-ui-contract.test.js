const fs=require('fs');
const assert=require('assert');

const s=fs.readFileSync('index.html','utf8');

assert(/v1\.[2-9] · (?:M[45]|G01|G02-R[12]) /.test(s),'Guided Research version label missing');
assert(s.includes('<script src="src/model-presets.js"></script>'),'shared validated presets are not loaded');

for(const id of ['singleModelSelect','singleOverlayToggle','singleResearchBody','singleHandoffStatus','presetChoices','presetValidation','modelLibrary']){
  assert(s.includes('id="'+id+'"'),'missing guided research surface '+id);
}
assert(!s.includes('id="evidenceDock"'),'retired Evidence Dock must not remain in primary DOM');
assert(!s.includes('id="activeModelStack"'),'retired active-model stack must not remain in primary DOM');
assert(!s.includes('id="researchFunnel"'),'conditional funnel must not occupy the single-model primary DOM');

for(const model of ['support','macro','sweep','basin','field','echo','astro']){
  assert(s.includes('data-model-card="'+model+'"'),'missing guided card for '+model);
}
for(const phrase of ['它在問：','開啟後：','別把它當成：','調整研究設定','研究目前證據']){
  assert(s.includes(phrase),'missing guided copy: '+phrase);
}
for(const fn of [
  'function quickResearchHTML(','function pinResearch(','function renderEvidenceDock(',
  'function historyCases(','function failureExamples(','function jumpToEvidence(',
  'function renderModelGuides(','function openLatestResearch(','function renderPresetChoices(',
  'function applyPreset(','function resetModelSettings(','function presetParamSummary(',
  'function applyDraftToModel(','function renderResearchStack(','function openModelLibrary(','function disableModel('
]){
  assert(s.includes(fn),'missing M4 Guided Research function '+fn);
}

// First-use discoverability: one core model starts visible; experimental models stay opt-in.
const support=s.match(/id="modSupport"[^>]*>/);
assert(support&&/\bchecked\b/.test(support[0]),'Support should be visible on first load');
for(const id of ['modBasin','modSpring','modEcho','modAstro']){
  const m=s.match(new RegExp('id="'+id+'"[^>]*>'));
  assert(m&&!/\bchecked\b/.test(m[0]),id+' must remain default OFF');
}

// Validated recipes are shared with Runner/engine, not hard-coded only in UI.
assert(s.includes('MP=window.StrategyLabModelPresets'),'shared preset module missing');
assert(s.includes('MP.validation(k,p.id)'),'preset validation metadata must be shown in UI');
assert(s.includes('resetModelSettings(k);'),'switching recipes must reset that model before applying the new recipe');
assert(s.includes('const SWEEP=cloneObj(ME.DEFAULT_SWEEP)'),'Sweep UI settings must share engine defaults');
assert(s.includes('enabled,zone:ZONE,macro:MACRO,sweep:SWEEP,exp:EXP'),'Sweep settings must reach shared Model Engine');

// Result education and next-step guidance.
for(const phrase of [
  '為什麼？',
  '接下來看什麼？',
  '這是歷史路徑，不是可保證取得的報酬',
  '途中最大上漲幅度的歷史中位數',
  '失敗率不是「價格會跌的機率」',
  '真實歷史案例',
  '調整模型'
]){
  assert(s.includes(phrase),'missing result guidance: '+phrase);
}

// Desktop/mobile interaction contract.
assert(s.includes("window.matchMedia('(pointer: coarse)')"),'coarse-pointer contract missing');
assert(s.includes("e.pointerType==='touch'"),'touch pointer contract missing');
assert(s.includes("if(isMobileUI()||e.target.closest('button'))return"),'mobile parameter sheet must not use desktop dragging');
assert(s.includes('.param-modal{align-items:flex-end;justify-content:stretch;padding:0}'),'mobile parameter bottom-sheet CSS missing');
assert(s.includes('.single-model-picker{grid-template-columns:1fr}'),'mobile inline single-model inspector CSS missing');
assert(s.includes('if(hit&&hit.model)focusSingleEvidenceFromHit(hit)'),'chart tap/click must sync model research');
assert(s.includes("if(!tip||isCoarsePointer()||!mousePos||drag)"),'mobile must not depend on hover tooltip');

// M4 consumes the existing M2/M3 products; no second evaluation engine in UI.
assert(s.includes('EVIDENCE_LOG.filter'),'M4 historical cases must read M2 timeline');
assert(s.includes('EVALUATION&&EVALUATION.models'),'M4 stats must read M3 Evaluation');
assert(!s.includes('RK.evaluateTimeline('),'index UI must not recalculate M3 evaluation');

for(const token of ["model:'support'","model:'macro'","model:'sweep'","model:'basin'","model:'field'"]){
  assert(s.includes(token),'missing model-aware chart hit '+token);
}
assert(s.includes('model=signalModel(z),state=normHitState(model,signalState(z))'),'research signals lack model/state mapping');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
assert(a>=0&&b>a,'inline app script missing');
new Function(s.slice(a+8,b));

console.log('m4-ui-contract.test.js: OK');

const modelLibrary=s.match(/<details id="modelLibrary"[^>]*>/);
assert(modelLibrary&&!/\bopen\b/.test(modelLibrary[0]),'model library must be collapsed by default');
assert(s.includes('模型研究'),'primary research surface must be Chinese-first');
assert(s.includes('id="singleModelSelect"'),'single focused model selector must replace model bricks');
assert(s.includes('MODEL_SETTING_STATE'),'focused model must retain its UI research-setting source');
