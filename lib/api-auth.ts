/**
 * API route authentication and rate-limiting helpers.
 * Centralises session extraction and 401/429 responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { rateLimiter } from './ratelimit';

interface AuthSession {
  user: {
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

interface AuthSuccess {
  error: null;
  session: AuthSession;
}

interface AuthFailure {
  error: NextResponse;
  session: null;
}

type AuthResult = AuthSuccess | AuthFailure;

/**
 * Verify the current request has a valid session.
 * Returns the session on success, or a 401 NextResponse on failure.
 */
export async function requireAuth(_request?: NextRequest): Promise<AuthResult> {
  const session = (await auth()) as { user?: { email?: string; name?: string | null; image?: string | null } } | null;

  if (!session?.user?.email) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to continue' },
        { status: 401 },
      ),
      session: null,
    };
  }

  return {
    error: null,
    session: session as AuthSession,
  };
}

/**
 * Verify the current request has a valid session AND has not exceeded the rate limit.
 * Returns the session on success, or a 401/429 NextResponse on failure.
 *
 * @param identifier - Unique rate-limit key (e.g. user email)
 * @param limit      - Max requests per window (default 10)
 * @param windowMs   - Window duration in ms (default 60 000 = 1 minute)
 */
export async function requireAuthWithRateLimit(
  request: NextRequest,
  identifier: string,
  limit = 10,
  windowMs = 60_000,
): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;

  // Use identifier + pathname to scope limits per-route
  const rateLimitKey = `${identifier}:${new URL(request.url).pathname}`;
  const rate = rateLimiter(rateLimitKey, limit, windowMs);

  if (!rate.success) {
    const retryAfter = Math.ceil((rate.reset - Date.now()) / 1000);
    return {
      error: NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please wait before trying again',
          retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      ),
      session: null,
    };
  }

  return authResult;
}
