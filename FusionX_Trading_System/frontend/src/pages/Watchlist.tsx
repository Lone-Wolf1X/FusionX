import { useState, useEffect } from 'react';
import { fetchWatchlist } from '../services/api';

const Watchlist = () => {
    const [stocks, setStocks] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchWatchlist().then(data => setStocks(data.slice(0, 50))).catch(console.error);
    }, []);

    const filteredStocks = stocks.filter(s => 
        s.symbol.toLowerCase().includes(search.toLowerCase()) || 
        s.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '100%' }}>
            <div className="glass-card" style={{ height: '100%', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Watchlist</h3>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'white', padding: '8px 12px', borderRadius: '6px' }}
                    />
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>LTP</th>
                            <th>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStocks.map((stock, i) => {
                            const mockLtp = (Math.random() * 1000 + 100).toFixed(2);
                            const mockChange = (Math.random() * 10 - 5).toFixed(2);
                            const isUp = parseFloat(mockChange) >= 0;
                            return (
                                <tr key={i} className="clickable-row">
                                    <td><strong>{stock.symbol}</strong><br/><small style={{color:'var(--text-muted)'}}>{stock.sector}</small></td>
                                    <td>{mockLtp}</td>
                                    <td className={isUp ? 'up' : 'down'}>{isUp ? '+' : ''}{mockChange}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Market Depth</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-buy">Buy</button>
                        <button className="btn btn-sell">Sell</button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                    <table style={{ width: '50%', textAlign: 'center', borderCollapse: 'collapse' }}>
                        <thead><tr><th>Orders</th><th>Qty</th><th>Bid</th></tr></thead>
                        <tbody>
                            <tr className="flash-green"><td>2</td><td>500</td><td style={{color:'var(--color-buy)'}}>450.2</td></tr>
                            <tr className="flash-green"><td>1</td><td>100</td><td style={{color:'var(--color-buy)'}}>450.0</td></tr>
                        </tbody>
                    </table>
                    <table style={{ width: '50%', textAlign: 'center', borderCollapse: 'collapse' }}>
                        <thead><tr><th>Ask</th><th>Qty</th><th>Orders</th></tr></thead>
                        <tbody>
                            <tr className="flash-red"><td style={{color:'var(--color-sell)'}}>451.0</td><td>200</td><td>1</td></tr>
                            <tr className="flash-red"><td style={{color:'var(--color-sell)'}}>451.5</td><td>800</td><td>3</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Watchlist;
