const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');

assert(/v1\.[5-9] · (?:M5|G01|G02-R[1-3]) /.test(s),'M5/G02 version label missing');
assert(s.includes('<script src="src/condition-engine.js"></script>'),'shared Condition Engine is not loaded');
assert(s.includes('CE=window.StrategyLabConditionEngine'),'UI must use shared Condition Engine');

for(const fn of [
  'function conditionalExplorerHTML(','function conditionalStatsHTML(','function conditionBricksHTML(','function sampleFunnelHTML(','function sampleDiagnosisHTML(','function addCondition(',
  'function removeCondition(','function setConditionWindow(','function setConditionRelation(','function conditionGateText(',
  'function renderDirectFunnel(','function priceRulerHTML(','function startResearchFunnel(','function addModelToFunnel(','function openFunnelEvidence('
])assert(s.includes(fn),'missing M5 guided conditional function '+fn);

for(const phrase of [
  '再加一個條件，歷史分布有沒有變？',
  '這裡不讓模型投票',
  '連續成立的一整段仍只算 1 個基準案例',
  '樣本不足：先把它當案例看',
  '探索性樣本',
  '可比較樣本',
  '差值只描述歷史分布差異',
  '目前最多同時研究 3 個條件',
  '窗口只往事件發生後延伸',
  '樣本縮減流程｜每加一個條件，歷史案例怎麼縮',
  '這一步縮最多',
  '調整模型',
  '為什麼歷史案例變少？'
])assert(s.includes(phrase),'missing M5 guidance: '+phrase);

assert(s.includes('CE.evaluateConditions(D,EVIDENCE_LOG,conditions'),'M5 UI must evaluate through shared Condition Engine');
assert(s.includes('CE.discoverCompanions(EVIDENCE_LOG,conditions'),'M5 companions must come from shared Condition Engine');
const m5Start=s.indexOf('function conditionalExplorerHTML('),m5End=s.indexOf('function addCondition(',m5Start);
assert(m5Start>=0&&m5End>m5Start,'M5 conditional UI block missing');
const m5Block=s.slice(m5Start,m5End);
assert(!/BUY|SELL|勝率最高|最佳組合/.test(m5Block),'M5 conditional UI must not become a trading vote/ranking surface');
assert(s.includes("[[0,'當根'],[3,'最近 3 根內'],[5,'最近 5 根內']]"),'event-window control missing');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
assert(a>=0&&b>a,'inline app script missing');
new Function(s.slice(a+8,b));
console.log('m5-ui-contract.test.js: OK');

assert(s.includes('condition-brick'),'M5 must render condition bricks');
assert(s.includes('sample-funnel'),'M5 must render a visible Sample Funnel');
assert(s.includes("@media(max-width:650px)"),'M5 mobile breakpoint missing');

// R02 engine/UI helpers remain available for the future dedicated combination workspace,
// but G02-R1 removes the funnel from the single-model primary surface.
assert(!s.includes('id="activeModelStack"'),'single-model architecture must not use active model bricks');
assert(!s.includes('id="researchFunnel"'),'single-model architecture must not render the funnel');
assert(!s.includes('id="evidenceDock"'),'single-model architecture must not depend on Evidence Dock');
for(const phrase of ['同時成立','價格區域重疊','掃單價格進入區域','價格尺｜最近一個符合案例']){
  assert(s.includes(phrase),'R02 relationship semantics/helper copy must remain available: '+phrase);
}
assert(s.includes('CE.availableRelations(EVIDENCE_LOG'),'R02 relationship controls must still come from shared Condition Engine');
assert(s.includes('CE.suggestRelation(EVIDENCE_LOG'),'R02 default relationship must still come from shared Condition Engine');
assert(s.includes('CE.episodesForConditions(EVIDENCE_LOG'),'prospective relationship counts must still use shared Condition Engine');
assert(s.includes('COMBINATION_HANDOFF_CONTEXT'),'G02-R1 must preserve a handoff boundary into future combination research');
assert(s.includes('CONDITION_STACK=[]'),'single-model and condition-stack state must be separate');
assert(!s.includes('Sample Funnel｜'),'English-first Sample Funnel label must not remain visible');
