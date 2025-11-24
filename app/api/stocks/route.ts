import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to add slight price variations for realism
function addPriceVariation(stock: any) {
  const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
  const newPrice = stock.price * (1 + variation);
  const newChange = stock.change * (1 + variation);
  const newChangePercent = (newChange / (newPrice - newChange)) * 100;
  
  return {
    ...stock,
    price: Math.round(newPrice * 100) / 100,
    change: Math.round(newChange * 100) / 100,
    changePercent: Math.round(newChangePercent * 100) / 100,
  };
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'stocks.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const stocks = JSON.parse(fileContents);

    // Add slight variations to prices for realism (simulates real-time updates)
    const stocksWithVariations = stocks.map(addPriceVariation);

    return NextResponse.json(stocksWithVariations);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
