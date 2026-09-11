# No Origins — Admin

*The control surface for the platform: `admin.no-origins.com`. Opened 2026-09-11.*

Companion documents: **Brand.md** (what No Origins is), **Design-System.md** (the system this configures), **Illustrations.md** and **Character.md** (two of its libraries), **Scene-Schema.md** (the document format the editor writes and every project reads). This document decides the admin; Scene-Schema.md decides the contract.

---

## 0. What this is, and what it is not

The admin is **one app that owns the three layers** — Projects, Systems, Products — and nothing else. It is the only place where a project's canvas is authored, where the design system is configured, and where a product is installed into a system.

It is **not**:

- a CMS with a page tree — the platform has no pages (Design-System.md §8), it has canvases;
- a second design system — it is built out of `@no-origins/ui`, and where the package is missing a component the admin's need is the reason to build it (§10);
- a place where code is written — it edits **documents**, never source. A document can only name components the registry already exports (Scene-Schema.md §2), which is both the editing model and the whole of the security model.

**Scope change, recorded.** Design-System.md §11.4 reads "`no-origins.com` and every other subdomain are out of scope". `admin.no-origins.com` is a third domain and a third Vercel project. §11.4 needs an edit when this doc is adopted — three domains, and the admin is one.

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
| **Systems** | Design system (`@no-origins/ui`) · Canvas runtime (`@no-origins/ui/canvas`) · Theme (`theme.ts`, four axes, §10) · Illustration generator (Illustrations.md §6) · Review loop (Playwright, CLAUDE.md) | **Document** (Scene-Schema.md) · **Publishing** (§9) · **Identity & storage** (Supabase, §8) · Chat/agent (§14 step 15) |
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
| **Footer bar** | Theme, block accent, zoom, and a desktop/document-mode switch, because §8.6 is a media query and a layout you cannot see is a layout that breaks |

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

| Probe | Fails when |
|---|---|
| `probe10` | An illustration crosses a glyph, or a field comes within 8px of one |
| `probe11` | Two lines in one drawing touch |
| `probe12` | A bento has anything but exactly one `fill` cell — the rule `SectionWidget` used to hold as a prop, now held as a check (Design-System.md §9) |
| fit | Content overflows a fixed 4 × 3 widget |

`probe12` is the one to understand, because it is the shape every retired guard rail should take. Dropping `SectionWidget` bought total freedom over composition; it did not buy the right to a ring where one widget looks unlike the other five. A rule worth keeping is worth *checking* — and a check can be overridden deliberately, which a missing prop cannot.

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
document_versions   (id, document_id → documents, version text, version_ord int,
                     doc jsonb, schema_version int, ui_version text, registry_hash text,
                     theme_snapshot jsonb, label, notes, published_by, published_at,
                     unique (document_id, version))

-- layer 2 · systems
systems             (id, slug unique, name, kind, description, config jsonb)
themes              (id, project_id → projects null, name, tokens jsonb, is_default bool)

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

### 8.2 Storage buckets

| Bucket | Access | Holds |
|---|---|---|
| `assets` | private, signed reads | Uploads: the résumé PDF, source photos for Character.md, anything a panel links |
| `publish` | public read | The published doc JSON per version, at a stable path, plus derived static output (OG images) |

**No image assets on the platform surfaces.** Design-System.md §13 decided 2026-09-10: no real images anywhere, pictures are code. The `assets` bucket is for documents and source material, not for decoration. The admin should say so where you upload.

### 8.3 RLS

Deny by default on every table. One policy shape: `auth.uid() IN (SELECT id FROM profiles WHERE role IN (…))`. Roles: `owner` (everything), `editor` (documents and drafts, may publish), `viewer` (read). One row exists today; the shape is there so the second person does not require a migration.

**No anon read policy, anywhere.** The public site never queries Supabase with the anon key — it receives published documents through the pipeline (§9). A public read policy is a second door into the same data with different rules, and two doors is how one of them gets left open.

### 8.4 Auth

Magic link, restricted to the `allowlist` table, seeded with the owner's address. No password, no OAuth provider, no signup route. A `before_user_created` check rejects anything not on the list, so an exposed URL is not an exposed app.

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
| `Rail` | The left nav | Page mode's `NavBar` as a column |

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

**Nothing below is built yet — this is the order to build it in.** The five rules of §12 are settled, so step 1 can start. R5 shapes the order: there is no migration, so nothing here touches what a visitor sees — the live portfolio renders from `scene.tsx` until step 10, which has no date.

1. **Scene-Schema.md adopted** — the JSON format and the registry contract (Scene-Schema.md §1–§3), with R4's directive set declared.
2. **The component library, then `catalogue.ts` + registry** — R5 makes this the long pole, not a footnote: free composition needs a *complete* palette, not whatever the current portfolio happened to use. Ten components are missing (Scene-Schema.md §2.3), and every one of them is a place the app reached for a utility class instead of a component. Then each declares its props schema and an example: one declaration, three consumers (§5.1).
3. **Supabase project** — the schema of §8.1, RLS, allowlist auth, both buckets. Seeded with one project row: `portfolio`.
4. **`apps/admin` shell** — page-mode rail, the three layer sections, auth, empty screens. Deployed to `admin.no-origins.com` before there is anything in it, because a deploy path found later is a deploy path found the hard way.
5. **Systems → Design System, the catalogue** (§5.1–5.2) — every component live in both themes, every token with its contrast report. Under R3 this is the whole of the Design System section, and it is also §14 step 14's public showcase, which stops being a separate build.
6. **Document renderer** — a `SceneDocument` in the package turning doc JSON into `SceneNode[]` (Scene-Schema.md §4), plus the markdown-and-directives renderer R4 needs. **Read path first**, on a fixture. The two hand-authored documents in Scene-Schema.md §8 and §9 are the test material: they were written against real sections, so if they render they prove the renderer, and nothing has to be migrated for that to be true.
7. **The editor, read-write** (§6) — palette, canvas, inspector, outline; draft autosave; the ⌘K directive control; probes on save. Preview renders the draft behind auth.
8. **Publish and versions** (§7, §9) — R1's labelled integers, R2's ISR webhook, and the read-back check that makes R2 safe.
9. **Compose a blank canvas** (R5) — a new document, built in the editor from the library, on its own route behind auth. The existing portfolio keeps rendering from `scene.tsx` throughout.
10. **Replace the portfolio, when there is something better to replace it with** — Bhargav's call, not a step with a date. `scene.tsx` is deleted only once a composed document beats it.
11. **Products** — the manifest, the install, and the first real one.

~~Token configuration~~ — **removed by R3.** Tokens stay a code edit; step 5 is all the admin ever does with them.

Steps 1–6 carry no visitor risk: schema, registry, catalogue and read path, with the live portfolio still rendering from source throughout. Everything that can touch what a visitor sees is in 7 onward, and by then the renderer has been running against Me on a fixture for weeks.
