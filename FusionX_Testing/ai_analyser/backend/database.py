import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "trading.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Create watchlist table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS watchlist (
            symbol TEXT PRIMARY KEY,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def get_watchlist():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT symbol FROM watchlist ORDER BY added_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [r["symbol"] for r in rows]

def add_to_watchlist(symbol: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO watchlist (symbol) VALUES (?)", (symbol,))
    conn.commit()
    conn.close()

def remove_from_watchlist(symbol: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM watchlist WHERE symbol = ?", (symbol,))
    conn.commit()
    conn.close()

# Initialize DB on import
init_db()
