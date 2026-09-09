import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchResult {
  symbol: string;
  name?: string;
  sector?: string;
}

const DEFAULT_STOCKS: SearchResult[] = [
  { symbol: 'NABIL', name: 'Nabil Bank Limited', sector: 'Commercial Banks' },
  { symbol: 'NTC', name: 'Nepal Telecom', sector: 'Others' },
  { symbol: 'GBIME', name: 'Global IME Bank Limited', sector: 'Commercial Banks' },
  { symbol: 'HDL', name: 'Himalayan Distillery Limited', sector: 'Manufacturing and Processing' },
  { symbol: 'CHCL', name: 'Chilime Hydropower Company', sector: 'Hydro Power' },
  { symbol: 'SHIVM', name: 'Shivam Cements Limited', sector: 'Manufacturing and Processing' },
  { symbol: 'CIT', name: 'Citizen Investment Trust', sector: 'Investment' },
  { symbol: 'EBL', name: 'Everest Bank Limited', sector: 'Commercial Banks' },
  { symbol: 'NICA', name: 'NIC Asia Bank Limited', sector: 'Commercial Banks' },
  { symbol: 'UPPER', name: 'Upper Tamakoshi Hydropower', sector: 'Hydro Power' },
  { symbol: 'HBL', name: 'Himalayan Bank Limited', sector: 'Commercial Banks' },
  { symbol: 'PCBL', name: 'Prime Commercial Bank', sector: 'Commercial Banks' },
  { symbol: 'NLIC', name: 'Nepal Life Insurance', sector: 'Life Insurance' },
  { symbol: 'SBI', name: 'Nepal SBI Bank', sector: 'Commercial Banks' },
  { symbol: 'RADHI', name: 'Radhi Vidyut Company', sector: 'Hydro Power' },
  { symbol: 'API', name: 'Api Power Company', sector: 'Hydro Power' },
  { symbol: 'NRIC', name: 'Nepal Reinsurance Company', sector: 'Others' },
];

export default function SearchBar({ onSelect }: { onSelect: (s: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allStocks, setAllStocks] = useState<SearchResult[]>(DEFAULT_STOCKS);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  // Load live stock list from API
  useEffect(() => {
    fetch('http://localhost:8001/api/scan')
      .then((r) => r.json())
      .then((data: any) => {
        const rawList = Array.isArray(data) ? data : data?.stocks || [];
        if (rawList && rawList.length > 0) {
          setAllStocks(
            rawList.map((s: any) => ({
              symbol: s.symbol,
              name: s.name || s.symbol,
              sector: s.sector || 'NEPSE Equity',
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Filter stocks whenever query or allStocks changes
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If query is empty, show top 8 popular stocks on focus
      setResults(allStocks.slice(0, 8));
      setSelectedIndex(-1);
      return;
    }

    const filtered = allStocks
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          (s.name || '').toLowerCase().includes(q) ||
          (s.sector || '').toLowerCase().includes(q)
      )
      .slice(0, 10);

    setResults(filtered);
    setOpen(true);
    setSelectedIndex(-1);
  }, [query, allStocks]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (symbol: string) => {
    setQuery('');
    setOpen(false);
    onSelect(symbol);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex].symbol);
      } else if (results.length > 0) {
        handleSelect(results[0].symbol);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="search-wrap" ref={ref} style={{ position: 'relative', width: '100%' }}>
      <Search size={15} className="search-icon" />
      <input
        className="search-input"
        placeholder="Search stock or symbol…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && results.length > 0 && (
        <div className="search-dropdown" style={{ zIndex: 1000 }}>
          {results.map((s, index) => (
            <div
              key={s.symbol}
              className={`search-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(s.symbol)}
              style={{
                background: index === selectedIndex ? 'var(--bg-hover)' : undefined,
              }}
            >
              <div className="mono" style={{ fontWeight: 800, color: 'var(--blue)', fontSize: 13.5, minWidth: 64 }}>
                {s.symbol}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.name || s.symbol}
                </div>
                {s.sector && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.sector}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
