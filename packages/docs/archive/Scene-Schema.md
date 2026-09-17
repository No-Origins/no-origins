# Scene Schema — the document format

*Opened 2026-09-11. The contract between the admin editor (Admin.md), `@no-origins/ui/canvas`, and every project that renders a canvas.*

> **Superseded 2026-09-16.** The document layer, the adapter and the editor this schema fed were removed with React Flow (Atomic.md D11). Bhargav: *"Let's remove the react flow and all react flow related items completely. I want to take a different approach later."* This document is kept as the record of what was learned — and **the registry's contract (§2, §3) is what survives**: `entries`, each entry's `kind` and `slots`, and the prop schemas are still in the package, because they describe what a component is and where it may go, which is the first thing any new approach will need. The body below is not rewritten; read it as the account of the first attempt.

This is a **System** in the sense of Admin.md §1: every project shares it, no project may fork it, and both the editor that writes it and the renderer that reads it are downstream of this document rather than of each other.

---

## 0. The problem, stated exactly

`apps/portfolio/src/components/scene.tsx` authors the map as TSX. A panel's content is `React.ReactNode`:

```tsx
full("me-intro", "me", x, y, 140, (
  <>
    <h2 className="noo-h2 noo-panel__title">Me</h2>
    <p className="noo-lead">…</p>
  </>
))
```

That is the right way to hand-author a canvas and **the wrong way to store one**. JSX is a function call, not data: it cannot go into a jsonb column, cannot come back out, cannot be diffed between versions, and cannot be edited by anything but an editor that is itself a compiler.

So a DB-backed canvas needs three things, and they are the whole of this document:

1. **A serializable scene** — JSON that describes a canvas without describing how to render it (§1).
2. **A registry** — the closed set of components a document may name, each with a typed props schema (§2–§3).
3. **An adapter** — one function that turns a document into the `SceneNode[]` that `CanvasShell` already takes (§4).

Nothing in `@no-origins/ui/canvas` changes. The adapter's output is exactly what `scene.tsx` hand-writes today, which is why the hand-authored path and the document path can coexist through the whole migration (Admin.md D5).

---

## 1. The document

```jsonc
{
  "schema": 1,                       // this format's version (§5)
  "id": "portfolio/home",
  "kind": "canvas",                  // "canvas" | "page"
  "grid": { "box": 160, "pad": 8 },  // Design-System.md §8; echoed so a doc is self-describing
  "meta": { "title": "…", "description": "…" },
  "patterns": {                      // the document's own patterns, made in the studio (Admin.md §6.5b); the
    "tide-2": { "seed": 19, "flow": 12, "scale": 1.3, "swing": 44, "breath": 30, "curl": 0.7, "tempo": 0.3 }
  },                                 // package's eighteen need no entry — a `pattern` prop names either

  "nodes": [
    {
      "id": "work-widget",
      "kind": "widget",              // "blob" | "panel" | "widget" | "region" | "page" (§9.3 ⑧)
      "at": [640, -960],             // canvas units (§1.1); a widget must land on a box corner
      "size": [640, 480],            // canvas units — 4 × 3 boxes
      "section": "work",
      "when": { "$ref": "work.roles" },   // optional: render only if the ref resolves (§1.4)
      "node": { "view": "work", "label": "Work experience" },   // node data, NOT component props (§1.5)
      "component": "Bento",          // must exist in the registry (§2)
      "props": {
        "hue": "peach",
        "eyebrow": "WORK EXPERIENCE",
        "figure": { "value": "4", "label": "roles" },
        "pattern": "fan"           // one of the eighteen, or a key of `patterns` above
      },
      "slots": {
        "children": [ /* child nodes, same shape */ ]
      }
    }
  ],

  "views":   [ { "id": "work", "label": "Work", "nodeIds": ["work-widget"], "frame": "top", "href": "/work" } ],
  "threads": [ { "from": "me-blob", "to": "me-intro" } ],
  "order":   ["me", "status", "work", "cases", "projects", "interests", "philosophy"]
}
```

### 1.1 Positions are in canvas units; the box grid is the snap, not the unit

*Revised after §8 — the first draft stored boxes, and hand-authoring Me disproved it three times out of three.*

`at` and `size` are **canvas units**, integers. The box grid of 160 (Design-System.md §8.3) is what the **editor snaps to** — drag lands on box corners by default, a held modifier places freely — and box alignment is *enforced* only where §8.3 actually requires it: on widgets and regions (§6 rule 7).

The first draft made boxes the storage unit, on the reasoning that an off-grid layout would then be unrepresentable. Me settles it: the blob sits at −0.225, −1.9 boxes (it is centred on the origin crosshair) and both panels at −1.75 (they run down a 560 column). Not one Me node is on a box corner, and none of them should be. Only the six ring widgets are quantised, because §8.3 quantised *them*.

| Kept | Given up |
|---|---|
| Widgets and regions cannot go off-grid — the rule holds where it is true | "Change `--grid-box` and every document rescales." Speculative; the live canvas never had it |
| The editor still makes on-grid layouts the path of least resistance | "The snap is the schema." It is a UI behaviour again, and a deliberate override is allowed |

Sub-pixel placement is still not supported: `at` and `size` are integers. Anything finer is a component's internal layout, not a scene.

**Revised again, 2026-09-15 — Bhargav, on first use of the editor:** *"one full block of grid item should be the minimum space any item should take. No dynamic sizes. Sizes are always defined in terms of blocks."* So the unit stays canvas units, but the RULE changes for every kind: `at` lands on a box corner and `size` is whole boxes, one at least — blobs included (a blob without a `size` is one box). Me was the argument for free placement; it is now on the grid: the blob in the box at `[0, −320]`, the intro at `[−320, 160]` 4 × 1, the story under it 4 × 3, the menu one box further left so it touches rather than covers. The editor snaps on drop, on drag and on resize (handles on the selected node), and the layout form counts in boxes. A node also carries **`align`** — `start · center · end`, default **center**: content sits in the middle of its boxes unless told otherwise. §6 rule 7 now applies to every node in canvas space.

### 1.2 `order` is reading order

Design-System.md §12: *"canvas nodes are absolutely positioned, so DOM order is reading order and tab order"*, and §8.3: a ring has no natural order, so reading order is declared. `order` lists sections; within a section, array order in `nodes` is DOM order.

The adapter emits nodes in that order and **never sorts by position**. A document whose `order` omits a section that has nodes is invalid (§6).

### 1.3 Heights

`size` is in boxes for widgets and regions, which are fixed by design. **Panels are different**: their height is measured from rendered content (Admin.md §6.3), so a panel carries

```jsonc
{ "size": [560, null], "measured": { "h": 412, "at": "2026-09-11T09:22:00Z", "slack": 18 } }
```

Width authored, height measured (written back by the editor, never typed); both in canvas units. `slack` is what the probes report. A panel with no `measured` renders at its content's natural height and is flagged before publish.

**Retired 2026-09-15** (§1.1 revision): *"no dynamic sizes."* A panel's height is authored in whole boxes like every other node's; content that does not fit is the author's to see and the handles' to fix. `null` heights and `measured` are still read from older documents and rendered at whole boxes with a warning; the editor never writes them.

---

### 1.4 `when` — the one conditional

A node may carry `"when": {"$ref": "…"}` and renders only if that ref resolves to something non-empty.

This exists because "an unfilled slot renders nothing" is a platform promise, not a convenience (Design-System.md §13: the pages ship either way). Me's photo and location are both `{value ? … : null}` in the TSX today, and dropping that to satisfy a schema would drop a design rule.

