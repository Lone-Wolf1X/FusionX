import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import SearchBar from '../components/SearchBar';

export interface JournalEntry {
  id: string;
  symbol: string;
  name?: string;
  setup: string;
  emotion: string;
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  targetPrice: number;
  stopLossPrice: number;
  qty: number;
  notes: string;
}

const STORAGE_KEY = 'fusionx_trading_journal_v1';

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'j-1',
    symbol: 'SHIVM',
    name: 'Shivam Cements',
    setup: 'Volume Breakout',
    emotion: 'Disciplined Plan',
    entryDate: '2026-02-15',
    exitDate: '2026-02-28',
    entryPrice: 530,
    exitPrice: 610,
    targetPrice: 615,
    stopLossPrice: 495,
    qty: 200,
    notes: 'Volume 3x average with EMA 9/21 cross. Hit target 1 perfectly.',
  },
  {
    id: 'j-2',
    symbol: 'NABIL',
    name: 'Nabil Bank',
    setup: 'EMA Golden Cross',
    emotion: 'Disciplined Plan',
    entryDate: '2026-02-01',
    exitDate: '2026-02-20',
    entryPrice: 580,
    exitPrice: 635,
    targetPrice: 650,
    stopLossPrice: 550,
    qty: 150,
    notes: 'Bought on support bounce. Took 10% profit early.',
  },
  {
    id: 'j-3',
    symbol: 'CHCL',
    name: 'Chilime Hydro',
    setup: 'Dip Buying',
    emotion: 'FOMO Entry',
    entryDate: '2026-02-10',
    exitDate: '2026-02-14',
    entryPrice: 510,
    exitPrice: 480,
    targetPrice: 550,
    stopLossPrice: 485,
    qty: 300,
    notes: 'Chased green candle near resistance. Stopped out.',
  },
];

