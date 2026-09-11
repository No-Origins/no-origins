import { Blob } from "../blob/Blob";
import { BlockCard } from "../blocks/BlockCard";
import { CellHead } from "../blocks/CellHead";
import { Intro } from "../blocks/Intro";
import { RegionLabel } from "../blocks/RegionLabel";
import { RoadmapItem } from "../blocks/RoadmapItem";
import { Illustration } from "../illustrations/Illustration";
import { MediaCard } from "../blocks/MediaCard";
import { Quote } from "../blocks/Quote";
import { Step, Steps } from "../blocks/Steps";
import { Carousel } from "../primitives/Carousel";
import { Image } from "../primitives/Image";
import { Bento, BentoCell, BentoFigure } from "../primitives/Bento";
import { Button } from "../primitives/Button";
import { Card } from "../primitives/Card";
import { Chip } from "../primitives/Chip";
import { Divider } from "../primitives/Divider";
import { Dot } from "../primitives/Dot";
import { Glass } from "../primitives/Glass";
import { Heading } from "../primitives/Heading";
import { Label } from "../primitives/Label";
import { Placeholder } from "../primitives/Placeholder";
import { Row } from "../primitives/Row";
import { Stack } from "../primitives/Stack";
import { Text } from "../primitives/Text";
import { hues } from "../tokens";
import type { RegistryEntry } from "./types";

/**
 * The twenty-two authorable components (Scene-Schema.md §2.3, §3.2).
 *
 * **One declaration, three consumers** — the public showcase at `design.no-origins.com`, the admin's catalogue
 * (read-only under R3), and the editor's palette. Two hand-maintained lists would drift within a week, and drift
 * is the one thing §11 was written to make impossible.
 *
 * Every `example()` uses real content out of the portfolio. That is a rule, not a habit: the catalogue IS the
 * showcase, and a showcase of lorem demonstrates nothing about a system whose type is measured.
 */

const HUES = hues;

/* ── text ───────────────────────────────────────────────────────────────────────────────────────────────── */

const heading: RegistryEntry = {
  name: "Heading", kind: ["slot", "panel"], group: "text", component: Heading as never,
  line: "A heading at one of three levels.",
  props: {
    level: { type: "enum", of: ["2", "3", "4"], default: "2", help: "Display face at 2; Hanken 600 at 3 and 4. There is no level 1: a surface has exactly one h1 (§12)." },
    text: { type: "text", max: 80, required: true },
  },
  defaults: { level: 2, text: "A heading" },
  example: () => <Heading level={2}>Four roles, told as blocks</Heading>,
  since: "0.1.0", status: "draft",
};

const text: RegistryEntry = {
  name: "Text", kind: ["slot", "panel"], group: "text", component: Text as never,
  line: "A run of prose, at one of three steps of the scale.",
  props: {
    markdown: { type: "markdown", required: true, help: "Markdown, plus the declared inline directives (R4). The adapter parses it; the package parses nothing." },
    size: { type: "enum", of: ["lead", "body", "small"], default: "body" },
    tone: { type: "enum", of: ["default", "muted"], default: "default" },
  },
  defaults: { markdown: "Write here.", size: "body" },
  example: () => <Text size="lead">I build editors, design systems and agent tools. No Origins is where I keep them.</Text>,
  since: "0.1.0", status: "draft",
};

const label: RegistryEntry = {
  name: "Label", kind: ["slot"], group: "text", component: Label as never,
  line: "The mono eyebrow. One line, uppercase.",
  props: { text: { type: "text", max: 24, required: true, help: "Capped at 24: a widget sets its type at twice a document's, so a long eyebrow wraps and breaks the diagonal (§8.3)." } },
  defaults: { text: "now" },
  example: () => <Label>the through-line</Label>,
  since: "0.1.0", status: "draft",
};

/* ── marks ──────────────────────────────────────────────────────────────────────────────────────────────── */

