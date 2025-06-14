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

eslint: {
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;

