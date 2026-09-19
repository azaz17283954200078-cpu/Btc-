# Strategy Lab Milestones

里程碑描述「系統具備了什麼能力」，而不是累積了多少功能。

## M1｜可信任的地基 — ✅ Completed

- Chart Core 與模型／Script 圖層隔離
- 標準化 Evidence Object
- detectedAt 與 evidenceStart 分離
- Echo 歷史後續結果受 knownThrough 限制
- 自動架構與因果性檢查

## M2｜市場記憶 — ✅ Completed

系統不只知道最新 K 發生什麼，也能保存「歷史上模型在當時實際知道什麼」。

目前 Historical Evidence Timeline 支援：

- Support：Potential → Candidate → Validated → Broken
- Macro：Candidate → Confirmed / Broken
- Liquidity Sweep：Event
- Basin：Landing → Forming → Active → Exit
- Oscillation Field：Seed → Forming → Active → Broken
- Echo：每個評估時間點的 Weak / Strong observation
- Astrology：historical Event 與 latest Upcoming projection

瀏覽器研究介面：

- `window.__SL_EVIDENCE_LOG__`：依時間排序的完整歷史 Evidence
- `window.__SL_EVIDENCE_BY_MODEL__`：依模型分組
- `window.__SL_EVIDENCE_SUMMARY__`：模型／狀態／事件類型摘要
- `window.__SL_EVIDENCE_ERRORS__`：因果或 schema 驗證失敗紀錄

Timeline 記錄的是狀態「被知道的時間」，而不是事後把完整形態回填到過去。

## M3｜自我驗證 — ✅ Completed

Historical Evidence Timeline 現在直接進入統一 Evaluation Layer，不重新掃描或重新解讀模型歷史。

每個 model + state 都可取得：

- 歷史樣本數
- 3 / 5 / 10 / 20 bars 的有效樣本數與未完成樣本數
- Up / Down / Flat rate
- Median Forward Return
- Median MFE / MAE

Lifecycle Evaluation 會依 entityId 重建同一市場結構的一生，提供：

- 狀態轉移次數與比例
- 狀態間的中位等待 bars
- Potential / Candidate / Landing / Forming / Seed 等早期狀態的 progression rate
- 在進展前先 Broken 的 failure rate
- resolved / open entity 數量
- resolved lifecycle 的中位存活 bars

Evaluation 預設只使用 transition / event / observation；projection 不會被當成已發生的市場樣本。

瀏覽器研究介面：

- `window.__SL_EVALUATION__`：目前市場、週期、參數與已啟用模型的完整 M3 評估結果

## M3.5｜Research Runner｜批次研究引擎 — ✅ Completed

Strategy Lab 的互動研究與大量批次實驗已分離，但兩者共用同一套 Model Engine 與 Research Kernel。

完成架構：

```text
Strategy Lab UI
    │
    ├─ Shared Model Engine
    ├─ Research Kernel
    └─ Evaluation
          ↑
          │ 同一套邏輯
          ↓
Research Runner
    ├─ Batch Markets
    ├─ Batch Timeframes
    ├─ Batch Models / Params
    ├─ Version Comparison
    └─ Research Dataset
```

完成內容：

- `src/model-engine.js` 成為 Lab 與 Runner 唯一的內建模型實作來源
- `index.html` 只負責 UI、資料載入與視覺化，透過 `ModelEngine.run()` 取得模型結果
- headless `scripts/research-runner.js` 可批次指定 market / timeframe / model / parameter set
- Runner 直接產生與 Lab 完全相同 schema 的 Evidence Timeline 與 M3 Evaluation
- 每個研究 run 保存 model version / kernel version / parameter fingerprint / market / timeframe / data source
- 支援多個參數組合批次比較
- `--compare` 可比較兩份不同模型版本或參數版本的研究資料集
- 初期持久化格式使用可檢查 JSON，不預先引入大型資料庫
- CI 直接驗證 Runner Evidence / Evaluation 與 shared Model Engine 完全一致

