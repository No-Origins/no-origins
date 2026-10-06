// The catalogue, in code and in the database, the same (Access.md A3). Replays every `noo_permission_upsert(...)` and
// `noo_permission_drop(...)` in `supabase/migrations`, in file order, and compares the names and apps that leave with
// `src/permissions.ts`. Exits 1, naming the difference, when they disagree. Text only: no database, no TypeScript run.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "..", "..");
const migrations = path.join(root, "supabase", "migrations");

const seeded = new Map();
for (const file of readdirSync(migrations).filter((name) => name.endsWith(".sql")).sort()) {
  const sql = readFileSync(path.join(migrations, file), "utf8");
  for (const call of sql.matchAll(/noo_permission_(upsert|drop)\(\s*'([a-z.]+)'(?:\s*,\s*'([a-z]+)')?/g)) {
    const [, verb, name, app] = call;
    if (verb === "upsert") seeded.set(name, app);
    else seeded.delete(name);
  }
}

const code = new Map();
const source = readFileSync(path.join(root, "packages", "auth", "src", "permissions.ts"), "utf8");
for (const entry of source.matchAll(/^\s*"([a-z.]+)":\s*\{\s*app:\s*"([a-z]+)"/gm)) code.set(entry[1], entry[2]);

const problems = [];
for (const [name, app] of code) {
  if (!seeded.has(name)) problems.push(`${name} is in permissions.ts but no migration seeds it`);
  else if (seeded.get(name) !== app) problems.push(`${name} is ${app}'s in permissions.ts but ${seeded.get(name)}'s in the migrations`);
}
for (const name of seeded.keys()) if (!code.has(name)) problems.push(`${name} is seeded by a migration but not in permissions.ts`);

if (!code.size) problems.push("permissions.ts declares no permissions: has its shape changed?");
if (problems.length) {
  console.error(`The catalogue disagrees with the database (Access.md A3):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`The catalogue agrees: ${code.size} permissions.`);
