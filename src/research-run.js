(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabResearchRun=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='1.0.0';
  let SEQ=0;

  const PHASES=[
    {id:'input',label:'固定研究條件',education:'先固定市場、週期、模型與參數。研究執行中不原地改條件；任何修改都建立新的 Run ID。'},
    {id:'scan',label:'依時間掃描 Evidence',education:'模型按時間順序讀資料；某根 K 的 Evidence 只能使用當時已經存在的資訊。'},
    {id:'evaluate',label:'整理歷史觀察',education:'Evidence 形成後才整理完整／未完整的後續觀察；這一步不回頭改寫當時 Evidence。'},
    {id:'reliability',label:'檢查研究可信度',education:'樣本數只是其中一項；還要看有效獨立案例、時間覆蓋、OOS 與資料完整性。'}
  ];

  function clone(x){return x==null?x:JSON.parse(JSON.stringify(x))}
  function stable(x){
    if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
    if(x&&typeof x==='object'){
      return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
    }
    return JSON.stringify(x)
  }
  function fnv1a(s){
    let h=0x811c9dc5;
    s=String(s||'');
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}
    return (h>>>0).toString(16).padStart(8,'0')
  }
  function deepFreeze(x){
    if(!x||typeof x!=='object'||Object.isFrozen(x))return x;
    Object.freeze(x);
    for(const v of Object.values(x))deepFreeze(v);
    return x
  }
  function isoFrom(x){
    if(x instanceof Date)return x.toISOString();
    if(typeof x==='string'&&x)return new Date(x).toISOString();
    if(Number.isFinite(Number(x)))return new Date(Number(x)).toISOString();
    return new Date().toISOString()
  }
  function runId(spec){
    SEQ++;
    const at=isoFrom(spec&&spec.startedAt),
          seed={
            at,seq:SEQ,
            market:spec&&spec.market||'CUSTOM',
            timeframe:spec&&spec.timeframe||'1d',
            fingerprint:spec&&spec.parameterFingerprint||null,
            preset:spec&&spec.preset||null,
            nonce:spec&&spec.runNonce||null
          };
    return 'run-'+at.replace(/[-:.TZ]/g,'').slice(0,14)+'-'+String(SEQ).padStart(3,'0')+'-'+fnv1a(stable(seed)).slice(0,6)
  }
  function rangeOf(data){
    return{
      bars:Array.isArray(data)?data.length:0,
      start:Array.isArray(data)&&data.length?data[0].t:null,
      end:Array.isArray(data)&&data.length?data[data.length-1].t:null
    }
  }
  function phaseRows(status){
    return PHASES.map(x=>({...x,status:status||'pending'}))
  }
  function start(data,spec){
    spec=spec||{};
    const startedAt=isoFrom(spec.startedAt),
          out={
            version:1,
            runnerVersion:VERSION,
            runId:runId({...spec,startedAt}),
            startedAt,
            completedAt:null,
            status:'running',
            locked:true,
            market:String(spec.market||'CUSTOM'),
            timeframe:String(spec.timeframe||'1d').toLowerCase(),
            source:String(spec.source||''),
            dataRange:rangeOf(data),
            dataCutoff:Array.isArray(data)&&data.length?data[data.length-1].t:null,
            knownThrough:Array.isArray(data)&&data.length?data.length-1:null,
            models:Array.isArray(spec.models)?spec.models.slice():[],
            preset:clone(spec.preset||null),
            parameterSnapshot:clone(spec.parameterSnapshot||{}),
            parameterFingerprint:spec.parameterFingerprint||null,
            modelVersion:spec.modelVersion||null,
            kernelVersion:spec.kernelVersion||null,
            conditionEngineVersion:spec.conditionEngineVersion||null,
            semanticsVersion:spec.semanticsVersion||null,
            reliabilityStandardVersion:spec.reliabilityStandardVersion||null,
            evidenceCount:null,
            evidenceErrors:null,
            phases:phaseRows('pending')
          };
    out.phases[0].status='completed';
    out.phases[1].status='running';
    return deepFreeze(out)
  }
  function complete(manifest,result,extra){
    result=result||{};extra=extra||{};
    const out=clone(manifest);
    out.completedAt=isoFrom(extra.completedAt);
    out.status=extra.status||'completed';
    out.parameterFingerprint=result.parameterFingerprint||out.parameterFingerprint;
    out.modelVersion=result.engineVersion||result.modelVersion||out.modelVersion;
    out.kernelVersion=result.kernelVersion||out.kernelVersion;
    out.conditionEngineVersion=extra.conditionEngineVersion||out.conditionEngineVersion;
    out.semanticsVersion=extra.semanticsVersion||out.semanticsVersion;
    out.reliabilityStandardVersion=extra.reliabilityStandardVersion||out.reliabilityStandardVersion;
    out.evidenceCount=Array.isArray(result.evidenceLog)?result.evidenceLog.length:
      Array.isArray(result.evidence)?result.evidence.length:Number(extra.evidenceCount)||0;
    out.evidenceErrors=Array.isArray(result.evidenceErrors)?result.evidenceErrors.length:Number(extra.evidenceErrors)||0;
    out.phases=phaseRows('completed');
    if(out.status!=='completed'){
      const last=out.phases[out.phases.length-1];
      last.status='warning'
    }
    return deepFreeze(out)
  }
  function createCompleted(data,result,spec){
    spec=spec||{};
    const startManifest=start(data,{
      ...spec,
      parameterFingerprint:result&&result.parameterFingerprint||spec.parameterFingerprint,
      modelVersion:result&&result.engineVersion||result&&result.modelVersion||spec.modelVersion,
      kernelVersion:result&&result.kernelVersion||spec.kernelVersion
    });
    return complete(startManifest,result,spec)
  }
  function explain(manifest){
    if(!manifest)return[];
    return (manifest.phases||[]).map(x=>({
      id:x.id,label:x.label,status:x.status,education:x.education
    }))
  }

  return{
    VERSION,PHASES:clone(PHASES),
    stableStringify:stable,fnv1a,deepFreeze,
    start,complete,createCompleted,explain
  };
});
