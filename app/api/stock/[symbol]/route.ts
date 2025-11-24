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

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;

    if (!TWELVEDATA_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Check cache first
    const cacheKey = `stock-${symbol.toUpperCase()}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch real-time quote
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVEDATA_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.status}`);
    }

    const quote = await response.json();

    // Check if API returned an error
    if (quote.status === 'error' || quote.code) {
      throw new Error(quote.message || 'API error');
    }
    const metadata = STOCK_METADATA[symbol.toUpperCase()];

    const price = parseFloat(quote.close || quote.price || '0');
    const previousClose = parseFloat(quote.previous_close || price.toString());
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
    const volume = parseInt(quote.volume || '0', 10);
    const marketCap = parseFloat(quote.market_cap || '0');

    const stock = {
      symbol: symbol.toUpperCase(),
      name: metadata?.name || quote.name || symbol,
      price: price || 0,
      change: change || 0,
      changePercent: changePercent || 0,
      volume: volume || 0,
      marketCap: marketCap || 0,
      sector: metadata?.sector || 'Unknown',
    };

    // Cache the result
    cache.set(cacheKey, { data: stock, timestamp: Date.now() });

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

