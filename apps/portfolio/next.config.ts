import type { NextConfig } from "next";

/** Where the portfolio lives (Portfolio.md P1, 2026-09-21). The old host redirects here, path and query intact. */
export const CANONICAL_HOST = "hiddenstack.no-origins.com";
const OLD_HOSTS = ["bhargav.no-origins.com"];

const nextConfig: NextConfig = {
  async redirects() {
    return OLD_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `https://${CANONICAL_HOST}/:path*`,
      permanent: true,
    }));
  },

  // the design system is consumed from source inside the workspace
  transpilePackages: ["@no-origins/ui"],
};

export default nextConfig;
