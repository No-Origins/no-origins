import path from "node:path";
import { pathToFileURL } from "node:url";

import { check, parse, problem, resolve } from "../engine/controls.ts";
import { pinAssets } from "../engine/assets.ts";
import { setCell, setControls } from "../engine/edit.ts";
import { makeLibrary, type Library } from "../engine/library.ts";
import { frameTimes, itemsOf, newShot, nextId, shotLength } from "../engine/shot.ts";
import { DEPARTMENTS, TRACK_DEPARTMENT } from "../engine/types.ts";
import type { Aspect, Department, Entry, Frame, Placement, Shot, TrackKind, Use, Values } from "../engine/types.ts";
import { appendSession, DATA, departmentOf, isId, listShots, outputDir, PRIVATE, publish, readAssets, readDraft, readVersion, relative, saveAsset, saveDraft, versionsOf } from "../data/store.ts";
import { scaled, sheet, still, video } from "./render.ts";

/**
 * The commands (Cinema-Engine.md E6): the only way a shot changes. He, Claude and every agent use the same ones, and
 * the screen calls them too. Each checks before it writes (the values against their controls, the work against the
 * calling agent's department, Cinema-Agents.md R5) and a refusal changes nothing. Given an agent and its session, each
 * writes its own line in the session (R6), so the record never misses a control.
 *
 *   pnpm --filter cinema cmd help
 */

const HELP = `The Cinema Studio's commands (Cinema-Engine.md E6).

  pnpm --filter cinema cmd <command> … [--agent <id> --session <id> [--department <department>]]

Reading
  shots                                   the shots, their revisions and versions
  show <shot> [--version n]               a shot as data
  entries [environment|cast|camera|light] the library: each entry and its controls
  assets                                  his saved assets and their versions

Changing a shot (each needs its department when an agent runs it)
  new <shot> [--title t] [--aspect wide|vertical] [--size px] [--fps n]           direction
  world <shot> <entry[@version]> [control=value …] [--keep]                       set
      (--keep carries over every value the new entry takes from the world before)
  cell <shot> <[layer:]column,row> [--asset <id>|none|rules] [control=value …] [--clear]   set
      (a layer's cell is named with its layer: clouds:2,3)
  asset save "<name>" --from <shot>       saves the shot's world as an asset under his name   set
  place <shot> <entry[@version]> --at x,z [--facing deg] [--name n] [control=value …]   direction, cast
  add <shot> <entry[@version]> --start s --length s [control=value …]             the track's (camera, light)
  set <shot> <world|cast id|item id> [control=value …] [--at x,z] [--facing deg]  the thing's department
  move <shot> <item> --start s · trim <shot> <item> --length s · remove <shot> <cast id|item>
  frame <shot> [--aspect wide|vertical] [--size px] [--fps n]                     direction, camera
  publish <shot>                                                                  direction

Rendering (a published version with --version n; the draft otherwise; --aspect to see the other frame)
  still <shot> --at s                      a still at a moment
  sheet <shot> [--count 12] [--columns 4]  stills across the shot, tiled
  clip <shot> [--from s] [--to s] [--scale 0.5]   a quick video to check
  export <shot> [--version n] [--aspect wide|vertical|both] [--at s]   the final video and a still   direction

Departments: ${DEPARTMENTS.join(", ")}. Times are in seconds, places in metres, angles in degrees.`;

class Refusal extends Error {}
const refuse = (why: string): never => {
  throw new Refusal(why);
};

// ── The words on the line ────────────────────────────────────────────────────────────────────────────────────────────
const [command = "help", ...rest] = process.argv.slice(2);
const flags: Record<string, string> = {};
/** Flags that take no value. */
const SWITCHES = new Set(["keep", "clear"]);
const pairs: Record<string, string> = {};
const positional: string[] = [];
for (let i = 0; i < rest.length; i++) {
  const word = rest[i]!;
  if (word.startsWith("--")) {
    const body = word.slice(2);
    const equals = body.indexOf("=");
    if (equals >= 0) flags[body.slice(0, equals)] = body.slice(equals + 1);
    else if (SWITCHES.has(body)) flags[body] = "true";
    else flags[body] = rest[++i] ?? "";
  } else if (/^[a-z][a-z0-9-]*=/.test(word)) {
    const at = word.indexOf("=");
    pairs[word.slice(0, at)] = word.slice(at + 1);
  } else positional.push(word);
}

