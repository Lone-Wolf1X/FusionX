import type { Portfolio, Holding, AISignal } from '../types/portfolio';

const STORAGE_KEY = 'fusionx_portfolios_v1';
const ACTIVE_ID_KEY = 'fusionx_active_portfolio_id';

const DEFAULT_PORTFOLIOS: Portfolio[] = [
  {
    id: 'port-growth-1',
    name: 'Long-Term Core Growth',
    description: 'Core NEPSE stocks for multi-year capital compounding',
    initialCash: 500000,
    currentCash: 185000,
    createdAt: new Date().toISOString(),
    transactions: [
      {
        id: 'tx-1',
        type: 'BUY',
        symbol: 'NABIL',
        qty: 300,
        price: 580,
        date: '2026-01-15',
        includeBrokerFee: true,
        notes: 'Initial accumulation near support',
      },
      {
        id: 'tx-2',
        type: 'BUY',
        symbol: 'NTC',
        qty: 150,
        price: 880,
        date: '2026-02-01',
        includeBrokerFee: true,
        notes: 'Dividend yield + defensive pick',
      },
      {
        id: 'tx-3',
        type: 'BUY',
        symbol: 'GBIME',
        qty: 400,
        price: 235,
        date: '2026-02-10',
        includeBrokerFee: true,
        notes: 'Value play',
      },
    ],
  },
  {
    id: 'port-swing-2',
    name: 'Momentum Swing Simulator',
    description: 'Short-term technical momentum and breakout trades',
    initialCash: 300000,
    currentCash: 120000,
    createdAt: new Date().toISOString(),
    transactions: [
      {
        id: 'tx-4',
        type: 'BUY',
        symbol: 'SHIVM',
        qty: 200,
        price: 540,
        date: '2026-02-20',
        includeBrokerFee: true,
        notes: 'Volume breakout entry',
      },
      {
        id: 'tx-5',
        type: 'BUY',
        symbol: 'CHCL',
        qty: 150,
        price: 470,
        date: '2026-03-01',
        includeBrokerFee: true,
        notes: 'Hydro sector momentum',
      },
    ],
  },
];

export function getStoredPortfolios(): Portfolio[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PORTFOLIOS));
      return DEFAULT_PORTFOLIOS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PORTFOLIOS;
  } catch (e) {
    return DEFAULT_PORTFOLIOS;
  }
}

export function savePortfolios(portfolios: Portfolio[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
  } catch (e) {
    console.error('Failed to save portfolios', e);
  }
}

export function getActivePortfolioId(): string {
  const stored = localStorage.getItem(ACTIVE_ID_KEY);
  if (stored) return stored;
  const list = getStoredPortfolios();
  return list[0]?.id || 'port-growth-1';
}

export function setActivePortfolioId(id: string): void {
  localStorage.setItem(ACTIVE_ID_KEY, id);
}

