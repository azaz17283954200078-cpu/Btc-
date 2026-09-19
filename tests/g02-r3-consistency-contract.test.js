const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');

assert(/v(?:1\.\d+|2\.\d+) · G02-R[3-7] /.test(s),'R3+ version label missing');
for(const phrase of [
  '同狀態總案例',
  '完整觀察',
  '尚未完成觀察',
  '可瀏覽案例',
  '百分比永遠只描述完整觀察的那一部分',
  '這四個數字有什麼不同？'
]) assert(s.includes(phrase),'missing shared count definition: '+phrase);

assert(s.includes('function researchCountLegendHTML(){'),'shared count legend helper missing');
assert(s.includes('function modelCountScopeNote(model){'),'model count scope note helper missing');
for(const model of ['sweep','echo','astro']) assert(s.includes("model==='"+model+"'"),model+' count-scope note missing');

const h=s.slice(s.indexOf('function singleHorizonHTML('),s.indexOf('function historicalRowsForFocus('));
assert(h.includes('researchCountLegendHTML()'),'horizon must expose shared quantity definitions');
assert(h.includes('modelCountScopeNote(model)'),'horizon must explain per-model sample unit');
assert(h.includes('同狀態總案例'),'horizon total-state label inconsistent');
assert(h.includes('完整觀察｜已走完'),'horizon completed label inconsistent');
assert(h.includes('尚未完成觀察'),'horizon incomplete label inconsistent');

const hist=s.slice(s.indexOf('function singleHistoryHTML('),s.indexOf('function modelParameterSnapshot('));
assert(hist.includes('可瀏覽案例 '),'history browser count label inconsistent');
assert(hist.includes('同狀態總案例 '),'history browser total label inconsistent');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
new Function(s.slice(a+8,b));
console.log('g02-r3-consistency-contract.test.js: OK');
