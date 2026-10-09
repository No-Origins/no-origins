import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { assetId } from "../engine/assets.ts";
import type { AssetBook, AssetVersion, Shot, Use } from "../engine/types.ts";

/**
 * Where a shot is kept (Cinema-Engine.md E3, E5): in his private folder, `src/content`, on his machine, and in the
 * made-up `src/sample` anywhere else, the same rule `next.config.ts` uses for `@cinema/content`. A shot is a folder:
 * `draft.json`, which the commands change, and `versions/<n>.json`, which never change once published.
 *
 * Node only. The command line and the app's server both run in `apps/cinema`, so paths are from the working folder.
 */

const APP = process.cwd();
// Paths read at run time on his machine, never files to bundle: the comments keep Turbopack from tracing the project.
const fromApp = (...parts: string[]) => path.join(/*turbopackIgnore: true*/ APP, ...parts);
if (!existsSync(fromApp("src/engine/types.ts"))) throw new Error(`Run this from apps/cinema (pnpm --filter cinema …), not ${APP}.`);

export const PRIVATE = existsSync(fromApp("src/content/index.ts"));
export const DATA = fromApp(PRIVATE ? "src/content" : "src/sample");

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const isId = (id: string) => ID.test(id);
function shotDir(id: string) {
  if (!isId(id)) throw new Error(`"${id}" is not a shot's id: lower case letters, digits and dashes.`);
  return path.join(DATA, "shots", id);
}

const readJson = <T>(file: string) => JSON.parse(readFileSync(file, "utf8")) as T;

/** Written whole, then moved into place, so a reader never sees half a file. */
function writeJson(file: string, value: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, file);
}

export function listShots() {
  const root = path.join(DATA, "shots");
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isId(entry.name) && existsSync(path.join(root, entry.name, "draft.json")))
    .map((entry) => {
      const shot = readJson<Shot>(path.join(root, entry.name, "draft.json"));
      return { id: shot.id, title: shot.title, rev: shot.rev, versions: versionsOf(shot.id) };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function readDraft(id: string): Shot | undefined {
  const file = path.join(shotDir(id), "draft.json");
  return existsSync(file) ? readJson<Shot>(file) : undefined;
}

/** Saves a draft one revision on from the one it was read at. */
export function saveDraft(shot: Shot): Shot {
  const saved = { ...shot, rev: shot.rev + 1 };
  writeJson(path.join(shotDir(shot.id), "draft.json"), saved);
  return saved;
}

export function versionsOf(id: string) {
  const dir = path.join(shotDir(id), "versions");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).map((name) => /^(\d+)\.json$/.exec(name)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
}

export function readVersion(id: string, version: number): Shot | undefined {
  const file = path.join(shotDir(id), "versions", `${version}.json`);
  return existsSync(file) ? readJson<Shot>(file) : undefined;
}

/**
 * Publishing makes the draft the shot's next version, which never changes (E3). `as` is the draft as it is published,
 * its assets pinned to the versions it uses now (`engine/assets.ts`).
 */
export function publish(id: string, as?: Shot) {
  const draft = as ?? readDraft(id);
  if (!draft) throw new Error(`There is no shot called ${id}.`);
  const version = (versionsOf(id).at(-1) ?? 0) + 1;
  writeJson(path.join(shotDir(id), "versions", `${version}.json`), draft);
  return version;
}

/** Every asset he has saved (`assets/<id>/<version>.json`), its versions oldest first. */
export function readAssets(): AssetBook {
  const root = path.join(DATA, "assets");
  if (!existsSync(root)) return {};
  const book: AssetBook = {};
  for (const folder of readdirSync(root, { withFileTypes: true })) {
    if (!folder.isDirectory() || !isId(folder.name)) continue;
    const versions = readdirSync(path.join(root, folder.name))
      .map((name) => /^(\d+)\.json$/.exec(name)?.[1])
      .filter(Boolean)
      .map(Number)
      .sort((a, b) => a - b)
      .map((n) => readJson<AssetVersion>(path.join(root, folder.name, `${n}.json`)));
    if (versions.length) book[folder.name] = versions;
  }
  return book;
}

/** Saves a configuration under his name for it: a new asset, or the next version of the one with that name. */
export function saveAsset(name: string, use: Use): AssetVersion {
  const id = assetId(name);
  if (!id || !isId(id)) throw new Error("An asset needs a name with a letter or a digit in it.");
  const version = (readAssets()[id]?.at(-1)?.version ?? 0) + 1;
  const asset: AssetVersion = { id, name: name.trim(), version, saved: new Date().toISOString(), use: { entry: use.entry, version: use.version, values: use.values } };
  writeJson(path.join(DATA, "assets", id, `${version}.json`), asset);
  return asset;
}

/** Where renders and exports land (E7): an agent's artifacts, or the shot's own renders, or the exports. */
export function outputDir(kind: "renders" | "exports", shot: string, agent?: { id: string; session: string }) {
  const dir = agent
    ? path.join(DATA, "agents", agent.id, "artifacts", agent.session)
    : kind === "exports" ? path.join(DATA, "exports") : path.join(DATA, "renders", shot);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** A line of an agent's session (Cinema-Agents.md R6): appended, never edited. */
export function appendSession(agent: string, session: string, line: Record<string, unknown>) {
  if (!isId(agent) || !isId(session)) throw new Error("An agent's id and its session's are lower case letters, digits and dashes.");
  const file = path.join(DATA, "agents", agent, "sessions", `${session}.jsonl`);
  mkdirSync(path.dirname(file), { recursive: true });
  // The time it was written comes last, so no field of the line can stand in for it.
  appendFileSync(file, `${JSON.stringify({ ...line, at: new Date().toISOString() })}\n`);
  return file;
}

/** An agent's department, from the frontmatter of its profile (Cinema-Agents.md R2), when it has one. */
export function departmentOf(agent: string) {
  const file = path.join(DATA, "agents", agent, "profile.md");
  if (!isId(agent) || !existsSync(file)) return undefined;
  return /^department:\s*([a-z]+)\s*$/m.exec(readFileSync(file, "utf8"))?.[1];
}

export const relative = (file: string) => path.relative(APP, file);
