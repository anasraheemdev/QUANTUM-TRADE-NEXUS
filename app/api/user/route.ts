import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

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

    // Fetch user profile
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      // If user doesn't exist in users table, create one
      console.log("User profile not found, creating new profile for:", user.id);
      
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          account_balance: 100000,
          total_invested: 0,
          trading_level: "Beginner",
          member_since: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating user profile:", insertError);
        console.error("Insert error details:", JSON.stringify(insertError, null, 2));
        return NextResponse.json({ 
          error: "Failed to create user profile", 
          details: insertError.message 
        }, { status: 500 });
      }

      console.log("User profile created successfully:", newUser?.id);
      return NextResponse.json(newUser);
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("users")
      .update(body)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

