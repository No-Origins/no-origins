import type { Metadata } from "next";
import { Blob, Bubble, Card, Chip, Section, SectionHeader, ThemeSwitch } from "@no-origins/ui";

export const metadata: Metadata = { title: "Layout fixture", robots: { index: false } };

// Build step 4 fixture. The NavBar above and the Footer below are the real ones, from the (page) layout;
// resize under 900px to see the links move to the bottom sheet. Tab once from the top for the skip link.
export default function LayoutFixture() {
  return (
    <>
      <Section aria-labelledby="fx-title">
        <SectionHeader level={1} label="no origins · build step 4 · fixture" title="Page mode" titleId="fx-title" lead="A sticky glass bar, a reading column at 1120 with 24 / 48 gutters, section rhythm of 96 desktop and 64 mobile, and a footer on the ground." />
        <div className="flex flex-wrap items-center gap-3">
          <Chip hue="peach">nav is live above</Chip>
          <Chip hue="grey">footer is live below</Chip>
          <ThemeSwitch />
        </div>
      </Section>

      <Section>
        <SectionHeader label="section header · level 2" title="Bowlby at 34, the smallest it gets" lead="The eyebrow is mono; the lead is 19 over 1.5 and stops at sixty characters so it reads as an introduction, not a paragraph." />
        <p className="noo-body noo-prose text-ink-2">
          Body copy after a header sits at the same left edge. This paragraph is here to show the 32px gap under the header and the measure of the reading column, which stops at sixty-eight characters.
        </p>
        <SectionHeader level={3} label="level 3" title="Hanken 600 at 26, for a header inside a block" />
        <p className="noo-body noo-prose text-ink-2">A level-3 header is for a sub-section: it follows content, so it takes the 64px above.</p>
        <SectionHeader title="A header with no eyebrow and no lead" />
        <p className="noo-body noo-prose text-ink-2">Both are optional. The title alone still gets the same spacing.</p>
      </Section>

      <Section>
        <SectionHeader label="scroll test" title="Enough content to scroll under the glass" lead="The bar should stay legible over cards, blobs and text as they pass beneath it." />
        <div className="grid gap-5 md:grid-cols-2">
          {(["peach", "lavender", "blue", "yellow", "green", "pink"] as const).map((h, i) => (
            <Card key={h} interactive as="article" className="flex gap-5">
              <Blob size="sm" hue={h} refraction={false} className="mt-1" />
              <div className="min-w-0">
                <p className="noo-h4 text-ink">Card {i + 1}</p>
                <p className="noo-body-sm mt-1 text-ink-2">Scroll so this card passes under the nav bar. The blur should frost it, not hide it.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip hue={h}>{h}</Chip>
                  <Chip hue="grey">grey</Chip>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-end gap-6">
          <div className="relative inline-flex">
            <Blob variant="glass" size="md" label="Bhargav" />
            <Bubble className="absolute bottom-[calc(100%-6px)] left-[calc(100%+8px)] whitespace-nowrap">Keep scrolling.</Bubble>
          </div>
        </div>
      </Section>
    </>
  );
}
