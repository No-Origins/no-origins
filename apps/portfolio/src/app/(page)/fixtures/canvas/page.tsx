import type { Metadata } from "next";
import { BlockCard, Chip, Section, SectionHeader } from "@no-origins/ui";
import { roles } from "@/content/work";
import { roadmap } from "@/content/roadmap";

export const metadata: Metadata = { title: "Canvas nodes", robots: { index: false } };

/**
 * Step 9's fixture: the canvas's node types and its level-of-detail tiers (Design-System.md §8.2/§8.4), out of the
 * canvas and side by side. The tiers key off `data-tier` on `.noo-panel`, so they can be reviewed here without
 * hunting for a zoom level — which is the whole point of having them in CSS.
 */
const TIERS = [
  { tier: "map", zoom: "below 0.45", line: "The map: plates, labels and threads. Body text at this scale is noise." },
  { tier: "titles", zoom: "0.45 – 0.75", line: "Enough to choose where to go: meta and title." },
  { tier: "full", zoom: "0.75 and up", line: "Reading distance. Everything." },
] as const;

export default function CanvasFixture() {
  const role = roles[2]!;
  const item = roadmap[0]!;
  return (
    <>
      <Section aria-labelledby="tiers-title">
        <SectionHeader
          level={1}
          label="step 9 · canvas nodes"
          title="Level of detail"
          titleId="tiers-title"
          lead="A panel at each of the three zoom tiers. Opacity only: nothing is unmounted or hidden, because a screen reader has no zoom level."
        />
        <div className="grid gap-8 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.tier} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Chip hue="lavender">{t.tier}</Chip>
                <span className="noo-label text-muted">{t.zoom}</span>
              </div>
              <p className="noo-body-sm text-ink-2">{t.line}</p>
              <div className="noo-panel noo-panel--bare h-[340px] w-full" data-tier={t.tier}>
                <div className="noo-panel__content">
                  <BlockCard {...role} className="h-full" />
                </div>
              </div>
              <div className="noo-glass noo-glass--1 noo-panel noo-panel--glass h-[200px] w-full" data-tier={t.tier}>
                <div className="noo-panel__content">
                  <h3 className="noo-h3 noo-panel__title">One system, every block</h3>
                  <p className="noo-body-sm noo-panel__lead">Each block owns one hue. The clear one is me: I&apos;m made of the platform.</p>
                </div>
              </div>
              <div className="noo-panel noo-panel--bare h-[300px] w-full" data-tier={t.tier}>
                <div className="noo-panel__content">
                  <BlockCard {...item} className="h-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section aria-labelledby="region-title">
        <SectionHeader
          level={3}
          label="the region node"
          title="The map label"
          titleId="region-title"
          lead="80px in canvas units, because it is the one heading that has to read at zoom 0.24. Decorative: the section's real h2 lives in its intro panel."
        />
        <div className="flex flex-col gap-10">
          <div className="noo-region h-[120px] w-[560px] max-w-full">
            <span className="noo-region__label">work</span>
            <span className="noo-region__rule" />
          </div>
          <div>
            <p className="noo-label mb-3 text-muted">the same label as the map draws it, at 0.24</p>
            <div className="w-[560px] max-w-full origin-top-left scale-[0.24]">
              <div className="noo-region h-[120px] w-[560px]">
                <span className="noo-region__label">work</span>
                <span className="noo-region__rule" />
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
