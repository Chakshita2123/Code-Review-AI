import Google from 'next-auth/providers/google';
import type { User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-me',

  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60,     // 7 days
    updateAge: 24 * 60 * 60,      // refresh token every 24 h
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60,     // match session lifetime
  },

  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  pages: {
    signIn: '/login',
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user?.id) {
        token.sub = user.id;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
};
