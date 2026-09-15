import Link from "next/link";
import { Blob, Card, Chip, Heading, Row, SectionHeader, Stack, Text, ToolScreen, hues } from "@no-origins/ui";
import { byLayer, entries, layerNotes, layers, registryHash } from "@no-origins/ui/registry";
import { tokenPages } from "@/content/tokens";

/**
 * Overview — the one screen that is neither a token nor a component, which is why the menu keeps it outside both
 * groups (the admin does the same with its own Overview).
 */
export default function Overview() {
  const drafts = entries.filter((e) => e.status === "draft").length;

  return (
    <ToolScreen
      eyebrow="no origins · design system"
      title="One system, every block"
      meta={
        <>
          <Chip hue="grey">{tokenPages.length} token screens</Chip>
          <Chip hue="yellow">{entries.length} components · {drafts} draft</Chip>
        </>
      }
    >
      <SectionHeader
        level={3}
        rhythm={false}
        title="Two halves: the values, and the things built from them"
        lead="Each block owns one hue; the clear one is the host. Everything below is read-only by decision — a token belongs to the package, and changing one is a code change, a changeset and a deploy."
      />

      <Row gap={16}>
        {hues.filter((h) => h !== "grey").map((h) => <Blob key={h} size="sm" hue={h} />)}
        <Blob size="sm" variant="host" />
      </Row>

      <div className="grid gap-6 md:grid-cols-2">
        <Card as={Link} href="/tokens" interactive>
          <Stack gap={8}>
            <Heading level={3}>Tokens</Heading>
            <Text tone="muted">
              A screen each for colour, contrast, type, space, radius, elevation and motion — with the measured
              contrast of every text pair against the floors in §12.
            </Text>
            <Row gap={8} className="mt-2">
              <Chip hue="blue">both themes</Chip>
              <Chip hue="green">contrast report</Chip>
            </Row>
          </Stack>
        </Card>

        <Card as={Link} href="/components" interactive>
          <Stack gap={8}>
            <Heading level={3}>Components</Heading>
            <Text tone="muted">
              All {entries.length} a document may name, rendered from the registry itself — props, slots and a live
              example each. A screen per Atomic layer:{" "}
              {layers.map((l) => `${byLayer(l).length} ${layerNotes[l].title.toLowerCase()}`).join(", ")}.
            </Text>
            <Row gap={8} className="mt-2">
              <Chip hue="lavender">registry</Chip>
              <Chip hue="peach">live examples</Chip>
            </Row>
          </Stack>
        </Card>
      </div>

      <Text size="small" tone="muted" className="max-w-[66ch]">
        This showcase is read-only by decision. Tokens are the package&apos;s to define and a change to one is a
        code change, a changeset and a deploy — so <code className="noo-code">@no-origins/ui</code> keeps standing
        alone, and an npm consumer gets the whole look with no database anywhere near it. The registry fingerprint
        is <code className="noo-code">{registryHash()}</code>.
      </Text>
    </ToolScreen>
  );
}
