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

## M3.5｜Research Runner｜批次研究引擎 — Planned

把 Strategy Lab 的「互動研究」與「大量批次實驗」分開，但兩者必須共用同一套模型與 Research Kernel。

目標架構：

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

Runner 不得複製或重寫另一份 Support、Basin、Field、Echo 等模型邏輯。  
如果 UI 與 Runner 不能由同一份模型程式碼產生相同 Evidence，M3.5 不算完成。

預計工作：

- 將目前仍綁在 `index.html` 的模型運算逐步抽成可共用模組
- 建立 headless `scripts/research-runner.js`
- 可指定 market / timeframe / model / parameter set 批次執行
- Runner 直接產生與 Lab 相同 schema 的 Evidence Timeline
- 使用 M3 Evaluation Layer 產生統一研究結果
- 研究輸出必須包含 model version / parameter fingerprint / market / timeframe / data source
- 支援基礎模型版本或參數比較
- 初期輸出使用可檢查的 JSON / CSV 類研究資料集，不因「未來可能需要」就先引入大型資料庫

持久化 Research Database 是後續可選升級，而不是 M3.5 的必要條件。只有當跨市場、跨參數、跨模型版本的研究量已經讓每次重算變得昂貴，才討論 SQLite 或其他資料庫。

M3.5 是研究基礎設施，不新增 Lab 的主要 UI。

## M4｜一眼懂，點下去很深 — Next

將同一份 Evidence 與 Evaluation 做成漸進式資訊深度；不建立新手／專業模式。

M4 的介面設計必須遵守憲法的 UI 入場條件與重大介面共同決策條款。

## M5｜條件式市場推論

組合多個 Evidence，研究條件分布與情境，而不是輸出不可追溯的單一買賣答案。

## M6｜完成的小作品

第一次使用者能很快開始探索；有經驗的研究者仍能得到值得研究的資訊。達到後停止為了規模而擴張。
