import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

/**
 * Check if a user is an admin
 * Uses admin client to bypass RLS and prevent infinite recursion
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    // Use admin client to bypass RLS and prevent infinite recursion
    const adminSupabase = tryCreateAdminClient();
    const supabase = adminSupabase || createServerClient();
    
    const { data: user, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return false;
    }

    return user.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get admin user ID from request headers
 * @param request - Next.js request object
 * @returns Promise<string | null> - Admin user ID or null if not admin
 */
export async function getAdminUserId(request: Request): Promise<string | null> {
  try {
    const supabase = createServerClient();
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    const adminStatus = await isAdmin(user.id);
    return adminStatus ? user.id : null;
  } catch (error) {
    console.error("Error getting admin user ID:", error);
    return null;
  }
}

