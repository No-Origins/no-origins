import type { Metadata } from "next";
import Link from "next/link";
import { Card, Section, SectionHeader } from "@no-origins/ui";

export const metadata: Metadata = { title: "Fixtures", robots: { index: false } };

// Review pages for the design system, one per build step. Not linked from the site's navigation.
const fixtures = [
  { href: "/fixtures/blob", step: 2, title: "The blob and the wordmark", line: "Every variant, size and state over the grid." },
  { href: "/fixtures/primitives", step: 3, title: "Glass and the six primitives", line: "Type scale, glass levels, Button, Chip, Card, Bubble, Field, Toggle." },
  { href: "/fixtures/patterns", step: "patterns", title: "Steps, Quote, MediaCard, Carousel", line: "Four patterns from Bhargav\u2019s references, built out of the system rather than traced from the pictures." },
  { href: "/fixtures/catalogue", step: "admin 2", title: "The catalogue", line: "Every authorable component, rendered from the registry itself \u2014 one declaration, three consumers." },
  { href: "/fixtures/compose", step: "admin 2", title: "The ten new components", line: "Heading, Text, Label, Dot, Stack, Row, Divider, SectionHeader, CellHead \u2014 and the two real rows they replace." },
  { href: "/fixtures/layout", step: 4, title: "Page mode", line: "NavBar, SectionHeader, Footer, the reading column and its rhythm." },
  { href: "/fixtures/canvas", step: 9, title: "Canvas nodes", line: "The panel and region node types, and the three level-of-detail tiers side by side." },
  { href: "/fixtures/tool", step: "release 5", title: "The Tool and Document templates", line: "The admin's shell with every region filled — rail, header, main, inspector, bar — the 68ch reading column with every element markdown produces, and the editor's shell: rail, sidebar, flush main." },
  { href: "/fixtures/bento", step: 11, title: "Bento widgets", line: "The six section widgets at full size and at the 0.27 overview, with the six illustrations." },
  { href: "/fixtures/studio", step: 11, title: "The illustration studio", line: "Five candidates a round, with the reasoning; picks and the rules they produced." },
  { href: "/fixtures/document", step: "admin 6", title: "The portfolio as a document", line: "The same map, read from a Scene-Schema document through the adapter instead of from scene.tsx — with every gap the proof found listed under it." },
  { href: "/", step: 10, title: "The portfolio", line: "All of it, on the canvas: Me at the centre, six sections on a ring around it." },
];

export default function Fixtures() {
  return (
    <Section aria-labelledby="fixtures-title">
      <SectionHeader level={1} label="fixtures · one per build step" title="Review pages" titleId="fixtures-title" lead="Each build step leaves a page that shows everything it added, over the real grid, in both themes." />
      <div className="grid gap-5 md:grid-cols-2">
        {fixtures.map((f) => (
          <Card key={f.href} as={Link} href={f.href} interactive>
            <p className="noo-label text-muted">step {f.step}</p>
            <p className="noo-h4 mt-2 text-ink">{f.title}</p>
            <p className="noo-body-sm mt-2 text-ink-2">{f.line}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
