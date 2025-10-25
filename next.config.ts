import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Remove allowedDevOrigins for production
  experimental: {
    serverComponentsExternalPackages: ['leaflet'],
  },
  images: {
    domains: ['unpkg.com'],
  },
};

export default nextConfig;
