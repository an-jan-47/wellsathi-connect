import { createClient } from "jsr:@supabase/supabase-js@2";

export async function requireAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    }
  );

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    console.error("Auth validation failed:", error?.message);
    throw new Error(`Authentication failed: ${error?.message || "Invalid or Expired JWT"}`);
  }

  return { supabaseClient, user };
}

// Check Role Based Access Control

export function requireRole(user: any, allowedRoles: string[]) {
  const userRole = user.app_metadata?.role || user.user_metadata?.role || "USER";
  
  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Forbidden: Role ${userRole} has insufficient permissions. Expected one of: ${allowedRoles.join(", ")}`);
  }
}
