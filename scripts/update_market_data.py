import os
import pandas as pd
import yfinance as yf

os.makedirs("data", exist_ok=True)
for symbol, name in [("^IXIC","nasdaq_daily.csv"),("^TWII","taiex_daily.csv")]:
    df = yf.download(symbol, period="max", interval="1d", auto_adjust=False, progress=False)
    if df.empty:
        raise RuntimeError(f"No data for {symbol}")
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df.reset_index()
    cols = ["Date","Open","High","Low","Close","Volume"]
    df = df[[c for c in cols if c in df.columns]]
    df.to_csv("data/"+name, index=False)
    print(symbol, len(df), df.iloc[0]["Date"], df.iloc[-1]["Date"])