const chip: RegistryEntry = {
  name: "Chip", kind: ["slot"], group: "marks", component: Chip as never,
  line: "A pill in one of the seven hues.",
  props: {
    label: { type: "text", max: 24, required: true },
    hue: { type: "hue", accent: true },
    dot: { type: "boolean", default: true },
    pressed: { type: "boolean", default: false },
    href: { type: "href" },
  },
  defaults: { label: "chip", hue: "peach" },
  example: () => <Chip hue="lavender">editors</Chip>,
  since: "0.0.1", status: "stable",
};

const dot: RegistryEntry = {
  name: "Dot", kind: ["slot"], group: "marks", component: Dot as never,
  line: "A hue, as a mark — it survives the map zoom where text does not.",
  props: { hue: { type: "hue", required: true } },
  defaults: { hue: "peach" },
  example: () => <Row gap={8}>{HUES.map((h) => <Dot key={h} hue={h} />)}</Row>,
  since: "0.1.0", status: "draft",
};

/* ── actions ────────────────────────────────────────────────────────────────────────────────────────────── */

const button: RegistryEntry = {
  name: "Button", kind: ["slot"], group: "actions", component: Button as never,
  line: "A pill, 44px minimum. Becomes a link with href.",
  props: {
    label: { type: "text", max: 24, required: true },
    variant: { type: "enum", of: ["primary", "secondary", "ghost"], default: "secondary" },
    size: { type: "enum", of: ["sm", "md"], default: "md" },
    href: { type: "href", help: "`download` and `target` are not authorable: a canvas handing a visitor a file from a database row is a different security question." },
  },
  defaults: { label: "Do the thing", variant: "secondary" },
  example: () => <Button variant="secondary">Download the résumé</Button>,
  since: "0.0.1", status: "stable",
};

/* ── layout ─────────────────────────────────────────────────────────────────────────────────────────────── */

const GAP = { type: "enum", of: ["8", "16", "24", "40"] } as const;

const stack: RegistryEntry = {
  name: "Stack", kind: ["slot", "panel"], group: "layout", component: Stack as never,
  line: "Things down the page, evenly spaced.",
  props: {
    gap: { ...GAP, default: "16", help: "Four steps of the space scale and nothing between them — a free number lets a document invent spacing the system does not have." },
    align: { type: "enum", of: ["stretch", "start", "center", "end"], default: "stretch" },
  },
  slots: { children: { admits: "blocks", label: "Contents" } },
  defaults: { gap: 16 },
  example: () => (
    <Stack gap={8}>
      <Text>No Origins is my playground on the internet.</Text>
      <Text size="small" tone="muted">Blocks, added over time. This portfolio is the first.</Text>
    </Stack>
  ),
  since: "0.1.0", status: "draft",
};

const row: RegistryEntry = {
  name: "Row", kind: ["slot", "panel"], group: "layout", component: Row as never,
  line: "Things across, wrapping when they run out of room.",
  props: {
    gap: { ...GAP, default: "8" },
    align: { type: "enum", of: ["center", "start", "baseline", "end"], default: "center" },
    wrap: { type: "boolean", default: true, help: "Off only for a track that scrolls: content in a cell must not overflow it." },
  },
  slots: { children: { admits: "blocks", label: "Contents" } },
  defaults: { gap: 8, align: "center", wrap: true },
  example: () => (
    <Row gap={8}>
      <Chip hue="lavender">editors</Chip>
      <Chip hue="peach">design systems</Chip>
      <Chip hue="blue">agent systems</Chip>
    </Row>
  ),
  since: "0.1.0", status: "draft",
};

const divider: RegistryEntry = {
  name: "Divider", kind: ["slot"], group: "layout", component: Divider as never,
  line: "A hairline. An <hr>, because that is what it means.",
  props: { dotted: { type: "boolean", default: false, help: "The canvas voice — the line under a region label." } },
  defaults: {},
  example: () => <Divider />,
  since: "0.1.0", status: "draft",
};