It is a **presence test, not an expression**: one ref, no operators, no comparison, no negation, no boolean algebra. §7's ban on computation stands for everything else, and this is the narrowest possible hole in it.

### 1.5 `node` is not `props`

`say`, `view`, `href`, `surface`, `scroll`, `label`, `full` and `section` are read by the node renderers — `BlobNode`, `PanelNode`, `WidgetNode` — and belong to the **node**. `Blob` has never heard of `say`; `Card` has never heard of `surface: "none"`.

So a node carries both, validated separately: `node` against its kind, `props` against its registry entry. Merging them would hand `surface` to a component that does not take it, and the type system would not catch it because the document is data.

**`node.say` is a default the host may override.** `portfolioScene(says)` is a function precisely because the guided chat changes what the host blob says — that is runtime state, and the document only supplies the opening line.

## 2. The registry

A document may only name components the registry exports. This is simultaneously:

- **the editing model** — the palette *is* the registry, so adding a component to `packages/ui` adds it to the editor;
- **the security model** — a document is data, and data can never introduce code. A `component` value that is not in the registry renders a visible error node, never anything else;
- **the compatibility model** — `registry_hash` on a version row (Admin.md §7) covers the names and the authorable schemas, so two publishes with equal hashes are guaranteed to render alike.

One declaration, **three consumers**: the design-system showcase at `design.no-origins.com`, the admin's catalogue (Admin.md §5.1–5.2, read-only under R3), and the editor palette. Any component not in the registry still exists as a React export — the registry governs what is *authorable*, not what is *importable*.

### 2.1 The entry

```ts
// packages/ui/src/registry/index.ts
export interface RegistryEntry<P = Record<string, unknown>> {
  name: string;                       // "BlockCard" — what a document names
  kind: SceneNodeKind[] | "slot";     // which node kinds may host it; "slot" = children only (§2.3)
  component: React.ComponentType<P>;
  props: PropSchema;                  // §3 — the AUTHORABLE surface, not the React one (§2.2)
  slots?: Record<string, SlotSpec>;   // named child collections, each with the names it admits
  defaults: Partial<P>;               // what a freshly dropped instance looks like
  example: () => React.ReactNode;     // the catalogue's live sample
  since: string;                      // the ui version it appeared in
  status: "stable" | "draft" | "deprecated";
  childrenFrom?: string;              // the authored prop rendered as `children` — Heading.text, Text.markdown (§10 ①)
  adapt?: (props, parent?) => props;  // authored shape → React shape where they differ — BentoCell.span (§10 ②)
}
```

### 2.2 Two prop surfaces, and the schema is always the narrower one

This is the part that has to be got right, and the component signatures make it unavoidable. Almost every component in the package spreads DOM props:

```ts
export interface BlockCardProps extends Omit<ComponentPropsWithoutRef<"article">, "title"> {
  hue: Hue;
  title: ReactNode;          // a React node — could be an element
  details?: ReactNode[];
  as?: ElementType;          // a component reference
  // …plus className, onClick, and every article attribute
}
```

`ReactNode`, `ElementType` and event handlers do not serialize, and `className` is an escape hatch into arbitrary styling. So a registry entry does **not** publish the React props. It publishes a separate, narrower schema:

```ts
props: {
  hue:     { type: "hue",  required: true },
  title:   { type: "text", required: true, max: 80 },
  line:    { type: "text", required: true, max: 160 },
  meta:    { type: "text", max: 40 },
  details: { type: "list", of: { type: "text", max: 120 }, max: 6 },
  chips:   { type: "list", of: { type: "object", fields: { label: "text", hue: "hue" } }, max: 5 },
  href:    { type: "href" },
  state:   { type: "enum", of: ["idle", "sleep"], default: "idle" },
  blob:    { type: "boolean", default: false },
}
```

**The rule, and it is absolute: the authorable schema is a subset of the React props, never an extension.** Anything a document can set, code can already set. The moment the schema admits something the component's own type does not, the database has become a second API and the two will disagree.

Three consequences fall out of it:

| Consequence | Why |
|---|---|
| `className`, `as`, `style` and every event handler are **never authorable** | They are the styling and behaviour escape hatches. A document that can set `className` can break §11.2 rule 3 from a database row |
| A `ReactNode` prop is re-typed as `text`, `markdown` or a **slot** — never carried through | `title: ReactNode` becomes `text`; `description: ReactNode` becomes `markdown`; `children: ReactNode` becomes a slot |
| Every authorable string prop gets a `max` | The editor shows the overflow live, and §6 rule 8's measured heights only stay true if the text has a ceiling |

### 2.3 What is registered

**Twenty-two entries, settled 2026-09-11** against the Canvas Palette board. Twelve exist in `@no-origins/ui`; ten are new and are build-order step 2.

| Group | Entries | New |
|---|---|---|
| **Text** | `Heading` · `Text` · `Label` | all three |
| **Marks** | `Chip` · `Dot` | `Dot` |
| **Actions** | `Button` | — |
| **Layout** | `Stack` · `Row` · `Divider` · `Bento` · `BentoCell` | `Stack` `Row` `Divider` |
| **Surfaces** | `Card` · `Glass` · `Placeholder` | — |
| **Figures** | `Figure` · `Blob` · `Illustration` | — |
| **Composites** | `Intro` · `CellHead` · `BlockCard` · `RoadmapItem` · `RegionLabel` | `Intro` `CellHead` `RegionLabel` |

Which node kinds may host what:

| Node kind | May host |
|---|---|
| `widget` | `Bento` at 4 × 3 (`SectionWidget` **retired 2026-09-11** — total freedom over guard rails, Design-System.md §9; its three rules are `probe12` now, not props) |
| `page` | `Bento` with `page: true` — a section's full view. 10 columns, rows `minmax(144px, auto)`, scrolls in the document. No coordinates |
| `panel` | `Intro` · `Text` · `Card` · `BlockCard` · `RoadmapItem` · `Placeholder` · `Stack` |
| `blob` | `Blob` |
| `region` | `RegionLabel` |
| **slot children** | everything else — `Heading` `Label` `Chip` `Dot` `Button` `Row` `Divider` `BentoCell` `Figure` `Illustration` `CellHead` `Glass` |

**Three consolidations, made when the list became a library rather than a derivation.** The first draft of this section took its names from whatever the current portfolio happened to use. Designing a palette instead changed three of them, and the changes are the useful part:

| Was | Is | Why |
|---|---|---|
| `Prose` + `Note` | one **`Text`** | Same component at different sizes. `size: lead \| body \| small` and `tone: default \| muted` covers every run of words on the platform, and the markdown lives in one place instead of two |
| `ChipRow` | **`Row`** | A generic wrapping row absorbs the chip row *and* the résumé row. A one-off chip container was copying the portfolio instead of designing a library |
| — | **`Heading`** · **`Label`** · **`Stack`** · **`Divider`** | You cannot compose freely if headings only arrive bundled inside `Intro`, and nothing in the system arranged two things inside a panel. The portfolio reached for a utility class every single time, which is exactly why those spots were unauthorable |

**`Stack` and `Row` are the load-bearing additions.** Between them they replace every `<div className="flex …">` in the app, which was seven of the ten gaps found by hand-authoring (§8.1 ⑨, §9.3 ⑨).

### 2.4 What is deliberately not registered

Stated so the omissions read as decisions rather than oversights.

