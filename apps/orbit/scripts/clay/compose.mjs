// Labels the reference and the actual five-view render at the same image scale.
// node apps/orbit/scripts/clay/compose.mjs <render-dir> [comparison.png] [reference.png]
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const dir = resolve(process.argv[2] ?? resolve(root, "e2e/.mcp/clay-review"));
const out = resolve(process.argv[3] ?? resolve(dir, "comparison.png"));
const reference = resolve(process.argv[4] ?? resolve(root, "notes/world/clay-turnaround.png"));
const crop = { left: 0, top: 180, width: 1448, height: 640 };
const label = (text) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1448" height="40"><rect width="1448" height="40" fill="#f4f1ef"/><text x="24" y="27" font-family="Arial,sans-serif" font-size="18" fill="#4a4543" letter-spacing="2">${text}</text></svg>`);
const target = await sharp(reference).extract(crop).png().toBuffer();
const rendered = await sharp(resolve(dir, "clay-studio.png")).extract(crop).png().toBuffer();
await sharp({ create: { width: crop.width, height: (crop.height + 40) * 2, channels: 3, background: "#f4f1ef" } })
  .composite([
    { input: label("REFERENCE — YOUR TARGET"), left: 0, top: 0 },
    { input: target, left: 0, top: 40 },
    { input: label("ORBIT — VERSION 9 — ACTUAL 3D RENDER"), left: 0, top: 680 },
    { input: rendered, left: 0, top: 720 },
  ]).png().toFile(out);
console.log(out);
