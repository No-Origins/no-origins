import type { NextConfig } from "next";

// orbit.no-origins.com — Orbit, the world (World.md W1): the 3D world that is No Origins' base UI.

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
      // The portal was the hole until its version 5 (World.md W15): its page's old address, kept for a tab left open.
      { source: "/build/hole", destination: "/build/portal", permanent: false },
      // The sector was the plane in its version 1 (World.md W24).
      { source: "/build/plane", destination: "/build/sector", permanent: false },
    ];
  },

  transpilePackages: ["@no-origins/ui"],
};

export default nextConfig;