const bento: RegistryEntry = {
  name: "Bento", kind: ["widget", "page"], group: "layout", component: Bento as never,
  line: "The one grid, at two sizes: a 4 × 3 widget, or a 10-column page.",
  props: {
    hue: { type: "hue" },
    cols: { type: "number", unit: "columns", min: 1, max: 12, help: "Defaults to 4 as a widget, 10 as a page." },
    rows: { type: "number", unit: "rows", min: 1, max: 8, default: 3 },
    page: { type: "boolean", default: false, help: "A section's full view: fluid columns to 1600, rows minmax(144px, auto), scrolling in the document rather than canvas space (§8.4)." },
    label: { type: "text", max: 40, help: "Names the grid for assistive tech." },
  },
  slots: { cells: { admits: ["BentoCell"], label: "Cells" } },
  defaults: { hue: "peach", cols: 4, rows: 3, label: "A section" },
  example: () => (
    <Bento hue="peach" label="Work experience">
      <BentoCell span={[2, 2]} tone="fill"><Label>work</Label><BentoFigure value="4" label="roles" /></BentoCell>
      <BentoCell><CellHead label="now" title="Radise" dot="peach" /></BentoCell>
      <BentoCell><CellHead label="one year" title="Hashnode" dot="blue" /></BentoCell>
      <BentoCell span={[2, 1]}><CellHead label="before" title="Dataflix" dot="green" /></BentoCell>
      <BentoCell span={[4, 1]}>
        <Label>the through-line</Label>
        <Row gap={8}><Chip hue="lavender">editors</Chip><Chip hue="peach">design systems</Chip></Row>
      </BentoCell>
    </Bento>
  ),
  since: "0.0.1", status: "stable",
};

const bentoCell: RegistryEntry = {
  name: "BentoCell", kind: ["slot"], group: "layout", component: BentoCell as never,
  line: "One cell of the grid. Every cell does one job.",
  props: {
    span: { type: "object", fields: { cols: { type: "number", unit: "columns" }, rows: { type: "number", unit: "rows" } }, default: { cols: 1, rows: 1 } },
    tone: { type: "enum", of: ["quiet", "glass", "fill", "ink", "bare"], default: "quiet", help: "`fill` is the loud one, and probe12 allows exactly one per widget. `bare` is type on the grid with no card under it." },
    illustration: { type: "illustration", help: "Named only. The fourteen family parameters include measurements and stay in code (Scene-Schema.md §3.6)." },
  },
  slots: { content: { admits: "blocks", label: "Contents" } },
  defaults: { span: [1, 1], tone: "quiet" },
  example: () => (
    <Bento hue="blue" cols={2} rows={1}>
      <BentoCell tone="quiet"><CellHead label="quiet" title="Recedes" dot="blue" /></BentoCell>
      <BentoCell tone="fill"><Label>fill</Label><Heading level={4}>The loud one</Heading></BentoCell>
    </Bento>
  ),
  since: "0.0.1", status: "stable",
};

/* ── surfaces ───────────────────────────────────────────────────────────────────────────────────────────── */

const card: RegistryEntry = {
  name: "Card", kind: ["panel", "slot"], group: "surfaces", component: Card as never,
  line: "A container: surface or glass.",
  props: {
    surface: { type: "enum", of: ["solid", "glass"], default: "solid" },
    padding: { type: "enum", of: ["md", "sm"], default: "md" },
  },
  slots: { body: { admits: "blocks", label: "Contents" } },
  defaults: { surface: "solid", padding: "md" },
  example: () => (
    <Card>
      <Stack gap={8}>
        <Heading level={4}>One system, every block</Heading>
        <Text size="small" tone="muted">Each block owns one hue. The clear one is me: I&apos;m made of the platform.</Text>
      </Stack>
    </Card>
  ),
  since: "0.0.1", status: "stable",
};

