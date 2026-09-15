import Link from "next/link";
import { Card, Chip, Heading, Row, Stack, Text, ToolScreen } from "@no-origins/ui";
import { byLayer, entries, layerNotes, layers, registryHash } from "@no-origins/ui/registry";

export const metadata = { title: "Components" };

/**
 * The components index (reorganised 2026-09-15).
 *
 * Three cards for the three layers, and then **the finder**: every entry in the registry, alphabetical, linking to
 * its anchor on its layer's screen. The old single page could be searched with the browser's own find; splitting it
 * three ways would have taken that away, so this gives it back — and gives it back better, because the finder says
 * which layer a component lives in before you go there, which ⌘F never did.
 *
 * Nothing here is written by hand: the counts, the names and the layers all come from the registry, so a component
 * added to the package appears in the card, in the finder and on its layer's screen at once.
 */
export default function Components() {
  const drafts = entries.filter((e) => e.status === "draft").length;
  const az = [...entries].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ToolScreen
      eyebrow="Components"
      title="Every component a document may name"
      meta={
        <>
          <Chip hue="yellow">{entries.length} entries</Chip>
          <Chip hue="pink">{drafts} draft</Chip>
        </>
      }
    >
      <Text size="lead" tone="muted" className="max-w-[68ch]">
        Rendered from the registry itself — nothing on these screens is written by hand. The editor&apos;s palette
        reads the same array, so adding a component to the package adds it here and there at once.
      </Text>

      <div className="grid gap-4 md:grid-cols-3">
        {layers.map((l) => {
          const inLayer = byLayer(l);
          return (
            <Card key={l} as={Link} href={`/components/${layerNotes[l].slug}`} interactive padding="sm">
              <Stack gap={8}>
                <Row gap={8} align="baseline">
                  <Heading level={4}>{layerNotes[l].title}</Heading>
                  <Text size="small" tone="muted" as="span">{inLayer.length}</Text>
                </Row>
                <Text size="small" tone="muted">{layerNotes[l].line}</Text>
              </Stack>
            </Card>
          );
        })}
      </div>

      <section aria-labelledby="finder">
        <Heading level={3} id="finder">Find one</Heading>
        <Text size="small" tone="muted" className="mt-2 max-w-[66ch]">
          All {entries.length}, alphabetical — each goes to its entry on its layer&apos;s screen.
        </Text>
        <ul className="mt-6 grid list-none grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-1 p-0">
          {az.map((e) => (
            <li key={e.name}>
              <Link
                href={`/components/${layerNotes[e.layer].slug}#${e.name}`}
                className="flex items-baseline gap-2 rounded-md px-2 py-1 text-ink-2 no-underline hover:bg-surface hover:text-ink"
              >
                <span className="min-w-0 flex-1 truncate">{e.name}</span>
                <span className="noo-label text-muted">{e.layer}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Text size="small" tone="muted">
        Registry fingerprint <code className="noo-code">{registryHash()}</code> — every published version records
        the hash it was rendered against, so two publishes with equal hashes are guaranteed to render alike.
      </Text>
    </ToolScreen>
  );
}
