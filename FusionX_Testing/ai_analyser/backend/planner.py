import math
from analyser import run_full_scan
from database import get_watchlist
import json
import os

def generate_trade_plan(budget: float, use_whitelist: bool = False) -> dict:
    all_stocks = run_full_scan()
    
    if use_whitelist:
        wl = set(get_watchlist())
        all_stocks = [s for s in all_stocks if s["symbol"] in wl]
        
    # We want top 5 overall
    top_overall = []

    # Filter out anything with no LTP or support/resistance
    valid_stocks = [s for s in all_stocks if s.get("ltp") and s.get("support") and s.get("resistance")]
    
    # Top 5 overall (highest score)
    top_5_raw = sorted(valid_stocks, key=lambda x: x["score"], reverse=True)[:5]
    
    # We also want best performing per sector
    sectors_data = {}
    for s in valid_stocks:
        sec = s.get("sector", "Other")
        if sec not in sectors_data:
            sectors_data[sec] = []
        sectors_data[sec].append(s)
    
    # Calculate allocation. 
    # If budget is provided, we split it across the top 5 (or less if fewer are available).
    num_to_buy = min(len(top_5_raw), 5)
    allocation_per_stock = budget / num_to_buy if num_to_buy > 0 else 0
    
    def process_stock(stock, alloc):
        ltp = stock["ltp"]
        qty = math.floor(alloc / ltp) if ltp > 0 else 0
        total_inv = qty * ltp
        
        target = stock["resistance"]
        stop = stock["support"] * 0.98 # 2% below support
        
        # Calculate expected return
        expected_profit = (target - ltp) * qty if target > ltp else 0
        expected_loss = (ltp - stop) * qty if stop < ltp else 0
        
        return {
            "symbol": stock["symbol"],
            "name": stock.get("name", stock["symbol"]),
            "sector": stock.get("sector", "Other"),
            "ltp": ltp,
            "score": stock["score"],
            "quantity": qty,
            "invested": total_inv,
            "target": target,
            "stop_loss": stop,
            "expected_profit": expected_profit,
            "risk": expected_loss,
            "signals": stock["signals"]
        }

    for s in top_5_raw:
        top_overall.append(process_stock(s, allocation_per_stock))
        
    sector_top = {}
    for sec, stocks in sectors_data.items():
        if not stocks: continue
        best_in_sec = max(stocks, key=lambda x: x["score"])
        # Give it a theoretical allocation of budget/3 just to show what a trade looks like
        sector_top[sec] = process_stock(best_in_sec, budget / 3)
        
    return {
        "budget": budget,
        "total_invested": sum(x["invested"] for x in top_overall),
        "top_overall": top_overall,
        "sector_top": sector_top
    }