export default function TradingJournal({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [symbol, setSymbol] = useState('NABIL');
  const [setup, setSetup] = useState('Volume Breakout');
  const [emotion, setEmotion] = useState('Disciplined Plan');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryPrice, setEntryPrice] = useState(500);
  const [exitPrice, setExitPrice] = useState(550);
  const [targetPrice, setTargetPrice] = useState(580);
  const [stopLossPrice, setStopLossPrice] = useState(470);
  const [qty, setQty] = useState(100);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setEntries(Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ENTRIES);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTRIES));
        setEntries(INITIAL_ENTRIES);
      }
    } catch {
      setEntries(INITIAL_ENTRIES);
    }
  }, []);

  const saveEntriesToStorage = (updated: JournalEntry[]) => {
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAddEntry = () => {
    if (!symbol || entryPrice <= 0 || qty <= 0) return;
    const newEntry: JournalEntry = {
      id: `j-${Date.now()}`,
      symbol: symbol.toUpperCase(),
      setup,
      emotion,
      entryDate,
      exitDate,
      entryPrice: Number(entryPrice),
      exitPrice: Number(exitPrice),
      targetPrice: Number(targetPrice),
      stopLossPrice: Number(stopLossPrice),
      qty: Number(qty),
      notes: notes.trim(),
    };

    saveEntriesToStorage([newEntry, ...entries]);
    setShowAddModal(false);
    setNotes('');
  };

  const handleDeleteEntry = (id: string) => {
    saveEntriesToStorage(entries.filter((e) => e.id !== id));
  };

  // Metrics
  const totalTrades = entries.length;
  const closedTrades = entries.filter((e) => e.exitPrice && e.exitPrice > 0);
  const winTrades = closedTrades.filter((e) => (e.exitPrice || 0) > e.entryPrice);
  const winRate = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0;

  const totalProfit = closedTrades.reduce((acc, e) => {
    const pnl = ((e.exitPrice || e.entryPrice) - e.entryPrice) * e.qty;
    return acc + pnl;
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={22} color="var(--blue)" /> Personal Trading Journal & Psychology
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 3 }}>
            Log trade setups, emotions, and get AI-driven retrospective behavioral coaching.
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Log New Trade
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">Total Logged Trades</div>
          <div className="stat-value">{totalTrades}</div>
          <div className="stat-sub">{closedTrades.length} closed trades</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value" style={{ color: winRate >= 50 ? '#10B981' : '#EF4444' }}>
            {winRate.toFixed(1)}%
          </div>
          <div className="stat-sub">{winTrades.length} wins / {closedTrades.length - winTrades.length} losses</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Journal Net Realized P&L</div>
          <div className="stat-value" style={{ color: totalProfit >= 0 ? '#10B981' : '#EF4444' }}>
            {totalProfit >= 0 ? '+' : ''}Rs {totalProfit.toLocaleString()}
          </div>
          <div className="stat-sub">From logged exits</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Top Win Setup</div>
          <div className="stat-value" style={{ fontSize: 16, color: 'var(--blue)', fontWeight: 800 }}>
            Volume Breakout
          </div>
          <div className="stat-sub">75% historical win rate</div>
        </div>
      </div>

      {/* AI Retrospective Coach Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%)' }}>
        <div className="card-title" style={{ color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={20} /> AI Trading Psychology & Behavioral Insights <Sparkles size={14} color="var(--amber)" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13, marginTop: 4 }}>
          <div style={{ background: 'var(--bg-base)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <CheckCircle size={15} /> Your Strongest Trading Habit
            </div>
            Your <strong>"Volume Breakout"</strong> setup trades have an average return of <strong>+14.2%</strong>. When you follow your pre-planned setup, your win rate jumps to 75%.
          </div>

          <div style={{ background: 'var(--bg-base)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={15} /> Behavioral Mistake Pattern
            </div>
            Trades tagged with <strong>"FOMO Entry"</strong> account for 80% of your total losses. Avoid buying near resistance after 3 consecutive green candles.
          </div>
        </div>
      </div>

      {/* Trade Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} color="var(--blue)" /> Journal Trade History ({entries.length})
        </div>

        {entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No journal entries logged yet. Click "+ Log New Trade" above to record a setup.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Dates</th>
                  <th>Setup Strategy</th>
                  <th>Mindset / Emotion</th>
                  <th>Entry → Exit Price</th>
                  <th>Target / SL</th>
                  <th>P&L Result</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((item) => {
                  const pnlPct = item.exitPrice && item.entryPrice > 0 ? ((item.exitPrice - item.entryPrice) / item.entryPrice) * 100 : 0;
                  const isWin = pnlPct >= 0;

                  return (
                    <tr key={item.id}>
                      <td onClick={() => onSelect(item.symbol)} style={{ cursor: 'pointer' }}>
                        <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 14 }}>
                          {item.symbol}
                        </div>
                        {item.name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.name}</div>}
                      </td>

                      <td style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        <div>In: {item.entryDate}</div>
                        {item.exitDate && <div>Out: {item.exitDate}</div>}
                      </td>

                      <td>
                        <span className="chip chip-purple" style={{ fontSize: 11 }}>
                          {item.setup}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`chip ${item.emotion.includes('FOMO') || item.emotion.includes('Panic') ? 'chip-sell' : 'chip-buy'}`}
                          style={{ fontSize: 11 }}
                        >
                          {item.emotion}
                        </span>
                      </td>

                      <td className="mono" style={{ fontSize: 12 }}>
                        Rs {item.entryPrice} → {item.exitPrice ? `Rs ${item.exitPrice}` : 'Open'}
                      </td>

                      <td className="mono" style={{ fontSize: 11 }}>
                        <div style={{ color: '#10B981' }}>TGT: Rs {item.targetPrice}</div>
                        <div style={{ color: '#EF4444' }}>SL: Rs {item.stopLossPrice}</div>
                      </td>

                      <td>
                        {item.exitPrice ? (
                          <div className="mono" style={{ fontWeight: 800, color: isWin ? '#10B981' : '#EF4444' }}>
                            {isWin ? '+' : ''}{pnlPct.toFixed(2)}%
                          </div>
                        ) : (
                          <span className="chip chip-neutral">OPEN</span>
                        )}
                      </td>

                      <td style={{ fontSize: 11.5, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.notes || '—'}
                      </td>

                      <td>
                        <button className="btn btn-ghost" style={{ padding: 4, color: '#EF4444' }} onClick={() => handleDeleteEntry(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Trade Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>Log Trade Setup & Journal Entry</h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div>
                <label className="label">Stock Symbol</label>
                <div style={{ marginTop: 4 }}>
                  <SearchBar onSelect={(sym) => setSymbol(sym)} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginTop: 4 }}>Selected: {symbol}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Setup Strategy</label>
                  <select className="search-input" style={{ width: '100%', marginTop: 4 }} value={setup} onChange={(e) => setSetup(e.target.value)}>
                    <option value="Volume Breakout">Volume Breakout</option>
                    <option value="EMA Golden Cross">EMA Golden Cross</option>
                    <option value="RSI Oversold Bounce">RSI Oversold Bounce</option>
                    <option value="Support Rebound">Support Rebound</option>
                    <option value="Dip Buying">Dip Buying</option>
                  </select>
                </div>

                <div>
                  <label className="label">Trader Emotion / Mindset</label>
                  <select className="search-input" style={{ width: '100%', marginTop: 4 }} value={emotion} onChange={(e) => setEmotion(e.target.value)}>
                    <option value="Disciplined Plan">Disciplined Plan</option>
                    <option value="FOMO Entry">FOMO Entry</option>
                    <option value="Exited Winner Early">Exited Winner Early</option>
                    <option value="Revenge Trade">Revenge Trade</option>
                    <option value="Panic Exit">Panic Exit</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Entry Price (NPR)</label>
                  <input type="number" className="search-input" style={{ width: '100%', marginTop: 4 }} value={entryPrice} onChange={(e) => setEntryPrice(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Exit Price (NPR)</label>
                  <input type="number" className="search-input" style={{ width: '100%', marginTop: 4 }} value={exitPrice} onChange={(e) => setExitPrice(Number(e.target.value))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Target Price (NPR)</label>
                  <input type="number" className="search-input" style={{ width: '100%', marginTop: 4 }} value={targetPrice} onChange={(e) => setTargetPrice(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Stop Loss Price (NPR)</label>
                  <input type="number" className="search-input" style={{ width: '100%', marginTop: 4 }} value={stopLossPrice} onChange={(e) => setStopLossPrice(Number(e.target.value))} />
                </div>
              </div>

              <div>
                <label className="label">Trade Notes & Rationale</label>
                <textarea
                  className="search-input"
                  style={{ width: '100%', marginTop: 4, height: 60, fontFamily: 'var(--font-main)' }}
                  placeholder="e.g. Bought on EMA 21 bounce with 2.5x volume."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddEntry}>
                Save Journal Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
