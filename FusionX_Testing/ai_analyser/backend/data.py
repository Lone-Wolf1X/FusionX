import pandas as pd
from typing import Optional
from pg_database import engine

_cache: dict = {}

def get_available_symbols() -> list[str]:
    query = "SELECT symbol FROM stocks"
    df = pd.read_sql(query, engine)
    return sorted(df["symbol"].tolist())

def get_symbols_by_sectors(sectors: list[str]) -> list[str]:
    if not sectors:
        return []
    sector_str = "','".join(sectors)
    query = f"SELECT symbol FROM stocks WHERE sector IN ('{sector_str}')"
    df = pd.read_sql(query, engine)
    return sorted(df["symbol"].tolist())

def get_sectors() -> list[str]:
    query = "SELECT DISTINCT sector FROM stocks"
    df = pd.read_sql(query, engine)
    return sorted([s for s in df["sector"].tolist() if s])

def load_stock_df(symbol: str) -> Optional[pd.DataFrame]:
    if symbol in _cache:
        return _cache[symbol]
    
    query = f"SELECT * FROM daily_data WHERE symbol = '{symbol}' ORDER BY date"
    try:
        df = pd.read_sql(query, engine)
        if df.empty:
            return None
            
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").drop_duplicates(subset=["date"]).reset_index(drop=True)
        df["traded_quantity"] = df["volume"]
        _cache[symbol] = df
        return df
    except Exception as e:
        print(f"Error loading {symbol} from DB: {e}")
        return None
