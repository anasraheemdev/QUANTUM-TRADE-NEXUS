import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

// Force dynamic rendering - this route uses request headers
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

    // Fetch user profile - try admin client first, fallback to regular client
    // Admin client ensures we get latest data and bypasses RLS
    const adminSupabase = tryCreateAdminClient();
    const clientToUse = adminSupabase || supabase;
    
    const { data: userData, error } = await clientToUse
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      // If user doesn't exist in users table, create one
      console.log("User profile not found, creating new profile for:", user.id);
      
      // Generate unique user ID
      const uniqueId = `USER${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Use admin client for user creation to bypass RLS, fallback to regular if needed
      const adminSupabaseForInsert = tryCreateAdminClient();
      const insertClient = adminSupabaseForInsert || supabase;
      
      const { data: newUser, error: insertError } = await insertClient
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          account_balance: 1500,
          total_invested: 0,
          trading_level: "Beginner",
          member_since: new Date().toISOString(),
          unique_user_id: uniqueId,
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

    // If user exists but doesn't have unique_user_id, generate one
    if (userData && !userData.unique_user_id) {
      console.log("User exists but missing unique_user_id, generating one...");
      
      // Generate unique user ID (keep trying until we get a unique one)
      let uniqueId: string = `USER${Date.now().toString().slice(-6)}`; // Initialize with fallback
      let attempts = 0;
      let isUnique = false;
      
      while (!isUnique && attempts < 10) {
        uniqueId = `USER${Math.floor(100000 + Math.random() * 900000)}`;
        
        // Check if this ID already exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("unique_user_id", uniqueId)
          .single();
        
        if (!existingUser) {
          isUnique = true;
        } else {
          attempts++;
        }
      }
      
      if (!isUnique) {
        // Fallback: use timestamp-based ID
        uniqueId = `USER${Date.now().toString().slice(-6)}`;
      }
      
      // Update user with unique ID - try admin client, fallback to regular
      const adminSupabaseForUpdate = tryCreateAdminClient();
      const updateClient = adminSupabaseForUpdate || supabase;
      
      const { data: updatedUser, error: updateError } = await updateClient
        .from("users")
        .update({ unique_user_id: uniqueId })
        .eq("id", user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("Error updating unique_user_id:", updateError);
        // Return user data anyway, even without unique_id
        return NextResponse.json(userData);
      }
      
      console.log("Unique ID generated successfully:", uniqueId);
      return NextResponse.json(updatedUser);
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

