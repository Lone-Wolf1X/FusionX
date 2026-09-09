from analyser import run_full_scan
import pandas as pd
from datetime import datetime, timedelta

def get_market_dashboard_data() -> dict:
    all_stocks = run_full_scan()
    valid_stocks = [s for s in all_stocks if s.get("ltp") and s.get("volume_ratio") is not None]
    
    # Gainers & Losers
    sorted_by_change = sorted(valid_stocks, key=lambda x: x.get("change_pct", 0) or 0)
    top_losers = sorted_by_change[:5]
    top_gainers = sorted_by_change[-5:]
    top_gainers.reverse()
    
    total_volume = 0
    total_turnover = 0
    sector_distribution = {}
    
    # We don't have the exact total volume directly in run_full_scan output, 
    # but we can get it from load_stock_df if needed. 
    # Let's approximate turnover using LTP and whatever volume we can fetch.
    # Actually, we need to load the dataframes to get exact volume for today.
    from data import load_stock_df
    
    volume_history = {}
    
    for s in valid_stocks:
        sym = s["symbol"]
        df = load_stock_df(sym)
        if df is None or df.empty:
            continue
            
        # Get the last row (most recent trading day)
        last_row = df.iloc[-1]
        vol = float(last_row["traded_quantity"]) if not pd.isna(last_row["traded_quantity"]) else 0
        ltp = s["ltp"]
        turnover = vol * ltp
        
        total_volume += vol
        total_turnover += turnover
        
        sec = s.get("sector", "Other")
        if sec not in sector_distribution:
            sector_distribution[sec] = {"volume": 0, "turnover": 0}
        sector_distribution[sec]["volume"] += vol
        sector_distribution[sec]["turnover"] += turnover
        
        # Build volume history (last 30 days)
        recent_df = df.tail(30)
        for _, row in recent_df.iterrows():
            d = str(row["date"].date())
            v = float(row["traded_quantity"]) if not pd.isna(row["traded_quantity"]) else 0
            if d not in volume_history:
                volume_history[d] = 0
            volume_history[d] += v

    # Format sector distribution for Recharts PieChart
    sector_pie_data = []
    for sec, vals in sector_distribution.items():
        if vals["turnover"] > 0:
            sector_pie_data.append({"name": sec, "value": vals["turnover"]})
            
    # Format volume history for Recharts AreaChart
    vol_hist_list = [{"date": k, "volume": v} for k, v in volume_history.items()]
    vol_hist_list.sort(key=lambda x: x["date"])
    
    # Top 5 by AI score
    top_ai_stocks = sorted(valid_stocks, key=lambda x: x.get("score", 0), reverse=True)[:5]
    
    return {
        "total_turnover": total_turnover,
        "total_volume": total_volume,
        "total_scanned": len(valid_stocks),
        "top_gainers": top_gainers,
        "top_losers": top_losers,
        "sector_distribution": sector_pie_data,
        "volume_history": vol_hist_list[-30:],
        "top_ai_stocks": top_ai_stocks
    }
