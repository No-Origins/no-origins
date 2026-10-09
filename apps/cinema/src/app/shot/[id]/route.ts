import { ENTRIES } from "@cinema/content";

import { isId, readAssets, readDraft, readVersion, saveDraft } from "@/data/store";
import { setCell, setControls, type CellChange } from "@/engine/edit";
import { makeLibrary } from "@/engine/library";
import type { Values } from "@/engine/types";

const library = makeLibrary(ENTRIES);

/**
 * A shot's draft as it is now, for the screen to watch for changes (`rev`) while the commands run; with `?version=n`,
 * that published version, which never changes.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isId(id)) return new Response("Not a shot's id.", { status: 400 });
  const version = new URL(request.url).searchParams.get("version");
  const shot = version ? readVersion(id, Number(version)) : readDraft(id);
  return shot ? Response.json(shot, { headers: { "cache-control": "no-store" } }) : new Response("No such shot.", { status: 404 });
}

/**
 * The screen setting controls, or a cell of a grid (Cinema-Engine.md E6): the same changes the `set` and `cell` commands
 * make (`engine/edit.ts`), from
 * the revision the screen last saw. A write from an older revision is refused, not merged, and the screen is sent what
 * is there now (Motion.md M20's drafts work the same way).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isId(id)) return Response.json({ refused: "Not a shot's id." }, { status: 400 });
  const draft = readDraft(id);
  if (!draft) return Response.json({ refused: "No such shot." }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { rev?: number; target?: string; values?: Values; cell?: CellChange & { key: string } } | null;
  const valid = body && typeof body.rev === "number" && (body.cell ? typeof body.cell.key === "string" : typeof body.target === "string" && body.values);
  if (!valid) return Response.json({ refused: "Send rev, and target and values, or a cell." }, { status: 400 });
  if (body.rev !== draft.rev) return Response.json({ refused: "The shot changed since the screen last saw it.", shot: draft }, { status: 409 });
  try {
    const { key, ...change } = body.cell ?? { key: "" };
    const next = body.cell ? setCell(draft, key, change, library, readAssets()) : setControls(draft, body.target!, body.values!, library);
    return Response.json(saveDraft(next));
  } catch (error) {
    return Response.json({ refused: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
