import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Blob, Wordmark, blobSizes, blocks, hues, type Hue , ThemeSwitch } from "@no-origins/ui";

export const metadata: Metadata = { title: "Blob fixture", robots: { index: false } };

// Build step 2 fixture: the blob and the wordmark in every variant, size and state, over the real grid.
// Review against the Figma component; the numbers are the Blob Lab's (Design-System.md §3–§4).

const owner = (hue: Hue) => Object.entries(blocks).find(([, h]) => h === hue)?.[0];
const characterHues = hues.filter((h): h is Exclude<Hue, "grey"> => h !== "grey");

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-muted">{children}</p>;
}

function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="text-[20px] font-semibold text-ink">{title}</h2>
      {note ? <p className="mt-1 max-w-[62ch] text-[15px] leading-[1.5] text-ink-2">{note}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] leading-[1.4] text-muted">{children}</span>;
}

export default function BlobFixture() {
  return (
    <div className="noo-container py-14">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Eyebrow>no origins · build step 2 · fixture</Eyebrow>
          <h1 className="mt-3 font-display text-[44px] leading-[1.02] text-ink">The blob, every way it appears</h1>
          <p className="mt-4 max-w-[60ch] text-[17px] leading-[1.5] text-ink-2">
            Tinted glass over the grid. Move the pointer near one and it looks at you. Every few seconds one of them blinks; none blink together.
          </p>
        </div>
        <ThemeSwitch />
      </div>

      <Section title="Wordmark" note="Bowlby One caps, tracking +0.01em; the logotype blob at 0.82em fits the caps. In running text the name is lowercase, Hanken Grotesk 600.">
        <div className="flex flex-col gap-6">
          <Wordmark className="text-[56px]" />
          <Wordmark className="text-[34px]" />
          <Wordmark className="text-[22px]" />
          <p className="max-w-[60ch] text-[16px] text-ink-2">
            In a sentence the name reads as <Wordmark as="text" className="text-ink" /> and never as the caps lockup.
          </p>
        </div>
      </Section>

      <Section title="Three variants" note="Every character is glass with colour in it. The host is the same glass with nothing in it. The logotype is the outline, in whatever colour the text is.">
        <div className="flex flex-wrap items-end gap-10">
          <figure className="flex flex-col items-start gap-3">
            <Blob variant="character" size="lg" label="Portfolio blob, peach" />
            <Caption>character · accent (peach) · lg</Caption>
          </figure>
          <figure className="flex flex-col items-start gap-3">
            <Blob variant="glass" size="lg" label="Bhargav, the host" />
            <Caption>glass · the host · lg</Caption>
          </figure>
          <figure className="flex flex-col items-start gap-3 text-ink">
            <Blob variant="logotype" size="lg" label="No Origins mark" />
            <Caption>logotype · currentColor · lg</Caption>
          </figure>
          <figure className="flex flex-col items-start gap-3 text-peach-deep">
            <Blob variant="logotype" size="lg" />
            <Caption>logotype · text-peach-deep</Caption>
          </figure>
        </div>
      </Section>

      <Section title="The family" note="Seven blobs, one per block. Each tint at 24% (36% in the dark); the host has no tint at all.">
        <div className="flex flex-wrap items-end gap-8">
          {characterHues.map((h) => (
            <figure key={h} className="flex flex-col items-start gap-3">
              <Blob hue={h} size="md" label={`${owner(h)} blob`} />
              <Caption>
                {h}
                <br />
                {owner(h)}
              </Caption>
            </figure>
          ))}
          <figure className="flex flex-col items-start gap-3">
            <Blob variant="glass" size="md" label="Bhargav" />
            <Caption>
              host
              <br />
              bhargav
            </Caption>
          </figure>
        </div>
      </Section>

      <Section title="Sizes" note="All 3 : 2, scaled from the 96 × 64 Figma frame. The eyes scale with the box.">
        <div className="flex flex-wrap items-end gap-8">
          {(Object.keys(blobSizes) as Array<keyof typeof blobSizes>)
            .filter((s) => s !== "inline")
            .map((s) => (
              <figure key={s} className="flex flex-col items-start gap-3">
                <Blob size={s} />
                <Caption>
                  {s}
                  <br />
                  {blobSizes[s]} × {Math.round((blobSizes[s] as number) * 2) / 3}
                </Caption>
              </figure>
            ))}
        </div>
        <p className="mt-8 max-w-[60ch] text-[19px] leading-[1.5] text-ink-2">
          And <Blob size="inline" label="inline blob" /> inline, 1.5em wide, sitting in running text at whatever size the text is.
        </p>
      </Section>

      <Section title="States" note="Idle breathes over six seconds and blinks every four to nine. Asleep, the eyes close and the breath slows to nine seconds. Interactive scales 1.04 on hover.">
        <div className="flex flex-wrap items-end gap-10">
          <figure className="flex flex-col items-start gap-3">
            <Blob size="lg" label="idle" />
            <Caption>idle · breathe · blink · look</Caption>
          </figure>
          <figure className="flex flex-col items-start gap-3">
            <Blob size="lg" state="sleep" hue="lavender" label="asleep" />
            <Caption>sleep · lavender · 9s breath</Caption>
          </figure>
          <figure className="flex flex-col items-start gap-3">
            <Blob size="lg" interactive hue="blue" label="interactive" />
            <Caption>interactive · hover 1.04</Caption>
          </figure>
          <figure className="flex flex-col items-start gap-3">
            <Blob size="lg" hue="green" blink={false} look={false} breathe={false} label="still" />
            <Caption>still · no motion</Caption>
          </figure>
        </div>
      </Section>

      <Section title="Refraction follows the grid" note="The band inside the pill re-draws the grid lines behind it, magnified 6%, phase-aligned to the nearest ground. Since the ground moved from 32px dots to 160px boxes the effect only shows where a line actually passes through a blob — which is why the one glass blob sits on the canvas origin, with both axes through it. On a solid card there is no grid to bend, so refraction is turned off.">
        <div className="grid gap-6 md:grid-cols-3">
          <figure className="flex flex-col gap-3">
            <div className="flex h-[168px] items-center justify-center rounded-lg">
              <Blob size="lg" />
            </div>
            <Caption>page ground · 160px boxes · no line here to bend</Caption>
          </figure>
          <figure className="flex flex-col gap-3">
            <div className="noo-ground flex h-[168px] items-center justify-center rounded-lg shadow-e1" style={{ "--grid-box": "56px" } as React.CSSProperties}>
              <Blob size="lg" hue="yellow" />
            </div>
            <Caption>a tighter local ground · 56px · a line through the pill</Caption>
          </figure>
          <figure className="flex flex-col gap-3">
            <div className="flex h-[168px] items-center justify-center rounded-lg bg-surface shadow-e1">
              <Blob size="lg" hue="pink" refraction={false} />
            </div>
            <Caption>solid surface · refraction off</Caption>
          </figure>
        </div>
      </Section>

      <Section title="In a row" note="How they sit together at nav and sm — list avatars, chips, block cards.">
        <div className="flex flex-wrap items-center gap-6">
          <div className="noo-glass noo-glass--2 flex items-center gap-3 rounded-pill px-4 py-2">
            <Blob size="nav" variant="glass" label="Bhargav" />
            <span className="text-[15px] font-medium text-ink">Hey! What&apos;s on your mind today?</span>
          </div>
          {characterHues.map((h) => (
            <span key={h} className="noo-glass noo-glass--1 inline-flex items-center gap-2 rounded-pill py-1 pl-1 pr-3 text-[14px] font-medium text-ink">
              <Blob size="sm" hue={h} refraction={false} />
              {owner(h)}
            </span>
          ))}
        </div>
      </Section>

      <p className="mt-20 max-w-[62ch] font-mono text-[12px] leading-[1.6] text-muted">
        Reduced motion: no breathing, no looking; blinks slow to every 8–14s. Reduced transparency: the frost goes, the body
        thickens to 55%, the refraction band hides. No backdrop-filter: the body gains 20%.
      </p>
    </div>
  );
}
