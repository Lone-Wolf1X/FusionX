import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "personal_finance.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocalFinance = sessionmaker(autocommit=False, autoflush=False, bind=engine)

BaseFinance = declarative_base()

class AssetModel(BaseFinance):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False)  # Bank, Cash, Stocks, Real Estate, Gold, Crypto, FD, Mutual Funds
    value = Column(Float, nullable=False, default=0.0)
    is_liquid = Column(Boolean, default=True)  # Liquid asset for emergency fund calculation
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class LiabilityModel(BaseFinance):
    __tablename__ = "liabilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False)  # Term Loan, Overdraft (OD), Credit Card, Personal Loan, Home Loan, Car Loan
    lender = Column(String, nullable=True, default="")  # e.g. NABIL Bank, NIC Asia
    amount_owed = Column(Float, nullable=False, default=0.0)  # Current Outstanding Owed / OD Utilized
    total_principal = Column(Float, default=0.0)  # Original Principal for Term Loans
    od_limit = Column(Float, default=0.0)  # Sanctioned OD Limit for Overdraft Loans
    interest_rate = Column(Float, default=0.0)  # Annual % interest rate
    interest_frequency = Column(String, default="Monthly")  # 'Monthly' or 'Quarterly'
    min_monthly_payment = Column(Float, default=0.0)  # Monthly EMI or interest servicing
    tenure_months = Column(Integer, default=0)  # Remaining loan tenure in months
    due_date = Column(String, nullable=True)  # Day of month or date string
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class TransactionModel(BaseFinance):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # 'income' or 'expense'
    category = Column(String, nullable=False)  # Salary, Business, Investment, Food, Rent, Utilities, Shopping, Entertainment, etc.
    amount = Column(Float, nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BudgetModel(BaseFinance):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, unique=True)
    monthly_limit = Column(Float, nullable=False)

def migrate_db():
    if os.path.exists(DB_PATH):
        try:
            import sqlite3
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(liabilities)")
            columns = [col[1] for col in cursor.fetchall()]
            
            missing_cols = {
                "lender": "TEXT DEFAULT ''",
                "total_principal": "REAL DEFAULT 0.0",
                "od_limit": "REAL DEFAULT 0.0",
                "tenure_months": "INTEGER DEFAULT 0",
                "interest_frequency": "TEXT DEFAULT 'Monthly'"
            }
            for col_name, col_type in missing_cols.items():
                if col_name not in columns:
                    cursor.execute(f"ALTER TABLE liabilities ADD COLUMN {col_name} {col_type}")
            conn.commit()
            conn.close()
        except Exception as e:
            print("DB Migration notice:", e)

def init_finance_db():
    BaseFinance.metadata.create_all(bind=engine)
    migrate_db()

def get_finance_db():
    db = SessionLocalFinance()
    try:
        yield db
    finally:
        db.close()
