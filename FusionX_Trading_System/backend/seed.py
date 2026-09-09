import os
import json
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Create all tables if they don't exist
models.Base.metadata.create_all(bind=engine)

def seed_data():
    db: Session = SessionLocal()
    
    # Paths based on the project structure
    resources_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "resources")
    stockmap_file = os.path.join(resources_dir, "nepse_stockmap.json")
    nepse_data_dir = os.path.join(resources_dir, "nepse_data")
    
    if not os.path.exists(stockmap_file):
        print(f"Stockmap file not found at {stockmap_file}.")
        return

    print("Seeding Stocks...")
    with open(stockmap_file, 'r') as f:
        stockmap = json.load(f)
        
    stocks_to_insert = []
    for symbol, details in stockmap.items():
        existing = db.query(models.Stock).filter(models.Stock.symbol == symbol).first()
        if not existing:
            stock = models.Stock(
                symbol=symbol,
                name=details.get("name"),
                sector=details.get("sector"),
                internal_sector=details.get("internalSector")
            )
            stocks_to_insert.append(stock)
            
    if stocks_to_insert:
        db.add_all(stocks_to_insert)
        db.commit()
        print(f"Inserted {len(stocks_to_insert)} stocks.")
    else:
        print("Stocks already seeded.")
    
    print("Seeding Historical Data...")
    if not os.path.exists(nepse_data_dir):
        print(f"Nepse data directory not found at {nepse_data_dir}.")
        return

    csv_files = [f for f in os.listdir(nepse_data_dir) if f.endswith(".csv")]
    
    # We use a set for faster lookups to prevent duplicate seeding
    seeded_symbols = {r[0] for r in db.query(models.StockData.symbol).distinct().all()}
    valid_symbols = {r[0] for r in db.query(models.Stock.symbol).all()}

    for filename in csv_files:
        symbol = filename.replace(".csv", "")
        
        if symbol not in valid_symbols:
            print(f"Skipping {symbol} as it is not in stockmap.")
            continue

        if symbol in seeded_symbols:
            continue
            
        file_path = os.path.join(nepse_data_dir, filename)
        df = pd.read_csv(file_path)
        
        # Handle nan values by replacing with None for SQL NULL
        df = df.replace({np.nan: None})
        
        records = []
        for _, row in df.iterrows():
            records.append({
                "symbol": symbol,
                "published_date": row["published_date"],
                "open": row["open"],
                "high": row["high"],
                "low": row["low"],
                "close": row["close"],
                "per_change": row["per_change"],
                "traded_quantity": row["traded_quantity"],
                "traded_amount": row["traded_amount"],
                "status": row["status"]
            })
            
        # Bulk insert for efficiency
        if records:
            db.bulk_insert_mappings(models.StockData, records)
            db.commit()
            print(f"Seeded {len(records)} records for {symbol}")

    db.close()
    print("Seeding Complete!")

if __name__ == "__main__":
    seed_data()
