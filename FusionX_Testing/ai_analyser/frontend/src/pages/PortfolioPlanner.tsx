import { useEffect, useState } from 'react';
import { getTradePlan, getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/api';
import { Briefcase, Crosshair, DollarSign, ListPlus, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';

export default function PortfolioPlanner({ onSelect }: { onSelect: (s: string) => void }) {
  const [budget, setBudget] = useState(10000);
  const [useWhitelist, setUseWhitelist] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    const data = await getWatchlist();
    setWatchlist(data.watchlist);
  };

  const handleAddWatchlist = async () => {
    if (!newSymbol) return;
    await addToWatchlist(newSymbol);
    setNewSymbol('');
    loadWatchlist();
  };

  const handleRemoveWatchlist = async (sym: string) => {
    await removeFromWatchlist(sym);
    loadWatchlist();
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const data = await getTradePlan(budget, useWhitelist);
      setPlan(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
      
      {/* Left Panel: Settings & Watchlist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        <div className="card">
          <div className="card-title"><Briefcase size={18} /> Investment Budget</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Amount (NPR)</label>
              <input 
                type="number" 
                className="search-input" 
                style={{ width: '100%', marginTop: 6 }} 
                value={budget} 
                onChange={e => setBudget(Number(e.target.value))} 
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input 
                type="checkbox" 
                id="whitelist-toggle" 
                checked={useWhitelist} 
                onChange={e => setUseWhitelist(e.target.checked)} 
              />
              <label htmlFor="whitelist-toggle" style={{ fontSize: 13, cursor: 'pointer' }}>
                Use Whitelist Only
              </label>
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: 8, justifyContent: 'center' }} onClick={generatePlan}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Crosshair size={16} /> Generate Plan</>}
            </button>
          </div>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div className="card-title"><ListPlus size={18} /> My Watchlist</div>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Symbol (e.g. NABIL)" 
              style={{ width: '100%', textTransform: 'uppercase' }} 
              value={newSymbol}
              onChange={e => setNewSymbol(e.target.value.toUpperCase())}
            />
            <button className="btn btn-primary" onClick={handleAddWatchlist}>Add</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {watchlist.map(sym => (
              <div key={sym} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 8 }}>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--blue)' }}>{sym}</span>
                <button className="btn btn-ghost" style={{ padding: 4, color: 'var(--red)' }} onClick={() => handleRemoveWatchlist(sym)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {watchlist.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: 20 }}>
                Your watchlist is empty.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right Panel: AI Output */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!plan ? (
          <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
            <TrendingUp size={48} opacity={0.2} />
            <p>Set your budget and generate a plan to see short-term trade suggestions.</p>
          </div>
        ) : (
          <>
            <div className="stat-row" style={{ marginBottom: 0 }}>
              <div className="stat-card">
                <div className="stat-label">Budget</div>
                <div className="stat-value">Rs {plan.budget.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Allocated</div>
                <div className="stat-value" style={{ color: 'var(--blue)' }}>Rs {plan.total_invested.toLocaleString()}</div>
              </div>
            </div>

            {/* Top Overall */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crosshair size={18} color="var(--blue)" /> Top Overall Momentum Picks (Short Term)
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol / Sector</th>
                    <th>Qty</th>
                    <th>Entry (LTP)</th>
                    <th>Target</th>
                    <th>Stop Loss</th>
                    <th>Expected Return</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.top_overall.map((t: any) => (
                    <tr key={t.symbol} onClick={() => onSelect(t.symbol)}>
                      <td>
                        <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 15 }}>{t.symbol}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{t.sector}</div>
                      </td>
                      <td className="mono" style={{ fontWeight: 600 }}>{t.quantity}</td>
                      <td className="mono">Rs {t.ltp?.toFixed(2)}</td>
                      <td className="mono" style={{ color: 'var(--green)', fontWeight: 600 }}>Rs {t.target?.toFixed(2)}</td>
                      <td className="mono" style={{ color: 'var(--red)', fontWeight: 600 }}>Rs {t.stop_loss?.toFixed(2)}</td>
                      <td>
                        <span className="chip chip-buy">+{t.expected_profit?.toFixed(0)} NPR</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sector Wise */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="var(--amber)" /> Best Pick Per Sector
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sector</th>
                    <th>Top Stock</th>
                    <th>Entry (LTP)</th>
                    <th>Target</th>
                    <th>Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(plan.sector_top).map(([sector, t]: [string, any]) => (
                    <tr key={sector} onClick={() => onSelect(t.symbol)}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{sector}</td>
                      <td>
                        <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 15 }}>{t.symbol}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.name}</div>
                      </td>
                      <td className="mono">Rs {t.ltp?.toFixed(2)}</td>
                      <td className="mono" style={{ color: 'var(--green)' }}>Rs {t.target?.toFixed(2)}</td>
                      <td style={{ maxWidth: 200, fontSize: 12, color: 'var(--text-dim)' }}>
                        {t.signals[0]?.text || "Strong Technicals"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>

    </div>
  );
}
