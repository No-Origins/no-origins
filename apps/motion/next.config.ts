import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// motion.no-origins.com — the motion studio (Motion.md M1): the design system's motion, played on the real
// components with every number on a jig.
//
// Every motion it publishes records the design system's version it was made with (Admin.md §7, Motion.md M20), read at
// build from the package; a build runs in the app's folder, here and on Vercel (its root directory is apps/motion).
const ui = JSON.parse(readFileSync(resolve(process.cwd(), "../../packages/ui/package.json"), "utf8")) as { version: string };

const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui", "@no-origins/auth"],
  env: { NEXT_PUBLIC_UI_VERSION: ui.version },
};

export default nextConfig;
