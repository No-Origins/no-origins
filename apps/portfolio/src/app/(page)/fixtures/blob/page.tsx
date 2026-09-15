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
            Flat colour on the ground, drawn on one 96 × 64 box and scaled. Move the pointer near one and it looks at you. Every few seconds one of them blinks; none blink together.
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

      <Section title="Three variants" note="A character IS its colour — the hue's pastel, opaque, with a drop shadow under it. The host is the surface itself with a hairline, so you can tell which one is you. The logotype is the outline, in whatever colour the text is.">
        <div className="flex flex-wrap items-end gap-10">
          <figure className="flex flex-col items-start gap-3">
            <Blob variant="character" size="lg" label="Portfolio blob, peach" />
            <Caption>character · accent (peach) · lg</Caption>
          </figure>
          <figure className="flex flex-col items-start gap-3">
            <Blob variant="host" size="lg" label="Bhargav, the host" />
            <Caption>host · the surface · lg</Caption>
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

      <Section title="The family" note="Seven blobs, one per block. Each one the hue at full strength; the host has no hue at all.">
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
            <Blob variant="host" size="md" label="Bhargav" />
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

      <Section title="In a row" note="How they sit together at nav and sm — list avatars, chips, block cards.">
        <div className="flex flex-wrap items-center gap-6">
          <div className="noo-surface noo-surface--2 flex items-center gap-3 rounded-pill px-4 py-2">
            <Blob size="nav" variant="host" label="Bhargav" />
            <span className="text-[15px] font-medium text-ink">Hey! What&apos;s on your mind today?</span>
          </div>
          {characterHues.map((h) => (
            <span key={h} className="noo-surface noo-surface--1 inline-flex items-center gap-2 rounded-pill py-1 pl-1 pr-3 text-[14px] font-medium text-ink">
              <Blob size="sm" hue={h} />
              {owner(h)}
            </span>
          ))}
        </div>
      </Section>

      <p className="mt-20 max-w-[62ch] font-mono text-[12px] leading-[1.6] text-muted">
        Reduced motion: no breathing, no looking; blinks slow to every 8–14s. The blob is flat since v1 (2026-09-16): no frost,
        no refraction band, no rim light, so there is nothing left for reduced transparency to turn off.
      </p>
    </div>
  );
}
