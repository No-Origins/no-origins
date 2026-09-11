import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the four old sections became seven (Brand.md §9); nothing is deployed, but the docs and screenshots
  // reference the old paths, so they land somewhere sensible rather than 404
  async redirects() {
    return [
      { source: "/about", destination: "/", permanent: false },
      { source: "/contact", destination: "/status", permanent: false },
      { source: "/roadmap", destination: "/", permanent: false },
    ];
  },

  // the design system is consumed from source inside the workspace (Design-System.md §11)
  transpilePackages: ["@no-origins/ui"],
};

export default nextConfig;
