// Copies what Orbit has published into code (World.md W73, rule 3; Admin.md §0.6): the current version of every
// element's variant, of the world and of the environment (W75), from the database, into src/world/published.json, the
// fallback every page draws when the database cannot be read. Run after a publish, when the fallback should move:
//
//   pnpm --filter orbit copy:published                 # the project the app's .env.local names (the local stack)
//   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… pnpm --filter orbit copy:published   # the hosted one
//
// Reads with the anon key alone, as a visitor does, so only what is published is copied: never a draft. A kind with
// nothing published keeps what the file has, and says so. Nothing here signs in and nothing writes to the database.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const file = resolve(root, "src/world/published.json");
const KINDS = ["mountain", "tree", "human", "portal", "pipe", "road", "world", "environment"];
/** The kinds that are one item, not variants: the copy holds the item itself. */
const SINGLE = new Set(["world", "environment"]);

function envFrom(name) {
  if (process.env[name]) return process.env[name];
  for (const candidate of [".env.local", ".env.production.local", ".env"]) {
    const path = resolve(root, candidate);
    if (!existsSync(path)) continue;
    const line = readFileSync(path, "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "");
  }
  return null;
}
const url = envFrom("NEXT_PUBLIC_SUPABASE_URL");
const key = envFrom("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!url || !key) {
  console.error("copy:published needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, in the environment or apps/orbit/.env.local.");
  process.exit(1);
}
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const rest = async (path) => {
  const answer = await fetch(`${url}/rest/v1/${path}`, { headers });
  if (!answer.ok) throw new Error(`${path}: ${answer.status} ${await answer.text()}`);
  return answer.json();
};

const items = await rest(`studio_items?kind=in.(${KINDS.join(",")})&select=id,name,kind,current_version_id&order=created_at`);
const published = items.filter((item) => item.current_version_id);
const versions = published.length ? await rest(`studio_versions?id=in.(${published.map((item) => item.current_version_id).join(",")})&select=id,item_id,number,minor,data`) : [];
const versionOf = new Map(versions.map((version) => [version.item_id, version]));

const current = JSON.parse(readFileSync(file, "utf8"));
const next = { ...current };
for (const kind of KINDS) {
  const rows = published.filter((item) => item.kind === kind).flatMap((item) => {
    const version = versionOf.get(item.id);
    return version ? [{ id: item.id, name: item.name, settings: version.data, version: `${version.number}.${version.minor}` }] : [];
  });
  if (!rows.length) {
    console.warn(`${kind}: nothing published; the copy keeps what it has.`);
    continue;
  }
  const copied = rows.map(({ id, name, settings }) => ({ id, name, settings }));
  next[kind] = SINGLE.has(kind) ? copied[0] : copied;
  console.log(`${kind}: ${rows.map((row) => `${row.name} ${row.version}`).join(", ")}`);
}
writeFileSync(file, JSON.stringify(next, null, 1) + "\n");
console.log(`Copied into ${file}. Commit it with the change it answers.`);
