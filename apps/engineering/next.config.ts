import type { NextConfig } from "next";

// engineering.no-origins.com — the public engineering library. `/jido` is the Jido guide's short address.
const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui"],
  async redirects() {
    return [{ source: "/jido", destination: "/learn/jido", permanent: false }];
  },
};

export default nextConfig;
