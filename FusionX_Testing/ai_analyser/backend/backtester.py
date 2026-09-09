"""
FusionX Backtesting Engine
Supports rule-based strategy backtesting on historical NEPSE data.
"""
import pandas as pd
import numpy as np
from typing import Optional
from data import load_stock_df, get_available_symbols, get_symbols_by_sectors
from analyser import calc_rsi, calc_macd, calc_ema, calc_bollinger


def _prepare_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Add all technical indicators as columns to the dataframe."""
    close = df["close"]
    
    df["rsi"] = calc_rsi(close)
    
    macd_line, signal, histogram = calc_macd(close)
    df["macd"] = macd_line
    df["macd_signal"] = signal
    df["macd_hist"] = histogram
    
    df["ema9"] = calc_ema(close, 9)
    df["ema21"] = calc_ema(close, 21)
    df["ema50"] = calc_ema(close, 50)
    df["ema200"] = calc_ema(close, 200)
    
    bb_upper, bb_mid, bb_lower, _ = calc_bollinger(close)
    df["bb_upper"] = bb_upper
    df["bb_lower"] = bb_lower
    
    df["vol_ma20"] = df["traded_quantity"].rolling(20).mean()
    df["vol_ratio"] = df["traded_quantity"] / df["vol_ma20"].replace(0, np.nan)
    
    df["change_pct"] = close.pct_change() * 100
    
    return df


def _evaluate_entry_signal(row: pd.Series, strategy: str) -> bool:
    """Evaluate whether the entry condition is met for a given row."""
    try:
        r = row
        # Expose variables for eval
        rsi = r.get("rsi", 50)
        macd = r.get("macd", 0)
        macd_signal = r.get("macd_signal", 0)
        macd_hist = r.get("macd_hist", 0)
        ema9 = r.get("ema9", 0)
        ema21 = r.get("ema21", 0)
        ema50 = r.get("ema50", 0)
        ema200 = r.get("ema200", 0)
        bb_upper = r.get("bb_upper", 0)
        bb_lower = r.get("bb_lower", 0)
        close = r.get("close", 0)
        vol_ratio = r.get("vol_ratio", 1)
        
        if pd.isna(rsi) or pd.isna(macd): return False
        return bool(eval(strategy))
    except:
        return False


def _evaluate_exit_signal(row: pd.Series, entry_price: float, 
                           take_profit_pct: float, stop_loss_pct: float) -> Optional[str]:
    """Check if take-profit or stop-loss is hit."""
    close = row["close"]
    if close >= entry_price * (1 + take_profit_pct / 100):
        return "take_profit"
    if close <= entry_price * (1 - stop_loss_pct / 100):
        return "stop_loss"
    return None


def run_backtest(
    symbols: list[str],
    entry_strategy: str,
    initial_capital: float = 100000.0,
    take_profit_pct: float = 10.0,
    stop_loss_pct: float = 5.0,
    position_size_pct: float = 10.0,
    max_positions: int = 5,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> dict:
    """
    Run a backtest across multiple symbols with a given strategy.
    
    entry_strategy: Python expression using: rsi, macd, macd_signal, 
                    ema9, ema21, ema50, ema200, close, vol_ratio, bb_upper, bb_lower
    Example: "rsi < 35 and macd > macd_signal and close > ema50"
    """
    
    import json, os
    stockmap_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../resources/nepse_stockmap.json"))
    stockmap = {}
    try:
        with open(stockmap_path) as f:
            stockmap = json.load(f)
    except:
        pass

    cash = initial_capital
    portfolio_value_history = []
    all_trades = []
    open_positions = {}  # symbol -> {entry_price, entry_date, shares, cost}
    
    # Gather all data, align on common dates
    all_dfs = {}
    for sym in symbols:
        df = load_stock_df(sym)
        if df is None or len(df) < 200:
            continue
        df = _prepare_indicators(df.copy())
        df = df.dropna(subset=["rsi", "macd", "ema50"])
        if from_date:
            df = df[df["date"] >= pd.to_datetime(from_date)]
        if to_date:
            df = df[df["date"] <= pd.to_datetime(to_date)]
        if len(df) < 20:
            continue
        all_dfs[sym] = df
    
    if not all_dfs:
        return {"error": "No valid stock data found for selected symbols."}
    
    # Get all trading dates (union of all stock dates)
    all_dates = sorted(set().union(*[set(df["date"].tolist()) for df in all_dfs.values()]))
    
    # Day-by-day simulation
    for date in all_dates:
        current_portfolio_value = cash
        
        # Mark-to-market open positions
        for sym, pos in list(open_positions.items()):
            sym_df = all_dfs.get(sym)
            if sym_df is None:
                continue
            day_data = sym_df[sym_df["date"] == date]
            if day_data.empty:
                current_portfolio_value += pos["shares"] * pos["entry_price"]
                continue
            
            row = day_data.iloc[0]
            current_price = row["close"]
            current_portfolio_value += pos["shares"] * current_price
            
            # Check exit conditions
            exit_reason = _evaluate_exit_signal(row, pos["entry_price"], take_profit_pct, stop_loss_pct)
            if exit_reason:
                proceeds = pos["shares"] * current_price
                profit = proceeds - pos["cost"]
                profit_pct = (profit / pos["cost"]) * 100
                info = stockmap.get(sym, {})
                cash += proceeds
                all_trades.append({
                    "symbol": sym,
                    "name": info.get("name", sym),
                    "entry_date": str(pos["entry_date"].date()) if hasattr(pos["entry_date"], "date") else str(pos["entry_date"]),
                    "exit_date": str(date.date()) if hasattr(date, "date") else str(date),
                    "entry_price": round(pos["entry_price"], 2),
                    "exit_price": round(current_price, 2),
                    "shares": pos["shares"],
                    "profit": round(profit, 2),
                    "profit_pct": round(profit_pct, 2),
                    "exit_reason": exit_reason,
                    "result": "win" if profit > 0 else "loss"
                })
                del open_positions[sym]
        
        # Check for new entry signals (if we have capacity)
        if len(open_positions) < max_positions:
            for sym, sym_df in all_dfs.items():
                if sym in open_positions:
                    continue
                if len(open_positions) >= max_positions:
                    break
                
                day_data = sym_df[sym_df["date"] == date]
                if day_data.empty:
                    continue
                row = day_data.iloc[0]
                
                if _evaluate_entry_signal(row.to_dict(), entry_strategy):
                    position_value = cash * (position_size_pct / 100)
                    if position_value < 1000 or cash < position_value:
                        continue
                    entry_price = row["close"]
                    shares = int(position_value / entry_price)
                    if shares < 1:
                        continue
                    cost = shares * entry_price
                    cash -= cost
                    open_positions[sym] = {
                        "entry_price": entry_price,
                        "entry_date": date,
                        "shares": shares,
                        "cost": cost,
                    }
        
        portfolio_value_history.append({
            "date": str(date.date()) if hasattr(date, "date") else str(date),
            "value": round(current_portfolio_value, 2),
        })
    
    # Close all open positions at end
    for sym, pos in open_positions.items():
        sym_df = all_dfs.get(sym)
        if sym_df is not None and not sym_df.empty:
            last_price = sym_df.iloc[-1]["close"]
            proceeds = pos["shares"] * last_price
            profit = proceeds - pos["cost"]
            profit_pct = (profit / pos["cost"]) * 100
            info = stockmap.get(sym, {})
            all_trades.append({
                "symbol": sym,
                "name": info.get("name", sym),
                "entry_date": str(pos["entry_date"].date()) if hasattr(pos["entry_date"], "date") else str(pos["entry_date"]),
                "exit_date": "Open",
                "entry_price": round(pos["entry_price"], 2),
                "exit_price": round(last_price, 2),
                "shares": pos["shares"],
                "profit": round(profit, 2),
                "profit_pct": round(profit_pct, 2),
                "exit_reason": "end_of_period",
                "result": "win" if profit > 0 else "loss"
            })
    
    # Compute metrics
    final_value = portfolio_value_history[-1]["value"] if portfolio_value_history else initial_capital
    total_return_pct = ((final_value - initial_capital) / initial_capital) * 100
    
    wins = [t for t in all_trades if t["result"] == "win"]
    losses = [t for t in all_trades if t["result"] == "loss"]
    win_rate = (len(wins) / len(all_trades) * 100) if all_trades else 0
    
    avg_win = np.mean([t["profit_pct"] for t in wins]) if wins else 0
    avg_loss = abs(np.mean([t["profit_pct"] for t in losses])) if losses else 0
    
    # Max drawdown
    values = [p["value"] for p in portfolio_value_history]
    peak = initial_capital
    max_drawdown = 0.0
    for v in values:
        peak = max(peak, v)
        dd = (peak - v) / peak * 100
        max_drawdown = max(max_drawdown, dd)
    
    # Sharpe Ratio (annualized, simplified)
    if len(portfolio_value_history) > 1:
        daily_returns = pd.Series(values).pct_change().dropna()
        sharpe = (daily_returns.mean() / daily_returns.std()) * np.sqrt(252) if daily_returns.std() > 0 else 0
    else:
        sharpe = 0
    
    return {
        "summary": {
            "initial_capital": initial_capital,
            "final_value": round(final_value, 2),
            "total_return_pct": round(total_return_pct, 2),
            "total_trades": len(all_trades),
            "win_rate": round(win_rate, 1),
            "avg_win_pct": round(avg_win, 2),
            "avg_loss_pct": round(avg_loss, 2),
            "max_drawdown_pct": round(max_drawdown, 2),
            "sharpe_ratio": round(sharpe, 2),
            "profit_factor": round(avg_win / avg_loss, 2) if avg_loss > 0 else 999,
        },
        "equity_curve": portfolio_value_history,
        "trades": all_trades[-100:],  # Last 100 trades for the UI
    }
