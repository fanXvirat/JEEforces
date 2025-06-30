import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    turbo: process.env.NODE_ENV === 'production'
      ? { moduleIdStrategy: 'deterministic' }
      : {}, 
  },
  async headers() {
    return [
      {
        // apply to absolutely everything
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
    ]
  },

eslint: {
    ignoreDuringBuilds: true,
  },
typescript: {
    ignoreBuildErrors: true,
  },
};
export default nextConfig;

