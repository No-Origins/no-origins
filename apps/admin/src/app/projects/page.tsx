import Link from "next/link";
import { Card, Chip, Heading, Row, Section, SectionHeader, Stack, Text } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Projects" };

export default async function Projects() {
  const supabase = await supabaseServer();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, slug, name, domain, description, hue, status")
    .order("name");

  return (
    <Section>
      <SectionHeader
        level={1}
        label="Project"
        title="Projects"
        lead="A project is a thing with pages. A page is a document on the canvas, composed from the component library and published with a version number."
      />

      <Stack gap={24}>
        {(projects ?? []).map((project) => (
          <Card key={project.id} as={Link} href={`/projects/${project.slug}`} interactive>
            <Stack gap={8}>
              <Row gap={8} align="center">
                <Heading level={3}>{project.name}</Heading>
                <Chip hue={project.status === "live" ? "green" : "grey"}>{project.status}</Chip>
              </Row>
              {project.domain ? <Text size="small" tone="muted">{project.domain}</Text> : null}
              {project.description ? <Text tone="muted">{project.description}</Text> : null}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Section>
  );
}
