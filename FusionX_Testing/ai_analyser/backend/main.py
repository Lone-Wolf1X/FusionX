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

from update_data import main as run_update_data
import threading

@app.get("/api/update-data")
@app.post("/api/update-data")
def api_update_data():
    """Trigger fetch of latest daily market data for all NEPSE stocks."""
    thread = threading.Thread(target=run_update_data)
    thread.start()
    return {"status": "started", "message": "Fetching latest market data..."}

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

# ── Personal Financial Tracker & Smart Advisor ───────────────────────
from finance_database import (
    init_finance_db, get_finance_db,
    AssetModel, LiabilityModel, TransactionModel, BudgetModel
)
from finance_smart_advisor import generate_financial_insights
from sqlalchemy.orm import Session
from fastapi import Depends
from typing import Optional

init_finance_db()

# Seed initial finance demo data if empty
def seed_finance_data_if_empty():
    from finance_database import SessionLocalFinance
    db = SessionLocalFinance()
    if db.query(AssetModel).count() == 0:
        sample_assets = [
            AssetModel(name="NABIL Bank Savings Account", category="Bank", value=185000.0, is_liquid=True, notes="Primary savings account"),
            AssetModel(name="Emergency Cash Fund", category="Cash", value=35000.0, is_liquid=True, notes="In home safe"),
            AssetModel(name="NEPSE Stock Portfolio (NIFRA, GBIME, NTC)", category="Stocks", value=420000.0, is_liquid=False, notes="Demat account stocks"),
            AssetModel(name="Mutual Fund Systematic Investment Plan", category="Mutual Funds", value=95000.0, is_liquid=True, notes="Monthly SIP"),
            AssetModel(name="Gold Coins (2 Tola)", category="Gold", value=280000.0, is_liquid=False, notes="Physical gold investment"),
            AssetModel(name="Crypto Holdings (BTC/ETH)", category="Crypto", value=65000.0, is_liquid=False, notes="Hardware wallet")
        ]
        sample_liabilities = [
            LiabilityModel(name="HBL Credit Card", category="Credit Card", amount_owed=45000.0, interest_rate=24.0, min_monthly_payment=4500.0, due_date="15th of month"),
            LiabilityModel(name="Personal Loan (Bank)", category="Personal Loan", amount_owed=150000.0, interest_rate=12.5, min_monthly_payment=8500.0, due_date="5th of month"),
            LiabilityModel(name="Car Loan (Vehicle)", category="Car Loan", amount_owed=380000.0, interest_rate=10.0, min_monthly_payment=12000.0, due_date="1st of month")
        ]
        sample_transactions = [
            TransactionModel(type="income", category="Salary", amount=120000.0, date="2026-09-01", description="Monthly Salary Credit"),
            TransactionModel(type="income", category="Freelance", amount=35000.0, date="2026-09-08", description="Web Development Project"),
            TransactionModel(type="expense", category="Rent & Housing", amount=25000.0, date="2026-09-02", description="Apartment Rent"),
            TransactionModel(type="expense", category="Food & Groceries", amount=18500.0, date="2026-09-05", description="Supermarket & Daily Groceries"),
            TransactionModel(type="expense", category="EMI & Debts", amount=25000.0, date="2026-09-06", description="Loans & Credit Card Payments"),
            TransactionModel(type="expense", category="Utilities & Wifi", amount=4500.0, date="2026-09-07", description="Electricity, Water, Internet"),
            TransactionModel(type="expense", category="Entertainment & Dining", amount=9200.0, date="2026-09-10", description="Restaurants & Movies"),
            TransactionModel(type="expense", category="Shopping", amount=11000.0, date="2026-09-10", description="Clothing & Electronics")
        ]
        sample_budgets = [
            BudgetModel(category="Food & Groceries", monthly_limit=20000.0),
            BudgetModel(category="Entertainment & Dining", monthly_limit=8000.0),
            BudgetModel(category="Shopping", monthly_limit=10000.0)
        ]
        db.add_all(sample_assets + sample_liabilities + sample_transactions + sample_budgets)
        db.commit()
    db.close()

seed_finance_data_if_empty()

class AssetCreateReq(BaseModel):
    name: str
    category: str
    value: float
    is_liquid: bool = True
    notes: Optional[str] = None

