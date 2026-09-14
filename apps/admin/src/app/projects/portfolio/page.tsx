import { notFound } from "next/navigation";
import { Chip, Placeholder, SectionHeader, Table, ToolScreen } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Portfolio" };

/**
 * The project screen (Admin.md §4).
 *
 * The four sub-screens — edit, versions, content, settings — are steps 7 and 8 of §13, and they are listed here
 * as what is coming rather than linked as routes that 404. A rail entry pointing at nothing is worse than an
 * honest row saying the editor is not built.
 */
const COMING = [
  { screen: "Edit", step: "7", body: "The canvas editor: palette, canvas, inspector, outline, draft autosave, and the probes that run on save." },
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

      <Placeholder title="The editor lands here">
        Palette, canvas, inspector and outline — the anatomy in Admin.md §6.1, on this Tool template&apos;s own
        inspector and footer bar.
      </Placeholder>
    </ToolScreen>
  );
}