const glass: RegistryEntry = {
  name: "Glass", kind: ["slot"], group: "surfaces", component: Glass as never,
  line: "The material, at three levels. Never more than two stacked.",
  props: {
    level: { type: "enum", of: ["1", "2", "3"], default: "1" },
    radius: { type: "enum", of: ["xs", "sm", "md", "lg", "xl", "pill"], default: "lg" },
  },
  slots: { body: { admits: "blocks", label: "Contents" } },
  defaults: { level: 1 },
  example: () => <Glass level={1} className="noo-card"><Text size="small">Glass 1 — bubbles, chips, secondary buttons.</Text></Glass>,
  since: "0.0.1", status: "stable",
};

const placeholder: RegistryEntry = {
  name: "Placeholder", kind: ["panel", "slot"], group: "surfaces", component: Placeholder as never,
  line: "A section with no copy yet. Never says “coming soon”.",
  props: {
    title: { type: "text", max: 80, required: true },
    draft: { type: "boolean", default: false, help: "Scaffolding, not content. Without it, this IS the honest empty state." },
  },
  slots: { body: { admits: "blocks", label: "Why it is not here yet" } },
  defaults: { title: "Nothing shipped yet" },
  example: () => (
    <Placeholder title="Nothing shipped yet">
      Everything I had was deleted for a clean slate. This page fills as things land.
    </Placeholder>
  ),
  since: "0.0.1", status: "stable",
};

/* ── figures ────────────────────────────────────────────────────────────────────────────────────────────── */

const figure: RegistryEntry = {
  name: "Figure", kind: ["slot"], group: "figures", component: BentoFigure as never,
  line: "A number or short word as an image. Honest counts only.",
  props: {
    value: { type: "text", max: 4, required: true, help: "Capped at 4. Where nothing is countable, use a word instead — inventing a number to fill the slot is the failure mode (Illustrations.md principle 8)." },
    label: { type: "text", max: 20 },
    size: { type: "enum", of: ["lg", "md"], default: "lg" },
  },
  defaults: { value: "0", label: "of them", size: "lg" },
  example: () => <BentoFigure value="4" label="roles" />,
  since: "0.0.1", status: "stable",
};

const blob: RegistryEntry = {
  name: "Blob", kind: ["blob"], group: "figures", component: Blob as never,
  line: "The character. One on the portfolio — the glass host at the centre.",
  props: {
    variant: { type: "enum", of: ["character", "logotype", "glass"], default: "character" },
    size: { type: "blobSize", default: "md" },
    state: { type: "enum", of: ["idle", "sleep"], default: "idle" },
    hue: { type: "hue", accent: true },
    label: { type: "text", max: 40, help: "Without one the blob is decorative and hidden from assistive tech." },
    blink: { type: "boolean" }, look: { type: "boolean" }, breathe: { type: "boolean" },
    refraction: { type: "boolean", help: "Off over a solid surface, where there is no grid to bend." },
  },
  defaults: { variant: "character", size: "md", hue: "peach" },
  example: () => <Blob size="lg" hue="peach" label="A blob" />,
  since: "0.0.1", status: "stable",
};

const illustration: RegistryEntry = {
  name: "Illustration", kind: ["slot"], group: "figures", component: Illustration as never,
  line: "A field: fine lines in one hue crossing the whole cell and leaving through its edges.",
  props: {
    name: { type: "illustration", required: true, help: "One of the six measured families in `fields.ts`. The fourteen parameters are NOT authorable: two of them are measurements (Scene-Schema.md §3.6), and an inspector of fourteen sliders invites exactly the estimation Illustrations.md forbids." },
    hue: { type: "hue" },
    title: { type: "text", max: 60, help: "Without one it is decorative and hidden from assistive tech." },
    placement: { type: "enum", of: ["inline", "field"], default: "inline", help: "`field` fills its cell absolutely — a bento's loud cell. Anywhere without a positioned ancestor it would escape to the page." },
  },
  defaults: { name: "work", placement: "inline" },
  // Drawn at the size it is composed for: a 2 × 2 loud cell is 304 square. A field is tuned to cross THAT cell and
  // leave through its edges, so showing it at any other aspect misrepresents it.
  example: () => (
    <Bento hue="peach" cols={2} rows={2}>
      <BentoCell span={[2, 2]} tone="fill" >
        <Label>work</Label>
        <Illustration name="work" hue="peach" title="Four roles, opening out" placement="field" />
        <BentoFigure value="4" label="roles" />
      </BentoCell>
    </Bento>
  ),
  since: "0.0.1", status: "stable",
};

