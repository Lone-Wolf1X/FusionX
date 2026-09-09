import { useEffect, useState } from 'react';
import { getSuggestions } from '../services/api';
import { Zap, Eye, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface StockSuggestion {
  symbol: string;
  score: number;
  rsi: number;
  change_pct: number;
  ltp: number;
  signals: { type: string; text: string }[];
  volume_ratio: number;
  name?: string;
  sector?: string;
}

interface SuggestionsData {
  strong_buy: StockSuggestion[];
  watch_list: StockSuggestion[];
  total_scanned: number;
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? 'score-high' : score >= 50 ? 'score-mid' : 'score-low';
  return <div className={`score-badge ${cls}`}>{score}</div>;
}

function StockCard({ stock, onSelect, label }: { stock: StockSuggestion; onSelect: (s: string) => void; label: 'buy' | 'watch' }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="suggest-stock-row" style={{ flexDirection: 'column', alignItems: 'stretch', padding: 0 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', cursor: 'pointer' }}
        onClick={() => onSelect(stock.symbol)}
      >
        <ScoreBadge score={stock.score} />
        <div className="suggest-stock-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="suggest-stock-sym">{stock.symbol}</div>
            <span className={`chip ${label === 'buy' ? 'chip-buy' : 'chip-watch'}`} style={{ fontSize: 10.5 }}>
              {label === 'buy' ? <><CheckCircle size={10} /> BUY</> : <><Eye size={10} /> WATCH</>}
            </span>
            {stock.sector && <span className="chip chip-sector">{stock.sector}</span>}
          </div>
          <div className="suggest-stock-name">{stock.name}</div>
          <div className="suggest-stock-sigs">
            {stock.signals.slice(0, 2).map((s, i) => <span key={i}>• {s.text}&nbsp;&nbsp;</span>)}
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 90 }}>
          <div className="mono" style={{ fontWeight: 800, fontSize: 14 }}>Rs {stock.ltp?.toFixed(2)}</div>
          <div className={`mono ${(stock.change_pct ?? 0) >= 0 ? 'up' : 'down'}`} style={{ fontSize: 12, marginTop: 2 }}>
            {(stock.change_pct ?? 0) >= 0 ? '+' : ''}{stock.change_pct?.toFixed(2)}%
          </div>
        </div>
        <button
          className="collapsible-btn"
          onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{ marginLeft: 4 }}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Collapsible "Why?" section */}
      {expanded && (
        <div style={{ padding: '0 18px 14px 18px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 10 }}>
            Why this stock?
          </div>
          <div className="signal-list">
            {stock.signals.map((s, i) => (
              <div key={i} className={`signal-item signal-${s.type}`} style={{ padding: '7px 11px', fontSize: 12 }}>
                {s.text}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>RSI: <b>{stock.rsi?.toFixed(1)}</b></div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vol Ratio: <b>{stock.volume_ratio?.toFixed(2)}x</b></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Suggestions({ onSelect }: { onSelect: (s: string) => void }) {
  const [data, setData] = useState<SuggestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSuggestions()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loader-wrap">
      <div className="spinner" />
      <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Running AI analysis…</div>
    </div>
  );

  if (error) return <div className="loader-wrap"><div style={{ color: 'var(--red)' }}>{error}</div></div>;
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>AI Stock Suggestions</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            Scanned <b>{data.total_scanned}</b> stocks · click any stock to expand signals
          </div>
        </div>
        <span className="chip chip-purple"><Zap size={11} /> AI Powered</span>
      </div>

      <div className="suggest-grid">
        {/* Strong Buy */}
        <div className="suggest-card">
          <div className="suggest-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} color="var(--green)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Strong Buy</span>
            </div>
            <span className="chip chip-buy">{data.strong_buy.length} stocks</span>
          </div>
          {data.strong_buy.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No strong buy signals right now.</div>
          ) : (
            data.strong_buy.map(s => (
              <StockCard key={s.symbol} stock={s} onSelect={onSelect} label="buy" />
            ))
          )}
        </div>

        {/* Watch List */}
        <div className="suggest-card">
          <div className="suggest-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={16} color="var(--amber)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Watch Closely</span>
            </div>
            <span className="chip chip-watch">{data.watch_list.length} stocks</span>
          </div>
          {data.watch_list.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No watch signals right now.</div>
          ) : (
            data.watch_list.map(s => (
              <StockCard key={s.symbol} stock={s} onSelect={onSelect} label="watch" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