const number = (name: string, fallback?: number) => {
  if (!(name in flags)) return fallback ?? refuse(`--${name} is needed`);
  const value = Number(flags[name]);
  return Number.isFinite(value) ? value : refuse(`--${name} takes a number, not "${flags[name]}"`);
};
const aspectFlag = (): Aspect | undefined => {
  const value = flags.aspect;
  if (value === undefined) return undefined;
  return value === "wide" || value === "vertical" ? value : refuse(`--aspect is wide or vertical, not "${value}"`);
};

// ── Who is asking ────────────────────────────────────────────────────────────────────────────────────────────────────
const agent = flags.agent;
const session = flags.session;
let department: Department | "director" = "director";
/** He and Claude are the director; an agent is its department, from --department or its profile (Cinema-Agents.md R2). */
function identify() {
  if (Boolean(agent) !== Boolean(session)) refuse("an agent's command names both --agent and --session");
  if (!agent) return;
  if (!isId(agent) || !isId(session!)) refuse("an agent's id and its session's are lower case letters, digits and dashes");
  const named = flags.department ?? departmentOf(agent) ?? refuse(`${agent} has no department: give --department`);
  department = (DEPARTMENTS as readonly string[]).includes(named) ? (named as Department) : refuse(`no department called ${named}`);
}
/** He and Claude may do anything; an agent only its own department's work. */
function allow(...departments: Department[]) {
  if (department !== "director" && !departments.includes(department))
    refuse(`${agent} works in ${department}; this is ${departments.join(" or ")}'s work`);
}
function record(line: Record<string, unknown>) {
  if (agent && session) appendSession(agent, session, line);
}

// ── The library ──────────────────────────────────────────────────────────────────────────────────────────────────────
let library: Library;
async function open() {
  const content = (await import(pathToFileURL(path.join(DATA, "index.ts")).href)) as { ENTRIES: Entry[] };
  library = makeLibrary(content.ENTRIES);
}

/** `orbit` is the newest version; `orbit@1` that one. */
function entryNamed(name: string | undefined) {
  if (!name) return refuse("name an entry (see `entries`)");
  const [id, version] = name.split("@") as [string, string | undefined];
  const entry = version ? library.find(id, Number(version)) : library.latest(id);
  return entry ?? refuse(`the library has no ${name} (see \`entries\`)`);
}
function valuesFor(entry: Entry, raw: Record<string, string>): Values {
  const byId = new Map(entry.controls.map((control) => [control.id, control]));
  const values: Values = {};
  for (const [id, text] of Object.entries(raw)) {
    const control = byId.get(id) ?? refuse(`${entry.id} has no control called ${id}; it has ${entry.controls.map((c) => c.id).join(", ")}`);
    values[id] = parse(control, text);
  }
  const problems = check(entry.controls, values);
  return problems.length ? refuse(problems.join("; ")) : values;
}
/** The screen's change and the command's are one (`engine/edit.ts`); its reasons become a refusal. */
function edited(shot: Shot, target: string, values: Values) {
  try {
    return setControls(shot, target, values, library);
  } catch (error) {
    return refuse(error instanceof Error ? error.message : String(error));
  }
}
/** `control=value` pairs read against the controls of the asset standing in a cell (or about to). */
function valuesForCell(shot: Shot, key: string): Values {
  const world = shot.world ?? refuse(`${shot.id} has no world yet`);
  const entry = entryOf(world);
  if (entry.kind !== "environment" || !entry.grid) return refuse(`${tag(world)} is not a grid: it has no cells`);
  const [layerId, place] = key.includes(":") ? (key.split(":") as [string, string]) : [undefined, key];
  const [column, row] = place.split(",").map(Number);
  const spec = entry.grid(resolve(entry.controls, world.values));
  const layer = layerId ? (spec.layers?.find((l) => l.id === layerId) ?? refuse(`the grid has no layer called ${layerId}`)) : undefined;
  const rule = (layer?.rule ?? spec.rule)(column ?? 0, row ?? 0);
  const ref = "asset" in flags ? (flags.asset === "none" ? "" : flags.asset) : (world.cells?.[key]?.asset ?? rule);
  const book = readAssets();
  const [id, version] = (ref ?? "").split("@");
  const standing = id ? (version ? book[id]?.find((v) => v.version === Number(version)) : book[id]?.at(-1)) : undefined;
  if (!standing) return refuse(`no asset stands in ${key} to tune`);
  return valuesFor(library.find(standing.use.entry, standing.use.version) ?? refuse(`${standing.use.entry}@${standing.use.version} is not in the library`), pairs);
}

