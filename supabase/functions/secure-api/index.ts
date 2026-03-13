import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleCors, applyCorsHeaders } from "../_shared/cors.ts";
import { requireAuth, requireRole } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate_limit.ts";

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse; // Stops execution for OPTIONS preflight

  const responseHeaders = applyCorsHeaders(req);

  try {
    // 2. Enforce Edge Rate Limiting (Prevents abuse globally)
    const { success, limit, remaining, reset } = await checkRateLimit(req);
    
    // Always attach rate limit metadata
    responseHeaders.set("X-RateLimit-Limit", limit.toString());
    responseHeaders.set("X-RateLimit-Remaining", remaining.toString());
    responseHeaders.set("X-RateLimit-Reset", reset.toString());

    if (!success) {
      return new Response(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: { ...Object.fromEntries(responseHeaders), "Content-Type": "application/json" },
      });
    }

    // --- Optional/Public Routes Check Here ---
    // if (new URL(req.url).pathname.endsWith('/public')) { ... }

    // 3. Enforce Authentication (JWT)
    const { supabaseClient, user } = await requireAuth(req);

    // 4. Enforce Authorization (RBAC) - Example: Require ADMIN role
    // requireRole(user, ["ADMIN"]); 
    // Uncomment the line above if you want to strictly restrict this endpoint

    // --- DYNAMIC BUSINESS LOGIC GOES HERE ---
    
    // Example: fetch something securely using their client
    // const { data } = await supabaseClient.from('profiles').select('*').limit(1);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Security checks passed. Action executed securely at the edge.",
      userId: user.id
    }), {
      status: 200,
      headers: { ...Object.fromEntries(responseHeaders), "Content-Type": "application/json" },
    });

  } catch (err: any) {
    const errorMsg = err.message || "Unknown Error";
    let status = 400;

    if (errorMsg.includes("Forbidden")) status = 403;
    if (errorMsg.includes("JWT") || errorMsg.includes("Authorization")) status = 401;

    return new Response(JSON.stringify({ error: errorMsg }), {
      status,
      headers: { ...Object.fromEntries(responseHeaders), "Content-Type": "application/json" },
    });
  }
});
