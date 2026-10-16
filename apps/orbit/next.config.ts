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
      // The portal was the hole until its version 5 (World.md W15), and went with W93 (his: "Let's remove Portal because
      // Pipes can be portals now"); the trees', the pipes' and the roads' pages went with it, their looks set as they are
      // placed on the Sectors page (his: "As they are placed, like a block"). Their old addresses, for a tab left open.
      { source: "/build/hole", destination: "/build/sectors", permanent: false },
      { source: "/build/portal", destination: "/build/sectors", permanent: false },
      { source: "/build/trees", destination: "/build/sectors", permanent: false },
      { source: "/build/pipes", destination: "/build/sectors", permanent: false },
      { source: "/build/roads", destination: "/build/sectors", permanent: false },
      // The sector was the plane in its version 1 (World.md W24), and an element until Spaces took it (W81).
      { source: "/build/plane", destination: "/build/sectors", permanent: false },
      { source: "/build/sector", destination: "/build/sectors", permanent: false },
      // Inspect went with W73: the mountain has a page of its own; the Environment is a page a group, Sky its first.
      { source: "/build/inspect", destination: "/build/mountains", permanent: false },
      { source: "/build/environment", destination: "/build/sky", permanent: false },
    ];
  },

  transpilePackages: ["@no-origins/ui", "@no-origins/auth"],
  env: { NEXT_PUBLIC_UI_VERSION: ui.version },
};

export default nextConfig;
