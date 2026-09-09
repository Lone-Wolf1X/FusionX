const API_BASE = 'http://localhost:8000/api';
let currentSymbol = null;
let allStocks = [];

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    fetchStatus();
    fetchWatchlist();
    fetchPortfolio();
    fetchOrders();

    // Setup input listeners for order form total calculation
    document.getElementById('order-qty').addEventListener('input', calculateTotal);
    document.getElementById('order-price').addEventListener('input', calculateTotal);
    
    document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);
    document.getElementById('symbol-search').addEventListener('input', filterWatchlist);
});

// --- Tab Navigation ---
function initTabs() {
    const tabs = document.querySelectorAll('.nav-links li');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            document.getElementById(target).classList.add('active');
        });
    });
}

// --- API Calls ---
async function fetchStatus() {
    try {
        const res = await fetch(`${API_BASE}/status`);
        const data = await res.json();
        document.getElementById('backend-status-content').innerHTML = `
            <p>Status: <span style="color:var(--color-buy)">${data.status}</span></p>
            <p>Stocks Loaded: ${data.stocks_count}</p>
            <p>Historical Records: ${data.historical_records_count}</p>
        `;
    } catch (e) {
        document.getElementById('server-status').innerHTML = `<span class="status-indicator" style="background:var(--color-sell);box-shadow:none"></span><span class="status-text" style="color:var(--color-sell)">Disconnected</span>`;
    }
}

async function fetchWatchlist() {
    try {
        const res = await fetch(`${API_BASE}/stocks`);
        allStocks = await res.json();
        renderWatchlist(allStocks);
        
        if (allStocks.length > 0) {
            selectStock(allStocks[0].symbol);
        }
    } catch (e) {
        console.error("Error fetching stocks", e);
    }
}

// --- Watchlist & Market Depth ---
function renderWatchlist(stocks) {
    const tbody = document.querySelector('#watchlist-table tbody');
    tbody.innerHTML = '';
    
    // Render first 50 to avoid DOM overload
    stocks.slice(0, 50).forEach(stock => {
        const mockLtp = (Math.random() * 1000 + 100).toFixed(2);
        const mockChange = (Math.random() * 10 - 5).toFixed(2);
        const changeClass = mockChange >= 0 ? 'up' : 'down';
        
        const tr = document.createElement('tr');
        tr.className = 'clickable-row';
        tr.onclick = () => selectStock(stock.symbol);
        tr.innerHTML = `
            <td><strong>${stock.symbol}</strong><br><small class="text-muted">${stock.sector}</small></td>
            <td>${mockLtp}</td>
            <td class="${changeClass}">${mockChange > 0 ? '+' : ''}${mockChange}%</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterWatchlist(e) {
    const term = e.target.value.toLowerCase();
    const filtered = allStocks.filter(s => s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term));
    renderWatchlist(filtered);
}

function selectStock(symbol) {
    currentSymbol = symbol;
    document.getElementById('selected-symbol').innerText = symbol;
    
    // Animate depth tables to simulate live data
    renderMarketDepth();
}

function renderMarketDepth() {
    const bidBody = document.getElementById('bid-body');
    const askBody = document.getElementById('ask-body');
    
    bidBody.innerHTML = '';
    askBody.innerHTML = '';
    
    let basePrice = Math.floor(Math.random() * 500) + 200;
    
    for(let i=0; i<5; i++) {
        let bidPrice = (basePrice - (i * 1.5)).toFixed(1);
        let askPrice = (basePrice + 1 + (i * 1.5)).toFixed(1);
        
        let bidQty = Math.floor(Math.random() * 1000) + 10;
        let askQty = Math.floor(Math.random() * 1000) + 10;
        
        let bidOrders = Math.floor(Math.random() * 10) + 1;
        let askOrders = Math.floor(Math.random() * 10) + 1;
        
        bidBody.innerHTML += `<tr class="flash-green"><td>${bidOrders}</td><td>${bidQty}</td><td>${bidPrice}</td></tr>`;
        askBody.innerHTML += `<tr class="flash-red"><td>${askPrice}</td><td>${askQty}</td><td>${askOrders}</td></tr>`;
    }
}

// --- Order Modal ---
function openOrderModal(type) {
    if (!currentSymbol) return alert("Select a stock first!");
    
    const modal = document.getElementById('order-modal');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-order-btn');
    
    document.getElementById('order-type').value = type;
    document.getElementById('order-symbol').value = currentSymbol;
    document.getElementById('order-qty').value = '';
    document.getElementById('order-price').value = '';
    calculateTotal();
    
    if (type === 'buy') {
        title.innerText = `Buy ${currentSymbol}`;
        submitBtn.className = 'btn btn-full btn-buy';
        submitBtn.innerText = 'Submit Buy Order';
    } else {
        title.innerText = `Sell ${currentSymbol}`;
        submitBtn.className = 'btn btn-full btn-sell';
        submitBtn.innerText = 'Submit Sell Order';
    }
    
    modal.classList.add('show');
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.remove('show');
}

function calculateTotal() {
    const qty = parseFloat(document.getElementById('order-qty').value) || 0;
    const price = parseFloat(document.getElementById('order-price').value) || 0;
    document.getElementById('order-total').innerText = `Rs ${(qty * price).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('order-type').value;
    const qty = parseInt(document.getElementById('order-qty').value);
    const price = parseFloat(document.getElementById('order-price').value);
    
    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol: currentSymbol,
                order_type: type,
                quantity: qty,
                price: price
            })
        });
        
        if(res.ok) {
            alert('Order Placed Successfully!');
            closeOrderModal();
            fetchOrders();
        }
    } catch (e) {
        console.error(e);
        alert('Failed to place order');
    }
}

// --- Portfolio & Orders ---
async function fetchPortfolio() {
    try {
        const res = await fetch(`${API_BASE}/portfolio`);
        const data = await res.json();
        
        const tbody = document.querySelector('#portfolio-table tbody');
        tbody.innerHTML = '';
        
        data.forEach(item => {
            const totalValue = item.quantity * item.ltp;
            const plClass = item.unrealized_pl >= 0 ? 'up' : 'down';
            tbody.innerHTML += `
                <tr>
                    <td><strong>${item.symbol}</strong></td>
                    <td>${item.quantity}</td>
                    <td>Rs ${item.average_price}</td>
                    <td>Rs ${item.ltp}</td>
                    <td>Rs ${totalValue.toLocaleString()}</td>
                    <td class="${plClass}">Rs ${item.unrealized_pl.toLocaleString()}</td>
                </tr>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

async function fetchOrders() {
    try {
        const res = await fetch(`${API_BASE}/orders`);
        const data = await res.json();
        
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = '';
        
        data.reverse().forEach(order => {
            const typeClass = order.type === 'buy' ? 'up' : 'down';
            tbody.innerHTML += `
                <tr>
                    <td>#${order.id}</td>
                    <td><strong>${order.symbol}</strong></td>
                    <td class="${typeClass}" style="text-transform: uppercase;">${order.type}</td>
                    <td>${order.quantity}</td>
                    <td>Rs ${order.price}</td>
                    <td><span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px;">${order.status}</span></td>
                </tr>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

// Simulated Live Updates
setInterval(() => {
    if (document.getElementById('watchlist').classList.contains('active') && currentSymbol) {
        renderMarketDepth();
    }
}, 3000);
