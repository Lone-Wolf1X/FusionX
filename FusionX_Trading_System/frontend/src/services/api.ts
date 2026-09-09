const API_BASE = 'http://localhost:8000/api';

export const fetchStatus = async () => {
    try {
        const res = await fetch(`${API_BASE}/status`);
        return await res.json();
    } catch (e) {
        throw new Error('Disconnected');
    }
};

export const fetchWatchlist = async () => {
    try {
        const res = await fetch(`${API_BASE}/stocks`);
        return await res.json();
    } catch (e) {
        throw new Error('Failed to fetch stocks');
    }
};

export const fetchPortfolio = async () => {
    try {
        const res = await fetch(`${API_BASE}/portfolio`);
        return await res.json();
    } catch (e) {
        throw new Error('Failed to fetch portfolio');
    }
};

export const fetchOrders = async () => {
    try {
        const res = await fetch(`${API_BASE}/orders`);
        return await res.json();
    } catch (e) {
        throw new Error('Failed to fetch orders');
    }
};

export const placeOrder = async (symbol: string, order_type: string, quantity: number, price: number) => {
    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol, order_type, quantity, price })
        });
        if (!res.ok) throw new Error('Order failed');
        return await res.json();
    } catch (e) {
        throw new Error('Failed to place order');
    }
};
