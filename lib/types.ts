export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
}

export interface PortfolioPosition {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  gain: number;
  gainPercent: number;
}

export interface Portfolio {
  accountBalance?: number;
  totalInvested?: number;
  totalValue: number;
  totalCost?: number;
  totalGain: number;
  totalGainPercent: number;
  positions: PortfolioPosition[];
  watchlist: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  accountBalance: number;
  totalInvested: number;
  memberSince: string;
  tradingLevel: string;
  preferences: {
    theme: string;
    notifications: boolean;
    twoFactorAuth: boolean;
  };
  stats: {
    totalTrades: number;
    winRate: number;
    avgReturn: number;
    bestTrade: {
      symbol: string;
      gain: number;
      date: string;
    };
  };
}

export interface StockHistory {
  symbol: string;
  name: string;
  lineData: Array<{
    date: string;
    price: number;
  }>;
  candleData: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}


