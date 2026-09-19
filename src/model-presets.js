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
      {id:'selective',level:'strict',title:'嚴格',intent:'固定相同型態長度與搜尋歷史，只提高 Strong 門檻到 82%；相似不等於歷史重演。',config:{exp:{echo:{length:32,history:1200,similarity:.82,followBars:12}}}}
    ],
    astro:[
      {id:'sensitive',level:'loose',title:'寬鬆',intent:'納入較廣事件集合；事件數很多也不代表有更多獨立證據或因果。',config:{exp:{astro:{planetSet:'modern',aspectSet:'major',orb:6,retro:'on',ingress:'on'}}}},
      {id:'balanced',level:'balanced',title:'平衡',intent:'使用傳統七曜與主要相位，作為外部時間假說的主要研究設定。',config:{exp:{astro:{planetSet:'classic',aspectSet:'major',orb:4,retro:'off',ingress:'off'}}}},
      {id:'selective',level:'strict',title:'嚴格',intent:'只保留傳統七曜的主要緊張相位並縮小 Orb；不因此產生價格因果主張。',config:{exp:{astro:{planetSet:'classic',aspectSet:'hard',orb:2,retro:'off',ingress:'off'}}}}
    ]
  };
  const VALIDATION={
  "validatedAt": "2026-09-19",
  "basis": "Research Runner semantic-fit validation; counts are primary-state occurrences, n10 is completed 10-bar outcomes. Presets were not selected by return ranking.",
  "contexts": [
    {
      "market": "BTC",
      "timeframe": "1d",
      "bars": 1800
    },
    {
      "market": "BTC",
      "timeframe": "1w",
      "bars": 700
    },
    {
      "market": "IXIC",
      "timeframe": "1d",
      "bars": 1800
    },
    {
      "market": "TWII",
      "timeframe": "1d",
      "bars": 1800
    },
    {
      "market": "IXIC",
      "timeframe": "1w",
      "bars": 700
    },
    {
      "market": "TWII",
      "timeframe": "1w",
      "bars": 700
    },
    {
      "market": "IXIC",
      "timeframe": "1m",
      "bars": 300
    },
    {
      "market": "TWII",
      "timeframe": "1m",
      "bars": 300
    }
  ],
  "models": {
    "support": {
      "primaryState": "potential",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          415,
          332,
          222
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 415,
          "n10": 412,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 332,
          "n10": 326,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 222,
          "n10": 220,
          "contextsWithSamples": 8,
          "errors": 0
        }
      }
    },
    "macro": {
      "primaryState": "candidate",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          85,
          52,
          39
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 85,
          "n10": 85,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 52,
          "n10": 52,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 39,
          "n10": 39,
          "contextsWithSamples": 7,
          "errors": 0
        }
      }
    },
    "sweep": {
      "primaryState": "event",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          212,
          133,
          82
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 212,
          "n10": 211,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 133,
          "n10": 133,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 82,
          "n10": 82,
          "contextsWithSamples": 8,
          "errors": 0
        }
      }
    },
    "basin": {
      "primaryState": "active",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          109,
          57,
          43
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 109,
          "n10": 109,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 57,
          "n10": 57,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 43,
          "n10": 43,
          "contextsWithSamples": 5,
          "errors": 0
        }
      }
    },
    "field": {
      "primaryState": "active",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          246,
          140,
          25
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 246,
          "n10": 243,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 140,
          "n10": 137,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "selective": {
          "count": 25,
          "n10": 24,
          "contextsWithSamples": 5,
          "errors": 0
        }
      }
    },
    "echo": {
      "primaryState": "strong",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          519,
          20,
          14
        ],
        "pass": true
      },
      "presets": {
        "sensitive": {
          "count": 519,
          "n10": 510,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 20,
          "n10": 20,
          "contextsWithSamples": 7,
          "errors": 0
        },
        "selective": {
          "count": 14,
          "n10": 14,
          "contextsWithSamples": 5,
          "errors": 0
        }
      }
    },
    "astro": {
      "primaryState": "event",
      "ordering": {
        "ids": [
          "sensitive",
          "balanced",
          "selective"
        ],
        "values": [
          7977,
          6836,
          3436
        ],
        "pass": true
      },
      "presets": {
        "selective": {
          "count": 3436,
          "n10": 3403,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "balanced": {
          "count": 6836,
          "n10": 6766,
          "contextsWithSamples": 8,
          "errors": 0
        },
        "sensitive": {
          "count": 7977,
          "n10": 7898,
          "contextsWithSamples": 8,
          "errors": 0
        }
      }
    }
  }
};
  function list(model){return (PRESETS[model]||[]).map(x=>JSON.parse(JSON.stringify(x)))}
  function get(model,id){return list(model).find(x=>x.id===id)||null}
  function validation(model,id){return VALIDATION.models[model]&&VALIDATION.models[model].presets[id]?JSON.parse(JSON.stringify(VALIDATION.models[model].presets[id])):null}
  return{VERSION,PRESETS,VALIDATION,list,get,validation};
});
