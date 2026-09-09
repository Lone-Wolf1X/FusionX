import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  Play, Target, TrendingUp, TrendingDown, Activity, AlertTriangle,
  CheckCircle, BarChart2, Zap, Info
} from 'lucide-react';
import { useEffect } from 'react';
import SearchBar from '../components/SearchBar';

const BASE_URL = 'http://localhost:8001';

const PRESET_STRATEGIES = [
  {
    label: 'RSI Oversold + MACD Cross',
    value: 'rsi < 35 and macd > macd_signal',
    desc: 'Buy when RSI oversold AND MACD just crossed bullish',
  },
  {
    label: 'Golden Cross (EMA 9 > 21)',
    value: 'ema9 > ema21 and close > ema50',
    desc: 'Buy on short-term golden cross above EMA50',
  },
  {
    label: 'Volume Breakout',
    value: 'vol_ratio > 2.5 and close > ema21',
    desc: 'Buy when volume surges 2.5x average with uptrend',
  },
  {
    label: 'Bollinger Band Bounce',
    value: 'close < bb_lower and rsi < 40',
    desc: 'Buy at lower Bollinger Band with RSI low — mean reversion',
  },
  {
    label: 'Trend Following',
    value: 'ema9 > ema21 and ema21 > ema50 and ema50 > ema200',
    desc: 'All EMAs aligned upward — strong bullish trend',
  },
];

function MetricCard({ label, value, sub, color, icon: Icon }: any) {
  return (
    <div className="stat-card" style={{ padding: '16px 18px' }}>
      <div className="stat-label" style={{ marginBottom: 6 }}>
        {Icon && <Icon size={11} />} {label}
      </div>
      <div className="stat-value" style={{ fontSize: 20, color: color || 'var(--text-main)' }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function TradeRow({ trade, i, onSelect }: { trade: any; i: number; onSelect: (s: string) => void }) {
  const isWin = trade.result === 'win';
  return (
    <tr onClick={() => onSelect(trade.symbol)} style={{ cursor: 'pointer' }}>
      <td style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: 12 }}>{i + 1}</td>
      <td>
        <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 13 }}>{trade.symbol}</div>
        {trade.name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{trade.name}</div>}
      </td>
      <td style={{ fontSize: 12 }}>{trade.entry_date}</td>
      <td style={{ fontSize: 12 }}>{trade.exit_date}</td>
      <td className="mono" style={{ fontSize: 12 }}>Rs {trade.entry_price}</td>
      <td className="mono" style={{ fontSize: 12 }}>Rs {trade.exit_price}</td>
      <td>
        <span className={`chip ${isWin ? 'chip-buy' : 'chip-sell'}`} style={{ fontSize: 11 }}>
          {trade.profit_pct > 0 ? '+' : ''}{trade.profit_pct}%
        </span>
      </td>
      <td>
        <span className={`chip ${trade.exit_reason === 'take_profit' ? 'chip-buy' : trade.exit_reason === 'stop_loss' ? 'chip-sell' : 'chip-neutral'}`} style={{ fontSize: 10.5 }}>
          {trade.exit_reason === 'take_profit' ? '🎯 TP' : trade.exit_reason === 'stop_loss' ? '🛑 SL' : '⏱ End'}
        </span>
      </td>
    </tr>
  );
}

