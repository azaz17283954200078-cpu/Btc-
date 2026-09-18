const fs=require('fs');
const assert=require('assert');
const Runner=require('../scripts/research-runner.js');

for(const [name,file] of [['NASDAQ','data/nasdaq_daily.csv'],['TAIEX','data/taiex_daily.csv']]){
  const raw=fs.readFileSync(file,'utf8').trim();
  assert(raw,name+' data file is empty');
  const lines=raw.split(/\r?\n/).filter(Boolean);
  assert(lines.length>1000,name+' history is suspiciously short');
  const data=Runner.parseCSV(raw);
  assert.equal(data.length,lines.length-1,name+' contains malformed or incomplete OHLC rows');

  let last=-Infinity;
  const seen=new Set();
  for(const x of data){
    assert([x.t,x.o,x.h,x.l,x.c].every(Number.isFinite),name+' contains non-finite OHLC');
    assert(x.o>0&&x.h>0&&x.l>0&&x.c>0,name+' contains non-positive price');
    assert(x.h>=Math.max(x.o,x.c),name+' high is below candle body');
    assert(x.l<=Math.min(x.o,x.c),name+' low is above candle body');
    assert(x.t>last,name+' dates are not strictly increasing');
    assert(!seen.has(x.t),name+' contains duplicate dates');
    seen.add(x.t);last=x.t;
  }
  const ageDays=(Date.now()-data[data.length-1].t*1000)/86400000;
  assert(ageDays<21,name+' data is more than 21 days stale');
}
console.log('market-data.test.js: OK');
