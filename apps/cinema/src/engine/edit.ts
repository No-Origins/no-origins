import { check, resolve } from "./controls.ts";
import type { Library } from "./library.ts";
import { findAsset } from "./assets.ts";
import type { AssetBook, Cell, Shot, TrackKind, Use, Values } from "./types.ts";

/**
 * Setting controls (Cinema-Engine.md E6): the one change the screen and the `set` command share, so a value set by
 * hand and one set by an agent are checked the same way. Pure: it returns the changed shot and saves nothing.
 */

/** What a target names in a shot: its world, a cast member (by id), or an item on a track (by id). */
export function findUse(shot: Shot, target: string): { use: Use; where: "world" | "cast" | TrackKind } | undefined {
  if (target === "world") return shot.world ? { use: shot.world, where: "world" } : undefined;
  const placement = shot.cast.find((p) => p.id === target);
  if (placement) return { use: placement, where: "cast" };
  for (const track of shot.tracks) {
    const item = track.items.find((i) => i.id === target);
    if (item) return { use: item, where: track.kind };
  }
  return undefined;
}

/** The shot with `values` set over the target's, after checking them against its entry's controls. */
export function setControls(shot: Shot, target: string, values: Values, library: Library): Shot {
  const found = findUse(shot, target);
  if (!found) throw new Error(target === "world" ? `${shot.id} has no world yet` : `${shot.id} has no ${target}`);
  const entry = library.find(found.use.entry, found.use.version);
  if (!entry) throw new Error(`${found.use.entry}@${found.use.version} is not in the library`);
  const problems = check(entry.controls, values);
  if (problems.length) throw new Error(problems.join("; "));
  const merge = <T extends Use>(use: T): T => ({ ...use, values: { ...use.values, ...values } });
  if (found.where === "world") return { ...shot, world: merge(shot.world!) };
  if (found.where === "cast") return { ...shot, cast: shot.cast.map((p) => (p.id === target ? merge(p) : p)) };
  return { ...shot, tracks: shot.tracks.map((track) => ({ ...track, items: track.items.map((i) => (i.id === target ? merge(i) : i)) })) };
}

/** A change to one cell of the world's grid: which asset stands there, its own values, or back to the rules. */
export type CellChange = { asset?: string; values?: Values; clear?: boolean };

const CELL = /^(?:([a-z]+):)?(\d{1,2}),(\d{1,2})$/;

/**
 * The shot with one cell of its world changed (his: rules fill the grid, then he changes cells by hand). `asset` puts
 * an asset there ("" keeps it empty, "rules" hands it back to the rules); `values` tune that copy, checked against the
 * controls of the asset standing there; `clear` hands the whole cell back to the rules.
 */
export function setCell(shot: Shot, key: string, change: CellChange, library: Library, book: AssetBook): Shot {
  if (!shot.world) throw new Error(`${shot.id} has no world yet`);
  const world = shot.world;
  const entry = library.find(world.entry, world.version);
  if (entry?.kind !== "environment" || !entry.grid) throw new Error(`${world.entry}@${world.version} is not a grid: it has no cells`);
  const match = CELL.exec(key);
  if (!match) throw new Error(`a cell is "column,row", like 2,3, or "<layer>:column,row" for a layer, like clouds:2,3`);
  const [column, row] = [Number(match[2]), Number(match[3])];
  const spec = entry.grid(resolve(entry.controls, world.values));
  if (column < 1 || row < 1 || column > spec.columns || row > spec.rows) throw new Error(`the grid is ${spec.columns} by ${spec.rows}; there is no cell ${key}`);
  const layer = match[1] ? spec.layers?.find((l) => l.id === match[1]) : undefined;
  if (match[1] && !layer) throw new Error(`the grid has no layer called ${match[1]}${spec.layers?.length ? ` (it has ${spec.layers.map((l) => l.id).join(", ")})` : ""}`);
  const rule = layer ? layer.rule : spec.rule;
  const cells = { ...(world.cells ?? {}) };
  if (change.clear) {
    delete cells[key];
    return { ...shot, world: { ...world, cells } };
  }
  const cell: Cell = { ...cells[key] };
  if (change.asset !== undefined) {
    if (change.asset === "rules") delete cell.asset;
    else if (change.asset === "") {
      // Nothing stands in an empty cell, so there is no copy to tune.
      cell.asset = "";
      delete cell.values;
    }
    else {
      const asset = findAsset(book, change.asset);
      if (!asset) throw new Error(`there is no asset called ${change.asset} (see \`assets\`)`);
      if (layer?.of && asset.use.entry !== layer.of) throw new Error(`the ${layer.label.toLowerCase()} layer takes ${layer.of} assets; ${asset.name} is ${asset.use.entry === "asset" ? "an" : "a"} ${asset.use.entry}`);
      // The ground takes no asset a layer over it is for: a cloud stands in the clouds, never on the ground.
      const over = !layer ? spec.layers?.find((l) => l.of === asset.use.entry) : undefined;
      if (over) throw new Error(`${asset.name} is a ${asset.use.entry}: it goes in the ${over.label.toLowerCase()} layer (${over.id}:${column},${row})`);
      cell.asset = change.asset;
    }
  }
  if (change.values && Object.keys(change.values).length) {
    const standing = findAsset(book, cell.asset ?? rule(column, row));
    if (!standing) throw new Error(`no asset stands in ${key} to tune`);
    const its = library.find(standing.use.entry, standing.use.version);
    if (!its) throw new Error(`${standing.use.entry}@${standing.use.version} is not in the library`);
    const problems = check(its.controls, change.values);
    if (problems.length) throw new Error(problems.join("; "));
    cell.values = { ...cell.values, ...change.values };
  }
  if (cell.asset === undefined && !cell.values) delete cells[key];
  else cells[key] = cell;
  return { ...shot, world: { ...world, cells } };
}
