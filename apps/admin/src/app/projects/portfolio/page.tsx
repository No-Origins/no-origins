import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Chip, SectionHeader, Table, ToolScreen } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Portfolio" };

/**
 * The project screen (Admin.md §4).
 *
 * The sub-screens that do not exist are listed as what is coming rather than linked as routes that 404 — a rail
 * entry pointing at nothing is worse than an honest row. **Edit left that table on 2026-09-14** and is a link in
 * the actions: step 7 is built (read-write; publish is step 8).
 */
const COMING = [
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
      actions={
        <Button as={Link} variant="secondary" size="sm" href="/projects/portfolio/edit">
          Edit
        </Button>
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
        empty="No documents yet. Under R5 the first document is a blank canvas composed in the editor — there is no migration of the current portfolio, which keeps rendering from scene.tsx until there is something better to replace it with."
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
