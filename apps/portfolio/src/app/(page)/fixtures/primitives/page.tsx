import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Blob, Bubble, Button, Card, Chip, Field, Glass, Toggle, blocks, hues, type Hue , ThemeSwitch } from "@no-origins/ui";

export const metadata: Metadata = { title: "Primitives fixture", robots: { index: false } };

// Build step 3 fixture: the glass surface and the six primitives, every variant and state, over the real grid.

const owner = (hue: Hue) => Object.entries(blocks).find(([, h]) => h === hue)?.[0] ?? "host";

function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="noo-h4 text-ink">{title}</h2>
      {note ? <p className="noo-body-sm mt-1 max-w-[62ch] text-ink-2">{note}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
function Eye() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7" fill="currentColor" />
    </svg>
  );
}
function Arrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export default function PrimitivesFixture() {
  return (
    <div className="noo-container py-14">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="noo-label text-muted">no origins · build step 3 · fixture</p>
          <h1 className="noo-h1 mt-3 text-ink">Glass and the six primitives</h1>
          <p className="noo-lead mt-4 max-w-[60ch] text-ink-2">
            One surface recipe at three levels, and the pieces every block is assembled from. Tab through it: every control shows the same focus ring.
          </p>
        </div>
        <ThemeSwitch />
      </div>

      <Section title="Type scale" note="Bowlby One only from h2 up; Hanken Grotesk 600 for h3 and h4; JetBrains Mono for labels and code.">
        <div className="flex flex-col gap-4 text-ink">
          <p className="noo-display-2">Curious &amp; bold</p>
          <p className="noo-h1">h1 · Editors, systems, agents</p>
          <p className="noo-h2">h2 · The smallest Bowlby</p>
          <p className="noo-h3">h3 · Block titles are Hanken 600</p>
          <p className="noo-h4">h4 · Card titles</p>
          <p className="noo-lead max-w-[60ch]">lead · An intro paragraph at 19px, line height one and a half, a measure of sixty characters.</p>
          <p className="noo-body max-w-[65ch]">body · Sixteen over one point five five. The default for everything you read on the site, including this sentence, which runs long enough to wrap.</p>
          <p className="noo-body-sm max-w-[65ch] text-ink-2">body-sm · Fourteen and a half, for secondary copy.</p>
          <p className="noo-bubble-text">bubble · What are we doing today?</p>
          <p className="noo-caption text-ink-2">caption · Thirteen, medium, for labels above fields and under figures.</p>
          <p className="noo-label text-muted">label · eyebrow in mono</p>
          <p className="noo-code">code · const blocks = 7;</p>
        </div>
      </Section>

      <Section title="Glass" note="Three levels of one recipe. Over the grid the dots stay faintly there; the brighter top edge and the sweep are what make it liquid.">
        <div className="grid gap-5 md:grid-cols-3">
          {([1, 2, 3] as const).map((level) => (
            <Glass key={level} level={level} radius="lg" className="p-5">
              <p className="noo-label text-muted">glass-{level}</p>
              <p className="noo-h4 mt-2 text-ink">{level === 1 ? "Bubbles, chips, small cards" : level === 2 ? "Nav bar, chat input, panels" : "Sheets, dialogs, menus"}</p>
              <p className="noo-body-sm mt-2 text-ink-2">{level === 1 ? "58% fill · 14px blur · e1" : level === 2 ? "66% fill · 18px blur · e2" : "74% fill · 22px blur · e4"}</p>
            </Glass>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Glass level={1} radius="pill" className="px-4 py-2 text-[14px] font-medium text-ink">radius pill</Glass>
          <Glass level={1} radius="md" className="px-4 py-2 text-[14px] font-medium text-ink">radius md</Glass>
          <Glass level={1} radius="xs" className="px-4 py-2 text-[14px] font-medium text-ink">radius xs</Glass>
          <Glass as="section" level={2} radius="xl" className="px-5 py-3 text-[14px] font-medium text-ink">as=&quot;section&quot; · radius xl</Glass>
        </div>
      </Section>

      <Section title="Button" note="A pill, 44px minimum. Primary is ink; secondary is noo-glass--1 with its hairline; ghost is text that underlines on hover. Small is 36px.">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Say hello</Button>
            <Button variant="secondary">See the work</Button>
            <Button variant="ghost">Read more</Button>
            <Button leading={<Eye />}>With a leading icon</Button>
            <Button variant="secondary" trailing={<Arrow />}>Next block</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small primary</Button>
            <Button size="sm" variant="secondary">Small secondary</Button>
            <Button size="sm" variant="ghost">Small ghost</Button>
            <Button href="/fixtures/blob" variant="secondary" size="sm">As a link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <Button variant="ghost" disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      <Section title="Chip" note="28px pill. The hue's pastel at 45% over the surface, ink text, the deep tier for the dot. A chip with onClick becomes a button; pressed is the selected filter.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {hues.map((h) => (
              <Chip key={h} hue={h}>
                {owner(h)}
              </Chip>
            ))}
            <Chip>accent</Chip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip hue="lavender" leading={<Eye />}>with an icon</Chip>
            <Chip hue="blue" dot={false}>no dot</Chip>
            <Chip hue="green" href="/fixtures/blob">as a link</Chip>
            <Chip hue="yellow" as="button" pressed={false}>filter</Chip>
            <Chip hue="yellow" as="button" pressed>filter · pressed</Chip>
          </div>
        </div>
      </Section>

      <Section title="Card" note="Surface or noo-glass--1, radius 20, padding 24 (small: 20). Interactive cards lift a pixel and a level on hover. Below, the composition the Work section will use: card, blob at sm, h4, a line, chips.">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <p className="noo-label text-muted">solid</p>
            <p className="noo-h4 mt-2 text-ink">A surface card</p>
            <p className="noo-body-sm mt-2 text-ink-2">Padding 24, e1, radius 20. The default for content that has to be read.</p>
          </Card>
          <Card surface="glass">
            <p className="noo-label text-muted">glass</p>
            <p className="noo-h4 mt-2 text-ink">A glass card</p>
            <p className="noo-body-sm mt-2 text-ink-2">Glass-1 over the grid. For panels the platform should show through.</p>
          </Card>
          <Card interactive as="a" href="/fixtures/blob" padding="sm">
            <p className="noo-label text-muted">interactive · sm · as=&quot;a&quot;</p>
            <p className="noo-h4 mt-2 text-ink">Hover me</p>
            <p className="noo-body-sm mt-2 text-ink-2">Lifts e1 → e2 and one pixel. Padding 20.</p>
          </Card>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {(["lavender", "blue"] as const).map((h) => (
            <Card key={h} interactive as="article" className="flex gap-5">
              <Blob size="sm" hue={h} refraction={false} className="mt-1" />
              <div className="min-w-0">
                <p className="noo-h4 text-ink">{h === "lavender" ? "A rich-text editor, twice" : "An agents harness"}</p>
                <p className="noo-body-sm mt-1 text-ink-2">{h === "lavender" ? "Two production editors on tiptap; the second one taught the first one's lessons." : "Cloud core, local agents, a thin client — the thing this whole site is a front door for."}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip hue={h}>{owner(h)}</Chip>
                  <Chip hue="grey">typescript</Chip>
                  <Chip hue="grey">react</Chip>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Bubble" note="Glass-1 pill of real text, 15 over 1.4, padding 10 × 16. Tint mixes a hue's pastel at 45%. Anchored top-right of a blob with an 8px gap; the pop plays on mount.">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <Bubble>What are we doing today?</Bubble>
            <Bubble tint="peach">Start with the portfolio.</Bubble>
            <Bubble tint="lavender">The editor is the deepest block.</Bubble>
            <Bubble tint="blue">I&apos;m the agents harness, and this bubble wraps when it has more to say than fits on a line.</Bubble>
          </div>
          <div className="flex flex-wrap items-end gap-14 pt-12">
            <div className="relative inline-flex">
              <Blob variant="glass" size="md" label="Bhargav" />
              <Bubble pop className="absolute bottom-[calc(100%-6px)] left-[calc(100%+8px)] whitespace-nowrap">
                Hey! What&apos;s on your mind today?
              </Bubble>
            </div>
            <div className="relative ml-56 inline-flex">
              <Blob hue="green" size="md" label="writing" />
              <Bubble pop tint="green" className="absolute bottom-[calc(100%-6px)] left-[calc(100%+8px)] whitespace-nowrap">
                Not here yet.
              </Bubble>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Field" note="Label above in caption; a noo-glass--1 box, radius 14, 48px tall; the focus ring is 1.5px accent-deep inside and 3px accent at 25% outside. Errors turn it --bad and are announced.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Name" placeholder="What should the blobs call you?" />
          <Field label="Email" type="email" placeholder="you@somewhere.com" hint="Only for the reply. Never shared." />
          <Field label="Site" placeholder="bhargav" leading={<span>https://</span>} trailing={<span>.no-origins.com</span>} />
          <Field label="Handle" defaultValue="no origins" error="Handles can't contain spaces." />
          <Field label="Search" placeholder="Search the blocks" leading={<Eye />} disabled />
          <Field label="Message" multiline placeholder="Say what's on your mind." className="md:col-span-2" />
        </div>
      </Section>

      <Section title="Toggle" note="44 × 26. On is an ink track with a ground knob; off is ink at 18% with a surface knob. The hit target is 44px tall even though the track is 26.">
        <div className="flex flex-wrap items-center gap-8">
          <Toggle label="Breathing" defaultChecked />
          <Toggle label="Look at the pointer" />
          <Toggle label="Disabled, on" defaultChecked disabled />
          <Toggle label="Disabled, off" disabled />
          <Toggle aria-label="Unlabelled toggle" defaultChecked />
        </div>
      </Section>

      <p className="noo-code mt-20 max-w-[62ch] text-[12px] text-muted">
        Focus: 2px --accent-deep ring, 2px out, on every button, chip, toggle, interactive card and blob. Reduced motion: no lifts, no transitions.
      </p>
    </div>
  );
}
