const API_BASE = window.location.origin.includes("http") ? window.location.origin + "/api" : "http://localhost:8000/api";

// State variables
let currentTab = "dashboard";
let assetChartInstance = null;
let expenseChartInstance = null;

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initModals();
    initFormListeners();
    
    // Initial Data Load
    loadAllData();
});

// Navigation Handler
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-links li");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const tabName = item.getAttribute("data-tab");
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;

    // Update active nav link
    document.querySelectorAll(".nav-links li").forEach(li => {
        li.classList.toggle("active", li.getAttribute("data-tab") === tabName);
    });

    // Update active section
    document.querySelectorAll(".tab-content").forEach(sec => {
        sec.classList.toggle("active", sec.id === `tab-${tabName}`);
    });

    // Update page headers
    const title = document.getElementById("page-title");
    const subtitle = document.getElementById("page-subtitle");

    switch (tabName) {
        case "dashboard":
            title.textContent = "Financial Dashboard";
            subtitle.textContent = "Overview of net worth, cashflow & overall wealth structure";
            break;
        case "assets":
            title.textContent = "Assets & Wealth Holdings";
            subtitle.textContent = "Manage bank accounts, cash, investments, stocks, and real estate";
            break;
        case "liabilities":
            title.textContent = "Liabilities & Debt Management";
            subtitle.textContent = "Track loans, credit cards, EMIs and plan interest reduction";
            break;
        case "transactions":
            title.textContent = "Transactions & Cash Flow";
            subtitle.textContent = "Log incomes and expenses to optimize monthly savings";
            break;
        case "advisor":
            title.textContent = "Smart Financial Doctor & Advisor";
            subtitle.textContent = "Personalized wealth advice, debt avalanche plan, and emergency readiness";
            break;
    }

    loadAllData();
}

// Data Fetching Central Orchestrator
async function loadAllData() {
    try {
        const res = await fetch(`${API_BASE}/dashboard/summary`);
        if (!res.ok) throw new Error("Failed to connect to backend API");
        const data = await res.json();

        renderDashboardSummary(data);
        renderAdvisor(data);

        if (currentTab === "assets") renderAssetsTable();
        if (currentTab === "liabilities") renderLiabilitiesTable();
        if (currentTab === "transactions") renderTransactionsTable();

    } catch (err) {
        console.error("API error:", err);
    }
}

