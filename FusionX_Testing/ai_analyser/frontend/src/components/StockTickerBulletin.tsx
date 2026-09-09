import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  name: string;
  ltp: number;
  change_pct: number;
}

const DEFAULT_STOCKS: TickerItem[] = [
  { symbol: 'NABIL', name: 'Nabil Bank Limited', ltp: 624.0, change_pct: 1.8 },
  { symbol: 'NTC', name: 'Nepal Telecom', ltp: 910.5, change_pct: -0.5 },
  { symbol: 'GBIME', name: 'Global IME Bank', ltp: 245.0, change_pct: 2.1 },
  { symbol: 'HDL', name: 'Himalayan Distillery', ltp: 1680.0, change_pct: -1.2 },
  { symbol: 'CHCL', name: 'Chilime Hydropower', ltp: 495.0, change_pct: 0.9 },
  { symbol: 'SHIVM', name: 'Shivam Cements', ltp: 580.0, change_pct: 3.4 },
  { symbol: 'CIT', name: 'Citizen Investment Trust', ltp: 2150.0, change_pct: -0.8 },
  { symbol: 'EBL', name: 'Everest Bank Limited', ltp: 610.0, change_pct: 1.5 },
  { symbol: 'NICA', name: 'NIC Asia Bank', ltp: 512.0, change_pct: -1.1 },
  { symbol: 'UPPER', name: 'Upper Tamakoshi', ltp: 230.0, change_pct: 0.4 },
  { symbol: 'HBL', name: 'Himalayan Bank', ltp: 215.0, change_pct: 1.2 },
  { symbol: 'PCBL', name: 'Prime Commercial Bank', ltp: 228.0, change_pct: -0.3 },
];

export default function StockTickerBulletin({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [stocks, setStocks] = useState<TickerItem[]>(DEFAULT_STOCKS);

  useEffect(() => {
    fetch('http://localhost:8001/api/scan')
      .then((r) => r.json())
      .then((data: any) => {
        const rawList = Array.isArray(data) ? data : data?.stocks || [];
        if (rawList && rawList.length) {
          setStocks(
            rawList.map((s: any) => ({
              symbol: s.symbol,
              name: s.name || s.symbol,
              ltp: typeof s.ltp === 'number' ? s.ltp : parseFloat(s.ltp || 0),
              change_pct: typeof s.change_pct === 'number' ? s.change_pct : parseFloat(s.change_pct || 0),
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
