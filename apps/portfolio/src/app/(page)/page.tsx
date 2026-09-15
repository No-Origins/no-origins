import Link from "next/link";
import { Chip, Document, Section, SectionHeader, Text } from "@no-origins/ui";
import { GuidedChat, HostProvider, HostSpeaker } from "@/components/home-host";
import { SectionWidget } from "@/components/section-widget";
import { sections } from "@/content/sections";
import { site } from "@/content/site";

/**
 * The front door. Pages, not a map: the canvas the portfolio used to be went with React Flow on 2026-09-16
 * ("I want to take a different approach later"), and this is the interim layout — the same content, in the
 * reading column, with nothing invented to replace the geometry.
 *
 * The six widgets survived the canvas because they were never part of it: a widget is a bento, it previews its
 * section from about twice the reading distance, and here it is the link to that section's page.
 */
const HREF: Record<string, string> = {
  status: "/status",
  work: "/work",
  cases: "/case-studies",
  projects: "/projects",
  interests: "/interests",
  philosophy: "/philosophy",
};

/**
 * A widget is exactly 640 × 480 — four grid boxes by three — and that is the size it was drawn to be read at.
 * Rather than squash it into a narrower column it is SCALED, the way `/fixtures/bento` scales the overview: a box
 * of the scaled size, with the widget at full size inside it, anchored top-left. The row then wraps on its own:
 * two 480s and a gutter fit the 1120 reading column, one 320 fits a phone, and nothing in between is squashed.
 */
function WidgetLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link href={HREF[id]!} className="block">
      <div className="relative h-[240px] w-[320px] sm:h-[360px] sm:w-[480px]">
        <div className="absolute left-0 top-0 h-[480px] w-[640px] origin-top-left scale-50 sm:scale-75">{children}</div>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <HostProvider>
      <Section aria-labelledby="home-title">
        <SectionHeader level={1} title={"Hi, I'm Bhargav."} lead={site.tagline} titleId="home-title" />
        <div className="mt-8 flex flex-col gap-8">
          <HostSpeaker />
          {site.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- the package rule: images are <img> (§11.2)
            <img
              src={site.photo.src}
              alt={site.photo.alt}
              width={site.photo.width}
              height={site.photo.height}
              className="w-full max-w-[420px] rounded-lg shadow-e1"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Chip hue="peach">curious</Chip>
            <Chip hue="lavender">creative</Chip>
            <Chip hue="yellow">happy</Chip>
            {site.location ? (
              <Text size="small" tone="muted" as="span" className="ml-1">
                Based in {site.location}
              </Text>
            ) : null}
          </div>
          {/* The story is reading matter, so it wears the reading column: 68ch, the body ramp, and the one
              place on the platform where a link inside a sentence is already styled. */}
          <Document>
            <p>
              I&apos;ve spent the last few years inside other people&apos;s products: two WYSIWYG editors on tiptap, the core team of a
              design system, full-stack RAG and agent applications, and now the whole stack at Radise. The through-line is editors,
              design systems, agent systems, and shipping.
            </p>
            <p>
              No Origins is my playground on the internet. Not a fixed list of features: blocks, added over time. This portfolio is
              the first. Every block shares one design system, so a new one looks native the day it ships.
            </p>
            <p>
              If you&apos;re hiring, the work is on <Link href="/work">Work</Link>. If you have an idea, what I&apos;m after and how to
              reach me are on <Link href="/status">Current Status</Link>. If you&apos;re a friend, the tools are on their way. Come
              back; this grows.
            </p>
          </Document>
        </div>
      </Section>

      <Section aria-labelledby="sections-title">
        <SectionHeader
          title="Six sections"
          titleId="sections-title"
          lead="Each one is its own page. The widget is what that section looks like from a distance."
        />
        <div className="flex flex-wrap gap-6">
          {sections.map((sec) => (
            <WidgetLink key={sec.id} id={sec.id}>
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
            </WidgetLink>
          ))}
        </div>
      </Section>

      <Section aria-labelledby="chat-title">
        <SectionHeader
          level={3}
          title="Or say where you want to go"
          titleId="chat-title"
          lead="The blob cannot answer for itself yet, so words are routed to the section they most likely mean."
        />
        <GuidedChat />
      </Section>
    </HostProvider>
  );
}
