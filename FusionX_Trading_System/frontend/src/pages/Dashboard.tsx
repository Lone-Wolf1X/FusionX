import { useState, useEffect } from 'react';
import { fetchStatus } from '../services/api';

const Dashboard = () => {
    const [statusData, setStatusData] = useState<any>(null);

    useEffect(() => {
        fetchStatus().then(setStatusData).catch(console.error);
    }, []);

    return (
        <div>
            <div className="dashboard-grid">
                <div className="glass-card full-width" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header" style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Market Summary</h3>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '5px' }}>Total Turnover</span>
                            <span style={{ fontSize: '24px', fontWeight: 700 }}>Rs 2.45 Arba</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '5px' }}>Total Traded Shares</span>
                            <span style={{ fontSize: '24px', fontWeight: 700 }}>6,245,120</span>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header" style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Backend Status</h3>
                    </div>
                    <div>
                        {statusData ? (
                            <>
                                <p>Status: <span style={{ color: 'var(--color-buy)' }}>{statusData.status}</span></p>
                                <p>Stocks Loaded: {statusData.stocks_count}</p>
                                <p>Historical Records: {statusData.historical_records_count}</p>
                            </>
                        ) : (
                            <p>Loading...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
