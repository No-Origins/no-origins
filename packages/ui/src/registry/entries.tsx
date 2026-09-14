import { Blob } from "../atoms/blob/Blob";
import { BlockCard } from "../organisms/BlockCard";
import { CellHead } from "../molecules/CellHead";
import { Intro } from "../molecules/Intro";
import { SectionHeader } from "../molecules/SectionHeader";
import { Segmented } from "../molecules/Segmented";
import { Select } from "../molecules/Select";
import { Field } from "../molecules/Field";
import { Checkbox } from "../molecules/Checkbox";
import { RadioGroup } from "../molecules/Radio";
import { Tabs } from "../molecules/Tabs";
import { Toast } from "../molecules/Toast";
import { Tooltip } from "../molecules/Tooltip";
import { Speaker } from "../molecules/Speaker";
import { Menu } from "../organisms/Menu";
import { Table } from "../organisms/Table";
import { Dialog } from "../organisms/Dialog";
import { Tree } from "../organisms/Tree";
import { RegionLabel } from "../organisms/RegionLabel";
import { RoadmapItem } from "../organisms/RoadmapItem";
import { Illustration } from "../atoms/illustrations/Illustration";
import { MediaCard } from "../organisms/MediaCard";
import { Quote } from "../organisms/Quote";
import { Step, Steps } from "../molecules/Steps";
import { Carousel } from "../organisms/Carousel";
import { Deck } from "../organisms/Deck";
import { ProfileCard } from "../organisms/ProfileCard";
import { Image } from "../atoms/Image";
import { Bento, BentoCell, BentoFigure } from "../organisms/Bento";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { Chip } from "../atoms/Chip";
import { Divider } from "../atoms/Divider";
import { Dot } from "../atoms/Dot";
import { Glass } from "../atoms/Glass";
import { Heading } from "../atoms/Heading";
import { Label } from "../atoms/Label";
import { Placeholder } from "../atoms/Placeholder";
import { Row } from "../atoms/Row";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { hues } from "../tokens/tokens";
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
  name: "Heading", kind: ["slot", "panel"], group: "text", layer: "atom", component: Heading as never,
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
  name: "Text", kind: ["slot", "panel"], group: "text", layer: "atom", component: Text as never,
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
  name: "Label", kind: ["slot"], group: "text", layer: "atom", component: Label as never,
  line: "The mono eyebrow. One line, uppercase.",
  props: { text: { type: "text", max: 24, required: true, help: "Capped at 24: a widget sets its type at twice a document's, so a long eyebrow wraps and breaks the diagonal (§8.3)." } },
  defaults: { text: "now" },
  example: () => <Label>the through-line</Label>,
  since: "0.1.0", status: "draft",
};

/* ── marks ──────────────────────────────────────────────────────────────────────────────────────────────── */

const chip: RegistryEntry = {
  name: "Chip", kind: ["slot"], group: "marks", layer: "atom", component: Chip as never,
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
  name: "Dot", kind: ["slot"], group: "marks", layer: "atom", component: Dot as never,
  line: "A hue, as a mark — it survives the map zoom where text does not.",
  props: { hue: { type: "hue", required: true } },
  defaults: { hue: "peach" },
  example: () => <Row gap={8}>{HUES.map((h) => <Dot key={h} hue={h} />)}</Row>,
  since: "0.1.0", status: "draft",
};

/* ── actions ────────────────────────────────────────────────────────────────────────────────────────────── */

const button: RegistryEntry = {
  name: "Button", kind: ["slot"], group: "actions", layer: "atom", component: Button as never,
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
  name: "Stack", kind: ["slot", "panel"], group: "layout", layer: "atom", component: Stack as never,
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
  name: "Row", kind: ["slot", "panel"], group: "layout", layer: "atom", component: Row as never,
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
  name: "Divider", kind: ["slot"], group: "layout", layer: "atom", component: Divider as never,
  line: "A hairline. An <hr>, because that is what it means.",
  props: { dotted: { type: "boolean", default: false, help: "The canvas voice — the line under a region label." } },
  defaults: {},
  example: () => <Divider />,
  since: "0.1.0", status: "draft",
};

