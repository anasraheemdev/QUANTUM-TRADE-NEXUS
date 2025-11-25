import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import fs from "fs";
import path from "path";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    
    // Fetch client user data
    const { data: client, error: clientError } = await adminClient
      .from("users")
      .select("*")
      .eq("id", clientId)
      .single();

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

    return NextResponse.json({
      client: {
        ...client,
        account_balance: parseFloat(client.account_balance) || 0,
        total_invested: parseFloat(client.total_invested) || 0,
      },
      positions: enrichedPositions,
      transactions: transactions || [],
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

    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error("Error in admin client update route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}












