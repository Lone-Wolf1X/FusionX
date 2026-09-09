import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchResult {
  symbol: string;
  name?: string;
  sector?: string;
}

export default function SearchBar({ onSelect }: { onSelect: (s: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allStocks, setAllStocks] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load all stocks for search (from scan or a dedicated endpoint)
  useEffect(() => {
    // We'll use the /api/scan endpoint which returns all stocks with names
    fetch('http://localhost:8001/api/scan')
      .then(r => r.json())
      .then((data: any[]) => {
        setAllStocks(data.map(s => ({ symbol: s.symbol, name: s.name, sector: s.sector })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setOpen(false); return; }
    const filtered = allStocks
      .filter(s => s.symbol.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q))
      .slice(0, 8);
    setResults(filtered);
    setOpen(true);
  }, [query, allStocks]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (symbol: string) => {
    setQuery('');
    setOpen(false);
    onSelect(symbol);
  };

  return (
    <div className="search-wrap" ref={ref}>
      <Search size={15} className="search-icon" />
      <input
        className="search-input"
        placeholder="Search stock or symbol…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
      />
      {open && results.length > 0 && (
        <div className="search-dropdown">
          {results.map(s => (
            <div key={s.symbol} className="search-item" onClick={() => handleSelect(s.symbol)}>
              <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 13.5, minWidth: 64 }}>{s.symbol}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || s.symbol}</div>
                {s.sector && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.sector}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
