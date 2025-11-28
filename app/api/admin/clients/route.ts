import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

    // Check if user is admin
    const adminStatus = await isAdmin(user.id);
    if (!adminStatus) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Use admin client to fetch all clients (bypasses RLS)
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      console.error("Admin client not available - check SUPABASE_SERVICE_ROLE_KEY");
      // Fallback to regular client (might have RLS issues)
      const { data: clients, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching clients (fallback):", error);
        return NextResponse.json({ error: "Failed to fetch clients", details: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ clients: clients || [] });
    }
    
    // Fetch all users (clients and admins) for admin dashboard
    // Use admin client to get fresh data directly from database
    const { data: clients, error } = await adminClient
      .from("users")
      .select("id, email, name, avatar_url, account_balance, total_invested, member_since, trading_level, role, unique_user_id, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      return NextResponse.json({ error: "Failed to fetch clients", details: error.message }, { status: 500 });
    }

    // Parse balances to ensure they're numbers
    const parsedClients = (clients || []).map(client => ({
      ...client,
      account_balance: client.account_balance 
        ? (typeof client.account_balance === 'string' ? parseFloat(client.account_balance) : Number(client.account_balance))
        : 1500,
      total_invested: client.total_invested
        ? (typeof client.total_invested === 'string' ? parseFloat(client.total_invested) : Number(client.total_invested))
        : 0,
    }));

    console.log(`Fetched ${parsedClients.length} users for admin dashboard`);
    console.log("Sample client balance:", parsedClients[0]?.account_balance, "Type:", typeof parsedClients[0]?.account_balance);
    
    return NextResponse.json({ 
      clients: parsedClients 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error in admin clients route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

