# Strategy Lab

多市場、可視化、可回測的策略研究環境。核心目標不是直接輸出買賣答案，而是把市場現象轉成可觀察、可驗證、可回測的模型證據。

## Project principles

Strategy Lab 的產品與自主開發原則記錄在 [CONSTITUTION.md](CONSTITUTION.md)。

## Current milestone

**v1.1 · M4 Progressive Research UI**

目前支援：
- BTC/USD：1H / 4H / 1D / 1W
- NASDAQ Composite：1D / 1W / 1M
- 台股加權指數：1D / 1W / 1M
- 7 個內建模型：Support Zone、Macro Bottom、Liquidity Sweep、Basin Mapper、Oscillation Field、Echo、Astrology Engine
- Script Lab 自訂策略圖層
- Echo 歷史相似型態搜尋、後續 MFE / MAE / 報酬回測與歷史 K 線跳轉
- M4 Evidence Research：Desktop Hover / Click、Mobile Tap / Bottom Sheet、3/5/10/20 bars Evaluation、Lifecycle、Historical Cases、Failure Examples

## Architecture

圖表採三層隔離：

```text
Base Chart Canvas
├─ Candles / Volume / Grid / Crosshair
│
├─ Model Overlay Canvas
│  └─ Built-in models
│
└─ Script Overlay Canvas
   └─ User scripts
```

模型不能直接修改底層 K 線圖。

Research Kernel v1.3 提供統一 Evidence Object、M2 Historical Evidence Timeline 與 M3 Evaluation Layer；`src/model-engine.js` 則是 Lab 與 Research Runner 共用的唯一內建模型引擎：

```text
Market Data
   ↓
Model Engines
   ↓
Normalized Evidence
   ├─ state
   ├─ confidence
   ├─ detectedAt
   ├─ evidence
   ├─ projection
   ├─ invalidation
   └─ metrics
   ↓
Visualization / Evaluation / Future Prediction Layer
```

瀏覽器中可透過 `window.__SL_EVIDENCE__` 查看目前最新 K 的標準化模型證據；`window.__SL_EVIDENCE_LOG__` 保存目前已啟用模型的因果歷史事件／狀態轉移；`window.__SL_EVALUATION__` 則直接使用這條 Timeline 計算 3 / 5 / 10 / 20 bars 的 forward return、MFE、MAE 與 lifecycle progression / failure / lifetime。

## Research Runner

M3.5 新增 headless 批次研究引擎：

```bash
node scripts/research-runner.js --market BTC --timeframe 1d --models support,echo --out research/btc-1d.json
```

也可以一次跑多市場／多週期／多參數組合：

```bash
node scripts/research-runner.js --market BTC,IXIC --timeframe 1d,1w --params research/params.example.json --out research/batch.json
```

比較兩份不同參數或模型版本的研究資料：

```bash
node scripts/research-runner.js --compare old.json,new.json --out research/compare.json
```

Runner 不含另一份模型邏輯；它直接呼叫與 Strategy Lab UI 相同的 `src/model-engine.js`。研究輸出包含 Evidence Timeline、M3 Evaluation、model/kernel version、parameter fingerprint 與資料來源。

## Automated checks

GitHub Actions 會自動檢查：
- Research Kernel schema / causal forward evaluation / M3 lifecycle evaluation
- Shared Model Engine deterministic runtime
- Research Runner 與 Lab Engine 的 Evidence / Evaluation parity
- NASDAQ / TAIEX market-data completeness / freshness
- Pre-M4 fixed-fixture behavior regression（NASDAQ 1D + TAIEX 1D）
- protected Chart Core 是否被模型邏輯污染
- 三層 Canvas 是否存在
- Experimental models 是否維持預設關閉
- 7 個模型是否都有 Evidence adapter

## Data

- BTC 1D / 1W：Bitstamp 長期日線資料
- BTC 1H / 4H：Binance 公開現貨 K 線
- NASDAQ / TAIEX：專案內日線資料，由 GitHub Actions 定期更新

不同資料來源的 Volume 定義可能不同，因此研究時應保留 source / timeframe / market metadata。

進入 M4 前另建立固定 regression fixtures。它們不是最新行情，而是刻意凍結的 1200-bar 樣本，用來檢查未來重構是否讓模型 lifecycle、Evidence 或 Evaluation 在沒有說明的情況下悄悄改變。

## Direction

M1「可信任的地基」、M2「市場記憶」、M3「自我驗證」、M3.5「Research Runner」與 M4「一眼懂，點下去很深」已完成。

下一階段是 **M5「條件式市場推論」**：研究多個 causal Evidence 同時成立時的歷史條件分布與不確定性，而不是輸出不可追溯的單一買賣答案。

持久化 Research Database 不是當前前置條件；等批次研究量真的使重算成本過高時再評估。