| Not registered | Why |
|---|---|
| `Glass`, `Bubble` | Surface primitives. Every authorable component is already built on them; exposing them lets a document build an un-designed surface |
| `Field`, `Toggle` | Form controls. A published canvas collects no input — that is the admin's job, and the admin is code |
| `ChatInput`, `CanvasMap`, `ThemeSwitch`, `Wordmark` | Viewport furniture, not content. They belong to `CanvasShell`'s panel slots and are not in the scene at all (§8.1) |
| `NavBar`, `Rail`, `SectionHeader`, `Footer`, `Page`, `Container`, `Section` | Page mode. Reserved for `kind: "page"`, which is out of scope until the editor block exists (§7) |
| `IllustrationCanvas` | Takes a render function (`children: (line) => ReactNode`). A function is the one thing a document can never carry |

---

## 3. Prop schemas

One schema per component, doing three jobs: it **validates** a document, it **generates** the inspector form (Admin.md §6.1), and it **migrates** old documents when it changes (§5). Zod is the implementation; what follows is what each type means to the inspector.

### 3.1 The types the inspector can render

| Type | Control | Notes |
|---|---|---|
| `hue` | `HueSwatch` — seven 20px dots in a row, an ink ring on the chosen one, the name beside (Admin.md §6.5a E1; was "the seven-blob swatch") | Values from `tokens.ts` `hues` — `pink · green · grey · lavender · peach · yellow · blue`, plus `accent` as an eighth glass dot where the component allows it. Never a free colour: R3 put colour in code |
| `text` | `Field`, with the live character count against `max` | Plain string. No markup — a `ReactNode` prop arrives here |
| `markdown` | Text area, with the ⌘K directive control | §3.5 |
| `enum` | `Segmented` up to four options, `Select` above four (Admin.md §6.5a; was "chip row" — a chip is a mark, not a control) | |
| `number` | `Field`, mono, units stated — boxes, canvas units or ms | |
| `boolean` | `Checkbox` (Admin.md §6.5a; was `Toggle` — a toggle applies at once, an inspector value applies on save) | |
| `list` | `Repeater` — rows on hairlines with a grip, the item's fields inline, a ghost *Add*, the count against `max`; `density="chips"` for short text and `{label, hue}` (Admin.md §6.5a E3) | `details`, `chips` |
| `object` | A labelled group of the above | `figure: {value, label, size}` |
| `pattern` | `PatternPicker` — the library's patterns drawn in the node's hue, named, plus *New pattern* (Admin.md §6.5a E2, §6.5b; was `illustration`) | §3.6 |
| `blobSize` | The seven names from `blobSizes`, or a number | `favicon · inline · nav · sm · md · lg · hero` |
| `href` | `Field` plus an internal/external toggle | Internal resolves to a view, so it pans rather than routing |
| `ref` | Picker of the project's content keys | §3.4 |

**No component gets a hand-built form.** If a prop cannot be expressed above, either the table grows — a decision, recorded here — or the prop is not authorable, also a decision. Never a bespoke form: that is where the schema and the UI start to drift.

### 3.2 The catalogue, component by component

The authorable surface of all twenty-two. `*` marks required; a number in brackets is the character cap (§2.2). ★ is new.

| Component | Authorable props | Slots |
|---|---|---|
| **Heading** ★ | `level`* 2 \| 3 \| 4 · `text`* (80) | — |
| **Text** ★ | `markdown`* · `size` lead \| body \| small · `tone` default \| muted | — |
| **Label** ★ | `text`* (24) | — |
| **Chip** | `label`* (24) · `hue` · `dot` · `pressed` · `href` | — |
| **Dot** ★ | `hue`* | — |
| **Button** | `label`* (24) · `variant` primary \| secondary \| ghost · `size` sm \| md · `href` | — |
| **Stack** ★ | `gap` 8 \| 16 \| 24 \| 40 | `children`: blocks |
| **Row** ★ | `gap` · `align` start \| center \| baseline · `wrap` | `children`: blocks |
| **Divider** ★ | — | — |
| **Bento** | `hue` · `cols` · `rows` · `page` · `label` (40) | `cells`: BentoCell |
| **BentoCell** | `span` [cols, rows] · `tone` quiet \| glass \| fill \| ink \| bare · `illustration` (§3.6) | `content`: blocks |
| **Card** | `padding` md \| sm · `surface` solid \| glass | `body`: blocks |
| **Glass** | `level` 1 \| 2 \| 3 · `radius` | `body`: blocks |
| **Placeholder** | `title`* (80) · `draft` | `body`: blocks |
| **Figure** | `value`* (4) · `label` (20) · `size` lg \| md | — |
| **Blob** | `variant` character \| logotype \| glass · `size` · `state` idle \| sleep · `hue` · `label` (40) · `blink` · `look` · `breathe` · `refraction` | — |
| **Pattern** (was Illustration) | `name`* (one of the eighteen, or a document pattern) · `hue` · `title` (60) | — |
| **Intro** ★ | `title`* (60) · `lead` (160, accepts a `ref`) | — |
| **CellHead** ★ | `label` (24) · `title` (40) · `dot` (hue) | — |
| **BlockCard** | `hue`* · `title`* (80) · `line`* (160) · `meta` (40) · `details` (list of text ≤ 6) · `chips` (list of {label, hue} ≤ 5) · `href` · `state` idle \| sleep | — |
| **RoadmapItem** | `hue`* · `title`* (80) · `description`* (markdown) · `progress` (40) | — |
| **RegionLabel** ★ | `text`* (24) | — |

**"blocks"** means any entry whose `kind` includes `slot` — the whole palette minus the node-level ones. That is what makes free composition work: a `Card` body, a `BentoCell` content and a `Stack` children all admit the same set, so nothing is stuck in one container.

Two caps carry a design rule rather than a preference. `Label` at 24 and `Figure.value` at 4 because §8.3 sets a widget's type at roughly twice a document's — a long eyebrow does not shrink, it wraps and breaks the diagonal. `BlockCard.chips` at 5 because a sixth wraps the card and pushes everything below it down a row.

`Button.download` and `target` are **not** authorable: a canvas handing a visitor a file from a database row is a different security question, and the one real download — the résumé — is a `site.resumeHref` slot in code.

### 3.2a One entry, written out

The contract in §2.1 as it actually reads for a new component and an existing one.

```ts
// packages/ui/src/registry/text.ts — new (build-order step 2)
export const text: RegistryEntry<TextProps> = {
  name: "Text",
  kind: ["panel", "slot"],
  component: Text,
  props: {
    markdown: { type: "markdown", required: true },
    size:     { type: "enum", of: ["lead", "body", "small"], default: "body" },
    tone:     { type: "enum", of: ["default", "muted"], default: "default" },
  },
  defaults: { markdown: "Write here.", size: "body" },
  example: () => (
    <Text size="lead">I build editors, design systems and agent tools.</Text>
  ),
  since: "0.1.0",
  status: "draft",
};

// packages/ui/src/registry/block-card.ts — exists, registered
export const blockCard: RegistryEntry<BlockCardProps> = {
  name: "BlockCard",
  kind: ["panel"],
  component: BlockCard,
  props: { /* §3.2 */ },
  defaults: { hue: "peach", title: "A role", line: "One line about it." },
  example: () => <BlockCard {...roles[2]} />,      // real content, never lorem
  since: "0.0.1",
  status: "stable",
};
```

`SlotSpec` is the other half:

```ts
interface SlotSpec {
  admits: string[] | "blocks";   // registry names, or the whole slot-capable set
  min?: number;
  max?: number;
  label: string;                 // what the editor's outline calls it
}
```

Three rules the entries have to keep, all of them learned the hard way:

