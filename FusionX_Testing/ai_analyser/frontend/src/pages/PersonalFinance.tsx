import { useEffect, useState } from 'react';
import {
  Wallet, Shield, ArrowUpRight, ArrowDownRight, Plus, Trash2, Edit3,
  PieChart as PieIcon, BarChart2, ShieldAlert, Award,
  Sparkles, CheckCircle2, AlertTriangle, Coins, CreditCard, RotateCcw, X,
  Building2, Landmark, Gauge, Clock, Calculator, Calendar
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts';

const PIE_COLORS = ['#0284C7', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0891B2', '#6366F1'];

export default function PersonalFinance() {
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'liabilities' | 'transactions' | 'advisor'>('overview');
  const [liabilityFilter, setLiabilityFilter] = useState<'all' | 'term' | 'od' | 'cards'>('all');
  
  const [summary, setSummary] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Edit Tracking
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);

  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [editingLiabilityId, setEditingLiabilityId] = useState<number | null>(null);

  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTxId, setEditingTxId] = useState<number | null>(null);

  // Form states
  const [newAsset, setNewAsset] = useState({ name: '', category: 'Bank', value: '', is_liquid: true });
  const [newLiability, setNewLiability] = useState({
    name: '',
    category: 'Overdraft (OD)',
    lender: '',
    amount_owed: '',
    total_principal: '',
    od_limit: '',
    interest_rate: '12.0',
    interest_frequency: 'Quarterly',
    min_monthly_payment: '0',
    tenure_months: '0'
  });
  const [newTx, setNewTx] = useState({ type: 'expense', category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, assRes, liabRes, txRes] = await Promise.all([
        fetch('http://161.118.189.212/api/finance/summary').then(r => r.json()),
        fetch('http://161.118.189.212/api/finance/assets').then(r => r.json()),
        fetch('http://161.118.189.212/api/finance/liabilities').then(r => r.json()),
        fetch('http://161.118.189.212/api/finance/transactions').then(r => r.json()),
      ]);
      setSummary(sumRes);
      setAssets(assRes);
      setLiabilities(liabRes);
      setTransactions(txRes);
    } catch (err) {
      console.error('Error fetching financial tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto Interest Calculator for Overdraft / Loans
  const calcUtilized = parseFloat(newLiability.amount_owed || '0');
  const calcRate = parseFloat(newLiability.interest_rate || '0');
  const annualInterest = calcUtilized * (calcRate / 100.0);
  const monthlyInterest = annualInterest / 12.0;
  const quarterlyInterest = annualInterest / 4.0;

  const autoFillInterest = () => {
    if (newLiability.interest_frequency === 'Quarterly') {
      setNewLiability(prev => ({ ...prev, min_monthly_payment: quarterlyInterest.toFixed(2) }));
    } else {
      setNewLiability(prev => ({ ...prev, min_monthly_payment: monthlyInterest.toFixed(2) }));
    }
  };

  // Close & Reset Handlers
  const closeAssetModal = () => {
    setShowAssetModal(false);
    setEditingAssetId(null);
    setNewAsset({ name: '', category: 'Bank', value: '', is_liquid: true });
  };

  const closeLiabilityModal = () => {
    setShowLiabilityModal(false);
    setEditingLiabilityId(null);
    setNewLiability({
      name: '',
      category: 'Overdraft (OD)',
      lender: '',
      amount_owed: '',
      total_principal: '',
      od_limit: '',
      interest_rate: '12.0',
      interest_frequency: 'Quarterly',
      min_monthly_payment: '0',
      tenure_months: '0'
    });
  };

  const closeTxModal = () => {
    setShowTxModal(false);
    setEditingTxId(null);
    setNewTx({ type: 'expense', category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  };

  // Open Modal for Editing Asset
  const handleOpenEditAsset = (a: any) => {
    setEditingAssetId(a.id);
    setNewAsset({
      name: a.name,
      category: a.category,
      value: String(a.value),
      is_liquid: a.is_liquid
    });
    setShowAssetModal(true);
  };

  // Open Modal for Creating New Asset
  const handleOpenNewAsset = () => {
    setEditingAssetId(null);
    setNewAsset({ name: '', category: 'Bank', value: '', is_liquid: true });
    setShowAssetModal(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.value) return;

    const payload = {
      ...newAsset,
      value: parseFloat(newAsset.value || '0')
    };

    if (editingAssetId) {
      await fetch(`http://161.118.189.212/api/finance/assets/${editingAssetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch('http://161.118.189.212/api/finance/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    closeAssetModal();
    loadData();
  };

  const handleDeleteAsset = async (id: number) => {
    if (confirm('Delete this asset?')) {
      await fetch(`http://161.118.189.212/api/finance/assets/${id}`, { method: 'DELETE' });
      loadData();
    }
  };

  // Open Modal for Editing Liability
  const handleOpenEditLiability = (l: any) => {
    setEditingLiabilityId(l.id);
    setNewLiability({
      name: l.name,
      category: l.category,
      lender: l.lender || '',
      amount_owed: String(l.amount_owed || ''),
      total_principal: String(l.total_principal || ''),
      od_limit: String(l.od_limit || ''),
      interest_rate: String(l.interest_rate || '0'),
      interest_frequency: l.interest_frequency || 'Quarterly',
      min_monthly_payment: String(l.min_monthly_payment || '0'),
      tenure_months: String(l.tenure_months || '0')
    });
    setShowLiabilityModal(true);
  };

  // Open Modal for Creating New Liability
  const handleOpenNewLiability = () => {
    setEditingLiabilityId(null);
    setNewLiability({
      name: '',
      category: 'Overdraft (OD)',
      lender: '',
      amount_owed: '',
      total_principal: '',
      od_limit: '',
      interest_rate: '12.0',
      interest_frequency: 'Quarterly',
      min_monthly_payment: '0',
      tenure_months: '0'
    });
    setShowLiabilityModal(true);
  };

  const handleSaveLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiability.name || !newLiability.amount_owed) return;

    let payment = parseFloat(newLiability.min_monthly_payment || '0');
    if (payment === 0 && calcUtilized > 0 && calcRate > 0) {
      payment = newLiability.interest_frequency === 'Quarterly' ? quarterlyInterest : monthlyInterest;
    }

    const payload = {
      name: newLiability.name,
      category: newLiability.category,
      lender: newLiability.lender,
      amount_owed: parseFloat(newLiability.amount_owed || '0'),
      total_principal: parseFloat(newLiability.total_principal || '0'),
      od_limit: parseFloat(newLiability.od_limit || '0'),
      interest_rate: parseFloat(newLiability.interest_rate || '0'),
      interest_frequency: newLiability.interest_frequency,
      min_monthly_payment: payment,
      tenure_months: parseInt(newLiability.tenure_months || '0', 10)
    };

    if (editingLiabilityId) {
      await fetch(`http://161.118.189.212/api/finance/liabilities/${editingLiabilityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch('http://161.118.189.212/api/finance/liabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    closeLiabilityModal();
    loadData();
  };

  const handleDeleteLiability = async (id: number) => {
    if (confirm('Delete this liability?')) {
      await fetch(`http://161.118.189.212/api/finance/liabilities/${id}`, { method: 'DELETE' });
      loadData();
    }
  };

  // Transaction Handlers
  const handleOpenEditTx = (t: any) => {
    setEditingTxId(t.id);
    setNewTx({
      type: t.type,
      category: t.category,
      amount: String(t.amount),
      date: t.date,
      description: t.description || ''
    });
    setShowTxModal(true);
  };

  const handleOpenNewTx = () => {
    setEditingTxId(null);
    setNewTx({ type: 'expense', category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    setShowTxModal(true);
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.category || !newTx.amount) return;

    const payload = {
      ...newTx,
      amount: parseFloat(newTx.amount || '0')
    };

    if (editingTxId) {
      await fetch(`http://161.118.189.212/api/finance/transactions/${editingTxId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch('http://161.118.189.212/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    closeTxModal();
    loadData();
  };

  const handleDeleteTx = async (id: number) => {
    if (confirm('Delete transaction?')) {
      await fetch(`http://161.118.189.212/api/finance/transactions/${id}`, { method: 'DELETE' });
      loadData();
    }
  };

  const handleResetData = async () => {
    if (confirm('Clear all existing demo data and start fresh with empty records?')) {
      await fetch('http://161.118.189.212/api/finance/reset', { method: 'DELETE' });
      loadData();
    }
  };

  if (loading || !summary) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading Financial Doctor Engine…</div>
      </div>
    );
  }

  const assetPieData = Object.entries(summary.asset_distribution || {}).map(([name, value]) => ({ name, value }));
  const expenseBarData = Object.entries(summary.expense_distribution || {}).map(([category, amount]) => ({ category, amount }));

  const filteredLiabilities = liabilities.filter(l => {
    if (liabilityFilter === 'term') return l.category.includes('Term') || l.category.includes('Home') || l.category.includes('Personal Loan') || l.category.includes('Car');
    if (liabilityFilter === 'od') return l.category.includes('Overdraft') || l.category.includes('OD');
    if (liabilityFilter === 'cards') return l.category.includes('Credit Card');
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Personal Financial Tracker & Smart Wealth Advisor</h2>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
            Manage & Edit Assets, Term Loans, Overdraft Facilities, EMIs & Wealth Growth
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleResetData} style={{ color: 'var(--text-dim)', fontSize: 11 }}>
            <RotateCcw size={12} /> Clear & Start Fresh
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleOpenNewAsset}>
            <Plus size={14} /> + Asset
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleOpenNewLiability} style={{ color: 'var(--red)', border: '1px solid rgba(244,63,94,0.3)' }}>
            <Plus size={14} /> + Loan / OD Facility
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowTxModal(true)}>
            <Plus size={14} /> Log Transaction
          </button>
        </div>
      </div>

      {/* Sub Tab Switcher */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('overview')}
        >
          <PieIcon size={14} /> Overview
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'assets' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('assets')}
        >
          <Coins size={14} /> Assets ({assets.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'liabilities' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('liabilities')}
        >
          <CreditCard size={14} /> Loans & OD Facilities ({liabilities.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'transactions' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('transactions')}
        >
          <BarChart2 size={14} /> Transactions ({transactions.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'advisor' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('advisor')}
          style={{ marginLeft: 'auto', background: activeTab === 'advisor' ? 'linear-gradient(135deg, var(--green), var(--blue))' : undefined }}
        >
          <Sparkles size={14} /> Smart Doctor Advisor
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="stat-row">
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(16, 185, 129, 0.08))', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
              <div className="stat-label"><Wallet size={13} color="var(--blue)" /> Net Worth</div>
              <div className="stat-value" style={{ color: summary.net_worth >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 22 }}>
                रु/₹ {summary.net_worth.toLocaleString()}
              </div>
              <div className="stat-sub">Assets (रु/₹ {summary.total_assets.toLocaleString()}) - Debts</div>
            </div>

            <div className="stat-card">
              <div className="stat-label"><Coins size={13} color="var(--green)" /> Total Assets</div>
              <div className="stat-value" style={{ fontSize: 20 }}>
                रु/₹ {summary.total_assets.toLocaleString()}
              </div>
              <div className="stat-sub">Liquid: रु/₹ {summary.liquid_assets.toLocaleString()}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label"><CreditCard size={13} color="var(--red)" /> Total Liabilities</div>
              <div className="stat-value" style={{ color: 'var(--red)', fontSize: 20 }}>
                रु/₹ {summary.total_liabilities.toLocaleString()}
              </div>
              <div className="stat-sub">Monthly EMIs: रु/₹ {summary.total_monthly_emis.toLocaleString()}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label"><Gauge size={13} color="var(--amber)" /> Debt-to-Income (DTI)</div>
              <div className="stat-value" style={{ color: summary.debt_to_income_pct > 40 ? 'var(--red)' : 'var(--amber)', fontSize: 20 }}>
                {summary.debt_to_income_pct}%
              </div>
              <div className="stat-sub">Monthly EMI / Income</div>
            </div>
          </div>

          {/* Overdraft & Term Loan Quick Summary Bar */}
          {summary.loan_metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div className="card" style={{ background: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: 'var(--blue)' }}>
                  <Landmark size={15} /> Term Loans Summary
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Total Term Loan Debt</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                      रु/₹ {Number(summary.loan_metrics.term_loans_owed).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Total Monthly EMIs</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--amber)', marginTop: 2 }}>
                      रु/₹ {Number(summary.loan_metrics.term_loans_emi).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: 'var(--red)' }}>
                  <CreditCard size={15} /> Overdraft (OD) Interest Servicing
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>OD Utilized Balance</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)', marginTop: 2 }}>
                      रु/₹ {Number(summary.loan_metrics.od_utilized).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 2 }}>
                      Sanctioned Limit: रु/₹ {Number(summary.loan_metrics.od_limit).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Utilization Rate</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: summary.loan_metrics.od_utilization_pct > 75 ? 'var(--red)' : 'var(--green)', marginTop: 2 }}>
                      {summary.loan_metrics.od_utilization_pct}%
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--green)', marginTop: 2 }}>
                      Available: रु/₹ {Number(summary.loan_metrics.od_available).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="card">
              <div className="card-title"><PieIcon size={14} /> Asset Allocation</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={assetPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value">
                    {assetPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v: number) => [`रु/₹ ${Number(v).toLocaleString()}`, 'Value']} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-title"><BarChart2 size={14} /> Expenses by Category</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={expenseBarData}>
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <RechartsTooltip formatter={(v: number) => [`रु/₹ ${Number(v).toLocaleString()}`, 'Spent']} />
                  <Bar dataKey="amount" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSETS */}
      {activeTab === 'assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <form onSubmit={handleSaveAsset} className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> {editingAssetId ? 'Edit Asset:' : 'Add Asset:'}
            </span>
            <input
              type="text"
              placeholder="Asset Name (e.g. Bank, Stocks, Gold)"
              value={newAsset.name}
              onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
              style={{ flex: 2, padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 12 }}
              required
            />
            <select
              value={newAsset.category}
              onChange={e => setNewAsset({ ...newAsset, category: e.target.value })}
              style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 12 }}
            >
              <option value="Bank">Bank Account</option>
              <option value="Cash">Cash</option>
              <option value="Stocks">Stocks / Shares</option>
              <option value="Mutual Funds">Mutual Funds / SIP</option>
              <option value="Gold">Gold</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Crypto">Crypto</option>
            </select>
            <input
              type="number"
              placeholder="Value (रु/₹)"
              value={newAsset.value}
              onChange={e => setNewAsset({ ...newAsset, value: e.target.value })}
              style={{ width: 140, padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 12 }}
              required
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newAsset.is_liquid}
                onChange={e => setNewAsset({ ...newAsset, is_liquid: e.target.checked })}
              /> Liquid?
            </label>
            <button type="submit" className="btn btn-primary btn-sm">{editingAssetId ? 'Update' : 'Save Asset'}</button>
            {editingAssetId && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingAssetId(null); setNewAsset({ name: '', category: 'Bank', value: '', is_liquid: true }); }}>
                Cancel
              </button>
            )}
          </form>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 20 }}>No assets added yet. Use the bar above to add your first asset!</td></tr>
                ) : assets.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 700 }}>{a.name}</td>
                    <td><span className="chip chip-sector">{a.category}</span></td>
                    <td>{a.is_liquid ? <span className="chip chip-buy">● Liquid</span> : <span className="chip chip-purple">● Fixed</span>}</td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--green)' }}>रु/₹ {Number(a.value).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditAsset(a)} style={{ color: 'var(--blue)' }}>
                          <Edit3 size={13} /> Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteAsset(a.id)} style={{ color: 'var(--red)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LIABILITIES & DEEP OVERDRAFT MANAGEMENT */}
      {activeTab === 'liabilities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Sub Filters for Liabilities */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn btn-sm ${liabilityFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLiabilityFilter('all')}>
                All Debts ({liabilities.length})
              </button>
              <button className={`btn btn-sm ${liabilityFilter === 'term' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLiabilityFilter('term')}>
                Term Loans
              </button>
              <button className={`btn btn-sm ${liabilityFilter === 'od' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLiabilityFilter('od')}>
                Overdraft (OD)
              </button>
              <button className={`btn btn-sm ${liabilityFilter === 'cards' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLiabilityFilter('cards')}>
                Credit Cards
              </button>
            </div>

            <button className="btn btn-primary btn-sm" onClick={handleOpenNewLiability} style={{ background: 'var(--red)' }}>
              <Plus size={14} /> + Add Loan / OD Facility
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan / Facility Name</th>
                  <th>Category</th>
                  <th>Bank / Lender</th>
                  <th>Interest Rate</th>
                  <th>Interest Cycle</th>
                  <th>Servicing / EMI Due</th>
                  <th>Tenure</th>
                  <th>Balance Owed / OD Utilized</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLiabilities.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--green)', padding: 20, fontWeight: 700 }}>🎉 No liabilities found in this category.</td></tr>
                ) : filteredLiabilities.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{l.name}</div>
                      {l.total_principal > 0 && <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>Original Principal: रु/₹ {Number(l.total_principal).toLocaleString()}</div>}
                      {l.od_limit > 0 && <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>OD Limit: रु/₹ {Number(l.od_limit).toLocaleString()}</div>}
                    </td>
                    <td><span className="chip chip-sector">{l.category}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.lender || '-'}</span></td>
                    <td className="mono" style={{ fontWeight: 700, color: l.interest_rate > 15 ? 'var(--red)' : 'var(--amber)' }}>{l.interest_rate}% p.a.</td>
                    <td>
                      <span className={`chip ${l.interest_frequency === 'Quarterly' ? 'chip-purple' : 'chip-blue'}`}>
                        {l.interest_frequency || 'Monthly'}
                      </span>
                    </td>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      रु/₹ {Number(l.min_monthly_payment).toLocaleString()}
                      <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>
                        {l.interest_frequency === 'Quarterly' ? 'per quarter' : 'per month'}
                      </div>
                    </td>
                    <td>{l.tenure_months > 0 ? <span className="mono" style={{ fontSize: 11 }}>{l.tenure_months} mos</span> : '-'}</td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--red)', fontSize: 14 }}>
                      रु/₹ {Number(l.amount_owed).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditLiability(l)} style={{ color: 'var(--blue)' }}>
                          <Edit3 size={13} /> Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteLiability(l.id)} style={{ color: 'var(--red)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <form onSubmit={handleSaveTx} className="card" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Log Tx:
            </span>
            <select
              value={newTx.type}
              onChange={e => setNewTx({ ...newTx, type: e.target.value })}
              style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 12 }}
            >
              <option value="expense">Expense (-)</option>
              <option value="income">Income (+)</option>
            </select>
            <input
              type="text"
              placeholder="Category (Salary, Rent, Food, Utilities)"
              value={newTx.category}
              onChange={e => setNewTx({ ...newTx, category: e.target.value })}
              style={{ flex: 1, padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 12 }}
              required
            />
            <input
              type="number"
              placeholder="Amount (रु/₹)"
              value={newTx.amount}
              onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
              style={{ width: 120, padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 12 }}
              required
            />
            <input
              type="date"
              value={newTx.date}
              onChange={e => setNewTx({ ...newTx, date: e.target.value })}
              style={{ padding: '6px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 12 }}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm">Log Entry</button>
          </form>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 20 }}>No transactions logged yet. Use the bar above to add entries!</td></tr>
                ) : transactions.map(t => (
                  <tr key={t.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{t.date}</td>
                    <td>{t.type === 'income' ? <span className="chip chip-buy">+ Income</span> : <span className="chip chip-sell">- Expense</span>}</td>
                    <td><span className="chip chip-sector">{t.category}</span></td>
                    <td>{t.description || '-'}</td>
                    <td className="mono" style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      रु/₹ {Number(t.amount).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEditTx(t)} style={{ color: 'var(--blue)' }}>
                          <Edit3 size={13} /> Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTx(t.id)} style={{ color: 'var(--red)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SMART ADVISOR HUB */}
      {activeTab === 'advisor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Financial Health Score</div>
              <div style={{
                width: 100, height: 100, borderRadius: '50%', border: '5px solid var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: 'var(--green)'
              }}>
                {summary.health_score}
              </div>
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 14 }}>{summary.score_grade}</div>
            </div>

            <div className="card">
              <div className="card-title"><Shield size={14} color="var(--blue)" /> Emergency Fund Readiness</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: summary.emergency_fund.color, margin: '8px 0' }}>
                {summary.emergency_fund.status} ({summary.emergency_fund.months_covered} Months Covered)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
                {summary.emergency_fund.tip}
              </div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (summary.emergency_fund.months_covered / 6) * 100)}%`,
                  height: '100%', background: summary.emergency_fund.color, borderRadius: 5
                }} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><Sparkles size={14} color="var(--amber)" /> Debt Avalanche & Overdraft Payoff Recommendations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {summary.debt_insights.map((card: any, i: number) => (
                <div key={i} style={{
                  padding: '12px 16px', borderRadius: 8,
                  background: card.priority === 'HIGH' ? 'rgba(244,63,94,0.08)' : 'rgba(2,132,199,0.08)',
                  borderLeft: `4px solid ${card.priority === 'HIGH' ? 'var(--red)' : 'var(--blue)'}`
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{card.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY 1: ASSET (ADD OR EDIT) */}
      {showAssetModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: 440, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{editingAssetId ? '✏️ Edit Asset Details' : '+ Add New Asset'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={closeAssetModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveAsset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. NABIL Bank / NEPSE Shares / Gold"
                  value={newAsset.name}
                  onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Category</label>
                <select
                  value={newAsset.category}
                  onChange={e => setNewAsset({ ...newAsset, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                >
                  <option value="Bank">Bank Account</option>
                  <option value="Cash">Cash</option>
                  <option value="Stocks">Stocks / Shares</option>
                  <option value="Mutual Funds">Mutual Funds / SIP</option>
                  <option value="Gold">Gold</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Crypto">Crypto</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Current Value (रु/₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newAsset.value}
                  onChange={e => setNewAsset({ ...newAsset, value: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                  required
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newAsset.is_liquid}
                  onChange={e => setNewAsset({ ...newAsset, is_liquid: e.target.checked })}
                /> Liquid Asset (Accessible within 24-48 hours for emergency)
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={closeAssetModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingAssetId ? 'Update Asset' : 'Save Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY 2: DEEP LOAN & OVERDRAFT (ADD OR EDIT) */}
      {showLiabilityModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: 520, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{editingLiabilityId ? '✏️ Edit Loan / Liability Details' : '+ Add Loan / Overdraft (OD) Facility'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={closeLiabilityModal}><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveLiability} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Facility Category</label>
                  <select
                    value={newLiability.category}
                    onChange={e => setNewLiability({ ...newLiability, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                  >
                    <option value="Overdraft (OD)">Overdraft (OD) Loan</option>
                    <option value="Term Loan">Term Loan</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Home Loan">Home Loan</option>
                    <option value="Car Loan">Vehicle Loan</option>
                    <option value="Personal Debt">Personal / Private Debt</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Bank / Lender Name</label>
                  <input
                    type="text"
                    placeholder="e.g. NABIL Bank / NIC Asia"
                    value={newLiability.lender}
                    onChange={e => setNewLiability({ ...newLiability, lender: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Loan / OD Title</label>
                <input
                  type="text"
                  placeholder="e.g. Business Overdraft Facility / Home Term Loan"
                  value={newLiability.name}
                  onChange={e => setNewLiability({ ...newLiability, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                  required
                />
              </div>

              {/* Overdraft Specific vs Term Loan Specific Inputs */}
              {newLiability.category.includes('Overdraft') || newLiability.category.includes('OD') ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Sanctioned OD Limit (रु/₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000000"
                        value={newLiability.od_limit}
                        onChange={e => setNewLiability({ ...newLiability, od_limit: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Utilized OD Amount (रु/₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1500000"
                        value={newLiability.amount_owed}
                        onChange={e => setNewLiability({ ...newLiability, amount_owed: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Interest Rate (% p.a.)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 12.5"
                        value={newLiability.interest_rate}
                        onChange={e => setNewLiability({ ...newLiability, interest_rate: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Interest Payment Cycle</label>
                      <select
                        value={newLiability.interest_frequency}
                        onChange={e => setNewLiability({ ...newLiability, interest_frequency: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                      >
                        <option value="Quarterly">Quarterly Interest Servicing (4x / yr)</option>
                        <option value="Monthly">Monthly Interest Servicing (12x / yr)</option>
                      </select>
                    </div>
                  </div>

                  {/* AUTO INTEREST CALCULATOR BOX */}
                  {calcUtilized > 0 && calcRate > 0 && (
                    <div style={{
                      padding: '12px 16px', borderRadius: 8,
                      background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.3)',
                      display: 'flex', flexDirection: 'column', gap: 6
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calculator size={14} /> Auto-Calculated OD Interest Servicing:
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={autoFillInterest}
                          style={{ padding: '2px 8px', fontSize: 10.5, color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)' }}
                        >
                          Auto-Fill {newLiability.interest_frequency} Amount
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                        <div style={{ background: 'var(--bg-main)', padding: '6px 10px', borderRadius: 6 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Monthly Interest:</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>
                            रु/₹ {monthlyInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div style={{ background: 'var(--bg-main)', padding: '6px 10px', borderRadius: 6 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Quarterly Interest (3 months):</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)' }}>
                            रु/₹ {quarterlyInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Original Principal (रु/₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2500000"
                        value={newLiability.total_principal}
                        onChange={e => setNewLiability({ ...newLiability, total_principal: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Current Balance Owed (रु/₹)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newLiability.amount_owed}
                        onChange={e => setNewLiability({ ...newLiability, amount_owed: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Interest Rate (% p.a.)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 11.5"
                        value={newLiability.interest_rate}
                        onChange={e => setNewLiability({ ...newLiability, interest_rate: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Monthly EMI (रु/₹)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newLiability.min_monthly_payment}
                        onChange={e => setNewLiability({ ...newLiability, min_monthly_payment: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Tenure (Months)</label>
                      <input
                        type="number"
                        placeholder="e.g. 60"
                        value={newLiability.tenure_months}
                        onChange={e => setNewLiability({ ...newLiability, tenure_months: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Servicing / EMI Due Amount (रु/₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newLiability.min_monthly_payment}
                  onChange={e => setNewLiability({ ...newLiability, min_monthly_payment: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={closeLiabilityModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--red)' }}>
                  {editingLiabilityId ? 'Update Loan' : 'Save Loan / Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OVERLAY 3: TRANSACTION */}
      {showTxModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: 440, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{editingTxId ? '✏️ Edit Transaction Record' : '+ Log Transaction Entry'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={closeTxModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveTx} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Transaction Type</label>
                <select
                  value={newTx.type}
                  onChange={e => setNewTx({ ...newTx, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                >
                  <option value="expense">Expense (-)</option>
                  <option value="income">Income (+)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Category</label>
                <input
                  type="text"
                  placeholder="e.g. Salary, Rent, Food, Utilities, Shopping"
                  value={newTx.category}
                  onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Amount (रु/₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newTx.amount}
                  onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</label>
                <input
                  type="date"
                  value={newTx.date}
                  onChange={e => setNewTx({ ...newTx, date: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Supermarket shopping"
                  value={newTx.description}
                  onChange={e => setNewTx({ ...newTx, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-main)', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={closeTxModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTxId ? 'Update Record' : 'Save Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
