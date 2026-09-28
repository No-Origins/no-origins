import type { NextConfig } from "next";

// motion.no-origins.com — the motion studio (Motion.md M1): the design system's motion, played on the real
// components with every number on a jig.
const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui"],
};

export default nextConfig;
