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

## M4｜Guided Research｜介面自己帶人研究 — 🚧 Reopened

M4 不再只代表「Evidence 可以點開」，而是要求第一次進入 Strategy Lab 的人不必先讀教學頁，也能從介面本身知道：

- 這個模型在問市場什麼問題
- 開啟後會在圖上看到什麼
- 現在模型看到什麼狀態
- 每個按鈕按下去會得到什麼
- 每個參數改大／改小會改變什麼
- 統計數字代表什麼、不能代表什麼
- 下一步可以看哪個歷史案例或失敗案例

### M4 Guided Research 完成條件

1. **7 個模型逐一引導**：每張模型卡都用市場問題開場，不以術語作為理解起點。
2. **狀態翻譯**：Potential / Candidate / Active / Strong 等狀態先翻成市場現象，再保留術語作名稱。
3. **按鈕結果導向**：例如「看看以前發生過什麼」「用這組設定重新找」，避免只寫工程功能名稱。
4. **參考研究配方**：每個模型提供數套有語意的參考設定，並說明會讓模型更敏感、較平衡或更挑剔。
5. **配方必須先驗證**：所有參考設定必須用 Research Runner 在多市場／多週期歷史資料上先跑過；驗證的是設定是否真的符合其宣稱的敏感度、樣本量與模型語意，不以歷史報酬最高作為挑選標準。
6. **參數教學**：使用者可以從配方看到實際參數，並理解每個參數調整的方向效果。
7. **結果教學**：N、Median Return、MFE、MAE、progression / failure 都要附當下語境的白話解讀。
8. **下一步引導**：每一層研究結果都提供自然的下一個動作，而不是讓使用者自己猜。
9. **Desktop / Mobile 各自成立**：Desktop 可用 Hover 增強；Mobile 不依賴 Hover，使用 Tap / Bottom Sheet。
10. **同一研究真相**：UI 只讀 M2 Evidence / M3 Evaluation；參考配方由 Lab 與 Runner 共用，不允許 UI 另藏一套參數。

M4 完成前不進入 M5。

## M5｜條件式市場推論 — Next

組合多個 Evidence，研究條件分布與情境，而不是輸出不可追溯的單一買賣答案。

## M6｜完成的小作品

第一次使用者能很快開始探索；有經驗的研究者仍能得到值得研究的資訊。達到後停止為了規模而擴張。
