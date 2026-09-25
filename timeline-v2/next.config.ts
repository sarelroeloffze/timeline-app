import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Disable type checking during build (use tsc separately)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable ESLint during build (use eslint separately)
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
