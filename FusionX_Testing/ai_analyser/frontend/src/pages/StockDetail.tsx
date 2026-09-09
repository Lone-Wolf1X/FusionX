import { useEffect, useState } from 'react';
import { getStock } from '../services/api';
import ProTradingViewChart from '../components/ProTradingViewChart';
import { TrendingUp, TrendingDown, BarChart2, Activity, Star, StarOff, Shield, AlertTriangle, Target, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface Signal { type: string; text: string; }

interface Analysis {
  rsi: number;
  macd: number;
  macd_signal: number;
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  bb_upper: number;
  bb_lower: number;
  score: number;
  ltp: number;
  change_pct: number;
  atr: number;
  volume_ratio: number;
  signals: Signal[];
  support: number;
  resistance: number;
}

interface StockData {
  symbol: string;
  name?: string;
  sector?: string;
  total_records: number;
  from_date: string;
  to_date: string;
  ohlcv: { time: string; open: number; high: number; low: number; close: number; volume: number }[];
  indicators: any;
  analysis: Analysis;
}

const PERIODS = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '2Y', days: 730 },
  { label: 'MAX', days: 9999 },
];

function MetricRow({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="metric-row">
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div className="mono" style={{ fontWeight: 700, fontSize: 13.5, color: color || 'var(--text-main)' }}>{value}</div>
        {sub && <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function getAIVerdict(analysis: Analysis): string {
  const { score, rsi, macd, macd_signal, ema50, ema200, volume_ratio } = analysis;
  const trend = ema50 > ema200 ? 'bullish long-term trend (EMA 50 > 200)' : 'bearish long-term structure (EMA 50 < 200)';
  const rsiView = rsi < 30 ? 'RSI is oversold — a potential bounce opportunity' : rsi > 70 ? 'RSI is overbought — watch for a pullback' : 'RSI is neutral';
  const macdView = macd > macd_signal ? 'MACD shows bullish momentum' : 'MACD signal is bearish';
  const volView = volume_ratio > 2 ? ' with strong volume confirmation' : '';
  const verdict = score >= 70 ? `Strong Buy signal.` : score >= 50 ? `Watch closely.` : `Exercise caution.`;
  return `${verdict} Stock has a ${trend}. ${rsiView}. ${macdView}${volView}. AI Score: ${score}/100.`;
}

export default function StockDetail({ symbol }: { symbol: string }) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(9999);
  const [inWatchlist, setInWatchlist] = useState(false);
  // Check watchlist
  useEffect(() => {
    fetch('http://localhost:8001/api/watchlist')
      .then(r => r.json())
      .then((list: string[]) => setInWatchlist(list.includes(symbol)))
      .catch(() => {});
  }, [symbol]);

  const handleToggleWatchlist = async () => {
    const { addToWatchlist, removeFromWatchlist } = await import('../services/api');
    if (inWatchlist) {
      await removeFromWatchlist(symbol);
      setInWatchlist(false);
    } else {
      await addToWatchlist(symbol);
      setInWatchlist(true);
    }
  };

  if (loading) return (
    <div className="loader-wrap">
      <div className="spinner" />
      <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 6 }}>Loading {symbol}…</div>
    </div>
  );

  if (!data) return <div className="loader-wrap"><div style={{ color: 'var(--red)' }}>Stock not found.</div></div>;

  const a = data.analysis;
  const scoreColor = (a?.score ?? 0) >= 70 ? 'var(--green)' : (a?.score ?? 0) >= 50 ? 'var(--amber)' : 'var(--red)';
  const scoreBg = (a?.score ?? 0) >= 70 ? 'var(--green-dim)' : (a?.score ?? 0) >= 50 ? 'var(--amber-dim)' : 'var(--red-dim)';

  // Risk / Reward
  const ltp = a?.ltp ?? 0;
  const support = a?.support ?? ltp * 0.95;
  const resistance = a?.resistance ?? ltp * 1.1;
  const risk = ltp - support;
  const reward = resistance - ltp;
  const rrRatio = risk > 0 ? (reward / risk).toFixed(2) : '--';

  // 52-Week High / Low (from OHLCV)
  const highs = data.ohlcv.slice(-252).map(d => d.high);
  const lows = data.ohlcv.slice(-252).map(d => d.low);
  const high52 = highs.length ? Math.max(...highs) : null;
  const low52 = lows.length ? Math.min(...lows) : null;
  const pctFrom52H = high52 ? (((ltp - high52) / high52) * 100).toFixed(1) : null;
  const posInRange = (high52 && low52 && high52 !== low52)
    ? ((ltp - low52) / (high52 - low52)) * 100
    : 50;

  return (
    <div className="detail-grid">
      {/* ── Left Panel: TradingView Chart Studio ── */}
      <div className="chart-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--blue)' }}>{symbol}</span>
                <span className={`chip ${(a?.change_pct ?? 0) >= 0 ? 'chip-buy' : 'chip-sell'}`}>
                  {(a?.change_pct ?? 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {a?.change_pct?.toFixed(2)}%
                </span>
              </div>
              {data.name && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{data.name}</div>}
            </div>
            <div>
              <div className="mono" style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Rs {a?.ltp?.toFixed(2)}</div>
              {data.sector && <span className="chip chip-sector">{data.sector}</span>}
            </div>
          </div>
          <button className={`btn btn-sm ${inWatchlist ? 'btn-success' : 'btn-secondary'}`} onClick={handleToggleWatchlist}>
            {inWatchlist ? <><StarOff size={13} /> Unwatch</> : <><Star size={13} /> + Watchlist</>}
          </button>
        </div>

        <ProTradingViewChart initialSymbol={symbol} onSelect={() => {}} />
      </div>

      {/* ── Right Panel ── */}
      <div className="side-panel">
        {/* AI Score */}
        <div className="card">
          <div className="card-title"><Activity size={13} /> AI Score</div>
          <div className="score-display">
            <div className="score-circle" style={{ color: scoreColor, borderColor: scoreColor, background: scoreBg }}>
              {a?.score}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: (a?.score ?? 0) >= 70 ? 'var(--green)' : (a?.score ?? 0) >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                {(a?.score ?? 0) >= 70 ? '🟢 Strong Buy' : (a?.score ?? 0) >= 50 ? '🟡 Watch Closely' : '🔴 Avoid Now'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 3 }}>
                {data.total_records} trading days · since {data.from_date}
              </div>
            </div>
          </div>
          <div className="score-bar-wrap">
            <div className="score-bar-fill" style={{ width: `${a?.score ?? 0}%`, background: scoreColor }} />
          </div>

          {/* AI Verdict */}
          <div className="verdict-bubble" style={{ marginTop: 14 }}>
            {getAIVerdict(a)}
          </div>
        </div>

        {/* 52-Week Range */}
        {high52 && low52 && (
          <div className="card">
            <div className="card-title"><Target size={13} /> 52-Week Range</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600 }}>52W LOW</div>
                <div className="mono" style={{ fontWeight: 700, color: 'var(--green)', fontSize: 13 }}>Rs {low52.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600 }}>LTP</div>
                <div className="mono" style={{ fontWeight: 800, fontSize: 13 }}>Rs {ltp.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600 }}>52W HIGH</div>
                <div className="mono" style={{ fontWeight: 700, color: 'var(--red)', fontSize: 13 }}>Rs {high52.toFixed(2)}</div>
              </div>
            </div>
            <div className="week-bar-wrap">
              <div className="week-bar-fill" style={{ width: '100%' }} />
              <div className="week-bar-dot" style={{ left: `${posInRange}%` }} />
            </div>
            {pctFrom52H && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, textAlign: 'right' }}>
                {parseFloat(pctFrom52H) < 0 ? pctFrom52H : '+' + pctFrom52H}% from 52W High
              </div>
            )}
          </div>
        )}

        {/* Risk-Reward */}
        <div className="card">
          <div className="card-title"><Shield size={13} /> Risk / Reward</div>
          <div className="rr-row">
            <div className="rr-item">
              <div className="rr-label">Buy Zone</div>
              <div className="rr-value" style={{ color: 'var(--green)' }}>Rs {support.toFixed(2)}</div>
            </div>
            <div className="rr-item">
              <div className="rr-label">Target</div>
              <div className="rr-value" style={{ color: 'var(--blue)' }}>Rs {resistance.toFixed(2)}</div>
            </div>
            <div className="rr-item">
              <div className="rr-label">R:R Ratio</div>
              <div className="rr-value" style={{ color: parseFloat(rrRatio as string) >= 2 ? 'var(--green)' : 'var(--amber)' }}>
                1 : {rrRatio}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', fontSize: 11.5, color: 'var(--text-muted)' }}>
            <AlertTriangle size={11} style={{ display: 'inline', marginRight: 4 }} />
            Stop Loss should be placed below Rs {support.toFixed(2)}. Risk = Rs {risk.toFixed(2)} per share.
          </div>
        </div>

        {/* Indicators */}
        <div className="card">
          <div className="card-title"><BarChart2 size={13} /> Technical Indicators</div>
          <MetricRow label="RSI (14)" value={a?.rsi?.toFixed(1) ?? '--'} sub="Overbought >70, Oversold <30" color={a?.rsi < 30 ? 'var(--green)' : a?.rsi > 70 ? 'var(--red)' : undefined} />
          <MetricRow label="MACD" value={a?.macd?.toFixed(2) ?? '--'} sub={a?.macd > a?.macd_signal ? 'Bullish crossover' : 'Bearish signal'} color={a?.macd > 0 ? 'var(--green)' : 'var(--red)'} />
          <MetricRow label="EMA 9 / 21" value={`${a?.ema9?.toFixed(0) ?? '--'} / ${a?.ema21?.toFixed(0) ?? '--'}`} />
          <MetricRow label="EMA 50 / 200" value={`${a?.ema50?.toFixed(0) ?? '--'} / ${a?.ema200?.toFixed(0) ?? '--'}`} sub={a?.ema50 > a?.ema200 ? '✅ Golden cross' : '⚠️ Death cross'} />
          <MetricRow label="BB Upper / Lower" value={`${a?.bb_upper?.toFixed(0) ?? '--'} / ${a?.bb_lower?.toFixed(0) ?? '--'}`} />
          <MetricRow label="Volume Ratio" value={`${a?.volume_ratio?.toFixed(2)}x avg`} color={a?.volume_ratio > 2 ? 'var(--green)' : undefined} />
          <MetricRow label="ATR (14)" value={`Rs ${a?.atr?.toFixed(2) ?? '--'}`} sub="Average daily volatility range" />
        </div>

        {/* Listing & History Info */}
        <div className="card">
          <div className="card-title"><Calendar size={13} /> Listing & History</div>
          <MetricRow label="First Traded Date" value={data.from_date || '--'} sub="Earliest record in database" />
          <MetricRow label="Latest Trade Date" value={data.to_date || '--'} />
          <MetricRow label="Trading History" value={`${data.total_records} days`} sub={data.total_records < 252 ? '🌱 Recently Listed / New IPO' : '🏛 Established Stock'} color={data.total_records < 252 ? 'var(--amber)' : undefined} />
        </div>

        {/* Signals */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ margin: 0 }}>📡 Active Signals ({a?.signals?.length ?? 0})</div>
            <button className="collapsible-btn" onClick={() => setShowSignals(!showSignals)}>
              {showSignals ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> Show</>}
            </button>
          </div>
          {showSignals && (
            <div className="signal-list" style={{ marginTop: 10 }}>
              {a?.signals?.map((s, i) => (
                <div key={i} className={`signal-item signal-${s.type}`}>
                  <span>{s.text}</span>
                </div>
              ))}
              {(!a?.signals || a.signals.length === 0) && (
                <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>No strong signals detected.</div>
              )}
            </div>
          )}
          {!showSignals && a?.signals?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {a.signals.slice(0, 3).map((s, i) => (
                <span key={i} className={`chip ${s.type === 'bullish' ? 'chip-buy' : s.type === 'caution' ? 'chip-watch' : 'chip-neutral'}`} style={{ fontSize: 11 }}>
                  {s.text.length > 40 ? s.text.slice(0, 38) + '…' : s.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
