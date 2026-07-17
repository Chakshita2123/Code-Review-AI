/**
 * In-memory sliding-window rate limiter.
 * No external service required — state persists per Node.js process.
 */

const rateLimit = new Map<string, number[]>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix ms timestamp when the oldest request falls out of the window
}

/**
 * Check and update rate limit for the given identifier.
 *
 * @param identifier - Unique key (e.g. "userId:/api/review")
 * @param limit      - Max requests allowed in the window
 * @param windowMs   - Window size in milliseconds
 */
export function rateLimiter(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Initialise or prune stale timestamps
  const existing = rateLimit.get(identifier) ?? [];
  const requests = existing.filter((ts) => ts > windowStart);

  if (requests.length >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: requests[0] + windowMs, // when the oldest request expires
    };
  }

  requests.push(now);
  rateLimit.set(identifier, requests);

  return {
    success: true,
    remaining: limit - requests.length,
    reset: now + windowMs,
  };
}
