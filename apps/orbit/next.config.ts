import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// orbit.no-origins.com — Orbit, the world (World.md W1): the 3D world that is No Origins' base UI.
//
// Every variant it publishes records the design system's version it was made with (Admin.md §7, World.md W73), read at
// build from the package; a build runs in the app's folder, here and on Vercel (its root directory is apps/orbit).
const ui = JSON.parse(readFileSync(resolve(process.cwd(), "../../packages/ui/package.json"), "utf8")) as { version: string };

/** The character studio's old host still redirects here, path and query intact. */
const CANONICAL_HOST = "orbit.no-origins.com";
const OLD_HOSTS = ["character.no-origins.com"];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...OLD_HOSTS.map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      })),
      // W108: old builder bookmarks return to the replacement scene.
      { source: "/build/:path*", destination: "/", permanent: false },
    ];
  },

  transpilePackages: ["@no-origins/ui", "@no-origins/auth"],
  env: { NEXT_PUBLIC_UI_VERSION: ui.version },
};

export default nextConfig;
