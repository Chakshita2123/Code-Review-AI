import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth-config';

const nextAuth = NextAuth as unknown as (config: Record<string, unknown>) => {
  handlers: {
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
  };
  signIn: (...args: unknown[]) => Promise<unknown>;
  signOut: (...args: unknown[]) => Promise<unknown>;
  auth: (...args: unknown[]) => Promise<unknown>;
};

export const { handlers, signIn, signOut, auth } = nextAuth({
  trustHost: true,
  ...authConfig,
} as Record<string, unknown>);
export const { GET, POST } = handlers;
