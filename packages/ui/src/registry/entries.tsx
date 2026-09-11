import { Blob } from "../blob/Blob";
import { BlockCard } from "../blocks/BlockCard";
import { CellHead } from "../blocks/CellHead";
import { Intro } from "../blocks/Intro";
import { RegionLabel } from "../blocks/RegionLabel";
import { RoadmapItem } from "../blocks/RoadmapItem";
import { Illustration } from "../illustrations/Illustration";
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
  line: "A named line family, drawn by the generator. Six exist.",
  props: {
    name: { type: "illustration", required: true },
    hue: { type: "hue" },
    title: { type: "text", max: 60, help: "Without one it is decorative and hidden from assistive tech." },
  },
  defaults: { name: "work" },
  // Sized like the cell it is drawn for: a 2 × 2 loud cell is 304 square. Unconstrained it stretches to whatever
  // box it is given, and a field drawn at 3:1 is not what the generator was tuned for.
  example: () => (
    <Bento hue="peach" cols={2} rows={2}>
      <BentoCell span={[2, 2]} tone="fill">
        <Label>work</Label>
        <Illustration name="work" hue="peach" title="Four roles, opening out" />
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

export const entries: readonly RegistryEntry[] = [
  heading, text, label,
  chip, dot,
  button,
  stack, row, divider, bento, bentoCell,
  card, glass, placeholder,
  figure, blob, illustration,
  intro, cellHead, blockCard, roadmapItem, regionLabel,
];
