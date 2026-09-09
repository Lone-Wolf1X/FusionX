import { useEffect, useState } from 'react';
import { runManualScan, getSectors, getProfile, saveProfile } from '../services/api';
import { Filter, Play, CheckCircle, Save } from 'lucide-react';

interface Stock {
  symbol: string;
  name?: string;
  score: number;
  rsi: number;
  macd: number;
  macd_signal: number;
  ema50: number;
  ema200: number;
  signals: { type: string; text: string }[];
}

function ScoreBar({ score }: { score: number }) {
  const width = `${score}%`;
  const bg = score >= 70 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: 'var(--border)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width, background: bg, height: '100%' }} />
      </div>
      <span className="mono" style={{ fontSize: 12, fontWeight: 700, width: 24, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

export default function Screener({ onSelect }: { onSelect: (s: string) => void }) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch available sectors and user profile on mount
    Promise.all([getSectors(), getProfile()]).then(([allSectors, profileData]) => {
      setSectors(allSectors);
      if (profileData.sectors && profileData.sectors.length > 0) {
        setSelectedSectors(profileData.sectors);
      }
    }).catch(console.error);
  }, []);

  const handleToggleSector = (sec: string) => {
    if (selectedSectors.includes(sec)) {
      setSelectedSectors(selectedSectors.filter(s => s !== sec));
    } else {
      setSelectedSectors([...selectedSectors, sec]);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await saveProfile(selectedSectors);
      // Optional: alert or toast
    } catch (e) {
      console.error(e);
      alert('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunScan = async () => {
    if (selectedSectors.length === 0) {
      alert("Please select at least one sector to scan.");
      return;
    }
    setLoading(true);
    setStocks([]);
    try {
      const data = await runManualScan(selectedSectors);
      setStocks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Filter size={18} /> Screener & Portfolio Setup
      </div>

      <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Select Your Preferred Sectors</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {sectors.map(sec => {
            const isSelected = selectedSectors.includes(sec);
            return (
              <div 
                key={sec}
                onClick={() => handleToggleSector(sec)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--blue)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--blue)' : 'var(--bg-card)',
                  color: isSelected ? 'white' : 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSelected && <CheckCircle size={12} style={{ marginRight: 4, display: 'inline' }}/>}
                {sec}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleSaveProfile} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Preferences'}
          </button>
          <button className="btn btn-primary" onClick={handleRunScan} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}/> : <Play size={16} />}
            {loading ? 'Scanning...' : 'Run Screener'}
          </button>
        </div>
      </div>

      {stocks.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Score</th>
                <th>RSI</th>
                <th>Trend (50/200)</th>
                <th>Signals</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s.symbol} onClick={() => onSelect(s.symbol)}>
                  <td>
                    <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 15 }}>{s.symbol}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.name}</div>
                  </td>
                  <td style={{ minWidth: 120 }}><ScoreBar score={s.score} /></td>
                  <td className="mono" style={{ color: s.rsi > 70 ? 'var(--red)' : s.rsi < 30 ? 'var(--green)' : 'inherit' }}>
                    {s.rsi?.toFixed(1)}
                  </td>
                  <td>
                    <span className={`chip ${s.ema50 > s.ema200 ? 'chip-buy' : 'chip-sell'}`}>
                      {s.ema50 > s.ema200 ? 'Bullish' : 'Bearish'}
                    </span>
                  </td>
                  <td>
                    {s.signals.length} flags
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!loading && stocks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Click "Run Screener" to scan your selected sectors.
        </div>
      )}
    </div>
  );
}
