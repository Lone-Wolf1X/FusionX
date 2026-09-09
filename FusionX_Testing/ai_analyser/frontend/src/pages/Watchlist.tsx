import { useEffect, useState } from 'react';
import { getWatchlist, removeFromWatchlist } from '../services/api';
import { Star, Trash2, TrendingUp, TrendingDown, ChevronRight, BookOpen } from 'lucide-react';

interface WatchItem {
  symbol: string;
  name?: string;
  sector?: string;
  ltp?: number;
  change_pct?: number;
  score?: number;
  support?: number;
  resistance?: number;
}

function ScoreRing({ score }: { score?: number }) {
  const s = score ?? 0;
  const color = s >= 70 ? 'var(--green)' : s >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
      border: `3px solid ${color}`,
      background: s >= 70 ? 'var(--green-dim)' : s >= 50 ? 'var(--amber-dim)' : 'var(--red-dim)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13,
      color
    }}>
      {s}
    </div>
  );
}

export default function Watchlist({ onSelect }: { onSelect: (s: string) => void }) {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('http://localhost:8001/api/watchlist-detail')
      .then(r => r.json())
      .then(setItems)
      .catch(() => {
        // Fallback to basic watchlist
        getWatchlist().then((syms: string[]) => setItems(syms.map((s: string) => ({ symbol: s }))));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeFromWatchlist(sym);
    setItems(prev => prev.filter(i => i.symbol !== sym));
  };

  if (loading) return <div className="loader-wrap"><div className="spinner" /></div>;

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', letterSpacing: -0.5 }}>
            My Watchlist
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            {items.length} stock{items.length !== 1 ? 's' : ''} tracked
          </div>
        </div>
        <span className="chip chip-sector" style={{ fontSize: 12 }}>
          <Star size={11} /> Personal Watchlist
        </span>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <div className="watchlist-empty">
            <BookOpen size={40} color="var(--border-bright)" />
            <div style={{ fontWeight: 700, fontSize: 15 }}>Your watchlist is empty</div>
            <div style={{ fontSize: 13 }}>Visit any stock's detail page and click "+ Add to Watchlist"</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {items.map(item => (
            <div
              key={item.symbol}
              className="card"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => onSelect(item.symbol)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <ScoreRing score={item.score} />
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontSize: 17, fontWeight: 900, color: 'var(--blue)' }}>{item.symbol}</div>
                  {item.name && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{item.name}</div>}
                  {item.sector && <span className="chip chip-sector" style={{ marginTop: 4 }}>{item.sector}</span>}
                </div>
                <div style={{ textAlign: 'right', marginRight: 4 }}>
                  {item.ltp && (
                    <div className="mono" style={{ fontSize: 16, fontWeight: 800 }}>Rs {item.ltp.toFixed(2)}</div>
                  )}
                  {item.change_pct !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 3 }}>
                      {item.change_pct >= 0 ? <TrendingUp size={13} color="var(--green)" /> : <TrendingDown size={13} color="var(--red)" />}
                      <span className={item.change_pct >= 0 ? 'up' : 'down'} style={{ fontSize: 13 }}>
                        {item.change_pct >= 0 ? '+' : ''}{item.change_pct.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Support / Resistance zones */}
              {(item.support || item.resistance) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div className="rr-item">
                    <div className="rr-label">Buy Zone</div>
                    <div className="rr-value up">Rs {item.support?.toFixed(2) ?? '--'}</div>
                  </div>
                  <div className="rr-item">
                    <div className="rr-label">Sell Zone</div>
                    <div className="rr-value down">Rs {item.resistance?.toFixed(2) ?? '--'}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => handleRemove(item.symbol, e)}
                >
                  <Trash2 size={13} /> Remove
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => onSelect(item.symbol)}>
                  View Chart <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
