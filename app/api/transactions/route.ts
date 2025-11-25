import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

// Force dynamic rendering - this route uses request headers
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Trading is now admin-only - clients cannot execute trades
  return NextResponse.json(
    { error: "Trading is restricted. Please contact an administrator to execute trades on your behalf." },
    { status: 403 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    // Use admin client to bypass RLS if available
    const adminSupabase = tryCreateAdminClient();
    const clientToUse = adminSupabase || supabase;
    
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

    const { data: transactions, error } = await clientToUse
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching transactions:", error);
      // Return empty array instead of error to allow page to render
      return NextResponse.json({ transactions: [] });
    }

    console.log(`Fetched ${transactions?.length || 0} transactions for user ${user.id}`);
    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
