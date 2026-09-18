# Strategy Lab

多市場、可視化、可回測的策略研究環境。核心目標不是直接輸出買賣答案，而是把市場現象轉成可觀察、可驗證、可回測的模型證據。

## Current milestone

**v0.7 · Research Kernel**

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

Research Kernel v1 新增統一 Evidence Object：

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

瀏覽器中可透過 `window.__SL_EVIDENCE__` 查看目前最新 K 的標準化模型證據。

## Automated checks

GitHub Actions 會自動檢查：
- Research Kernel schema / forward evaluation
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

下一階段重點是建立統一 Evaluation Layer，讓不同模型的 FORMING / ACTIVE / EVENT 狀態可以用同一套 forward return、MFE、MAE 與狀態生命週期進行比較，再接 Prediction Layer。