// Format Currency Utility
function formatCurrency(val) {
    return `रु/₹ ${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Render Dashboard Summary Metrics & Charts
function renderDashboardSummary(data) {
    document.getElementById("dash-net-worth").textContent = formatCurrency(data.net_worth);
    document.getElementById("dash-assets").textContent = formatCurrency(data.total_assets);
    document.getElementById("dash-liquid-assets").textContent = `Liquid: ${formatCurrency(data.liquid_assets)}`;
    document.getElementById("dash-liabilities").textContent = formatCurrency(data.total_liabilities);
    document.getElementById("dash-savings-rate").textContent = `${data.savings_rate}%`;
    document.getElementById("dash-net-savings").textContent = `Net Savings: ${formatCurrency(data.net_savings)}`;

    // Quick Advisor Banner
    document.getElementById("dash-health-badge").textContent = `Score: ${data.health_score}/100`;
    document.getElementById("dash-health-title").textContent = data.score_grade;
    document.getElementById("dash-health-tip").textContent = data.emergency_fund.tip;

    // Render Charts
    renderAssetChart(data.asset_distribution);
    renderExpenseChart(data.expense_distribution);
}

// Render Asset Distribution Doughnut Chart
function renderAssetChart(distribution) {
    const ctx = document.getElementById("assetChart").getContext("2d");
    if (assetChartInstance) assetChartInstance.destroy();

    const labels = Object.keys(distribution || {});
    const values = Object.values(distribution || {});

    assetChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['No Assets Yet'],
            datasets: [{
                data: values.length ? values : [1],
                backgroundColor: [
                    '#06b6d4', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
                }
            }
        }
    });
}

// Render Expense Distribution Bar Chart
function renderExpenseChart(distribution) {
    const ctx = document.getElementById("expenseChart").getContext("2d");
    if (expenseChartInstance) expenseChartInstance.destroy();

    const labels = Object.keys(distribution || {});
    const values = Object.values(distribution || {});

    expenseChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['No Expenses'],
            datasets: [{
                label: 'Expenses (रु/₹)',
                data: values.length ? values : [0],
                backgroundColor: 'rgba(244, 63, 94, 0.7)',
                borderColor: '#f43f5e',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render Assets Table
async function renderAssetsTable() {
    const res = await fetch(`${API_BASE}/assets`);
    const assets = await res.json();
    const tbody = document.getElementById("assets-tbody");

    if (!assets.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">No assets recorded yet. Click '+ Asset' to add one.</td></tr>`;
        return;
    }

    tbody.innerHTML = assets.map(a => `
        <tr>
            <td><strong>${a.name}</strong></td>
            <td><span class="badge">${a.category}</span></td>
            <td>${a.is_liquid ? '<span style="color:#10b981;">● Liquid</span>' : '<span style="color:#64748b;">● Fixed</span>'}</td>
            <td><strong>${formatCurrency(a.value)}</strong></td>
            <td>
                <button class="btn-danger-sm" onclick="deleteAsset(${a.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join("");
}

async function deleteAsset(id) {
    if (confirm("Are you sure you want to delete this asset?")) {
        await fetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' });
        loadAllData();
    }
}

// Render Liabilities Table
async function renderLiabilitiesTable() {
    const res = await fetch(`${API_BASE}/liabilities`);
    const liabilities = await res.json();
    const tbody = document.getElementById("liabilities-tbody");

    if (!liabilities.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;">No liabilities recorded. 🎉 You are debt free!</td></tr>`;
        return;
    }

    tbody.innerHTML = liabilities.map(l => `
        <tr>
            <td><strong>${l.name}</strong></td>
            <td><span class="badge">${l.category}</span></td>
            <td><strong style="color:${l.interest_rate > 15 ? '#f43f5e' : '#f59e0b'};">${l.interest_rate}% p.a.</strong></td>
            <td>${formatCurrency(l.min_monthly_payment)}</td>
            <td><strong style="color:#f43f5e;">${formatCurrency(l.amount_owed)}</strong></td>
            <td>
                <button class="btn-danger-sm" onclick="deleteLiability(${l.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join("");
}

async function deleteLiability(id) {
    if (confirm("Delete this liability record?")) {
        await fetch(`${API_BASE}/liabilities/${id}`, { method: 'DELETE' });
        loadAllData();
    }
}

// Render Transactions Table
async function renderTransactionsTable() {
    const res = await fetch(`${API_BASE}/transactions`);
    const txs = await res.json();
    const tbody = document.getElementById("transactions-tbody");

    if (!txs.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;">No transactions logged.</td></tr>`;
        return;
    }

    tbody.innerHTML = txs.map(t => `
        <tr>
            <td>${t.date}</td>
            <td>${t.type === 'income' ? '<span style="color:#10b981; font-weight:700;">+ Income</span>' : '<span style="color:#f43f5e; font-weight:700;">- Expense</span>'}</td>
            <td><span class="badge">${t.category}</span></td>
            <td>${t.description || '-'}</td>
            <td><strong style="color:${t.type === 'income' ? '#10b981' : '#f43f5e'};">${formatCurrency(t.amount)}</strong></td>
            <td>
                <button class="btn-danger-sm" onclick="deleteTransaction(${t.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join("");
}

async function deleteTransaction(id) {
    if (confirm("Delete this transaction?")) {
        await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
        loadAllData();
    }
}

// Render Smart Advisor Engine Insights
function renderAdvisor(data) {
    // Health Score
    document.getElementById("adv-score-num").textContent = data.health_score;
    document.getElementById("adv-score-grade").textContent = data.score_grade;

    // Emergency Fund
    const emerg = data.emergency_fund;
    document.getElementById("adv-emerg-badge").textContent = emerg.status;
    document.getElementById("adv-emerg-badge").style.color = emerg.color;
    document.getElementById("adv-emerg-badge").style.backgroundColor = `${emerg.color}22`;
    document.getElementById("adv-emerg-tip").textContent = emerg.tip;
    
    // Progress bar width (max 6 months = 100%)
    const pct = Math.min(100, Math.max(5, (emerg.months_covered / 6.0) * 100));
    document.getElementById("adv-emerg-bar").style.width = `${pct}%`;
    document.getElementById("adv-emerg-bar").style.backgroundColor = emerg.color;

    // Debt Optimization Cards
    const debtContainer = document.getElementById("adv-debt-cards");
    debtContainer.innerHTML = data.debt_insights.map(card => `
        <div class="advice-card ${card.priority}">
            <h4>${card.title}</h4>
            <p>${card.description}</p>
        </div>
    `).join("");

    // Action Cards
    const actionContainer = document.getElementById("adv-action-cards");
    let html = data.advice_cards.map(card => `
        <div class="advice-card ${card.type}">
            <h4>${card.title}</h4>
            <p>${card.message}</p>
        </div>
    `).join("");

    // Budget Warnings if any
    if (data.budget_warnings && data.budget_warnings.length > 0) {
        html += data.budget_warnings.map(w => `
            <div class="advice-card warning">
                <h4>Budget Alert: ${w.category}</h4>
                <p>${w.message}</p>
            </div>
        `).join("");
    }

    actionContainer.innerHTML = html;
}

// Modal Handlers
function initModals() {
    const modals = {
        asset: document.getElementById("modal-asset"),
        liability: document.getElementById("modal-liability"),
        tx: document.getElementById("modal-tx")
    };

    document.getElementById("btn-open-asset-modal").addEventListener("click", () => modals.asset.classList.add("active"));
    document.getElementById("btn-open-liability-modal").addEventListener("click", () => modals.liability.classList.add("active"));
    document.getElementById("btn-open-tx-modal").addEventListener("click", () => {
        document.getElementById("tx-date").valueAsDate = new Date();
        modals.tx.classList.add("active");
    });

    document.querySelectorAll(".btn-close-modal").forEach(btn => {
        btn.addEventListener("click", () => {
            Object.values(modals).forEach(m => m.classList.remove("active"));
        });
    });
}

// Form Submission Handlers
function initFormListeners() {
    // Add Asset Form
    document.getElementById("form-add-asset").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("asset-name").value,
            category: document.getElementById("asset-category").value,
            value: parseFloat(document.getElementById("asset-value").value),
            is_liquid: document.getElementById("asset-liquid").checked
        };

        await fetch(`${API_BASE}/assets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        document.getElementById("modal-asset").classList.remove("active");
        e.target.reset();
        loadAllData();
    });

    // Add Liability Form
    document.getElementById("form-add-liability").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("liability-name").value,
            category: document.getElementById("liability-category").value,
            amount_owed: parseFloat(document.getElementById("liability-amount").value),
            interest_rate: parseFloat(document.getElementById("liability-interest").value || 0),
            min_monthly_payment: parseFloat(document.getElementById("liability-emi").value || 0)
        };

        await fetch(`${API_BASE}/liabilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        document.getElementById("modal-liability").classList.remove("active");
        e.target.reset();
        loadAllData();
    });

    // Add Transaction Form
    document.getElementById("form-add-tx").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            type: document.getElementById("tx-type").value,
            category: document.getElementById("tx-category").value,
            amount: parseFloat(document.getElementById("tx-amount").value),
            date: document.getElementById("tx-date").value,
            description: document.getElementById("tx-desc").value
        };

        await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        document.getElementById("modal-tx").classList.remove("active");
        e.target.reset();
        loadAllData();
    });
}
