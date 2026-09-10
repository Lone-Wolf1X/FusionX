import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "finance_tracker.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class AssetModel(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False)  # Bank, Cash, Stocks, Real Estate, Gold, Crypto, FD, Mutual Funds
    value = Column(Float, nullable=False, default=0.0)
    is_liquid = Column(Boolean, default=True)  # Liquid asset for emergency fund calculation
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class LiabilityModel(Base):
    __tablename__ = "liabilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False)  # Credit Card, Personal Loan, Home Loan, Car Loan, Debt
    amount_owed = Column(Float, nullable=False, default=0.0)
    interest_rate = Column(Float, default=0.0)  # Annual % interest rate
    min_monthly_payment = Column(Float, default=0.0)
    due_date = Column(String, nullable=True)  # Day of month or date string
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # 'income' or 'expense'
    category = Column(String, nullable=False)  # Salary, Business, Investment, Food, Rent, Utilities, Shopping, Entertainment, etc.
    amount = Column(Float, nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BudgetModel(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, unique=True)
    monthly_limit = Column(Float, nullable=False)

class GoalModel(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(String, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
