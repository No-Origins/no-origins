import type { NextConfig } from "next";

// design.no-origins.com — the design system's showcase. Its own app and its own Vercel project, deliberately not a
// route of the portfolio, which has no room to demonstrate every variant of everything.
const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui"],
};

export default nextConfig;