export function calculateHoldings(portfolio: Portfolio, stockScanList: any[] = []): Holding[] {
  const scanMap = new Map<string, any>();
  stockScanList.forEach((s) => {
    if (s.symbol) scanMap.set(s.symbol, s);
  });

  const holdingMap = new Map<
    string,
    {
      symbol: string;
      totalQty: number;
      totalCost: number;
      realizedPnl: number;
    }
  >();

  // Process transactions chronologically
  const sortedTxs = [...portfolio.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const tx of sortedTxs) {
    const existing = holdingMap.get(tx.symbol) || {
      symbol: tx.symbol,
      totalQty: 0,
      totalCost: 0,
      realizedPnl: 0,
    };

    const feeRate = tx.includeBrokerFee ? 0.0036 : 0;
    const effectivePrice = tx.price * (1 + (tx.type === 'BUY' ? feeRate : -feeRate));

    if (tx.type === 'BUY') {
      existing.totalQty += tx.qty;
      existing.totalCost += tx.qty * effectivePrice;
    } else if (tx.type === 'SELL') {
      const avgPriceBeforeSell = existing.totalQty > 0 ? existing.totalCost / existing.totalQty : tx.price;
      const sellProceeds = tx.qty * effectivePrice;
      const costOfSold = tx.qty * avgPriceBeforeSell;
      const profitOnSale = sellProceeds - costOfSold;

      existing.realizedPnl += profitOnSale;
      existing.totalQty = Math.max(0, existing.totalQty - tx.qty);

      if (existing.totalQty > 0) {
        existing.totalCost = existing.totalQty * avgPriceBeforeSell;
      } else {
        existing.totalCost = 0;
      }
    }

    holdingMap.set(tx.symbol, existing);
  }

  // Filter holdings with totalQty > 0
  const activeHoldings: Holding[] = [];
  let totalPortfolioMarketVal = 0;

  holdingMap.forEach((data, sym) => {
    if (data.totalQty <= 0) return;

    const scanData = scanMap.get(sym);
    const name = scanData?.name || sym;
    const sector = scanData?.sector || 'NEPSE Equity';
    const ltp = scanData?.ltp || (data.totalCost / data.totalQty);

    const avgBuyPrice = data.totalCost / data.totalQty;
    const currentValue = data.totalQty * ltp;
    const unrealizedPnl = currentValue - data.totalCost;
    const unrealizedPnlPct = avgBuyPrice > 0 ? (unrealizedPnl / data.totalCost) * 100 : 0;

    totalPortfolioMarketVal += currentValue;

    const aiSignal = computeAISignal(sym, avgBuyPrice, ltp, scanData);

    activeHoldings.push({
      symbol: sym,
      name,
      sector,
      totalQty: data.totalQty,
      avgBuyPrice: round2(avgBuyPrice),
      totalInvested: round2(data.totalCost),
      currentLtp: round2(ltp),
      currentValue: round2(currentValue),
      unrealizedPnl: round2(unrealizedPnl),
      unrealizedPnlPct: round2(unrealizedPnlPct),
      realizedPnl: round2(data.realizedPnl),
      allocationPct: 0, // to be updated below
      aiSignal,
    });
  });

  // Update allocation percentage
  return activeHoldings.map((h) => ({
    ...h,
    allocationPct: totalPortfolioMarketVal > 0 ? round2((h.currentValue / totalPortfolioMarketVal) * 100) : 0,
  }));
}

function computeAISignal(_symbol: string, avgBuyPrice: number, currentLtp: number, scanData?: any): AISignal {
  const pnlPct = avgBuyPrice > 0 ? ((currentLtp - avgBuyPrice) / avgBuyPrice) * 100 : 0;
  const targetPrice = round2(avgBuyPrice * 1.15);
  const stopLossPrice = round2(avgBuyPrice * 0.90);
  const changePct = scanData?.change_pct ?? 0;

  if (pnlPct <= -9.5 || (scanData && currentLtp <= scanData.support)) {
    return {
      action: 'STOP_LOSS',
      targetPrice,
      stopLossPrice,
      reason: `Stock is down ${pnlPct.toFixed(1)}%. Cut losses or re-evaluate thesis near Rs ${stopLossPrice}`,
      urgency: 'high',
    };
  }

  if (pnlPct >= 14.0 || currentLtp >= targetPrice) {
    return {
      action: 'TAKE_PROFIT',
      targetPrice,
      stopLossPrice,
      reason: `Stock is up +${pnlPct.toFixed(1)}% near target (Rs ${targetPrice}). Consider partial profit booking.`,
      urgency: 'medium',
    };
  }

  if (pnlPct >= 1.5 && pnlPct <= 12.0 && changePct >= 0) {
    return {
      action: 'BUY_MORE',
      targetPrice,
      stopLossPrice,
      reason: `Healthy trend (+${pnlPct.toFixed(1)}%). Good opportunity to accumulate more shares.`,
      urgency: 'low',
    };
  }

  return {
    action: 'HOLD',
    targetPrice,
    stopLossPrice,
    reason: `Position is performing as expected. Hold position targeting Rs ${targetPrice}.`,
    urgency: 'low',
  };
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}
