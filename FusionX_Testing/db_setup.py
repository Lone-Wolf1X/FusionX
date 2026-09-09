import os
import glob
import pandas as pd
from sqlalchemy import create_engine

DATA_DIR = "../resources/nepse_data/"
# Use SQLite locally to avoid PostgreSQL setup issues
DB_PATH = "sqlite:///fusionx_testing.db"

print(f"Connecting to Local SQLite Database: {DB_PATH}")

try:
    engine = create_engine(DB_PATH)
    # Test connection
    with engine.connect() as conn:
        print("Database connection successful!")
except Exception as e:
    print(f"Database Connection Error: {e}")
    exit(1)

def load_data_to_db():
    print("Starting data ingestion into SQLite...")
    csv_files = glob.glob(os.path.join(DATA_DIR, "*.csv"))
    
    if not csv_files:
        print("No CSV files found. Make sure resources/nepse_data/ is populated.")
        return

    total_files = len(csv_files)
    
    for i, file in enumerate(csv_files):
        symbol = os.path.basename(file).replace('.csv', '')
        
        try:
            df = pd.read_csv(file)
            
            # Format dataframe
            df['symbol'] = symbol
            
            # Convert published_date to proper datetime
            if 'published_date' in df.columns:
                df['published_date'] = pd.to_datetime(df['published_date'])
            
            # Upload to DB table 'historical_prices'
            df.to_sql('historical_prices', engine, if_exists='append', index=False, chunksize=1000)
            
            if (i + 1) % 50 == 0 or (i + 1) == total_files:
                print(f"Processed {i+1}/{total_files} companies...")
                
        except Exception as e:
            print(f"Error processing {symbol}: {e}")
            
    print("Data ingestion complete! Data is now locally saved in 'fusionx_testing.db'.")

if __name__ == "__main__":
    load_data_to_db()
