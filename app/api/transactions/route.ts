import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Force dynamic rendering - this route uses request headers
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
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

    const body = await request.json();
    const { symbol, type, shares, price } = body;

    if (!symbol || !type || !shares || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const total = shares * price;
    const fee = total * 0.001; // 0.1% fee
    const totalCost = total + fee;

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    // Get current position
    const { data: position, error: positionError } = await supabase
      .from("portfolio_positions")
      .select("*")
      .eq("user_id", user.id)
      .eq("symbol", symbol)
      .single();

    if (type === "buy") {
      // Check if user has enough balance
      if (userData.account_balance < totalCost) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      // Update account balance
      await supabase
        .from("users")
        .update({ account_balance: userData.account_balance - totalCost })
        .eq("id", user.id);

      // Update or create position
      if (position) {
        const newShares = parseFloat(position.shares) + shares;
        const newAvgPrice = ((parseFloat(position.shares) * parseFloat(position.avg_price)) + total) / newShares;
        
        await supabase
          .from("portfolio_positions")
          .update({
            shares: newShares,
            avg_price: newAvgPrice,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("symbol", symbol);
      } else {
        await supabase
          .from("portfolio_positions")
          .insert({
            user_id: user.id,
            symbol: symbol,
            shares: shares,
            avg_price: price,
          });
      }
    } else if (type === "sell") {
      // Check if user has enough shares
      if (!position || parseFloat(position.shares) < shares) {
        return NextResponse.json({ error: "Insufficient shares" }, { status: 400 });
      }

      // Update account balance
      await supabase
        .from("users")
        .update({ account_balance: userData.account_balance + total - fee })
        .eq("id", user.id);

      // Update position
      const newShares = parseFloat(position.shares) - shares;
      if (newShares <= 0) {
        // Delete position if no shares left
        await supabase
          .from("portfolio_positions")
          .delete()
          .eq("user_id", user.id)
          .eq("symbol", symbol);
      } else {
        await supabase
          .from("portfolio_positions")
          .update({
            shares: newShares,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("symbol", symbol);
      }
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        symbol: symbol,
        type: type,
        shares: shares,
        price: price,
        total: totalCost,
      });

    if (transactionError) {
      console.error("Error recording transaction:", transactionError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing transaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
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

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }

    return NextResponse.json(transactions || []);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

