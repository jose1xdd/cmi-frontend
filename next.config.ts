import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 🚀 No correr ESLint durante `next build`
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend-quillacinga.ddns.net/cmi-apigateway/:path*',
      },
    ];
  },
};

export default nextConfig;
