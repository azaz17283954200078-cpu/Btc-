# G02-R1｜單模型研究架構

## 目標
先把單模型研究變成一條沒有分岔的主線，同時保留一個可追溯的出口，讓未來獨立的組合研究系統直接接續，而不是重新選一次模型、狀態與參數。

## 使用者心智模型

```text
主圖 = 市場
右側 = 目前正在研究的一個模型

模型研究
  ├─ 現在
  ├─ 歷史後續（一次一個 horizon）
  ├─ 真實案例（主圖同步）
  ├─ 進階 lifecycle / raw Evidence
  └─ 準備給組合研究
```

## 狀態邊界

- `FOCUSED_MODEL`：右側正在研究哪個模型。
- `FOCUSED_EVIDENCE`：`now` 或某一個明確歷史 Evidence。
- `SINGLE_RESEARCH_HORIZON`：目前只看 3 / 5 / 10 / 20 中哪一個後續距離。
- `SINGLE_RESEARCH_CONTEXT`：目前單模型研究完整上下文。
- `COMBINATION_HANDOFF_CONTEXT`：使用者明確按下「準備組合研究」後凍結的一份可追溯上下文。
- `CONDITION_STACK`：未來組合研究的條件資料；G02-R1 只 seed 第一個條件，不顯示組合 UI。

Legacy `PINNED_RESEARCH` 只保留給尚未重建的 M5 conditional helper，不再控制單模型研究。

## 研究焦點與圖層顯示

`isModelVisible(model)` 只回答「這個模型要不要畫在主圖」。

`shouldRunModel(model)` 回答「Shared Model Engine 要不要算這個模型」。目前研究的模型即使圖層隱藏也要計算，所以研究與顯示不再綁在一起。

Experimental models 的 checkbox 仍維持預設 OFF；這次沒有把探索模型預設畫到主圖。

## 現在與歷史

單模型入口永遠先進 `now`。如果最新市場沒有這個模型的 Evidence，就直接顯示「目前沒有形成可用 Evidence」。只有使用者按下「查看最近一次歷史案例」時才切到 history。

因此不再使用產品層的 `currentEvidence || lastHistoricalEvidence` 靜默 fallback。

## 歷史結果

3 / 5 / 10 / 20 K 共用既有 Research Kernel Evaluation；沒有改 forward return、MFE 或 MAE 公式。UI 只保留一個 `SINGLE_RESEARCH_HORIZON`，避免同時把四張結果卡丟給使用者。

## 歷史案例

選案例時同時做兩件事：

1. 更新 `FOCUSED_EVIDENCE`。
2. `jumpToEvidence(index)` 移動主圖。

點主圖模型標記則反向用 `focusSingleEvidenceFromHit()` 更新右側，所以圖與解釋指向同一個案例。

## Handoff contract

`buildSingleResearchContext()` 保存：

- market / timeframe / data source
- model / state
- condition seed（model / state / windowBars / relation）
- Evidence id / index / detectedAt / evidenceStart / kind
- selected horizon
- setting source
- parameter snapshot
- run parameter fingerprint
- engine / kernel version
- knownThrough

按「用這個研究準備組合研究」才建立 `COMBINATION_HANDOFF_CONTEXT`，並用 condition seed 初始化 `CONDITION_STACK`。模型參數一旦改變，舊 handoff 立即失效。

## G02-R1 明確不做

- 不建立新的組合研究頁／Tab。
- 不把舊 R02 漏斗塞回單模型側欄。
- 不修改 Condition Engine v1.2 關係語意。
- 不修改模型世界觀、Evidence schema、causality 或回測公式。
- 不宣告 M5 / G02 產品驗收完成。
