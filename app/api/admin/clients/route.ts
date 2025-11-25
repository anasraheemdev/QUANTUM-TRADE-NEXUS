import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    const { data: clients, error } = await adminClient
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      return NextResponse.json({ error: "Failed to fetch clients", details: error.message }, { status: 500 });
    }

    console.log(`Fetched ${clients?.length || 0} users for admin dashboard`);
    return NextResponse.json({ clients: clients || [] });
  } catch (error) {
    console.error("Error in admin clients route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

