import type { NextConfig } from "next";

// engineering.no-origins.com — public engineering publish library (Layer A).
const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui"],
  async redirects() {
    return [{ source: "/jido", destination: "/learn/jido", permanent: false }];
  },
};

export default nextConfig;
