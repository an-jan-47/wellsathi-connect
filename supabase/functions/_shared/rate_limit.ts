import { Ratelimit } from "npm:@upstash/ratelimit@1.0.1";
import { Redis } from "npm:@upstash/redis@1.28.3";

export async function checkRateLimit(req: Request) {
  // Graceful fallback if Upstash isn't configured yet (allows development)
  const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!redisUrl || !redisToken) {
    console.warn("Rate limiting bypassed: Upstash Redis credentials missing.");
    return { success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 };
  }

  const redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  const globalRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    analytics: true,
  });

  // Extract the IP from edge proxy headers (or default)
  const ip = req.headers.get("x-forwarded-for") || "anonymous_ip";
  
  return await globalRateLimiter.limit(ip);
}
