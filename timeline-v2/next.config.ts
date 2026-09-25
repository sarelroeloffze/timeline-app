import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Tauri: use dev server, not static export
  images: {
    unoptimized: true,
  },
  // Disable type checking during build (use tsc separately)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
