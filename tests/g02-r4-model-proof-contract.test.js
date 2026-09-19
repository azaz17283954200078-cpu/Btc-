const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');
const me=fs.readFileSync('src/model-engine.js','utf8');

assert(s.includes('v2.0 · G02-R4 模型證據'),'R4 version label missing');
for(const fn of [
  'function modelProofHTML(',
  'function modelParameterImpactText(',
  'function recentFailureEvidence(',
  'function openEvidenceRecordById('
]) assert(s.includes(fn),'missing R4 presenter '+fn);

for(const phrase of [
  '模型這次到底看到了什麼？',
  '調參數時先想這件事：',
  '支撐帶上緣',
  '確認要收復的觸發高點',
  '被掃的舊低',
  '下跌證據',
  '已辨識來回回合',
  '目前最佳相似度',
  'Strong 門檻',
  '最接近歷史區間',
  '因果主張'
]) assert(s.includes(phrase),'missing model-specific proof: '+phrase);

for(const model of ['support','macro','sweep','basin','field','echo','astro']){
  assert(s.includes("if(model==='"+model+"')"),'missing per-model proof/parameter branch '+model);
}
assert(s.includes('查看最近一次失效案例'),'direct failure-case navigation missing');
assert(s.includes('查看最近一次離開盆地'),'Basin exit-case navigation missing');

assert(me.includes("const VERSION='1.2.0';"),'model engine evidence enrichment version missing');
assert(me.includes('function candleShapeSimilarityParts('),'Echo similarity breakdown helper missing');
assert(me.includes('bestMatch:bestMatch?{'),'Echo best match must be persisted in Evidence');
assert(me.includes('startTimestamp:D[bestMatch.start]?D[bestMatch.start].t:null'),'Echo best-match start time missing');
assert(me.includes('endTimestamp:D[bestMatch.end]?D[bestMatch.end].t:null'),'Echo best-match end time missing');
assert(me.includes('parts:bestParts'),'Echo shape comparison parts missing');

// Rich proof must be shown before historical outcomes.
const card=s.slice(s.indexOf('function singleEvidenceCardHTML('),s.indexOf('function renderSingleResearch('));
assert(card.indexOf('modelProofHTML(model,raw)')>=0,'model proof not rendered');
assert(card.indexOf('modelProofHTML(model,raw)')<card.indexOf('singleHorizonHTML(model,state)'),
  'checkable model proof must appear before aggregate outcome statistics');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
new Function(s.slice(a+8,b));
console.log('g02-r4-model-proof-contract.test.js: OK');
