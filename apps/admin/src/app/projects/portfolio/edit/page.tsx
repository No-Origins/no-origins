import { notFound } from "next/navigation";
import type { SceneDocument } from "@no-origins/ui/document";
import { supabaseServer } from "@/lib/supabase/server";
import { seedDocument } from "@/content/portfolio";
import { Editor } from "./editor";

export const metadata = { title: "Portfolio — edit" };

/**
 * The editor screen (Admin.md §13 step 7, §6).
 *
 * The server half does three things and then gets out of the way: read the `documents` row for this project,
 * seed its `draft` the first time (the seed is a COPY of the portfolio's document — see `@/content/portfolio`
 * for why it cannot be an import), and hand the draft plus its `rev` to the client. Everything after that is a
 * draft in React state and a debounced PATCH (§6.4).
 *
 * **Nothing here uses the service role.** `supabaseServer()` is the anon key carrying the user's session, so the
 * seed insert lands only for an owner — which is what `documents_insert` says, and what the empty screen below
 * says out loud rather than failing silently for anyone else.
 */
export default async function EditPortfolio() {
  const supabase = await supabaseServer();

  const { data: project } = await supabase.from("projects").select("id, slug, name, hue").eq("slug", "portfolio").maybeSingle();
  if (!project) notFound();

  const { data: existing } = await supabase
    .from("documents")
    .select("id, slug, title, kind, draft, rev, draft_updated_at")
    .eq("project_id", project.id)
    .eq("slug", "home")
    .maybeSingle();

  let row = existing;

  // First open: create the row, or fill in a draft the row does not have. Idempotent, and a no-op every other
  // time — the seed exists so that the editor has something real to edit on day one, not as a migration.
  if (!row) {
    const { data: made } = await supabase
      .from("documents")
      .insert({ project_id: project.id, slug: "home", title: "Home", kind: "canvas", draft: seedDocument, rev: 0 })
      .select("id, slug, title, kind, draft, rev, draft_updated_at")
      .maybeSingle();
    row = made ?? null;
  } else if (!row.draft) {
    const { data: filled } = await supabase
      .from("documents")
      .update({ draft: seedDocument, rev: row.rev + 1, draft_updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("rev", row.rev)
      .select("id, slug, title, kind, draft, rev, draft_updated_at")
      .maybeSingle();
    row = filled ?? row;
  }

  if (!row?.draft) notFound();

  return (
    <Editor
      documentId={row.id}
      projectName={project.name}
      title={row.title}
      rev={row.rev}
      savedAt={row.draft_updated_at}
      draft={row.draft as SceneDocument}
    />
  );
}
