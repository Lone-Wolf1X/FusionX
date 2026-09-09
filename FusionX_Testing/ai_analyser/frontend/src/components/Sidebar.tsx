import { BarChart2, Zap, TrendingUp, Grid, Activity, Star, LayoutDashboard, FlaskConical, PieChart } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'planner', label: 'Trade Planner', icon: TrendingUp },
  { id: 'suggestions', label: 'AI Suggestions', icon: Zap },
  { id: 'screener', label: 'Sector Screener', icon: BarChart2 },
  { id: 'watchlist', label: 'My Watchlist', icon: Star },
  { id: 'backtester', label: 'Backtesting Lab', icon: FlaskConical },
  { id: 'analytics', label: 'Portfolio Analytics', icon: PieChart },
  { id: 'heatmap', label: 'Market Heatmap', icon: Grid },
];

export default function Sidebar({ current, onNav }: { current: string; onNav: (p: string) => void }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-badge">
          <div className="logo-icon-wrap">
            <Activity size={16} color="white" />
          </div>
          FusionX
        </div>
        <div className="logo-sub">AI Stock Analyser</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <div
            key={id}
            className={`nav-item ${current === id ? 'active' : ''}`}
            onClick={() => onNav(id)}
          >
            <Icon size={15} />
            {label}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="status-badge">
          <div className="status-dot" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 11.5 }}>Connected • NEPSE</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 1 }}>Data: 1995 – Present</div>
          </div>
        </div>
      </div>
    </div>
  );
}
