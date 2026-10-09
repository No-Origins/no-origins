import { ENTRIES } from "@cinema/content";

import { isId, publish, readAssets, readDraft, versionsOf } from "@/data/store";
import { pinAssets } from "@/engine/assets";
import { makeLibrary } from "@/engine/library";

const library = makeLibrary(ENTRIES);

/**
 * Publishing from the screen (Cinema-Engine.md E3): the draft, as the screen last saw it, becomes the shot's next
 * version, its assets pinned to the versions it uses now; the same as the `publish` command. A version never changes.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isId(id)) return Response.json({ refused: "Not a shot's id." }, { status: 400 });
  const draft = readDraft(id);
  if (!draft) return Response.json({ refused: "No such shot." }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { rev?: number } | null;
  if (typeof body?.rev !== "number") return Response.json({ refused: "Send the revision the screen last saw." }, { status: 400 });
  if (body.rev !== draft.rev) return Response.json({ refused: "The shot changed since the screen last saw it.", shot: draft }, { status: 409 });
  const version = publish(id, pinAssets(draft, library, readAssets()));
  return Response.json({ version, versions: versionsOf(id) });
}
