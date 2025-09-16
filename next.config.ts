import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 🚀 No correr ESLint durante `next build`
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
