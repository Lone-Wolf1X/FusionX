import { useState, useEffect } from 'react';
import { fetchStatus } from '../services/api';

const Header = () => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        fetchStatus()
            .then(() => setConnected(true))
            .catch(() => setConnected(false));
    }, []);

    return (
        <header className="top-header">
            <div className="market-overview">
                <div className="index-card">
                    <span className="index-name">NEPSE</span>
                    <span className="index-value down">2,014.50</span>
                    <span className="index-change down">-12.40 (-0.61%)</span>
                </div>
            </div>
            <div className="header-actions">
                <div className="server-status" style={{ 
                    background: connected ? 'rgba(14, 203, 129, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                    color: connected ? 'var(--color-buy)' : 'var(--color-sell)'
                }}>
                    <span className="status-indicator" style={{ 
                        backgroundColor: connected ? 'var(--color-buy)' : 'var(--color-sell)',
                        boxShadow: connected ? '0 0 8px var(--color-buy)' : 'none'
                    }}></span>
                    <span className="status-text">{connected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="user-profile">
                    <div className="avatar">AP</div>
                </div>
            </div>
        </header>
    );
};

export default Header;
