(function(root,factory){
  const RK=(typeof module==='object'&&module.exports)?require('./research-kernel.js'):root.StrategyLabKernel;
  const MS=(typeof module==='object'&&module.exports)?require('./model-semantics.js'):root.StrategyLabModelSemantics;
  const api=factory(RK,MS);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabReliability=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(RK,MS){
  'use strict';
  if(!RK)throw new Error('Reliability Engine requires Research Kernel');
  if(!MS)throw new Error('Reliability Engine requires Model Semantics Registry');

  const VERSION='1.0.0';
  const DEFAULT_HORIZON=10;
  const DEFAULT_SPLIT=.70;
  const LEVELS={
    insufficient:{id:'insufficient',label:'不足',rank:0},
    exploratory:{id:'exploratory',label:'探索',rank:1},
    researchable:{id:'researchable',label:'可研究',rank:2},
    robust:{id:'robust',label:'較穩健',rank:3}
  };
  const WEAKNESS={
    DATA_SHORTAGE:'DATA_SHORTAGE',
    NATURALLY_RARE:'NATURALLY_RARE',
    PARAMETER_TOO_STRICT:'PARAMETER_TOO_STRICT',
    OVERLAP_HEAVY:'OVERLAP_HEAVY',
    OOS_SHORTAGE:'OOS_SHORTAGE',
    LIFECYCLE_IMBALANCE:'LIFECYCLE_IMBALANCE',
    MODEL_LIMITATION:'MODEL_LIMITATION'
  };

  function clone(x){return x==null?x:JSON.parse(JSON.stringify(x))}
  function finite(x){return Number.isFinite(Number(x))}
  function yearFromEpoch(t){
    if(!finite(t))return null;
    return new Date(Number(t)*1000).getUTCFullYear()
  }
  function yearsBetween(a,b){
    if(!finite(a)||!finite(b)||b<a)return 0;
    return (Number(b)-Number(a))/(365.2425*86400)
  }
  function sampleBand(n){
    n=Math.max(0,Math.round(Number(n)||0));
    if(n<5)return{id:'case',label:'個案級',n};
    if(n<20)return{id:'explore',label:'探索',n};
    if(n<50)return{id:'compare',label:'初步可比較',n};
    if(n<100)return{id:'ample',label:'較充足',n};
    return{id:'large',label:'大量案例',n}
  }
  function dataIntegrity(data,options){
    options=options||{};
    const errors=[],warnings=[];
    if(!Array.isArray(data)||!data.length){
      return{pass:false,errors:['NO_DATA'],warnings,rows:0,duplicateTimestamps:0,invalidRows:0,nonMonotonic:0,maxGapMultiple:null}
    }
    let duplicateTimestamps=0,invalidRows=0,nonMonotonic=0,prev=null;
    const seen=new Set(),steps=[];
    for(let i=0;i<data.length;i++){
      const x=data[i]||{},t=Number(x.t),o=Number(x.o),h=Number(x.h),l=Number(x.l),c=Number(x.c);
      if(![t,o,h,l,c].every(Number.isFinite)||h<Math.max(o,c,l)||l>Math.min(o,c,h)||h<l){
        invalidRows++;
      }
      if(Number.isFinite(t)){
        if(seen.has(t))duplicateTimestamps++;
        seen.add(t);
        if(prev!=null){
          if(t<=prev)nonMonotonic++;
          else steps.push(t-prev)
        }
        prev=t
      }
    }
    if(invalidRows)errors.push('INVALID_OHLC');
    if(duplicateTimestamps)errors.push('DUPLICATE_TIMESTAMP');
    if(nonMonotonic)errors.push('NON_MONOTONIC_TIME');
    const coverage=options.coverage||{};
    if(coverage.fetchInterrupted)errors.push('SOURCE_INTERRUPTED');
    if(coverage.targetReached===false&&!coverage.historyExhausted)warnings.push('TARGET_NOT_REACHED');
    let maxGapMultiple=null;
    if(steps.length){
      const sorted=steps.slice().sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)]||0,
            max=Math.max(...steps);
      maxGapMultiple=median>0?max/median:null;
      const threshold=String(options.market||'').toUpperCase()==='BTC'?3.1:8.5;
      if(maxGapMultiple!=null&&maxGapMultiple>threshold)warnings.push('LARGE_TIME_GAP');
    }
    return{
      pass:errors.length===0,
      errors,warnings,rows:data.length,
      duplicateTimestamps,invalidRows,nonMonotonic,maxGapMultiple,
      coverage:clone(coverage)
    }
  }
  function evidenceKindFor(model,state){
    const mode=MS.conditionMode(model);
    if(mode==='state')return MS.isTerminal(model,state)?'transition':'transition';
    if(mode==='observation')return'observation';
    return'event'
  }
  function matchingEvidence(evidence,model,state,knownThrough){
    const target=RK.normalizeState(model,state),kind=evidenceKindFor(model,target),
          known=knownThrough==null?Infinity:Math.round(knownThrough);
    return (evidence||[]).filter(e=>{
      if(!e||e.kind==='projection'||e.model!==model||!Number.isInteger(e.index))return false;
      const knownAt=Number.isInteger(e.detectedAt)?e.detectedAt:e.index;
      if(knownAt>known)return false;
      if(RK.normalizeState(e.model,e.state)!==target)return false;
      return e.kind===kind
    }).sort((a,b)=>a.index-b.index||String(a.id||'').localeCompare(String(b.id||'')))
  }
  function completeEvidence(data,rows,horizon,knownThrough,limitEndExclusive){
    horizon=Math.max(1,Math.round(Number(horizon)||DEFAULT_HORIZON));
    const known=Math.min(
      Array.isArray(data)&&data.length?data.length-1:-1,
      knownThrough==null?(Array.isArray(data)?data.length-1:-1):Math.round(knownThrough)
    );
    return (rows||[]).filter(e=>{
      const end=e.index+horizon;
      if(e.index<0||end>known)return false;
      if(Number.isInteger(limitEndExclusive)&&end>=limitEndExclusive)return false;
      return !!RK.forwardOutcome(data,e.index,horizon,known)
    })
  }
  function overlapClusters(rows,horizon){
    horizon=Math.max(1,Math.round(Number(horizon)||DEFAULT_HORIZON));
    const sorted=(rows||[]).filter(e=>Number.isInteger(e.index)).slice().sort((a,b)=>a.index-b.index),
          clusters=[];
    for(const e of sorted){
      const start=e.index,end=e.index+horizon,last=clusters[clusters.length-1];
      if(!last||start>last.end){
        clusters.push({start,end,count:1,ids:[e.id||null]})
      }else{
        last.end=Math.max(last.end,end);last.count++;last.ids.push(e.id||null)
      }
    }
    return{nEff:clusters.length,clusters}
  }
  function temporalCoverage(rows){
    const a=(rows||[]).filter(e=>finite(e.timestamp)).slice().sort((x,y)=>x.timestamp-y.timestamp);
    if(!a.length)return{
      firstTimestamp:null,lastTimestamp:null,spanYears:0,yearsRepresented:0,maxYearShare:null,yearCounts:{}
    };
    const yearCounts={};
    for(const e of a){
      const y=yearFromEpoch(e.timestamp);
      if(y!=null)yearCounts[y]=(yearCounts[y]||0)+1
    }
    const vals=Object.values(yearCounts),max=Math.max(...vals);
    return{
      firstTimestamp:a[0].timestamp,
      lastTimestamp:a[a.length-1].timestamp,
      spanYears:yearsBetween(a[0].timestamp,a[a.length-1].timestamp),
      yearsRepresented:Object.keys(yearCounts).length,
      maxYearShare:a.length?max/a.length:null,
      yearCounts
    }
  }
  function lifecycleCoverage(evidence,model,knownThrough){
    const sem=MS.get(model),known=knownThrough==null?Infinity:Math.round(knownThrough),
          states={},entities=new Set();
    for(const e of evidence||[]){
      if(!e||e.model!==model||e.kind==='projection'||!Number.isInteger(e.index))continue;
      const knownAt=Number.isInteger(e.detectedAt)?e.detectedAt:e.index;
      if(knownAt>known)continue;
      const state=RK.normalizeState(model,e.state);
      states[state]=(states[state]||0)+1;
      if(e.entityId)entities.add(e.entityId)
    }
    const confirmation=(sem&&sem.confirmationStates||[]).reduce((n,s)=>n+(states[s]||0),0),
          terminal=(sem&&sem.terminalStates||[]).reduce((n,s)=>n+(states[s]||0),0),
          invalidation=(sem&&sem.invalidationStates||[]).reduce((n,s)=>n+(states[s]||0),0),
          exit=(sem&&sem.exitStates||[]).reduce((n,s)=>n+(states[s]||0),0);
    return{
      states,entities:entities.size,confirmation,terminal,invalidation,exit,
      hasConfirmation:confirmation>0,
      hasCounterexample:(terminal+invalidation+exit)>0
    }
  }
  function splitPlan(data,fraction){
    fraction=Number.isFinite(Number(fraction))?Math.min(.9,Math.max(.5,Number(fraction))):DEFAULT_SPLIT;
    const bars=Array.isArray(data)?data.length:0,
          splitIndex=bars?Math.max(1,Math.min(bars-1,Math.floor(bars*fraction))):0;
    return{
      fraction,
      splitIndex,
      calibrationStart:bars?data[0].t:null,
      calibrationEnd:bars&&splitIndex>0?data[splitIndex-1].t:null,
      validationStart:bars&&splitIndex<bars?data[splitIndex].t:null,
      validationEnd:bars?data[bars-1].t:null
    }
  }
  function oosCounts(data,rows,horizon,plan,knownThrough){
    const calibrationRows=(rows||[]).filter(e=>e.index<plan.splitIndex),
          validationRows=(rows||[]).filter(e=>e.index>=plan.splitIndex),
          calibrationComplete=completeEvidence(data,calibrationRows,horizon,knownThrough,plan.splitIndex),
          validationComplete=completeEvidence(data,validationRows,horizon,knownThrough),
          cEff=overlapClusters(calibrationComplete,horizon).nEff,
          vEff=overlapClusters(validationComplete,horizon).nEff;
    return{
      calibration:{total:calibrationRows.length,complete:calibrationComplete.length,nEff:cEff},
      validation:{total:validationRows.length,complete:validationComplete.length,nEff:vEff}
    }
  }
  function overallLevel(input){
    const n=input.nComplete,nEff=input.nEff,oos=input.oosComplete,
          span=input.spanYears,integrity=input.integrityPass,stable=input.parameterStability;
    if(!integrity||n<5||nEff<3)return LEVELS.insufficient;
    if(n<20||nEff<8||oos<3||span<1)return LEVELS.exploratory;
    if(n>=50&&nEff>=20&&oos>=10&&span>=3&&stable===true)return LEVELS.robust;
    return LEVELS.researchable
  }
  function weaknessReasons(ctx){
    const out=[],dataSpan=ctx.dataSpanYears;
    if(!ctx.integrity.pass||ctx.dataBars<120||dataSpan<.5)out.push(WEAKNESS.DATA_SHORTAGE);
    if(ctx.nComplete>0&&ctx.nEff/ctx.nComplete<.55)out.push(WEAKNESS.OVERLAP_HEAVY);
    if(ctx.oos.validation.complete<5)out.push(WEAKNESS.OOS_SHORTAGE);
    if(ctx.semanticType==='lifecycle'&&ctx.lifecycle.entities>=5){
      if(!ctx.lifecycle.hasConfirmation||!ctx.lifecycle.hasCounterexample)out.push(WEAKNESS.LIFECYCLE_IMBALANCE)
    }
    if(ctx.model==='macro'&&dataSpan>=4&&ctx.nTotal<20)out.push(WEAKNESS.NATURALLY_RARE);
    if(ctx.nTotal===0&&ctx.dataBars>=300)out.push(WEAKNESS.MODEL_LIMITATION);
    return [...new Set(out)]
  }
  function reasonText(code){
    return({
      DATA_SHORTAGE:'行情資料本身不足或資料完整性未通過。',
      NATURALLY_RARE:'這個模型研究的是低頻市場事件；歷史完整不代表統計樣本自然會很多。',
      PARAMETER_TOO_STRICT:'目前設定可能把可研究案例壓得過少；需要和較寬設定做語意一致的比較。',
      OVERLAP_HEAVY:'很多案例共享同一段後續行情，原始 N 高於有效獨立案例。',
      OOS_SHORTAGE:'時間後段的盲測案例仍少，尚不足以支撐較強的歷史比較。',
      LIFECYCLE_IMBALANCE:'生命周期資料偏向單一階段，確認／失效／退出等反例覆蓋不足。',
      MODEL_LIMITATION:'在這個市場與週期，模型目前幾乎無法形成可研究 Evidence。'
    })[code]||code
  }
  function levelReasons(level,ctx){
    const out=[];
    if(!ctx.integrity.pass)out.push('資料完整性 gate 未通過');
    if(ctx.nComplete<5)out.push('完整觀察少於 5 次');
    else if(ctx.nComplete<20)out.push('完整觀察仍屬探索樣本');
    if(ctx.nEff<3)out.push('有效獨立案例少於 3');
    else if(ctx.nEff<8)out.push('有效獨立案例仍偏少');
    if(ctx.oos.validation.complete<3)out.push('OOS 完整案例少於 3');
    if(ctx.coverage.spanYears<1)out.push('案例時間跨度不足 1 年');
    if(level.id==='robust')out.push('樣本、獨立性、時間跨度、OOS 與參數穩定 gate 同時達標');
    if(!out.length)out.push('主要資料 gate 已達可研究門檻，但仍只代表歷史研究品質');
    return out
  }
  function evaluateModelState(data,evidence,options){
    options=options||{};
    const model=String(options.model||'').toLowerCase(),
          sem=MS.get(model);
    if(!sem)throw new Error('Unknown reliability model '+model);
    const state=RK.normalizeState(model,options.state),
          horizon=Math.max(1,Math.round(Number(options.horizon)||DEFAULT_HORIZON)),
          known=options.knownThrough==null?(Array.isArray(data)?data.length-1:-1):Math.round(options.knownThrough),
          rows=matchingEvidence(evidence,model,state,known),
          complete=completeEvidence(data,rows,horizon,known),
          eff=overlapClusters(complete,horizon),
          coverage=temporalCoverage(complete),
          integrity=dataIntegrity(data,{market:options.market,coverage:options.marketCoverage}),
          lifecycle=lifecycleCoverage(evidence,model,known),
          plan=splitPlan(data,options.splitFraction),
          oos=oosCounts(data,rows,horizon,plan,known),
          dataSpanYears=Array.isArray(data)&&data.length?yearsBetween(data[0].t,data[data.length-1].t):0,
          parameterStability=options.parameterStability===true?true:options.parameterStability===false?false:null,
          ctx={
            model,state,semanticType:sem.researchType,
            dataBars:Array.isArray(data)?data.length:0,dataSpanYears,
            integrity,nTotal:rows.length,nComplete:complete.length,nIncomplete:Math.max(0,rows.length-complete.length),
            nEff:eff.nEff,coverage,lifecycle,oos,parameterStability
          },
          level=overallLevel({
            nComplete:ctx.nComplete,nEff:ctx.nEff,oosComplete:oos.validation.complete,
            spanYears:coverage.spanYears,integrityPass:integrity.pass,parameterStability
          }),
          weaknesses=weaknessReasons(ctx);
    return{
      version:1,
      standardVersion:VERSION,
      model,state,
      researchType:sem.researchType,
      horizon,
      knownThrough:known,
      counts:{
        total:ctx.nTotal,
        complete:ctx.nComplete,
        incomplete:ctx.nIncomplete,
        nEff:ctx.nEff
      },
      sampleBand:sampleBand(ctx.nComplete),
      integrity,
      coverage,
      lifecycle,
      split:plan,
      oos,
      parameterStability,
      level:clone(level),
      reasons:levelReasons(level,ctx),
      weaknesses,
      weaknessDetails:weaknesses.map(code=>({code,text:reasonText(code)})),
      independence:{
        method:'overlap_cluster',
        explanation:'完整案例的後續觀察窗口若互相重疊，歸入同一群；每群只算一個有效獨立案例。',
        clusterCount:eff.nEff,
        clusters:eff.clusters
      },
      disclaimer:'Reliability 只描述歷史研究資料品質，不是模型準確率、成功率或未來預測信心。'
    }
  }
  function comparePresetCells(cells){
    const rows=(cells||[]).filter(Boolean),by={};
    for(const c of rows)by[c.presetLevel||c.presetId]=c;
    const loose=by.loose||by.sensitive,balanced=by.balanced,strict=by.strict||by.selective;
    const sequence=[loose,balanced,strict].filter(Boolean),
          counts=sequence.map(c=>c.reliability&&c.reliability.counts?c.reliability.counts.total:0),
          monotonic=counts.every((x,i)=>i===0||counts[i-1]>=x);
    return{monotonic,counts}
  }
  function diagnosePresetCell(cell,peers){
    const base=(cell.reliability&&cell.reliability.weaknesses||[]).slice(),
          current=cell.reliability&&cell.reliability.counts?cell.reliability.counts.total:0,
          loose=(peers||[]).find(x=>(x.presetLevel||x.presetId)==='loose'||x.presetId==='sensitive'),
          looseN=loose&&loose.reliability&&loose.reliability.counts?loose.reliability.counts.total:null;
    if(current<20&&Number.isFinite(looseN)&&looseN>=Math.max(20,current*1.8)&&cell.presetLevel!=='loose'){
      base.push(WEAKNESS.PARAMETER_TOO_STRICT)
    }
    return [...new Set(base)]
  }

  return{
    VERSION,DEFAULT_HORIZON,DEFAULT_SPLIT,LEVELS:clone(LEVELS),WEAKNESS:clone(WEAKNESS),
    sampleBand,dataIntegrity,matchingEvidence,completeEvidence,overlapClusters,temporalCoverage,
    lifecycleCoverage,splitPlan,oosCounts,overallLevel,reasonText,
    evaluateModelState,comparePresetCells,diagnosePresetCell
  };
});
