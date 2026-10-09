import { ENTRIES } from "@cinema/content";

import { isId, readAssets, saveAsset } from "@/data/store";
import { assetId } from "@/engine/assets";
import { configurationsOf } from "@/engine/bench";
import { check, resolve } from "@/engine/controls";
import { makeLibrary } from "@/engine/library";
import type { Values } from "@/engine/types";
import { sectionOf } from "@/lib/sections";

const library = makeLibrary(ENTRIES);
const entryOf = (id: string) => (isId(id) && sectionOf(id) ? library.latest(id) : undefined);

/** The configurations he has saved of this asset (or effect), the newest version of each. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!entryOf(id)) return new Response("No such asset.", { status: 404 });
  return Response.json(configurationsOf(readAssets(), id, library), { headers: { "cache-control": "no-store" } });
}

/**
 * Saves a configuration of this asset from the bench (his, 2026-10-09: "if I like the configuration, I should be able
 * to save it… add description to the saved configuration so that agents can understand when to use it"): every one of
 * the asset's values, resolved, under his name and with his description. The same name saves its next version; a name
 * already given to a configuration of another asset is refused.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = entryOf(id);
  if (!entry) return Response.json({ refused: "No such asset." }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { name?: string; description?: string; values?: Values } | null;
  if (!body?.name?.trim() || !body.values) return Response.json({ refused: "Name it first." }, { status: 400 });
  const problems = check(entry.controls, body.values);
  if (problems.length) return Response.json({ refused: problems.join("; ") }, { status: 422 });
  const book = readAssets();
  const taken = book[assetId(body.name)]?.at(-1);
  if (taken && library.idOf(taken.use.entry) !== entry.id) {
    return Response.json({ refused: `“${taken.name}” is a configuration of ${library.latest(taken.use.entry)?.label ?? taken.use.entry}: give this one another name.` }, { status: 422 });
  }
  try {
    const saved = saveAsset(body.name, { entry: entry.id, version: entry.version, values: resolve(entry.controls, body.values) }, body.description);
    return Response.json({ saved, configurations: configurationsOf(readAssets(), id, library) });
  } catch (error) {
    return Response.json({ refused: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
