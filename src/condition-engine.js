(function(root,factory){
  const RK=(typeof module==='object'&&module.exports)
    ? require('./research-kernel.js')
    : root.StrategyLabKernel;
  const MS=(typeof module==='object'&&module.exports)
    ? require('./model-semantics.js')
    : root.StrategyLabModelSemantics;
  const api=factory(RK,MS);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabConditionEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(RK,MS){
  'use strict';
  if(!RK)throw new Error('Condition Engine requires Research Kernel');
  if(!MS)throw new Error('Condition Engine requires Model Semantics Registry');

  const VERSION='1.3.0';
  const SEMANTICS_VERSION=MS.VERSION;
  const SEMANTIC_MODELS=MS.list();
  // 保留既有公開集合名稱，讓 Runner/UI 相容；來源改為 G03-R0 的唯一語意登錄。
  const STATE_MODELS=new Set(SEMANTIC_MODELS.filter(x=>x.conditionMode==='state').map(x=>x.model));
  const EVENT_MODELS=new Set(SEMANTIC_MODELS.filter(x=>x.conditionMode==='event').map(x=>x.model));
  const OBSERVATION_MODELS=new Set(SEMANTIC_MODELS.filter(x=>x.conditionMode==='observation').map(x=>x.model));
  const TERMINAL_STATES=Object.fromEntries(
    SEMANTIC_MODELS
      .filter(x=>(x.terminalStates||[]).length)
      .map(x=>[x.model,new Set(x.terminalStates)])
  );

  function clampIndex(x,known){return Math.max(0,Math.min(known,Math.round(x)))}
  function normalizeCondition(input){
    if(!input||!input.model)throw new Error('Condition requires model');
    const model=String(input.model).toLowerCase(),
          state=RK.normalizeState(model,input.state),
          windowBars=Math.max(0,Math.round(Number(input.windowBars)||0)),
          relation=['time','price_overlap','price_touch'].includes(input.relation)?input.relation:'time';
    return{model,state,windowBars,relation};
  }
  function semantics(input){
    const c=normalizeCondition(input),
          mode=MS.conditionMode(c.model);
    if(mode==='state'&&MS.isTerminal(c.model,c.state))return'transition_event';
    if(mode==='state'||mode==='observation'||mode==='event')return mode;
    return'event';
  }
  function conditionKey(input){
    const c=normalizeCondition(input);
    return c.model+'|'+c.state+'|w'+c.windowBars+'|r'+c.relation;
  }
  function eligibleRows(evidence,knownThrough){
    const known=knownThrough==null?Infinity:Math.round(knownThrough);
    return (evidence||[]).filter(e=>{
      if(!e||e.kind==='projection'||!Number.isInteger(e.index)||!e.model||!e.state)return false;
      const knownAt=Number.isInteger(e.detectedAt)?e.detectedAt:e.index;
      return knownAt<=known;
    });
  }
  function matchingRows(evidence,c,kind,knownThrough){
    return eligibleRows(evidence,knownThrough).filter(e=>{
      if(e.model!==c.model||RK.normalizeState(e.model,e.state)!==c.state)return false;
      if(kind==='state')return e.kind==='transition';
      if(kind==='observation')return e.kind==='observation';
      if(kind==='transition_event')return e.kind==='transition';
      return e.kind==='event';
    });
  }
  function priceGeometry(row){
    if(!row||!row.evidence)return null;
    const x=row.evidence||{},model=String(row.model||'').toLowerCase();
    if(['support','macro','basin'].includes(model)&&Number.isFinite(x.bot)&&Number.isFinite(x.top)){
      return{kind:'zone',low:Math.min(x.bot,x.top),high:Math.max(x.bot,x.top),model,evidenceId:row.id||null};
    }
    if(model==='sweep'&&Number.isFinite(x.low)&&Number.isFinite(x.priorLow)){
      // 掃單事件只把「跌破舊低的價格路徑」視為事件區間；收盤價不拿來放大事件價格範圍。
      return{kind:'event_range',low:Math.min(x.low,x.priorLow),high:Math.max(x.low,x.priorLow),model,evidenceId:row.id||null};
    }
    return null;
  }
  function intervalOverlap(a,b){
    if(!a||!b||!Number.isFinite(a.low)||!Number.isFinite(a.high)||!Number.isFinite(b.low)||!Number.isFinite(b.high))return null;
    const low=Math.max(a.low,b.low),high=Math.min(a.high,b.high);
    return high>=low?{kind:'overlap',low,high}:null;
  }
  function buildPresenceDetails(evidence,input,options){
    options=options||{};
    const known=Math.max(0,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          c=normalizeCondition(input),mode=semantics(c),
          present=Array(known+1).fill(false),
          rowsAt=Array.from({length:known+1},()=>[]);

    if(mode==='state'){
      const rows=eligibleRows(evidence,known).filter(e=>e.model===c.model&&e.kind==='transition'),
            groups={};
      for(const e of rows){
        const id=e.entityId||e.id;
        (groups[id]||(groups[id]=[])).push(e);
      }
      for(const seq of Object.values(groups)){
        seq.sort((a,b)=>(a.detectedAt??a.index)-(b.detectedAt??b.index)||a.index-b.index);
        for(let i=0;i<seq.length;i++){
          const e=seq[i],state=RK.normalizeState(e.model,e.state);
          if(state!==c.state)continue;
          const start=clampIndex(e.detectedAt??e.index,known),
                next=i+1<seq.length?(seq[i+1].detectedAt??seq[i+1].index):known+1,
                end=Math.min(known,Math.max(start,Math.round(next)-1));
          for(let j=start;j<=end;j++){present[j]=true;rowsAt[j].push(e)}
        }
      }
      return{condition:c,mode,knownThrough:known,present,rowsAt};
    }

    const rows=matchingRows(evidence,c,mode,known);
    for(const e of rows){
      const at=clampIndex(e.detectedAt??e.index,known),
            end=Math.min(known,at+c.windowBars);
      for(let j=at;j<=end;j++){present[j]=true;rowsAt[j].push(e)}
    }
    return{condition:c,mode,knownThrough:known,present,rowsAt};
  }
  function buildPresence(evidence,input,options){
    return buildPresenceDetails(evidence,input,options);
  }
  function inferKnownThrough(evidence){
    let n=0;
    for(const e of evidence||[])if(e&&Number.isInteger(e.index))n=Math.max(n,e.index);
    return n;
  }
  function episodesFromPresence(present){
    const out=[];
    let start=null;
    for(let i=0;i<=present.length;i++){
      const on=i<present.length&&!!present[i];
      if(on&&start==null)start=i;
      if(!on&&start!=null){
        out.push({index:start,end:i-1,length:i-start});
        start=null;
      }
    }
    return out;
  }
  function matchDetailsAtIndex(details,list,index){
    const anchorRows=details[0]&&details[0].rowsAt[index]||[];
    if(!anchorRows.length)return{match:false,index,region:null,lastOverlap:null,components:[]};

    let branches=anchorRows.map(row=>{
      const geometry=priceGeometry(row);
      return{
        region:geometry&&geometry.kind==='zone'?geometry:null,
        lastOverlap:null,
        components:[{condition:list[0],row,geometry}]
      };
    });

    for(let i=1;i<list.length;i++){
      const c=list[i],candidates=details[i]&&details[i].rowsAt[index]||[];
      if(!candidates.length)return{match:false,index,region:null,lastOverlap:null,components:[]};
      const next=[];

      for(const branch of branches){
        if(c.relation==='time'){
          if(branch.region){
            const row=candidates[0],geometry=priceGeometry(row);
            next.push({...branch,components:[...branch.components,{condition:c,row,geometry}]});
          }else{
            // 前面尚無價格區域時，時間條件可以提供第一個可用的結構區域，
            // 但不會因為是「同時成立」就偷偷要求兩個價格區域相交。
            let expanded=false;
            for(const row of candidates){
              const geometry=priceGeometry(row);
              if(geometry&&geometry.kind==='zone'){
                next.push({...branch,region:geometry,components:[...branch.components,{condition:c,row,geometry}]});
                expanded=true;
              }
            }
            if(!expanded){
              const row=candidates[0],geometry=priceGeometry(row);
              next.push({...branch,components:[...branch.components,{condition:c,row,geometry}]});
            }
          }
          continue;
        }

        if(!branch.region)continue;
        for(const row of candidates){
          const geometry=priceGeometry(row);
          if(!geometry)continue;
          const overlap=intervalOverlap(branch.region,geometry);
          if(!overlap)continue;

          if(c.relation==='price_overlap'&&geometry.kind==='zone'){
            next.push({
              ...branch,region:overlap,lastOverlap:overlap,
              components:[...branch.components,{condition:c,row,geometry}]
            });
          }else if(c.relation==='price_touch'&&geometry.kind==='event_range'){
            next.push({
              ...branch,lastOverlap:overlap,
              components:[...branch.components,{condition:c,row,geometry}]
            });
          }
        }
      }

      if(!next.length)return{match:false,index,region:null,lastOverlap:null,components:[]};
      branches=next;
    }

    const b=branches[0];
    return{match:true,index,region:b.region,lastOverlap:b.lastOverlap,components:b.components};
  }
  function relationSnapshotAtIndex(evidence,conditions,index,options){
    options=options||{};
    const list=(conditions||[]).map(normalizeCondition);
    if(!list.length)return{match:false,index,region:null,lastOverlap:null,components:[]};
    const known=Math.max(index,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          details=list.map(c=>buildPresenceDetails(evidence,c,{knownThrough:known}));
    return matchDetailsAtIndex(details,list,index);
  }
  function conditionGeometryKind(evidence,input,options){
    options=options||{};
    const c=normalizeCondition(input),mode=semantics(c),
          known=options.knownThrough==null?inferKnownThrough(evidence):Math.round(options.knownThrough),
          rows=matchingRows(evidence,c,mode,known);
    for(const row of rows){
      const g=priceGeometry(row);
      if(g)return g.kind;
    }
    return null;
  }
  function availableRelations(evidence,priorConditions,input,options){
    options=options||{};
    const prior=(priorConditions||[]).map(normalizeCondition),c=normalizeCondition(input),
          known=options.knownThrough==null?inferKnownThrough(evidence):Math.round(options.knownThrough),
          priorHasZone=prior.some(x=>conditionGeometryKind(evidence,x,{knownThrough:known})==='zone'),
          kind=conditionGeometryKind(evidence,c,{knownThrough:known}),
          out=['time'];
    if(priorHasZone&&kind==='zone')out.push('price_overlap');
    if(priorHasZone&&kind==='event_range')out.push('price_touch');
    return out;
  }
  function suggestRelation(evidence,priorConditions,input,options){
    const a=availableRelations(evidence,priorConditions,input,options);
    if(a.includes('price_touch'))return'price_touch';
    if(a.includes('price_overlap'))return'price_overlap';
    return'time';
  }
  function episodesForConditions(evidence,conditions,options){
    options=options||{};
    const list=(conditions||[]).map(normalizeCondition);
    if(!list.length)return[];
    const known=Math.max(0,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          layers=list.map(c=>buildPresence(evidence,c,{knownThrough:known}).present),
          anchorEpisodes=episodesFromPresence(layers[0]);
    if(list.length===1)return anchorEpisodes;

    // 舊的純時間條件走原本路徑，確保既有 M5 統計與 Runner 結果不因新增價格關係而改變。
    if(list.slice(1).every(c=>c.relation==='time')){
      const out=[];
      for(const anchor of anchorEpisodes){
        let start=null;
        for(let i=anchor.index;i<=anchor.end;i++){
          if(layers.every(a=>!!a[i])){start=i;break}
        }
        if(start==null)continue;
        let end=start;
        while(end+1<=anchor.end&&layers.every(a=>!!a[end+1]))end++;
        out.push({index:start,end,length:end-start+1});
      }
      return out;
    }

    const details=list.map(c=>buildPresenceDetails(evidence,c,{knownThrough:known})),
          out=[];
    // 仍以第一個條件的 episode 為基準。價格關係只決定某根 K 是否通過，
    // 不允許一個基準 episode 因為多個價格交集而重複貢獻樣本。
    for(const anchor of anchorEpisodes){
      let start=null;
      for(let i=anchor.index;i<=anchor.end;i++){
        if(matchDetailsAtIndex(details,list,i).match){start=i;break}
      }
      if(start==null)continue;
      let end=start;
      while(end+1<=anchor.end&&matchDetailsAtIndex(details,list,end+1).match)end++;
      out.push({index:start,end,length:end-start+1});
    }
    return out;
  }
  function sampleFunnel(evidence,conditions,options){
    options=options||{};
    const list=(conditions||[]).map(normalizeCondition);
    if(!list.length)return[];
    const known=Math.max(0,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          stages=[];
    let previous=null;
    for(let i=0;i<list.length;i++){
      const partial=list.slice(0,i+1),
            episodes=episodesForConditions(evidence,partial,{knownThrough:known}),
            count=episodes.length,
            prev=previous==null?count:previous,
            removed=Math.max(0,prev-count);
      const example=(i>0&&list[i].relation!=='time'&&episodes.length)
        ?relationSnapshotAtIndex(evidence,partial,episodes[episodes.length-1].index,{knownThrough:known})
        :null;
      stages.push({
        index:i,
        addedCondition:list[i],
        relation:list[i].relation,
        conditions:partial,
        episodeCount:count,
        previousEpisodeCount:prev,
        removed,
        retainedRate:i===0?1:(prev>0?count/prev:(count===0?1:0)),
        gate:sampleGate(count),
        example
      });
      previous=count;
    }
    return stages;
  }
  function quantile(a,q){
    const b=(a||[]).filter(Number.isFinite).slice().sort((x,y)=>x-y);
    if(!b.length)return null;
    const p=(b.length-1)*q,lo=Math.floor(p),hi=Math.ceil(p);
    if(lo===hi)return b[lo];
    return b[lo]+(b[hi]-b[lo])*(p-lo);
  }
  function evaluateEpisodes(data,episodes,horizons,knownThrough){
    const out={};
    for(const h of horizons){
      const rows=(episodes||[]).map(ep=>RK.forwardOutcome(data,ep.index,h,knownThrough)),
            complete=rows.filter(Boolean),
            summary=RK.summarizeOutcomes(complete),
            returns=complete.map(x=>x.return);
      out[h]={
        n:complete.length,
        incomplete:Math.max(0,(episodes||[]).length-complete.length),
        upRate:summary?summary.upRate:null,
        downRate:summary?summary.downRate:null,
        flatRate:summary?summary.flatRate:null,
        medianReturn:summary?summary.medianReturn:null,
        medianMFE:summary?summary.medianMFE:null,
        medianMAE:summary?summary.medianMAE:null,
        returnP25:quantile(returns,.25),
        returnP75:quantile(returns,.75)
      };
    }
    return out;
  }
  function sampleGate(n){
    n=Math.max(0,Math.round(Number(n)||0));
    if(n<5)return{level:'insufficient',label:'樣本不足',n};
    if(n<20)return{level:'exploratory',label:'探索性樣本',n};
    return{level:'comparable',label:'可比較樣本',n};
  }
  function compareHorizons(combo,base,horizons){
    const out={};
    for(const h of horizons){
      const a=combo[h]||{},b=base[h]||{};
      const delta=(k)=>Number.isFinite(a[k])&&Number.isFinite(b[k])?a[k]-b[k]:null;
      out[h]={
        deltaMedianReturn:delta('medianReturn'),
        deltaMedianMFE:delta('medianMFE'),
        deltaMedianMAE:delta('medianMAE'),
        deltaUpRate:delta('upRate'),
        comboN:a.n||0,
        baselineN:b.n||0
      };
    }
    return out;
  }
  function evaluateConditions(data,evidence,conditions,options){
    options=options||{};
    const list=(conditions||[]).map(normalizeCondition);
    if(!list.length)throw new Error('At least one condition is required');
    const known=Math.min(
      Array.isArray(data)&&data.length?data.length-1:0,
      Math.max(0,Math.round(options.knownThrough==null?(Array.isArray(data)?data.length-1:inferKnownThrough(evidence)):options.knownThrough))
    );
    const horizons=RK.normalizeHorizons(options.horizons),
          episodes=episodesForConditions(evidence,list,{knownThrough:known}),
          baselineConditions=(options.baselineConditions&&options.baselineConditions.length?options.baselineConditions:[list[0]]).map(normalizeCondition),
          baselineEpisodes=episodesForConditions(evidence,baselineConditions,{knownThrough:known}),
          stats=evaluateEpisodes(data,episodes,horizons,known),
          baselineStats=evaluateEpisodes(data,baselineEpisodes,horizons,known);
    return{
      version:2,engineVersion:VERSION,semanticsVersion:SEMANTICS_VERSION,knownThrough:known,horizons,
      conditions:list,
      semantics:list.map(c=>({condition:c,mode:semantics(c)})),
      episodeCount:episodes.length,
      episodes,
      gate:sampleGate(episodes.length),
      stats,
      baseline:{
        conditions:baselineConditions,
        episodeCount:baselineEpisodes.length,
        gate:sampleGate(baselineEpisodes.length),
        stats:baselineStats
      },
      comparison:compareHorizons(stats,baselineStats,horizons),
      funnel:sampleFunnel(evidence,list,{knownThrough:known}),
      coverage:{
        bars:Array.isArray(data)?data.length:0,
        firstTimestamp:Array.isArray(data)&&data.length?data[0].t:null,
        lastTimestamp:Array.isArray(data)&&data.length?data[data.length-1].t:null
      }
    };
  }
  function candidateConditions(evidence,options){
    options=options||{};
    const known=options.knownThrough==null?Infinity:Math.round(options.knownThrough),
          map=new Map();
    for(const e of eligibleRows(evidence,known)){
      if(e.kind==='snapshot'||e.kind==='projection')continue;
      const c=normalizeCondition({model:e.model,state:e.state,windowBars:0}),
            mode=semantics(c);
      if(mode==='state'&&e.kind!=='transition')continue;
      if(mode==='event'&&e.kind!=='event')continue;
      if(mode==='transition_event'&&e.kind!=='transition')continue;
      if(mode==='observation'&&e.kind!=='observation')continue;
      map.set(conditionKey(c),c);
    }
    return [...map.values()];
  }
  function discoverCompanions(evidence,baseConditions,options){
    options=options||{};
    const base=(Array.isArray(baseConditions)?baseConditions:[baseConditions]).filter(Boolean).map(normalizeCondition),
          known=Math.max(0,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          existing=new Set(base.map(conditionKey)),
          existingModels=new Set(base.map(x=>x.model)),
          maxResults=Math.max(1,Math.round(options.maxResults||8)),
          minEpisodes=Math.max(1,Math.round(options.minEpisodes||1)),
          out=[];
    for(const c of candidateConditions(evidence,{...options,knownThrough:known})){
      if(existing.has(conditionKey(c))||existingModels.has(c.model))continue;
      const episodes=episodesForConditions(evidence,[...base,c],{knownThrough:known});
      if(episodes.length<minEpisodes)continue;
      out.push({condition:c,mode:semantics(c),episodeCount:episodes.length,gate:sampleGate(episodes.length)});
    }
    out.sort((a,b)=>b.episodeCount-a.episodeCount||conditionKey(a.condition).localeCompare(conditionKey(b.condition)));
    return out.slice(0,maxResults);
  }
  function conditionsAtIndex(evidence,index,options){
    options=options||{};
    const known=Math.max(index,Math.round(options.knownThrough==null?inferKnownThrough(evidence):options.knownThrough)),
          out=[];
    for(const c of candidateConditions(evidence,{...options,knownThrough:known})){
      const p=buildPresence(evidence,c,{knownThrough:known}).present;
      if(p[index])out.push({condition:c,mode:semantics(c)});
    }
    return out;
  }

  return{
    VERSION,SEMANTICS_VERSION,STATE_MODELS,EVENT_MODELS,OBSERVATION_MODELS,TERMINAL_STATES,
    normalizeCondition,conditionKey,semantics,priceGeometry,intervalOverlap,
    buildPresenceDetails,buildPresence,episodesFromPresence,relationSnapshotAtIndex,
    conditionGeometryKind,availableRelations,suggestRelation,episodesForConditions,
    sampleFunnel,quantile,evaluateEpisodes,sampleGate,evaluateConditions,
    candidateConditions,discoverCompanions,conditionsAtIndex
  };
});
