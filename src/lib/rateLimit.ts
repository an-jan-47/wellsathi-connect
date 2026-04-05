/**
 * In-memory rate limiter for frontend API calls.
 *
 * Prevents excessive requests from a single browser tab by tracking
 * call timestamps per action key and enforcing a sliding window limit.
 *
 * Note: This is per-tab, client-side protection. Real rate limiting
 * must also be enforced server-side (RLS + edge functions).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /** Maximum number of calls allowed within the window. Default: 10 */
  maxCalls?: number;
  /** Time window in milliseconds. Default: 60_000 (1 minute) */
  windowMs?: number;
}

/**
 * Check if an action is rate-limited. Returns `true` if allowed, `false` if blocked.
 * Automatically records the call if allowed.
 *
 * @param key - Unique identifier for the action (e.g. 'book_appointment', 'search_clinics')
 * @param config - Rate limit configuration
 *
 * @example
 * ```ts
 * if (!checkRateLimit('book_appointment', { maxCalls: 3, windowMs: 60_000 })) {
 *   toast.error('Too many attempts. Please wait a moment.');
 *   return;
 * }
 * ```
 */
export function checkRateLimit(key: string, config: RateLimitConfig = {}): boolean {
  const { maxCalls = 10, windowMs = 60_000 } = config;
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Prune old timestamps outside window
  entry.timestamps = entry.timestamps.filter(t => t > cutoff);

  if (entry.timestamps.length >= maxCalls) {
    return false; // Rate limited
  }

  entry.timestamps.push(now);
  return true; // Allowed
}

/**
 * Returns how many seconds until the next allowed call.
 * Returns 0 if not currently rate-limited.
 */
export function getRateLimitCooldown(key: string, config: RateLimitConfig = {}): number {
  const { maxCalls = 10, windowMs = 60_000 } = config;
  const entry = store.get(key);
  if (!entry || entry.timestamps.length < maxCalls) return 0;

  const oldestInWindow = entry.timestamps[entry.timestamps.length - maxCalls];
  if (!oldestInWindow) return 0;

  const unlockAt = oldestInWindow + windowMs;
  const remaining = unlockAt - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Reset the rate limit counter for a specific key (e.g. after successful auth).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Pre-configured rate limit presets for common actions.
 */
export const RATE_LIMITS = {
  /** Booking: max 5 attempts per minute */
  BOOK_APPOINTMENT: { maxCalls: 5, windowMs: 60_000 },
  /** Search: max 20 queries per minute */
  SEARCH: { maxCalls: 20, windowMs: 60_000 },
  /** Auth: max 5 attempts per 2 minutes */
  AUTH: { maxCalls: 5, windowMs: 120_000 },
  /** Review submit: max 3 per 5 minutes */
  REVIEW: { maxCalls: 3, windowMs: 300_000 },
  /** Status update: max 10 per minute */
  STATUS_UPDATE: { maxCalls: 10, windowMs: 60_000 },
} satisfies Record<string, RateLimitConfig>;
