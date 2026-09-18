const fs=require('fs');
const assert=require('assert');

const s=fs.readFileSync('index.html','utf8');

assert(s.includes('v1.1 · M4 Progressive Research UI'),'M4 version label missing');
for(const id of ['evidenceDock','evidenceDockBody','evidenceBackdrop']){
  assert(s.includes('id="'+id+'"'),'missing M4 research surface '+id);
}
for(const fn of [
  'function quickResearchHTML(','function pinResearch(','function renderEvidenceDock(',
  'function historyCases(','function failureExamples(','function jumpToEvidence('
]){
  assert(s.includes(fn),'missing M4 research function '+fn);
}
assert(s.includes("window.matchMedia('(pointer: coarse)')"),'coarse-pointer contract missing');
assert(s.includes("e.pointerType==='touch'"),'touch pointer contract missing');
assert(s.includes("if(isMobileUI()||e.target.closest('button'))return"),'mobile parameter sheet must not use desktop dragging');
assert(s.includes('.param-modal{align-items:flex-end;justify-content:stretch;padding:0}'),'mobile parameter bottom-sheet CSS missing');
assert(s.includes('.evidence-dock{display:none;position:fixed;left:0;right:0;bottom:0'),'mobile evidence bottom-sheet CSS missing');
assert(s.includes('if(hit&&hit.model)pinResearch(hit)'),'chart tap/click must pin model research');
assert(s.includes("if(!tip||isCoarsePointer()||!mousePos||drag)"),'mobile must not depend on hover tooltip');

// UI consumes the existing M2/M3 products; it must not create another evaluation engine.
assert(s.includes('EVIDENCE_LOG.filter'),'M4 historical cases must read M2 timeline');
assert(s.includes('EVALUATION&&EVALUATION.models'),'M4 stats must read M3 Evaluation');
assert(!s.includes('RK.evaluateTimeline('),'index UI must not recalculate M3 evaluation');

// The research targets must identify the model/state they represent.
for(const token of [
  "model:'support'","model:'macro'","model:'sweep'","model:'basin'","model:'field'"
]){
  assert(s.includes(token),'missing model-aware chart hit '+token);
}
assert(s.includes('model=signalModel(z),state=normHitState(model,signalState(z))'),'research signals lack model/state mapping');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
assert(a>=0&&b>a,'inline app script missing');
new Function(s.slice(a+8,b));

console.log('m4-ui-contract.test.js: OK');
