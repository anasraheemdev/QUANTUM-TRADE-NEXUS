import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

// Force dynamic rendering - this route uses request headers
export const dynamic = 'force-dynamic';
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile for account balance - try admin client first, fallback to regular
    // Admin client ensures we get the most up-to-date balance after transfers
    const adminSupabase = tryCreateAdminClient();
    const clientToUse = adminSupabase || supabase;
    
    const { data: userData } = await clientToUse
      .from("users")
      .select("account_balance, total_invested")
      .eq("id", user.id)
      .single();

    // Fetch portfolio positions - use admin client to bypass RLS if available
    const { data: positions, error: positionsError } = await clientToUse
      .from("portfolio_positions")
      .select("*")
      .eq("user_id", user.id);

    if (positionsError) {
      console.error("Error fetching positions:", positionsError);
      return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
    }

    if (!positions || positions.length === 0) {
      return NextResponse.json({
        accountBalance: userData?.account_balance || 100000,
        totalInvested: userData?.total_invested || 0,
        positions: [],
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        watchlist: [],
      });
    }

    // Fetch current prices from static JSON
    const filePath = path.join(process.cwd(), 'public', 'data', 'stocks.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const allStocks = JSON.parse(fileContents);
    
    const priceMap = new Map<string, { price: number; name: string }>();
    positions.forEach((pos: any) => {
      const stock = allStocks.find((s: any) => s.symbol === pos.symbol);
      if (stock) {
        // Add slight variation for realism
        const variation = (Math.random() - 0.5) * 0.02;
        const price = stock.price * (1 + variation);
        priceMap.set(pos.symbol, { 
          price: Math.round(price * 100) / 100, 
          name: stock.name 
        });
      } else {
        priceMap.set(pos.symbol, { price: pos.avg_price, name: pos.symbol });
      }
    });

    // Calculate portfolio values
    const portfolioPositions = positions.map((pos: any) => {
      const currentData = priceMap.get(pos.symbol) || { price: pos.avg_price, name: pos.symbol };
      const currentPrice = currentData.price || pos.avg_price;
      const currentValue = pos.shares * currentPrice;
      const gain = currentValue - pos.shares * pos.avg_price;
      const gainPercent = pos.avg_price > 0 ? (gain / (pos.shares * pos.avg_price)) * 100 : 0;

      return {
        symbol: pos.symbol,
        name: currentData.name,
        shares: parseFloat(pos.shares),
        avgPrice: parseFloat(pos.avg_price),
        currentPrice: currentPrice,
        currentValue: currentValue,
        gain: gain,
        gainPercent: gainPercent,
      };
    });

    const totalValue = portfolioPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalInvested = portfolioPositions.reduce((sum, pos) => sum + pos.shares * pos.avgPrice, 0);
    const totalGain = totalValue - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return NextResponse.json({
      accountBalance: userData?.account_balance || 100000,
      totalInvested: userData?.total_invested || totalInvested,
      positions: portfolioPositions,
      totalValue: totalValue,
      totalCost: totalInvested,
      totalGain: totalGain,
      totalGainPercent: totalGainPercent,
      watchlist: [], // TODO: Fetch from watchlist table if needed
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
