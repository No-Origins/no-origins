import Link from "next/link";
import { Blob, Card, Chip, Heading, Row, Section, SectionHeader, Stack, Text, hues } from "@no-origins/ui";
import { entries } from "@no-origins/ui/registry";

export default function Overview() {
  const drafts = entries.filter((e) => e.status === "draft").length;
  return (
    <Section>
      <SectionHeader
        level={1}
        label="no origins · design system"
        title="One system, every block"
        lead="The tokens, the components and the grammar every block is built from. Each block owns one hue; the clear one is the host."
      />

      <Row gap={16} className="mt-2">
        {hues.filter((h) => h !== "grey").map((h) => <Blob key={h} size="sm" hue={h} />)}
        <Blob size="sm" variant="glass" />
      </Row>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <Card as={Link} href="/components" interactive>
          <Stack gap={8}>
            <Heading level={3}>Components</Heading>
            <Text tone="muted">
              All {entries.length} a document may name, rendered from the registry itself — props, slots and a live
              example each. {drafts} are still draft.
            </Text>
            <Row gap={8} className="mt-2">
              <Chip hue="lavender">registry</Chip>
              <Chip hue="peach">live examples</Chip>
            </Row>
          </Stack>
        </Card>

        <Card as={Link} href="/tokens" interactive>
          <Stack gap={8}>
            <Heading level={3}>Tokens</Heading>
            <Text tone="muted">
              Colour, type, space, radius, elevation and motion — with the measured contrast of every text pair
              against the floors in §12.
            </Text>
            <Row gap={8} className="mt-2">
              <Chip hue="blue">both themes</Chip>
              <Chip hue="green">contrast report</Chip>
            </Row>
          </Stack>
        </Card>
      </div>

      <Text size="small" tone="muted" className="mt-12 max-w-[66ch]">
        This showcase is read-only by decision. Tokens are the package&apos;s to define and a change to one is a
        code change, a changeset and a deploy — so `@no-origins/ui` keeps standing alone, and an npm consumer gets
        the whole look with no database anywhere near it.
      </Text>
    </Section>
  );
}
