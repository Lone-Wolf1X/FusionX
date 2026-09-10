from database import (
    init_db, SessionLocal,
    AssetModel, LiabilityModel, TransactionModel, BudgetModel
)
import datetime

def seed():
    init_db()
    db = SessionLocal()

    # Clear existing data if any
    db.query(AssetModel).delete()
    db.query(LiabilityModel).delete()
    db.query(TransactionModel).delete()
    db.query(BudgetModel).delete()
    db.commit()

    # Sample Assets
    sample_assets = [
        AssetModel(name="NABIL Bank Savings Account", category="Bank", value=185000.0, is_liquid=True, notes="Primary savings account"),
        AssetModel(name="Emergency Cash Fund", category="Cash", value=35000.0, is_liquid=True, notes="In home safe"),
        AssetModel(name="NEPSE Stock Portfolio (NIFRA, GBIME, NTC)", category="Stocks", value=420000.0, is_liquid=False, notes="Demat account stocks"),
        AssetModel(name="Mutual Fund Systematic Investment Plan", category="Mutual Funds", value=95000.0, is_liquid=True, notes="Monthly SIP"),
        AssetModel(name="Gold Coins (2 Tola)", category="Gold", value=280000.0, is_liquid=False, notes="Physical gold investment"),
        AssetModel(name="Crypto Holdings (BTC/ETH)", category="Crypto", value=65000.0, is_liquid=False, notes="Hardware wallet")
    ]
    db.add_all(sample_assets)

    # Sample Liabilities
    sample_liabilities = [
        LiabilityModel(name="HBL Credit Card", category="Credit Card", amount_owed=45000.0, interest_rate=24.0, min_monthly_payment=4500.0, due_date="15th of month", notes="High interest card"),
        LiabilityModel(name="Personal Loan (Bank)", category="Personal Loan", amount_owed=150000.0, interest_rate=12.5, min_monthly_payment=8500.0, due_date="5th of month", notes="3-year term loan"),
        LiabilityModel(name="Car Loan (Vehicle)", category="Car Loan", amount_owed=380000.0, interest_rate=10.0, min_monthly_payment=12000.0, due_date="1st of month", notes="Auto finance")
    ]
    db.add_all(sample_liabilities)

    # Sample Transactions (Current & Previous Month)
    today = datetime.date.today()
    curr_month = today.strftime("%Y-%m")
    
    sample_transactions = [
        TransactionModel(type="income", category="Salary", amount=120000.0, date=f"{curr_month}-01", description="Monthly Salary Credit"),
        TransactionModel(type="income", category="Freelance", amount=35000.0, date=f"{curr_month}-08", description="Web Development Project"),
        TransactionModel(type="income", category="Dividends", amount=8500.0, date=f"{curr_month}-10", description="Stock Dividend Bonus"),
        
        TransactionModel(type="expense", category="Rent & Housing", amount=25000.0, date=f"{curr_month}-02", description="Apartment Rent"),
        TransactionModel(type="expense", category="Food & Groceries", amount=18500.0, date=f"{curr_month}-05", description="Supermarket & Daily Groceries"),
        TransactionModel(type="expense", category="EMI & Debts", amount=25000.0, date=f"{curr_month}-06", description="Loans & Credit Card Payments"),
        TransactionModel(type="expense", category="Utilities & Wifi", amount=4500.0, date=f"{curr_month}-07", description="Electricity, Water, Internet"),
        TransactionModel(type="expense", category="Entertainment & Dining", amount=9200.0, date=f"{curr_month}-12", description="Restaurants & Movies"),
        TransactionModel(type="expense", category="Shopping", amount=11000.0, date=f"{curr_month}-14", description="Clothing & Electronics")
    ]
    db.add_all(sample_transactions)

    # Sample Budgets
    sample_budgets = [
        BudgetModel(category="Food & Groceries", monthly_limit=20000.0),
        BudgetModel(category="Entertainment & Dining", monthly_limit=8000.0),
        BudgetModel(category="Shopping", monthly_limit=10000.0),
        BudgetModel(category="Rent & Housing", monthly_limit=25000.0)
    ]
    db.add_all(sample_budgets)

    db.commit()
    print("Database successfully seeded with realistic sample financial data!")
    db.close()

if __name__ == "__main__":
    seed()
