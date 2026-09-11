"use client";
import { BlockCard, Button, Card, Chip, Placeholder, SectionWidget } from "@no-origins/ui";
import type { CanvasView, PanelSceneNode, SceneNode, SceneThread } from "@no-origins/ui/canvas";
import { roles } from "@/content/work";
import { sampled, site } from "@/content/site";
import { sections } from "@/content/sections";
import { PanLink } from "./pan-link";

/**
 * The portfolio's map (Design-System.md §8.3, Brand.md §9). Me at the centre with the one blob; the other six
 * sections on a circle of radius 2200 around it — what I made on the right half, who I am on the left.
 *
 * Every coordinate is hand-authored so the server renders the map exactly where the client keeps it. Heights are
 * measured, never guessed (`e2e/.mcp/probe8.mjs`): panels clip what overruns them.
 *
 * Five sections have no copy yet, so they stand up as `Placeholder`s marked `draft`. That is deliberate — the
 * geometry can be reviewed now, and nothing on the canvas pretends to be finished writing.
 */
const BOX = 160;
const COL = 560;
/** Widget size: 4 × 3 boxes exactly (Design-System.md §8.3). */
const WIDGET_W = 4 * BOX;
const WIDGET_H = 3 * BOX;
/**
 * A full view is 8 boxes wide (§8.3), and it spends that on TWO columns rather than on a wider measure: 560 is
 * a reading width and 1280 is not, so widening the panels would have made every one of them worse. Two 560
 * columns with a box-and-a-half between them come to exactly 8 boxes — and because the panels keep their width,
 * every height measured for the old single column is still correct.
 */
const FULL_W = 8 * BOX;
const GUTTER = FULL_W - 2 * COL;   /* 160 */

/**
 * The ring, quantised to boxes (§8.3). It stopped being a circle when full views stopped needing room not to
 * collide: only one is ever open, so they may overlap freely, and the ring only has to hold six 640 × 480
 * widgets. Each entry is the widget's top-left box (col, row) — a box is 160, so (4, −6) is 640, −960.
 *
 * Work on the right half, the person on the left, so a recruiter pans one way and someone curious the other.
 * Every neighbour is at least one empty box away.
 */
const AT = {
  status: { x: -8 * BOX, y: -6 * BOX },
  interests: { x: -13 * BOX, y: -1 * BOX },
  philosophy: { x: -8 * BOX, y: 3 * BOX },
  work: { x: 4 * BOX, y: -6 * BOX },
  cases: { x: 9 * BOX, y: -1 * BOX },
  projects: { x: 4 * BOX, y: 3 * BOX },
} as const;

export const HOST_SAYS = "What are we doing today?";
export const HOST_CANT_CHAT = "I can't chat yet — the model that will live in this blob is still being trained. Pick one of these for now.";

/** The one blob (Brand.md §9): Bhargav's, clear glass, on the origin crosshair. Later it carries the model. */
const blob = (says: string): SceneNode => ({
  kind: "blob",
  id: "me-blob",
  position: { x: -36, y: -304 },                       // centred at (0, −280): the crosshair the grid lines cross
  variant: "glass",
  label: "Bhargav",
  say: says,
});

/** A panel in a section's FULL view: in the DOM always, visible only while that section is open (§8.4). */
function full(id: string, section: string, x: number, y: number, height: number, content: React.ReactNode, label?: string): SceneNode {
  return { kind: "panel", id, section, full: true, position: { x, y }, width: COL, height, surface: "none", label, content };
}

function intro(id: string, section: string, x: number, y: number, height: number, title: string, lead?: string): SceneNode {
  return full(`${id}-intro`, section, x, y, height, (
    <>
      <h2 className="noo-h2 noo-panel__title">{title}</h2>
      {lead ? <p className="noo-lead noo-panel__lead">{lead}</p> : null}
    </>
  ));
}

/**
 * The mark on anything written by the machine rather than by Bhargav (`content/sample.ts`).
 *
 * It borrows `Placeholder`'s `draft` tag on purpose: the map already had one honest way of saying "this is
 * scaffolding", and inventing a second would let the two drift apart. When a real slot is filled the tag stops
 * rendering for that panel by itself, because `sampled()` only knows about slots the sample actually supplied.
 */
function SampleTag({ of }: { of: string }) {
  if (!sampled(of)) return null;
  return <span className="noo-placeholder__tag whitespace-nowrap">sample copy</span>;
}

function slot(id: string, x: number, y: number, height: number, title: string, body: string): SceneNode {
  return full(`${id}-slot`, id, x, y, height, <Placeholder draft title={title}>{body}</Placeholder>);
}

