# G02-R2｜研究安全驗收

## 目的
本輪承接 G02-R1 的兩輪使用者走查。單模型研究架構不推翻；先修正可能讓一般使用者得出錯誤研究結論的阻斷風險，再繼續全站一致性與多模型工作。

主要驗收角色：高中二年級社會組學生；懂 K 線、漲跌幅與一般百分比，但不熟統計獨立性、ATR、MFE、MAE。

## 全站樣本安全

任何 forward result 的閱讀順序固定為：

1. 符合目前狀態的總案例數。
2. 已走完整個觀察期的案例數。
3. 尚未走完的案例數。
4. 樣本層級：不足／探索性／較可比較。
5. 最後才顯示歷史中位變化、收盤高於／低於起點的比例、MFE / MAE。

門檻沿用 M5 已定義的樣本 gate：

- N < 5：樣本不足，只能當案例看。
- N = 5–19：探索性樣本，不適合下普遍結論。
- N >= 20：較可比較，但仍只是歷史分布。

百分比必須同時寫出分子／分母，且不得稱為成功率。

## Macro Bottom 阻斷項

Macro 必須被理解成 lifecycle，而不是單一「底部」標記：

候選 → 在期限內收復觸發高點 → 完成模型確認

候選也可能在確認前跌破、過期，或在資料尾端尚未結束。

介面同時呈現：歷史候選數、完成模型確認數、確認前失效／過期數、資料尾端未結束數。研究 selected horizon 時，另外顯示已確認案例中有多少已走完／未走完觀察期。

固定 fixture audit 證明小樣本風險是真實存在：

- IXIC 1D：candidate 1、confirmed 1、confirmed 10-bar 完整 N=1、upRate=100%。
- TWII 1D：candidate 7、confirmed 3、確認前失效 4、confirmed 10-bar 完整 N=3、upRate=66.7%。

這些數字是安全驗收案例，不代表模型表現。

## Astrology 阻斷項

第一層必須先理解：這是可被否證的外部時間假說，不是價格答案，也沒有證明天體事件造成價格。

「未來」的時間基準固定說清楚：Upcoming 是相對於載入資料的最後一根 K / 資料截止日產生。介面同時顯示瀏覽器今天日期；如果某個投影日期以今天看已經過去，直接指出它不能再稱為現實未來。

歷史事件另外區分：

- event-bar 數：有占星事件的 K 棒案例數。
- underlying event count：同一 K 可能包含多個相位／逆行／入座事件。
- multi-event bars：同一 K 含多事件的數量。

即使 event-bar 數很大，不同案例的 forward window 仍可能互相重疊，所以不能把 N 直接說成 N 個互相獨立的證據。

Upcoming projection 不是 historical Evidence，不得直接作為組合研究的第一個條件。

## 案例瀏覽數

歷史案例介面同時顯示「可瀏覽 X / 總 Y」。目前瀏覽器最多先載入最近 500 個案例；超過時必須明說顯示上限，不能把 500 當成研究總樣本。

## 自動驗證

CI 增加：

- `tests/g02-r2-research-safety-contract.test.js`：保護樣本先於百分比、Macro lifecycle、Astrology time reference / non-independence / projection handoff guard、case cap。
- `scripts/g02-r2-research-safety-audit.js`：固定 IXIC / TWII fixture 驗證 Macro lifecycle accounting、horizon N + incomplete、Astrology eventCount、projection after data cutoff、projection 不進 historical Evaluation。

## 仍未完成

自動測試通過不等於產品驗收通過。依使用者驗收指南，第一階段必須由未參與開發的人員在沒有口頭提示下，至少完成：

- 面對 1/1 或 2/3 等小樣本結果，不把它稱為可靠成功率。
- 說出 Macro candidate 如何變成 completed confirmation，以及如何失效。
- 說出 Astrology 的「未來」相對哪個日期。
- 說出大量 Astrology events 不一定等於大量獨立證據。
- 說出 Astrology 沒有證明價格因果。

在這些阻斷任務完成前，不把完整多模型介面擴張成主要流程。
