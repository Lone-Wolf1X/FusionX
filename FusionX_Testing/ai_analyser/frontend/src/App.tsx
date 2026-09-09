import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Screener from './pages/Screener';
import StockDetail from './pages/StockDetail';
import Suggestions from './pages/Suggestions';
import Heatmap from './pages/Heatmap';
import PortfolioPlanner from './pages/PortfolioPlanner';
import Dashboard from './pages/Dashboard';
import Watchlist from './pages/Watchlist';
import Backtester from './pages/Backtester';
import PortfolioAnalytics from './pages/PortfolioAnalytics';
import MultiPortfolioManager from './pages/MultiPortfolioManager';
import SearchBar from './components/SearchBar';
import StockTickerBulletin from './components/StockTickerBulletin';
import { Clock } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Market Overview',
  manager: 'Multi-Portfolio Manager',
  suggestions: 'AI Suggestions',
  screener: 'Sector Screener',
  heatmap: 'Market Heatmap',
  planner: 'Trade Planner',
  watchlist: 'My Watchlist',
  backtester: 'Backtesting Engine',
  analytics: 'Portfolio Analytics',
  detail: 'Chart View',
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const handleNav = (page: string) => {
    setCurrentPage(page);
    if (page !== 'detail') setSelectedSymbol(null);
  };

  const handleSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    setCurrentPage('detail');
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="app-layout">
      <Sidebar current={currentPage} onNav={handleNav} />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">
              {currentPage === 'detail' && selectedSymbol ? `${selectedSymbol} — Chart` : PAGE_TITLES[currentPage] || 'FusionX'}
            </h1>
            <SearchBar onSelect={handleSelect} />
          </div>

          <div className="topbar-right">
            <div className="topbar-stat">
              <Clock size={12} color="var(--text-dim)" />
              <span className="label">{dateStr}</span>
              <span className="val">{timeStr}</span>
            </div>
            <div className="topbar-stat">
              <span className="label">Exchange</span>
              <span className="val" style={{ color: 'var(--green)' }}>NEPSE</span>
            </div>
          </div>
        </header>

        {/* Live Floating Stock Ticker Bulletin */}
        <StockTickerBulletin onSelect={handleSelect} />

        <main className="page-content">
          <div className="page-fade" key={currentPage}>
            {currentPage === 'dashboard' && <Dashboard onSelect={handleSelect} />}
            {currentPage === 'manager' && <MultiPortfolioManager onSelect={handleSelect} />}
            {currentPage === 'suggestions' && <Suggestions onSelect={handleSelect} />}
            {currentPage === 'screener' && <Screener onSelect={handleSelect} />}
            {currentPage === 'heatmap' && <Heatmap onSelect={handleSelect} />}
            {currentPage === 'planner' && <PortfolioPlanner onSelect={handleSelect} />}
            {currentPage === 'watchlist' && <Watchlist onSelect={handleSelect} />}
            {currentPage === 'backtester' && <Backtester onSelect={handleSelect} />}
            {currentPage === 'analytics' && <PortfolioAnalytics onSelect={handleSelect} />}
            {currentPage === 'detail' && selectedSymbol && <StockDetail symbol={selectedSymbol} />}
          </div>
        </main>
      </div>
    </div>
  );
}
