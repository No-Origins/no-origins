import type { Metadata } from "next";
import { Glyph, Section, SectionHeader, glyphNames, type GlyphName, type Hue } from "@no-origins/ui";
import { SectionWidget } from "@/components/section-widget";
import { sections } from "@/content/sections";

export const metadata: Metadata = { title: "Bento widgets", robots: { index: false } };

/**
 * Step 12's fixture (Design-System.md §8.3–8.4): the six section widgets, at full size and at the 0.27 overview,
 * in the real tokens. This is the review surface — nothing goes on the canvas until these are approved here.
 *
 * The six used to be six hand-written grids on this page. They are now one `SectionWidget` fed from
 * `content/sections.tsx`, so the three rules every widget has to obey — one loud cell, the diagonal, a field
 * illustration drawn by the one generator — are enforced by the component instead of re-typed six times.
 */
const OVERVIEW = 0.27;
const W = 640;
const H = 480;

const HUE: Record<GlyphName, Hue> = { status: "blue", work: "peach", cases: "lavender", projects: "green", interests: "yellow", philosophy: "pink" };

export default function BentoFixture() {
  return (
    <>
      <Section aria-labelledby="bento-title">
        <SectionHeader
          level={1}
          label="step 12 · section widgets"
          title="Six sections, from a distance"
          titleId="bento-title"
          lead="The canvas is a grid of 160-unit boxes, and every bento cell sits in one with 8 of padding — so a cell is 144, a 4 × 3 widget is exactly 640 × 480, and a cell spanning two boxes spans two. Shown here at 1:1 over the same grid. One loud cell per widget, in the section's hue, carrying a field illustration drawn by the generator. The line under each title is what tells that section apart from the other five."
        />
        <div className="flex flex-col gap-14">
          {sections.map((sec) => (
            <div key={sec.id} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <p className="noo-h4 text-ink">{sec.title}</p>
                <p className="noo-label text-muted">{sec.id} · {sec.hue}</p>
                <p className="noo-body-sm w-full max-w-[68ch] text-ink-2">{sec.signature}</p>
              </div>
              {/* one box of padding all round, so the widget's outer edge sits on a grid line and every cell in its box */}
              <div className="noo-ground overflow-x-auto rounded-lg" style={{ padding: "var(--grid-box)" }}>
                <SectionWidget
                  hue={sec.hue}
                  label={sec.title}
                  eyebrow={sec.eyebrow}
                  figure={sec.figure}
                  word={sec.word}
                  illustration={sec.illustration}
                  illustrationId={sec.id}
                >
                  {sec.cells}
                </SectionWidget>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section aria-labelledby="overview-title">
        <SectionHeader level={3} label="the overview · 0.27" title="What a visitor sees from the map" titleId="overview-title" lead="The same six at the zoom the whole ring fits a 1440 × 900 viewport. The figure and the section word should read; the detail shouldn't, and that's correct." />
        <div className="noo-ground flex flex-wrap gap-4 rounded-lg p-6">
          {sections.map((sec) => (
            <div key={sec.id} className="relative overflow-hidden" style={{ width: W * OVERVIEW, height: H * OVERVIEW }}>
              <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${OVERVIEW})`, width: W, height: H }}>
                <SectionWidget hue={sec.hue} label={sec.title} eyebrow={sec.eyebrow} figure={sec.figure} word={sec.word} illustration={sec.illustration}>
                  {sec.cells}
                </SectionWidget>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section aria-labelledby="ill-title">
        <SectionHeader
          level={3}
          label="illustrations · first six"
          title="The six they replace"
          titleId="ill-title"
          lead="The original six, drawn from the old grammar of six primitives. They are corner objects, not fields, and the widgets above no longer use them — they are shown until the grammar is deleted so the two can be compared. Illustrations.md §6.1 and §10.2."
        />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {glyphNames.map((name) => (
            <figure key={name} className="flex flex-col items-center gap-3">
              <div className="noo-bento__cell noo-bento__cell--quiet flex w-full items-center justify-center p-4" style={{ aspectRatio: "1 / 1", "--bento-hue": `var(--${HUE[name]})` } as React.CSSProperties}>
                <Glyph name={name} hue={HUE[name]} className="w-full" />
              </div>
              <div className="noo-bento__cell noo-bento__cell--fill flex w-full items-center justify-center p-4" style={{ aspectRatio: "1 / 1", "--bento-hue": `var(--${HUE[name]})`, "--bento-hue-ink": `var(--${HUE[name]}-ink)` } as React.CSSProperties}>
                <Glyph name={name} hue={HUE[name]} className="w-full" />
              </div>
              <figcaption className="noo-label text-muted">{name} · {HUE[name]}</figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </>
  );
}
