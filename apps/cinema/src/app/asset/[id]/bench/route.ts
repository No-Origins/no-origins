import { ASSETS, ENTRIES } from "@cinema/content";

import { isId, readBench, saveBench } from "@/data/store";
import { benchFor } from "@/engine/bench";
import { check } from "@/engine/controls";
import { makeLibrary } from "@/engine/library";
import type { Values } from "@/engine/types";

const library = makeLibrary(ENTRIES);

/** The bench of an asset of the Assets section, as it is now (Cinema-Engine.md E1). */
function benchOf(id: string) {
  return isId(id) && ASSETS.includes(id) ? benchFor(id, readBench(id), library) : undefined;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bench = benchOf((await params).id);
  return bench ? Response.json(bench, { headers: { "cache-control": "no-store" } }) : new Response("No such asset.", { status: 404 });
}

/**
 * The screen setting the asset's controls on its bench, from the revision it last saw: a write from an older one is
 * refused and sent what is there now, as a shot's draft is (`/shot/[id]`).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bench = benchOf((await params).id);
  if (!bench) return Response.json({ refused: "No such asset." }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { rev?: number; values?: Values } | null;
  if (!body || typeof body.rev !== "number" || !body.values) return Response.json({ refused: "Send rev and values." }, { status: 400 });
  if (body.rev !== bench.rev) return Response.json({ refused: "The bench changed since the screen last saw it.", bench }, { status: 409 });
  const entry = library.find(bench.asset, bench.version)!;
  const problems = check(entry.controls, body.values);
  if (problems.length) return Response.json({ refused: problems.join("; ") }, { status: 422 });
  return Response.json(saveBench({ ...bench, values: { ...bench.values, ...body.values } }));
}
