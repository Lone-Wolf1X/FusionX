from typing import List, Dict, Any
from database import AssetModel, LiabilityModel, TransactionModel, BudgetModel

def generate_financial_insights(
    assets: List[AssetModel],
    liabilities: List[LiabilityModel],
    transactions: List[TransactionModel],
    budgets: List[BudgetModel]
) -> Dict[str, Any]:
    
    # 1. Net Worth & Asset Metrics
    total_assets = sum(a.value for a in assets)
    liquid_assets = sum(a.value for a in assets if a.is_liquid)
    total_liabilities = sum(l.amount_owed for l in liabilities)
    net_worth = total_assets - total_liabilities

    # Asset Allocation Breakdown
    asset_by_category = {}
    for a in assets:
        asset_by_category[a.category] = asset_by_category.get(a.category, 0.0) + a.value

    # 2. Income vs Expenses
    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expenses = sum(t.amount for t in transactions if t.type == 'expense')
    net_savings = total_income - total_expenses
    savings_rate = (net_savings / total_income * 100.0) if total_income > 0 else 0.0

    # Expense by category
    expenses_by_category = {}
    for t in transactions:
        if t.type == 'expense':
            expenses_by_category[t.category] = expenses_by_category.get(t.category, 0.0) + t.amount

    # 3. Emergency Fund Analysis
    # Assume total_expenses represents current monthly burn rate (or fallback default)
    monthly_burn = total_expenses if total_expenses > 0 else 1.0
    emergency_months = round(liquid_assets / monthly_burn, 1) if monthly_burn > 0 else 0.0
    
    if emergency_months >= 6.0:
        emergency_status = "Optimal"
        emergency_color = "#10b981" # Green
        emergency_tip = f"Awesome! Your liquid emergency fund of रु/₹ {liquid_assets:,.2f} covers {emergency_months} months of expenses."
    elif emergency_months >= 3.0:
        emergency_status = "Adequate"
        emergency_color = "#3b82f6" # Blue
        emergency_tip = f"Good buffer! You have {emergency_months} months covered. Consider building up to 6 months for complete safety."
    elif emergency_months >= 1.0:
        emergency_status = "Needs Improvement"
        emergency_color = "#f59e0b" # Warning Yellow
        emergency_tip = f"Caution! You only have {emergency_months} months of emergency liquid buffer. Aim for at least 3-6 months."
    else:
        emergency_status = "Critical Risk"
        emergency_color = "#ef4444" # Red alert
        emergency_tip = "Urgent: Build an emergency fund of at least 3 months expenses in liquid savings or bank balance."

    # 4. Debt Payoff Strategies (Snowball vs Avalanche)
    active_debts = [l for l in liabilities if l.amount_owed > 0]
    
    # Avalanche: Sorted by Interest Rate (Descending)
    avalanche_list = sorted(active_debts, key=lambda x: x.interest_rate, reverse=True)
    # Snowball: Sorted by Amount Owed (Ascending)
    snowball_list = sorted(active_debts, key=lambda x: x.amount_owed)

    debt_insights = []
    if active_debts:
        highest_interest_debt = avalanche_list[0]
        smallest_debt = snowball_list[0]
        
        annual_interest_cost = sum((l.amount_owed * (l.interest_rate / 100.0)) for l in active_debts)
        monthly_interest_cost = annual_interest_cost / 12.0

        debt_insights.append({
            "title": "Debt Avalanche Recommendation (Save Most Interest)",
            "description": f"Focus extra payments on '{highest_interest_debt.name}' ({highest_interest_debt.interest_rate}% interest rate). This saves you maximum interest money!",
            "priority": "HIGH" if highest_interest_debt.interest_rate > 12.0 else "MEDIUM"
        })

        debt_insights.append({
            "title": "Debt Snowball Option (Quick Psychological Wins)",
            "description": f"If you prefer fast momentum, pay off '{smallest_debt.name}' (Owed: रु/₹ {smallest_debt.amount_owed:,.2f}) first.",
            "priority": "INFO"
        })

        debt_insights.append({
            "title": "Total Debt Interest Drag",
            "description": f"You are currently paying approximately रु/₹ {monthly_interest_cost:,.2f} per month (रु/₹ {annual_interest_cost:,.2f}/yr) in interest alone.",
            "priority": "WARNING" if monthly_interest_cost > 0 else "INFO"
        })
    else:
        debt_insights.append({
            "title": "Zero Debt Status 🎉",
            "description": "Congratulations! You have no active liabilities recorded. You can allocate 100% of excess cash flow to wealth building.",
            "priority": "SUCCESS"
        })

    # 5. Financial Health Score (0 - 100)
    score = 50.0 # Base score

    # Savings rate factor (+/- 25 pts)
    if savings_rate >= 30:
        score += 25
    elif savings_rate >= 20:
        score += 20
    elif savings_rate >= 10:
        score += 10
    elif savings_rate < 0:
        score -= 20

    # Emergency fund factor (+/- 25 pts)
    if emergency_months >= 6:
        score += 25
    elif emergency_months >= 3:
        score += 15
    elif emergency_months >= 1:
        score += 5
    else:
        score -= 15

    # Debt-to-Asset ratio factor (+/- 25 pts)
    if total_assets > 0:
        debt_ratio = total_liabilities / total_assets
        if debt_ratio == 0:
            score += 25
        elif debt_ratio < 0.3:
            score += 15
        elif debt_ratio < 0.6:
            score += 5
        else:
            score -= 15
    elif total_liabilities > 0:
        score -= 20

    # Normalize score 0 - 100
    final_score = max(0, min(100, int(score)))

    # Smart Action Cards
    advice_cards = []
    
    if final_score >= 80:
        score_grade = "Excellent Financial Health 🚀"
        advice_cards.append({
            "type": "success",
            "title": "Wealth Acceleration Mode",
            "message": "Your financial fundamentals are solid. Focus on compounding wealth through diversified stock portfolios, Index funds, or real estate."
        })
    elif final_score >= 60:
        score_grade = "Good Financial Standing 👍"
        advice_cards.append({
            "type": "info",
            "title": "Optimize & Balance",
            "message": "You are on the right track! Work on expanding your liquid emergency buffer and reducing any high-interest liabilities."
        })
    else:
        score_grade = "Financial Warning Level ⚠️"
        advice_cards.append({
            "type": "warning",
            "title": "Cash Flow & Debt Priority Required",
            "message": "Focus on cutting non-essential expenses, building an initial emergency cushion, and paying down high-cost debts."
        })

    # Add Category Budget warnings if configured
    budget_warnings = []
    for b in budgets:
        spent = expenses_by_category.get(b.category, 0.0)
        if spent > b.monthly_limit:
            overflow = spent - b.monthly_limit
            budget_warnings.append({
                "category": b.category,
                "limit": b.monthly_limit,
                "spent": spent,
                "overflow": overflow,
                "message": f"Over-budget in {b.category} by रु/₹ {overflow:,.2f}!"
            })

    return {
        "net_worth": net_worth,
        "total_assets": total_assets,
        "liquid_assets": liquid_assets,
        "total_liabilities": total_liabilities,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_savings": net_savings,
        "savings_rate": round(savings_rate, 1),
        "emergency_fund": {
            "months_covered": emergency_months,
            "status": emergency_status,
            "color": emergency_color,
            "tip": emergency_tip
        },
        "health_score": final_score,
        "score_grade": score_grade,
        "asset_distribution": asset_by_category,
        "expense_distribution": expenses_by_category,
        "debt_avalanche": [{"name": d.name, "amount": d.amount_owed, "rate": d.interest_rate} for d in avalanche_list],
        "debt_snowball": [{"name": d.name, "amount": d.amount_owed, "rate": d.interest_rate} for d in snowball_list],
        "debt_insights": debt_insights,
        "advice_cards": advice_cards,
        "budget_warnings": budget_warnings
    }