/**
 * One section: the WIDGET the map shows, and the full view behind it (§8.4).
 *
 * The widget sits on its box anchor and is the only part of a section anyone sees until they open it. The full
 * view hangs from the same anchor and is hidden — present in the DOM at every zoom, so every word stays in the
 * accessibility tree and the server renders all of it, but at zero opacity until its section is open.
 */
function section(
  id: keyof typeof AT,
  label: string,
  title: string,
  lead: string | undefined,
  panels: Array<(x: number, y: number) => { node: SceneNode; height: number }>,
): SceneNode[] {
  const at = AT[id];
  const def = sections.find((sec) => sec.id === id);
  const out: SceneNode[] = [];
  if (def) {
    out.push({
      kind: "widget",
      id: `${id}-widget`,
      section: id,
      position: at,
      width: WIDGET_W,
      height: WIDGET_H,
      view: id,
      label: def.title,
      content: (
        <SectionWidget
          hue={def.hue}
          label={def.title}
          eyebrow={def.eyebrow}
          figure={def.figure}
          word={def.word}
          illustration={def.illustration}
          illustrationId={id}
        >
          {def.cells}
        </SectionWidget>
      ),
    });
  }
  void label;
  // the heading spans the whole width; the panels below it flow into two columns
  const headHeight = lead ? 130 : 70;
  out.push({ ...(intro(id, id, at.x, at.y, headHeight, title, lead) as PanelSceneNode), width: FULL_W });
  const top = at.y + headHeight + 40;
  const col = [top, top];                                    // the next free y in each column
  for (const make of panels) {
    const side = col[1]! < col[0]! ? 1 : 0;                  // whichever column is shorter, so neither runs away
    const x = at.x + side * (COL + GUTTER);
    const { node, height } = make(x, col[side]!);
    // every panel a section owns belongs to its full view — tagged here so no call site can forget
    out.push(node.kind === "panel" ? { ...node, section: id, full: true } : { ...node, section: id });
    col[side] = col[side]! + height + 40;
  }
  return out;
}

// ── Me — the centre ────────────────────────────────────────────────────────────────────────────────────────
const me: SceneNode[] = [
  blob(HOST_SAYS),
  {
    kind: "panel",
    id: "me-intro",
    position: { x: -280, y: 100 },
    width: COL,
    height: 120,
    surface: "none",
    content: (
      <>
        <h2 className="noo-h2 noo-panel__title">Hi, I&apos;m Bhargav.</h2>
        <p className="noo-lead noo-panel__lead">{site.tagline}</p>
      </>
    ),
  },
  {
    kind: "panel",
    id: "me-story",
    position: { x: -280, y: 260 },
    width: COL,
    height: 425,
    label: "About Bhargav",
    content: (
      <div className="flex h-full flex-col gap-5">
        {site.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- the package rule: images are <img> (§11.2)
          <img src={site.photo.src} alt={site.photo.alt} width={site.photo.width} height={site.photo.height} className="w-full rounded-lg shadow-e1" />
        ) : null}
        <div className="noo-panel__extra flex flex-wrap items-center gap-2">
          <Chip hue="peach">curious</Chip>
          <Chip hue="lavender">creative</Chip>
          <Chip hue="yellow">happy</Chip>
          {site.location ? <span className="noo-body-sm ml-1 text-muted">Based in {site.location}</span> : null}
        </div>
        <div className="noo-panel__prose noo-body">
          <p>
            I&apos;ve spent the last few years inside other people&apos;s products: two WYSIWYG editors on tiptap, the core team of a design system, full-stack RAG and agent
            applications, and now the whole stack at Radise. The through-line is editors, design systems, agent systems, and shipping.
          </p>
          <p>
            No Origins is my playground on the internet. Not a fixed list of features: blocks, added over time. This portfolio is the first. Every block shares one design
            system, so a new one looks native the day it ships.
          </p>
          <p>
            If you&apos;re hiring, the work is on <PanLink view="work" href="/work">Work</PanLink>. If you have an idea, what I&apos;m after and how to reach me are on{" "}
            <PanLink view="status" href="/status">Current Status</PanLink>. If you&apos;re a friend, the tools are on their way. Come back; this grows.
          </p>
        </div>
      </div>
    ),
  },
];

