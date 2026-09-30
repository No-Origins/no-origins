import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// character.no-origins.com — the character studio (Character-Studio.md C1): the agent's appearance, on one cell at the
// centre of the grid.
//
// Every version it publishes records the design system's version it was drawn with (Admin.md §7): a style drawn in
// code can change under a version. Read at build from the package it is drawn by; a build runs in the app's folder,
// here and on Vercel (its root directory is apps/character).
const ui = JSON.parse(readFileSync(resolve(process.cwd(), "../../packages/ui/package.json"), "utf8")) as { version: string };

const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui", "@no-origins/auth"],
  env: { NEXT_PUBLIC_UI_VERSION: ui.version },
};

export default nextConfig;
