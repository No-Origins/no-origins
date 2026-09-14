import type { SceneDocument, SlotChild } from "@no-origins/ui/document";

/**
 * The portfolio's map as a DOCUMENT (Scene-Schema.md §1) — what `scene.tsx` hand-writes, said as data.
 *
 * This is step 6 of Admin.md §13: the read path, on a fixture, before any editor exists. `/fixtures/document`
 * renders it through the adapter and the review compares the result with `/` pixel for pixel. Where the two
 * differ, the difference is a finding about the schema or the registry and is listed on that page; nothing here
 * is bent to hide one.
 *
 * Every coordinate is the one `scene.tsx` uses. Widgets sit on box corners (§6 rule 7); the Me column and the blob
 * are deliberately off-grid (§1.1). Full views are pages now (Design-System.md §8.4) and are not in this document —
 * the map at home is what is being proved.
 */
const BOX = 160;
const COL = 560;

/** The ring (Design-System.md §8.3): each widget's top-left box, as `scene.tsx` has it. */
const AT = {
  status: [-8 * BOX, -6 * BOX],
  interests: [-13 * BOX, -1 * BOX],
  philosophy: [-8 * BOX, 3 * BOX],
  work: [4 * BOX, -6 * BOX],
  cases: [9 * BOX, -1 * BOX],
  projects: [4 * BOX, 3 * BOX],
} as const satisfies Record<string, readonly [number, number]>;

const VIEWS = [
  { id: "me", label: "Me", href: "/" },
  { id: "status", label: "Status", href: "/status" },
  { id: "work", label: "Work", href: "/work" },
  { id: "cases", label: "Cases", href: "/case-studies" },
  { id: "projects", label: "Projects", href: "/projects" },
  { id: "interests", label: "Interests", href: "/interests" },
  { id: "philosophy", label: "Philosophy", href: "/philosophy" },
] as const;

/* ── small authoring helpers: they only build data, and the result is plain JSON ─────────────────────────────── */

const cell = (span: [number, number], content: SlotChild[], extra: Record<string, unknown> = {}): SlotChild => ({
  component: "BentoCell",
  props: { span: { cols: span[0], rows: span[1] }, ...extra },
  slots: { content },
});
const label = (text: string): SlotChild => ({ component: "Label", props: { text } });
const head = (label: string, title: string): SlotChild => ({ component: "CellHead", props: { label, title } });
/** Widget scale (Admin.md §6.5c F2): a cell is read from about twice as far away as a document. */
const text = (markdown: string | { $ref: string }, extra: Record<string, unknown> = {}): SlotChild => ({ component: "Text", props: { markdown, size: "widget", ...extra } });
const chip = (label: string, hue: string): SlotChild => ({ component: "Chip", props: { label, hue } });

/** The loud cell (Design-System.md §8.3): the mono word top-left, the figure bottom-left, the pattern across it.
 *  A section with nothing countable says a word instead, in the same corner — one `Figure`, two kinds (§6.5c F3). */
const loud = (eyebrow: string, pattern: string, figure?: { value: string; label: string }, word?: string): SlotChild =>
  cell([2, 2], [label(eyebrow), ...(figure ? [{ component: "Figure", props: figure }] : []), ...(word ? [{ component: "Figure", props: { value: word, kind: "word" } }] : [])], {
    tone: "fill",
    pattern,
  });

const widget = (id: keyof typeof AT, hue: string, title: string, cells: SlotChild[]): SceneDocument["nodes"][number] => ({
  id: `${id}-widget`,
  kind: "widget",
  at: [AT[id][0], AT[id][1]],
  size: [4 * BOX, 3 * BOX],
  section: id,
  node: { view: id },
  component: "Bento",
  props: { hue, label: title },
  slots: { cells },
});

