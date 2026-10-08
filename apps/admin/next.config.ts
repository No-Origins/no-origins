import type { NextConfig } from "next";

// admin.no-origins.com — the control surface (Admin.md), behind the sign-in. Its own app and its own Vercel project.
const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui", "@no-origins/auth"],
};

export default nextConfig;
