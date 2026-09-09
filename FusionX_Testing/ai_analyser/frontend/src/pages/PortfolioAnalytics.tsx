import { useState } from 'react';
import { Activity, BarChart2, Shield, Zap, Plus, X, Info } from 'lucide-react';

const BASE_URL = 'http://localhost:8001';

function CorrelationGrid({ data, symbols }: { data: any[]; symbols: string[] }) {
  const getColor = (val: number) => {
    if (val >= 0.8) return '#DC2626';
    if (val >= 0.5) return '#F59E0B';
    if (val >= 0.2) return '#64748B';
    if (val >= -0.2) return '#0284C7';
    return '#059669';
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11.5 }}>
        <thead>
          <tr>
            <th style={{ padding: '6px 10px', color: 'var(--text-dim)', fontWeight: 600, textAlign: 'left' }}></th>
            {symbols.map(s => (
              <th key={s} style={{ padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center', minWidth: 60 }}>
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symbols.map(rowSym => (
            <tr key={rowSym}>
              <td style={{ padding: '4px 10px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{rowSym}</td>
              {symbols.map(colSym => {
                const cell = data.find(d => d.x === rowSym && d.y === colSym);
                const val = cell?.value ?? 0;
                const bg = getColor(val);
                const isDiagonal = rowSym === colSym;
                return (
                  <td
                    key={colSym}
                    title={`${rowSym} vs ${colSym}: ${val}`}
                    style={{
                      padding: '4px 8px',
                      textAlign: 'center',
                      background: isDiagonal ? 'var(--bg-base)' : `${bg}22`,
                      color: isDiagonal ? 'var(--text-dim)' : bg,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                    }}
                  >
                    {isDiagonal ? '—' : val.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'High +ve (avoid)', color: '#DC2626' },
          { label: 'Medium +ve', color: '#F59E0B' },
          { label: 'Low', color: '#64748B' },
          { label: 'Low -ve', color: '#0284C7' },
          { label: 'High -ve (best diversification)', color: '#059669' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: `${item.color}33`, border: `1px solid ${item.color}` }} />
            <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioAnalytics({ onSelect }: { onSelect: (s: string) => void }) {
  const [symbolInput, setSymbolInput] = useState('');
  const [symbols, setSymbols] = useState<string[]>(['NABIL', 'HBL', 'UPPER', 'NLIC', 'SBI']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAdd = () => {
    const sym = symbolInput.trim().toUpperCase();
    if (sym && !symbols.includes(sym)) {
      setSymbols([...symbols, sym]);
    }
    setSymbolInput('');
  };

  const handleRemove = (sym: string) => setSymbols(symbols.filter(s => s !== sym));

  const handleAnalyse = async () => {
    if (symbols.length < 2) { setError('Add at least 2 stocks.'); return; }
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/portfolio-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); } else { setResult(data); }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Portfolio Analytics</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>Sharpe Ratio · Correlation Matrix · Kelly Criterion</div>
        </div>
        <span className="chip chip-purple"><BarChart2 size={11} /> Risk Lab</span>
      </div>

      {/* Stock Selector */}
      <div className="card">
        <div className="card-title"><Zap size={13} /> Portfolio Composition</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {symbols.map(sym => (
            <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--blue-dim)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 20 }}>
              <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--blue)', cursor: 'pointer' }} onClick={() => onSelect(sym)}>{sym}</span>
              <X size={12} style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => handleRemove(sym)} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="search-input"
            placeholder="Add symbol (e.g. NABIL)"
            value={symbolInput}
            onChange={e => setSymbolInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ maxWidth: 200 }}
          />
          <button className="btn btn-secondary" onClick={handleAdd}><Plus size={14} /> Add</button>
          <button className="btn btn-primary" onClick={handleAnalyse} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analysing…</> : <><Activity size={14} /> Analyse Portfolio</>}
          </button>
        </div>
        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{error}</div>}
      </div>

      {result && (
        <>
          {/* Portfolio Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div className="stat-card">
              <div className="stat-label"><Activity size={11} /> Portfolio Sharpe</div>
              <div className="stat-value" style={{ fontSize: 22, color: result.portfolio.risk_color }}>
                {result.portfolio.sharpe_ratio}
              </div>
              <div className="stat-sub">{result.portfolio.risk_label}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Annual Return</div>
              <div className="stat-value" style={{ fontSize: 22, color: result.portfolio.annual_return_pct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {result.portfolio.annual_return_pct > 0 ? '+' : ''}{result.portfolio.annual_return_pct}%
              </div>
              <div className="stat-sub">Equal-weighted portfolio</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Annual Volatility</div>
              <div className="stat-value" style={{ fontSize: 22, color: result.portfolio.annual_volatility_pct > 30 ? 'var(--red)' : 'var(--amber)' }}>
                {result.portfolio.annual_volatility_pct}%
              </div>
              <div className="stat-sub">Annualized standard deviation</div>
            </div>
            <div className="stat-card">
              <div className="stat-label"><Shield size={11} /> Diversification</div>
              <div className="stat-value" style={{ fontSize: 22, color: result.diversification_score >= 60 ? 'var(--green)' : 'var(--amber)' }}>
                {result.diversification_score}
              </div>
              <div className="stat-sub">Avg corr: {result.avg_correlation} (lower = better)</div>
            </div>
          </div>

          {/* Correlation Matrix */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ margin: 0 }}>Correlation Matrix</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={12} /> Low correlation = better diversification
              </div>
            </div>
            <CorrelationGrid data={result.correlation} symbols={result.symbols} />
            {result.missing?.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--amber)' }}>
                ⚠️ Skipped (insufficient data): {result.missing.join(', ')}
              </div>
            )}
          </div>

          {/* Per-Stock Sharpe */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={15} color="var(--blue)" /> Stock Performance (1-Year)
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Sharpe Ratio</th>
                  <th>Annual Return</th>
                  <th>Annual Volatility</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {result.sharpe_per_stock.map((s: any) => (
                  <tr key={s.symbol} onClick={() => onSelect(s.symbol)}>
                    <td className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 13.5 }}>{s.symbol}</td>
                    <td>
                      <span className={`chip ${s.sharpe_ratio >= 1 ? 'chip-buy' : s.sharpe_ratio >= 0.5 ? 'chip-watch' : 'chip-sell'}`}>
                        {s.sharpe_ratio}
                      </span>
                    </td>
                    <td className={`mono ${s.annual_return_pct >= 0 ? 'up' : 'down'}`} style={{ fontWeight: 700 }}>
                      {s.annual_return_pct > 0 ? '+' : ''}{s.annual_return_pct}%
                    </td>
                    <td className="mono">{s.annual_volatility_pct}%</td>
                    <td>
                      {s.sharpe_ratio >= 1.5 ? '🟢 Excellent' : s.sharpe_ratio >= 1 ? '🟡 Good' : s.sharpe_ratio >= 0.5 ? '🟠 Moderate' : '🔴 Risky'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kelly Criterion */}
          <div className="card">
            <div className="card-title"><Shield size={13} /> Kelly Criterion — Optimal Position Sizing</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', gap: 4, alignItems: 'center' }}>
              <Info size={12} /> Kelly % = mathematically optimal portion of capital to invest per stock. Capped at 25% for safety.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {result.kelly.map((k: any) => (
                <div key={k.symbol} className="rr-item" onClick={() => onSelect(k.symbol)} style={{ cursor: 'pointer' }}>
                  <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 14, marginBottom: 6 }}>{k.symbol}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color: k.kelly_pct >= 15 ? 'var(--green)' : k.kelly_pct >= 5 ? 'var(--amber)' : 'var(--text-muted)' }}>
                    {k.kelly_pct}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    Win rate: {k.win_rate}% · W/L: {k.win_loss_ratio}x
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