/** The values an entry's controls still take, from a use of another version of it. */
function keepable(entry: Entry, values: Values): Values {
  return Object.fromEntries(
    Object.entries(values).filter(([id, value]) => {
      const control = entry.controls.find((c) => c.id === id);
      return control !== undefined && problem(control, value) === undefined;
    }),
  );
}
const entryOf = (use: Use) => library.find(use.entry, use.version) ?? refuse(`${use.entry}@${use.version} is not in the library`);
const tag = (use: Use) => `${use.entry}@${use.version}`;

// ── The shot ─────────────────────────────────────────────────────────────────────────────────────────────────────────
function draftOf(id: string | undefined) {
  if (!id) return refuse("name a shot (see `shots`)");
  return readDraft(id) ?? refuse(`there is no shot called ${id} (see \`shots\`)`);
}
function save(shot: Shot, line: Record<string, unknown>) {
  const saved = saveDraft(shot);
  record({ type: "command", command, shot: shot.id, rev: saved.rev, ...line });
  return saved;
}
/** The shot a render draws: a published version, or the draft; in another frame if asked. */
function toRender(id: string | undefined) {
  const version = "version" in flags ? number("version") : undefined;
  const shot = version === undefined ? draftOf(id) : (readVersion(id ?? "", version) ?? refuse(`${id} has no version ${version}`));
  const aspect = aspectFlag();
  return { shot: aspect ? { ...shot, frame: { ...shot.frame, aspect } } : shot, version: version ?? "draft" };
}
const placeOf = (shot: Shot, id: string) => shot.cast.find((placement) => placement.id === id);
const at = (): [number, number] => {
  const [x, z] = (flags.at ?? refuse("--at x,z is needed")).split(",").map(Number);
  return Number.isFinite(x) && Number.isFinite(z) ? [x!, z!] : refuse(`--at is two numbers, x,z, not "${flags.at}"`);
};
const output = (kind: "renders" | "exports", shot: Shot) => outputDir(kind, shot.id, agent && session ? { id: agent, session } : undefined);
const seconds = (t: number) => `${Number(t.toFixed(2))}s`;

