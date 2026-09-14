import Link from "next/link";
import { Chip, SectionHeader, Table, ToolScreen } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Projects" };

export default async function Projects() {
  const supabase = await supabaseServer();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, slug, name, domain, description, hue, status")
    .order("name");

  return (
    <ToolScreen eyebrow="Projects" title="All projects" meta={<Chip hue="peach">layer 1</Chip>}>
      <SectionHeader
        level={3}
        rhythm={false}
        title="A project is a thing with pages"
        lead="A page is a document on the canvas, composed from the component library and published with a version number."
      />
      <Table
        caption="Projects"
        captionHidden
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Project", render: (r) => <Link href={`/projects/${r.slug}`}>{r.name}</Link> },
          { key: "domain", header: "Domain", render: (r) => (r.domain ? <code>{r.domain}</code> : "—") },
          { key: "status", header: "Status", render: (r) => <Chip hue={r.status === "live" ? "green" : "grey"}>{r.status}</Chip> },
          { key: "description", header: "What it is" },
        ]}
        rows={projects ?? []}
        empty="No projects yet."
      />
    </ToolScreen>
  );
}
