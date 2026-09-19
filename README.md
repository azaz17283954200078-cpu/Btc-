# Strategy Lab

多市場、可視化、可回測的策略研究環境。核心目標不是直接輸出買賣答案，而是把市場現象轉成可觀察、可驗證、可回測的模型證據。

## Project principles

Strategy Lab 的產品與自主開發原則記錄在 [CONSTITUTION.md](CONSTITUTION.md)。

## Current milestone

**v1.3 · M5 Conditional Research**

目前支援：
- BTC/USD：1H / 4H / 1D / 1W
- NASDAQ Composite：1D / 1W / 1M
- 台股加權指數：1D / 1W / 1M
- 7 個內建模型：Support Zone、Macro Bottom、Liquidity Sweep、Basin Mapper、Oscillation Field、Echo、Astrology Engine
- Script Lab 自訂策略圖層
- Echo 歷史相似型態搜尋、後續 MFE / MAE / 報酬回測與歷史 K 線跳轉
- M4 Guided Research：7 個模型逐一回答「它在問什麼／開啟後看到什麼／別把它當成什麼」
- 每個模型都有 3 套已驗證的參考研究設定，可再展開手動參數微調
- 參考設定已用 Research Runner 跑過 BTC / NASDAQ / TAIEX 的 8 個市場×週期情境；驗證敏感度順序、樣本覆蓋與 Evidence error，不用歷史報酬排名選參數
- Evidence Research：Desktop Hover / Click、Mobile Tap / Bottom Sheet、3/5/10/20 bars Evaluation、Lifecycle、Historical Cases、Failure Examples
- N / Median Return / MFE / MAE / progression / failure 都附白話解讀與下一步操作

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

## M4 Guided Research

M4 的目標不是再加一個「教學模式」，而是讓原本的 Lab 本身會帶人研究。模型卡先用市場問題開場；開啟後告訴你圖上會看到什麼、哪些解讀不能直接推出；再往下才進入狀態、歷史分布與原始 Evidence。

每個模型都有三套「參考研究設定」。名稱描述的是模型看市場的方式，例如較敏感、平衡、較挑剔，而不是「高勝率」或「最佳參數」。設定與 Runner 共用 `src/model-presets.js`，沒有 UI 私藏的另一份參數。

正式公開前，這些設定先由 Research Runner 在 8 個歷史情境驗證：BTC 1D / 1W、NASDAQ 1D / 1W / 1M、TAIEX 1D / 1W / 1M。驗證條件包括：

- Sensitive → Balanced → Selective 的主要狀態樣本數確實依序下降
- 每套設定都有可研究的歷史樣本與完成的 10-bar outcomes
- 至少跨多個市場／週期情境有樣本
- Evidence errors = 0
- **不使用 Median Return 或其他報酬排名挑選哪套參數**

完整驗證結果保存在 `research/m4-preset-validation.json`，CI 也會重新跑 semantic-fit gate，避免日後模型修改後，參考設定的名字和實際行為悄悄失去一致性。

## Automated checks

GitHub Actions 會自動檢查：
- Research Kernel schema / causal forward evaluation / M3 lifecycle evaluation
- Shared Model Engine deterministic runtime
- Research Runner 與 Lab Engine 的 Evidence / Evaluation parity
- NASDAQ / TAIEX market-data completeness / freshness
- Pre-M4 fixed-fixture behavior regression（NASDAQ 1D + TAIEX 1D）
- M4 Guided Research desktop/mobile interaction contract
- Validated model preset contract
- M4 preset semantic-fit Research Runner gate
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

## M5 Conditional Research

M5 不把模型做成投票器。研究流程從一個 anchor Evidence 開始，再加入第二／第三個當時已知的條件，比較單一條件與條件組合的歷史 episode 分布。

- State Evidence 會維持到下一個 lifecycle transition。
- Sweep / Astrology 等事件預設只算當根，也可以明確改成「最近 3 / 5 根內」；窗口只往事件之後延伸。
- Echo 使用當根 observation。
- 採 anchor-centric sampling：第一個條件定義 baseline episode；每個 anchor episode 最多只取一次「新增條件第一次同時成立」，因此加入條件不會反而製造更多樣本。
- N < 5 顯示樣本不足；5–19 顯示探索性；N ≥ 20 才標示可比較。這些標籤只描述樣本量。
- 每組條件都和第一個 anchor 的單一條件 baseline 並排，不輸出 BUY / SELL、模型投票或最佳組合排名。

Research Runner 可透過 `--conditions research/conditions.example.json` 使用相同的 Shared Condition Engine。

## Direction

M1「可信任的地基」、M2「市場記憶」、M3「自我驗證」、M3.5「Research Runner」與重新定義後的 M4「Guided Research」已完成。

下一階段是 **M5「條件式市場推論」**：研究多個 causal Evidence 同時成立時的歷史條件分布、樣本數與不確定性，而不是把模型做成投票器或輸出不可追溯的單一買賣答案。

持久化 Research Database 仍不是前置條件；等批次研究量真的使重算成本過高時再評估。
