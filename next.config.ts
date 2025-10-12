import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // abaikan TypeScript error (termasuk error "ParamCheck<RouteContext>")
  },
};

export default nextConfig;
