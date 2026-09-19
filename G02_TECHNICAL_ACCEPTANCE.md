# G02｜使用者迭代指南技術驗收報告

## 結論
Work 產生的《Strategy Lab 使用者角度迭代指南 G02》所列六個技術階段已實作到 R7，並通過自動化技術 gate。

這份「技術通過」只代表程式、資料語意、因果性、Evidence、狀態保存、組合 handoff 與 responsive/touch 契約符合目前規格。它**不取代**指南要求的未參與開發者盲測。

## Stage 1｜研究安全 — G02-R2
- 小樣本先顯示 N 與不足警告，再顯示百分比。
- Macro 同時呈現候選、完成模型確認、確認前失效／過期、未結束。
- Astrology 說明資料截止日、現實日期、事件重疊與非獨立性。
- Future projection 不可 seed 歷史組合條件。
- 固定 fixture audit 通過。

## Stage 2｜全站一致性 — G02-R3
- 七個模型共用「同狀態總案例／完整觀察／尚未完成／可瀏覽案例」。
- 百分比只使用完整觀察案例。
- Sweep、Echo、Astrology 說明一個「案例」的計數單位。

## Stage 3｜模型專屬證據 — G02-R4
- Support：支撐帶上下緣、形成低點、失效邊界。
- Macro：候選區、觸發高點、目前確認階段。
- Sweep：舊低、向下刺破、收盤、收盤位置。
- Basin：下跌、路徑效率、平盤窄幅、走平、中心穩定、尺度。
- Field：回合數、貼合、中心位移、寬度變化、幾何穩定、破界確認。
- Echo：目前相似度、Strong 門檻、Strong 數、最佳歷史區間、OHLC similarity parts。
- Astrology：事件摘要、底層事件數、資料截止日、明確「無因果主張」。
- Model Engine 1.2.0 的 Echo best-match trace 只使用 current pattern 之前的歷史片段。

## Stage 4｜單模型延續 — G02-R5
- Browser localStorage 最多保存 30 個研究快照。
- 保存 market / timeframe / model / state / Evidence / horizon / params / fingerprint / versions / knownThrough / source。
- 目前研究與保存研究分離；修改目前設定不會改寫保存快照。
- 載入保存研究會還原 market/timeframe/params，再重新解析 Evidence。
- 若保存 Evidence 在新資料版本找不到，會明說並回到 now，不假裝是原案例。

## Stage 5｜組合研究入口 — G02-R6
- 組合研究是獨立 Tab，不重新塞回單模型 inspector。
- 第一條件由單模型 `COMBINATION_HANDOFF_CONTEXT` + `CONDITION_STACK` 直接帶入。
- 不重新選 market/timeframe/model/state/params。
- 後續條件使用 Shared Condition Engine v1.2。
- knownThrough、anchor-centric sampling、關係語意與樣本 gate 保留。
- Astrology upcoming 仍禁止作為歷史組合條件。

## Stage 6｜裝置驗收技術層 — G02-R7
- Desktop：Chart Core 與研究側欄分離，不用固定 Evidence overlay 遮主圖。
- <=1050px：chart / research 垂直堆疊。
- <=650px：核心 button/select 採 touch target；chart tooltip 不作為必要入口。
- 手機點模型標記直接同步右側 Evidence，不要求 hover。
- 研究流程明示為：選模型 → 看證據 → 查歷史 → 保存 → 延續。

## Final guide data audit
- IXIC fixed 1D：1476 Evidence；七模型都有實際研究輸出。
- TWII fixed 1D：1473 Evidence；七模型都有實際研究輸出。
- Coverage flags：failure=true、incomplete=true、smallSample=true、echoTrace=true、noEvent=true。
- Flat synthetic market：不會虛構 Macro Bottom 或 Liquidity Sweep。
- 所有 state / horizon 維持 `n + incomplete = state count`。
- Echo best historical match 不得與 current pattern 重疊。
- Astrology projection 不得混入 historical Evaluation。

## CI
- Final branch technical run: `35431231619` — success.
- 包含既有 Research Kernel / Model Engine / Condition Engine / Runner / real-market causality / market data / regression / presets。
- 包含 G02 R2 / R3 / R4 / R5 / R6 / R7 專屬 gates 與 final guide audit。

## 尚未能由技術層宣告通過
指南要求最終驗收者必須是未參與開發的人，且不得靠口頭提示完成任務。因此以下仍標記 pending：
- 三分鐘內自行說出產品定位。
- 七模型自行用一般語言解釋。
- 面對小樣本不誤稱可靠成功率。
- 無提示辨認 Macro candidate/confirmation/failure。
- 無提示解釋 Astrology future/date/non-independence/no-causality。
- 真實手機與桌面完成保存、切換、案例瀏覽、組合 handoff。

這些 pending 不代表技術功能缺失，而是人因驗收證據尚未取得。
