export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: string;
  type: TransactionType;
  symbol: string;
  qty: number;
  price: number;
  date: string;
  includeBrokerFee: boolean;
  notes?: string;
}

export type AISignalAction = 'BUY_MORE' | 'HOLD' | 'TAKE_PROFIT' | 'STOP_LOSS';

export interface AISignal {
  action: AISignalAction;
  targetPrice: number;
  stopLossPrice: number;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface Holding {
  symbol: string;
  name: string;
  sector: string;
  totalQty: number;
  avgBuyPrice: number;
  totalInvested: number;
  currentLtp: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  realizedPnl: number;
  allocationPct: number;
  aiSignal: AISignal;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  initialCash: number;
  currentCash: number;
  createdAt: string;
  transactions: Transaction[];
}
