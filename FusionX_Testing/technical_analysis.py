import pandas as pd
from sqlalchemy import create_engine
import ta

# Connect to the local SQLite database
DB_PATH = "sqlite:///fusionx_testing.db"
engine = create_engine(DB_PATH)

def calculate_indicators(symbol):
    print(f"Fetching data for {symbol}...")
    
    # Read historical data for the specific symbol
    query = f"SELECT * FROM historical_prices WHERE symbol = '{symbol}' ORDER BY published_date ASC"
    df = pd.read_sql(query, engine)
    
    if df.empty:
        print(f"No data found for symbol: {symbol}")
        return None
        
    print(f"Loaded {len(df)} rows for {symbol}. Calculating indicators...")
    
    # Drop rows with NaN in 'close' price
    df = df.dropna(subset=['close'])
    
    # 1. Moving Averages
    df['SMA_20'] = ta.trend.sma_indicator(df['close'], window=20)
    df['SMA_50'] = ta.trend.sma_indicator(df['close'], window=50)
    
    # 2. RSI (Relative Strength Index)
    df['RSI_14'] = ta.momentum.rsi(df['close'], window=14)
    
    # 3. MACD
    macd = ta.trend.MACD(df['close'])
    df['MACD'] = macd.macd()
    df['MACD_Signal'] = macd.macd_signal()
    df['MACD_Hist'] = macd.macd_diff()
    
    # 4. Bollinger Bands
    bollinger = ta.volatility.BollingerBands(df['close'], window=20, window_dev=2)
    df['BB_High'] = bollinger.bollinger_hband()
    df['BB_Low'] = bollinger.bollinger_lband()
    
    print("Indicators calculated successfully!")
    
    # Show the last 5 days of data
    print("\nRecent Data with Indicators:")
    print(df[['published_date', 'close', 'SMA_20', 'RSI_14', 'MACD']].tail())
    
    return df

if __name__ == "__main__":
    # Test the script on a major NEPSE bank, e.g., NABIL Bank
    processed_df = calculate_indicators('NABIL')
    
    if processed_df is not None:
        # Save to a new table for AI to consume later
        print("\nSaving processed data with indicators to DB...")
        processed_df.to_sql('nabil_indicators', engine, if_exists='replace', index=False)
        print("Done!")
