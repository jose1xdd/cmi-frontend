import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔥 Necesario para Docker standalone
  output: "standalone",

  eslint: {
    // 🚀 No correr ESLint durante `next build`
    ignoreDuringBuilds: true,
  },

  typescript: {
    // 🚀 Evita que errores de tipos rompan el build en CI
    ignoreBuildErrors: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend-quillacinga.ddns.net/cmi-apigateway/:path*",
      },
    ];
  },
};

export default nextConfig;
