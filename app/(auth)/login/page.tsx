'use client';

import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { Code2 } from 'lucide-react';

const avatars = ['AJ', 'MK', 'SL'];

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-10 text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%)]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400"
        >
          <Code2 className="h-6 w-6" />
        </motion.div>

        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-400">Sign in to start reviewing your code</p>

        <div className="my-6 h-px bg-white/10" />

        <motion.button
          whileHover={{ scale: 1.01, boxShadow: '0 10px 30px rgba(255,255,255,0.12)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-900 transition hover:bg-gray-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c11.045 0 20-8.955 20-20 0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
          </svg>
          <span>Continue with Google</span>
        </motion.button>

        <p className="mt-4 text-center text-xs text-gray-500">By signing in, you agree to our Terms and Privacy Policy</p>

        <div className="mt-8 flex items-center justify-between text-xs text-gray-500">
          <span>Trusted by developers worldwide</span>
          <div className="flex -space-x-2">
            {avatars.map((avatar, index) => (
              <div key={avatar} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-[10px] font-semibold text-gray-200" style={{ zIndex: avatars.length - index }}>
                {avatar}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