// ── Current Status — what I'm looking for, and the four ways to reach me ───────────────────────────────────
// Brand.md §3: no single call to action. Each path is visible; the visitor picks. A button appears only when
// its destination exists in content/site.ts.
function ContactPaths() {
  const { email, github, linkedin, x } = site.contact;
  const mail = email ? `mailto:${email}` : undefined;
  const path = (label: string, title: string, line: string, action: React.ReactNode) => (
    <Card surface="glass" padding="sm">
      <div className="noo-panel__extra flex h-full flex-col gap-2">
        <p className="noo-label text-muted">{label}</p>
        <p className="noo-h4 text-ink">{title}</p>
        <p className="noo-body-sm text-ink-2">{line}</p>
        {action ? <div className="mt-auto flex flex-wrap gap-2 pt-2">{action}</div> : null}
      </div>
    </Card>
  );
  return (
    <div className="grid h-full grid-cols-2 gap-4">
      {path("hiring", "Recognise the work", "Four roles, told as blocks, with the résumé as a download. Then tell me what you're building.", (
        <>
          <Button variant="secondary" size="sm" href="/work">See the work</Button>
          {mail ? <Button size="sm" href={mail}>Email me</Button> : null}
        </>
      ))}
      {path("collaborating", "Bring an idea", "Work, a tool a friend needs, a block that should exist. Curiosity is the whole point of this place.", mail ? <Button size="sm" href={mail}>Tell me about it</Button> : null)}
      {path("following", "Watch the blocks land", "This grows as I ship. Come back.", github || linkedin || x ? (
        <>
          {github ? <Button variant="secondary" size="sm" href={github} rel="me">GitHub</Button> : null}
          {linkedin ? <Button variant="secondary" size="sm" href={linkedin} rel="me">LinkedIn</Button> : null}
          {x ? <Button variant="secondary" size="sm" href={x} rel="me">X</Button> : null}
        </>
      ) : null)}
      {path("saying hi", "No agenda needed", "If you just want to say you were here, that counts too.", mail ? <Button variant="ghost" size="sm" href={mail}>Say hi</Button> : null)}
    </div>
  );
}

const status = section("status", "", "What I'm looking for", undefined, [
  (x, y) => ({
    height: 196,
    node: site.status
      ? { kind: "panel", id: "status-now", position: { x, y }, width: COL, height: 196, surface: "none", content: <div className="flex flex-col gap-2"><SampleTag of="status" /><p className="noo-lead noo-panel__lead">{site.status}</p></div> }
      : (slot("status", x, y, 175, "Not written yet", "A sentence or two in Bhargav's words: the kind of role or work he wants next, and whether he's open to freelance or collaborating.") as SceneNode),
  }),
  (x, y) => ({ height: 452, node: { kind: "panel", id: "status-paths", position: { x, y }, width: COL, height: 452, surface: "none", label: "Four ways to get in touch", content: <ContactPaths /> } }),
]);

// ── Work Experience — the only section that is fully written ───────────────────────────────────────────────
const ROLE_H = [375, 345, 300, 215];
const work = section("work", "", "Four roles, told as blocks", "Editors, design systems, agent systems, and shipping full-stack.", [
  ...roles.map((role, i) => (x: number, y: number) => ({
    height: ROLE_H[i]!,
    node: { kind: "panel" as const, id: `work-${["radise", "dataflix", "hashnode", "ttt"][i]}`, position: { x, y }, width: COL, height: ROLE_H[i]!, surface: "none" as const, content: <BlockCard {...role} className="h-full" /> },
  })),
  (x, y) => ({
    height: 68,
    node: {
      kind: "panel" as const,
      id: "work-resume",
      position: { x, y },
      width: COL,
      height: 68,
      surface: "none" as const,
      label: "The résumé",
      content: (
        <div className="noo-panel__extra flex flex-wrap items-center gap-4">
          {site.resumeHref ? <Button variant="secondary" href={site.resumeHref} download>Download the résumé</Button> : null}
          <p className="noo-body-sm text-ink-2">Chosen pieces of this work are on Case Studies.</p>
        </div>
      ),
    },
  }),
]);

// ── Case Studies · Projects · Interests · Philosophy — waiting on copy ─────────────────────────────────────
/** Problem, then what he did, then what changed. Three labelled parts, because that is what a case study is. */
function CaseStudy({ study }: { study: NonNullable<typeof site.caseStudies>[number] }) {
  const part = (label: string, body: string) => (
    <div className="flex flex-col gap-0.5">
      <p className="noo-label text-muted">{label}</p>
      <p className="noo-body-sm text-ink-2">{body}</p>
    </div>
  );
  return (
    <Card padding="sm" className="h-full">
      <div className="noo-panel__extra flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="noo-h4 text-ink">{study.title}</p>
          <SampleTag of="caseStudies" />
        </div>
        {part("the problem", study.problem)}
        {part("what I did", study.approach)}
        {part("what changed", study.outcome)}
      </div>
    </Card>
  );
}

