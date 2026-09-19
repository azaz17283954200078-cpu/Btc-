const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');

assert(/v(?:1\.\d+|2\.\d+) · G02-R[2-7] /.test(s),'G02 R2+ version label missing');

// Percentages and averages must be preceded by visible sample sufficiency.
for(const phrase of [
  '樣本不足｜只能當案例看',
  '探索性樣本｜先找現象，不下結論',
  '較可比較｜仍只是歷史分布',
  '同狀態總案例',
  '已走完 ',
  '尚未走完',
  '這不是成功率',
  '不是可保證取得的報酬'
]){
  assert(s.includes(phrase),'missing research-safety copy: '+phrase);
}
for(const fn of [
  'function sampleReliability(',
  'function historicalCaseInventory(',
  'function macroLifecycleInventory(',
  'function macroSafetyHTML(',
  'function astroEventInventory(',
  'function astroSafetyHTML(',
  'function canPrepareCombination('
]){
  assert(s.includes(fn),'missing G02-R2 helper '+fn);
}

const hzStart=s.indexOf('function singleHorizonHTML('),hzEnd=s.indexOf('function historicalRowsForFocus(',hzStart);
assert(hzStart>=0&&hzEnd>hzStart,'single horizon block missing');
const hz=s.slice(hzStart,hzEnd);
assert(hz.indexOf('research-safety')<hz.indexOf('single-horizon-result'),
  'sample sufficiency must render before outcome percentages');
assert(hz.includes("if(n<5)")||s.includes("if(n<5)return{key:'block'"),'N<5 safety gate missing');
assert(s.includes("if(n<20)return{key:'explore'"),'5-19 exploratory gate missing');

// Macro blocker: candidate, confirmation, pre-confirm failure and unresolved must coexist.
for(const phrase of [
  '候選 ≠ 宏觀底部已確認',
  '歷史候選',
  '完成模型確認',
  '確認前失效／過期',
  '資料尾端尚未結束',
  '不要把候選的後續統計冒充成已確認底部的結果'
]){
  assert(s.includes(phrase),'missing Macro blocker safety: '+phrase);
}
assert(s.includes("if(state==='active')return '已完成收復確認'"),'Macro active label must say model confirmation');
assert(s.includes("if(state==='candidate')return '候選｜尚未完成確認'"),'Macro candidate label must remain explicitly unconfirmed');

// Astrology blocker: hypothesis, time reference, overlap/non-independence, projection guard.
for(const phrase of [
  '可被否證的外部時間假說，不是價格因果',
  '資料截止日',
  '不是自動等於今天',
  '同一根 K 含多事件',
  '能否視為獨立證據',
  '不一定',
  '不同案例的後續觀察區間可能彼此重疊',
  '這筆是時間投影，不是歷史結果樣本',
  '這筆不能直接帶進組合研究'
]){
  assert(s.includes(phrase),'missing Astrology blocker safety: '+phrase);
}
assert(s.includes("ev.kind!=='projection'&&ev.state!=='upcoming'"),
  'projection must be rejected as combination handoff evidence');
assert(s.includes("HANDOFF_NOTICE='這筆是未來投影，不能直接當成組合研究條件。'"),
  'projection handoff must explain why it is blocked');

// Case inventory must distinguish total historical cases from UI browse cap.
assert(s.includes('可瀏覽 '+ "'+rows.length+'" + ' / 總 '), 'history browser total/visible distinction missing');
assert(s.includes('historyCases(model,state,Number.MAX_SAFE_INTEGER)'),'full case inventory missing');
assert(s.includes('visible:all.slice(0,cap)'),'browser cap must be explicit data, not silently mistaken for total');

// Beginner Astro parameters: density presets first, jargon secondary.
assert(s.includes('先選你想研究多少事件'),'Astro settings must start with event density concept');
assert(s.includes('不需要先懂全部占星名詞'),'Astro jargon must not be a prerequisite');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
assert(a>=0&&b>a,'inline app script missing');
new Function(s.slice(a+8,b));

console.log('g02-r2-research-safety-contract.test.js: OK');
