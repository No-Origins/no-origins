# No Origins — Admin

*The control surface for the platform: `admin.no-origins.com`. Opened 2026-09-11.*

Companion documents: **Brand.md** (what No Origins is), **Design-System.md** (the system this configures), **Patterns.md** and **Character.md** (two of its libraries), **Scene-Schema.md** (the document format the editor writes and every project reads). This document decides the admin; Scene-Schema.md decides the contract.

---

## 0. What this is, and what it is not

The admin is **one app that owns the three layers** — Projects, Systems, Products — and nothing else. It is the only place where a project's canvas is authored, where the design system is configured, and where a product is installed into a system.

It is **not**:

- a CMS with a page tree — the platform has no pages (Design-System.md §8), it has canvases;
- a second design system — it is built out of `@no-origins/ui`, and where the package is missing a component the admin's need is the reason to build it (§10);
- a place where code is written — it edits **documents**, never source. A document can only name components the registry already exports (Scene-Schema.md §2), which is both the editing model and the whole of the security model.

**Scope change, recorded.** Design-System.md §11.4 reads "`no-origins.com` and every other subdomain are out of scope". `admin.no-origins.com` is a third domain and a third Vercel project. §11.4 needs an edit when this doc is adopted — three domains, and the admin is one.

---

## 0.5 Reset — Quests, 2026-09-17

**Bhargav, 2026-09-17: "Remove all the previous and unwanted tables. Let's start fresh. Quest should be a new feature."** Everything below §0.5 was written for the three-layer model (Projects · Systems · Products) and the document/editor/publishing machinery that drove the React-Flow editor. That editor was deleted with React Flow (Atomic.md D11); the schema it needed has outlived it. So the admin's data model is reset, and this section is the live specification — **§1, §4, §6, §7, §8.1, §9 and §13 are superseded for the build and kept only as the record of what was learned.**

### What a quest is

A **quest** is a surface we deploy as its own subdomain — the successor to what §1 called a Layer-1 *Project*, renamed and made the admin's one first-class thing. The portfolio is the first quest. A quest is composed on **the grid** (the base layout, repo-root CLAUDE.md): you pull components onto it, arrange them, and save. Subdomains, deployment and the components you drag are **deferred** — this pass builds the quest itself.

### The fresh schema

Two tables survive the reset because they are the login we just built, and the login is wanted:

- **`profiles`** and **`allowlist`** — identity, the `before_user_created` allowlist gate, and their RLS. Untouched. §8.3 and §8.4 still stand.

Everything else — `projects`, `documents`, `document_versions`, `systems`, `products`, `product_installs`, `assets`, `audit_log` — is **dropped**. It served the document/editor/publishing design that no longer exists.

In their place, one table:

```sql
quests (
  id         uuid pk,
  slug       text unique,            -- the subdomain-to-be, and the route
  name       text,
  subdomain  text,                   -- reserved; deployment is deferred
  hue        text,                   -- a Brand.md hue
  status     enum(draft, live, archived) default draft,
  layout     jsonb,                  -- the GridLayout (grid-layout.ts): pages of coordinate-placed items
  rev        integer default 0,      -- bumped by the DB on a layout change; the editor's conflict check
  created_at, updated_at
)
```

`layout` is a `GridLayout` — the same pure model the grid renders and the editor mutates (`packages/ui/src/lib/grid-layout.ts`), so what the dashboard saves is exactly what a quest would ship. `rev` is maintained by a trigger and carries the optimistic-concurrency check the old `documents.rev` carried; there is no immutable-versions table yet — publishing (old §7/§9) is deferred with everything else. RLS mirrors the surviving pattern: deny-by-default, `owner`/`editor` write, `viewer` read, keyed on `profiles.role`.

### The admin is the grid

