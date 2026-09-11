import Link from "next/link";
import { Card, Chip, Heading, Label, Placeholder, Row, Section, SectionHeader, Stack, Text } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Overview" };

/**
 * Overview (Admin.md §4) — "what is live, what is drafted, what changed".
 *
 * Right now the true answer to all three is "nothing", and the screen says so rather than showing a dashboard of
 * zeroes. Brand.md §9: say what will be here and why it is not. Under R5 that emptiness is correct and not a gap
 * — the live portfolio renders from `scene.tsx` and will keep doing so until there is a composed document worth
 * replacing it with.
 */
export default async function Overview() {
  const supabase = await supabaseServer();
  const [{ data: projects }, { data: systems }, { data: documents }] = await Promise.all([
    supabase.from("projects").select("id, slug, name, status, domain").order("name"),
    supabase.from("systems").select("slug, name").order("slug"),
    supabase.from("documents").select("id, slug, title, rev, current_version_id, project_id"),
  ]);

  const live = (documents ?? []).filter((d) => d.current_version_id).length;
  const drafted = (documents ?? []).filter((d) => !d.current_version_id && d.rev > 0).length;

  return (
    <Section>
      <SectionHeader
        level={1}
        label="no origins · admin"
        title="Three layers, in the order they depend on each other"
        lead="Projects are the pages. Systems are the mechanisms they are built with. Products plug into systems. Nothing in the second two knows about a project, which is what keeps the arrow pointing one way."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <Stack gap={8}>
            <Label className="text-muted">Live</Label>
            <Heading level={2}>{live}</Heading>
            <Text size="small" tone="muted">
              Documents with a published version. The portfolio is not one of them yet — it renders from source.
            </Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap={8}>
            <Label className="text-muted">Drafted</Label>
            <Heading level={2}>{drafted}</Heading>
            <Text size="small" tone="muted">Saved in the editor, never published.</Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap={8}>
            <Label className="text-muted">Projects</Label>
            <Heading level={2}>{projects?.length ?? 0}</Heading>
            <Text size="small" tone="muted">{systems?.length ?? 0} systems, 0 products.</Text>
          </Stack>
        </Card>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Card as={Link} href="/projects" interactive>
          <Stack gap={8}>
            <Label className="text-muted">Layer 1</Label>
            <Heading level={3}>Projects</Heading>
            <Text tone="muted">
              {projects?.map((p) => p.name).join(", ") || "None yet"} — the pages, their drafts and their versions.
            </Text>
            <Row gap={8} className="mt-2"><Chip hue="peach">canvas</Chip><Chip hue="peach">versions</Chip></Row>
          </Stack>
        </Card>
        <Card as={Link} href="/systems" interactive>
          <Stack gap={8}>
            <Label className="text-muted">Layer 2</Label>
            <Heading level={3}>Systems</Heading>
            <Text tone="muted">
              Design System, Document, Publishing, Storage — the mechanisms a project is made of.
            </Text>
            <Row gap={8} className="mt-2"><Chip hue="lavender">read-only</Chip><Chip hue="lavender">R3</Chip></Row>
          </Stack>
        </Card>
      </div>

      <Placeholder title="What changed" className="mt-12">
        The audit log, once something has changed. Every publish, every pointer move and every token deploy writes
        a row; there is nothing to show until the first one does.
      </Placeholder>
    </Section>
  );
}