/* ── composites ─────────────────────────────────────────────────────────────────────────────────────────── */

const intro: RegistryEntry = {
  name: "Intro", kind: ["panel", "slot"], group: "composites", component: Intro as never,
  line: "A heading with a lead under it. The top of most panels.",
  props: {
    title: { type: "text", max: 60, required: true },
    lead: { type: "text", max: 160, help: "Accepts a ref. It is a real step on the scale (19/1.5), which is why this is a component: markdown cannot express one." },
    level: { type: "enum", of: ["2", "3", "4"], default: "2" },
  },
  defaults: { title: "A section", lead: "What it is, in one line." },
  example: () => <Intro title="Four roles, told as blocks" lead="Editors, design systems, agent systems, and shipping full-stack." />,
  since: "0.1.0", status: "draft",
};

const cellHead: RegistryEntry = {
  name: "CellHead", kind: ["slot"], group: "composites", component: CellHead as never,
  line: "A widget cell's label, dot and title.",
  props: {
    label: { type: "text", max: 24 },
    title: { type: "text", max: 40, required: true },
    dot: { type: "hue" },
  },
  defaults: { label: "now", title: "A thing" },
  example: () => (
    <Bento hue="peach" cols={2} rows={1}>
      <BentoCell><CellHead label="now" title="Radise" dot="peach" /></BentoCell>
      <BentoCell tone="fill"><CellHead label="one year" title="Hashnode" dot="blue" /></BentoCell>
    </Bento>
  ),
  since: "0.1.0", status: "draft",
};

const blockCard: RegistryEntry = {
  name: "BlockCard", kind: ["panel", "slot"], group: "composites", component: BlockCard as never,
  line: "One role or one block. The Work item.",
  props: {
    hue: { type: "hue", required: true },
    title: { type: "text", max: 80, required: true },
    line: { type: "text", max: 160, required: true },
    meta: { type: "text", max: 40 },
    details: { type: "list", of: { type: "text", max: 120 }, max: 6 },
    chips: { type: "list", of: { type: "object", fields: { label: { type: "text", max: 24 }, hue: { type: "hue" } } }, max: 5, help: "Capped at 5: a sixth wraps the card and pushes everything under it down a row." },
    href: { type: "href" },
    state: { type: "enum", of: ["idle", "sleep"], default: "idle" },
  },
  defaults: { hue: "peach", title: "A role", line: "One line about it." },
  example: () => (
    <BlockCard
      hue="blue"
      meta="Hashnode · one year"
      title="Neptune, Hashnode's editor"
      line="The WYSIWYG editor on tiptap was mine for a year, plus a seat on the design-system core team."
      details={["Owned Neptune: foundational blocks and an OpenAI integration that helps people write.", "Core team member building Hashnode's design system."]}
      chips={[{ label: "editors", hue: "lavender" }, { label: "design systems", hue: "peach" }, { label: "tiptap", hue: "grey" }]}
    />
  ),
  since: "0.0.1", status: "stable",
};

