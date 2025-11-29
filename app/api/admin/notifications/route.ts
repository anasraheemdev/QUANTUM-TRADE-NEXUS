import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// POST - Send notification to user
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

    // Check if user is admin
    const adminStatus = await isAdmin(user.id);
    if (!adminStatus) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, title, message, type } = body;

    if (!user_id || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use admin client to insert notification
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Admin client not available" }, { status: 500 });
    }

    // Insert notification (assuming notifications table exists)
    const { data: notification, error: insertError } = await adminClient
      .from("notifications")
      .insert({
        user_id: user_id,
        title: title,
        message: message,
        type: type || "info",
        from_admin: true,
        admin_id: user.id,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating notification:", insertError);
      // If table doesn't exist, create a simple notification via credit_transfers or return error
      return NextResponse.json({ 
        error: "Failed to send notification",
        details: insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      notification: notification 
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

