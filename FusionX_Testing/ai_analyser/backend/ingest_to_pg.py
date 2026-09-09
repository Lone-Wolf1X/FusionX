import os
import glob
import json
import pandas as pd
from sqlalchemy import text
from pg_database import engine, init_pg_db, SessionLocal, Stock

DATA_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../resources/nepse_data")
)
STOCKMAP_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../resources/nepse_stockmap.json")
)

def ingest_data():
    print("Initializing PostgreSQL tables...")
    init_pg_db()
    
    print("Ingesting stocks from nepse_stockmap.json...")
    session = SessionLocal()
    try:
        with open(STOCKMAP_PATH) as f:
            stockmap = json.load(f)
            
        # The stockmap is a dictionary: {"NABIL": {"name": "...", "sector": "..."}}
        for sym, info in stockmap.items():
            # Check if exists
            existing = session.query(Stock).filter(Stock.symbol == sym).first()
            if not existing:
                s = Stock(
                    symbol=sym,
                    name=info.get("name", sym),
                    sector=info.get("sector", "Other")
                )
                session.add(s)
        session.commit()
    except Exception as e:
        print(f"Error parsing stockmap: {e}")
        session.rollback()
    finally:
        session.close()

    print("Ingesting CSV daily data. This might take a minute...")
    files = glob.glob(os.path.join(DATA_DIR, "*.csv"))
    
    # Empty existing data to prevent duplicates
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE daily_data RESTART IDENTITY;"))
        
    for filepath in files:
        symbol = os.path.splitext(os.path.basename(filepath))[0]
        try:
            df = pd.read_csv(filepath)
            df = df.rename(columns={"published_date": "date"})
            df = df.dropna(subset=["close", "open", "high", "low", "date"])
            
            df["date"] = pd.to_datetime(df["date"]).dt.date
            df["symbol"] = symbol
            
            df["close"] = pd.to_numeric(df["close"], errors="coerce")
            df["open"] = pd.to_numeric(df["open"], errors="coerce")
            df["high"] = pd.to_numeric(df["high"], errors="coerce")
            df["low"] = pd.to_numeric(df["low"], errors="coerce")
            df["volume"] = pd.to_numeric(df["traded_quantity"], errors="coerce").fillna(0)
            
            df = df.dropna(subset=["close", "open", "high", "low"])
            
            # Keep only the columns we need for daily_data
            df_to_insert = df[["symbol", "date", "open", "high", "low", "close", "volume"]]
            
            df_to_insert.to_sql("daily_data", engine, if_exists="append", index=False)
            print(f"Ingested {symbol}")
        except Exception as e:
            print(f"Failed to ingest {symbol}: {e}")

    print("Ingestion complete!")

if __name__ == "__main__":
    ingest_data()
