import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET - Fetch all admin requests
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

    // Use admin client to fetch all admin requests
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Admin client not available" }, { status: 500 });
    }

    const { data: requests, error } = await adminClient
      .from("admin_requests")
      .select("*")
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin requests:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Error in admin requests route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create admin request (for users requesting admin access)
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
    const { email, name } = body;

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from("admin_requests")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ 
          error: "You already have a pending admin request" 
        }, { status: 400 });
      }
      if (existingRequest.status === 'approved') {
        return NextResponse.json({ 
          error: "You are already an admin" 
        }, { status: 400 });
      }
    }

    // Create admin request
    const { data: newRequest, error: insertError } = await supabase
      .from("admin_requests")
      .insert({
        user_id: user.id,
        email: email || user.email,
        name: name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating admin request:", insertError);
      return NextResponse.json({ error: "Failed to create admin request" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Admin request created successfully",
      request: newRequest 
    });
  } catch (error) {
    console.error("Error creating admin request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

