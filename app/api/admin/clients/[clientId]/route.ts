import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { notifyProfileUpdate } from "@/lib/notifications";
import fs from "fs";
import path from "path";

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching
export const fetchCache = 'force-no-store'; // Disable fetch caching

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
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

    // Check if user is admin
    const adminStatus = await isAdmin(user.id);
    if (!adminStatus) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const clientId = params.clientId;

    // Use admin client to fetch client data (bypasses RLS)
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      console.error("Admin client not available - check SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "Admin client not available" }, { status: 500 });
    }
    
    // Fetch client user data - use admin client to get latest data directly from database
    // Force a fresh query by selecting specific fields
    const { data: client, error: clientError } = await adminClient
      .from("users")
      .select("id, email, name, avatar_url, account_balance, total_invested, trading_level, member_since, role, unique_user_id, created_at, updated_at")
      .eq("id", clientId)
      .single();
    
    console.log("Admin client detail - Fetched client data from DB:", {
      clientId,
      balance: client?.account_balance,
      balanceType: typeof client?.account_balance,
      balanceRaw: client?.account_balance,
      timestamp: new Date().toISOString()
    });

    if (clientError) {
      console.error("Error fetching client:", clientError);
      return NextResponse.json({ error: "Client not found", details: clientError.message }, { status: 404 });
    }
    
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch portfolio positions
    const { data: positions, error: positionsError } = await adminClient
      .from("portfolio_positions")
      .select("*")
      .eq("user_id", clientId);

    if (positionsError) {
      console.error("Error fetching positions:", positionsError);
    }

    // Fetch current prices and enrich positions
    const filePath = path.join(process.cwd(), 'public', 'data', 'stocks.json');
    const stocksData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const enrichedPositions = (positions || []).map((pos: any) => {
      const stock = (stocksData as any[]).find((s: any) => s.symbol === pos.symbol);
      return {
        ...pos,
        current_price: stock?.price || pos.average_price,
      };
    });

    // Fetch transactions
    const { data: transactions, error: transactionsError } = await adminClient
      .from("transactions")
      .select("*")
      .eq("user_id", clientId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
    }

    console.log(`Fetched client ${clientId}: ${enrichedPositions.length} positions, ${transactions?.length || 0} transactions`);
    
    // Parse balance correctly - handle both string and number types
    const parsedBalance = client.account_balance 
      ? (typeof client.account_balance === 'string' 
          ? parseFloat(client.account_balance) 
          : Number(client.account_balance))
      : 0;
    
    const parsedInvested = client.total_invested
      ? (typeof client.total_invested === 'string'
          ? parseFloat(client.total_invested)
          : Number(client.total_invested))
      : 0;
    
    console.log("Balance parsing:", {
      raw: client.account_balance,
      type: typeof client.account_balance,
      parsed: parsedBalance
    });

    // Ensure we return the actual balance from database (not cached)
    const responseData = {
      client: {
        ...client,
        account_balance: parsedBalance,
        total_invested: parsedInvested,
      },
      positions: enrichedPositions,
      transactions: transactions || [],
    };
    
    console.log("Returning response with balance:", responseData.client.account_balance);

    // Add cache-control headers to prevent caching
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error in admin client detail route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
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

    // Check if user is admin
    const adminStatus = await isAdmin(user.id);
    if (!adminStatus) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const clientId = params.clientId;
    const body = await request.json();

    // Use admin client to update client data
    const adminClient = tryCreateAdminClient() || supabase;
    
    // Get current client data to compare changes
    const { data: currentClient } = await adminClient
      .from("users")
      .select("name, email, trading_level")
      .eq("id", clientId)
      .single();

    const { data: updatedClient, error: updateError } = await adminClient
      .from("users")
      .update(body)
      .eq("id", clientId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating client:", updateError);
      return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }

    // Create notification for profile changes (excluding balance changes)
    if (currentClient) {
      const changes: string[] = [];
      if (body.name && body.name !== currentClient.name) changes.push("name");
      if (body.email && body.email !== currentClient.email) changes.push("email");
      if (body.trading_level && body.trading_level !== currentClient.trading_level) changes.push("trading level");
      
      if (changes.length > 0) {
        await notifyProfileUpdate(clientId, changes, user.id);
      }
    }

    return NextResponse.json({ client: updatedClient }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error in admin client update route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}












