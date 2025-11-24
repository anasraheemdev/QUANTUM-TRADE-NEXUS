import { NextResponse } from 'next/server';

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY || process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds cache for history (less frequent updates)

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
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || '1day';
    const outputsize = searchParams.get('outputsize') || '30';

    if (!TWELVEDATA_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Check cache first
    const cacheKey = `history-${symbol.toUpperCase()}-${interval}-${outputsize}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch time series data
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVEDATA_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.status}`);
    }

    const data = await response.json();

    // Check if API returned an error
    if (data.status === 'error' || data.code) {
      throw new Error(data.message || 'API error');
    }

    const metadata = STOCK_METADATA[symbol.toUpperCase()];
    const values = data.values || [];

    // If no values, return empty data structure
    if (!values || values.length === 0) {
      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        name: metadata?.name || symbol,
        lineData: [],
        candleData: [],
      });
    }

    // Transform to line data (for line chart)
    const lineData = values
      .map((item: any) => ({
        date: item.datetime,
        price: parseFloat(item.close || '0'),
      }))
      .reverse(); // Reverse to show chronological order

    // Transform to candlestick data
    const candleData = values
      .map((item: any) => ({
        date: item.datetime,
        open: parseFloat(item.open || '0'),
        high: parseFloat(item.high || '0'),
        low: parseFloat(item.low || '0'),
        close: parseFloat(item.close || '0'),
        volume: parseInt(item.volume || '0', 10),
      }))
      .reverse();

    const history = {
      symbol: symbol.toUpperCase(),
      name: metadata?.name || symbol,
      lineData,
      candleData,
    };

    // Cache the result
    cache.set(cacheKey, { data: history, timestamp: Date.now() });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

