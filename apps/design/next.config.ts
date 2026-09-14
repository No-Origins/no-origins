import type { NextConfig } from "next";

// The design-system showcase (Design-System.md §11.4, §14 step 14). Its own app and its own Vercel project, on
// design.no-origins.com — deliberately NOT a route of the portfolio, which has no pages and no room to
// demonstrate every variant of everything.
const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui"],
};

export default nextConfig;
