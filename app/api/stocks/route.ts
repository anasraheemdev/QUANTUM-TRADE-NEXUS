import { NextResponse } from 'next/server';

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY || process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;

// List of stock symbols to fetch (reduced to 8 to respect rate limits)
const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'];

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

// Stock metadata (name, sector) - since TwelveData might not provide all details
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

export async function GET() {
  try {
    if (!TWELVEDATA_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Check cache first
    const cacheKey = 'all-stocks';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Use batch request to fetch all stocks in one API call (up to 120 symbols)
    // This reduces API calls from 8 to 1, staying well under rate limits
    const symbols = STOCK_SYMBOLS.join(',');
    const url = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${TWELVEDATA_API_KEY}`;

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
    // Single: { symbol: "AAPL", name: "...", close: "...", ... }
    // Batch: { "AAPL": { symbol: "AAPL", ... }, "MSFT": { ... }, ... }
    let quotes: Record<string, any> = {};
    
    if (data.symbol) {
      // Single symbol response - convert to batch format
      quotes[data.symbol] = data;
    } else {
      // Batch response
      quotes = data;
    }

    const stocks = STOCK_SYMBOLS.map((symbol) => {
      const quote = quotes[symbol];
      
      if (!quote || quote.status === 'error') {
        // Return fallback data if API fails for this symbol
        const metadata = STOCK_METADATA[symbol];
        return {
          symbol,
          name: metadata?.name || symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          marketCap: 0,
          sector: metadata?.sector || 'Unknown',
        };
      }

      const metadata = STOCK_METADATA[symbol];
      const price = parseFloat(quote.close || quote.price || '0');
      const previousClose = parseFloat(quote.previous_close || price.toString());
      const change = price - previousClose;
      const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
      const volume = parseInt(quote.volume || '0', 10);
      const marketCap = parseFloat(quote.market_cap || '0');

      return {
        symbol,
        name: metadata?.name || quote.name || symbol,
        price: price || 0,
        change: change || 0,
        changePercent: changePercent || 0,
        volume: volume || 0,
        marketCap: marketCap || 0,
        sector: metadata?.sector || 'Unknown',
      };
    });

    // Cache the results
    cache.set(cacheKey, { data: stocks, timestamp: Date.now() });

    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
