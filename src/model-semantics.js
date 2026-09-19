(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabModelSemantics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='1.0.0';

  const RESEARCH_TYPES={
    lifecycle:{id:'lifecycle',label:'結構生命周期',conditionMode:'state'},
    event:{id:'event',label:'市場事件',conditionMode:'event'},
    analogy:{id:'analogy',label:'歷史類比觀察',conditionMode:'observation'},
    external_time:{id:'external_time',label:'外部時間假說',conditionMode:'event'}
  };

  /*
   * G03-R0｜Model Semantics Registry
   *
   * 這裡只定義「模型聲稱自己看到了什麼」以及這份 Evidence 在研究層可扮演的角色。
   * 不在這裡定義報酬好壞，也不把模型成立偷換成未來價格方向。
   *
   * standardPriceGeometry 只代表 Shared Condition Engine 已經正式承認的價格幾何；
   * Field 即使內部有上下界，在尚未建立共用幾何契約前仍維持 null。
   */
  const MODELS={
    support:{
      model:'support',
      label:'支撐區',
      english:'Support Zone',
      researchType:'lifecycle',
      conditionMode:'state',
      primaryQuestion:'這個價格區域是否形成可持續觀察的支撐結構？',
      claim:'模型只描述支撐結構從出現、離開區域、回踩驗證到失效；不直接聲稱後續價格會上漲。',
      states:['potential','candidate','validated','broken'],
      progressionStates:['candidate','validated'],
      confirmationStates:['validated'],
      invalidationStates:['broken'],
      exitStates:[],
      terminalStates:['broken'],
      projectionStates:[],
      standardPriceGeometry:'zone',
      directionalClaim:false,
      allowedRelations:['time','price_overlap'],
      strategyRoles:{
        entry:['validated'],
        filter:['candidate','validated'],
        exit:['broken'],
        context:['potential','candidate','validated','broken']
      }
    },
    macro:{
      model:'macro',
      label:'宏觀底部',
      english:'Macro Bottom',
      researchType:'lifecycle',
      conditionMode:'state',
      primaryQuestion:'深跌與波動擴張後，價格是否完成模型定義的收復確認？',
      claim:'Candidate 只代表候選；只有完成收復才進入確認狀態。確認也不是「底部預測成功」，後續價格仍需另外觀察。',
      states:['candidate','active','broken'],
      rawStateAliases:{confirmed:'active',failed:'broken',expired:'broken'},
      progressionStates:['active'],
      confirmationStates:['active'],
      invalidationStates:['broken'],
      exitStates:[],
      terminalStates:['broken'],
      projectionStates:[],
      standardPriceGeometry:'zone',
      directionalClaim:false,
      allowedRelations:['time','price_overlap'],
      strategyRoles:{
        entry:['active'],
        filter:['candidate','active'],
        exit:['broken'],
        context:['candidate','active','broken']
      }
    },
    sweep:{
      model:'sweep',
      label:'流動性掃單',
      english:'Liquidity Sweep',
      researchType:'event',
      conditionMode:'event',
      primaryQuestion:'價格是否跌破可見舊低後重新收回？',
      claim:'模型只確認「跌破舊低後收回」這個事件已發生；事件後上漲或下跌屬於另外的市場 Outcome。',
      states:['event'],
      progressionStates:[],
      confirmationStates:['event'],
      invalidationStates:[],
      exitStates:[],
      terminalStates:[],
      projectionStates:[],
      standardPriceGeometry:'event_range',
      directionalClaim:false,
      allowedRelations:['time','price_touch'],
      strategyRoles:{
        entry:['event'],
        filter:['event'],
        exit:[],
        context:['event']
      }
    },
    basin:{
      model:'basin',
      label:'盆地辨識',
      english:'Basin Mapper',
      researchType:'lifecycle',
      conditionMode:'state',
      primaryQuestion:'下跌後是否逐漸形成穩定的低位盆地結構？',
      claim:'模型描述下山、著陸、成形、成立與離開盆地的結構進展；不把盆地成立等同於價格必然反轉。',
      states:['landing','forming','active','exit'],
      progressionStates:['forming','active'],
      confirmationStates:['active'],
      invalidationStates:[],
      exitStates:['exit'],
      terminalStates:['exit'],
      projectionStates:[],
      standardPriceGeometry:'zone',
      directionalClaim:false,
      allowedRelations:['time','price_overlap'],
      strategyRoles:{
        entry:['active'],
        filter:['forming','active'],
        exit:['exit'],
        context:['landing','forming','active','exit']
      }
    },
    field:{
      model:'field',
      label:'震盪場',
      english:'Oscillation Field',
      researchType:'lifecycle',
      conditionMode:'state',
      primaryQuestion:'價格是否形成有足夠來回與幾何穩定性的震盪場？',
      claim:'模型描述震盪場從種子、成形、成立到破界；不預測最後會往上或往下突破。',
      states:['seed','forming','active','broken'],
      progressionStates:['forming','active'],
      confirmationStates:['active'],
      invalidationStates:['broken'],
      exitStates:[],
      terminalStates:['broken'],
      projectionStates:[],
      standardPriceGeometry:null,
      directionalClaim:false,
      allowedRelations:['time'],
      strategyRoles:{
        entry:['active'],
        filter:['forming','active'],
        exit:['broken'],
        context:['seed','forming','active','broken']
      }
    },
    echo:{
      model:'echo',
      label:'歷史回聲',
      english:'Echo',
      researchType:'analogy',
      conditionMode:'observation',
      primaryQuestion:'現在這段價格形狀與歷史片段有多相似？',
      claim:'Strong / Weak 只描述形狀相似度；相似不代表歷史會重播，也不構成方向性預測。',
      states:['weak','strong'],
      progressionStates:[],
      confirmationStates:[],
      invalidationStates:[],
      exitStates:[],
      terminalStates:[],
      projectionStates:[],
      standardPriceGeometry:null,
      directionalClaim:false,
      allowedRelations:['time'],
      strategyRoles:{
        entry:[],
        filter:['strong'],
        exit:[],
        context:['weak','strong']
      }
    },
    astro:{
      model:'astro',
      label:'占星時間事件',
      english:'Astrology Engine',
      researchType:'external_time',
      conditionMode:'event',
      primaryQuestion:'外部時間事件與市場後續分布是否存在可重複檢驗的關聯？',
      claim:'模型只記錄外部時間事件；它沒有價格因果主張，也沒有方向性主張。Upcoming 只是資料截止日之後的投影，不是歷史 Evidence。',
      states:['event','upcoming'],
      progressionStates:[],
      confirmationStates:['event'],
      invalidationStates:[],
      exitStates:[],
      terminalStates:[],
      projectionStates:['upcoming'],
      standardPriceGeometry:null,
      directionalClaim:false,
      allowedRelations:['time'],
      strategyRoles:{
        entry:[],
        filter:['event'],
        exit:[],
        context:['event']
      }
    }
  };

  function clone(x){return JSON.parse(JSON.stringify(x))}
  function get(model){
    const x=MODELS[String(model||'').toLowerCase()];
    return x?clone(x):null
  }
  function list(){return Object.keys(MODELS).map(k=>get(k))}
  function typeInfo(type){
    const x=RESEARCH_TYPES[String(type||'')];
    return x?clone(x):null
  }
  function conditionMode(model){
    const x=MODELS[String(model||'').toLowerCase()];
    return x?x.conditionMode:'event'
  }
  function isTerminal(model,state){
    const x=MODELS[String(model||'').toLowerCase()];
    return !!(x&&x.terminalStates.includes(String(state||'').toLowerCase()))
  }
  function isProjectionState(model,state){
    const x=MODELS[String(model||'').toLowerCase()];
    return !!(x&&x.projectionStates.includes(String(state||'').toLowerCase()))
  }
  function allowedRelations(model){
    const x=MODELS[String(model||'').toLowerCase()];
    return x?x.allowedRelations.slice():['time']
  }
  function strategyRoles(model){
    const x=MODELS[String(model||'').toLowerCase()];
    return x?clone(x.strategyRoles):{entry:[],filter:[],exit:[],context:[]}
  }
  function validate(){
    const errors=[];
    const expected=['support','macro','sweep','basin','field','echo','astro'];
    for(const key of expected)if(!MODELS[key])errors.push('missing_model:'+key);
    for(const [key,x] of Object.entries(MODELS)){
      if(x.model!==key)errors.push('model_key:'+key);
      if(!RESEARCH_TYPES[x.researchType])errors.push('research_type:'+key);
      if(RESEARCH_TYPES[x.researchType]&&RESEARCH_TYPES[x.researchType].conditionMode!==x.conditionMode)errors.push('condition_mode:'+key);
      if(x.directionalClaim!==false)errors.push('directional_claim:'+key);
      const known=new Set(x.states);
      for(const bucket of ['progressionStates','confirmationStates','invalidationStates','exitStates','terminalStates','projectionStates']){
        for(const state of x[bucket]||[])if(!known.has(state))errors.push(bucket+':'+key+':'+state);
      }
      for(const bucket of ['entry','filter','exit','context']){
        for(const state of (x.strategyRoles&&x.strategyRoles[bucket])||[])if(!known.has(state))errors.push('strategy_'+bucket+':'+key+':'+state);
      }
      for(const rel of x.allowedRelations||[])if(!['time','price_overlap','price_touch'].includes(rel))errors.push('relation:'+key+':'+rel);
    }
    return{ok:errors.length===0,errors}
  }

  return{
    VERSION,
    RESEARCH_TYPES:clone(RESEARCH_TYPES),
    MODELS:clone(MODELS),
    get,
    list,
    typeInfo,
    conditionMode,
    isTerminal,
    isProjectionState,
    allowedRelations,
    strategyRoles,
    validate
  };
});
