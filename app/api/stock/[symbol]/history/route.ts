import { NextResponse } from 'next/server';
import finnhub from 'finnhub';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds cache for history

// Helper function to wrap callback-based API calls in promises
function stockCandlesPromise(client: any, symbol: string, resolution: string, from: number, to: number): Promise<any> {
  return new Promise((resolve, reject) => {
    client.stockCandles(symbol, resolution, from, to, (error: any, data: any, response: any) => {
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

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || '1day';
    const outputsize = parseInt(searchParams.get('outputsize') || '30', 10);

    if (!FINNHUB_API_KEY) {
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

    // Map interval to Finnhub resolution
    // Finnhub supports: 1, 5, 15, 30, 60, D, W, M
    const resolutionMap: Record<string, string> = {
      '1min': '1',
      '5min': '5',
      '15min': '15',
      '30min': '30',
      '1h': '60',
      '1day': 'D',
      '1week': 'W',
      '1month': 'M',
    };
    const resolution = resolutionMap[interval] || 'D';

    // Calculate time range (Finnhub requires Unix timestamps)
    const to = Math.floor(Date.now() / 1000);
    const from = to - (outputsize * 24 * 60 * 60); // Approximate days back

    // Initialize Finnhub client
    const finnhubClient = new finnhub.DefaultApi(FINNHUB_API_KEY);

    const symbolUpper = symbol.toUpperCase();

    // Fetch both candle data and profile in parallel
    const [data, profile] = await Promise.all([
      stockCandlesPromise(finnhubClient, symbolUpper, resolution, from, to).catch(() => null),
      companyProfilePromise(finnhubClient, symbolUpper).catch(() => null),
    ]);

    // Check if API returned an error
    if (!data || data.s === 'no_data' || data.s === 'error' || !data.c || data.c.length === 0) {
      throw new Error('No data available');
    }

    // Extract name from profile API response
    const name = profile?.name || symbolUpper;
    
    // Finnhub candle data: { c: [close prices], h: [high prices], l: [low prices], o: [open prices], t: [timestamps], v: [volumes], s: status }
    const closes = data.c || [];
    const opens = data.o || [];
    const highs = data.h || [];
    const lows = data.l || [];
    const volumes = data.v || [];
    const timestamps = data.t || [];

    // Transform to line data (for line chart)
    const lineData = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      price: parseFloat(closes[index]?.toString() || '0'),
    }));

    // Transform to candlestick data
    const candleData = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: parseFloat(opens[index]?.toString() || '0'),
      high: parseFloat(highs[index]?.toString() || '0'),
      low: parseFloat(lows[index]?.toString() || '0'),
      close: parseFloat(closes[index]?.toString() || '0'),
      volume: parseInt(volumes[index]?.toString() || '0', 10),
    }));

    const history = {
      symbol: symbolUpper,
      name,
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