const bento: RegistryEntry = {
  name: "Bento", kind: ["widget", "page"], group: "layout", layer: "organism", component: Bento as never,
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
  name: "BentoCell", kind: ["slot"], group: "layout", layer: "organism", component: BentoCell as never,
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
  name: "Card", kind: ["panel", "slot"], group: "surfaces", layer: "atom", component: Card as never,
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
  name: "Glass", kind: ["slot"], group: "surfaces", layer: "atom", component: Glass as never,
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
  name: "Placeholder", kind: ["panel", "slot"], group: "surfaces", layer: "atom", component: Placeholder as never,
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
  name: "Figure", kind: ["slot"], group: "figures", layer: "molecule", component: BentoFigure as never,
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
  name: "Blob", kind: ["blob"], group: "figures", layer: "atom", component: Blob as never,
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
  name: "Illustration", kind: ["slot"], group: "figures", layer: "atom", component: Illustration as never,
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
  name: "Intro", kind: ["panel", "slot"], group: "composites", layer: "molecule", component: Intro as never,
  line: "Merged into SectionHeader (rhythm off). Documents naming it still render.",
  props: {
    title: { type: "text", max: 60, required: true },
    lead: { type: "text", max: 160, help: "Accepts a ref. It is a real step on the scale (19/1.5), which is why this is a component: markdown cannot express one." },
    level: { type: "enum", of: ["2", "3", "4"], default: "2" },
  },
  defaults: { title: "A section", lead: "What it is, in one line." },
  example: () => <Intro title="Four roles, told as blocks" lead="Editors, design systems, agent systems, and shipping full-stack." />,
  since: "0.1.0", status: "deprecated",
};

