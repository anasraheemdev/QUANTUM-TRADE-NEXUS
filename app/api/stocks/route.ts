import { NextResponse } from 'next/server';
import finnhub from 'finnhub';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

// List of stock symbols to fetch
const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'];

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

// Stock metadata (name, sector)
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

export async function GET() {
  try {
    if (!FINNHUB_API_KEY) {
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

    // Initialize Finnhub client
    const finnhubClient = new finnhub.DefaultApi(FINNHUB_API_KEY);

    // Fetch quotes for all stocks in parallel (Finnhub allows multiple requests)
    const quotePromises = STOCK_SYMBOLS.map(async (symbol) => {
      try {
        const quote = await quotePromise(finnhubClient, symbol);

        // Finnhub returns: { c: current, h: high, l: low, o: open, pc: previous_close, t: timestamp }
        if (!quote || !quote.c) {
          throw new Error('Invalid quote data');
        }

        const metadata = STOCK_METADATA[symbol];
        const price = parseFloat(quote.c.toString());
        const previousClose = parseFloat(quote.pc.toString());
        const change = price - previousClose;
        const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
        const high = parseFloat(quote.h?.toString() || '0');
        const low = parseFloat(quote.l?.toString() || '0');
        const open = parseFloat(quote.o?.toString() || '0');

        return {
          symbol,
          name: metadata?.name || symbol,
          price: price || 0,
          change: change || 0,
          changePercent: changePercent || 0,
          volume: 0, // Finnhub quote doesn't include volume
          marketCap: 0, // Need separate API call for market cap
          sector: metadata?.sector || 'Unknown',
          high: high || 0,
          low: low || 0,
          open: open || 0,
        };
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
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
          high: 0,
          low: 0,
          open: 0,
        };
      }
    });

    const stocks = await Promise.all(quotePromises);

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
