import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// The Cinema Studio (Cinema.md, Cinema-Engine.md): the engine where a world is described, played and rendered. It runs
// on his machine only (E1) and has no Vercel project.
//
// `@cinema/content` is his private folder (E5): `src/content` where it is (his machine, gitignored) and the made-up
// sample in `src/sample` anywhere else, as Home's `@house` is (Home.md H4). Its types are `src/content.d.ts`; the
// shots on disk are found by the same rule (`src/data/store.ts`).
const CONTENT = existsSync(path.resolve(process.cwd(), "src/content/index.ts")) ? "./src/content/index.ts" : "./src/sample/index.ts";

const nextConfig: NextConfig = {
  transpilePackages: ["@no-origins/ui"],
  turbopack: { resolveAlias: { "@cinema/content": CONTENT } },
};

export default nextConfig;
