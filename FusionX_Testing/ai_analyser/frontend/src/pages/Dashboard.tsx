import { useEffect, useState } from 'react';
import { getDashboardData } from '../services/api';
import DashboardAdvancedChart from '../components/DashboardAdvancedChart';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart2, Zap, RefreshCw } from 'lucide-react';

const PIE_COLORS = ['#0284C7', '#0891B2', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#D97706', '#DC2626'];

function RankBadge({ rank }: { rank: number }) {
  return <div className={`rank-badge rank-${rank}`}>{rank}</div>;
}

export default function Dashboard({ onSelect }: { onSelect: (s: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = () => {
    setLoading(true);
    getDashboardData()
      .then(d => { setData(d); setLastRefresh(new Date()); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Aggregating market data…</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Topline metrics */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label"><DollarSign size={12} /> Market Turnover</div>
          <div className="stat-value" style={{ color: 'var(--blue)', fontSize: 20 }}>
            Rs {Math.round(data.total_turnover).toLocaleString()}
          </div>
          <div className="stat-sub">Today's estimated turnover</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><BarChart2 size={12} /> Total Volume</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {Math.round(data.total_volume).toLocaleString()}
          </div>
          <div className="stat-sub">Shares traded today</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Activity size={12} /> Stocks Tracked</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{data.total_scanned}</div>
          <div className="stat-sub">
            <button className="btn btn-ghost btn-sm" onClick={load} style={{ padding: '2px 8px', fontSize: 11 }}>
              <RefreshCw size={10} /> Refresh
            </button>
            &nbsp;{lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Interactive NepseAlpha-style Advanced Stock Chart */}
      <DashboardAdvancedChart onSelect={onSelect} />

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 320 }}>
          <div className="card-title"><BarChart2 size={13} /> Sector Turnover Distribution</div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.sector_distribution}
                  cx="50%" cy="48%"
                  innerRadius={65} outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {data.sector_distribution.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(v: number) => [`Rs ${Math.round(v).toLocaleString()}`, 'Turnover']}
                  contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, boxShadow: 'var(--shadow-md)' }}
                />
                <Legend
                  verticalAlign="bottom" height={40}
                  wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 320 }}>
          <div className="card-title"><TrendingUp size={13} /> Volume Trend (30 Days)</div>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.volume_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <RechartsTooltip
                  contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, boxShadow: 'var(--shadow-md)' }}
                  labelStyle={{ color: 'var(--text-muted)', fontWeight: 600 }}
                  formatter={(v: number) => [Math.round(v).toLocaleString(), 'Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke="#0284C7" strokeWidth={2.5} fillOpacity={1} fill="url(#volGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gainers & Losers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #F0FDF9, #DCFCE7)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="var(--green)" />
            <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--green)' }}>Top Gainers</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Stock</th>
                <th>LTP</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {data.top_gainers.map((s: any, i: number) => (
                <tr key={s.symbol} onClick={() => onSelect(s.symbol)}>
                  <td><RankBadge rank={i + 1} /></td>
                  <td>
                    <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 13.5 }}>{s.symbol}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name}</div>
                  </td>
                  <td className="mono" style={{ fontWeight: 700, fontSize: 13 }}>Rs {s.ltp?.toFixed(2)}</td>
                  <td><span className="chip chip-buy">+{s.change_pct?.toFixed(2)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #FFF5F5, #FEE2E2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingDown size={16} color="var(--red)" />
            <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--red)' }}>Top Losers</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Stock</th>
                <th>LTP</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {data.top_losers.map((s: any, i: number) => (
                <tr key={s.symbol} onClick={() => onSelect(s.symbol)}>
                  <td><RankBadge rank={i + 1} /></td>
                  <td>
                    <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 13.5 }}>{s.symbol}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name}</div>
                  </td>
                  <td className="mono" style={{ fontWeight: 700, fontSize: 13 }}>Rs {s.ltp?.toFixed(2)}</td>
                  <td><span className="chip chip-sell">{s.change_pct?.toFixed(2)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top AI Stocks */}
      {data.top_ai_stocks && data.top_ai_stocks.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #EEF6FF, #E0F0FF)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="var(--blue)" />
            <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--blue)' }}>Top 5 AI-Scored Stocks</span>
            <span className="chip chip-purple" style={{ marginLeft: 'auto' }}>AI Ranked</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Stock</th>
                <th>AI Score</th>
                <th>LTP</th>
                <th>Sector</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {data.top_ai_stocks.map((s: any, i: number) => (
                <tr key={s.symbol} onClick={() => onSelect(s.symbol)}>
                  <td><RankBadge rank={i + 1} /></td>
                  <td>
                    <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 13.5 }}>{s.symbol}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', maxWidth: 80 }}>
                        <div style={{ width: `${s.score}%`, height: '100%', background: 'var(--green)', borderRadius: 3 }} />
                      </div>
                      <span className="mono" style={{ fontWeight: 800, fontSize: 13, color: 'var(--green)' }}>{s.score}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ fontWeight: 600 }}>Rs {s.ltp?.toFixed(2)}</td>
                  <td><span className="chip chip-sector">{s.sector}</span></td>
                  <td>
                    <span className={`chip ${(s.change_pct ?? 0) >= 0 ? 'chip-buy' : 'chip-sell'}`}>
                      {(s.change_pct ?? 0) >= 0 ? '+' : ''}{s.change_pct?.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
