document.addEventListener('DOMContentLoaded', () => {
    checkBackendStatus();

    // Setup refresh button
    const refreshBtn = document.querySelector('.btn-primary');
    refreshBtn.addEventListener('click', () => {
        refreshBtn.innerText = "Refreshing...";
        checkBackendStatus();
        setTimeout(() => {
            refreshBtn.innerText = "Refresh Data";
        }, 1000);
    });
});

async function checkBackendStatus() {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    const apiStatus = document.getElementById('api-status');
    const totalStocks = document.getElementById('total-stocks');

    try {
        // Assume FastAPI runs on localhost:8000
        const response = await fetch('http://localhost:8000/api/status');
        
        if (response.ok) {
            const data = await response.json();
            
            // Update UI
            statusIndicator.className = 'status-indicator online';
            statusText.innerText = 'Connected';
            apiStatus.innerText = 'Online';
            
            if (data.data_available) {
                totalStocks.innerText = 'Ready';
            } else {
                totalStocks.innerText = 'No Data';
            }
        } else {
            throw new Error('Server returned an error');
        }
    } catch (error) {
        // Backend not running
        statusIndicator.className = 'status-indicator offline';
        statusText.innerText = 'Offline';
        apiStatus.innerText = 'Offline';
        apiStatus.style.color = '#ff3366';
        console.error("Backend connection failed:", error);
    }
}
