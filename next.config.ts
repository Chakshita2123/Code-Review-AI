import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Remove X-Powered-By header — saves a few bytes and hides tech stack
  poweredByHeader: false,

  // Enable gzip/brotli compression on responses
  compress: true,

  images: {
    // Prefer WebP — significantly smaller than PNG/JPEG
    formats: ['image/webp'],
    // Cache remote images for at least 60 seconds
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },

  experimental: {
    // Tree-shake icon and animation libraries at the package level —
    // only import the symbols actually used instead of the full bundle.
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },

  compiler: {
    // Strip all console.* calls in production builds to reduce bundle size
    // and avoid leaking debug output.
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
