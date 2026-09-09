import pandas as pd
import numpy as np
from typing import Optional
from data import load_stock_df, get_available_symbols

# ─── Technical Indicators ──────────────────────────────────────────────────────

def calc_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0.0)).rolling(period).mean()
    rs = gain / (loss + 1e-9)
    return 100 - (100 / (1 + rs))

def calc_ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()

def calc_macd(series: pd.Series):
    ema12 = calc_ema(series, 12)
    ema26 = calc_ema(series, 26)
    macd_line = ema12 - ema26
    signal = calc_ema(macd_line, 9)
    histogram = macd_line - signal
    return macd_line, signal, histogram

def calc_bollinger(series: pd.Series, period: int = 20):
    sma = series.rolling(period).mean()
    std = series.rolling(period).std()
    upper = sma + (2 * std)
    lower = sma - (2 * std)
    bandwidth = (upper - lower) / (sma + 1e-9)
    return upper, sma, lower, bandwidth

def calc_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    h_l = df["high"] - df["low"]
    h_pc = (df["high"] - df["close"].shift(1)).abs()
    l_pc = (df["low"] - df["close"].shift(1)).abs()
    tr = pd.concat([h_l, h_pc, l_pc], axis=1).max(axis=1)
    return tr.rolling(period).mean()

# ─── AI Scoring ───────────────────────────────────────────────────────────────

def score_stock(df: pd.DataFrame) -> dict:
    if len(df) < 50:
        return None
    
    close = df["close"]
    volume = df["traded_quantity"]
    
    rsi = calc_rsi(close)
    macd_line, signal, histogram = calc_macd(close)
    ema9 = calc_ema(close, 9)
    ema21 = calc_ema(close, 21)
    ema50 = calc_ema(close, 50)
    ema200 = calc_ema(close, 200)
    bb_upper, bb_mid, bb_lower, bb_bw = calc_bollinger(close)
    atr = calc_atr(df)
    
    latest = -1
    score = 0
    signals = []
    
    cur_rsi = rsi.iloc[latest]
    cur_macd = macd_line.iloc[latest]
    cur_signal = signal.iloc[latest]
    prev_macd = macd_line.iloc[-2]
    prev_signal = signal.iloc[-2]
    cur_close = close.iloc[latest]
    cur_ema50 = ema50.iloc[latest]
    cur_ema200 = ema200.iloc[latest]
    cur_ema9 = ema9.iloc[latest]
    cur_ema21 = ema21.iloc[latest]
    cur_bb_bw = bb_bw.iloc[latest]
    cur_bb_lower = bb_lower.iloc[latest]
    cur_atr = atr.iloc[latest]
    
    avg_volume = float(volume.rolling(20).mean().iloc[latest])
    cur_volume = float(volume.iloc[latest])
    
    vol_ratio = 0.0
    if avg_volume and avg_volume > 0 and not np.isnan(avg_volume):
        vol_ratio = float(cur_volume / avg_volume)
        if np.isinf(vol_ratio): vol_ratio = 0.0
        
        if vol_ratio >= 3:
            score += 20
            signals.append({"type": "bullish", "text": f"Volume surge {vol_ratio:.1f}x average 🔥"})
        elif vol_ratio >= 1.5:
            score += 10
            signals.append({"type": "neutral", "text": f"Above average volume ({vol_ratio:.1f}x)"})
    
    # Bollinger Band squeeze (breakout potential)
    if not pd.isna(cur_bb_bw):
        recent_bw = bb_bw.iloc[-20:]
        min_bw = recent_bw.min()
        if cur_bb_bw <= min_bw * 1.1:
            score += 20
            signals.append({"type": "bullish", "text": "Bollinger Band squeeze - breakout imminent 💥"})
        elif cur_close <= cur_bb_lower * 1.02:
            score += 10
            signals.append({"type": "bullish", "text": "Price near lower Bollinger Band - bounce zone"})
    
    # Change percentage
    prev_close = float(close.iloc[-2])
    change_pct = 0.0
    if prev_close and prev_close > 0:
        change_pct = float(((cur_close - prev_close) / prev_close) * 100.0)
        if np.isinf(change_pct) or np.isnan(change_pct): change_pct = 0.0
        
    # Support & Resistance (Buy/Sell Zones) using local 20-day min/max
    recent_lows = df["low"].tail(20)
    recent_highs = df["high"].tail(20)
    support = float(recent_lows.min()) if not recent_lows.empty else None
    resistance = float(recent_highs.max()) if not recent_highs.empty else None
    if support and pd.isna(support): support = None
    if resistance and pd.isna(resistance): resistance = None
    
    def safe_round(val):
        if pd.isna(val) or np.isinf(val): return None
        return round(float(val), 2)
    
    return {
        "rsi": safe_round(cur_rsi),
        "macd": safe_round(cur_macd),
        "macd_signal": safe_round(cur_signal),
        "ema9": safe_round(cur_ema9),
        "ema21": safe_round(cur_ema21),
        "ema50": safe_round(cur_ema50),
        "ema200": safe_round(cur_ema200),
        "bb_upper": safe_round(bb_upper.iloc[latest]),
        "bb_lower": safe_round(bb_lower.iloc[latest]),
        "atr": safe_round(cur_atr),
        "volume_ratio": safe_round(vol_ratio),
        "score": min(score, 100),
        "signals": signals,
        "ltp": safe_round(cur_close),
        "change_pct": safe_round(change_pct),
        "support": safe_round(support),
        "resistance": safe_round(resistance)
    }

