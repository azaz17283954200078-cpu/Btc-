import os
import time
import pandas as pd
import yfinance as yf

os.makedirs("data", exist_ok=True)

MARKETS = [
    ("^IXIC", "nasdaq_daily.csv"),
    ("^TWII", "taiex_daily.csv"),
]

REQUIRED = ["Open", "High", "Low", "Close"]


def download_daily(symbol: str) -> pd.DataFrame:
    last_error = None
    for attempt in range(1, 4):
        try:
            df = yf.download(
                symbol,
                period="max",
                interval="1d",
                auto_adjust=False,
                progress=False,
                threads=False,
            )
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            if not df.empty:
                df = df.reset_index()
                if "Date" not in df.columns:
                    raise RuntimeError(f"{symbol}: missing Date column")
                missing = [c for c in REQUIRED if c not in df.columns]
                if missing:
                    raise RuntimeError(f"{symbol}: missing columns {missing}")
                df = df.dropna(subset=["Date", *REQUIRED]).copy()
                if len(df) < 200:
                    raise RuntimeError(f"{symbol}: suspiciously short history ({len(df)} rows)")
                cols = ["Date", "Open", "High", "Low", "Close", "Volume"]
                return df[[c for c in cols if c in df.columns]]
            last_error = RuntimeError(f"{symbol}: empty download")
        except Exception as exc:
            last_error = exc
        if attempt < 3:
            time.sleep(attempt * 3)
    raise RuntimeError(f"Failed to refresh {symbol}: {last_error}")


for symbol, name in MARKETS:
    target = os.path.join("data", name)
    df = download_daily(symbol)

    # Write only after a complete validated download so a transient provider
    # failure can never replace good market history with an empty file.
    temp = target + ".tmp"
    df.to_csv(temp, index=False)
    os.replace(temp, target)
    print(symbol, len(df), df.iloc[0]["Date"], df.iloc[-1]["Date"])