export default function Backtester({ onSelect }: { onSelect: (s: string) => void }) {
  const [strategy, setStrategy] = useState(PRESET_STRATEGIES[0].value);
  const [capital, setCapital] = useState(100000);
  const [tp, setTp] = useState(10);
  const [sl, setSl] = useState(5);
  const [posSize, setPosSize] = useState(10);
  const [maxPos, setMaxPos] = useState(5);
  const [fromDate, setFromDate] = useState('2022-01-01');
  const [toDate, setToDate] = useState('2024-12-31');
  const [symbolsInput, setSymbolsInput] = useState('');
  const [useAll, setUseAll] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState(0);

  useEffect(() => {
    fetch(`${BASE_URL}/api/sectors`)
      .then(r => r.json())
      .then(setSectors)
      .catch(() => {});
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      let symbols: string[] = [];
      if (useAll) {
        // Scan will give us all symbols; for backtest we use selected sectors or all
        const scanRes = await fetch(`${BASE_URL}/api/scan`);
        const scanData = await scanRes.json();
        symbols = scanData.stocks ? scanData.stocks.map((s: any) => s.symbol) : [];
      } else if (symbolsInput.trim()) {
        symbols = symbolsInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      } else {
        setError('Please enter stock symbols or select "Use All Stocks"');
        setLoading(false);
        return;
      }

      if (selectedSectors.length > 0) {
        const scanRes = await fetch(`${BASE_URL}/api/scan`);
        const scanData = await scanRes.json();
        const sectorSymbols = (scanData.stocks || [])
          .filter((s: any) => selectedSectors.includes(s.sector))
          .map((s: any) => s.symbol);
        symbols = sectorSymbols.length > 0 ? sectorSymbols : symbols;
      }

      const res = await fetch(`${BASE_URL}/api/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols,
          entry_strategy: strategy,
          initial_capital: capital,
          take_profit_pct: tp,
          stop_loss_pct: sl,
          position_size_pct: posSize,
          max_positions: maxPos,
          from_date: fromDate,
          to_date: toDate,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const s = result?.summary;
  const isPositive = s ? s.total_return_pct >= 0 : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Backtesting Engine</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            Test any trading strategy on real NEPSE historical data
          </div>
        </div>
        <span className="chip chip-purple"><Activity size={11} /> Strategy Lab</span>
      </div>

      {/* Config Panel */}
      <div className="card">
        <div className="card-title"><Zap size={13} /> Strategy Configuration</div>

        {/* Preset Strategies */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Preset Strategies</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_STRATEGIES.map((p, i) => (
              <button
                key={i}
                className={`btn btn-sm ${activePreset === i ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setActivePreset(i); setStrategy(p.value); }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {PRESET_STRATEGIES[activePreset] && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={12} /> {PRESET_STRATEGIES[activePreset].desc}
            </div>
          )}
        </div>

        {/* Strategy Expression */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Entry Strategy (Python Expression)</div>
          <input
            className="search-input"
            style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 13 }}
            value={strategy}
            onChange={e => setStrategy(e.target.value)}
            placeholder="e.g. rsi < 35 and macd > macd_signal"
          />
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 5 }}>
            Variables: rsi, macd, macd_signal, ema9, ema21, ema50, ema200, close, vol_ratio, bb_upper, bb_lower
          </div>
        </div>

        {/* Parameters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
          {[
            { label: 'Initial Capital (Rs)', value: capital, set: setCapital, min: 10000, step: 10000 },
            { label: 'Take Profit %', value: tp, set: setTp, min: 1, step: 1 },
            { label: 'Stop Loss %', value: sl, set: setSl, min: 1, step: 1 },
            { label: 'Position Size %', value: posSize, set: setPosSize, min: 1, step: 1 },
            { label: 'Max Positions', value: maxPos, set: setMaxPos, min: 1, step: 1 },
          ].map(({ label, value, set, min, step }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{label}</div>
              <input
                type="number"
                className="search-input"
                style={{ width: '100%' }}
                value={value}
                min={min}
                step={step}
                onChange={e => set(Number(e.target.value))}
              />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Date Range</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="date" className="search-input" style={{ flex: 1, fontSize: 12 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <input type="date" className="search-input" style={{ flex: 1, fontSize: 12 }} value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Stock Selection */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Stock Universe</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              <input type="checkbox" checked={useAll} onChange={e => setUseAll(e.target.checked)} />
              Use all available stocks
            </label>
            
            {!useAll && (
              <>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Search & Add Stock:</span>
                <div style={{ width: 250 }}>
                  <SearchBar
                    onSelect={(sym) => {
                      if (useAll) setUseAll(false);
                      const currentList = symbolsInput
                        .split(',')
                        .map((s) => s.trim().toUpperCase())
                        .filter(Boolean);
                      if (!currentList.includes(sym)) {
                        setSymbolsInput(currentList.concat(sym).join(', '));
                      }
                    }}
                  />
                </div>
              </>
            )}

            <input
              className="search-input"
              style={{ flex: 1, minWidth: 200 }}
              placeholder="Selected Symbols e.g. NABIL, HBL, NTC..."
              value={symbolsInput}
              onChange={e => setSymbolsInput(e.target.value)}
              disabled={useAll}
            />
          </div>
          {/* Sector filter chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)', alignSelf: 'center' }}>Filter by sector:</span>
            {sectors.slice(0, 10).map(sec => {
              const active = selectedSectors.includes(sec);
              return (
                <div
                  key={sec}
                  onClick={() => setSelectedSectors(active ? selectedSectors.filter(s => s !== sec) : [...selectedSectors, sec])}
                  style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                    border: active ? '1px solid var(--blue)' : '1px solid var(--border)',
                    background: active ? 'var(--blue-dim)' : 'var(--bg-base)',
                    color: active ? 'var(--blue)' : 'var(--text-muted)',
                  }}
                >
                  {sec}
                </div>
              );
            })}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleRun} disabled={loading} style={{ minWidth: 160 }}>
          {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Running Backtest…</> : <><Play size={15} /> Run Backtest</>}
        </button>
        {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}><AlertTriangle size={13} style={{ display: 'inline', marginRight: 4 }} />{error}</div>}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <MetricCard
              label="Total Return"
              value={`${s.total_return_pct > 0 ? '+' : ''}${s.total_return_pct}%`}
              sub={`Rs ${s.initial_capital.toLocaleString()} → Rs ${s.final_value.toLocaleString()}`}
              color={isPositive ? 'var(--green)' : 'var(--red)'}
              icon={isPositive ? TrendingUp : TrendingDown}
            />
            <MetricCard
              label="Win Rate"
              value={`${s.win_rate}%`}
              sub={`${s.total_trades} total trades`}
              color={s.win_rate >= 55 ? 'var(--green)' : s.win_rate >= 40 ? 'var(--amber)' : 'var(--red)'}
              icon={Target}
            />
            <MetricCard
              label="Sharpe Ratio"
              value={s.sharpe_ratio}
              sub={s.sharpe_ratio >= 1 ? 'Good risk-adjusted return' : 'Below threshold (>1 is good)'}
              color={s.sharpe_ratio >= 1.5 ? 'var(--green)' : s.sharpe_ratio >= 0.5 ? 'var(--amber)' : 'var(--red)'}
              icon={Activity}
            />
            <MetricCard
              label="Max Drawdown"
              value={`-${s.max_drawdown_pct}%`}
              sub={`Profit Factor: ${s.profit_factor}x`}
              color={s.max_drawdown_pct > 20 ? 'var(--red)' : s.max_drawdown_pct > 10 ? 'var(--amber)' : 'var(--green)'}
              icon={AlertTriangle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <MetricCard label="Avg Win" value={`+${s.avg_win_pct}%`} color="var(--green)" icon={CheckCircle} />
            <MetricCard label="Avg Loss" value={`-${s.avg_loss_pct}%`} color="var(--red)" icon={TrendingDown} />
            <MetricCard label="Profit Factor" value={`${s.profit_factor}x`} sub={s.profit_factor >= 2 ? '✅ Excellent' : s.profit_factor >= 1.5 ? '👍 Good' : '⚠️ Needs Work'} icon={BarChart2} />
          </div>

          {/* Equity Curve */}
          <div className="card">
            <div className="card-title"><TrendingUp size={13} /> Equity Curve — Portfolio Value Over Time</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={result.equity_curve} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#059669' : '#DC2626'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isPositive ? '#059669' : '#DC2626'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, boxShadow: 'var(--shadow-md)' }}
                  formatter={(v: number) => [`Rs ${v.toLocaleString()}`, 'Portfolio Value']}
                />
                <ReferenceLine y={capital} stroke="var(--text-dim)" strokeDasharray="4 4" label={{ value: 'Initial Capital', fill: 'var(--text-dim)', fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? '#059669' : '#DC2626'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#equityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Trade Log */}
          {result.trades.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={15} color="var(--blue)" />
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>Trade Log</span>
                <span className="chip chip-neutral" style={{ marginLeft: 'auto' }}>{result.trades.length} trades shown</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Symbol</th>
                      <th>Entry Date</th>
                      <th>Exit Date</th>
                      <th>Entry Price</th>
                      <th>Exit Price</th>
                      <th>P&L %</th>
                      <th>Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t: any, i: number) => (
                      <TradeRow key={i} trade={t} i={i} onSelect={onSelect} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
