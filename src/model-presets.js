(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StrategyLabModelPresets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='2.0.0-g03-calibrated';
  const PRESETS={
    support:[
      {id:'sensitive',level:'loose',title:'寬鬆',intent:'較容易把相對低點納入支撐研究，增加邊界案例；不代表比較準。',config:{zone:{pivot:3,atr:14,width:.72,breakAtr:.42}}},
      {id:'balanced',level:'balanced',title:'平衡',intent:'保留模型主要尺度，在案例量與支撐結構要求之間取中間位置。',config:{zone:{pivot:5,atr:14,width:.8,breakAtr:.5}}},
      {id:'selective',level:'strict',title:'嚴格',intent:'只留下更明顯的支撐結構；案例會更少，不代表預測更準。',config:{zone:{pivot:10,atr:14,width:.9,breakAtr:.6}}}
    ],
    macro:[
      {id:'sensitive',level:'loose',title:'寬鬆',intent:'降低深跌與波動門檻，讓更多宏觀候選進入觀察；不把增加樣本當成底部預測。',config:{macro:{p:{
        '1h':{dd:.08,atrX:1.05,confirm:30},'4h':{dd:.11,atrX:1.05,confirm:22},'1d':{dd:.15,atrX:1.05,confirm:16},
        '1w':{dd:.24,atrX:1.02,confirm:8},'1m':{dd:.24,atrX:1.00,confirm:6}
      }}}},
      {id:'balanced',level:'balanced',title:'平衡',intent:'使用模型主要的回撤、波動與確認期限，作為一般研究起點。',config:{macro:{}}},
      {id:'selective',level:'strict',title:'嚴格',intent:'要求更深回撤、更明顯波動與更短確認期限；稀有事件仍可能維持小樣本。',config:{macro:{p:{
        '1h':{dd:.12,atrX:1.22,confirm:20},'4h':{dd:.17,atrX:1.22,confirm:15},'1d':{dd:.24,atrX:1.20,confirm:10},
        '1w':{dd:.32,atrX:1.12,confirm:6},'1m':{dd:.32,atrX:1.08,confirm:4}
      }}}}
    ],
    sweep:[
      {id:'sensitive',level:'loose',title:'寬鬆',intent:'固定同一個舊低回看尺度，只降低收回位置要求，讓三層條件真正可比較。',config:{sweep:{lookback:{'1h':48,'4h':42,'1d':30,'1w':20,'1m':12},minClosePosition:.45}}},
      {id:'balanced',level:'balanced',title:'平衡',intent:'固定同一個舊低尺度，要求收盤回到整根 K 的 55% 以上。',config:{sweep:{lookback:{'1h':48,'4h':42,'1d':30,'1w':20,'1m':12},minClosePosition:.55}}},
      {id:'selective',level:'strict',title:'嚴格',intent:'固定同一個舊低尺度，只提高收回強度要求；案例更少但不代表更會上漲。',config:{sweep:{lookback:{'1h':48,'4h':42,'1d':30,'1w':20,'1m':12},minClosePosition:.68}}}
    ],
    basin:[
      {id:'sensitive',level:'loose',title:'寬鬆',intent:'保持相同盆地尺度搜尋，只降低成立分數門檻，避免不同尺度造成非單調樣本。',config:{exp:{basin:{floorMin:10,floorMax:80,cliffMax:60,threshold:56}}}},
      {id:'balanced',level:'balanced',title:'平衡',intent:'使用相同尺度搜尋與 60 分成立門檻，作為盆地主要研究設定。',config:{exp:{basin:{floorMin:10,floorMax:80,cliffMax:60,threshold:60}}}},
      {id:'selective',level:'strict',title:'嚴格',intent:'保持相同盆地尺度搜尋，只提高成立門檻；案例會更少，不代表更準。',config:{exp:{basin:{floorMin:10,floorMax:80,cliffMax:60,threshold:64}}}}
    ],
    field:[
      {id:'sensitive',level:'loose',title:'寬鬆',intent:'允許較少震盪回合、較大幾何變化與較低貼合度，較容易形成場域。',config:{exp:{spring:{minCycles:1.5,maxCoreShiftPct:90,maxShapeChangePct:85,minFitPct:72,breakConfirmBars:2}}}},
      {id:'balanced',level:'balanced',title:'平衡',intent:'使用模型主要的震盪、貼合與幾何限制。',config:{exp:{spring:{minCycles:2,maxCoreShiftPct:65,maxShapeChangePct:60,minFitPct:82,breakConfirmBars:2}}}},
      {id:'selective',level:'strict',title:'嚴格',intent:'要求更多來回、更高貼合與較小變形；案例會更少，不代表突破方向更可預測。',config:{exp:{spring:{minCycles:3,maxCoreShiftPct:45,maxShapeChangePct:40,minFitPct:90,breakConfirmBars:3}}}}
    ],
    echo:[
      {id:'sensitive',level:'loose',title:'寬鬆',intent:'固定 32 根型態與相同搜尋歷史，只降低相似門檻，讓三層 Strong Evidence 可直接比較。',config:{exp:{echo:{length:32,history:1200,similarity:.74,followBars:12}}}},
      {id:'balanced',level:'balanced',title:'平衡',intent:'固定相同型態長度與搜尋歷史，以 78% 作為 Strong 的中間門檻。',config:{exp:{echo:{length:32,history:1200,similarity:.78,followBars:12}}}},
      {id:'selective',level:'strict',title:'嚴格',intent:'固定相同型態長度與搜尋歷史，只提高 Strong 門檻到 82%；嚴格不代表更準，相似也不等於歷史重演。',config:{exp:{echo:{length:32,history:1200,similarity:.82,followBars:12}}}}
    ],
    astro:[
      {id:'sensitive',level:'loose',title:'寬鬆',intent:'納入較廣事件集合；事件數很多也不代表有更多獨立證據或因果。',config:{exp:{astro:{planetSet:'modern',aspectSet:'major',orb:6,retro:'on',ingress:'on'}}}},
      {id:'balanced',level:'balanced',title:'平衡',intent:'使用傳統七曜與主要相位，作為外部時間假說的主要研究設定。',config:{exp:{astro:{planetSet:'classic',aspectSet:'major',orb:4,retro:'off',ingress:'off'}}}},
      {id:'selective',level:'strict',title:'嚴格',intent:'只保留傳統七曜的主要緊張相位並縮小 Orb；不因此產生價格因果主張。',config:{exp:{astro:{planetSet:'classic',aspectSet:'hard',orb:2,retro:'off',ingress:'off'}}}}
    ]
  };
  const VALIDATION={
    validatedAt:'2026-09-19',
    basis:'G03 calibration uses Evidence density, effective independent N, lifecycle/time coverage, parameter-neighborhood stability and chronological OOS counts. Presets are not selected by return ranking.',
    contexts:[
      {market:'BTC',timeframe:'1d',bars:1800},{market:'BTC',timeframe:'1w',bars:700},
      {market:'IXIC',timeframe:'1d',bars:1800},{market:'TWII',timeframe:'1d',bars:1800},
      {market:'IXIC',timeframe:'1w',bars:700},{market:'TWII',timeframe:'1w',bars:700},
      {market:'IXIC',timeframe:'1m',bars:300},{market:'TWII',timeframe:'1m',bars:300}
    ],
    models:{
      support:{primaryState:'potential',ordering:{ids:['sensitive','balanced','selective'],values:[415,332,222],pass:true},presets:{
        sensitive:{count:415,n10:412,nEff:319,oosComplete:121,oosNEff:94,contextsWithSamples:8,errors:0,parameterStability:true},
        balanced:{count:332,n10:326,nEff:276,oosComplete:92,oosNEff:80,contextsWithSamples:8,errors:0,parameterStability:true},
        selective:{count:222,n10:220,nEff:196,oosComplete:59,oosNEff:55,contextsWithSamples:8,errors:0,parameterStability:true}
      }},
      macro:{primaryState:'candidate',ordering:{ids:['sensitive','balanced','selective'],values:[85,52,39],pass:true},presets:{
        sensitive:{count:85,n10:85,nEff:63,oosComplete:22,oosNEff:17,contextsWithSamples:8,errors:0,parameterStability:true},
        balanced:{count:52,n10:52,nEff:35,oosComplete:17,oosNEff:10,contextsWithSamples:8,errors:0,parameterStability:true},
        selective:{count:39,n10:39,nEff:29,oosComplete:10,oosNEff:7,contextsWithSamples:7,errors:0,parameterStability:true}
      }},
      sweep:{primaryState:'event',ordering:{ids:['sensitive','balanced','selective'],values:[150,133,111],pass:true},presets:{
        sensitive:{count:150,n10:150,nEff:96,oosComplete:46,oosNEff:28,contextsWithSamples:8,errors:0,parameterStability:true},
        balanced:{count:133,n10:133,nEff:94,oosComplete:40,oosNEff:27,contextsWithSamples:8,errors:0,parameterStability:true},
        selective:{count:111,n10:111,nEff:84,oosComplete:34,oosNEff:24,contextsWithSamples:8,errors:0,parameterStability:true}
      }},
      basin:{primaryState:'active',ordering:{ids:['sensitive','balanced','selective'],values:[68,57,52],pass:true},presets:{
        sensitive:{count:68,n10:68,nEff:63,oosComplete:20,oosNEff:18,contextsWithSamples:8,errors:0,parameterStability:true},
        balanced:{count:57,n10:57,nEff:50,oosComplete:20,oosNEff:15,contextsWithSamples:8,errors:0,parameterStability:true},
        selective:{count:52,n10:50,nEff:40,oosComplete:17,oosNEff:13,contextsWithSamples:4,errors:0,parameterStability:true}
      }},
      field:{primaryState:'active',ordering:{ids:['sensitive','balanced','selective'],values:[246,140,25],pass:true},presets:{
        sensitive:{count:246,n10:243,nEff:165,oosComplete:79,oosNEff:54,contextsWithSamples:8,errors:0,parameterStability:true},
        balanced:{count:140,n10:137,nEff:102,oosComplete:41,oosNEff:28,contextsWithSamples:8,errors:0,parameterStability:true},
        selective:{count:25,n10:24,nEff:24,oosComplete:8,oosNEff:8,contextsWithSamples:5,errors:0,parameterStability:true}
      }},
      echo:{primaryState:'strong',ordering:{ids:['sensitive','balanced','selective'],values:[220,98,22],pass:true},presets:{
        sensitive:{count:220,n10:214,nEff:102,oosComplete:84,oosNEff:37,contextsWithSamples:8,errors:0,parameterStability:true},
        balanced:{count:98,n10:96,nEff:59,oosComplete:43,oosNEff:23,contextsWithSamples:8,errors:0,parameterStability:true},
        selective:{count:22,n10:22,nEff:19,oosComplete:14,oosNEff:11,contextsWithSamples:6,errors:0,parameterStability:true}
      }},
      astro:{primaryState:'event',ordering:{ids:['sensitive','balanced','selective'],values:[7977,6836,3436],pass:true},presets:{
        sensitive:{count:7977,n10:7898,nEff:8,oosComplete:2291,oosNEff:8,contextsWithSamples:8,errors:0,parameterStability:true},
        balanced:{count:6836,n10:6766,nEff:8,oosComplete:1952,oosNEff:8,contextsWithSamples:8,errors:0,parameterStability:true},
        selective:{count:3436,n10:3403,nEff:23,oosComplete:989,oosNEff:11,contextsWithSamples:8,errors:0,parameterStability:true}
      }}
    }
  };
  const PUBLICATION={
    version:'g03-r5-2026-09-19',
    split:'chronological 70% calibration / 30% blind validation',
    freezeRule:'parameter snapshot and fingerprint are fixed before OOS outcome reveal',
    selectionBasis:'Evidence density / N_eff / lifecycle & time coverage / parameter stability. OOS return metrics never choose a preset.',
    limitations:{
      support:'Strictness mainly changes structure selectivity; reliability still depends on market/timeframe coverage.',
      macro:'Macro is naturally rare. Full history can still leave small OOS and effective samples.',
      sweep:'Event samples are more independent than dense state observations, but OOS remains context-dependent.',
      basin:'Lifecycle episode counts can locally be non-monotonic because looser states may merge adjacent episodes; aggregate density is audited instead.',
      field:'Strict Field is intentionally sparse in several contexts; strict does not mean more predictive.',
      echo:'Strict Strong-Echo remains relatively thin; similarity is analogy, not directional prediction.',
      astro:'Raw event counts are very large but N_eff is extremely small because events cluster and follow-up windows overlap; no causal claim.'
    }
  };
  function list(model){return (PRESETS[model]||[]).map(x=>JSON.parse(JSON.stringify(x)))}
  function get(model,id){return list(model).find(x=>x.id===id)||null}
  function validation(model,id){
    let x=VALIDATION.models[model]&&VALIDATION.models[model].presets[id];
    return x?JSON.parse(JSON.stringify(x)):null
  }
  function publication(model,id){
    let p=get(model,id),v=validation(model,id);
    if(!p||!v)return null;
    return JSON.parse(JSON.stringify({
      publicationVersion:PUBLICATION.version,
      model,presetId:id,level:p.level,title:p.title,
      primaryState:VALIDATION.models[model].primaryState,
      calibration:{count:v.count,complete:v.n10,nEff:v.nEff,parameterStability:v.parameterStability},
      validation:{complete:v.oosComplete,nEff:v.oosNEff},
      split:PUBLICATION.split,freezeRule:PUBLICATION.freezeRule,selectionBasis:PUBLICATION.selectionBasis,
      limitation:PUBLICATION.limitations[model]||''
    }))
  }
  return{VERSION,PRESETS,VALIDATION,PUBLICATION,list,get,validation,publication};
});
