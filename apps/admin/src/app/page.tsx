import Link from "next/link";
import { Chip, Placeholder, SectionHeader, Table, ToolScreen } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Overview" };

/**
 * Overview (Admin.md §4) — "what is live, what is drafted, what changed".
 *
 * Right now the true answer to all three is "nothing", and the screen says so in the tables' own empty rows rather
 * than with a dashboard of zeroes (Brand.md §10). Under R5 that emptiness is correct and not a gap — the live
 * portfolio renders from `scene.tsx` and will keep doing so until there is a composed document worth replacing it
 * with.
 */
export default async function Overview() {
  const supabase = await supabaseServer();
  const [{ data: projects }, { data: systems }, { data: documents }, { data: products }] = await Promise.all([
    supabase.from("projects").select("id, slug, name, status, domain").order("name"),
    supabase.from("systems").select("slug, name").order("slug"),
    supabase.from("documents").select("id, slug, title, rev, current_version_id, project_id"),
    supabase.from("products").select("id"),
  ]);

  const docs = (documents ?? []).map((d) => ({
    ...d,
    project: projects?.find((p) => p.id === d.project_id)?.name ?? "—",
    state: d.current_version_id ? "published" : d.rev > 0 ? "drafted" : "blank",
  }));
  const live = docs.filter((d) => d.state === "published").length;
  const drafted = docs.filter((d) => d.state === "drafted").length;

  const layers = [
    { layer: "1", name: "Projects", href: "/projects", count: projects?.length ?? 0, line: "The pages: their drafts and their versions.", hue: "peach" as const },
    { layer: "2", name: "Systems", href: "/systems", count: systems?.length ?? 0, line: "The mechanisms a project is built with. None knows about a project.", hue: "lavender" as const },
    { layer: "3", name: "Products", href: "/products", count: products?.length ?? 0, line: "Plug into exactly one system; every project on that system gets them.", hue: "blue" as const },
  ];

  return (
    <ToolScreen
      eyebrow="no origins · admin"
      title="Overview"
      meta={
        <>
          <Chip hue={live ? "green" : "grey"}>{live} live</Chip>
          <Chip hue="grey">{drafted} drafted</Chip>
        </>
      }
    >
      <SectionHeader
        level={2}
        rhythm={false}
        title="Three layers, in the order they depend on each other"
        lead="Projects are the pages. Systems are the mechanisms they are built with. Products plug into systems. Nothing in the second two knows about a project, which is what keeps the arrow pointing one way."
      />
      <Table
        caption="The layers"
        captionHidden
        rowKey={(r) => r.name}
        columns={[
          { key: "layer", header: "Layer", align: "num", width: "72px" },
          { key: "name", header: "Section", render: (r) => <Link href={r.href}>{r.name}</Link> },
          { key: "count", header: "Rows", align: "num", width: "88px" },
          { key: "line", header: "What it holds" },
          { key: "hue", header: "Hue", render: (r) => <Chip hue={r.hue}>{r.hue}</Chip> },
        ]}
        rows={layers}
      />

      <SectionHeader level={3} rhythm={false} title="Documents" lead="Every document across every project, with its state. The portfolio is not one yet — it renders from source." />
      <Table
        caption="Documents"
        captionHidden
        rowKey={(r) => r.id}
        columns={[
          { key: "title", header: "Title" },
          { key: "project", header: "Project" },
          { key: "slug", header: "Route", render: (r) => <code>/{r.slug}</code> },
          { key: "rev", header: "Rev", align: "num", width: "72px" },
          { key: "state", header: "State", render: (r) => <Chip hue={r.state === "published" ? "green" : r.state === "drafted" ? "yellow" : "grey"}>{r.state}</Chip> },
        ]}
        rows={docs}
        empty="No documents. Under R5 the first one is a blank canvas, composed in the editor; the live portfolio keeps rendering from scene.tsx until then."
      />

      <Placeholder title="What changed">
        The audit log, once something has changed. Every publish, every pointer move and every token deploy writes
        a row; there is nothing to show until the first one does.
      </Placeholder>
    </ToolScreen>
  );
}