const roadmapItem: RegistryEntry = {
  name: "RoadmapItem", kind: ["panel", "slot"], group: "composites", component: RoadmapItem as never,
  line: "Something not here yet, said honestly.",
  props: {
    hue: { type: "hue", required: true },
    title: { type: "text", max: 80, required: true },
    description: { type: "markdown", required: true },
    progress: { type: "text", max: 40, help: "A short state in the mono voice: “designing”, “after the portfolio”." },
  },
  defaults: { hue: "lavender", title: "Not here yet", description: "Here's what it'll do…" },
  example: () => (
    <RoadmapItem
      hue="lavender"
      title="An editor to write and publish"
      description="Not here yet. Here's what it'll do: write articles in a WYSIWYG editor and publish them on No Origins. I've built two editors on tiptap for other people. This one is mine."
      progress="after the portfolio · designing"
    />
  ),
  since: "0.0.1", status: "stable",
};

const regionLabel: RegistryEntry = {
  name: "RegionLabel", kind: ["region"], group: "composites", component: RegionLabel as never,
  line: "A map label: one display word that has to read at 0.27 zoom.",
  props: { text: { type: "text", max: 24, required: true } },
  defaults: { text: "Work" },
  example: () => <div style={{ height: 150 }}><RegionLabel>Work</RegionLabel></div>,
  since: "0.1.0", status: "draft",
};


/* ── added 2026-09-11, from Bhargav's references ────────────────────────────────────────────────────────── */

/**
 * A 3:2 image the component genuinely loads, as a data URI.
 *
 * There is no photograph on the platform yet, and inventing one for a catalogue would be the same dishonesty as
 * lorem text (§3.2a rule 1). A drawn stand-in that the browser really fetches, decodes and lays out demonstrates
 * everything this component does — `alt`, the reserved box, `fit`, the radius — without pretending to be
 * someone's portrait. Replace it with a real photograph the day there is one.
 */
const STAND_IN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='240'%3E" +
  "%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E" +
  "%3Cstop offset='0' stop-color='%23c9b8e8'/%3E%3Cstop offset='1' stop-color='%23f2d9c4'/%3E" +
  "%3C/linearGradient%3E%3C/defs%3E%3Crect width='360' height='240' fill='url(%23g)'/%3E%3C/svg%3E";

const image: RegistryEntry = {
  name: "Image", kind: ["slot"], group: "figures", component: Image as never,
  line: "A photograph. Optimisation is the host's job, never the package's.",
  props: {
    src: { type: "href", required: true },
    alt: { type: "text", max: 120, required: true, help: "Required, including as an empty string. A decorative image is a decision, and a required empty string makes someone decide rather than forget (§12)." },
    ratio: { type: "number", unit: "w / h", help: "Reserves the box before the bytes arrive. Without it the layout shifts on load." },
    fit: { type: "enum", of: ["cover", "contain"], default: "cover" },
    radius: { type: "enum", of: ["none", "sm", "md", "lg", "xl"], default: "lg" },
  },
  defaults: { alt: "", radius: "lg", fit: "cover" },
  example: () => <Image src={STAND_IN} alt="" ratio={3 / 2} width={360} height={240} />,
  since: "0.1.0", status: "draft",
};

const steps: RegistryEntry = {
  name: "Steps", kind: ["panel", "slot"], group: "composites", component: Steps as never,
  line: "A numbered sequence on a rule. Numbering is a counter, never a prop.",
  props: {
    hue: { type: "hue" },
    orientation: { type: "enum", of: ["vertical", "horizontal"], default: "vertical" },
  },
  slots: { children: { admits: ["Step"], label: "Steps", min: 2 } },
  defaults: { orientation: "vertical" },
  example: () => (
    <Steps hue="peach">
      <Step title="Discover">A short call to understand what is actually needed, not what was asked for.</Step>
      <Step title="Design">A focused first draft, shaped around the one thing that matters most.</Step>
      <Step title="Build">The draft becomes the real thing, tested before it ever reaches you.</Step>
    </Steps>
  ),
  since: "0.1.0", status: "draft",
};

