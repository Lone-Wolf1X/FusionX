import { useEffect, useState } from 'react';
import { getHeatmap } from '../services/api';

interface SectorData {
  avg_score: number;
  avg_change: number;
  count: number;
  stocks: { symbol: string; name?: string; score: number; change_pct: number; ltp: number }[];
}

export default function Heatmap({ onSelect }: { onSelect: (s: string) => void }) {
  const [data, setData] = useState<Record<string, SectorData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getHeatmap()
      .then(r => setData(r.sectors))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loader-wrap">
      <div className="spinner" />
      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Building sector heatmap...</div>
    </div>
  );

  if (!data) return null;

  const sectors = Object.entries(data).sort((a, b) => b[1].avg_score - a[1].avg_score);

  const getBg = (score: number) => {
    if (score >= 70) return 'rgba(16,185,129,0.18)';
    if (score >= 55) return 'rgba(16,185,129,0.08)';
    if (score >= 40) return 'rgba(245,158,11,0.12)';
    return 'rgba(239,68,68,0.12)';
  };
  const getBorder = (score: number) => {
    if (score >= 70) return 'rgba(16,185,129,0.4)';
    if (score >= 55) return 'rgba(16,185,129,0.2)';
    if (score >= 40) return 'rgba(245,158,11,0.3)';
    return 'rgba(239,68,68,0.3)';
  };
  const getTextColor = (score: number) => {
    if (score >= 70) return '#10B981';
    if (score >= 55) return '#34D399';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Click a sector to see individual stocks
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          <span><span style={{ color: '#10B981' }}>■</span> Strong (70+)</span>
          <span><span style={{ color: '#F59E0B' }}>■</span> Moderate (40–70)</span>
          <span><span style={{ color: '#EF4444' }}>■</span> Weak ({'<'}40)</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {sectors.map(([sector, info]) => (
          <div
            key={sector}
            onClick={() => setExpanded(expanded === sector ? null : sector)}
            style={{
              background: getBg(info.avg_score),
              border: `1px solid ${getBorder(info.avg_score)}`,
              borderRadius: 12,
              padding: 16,
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{info.count} stocks</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text-main)' }}>{sector}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: getTextColor(info.avg_score) }}>
              {info.avg_score}
            </div>
            <div style={{ fontSize: 12, color: info.avg_change >= 0 ? '#10B981' : '#EF4444', marginTop: 2 }}>
              {info.avg_change >= 0 ? '+' : ''}{info.avg_change?.toFixed(2)}% avg
            </div>
          </div>
        ))}
      </div>

      {/* Expanded sector */}
      {expanded && data[expanded] && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--amber)' }}>
            {expanded} — {data[expanded].count} Stocks
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Score</th>
                  <th>LTP</th>
                  <th>Change%</th>
                </tr>
              </thead>
              <tbody>
                {data[expanded].stocks
                  .sort((a, b) => b.score - a.score)
                  .map(s => (
                    <tr key={s.symbol} onClick={() => onSelect(s.symbol)}>
                      <td>
                        <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 13.5 }}>{s.symbol}</div>
                        {s.name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name}</div>}
                      </td>
                      <td>
                        <span className="mono" style={{
                          color: s.score >= 70 ? '#10B981' : s.score >= 50 ? '#F59E0B' : '#EF4444',
                          fontWeight: 700,
                        }}>{s.score}</span>
                      </td>
                      <td className="mono">Rs {s.ltp?.toFixed(2)}</td>
                      <td className={`mono ${s.change_pct >= 0 ? 'up' : 'down'}`}>
                        {s.change_pct >= 0 ? '+' : ''}{s.change_pct?.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
