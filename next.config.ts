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
};

export default nextConfig;

