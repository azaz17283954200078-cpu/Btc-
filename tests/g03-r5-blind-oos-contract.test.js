const fs=require('fs');
const assert=require('assert');
const s=fs.readFileSync('index.html','utf8');
const script=fs.readFileSync('scripts/g03-blind-oos-validation.js','utf8');

for(const phrase of [
  '盲測區｜時間後段',
  '參數先固定，再看後段資料',
  '這裡不使用 OOS 報酬去挑 preset',
  '參數已固定，揭露 OOS 後續分布',
  'OOS 已揭露｜只讀結果',
  '若改參數會建立新 Run'
]) assert(s.includes(phrase),'R5 blind-validation copy missing: '+phrase);

assert(s.includes('REVEALED_VALIDATION_RUN_ID=null'),'new research run must hide prior OOS reveal');
assert(s.includes('REVEALED_VALIDATION_RUN_ID=CURRENT_RUN_MANIFEST.runId'),'OOS reveal must bind to one immutable run');
assert(script.includes('Chronological 70% calibration / 30% blind validation'));
assert(script.includes('frozen.parameterFingerprint===full.parameterFingerprint'),'frozen fingerprint integrity check missing');
assert(script.includes('OOS return metrics are reveal-only and never select the preset'));
assert(!script.includes('sort((a,b)=>b.medianReturn'),'OOS return ranking must never select presets');

const a=s.lastIndexOf('<script>'),b=s.lastIndexOf('</script>');
new Function(s.slice(a+8,b));
console.log('g03-r5-blind-oos-contract.test.js: OK');
