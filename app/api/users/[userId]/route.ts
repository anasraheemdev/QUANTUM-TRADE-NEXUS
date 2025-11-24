import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;

    // Fetch user profile (public data)
    // Support both UUID and unique_user_id
    let userData;
    let error;
    
    // Check if userId is a UUID or unique_user_id
    if (userId.includes('-') && userId.length >= 30) {
      // It's a UUID
      const result = await supabase
        .from("users")
        .select("id, email, name, account_balance, total_invested, trading_level, member_since, avatar_url, unique_user_id")
        .eq("id", userId)
        .single();
      userData = result.data;
      error = result.error;
    } else {
      // It's a unique_user_id
      const result = await supabase
        .from("users")
        .select("id, email, name, account_balance, total_invested, trading_level, member_since, avatar_url, unique_user_id")
        .eq("unique_user_id", userId.toUpperCase())
        .single();
      userData = result.data;
      error = result.error;
    }

    if (error || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If viewing own profile, return full data
    // Otherwise, return public data only
    if (user.id === userId) {
      return NextResponse.json(userData);
    }

    // Return public profile data (hide exact balance for privacy)
    const publicProfile = {
      id: userData.id,
      unique_user_id: userData.unique_user_id,
      email: userData.email,
      name: userData.name,
      trading_level: userData.trading_level,
      member_since: userData.member_since,
      avatar_url: userData.avatar_url,
      total_invested: userData.total_invested || 0,
      has_balance: (userData.account_balance || 0) > 0,
    };

    return NextResponse.json(publicProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

