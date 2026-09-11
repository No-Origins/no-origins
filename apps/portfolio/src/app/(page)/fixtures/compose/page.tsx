import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button, Chip, Row, Stack, Text } from "@no-origins/ui";

export const metadata: Metadata = { title: "Compose fixture", robots: { index: false } };

/**
 * Admin.md build order step 2, first three: `Text`, `Stack` and `Row`.
 *
 * These are the components hand-authoring found missing (Scene-Schema.md §8.1 ⑨, §9.3 ⑨) — the package could
 * style a thing but could not place two things beside each other, so the app reached for a Tailwind utility
 * every time and those spots could never be authored in the editor. Seven of the ten gaps were this.
 *
 * The last section rebuilds the two real cases out of the new components, which is the only proof that matters.
 */

function Case({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="noo-h4 text-ink">{title}</h2>
      {note ? <p className="noo-body-sm mt-1 max-w-[62ch] text-ink-2">{note}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A dashed box, so a layout component's own extent is visible where it has no surface of its own. */
function Box({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="relative rounded-lg border border-dashed border-rule p-4">
      <span className="noo-label absolute -top-2 left-3 bg-ground px-1.5 text-muted">{label}</span>
      {children}
    </div>
  );
}

const Tile = ({ children }: { children: ReactNode }) => (
  <span className="noo-code rounded-sm bg-ground-2 px-3 py-2 text-ink-2">{children}</span>
);

export default function ComposeFixture() {
  return (
    <div className="noo-container py-14">
      <p className="noo-label text-muted">no origins · admin step 2 · fixture</p>
      <h1 className="noo-h2 mt-2">Text · Stack · Row</h1>
      <Text size="lead" className="mt-3 max-w-[62ch] text-ink-2">
        The three that let a page be composed without a utility class. Spacing belongs to the container, never to
        the child — <span className="noo-code">.noo-text</span> has no margin, and the gap is the Stack&apos;s or
        the Row&apos;s.
      </Text>

      <Case
        title="Text — three steps of the scale, two tones"
        note={<>A step on the type scale (§5), not a preference. <span className="noo-code">lead</span> opens a section, <span className="noo-code">body</span> is reading matter, <span className="noo-code">small</span> is an aside. <span className="noo-code">muted</span> is the only colour it offers: prose that needs another one needs a component.</>}
      >
        <Stack gap={16}>
          <Text size="lead">I build editors, design systems and agent tools. No Origins is where I keep them.</Text>
          <Text>
            No Origins is my playground on the internet. Not a fixed list of features: blocks, added over time.
            This portfolio is the first.
          </Text>
          <Text size="small" tone="muted">Chosen pieces of this work are on Case Studies.</Text>
        </Stack>
      </Case>

      <Case title="Stack — four gaps, and nothing between them" note="8 · 16 · 24 · 40, all on the 4px space scale (§6). A free number would let a document invent spacing the system does not have.">
        <div className="flex flex-wrap gap-6">
          {([8, 16, 24, 40] as const).map((g) => (
            <Box key={g} label={`gap ${g}`}>
              <Stack gap={g}>
                <Tile>one</Tile>
                <Tile>two</Tile>
                <Tile>three</Tile>
              </Stack>
            </Box>
          ))}
        </div>
      </Case>

      <Case title="Row — wraps by default" note="Every real use of it is content inside a cell, and content inside a cell must not overflow it.">
        <Stack gap={24}>
          <Box label="align center">
            <Row gap={8}>
              <Chip hue="peach">curious</Chip>
              <Chip hue="lavender">creative</Chip>
              <Chip hue="yellow">happy</Chip>
            </Row>
          </Box>
          <Box label="align baseline — a 28px chip sits on the text's baseline, not centred on it">
            <Row gap={8} align="baseline">
              <Chip hue="blue">editors</Chip>
              <Text size="small" tone="muted">read as one line with the chip beside it</Text>
            </Row>
          </Box>
          <Box label="wrap — a narrow container, eight chips">
            <div className="max-w-[320px]">
              <Row gap={8}>
                {["editors", "design systems", "agent systems", "full-stack", "tiptap", "next.js", "nest", "azure"].map((c) => (
                  <Chip key={c} hue="grey">{c}</Chip>
                ))}
              </Row>
            </div>
          </Box>
        </Stack>
      </Case>

      <Case
        title="The two cases they replace"
        note={
          <>
            Both of these are a bare <span className="noo-code">&lt;div className=&quot;flex flex-wrap items-center gap-2&quot;&gt;</span> in
            the app today. Rebuilt here out of the package, which is what makes them placeable in the editor.
          </>
        }
      >
        <Stack gap={24}>
          <Box label="Me — the chip row, with the location slot">
            <Row gap={8}>
              <Chip hue="peach">curious</Chip>
              <Chip hue="lavender">creative</Chip>
              <Chip hue="yellow">happy</Chip>
              <Text size="small" tone="muted" as="span">Based in Hyderabad, India</Text>
            </Row>
          </Box>
          <Box label="Work — the résumé row">
            <Row gap={16}>
              <Button variant="secondary">Download the résumé</Button>
              <Text size="small" tone="muted" as="span">Chosen pieces of this work are on Case Studies.</Text>
            </Row>
          </Box>
        </Stack>
      </Case>
    </div>
  );
}
