import { ENTRIES } from "@cinema/content";

import { isId, readDraft, saveDraft } from "@/data/store";
import { setControls } from "@/engine/edit";
import { makeLibrary } from "@/engine/library";
import type { Values } from "@/engine/types";

const library = makeLibrary(ENTRIES);

/** A shot's draft as it is now, for the screen to watch for changes (`rev`) while the commands run. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isId(id)) return new Response("Not a shot's id.", { status: 400 });
  const shot = readDraft(id);
  return shot ? Response.json(shot, { headers: { "cache-control": "no-store" } }) : new Response("No such shot.", { status: 404 });
}

/**
 * The screen setting controls (Cinema-Engine.md E6): the same change the `set` command makes (`engine/edit.ts`), from
 * the revision the screen last saw. A write from an older revision is refused, not merged, and the screen is sent what
 * is there now (Motion.md M20's drafts work the same way).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isId(id)) return Response.json({ refused: "Not a shot's id." }, { status: 400 });
  const draft = readDraft(id);
  if (!draft) return Response.json({ refused: "No such shot." }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { rev?: number; target?: string; values?: Values } | null;
  if (!body || typeof body.rev !== "number" || typeof body.target !== "string" || !body.values) return Response.json({ refused: "Send rev, target and values." }, { status: 400 });
  if (body.rev !== draft.rev) return Response.json({ refused: "The shot changed since the screen last saw it.", shot: draft }, { status: 409 });
  try {
    return Response.json(saveDraft(setControls(draft, body.target, body.values, library)));
  } catch (error) {
    return Response.json({ refused: error instanceof Error ? error.message : String(error) }, { status: 422 });
  }
}
