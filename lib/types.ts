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
  role?: 'admin' | 'client';
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

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  account_balance: number;
  total_invested: number;
  member_since: string;
  trading_level: string;
  unique_user_id?: string;
  role: 'admin' | 'client';
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

export interface PublicUserProfile {
  id: string;
  email: string;
  name: string;
  trading_level: string;
  member_since: string;
  avatar_url: string | null;
  total_invested: number;
  unique_user_id?: string;
}

export interface Notification {
  id: string;
  type: 'credit_transfer';
  message: string;
  from_user_name?: string;
  to_user_name?: string;
  from_unique_id?: string;
  to_unique_id?: string;
  amount: number;
  created_at: string;
  is_read: boolean;
}

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  account_balance: number;
  total_invested: number;
  trading_level: string;
  member_since: string;
  unique_user_id?: string;
}
