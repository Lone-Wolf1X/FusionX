import os
import time
import requests
import pandas as pd
from datetime import datetime, timedelta

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../resources/nepse_data"))

def get_latest_date(symbol):
    path = os.path.join(DATA_DIR, f"{symbol}.csv")
    if not os.path.exists(path):
        return None
    try:
        # Read just the last row manually or use pandas
        # To be fast, we use pandas tail
        df = pd.read_csv(path)
        if df.empty:
            return None
        last_date = df['published_date'].iloc[-1]
        return datetime.strptime(last_date, "%Y-%m-%d")
    except Exception as e:
        return None

def fetch_recent_data(symbol, start_dt, end_dt):
    url = "https://merolagani.com/handlers/TechnicalChartHandler.ashx"
    params = {
        "type": "get_advanced_chart",
        "symbol": symbol,
        "resolution": "1D",
        "rangeStartDate": int(start_dt.timestamp()),
        "rangeEndDate": int(end_dt.timestamp()),
        "isAdjust": "1",
        "currencyCode": "NPR",
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": f"https://merolagani.com/CompanyDetail.aspx?symbol={symbol}",
        "X-Requested-With": "XMLHttpRequest",
    }
    try:
        res = requests.get(url, params=params, headers=headers, timeout=10, verify=False)
        data = res.json()
        if isinstance(data, dict) and 't' in data and len(data['t']) > 0:
            df = pd.DataFrame({
                "Date": pd.to_datetime(data["t"], unit="s"),
                "Open": data["o"],
                "High": data["h"],
                "Low": data["l"],
                "Close": data["c"],
                "Volume": data["v"],
            })
            return df
    except Exception as e:
        pass
    return pd.DataFrame()

def main():
    import urllib3
    urllib3.disable_warnings()
    
    symbols = [f.split(".")[0] for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
    symbols = sorted(symbols)
    
    end_dt = datetime.now()
    
    updated = 0
    print(f"Updating {len(symbols)} symbols...")
    
    for i, sym in enumerate(symbols):
        last_date = get_latest_date(sym)
        if not last_date:
            continue
            
        if (end_dt - last_date).days < 1:
            continue
            
        start_dt = last_date - timedelta(days=2) # overlapping to be safe
        
        df = fetch_recent_data(sym, start_dt, end_dt)
        if not df.empty:
            df['published_date'] = df['Date'].dt.strftime("%Y-%m-%d")
            # Filter out dates that we already have
            df = df[df['Date'] > last_date]
            if df.empty:
                continue
                
            new_rows = []
            for _, r in df.iterrows():
                new_rows.append({
                    "published_date": r["published_date"],
                    "open": r["Open"],
                    "high": r["High"],
                    "low": r["Low"],
                    "close": r["Close"],
                    "per_change": 0.0,
                    "traded_quantity": r["Volume"],
                    "traded_amount": 0.0,
                    "status": 1
                })
            
            new_df = pd.DataFrame(new_rows)
            new_df.to_csv(os.path.join(DATA_DIR, f"{sym}.csv"), mode='a', header=False, index=False)
            updated += 1
            print(f"[{i+1}/{len(symbols)}] Appended {len(new_df)} rows for {sym}")
        else:
            print(f"[{i+1}/{len(symbols)}] No data for {sym}")
            
        time.sleep(1.2) # be nice to the server
        
    print(f"Done. Updated {updated} stocks.")

if __name__ == '__main__':
    main()
