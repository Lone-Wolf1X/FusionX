from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
import os

from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FusionX Trade Management System API")

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to FusionX API"}

@app.get("/api/status")
def get_status(db: Session = Depends(get_db)):
    stock_count = db.query(models.Stock).count()
    data_count = db.query(models.StockData).count()
    return {
        "status": "running",
        "data_available": data_count > 0,
        "stocks_count": stock_count,
        "historical_records_count": data_count
    }

@app.get("/api/stocks")
def get_stocks(db: Session = Depends(get_db)):
    return db.query(models.Stock).all()

@app.get("/api/stocks/{symbol}/data")
def get_stock_data(symbol: str, limit: int = 100, db: Session = Depends(get_db)):
    data = db.query(models.StockData).filter(models.StockData.symbol == symbol).order_by(models.StockData.published_date.desc()).limit(limit).all()
    if not data:
        raise HTTPException(status_code=404, detail="Stock data not found")
    return data

# --- Mock TMS Features ---

# In-memory storage for mock functionality
mock_orders = []
mock_portfolio = [
    {"symbol": "NABIL", "quantity": 100, "average_price": 500, "ltp": 520, "unrealized_pl": 2000},
    {"symbol": "NICA", "quantity": 50, "average_price": 700, "ltp": 680, "unrealized_pl": -1000}
]

class OrderRequest(BaseModel):
    symbol: str
    order_type: str  # "buy" or "sell"
    quantity: int
    price: float

@app.post("/api/orders")
def place_order(order: OrderRequest):
    new_order = {
        "id": len(mock_orders) + 1,
        "symbol": order.symbol,
        "type": order.order_type,
        "quantity": order.quantity,
        "price": order.price,
        "status": "Pending"
    }
    mock_orders.append(new_order)
    return {"message": "Order placed successfully", "order": new_order}

@app.get("/api/orders")
def get_orders():
    return mock_orders

@app.get("/api/portfolio")
def get_portfolio():
    return mock_portfolio

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
