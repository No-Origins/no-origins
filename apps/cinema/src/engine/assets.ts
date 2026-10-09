import type { Library } from "./library.ts";
import type { AssetBook, AssetVersion, Shot, Use } from "./types.ts";

/**
 * His assets (his word, 2026-10-09): configurations of an entry saved under his names, versioned. Pure: the book is
 * read from disk by the store and handed in.
 */

/** An asset's id from his name for it: "Stage mountain" is `stage-mountain`. */
export function assetId(name: string) {
  return name.trim().toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}

/** The asset a reference names: `stage` is its newest version, `stage@2` that one. */
export function findAsset(book: AssetBook, ref: string | undefined): AssetVersion | undefined {
  if (!ref) return undefined;
  const [id, version] = ref.split("@") as [string, string | undefined];
  const versions = book[id];
  if (!versions?.length) return undefined;
  return version ? versions.find((v) => v.version === Number(version)) : versions.at(-1);
}

/** Every asset reference a use makes: its controls of the asset kind, and its cells. */
function refsOf(use: Use, library: Library) {
  const entry = library.find(use.entry, use.version);
  const controls = entry ? entry.controls.filter((c) => c.kind === "asset").map((c) => c.id) : [];
  return { controls, cells: Object.keys(use.cells ?? {}) };
}

/**
 * A shot with every asset it refers to pinned to the version it uses now (`stage` becomes `stage@2`), as publishing
 * does (Cinema-Engine.md E3): a published version plays as it was made, whatever he saves later.
 */
export function pinAssets(shot: Shot, library: Library, book: AssetBook): Shot {
  const pin = (ref: unknown) => {
    if (typeof ref !== "string" || !ref || ref.includes("@")) return ref;
    const found = findAsset(book, ref);
    return found ? `${found.id}@${found.version}` : ref;
  };
  const pinned = (use: Use): Use => {
    const { controls, cells } = refsOf(use, library);
    if (!controls.length && !cells.length) return use;
    const values = { ...use.values };
    for (const id of controls) values[id] = pin(values[id]) as string;
    const next: Use = { ...use, values };
    if (use.cells) next.cells = Object.fromEntries(Object.entries(use.cells).map(([key, cell]) => [key, cell.asset ? { ...cell, asset: pin(cell.asset) as string } : cell]));
    return next;
  };
  return { ...shot, world: shot.world ? pinned(shot.world) : null };
}
