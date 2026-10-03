import type { NextConfig } from "next";

// status.no-origins.com — Status (Status.md): where every app of No Origins stands, public, no sign-in and no database.
const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui"],
};

export default nextConfig;