const step: RegistryEntry = {
  name: "Step", kind: ["slot"], group: "composites", component: Step as never,
  line: "One step. Its number comes from its position, so reordering renumbers.",
  props: { title: { type: "text", max: 60, required: true } },
  slots: { children: { admits: "blocks", label: "What happens" } },
  defaults: { title: "Discover" },
  example: () => (
    <Steps hue="blue">
      <Step title="Deliver">Handed off with everything you need to keep going — no loose ends.</Step>
    </Steps>
  ),
  since: "0.1.0", status: "draft",
};

const quote: RegistryEntry = {
  name: "Quote", kind: ["panel", "slot"], group: "composites", component: Quote as never,
  line: "Someone else's words, attributed — with a measured number above them.",
  props: {
    by: { type: "text", max: 60 },
    role: { type: "text", max: 80 },
    figure: { type: "object", fields: { value: { type: "text", max: 8 }, label: { type: "text", max: 30 } }, help: "A measurement or nothing. Honest counts only." },
    markdown: { type: "markdown", required: true, label: "The quote" },
  },
  slots: { media: { admits: ["Image", "Illustration", "Blob"], max: 1, label: "Beside the words" } },
  defaults: { markdown: "It just works now.", by: "Someone", role: "Their job" },
  example: () => (
    <Quote figure={{ value: "4", label: "roles, so far" }} by="Bhargav" role="No Origins">
      Editors, design systems, agent systems, and shipping.
    </Quote>
  ),
  since: "0.1.0", status: "draft",
};

const mediaCard: RegistryEntry = {
  name: "MediaCard", kind: ["panel", "slot"], group: "composites", component: MediaCard as never,
  line: "A card with a picture beside its words.",
  props: {
    title: { type: "text", max: 90, required: true },
    meta: { type: "text", max: 40 },
    line: { type: "text", max: 160 },
    hue: { type: "hue", help: "Fills the media region when nothing is placed in it: the hue's wash under the grain." },
    layout: { type: "enum", of: ["beside", "above"], default: "beside" },
    href: { type: "href" },
  },
  slots: {
    media: { admits: ["Image", "Illustration", "Blob"], max: 1, label: "The picture" },
    footer: { admits: "blocks", label: "Chips, a button" },
  },
  defaults: { title: "A thing worth reading", layout: "beside", hue: "lavender" },
  example: () => (
    <MediaCard
      hue="lavender"
      meta="Published recently"
      title="The rise of ambient computing"
      line="Technology is becoming quieter, smarter, and more seamlessly part of everyday places."
      footer={<><Chip hue="lavender">Future tech</Chip><Button size="sm" variant="primary">Read more</Button></>}
    />
  ),
  since: "0.1.0", status: "draft",
};

const carousel: RegistryEntry = {
  name: "Carousel", kind: ["panel", "slot"], group: "layout", component: Carousel as never,
  line: "A track of slides that snaps, with the neighbours showing.",
  props: {
    label: { type: "text", max: 40, required: true, help: "Names the group for assistive tech — “Testimonials”, not “carousel”." },
    peek: { type: "enum", of: ["none", "sm", "md"], default: "md", help: "A slide that fills the track gives no sign there is another one." },
    gap: { ...GAP, default: "24" },
    dots: { type: "boolean", default: true },
  },
  slots: { children: { admits: "blocks", label: "Slides", min: 2 } },
  defaults: { label: "Slides", peek: "md", dots: true },
  example: () => (
    <Carousel label="What people said" peek="md" gap={16}>
      <Quote by="Elena Duarte" role="Operations Manager">Planning used to be guesswork.</Quote>
      <Quote by="Ravi Menon" role="Head of Platform">It reads like one thing, not five.</Quote>
    </Carousel>
  ),
  since: "0.1.0", status: "draft",
};

export const entries: readonly RegistryEntry[] = [
  heading, text, label,
  chip, dot,
  button,
  stack, row, divider, bento, bentoCell, carousel,
  card, glass, placeholder,
  figure, blob, illustration, image,
  intro, cellHead, blockCard, roadmapItem, regionLabel, steps, step, quote, mediaCard,
];
