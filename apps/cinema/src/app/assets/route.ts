import { ENTRIES } from "@cinema/content";

import { isId, readAssets, readDraft, saveAsset } from "@/data/store";
import { makeLibrary } from "@/engine/library";

const library = makeLibrary(ENTRIES);

/** His saved assets (his word, 2026-10-09), every version. */
export async function GET() {
  return Response.json(readAssets(), { headers: { "cache-control": "no-store" } });
}

/**
 * Saves a shot's world, as it is in the draft now, as an asset under his name: a new asset, or the next version of the
 * one with that name. The same as the `asset save` command. A grid of assets is not an asset: an asset is one tile.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: string; from?: string } | null;
  if (!body?.name?.trim() || !body.from || !isId(body.from)) return Response.json({ refused: "Send a name, and the shot to save from." }, { status: 400 });
  const world = readDraft(body.from)?.world;
  if (!world) return Response.json({ refused: "That shot has no world to save." }, { status: 404 });
  const entry = library.find(world.entry, world.version);
  if (entry?.kind === "environment" && entry.grid) return Response.json({ refused: "A grid of assets is not an asset: an asset is one tile." }, { status: 422 });
  try {
    const asset = saveAsset(body.name, world);
    return Response.json({ asset, assets: readAssets() });
  } catch (error) {
    return Response.json({ refused: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