export const portfolioDocument: SceneDocument = {
  schema: 1,
  id: "portfolio/home",
  kind: "canvas",
  grid: { box: BOX, pad: 8 },
  meta: { title: "Bhargav — No Origins", description: "Editors, design systems and agent tools. No Origins is where I keep them." },

  nodes: [
    // the view switcher, in canvas space (Atomic.md D9 as amended)
    {
      id: "menu",
      kind: "menu",
      at: [-520, 100],
      size: [188, 284],
      node: { label: "Sections", items: VIEWS.map((v) => ({ label: v.label, view: v.id, href: v.href })) },
    },

    // ── Me — the centre ──────────────────────────────────────────────────────────────────────────────────────
    {
      id: "me-blob",
      kind: "blob",
      at: [-36, -304],
      section: "me",
      node: { say: "What are we doing today?" },
      component: "Blob",
      props: { variant: "glass", label: "Bhargav" },
    },
    {
      id: "me-intro",
      kind: "panel",
      at: [-280, 100],
      size: [COL, 120],
      section: "me",
      node: { surface: "none" },
      component: "Intro",
      props: { title: "Hi, I'm Bhargav.", lead: { $ref: "site.tagline" } },
    },
    {
      id: "me-story",
      kind: "panel",
      at: [-280, 260],
      size: [COL, 425],
      section: "me",
      node: { label: "About Bhargav" },
      component: "Stack",
      props: { gap: 16 },
      slots: {
        children: [
          { component: "Image", when: { $ref: "site.photo" }, props: { src: { $ref: "site.photo.src" }, alt: { $ref: "site.photo.alt" } } },
          {
            component: "Row",
            props: { gap: 8, align: "center" },
            slots: {
              children: [
                chip("curious", "peach"),
                chip("creative", "lavender"),
                chip("happy", "yellow"),
                { component: "Text", when: { $ref: "site.location" }, props: { size: "small", tone: "muted", markdown: { $ref: "site.locationLine" } } },
              ],
            },
          },
          {
            component: "Text",
            props: {
              markdown:
                "I've spent the last few years inside other people's products: two WYSIWYG editors on tiptap, the core team of a design system, full-stack RAG and agent applications, and now the whole stack at Radise. The through-line is editors, design systems, agent systems, and shipping.\n\n" +
                "No Origins is my playground on the internet. Not a fixed list of features: blocks, added over time. This portfolio is the first. Every block shares one design system, so a new one looks native the day it ships.\n\n" +
                "If you're hiring, the work is on :pan[Work]{view=work}. If you have an idea, what I'm after and how to reach me are on :pan[Current Status]{view=status}. If you're a friend, the tools are on their way. Come back; this grows.",
            },
          },
        ],
      },
    },

    // ── the ring: six widgets, each a Bento (content/sections.tsx, said as data) ─────────────────────────────
    widget("status", "blue", "Current status", [
      loud("status", "status", { value: "4", label: "ways in" }),
      cell([1, 1], [head("hiring", "Recognise the work")]),
      cell([1, 1], [head("collaborating", "Bring an idea")]),
      cell([1, 1], [head("following", "Watch it land")]),
      cell([1, 1], [head("saying hi", "No agenda")]),
      cell([4, 1], [text("Pick the path that fits; none of them needs an agenda.")]),
    ]),
    widget("work", "peach", "Work experience", [
      loud("work", "work", { value: "4", label: "roles" }),
      cell([1, 1], [head("now", "Radise")]),
      cell([1, 1], [head("before", "Dataflix")]),
      cell([1, 1], [head("one year", "Hashnode")]),
      cell([1, 1], [head("two years", "Terrible Tiny Tales")]),
      cell([4, 1], [
        label("the through-line"),
        { component: "Row", props: { gap: 8 }, slots: { children: [chip("editors", "lavender"), chip("design systems", "peach"), chip("agent systems", "blue"), chip("full-stack", "green")] } },
      ]),
    ]),
    widget("cases", "lavender", "Case studies", [
      loud("case studies", "cases", { value: "3", label: "worth telling" }),
      cell([2, 1], [head("hashnode", "Neptune")]),
      cell([2, 1], [head("radise", "Project Vault")]),
      cell([2, 1], [head("dataflix", "GenIQ")]),
      cell([2, 1], [text("Each one: the problem, what I did, what changed.")]),
    ]),
    widget("projects", "green", "Projects", [
      loud("projects", "projects", { value: "0", label: "shipped yet" }),
      cell([2, 1], [label("why"), text("Deleted for a clean slate.")]),
      cell([2, 1], [head("first block", "This portfolio.")]),
      cell([4, 1], [text("Fills as things ship, starting with what No Origins is made of.")]),
    ]),
    widget("interests", "yellow", "Interests", [
      loud("interests", "interests", undefined, "outside the work"),
      cell([2, 2], [text({ $ref: "site.interestsMarkdown" })]),
      cell([4, 1], [label("and the rest"), text("A handful more, each one a line.")], { tone: "glass" }),
    ]),
    widget("philosophy", "pink", "Philosophy", [
      loud("philosophy", "philosophy", undefined, "how I build"),
      cell([2, 2], [text({ $ref: "site.philosophyFirst" })]),
      cell([4, 1], [label("two more like it"), text("Each one a paragraph, in the full view.")], { tone: "glass" }),
    ]),
  ],

  views: [
    { id: "me", label: "Me", href: "/", frame: "fit", nodeIds: ["me-blob", "menu", "me-intro", "me-story", ...Object.keys(AT).map((k) => `${k}-widget`)] },
    ...VIEWS.slice(1).map((v) => ({ id: v.id, label: v.label, href: v.href, nodeIds: [`${v.id}-widget`] })),
  ],
  threads: VIEWS.slice(1).map((v) => ({ from: "me-blob", to: `${v.id}-widget` })),
  order: ["me", "status", "work", "cases", "projects", "interests", "philosophy"],
};