const cellHead: RegistryEntry = {
  name: "CellHead", kind: ["slot"], group: "composites", layer: "molecule", component: CellHead as never,
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
  name: "BlockCard", kind: ["panel", "slot"], group: "composites", layer: "organism", component: BlockCard as never,
  line: "One role or one block. The Work item; asleep, the roadmap item.",
  props: {
    hue: { type: "hue", required: true },
    title: { type: "text", max: 80, required: true },
    line: { type: "text", max: 160, required: true },
    meta: { type: "text", max: 40 },
    details: { type: "list", of: { type: "text", max: 120 }, max: 6 },
    chips: { type: "list", of: { type: "object", fields: { label: { type: "text", max: 24 }, hue: { type: "hue" } } }, max: 5, help: "Capped at 5: a sixth wraps the card and pushes everything under it down a row." },
    href: { type: "href" },
    state: { type: "enum", of: ["idle", "sleep"], default: "idle", help: "`sleep` is a block that is not here yet: hollow dot, sleeping blob, and it says what it will do (principle 4)." },
    progress: { type: "text", max: 40, help: "A short state in the mono voice: “designing”, “after the portfolio”." },
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
  name: "RoadmapItem", kind: ["panel", "slot"], group: "composites", layer: "organism", component: RoadmapItem as never,
  line: "Merged into BlockCard (state sleep, progress). Documents naming it still render.",
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
  since: "0.0.1", status: "deprecated",
};

const regionLabel: RegistryEntry = {
  name: "RegionLabel", kind: ["region"], group: "composites", layer: "organism", component: RegionLabel as never,
  line: "Retired: RegionNode draws the map label itself. Documents naming it still render.",
  props: { text: { type: "text", max: 24, required: true } },
  defaults: { text: "Work" },
  example: () => <div style={{ height: 150 }}><RegionLabel>Work</RegionLabel></div>,
  since: "0.1.0", status: "deprecated",
};



/* ── molecules added in the 2026-09-14 release (Atomic.md §6 step 3) ────────────────────────────────────── */

const sectionHeader: RegistryEntry = {
  name: "SectionHeader", kind: ["panel", "slot"], group: "text", layer: "molecule", component: SectionHeader as never,
  line: "Eyebrow, title, lead. With rhythm it opens a section; without, a panel.",
  props: {
    label: { type: "text", max: 24 },
    title: { type: "text", max: 60, required: true },
    lead: { type: "text", max: 160, help: "A real step on the scale (19/1.5), which is why this is a component: markdown cannot express one." },
    level: { type: "enum", of: ["2", "3", "4"], default: "2", help: "Level 1 is the page's and is not authorable from a document (§12)." },
    rhythm: { type: "boolean", default: false, help: "64 above and 32 below, for a document. Off at the top of a panel, where the panel owns the spacing." },
  },
  defaults: { title: "A section", lead: "What it is, in one line.", rhythm: false },
  example: () => <SectionHeader rhythm={false} label="the registry" title="Four roles, told as blocks" lead="Editors, design systems, agent systems, and shipping full-stack." />,
  since: "0.1.0", status: "draft",
};

const segmented: RegistryEntry = {
  name: "Segmented", kind: ["slot"], group: "controls", layer: "molecule", component: Segmented as never,
  line: "A few exclusive choices in a pill. More than four is a Select.",
  props: {
    label: { type: "text", max: 40, required: true, help: "What the group is for. Three unlabelled buttons in a pill are a riddle." },
    options: { type: "list", of: { type: "object", fields: { value: { type: "text", max: 24 }, label: { type: "text", max: 16 } } }, max: 4, required: true },
    size: { type: "enum", of: ["sm", "md"], default: "sm" },
  },
  defaults: { label: "Viewport", options: [{ value: "desktop", label: "Desktop" }, { value: "phone", label: "Phone" }] },
  example: () => <Segmented label="Viewport" options={[{ value: "desktop", label: "Desktop" }, { value: "phone", label: "Phone" }]} />,
  since: "0.1.0", status: "draft",
};

const select: RegistryEntry = {
  name: "Select", kind: ["slot"], group: "controls", layer: "molecule", component: Select as never,
  line: "A native select in the field's box. The OS picker, because every reader knows it.",
  props: {
    label: { type: "text", max: 40, required: true },
    options: { type: "list", of: { type: "object", fields: { value: { type: "text", max: 40 }, label: { type: "text", max: 40 } } }, required: true },
    placeholder: { type: "text", max: 40 },
    hint: { type: "text", max: 120 },
  },
  defaults: { label: "Hue", options: HUES.map((h) => ({ value: h, label: h })), placeholder: "Choose a hue" },
  example: () => <Select label="Block" placeholder="Choose a block" hint="Each block owns one hue." options={[{ value: "portfolio", label: "Portfolio · peach" }, { value: "design", label: "Design system · blue" }, { value: "admin", label: "Admin · lavender" }]} />,
  since: "0.1.0", status: "draft",
};

const checkbox: RegistryEntry = {
  name: "Checkbox", kind: ["slot"], group: "controls", layer: "molecule", component: Checkbox as never,
  line: "A yes or no with a label. Several of them is a list; one of many is a RadioGroup.",
  props: {
    label: { type: "text", max: 80, required: true },
    hint: { type: "text", max: 120 },
    defaultChecked: { type: "boolean", default: false },
  },
  defaults: { label: "Show the grid" },
  example: () => <Checkbox label="Show the grid" hint="The 144px box grid the canvas snaps to." defaultChecked />,
  since: "0.1.0", status: "draft",
};

const radioGroup: RegistryEntry = {
  name: "RadioGroup", kind: ["slot"], group: "controls", layer: "molecule", component: RadioGroup as never,
  line: "One of several, each with a sentence. Two or three words each is a Segmented.",
  props: {
    label: { type: "text", max: 40, required: true },
    options: { type: "list", of: { type: "object", fields: { value: { type: "text", max: 24 }, label: { type: "text", max: 40 }, hint: { type: "text", max: 120 } } }, max: 6, required: true },
    orientation: { type: "enum", of: ["vertical", "horizontal"], default: "vertical" },
  },
  defaults: { label: "Publish as", options: [{ value: "draft", label: "Draft" }, { value: "live", label: "Live" }] },
  example: () => (
    <RadioGroup
      label="Publish as"
      defaultValue="draft"
      options={[
        { value: "draft", label: "Draft", hint: "Saved, visible only to you." },
        { value: "live", label: "Live", hint: "Revalidates the site within a minute." },
      ]}
    />
  ),
  since: "0.1.0", status: "draft",
};

const tabs: RegistryEntry = {
  name: "Tabs", kind: ["panel", "slot"], group: "controls", layer: "molecule", component: Tabs as never,
  line: "A row of names on a hairline; one panel showing. The current tab wears the nav's marker.",
  props: {
    label: { type: "text", max: 40, required: true },
    tabs: { type: "list", of: { type: "object", fields: { value: { type: "text", max: 24 }, label: { type: "text", max: 24 } } }, min: 2, max: 6, required: true } as never,
  },
  slots: { panels: { admits: "blocks", label: "One panel per tab" } },
  defaults: { label: "Token groups", tabs: [{ value: "colour", label: "Colour" }, { value: "type", label: "Type" }] },
  example: () => (
    <Tabs
      label="Token groups"
      tabs={[
        { value: "colour", label: "Colour", panel: <Text size="small">Seven hues, three tiers each, one accent slot per block.</Text> },
        { value: "type", label: "Type", panel: <Text size="small">Bowlby from h2 up; Hanken 600 and 400 below.</Text> },
        { value: "space", label: "Space", panel: <Text size="small">A 4px scale, s-1 to s-24.</Text> },
      ]}
    />
  ),
  since: "0.1.0", status: "draft",
};

const toast: RegistryEntry = {
  name: "Toast", kind: ["slot"], group: "feedback", layer: "molecule", component: Toast as never,
  line: "One short message that arrives and leaves. The admin's brand voice lives here.",
  props: {
    tone: { type: "enum", of: ["neutral", "good", "warn", "bad"], default: "neutral" },
    title: { type: "text", max: 40 },
    text: { type: "text", max: 120, required: true },
  },
  defaults: { tone: "good", title: "Published", text: "The site will catch up within a minute." },
  example: () => (
    <Stack gap={8}>
      <Toast tone="good" title="Published">The site will catch up within a minute.</Toast>
      <Toast tone="warn" title="Saved, not published">Version 12 is yours until you say otherwise.</Toast>
    </Stack>
  ),
  since: "0.1.0", status: "draft",
};

const tooltip: RegistryEntry = {
  name: "Tooltip", kind: ["slot"], group: "feedback", layer: "molecule", component: Tooltip as never,
  line: "A line of help on hover and focus. Text only — anything more is a popover.",
  props: {
    label: { type: "text", max: 80, required: true },
    side: { type: "enum", of: ["top", "bottom", "left", "right"], default: "top" },
  },
  slots: { children: { admits: ["Button", "Chip"], max: 1, min: 1, label: "What it describes" } },
  defaults: { label: "What this does", side: "top" },
  example: () => (
    <Tooltip label="Revalidates the live site" side="right">
      <Button variant="secondary" size="sm">Publish</Button>
    </Tooltip>
  ),
  since: "0.1.0", status: "draft",
};


/* ── added in step 4 of the 2026-09-14 release (Atomic.md §6) ───────────────────────────────────────────── */

const speaker: RegistryEntry = {
  name: "Speaker", kind: ["slot", "panel"], group: "figures", layer: "molecule", component: Speaker as never,
  line: "A blob with its bubble — the pairing the brand is built on, named.",
  props: {
    label: { type: "text", max: 40, required: true, help: "Who is speaking, for assistive tech." },
    say: { type: "text", max: 120 },
    hue: { type: "hue", accent: true },
    variant: { type: "enum", of: ["character", "glass"], default: "character" },
    state: { type: "enum", of: ["idle", "sleep"], default: "idle" },
    size: { type: "blobSize", default: "md" },
    tint: { type: "hue" },
    below: { type: "boolean", default: false },
  },
  defaults: { label: "Bhargav", say: "What are we doing today?", variant: "glass" },
  example: () => (
    <Row gap={40} align="end">
      <Speaker label="Bhargav" variant="glass" say="What are we doing today?" />
      <Speaker label="The editor" hue="lavender" say="Not here yet." tint="lavender" state="sleep" />
    </Row>
  ),
  since: "0.1.0", status: "draft",
};

const menu: RegistryEntry = {
  name: "Menu", kind: ["panel"], group: "layout", layer: "organism", component: Menu as never,
  line: "The one navigation, in five forms. The current item is an ink pill.",
  props: {
    label: { type: "text", max: 40, help: "What the menu is for — “Sections”." },
    items: { type: "list", of: { type: "object", fields: { label: { type: "text", max: 24 }, href: { type: "href" }, view: { type: "text", max: 24 }, icon: { type: "text", max: 24 } } }, max: 9, required: true },
    anchor: { type: "enum", of: ["bottom-left", "bottom-right", "top-left", "top-right"], default: "bottom-left", help: "On a canvas the menu anchors to a corner of the viewport, not to a point in the scene." },
  },
  defaults: { label: "Sections", items: [{ label: "Me", href: "/" }, { label: "Work", href: "/work" }] },
  example: () => (
    <Row gap={24} align="start">
      <Menu
        form="floating"
        skipTo={false}
        aria-label="Sections"
        items={["Me", "Status", "Work", "Cases", "Projects", "Interests", "Philosophy"].map((l, i) => ({ id: l, label: l, href: `#${l.toLowerCase()}`, current: i === 2 }))}
      />
      <Menu
        form="rail"
        skipTo={false}
        aria-label="Admin, collapsed"
        style={{ position: "static", height: "auto", margin: 0 }}
        groups={[
          { items: [{ href: "#overview", label: "Overview" }] },
          { label: "Projects", hue: "peach", items: [{ href: "#projects", label: "Projects", badge: 2 }] },
          { label: "Systems", hue: "lavender", items: [{ href: "#systems", label: "Systems", current: true }] },
        ]}
      />
      <Menu
        form="column"
        skipTo={false}
        aria-label="Admin"
        style={{ position: "static", height: "auto", margin: 0 }}
        groups={[
          { items: [{ href: "#overview", label: "Overview" }] },
          { label: "Projects", hue: "peach", items: [{ href: "#projects", label: "All projects", items: [{ href: "#portfolio", label: "Portfolio" }] }] },
          {
            label: "Systems", hue: "lavender",
            items: [{
              href: "#systems", label: "All systems", current: true,
              panel: [
                { label: "design system", items: [{ href: "#tokens", label: "Tokens" }, { href: "#components", label: "Components", current: true }, { href: "#illustrations", label: "Illustrations" }] },
                { label: "more", items: [{ href: "#document", label: "Document" }, { href: "#publishing", label: "Publishing" }, { href: "#storage", label: "Storage" }] },
              ],
            }],
          },
          { label: "Products", hue: "blue", items: [{ href: "#products", label: "All products", badge: 2 }] },
        ]}
      />
    </Row>
  ),
  since: "0.1.0", status: "draft",
};

const table: RegistryEntry = {
  name: "Table", kind: ["panel"], group: "layout", layer: "organism", component: Table as never,
  line: "Rows on hairlines, mono headers, tabular numbers. The first real data density.",
  props: {
    caption: { type: "text", max: 60, help: "The table's subject. A table without one is a grid of numbers." },
    density: { type: "enum", of: ["cozy", "compact"], default: "cozy" },
  },
  defaults: { caption: "Versions", density: "cozy" },
  example: () => (
    <Table
      caption="Published versions"
      rowKey={(r) => String(r.v)}
      columns={[
        { key: "v", header: "Version", align: "num", width: "88px" },
        { key: "label", header: "Label" },
        { key: "by", header: "By" },
        { key: "when", header: "Published", align: "num" },
        { key: "hash", header: "Registry", align: "num" },
      ]}
      rows={[
        { v: 12, label: "Roadmap, honest counts", by: "bhargav", when: "2026-09-14", hash: "a3f1c2d9" },
        { v: 11, label: "Work ring at 2200", by: "bhargav", when: "2026-09-11", hash: "a3f1c2d9" },
        { v: 10, label: "First publish", by: "bhargav", when: "2026-09-08", hash: "7e04b1aa" },
      ]}
    />
  ),
  since: "0.1.0", status: "draft",
};

const dialog: RegistryEntry = {
  name: "Dialog", kind: ["panel"], group: "surfaces", layer: "organism", component: Dialog as never,
  line: "Glass-3 over everything, one primary action. A native dialog does the modal work.",
  props: {
    title: { type: "text", max: 60, required: true },
    description: { type: "text", max: 160 },
    form: { type: "enum", of: ["dialog", "sheet"], default: "dialog" },
    size: { type: "enum", of: ["sm", "md", "lg"], default: "md" },
  },
  slots: { children: { admits: "blocks", label: "The body" } },
  defaults: { title: "Publish version 13?", description: "The site revalidates within a minute." },
  example: () => (
    <Dialog modal={false} open title="Publish version 13?" description="The live site revalidates within a minute. The last published version stays in the list."
      actions={<><Button variant="ghost">Not yet</Button><Button>Publish</Button></>}>
      <Field label="Label" placeholder="What changed, in a few words" hint="Required: a version is an integer with a label (Admin.md R1)." />
    </Dialog>
  ),
  since: "0.1.0", status: "draft",
};

const tree: RegistryEntry = {
  name: "Tree", kind: ["panel"], group: "layout", layer: "organism", component: Tree as never,
  line: "The outline: the Menu's list with disclosure. Arrow keys walk it; DOM order is tab order.",
  props: {
    label: { type: "text", max: 40, required: true },
  },
  defaults: { label: "Outline" },
  example: () => (
    <div style={{ width: 260 }}>
      <Tree
        label="Outline"
        defaultSelected="work-widget"
        defaultExpanded={["work", "me"]}
        nodes={[
          { id: "me", label: "Me", children: [{ id: "me-blob", label: "The blob" }, { id: "me-intro", label: "Intro" }, { id: "me-story", label: "Story" }] },
          { id: "work", label: "Work", children: [{ id: "work-widget", label: "Widget" }, { id: "work-full", label: "Full view", children: [{ id: "work-roles", label: "Four roles" }, { id: "work-chips", label: "The through-line" }] }] },
          { id: "status", label: "Status", children: [{ id: "status-widget", label: "Widget" }] },
        ]}
      />
    </div>
  ),
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
  name: "Image", kind: ["slot"], group: "figures", layer: "atom", component: Image as never,
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
  name: "Steps", kind: ["panel", "slot"], group: "composites", layer: "molecule", component: Steps as never,
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
  name: "Step", kind: ["slot"], group: "composites", layer: "molecule", component: Step as never,
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
  name: "Quote", kind: ["panel", "slot"], group: "composites", layer: "organism", component: Quote as never,
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
  name: "MediaCard", kind: ["panel", "slot"], group: "composites", layer: "organism", component: MediaCard as never,
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
  name: "Carousel", kind: ["panel", "slot"], group: "layout", layer: "organism", component: Carousel as never,
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


const FACE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="#5b8fd6"/><stop offset="1" stop-color="#8fd6a8"/></linearGradient></defs>` +
      `<rect width="400" height="400" fill="url(#g)"/>` +
      `<ellipse cx="200" cy="220" rx="86" ry="100" fill="#fff" fill-opacity="0.22"/>` +
      `<circle cx="200" cy="125" r="52" fill="#fff" fill-opacity="0.28"/></svg>`,
  );

const profileCard: RegistryEntry = {
  name: "ProfileCard", kind: ["slot", "panel"], group: "composites", layer: "organism", component: ProfileCard as never,
  line: "A face, a name, and what they do — the picture is the whole card.",
  props: {
    name: { type: "text", max: 40, required: true },
    role: { type: "text", max: 40 },
    hue: { type: "hue", help: "Fills the card when there is no media, and tints the bloom under it." },
    bloom: { type: "boolean", default: true, help: "The media rendered again, blurred beneath the card — the light it casts on the surface. Off where the surface has its own." },
  },
  slots: { media: { admits: ["Image", "Illustration", "Blob"], max: 1, label: "The face" } },
  defaults: { name: "Someone", role: "What they do", hue: "blue" },
  example: () => (
    <div style={{ width: 260 }}>
      <ProfileCard name="Natalie Ramirez" role="Software Engineer" hue="blue" media={<Image src={FACE} alt="" ratio={1} />} />
    </div>
  ),
  since: "0.1.0", status: "draft",
};

const deck: RegistryEntry = {
  name: "Deck", kind: ["panel", "slot"], group: "layout", layer: "organism", component: Deck as never,
  line: "A stack of cards, one of them forward. Still a scroll container.",
  props: {
    label: { type: "text", max: 40, required: true },
    visible: { type: "enum", of: ["0", "1", "2"], default: "1", help: "Cards showing either side of the front one. 1 is three across; 2 is five. The card width is derived from it, in container units." },
    overlap: { type: "number", unit: "fraction of a card", min: 0, max: 0.5, default: 0.28 },
    start: { type: "text", max: 8, default: "0", help: "Which card is forward on load. “middle” opens with a neighbour on each side, which is what a deck is for." },
    dots: { type: "boolean", default: true },
  },
  slots: { children: { admits: ["ProfileCard", "MediaCard", "Card"], label: "Cards", min: 2 } },
  defaults: { label: "Cards", visible: 1, start: "middle" },
  example: () => (
    <Deck label="The team" visible={1} start="middle">
      <ProfileCard name="Sophia Brooks" role="Teacher" hue="peach" media={<Image src={FACE} alt="" ratio={1} />} />
      <ProfileCard name="Natalie Ramirez" role="Software Engineer" hue="blue" media={<Image src={FACE} alt="" ratio={1} />} />
      <ProfileCard name="James Whitman" role="Researcher" hue="lavender" media={<Image src={FACE} alt="" ratio={1} />} />
    </Deck>
  ),
  since: "0.1.0", status: "draft",
};

export const entries: readonly RegistryEntry[] = [
  heading, text, label,
  chip, dot,
  button,
  stack, row, divider, bento, bentoCell, carousel, deck,
  card, glass, placeholder,
  figure, blob, illustration, image,
  sectionHeader, intro, cellHead, blockCard, roadmapItem, regionLabel, steps, step, quote, mediaCard, profileCard,
  segmented, select, checkbox, radioGroup, tabs, toast, tooltip,
  speaker, menu, table, dialog, tree,
];
