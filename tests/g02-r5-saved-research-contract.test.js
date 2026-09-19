const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');

assert(/v2\.\d+ · G02-R[5-7] /.test(s),'R5+ version label missing');
for(const id of ['savedResearchList','singleResearchBody','singleHandoffStatus']){
  assert(s.includes('id="'+id+'"'),'missing saved/current research surface '+id);
}
for(const fn of [
  'function loadSavedResearch(',
  'function persistSavedResearch(',
  'function saveCurrentResearch(',
  'function openSavedResearch(',
  'function deleteSavedResearch(',
  'function currentDiffersFromSaved(',
  'function renderSavedResearch('
]) assert(s.includes(fn),'missing R5 function '+fn);

for(const phrase of [
  '已保存研究',
  '保存的是當時快照，不會跟著目前設定偷偷改變',
  '目前研究：',
  '保存這份研究',
  '目前畫面已不同。',
  '載入這份研究',
  '保存的歷史 Evidence 在目前資料版本中找不到'
]) assert(s.includes(phrase),'missing current/saved distinction: '+phrase);

assert(s.includes("const SAVED_RESEARCH_KEY='strategy-lab:saved-research:v1'"),'persistent saved-research key missing');
assert(s.includes('parameterSnapshot:modelParameterSnapshot(FOCUSED_MODEL)'),'saved context must retain parameter snapshot');
assert(s.includes('timestamp:Number.isFinite(ev.timestamp)'), 'saved Evidence timestamp missing');
assert(s.includes("MODEL_SETTING_STATE[x.model]={kind:'saved',savedId:id}"),'loading saved research must label restored parameter snapshot');
assert(s.includes("if(s&&s.kind==='saved')return '已保存參數快照'"),'saved parameter label missing');
assert(s.includes('await load();'),'loading saved research must restore market/timeframe data before focus');
assert(s.includes('ACTIVE_SAVED_RESEARCH_ID=null'),'current research must be able to detach from saved origin');
assert(s.includes("window.__SL_SAVED_RESEARCH__=SAVED_RESEARCH"),'saved research must be inspectable');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
new Function(s.slice(a+8,b));
console.log('g02-r5-saved-research-contract.test.js: OK');
