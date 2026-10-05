import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// home.no-origins.com — Home (Home.md): the model of the house he is building, drawn by three.js from a description
// written as code.
//
// `@house` is the house the app is built with (H4): `src/content` where that folder is — his machine, gitignored — and
// the made-up sample in `src/sample` anywhere else. On Vercel the page reads the real house from the private Blob store
// at each request (`src/lib/store.ts`), so the sample is all a build there ever holds. Its types are `src/house.d.ts`.
const HOUSE = existsSync(path.resolve(process.cwd(), "src/content/index.ts")) ? "./src/content/index.ts" : "./src/sample/index.ts";

const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui", "@no-origins/auth"],
  turbopack: { resolveAlias: { "@house": HOUSE } },
};

export default nextConfig;