持久化 Research Database 仍是後續可選升級。只有當跨市場、跨參數、跨模型版本的研究量讓每次重算變得昂貴，才討論 SQLite 或其他資料庫。

M3.5 是研究基礎設施，沒有新增 Lab 的主要 UI。

## Pre-M4 Regression Gate｜M1–M3.5 回歸品質閘門 — ✅ Passed

M3.5 把模型從 `index.html` 大幅搬到 Shared Model Engine 後，進 M4 前重新驗證既有里程碑，而不是重做它們。

永久回歸契約：

- M1：Chart Core / 三層 Canvas / Experimental default OFF 仍受 architecture contract 保護
- M2：Evidence schema、時間因果順序、Timeline 排序、entity lifecycle chronology
- M3：每個 horizon 的 `N + incomplete = state count`、rate / metric 有效性、projection 不混入已發生樣本
- M3.5：Lab / Runner 共用 Model Engine，Evidence / Evaluation parity
- Data：NASDAQ / TAIEX 必須非空、完整 OHLC、日期嚴格遞增、不可長期失去更新
- Behavior：凍結 NASDAQ 1D 與 TAIEX 1D 各 1200 根 K 作為 regression fixtures；模型狀態數、lifecycle、Evaluation 與 causal anchors 必須與 baseline 一致

若未來刻意修改模型世界觀或參數，regression baseline 可以更新，但必須把 baseline diff 當成模型行為變更審查，而不是直接忽略。

本次 audit 也發現市場資料更新曾留下未完成的最新 K；Updater 已改為先驗證並 drop incomplete OHLC，再原子替換資料檔，避免壞資料覆蓋既有歷史。

## M4｜Guided Research｜介面自己帶人研究 — ✅ Completed

M4 最終不是「把統計打開來看」，而是讓 Strategy Lab 的主介面本身帶使用者完成一段研究。

完成內容：

- 7 個模型卡都先回答「它在問市場什麼問題」
- 每張卡都說明「開啟後圖上會看到什麼」與「不能直接把它解讀成什麼」
- Support 預設開啟，讓第一次進站就能看到模型層；實驗模型仍維持 opt-in
- 卡片直接顯示目前 Evidence；沒有當前 Evidence 時，會帶使用者回最近歷史案例或建議比較較敏感設定
- 每個模型都有 3 套 shared 參考研究設定，設定來源只有一份 `src/model-presets.js`
- 參考設定顯示實際參數與「調寬／調嚴」會改變什麼；使用者仍可展開每個參數自行微調
- 所有參考設定先經 Research Runner 驗證，並把驗證結果保存到 `research/m4-preset-validation.json`
- 驗證涵蓋 8 個歷史情境：BTC 1D/1W、NASDAQ 1D/1W/1M、TAIEX 1D/1W/1M
- 7 個模型都通過 Sensitive ≥ Balanced ≥ Selective 的主要狀態樣本密度檢查
- 每套設定都有完成的 10-bar outcomes、跨情境樣本覆蓋，且 Evidence errors = 0
- 參考設定**不是**依歷史報酬高低挑選；Median Return 不參與 preset ranking
- N、Median Return、MFE、MAE 都有當下白話說明；Median 明確標示不是當前報酬預測
- Lifecycle progression / failure 明確解釋成「模型自己的狀態發展」，不是價格漲跌機率
- 歷史案例、失敗案例、detectedAt / evidenceStart 都保留可追溯入口
- 每個研究層級都有下一步：回歷史 K、換研究設定、展開更深 Evidence
- Desktop：Hover 增強 + Click pin；Mobile：Tap + Bottom Sheet，不依賴 Hover
- Mobile 參數介面採 Bottom Sheet；Desktop 保留 draggable modal
- M4 UI 只讀 M2 Evidence / M3 Evaluation，不自行呼叫 `evaluateTimeline()` 重算另一份答案
- CI 永久保護 Guided Research interaction contract、validated preset contract 與 preset semantic-fit gate

