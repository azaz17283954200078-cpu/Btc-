# Strategy Lab

多市場、可視化、可回測的策略研究環境。核心目標不是直接輸出買賣答案，而是把市場現象轉成可觀察、可驗證、可回測的模型證據。

## Project principles

Strategy Lab 的產品與自主開發原則記錄在 [CONSTITUTION.md](CONSTITUTION.md)。

## Current milestone

**v0.9 · M3 Evaluation Layer**

目前支援：
- BTC/USD：1H / 4H / 1D / 1W
- NASDAQ Composite：1D / 1W / 1M
- 台股加權指數：1D / 1W / 1M
- 7 個內建模型：Support Zone、Macro Bottom、Liquidity Sweep、Basin Mapper、Oscillation Field、Echo、Astrology Engine
- Script Lab 自訂策略圖層
- Echo 歷史相似型態搜尋、後續 MFE / MAE / 報酬回測與歷史 K 線跳轉

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

Research Kernel v1.3 提供統一 Evidence Object、M2 Historical Evidence Timeline 與 M3 Evaluation Layer：

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

## Automated checks

GitHub Actions 會自動檢查：
- Research Kernel schema / causal forward evaluation / M3 lifecycle evaluation
- protected Chart Core 是否被模型邏輯污染
- 三層 Canvas 是否存在
- Experimental models 是否維持預設關閉
- 7 個模型是否都有 Evidence adapter

## Data

- BTC 1D / 1W：Bitstamp 長期日線資料
- BTC 1H / 4H：Binance 公開現貨 K 線
- NASDAQ / TAIEX：專案內日線資料，由 GitHub Actions 定期更新

不同資料來源的 Volume 定義可能不同，因此研究時應保留 source / timeframe / market metadata。

## Direction

M1「可信任的地基」、M2「市場記憶」與 M3「自我驗證」已完成。下一階段是 M4「一眼懂，點下去很深」：把同一份 Evidence 與 Evaluation 透過嚴格 UI 入場條件做成漸進式理解路徑，不建立新手／專業模式。
