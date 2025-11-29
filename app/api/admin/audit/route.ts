import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// POST - Create audit log entry
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
    const { client_id, action, details } = body;

    if (!client_id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use admin client to insert audit log
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Admin client not available" }, { status: 500 });
    }

    // Insert audit log (assuming audit_logs table exists)
    const { data: auditLog, error: insertError } = await adminClient
      .from("audit_logs")
      .insert({
        admin_id: user.id,
        client_id: client_id,
        action: action,
        details: details || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // If table doesn't exist, just log it (non-critical)
      console.log("Audit log table may not exist:", insertError.message);
      // Return success anyway since audit logging is optional
      return NextResponse.json({ 
        success: true,
        message: "Action completed (audit log not available)"
      });
    }

    return NextResponse.json({ 
      success: true,
      audit_log: auditLog 
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't fail the operation if audit logging fails
    return NextResponse.json({ 
      success: true,
      message: "Action completed (audit logging failed)"
    });
  }
}

// GET - Fetch audit logs
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

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("client_id");

    // Use admin client to fetch audit logs
    const adminClient = tryCreateAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Admin client not available" }, { status: 500 });
    }

    let query = adminClient
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data: auditLogs, error } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }

    return NextResponse.json({ audit_logs: auditLogs || [] });
  } catch (error) {
    console.error("Error in audit route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

