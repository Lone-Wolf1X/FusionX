import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, LayoutGrid, List, Briefcase, ReceiptText } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    return (
        <nav className="sidebar">
            <div className="logo-container">
                <div className="logo-icon"><TrendingUp size={20} color="white" /></div>
                <h2>FusionX</h2>
            </div>
            <ul className="nav-links">
                <li className={location.pathname === '/dashboard' ? 'active' : ''}>
                    <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'inherit', textDecoration: 'none' }}>
                        <LayoutGrid size={18} /> Dashboard
                    </Link>
                </li>
                <li className={location.pathname === '/watchlist' ? 'active' : ''}>
                    <Link to="/watchlist" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'inherit', textDecoration: 'none' }}>
                        <List size={18} /> Watchlist
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

export default Sidebar;
