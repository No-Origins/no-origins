import type { NextConfig } from "next";

// admin.no-origins.com — the control surface (Admin.md). Its own app and its own Vercel project, like the
// showcase: it is the only thing on the platform that talks to Supabase, and the portfolio must keep having no
// database anywhere near its request path (§9).
const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui"],
};

export default nextConfig;
