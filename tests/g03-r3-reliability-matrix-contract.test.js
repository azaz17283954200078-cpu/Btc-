const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');
const matrix=fs.readFileSync('scripts/g03-reliability-matrix.js','utf8');

for(const phrase of [
  '資料矩陣怎麼評估？',
  '建立目前市場／週期的三套 preset 矩陣',
  '有效獨立案例',
  'OOS 完整案例',
  '薄弱原因',
  '不使用報酬高低挑 preset'
]) assert(s.includes(phrase),'R3 UI principle missing: '+phrase);

for(const fn of ['function buildFocusedReliabilityMatrix(','function reliabilityMatrixHTML(','function reliabilityMatrixKey(']){
  assert(s.includes(fn),'R3 matrix function missing '+fn);
}
assert(s.includes('window.__SL_RELIABILITY_MATRIX__'),'R3 matrix must be inspectable');
assert(!s.includes('id="tabMatrix"'),'R3 must not add a new main navigation tab without a separate Article 23 decision');

for(const code of ['DATA_SHORTAGE','NATURALLY_RARE','PARAMETER_TOO_STRICT','OVERLAP_HEAVY','OOS_SHORTAGE','LIFECYCLE_IMBALANCE','MODEL_LIMITATION']){
  const rel=fs.readFileSync('src/reliability-engine.js','utf8');
  assert(rel.includes(code),'weakness classification missing '+code);
}
assert(matrix.includes('cellMonotonicWarnings'),'per-context monotonic exceptions must be audited');
assert(matrix.includes('aggregateMonotonic'),'aggregate preset density gate missing');
assert(matrix.includes('No return/up-rate/MFE/MAE metric participates in preset selection.'));

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
new Function(s.slice(a+8,b));
console.log('g03-r3-reliability-matrix-contract.test.js: OK');
