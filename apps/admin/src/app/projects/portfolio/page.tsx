import { notFound } from "next/navigation";
import { Card, Chip, Heading, Label, Placeholder, Row, Section, SectionHeader, Stack, Text } from "@no-origins/ui";
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
  { title: "Edit", step: "step 7", body: "The canvas editor: palette, canvas, inspector, outline, draft autosave, and the probes that run on save." },
  { title: "Versions", step: "step 8", body: "History, diff and rollback. A version is an integer and a required label (R1) — the label is the moment you notice what you actually changed." },
  { title: "Content", step: "step 7", body: "The copy behind the components. Markdown plus the one inline directive set (R4)." },
  { title: "Settings", step: "step 4+", body: "Domain, metadata, hue. Not theme — tokens are a code edit (R3)." },
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
    <Section>
      <SectionHeader level={1} label="Project" title={project.name} lead={project.description ?? undefined} />

      <Row gap={8} className="mb-10">
        <Chip hue={project.status === "live" ? "green" : "grey"}>{project.status}</Chip>
        {project.domain ? <Chip hue="peach">{project.domain}</Chip> : null}
      </Row>

      <Heading level={3} className="mb-4">Documents</Heading>
      {documents?.length ? (
        <Stack gap={16}>
          {documents.map((doc) => (
            <Card key={doc.id}>
              <Row gap={16} align="center">
                <Stack gap={8}>
                  <Heading level={4}>{doc.title}</Heading>
                  <Text size="small" tone="muted">/{doc.slug} · {doc.kind} · rev {doc.rev}</Text>
                </Stack>
                <Chip hue={doc.current_version_id ? "green" : "grey"}>
                  {doc.current_version_id ? "published" : "draft only"}
                </Chip>
              </Row>
            </Card>
          ))}
        </Stack>
      ) : (
        <Placeholder title="No documents yet">
          Under R5 the first document is a <strong>blank canvas</strong>, composed in the editor from the component
          library — there is no migration of the current portfolio. It keeps rendering from <code>scene.tsx</code>,
          untouched, until there is something better to replace it with. That makes this emptiness the plan rather
          than a gap.
        </Placeholder>
      )}

      <Heading level={3} className="mt-14 mb-4">Not built yet</Heading>
      <div className="grid gap-6 md:grid-cols-2">
        {COMING.map((item) => (
          <Card key={item.title}>
            <Stack gap={8}>
              <Label className="text-muted">{item.step}</Label>
              <Heading level={4}>{item.title}</Heading>
              <Text size="small" tone="muted">{item.body}</Text>
            </Stack>
          </Card>
        ))}
      </div>
    </Section>
  );
}