1. **`example()` uses real content.** `roles[2]` is Hashnode, not "Lorem ipsum". The catalogue is also the showcase (§5.1 of Admin.md), and a showcase of placeholder text demonstrates nothing about a design system built on measured type.
2. **`defaults` must produce something valid.** A dropped component that fails validation before the author has typed anything makes the editor feel broken on first use.
3. **`status: "draft"` is the honest state for all ten new entries** until each has been through the visual review loop. `stable` is a claim, not a default.

### 3.3 Validated on write and on read

On write the editor refuses to save an invalid document. On read the renderer validates again and, for a node that fails, renders a visible error card in its place — never a blank, never a crash, never a silently dropped node. A published canvas with one broken panel is a canvas with one broken panel; a published canvas with one *missing* panel is a mystery.

### 3.4 Content lives beside the document, not inside it

`apps/portfolio/src/content/{site,work,sections}.ts` holds the copy today, and `sampled()` marks what the machine wrote rather than Bhargav. That distinction is load-bearing (Design-System.md §13) and must survive.

So a prop of type `ref` resolves a content key — `{"$ref": "site.tagline"}` — and the admin's `/projects/portfolio/content` screen is where those are edited.

**`props` may itself be a ref** (§9.3 ⑩): `"props": {"$ref": "work.roles.0"}` resolves to a whole props object and is validated against the entry's schema exactly as an inline one is. That is how the four role cards keep `work.ts` as their single source without a list-render — which is banned, because each role's height is a separate measurement and a loop has one body. Copy belonging to one panel and nowhere else lives inline in `props`; copy several nodes share lives as a ref. The `sample copy` tag is a field on the content record, not something an author remembers to type.

### 3.5 Prose

**Settled by Admin.md R4: markdown, plus a declared set of inline directives.** Prose is the `markdown` prop on a **`Text`** component — never raw HTML, never a React tree. A document carries no markup.

```md
If you're hiring, the work is on :pan[Work]{view=work}.
```

Markdown carries the writing. Directives carry the few behaviours markdown has no syntax for, and they are **a registry like the components** — a closed set, declared, each with its own schema:

| Directive | Renders | Props |
|---|---|---|
| `:pan[text]{view=id}` | `PanLink` — a real `<a href>` that moves the viewport instead of navigating (§8.5) | `view`, resolved against the document's `views` |
| `:chip[text]{hue=peach}` | An inline `Chip` | `hue` from `tokens.ts` |

An unknown directive renders as its plain text — a document never breaks on one, it only loses the behaviour. That degradation is what made the syntax worth paying for.

**Authoring never requires typing it.** The editor inserts a directive from a control — select the text, ⌘K, pick the destination — exactly as a bold button inserts `**`. The syntax is what is *stored*, not what is typed. Block-level composition stays drag-and-drop under every option considered; a directive only ever exists inside a sentence.

Validation: `view` must resolve (§6 rule 4), so a pan-link to a deleted section is caught at save rather than found by a visitor.

### 3.6 Measured parameters are not authorable

`Illustration` takes a `Family` — fourteen parameters. Two of them are **measurements, not choices**: `flow` decides how much of the cell the words cost and is read off `e2e/.mcp/flow.mjs`; `words` is the text boxes the drawing must keep clear and is read off `words.mjs`. Patterns.md is emphatic that neither is ever estimated by eye, and each has already cost a round.

An inspector with fourteen sliders would invite exactly that. So **`illustration` is authorable only as one of the six named families** — `status · work · cases · projects · interests · philosophy` — and the parameter sets stay in `content/sections.tsx`, in code, where the measurements live beside the numbers they produced.

This is the same shape as R3: the values that come from measurement or from a design round are a code change; the admin names one and does not tune it. A seventh family is a studio round (Patterns.md §8), not a slider drag.

**Two corrections, both found on the catalogue page 2026-09-11 (Bhargav).**

The package held **two** illustration systems and the registry named the wrong one. `Illustration` was the *retired* grammar of six primitives — corner objects, where `work` is literally `stack(4)` and draws four capsules — kept only so `/fixtures/bento` could show them beside the real ones until the grammar is deleted. The live system is `illo()`, the generator, which every widget has used since 2026-09-10. The current name now belongs to the current system: the retired glyphs are `Glyph`, marked deprecated.

And the six parameter sets lived in `apps/portfolio/src/content/sections.tsx` — **in the app**. A document can only name what the package exports, so an illustration could be placed in hand-written TSX and never authored. They are `packages/ui/src/illustrations/fields.ts` now, and `sections.tsx` imports them, so there is one source. `SectionWidget` also drew the field inline; it renders `Illustration` now, which is what made the catalogue's example wrong in the first place — it was missing the `slice` aspect ratio and the field positioning that only existed inside `SectionWidget`.

**`words` is the open part.** It is measured against a *particular composition* — the boxes in `fields.ts` are true for the six widgets as composed today, a mono eyebrow top-left and a figure bottom-left. Recompose a cell and they are wrong. So under free composition `words` becomes something **the editor measures and writes back**, exactly as it does a panel height (Admin.md §6.3), with `probe10` checking the result. It is the second measurement to move from the author to the machine, and for the same reason.