const CASE_H = [336, 336, 336];
const cases = section("cases", "", "Case studies", "Three pieces of the work above, told properly: the problem, what I did, and what changed.", [
  ...(site.caseStudies ?? []).map((study, i) => (x: number, y: number) => ({
    height: CASE_H[i] ?? 270,
    node: {
      kind: "panel" as const,
      id: `cases-${i}`,
      position: { x, y },
      width: COL,
      height: CASE_H[i] ?? 270,
      surface: "none" as const,
      content: <CaseStudy study={study} />,
    },
  })),
  ...(site.caseStudies
    ? []
    : [(x: number, y: number) => ({ height: 195, node: slot("cases", x, y, 195, "Three worth telling properly", "Neptune, Project Vault and GenIQ are already named under Work Experience. Each needs its problem, what Bhargav did, and what changed — the bullets there don't carry that.") })]),
]);

/**
 * Projects is the one section whose v1 IS the empty state, so it is drawn as the finished thing rather than as
 * scaffolding: no `draft` tag, and words that say what will be here and why it is not (Brand.md principle 4).
 * Filling it with three invented projects would have hidden the only part of it that has to be designed well.
 */
const projects = section("projects", "", "Projects", "My own, as they ship. There are none yet, and that is the honest state of it.", [
  (x, y) => ({
    height: 166,
    node: {
      kind: "panel" as const,
      id: "projects-none",
      position: { x, y },
      width: COL,
      height: 166,
      surface: "none" as const,
      content: (
        <Placeholder title="Nothing shipped yet">
          Everything I had was deleted for a clean slate. This page fills as things land, starting with the blocks No Origins is
          made of: the editor, then the agents harness. Both are on the roadmap rather than in a drawer.
        </Placeholder>
      ),
    },
  }),
]);

const interests = section("interests", "", "Interests", "What I'm curious about when nobody is paying me to be. Some of it feeds the work; most of it does not have to.", [
  (x, y) => ({
    height: 246,
    node: site.interests
      ? {
          kind: "panel" as const,
          id: "interests-list",
          position: { x, y },
          width: COL,
          height: 246,
          surface: "none" as const,
          label: "Curious about",
          content: (
            <div className="noo-panel__extra flex h-full flex-col gap-3">
              <SampleTag of="interests" />
              <ul className="noo-body flex flex-col gap-2 text-ink-2">
                {site.interests.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ),
        }
      : slot("interests", x, y, 175, "What I'm curious about", "Outside the work. “curious, creative, happy” is how Bhargav comes across, which isn't the same as what he's into."),
  }),
]);

const philosophy = section("philosophy", "", "Philosophy", "How I think about building things. Mine, not the platform's.", [
  (x, y) => ({
    height: 308,
    node: site.philosophy
      ? {
          kind: "panel" as const,
          id: "philosophy-ideas",
          position: { x, y },
          width: COL,
          height: 308,
          surface: "none" as const,
          content: (
            <div className="flex h-full flex-col gap-3">
              <SampleTag of="philosophy" />
              <div className="noo-panel__prose noo-body">
                {site.philosophy.map((para) => <p key={para.slice(0, 24)}>{para}</p>)}
              </div>
            </div>
          ),
        }
      : slot("philosophy", x, y, 175, "How I think about building", "No Origins has five principles, but those belong to the platform. This one is Bhargav's own, in his words."),
  }),
]);

/** Reading order — declared, because a ring has no natural one (§8.3). Tab order, screen readers, phones, ← / →. */
export const portfolioScene = (says: string): SceneNode[] => [
  ...me.map((n) => (n.id === "me-blob" ? blob(says) : n)),
  ...status,
  ...work,
  ...cases,
  ...projects,
  ...interests,
  ...philosophy,
];

export const portfolioViews: CanvasView[] = [
  // "/" is the map (§8.4), so the first view fits the whole ring — Me sits at the middle of it by construction.
  { id: "me", label: "Me", href: "/", frame: "fit", nodeIds: ["me-blob", "me-intro", "me-story", ...(Object.keys(AT).map((k) => `${k}-widget`))] },
  { id: "status", label: "Status", href: "/status", nodeIds: ["status-widget"] },
  { id: "work", label: "Work", href: "/work", nodeIds: ["work-widget"] },
  { id: "cases", label: "Cases", href: "/case-studies", nodeIds: ["cases-widget"] },
  { id: "projects", label: "Projects", href: "/projects", nodeIds: ["projects-widget"] },
  { id: "interests", label: "Interests", href: "/interests", nodeIds: ["interests-widget"] },
  { id: "philosophy", label: "Philosophy", href: "/philosophy", nodeIds: ["philosophy-widget"] },
];

/** The ring's skeleton: a spoke from the blob to each section, so the structure survives the map zoom (§8.1). */
export const portfolioThreads: SceneThread[] = portfolioViews.slice(1).map((v) => ({ from: "me-blob", to: v.nodeIds[0]! }));
