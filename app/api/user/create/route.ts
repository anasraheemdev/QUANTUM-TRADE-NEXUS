import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// Force dynamic rendering - this route uses request body
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, requestAdminAccess } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for user creation
    const supabase = createAdminClient();

    // IMPORTANT: Wait a moment to ensure user is fully committed to auth.users
    // The foreign key constraint requires the user to exist in auth.users first
    // The database trigger should handle this automatically, but we add a delay as safety
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingUser) {
      // User already exists, return success
      console.log("User profile already exists:", userId);
      return NextResponse.json({ 
        message: "User already exists",
        user: existingUser 
      });
    }

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected, other errors are real issues
      console.error("Error checking existing user:", checkError);
    }

    // Create user profile
    console.log("Attempting to insert user profile:", { userId, email, name });
    console.log("User ID type:", typeof userId, "Value:", userId);
    
    // Ensure userId is a valid UUID string
    if (typeof userId !== 'string' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json(
        { error: "Invalid user ID format", details: "User ID must be a valid UUID" },
        { status: 400 }
      );
    }
    
    // Generate unique user ID
    const uniqueId = `USER${Math.floor(100000 + Math.random() * 900000)}`;
    
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        id: userId, // This must be UUID type in database
        email: email,
        name: name || email.split("@")[0] || "User",
        account_balance: 1500,
        total_invested: 0,
        trading_level: "Beginner",
        member_since: new Date().toISOString(),
        unique_user_id: uniqueId,
        role: 'client', // Explicitly set role to 'client' for new users
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Error creating user profile:", insertError);
      console.error("Error code:", insertError.code);
      console.error("Error message:", insertError.message);
      console.error("Error details:", insertError.details);
      console.error("Error hint:", insertError.hint);
      
      return NextResponse.json(
        { 
          error: "Failed to create user profile", 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      );
    }

    console.log("✅ User profile created successfully:", newUser?.id);
    
    // If admin access was requested, create an admin request
    if (requestAdminAccess) {
      try {
        const { error: requestError } = await supabase
          .from("admin_requests")
          .insert({
            user_id: userId,
            email: email,
            name: name || email.split("@")[0] || "User",
            status: 'pending',
          });
        
        if (requestError) {
          console.error("Error creating admin request:", requestError);
          // Don't fail the signup if admin request creation fails
        } else {
          console.log("✅ Admin access request created for user:", userId);
        }
      } catch (err) {
        console.error("Exception creating admin request:", err);
        // Don't fail the signup if admin request creation fails
      }
    }
    
    return NextResponse.json({ 
      message: "User profile created successfully",
      user: newUser,
      adminRequestCreated: requestAdminAccess || false
    });
  } catch (error) {
    console.error("Error in user creation API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