# ─── Main Public Functions ─────────────────────────────────────────────────────

def _get_stockmap() -> dict:
    import json, os
    stockmap_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../resources/nepse_stockmap.json"))
    try:
        with open(stockmap_path) as f:
            return json.load(f)
    except:
        return {}

def run_full_scan(sectors: list[str] = None) -> list[dict]:
    """Scans stocks and returns analysis results."""
    from data import get_available_symbols, get_symbols_by_sectors
    
    if sectors:
        symbols = get_symbols_by_sectors(sectors)
    else:
        symbols = get_available_symbols()
        
    results = []
    stockmap = _get_stockmap()
        
    for sym in symbols:
        df = load_stock_df(sym)
        if df is None or len(df) < 50:
            continue
        analysis = score_stock(df)
        if analysis is None:
            continue
            
        info = stockmap.get(sym, {})
        results.append({
            "symbol": sym,
            "name": info.get("name", sym),
            "sector": info.get("sector", "Other"),
            **analysis,
            "data_points": len(df),
            "from_date": str(df["date"].iloc[0].date()),
            "to_date": str(df["date"].iloc[-1].date()),
        })
    
    results.sort(key=lambda x: x["score"], reverse=True)
    return results

def analyse_stock(symbol: str) -> Optional[dict]:
    """Analyse a single stock and return its summary."""
    stockmap = _get_stockmap()
    df = load_stock_df(symbol)
    if df is None or len(df) < 50:
        return None
    analysis = score_stock(df)
    if analysis is None:
        return None
    info = stockmap.get(symbol, {})
    return {
        "symbol": symbol,
        "name": info.get("name", symbol),
        "sector": info.get("sector", "Other"),
        **analysis,
    }

