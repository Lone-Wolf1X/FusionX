import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8001/api' });

export const scanStocks = () => API.get('/scan').then(r => r.data);
export const getStock = (symbol: string, period = 365) => API.get(`/stock/${symbol}?period=${period}`).then(r => r.data);
export const getSuggestions = () => API.get('/suggestions').then(r => r.data);

export async function getHeatmap() {
  const res = await API.get('/heatmap');
  return res.data;
}

export async function getWatchlist() {
  const res = await API.get('/watchlist');
  return res.data;
}

export async function addToWatchlist(symbol: string) {
  const res = await API.post(`/watchlist/${symbol}`);
  return res.data;
}

export async function removeFromWatchlist(symbol: string) {
  const res = await API.delete(`/watchlist/${symbol}`);
  return res.data;
}

export async function getTradePlan(budget: number, useWhitelist: boolean) {
  const res = await API.post('/plan-trades', { budget, use_whitelist: useWhitelist });
  return res.data;
}

export async function getDashboardData() {
  const res = await API.get('/dashboard');
  return res.data;
}

export async function getSectors() {
  const res = await API.get('/sectors');
  return res.data;
}

export async function getProfile() {
  const res = await API.get('/profile');
  return res.data;
}

export async function saveProfile(sectors: string[]) {
  const res = await API.post('/profile', { sectors });
  return res.data;
}

export async function runManualScan(sectors: string[]) {
  const res = await API.post('/scan-manual', { sectors });
  return res.data;
}
