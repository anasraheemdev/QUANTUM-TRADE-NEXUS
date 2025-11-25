import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // Check if user is admin
    const adminStatus = await isAdmin(user.id);

    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}