def get_stock_detail(symbol: str, period: int = 9999) -> Optional[dict]:
    df = load_stock_df(symbol)
    if df is None or df.empty:
        return None
    
    # Sort and remove duplicates on full dataframe
    df = df.sort_values("date").drop_duplicates(subset=["date"]).reset_index(drop=True)
    
    # Calculate all indicators on full history for maximum precision
    close = df["close"]
    rsi = calc_rsi(close)
    macd_line, signal, histogram = calc_macd(close)
    ema9 = calc_ema(close, 9)
    ema21 = calc_ema(close, 21)
    ema50 = calc_ema(close, 50)
    bb_upper, bb_mid, bb_lower, _ = calc_bollinger(close)
    
    # Slice recent rows based on period (if period < total records)
    if period and period > 0 and period < len(df):
        df_recent = df.tail(period).copy().reset_index(drop=True)
        start_idx = len(df) - period
    else:
        df_recent = df.copy().reset_index(drop=True)
        start_idx = 0
    
    def s(v):
        return None if (v is None or (isinstance(v, float) and np.isnan(v))) else round(float(v), 2)
    
    ohlcv = []
    for _, row in df_recent.iterrows():
        ohlcv.append({
            "time": str(row["date"].date()),
            "open": s(row["open"]),
            "high": s(row["high"]),
            "low": s(row["low"]),
            "close": s(row["close"]),
            "volume": int(row["traded_quantity"]) if not np.isnan(row["traded_quantity"]) else 0,
        })
    
    indicators = {
        "rsi": [{"time": str(df_recent["date"].iloc[i].date()), "value": s(rsi.iloc[start_idx + i])} 
                for i in range(len(df_recent)) if not np.isnan(rsi.iloc[start_idx + i])],
        "macd": [{"time": str(df_recent["date"].iloc[i].date()), 
                  "macd": s(macd_line.iloc[start_idx + i]), 
                  "signal": s(signal.iloc[start_idx + i]),
                  "histogram": s(histogram.iloc[start_idx + i])}
                 for i in range(len(df_recent)) if not np.isnan(macd_line.iloc[start_idx + i])],
        "ema9": [{"time": str(df_recent["date"].iloc[i].date()), "value": s(ema9.iloc[start_idx + i])} 
                 for i in range(len(df_recent)) if not np.isnan(ema9.iloc[start_idx + i])],
        "ema21": [{"time": str(df_recent["date"].iloc[i].date()), "value": s(ema21.iloc[i + start_idx])} 
                  for i in range(len(df_recent)) if not np.isnan(ema21.iloc[start_idx + i])],
        "ema50": [{"time": str(df_recent["date"].iloc[i].date()), "value": s(ema50.iloc[start_idx + i])} 
                  for i in range(len(df_recent)) if not np.isnan(ema50.iloc[start_idx + i])],
        "bb_upper": [{"time": str(df_recent["date"].iloc[i].date()), "value": s(bb_upper.iloc[start_idx + i])} 
                     for i in range(len(df_recent)) if not np.isnan(bb_upper.iloc[start_idx + i])],
        "bb_lower": [{"time": str(df_recent["date"].iloc[i].date()), "value": s(bb_lower.iloc[start_idx + i])} 
                     for i in range(len(df_recent)) if not np.isnan(bb_lower.iloc[start_idx + i])],
    }
    
    analysis = score_stock(df)
    
    stockmap = _get_stockmap()
    info = stockmap.get(symbol, {})
    
    return {
        "symbol": symbol,
        "name": info.get("name", symbol),
        "sector": info.get("sector", "Other"),
        "total_records": len(df),
        "from_date": str(df["date"].iloc[0].date()),
        "to_date": str(df["date"].iloc[-1].date()),
        "ohlcv": ohlcv,
        "indicators": indicators,
        "analysis": analysis,
    }

def get_suggestions() -> dict:
    all_stocks = run_full_scan()
    
    strong_buy = [s for s in all_stocks if s["score"] >= 70][:10]
    watch = [s for s in all_stocks if 50 <= s["score"] < 70][:10]
    
    return {
        "strong_buy": strong_buy,
        "watch_list": watch,
        "total_scanned": len(all_stocks),
    }

def get_heatmap_data() -> dict:
    all_stocks = run_full_scan()
    
    sectors: dict = {}
    for stock in all_stocks:
        sector = stock.get("sector", "Other")
        if sector not in sectors:
            sectors[sector] = {"stocks": [], "avg_score": 0, "avg_change": 0}
        sectors[sector]["stocks"].append({
            "symbol": stock["symbol"],
            "name": stock.get("name", stock["symbol"]),
            "score": stock["score"],
            "change_pct": stock["change_pct"],
            "ltp": stock["ltp"],
        })
    
    for sector, data in sectors.items():
        stocks = data["stocks"]
        data["avg_score"] = round(sum(s["score"] for s in stocks) / len(stocks), 1)
        data["avg_change"] = round(sum(s["change_pct"] for s in stocks) / len(stocks), 2)
        data["count"] = len(stocks)
    
    return {"sectors": sectors}

import os
