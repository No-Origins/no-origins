import { Card, Chip, Heading, Placeholder, Row, Section, SectionHeader, Stack, Text } from "@no-origins/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Storage" };

/** Systems → Storage (Admin.md §8.2) — the two buckets and what is in them. */
export default async function Storage() {
  const supabase = await supabaseServer();
  const { data: assets } = await supabase
    .from("assets")
    .select("id, bucket, path, mime, bytes, alt, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <Section>
      <SectionHeader
        level={1}
        label="System"
        title="Storage"
        lead="Two buckets, and the difference between them is the whole point: one is private and read through signed URLs, the other is the pipeline's output and is meant to be fetched without credentials."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <Stack gap={8}>
            <Row gap={8}><Heading level={3}>assets</Heading><Chip hue="grey">private</Chip></Row>
            <Text size="small" tone="muted">
              Uploads: the résumé PDF, source photographs, anything a panel links. Photographs live here as of the
              2026-09-11 reversal — <code>alt</code>, width and height are columns on the record, not metadata at
              the point of use, so a document can reserve the box before the picture arrives.
            </Text>
          </Stack>
        </Card>
        <Card>
          <Stack gap={8}>
            <Row gap={8}><Heading level={3}>publish</Heading><Chip hue="green">public read</Chip></Row>
            <Text size="small" tone="muted">
              The published doc JSON per version, at a stable path, plus derived static output. Public on purpose —
              it is output, and output is fetched without credentials. The <em>tables</em> have no anon policy
              anywhere, which is the rule this does not break.
            </Text>
          </Stack>
        </Card>
      </div>

      <Heading level={3} className="mt-12 mb-4">Files</Heading>
      {assets?.length ? (
        <Stack gap={8}>
          {assets.map((a) => (
            <Card key={a.id}>
              <Row gap={16} align="center">
                <Text size="small">{a.bucket}/{a.path}</Text>
                <Text size="small" tone="muted">{a.mime} · {Math.round(a.bytes / 1024)} kB</Text>
              </Row>
            </Card>
          ))}
        </Stack>
      ) : (
        <Placeholder title="Nothing uploaded yet">
          Both buckets exist and both have their policies. The first file arrives when the editor does — until
          then the portfolio&apos;s images are files in the repo, which is where they should be for a site that
          renders from source.
        </Placeholder>
      )}
    </Section>
  );
}
