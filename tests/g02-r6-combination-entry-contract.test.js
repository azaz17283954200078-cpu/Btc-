const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');

assert(s.includes('v2.2 · G02-R6 組合研究入口'),'R6 version label missing');
for(const id of ['tabModels','tabCombo','comboPane','comboWorkspace']){
  assert(s.includes('id="'+id+'"'),'missing dedicated combination surface '+id);
}
for(const fn of [
  'function goToCombinationResearch(',
  'function renderCombinationWorkspace(',
  'function comboCandidateConditions(',
  'function addCombinationCondition(',
  'function setComboRelation(',
  'function setComboWindow('
]) assert(s.includes(fn),'missing combination entry function '+fn);

for(const phrase of [
  '第一個條件來自已完成的單模型研究',
  '不重新選第一個條件',
  '下一步：前往組合研究 →',
  '條件越多不代表越準',
  '每加一個條件都先看樣本縮減與剩餘 N',
  '組合後剩 '
]) assert(s.includes(phrase),'missing combination continuity copy: '+phrase);

// Single-model handoff is the authoritative seed.
assert(s.includes('CONDITION_STACK=[cloneObj(ctx.condition)]'),'single-model handoff must seed condition stack');
assert(s.includes('COMBINATION_HANDOFF_CONTEXT=cloneObj(ctx)'),'full handoff context must be retained');
assert(s.includes('savedDisplayMarket(seed)'),'combination workspace must show inherited market');
assert(s.includes('conditionLabel(seed.condition)'),'combination workspace must show inherited model/state');
assert(s.includes('seed.settingSource'),'combination workspace must show inherited setting source');
assert(s.includes("seed.focus&&seed.focus.evidenceId"),'combination workspace must show inherited Evidence id');

// Extra conditions come from existing causal Evidence and shared Condition Engine.
assert(s.includes('CE.candidateConditions(EVIDENCE_LOG)'),'additional condition discovery must use shared Evidence');
assert(s.includes('CE.suggestRelation(EVIDENCE_LOG,CONDITION_STACK,c'),'relationship suggestion must use shared Condition Engine');
assert(s.includes('CE.availableRelations(EVIDENCE_LOG,CONDITION_STACK.slice(0,i),c'),'available relationships must use shared Condition Engine');
assert(s.includes('CE.evaluateConditions(D,EVIDENCE_LOG,CONDITION_STACK,{knownThrough:D.length-1})'),
  'combination result must use known-through Condition Engine evaluation');
assert(s.includes("!(c.model==='astro'&&c.state==='upcoming')"),'Astrology future projection must remain excluded');

// The combo is a separate task surface; single-model primary DOM still has no funnel.
const modelPane=s.slice(s.indexOf('id="modelsPane"'),s.indexOf('id="comboPane"'));
assert(!modelPane.includes('researchFunnel'),'legacy funnel must not return to single-model pane');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
new Function(s.slice(a+8,b));
console.log('g02-r6-combination-entry-contract.test.js: OK');
