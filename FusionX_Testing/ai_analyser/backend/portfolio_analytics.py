"""
FusionX Portfolio Analytics
Sharpe Ratio, Correlation Matrix, Kelly Criterion
"""
import pandas as pd
import numpy as np
from typing import Optional
from data import load_stock_df


def compute_portfolio_analytics(symbols: list[str]) -> dict:
    """
    Compute portfolio analytics for a given list of stock symbols.
    Returns Sharpe ratios, correlation matrix, and Kelly criterion.
    """
    returns_dict = {}
    missing = []

    for sym in symbols:
        df = load_stock_df(sym)
        if df is None or len(df) < 60:
            missing.append(sym)
            continue
        df = df.sort_values("date").tail(252)  # ~1 year of data
        rets = df["close"].pct_change().dropna()
        returns_dict[sym] = rets.reset_index(drop=True)

    if len(returns_dict) < 2:
        return {"error": "Need at least 2 valid stocks for analysis."}

    # Align all returns by length (use min length)
    min_len = min(len(v) for v in returns_dict.values())
    aligned = {sym: rets.tail(min_len).values for sym, rets in returns_dict.items()}

    returns_df = pd.DataFrame(aligned)

    # ── Correlation Matrix ───────────────────────────────────────────
    corr_matrix = returns_df.corr()

    # Build flat grid for frontend
    corr_grid = []
    symbols_list = list(aligned.keys())
    for i, sym_a in enumerate(symbols_list):
        for j, sym_b in enumerate(symbols_list):
            corr_grid.append({
                "x": sym_a,
                "y": sym_b,
                "value": round(float(corr_matrix.loc[sym_a, sym_b]), 3)
            })

    import json, os
    stockmap_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../resources/nepse_stockmap.json"))
    stockmap = {}
    try:
        with open(stockmap_path) as f:
            stockmap = json.load(f)
    except:
        pass

    # ── Per-Stock Sharpe Ratio (1-year) ─────────────────────────────
    sharpe_per_stock = []
    for sym, rets in aligned.items():
        mean_ret = np.mean(rets)
        std_ret = np.std(rets)
        annualized_sharpe = (mean_ret / std_ret) * np.sqrt(252) if std_ret > 0 else 0
        ann_return = mean_ret * 252 * 100
        ann_vol = std_ret * np.sqrt(252) * 100
        info = stockmap.get(sym, {})
        sharpe_per_stock.append({
            "symbol": sym,
            "name": info.get("name", sym),
            "sharpe_ratio": round(annualized_sharpe, 2),
            "annual_return_pct": round(ann_return, 2),
            "annual_volatility_pct": round(ann_vol, 2),
        })

    sharpe_per_stock.sort(key=lambda x: x["sharpe_ratio"], reverse=True)

    # ── Portfolio-Level Sharpe (equal weight) ─────────────────────
    portfolio_returns = returns_df.mean(axis=1)  # equal weighted
    port_mean = portfolio_returns.mean()
    port_std = portfolio_returns.std()
    portfolio_sharpe = (port_mean / port_std) * np.sqrt(252) if port_std > 0 else 0
    portfolio_ann_return = port_mean * 252 * 100
    portfolio_ann_vol = port_std * np.sqrt(252) * 100

    # ── Kelly Criterion per Stock ────────────────────────────────────
    kelly_suggestions = []
    for sym, rets in aligned.items():
        wins = rets[rets > 0]
        losses = rets[rets < 0]
        if len(wins) == 0 or len(losses) == 0:
            continue
        win_prob = len(wins) / len(rets)
        avg_win = np.mean(wins)
        avg_loss = abs(np.mean(losses))
        b = avg_win / avg_loss  # win/loss ratio
        kelly_pct = win_prob - ((1 - win_prob) / b) if b > 0 else 0
        kelly_pct = max(0, min(kelly_pct, 0.25))  # cap at 25% safety
        info = stockmap.get(sym, {})
        kelly_suggestions.append({
            "symbol": sym,
            "name": info.get("name", sym),
            "kelly_pct": round(kelly_pct * 100, 1),
            "win_rate": round(win_prob * 100, 1),
            "win_loss_ratio": round(b, 2),
        })

    kelly_suggestions.sort(key=lambda x: x["kelly_pct"], reverse=True)

    # ── Risk Label ─────────────────────────────────────────────────
    if portfolio_sharpe >= 1.5:
        risk_label = "Excellent"
        risk_color = "#059669"
    elif portfolio_sharpe >= 1.0:
        risk_label = "Good"
        risk_color = "#10B981"
    elif portfolio_sharpe >= 0.5:
        risk_label = "Moderate"
        risk_color = "#F59E0B"
    else:
        risk_label = "High Risk"
        risk_color = "#DC2626"

    # Average correlation (diversification score — lower is better)
    upper = corr_matrix.values[np.triu_indices_from(corr_matrix.values, k=1)]
    avg_correlation = float(np.mean(upper)) if len(upper) > 0 else 0
    diversification_score = round(max(0, (1 - avg_correlation) * 100), 1)

    return {
        "symbols": symbols_list,
        "missing": missing,
        "correlation": corr_grid,
        "sharpe_per_stock": sharpe_per_stock,
        "portfolio": {
            "sharpe_ratio": round(portfolio_sharpe, 2),
            "annual_return_pct": round(portfolio_ann_return, 2),
            "annual_volatility_pct": round(portfolio_ann_vol, 2),
            "risk_label": risk_label,
            "risk_color": risk_color,
        },
        "kelly": kelly_suggestions,
        "diversification_score": diversification_score,
        "avg_correlation": round(avg_correlation, 3),
    }
