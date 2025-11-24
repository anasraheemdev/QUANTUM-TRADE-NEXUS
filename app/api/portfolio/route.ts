import { NextResponse } from 'next/server';
import finnhub from 'finnhub';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

// Portfolio positions (shares and average prices)
const PORTFOLIO_POSITIONS = [
  { symbol: 'AAPL', shares: 50, avgPrice: 170.00 },
  { symbol: 'MSFT', shares: 30, avgPrice: 375.00 },
  { symbol: 'GOOGL', shares: 40, avgPrice: 140.00 },
  { symbol: 'TSLA', shares: 25, avgPrice: 250.00 },
  { symbol: 'NVDA', shares: 15, avgPrice: 850.00 },
  { symbol: 'META', shares: 20, avgPrice: 480.00 },
];

const WATCHLIST = ['AMZN', 'JPM', 'V', 'JNJ'];

// Helper function to wrap callback-based API calls in promises
function quotePromise(client: any, symbol: string): Promise<any> {
  return new Promise((resolve, reject) => {
    client.quote(symbol, (error: any, data: any, response: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

// Helper function to fetch company profile
function companyProfilePromise(client: any, symbol: string): Promise<any> {
  return new Promise((resolve, reject) => {
    client.companyProfile({ symbol }, (error: any, data: any, response: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

export async function GET() {
  try {
    if (!FINNHUB_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Check cache first
    const cacheKey = 'portfolio';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Initialize Finnhub client
    const finnhubClient = new finnhub.DefaultApi(FINNHUB_API_KEY);

    // Fetch current prices and profiles for all positions in parallel
    const positionPromises = PORTFOLIO_POSITIONS.map(async (position) => {
      try {
        // Fetch both quote and profile in parallel
        const [quote, profile] = await Promise.all([
          quotePromise(finnhubClient, position.symbol).catch(() => null),
          companyProfilePromise(finnhubClient, position.symbol).catch(() => null),
        ]);

        // Check if API returned an error
        if (!quote || !quote.c) {
          throw new Error('Invalid quote data');
        }

        // Extract name from profile API response
        const name = profile?.name || position.symbol;
        const currentPrice = parseFloat(quote.c.toString());
        const totalCost = position.shares * position.avgPrice;
        const currentValue = position.shares * currentPrice;
        const gain = currentValue - totalCost;
        const gainPercent = totalCost !== 0 ? (gain / totalCost) * 100 : 0;

        return {
          symbol: position.symbol,
          name,
          shares: position.shares,
          avgPrice: position.avgPrice,
          currentPrice: currentPrice > 0 ? currentPrice : position.avgPrice,
          totalCost: totalCost,
          currentValue: currentPrice > 0 ? currentValue : totalCost,
          gain: currentPrice > 0 ? gain : 0,
          gainPercent: currentPrice > 0 ? gainPercent : 0,
        };
      } catch (error) {
        console.error(`Error fetching ${position.symbol}:`, error);
        // Return position with fallback data
        const totalCost = position.shares * position.avgPrice;
        return {
          symbol: position.symbol,
          name: position.symbol,
          shares: position.shares,
          avgPrice: position.avgPrice,
          currentPrice: position.avgPrice,
          totalCost: totalCost,
          currentValue: totalCost,
          gain: 0,
          gainPercent: 0,
        };
      }
    });

    const positions = await Promise.all(positionPromises);

    // Calculate totals
    const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost !== 0 ? (totalGain / totalCost) * 100 : 0;

    const portfolio = {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      positions,
      watchlist: WATCHLIST,
    };

    // Cache the result
    cache.set(cacheKey, { data: portfolio, timestamp: Date.now() });

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
