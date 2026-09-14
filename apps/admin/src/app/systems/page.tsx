import Link from "next/link";
import { Chip, SectionHeader, Table, ToolScreen } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Systems" };

export default async function Systems() {
  const supabase = await supabaseServer();
  const { data: systems } = await supabase.from("systems").select("slug, name, kind, description").order("slug");

  return (
    <ToolScreen eyebrow="Systems" title="All systems" meta={<Chip hue="lavender">layer 2</Chip>}>
      <SectionHeader
        level={3}
        rhythm={false}
        title="The mechanisms a project is built with"
        lead="A system knows nothing about any project — that is what keeps the dependency arrow pointing one way, and it is why these are listed on their own rather than inside the portfolio."
      />
      <Table
        caption="Systems"
        captionHidden
        rowKey={(r) => r.slug}
        columns={[
          { key: "name", header: "System", render: (r) => <Link href={`/systems/${r.slug}`}>{r.name}</Link> },
          { key: "kind", header: "Kind", render: (r) => <Chip hue="lavender">{r.kind}</Chip> },
          { key: "description", header: "What it does" },
        ]}
        rows={systems ?? []}
        empty="No systems seeded."
      />
    </ToolScreen>
  );
}
