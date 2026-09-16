import { notFound } from "next/navigation";
import { Chip, SectionHeader, Table, ToolScreen } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Portfolio" };

/**
 * The project screen (Admin.md §4).
 *
 * The sub-screens that do not exist are listed as what is coming rather than linked as routes that 404 — a menu
 * entry pointing at nothing is worse than an honest row. **Edit rejoined that table on 2026-09-16**: the React
 * Flow canvas came out in the design system's 1.0 and the editor will be redesigned from a different starting
 * point, so nothing is authored in the admin today.
 */
const COMING = [
  { screen: "Editor", step: "—", body: "A different approach, later — the React Flow canvas was removed in the design system's 1.0. Until it is redesigned nothing is composed here." },
  { screen: "Versions", step: "8", body: "History, diff and rollback. A version is an integer and a required label (R1) — the label is the moment you notice what you actually changed." },
  { screen: "Content", step: "7", body: "The copy behind the components. Markdown plus the one inline directive set (R4)." },
  { screen: "Settings", step: "4+", body: "Domain, metadata, hue. Not theme — tokens are a code edit (R3)." },
];

export default async function Portfolio() {
  const supabase = await supabaseServer();
  const { data: project } = await supabase
    .from("projects")
    .select("id, slug, name, domain, description, status")
    .eq("slug", "portfolio")
    .maybeSingle();

  if (!project) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, slug, title, kind, rev, current_version_id")
    .eq("project_id", project.id)
    .order("slug");

  return (
    <ToolScreen
      eyebrow="Projects"
      title={project.name}
      meta={
        <>
          <Chip hue={project.status === "live" ? "green" : "grey"}>{project.status}</Chip>
          {project.domain ? <Chip hue="peach">{project.domain}</Chip> : null}
        </>
      }
    >
      {project.description ? <SectionHeader level={3} rhythm={false} title="Documents" lead={project.description} /> : <SectionHeader level={3} rhythm={false} title="Documents" />}
      <Table
        caption="Documents"
        captionHidden
        rowKey={(r) => r.id}
        columns={[
          { key: "title", header: "Title" },
          { key: "slug", header: "Route", render: (r) => <code>/{r.slug}</code> },
          { key: "kind", header: "Kind" },
          { key: "rev", header: "Rev", align: "num", width: "72px" },
          { key: "state", header: "State", render: (r) => <Chip hue={r.current_version_id ? "green" : "grey"}>{r.current_version_id ? "published" : "draft only"}</Chip> },
        ]}
        rows={documents ?? []}
        empty="No documents yet. There is no migration of the current portfolio: the live site renders from source and keeps doing so until there is something better to replace it with."
      />

      <SectionHeader level={3} rhythm={false} title="Not built yet" lead="Listed as what is coming rather than linked as routes that 404." />
      <Table
        caption="Screens to come"
        captionHidden
        rowKey={(r) => r.screen}
        columns={[
          { key: "screen", header: "Screen", width: "140px" },
          { key: "step", header: "Step", align: "num", width: "72px" },
          { key: "body", header: "What it does" },
        ]}
        rows={COMING}
      />
    </ToolScreen>
  );
}