The admin home stops being a rail (**this supersedes §4's "rail, not tabs"**) and becomes **the grid itself** — a field of feature cards: **Quests**, and later Design, Products, Settings, with the account/passkey/password controls collapsing into Settings. The admin renders in the same base layout every quest is composed in; the control surface eats its own dog food.

- **Home (`/`)** — the grid of feature cards. The **Quests** card opens the quests dashboard.
- **`/quests`** — the quests dashboard: the **first grid row is the feature's action bar** (its title, the quest count, a *Create quest* button, and the home for future quest actions/settings); the **quest cards pack beneath it from the second row, 3 × 2 each**. Create names a quest and derives its slug; a quest can be deleted (owner). A quest card opens its compose dashboard.
- **`/quests/[slug]`** — the compose dashboard: the real `GridEditor` (`@no-origins/ui`) bound to the quest's `layout`, saving back on the `rev` check with a save-state indicator (unsaved · saving · saved · saved-elsewhere). A **stub palette** of placeholder molecules (Heading, Text, Image, Blob, Pattern, Card) — each a name and a default box size. Placing one **adds a labelled box to the grid** (click; it lands at the first free cell of its size), which then moves, resizes, paginates and deletes like any other box through the grid's own gestures. The tiles are placeholders and the interaction is click-to-place; the real component molecules and pointer-drag placement come together, later.

### Scope of this pass

CRUD on quests, the grid-of-cards home, and a working compose dashboard with a stub palette. **Deferred, by Bhargav:** subdomains, deployment, the real component molecules, and pointer-drag placement (which lands with the molecules). The rule of the house holds — every visible element is composed from `@no-origins/ui` (repo-root CLAUDE.md); the palette tiles and the cards are system components, not hand-rolled ones.

---

## 0.6 Publishing a quest — subdomains, 2026-09-18

**Bhargav, 2026-09-18: "once I create a quest, map it to a domain, it should deploy on the portfolio. Basically, I should be able to deploy a quest on a subdomain if I want to."** This section decides how. It is the piece §0.5 deferred, and it stands on §0.5's schema and the grid (Grid.md). §7 and §9 below described publishing for the deleted editor and stay superseded; this is the live design.

### The rule, sharpened

The root CLAUDE.md has said since the start that the live site renders static output and never queries a database. That rule was written when a quest could only be structure. Asked the same day what happens when a quest contains a component that needs live data — a status feed, a form, a counter — the rule became:

> **The page is static. A component may be live.**

Two kinds of data, treated differently:

- **Structure** — which boxes, where, what size, on which page. Authored in the admin; changes only when Bhargav changes it. **Baked at Publish**, served from the edge, never queried at visit.
- **Live content** — what a box shows when that content has a life of its own. Baking it would be stale the moment the build finished. **A component that needs it declares `live` and fetches for itself once it is on screen.** The page does not know or care.

What that keeps: the site never goes down with Supabase (the page loads; the one live box shows its fallback); first paint is static; a quest with no live components costs exactly what it does today. What it costs, and each is a decision made when the first live component is designed, not now:

1. The portfolio gets the **anon key** — the one designed to be public; the admin's browser already holds it. What the public can read is decided by row-level security, not by hiding the key.
2. **RLS opens a door per table.** Everything is deny-by-default and signed-in-only today. A live component means a public-read policy on the specific table it reads — or a dedicated table for public data — so `quests` itself is never exposed. §8.3's prohibition on a blanket anon read policy stands.
3. **Every live component has a fallback state** — skeleton, dash, last-known value. It is part of the component's design, not an afterthought; a live box that shows nothing when the fetch fails is a broken box.

Writes (a form, a guestbook) go the same way, through an insert policy or a small route handler, decided per component.

### What Publish does

A quest is `draft` until published. Publish:

1. **Validates** — the quest has a `subdomain` (see below), and the layout resolves on every breakpoint without out-of-bounds boxes.
2. **Snapshots** — copies `layout` into `published` (jsonb), records `published_rev = rev` and `published_at`, sets `status = live`. Drafts keep changing afterwards without leaking; the site shows the snapshot until the next Publish.
3. **Writes the artefact** — `publish/quests/<subdomain>.json` (the snapshot plus `name`, `hue`, `published_at`) and `publish/quests/index.json` (every live quest) into the **`publish` storage bucket**, which already exists with public read and staff write for exactly this (§8.2 — "the published doc JSON at a stable path"). The portfolio reads these over plain HTTPS. **No database key of any kind exists in the portfolio for structure.**
4. **Pokes the deploy hook** — a Vercel deploy hook URL for the portfolio project, held as an admin server env var (`PORTFOLIO_DEPLOY_HOOK`). The portfolio rebuilds; a minute or two later the quest is live.

**Unpublish** sets `status = draft`, removes the artefact, rewrites the index, pokes the hook. The subdomain then serves the portfolio's not-found page. `archived` is unpublish plus "not listed for republishing."

Schema this adds to `quests` (one migration, with the build): `published jsonb`, `published_rev integer`, `published_at timestamptz`; `subdomain` becomes `unique`, checked against `^[a-z0-9]+(-[a-z0-9]+)*$`, and `not null` is enforced by Publish rather than the column so a draft may exist without one. **Reserved subdomains**, refused by Publish: `admin`, `design`, `www`, `api`, `publish`, and the apex.

### What the portfolio becomes

**§0.5 already says the portfolio is the first quest.** Taken literally: `apps/portfolio` stops being a site with hand-written pages and becomes **the quest host** — one renderer, many subdomains — and `bhargav.no-origins.com` is the quest whose subdomain is `bhargav`. The 32 files still importing the deleted 1.0 system are replaced, not rebuilt, and the repo's "what does not build" closes with them.

- **Wildcard domain.** `*.no-origins.com` is added to the portfolio's Vercel project, with a wildcard `CNAME` at the DNS provider. Both are Bhargav's to do in his accounts; the two exact steps are given at build time.
- **Host → quest.** Middleware reads the `Host` header, takes the first label, and rewrites to `/q/<subdomain>`. Unknown labels fall through to not-found. The apex and `www` render the index of live quests, or redirect to `bhargav` — **open**, his call.
- **Build-time fetch.** `generateStaticParams` reads `index.json` from the `publish` bucket; each `/q/[subdomain]` page reads its snapshot. Static output. `output: "export"` is not required and not used — the middleware needs a Node runtime — but every quest page is statically generated.
- **The renderer.** `GridPages` from `@no-origins/ui` with the quest's `published` layout and `renderItem` dispatching on the item's component kind. Today every kind is a stub, so every box renders as the labelled placeholder the composer shows. **That is what a deployed quest looks like on day one, and it is deliberate**: the pipeline does not care what a box renders, it proves the whole path, and the molecules land on something live when they come.
- **Live components** fetch with the anon key from `NEXT_PUBLIC_SUPABASE_*` on the portfolio; nothing else on the portfolio touches Supabase.

### Order of the build

1. Migration: the three `published*` columns, `subdomain` unique + check.
2. Admin: the subdomain field on the quest, Publish / Unpublish on the compose dashboard with the validation above, the artefact writer, the hook poke. Save state gains *published · unpublished changes*.
3. Portfolio: delete the 1.0 pages; middleware; `/q/[subdomain]`; the renderer on `GridPages`; build-time fetch from the bucket; not-found.
4. Vercel and DNS: the wildcard, the deploy hook — his two steps, then one end-to-end publish of `bhargav`.
5. Only then: molecules, one at a time, each with its default box size (Grid.md §6) and, if live, its table policy and fallback.

### Open

- Apex and `www` behaviour (index of quests, or redirect to `bhargav`).
- Draft previews — a tokenised preview URL that renders the *draft* layout without publishing. Wanted eventually; not in this pass.
- Versions — Publish keeps one snapshot. Keeping history (old §7's immutable versions) is deferred until there is a reason to roll back.
- Per-quest hue and metadata on the rendered page (title, description, favicon) — decided with the first molecules.

---

## 1. The three layers

Bhargav's model, 2026-09-11. Sharpened here into definitions, a test, and a dependency rule.

| Layer | Definition | The thing it produces |
|---|---|---|
| **Projects** | A surface a visitor lands on. A canvas, authored out of components, published at a version. | A published **document** at a URL |
| **Systems** | The mechanism every project shares and no project may fork — the communication and control layer. | A **contract**: tokens, components, a schema, a registry, a pipeline |
| **Products** | A plugin into a system. Registers through that system's contract, adds a capability, removable. | A **manifest** and an install |

**The test** — three questions, in order, first yes wins:

1. Does a visitor **land** on it? → **Project.**
2. Does every project **share** it, such that forking it would be a bug? → **System.**
3. Does it **register into** a system through a declared contract, and can it be uninstalled without that system breaking? → **Product.**

**The dependency rule.** `Projects → Systems ← Products`. Arrows point at Systems and never away from them.

- A project never imports a product directly; it asks the hosting system for one **by name**. The portfolio already works this way: it renders `<Illustration name="…" />`, it does not import the rosette.
- A product never knows which project uses it.
- A system never knows which products exist until they register.

This is the rule that makes the admin possible at all. If a project could reach a product directly, "install" would mean "edit code", and the dashboard would have nothing to switch.

### 1.1 The inventory today

| Layer | Exists now | Planned |
|---|---|---|
| **Projects** | `portfolio` → `bhargav.no-origins.com` (step 12 of Design-System.md §14; on the canvas, not yet DB-backed) | `design` → `design.no-origins.com` (§14 step 14) |
| **Systems** | Design system (`@no-origins/ui`) · Canvas runtime (`@no-origins/ui/canvas`) · Theme (`theme.ts`, four axes, §10) · Illustration generator (Patterns.md §6) · Review loop (Playwright, CLAUDE.md) | **Document** (Scene-Schema.md) · **Publishing** (§9) · **Identity & storage** (Supabase, §8) · Chat/agent (§14 step 15) |
| **Products** | Six illustration families, registered into the illustration system by name · the avatar (Character.md), registering into the blob system | Component packs · the browser-side model · an OG-image renderer · a contact handler |

The admin itself is a **System** by its own test — nobody lands on it as a visitor, every project shares it. It is the *face* of the Systems layer, which is why it is not listed as a project.

---

## 2. Where the admin lives

| | |
|---|---|
| Domain | `admin.no-origins.com` |
| App | `apps/admin` — Next.js 16, same workspace, `@no-origins/ui` at `workspace:*` |
| Vercel | Its own project, same repo, root `apps/admin` |
| Block accent | `data-block="admin"` — a new row in `tokens.css` §2.3. Proposed hue: **lavender**, because peach is Work and the admin should not read as part of the portfolio |
| Auth | Supabase Auth, magic link, allowlist of one (§8.4). No public route exists |
| Review | `pnpm review` gains the admin routes; the loop in CLAUDE.md applies unchanged |

---

## 3. The admin is page mode, and the editor inside it is canvas mode

> **Superseded 2026-09-16.** There is no editor and no canvas mode: React Flow and everything downstream of it were removed from the system (Atomic.md D11), and *"a different approach"* comes later. What is still true is the first half — the admin is a **tool**, and it wears the `Tool` template with a `Menu` beside it (D6, D13). The rest of this section is the record of the decision, not a description of the app.

Design-System.md §8 says the canvas is the base layout of No Origins, and that page mode is "what documents wear". An admin is neither: it is a **tool**, and a tool wants persistent chrome — a rail that does not pan away, a header that stays, an inspector pinned to an edge.

**Decided: a page-mode shell around a canvas-mode editor.**

- The shell is `Page` + a left rail + a header — the page-mode components that Design-System.md §9 already specifies and the portfolio retired. They were kept "because the editor block's articles are documents"; this is the first thing to actually wear them again.
- The editor *viewport* is a real `CanvasShell` with the real `Ground` at `--grid-box` 160, the real node types, the real components. **What you edit is what ships**, because it is the same renderer.

The honest cost: two layout modes in one app, and the editor canvas has to live inside a bounded box rather than the viewport, which React Flow supports but the portfolio has never exercised. The alternative — an admin that is itself an infinite canvas — was rejected: a control surface whose controls pan away is a demo, not a tool.

---

## 4. Information architecture

Three top-level sections, in the layer order, because that is the order of dependence.

```
admin.no-origins.com
│
├─ /                          Overview — what is live, what is drafted, what changed
│
├─ /projects                  Layer 1
│  └─ /projects/portfolio
│     ├─ /edit                the canvas editor (§6)
│     ├─ /versions            version history, diff, rollback (§7)
│     ├─ /content             the copy behind the components
│     └─ /settings            domain, metadata, theme, hue
│
├─ /systems                   Layer 2
│  ├─ /design                 tokens · primitives · components · blocks (§5)
│  │  ├─ /tokens              colour, type, space, radius, motion — live
│  │  ├─ /components          every component, every variant, both themes
│  │  ├─ /illustrations       the generator, the families, the studio
│  │  └─ /blobs               the family, sizes, states
│  ├─ /document               the schema, the registry, what each component accepts
│  ├─ /publishing             the pipeline, webhooks, build status
│  └─ /storage                assets, buckets, usage
│
└─ /products                  Layer 3
   └─ /products/<slug>        manifest, which system it plugs into, where it is installed
```

**Rail, not tabs.** Seven-plus destinations in a row collides the same way the canvas view switcher did at five (Design-System.md §8.5) — the answer there was a column, and it is the answer here.

**Every screen states its layer.** A mono eyebrow reading `PROJECT` / `SYSTEM` / `PRODUCT` above the title. The three layers are a claim about how the platform is built; the admin should make that claim visible on every screen, or it is only a folder structure.

---

## 5. Systems → Design System

The section Bhargav asked for: *"primitives like design system, components should be visible in a section of admin dashboard, so that we can configure the design system from one place."*

Two jobs, and they are different jobs:

### 5.1 Browse — the catalogue

Every primitive, component and block from `@no-origins/ui`, each rendered live at every variant, in both themes, at every block accent. This is what Design-System.md §14 step 14 calls `design.no-origins.com`.

**They are the same catalogue, rendered twice.** The showcase is the public read-only view; the admin adds the controls. One source — a `catalogue.ts` in `packages/ui` that lists each component with its variants and a live example — consumed by both apps. Two hand-maintained catalogues would drift within a week, and drift is the one thing §11 was written to make impossible.

The catalogue entry is also what feeds the **editor's component palette** (§6). One declaration, three consumers: showcase, admin catalogue, editor palette. That is the payoff for writing it once.

### 5.2 Inspect — the token catalogue

**Settled by R3: the admin displays tokens and never writes them.** The package is the source of truth, a token change is a code edit plus a deploy, and this screen is a catalogue.

That is less than "configure from one place" originally asked for, and it is worth being plain about what is gained: the package keeps standing alone under §11.2 rule 1, so `@no-origins/ui` delivers the entire look to an npm consumer with no database anywhere near it — and there is exactly one place a token value can be wrong.

What the screen does, then:

| Shows | Why it earns the screen |
|---|---|
| Every token, both themes, at every block accent, with its live computed value | `tokens.css` is 200 lines of `oklch()`; a swatch is the only way to read it |
| **The measured contrast ratio** for every text-on-surface pair, against §12's floors — `--ink` on `--ground` ≈ 8:1, every `*-deep` ≥ 4.5:1 | A report, not a gate. It cannot refuse a bad value any more, so its job is to make a broken floor impossible to miss after the deploy that caused it |
| Which components consume each token | "What breaks if I change `--rule`" has no answer today short of grep |
| A copyable diff for the change you want | The screen cannot make the edit, so it should at least hand you the exact line to put in `tokens.css` |

The contrast report is the part that has to exist. An accessibility floor that lives only in a document is one that gets broken quietly; under R3 the admin cannot prevent that, so it must at least be the place it becomes visible.

## 6. Projects → Portfolio, and the canvas editor

> **Superseded 2026-09-16.** The canvas editor was built on 2026-09-14 (§13 steps 6–7) and removed on 2026-09-16 with React Flow (Atomic.md D11): the route `/projects/portfolio/edit`, the draft autosave API, `@no-origins/ui/editor` and `@no-origins/ui/document` are all gone, and **the admin authors nothing** today. Everything below — the anatomy, what the grid gives for free, what the editor enforced, the five save states, §6.5's rules and the nine picks — is kept as the record of what was decided and what was learned, because a different approach that cannot read it starts from nothing. The five inspector controls it produced (`HueSwatch`, `PatternPicker`, `PatternStudio`, `Repeater`, `Tree`'s reorder) are in the package and are not going anywhere.

*"A new project is basically a new page in canvas to create whatever we want with the components."*

### 6.1 Anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│  PROJECT · Portfolio          draft · saved 2m ago     [Preview] [Publish] │
├──────────┬────────────────────────────────────────────┬──────────────┤
│ Palette  │                                            │  Inspector   │
│          │            the canvas                      │              │
│ Widgets  │        (CanvasShell, box grid,             │  Component   │
│ Panels   │         real components, real              │  Props       │
│ Blobs    │         tokens, real theme)                │  Position    │
│ Regions  │                                            │  Section     │
│          │                                            │              │
│ Outline  │                                            │  Views       │
│  ▸ Me    │                                            │              │
│  ▸ Work  │                                            │              │
├──────────┴────────────────────────────────────────────┴──────────────┤
│  zoom · theme · block accent · desktop/mobile · grid on/off          │
└──────────────────────────────────────────────────────────────────────┘
```

| Region | What it does |
|---|---|
| **Palette** | Every component the registry exports, grouped by node kind. Drag onto the canvas, or select a node and press a key. **Grows on its own** as `packages/ui` grows — a new export with a catalogue entry appears here without the admin being touched. That is the answer to "the components library should evolve with more components" |
| **Canvas** | The real `CanvasShell`. Drag to move, snapped to boxes. Click to select. The editor adds selection outlines, box-grid highlight, and drag handles — nothing that changes how a node renders |
| **Inspector** | The selected node's props, generated from its schema (Scene-Schema.md §3). A `hue` prop renders the seven-blob swatch; a `Family` prop renders the illustration picker; a string renders a `Field`. No hand-built form per component, ever |
| **Outline** | The scene in DOM order — which **is** reading order and tab order (§12). Reorderable. This is the only place tab order can be seen and fixed, so it is not optional |
| **Footer bar** | Theme, block accent, zoom, and a desktop/document-mode switch, because §8.6 is a media query and a layout you cannot see is a layout that breaks. **Retired 2026-09-15** — see §6.5 last row: the controls exist, but on the canvas, not in a bar |

### 6.2 The grid does the hard part for free

Design-System.md §8.3 already quantises every coordinate to boxes of 160: a widget is 4 × 3 boxes, a full view is 8 boxes wide, "every neighbour is at least one empty box away". So the editor **snaps to boxes and stores positions in boxes, not pixels** (Scene-Schema.md §1).

Three consequences, all good, none of which had to be designed:

1. Drag-and-drop cannot produce an off-grid layout, so it cannot produce an ugly one.
2. A scene stays readable and diffable as text — `{ "at": [4, -6] }` is the table in §8.3.
3. Change `--grid-box` and every scene rescales, because no absolute pixel was ever stored.

### 6.3 What the editor enforces, and what it leaves to you

This is the split R5 created: **the editor enforces what a machine is good at, and composition is yours.**

| The editor enforces | You decide |
|---|---|
| The grid — a widget lands on box corners, and a page cell takes whole columns | Where anything goes and what it says |
| Heights, where they still exist | Which cell is loud, how the diagonal runs, what a section leads with |
| The probes, before Publish is enabled | Whether a rule is worth breaking this time |

**Heights mostly stopped existing.** Before Design-System.md §8.4 was revised, every full-view panel carried a hand-measured height and clipped what overran it — the most fragile thing in `scene.tsx`. A full view is a page now: rows are `minmax(144px, auto)` and grow with content, so there is nothing to measure and nothing to clip. What remains is the **canvas widget**, which is fixed at 4 × 3 by design and so cannot overflow either; the editor's job there is to warn when content does not fit the box, not to record a number.

Where a height does still get written — a canvas panel outside a widget — the editor **measures** it from the rendered content and writes it back on save. The inspector shows the measurement and the slack and lets you set a *minimum*, never a value. A human typing a height reintroduces exactly the bug the probes exist to catch.

**Publish is blocked on a failing probe.** Four of them:

| Probe | Fails when | Where it lives |
|---|---|---|
| `probe10` | An illustration crosses a glyph, or a field comes within 8px of one | `e2e/.mcp/` — **not in version control** |
| `probe11` | Two lines in one drawing touch | `e2e/.mcp/` — **not in version control** |
| `probe12` | A widget has anything but exactly one `fill` cell — the rule `SectionWidget` used to hold as a prop | `e2e/review.spec.ts`, run by `pnpm review` on every route |
| fit | Content overflows a fixed 4 × 3 widget | not built |

**Found while building `probe12` (2026-09-11): `e2e/.mcp/` is gitignored, so `probe10` and `probe11` are not in the repository.** Design-System.md and Patterns.md both cite them as the thing that enforces an illustration rule, and they exist only on the machine that wrote them — a fresh clone has the rules and none of the checks. `probe12` was therefore written into the review spec instead, where `pnpm review` runs it on all sixteen routes automatically and CLAUDE.md's loop already requires it after any UI change. **The other two should move there too**; until they do, two of the four rules above are enforced by memory.

It was also verified by making it fail: a widget with two `fill` cells was added to a fixture, the sweep failed with `widget "two loud cells" has 2 loud cells, expected exactly 1`, and the control was removed. A check that has never failed is decoration.

`probe12` is the one to understand, because it is the shape every retired guard rail should take. Dropping `SectionWidget` bought total freedom over composition; it did not buy the right to a ring where one widget looks unlike the other five. A rule worth keeping is worth *checking* — and a check can be overridden deliberately, which a missing prop cannot.

### 6.5 What the 0.1.0 release changed here (2026-09-14)

Read against Atomic.md after the release. §6.1–6.4 stand; six things moved, recorded before any editor code.

| §6 said | Now | Decision |
|---|---|---|
| The shell is `Page` + rail + header (§3) | The shell is `Tool`; each screen a `ToolScreen` with header, main, `inspector` and `bar` (Atomic.md D6) | `ToolScreen` gains a left `sidebar` region for the palette and the outline, and the admin's Menu drops to its rail form on the editor route to make room. `main` gains a flush mode so the canvas fills it edge to edge. **Built 2026-09-14:** `sidebar` (280, glass-1, sticky — the inspector's mirror at the Menu column's width) and `flush` (the screen pinned to the viewport, main without gutters, its one child fills it) on `ToolScreen`; `AdminRail` takes `form="rail"` on any `…/edit` path; `/fixtures/tool` shows the editor's shell as its third block |
| Palette grouped by node kind | The registry carries a `layer` (Atomic.md rule 4); the catalogue already groups by it | The palette groups by layer; node kind stays the filter for where a thing may land |
| Inspector: hue → seven-blob swatch, `Family` → illustration picker, string → `Field` | Enum ≤ 4 → `Segmented`, enum > 4 → `Select`, boolean → `Checkbox`, text and markdown → `Field`, blob size → `Segmented` — all in the package | Three controls the schema needs and the package lacks, built first and in the package: a hue swatch, an illustration picker, a repeater for list props |
| Outline: the scene in DOM order, reorderable, not optional | `Tree` renders and selects; the WAI-ARIA tree pattern has no reordering gesture | Reordering is added to `Tree`: keyboard moves on the selected item (Alt + ↑/↓, Alt + ←/→ for depth) plus drag; DOM order stays the source of truth |
| Node kinds: blob · panel · widget · region · page | A sixth, `menu` — the view switcher as a node in canvas space, placed and dragged like any other (Atomic.md D9 as amended) | Scene-Schema §1 gains `menu` with `at`, `size` and `items: { label, view \| href }` |
| Footer bar: theme · block accent · zoom · desktop/mobile · grid | The block accents are the apps: `portfolio · design · admin` (D5); every control exists as `Segmented` or `ThemeSwitch` | Publish confirms in a `Dialog` whose one field is the required version label (R1); a speaking blob in document mode is a `Speaker`. **2026-09-15, Bhargav: no footer on the edit page.** The bar is gone; viewport, grid and theme sit in the canvas's top-right panel (where the portfolio keeps its own), zoom is a glass pill bottom-right in the wordmark's place, and the node count and rev join the header's meta. `ToolScreen` keeps `bar` as a region nobody uses |

The order of work that follows: the three inspector controls and `Tree` reordering in the package, then the `ToolScreen` sidebar, then the editor screen itself at `/projects/portfolio/edit` — palette, canvas, inspector, outline, autosave — with the probes gating Publish as §6.3 says.

#### 6.5d The first look, 2026-09-15 — what was wrong with the shell

Bhargav opened the editor and could add components but not move, edit or place them; the bar sat over the palette; the page scrolled; the rail had no expand; scrollbars hung off the panels. Five fixes, all in the package or the host reset, none in admin CSS (§10):

| Symptom | Cause | Fix |
|---|---|---|
| Nothing moves; clicking a widget fades the canvas | `sceneToNodes` hard-coded widgets, panels and regions non-draggable (right for a visitor), and a widget's own click path opened its section | `sceneToNodes(scene, { editing })` makes every node draggable while editing; the shell withholds `nav.open` while editing, so a click is a selection and nothing else |
| The page scrolls; the bar over the palette | The admin has no Tailwind, so no preflight — every `calc(100dvh − …)` in the package was content-box and overran by its padding | Border-box reset in the admin's `globals.css` (the host's one debt to the package); `Tool` is exactly one screen tall and its COLUMN scrolls, never the document |
| Scrollbars stick out of the glass | The glass itself scrolled, so the thumb ran flush with the rounded edge | Sidebar and inspector are glass around a `__scroll` region: thin thumb, transparent track, inset from the edge and clear of the corners |
| The rail cannot expand | Nobody built it | `Menu` gains `onToggleForm` and a chevron toggle in the brand row; `AdminRail` owns the state and remembers it per browser |
| A footer nobody wanted | §6.1 asked for one | Retired; see the row above |

#### 6.5e Boxes, centred, resizable — 2026-09-15

Three rules from the same first look, each a reversal of something §1.1 / §1.3 of Scene-Schema.md had argued, recorded there:

| Bhargav said | Built |
|---|---|
| "One full block of grid item should be the minimum space any item should take. No dynamic sizes. Sizes are always defined in terms of blocks." | Every node in canvas space is whole boxes, one at least, on a box corner — blobs included. The adapter rounds up what it reads and warns; the structure check makes an off-corner `at` or an overlap an error for every kind. The palette drops a blob at 1 × 1, a panel at 3 × 2, a menu at 2 × 2, a widget at 4 × 3. The seed and the local draft were migrated |
| "Default should be center alignment." | A node carries `align` (start · center · end), default center: the class is on React Flow's wrapper, which is the box, so a blob sits in the middle of its box and a heading in the middle of its panel. The layout form offers the three; the hand-written portfolio scene sets none and is unchanged |
| "I should be able to change the size of any item by hold & drag." | React Flow's `NodeResizer` on the selected node, mounted by every node renderer through `ResizeHandles`. The handles move freely; the ghost shows the boxes the release will take; the release snaps to whole boxes and writes `at` and `size`. The inspector's new **Layout** group shows X, Y, Width and Height in boxes, so a size can also be typed. From the palette a component now lands centred on the viewport, not at the origin |

#### 6.5f Into a slot — 2026-09-15

Bhargav dropped a `BentoCell` on a `Bento` and was told it "goes inside another component". True, and useless: nothing let him put it there. Now the adapter, when the editor asks (`tagPaths`), stamps every rendered slot child with its path — `nodes.3.slots.cells.1`, the same path its issues use — so the element under the pointer says where a gesture landed. A **drop** goes into the deepest container under it whose slot admits the component (a `Heading` dropped on a cell lands in the cell's `content`, dropped on the grid between cells it lands in the `Bento` only if the `Bento` takes it, which it does not — so the ghost names the container it will enter, or shows the box it will take on the canvas). The palette's **click** does the same against the selection first. A **click** on a child selects it — the ring is measured off the DOM, since a child has no `at` — and the inspector edits its props; **Delete** removes it. The Layout group is a node's alone; a child's box is its container's business.

#### 6.5g The canvas is the viewport — 2026-09-16

Bhargav, on the shell after 6.5d: *"The sidebar menus have background. The expectation is for react flow to take up the full viewport. Rest all should be above the react flow canvas."* The flush screen had put the canvas in the middle column of a grid, with the rail, the header, the palette and the inspector beside it on the ground — glass on a ground it had nothing to show through. Now a flush screen turns the tool inside out: `main` fills the whole tool, Menu included, and the Menu, the header (glass-2 now, no longer the ground's strip), the sidebar and the inspector are absolutely positioned glass over the canvas, a 12px gutter in from every edge and from each other; the grid shows through all of them. The `Tool` learns it holds a flush screen through `:has()` in the stylesheet, so the admin layout that renders the Menu is untouched, and the Menu's column and rail forms each set the left inset (`--tool-l`) the header and sidebar start from. The canvas's own corner panels step in from the chrome — the tools under the header and clear of the inspector, wrapping when a 280px Menu leaves them ~500px; zoom bottom-right clear of the inspector; React Flow's attribution bottom-left past the palette. Below lg the regions stack as before. Nothing in the admin's CSS (§10).

#### 6.5a The inspector controls — decided 2026-09-14

Four option boards (five directions each, drawn in the package's CSS inside a 320px inspector) on the canvas *No Origins Inspector Controls*. Bhargav: *"I'm happy with your recommendations"*, plus two notes on the picker board that changed more than the picker (§6.5b). Each pick is a rule; the control is built to the rule and not the other way round.

| Board | Pick | The rule |
|---|---|---|
| E1 · hue | **A** — seven dots, a ring on the chosen one | `HueSwatch`: the `Dot` atom at 20px in each hue's deep tier, in one row; the chosen one wears a 2px ink ring with a gap; the hue's name reads beside the row. Where a schema allows `accent`, an eighth glass dot with an ink hairline. A radiogroup — arrow keys move, Space picks. Every `hue` prop renders it. **Not** the seven-blob swatch §6.1 asked for: Brand.md makes the blob the mark of an agent, and seven sleeping faces in a form are seven agents that aren't there |
| E2 · pattern | **A** — a grid of drawn thumbnails, named | `PatternPicker`: the library's patterns in a grid, each drawn by the generator in the node's own hue with its name under, the chosen one in the same ink ring as the swatch. A picture is chosen by looking; the canvas node is the live preview. Three across at the inspector's width, so every name reads whole — four across truncated them on the first fixture; eighteen (§6.5b) is six rows and the inspector scrolls |
| E3 · list | **A** — rows on hairlines, a grip, an add button; **C** as its compact form | `Repeater`: one row per item; the item's fields inline, rendered from the same schema the inspector already renders; a grip to drag, × to remove, a ghost *Add* under the last row, the count against `max` in a caption. `density="chips"` is the same component for a list of text ≤ 24 or `{label, hue}` — each item a Chip with a remove mark. Alt + ↑/↓ reorders from the keyboard |
| E4 · outline | **A** — keyboard moves and drag, one rule | `Tree` gains reordering: on the focused row Alt + ↑/↓ moves it among its siblings, Alt + ←/→ changes its depth; a grip appears on hover and focus; drag for the mouse. The tree reports the new order and the host writes the document — DOM order stays the source of truth |

**One drop indicator.** Repeater and Tree show a drop as the same 2px accent line with a dot at its head. One gesture for "this goes here" across the editor.

**Two corrections to Scene-Schema §3.1 the release made**, recorded on the read-first board: `enum` renders a `Segmented` (≤ 4) or a `Select` (> 4), never a chip row, because a chip is a mark and not a control (Atomic.md D3); `boolean` renders a `Checkbox`, because a `Toggle` in a form beside fields reads as a setting that applies at once, and an inspector value applies on save.

#### 6.5b Patterns, not illustrations — Bhargav's notes, 2026-09-14

Two sticky notes beside the picker board: *"Rename 'Illustrations' to 'Patterns'"* and *"Let's have 18 pre defined illustrations. So, while deciding give me controls to create new if I want to."* Three rules follow.

1. **The word is pattern.** The component is `Pattern` (`Illustration` stays as a deprecated alias for one minor, like `Rail` and `Intro`); the prop type is `pattern`; the library is `patterns.ts` (`patterns`, `patternNames`, `PatternName`); the picker is `PatternPicker`; the document is `Patterns.md`. The `noo-ill` class prefix follows at the next major, when the aliases go.
2. **Eighteen predefined patterns.** The six measured for the portfolio widgets keep their names and their `words`. Twelve more are named for what shapes them and carry no `words` — words belong to a composition, not a pattern, and the editor measures them (§3.6). All eighteen ship in the package, drawn on a review board in every hue, and any of them can be replaced by a studio round (Patterns.md §8).
3. **A new pattern is made in the picker.** The grid ends with *New pattern*, which opens a `Dialog`: the geometry dials on a live thumbnail — `seed · flow · scale · swing · breath · waves · drift · spread · taper · curl · tempo · pinch` — and a name. Save adds it to the **document's own patterns** (Scene-Schema §1 gains `patterns: Record<name, Family>`), listed after the package's eighteen and drawn the same way. This amends Scene-Schema §3.6: the geometry is authorable, because the generator makes every setting a legal picture by construction; `flow` is chosen with its cost shown, as the panel already does; `words` stays the measurement the editor writes back. A document pattern that should be everyone's is promoted to `patterns.ts` in code — a commit, so the library is still a promise.

#### 6.5c The editor screen — decided 2026-09-14

Nine option boards on the canvas *No Origins Editor Screen* (five directions each, drawn in the package's CSS at 1:1): five findings from proving the document renders like `scene.tsx` (Scene-Schema.md §10.3) and the four screen questions the handoff left open. Bhargav: **A on all nine**, plus one note on F1: *"For a widget cell, remove the dot. Add a slot for logos/images."* Each pick is a rule; the code is built to the rule.

| Board | Pick | The rule |
|---|---|---|
| F1 · a widget cell's head | **A** + note | **built** — `CellHead` fills its cell and spreads: the mono label at the top, the title at the bottom — the diagonal of Design-System.md §8.3, restored by the component rather than by the author. **No dot**: the `dot` prop goes (deprecated alias for one minor, ignored). In its place a **`media` slot** — one `Image`, `Blob` or `Pattern`, the company's logo or a picture — drawn at 24px beside the title's first line where the dot was; in a page cell (rows that grow) the head collapses back to a block. The hand-written widgets keep their dots until they are re-poured; the document's do not |
| F2 · the widget text scale | **A** | **built** — `Text` gains `size="widget"` — a fourth step, `--t-widget-text` 20/1.35, the scale a widget is read at. One enum value; the inspector's Segmented shows four |
| F3 · the loud cell's word | **A** | **built** — `Figure` gains `kind="figure" \| "word"`. As a word: the display face at `--t-widget-word` (48), two lines, `value` capped at 24, the label optional. Same corner, same job |
| F4 · marking sample copy | **A** | **built** — `DocumentContext` gains `sampled?: (path: string) => boolean`. Any node whose props resolved a ref into a sampled key renders the *sample copy* tag (`Placeholder`'s) as its first child; the issues list says which ref. A document that inlines sampled text cannot be tagged — sampled copy lives in content and is reached by ref |
| F5 · a list inside a widget | **A** | **built** — a `Text` whose markdown is a list, inside a bento cell, renders without markers and keeps its rhythm; F2 gives it the size. One CSS rule in the cell; no new component |
| S1 · a selected node on the canvas | **A** | **built** — Selection wears the ring focus wears — 2px accent at 4px offset — and a tag above its top-left corner: kind · name in the mono voice with the node's hue dot. Hover is a 1px hairline. The tag hides below zoom 0.4. Nothing about the node's own rendering changes (§6.1) |
| S2 · how a palette item lands | **A** (+ D as the keyboard companion) | **built** — Drag from the palette; a ghost at the component's default size follows and snaps to box corners (a held ⌥ places freely, §1.1); the boxes it will take wash in the accent — the one drop indicator, in two dimensions; release places it selected with the inspector on its defaults; Esc cancels. `/` opens a command list that places the match at the selection — §6.1's "select a node and press a key" |
| S3 · how autosave shows | **A** | **built** — In the header's `meta` slot, a Dot and a few words: grey *saved 2 min ago* · accent *saving…* (pulsing) · yellow *unsaved changes* · pink *couldn't save — kept here* with a ghost Retry · pink *stale — saved elsewhere at 14:02* with a ghost Reload. Publish is disabled in every state but saved. Never a toast for a save |
| S4 · the inspector with none or several | **A** | **built** — Nothing selected: the document's own props — title, description, grid, `order` (a Repeater), views, the document's patterns. Several: the intersection of their schemas; a value they disagree on reads *mixed* and typing sets it on all; the head counts them by component |

**Built 2026-09-14** — all nine, the same day: F1–F5 in the package (Scene-Schema.md §10.4), S1–S4 as `@no-origins/ui/editor` and the admin's `/projects/portfolio/edit` (§13 step 7). Publish is step 8.

**Order of work that follows:** F1–F5 in the package and the registry, the comparison thresholds in `e2e/document.spec.ts` dropped to what they then measure; then the editor screen at `/projects/portfolio/edit` — the `ToolScreen` sidebar (palette by layer, outline), the canvas with S1 and S2, the inspector rendered from the schema with S4, autosave to `documents.draft` with S3 and the rev rule of §6.4 — and full views as pages with it.

### 6.4 Save and publish

| Action | What happens |
|---|---|
| **Autosave** | Debounced ~800 ms → `documents.draft` jsonb, with `rev` bumped. Optimistic concurrency on `rev`; a stale write is refused, not merged |
| **Preview** | The live app rendering the *draft*, behind auth, at a preview URL |
| **Publish** | Runs the probe suite → writes a new `document_versions` row (immutable) → moves `documents.current_version_id` → triggers the pipeline (§9) |
| **Rollback** | Moves the pointer to an older version. Never deletes, never rewrites |

A version is **immutable**. Rolling back does not delete the newer one; publishing again after a rollback creates a *new* version rather than reviving an old number. History is append-only, so "what was live on this date" always has an answer.

---

## 7. Versions

Every publish records more than the document, because a document alone cannot be re-rendered later:

| Field | Why it has to be there |
|---|---|
| `doc` | The scene itself |
| `schema_version` | The document schema's own version — migrations key off this (Scene-Schema.md §5) |
| `ui_version` | The `@no-origins/ui` version it was authored against. A component whose props changed will render an old doc wrongly, and this is the only way to know |
| `registry_hash` | A hash of the registry's component names + prop schemas. Two publishes with the same hash are guaranteed compatible; a change is a flag, not a failure |
| `theme_snapshot` | The token values in force at publish. Otherwise editing a token silently changes what every past version looks like, and "version" stops meaning anything |
| `label`, `notes`, `published_by`, `published_at` | The human record |

The number itself is **R1**: an integer plus a required label — `v7 — "the ring on widgets"` — with an empty or duplicate label refused at publish.

---

## 8. Supabase

One project, `no-origins`. Postgres + Auth + Storage. No edge functions in v1 — Next route handlers on the admin do the work, with the service role key server-side only.

### 8.1 Tables

```sql
-- identity
profiles            (id uuid pk → auth.users, email, name, role, created_at)
allowlist           (email citext pk, invited_at)

-- layer 1 · projects
projects            (id, slug unique, name, domain, description, hue, status, created_at, updated_at)
documents           (id, project_id → projects, slug, kind, title,
                     draft jsonb, rev int, draft_updated_at, draft_updated_by,
                     current_version_id → document_versions,
                     unique (project_id, slug))
document_versions   (id, document_id → documents, version int, label text not null,
                     doc jsonb, schema_version int, ui_version text, registry_hash text,
                     theme_snapshot jsonb, notes, published_by, published_at,
                     unique (document_id, version),
                     unique (document_id, lower(btrim(label))))

-- layer 2 · systems
systems             (id, slug unique, name, kind, description, config jsonb)
-- themes           REMOVED BY R3 — see below

-- layer 3 · products
products            (id, slug unique, name, system_slug → systems.slug, version, manifest jsonb)
product_installs    (id, product_id → products, scope, project_id → projects null,
                     settings jsonb, enabled bool)

-- shared
assets              (id, project_id null, bucket, path, mime, bytes, width, height,
                     alt, checksum, created_by, created_at)
audit_log           (id bigserial, actor, action, entity, entity_id, diff jsonb, at)
```

`documents` holds exactly one mutable draft and a pointer; `document_versions` is append-only. That split is the whole persistence design — everything else is reference data.

**Built 2026-09-11** as `supabase/migrations/`, run against a local stack and exercised rather than read: the allowlist gate rejects an unlisted address and gives a listed one a profile carrying its invited role; `anon` sees zero rows in all ten tables; a viewer reads projects but cannot read the allowlist, cannot insert a version, and updates zero rows of a draft; an empty label fails a check and a duplicate one a unique index; `update` and `delete` on `document_versions` raise **even as superuser**, because RLS stops `authenticated` and a trigger stops the service role. Three departures from the shape above, each recorded in the migration that makes it:

1. **`themes` is not built. R3 forbids it.** R3 makes the package the only source of truth for tokens, so a table holding `tokens jsonb` would be a second source of truth for precisely the thing R3 exists to prevent — the same reasoning that struck ~~Token configuration~~ from §13. `theme_snapshot` on a version is *not* the same thing: it records what a version was published against, which is history, not configuration.
2. **`version int` plus a required `label`**, not `version text` + `version_ord int`. The table above was drafted before R1 settled the format; R1's integer already sorts, so an ordinal would be a second copy of the same fact. R1's "rejects an empty or duplicate label" is a check constraint and a unique index, not editor manners.
3. **No `citext`.** A lowercase-only `text` column with a check is the same guarantee without depending on where the extension was installed or what is on a role's `search_path`.

**`documents.rev` is maintained by the database**, bumped by a trigger only when the draft actually changes, for the same reason `updated_at` is: the one write that forgets to increment it is the one that silently clobbers a newer draft. The editor's conflict check is `update … where rev = <the rev I loaded>`.

### 8.2 Storage buckets

| Bucket | Access | Holds |
|---|---|---|
| `assets` | private, signed reads | Uploads: the résumé PDF, source photos for Character.md, anything a panel links |
| `publish` | public read | The published doc JSON per version, at a stable path, plus derived static output (OG images) |

**The `assets` bucket holds photographs now.** Design-System.md §13's "no real images" was reversed 2026-09-11: photographs are allowed, illustrations are still code. So this bucket carries documents, source material *and* the photographs a document places through `Image` — which makes `alt` text a field on the asset record, not an afterthought at the point of use, and makes width and height worth storing so a document can reserve the box.

### 8.3 RLS

Deny by default on every table. One policy shape: `auth.uid() IN (SELECT id FROM profiles WHERE role IN (…))`. Roles: `owner` (everything), `editor` (documents and drafts, may publish), `viewer` (read). One row exists today; the shape is there so the second person does not require a migration.

**No anon read policy, anywhere.** The public site never queries Supabase with the anon key — it receives published documents through the pipeline (§9). A public read policy is a second door into the same data with different rules, and two doors is how one of them gets left open.

### 8.4 Auth

**The allowlist is the whole membership rule, and every door respects it.** A `before_user_created` check rejects any address not in the `allowlist` table, seeded with the owner's, so an account only ever exists for someone invited — and an exposed URL is not an exposed app. `enable_signup` stays on (it is how the magic link mints the account on first use); the trigger, not the flag, is the gate.

**Three doors, one gate** (revised 2026-09-17 — the login was rebuilt on the shadcn design system, and *"no password, no OAuth, no signup route"* narrowed to *"no signup route"*):

1. **Magic link** — the membership path, and the only one that can create an account. The page **says the same thing whatever happens**: "if that address is on the list, a link is on its way." Distinguishing "not on the list" from "link sent" would make the page a membership oracle for anyone with the URL; the person who owns the address learns the outcome from their inbox, nobody else learns anything.
2. **Password** — a convenience for an account that already exists. There is still **no signup route**: a password can only be *set while signed in* (the landing screen), so it never becomes a second way onto the allowlist. Sign-in is not an oracle either — Supabase collapses "wrong password" and "no such account" into one "invalid credentials".
3. **Passkey** — a WebAuthn assertion (Supabase's experimental passkey API), the fastest and only phishing-resistant door. Registered while signed in; used from the sign-in card. It needs `[auth.passkey]` enabled on the server (`supabase/config.toml` locally, the dashboard on the hosted project) and `experimental: { passkey: true }` on the browser client. It cannot widen membership: you can only register a passkey against an account you are already signed into, and you can only get that account through door 1.

OAuth is still absent by choice — a third-party identity provider is another membership surface to reason about, and the allowlist plus these three doors already covers the one owner.

---

## 9. Publishing

What has to be true: **the live portfolio must not be slower, less crawlable, or less reliable than it is today.** It currently server-renders a hand-authored scene from source — that is the bar, and a database in the request path would lower it.

So: the document is fetched **at build or revalidation time, never per request**, and the rendered output stays static.

**R2 settles how: ISR plus a webhook revalidate.** Publish writes the version row, moves the pointer, and calls a revalidate endpoint on the portfolio for the routes the change touches. Output stays static; a publish lands in seconds.

The pipeline, whichever is chosen:

```
Publish → probes pass → version row written → pointer moved
       → pipeline notified → portfolio renders the new version → live
       → audit_log row, and the admin shows it green
```

**The admin owns the failure case, and under R2 that is a build requirement rather than good manners.** A dropped revalidate raises no error: the version exists, the pointer moved, and the site quietly keeps serving the old one. So the publish flow does not end at the webhook — it **fetches the live route back, reads the version the page reports, and compares**. Green only when they match; red, with the two version numbers, when they don't. A publish button that reports success on write rather than on live is a lie the first time a revalidate is dropped.

For that to work the rendered page has to state which version it is. A `<meta name="x-noo-version">` on every route, written from the document that rendered it — cheap, and it also answers "what is live right now" from a browser without a database.

---

## 10. What the admin forces the design system to grow

Design-System.md §9: *"Not in v1: Dialog/Sheet (glass-3), Toast, Tabs, Table, Editor surfaces. They inherit the same tokens when they come."*

The admin needs every one of them. That is not a problem — it is the point. **The admin is the forcing function for the system's second half**, exactly as the portfolio was for its first.

| New to `@no-origins/ui` | For | Notes |
|---|---|---|
| `Dialog` / `Sheet` | Confirm publish, token detail, product install | glass-3, per §3's budget |
| `Toast` | Save state, publish result | The only place the admin speaks in the brand voice |
| `Tabs` | Token groups, version detail | |
| `Table` | Versions, assets, audit log | The first component with real data density; the type scale has never been tested there |
| `Tree` | The outline (§6.1) | Reorderable, keyboard-operable — DOM order is tab order |
| `Inspector` | Schema-driven props form | The genuinely new one. Everything else exists in some form elsewhere |
| ~~`Rail`~~ | The left nav | **Built 2026-09-11.** Page mode's `NavBar` as a column, and `Page` takes a `rail` so a railed page is two columns instead of a stack. The bar's grammar survives the rotation except for one detail: an underline in a stack reads as a divider between two items rather than a mark on one, so the current marker becomes the same 2px `--accent-deep` on the leading edge. Groups carry a hue, which puts §1's three layers in the navigation rather than only in each screen's eyebrow |

**Headless layer, per the shadcn note (§9).** Take Radix or Base UI directly as an **optional peer**, the way `@xyflow/react` already is, and style it with our own classes in the `components` layer. Not shadcn: its utilities-in-components model breaks §11.2 rule 3.

**These are system components, so they ship in the package, not in the admin app.** An admin-only component is a fork of the design system wearing a different folder name.

---

## 11. Accessibility and performance

The admin is a tool one person uses all day, which changes the emphasis but not the floor.

- Every floor in §12 of Design-System.md holds — contrast, 44px targets, focus rings, one `h1`, landmarks. The token editor **enforces** the contrast floors rather than documenting them (§5.2).
- **Keyboard first.** Every editor action has a key: select, nudge by a box, duplicate, delete, open the palette, publish. A canvas editor that needs a mouse is unusable within a week.
- **Undo/redo is a requirement, not a feature.** Local command stack, at least 50 deep, surviving autosave.
- The canvas editor is the one place in the platform where render cost is not the visitor's problem, so the LCP rules of §12 do not apply — but the **preview** must be measured as the visitor sees it, not as the editor renders it.

---

## 12. Decided — the five rules

All five settled **2026-09-11**. Each rule records the pick, the reason, and the cost — the cost is written down because a rule whose price is known is one that can be revisited honestly. The full option sets and what was rejected live on the decision sheet; the short version is under each rule.

### R1 · A version is an integer with a required label

`v7 — "the ring on widgets"`. The integer sorts and is never ambiguous; writing the label is the moment you notice what you actually changed.

**Cost:** one more required field at publish. So the editor **rejects an empty or duplicate label** — an unenforced label is one that becomes `"update"` seven times and stops meaning anything.
**Rejected:** semver in all three forms, because nobody classifies their own change correctly and a derived rule is a guess; date-stamps, because they say nothing about the size of a change.

### R2 · Publish is ISR plus a webhook revalidate

Publish writes the version row, moves the pointer, and calls a revalidate webhook on the portfolio. The output stays static, so §9's bar holds, and a publish lands in seconds rather than in a build.

**Cost, and it is specific: a failed revalidate is silent.** The site keeps serving the old version and nothing errors. So §9's "the admin owns the failure case" stops being a nicety and becomes a build requirement: after revalidating, the admin **fetches the live route back and compares the version it actually serves** against the one it just published, and shows red until they match. A publish button that reports success on write rather than on live is a lie the first time a revalidate is dropped.
**Rejected:** build-time fetch plus redeploy (this doc's recommendation — correct, but minutes per publish); runtime fetch (a database in the request path); the bucket and the pull-request routes.

### R3 · The package is the source of truth for tokens; the admin only displays them

A token change is a code edit, a changeset and a deploy. The admin's Design System section shows every token and every component live, in both themes, and writes nothing.

**Cost:** "configure the design system from one place" is narrowed to "*see* the design system from one place". The section is a catalogue, not a control panel.
**What it buys:** zero drift, and `@no-origins/ui` keeps standing alone under §11.2 rule 1 — an npm consumer gets the whole look without a database. §5.2 is rewritten to match.
**Rejected:** the database as truth (breaks rule 1 outright); the override layer (this doc's recommendation — two places to look when a colour is wrong); themes as Products (ceremony for a single theme).

### R4 · Prose is markdown plus a declared set of inline directives

`If you're hiring, the work is on :pan[Work]{view=work}.` Markdown carries the writing; one declared extension carries the single canvas-specific behaviour that markdown cannot express — a link that moves the viewport instead of loading a document.

**Block-level editing is unaffected, and this was the point of confusion worth recording.** Dragging a block onto the canvas, moving it, reordering it in the outline, deleting it — all visual, under every option. The directive exists only *inside a sentence*, and it is inserted by a control (select the text, ⌘K, pick the section), never typed by hand. The rule is about what the stored text looks like, not about how a canvas is composed.
**Cost:** one syntax to document. The directive set is a registry like everything else and is listed in the admin under Systems → Document.
**Rejected:** props-only (a portfolio is writing); plain markdown (loses the pan-link, which is the one behaviour worth keeping); rich text (needs a real editor first, which is a project of its own); slots (writing a paragraph becomes node manipulation).

### R5 · A blank canvas is the first document

**Revised 2026-09-11, same day.** The original pick was "one section — Me", chosen because Me carries the only real prose and so was the only section that exercised R4. That reasoning was sound *for a migration*. It stopped applying when the goal changed: **Bhargav is not keeping the current portfolio's design.** The components are to be made available, and the portfolio composed fresh from them.

So there is no first migration. The first document is a **new, empty canvas**, composed in the editor from the library, and the existing portfolio keeps rendering from `scene.tsx`, untouched, until there is something better to replace it with.

**What this buys:** the risk in R5's original form — Me is the landing view, so a broken render breaks the front door — disappears entirely. Nothing that visitors see depends on the document path until Bhargav decides it does.

**What it costs:** the hand-authoring exercises no longer double as a migration plan. They keep their other value, which was the point: Scene-Schema.md §8 and §9 tested the schema against two real sections and found twelve things wrong with it. That work stands whether or not either section is ever migrated.

**What carries over unchanged:** the grid. Positions stay on the 160-box snap (Scene-Schema.md §1.1), confirmed 2026-09-11 — it is what makes a freely composed layout line up without anyone thinking about it, and the editor enforces it so composition does not have to.

**What moves from code to Bhargav.** Several rules are enforced today by hand-written code and by review: one loud cell per widget, a widget is exactly 4 × 3 boxes, heights are measured never guessed, no illustration under a glyph. Under free composition the split is: **the editor enforces what a machine is good at** — the grid, the measuring, the probes — and **composition is Bhargav's**. A rule that survives only because one person remembers it is not a rule the system holds.

---

**What the five together unblock:** the schema can be written (R4 fixes the prose shape), the registry can be written (R3 fixes tokens as code), the pipeline can be built (R2), publishing has a name for its output (R1), and the first document is a blank canvas that puts nothing a visitor sees at risk (R5).

## 13. Build order

**Steps 1–4 are built; 5 onward is the order for the rest.** The five rules of §12 are settled, so step 1 can start. R5 shapes the order: there is no migration, so nothing here touches what a visitor sees — the live portfolio renders from `scene.tsx` until step 10, which has no date.

> **Amended 2026-09-16.** Steps 6 and 7 — the document layer and the editor — were built on 2026-09-14 and **removed in v1** with React Flow (Atomic.md D11). They are struck below rather than deleted: what they found is the reason the registry's contract survives. **Step 8 (publish and versions) is not applicable** until a different approach to authoring exists; R1, R2 and the read-back check stand as decisions waiting for something to apply to. Steps 9–11 are untouched, and step 10 — replacing the portfolio — happened on its own terms instead: the portfolio is pages now, rendered from source, with no document anywhere near it.

1. **Scene-Schema.md adopted** — the JSON format and the registry contract (Scene-Schema.md §1–§3), with R4's directive set declared.
2. **The component library, then `catalogue.ts` + registry** — R5 makes this the long pole, not a footnote: free composition needs a *complete* palette, not whatever the current portfolio happened to use. Ten components are missing (Scene-Schema.md §2.3), and every one of them is a place the app reached for a utility class instead of a component. Then each declares its props schema and an example: one declaration, three consumers (§5.1).
3. ~~**Supabase project**~~ — **done 2026-09-11.** The schema of §8.1, deny-by-default RLS, the allowlist gate, both buckets, seeded with the four systems and one project row: `portfolio`. Lives in `supabase/`; `supabase/README.md` says how to run it and what was verified. **One thing is deliberately not in the repo: the allowlist row with a real email address.** Until it exists nobody can sign in, which is §8.4 working rather than a snag.
4. **`apps/admin` shell** — **built 2026-09-11, not yet deployed.** The rail, the three layer sections, magic-link auth and nine honest empty screens are running on :3002 against the local stack; signing in was exercised end to end through a real emailed link rather than assumed. **Deploying it is the part still open**, and §13 wants that done while it is still empty — a deploy path found later is a deploy path found the hard way. It needs a hosted Supabase project and a Vercel project, both of which are Bhargav's to create.

   One thing was found only by following a real link: `additional_redirect_urls` is matched against the **whole** URL, so a bare origin does not admit `/auth/callback?next=…`. Supabase falls back to `site_url` silently, the `next` is dropped, and the link lands on the overview instead of where you were going. The config now lists `/**` patterns.
5. **Systems → Design System, the catalogue** (§5.1–5.2) — every component live in both themes, every token with its contrast report. Under R3 this is the whole of the Design System section, and it is also §14 step 14's public showcase, which stops being a separate build.
6. ~~**Document renderer**~~ — **built 2026-09-14, removed 2026-09-16** (D11). As built, `@no-origins/ui/document`: the schema and the registry's prop schemas as Zod, refs, the markdown-and-directives renderer R4 needs, and `documentToScene`. The read path runs on `/fixtures/document` against the portfolio written as a document, compared pixel for pixel with the hand-written scene by `e2e/document.spec.ts`; Scene-Schema.md §10 has the numbers and the eight findings, which are the next option boards. *Was:* a `SceneDocument` in the package turning doc JSON into `SceneNode[]` (Scene-Schema.md §4), plus the markdown-and-directives renderer. **Read path first**, on a fixture. The two hand-authored documents in Scene-Schema.md §8 and §9 are the test material: they were written against real sections, so if they render they prove the renderer, and nothing has to be migrated for that to be true.
7. ~~**The editor, read-write**~~ (§6) — **built 2026-09-14, removed 2026-09-16** (D11). `/projects/portfolio/edit`: the `ToolScreen` sidebar holding the palette (the registry by layer, drag or `/`) and the outline (`Tree`, reorderable), the real `CanvasShell` fed by `documentToScene`, the inspector rendered from each entry's `PropSchema` with the document's own props when nothing is selected, and the four keyboard gestures — Delete, ⌘D, Esc, arrows by one box. Autosave is a 800 ms debounce onto `documents.draft` through `PATCH /api/documents/:id/draft`, which writes `where id and rev = <the rev I loaded>` and answers 409 when zero rows move; the header says which of S3's five states it is in. Everything visual lives in the new `@no-origins/ui/editor` subpath (§10).

   **What is not done.** Preview and Publish are step 8: Publish is enabled only when the draft is saved and the adapter says valid, its dialog asks for R1's required label, and then it closes — the button says so. The probes do not gate anything yet (§6.3's `fit` is still unbuilt and `probe10`/`probe11` are still only in `e2e/.mcp`), the ⌘K directive control is not built, F1–F5 of §6.5c are still ahead of it in the package, and the seed draft is a **copy** of the portfolio's document under `apps/admin/src/content/` because one app may not import another's source. Verified by signing in against the local stack and looking: selection ring and tag, a hue changed in the inspector and seen on the canvas, an autosave round-trip with the row's `rev` moving 10 → 11 → 12 and surviving a reload, and a palette item dragged onto the canvas landing on a box corner.
8. **Publish and versions** (§7, §9) — R1's labelled integers, R2's ISR webhook, and the read-back check that makes R2 safe. **Not applicable since 2026-09-16**: there is nothing to publish until a different approach to authoring exists. The three rules keep.
9. **Compose a blank canvas** (R5) — a new document, built in the editor from the library, on its own route behind auth. The existing portfolio keeps rendering from `scene.tsx` throughout.
10. **Replace the portfolio, when there is something better to replace it with** — Bhargav's call, not a step with a date. `scene.tsx` is deleted only once a composed document beats it.
11. **Products** — the manifest, the install, and the first real one.

~~Token configuration~~ — **removed by R3.** Tokens stay a code edit; step 5 is all the admin ever does with them.

Steps 1–6 carry no visitor risk: schema, registry, catalogue and read path, with the live portfolio still rendering from source throughout. Everything that can touch what a visitor sees is in 7 onward, and by then the renderer has been running against Me on a fixture for weeks.