M4 的完成標準：

> 第一次打開 Strategy Lab 的人，不需要先讀說明頁，就能從介面本身知道「我現在看到什麼、我可以做什麼、按下去會得到什麼、接下來還能研究什麼」。

## M5｜Conditional Research｜條件式市場推論 — 🧪 Engine validated / Product acceptance

M5 研究的是「多一個 causal Evidence 之後，歷史分布發生了什麼變化」，而不是把模型做成投票器。

完成內容：

- 新增 Shared `src/condition-engine.js`，Lab UI 與 Research Runner 使用同一套條件語意與統計。
- State Evidence（Support / Macro / Basin / Field）只從 `detectedAt` 起成立，並維持到下一個 lifecycle transition。
- Broken / Exit 等 terminal transition 只當成當根事件，不永久殘留為市場狀態。
- Sweep / Astrology 等 Event Evidence 預設只算當根，也可顯式設定最近 3 / 5 根窗口；窗口只從事件發生後向前延伸。
- Echo 使用當根 Observation，不把未來 projection 混入條件。
- 採 **anchor-centric sampling**：第一個條件定義 baseline episode；每個 anchor episode 最多只貢獻一個組合樣本，取新增條件第一次同時成立的時點，因此增加條件後 N 不會反而膨脹。
- 條件組合永遠與 anchor 單一條件 baseline 並排，顯示 3 / 5 / 10 / 20 bars 的 N、Median Return、MFE、MAE 與 Return IQR。
- 樣本閘門固定為 N < 5「樣本不足」、5–19「探索性」、N ≥ 20「可比較」；只描述樣本量，不當作預測可靠度分數。
- Guided Conditional UI 直接嵌在 M4 Evidence Research：先看單一 Evidence，再加入第二／第三個歷史上曾同時存在的條件。
- 最多同時研究 3 個條件，避免無限制疊條件造成極小樣本與資料挖掘。
- 若目前只開一個模型，介面會帶使用者先替另一個模型選研究方式，不在背景偷偷啟用模型。
- Research Runner 支援 `--conditions research/conditions.example.json`，可 headless 批次輸出相同 conditional result。
- Condition Engine 通過 synthetic prefix causality、Runner parity、fixed-fixture 與 real-market audit。
- Real-market audit 曾抓到一個真正的 future-Evidence causality leak：未來 transition 被 clamp 到 `knownThrough`；已修正為 Evidence 必須在當時真的已被偵測才可參與條件。
- 第一次 audit 也暴露事件可能讓組合 episode 數反而高於 anchor；因此改成 anchor-centric sampling，再重新通過驗證。
- 最終 real-market audit：BTC 1D 22 個 Support Candidate anchor 中 20 個與 Basin Forming 重疊；NASDAQ 1D 13 中 12 個與 Basin Landing 重疊；TAIEX 1D 15 中 15 個與 Field Forming 重疊。這些數字只驗證條件機制與樣本閘門，不代表模型優劣或未來報酬。
- M5 不產生 BUY / SELL、模型投票、條件分數或「最佳組合」排名。

M5 產品驗收標準：

> 使用者可以從一個 Evidence 出發，逐步加入其他「當時已知」的條件，看到樣本數如何縮小、歷史分布如何改變，並隨時知道資料是否只具探索價值；整個過程保持 causal、可追溯、可在 Runner 重現。\n\nShared Condition Engine 已通過技術／研究驗證；但在正式桌面與手機介面完成條件磚塊、逐步樣本縮減、樣本不足原因與實際使用者操作驗收前，不再把 M5 稱為產品驗收完成。\n\nUI-R01 依使用者確認後開始重構：側欄第一層改為「研究條件組」，完整模型庫改成按需展開；這是產品驗收中的介面架構調整，不改變模型世界觀或研究統計契約。

## M6｜完成的小作品 — Next

第一次使用者能很快開始探索；有經驗的研究者仍能得到值得研究的資訊。達到後停止為了規模而擴張。
