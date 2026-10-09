import { isId, readDraft } from "@/data/store";

/** A shot's draft as it is now, for the screen to watch for changes (`rev`) while the commands run. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isId(id)) return new Response("Not a shot's id.", { status: 400 });
  const shot = readDraft(id);
  return shot ? Response.json(shot, { headers: { "cache-control": "no-store" } }) : new Response("No such shot.", { status: 404 });
}
