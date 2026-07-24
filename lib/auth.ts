import NextAuth from 'next-auth';
import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server';
import { authConfig } from '@/lib/auth-config';

type AuthRequest = NextRequest & { auth: Session | null };
type MiddlewareCallback = (req: AuthRequest) => Response | Promise<Response> | void;

type NextAuthReturn = {
  handlers: {
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
  };
  signIn: (...args: unknown[]) => Promise<unknown>;
  signOut: (...args: unknown[]) => Promise<unknown>;
  // Overload 1: called with no args in API routes → returns session
  auth: {
    (): Promise<Session | null>;
    // Overload 2: called with a callback in middleware → returns a Next.js middleware handler
    (callback: MiddlewareCallback): (req: NextRequest) => Promise<Response>;
  };
};

const nextAuth = NextAuth as unknown as (config: Record<string, unknown>) => NextAuthReturn;

export const { handlers, signIn, signOut, auth } = nextAuth({
  trustHost: true,
  ...authConfig,
} as Record<string, unknown>);
export const { GET, POST } = handlers;
