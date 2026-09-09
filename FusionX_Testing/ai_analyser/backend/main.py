from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from analyser import run_full_scan, get_stock_detail, get_suggestions, get_heatmap_data, analyse_stock
from backtester import run_backtest
from portfolio_analytics import compute_portfolio_analytics
from sector_rotation import compute_sector_rotation

app = FastAPI(title="FusionX AI Stock Analyser", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "service": "FusionX AI Analyser", "version": "2.0.0"}

@app.get("/api/scan")
def scan_all_stocks():
    """Run full technical scan on all available stocks."""
    results = run_full_scan()
    return {"count": len(results), "stocks": results}

@app.get("/api/stock/{symbol}")
def get_stock(symbol: str, period: int = 365):
    """Get OHLCV + indicators for a specific stock."""
    data = get_stock_detail(symbol.upper(), period)
    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    return data

@app.get("/api/suggestions")
def get_buy_suggestions():
    """Get AI-powered buy candidates for tomorrow's market."""
    return get_suggestions()

@app.get("/api/heatmap")
def get_heatmap():
    """Get sector-wise performance heatmap data."""
    return get_heatmap_data()

from planner import generate_trade_plan
from database import get_watchlist, add_to_watchlist, remove_from_watchlist
from pydantic import BaseModel

class PlanRequest(BaseModel):
    budget: float
    use_whitelist: bool = False

@app.get("/api/watchlist")
def api_get_watchlist():
    return {"watchlist": get_watchlist()}

@app.post("/api/watchlist/{symbol}")
def api_add_watchlist(symbol: str):
    add_to_watchlist(symbol.upper())
    return {"status": "added", "symbol": symbol.upper()}

@app.delete("/api/watchlist/{symbol}")
def api_remove_watchlist(symbol: str):
    remove_from_watchlist(symbol.upper())
    return {"status": "removed", "symbol": symbol.upper()}

from dashboard_api import get_market_dashboard_data
from pg_database import SessionLocal, UserProfile
from data import get_sectors
import json

class ProfileRequest(BaseModel):
    sectors: list[str]

class ScanManualRequest(BaseModel):
    sectors: list[str]

@app.get("/api/sectors")
def api_get_sectors():
    return get_sectors()

@app.get("/api/profile")
def get_profile():
    session = SessionLocal()
    profile = session.query(UserProfile).first()
    session.close()
    if profile and profile.selected_sectors:
        return {"sectors": json.loads(profile.selected_sectors)}
    return {"sectors": []}

@app.post("/api/profile")
def save_profile(req: ProfileRequest):
    session = SessionLocal()
    profile = session.query(UserProfile).first()
    if not profile:
        profile = UserProfile(selected_sectors=json.dumps(req.sectors))
        session.add(profile)
    else:
        profile.selected_sectors = json.dumps(req.sectors)
    session.commit()
    session.close()
    return {"status": "success"}

@app.post("/api/scan-manual")
def api_scan_manual(req: ScanManualRequest):
    return run_full_scan(req.sectors)

@app.get("/api/watchlist-detail")
def api_watchlist_detail():
    symbols = get_watchlist()
    if not symbols:
        return []
    results = []
    for sym in symbols:
        try:
            analysis = analyse_stock(sym)
            if analysis:
                results.append(analysis)
            else:
                results.append({"symbol": sym})
        except:
            results.append({"symbol": sym})
    return results

@app.get("/api/dashboard")
def api_get_dashboard():
    return get_market_dashboard_data()

@app.post("/api/plan-trades")
def api_plan_trades(req: PlanRequest):
    return generate_trade_plan(req.budget, req.use_whitelist)

# ── Backtest ───────────────────────────────────────────────────────────
class BacktestRequest(BaseModel):
    symbols: list[str]
    entry_strategy: str
    initial_capital: float = 100000.0
    take_profit_pct: float = 10.0
    stop_loss_pct: float = 5.0
    position_size_pct: float = 10.0
    max_positions: int = 5
    from_date: str = None
    to_date: str = None

@app.post("/api/backtest")
def api_backtest(req: BacktestRequest):
    return run_backtest(
        symbols=req.symbols,
        entry_strategy=req.entry_strategy,
        initial_capital=req.initial_capital,
        take_profit_pct=req.take_profit_pct,
        stop_loss_pct=req.stop_loss_pct,
        position_size_pct=req.position_size_pct,
        max_positions=req.max_positions,
        from_date=req.from_date,
        to_date=req.to_date,
    )

# ── Portfolio Analytics ───────────────────────────────────────────────
class PortfolioAnalyticsRequest(BaseModel):
    symbols: list[str]

@app.post("/api/portfolio-analytics")
def api_portfolio_analytics(req: PortfolioAnalyticsRequest):
    return compute_portfolio_analytics(req.symbols)

# ── Sector Rotation ───────────────────────────────────────────────────
@app.get("/api/sector-rotation")
def api_sector_rotation():
    return compute_sector_rotation()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
