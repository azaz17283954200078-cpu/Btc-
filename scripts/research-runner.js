#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const ME=require('../src/model-engine.js');
const RK=require('../src/research-kernel.js');
const CE=require('../src/condition-engine.js');

const SUPPORTED={
  BTC:['1h','4h','1d','1w'],
  IXIC:['1d','1w','1m'],
  TWII:['1d','1w','1m']
};
const MODEL_KEYS=['support','macro','sweep','basin','field','echo','astro'];
const BTC_DAILY_URL='https://raw.githubusercontent.com/alessiostomeo/btc-cycle-data/main/bitstamp/1day/BTCUSD_bitstamp_daily_2012-2026.csv';

function parseList(x){
  if(Array.isArray(x))return x;
  return String(x||'').split(',').map(s=>s.trim()).filter(Boolean);
}
function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    const a=argv[i];
    if(!a.startsWith('--'))continue;
    const k=a.slice(2);
    if(k==='help'){out.help=true;continue}
    const v=argv[i+1];
    if(v==null||v.startsWith('--'))out[k]=true;
    else{out[k]=v;i++}
  }
  return out;
}
function usage(){
  return [
    'Strategy Lab Research Runner',
    '',
    'Run:',
    '  node scripts/research-runner.js --market BTC --timeframe 1d --models support,echo --out research/btc-1d.json',
    '  node scripts/research-runner.js --market BTC,IXIC --timeframe 1d,1w --params research/params.example.json --out research/batch.json',
    '',
    'Compare datasets:',
    '  node scripts/research-runner.js --compare old.json,new.json --out research/compare.json',
    '',
    'Options:',
    '  --market       comma-separated markets (BTC, IXIC, TWII)',
    '  --timeframe    comma-separated timeframes; omitted = all supported for each market',
    '  --models       comma-separated model keys; default = support,macro,sweep',
    '  --params       JSON file with one parameter set or an array of sets',
    '  --conditions   JSON file: array or {"queries":[{"name":"...","conditions":[...]}]}',
    '  --input        local OHLCV CSV; only for a single market/timeframe run',
    '  --out          output JSON path',
    '  --compare      two prior dataset JSON files separated by comma'
  ].join('\n');
}
function dateToEpoch(x){
  const n=Number(x);
  if(Number.isFinite(n)&&n>1000000000)return n>1000000000000?n/1000:n;
  const t=Date.parse(String(x));
  return Number.isFinite(t)?t/1000:NaN;
}
function parseCSV(text){
  const lines=String(text||'').trim().split(/\r?\n/).filter(Boolean);
  if(lines.length<2)return[];
  const headers=lines[0].split(',').map(x=>x.trim().replace(/^"|"$/g,''));
  const lower=headers.map(x=>x.toLowerCase());
  const idx=(...names)=>{
    for(const name of names){
      const i=lower.indexOf(name.toLowerCase());
      if(i>=0)return i;
    }
    return -1;
  };
  const ti=idx('date','datetime','datetime_utc','timestamp','time'),
        oi=idx('open'),hi=idx('high'),li=idx('low'),ci=idx('close'),vi=idx('volume','vol');
  if(ti<0||oi<0||hi<0||li<0||ci<0)throw new Error('CSV requires Date/Time, Open, High, Low, Close columns');
  const out=[];
  for(let n=1;n<lines.length;n++){
    const p=lines[n].split(',').map(x=>x.trim().replace(/^"|"$/g,''));
    const row={
      t:dateToEpoch(p[ti]),o:Number(p[oi]),h:Number(p[hi]),l:Number(p[li]),c:Number(p[ci]),
      v:vi>=0&&Number.isFinite(Number(p[vi]))?Number(p[vi]):0
    };
    if([row.t,row.o,row.h,row.l,row.c].every(Number.isFinite))out.push(row);
  }
  return out.sort((a,b)=>a.t-b.t);
}
function aggregate(a,kind){
  let out=[],u,key;
  for(const x of a){
    const d=new Date(x.t*1000);
    let k;
    if(kind==='4h')k=Math.floor(x.t/14400)*14400;
    else if(kind==='1d')k=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())/1000;
    else if(kind==='1w')k=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-((d.getUTCDay()+6)%7))/1000;
    else if(kind==='1m')k=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)/1000;
    else throw new Error('Unsupported aggregation '+kind);
    if(!u||key!==k){u={...x,t:k};key=k;out.push(u)}
    else{u.h=Math.max(u.h,x.h);u.l=Math.min(u.l,x.l);u.c=x.c;u.v+=x.v}
  }
  return out;
}
async function fetchText(url){
  const r=await fetch(url);
  if(!r.ok)throw new Error('HTTP '+r.status+' '+url);
  return r.text();
}
async function fetchJSON(url){
  const r=await fetch(url);
  if(!r.ok)throw new Error('HTTP '+r.status+' '+url);
  return r.json();
}
async function loadBTCIntraday(timeframe){
  const interval=timeframe==='4h'?'4h':'1h';
  let all=[],end=Date.now(),loops=20;
  for(let n=0;n<loops;n++){
    const url='https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval='+interval+'&limit=1000&endTime='+end;
    const a=await fetchJSON(url);
    if(!a.length)break;
    const b=a.map(x=>({t:x[0]/1000,o:+x[1],h:+x[2],l:+x[3],c:+x[4],v:+x[7]}));
    all=b.concat(all);end=a[0][0]-1;
    if(a.length<1000)break;
  }
  const m=new Map(all.map(x=>[x.t,x]));
  return [...m.values()].sort((a,b)=>a.t-b.t);
}
async function loadMarketData(market,timeframe,opts={}){
  if(opts.inputPath){
    const raw=fs.readFileSync(opts.inputPath,'utf8');
    return{data:parseCSV(raw),source:'local input '+opts.inputPath};
  }
  if(market==='BTC'){
    if(timeframe==='1h'||timeframe==='4h'){
      return{data:await loadBTCIntraday(timeframe),source:'Binance public spot klines'};
    }
    const raw=await fetchText(BTC_DAILY_URL);
    const daily=parseCSV(raw).map(x=>({...x,v:x.v*x.c}));
    return{
      data:timeframe==='1w'?aggregate(daily,'1w'):daily,
      source:'Bitstamp long-term daily CSV'
    };
  }
  const local=market==='IXIC'?'data/nasdaq_daily.csv':market==='TWII'?'data/taiex_daily.csv':null;
  if(!local)throw new Error('Unknown market '+market);
  const raw=fs.readFileSync(path.resolve(process.cwd(),local),'utf8');
  const daily=parseCSV(raw);
  return{
    data:timeframe==='1d'?daily:aggregate(daily,timeframe),
    source:(market==='IXIC'?'NASDAQ Composite':'TAIEX')+' project daily CSV'
  };
}
function enabledFromModels(models){
  const list=parseList(models);
  const chosen=list.length?list:['support','macro','sweep'];
  const enabled={};
  for(const k of MODEL_KEYS)enabled[k]=chosen.includes(k);
  const bad=chosen.filter(k=>!MODEL_KEYS.includes(k));
  if(bad.length)throw new Error('Unknown models: '+bad.join(', '));
  return enabled;
}
function normalizeParamSets(raw){
  if(raw==null)return[{name:'default'}];
  const sets=Array.isArray(raw)?raw:[raw];
  return sets.map((x,i)=>({
    name:String(x&&x.name||('set-'+(i+1))),
    zone:x&&x.zone||{},
    macro:x&&x.macro||{},
    sweep:x&&x.sweep||{},
    exp:x&&x.exp||{},
    enabled:x&&x.enabled||null,
    note:x&&x.note||null
  }));
}
function summarizeEvaluation(evaluation){
  const out={};
  if(!evaluation||!evaluation.models)return out;
  for(const [model,m] of Object.entries(evaluation.models)){
    out[model]={count:m.count,states:{}};
    for(const [state,s] of Object.entries(m.states)){
      out[model].states[state]={
        count:s.count,
        horizons:Object.fromEntries(Object.entries(s.horizons||{}).map(([h,x])=>[h,{
          n:x.n,incomplete:x.incomplete,upRate:x.upRate,medianReturn:x.medianReturn,
          medianMFE:x.medianMFE,medianMAE:x.medianMAE
        }]))
      };
    }
  }
  return out;
}
function normalizeConditionQueries(raw){
  if(raw==null)return[];
  const list=Array.isArray(raw)?raw:(Array.isArray(raw.queries)?raw.queries:[raw]);
  return list.map((q,i)=>{
    const conditions=Array.isArray(q)?q:(q&&q.conditions);
    if(!Array.isArray(conditions)||!conditions.length)throw new Error('Condition query requires conditions[]');
    return{
      name:String(q&&q.name||('condition-'+(i+1))),
      conditions,
      baselineConditions:q&&q.baselineConditions||null,
      horizons:q&&q.horizons||null
    };
  });
}
function evaluateConditionQueries(data,evidence,raw){
  return normalizeConditionQueries(raw).map(q=>({
    name:q.name,
    result:CE.evaluateConditions(data,evidence,q.conditions,{
      baselineConditions:q.baselineConditions||undefined,
      horizons:q.horizons||undefined,
      knownThrough:data.length-1
    })
  }));
}
function runResearch(data,spec={}){
  const enabled=spec.enabled||enabledFromModels(spec.models);
  const res=ME.run(data,{
    market:spec.market||'CUSTOM',
    timeframe:spec.timeframe||'1d',
    source:spec.source||'',
    enabled,
    zone:spec.zone||{},
    macro:spec.macro||{},
    sweep:spec.sweep||{},
    exp:spec.exp||{}
  });
  return{
    schemaVersion:1,
    market:res.market,
    timeframe:res.timeframe,
    source:res.source,
    modelVersion:res.engineVersion,
    kernelVersion:res.kernelVersion,
    parameterSet:spec.parameterSet||'default',
    parameterFingerprint:res.parameterFingerprint,
    enabled:res.params.enabled,
    params:{zone:res.params.zone,macro:res.params.macro,sweep:res.params.sweep,exp:res.params.exp},
    range:{
      bars:data.length,
      start:data.length?data[0].t:null,
      end:data.length?data[data.length-1].t:null
    },
    evidence:res.evidenceLog,
    evidenceErrors:res.evidenceErrors,
    evaluation:res.evaluation,
    summary:summarizeEvaluation(res.evaluation),
    conditionEngineVersion:CE.VERSION,
    conditional:evaluateConditionQueries(data,res.evidenceLog,spec.conditionQueries)
  };
}
async function runBatch(config={}){
  const markets=parseList(config.markets||config.market);
  const useMarkets=markets.length?markets:['BTC'];
  const paramSets=normalizeParamSets(config.paramSets);
  const baseEnabled=config.enabled||enabledFromModels(config.models);
  const runs=[];
  const cache=new Map();

  for(const market of useMarkets){
    const requested=parseList(config.timeframes||config.timeframe);
    const tfs=requested.length?requested:(SUPPORTED[market]||[]);
    if(!tfs.length)throw new Error('No timeframes for '+market);

    for(const timeframe of tfs){
      if(SUPPORTED[market]&&!SUPPORTED[market].includes(timeframe))throw new Error('Unsupported '+market+' '+timeframe);
      const cacheKey=market+'|'+timeframe;
      let loaded=cache.get(cacheKey);
      if(!loaded){
        const loader=config.dataLoader||loadMarketData;
        loaded=await loader(market,timeframe,{inputPath:config.inputPath});
        if(!loaded||!Array.isArray(loaded.data)||!loaded.data.length)throw new Error('No data for '+market+' '+timeframe);
        cache.set(cacheKey,loaded);
      }

      for(const set of paramSets){
        const enabled={...baseEnabled,...(set.enabled||{})};
        runs.push(runResearch(loaded.data,{
          market,timeframe,source:loaded.source,
          enabled,zone:set.zone,macro:set.macro,sweep:set.sweep,exp:set.exp,parameterSet:set.name,
          conditionQueries:config.conditionQueries||[]
        }));
      }
    }
  }

  return{
    schemaVersion:1,
    generatedAt:new Date().toISOString(),
    engineVersion:ME.VERSION,
    kernelVersion:RK.VERSION,
    runCount:runs.length,
    runs,
    comparison:summarizeRuns(runs)
  };
}
function summarizeRuns(runs){
  return (runs||[]).map(r=>({
    market:r.market,timeframe:r.timeframe,parameterSet:r.parameterSet,
    modelVersion:r.modelVersion,parameterFingerprint:r.parameterFingerprint,
    evidenceCount:r.evidence.length,errorCount:r.evidenceErrors.length,
    models:r.summary
  }));
}
function flattenMetrics(run){
  const out={};
  for(const [model,m] of Object.entries(run.summary||{})){
    for(const [state,s] of Object.entries(m.states||{})){
      out[model+'|'+state+'|count']=s.count;
      for(const [h,x] of Object.entries(s.horizons||{})){
        out[model+'|'+state+'|'+h+'|n']=x.n;
        out[model+'|'+state+'|'+h+'|medianReturn']=x.medianReturn;
        out[model+'|'+state+'|'+h+'|medianMFE']=x.medianMFE;
        out[model+'|'+state+'|'+h+'|medianMAE']=x.medianMAE;
      }
    }
  }
  return out;
}
function compareDatasets(left,right){
  const pairs=[],rightRuns=(right&&right.runs)||[];
  for(const a of (left&&left.runs)||[]){
    const b=rightRuns.find(x=>x.market===a.market&&x.timeframe===a.timeframe&&x.parameterSet===a.parameterSet)
      || rightRuns.find(x=>x.market===a.market&&x.timeframe===a.timeframe);
    if(!b)continue;
    const A=flattenMetrics(a),B=flattenMetrics(b),keys=[...new Set([...Object.keys(A),...Object.keys(B)])].sort();
    const deltas={};
    for(const k of keys){
      const av=A[k],bv=B[k];
      deltas[k]=(Number.isFinite(av)&&Number.isFinite(bv))?bv-av:null;
    }
    pairs.push({
      market:a.market,timeframe:a.timeframe,
      left:{modelVersion:a.modelVersion,parameterSet:a.parameterSet,parameterFingerprint:a.parameterFingerprint},
      right:{modelVersion:b.modelVersion,parameterSet:b.parameterSet,parameterFingerprint:b.parameterFingerprint},
      deltas
    });
  }
  return{
    schemaVersion:1,
    comparedAt:new Date().toISOString(),
    leftEngineVersion:left&&left.engineVersion||null,
    rightEngineVersion:right&&right.engineVersion||null,
    pairs
  };
}
function ensureParent(file){
  const dir=path.dirname(path.resolve(file));
  fs.mkdirSync(dir,{recursive:true});
}
function writeJSON(file,obj){
  ensureParent(file);
  fs.writeFileSync(file,JSON.stringify(obj,null,2)+'\n','utf8');
}
async function main(argv=process.argv.slice(2)){
  const args=parseArgs(argv);
  if(args.help){console.log(usage());return 0}
  const out=args.out||'research/research-output.json';

  if(args.compare){
    const files=parseList(args.compare);
    if(files.length!==2)throw new Error('--compare requires exactly two JSON files');
    const left=JSON.parse(fs.readFileSync(files[0],'utf8')),
          right=JSON.parse(fs.readFileSync(files[1],'utf8')),
          result=compareDatasets(left,right);
    writeJSON(out,result);
    console.log('Compared '+result.pairs.length+' matching runs → '+out);
    return result;
  }

  const markets=parseList(args.market);
  const timeframes=parseList(args.timeframe);
  if(args.input&&(markets.length!==1||timeframes.length!==1)){
    throw new Error('--input requires exactly one --market and one --timeframe');
  }
  let paramSets=null,conditionQueries=null;
  if(args.params)paramSets=JSON.parse(fs.readFileSync(args.params,'utf8'));
  if(args.conditions)conditionQueries=JSON.parse(fs.readFileSync(args.conditions,'utf8'));

  const result=await runBatch({
    markets:markets.length?markets:['BTC'],
    timeframes,
    models:args.models,
    paramSets,
    conditionQueries,
    inputPath:args.input||null
  });
  writeJSON(out,result);
  console.log('Completed '+result.runCount+' research runs → '+out);
  for(const r of result.runs){
    console.log(r.market+' '+r.timeframe+' '+r.parameterSet+' '+r.parameterFingerprint+' evidence='+r.evidence.length+' errors='+r.evidenceErrors.length);
  }
  return result;
}

if(require.main===module){
  main().catch(err=>{console.error(err.stack||err.message||String(err));process.exitCode=1});
}

module.exports={
  SUPPORTED,MODEL_KEYS,parseArgs,parseCSV,aggregate,loadMarketData,
  enabledFromModels,normalizeParamSets,normalizeConditionQueries,evaluateConditionQueries,runResearch,runBatch,
  summarizeRuns,compareDatasets,main
};