// ── The commands ─────────────────────────────────────────────────────────────────────────────────────────────────────
async function run(): Promise<string> {
  identify();
  await open();
  const [shotId, target] = positional;
  switch (command) {
    case "help":
      return HELP;

    case "shots": {
      const shots = listShots();
      const where = PRIVATE ? "his private folder" : "the sample (no private folder here)";
      if (!shots.length) return `No shots yet in ${where}.`;
      return [`Shots in ${where}:`, ...shots.map((s) => `  ${s.id}  "${s.title}"  draft rev ${s.rev}  versions ${s.versions.join(", ") || "none"}`)].join("\n");
    }

    case "show": {
      const shot = "version" in flags ? readVersion(shotId ?? "", number("version")) : draftOf(shotId);
      return JSON.stringify(shot ?? refuse(`${shotId} has no such version`), null, 2);
    }

    case "entries": {
      const kinds = (shotId ? [shotId] : ["environment", "cast", "camera", "light"]) as Entry["kind"][];
      return kinds.flatMap((kind) => library.ofKind(kind).map((entry) => [
        `${entry.id}@${entry.version}  ${entry.kind}  ${entry.label}: ${entry.description}`,
        ...entry.controls.map((c) => {
          const range = c.kind === "number" || c.kind === "angle" ? `${c.min}…${c.max}${c.kind === "number" && c.unit ? ` ${c.unit}` : c.kind === "angle" ? "°" : ""}` : c.kind === "choice" ? c.options.join(" | ") : c.kind;
          return `    ${c.id} = ${String(c.default)}   (${range})${c.help ? `  ${c.help}` : ""}`;
        }),
      ].join("\n"))).join("\n\n");
    }

    case "new": {
      allow("direction");
      if (!shotId || !isId(shotId)) refuse("a shot's id is lower case letters, digits and dashes");
      if (readDraft(shotId!)) refuse(`there is already a shot called ${shotId}`);
      const frame: Partial<Frame> = {};
      const aspect = aspectFlag();
      if (aspect) frame.aspect = aspect;
      if ("size" in flags) frame.size = number("size");
      if ("fps" in flags) frame.fps = number("fps");
      const shot = save({ ...newShot(shotId!, flags.title ?? shotId!, frame), rev: -1 }, { frame });
      return `made ${shot.id}, "${shot.title}", ${shot.frame.aspect} at ${shot.frame.size}px, ${shot.frame.fps} fps`;
    }

    case "world": {
      allow("set");
      const shot = draftOf(shotId);
      const entry = entryNamed(target);
      if (entry.kind !== "environment") refuse(`${entry.id} is a ${entry.kind}, not an environment`);
      const values = valuesFor(entry, pairs);
      // The same entry, at this version or another, keeps every value its controls still take (E4: a shot moved on to
      // an entry's next version keeps what was tuned).
      const previous = shot.world && (shot.world.entry === entry.id || "keep" in flags) ? shot.world : undefined;
      const kept = previous ? keepable(entry, previous.values) : {};
      const world: Use = { entry: entry.id, version: entry.version, values: { ...kept, ...values } };
      // A grid keeps the cells he set by hand when it moves on to its next version.
      if (previous?.cells && entry.kind === "environment" && entry.grid) world.cells = previous.cells;
      const changed = previous && tag(previous) !== tag(world);
      const saved = save({ ...shot, world }, { target: "world", entry: tag(world), values, ...(changed ? { from: tag(previous) } : {}) });
      const moved = changed ? `, moved on from ${tag(previous)} keeping ${Object.keys(kept).length} of its ${Object.keys(previous.values).length} values` : "";
      return `${shot.id}'s world is ${tag(world)}${moved}${Object.keys(values).length ? `, with ${Object.keys(values).join(", ")} set` : ""} · rev ${saved.rev}`;
    }

    case "assets": {
      const book = readAssets();
      const ids = Object.keys(book).sort();
      if (!ids.length) return "No assets saved yet: tune a world, then `asset save \"<name>\" --from <shot>`.";
      return ids.map((id) => {
        const versions = book[id]!;
        const newest = versions.at(-1)!;
        return `  ${id}  "${newest.name}"  ${newest.use.entry}@${newest.use.version}  versions ${versions.map((v) => v.version).join(", ")}  (newest saved ${newest.saved.slice(0, 16).replace("T", " ")})`;
      }).join("\n");
    }

    case "asset": {
      if (shotId !== "save") refuse("say `asset save \"<name>\" --from <shot>`");
      allow("set");
      const name = target ?? refuse("name the asset: `asset save \"<name>\" --from <shot>`");
      const from = draftOf(flags.from);
      const world = from.world ?? refuse(`${from.id} has no world to save`);
      const its = entryOf(world);
      if (its.kind === "environment" && its.grid) refuse(`${from.id}'s world is a grid of assets; an asset is one tile`);
      const asset = saveAsset(name, world);
      record({ type: "command", command: "asset save", shot: from.id, rev: from.rev, asset: `${asset.id}@${asset.version}`, name: asset.name });
      return `saved "${asset.name}" as ${asset.id} version ${asset.version} (${tag(world)}, ${Object.keys(world.values).length} values)`;
    }

    case "cell": {
      allow("set");
      const shot = draftOf(shotId);
      const key = target ?? refuse("name a cell: column,row, like 2,3");
      const change = {
        ...("asset" in flags ? { asset: flags.asset === "none" ? "" : flags.asset } : {}),
        ...(Object.keys(pairs).length ? { values: valuesForCell(shot, key) } : {}),
        ...("clear" in flags ? { clear: true } : {}),
      };
      let next: Shot;
      try {
        next = setCell(shot, key, change, library, readAssets());
      } catch (error) {
        return refuse(error instanceof Error ? error.message : String(error));
      }
      const saved = save(next, { target: `cell ${key}`, ...change });
      const cell = saved.world?.cells?.[key];
      return `cell ${key}: ${cell ? `${cell.asset === undefined ? "the rules' asset" : cell.asset || "empty"}${cell.values ? `, with ${Object.keys(cell.values).join(", ")} tuned` : ""}` : "back to the rules"} · rev ${saved.rev}`;
    }

    case "place": {
      allow("direction", "cast");
      const shot = draftOf(shotId);
      const entry = entryNamed(target);
      if (entry.kind !== "cast") refuse(`${entry.id} is a ${entry.kind}, not a cast member`);
      const id = flags.id ?? nextId(shot.cast.map((p) => p.id), entry.id);
      if (!isId(id) || placeOf(shot, id)) refuse(`${id} is taken or not an id`);
      const placement: Placement = { id, name: flags.name ?? entry.label, entry: entry.id, version: entry.version, values: valuesFor(entry, pairs), at: at(), facing: number("facing", 0) };
      const saved = save({ ...shot, cast: [...shot.cast, placement] }, { target: id, entry: tag(placement), values: placement.values, at: placement.at, facing: placement.facing });
      return `placed ${id} (${tag(placement)}) at ${placement.at.join(", ")} facing ${placement.facing}° · rev ${saved.rev}`;
    }

    case "add": {
      const shot = draftOf(shotId);
      const entry = entryNamed(target);
      if (entry.kind !== "camera" && entry.kind !== "light") refuse(`${entry.id} is ${entry.kind === "environment" ? "the world (use \`world\`)" : "cast (use \`place\`)"}`);
      const kind = entry.kind as TrackKind;
      allow(TRACK_DEPARTMENT[kind]);
      const start = number("start");
      const length = number("length");
      if (start < 0 || length <= 0) refuse("--start is 0 or more, --length more than 0");
      const id = nextId(itemsOf(shot).keys(), kind);
      const item = { id, entry: entry.id, version: entry.version, start, length, values: valuesFor(entry, pairs) };
      const tracks = shot.tracks.some((track) => track.kind === kind)
        ? shot.tracks.map((track) => (track.kind === kind ? { ...track, items: [...track.items, item] } : track))
        : [...shot.tracks, { id: kind, kind, items: [item] }];
      const saved = save({ ...shot, tracks }, { target: id, entry: tag(item), start, length, values: item.values });
      return `added ${id} (${tag(item)}) to ${kind} from ${seconds(start)} for ${seconds(length)} · shot is ${seconds(shotLength(saved))} · rev ${saved.rev}`;
    }

    case "set": {
      const shot = draftOf(shotId);
      if (!target) refuse("say what to set: world, a cast member's id, or an item's id");
      if (target === "world") {
        allow("set");
        const use = shot.world ?? refuse(`${shot.id} has no world yet (use \`world\`)`);
        const values = valuesFor(entryOf(use), pairs);
        const saved = save(edited(shot, target, values), { target, entry: tag(use), values });
        return `set the world's ${Object.keys(values).join(", ") || "nothing"} · rev ${saved.rev}`;
      }
      const placement = placeOf(shot, target!);
      if (placement) {
        allow("direction", "cast");
        const values = valuesFor(entryOf(placement), pairs);
        const withValues = edited(shot, target!, values);
        const next = { ...placeOf(withValues, target!)!, ...("at" in flags ? { at: at() } : {}), ...("facing" in flags ? { facing: number("facing") } : {}) };
        const saved = save({ ...withValues, cast: withValues.cast.map((p) => (p.id === target ? next : p)) }, { target, entry: tag(next), values, at: next.at, facing: next.facing });
        return `set ${target}: ${[...Object.keys(values), ...("at" in flags ? ["at"] : []), ...("facing" in flags ? ["facing"] : [])].join(", ") || "nothing"} · rev ${saved.rev}`;
      }
      const found = itemsOf(shot).get(target!) ?? refuse(`${shot.id} has no ${target}`);
      allow(TRACK_DEPARTMENT[found.track.kind]);
      const values = valuesFor(entryOf(found.item), pairs);
      const saved = save(edited(shot, target!, values), { target, entry: tag(found.item), values });
      return `set ${target}'s ${Object.keys(values).join(", ") || "nothing"} · rev ${saved.rev}`;
    }

    case "move":
    case "trim": {
      const shot = draftOf(shotId);
      const found = itemsOf(shot).get(target ?? "") ?? refuse(`${shotId} has no item ${target}`);
      allow(TRACK_DEPARTMENT[found.track.kind]);
      const change: { start?: number; length?: number } = command === "move" ? { start: number("start") } : { length: number("length") };
      if ((change.start ?? 0) < 0 || (change.length ?? 1) <= 0) refuse("a start is 0 or more, a length more than 0");
      const tracks = shot.tracks.map((track) => ({ ...track, items: track.items.map((item) => (item.id === target ? { ...item, ...change } : item)) }));
      const saved = save({ ...shot, tracks }, { target, ...change });
      return `${command === "move" ? "moved" : "trimmed"} ${target} · shot is ${seconds(shotLength(saved))} · rev ${saved.rev}`;
    }

    case "remove": {
      const shot = draftOf(shotId);
      if (placeOf(shot, target ?? "")) {
        allow("direction", "cast");
        const saved = save({ ...shot, cast: shot.cast.filter((p) => p.id !== target) }, { target });
        return `removed ${target} · rev ${saved.rev}`;
      }
      const found = itemsOf(shot).get(target ?? "") ?? refuse(`${shotId} has no ${target}`);
      allow(TRACK_DEPARTMENT[found.track.kind]);
      const tracks = shot.tracks.map((track) => ({ ...track, items: track.items.filter((item) => item.id !== target) })).filter((track) => track.items.length);
      const saved = save({ ...shot, tracks }, { target });
      return `removed ${target} · rev ${saved.rev}`;
    }

    case "frame": {
      allow("direction", "camera");
      const shot = draftOf(shotId);
      const frame: Frame = { ...shot.frame, ...(aspectFlag() ? { aspect: aspectFlag()! } : {}), ...("size" in flags ? { size: number("size") } : {}), ...("fps" in flags ? { fps: number("fps") } : {}) };
      if (frame.size < 90 || frame.size > 4320 || frame.fps < 1 || frame.fps > 120) refuse("a frame's size runs 90 to 4320px, its rate 1 to 120 fps");
      const saved = save({ ...shot, frame }, { frame });
      return `${shot.id} is ${frame.aspect} at ${frame.size}px, ${frame.fps} fps · rev ${saved.rev}`;
    }

    case "publish": {
      allow("direction");
      const shot = draftOf(shotId);
      const version = publish(shot.id, pinAssets(shot, library, readAssets()));
      record({ type: "command", command, shot: shot.id, rev: shot.rev, version });
      return `published ${shot.id} version ${version} (draft rev ${shot.rev})`;
    }

    case "still": {
      const { shot, version } = toRender(shotId);
      const t = number("at");
      const file = path.join(output("renders", shot), `${shot.id}-${version === "draft" ? `r${shot.rev}` : `v${version}`}-${shot.frame.aspect}-${t.toFixed(2)}s.png`);
      await still(shot, t, file, readAssets());
      record({ type: "render", kind: "still", shot: shot.id, version, rev: shot.rev, frame: shot.frame, t, artifact: relative(file) });
      return relative(file);
    }

    case "sheet": {
      const { shot, version } = toRender(shotId);
      const count = Math.max(2, Math.min(48, number("count", 12)));
      const columns = Math.max(1, Math.min(count, number("columns", 4)));
      const length = shotLength(shot);
      const times = Array.from({ length: count }, (_, i) => (length * (i + 0.5)) / count);
      const small = { ...shot, frame: scaled(shot.frame, 0.3) };
      const file = path.join(output("renders", shot), `${shot.id}-${version === "draft" ? `r${shot.rev}` : `v${version}`}-${shot.frame.aspect}-sheet.png`);
      await sheet(small, times, columns, file, readAssets());
      record({ type: "render", kind: "sheet", shot: shot.id, version, rev: shot.rev, frame: shot.frame, times, artifact: relative(file) });
      return `${relative(file)}  (${count} stills, at ${times.map(seconds).join(" ")})`;
    }

    case "clip": {
      const { shot, version } = toRender(shotId);
      const from = number("from", 0);
      const to = Math.min(number("to", shotLength(shot)), shotLength(shot));
      if (to <= from) refuse("--to comes after --from");
      const small = { ...shot, frame: scaled(shot.frame, Math.max(0.1, Math.min(1, number("scale", 0.5)))) };
      const file = path.join(output("renders", shot), `${shot.id}-${version === "draft" ? `r${shot.rev}` : `v${version}`}-${shot.frame.aspect}-${from}-${to}s.mp4`);
      await video(small, frameTimes(shot.frame.fps, from, to), file, "check", readAssets());
      record({ type: "render", kind: "clip", shot: shot.id, version, rev: shot.rev, frame: small.frame, from, to, artifact: relative(file) });
      return relative(file);
    }

    case "export": {
      allow("direction");
      const id = shotId ?? refuse("name a shot");
      const published = versionsOf(id);
      const version = "version" in flags ? number("version") : (published.at(-1) ?? refuse(`${id} has no published version yet: publish it first`));
      const shot = readVersion(id, version) ?? refuse(`${id} has no version ${version}`);
      const which = flags.aspect ?? shot.frame.aspect;
      const aspects: Aspect[] = which === "both" ? ["wide", "vertical"] : which === "wide" || which === "vertical" ? [which] : refuse("--aspect is wide, vertical or both");
      const length = shotLength(shot);
      const moment = number("at", length / 2);
      const made: string[] = [];
      for (const aspect of aspects) {
        const framed = { ...shot, frame: { ...shot.frame, aspect } };
        const name = path.join(output("exports", shot), `${shot.id}-v${version}-${aspect}`);
        const times = frameTimes(shot.frame.fps, 0, length);
        process.stderr.write(`exporting ${shot.id} v${version} ${aspect}: ${times.length} frames…\n`);
        await video(framed, times, `${name}.mp4`, "final", readAssets(), (done) => {
          if (done % 30 === 0 || done === times.length) process.stderr.write(`  ${done}/${times.length}\r`);
        });
        process.stderr.write("\n");
        await still(framed, moment, `${name}.png`, readAssets());
        made.push(relative(`${name}.mp4`), relative(`${name}.png`));
        record({ type: "render", kind: "export", shot: shot.id, version, frame: framed.frame, artifact: [relative(`${name}.mp4`), relative(`${name}.png`)] });
      }
      return made.join("\n");
    }

    default:
      return refuse(`no command called ${command} (see \`help\`)`);
  }
}

try {
  console.log(await run());
} catch (error) {
  if (error instanceof Refusal) {
    console.error(`refused: ${error.message}`);
    process.exit(2);
  }
  console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
