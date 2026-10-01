import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// orbit.no-origins.com — Orbit (Orbit.md C1): the agent's appearance, on one cell at the
// centre of the grid.
//
// Every version it publishes records the design system's version it was drawn with (Admin.md §7): a style drawn in
// code can change under a version. Read at build from the package it is drawn by; a build runs in the app's folder,
// here and on Vercel (its root directory is apps/orbit).
const ui = JSON.parse(readFileSync(resolve(process.cwd(), "../../packages/ui/package.json"), "utf8")) as { version: string };

/** Where Orbit lives since the rename (Orbit.md C21). The character studio's host redirects here, path and query intact. */
const CANONICAL_HOST = "orbit.no-origins.com";
const OLD_HOSTS = ["character.no-origins.com"];

const nextConfig: NextConfig = {
  async redirects() {
    return OLD_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `https://${CANONICAL_HOST}/:path*`,
      permanent: true,
    }));
  },

  transpilePackages: ["@no-origins/ui", "@no-origins/auth"],
  env: { NEXT_PUBLIC_UI_VERSION: ui.version },
};

export default nextConfig;
