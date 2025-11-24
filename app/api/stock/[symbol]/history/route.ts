import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to generate historical data based on current price
function generateHistory(symbol: string, name: string, currentPrice: number, days: number = 30) {
  const lineData = [];
  const candleData = [];
  const basePrice = currentPrice * 0.85; // Start 15% lower
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate realistic price movement
    const trend = (currentPrice - basePrice) / days;
    const price = basePrice + (trend * (days - i)) + (Math.random() - 0.5) * currentPrice * 0.05;
    const open = price * (1 + (Math.random() - 0.5) * 0.02);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.03);
    const low = Math.min(open, close) * (1 - Math.random() * 0.03);
    const volume = Math.floor(1000000 + Math.random() * 5000000);
    
    lineData.push({
      date: dateStr,
      price: Math.round(price * 100) / 100,
    });
    
    candleData.push({
      date: dateStr,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: volume,
    });
  }
  
  return { lineData, candleData };
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const { searchParams } = new URL(request.url);
    const outputsize = parseInt(searchParams.get('outputsize') || '30', 10);
    const symbolUpper = symbol.toUpperCase();

    const filePath = path.join(process.cwd(), 'public', 'data', 'stocks.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const stocks = JSON.parse(fileContents);

    const stock = stocks.find((s: any) => s.symbol === symbolUpper);

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    const { lineData, candleData } = generateHistory(stock.symbol, stock.name, stock.price, outputsize);

    const history = {
      symbol: symbolUpper,
      name: stock.name,
      lineData,
      candleData,
    };

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