**Amended 2026-09-14 (Bhargav's notes on the picker board; Admin.md §6.5b).** The word is *pattern*, the library is eighteen, and **the geometry is authorable after all**: the picker's *New pattern* opens the twelve dials on a live thumbnail, and Save writes a named `Family` into the document's own `patterns` map (§1). What made the fourteen-slider inspector wrong was not the dials but the two measurements among them, and those stay where this section put them — `words` is measured by the editor and written back, never typed; `flow` is a dial, shown with its cost the way `/fixtures/controls` shows it. Every other setting is a legal picture by construction (Patterns.md §6.0), which is the property that makes handing the dials to an author safe. A pattern worth keeping for everyone is promoted to `patterns.ts` in code.

## 4. The adapter

```ts
// @no-origins/ui/document  (built 2026-09-14 — §10 ③ says why not /canvas)
export function documentToScene(doc: unknown, registry: Registry, ctx?: { content?: unknown }): {
  valid: boolean;          // no error-level issue: what Publish is gated on (§6)
  scene: SceneNode[];
  views: CanvasView[];
  threads: SceneThread[];
  pages: DocumentPage[];   // `page` nodes, rendered — not in canvas space (Design-System.md §8.4), for their own route
  issues: Issue[];
}
```

It resolves each node's `component` against the registry, validates `props`, renders the component into `content`, converts `at`/`size` from boxes to canvas units, and emits nodes **in `order`**. The output is precisely what `scene.tsx` hand-writes, so:

- `CanvasShell`, `PanelNode`, `WidgetNode`, `BlobNode`, `sceneToNodes`, `Threads` are untouched;
- the server renders a document exactly as it renders the hand-authored scene — same markup, same SSR guarantees of §12, same no-JS behaviour of §8.7;
- a canvas may be **half document and half source** during the migration, because both produce `SceneNode[]` and the shell cannot tell them apart.

That last property is what makes Admin.md D5 option 2 cheap, and it is the reason the adapter's return type is the existing types rather than a new one.

---

## 5. Versioning the schema itself

Two versions move independently and both are recorded on every publish (Admin.md §7):

| | Changes when | Breaks what |
|---|---|---|
| `schema` (this document's format) | The node shape changes — a new field, a renamed key | Every document at once |
| `registry_hash` (component props) | A component gains, loses or retypes a prop | Only documents using that component |

**Migrations are forward-only and run on read, then persist on next write.** A v1 document loaded by a v2 renderer is migrated in memory, rendered, and rewritten as v2 the next time it is saved. Published versions are immutable and are **never** migrated in place — an old version renders through the migration chain, which is exactly why `schema_version` and `ui_version` are stored with it.

A component that removes a prop ships a migration alongside the removal, in the same changeset. No migration, no merge.

---

## 6. Validity

A document is valid when all of these hold. The editor checks them continuously; publish is blocked on any failure (Admin.md §6.3).

1. Every `component` exists in the registry, and its `kind` permits the node kind hosting it.
2. Every `props` object satisfies its schema.
3. Every `id` is unique within the document.
4. Every id in `views[].nodeIds`, `threads[].from|to` and `$ref` resolves.
5. Every section with nodes appears in `order`.
6. `at` and `size` are integers in canvas units (panel heights excepted, §1.3), and every `when` ref resolves or is absent. A **`page` node and its cells carry no `at` or `size` at all** — a page is not in canvas space; its cells declare a grid `span` and grow (§9.3 ⑧).
7. **Widgets and regions land on box corners** — `at` and `size` divisible by `grid.box` — and no two nodes overlap unless one is marked `full` (Design-System.md §8.3: *"every neighbour is at least one empty box away"*). Panels and blobs are placed freely: the Me column and the centre blob are both deliberately off-grid (§1.1).
8. Every panel has a current `measured` height with non-negative slack.
9. The illustration probes pass: nothing under a glyph (`probe10`), no two lines touching (`probe11`).

Rules 7–9 are the ones a human authoring TSX gets wrong and the probes were written to catch. Moving them into the schema is the actual argument for a document format — not that editing becomes visual, but that **a class of defect stops being possible**.

---

## 7. What this does not do

Stated so it is not re-litigated:

- **No arbitrary code.** A document cannot express a computation, a condition, or an event handler. Behaviour comes from components, which come from the repo.
- **No pixel placement** (§1.1).
- **No component composition by authors.** You cannot build a new component out of existing ones in the editor. That is a source change, reviewed, released, and *then* authorable. The registry is the boundary between design-system work and content work, and a canvas editor that blurs it becomes a worse code editor.
- **No page layout.** `kind: "page"` is reserved for the editor block's documents (Design-System.md §8) and is out of scope until that block exists.

---

## 8. Worked example — Me as a document

R5 makes Me the first migration, so Me is what this schema has to survive. Below is the whole of it, hand-authored against §1–§3, followed by everything that did not fit. **Seven things broke.** That is the value of doing this before any code exists: every one of them is a paragraph to change here rather than a rewrite later.

The source is `apps/portfolio/src/components/scene.tsx` — one blob and two panels.

```jsonc
{
  "schema": 1,
  "id": "portfolio/home",
  "kind": "canvas",
  "grid": { "box": 160, "pad": 8 },

  "nodes": [
    {
      "id": "me-blob", "kind": "blob",
      "at": [-36, -304],                          // top-left; the meaningful point is its CENTRE, (0, −280)
      "node": { "say": "What are we doing today?" },
      "component": "Blob",
      "props": { "variant": "glass", "label": "Bhargav" }
    },
    {
      "id": "me-intro", "kind": "panel",
      "at": [-280, 100], "size": [560, 120],
      "node": { "surface": "none" },
      "component": "Intro",
      "props": {
        "title": "Hi, I'm Bhargav.",
        "lead": { "$ref": "site.tagline" }
      }
    },
    {
      "id": "me-story", "kind": "panel",
      "at": [-280, 260], "size": [560, 425],
      "node": { "label": "About Bhargav" },
      "component": "Card",
      "slots": {
        "body": [
          {
            "component": "Figure", "when": { "$ref": "site.photo" },
            "props": { "src": { "$ref": "site.photo" } }
          },
          {
            "component": "Row", "props": { "gap": 8, "align": "center" },
            "slots": { "children": [
              { "component": "Chip", "props": { "label": "curious",  "hue": "peach" } },
              { "component": "Chip", "props": { "label": "creative", "hue": "lavender" } },
              { "component": "Chip", "props": { "label": "happy",    "hue": "yellow" } },
              { "component": "Text", "when": { "$ref": "site.location" },
                "props": { "size": "small", "tone": "muted", "markdown": { "$ref": "site.location" } } }
            ] }
          },
          {
            "component": "Text",
            "props": { "markdown":
              "I've spent the last few years inside other people's products: two WYSIWYG editors on tiptap, the core team of a design system, full-stack RAG and agent applications, and now the whole stack at Radise. The through-line is editors, design systems, agent systems, and shipping.\n\nNo Origins is my playground on the internet. Not a fixed list of features: blocks, added over time. This portfolio is the first. Every block shares one design system, so a new one looks native the day it ships.\n\nIf you're hiring, the work is on :pan[Work]{view=work}. If you have an idea, what I'm after and how to reach me are on :pan[Current Status]{view=status}. If you're a friend, the tools are on their way. Come back; this grows."
            }
          }
        ]
      }
    }
  ],

  "views": [ { "id": "me", "label": "Me", "nodeIds": ["me-intro"], "frame": "fit", "href": "/" } ],
  "order": ["me"]
}
```

### 8.1 What it broke

**① `at` in whole boxes is wrong, and Me disproves it three times out of three.** The blob sits at −0.225, −1.9 boxes; both panels at −1.75. Not one Me node is on a box corner, and none of them should be: the blob is centred on the origin crosshair and the panels are placed down a 560 column. Only the six ring widgets are box-quantised, because §8.3 quantised *them*.

> **Correction to §1.1 and §6 rule 6.** `at` and `size` are **canvas units**, integers. The box grid stays the editor's snap target — drag snaps to boxes by default, held modifier places freely — and §6 rule 7 enforces box alignment **for widgets and regions only**, which is where §8.3 actually requires it. What is lost is the claim that changing `--grid-box` rescales every document; that was speculative and the live canvas never had the property.

**② Node data is not component props, and I had conflated them.** `say`, `view`, `href`, `surface`, `scroll`, `label` belong to the *node* — they are read by `BlobNode` and `PanelNode`, and `Blob` has never heard of `say`. A single `props` bag would have handed `surface: "none"` to a component that does not take it.

> **Addition to §1.** A node has a `node` object for the data its `kind` defines, separate from `props` for the component it hosts. The two are validated against different schemas: `node` against the node kind, `props` against the registry entry.

**③ The blob's speech is runtime state, not document content.** `portfolioScene(says)` is a *function* because the guided chat changes what the host blob says. The document can only carry the opening line.

> `node.say` is a **default**, which the host may override at render. Recorded so nobody later tries to make the chat write to the database.

**④ Markdown cannot express the type scale.** The intro renders `noo-h2 noo-panel__title` and `noo-lead noo-panel__lead`. Markdown gives `##` → `<h2>` and a paragraph → body text; the *lead* role has no syntax, and it is a real step on the scale (§5), not a shade of emphasis.

> Resolved by a component, not by syntax: **`Intro { title, lead }`** — which `scene.tsx` already has as the `intro()` helper, unnamed. Registering it costs nothing and takes the typographic decision out of the document, where it never belonged. Running prose stays `Text`; headed panels use `Intro`.

**⑤ `Card`'s body has to hold blocks, not just markdown.** §3.2 gave `Card` a `body` slot of markdown. Me's card holds a chip row *and* three paragraphs, so markdown alone cannot express it — and the chip row in the TSX is `<div className="noo-panel__extra flex …">`, app-level Tailwind with no component behind it.

> **Change to §3.2:** `Card.body` is a slot of **blocks**, not markdown — the whole slot-capable palette. The container this wanted was drafted as `ChipRow`; §2.3 later generalised it to **`Row`**, which absorbs the résumé row too. Either way the finding stands: the app holds it as `<div className="noo-panel__extra flex …">`, and utilities in an app file cannot be authored.

**⑥ "A slot renders only when filled" is a conditional, and §7 says documents have none.** `site.photo` and `site.location` are both `{value ? <x/> : null}` in the TSX — and that pattern is a *promise* of this platform (Design-System.md §13: every unfilled slot renders nothing, so the pages ship either way). Deleting it to satisfy the schema would delete a design rule.

> **Addition to §1:** a node may carry **`when: {"$ref": "…"}`** — render this node only if the ref resolves to something non-empty. It is a presence test, not an expression: no operators, no comparison, no boolean algebra, one ref. That is the single conditional the platform actually needs, and §7's ban stands for everything else.

**⑦ A ref has to be usable as a prop value, not only as a whole prop.** `lead: {"$ref": "site.tagline"}` works because the lead *is* the tagline. But the location line wanted "Based in {location}" — a ref inside a sentence.

> Left unresolved on purpose, and narrowed: for Me, `trailing` takes the ref and the component supplies the words ("Based in …"), which is where that copy already lives. Inline interpolation inside markdown (`{{site.location}}`) is **deferred** until a second case demands it — one occurrence is not a feature.

### 8.2 What it confirmed

Worth stating, because four things came through untouched: the **directive syntax carried both pan-links** with no ceremony (⑦ aside, R4 holds); **measured heights** slotted in as plain numbers; `views` and `order` needed nothing; and the whole document is 40 lines of JSON against 50 lines of TSX, which is the first evidence that authoring this is not obviously worse than writing it.

### 8.3 What Me still does not prove

Me has **no widget** — it is always full at the centre and its picture is the blob. So this example exercises panels, prose, the pan-link, slots, refs and the blob node, and exercises **nothing** of `Bento`, `BentoCell`, the illustration value or the ring. §9 runs the same exercise against Work, which has all of them.

---

## 9. Worked example — Work, and the half Me could not reach

§8.3 said the exercise had to be run against a section with a widget before the editor was built. This is it. Work is the only other fully written section, it has all five node shapes Me lacked, and **it broke two things Me could not have shown** — one of them structural.

Source: the `work` block of `scene.tsx`, `content/work.ts`, and the `work` entry of `content/sections.tsx`. One widget, one intro, four role cards, one résumé row.

### 9.1 The widget

```jsonc
{
  "id": "work-widget", "kind": "widget",
  "at": [640, -960], "size": [640, 480],        // on box corners — §6 rule 7 applies here
  "section": "work",
  "node": { "view": "work", "label": "Work experience" },
  "component": "Bento",
  "props": { "hue": "peach", "cols": 4, "rows": 3, "label": "Work experience" },
  "slots": { "cells": [
    { "component": "BentoCell",
      "props": { "span": [2, 2], "tone": "fill", "illustration": "work" },
      "slots": { "content": [
        { "component": "Label",  "props": { "text": "work" } },
        { "component": "Figure", "props": { "value": "4", "label": "roles", "size": "lg" } }
      ] } },
    { "component": "CellHead", "props": { "label": "now",       "title": "Radise",              "dot": "peach" } },
    { "component": "CellHead", "props": { "label": "before",    "title": "Dataflix",            "dot": "green" } },
    { "component": "CellHead", "props": { "label": "one year",  "title": "Hashnode",            "dot": "blue"  } },
    { "component": "CellHead", "props": { "label": "two years", "title": "Terrible Tiny Tales", "dot": "pink"  } },
    { "component": "BentoCell", "props": { "span": [4, 1] },
      "slots": { "content": [
        { "component": "CellHead", "props": { "label": "the through-line" } },
        { "component": "Row", "slots": { "children": [
          { "component": "Chip", "props": { "label": "editors",        "hue": "lavender" } },
          { "component": "Chip", "props": { "label": "design systems", "hue": "peach" } },
          { "component": "Chip", "props": { "label": "agent systems",  "hue": "blue" } },
          { "component": "Chip", "props": { "label": "full-stack",     "hue": "green" } }
        ] } }
      ] } }
  ] }
}
```

### 9.2 The full view

*Revised 2026-09-11, after the exercise: Bhargav moved full views off the canvas and onto a page (Design-System.md §8.4). The version below is the current one; what the first draft found is kept in ⑧, because the finding is what produced the change.*

```jsonc
{
  "id": "work-full", "kind": "page", "section": "work",
  "component": "Bento",
  "props": { "hue": "peach", "cols": 10, "page": true, "label": "Work experience" },
  "slots": { "cells": [

    { "component": "BentoCell", "props": { "span": [10, 1], "tone": "bare" },
      "slots": { "content": [
        { "component": "Intro", "props": {
            "title": "Four roles, told as blocks",
            "lead": "Editors, design systems, agent systems, and shipping full-stack." } }
      ] } },

    { "component": "BentoCell", "props": { "span": [5, 2] },
      "slots": { "content": [{ "component": "BlockCard", "props": { "$ref": "work.roles.0" } }] } },
    { "component": "BentoCell", "props": { "span": [5, 2] },
      "slots": { "content": [{ "component": "BlockCard", "props": { "$ref": "work.roles.1" } }] } },
    { "component": "BentoCell", "props": { "span": [5, 2] },
      "slots": { "content": [{ "component": "BlockCard", "props": { "$ref": "work.roles.2" } }] } },
    { "component": "BentoCell", "props": { "span": [5, 1] },
      "slots": { "content": [{ "component": "BlockCard", "props": { "$ref": "work.roles.3" } }] } },

    { "component": "BentoCell", "props": { "span": [4, 1], "tone": "fill", "illustration": "work" },
      "slots": { "content": [
        { "component": "Label", "props": { "text": "the through-line" } },
        { "component": "Row", "slots": { "children": [
          { "component": "Chip", "props": { "label": "editors",        "hue": "lavender" } },
          { "component": "Chip", "props": { "label": "design systems", "hue": "peach" } },
          { "component": "Chip", "props": { "label": "agent systems",  "hue": "blue" } },
          { "component": "Chip", "props": { "label": "full-stack",     "hue": "green" } }
        ] } }
      ] } },

    { "component": "BentoCell", "props": { "span": [6, 1] },
      "slots": { "content": [
        { "component": "Label", "props": { "text": "the résumé" } },
        { "component": "Row", "slots": { "children": [
          { "component": "Button", "when": { "$ref": "site.resumeHref" },
            "props": { "label": "Download the résumé", "href": { "$ref": "site.resumeHref" } } },
          { "component": "Text", "props": { "size": "small", "tone": "muted", "markdown": "Chosen pieces of this work are on Case Studies." } }
        ] } }
      ] } }
  ] }
}
```

**No `at`. No `size`. No measured heights.** A page cell declares a span and grows; that is the whole difference, and it is why ⑧ below stopped being a problem to solve and became a thing to delete.

### 9.3 What it broke

**⑧ A full view is a layout, not a set of placements — and this is the structural one.** §1.1 says every node carries an absolute `at`. Work's five full-view panels do not have authored positions at all: `section()` *computes* them, flowing each panel into whichever column is currently shorter and accumulating `y` by the measured height plus 40. Freeze that into absolute coordinates and the first edit that changes a card's height silently misaligns everything below it in that column.

> **Superseded 2026-09-11 — and this finding is why.** The fix drafted here was `kind: "group"`, a container carrying a `columns` layout that reproduced `section()`'s balanced flow. Shown the problem, Bhargav's answer was better than the fix: if a full view needs a layout rather than placements, it should not be on the canvas at all — make it **a page on the bento grid** (Design-System.md §8.4). A grid you place cells in needs no flow algorithm, no measured heights and no container node. `kind: "group"` is withdrawn; `kind: "page"` replaces it, and it is just a `Bento` with `page: true`.
>
> *The original proposal, for the record:* **`kind: "group"`.** A group carries `at`, a `layout`, and `children` whose positions are **computed, not stored**. `layout.type: "columns"` is the only one, and it is exactly what `section()` already does — `count`, `width`, `gutter`, `gap`, a `span: "full"` escape for the intro. Reading order stays array order, so §1.2 and §12's tab-order guarantee are untouched; the flow only assigns columns.
>
> This is the finding that justifies having done the exercise twice. Me's two panels stack, so absolute placement looked sufficient; Work's five reveal that the portfolio's real layout primitive is a balanced two-column flow, and that it has been a layout algorithm all along.

**⑨ The app has accreted unnamed micro-components in Tailwind utilities, and every one blocks authoring.** A widget cell is not prose — it is a miniature type scale. `<p className="noo-label">now</p>` over `<p className="noo-bento__title"><Dot hue="peach"/> Radise</p>` is a mono label, a title role, and a hue dot, and `Dot` is *defined inside `content/sections.tsx`*. The résumé row has another: `<p className="noo-body-sm text-ink-2">`.

> The ★ list grew to **seven** here — `Prose`, `Intro`, `ChipRow`, `RegionLabel`, `CellHead`, `Dot`, `Note` — and then to **ten** when §2.3 turned it from a derivation into a library: `Prose` and `Note` merged into `Text`, `ChipRow` generalised to `Row`, and `Heading`, `Label`, `Stack` and `Divider` were added because nothing in the system arranged two things inside a panel.
>
> The pattern is the point: **markdown cannot express a type scale, so every place the app reached for a utility class instead of a component is a place a document cannot reach.** Pricing the migration means counting these, not the panels. Seven is the count for two sections; expect more from the remaining five.

**⑩ No list rendering, decided.** The four cards are `roles.map(...)` in code. A document will *not* get a `repeat` or a `List` over a ref array: each role's height is a separate measurement (`ROLE_H` is `[375, 345, 300, 215]`), and a loop has one body and cannot carry four measured heights. So four roles are four nodes, each with a whole-props ref.

> **Extension to §3.4:** `props` may itself be a ref — `{"$ref": "work.roles.0"}` resolving to a whole props object, not just one field — validated against the entry's schema exactly as an inline object is. Adding a fifth job means adding a node, which for a portfolio with four jobs is correct; this is not a CMS feed.

**⑪ `className="h-full"` has to stop being a prop.** `<BlockCard {...role} className="h-full" />` — and §2.2 forbids authoring `className`. The card fills its panel because the app says so.

> Fix in CSS, not in the schema: `.noo-panel > :only-child { height: 100% }`. A one-line package change the migration forces, and one fewer escape hatch.

**⑫ `node.label` and `props.label` are different labels with the same name.** The node's is the canvas aria-label ("Work experience. Open."); `Bento`'s names the grid group for assistive tech. Both say "Work experience".

> Minor, but resolve it in the adapter rather than in documents: the node label defaults to the component's when absent. Two fields that must agree are two fields that will not.

### 9.4 What it confirmed

**§3.6 held exactly as designed.** Work's illustration is fourteen parameters including `words: [[16,15,42,28],[16,105,69,224]]` — measured off the rendered cell — and the document names `"work"` and carries none of them. Had the schema exposed the parameters, the inspector would have had fourteen sliders and the measurements would have been guessed within a week.

`when` (⑥) carried the conditional résumé button unchanged. Whole-props refs kept `work.ts` as the single source for the four roles. And the widget's box alignment is the one place §6 rule 7 actually bites, which is what §1.1 predicted after Me.

### 9.5 Where the schema stands

Two sections hand-authored, twelve findings, and the shape has stopped moving in the places Me tested and started moving in the places it could not reach. The five sections still unwritten (Design-System.md §13) are `Placeholder` panels today, so they exercise nothing new — **the schema is ready for step 2, and the next thing that can invalidate it is the editor, not another document.**

---

## 10. Built — the read path, 2026-09-14

Admin.md §13 step 6, done as Admin.md §6.5's step 2: the schema as Zod, the registry's prop schemas as validators, refs, markdown with the two directives, and the adapter — in `packages/ui/src/document/`, exported at **`@no-origins/ui/document`**. The portfolio's map is written as a document in `apps/portfolio/src/content/document.ts` and rendered at **`/fixtures/document`** (in the sweep); `e2e/document.spec.ts` compares that render with the hand-written one pixel for pixel, and the numbers below are what it measured. Nothing in `@no-origins/ui/canvas` changed, as §0 promised.

### 10.1 What building it amended

Eight things the text above did not say, each decided by the code and recorded here so the text is true again.

| | Amendment | Why |
|---|---|---|
| ① | `RegistryEntry` gains **`childrenFrom`** — the authored prop that renders as the component's `children` (`Heading.text`, `Label.text`, `Chip.label`, `Button.label`, `Text.markdown`, `Quote.markdown`, `Toast.text`, `RegionLabel.text`) | §2.2 re-types a `ReactNode` prop as `text`; something has to say which React prop it was. On the entry, not in a table inside the adapter — two lists drift |
| ② | `RegistryEntry` gains **`adapt(props, parent)`** — authored shape → React shape. `BentoCell.span` is authored as `{ cols, rows }` (an `object` the inspector renders as a labelled group) and taken as `[cols, rows]`; a cell inherits its bento's `hue` for its pattern; `Pattern.name` naming a document pattern becomes `family` | The alternative was a bespoke branch per component in the adapter, which is the drift §3.1 forbids. §9's examples write `"span": [2, 2]` — read them as `{ "cols": 2, "rows": 2 }` |
| ③ | The adapter lives at **`/document`**, not `/canvas` | It carries the whole registry and zod. The live portfolio renders a hand-written scene from `/canvas` and needs neither |
| ④ | **`BentoCell` (the component) gains `pattern` and `hue`** | The registry declared `pattern` on the cell before the component had it — §2.2 read the other way: the authorable surface is a subset of the React one, so the component grew. What `SectionWidget` did by hand, the cell does itself |
| ⑤ | `component` is **absent on `region` and `menu`**; `menu` carries `node: { label, items: [{ label, view \| href }] }` (Admin.md §6.5) | `RegionNode` and `MenuNode` draw themselves. `region` may still name `RegionLabel` for its text; it is deprecated |
| ⑥ | **`page` nodes come back as `pages`**, rendered, not in `scene` | §9.2 took them off the canvas; `SceneNode` has no place for them. Nothing mounts a page yet — that is the full-view work, with the editor |
| ⑦ | Nodes **with no section are emitted first**, in array order; then each section in `order`, in array order | §1.2 said what happens within a section and not what happens to the menu and the blob |
| ⑧ | **Numeric enums are numbers on the way out** (`of: ["2","3","4"]` → `level: 2`); **registry `default`s are not applied on read** (they are what a dropped instance starts with); a panel with **no height and no `measured`** renders at one box with a warning; **markdown** is paragraphs, bullet lists, `**`, `*`, `` ` ``, `[text](href)` and the two directives, and block prose in a `Text` renders it as a `div.noo-text--blocks` | Each is the smallest rule that made the fixture render. An unknown directive is its text, as §3.5 promised |

### 10.2 The proof, and its numbers

Playwright's comparator, the hand-written render written as the baseline on every run, the blob masked. Ratios are pixels different over all pixels.

| Compared | Ratio | What the pixels are |
|---|---|---|
| **The map at home** — `/` against `/fixtures/document`, 1440 × 900 | **1 %** | The minimap: the hand-written scene keeps nineteen full-view panels in the DOM and the minimap draws them; the document has none. Then the widget differences below, at map size |
| **Widgets at 1:1** — `/fixtures/bento` against the document's, element for element | status **3 %** · work **3 %** · cases **3 %** · projects **2 %** · interests **9 %** · philosophy **9 %** | Listed in §10.3. The loud cells — label, figure, pattern in the section's hue — are identical in all six |
| Section routes (`/work` …) | not compared | `/work` opens the hand-written **full view**; a document has no full views (§9.2, Design-System.md §8.4). A viewport comparison there compares two different things |

The Me column matched at map size: `Intro` for the hand-written `h2` + lead, a `Stack` of `Row` + `Text` for the story panel, the two `:pan` directives resolving to the views' hrefs. Adapter issues on the document: **none** — every node named a registered component, every prop passed, every ref resolved, every widget landed on a box corner.

### 10.3 What the proof found

Every difference is one of these. None is a bug in the adapter; each is a place the registry cannot yet say what `content/sections.tsx` says by hand — §9.3 ⑨'s finding, continued. **They want decisions, not fixes**, and they are the next option boards.

1. **`CellHead` groups the label and the title; a hand-written cell spreads them.** A bento cell is a column that pushes its children apart, so the mono label sits top-left and the title bottom-left — the diagonal (Design-System.md §8.3). `CellHead` wraps both in one block at the top, and puts the dot beside a wrapped title rather than inline in its first line ("Terrible Tiny Tales"). Every widget's 3 % is mostly this.
2. **Nothing renders the widget text scale.** `.noo-bento__text` (`--t-widget-text`, the size a widget is read at from twice the distance) has no component; `Text size="small"` is the document scale and is visibly smaller. Status, cases, projects and the two glass cells all show it.
3. **Nothing renders the loud cell's word.** Interests and philosophy set `outside the work` and `how I build` in `.noo-bento__word` — the display face at `--t-widget-word`, two lines. `Figure` caps `value` at 4 characters (rightly, for a number); `Heading` level 2 is the nearest thing and is smaller. Most of the 9 %.
4. **The sample-copy tag has nowhere to live.** §3.4 says it is a field on the content record; the schema carries nothing that renders it, so the document version of interests and philosophy is silently not marked as sample copy. Until it is, a document must not carry sampled copy.
5. **A list in a widget.** The interests cell is four lines with no markers; markdown's list renders bullets in the document scale. Whether a widget list is a `Text` with a list, a `Stack` of `Text`, or a component of its own is open.
6. **Story panel spacing.** `scene.tsx` uses a 20px utility gap; `Stack` offers 8 · 16 · 24. 16 was used. The hand-written value was off the scale.
7. **The document was right once.** Sample copy has `*is*` in it; the hand-written cell prints the asterisks, the document renders emphasis.
8. **Interpolation (§8.1 ⑦) held its line.** "Based in …", the first four interests as a list, the first philosophy paragraph are three derived keys the host composes into the content it hands the adapter. One more case and it is a feature.

**What the document cannot express at all:** the hand-written full views — `full: true` panels flowed into two columns by `section()`. §9.2 made them pages and the adapter returns pages, but nothing mounts one. The five section routes still render the hand-written scene, and will until the editor's full-view work lands.

### 10.4 Built to the picks — 2026-09-14

§10.3's five findings were put on the canvas as option boards and decided; Admin.md §6.5c has the picks. Built here, in the package and the registry, and the thresholds re-measured against what they then achieved.

| | What changed |
|---|---|
| **F1** | `CellHead` fills its cell and spreads — `flex: 1` + `space-between`, so the mono label sits at the top and the title at the bottom without the author typing the diagonal. A page bento's rows grow, so it collapses back there. **The dot is gone**: `dot` stays as a deprecated prop for one minor and renders nothing. In its place a **`media` slot** — one `Image`, `Blob` or `Pattern` at 24 square, inline in the title's first line. The registry entry drops `dot` and declares the slot; the adapter already maps a `max: 1` non-children slot to a prop of that name |
| **F2** | `Text` gains **`size="widget"`** — `.noo-widget-text`, `--t-widget-text` 20/1.35, the size a bento cell is read at. The fourth step; the enum grows to four |
| **F3** | `BentoFigure` (registered as `Figure`) gains **`kind="figure" \| "word"`**. A word is the display face at `--t-widget-word` over two lines, no tabular nums, same corner. The schema has one cap, so `value` is capped at 24 with the help text saying a figure is at most 4 characters and a word up to 24 |
| **F4** | `DocumentContext` gains **`sampled?: (path: string) => boolean`**. `resolveDeep` now collects the refs that resolved as well as those that did not; a node whose props read a sampled path renders the *sample copy* tag as its first child and pushes a `warn` — `props read sampled copy: site.interestsMarkdown`. The portfolio maps a ref path to a slot key by taking the second segment and stripping the derived suffixes (`Markdown`, `First`, `Line`). Three warns on the portfolio document now: location, interests, philosophy |
| **F5** | A `Text` list inside a bento cell renders **without markers** — one rule on `.noo-bento__cell .noo-text--blocks ul`. The rhythm stays; F2 gives it the size |

The portfolio's document was re-poured to match: no dots on its heads, `size: "widget"` on every widget cell's text, and the two loud words as `Figure` `kind: "word"` rather than a `Heading`.

**The numbers now** (`DOC_DIFF=0 pnpm review -g "like scene|like sections"`, light and dark, against §10.2's):

| Compared | Was | Is |
|---|---|---|
| The map at home | 1 % | **< 1 %** (3258 px of 1 296 000) |
| Current status | 3 % | **0** — identical, pixel for pixel |
| Work experience | 3 % | **< 1 %** (2829 px) |
| Case studies | 3 % | **< 1 %** (2203 px) |
| Projects | 2 % | **0** — identical, pixel for pixel |
| Interests | 9 % | **3 %** (9761 px) |
| Philosophy | 9 % | **5 %** (15 390 px) |

**What the residue is**, and why it is not an adapter bug. Work keeps a dot's worth of pixels because `content/sections.tsx` still draws them and is not re-poured until the editor's full-view work lands. Interests and Philosophy carry the rest twice over: the word wraps where the hand-written one has an explicit `<br>` (`outside the work`, `how I build`), and the *sample copy* tag sits **inline** inside a one-paragraph `Text` — it is the component's first child, and a `<p>`'s first child is on the first line — where the hand-written cell puts the tag on its own line above. The interests cell, whose markdown is a list and so renders as a `div`, puts it on its own line and matches. That is the next small decision: whether the tag is the component's child or the cell's sibling.

**Removing a prop, in practice (§5).** F1 removed `dot` from `CellHead` and the first document the editor opened still carried it — four cells rendered as errors. So a `PropSpec` gains **`deprecated: string`** (the note says what replaced it): the adapter accepts the prop, drops it before the component sees it and pushes a warning naming the replacement; the inspector never offers it. `CellHead.dot` is the first. A deprecated prop leaves the registry at the next minor, and a document that still names it then fails validation as any unknown prop does — which is the migration §5 asked for, with a minor's grace.
