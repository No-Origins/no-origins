import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button, CellHead, Chip, Divider, Dot, Heading, Intro, Label, RegionLabel, Row, Stack, Text, hues } from "@no-origins/ui";

export const metadata: Metadata = { title: "Compose fixture", robots: { index: false } };

/**
 * Admin.md build order step 2: the ten components the editor needs and the package did not have.
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
      <h1 className="noo-h2 mt-2">Ten new components</h1>
      <Text size="lead" className="mt-3 max-w-[62ch] text-ink-2">
        Everything hand-authoring two real sections found missing. Each one was a class on a bare tag in an app
        file, and a class on a bare tag cannot be placed in an editor. Spacing belongs to the container, never to
        the child — <span className="noo-code">.noo-text</span> and <span className="noo-code">.noo-heading</span> have
        no margin, and the gap is the Stack&apos;s or the Row&apos;s.
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


      <Case title="Heading — three levels, and the Bowlby rule carried in code" note="The display face appears at level 2 and nowhere smaller; 3 and 4 are Hanken 600. Level 1 is not offered — a surface has exactly one h1 (§12), and it belongs to the page or the canvas, never to a composed block.">
        <Stack gap={16}>
          <Heading level={2}>Four roles, told as blocks</Heading>
          <Heading level={3}>Neptune, Hashnode&apos;s editor</Heading>
          <Heading level={4}>The through-line</Heading>
        </Stack>
      </Case>

      <Case title="Label and Dot" note="The mono voice for metadata, and a hue as a mark. The dot exists because a hue survives the map zoom tier and text does not — a zoomed-out column stays colour-coded when no word in it is legible.">
        <Stack gap={24}>
          <Box label="label">
            <Row gap={24}>
              <Label>now</Label>
              <Label>two years</Label>
              <Label>the through-line</Label>
            </Row>
          </Box>
          <Box label="dot — all seven hues">
            <Row gap={16}>
              {hues.map((h) => (
                <Row key={h} gap={8}>
                  <Dot hue={h} />
                  <Text size="small" tone="muted" as="span">{h}</Text>
                </Row>
              ))}
            </Row>
          </Box>
        </Stack>
      </Case>

      <Case title="Divider" note="An <hr>, because that is what it means: a thematic break, announced as a separator. Dotted is the canvas voice — the line under a region label.">
        <Stack gap={16}>
          <Text size="small" tone="muted">solid</Text>
          <Divider />
          <Text size="small" tone="muted">dotted</Text>
          <Divider dotted />
        </Stack>
      </Case>

      <Case title="Intro — because markdown cannot express a type scale" note="A document writing this as markdown would get a heading and a body paragraph; the lead — 19/1.5, a real step on the scale — has no syntax at all. Rather than invent one, the pair is a component.">
        <Box label="intro">
          <Intro title="Four roles, told as blocks" lead="Editors, design systems, agent systems, and shipping full-stack." />
        </Box>
      </Case>

      <Case title="CellHead — the same shape four times in one widget" note="Two <p> tags typed by hand in the app's content file, once per role. Composable from Label, Dot and a title — and registered anyway, because authoring a widget cell should be one node, not four.">
        <Row gap={16} align="start">
          {([["now", "Radise", "peach"], ["before", "Dataflix", "green"], ["one year", "Hashnode", "blue"], ["two years", "Terrible Tiny Tales", "pink"]] as const).map(([l, t, h]) => (
            <div key={t} className="noo-bento__cell noo-bento__cell--quiet w-[144px] h-[144px]">
              <CellHead label={l} title={t} dot={h} />
            </div>
          ))}
        </Row>
      </Case>

      <Case title="RegionLabel — the one heading that has to read at 0.27 zoom" note="96px in canvas units, stepping down to 34 in document mode where there is no zoom to fight. Always aria-hidden: the section's meaningful h2 is in its intro, and “Four roles, told as blocks” beats “work” for anyone navigating by heading. RegionNode renders this now, so the markup has one home.">
        <Box label="region label">
          <div className="h-[150px]">
            <RegionLabel>Work</RegionLabel>
          </div>
        </Box>
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
