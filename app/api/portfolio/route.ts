import { NextResponse } from 'next/server';

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY || process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

// Stock metadata
const STOCK_METADATA: Record<string, { name: string; sector: string }> = {
  AAPL: { name: 'Apple Inc.', sector: 'Technology' },
  MSFT: { name: 'Microsoft Corporation', sector: 'Technology' },
  GOOGL: { name: 'Alphabet Inc.', sector: 'Technology' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
  TSLA: { name: 'Tesla, Inc.', sector: 'Consumer Cyclical' },
  META: { name: 'Meta Platforms Inc.', sector: 'Technology' },
  NVDA: { name: 'NVIDIA Corporation', sector: 'Technology' },
  JPM: { name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
  V: { name: 'Visa Inc.', sector: 'Financial Services' },
  JNJ: { name: 'Johnson & Johnson', sector: 'Healthcare' },
};

// Portfolio positions (shares and average prices) - in a real app, this would come from a database
const PORTFOLIO_POSITIONS = [
  { symbol: 'AAPL', shares: 50, avgPrice: 170.00 },
  { symbol: 'MSFT', shares: 30, avgPrice: 375.00 },
  { symbol: 'GOOGL', shares: 40, avgPrice: 140.00 },
  { symbol: 'TSLA', shares: 25, avgPrice: 250.00 },
  { symbol: 'NVDA', shares: 15, avgPrice: 850.00 },
  { symbol: 'META', shares: 20, avgPrice: 480.00 },
];

const WATCHLIST = ['AMZN', 'JPM', 'V', 'JNJ'];


export async function GET() {
  try {
    if (!TWELVEDATA_API_KEY) {
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

    // Use batch request to fetch all portfolio positions in one API call
    const portfolioSymbols = PORTFOLIO_POSITIONS.map(p => p.symbol).join(',');
    const url = `https://api.twelvedata.com/quote?symbol=${portfolioSymbols}&apikey=${TWELVEDATA_API_KEY}`;

    let positions = [];

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`TwelveData API error: ${response.status}`);
      }

      const data = await response.json();

      // Check if API returned an error
      if (data.status === 'error' || data.code) {
        throw new Error(data.message || 'API error');
      }

      // Handle both single symbol response and batch response
      let quotes: Record<string, any> = {};
      
      if (data.symbol) {
        // Single symbol response - convert to batch format
        quotes[data.symbol] = data;
      } else {
        // Batch response
        quotes = data;
      }

      positions = PORTFOLIO_POSITIONS.map((position) => {
        const quote = quotes[position.symbol];
        
        if (!quote || quote.status === 'error') {
          // Return position with fallback data
          const metadata = STOCK_METADATA[position.symbol];
          const totalCost = position.shares * position.avgPrice;
          return {
            symbol: position.symbol,
            name: metadata?.name || position.symbol,
            shares: position.shares,
            avgPrice: position.avgPrice,
            currentPrice: position.avgPrice, // Fallback to avg price
            totalCost: totalCost,
            currentValue: totalCost,
            gain: 0,
            gainPercent: 0,
          };
        }

        const metadata = STOCK_METADATA[position.symbol];
        const currentPrice = parseFloat(quote.close || quote.price || '0');
        const totalCost = position.shares * position.avgPrice;
        const currentValue = position.shares * currentPrice;
        const gain = currentValue - totalCost;
        const gainPercent = totalCost !== 0 ? (gain / totalCost) * 100 : 0;

        return {
          symbol: position.symbol,
          name: metadata?.name || quote.name || position.symbol,
          shares: position.shares,
          avgPrice: position.avgPrice,
          currentPrice: currentPrice || 0,
          totalCost: totalCost,
          currentValue: currentValue || 0,
          gain: gain || 0,
          gainPercent: gainPercent || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching portfolio quotes:', error);
      // Return positions with fallback data
      positions = PORTFOLIO_POSITIONS.map((position) => {
        const metadata = STOCK_METADATA[position.symbol];
        const totalCost = position.shares * position.avgPrice;
        return {
          symbol: position.symbol,
          name: metadata?.name || position.symbol,
          shares: position.shares,
          avgPrice: position.avgPrice,
          currentPrice: position.avgPrice,
          totalCost: totalCost,
          currentValue: totalCost,
          gain: 0,
          gainPercent: 0,
        };
      });
    }

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

