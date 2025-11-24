import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to add slight price variations
function addPriceVariation(stock: any) {
  const variation = (Math.random() - 0.5) * 0.02;
  const newPrice = stock.price * (1 + variation);
  const newChange = stock.change * (1 + variation);
  const newChangePercent = (newChange / (newPrice - newChange)) * 100;
  
  return {
    ...stock,
    price: Math.round(newPrice * 100) / 100,
    change: Math.round(newChange * 100) / 100,
    changePercent: Math.round(newChangePercent * 100) / 100,
    high: Math.round(newPrice * 1.05 * 100) / 100,
    low: Math.round(newPrice * 0.95 * 100) / 100,
    open: Math.round((newPrice - newChange) * 100) / 100,
  };
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
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

    const stockWithVariation = addPriceVariation(stock);

    return NextResponse.json(stockWithVariation);
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
