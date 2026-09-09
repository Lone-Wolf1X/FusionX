"""
FusionX Sector Rotation Engine
Identifies leading and lagging sectors and recommends allocation.
"""
import numpy as np
from data import load_stock_df, get_available_symbols
import json, os


def compute_sector_rotation() -> dict:
    """
    Analyzes each sector's average return over 1M, 3M, 6M periods
    to identify momentum leaders and laggards.
    """
    stockmap_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../resources/nepse_stockmap.json"))
    stockmap = {}
    try:
        with open(stockmap_path) as f:
            stockmap = json.load(f)
    except:
        pass

    symbols = get_available_symbols()

    sector_data: dict = {}

    for sym in symbols:
        info = stockmap.get(sym, {})
        sector = info.get("sector", "Other")
        df = load_stock_df(sym)
        if df is None or len(df) < 130:
            continue

        df = df.sort_values("date").reset_index(drop=True)
        close = df["close"]

        ltp = float(close.iloc[-1])
        p1m = float(close.iloc[-22]) if len(close) >= 22 else ltp
        p3m = float(close.iloc[-66]) if len(close) >= 66 else ltp
        p6m = float(close.iloc[-126]) if len(close) >= 126 else ltp

        ret_1m = ((ltp - p1m) / p1m) * 100
        ret_3m = ((ltp - p3m) / p3m) * 100
        ret_6m = ((ltp - p6m) / p6m) * 100

        if sector not in sector_data:
            sector_data[sector] = {"ret_1m": [], "ret_3m": [], "ret_6m": [], "count": 0}

        sector_data[sector]["ret_1m"].append(ret_1m)
        sector_data[sector]["ret_3m"].append(ret_3m)
        sector_data[sector]["ret_6m"].append(ret_6m)
        sector_data[sector]["count"] += 1

    results = []
    for sector, data in sector_data.items():
        if data["count"] < 2:
            continue
        avg_1m = float(np.mean(data["ret_1m"]))
        avg_3m = float(np.mean(data["ret_3m"]))
        avg_6m = float(np.mean(data["ret_6m"]))
        # Momentum score: weighted average of periods
        momentum = (avg_1m * 0.5 + avg_3m * 0.3 + avg_6m * 0.2)
        results.append({
            "sector": sector,
            "avg_1m": round(avg_1m, 2),
            "avg_3m": round(avg_3m, 2),
            "avg_6m": round(avg_6m, 2),
            "momentum_score": round(momentum, 2),
            "stock_count": data["count"],
        })

    results.sort(key=lambda x: x["momentum_score"], reverse=True)

    # Label leaders / neutral / laggards
    for i, r in enumerate(results):
        if i < 3:
            r["status"] = "leading"
        elif i >= len(results) - 3:
            r["status"] = "lagging"
        else:
            r["status"] = "neutral"

    # Determine market cycle phase
    top_sectors = [r["sector"] for r in results[:3]]
    if any(s in top_sectors for s in ["Commercial Banks", "Development Banks", "Finance"]):
        phase = "Recovery / Early Bull"
        phase_desc = "Financial stocks leading — early economic recovery underway."
    elif any(s in top_sectors for s in ["Hydro Power", "Energy", "Manufacturing"]):
        phase = "Expansion / Bull Run"
        phase_desc = "Growth sectors outperforming — market in expansion phase."
    elif any(s in top_sectors for s in ["Insurance", "Life Insurance"]):
        phase = "Late Bull / Defensive"
        phase_desc = "Defensive stocks leading — caution advised, cycle may be topping."
    else:
        phase = "Mixed / Neutral"
        phase_desc = "No clear dominant sector theme — stay selective."

    return {
        "sectors": results,
        "market_phase": phase,
        "phase_description": phase_desc,
        "leading": results[:3],
        "lagging": results[-3:] if len(results) >= 3 else [],
    }
