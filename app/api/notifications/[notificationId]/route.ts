import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// DELETE - Mark notification as read or delete it
export async function DELETE(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
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

    const notificationId = params.notificationId;
    
    // Remove "admin-" or "transfer-" prefix if present
    const cleanId = notificationId.replace(/^(admin-|transfer-)/, '');

    // Use admin client to delete notification
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Admin client not available" }, { status: 500 });
    }

    // Check if notification exists and belongs to user
    const { data: notification, error: fetchError } = await adminClient
      .from("notifications")
      .select("user_id")
      .eq("id", cleanId)
      .single();

    if (fetchError || !notification) {
      // If notification doesn't exist in notifications table, it might be a transfer notification
      // In that case, we can't delete it, but we can mark it as "read" in the user's view
      // For now, just return success (client-side will handle hiding it)
      console.log("✅ Notification dismissed (transfer notification or not found):", cleanId);
      return NextResponse.json({ 
        success: true,
        message: "Notification dismissed"
      });
    }

    // Verify notification belongs to user
    if (notification.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the notification
    const { error: deleteError } = await adminClient
      .from("notifications")
      .delete()
      .eq("id", cleanId);

    if (deleteError) {
      console.error("Error deleting notification:", deleteError);
      return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
    }

    console.log("✅ Notification deleted:", cleanId);
    return NextResponse.json({ 
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Error in delete notification route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
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

    const notificationId = params.notificationId;
    
    // Remove "admin-" or "transfer-" prefix if present
    const cleanId = notificationId.replace(/^(admin-|transfer-)/, '');

    // Use admin client to update notification
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Admin client not available" }, { status: 500 });
    }

    // Check if notification exists and belongs to user
    const { data: notification, error: fetchError } = await adminClient
      .from("notifications")
      .select("user_id")
      .eq("id", cleanId)
      .single();

    if (fetchError || !notification) {
      // Transfer notifications can't be marked as read in database
      return NextResponse.json({ 
        success: true,
        message: "Notification marked as read"
      });
    }

    // Verify notification belongs to user
    if (notification.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark as read
    const { error: updateError } = await adminClient
      .from("notifications")
      .update({ read: true })
      .eq("id", cleanId);

    if (updateError) {
      console.error("Error marking notification as read:", updateError);
      return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    console.error("Error in mark notification as read route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

