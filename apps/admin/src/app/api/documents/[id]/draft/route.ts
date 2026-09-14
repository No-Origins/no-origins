import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Autosave (Admin.md §6.4): `PATCH /api/documents/:id/draft`.
 *
 * **Optimistic concurrency on `rev`, and a stale write is refused rather than merged.** The client sends the rev
 * it loaded; the update carries `.eq("rev", rev)` and bumps it. Two tabs on one document therefore end with the
 * second one told it is stale (409) instead of silently flattening the first — the editor shows S3's *stale —
 * saved elsewhere* with a Reload, and the person decides. A merge is the wrong answer here: nothing in a canvas
 * document merges cleanly, and a three-way merge nobody asked for is how work disappears.
 *
 * A route handler rather than a server action because it is a request the client makes on a debounce and whose
 * response it needs (the new rev, the timestamp); an action would be a form submission pretending otherwise.
 *
 * **Anon key, the user's session, `getUser()`** (apps/admin/CLAUDE.md). RLS decides whether this write lands:
 * `documents_update` admits `owner` and `editor` only, so an authenticated viewer gets zero rows back and is
 * told the same thing a stale write is — which is correct, because from here the two are indistinguishable and
 * a route that distinguished them would be telling an unprivileged caller what their role is not.
 */
export async function PATCH(request: Request, { params }: RouteContext<"/api/documents/[id]/draft">) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  let body: { rev?: unknown; draft?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "body is not JSON" }, { status: 400 });
  }
  const rev = typeof body.rev === "number" ? body.rev : Number.NaN;
  if (!Number.isInteger(rev) || rev < 0) return NextResponse.json({ error: "rev is required" }, { status: 400 });
  if (!body.draft || typeof body.draft !== "object") return NextResponse.json({ error: "draft is required" }, { status: 400 });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("documents")
    .update({ draft: body.draft, rev: rev + 1, draft_updated_at: now, draft_updated_by: user.id })
    .eq("id", id)
    .eq("rev", rev)
    .select("id, rev, draft_updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Zero rows: somebody else saved first, or this session may not write. Either way the draft in this tab is not
  // the draft in the database, and that is the one fact the editor needs.
  if (!data) return NextResponse.json({ error: "stale", stale: true }, { status: 409 });

  return NextResponse.json({ rev: data.rev, savedAt: data.draft_updated_at });
}
