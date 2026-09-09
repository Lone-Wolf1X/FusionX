import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TickerItem {
  symbol: string;
  name: string;
  ltp: number;
  change_pct: number;
}

export default function StockTickerBulletin({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [stocks, setStocks] = useState<TickerItem[]>([]);

  useEffect(() => {
    fetch('http://localhost:8001/api/scan')
      .then((r) => r.json())
      .then((data: any[]) => {
        if (data && data.length) {
          setStocks(
            data.map((s) => ({
              symbol: s.symbol,
              name: s.name || s.symbol,
              ltp: s.ltp,
              change_pct: s.change_pct,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  if (!stocks.length) return null;

  // Duplicate stocks list to create a seamless infinite marquee loop
  const displayList = [...stocks, ...stocks];

  return (
    <div className="ticker-bulletin-wrap">
      {/* Fixed Left Badge */}
      <div className="ticker-bulletin-badge">
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
        <span>NEPSE LIVE</span>
      </div>

      {/* Marquee Track */}
      <div className="ticker-bulletin-container">
        <div className="ticker-bulletin-track">
          {displayList.map((item, index) => {
            const isUp = (item.change_pct ?? 0) >= 0;
            return (
              <div
                key={`${item.symbol}-${index}`}
                className="ticker-item"
                onClick={() => onSelect(item.symbol)}
              >
                <span className="mono" style={{ fontWeight: 800, fontSize: 12.5, color: 'var(--blue)' }}>
                  {item.symbol}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>
                  Rs {item.ltp?.toFixed(2)}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isUp ? '#10B981' : '#EF4444',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? '+' : ''}
                  {item.change_pct?.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
