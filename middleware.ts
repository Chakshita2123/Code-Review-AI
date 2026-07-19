import { auth } from '@/lib/auth';
import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type AuthRequest = NextRequest & { auth: Session | null };

// Routes that require authentication — using startsWith so sub-routes are also protected
const protectedPrefixes = [
  '/dashboard',
  '/new-review',
  '/history',
  '/chat',
  '/profile',
  '/settings',
];

const publicRoutes = ['/', '/login'];

/**
 * Attach security headers to every outgoing response.
 * These protect against XSS, clickjacking, MIME sniffing, and data leakage.
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent the page from being embedded in an iframe (clickjacking)
  response.headers.set('X-Frame-Options', 'DENY');
  // Legacy XSS filter for older browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Only send origin as referrer on same-site requests; no referrer cross-origin
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Disable access to sensitive browser APIs
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  // Content Security Policy — restrict resource loading origins
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://generativelanguage.googleapis.com https://cdn.jsdelivr.net",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
    ].join('; '),
  );
  // Unique request ID for tracing — useful when correlating client errors with server logs
  response.headers.set('x-request-id', crypto.randomUUID());

  return response;
}

export default auth((req: AuthRequest) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith('/api/auth');

  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // Redirect unauthenticated users away from protected pages
  if (isProtectedRoute && !req.auth) {
    console.warn(
      `[Auth] Unauthenticated access attempt: ${pathname} — redirecting to /login`,
    );
    const loginUrl = new URL('/login', nextUrl.origin);
    const redirectResponse = NextResponse.redirect(loginUrl);
    return applySecurityHeaders(redirectResponse);
  }

  // Redirect authenticated users away from the login page
  if (req.auth && pathname === '/login') {
    const dashboardUrl = new URL('/dashboard', nextUrl.origin);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    return applySecurityHeaders(redirectResponse);
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
