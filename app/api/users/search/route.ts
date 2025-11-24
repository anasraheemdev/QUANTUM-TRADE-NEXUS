import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const searchTerm = query.trim();

    // Search by name (case-insensitive, partial match)
    const { data: usersByName, error: nameError } = await supabase
      .from("users")
      .select("id, email, name, account_balance, total_invested, trading_level, member_since, avatar_url, unique_user_id")
      .ilike("name", `%${searchTerm}%`)
      .limit(20);

    // Search by unique_user_id (exact or partial match)
    // Try searching by unique_user_id if the search term contains "USER" or is numeric
    let usersByUniqueId: any[] = [];
    if (searchTerm.toUpperCase().startsWith('USER') || /^\d+$/.test(searchTerm) || /^USER\d+$/i.test(searchTerm)) {
      const searchPattern = searchTerm.toUpperCase().startsWith('USER') 
        ? `%${searchTerm.toUpperCase()}%` 
        : `%USER${searchTerm}%`;
      
      const { data, error: uniqueIdError } = await supabase
        .from("users")
        .select("id, email, name, account_balance, total_invested, trading_level, member_since, avatar_url, unique_user_id")
        .ilike("unique_user_id", searchPattern)
        .limit(20);
      
      if (!uniqueIdError) {
        usersByUniqueId = data || [];
      }
    }

    // Search by UUID (if it looks like a UUID)
    let usersByUuid: any[] = [];
    if (searchTerm.includes('-') && searchTerm.length >= 30) {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, account_balance, total_invested, trading_level, member_since, avatar_url, unique_user_id")
        .eq("id", searchTerm)
        .limit(20);
      
      usersByUuid = data || [];
    }

    // Combine results and remove duplicates
    const allUsers = [...(usersByName || []), ...(usersByUniqueId || []), ...usersByUuid];
    const uniqueUsers = Array.from(
      new Map(allUsers.map(user => [user.id, user])).values()
    );

    // Remove sensitive data (don't show exact balances in search, just indicate if they have funds)
    const sanitizedUsers = uniqueUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      unique_user_id: user.unique_user_id,
      trading_level: user.trading_level,
      member_since: user.member_since,
      avatar_url: user.avatar_url,
      has_balance: (user.account_balance || 0) > 0,
      total_invested: user.total_invested || 0,
    }));

    return NextResponse.json({
      users: sanitizedUsers,
      count: sanitizedUsers.length
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