class LiabilityCreateReq(BaseModel):
    name: str
    category: str
    amount_owed: float
    lender: Optional[str] = ""
    total_principal: Optional[float] = 0.0
    od_limit: Optional[float] = 0.0
    interest_rate: float = 0.0
    interest_frequency: Optional[str] = "Monthly"
    min_monthly_payment: float = 0.0
    tenure_months: Optional[int] = 0
    due_date: Optional[str] = None

class TransactionCreateReq(BaseModel):
    type: str
    category: str
    amount: float
    date: str
    description: Optional[str] = None

@app.get("/api/finance/summary")
def get_finance_summary(db: Session = Depends(get_finance_db)):
    assets = db.query(AssetModel).all()
    liabilities = db.query(LiabilityModel).all()
    transactions = db.query(TransactionModel).all()
    budgets = db.query(BudgetModel).all()
    return generate_financial_insights(assets, liabilities, transactions, budgets)

@app.get("/api/finance/assets")
def get_finance_assets(db: Session = Depends(get_finance_db)):
    return db.query(AssetModel).all()

@app.post("/api/finance/assets")
def create_finance_asset(asset: AssetCreateReq, db: Session = Depends(get_finance_db)):
    db_asset = AssetModel(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.delete("/api/finance/assets/{asset_id}")
def delete_finance_asset(asset_id: int, db: Session = Depends(get_finance_db)):
    db_asset = db.query(AssetModel).filter(AssetModel.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(db_asset)
    db.commit()
    return {"status": "deleted"}

@app.put("/api/finance/assets/{asset_id}")
def update_finance_asset(asset_id: int, asset: AssetCreateReq, db: Session = Depends(get_finance_db)):
    db_asset = db.query(AssetModel).filter(AssetModel.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    for key, val in asset.dict().items():
        setattr(db_asset, key, val)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.get("/api/finance/liabilities")
def get_finance_liabilities(db: Session = Depends(get_finance_db)):
    return db.query(LiabilityModel).all()

@app.post("/api/finance/liabilities")
def create_finance_liability(liability: LiabilityCreateReq, db: Session = Depends(get_finance_db)):
    db_liab = LiabilityModel(**liability.dict())
    db.add(db_liab)
    db.commit()
    db.refresh(db_liab)
    return db_liab

@app.put("/api/finance/liabilities/{liability_id}")
def update_finance_liability(liability_id: int, liability: LiabilityCreateReq, db: Session = Depends(get_finance_db)):
    db_liab = db.query(LiabilityModel).filter(LiabilityModel.id == liability_id).first()
    if not db_liab:
        raise HTTPException(status_code=404, detail="Liability not found")
    for key, val in liability.dict().items():
        setattr(db_liab, key, val)
    db.commit()
    db.refresh(db_liab)
    return db_liab

@app.delete("/api/finance/liabilities/{liability_id}")
def delete_finance_liability(liability_id: int, db: Session = Depends(get_finance_db)):
    db_liab = db.query(LiabilityModel).filter(LiabilityModel.id == liability_id).first()
    if not db_liab:
        raise HTTPException(status_code=404, detail="Liability not found")
    db.delete(db_liab)
    db.commit()
    return {"status": "deleted"}

@app.get("/api/finance/transactions")
def get_finance_transactions(db: Session = Depends(get_finance_db)):
    return db.query(TransactionModel).order_by(TransactionModel.date.desc()).all()

@app.post("/api/finance/transactions")
def create_finance_transaction(tx: TransactionCreateReq, db: Session = Depends(get_finance_db)):
    db_tx = TransactionModel(**tx.dict())
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@app.put("/api/finance/transactions/{tx_id}")
def update_finance_transaction(tx_id: int, tx: TransactionCreateReq, db: Session = Depends(get_finance_db)):
    db_tx = db.query(TransactionModel).filter(TransactionModel.id == tx_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for key, val in tx.dict().items():
        setattr(db_tx, key, val)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@app.delete("/api/finance/transactions/{tx_id}")
def delete_finance_transaction(tx_id: int, db: Session = Depends(get_finance_db)):
    db_tx = db.query(TransactionModel).filter(TransactionModel.id == tx_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_tx)
    db.commit()
    return {"status": "deleted"}

@app.delete("/api/finance/reset")
def reset_finance_data(db: Session = Depends(get_finance_db)):
    db.query(AssetModel).delete()
    db.query(LiabilityModel).delete()
    db.query(TransactionModel).delete()
    db.query(BudgetModel).delete()
    db.commit()
    return {"status": "cleared", "message": "All financial records cleared. Ready for your personal details!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
