import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Blob, Button, Carousel, Chip, Heading, Label, MediaCard, Quote,
  Row, Stack, Step, Steps, Text,
} from "@no-origins/ui";

export const metadata: Metadata = { title: "Patterns fixture", robots: { index: false } };

/**
 * Steps, Quote, MediaCard, Carousel — built 2026-09-11 from Bhargav's references.
 *
 * The references leaned on photographs; three of the five were nothing but. That was against the rule at the
 * time, and the rule was then reversed the same day — photographs are allowed, illustrations are still code
 * (Design-System.md §13). So the media regions here show what they take: an illustration, a blob, or the hue's
 * own wash. A real photograph goes in the same slot through `Image`, and there is no photograph on the platform
 * yet to show honestly, so none is invented here.
 */

function Case({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-16">
      <Heading level={4}>{title}</Heading>
      {note ? <Text size="small" tone="muted" className="mt-1 max-w-[64ch]">{note}</Text> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function PatternsFixture() {
  return (
    <div className="noo-container py-14">
      <Label className="text-muted">no origins · patterns · fixture</Label>
      <Heading level={2} className="mt-2">Steps · Quote · MediaCard · Carousel</Heading>
      <Text size="lead" className="mt-3 max-w-[64ch] text-ink-2">
        Four patterns from the references, built out of the system rather than traced from the pictures.
      </Text>

      <Case
        title="Steps — the numbering is a counter, not a prop"
        note="An index on each step is a number that can disagree with the order it renders in, and under free composition that disagreement is one drag away. Reorder these and they renumber themselves."
      >
        <Steps hue="peach">
          <Step title="Discover">We start with a short call to understand what you actually need, not just what you think you are asking for.</Step>
          <Step title="Design">A focused first draft, shaped around the one thing that matters most — not a dozen options to choose between.</Step>
          <Step title="Build">The draft becomes the real thing, tested under real conditions before it ever reaches you.</Step>
          <Step title="Deliver">Handed off with everything you need to keep going — no loose ends, no follow-up scramble.</Step>
        </Steps>
      </Case>

      <Case title="Steps, across" note="Below 640 it stacks regardless: four columns of prose on a phone is unreadable, and that is a media query rather than a prop so the server gets it right too.">
        <Steps hue="blue" orientation="horizontal">
          <Step title="Discover">A short call.</Step>
          <Step title="Design">One focused draft.</Step>
          <Step title="Build">Tested before it ships.</Step>
          <Step title="Deliver">No loose ends.</Step>
        </Steps>
      </Case>

      <Case
        title="Quote — a figure, a blockquote and a figcaption"
        note={
          <>
            A <span className="noo-code">&lt;figure&gt;</span> holding a <span className="noo-code">&lt;blockquote&gt;</span> and
            a <span className="noo-code">&lt;figcaption&gt;</span>, because that is exactly what this is and the markup is free.
            The rule beside the name is a border, not a decorative quotation mark. The media slot is portrait-shaped,
            so it wants a portrait: a blob here, an <span className="noo-code">Image</span> once there is a real
            photograph to put in it. A field illustration is tuned to fill a square cell and reads as stray arcs
            when it is sliced into this shape — the slot is the constraint, not the component.
          </>
        }
      >
        <Quote
          figure={{ value: "98%", label: "on-time delivery" }}
          by="Elena Duarte"
          role="Operations Manager at Harbor & Finch"
          media={<Blob size="hero" hue="lavender" label="Elena" />}
        >
          Planning used to be guesswork. Now the whole week settles itself by Monday.
        </Quote>
      </Case>

      <Case title="MediaCard — a picture beside the words" note="The media region takes an Illustration, a Blob or a photograph through Image. Given none of those it fills with the hue's own wash under the grain, which is a designed empty state rather than a grey box.">
        <Stack gap={24}>
          <MediaCard
            hue="lavender"
            meta="Published recently"
            title="The rise of ambient computing"
            line="Technology is becoming quieter, smarter, and more seamlessly integrated into everyday environments."
            footer={
              <>
                <Chip hue="lavender">Future tech</Chip>
                <Button size="sm" variant="primary">Read more</Button>
              </>
            }
          />
          <MediaCard
            hue="green"
            meta="No media passed"
            title="The hue's wash, under the grain"
            line="What the region looks like before anything is placed in it."
            layout="beside"
          />
        </Stack>
      </Case>

      <Case
        title="Carousel — a scroll container, not a transform"
        note="CSS scroll-snap does the snapping, so it works before hydration, with a trackpad, with a swipe, with arrow keys on the focused track, and with a screen reader's own scrolling. The script adds two things: which slide is current, and dots that scroll to one."
      >
        <Carousel label="What people said" peek="md" gap={24}>
          <Quote figure={{ value: "98%", label: "on-time delivery" }} by="Elena Duarte" role="Operations Manager">
            Planning used to be guesswork. Now the whole week settles itself by Monday.
          </Quote>
          <Quote by="Ravi Menon" role="Head of Platform" media={<Blob size="lg" hue="blue" />}>
            It reads like one thing, not five things that happen to share a font.
          </Quote>
          <Quote figure={{ value: "4", label: "roles, so far" }} by="Bhargav" role="No Origins">
            Editors, design systems, agent systems, and shipping.
          </Quote>
        </Carousel>
      </Case>

      <Case title="Carousel of cards" note="The same track, different slides. `peek` is what tells you there is another one — a dot row is a poor substitute for seeing the edge of the next card.">
        <Carousel label="Recent writing" peek="sm" gap={16}>
          <MediaCard hue="peach" meta="Case study" title="Neptune, Hashnode's editor" line="A year of owning a WYSIWYG editor on tiptap." footer={<Chip hue="peach">Editors</Chip>} />
          <MediaCard hue="blue" meta="Case study" title="GenIQ" line="Full-stack retrieval apps and agents that do work." footer={<Chip hue="blue">Agents</Chip>} />
          <MediaCard hue="green" meta="Case study" title="Project Vault" line="A storage layer with a unified file explorer." footer={<Chip hue="green">Full-stack</Chip>} />
        </Carousel>
      </Case>

      <Case title="Steps, Quote and a Row together" note="The point of the four: they compose with everything already in the system, because none of them invented a scale, a hue or a spacing of its own.">
        <Row gap={24} align="start">
          <Steps hue="yellow" className="flex-1 min-w-[280px]">
            <Step title="Ask">One question at a time.</Step>
            <Step title="Answer">In the fewest words that are still true.</Step>
          </Steps>
          <div className="flex-1 min-w-[280px]">
            <Quote by="The system" role="Design-System.md §1">
              Every component reads only tokens.
            </Quote>
          </div>
        </Row>
      </Case>
    </div>
  );
}
