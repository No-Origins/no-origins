// Publish the house to the private Blob store (Home.md H4): `pnpm --filter home publish:house [--dry]`.
//
// The house is written in TypeScript in `src/content` (gitignored, his machine); the deployed site cannot import it, so
// this evaluates it — the description and the tour, `src/content/index.ts` — into one JSON file, checks that every
// picture the tour names is in `src/content/pictures`, and uploads `house.json` and `tour/<name>.webp` to the store
// connected to the `home` Vercel project, overwriting what was there. The site reads them at each request, so a publish
// shows on the next visit (the store's cache takes up to a minute to let go of the old one). `--dry` checks and writes
// `.publish/house.json` without uploading.
//
// The upload is the Vercel CLI's (`vercel blob put`, run in this app's folder, which is linked to the project), so the
// store's credentials never touch this script or a file.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";

const app = path.resolve(import.meta.dirname, "..");
const content = path.join(app, "src", "content");
const dry = process.argv.includes("--dry");

if (!existsSync(path.join(content, "index.ts"))) {
  console.error("No house here: src/content/index.ts is missing. The house lives on his machine (Home.md H4).");
  process.exit(1);
}

// ── evaluate the TypeScript: each file compiled on its own, `./x` and `@/x` resolved as the app does ───────────────
const requireFromApp = createRequire(path.join(app, "package.json"));
const loaded = new Map();

function resolveLocal(spec, from) {
  let base;
  if (spec.startsWith("@/")) base = path.join(app, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`Cannot resolve ${spec} from ${path.relative(app, from)}`);
}

function load(file) {
  const cached = loaded.get(file);
  if (cached) return cached.exports;
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const compiled = { exports: {} };
  loaded.set(file, compiled);
  const localRequire = (spec) => {
    const target = resolveLocal(spec, file);
    return target ? load(target) : requireFromApp(spec);
  };
  new Function("require", "module", "exports", outputText)(localRequire, compiled, compiled.exports);
  return compiled.exports;
}

const { HOME: house, HOME_TOUR: tour } = load(path.join(content, "index.ts"));
if (!house?.walls?.length || !tour?.stops?.length) {
  console.error("src/content/index.ts did not give a house with walls and a tour with stops.");
  process.exit(1);
}

// ── the pictures the tour names, each one there ─────────────────────────────────────────────────────────────────
const pictures = [...new Set(tour.stops.flatMap((stop) => (stop.picture ? [path.basename(stop.picture.src)] : [])))];
const missing = pictures.filter((name) => !existsSync(path.join(content, "pictures", name)));
if (missing.length) {
  console.error(`The tour names pictures that are not in src/content/pictures: ${missing.join(", ")}`);
  process.exit(1);
}

const out = path.join(app, ".publish");
mkdirSync(out, { recursive: true });
const json = path.join(out, "house.json");
writeFileSync(json, JSON.stringify({ house, tour }));
console.log(`${house.name}, version ${house.version}: ${house.walls.length} walls, ${tour.stops.length} stops, ${pictures.length} pictures.`);
if (dry) {
  console.log(`Dry run: ${path.relative(process.cwd(), json)} written, nothing uploaded.`);
  process.exit(0);
}

// ── upload ─────────────────────────────────────────────────────────────────────────────────────────────────────
const put = (file, pathname, maxAge) => {
  execFileSync(
    "vercel",
    ["blob", "put", file, "--access", "private", "--pathname", pathname, "--allow-overwrite", "true", "--cache-control-max-age", String(maxAge), "--non-interactive"],
    { cwd: app, stdio: ["ignore", "ignore", "inherit"] },
  );
  console.log(`  ${pathname}`);
};
for (const name of pictures) put(path.join(content, "pictures", name), `tour/${name}`, 86400);
// The description last, so a visit never meets a tour whose pictures are not up yet; a minute's cache, so a change shows soon.
put(json, "house.json", 60);
console.log("Published.");
