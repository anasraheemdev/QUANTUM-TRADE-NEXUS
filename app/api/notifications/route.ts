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

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Fetch recent credit transfers where user is involved
    // Try with foreign key first, fallback to manual join if needed
    let query = supabase
      .from("credit_transfers")
      .select(`
        *,
        from_user:users!credit_transfers_from_user_id_fkey(id, name, email, unique_user_id),
        to_user:users!credit_transfers_to_user_id_fkey(id, name, email, unique_user_id)
      `)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    let { data: transfers, error } = await query;

    // If foreign key query fails, try without foreign key
    if (error) {
      console.error("Error with foreign key query, trying alternative:", error);
      const altQuery = supabase
        .from("credit_transfers")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      const { data: transfersData, error: altError } = await altQuery;
      
      if (altError) {
        console.error("Error fetching notifications:", altError);
        console.error("Error details:", JSON.stringify(altError, null, 2));
        return NextResponse.json(
          { error: "Failed to fetch notifications", details: altError.message },
          { status: 500 }
        );
      }
      
      // Manually fetch user data for each transfer
      transfers = transfersData;
      if (transfers && transfers.length > 0) {
        const userIds = new Set<string>();
        transfers.forEach((t: any) => {
          if (t.from_user_id) userIds.add(t.from_user_id);
          if (t.to_user_id) userIds.add(t.to_user_id);
        });
        
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name, email, unique_user_id")
          .in("id", Array.from(userIds));
        
        const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));
        
        transfers = transfers.map((t: any) => ({
          ...t,
          from_user: usersMap.get(t.from_user_id),
          to_user: usersMap.get(t.to_user_id),
        }));
      }
    }

    // Transform transfers into notifications
    const notifications = (transfers || []).map((transfer: any) => {
      const isReceived = transfer.to_user_id === user.id;
      const otherUser = isReceived ? transfer.from_user : transfer.to_user;
      
      return {
        id: transfer.id,
        type: isReceived ? "credit_received" : "credit_sent",
        title: isReceived 
          ? `Received ${transfer.amount} credits from ${otherUser?.name || "Unknown"}`
          : `Sent ${transfer.amount} credits to ${otherUser?.name || "Unknown"}`,
        message: transfer.note || (isReceived 
          ? `You received $${transfer.amount} from ${otherUser?.name || "Unknown"}`
          : `You sent $${transfer.amount} to ${otherUser?.name || "Unknown"}`),
        amount: transfer.amount,
        from_user: transfer.from_user,
        to_user: transfer.to_user,
        isReceived,
        created_at: transfer.created_at,
        read: false, // You can add a read status column later
      };
    });

    // Count unread notifications
    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

