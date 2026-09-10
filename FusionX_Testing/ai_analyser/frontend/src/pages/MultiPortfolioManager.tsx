import { useEffect, useState } from 'react';
import {
  Briefcase,
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  PlusCircle,
  MinusCircle,
  History,
  Trash2,
  Download,
  Upload,
  Layers,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  ArrowUpRight,
  X,
} from 'lucide-react';
import type { Portfolio, Transaction, TransactionType } from '../types/portfolio';
import {
  getStoredPortfolios,
  savePortfolios,
  getActivePortfolioId,
  setActivePortfolioId,
  calculateHoldings,
} from '../services/portfolioStorage';
import SearchBar from '../components/SearchBar';

export default function MultiPortfolioManager({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [stockScanList, setStockScanList] = useState<any[]>([]);
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // New portfolio form state
  const [newPortName, setNewPortName] = useState('');
  const [newPortDesc, setNewPortDesc] = useState('');
  const [newPortCash, setNewPortCash] = useState(500000);

  // Trade form state
  const [tradeType, setTradeType] = useState<TransactionType>('BUY');
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradeQty, setTradeQty] = useState(100);
  const [tradePrice, setTradePrice] = useState(0);
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [tradeBrokerFee, setTradeBrokerFee] = useState(true);
  const [tradeNotes, setTradeNotes] = useState('');

  // Fetch stock scan data on mount
  useEffect(() => {
    fetch('http://161.118.189.212/api/scan')
      .then((r) => r.json())
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.stocks || [];
        setStockScanList(list);
      })
      .catch(() => {});
  }, []);

  // Load portfolios on mount
  useEffect(() => {
    const list = getStoredPortfolios();
    setPortfolios(list);
    const currId = getActivePortfolioId();
    if (list.some((p) => p.id === currId)) {
      setActiveId(currId);
    } else if (list.length > 0) {
      setActiveId(list[0].id);
      setActivePortfolioId(list[0].id);
    }
  }, []);

  const activePortfolio = portfolios.find((p) => p.id === activeId) || portfolios[0];

  const handleSelectPortfolio = (id: string) => {
    setActiveId(id);
    setActivePortfolioId(id);
  };

  const handleCreatePortfolio = () => {
    if (!newPortName.trim()) return;
    const newPort: Portfolio = {
      id: `port-${Date.now()}`,
      name: newPortName.trim(),
      description: newPortDesc.trim() || 'Paper trading portfolio',
      initialCash: Number(newPortCash) || 100000,
      currentCash: Number(newPortCash) || 100000,
      createdAt: new Date().toISOString(),
      transactions: [],
    };

    const updated = [...portfolios, newPort];
    setPortfolios(updated);
    savePortfolios(updated);
    setActiveId(newPort.id);
    setActivePortfolioId(newPort.id);

    // Reset form
    setNewPortName('');
    setNewPortDesc('');
    setNewPortCash(500000);
    setShowCreateModal(false);
  };

  const handleDeletePortfolio = (id: string) => {
    if (portfolios.length <= 1) {
      alert('You must have at least one active portfolio.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this portfolio? All transaction history will be lost.')) return;
    const updated = portfolios.filter((p) => p.id !== id);
    setPortfolios(updated);
    savePortfolios(updated);
    setActiveId(updated[0].id);
    setActivePortfolioId(updated[0].id);
  };

  const handleOpenTradeModal = (type: TransactionType = 'BUY', symbol = '') => {
    setTradeType(type);
    setTradeSymbol(symbol);
    setTradeQty(100);
    const scanItem = stockScanList.find((s) => s.symbol === symbol.toUpperCase());
    setTradePrice(scanItem?.ltp || 500);
    setTradeDate(new Date().toISOString().split('T')[0]);
    setTradeBrokerFee(true);
    setTradeNotes('');
    setShowTradeModal(true);
  };

  const handleSymbolChange = (sym: string) => {
    const uppercase = sym.toUpperCase();
    setTradeSymbol(uppercase);
    const scanItem = stockScanList.find((s) => s.symbol === uppercase);
    if (scanItem?.ltp) {
      setTradePrice(scanItem.ltp);
    }
  };

  const handleAddTrade = () => {
    const sym = tradeSymbol.trim().toUpperCase();
    if (!sym || tradeQty <= 0 || tradePrice <= 0) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: tradeType,
      symbol: sym,
      qty: Number(tradeQty),
      price: Number(tradePrice),
      date: tradeDate,
      includeBrokerFee: tradeBrokerFee,
      notes: tradeNotes.trim(),
    };

    const updated = portfolios.map((p) => {
      if (p.id === activePortfolio.id) {
        return {
          ...p,
          transactions: [...p.transactions, newTx],
        };
      }
      return p;
    });

    setPortfolios(updated);
    savePortfolios(updated);
    setShowTradeModal(false);
  };

  const handleDeleteTrade = (txId: string) => {
    const updated = portfolios.map((p) => {
      if (p.id === activePortfolio.id) {
        return {
          ...p,
          transactions: p.transactions.filter((t) => t.id !== txId),
        };
      }
      return p;
    });
    setPortfolios(updated);
    savePortfolios(updated);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(portfolios, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FusionX_Portfolios_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim());
        const newTxs: Transaction[] = [];

        // Expect CSV format: Symbol, Type (BUY/SELL), Qty, Price, Date
        lines.forEach((line, i) => {
          if (i === 0 && line.toLowerCase().includes('symbol')) return; // skip header
          const parts = line.split(',').map((p) => p.trim());
          if (parts.length >= 4) {
            const sym = parts[0].toUpperCase();
            const type = parts[1].toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
            const qty = parseFloat(parts[2]) || 0;
            const price = parseFloat(parts[3]) || 0;
            const date = parts[4] || new Date().toISOString().split('T')[0];

            if (sym && qty > 0 && price > 0) {
              newTxs.push({
                id: `tx-csv-${Date.now()}-${i}`,
                type,
                symbol: sym,
                qty,
                price,
                date,
                includeBrokerFee: true,
                notes: 'Imported from CSV broker statement',
              });
            }
          }
        });

        if (newTxs.length > 0) {
          const updated = portfolios.map((p) => {
            if (p.id === activePortfolio.id) {
              return {
                ...p,
                transactions: [...p.transactions, ...newTxs],
              };
            }
            return p;
          });
          setPortfolios(updated);
          savePortfolios(updated);
          alert(`Successfully imported ${newTxs.length} trades from CSV statement!`);
        } else {
          alert('No valid trade records found in CSV file. Format: Symbol, Type, Qty, Price, Date');
        }
      } catch (err) {
        alert('Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPortfolios(parsed);
          savePortfolios(parsed);
          setActiveId(parsed[0].id);
          setActivePortfolioId(parsed[0].id);
          alert('Portfolios imported successfully!');
        }
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  if (!activePortfolio) return null;

  const holdings = calculateHoldings(activePortfolio, stockScanList);

  const totalInvested = holdings.reduce((acc, h) => acc + h.totalInvested, 0);
  const totalMarketVal = holdings.reduce((acc, h) => acc + h.currentValue, 0);
  const totalUnrealizedPnl = holdings.reduce((acc, h) => acc + h.unrealizedPnl, 0);
  const totalRealizedPnl = holdings.reduce((acc, h) => acc + h.realizedPnl, 0);
  const totalNetWorth = totalMarketVal + activePortfolio.currentCash;
  const overallPnlPct = totalInvested > 0 ? (totalUnrealizedPnl / totalInvested) * 100 : 0;

  // Calculate sector breakdown
  const sectorMap = new Map<string, number>();
  holdings.forEach((h) => {
    const current = sectorMap.get(h.sector) || 0;
    sectorMap.set(h.sector, current + h.currentValue);
  });
  const sectorList = Array.from(sectorMap.entries()).map(([sector, value]) => ({
    sector,
    value,
    pct: totalMarketVal > 0 ? (value / totalMarketVal) * 100 : 0,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── Top Control Bar: Portfolio Selector & Actions ─────────────────────────── */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          padding: '14px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Briefcase size={22} color="var(--blue)" />
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Active Portfolio
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <select
                className="search-input"
                style={{ fontSize: 15, fontWeight: 800, color: 'var(--blue)', padding: '4px 12px', minWidth: 220 }}
                value={activeId}
                onChange={(e) => handleSelectPortfolio(e.target.value)}
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.transactions.length} trades)
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {activePortfolio.description}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Portfolio
          </button>
          <button className="btn btn-primary" style={{ background: '#10B981' }} onClick={() => handleOpenTradeModal('BUY')}>
            <PlusCircle size={16} /> Add Trade
          </button>
          <button className="btn btn-ghost" onClick={() => setShowHistoryModal(true)} title="Trade History">
            <History size={16} /> History
          </button>
          <button className="btn btn-ghost" onClick={handleExportJSON} title="Export JSON Backup">
            <Download size={16} /> Backup
          </button>
          <label className="btn btn-ghost" style={{ cursor: 'pointer' }} title="Import CSV Broker Statement">
            <Upload size={16} /> CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportCSV} />
          </label>
          <label className="btn btn-ghost" style={{ cursor: 'pointer' }} title="Import JSON Backup">
            <Upload size={16} /> JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
          </label>
          {portfolios.length > 1 && (
            <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={() => handleDeletePortfolio(activePortfolio.id)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Overview Stat Cards ─────────────────────────────────────────────────── */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">Total Net Worth</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>
            Rs {totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            Invested: Rs {totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Unrealized P&L</div>
          <div className="stat-value" style={{ color: totalUnrealizedPnl >= 0 ? '#10B981' : '#EF4444' }}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}
            Rs {totalUnrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: totalUnrealizedPnl >= 0 ? '#10B981' : '#EF4444',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {totalUnrealizedPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {overallPnlPct >= 0 ? '+' : ''}
            {overallPnlPct.toFixed(2)}%
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Realized Profit (Sales)</div>
          <div className="stat-value" style={{ color: totalRealizedPnl >= 0 ? '#10B981' : '#EF4444' }}>
            {totalRealizedPnl >= 0 ? '+' : ''}
            Rs {totalRealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            Closed / Partial positions
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Available Cash</div>
          <div className="stat-value">
            Rs {activePortfolio.currentCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            Unallocated funds
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid: Holdings Table & Sector Allocation ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        
        {/* Left Column: Active Holdings & AI Manager Guidance */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-base)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              <Layers size={18} color="var(--blue)" /> Portfolio Holdings ({holdings.length})
            </div>
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleOpenTradeModal('BUY')}>
              <Plus size={14} /> Add Position
            </button>
          </div>

          {holdings.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Briefcase size={40} opacity={0.3} style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 600 }}>No active holdings in this portfolio.</p>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                Click "+ Add Trade" above to log your first paper trade.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Stock / Company</th>
                    <th>Qty</th>
                    <th>Avg Buy</th>
                    <th>LTP</th>
                    <th>Current Value</th>
                    <th>Unrealized P&L</th>
                    <th>AI Manager Advice</th>
                    <th>Target / Stop Loss</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const isUp = h.unrealizedPnl >= 0;
                    return (
                      <tr key={h.symbol}>
                        <td onClick={() => onSelect(h.symbol)} style={{ cursor: 'pointer' }}>
                          <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 14 }}>
                            {h.symbol}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {h.name}
                          </div>
                        </td>

                        <td className="mono" style={{ fontWeight: 700 }}>{h.totalQty}</td>

                        <td className="mono">Rs {h.avgBuyPrice.toLocaleString()}</td>

                        <td className="mono" style={{ fontWeight: 700 }}>
                          Rs {h.currentLtp.toLocaleString()}
                        </td>

                        <td className="mono" style={{ fontWeight: 700 }}>
                          Rs {h.currentValue.toLocaleString()}
                          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                            {h.allocationPct}% of portfolio
                          </div>
                        </td>

                        <td>
                          <div
                            className="mono"
                            style={{
                              fontWeight: 800,
                              color: isUp ? '#10B981' : '#EF4444',
                              fontSize: 13,
                            }}
                          >
                            {isUp ? '+' : ''}Rs {h.unrealizedPnl.toLocaleString()}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isUp ? '#10B981' : '#EF4444' }}>
                            {isUp ? '+' : ''}{h.unrealizedPnlPct.toFixed(2)}%
                          </div>
                        </td>

                        {/* AI Manager Signal Badge */}
                        <td>
                          <AISignalBadge signal={h.aiSignal} />
                        </td>

                        <td className="mono" style={{ fontSize: 11 }}>
                          <div style={{ color: '#10B981', fontWeight: 600 }}>TGT: Rs {h.aiSignal.targetPrice}</div>
                          <div style={{ color: '#EF4444', fontWeight: 600 }}>SL: Rs {h.aiSignal.stopLossPrice}</div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: 4, color: '#10B981' }}
                              title="Buy More"
                              onClick={() => handleOpenTradeModal('BUY', h.symbol)}
                            >
                              <PlusCircle size={15} />
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: 4, color: '#EF4444' }}
                              title="Sell Shares"
                              onClick={() => handleOpenTradeModal('SELL', h.symbol)}
                            >
                              <MinusCircle size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Sector Breakdown & AI Portfolio Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Sector Allocation Card */}
          <div className="card">
            <div className="card-title">
              <PieIcon size={18} /> Sector Breakdown
            </div>
            {sectorList.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: 20 }}>
                No active sectors to display.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sectorList.map((sec) => (
                  <div key={sec.sector}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sec.sector}</span>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--blue)' }}>
                        {sec.pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="score-bar-wrap">
                      <div className="score-bar-fill" style={{ width: `${sec.pct}%`, background: 'var(--blue)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Manager Summary Insights */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%)' }}>
            <div className="card-title" style={{ color: 'var(--blue)' }}>
              <ShieldAlert size={18} /> AI Manager Portfolio Advisory
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p>
                <strong>Portfolio Concentration:</strong> {holdings.length} active positions.
                {holdings.some((h) => h.allocationPct > 35) && (
                  <span style={{ color: '#EF4444', display: 'block', marginTop: 4 }}>
                    ⚠️ Warning: You have over 35% allocated in a single stock. Consider rebalancing.
                  </span>
                )}
              </p>
              <div style={{ padding: 10, background: 'var(--bg-base)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                  💡 Paper Manager Advice
                </div>
                Use this simulation workspace to test risk management before placing live trades with your NEPSE broker.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Modal 1: Create New Portfolio ───────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create New Portfolio</h3>
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div>
                <label className="label">Portfolio Name</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="e.g. Swing Trading Strategy"
                  value={newPortName}
                  onChange={(e) => setNewPortName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Description / Strategy</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="e.g. High momentum 2-week breakout trades"
                  value={newPortDesc}
                  onChange={(e) => setNewPortDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Starting Cash Capital (NPR)</label>
                <input
                  type="number"
                  className="search-input"
                  style={{ width: '100%', marginTop: 4 }}
                  value={newPortCash}
                  onChange={(e) => setNewPortCash(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreatePortfolio}>
                Create Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Add Trade (Buy / Sell) ─────────────────────────────────────── */}
      {showTradeModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Record Paper Trade — {tradeType}</h3>
              <button className="btn btn-ghost" onClick={() => setShowTradeModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className={`btn ${tradeType === 'BUY' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, background: tradeType === 'BUY' ? '#10B981' : undefined }}
                  onClick={() => setTradeType('BUY')}
                >
                  <PlusCircle size={16} /> BUY
                </button>
                <button
                  type="button"
                  className={`btn ${tradeType === 'SELL' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, background: tradeType === 'SELL' ? '#EF4444' : undefined }}
                  onClick={() => setTradeType('SELL')}
                >
                  <MinusCircle size={16} /> SELL
                </button>
              </div>

              <div>
                <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Stock Symbol</span>
                  {tradeSymbol && (
                    <span className="mono" style={{ color: 'var(--blue)', fontWeight: 800, fontSize: 13 }}>
                      Selected: {tradeSymbol}
                    </span>
                  )}
                </label>
                <div style={{ marginTop: 4 }}>
                  <SearchBar onSelect={(sym) => handleSymbolChange(sym)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Quantity (Shares)</label>
                  <input
                    type="number"
                    className="search-input"
                    style={{ width: '100%', marginTop: 4 }}
                    value={tradeQty}
                    onChange={(e) => setTradeQty(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Price per share (NPR)</label>
                  <input
                    type="number"
                    className="search-input"
                    style={{ width: '100%', marginTop: 4 }}
                    value={tradePrice}
                    onChange={(e) => setTradePrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Transaction Date</label>
                  <input
                    type="date"
                    className="search-input"
                    style={{ width: '100%', marginTop: 4 }}
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 24, gap: 8 }}>
                  <input
                    type="checkbox"
                    id="broker-fee"
                    checked={tradeBrokerFee}
                    onChange={(e) => setTradeBrokerFee(e.target.checked)}
                  />
                  <label htmlFor="broker-fee" style={{ fontSize: 12, cursor: 'pointer' }}>
                    Include 0.36% Broker Fee
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Notes / Strategy Thesis</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="e.g. Bought on EMA 21 bounce"
                  value={tradeNotes}
                  onChange={(e) => setTradeNotes(e.target.value)}
                />
              </div>

              <div style={{ background: 'var(--bg-base)', padding: 10, borderRadius: 6, fontSize: 12 }} className="mono">
                Total Transaction Value: <strong>Rs {(tradeQty * tradePrice * (tradeBrokerFee ? 1.0036 : 1)).toFixed(2)}</strong>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowTradeModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddTrade}>
                Record {tradeType} Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Transaction History Log ──────────────────────────────────── */}
      {showHistoryModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>Transaction History — {activePortfolio.name}</h3>
              <button className="btn btn-ghost" onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {activePortfolio.transactions.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)' }}>
                  No transactions recorded yet.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Symbol</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total Value</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePortfolio.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.date}</td>
                        <td>
                          <span className={`chip ${tx.type === 'BUY' ? 'chip-buy' : 'chip-sell'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="mono" style={{ fontWeight: 800, color: 'var(--blue)' }}>{tx.symbol}</td>
                        <td className="mono">{tx.qty}</td>
                        <td className="mono">Rs {tx.price}</td>
                        <td className="mono">Rs {(tx.qty * tx.price).toLocaleString()}</td>
                        <td>
                          <button className="btn btn-ghost" style={{ color: 'var(--red)', padding: 4 }} onClick={() => handleDeleteTrade(tx.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowHistoryModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AISignalBadge({ signal }: { signal: any }) {
  const configs: Record<string, { label: string; bg: string; color: string; icon: any }> = {
    BUY_MORE: { label: 'BUY MORE', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', icon: ArrowUpRight },
    HOLD: { label: 'HOLD', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', icon: CheckCircle },
    TAKE_PROFIT: { label: 'TAKE PROFIT', bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', icon: TrendingUp },
    STOP_LOSS: { label: 'STOP LOSS', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', icon: AlertTriangle },
  };

  const cfg = configs[signal.action] || configs['HOLD'];
  const IconComponent = cfg.icon;

  return (
    <div
      title={signal.reason}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        borderRadius: 6,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 800,
        fontFamily: 'var(--font-mono)',
        cursor: 'help',
      }}
    >
      <IconComponent size={12} />
      {cfg.label}
    </div>
  );
}
