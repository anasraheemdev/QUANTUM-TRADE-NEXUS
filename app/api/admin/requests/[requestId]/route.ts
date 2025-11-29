import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// PUT - Approve or reject admin request
export async function PUT(
  request: NextRequest,
  { params }: { params: { requestId: string } }
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

    // Check if user is admin
    const adminStatus = await isAdmin(user.id);
    if (!adminStatus) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, reason } = body; // action: 'approve' or 'reject'

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const requestId = params.requestId;
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Admin client not available" }, { status: 500 });
    }

    if (action === 'approve') {
      // Use the SQL function to approve
      const { data: result, error: rpcError } = await adminClient.rpc('approve_admin_request', {
        p_request_id: requestId,
        p_reviewer_id: user.id,
      });

      if (rpcError || !result?.success) {
        console.error("Error approving request:", rpcError || result);
        return NextResponse.json({ 
          error: "Failed to approve request",
          details: rpcError?.message || result?.error 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        message: "Admin request approved successfully",
        data: result
      });
    } else {
      // Reject the request
      const { data: result, error: rpcError } = await adminClient.rpc('reject_admin_request', {
        p_request_id: requestId,
        p_reviewer_id: user.id,
        p_reason: reason || null,
      });

      if (rpcError || !result?.success) {
        console.error("Error rejecting request:", rpcError || result);
        return NextResponse.json({ 
          error: "Failed to reject request",
          details: rpcError?.message || result?.error 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true,
        message: "Admin request rejected",
        data: result
      });
    }
  } catch (error) {
    console.error("Error processing admin request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

