import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import (
    init_db, get_db,
    AssetModel, LiabilityModel, TransactionModel, BudgetModel, GoalModel
)
from smart_advisor import generate_financial_insights

# Initialize Database tables
init_db()

app = FastAPI(
    title="FusionX Personal Financial Tracker & Smart Advisor API",
    description="Private backend for personal finance management, liabilities, assets, budget tracking & smart financial health advice."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Pydantic Schemas ---------------- #
class AssetCreate(BaseModel):
    name: str
    category: str
    value: float
    is_liquid: bool = True
    notes: Optional[str] = None

class LiabilityCreate(BaseModel):
    name: str
    category: str
    amount_owed: float
    interest_rate: float = 0.0
    min_monthly_payment: float = 0.0
    due_date: Optional[str] = None
    notes: Optional[str] = None

class TransactionCreate(BaseModel):
    type: str  # 'income' or 'expense'
    category: str
    amount: float
    date: str  # YYYY-MM-DD
    description: Optional[str] = None

class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float

# ---------------- API Endpoints ---------------- #

from fastapi.responses import FileResponse

@app.get("/")
def read_root():
    frontend_index = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "index.html")
    if os.path.exists(frontend_index):
        return FileResponse(frontend_index)
    return {"message": "Welcome to FusionX Private Financial Tracker API"}

@app.get("/api/status")
def get_status():
    return {
        "status": "running",
        "system": "FusionX Financial Tracker & Advisor",
        "version": "1.0.0"
    }

# --- Assets Endpoints ---
@app.get("/api/assets")
def get_assets(db: Session = Depends(get_db)):
    return db.query(AssetModel).all()

@app.post("/api/assets")
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    db_asset = AssetModel(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.delete("/api/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = db.query(AssetModel).filter(AssetModel.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(db_asset)
    db.commit()
    return {"message": "Asset deleted successfully"}

# --- Liabilities Endpoints ---
@app.get("/api/liabilities")
def get_liabilities(db: Session = Depends(get_db)):
    return db.query(LiabilityModel).all()

@app.post("/api/liabilities")
def create_liability(liability: LiabilityCreate, db: Session = Depends(get_db)):
    db_liability = LiabilityModel(**liability.dict())
    db.add(db_liability)
    db.commit()
    db.refresh(db_liability)
    return db_liability

@app.delete("/api/liabilities/{liability_id}")
def delete_liability(liability_id: int, db: Session = Depends(get_db)):
    db_liab = db.query(LiabilityModel).filter(LiabilityModel.id == liability_id).first()
    if not db_liab:
        raise HTTPException(status_code=404, detail="Liability not found")
    db.delete(db_liab)
    db.commit()
    return {"message": "Liability deleted successfully"}

# --- Transactions Endpoints ---
@app.get("/api/transactions")
def get_transactions(
    type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TransactionModel)
    if type:
        query = query.filter(TransactionModel.type == type)
    if category:
        query = query.filter(TransactionModel.category == category)
    return query.order_by(TransactionModel.date.desc()).all()

@app.post("/api/transactions")
def create_transaction(tx: TransactionCreate, db: Session = Depends(get_db)):
    if tx.type not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Transaction type must be 'income' or 'expense'")
    db_tx = TransactionModel(**tx.dict())
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

@app.delete("/api/transactions/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    db_tx = db.query(TransactionModel).filter(TransactionModel.id == tx_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_tx)
    db.commit()
    return {"message": "Transaction deleted successfully"}

# --- Budgets Endpoints ---
@app.get("/api/budgets")
def get_budgets(db: Session = Depends(get_db)):
    return db.query(BudgetModel).all()

@app.post("/api/budgets")
def create_or_update_budget(budget: BudgetCreate, db: Session = Depends(get_db)):
    existing = db.query(BudgetModel).filter(BudgetModel.category == budget.category).first()
    if existing:
        existing.monthly_limit = budget.monthly_limit
        db.commit()
        db.refresh(existing)
        return existing
    db_b = BudgetModel(**budget.dict())
    db.add(db_b)
    db.commit()
    db.refresh(db_b)
    return db_b

# --- Summary & Smart Advisor Endpoints ---
@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    assets = db.query(AssetModel).all()
    liabilities = db.query(LiabilityModel).all()
    transactions = db.query(TransactionModel).all()
    budgets = db.query(BudgetModel).all()
    
    return generate_financial_insights(assets, liabilities, transactions, budgets)

@app.get("/api/smart-advisor/insights")
def get_smart_advisor_insights(db: Session = Depends(get_db)):
    assets = db.query(AssetModel).all()
    liabilities = db.query(LiabilityModel).all()
    transactions = db.query(TransactionModel).all()
    budgets = db.query(BudgetModel).all()
    
    return generate_financial_insights(assets, liabilities, transactions, budgets)

# Mount frontend directory to serve web dashboard directly at root /
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
