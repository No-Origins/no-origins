# No Origins — Atomic

*Opened 2026-09-13. The design system organised by Atomic Design, every token and component reviewed, and the decisions that turn `@no-origins/ui` into a production release. Companion to Brand.md (what), Design-System.md (the values) and Admin.md (the first consumer that found the gaps). Decided 2026-09-14; the build follows §6. Where this document and Design-System.md disagree, this one is newer; the values there stand, the organisation here supersedes §9's flat table.*

The review canvas — every layer rendered from the live package CSS, every item with a verdict — is at
https://claude.ai/code/artifact/13bff065-8753-40a2-8388-84ddd0f1d9ba and is rebuilt from `packages/ui/design/release/` (§7).

---

## 0. Why

Bhargav, 2026-09-13: *"I'm going to build a lot of things under no origins. I don't want to focus on the same process again and again for everything I'm going to build. Even my personal brand will follow the same design system."* The system is the product (Brand.md §1); the portfolio, the showcase and the admin are its first three consumers.

What the review found against the four problems raised:

| Said | Found |
|---|---|
| Inconsistent implementation | The **values** are decided and mostly right. The **wiring** is not: twelve copies of the hue ladder, nine font sizes on no step of the scale and nine more typed as literals, ten control heights, no space tokens at all, two ground classes, two focus rules. Components are styled by hand against a spec instead of reading it. |
| Generic Claude UI | Where the system is used as designed — the canvas, the widgets, ProfileCard — it is not generic. Where an app composes its own screens from cards, muted paragraphs, chips and utility spacing — the admin, the showcase overview — it is. The generic look is what a missing layer looks like once an app fills it. |
| Doesn't feel like the discussions | Two decisions never reached the code: the admin's hue (Admin.md says lavender, `layout.tsx` says yellow) and "glass only over something worth seeing through" (the catalogue's demo wells are solid). Two retired components are still exported. The rest of the discussion *is* in the code; the composition lost it. |
| Bad layouts, e.g. the admin | A tool poured into a reading template. The Rail is right; everything beside it is a landing page with stat cards. It needs a template the package does not have, and the four components that template is made of. |

## 1. The six layers

A layer reads only the layers before it. ✚ marks what does not exist yet.

| # | Layer | Definition | Members |
|---|---|---|---|
| 1 | **Tokens** | Values. No markup. | colour roles · the family + **the hue slot ✚** · semantic · block accent (+ `--accent-ink` ✚) · glass · radius · elevation · motion · **space ✚** · **type steps for controls ✚** · **control heights ✚** · **icon sizes + stroke ✚** · grid · grain · fonts (host) · breakpoints |
| 2 | **Atoms** | One job; contain nothing of their own kind. | Ground · Blob · Wordmark · Glass · Text · Heading · Label · Dot · Divider · Image · **Icon ✚** · Button · Chip · Toggle · Bubble · Card · Placeholder · Stack · Row · Illustration · (focus ring, skip link, sr-only) |
| 3 | **Molecules** | Atoms combined; still one job. | Field · Segmented (ThemeSwitch is an instance) · ChatInput · SectionHeader (absorbs Intro) · CellHead · Figure · Steps · **Speaker ✚** · Dots (out of Carousel) · ContrastRow · **Select · Checkbox · Radio · Tabs · Toast · Dialog/Sheet · Menu · Tooltip · Tree ✚** |
| 4 | **Organisms** | A distinct section of a screen. | NavBar · **Menu ✚** (absorbs Rail, the canvas menu and the NavBar sheet) · Footer · BlockCard (absorbs RoadmapItem) · MediaCard · Quote · ProfileCard · Deck · Carousel · Bento + BentoCell · Catalogue · ContrastReport · the canvas nodes · **Table ✚ · Inspector ✚** |
| 5 | **Templates** | The shells. | Page · **Tool ✚** · Canvas · **Document ✚** |
| 6 | **Pages** | Instances — the apps. | portfolio · design · admin · the next block |

**Tokens** are the sub-atomic layer; Atomic Design does not name it, and here it is the one that matters most, because it is the layer every other one reads.

## 2. Five wiring rules

The rules that make "a change to a token is a change to every component" true by construction, each with its check — a rule worth keeping is worth checking (Admin.md §6.3).

1. **A component reads tokens and the hue slot. Never a literal.** No `px` on font-size, gap, padding or height; no colour that is not a `var()`. Check: stylelint on the package, `declaration-property-value-disallowed-list`.
2. **Hue by attribute, declared once.** `[data-hue="x"]` sets `--hue · --hue-deep · --hue-tint · --hue-ink` in tokens.css; the block accent is the same four names at the root. Component CSS never lists a hue. Check: grep for `[data-hue=` outside tokens.css fails the build.
3. **Layers read downward only.** Atoms import tokens; molecules import atoms; organisms import both; templates import anything. Check: `no-restricted-imports` per folder.
4. **One registry entry per component, grouped by layer.** The catalogue renders by layer, so the showcase, the admin's catalogue and the editor's palette show this architecture — not the registry's seven private groups.
5. **Apps compose; apps do not style.** Zero Tailwind utilities for spacing or colour in an app file. If a screen needs one, a component is missing (Scene-Schema.md found ten that way). The `@theme` layer stays for hosts we do not own. Check: a lint on `apps/**` for `className` values matching the spacing and colour utility patterns.

## 3. The review — every verdict

Keep = ship as is · Fix = same component, reads the tokens it should · Merge = fold into a neighbour · Retire = remove the export · Missing = build, in the package. Details and samples are on the canvas; this is the record.

| Item | Layer | Verdict | The one line |
|---|---|---|---|
| Ground & ink | tokens | Fix | `--muted` on ground is 4.20:1; lift to L 0.52 |
| The family | tokens | Fix | `pink-ink` 4.47, `blue-ink` 4.05 on their tiles; L 0.42 / 0.40 |
| The hue slot | tokens | Missing | one `[data-hue]` rule; twelve ladders deleted |
| Block accent | tokens | Fix | add `--accent-ink`; name blocks after apps; settle admin's hue |
| Semantic | tokens | Keep | washes derived with color-mix, no new token |
| Glass | tokens | Fix | prefix `.glass*` → `.noo-glass*`; aliases one release |
| Radius · Elevation | tokens | Keep | |
| Motion | tokens | Fix | prefix the four pattern classes |
| Space | tokens | Missing | `--s-1 … --s-24` |
| Type | tokens | Fix | `ui` (bubble-text renamed, 15) and `ui-sm` (caption at 600, 13); four widget steps as tokens; nine off-scale sizes retired, nine literals read their step |
| Control heights | tokens | Missing | `--ctl-xs/sm/md/lg` 28/36/44/56 · `--bar` 60, replacing ten literals |
| Grid & grain | tokens | Keep | merge `.noo-graph` into `.noo-ground` |
| Fonts & breakpoints | tokens | Fix | export sm/md/lg from tokens.ts (only `NARROW_QUERY` exists, in canvas/scene.ts); retire the unnamed 760 under Quote |
| Ground | atom | Keep | export as a component |
| Blob · Wordmark · Divider · Toggle · Bubble · Placeholder · Stack · Row · Illustration · Dot · Label | atom | Keep | read the hue slot / space tokens where they apply |
| Glass · Text · Heading · Image · Button · Chip · Card · focus | atom | Fix | vocabulary (`small`→`body-sm`), Heading gets 1 + display, Image gets 2xl, Button/Chip read `ui`/`ctl`, Card gets `lg` padding, duplicate focus rule deleted |
| Field · ChatInput · Steps | molecule | Keep / Fix | Field height → 44; Select/Checkbox/Radio wear its box |
| ThemeSwitch | molecule | Merge | → `Segmented` |
| Intro | molecule | Merge | → `SectionHeader rhythm={false}` |
| CellHead · Figure | molecule | Keep / Fix | Figure is one name, not `BentoFigure` |
| Speaker | molecule | Missing | blob + bubble, named |
| Dots | molecule | Merge | the dot row out of Carousel, shared with Deck |
| ContrastRow / ContrastReport | molecule | Fix | move into the package beside Catalogue |
| Select · Checkbox · Radio · Tabs · Toast · Dialog · Menu · Tooltip · Tree | molecule | Missing | Admin.md §10; headless via Radix/Base UI as optional peer |
| NavBar · Footer | organism | Fix | control tokens |
| Rail | organism | Merge | → `Menu` column form; groups, nesting and skip link kept; current marker becomes the ink pill (D9) |
| Menu | organism | Missing | column · rail · two columns · floating on the canvas · sheet; placeable node, items edited in the inspector (D9) |
| Icon | atom | Missing | `<Icon name size />`, three sizes, one stroke, `currentColor`; tokens `--icon-sm/md/lg`, `--icon-stroke` (D8) |
| RoadmapItem | organism | Merge | → `BlockCard state="sleep" progress` |
| MediaCard · Quote · Catalogue · Bento | organism | Fix | stale docstring; Quote onto Card; demo well on the ground, grouped by layer; `--accent-ink` default |
| ProfileCard · Deck · Carousel · canvas nodes | organism | Keep | canvas CSS to its own file |
| SectionWidget · RegionLabel | organism | Retire | remove export; mark deprecated |
| Page · Canvas | template | Keep | |
| Page with a rail (the admin) | template | Fix | see D6 |
| Tool · Document | template | Missing | the admin's shell; the editor's reading column |

Tally: 22 Keep · 25 Fix · 5 Merge · 1 Retire · 9 Missing, over 62 items (the Icons and Menu boards are option boards and are not counted).

## 4. Decided — nine rules

All nine settled **2026-09-14**, as a note on the canvas: *"Let's proceed with your recommendations."* Each records the pick, the reason and the cost, in the style of Admin.md §12 — a rule whose price is known is one that can be revisited honestly.

### D1 · Hue is a slot, declared once
`[data-hue="x"]` sets `--hue · --hue-deep · --hue-tint · --hue-ink` in tokens.css; the root sets the same four from the block accent; `data-hue="accent"` resets to it. Component CSS never lists a hue.
**Cost:** a component with no `data-hue` inherits its container's hue instead of the block accent — so a component whose author meant *the accent* says so (`data-hue="accent"`), which every component already emits for its default. **Rejected:** per-component ladders (twelve today; an eighth hue would cost twelve edits).

### D2 · Space, control type and control heights are tokens
`--s-1 … --s-24` (4 → 96) · `ui` (15, the former `bubble-text`, renamed for what it is used for) and `ui-sm` (13, `caption` at weight 600) · four widget type steps (`--t-widget-figure` 96 · `--t-widget-word` 48 · `--t-widget-title` 22 · `--t-widget-text` 20) · `--ctl-xs/sm/md/lg` 28 / 36 / 44 / 56 and `--bar` 60.
**Cost:** nine off-scale sizes disappear, so a few controls change by a pixel or two (Button sm 13.5 → 13; rail link 34 → 36; toggle 26 → 28). **Rejected:** type as free numbers (how a system stops being one).

### D3 · Six merges
Intro → `SectionHeader rhythm={false}` · RoadmapItem → `BlockCard state="sleep" progress` · ThemeSwitch → an instance of `Segmented` · `Dots` shared by Carousel and Deck · Quote stands on `Card padding="lg" radius="xl"` · `ContrastReport` moves into the package beside `Catalogue`.
**Cost:** four exports become aliases for one release, then go. Nothing a visitor sees changes.

### D4 · Everything is prefixed
`.glass` → `.noo-glass`, `.glass-N` → `.noo-glass--N`; `.rise-in .pop-in .lift .breathe` → `.noo-rise .noo-pop .noo-lift .noo-breathe`. Old names alias for one release.
**Cost:** one release of duplicate selectors. **What it buys:** the package is safe on a host with a `.lift` of its own.

### D5 · Blocks are apps
`data-block` names an app that ships: `portfolio` (peach) · `design` (blue) · `admin` (lavender). The five speculative names (`editor agents tools writing next`) go; a new block is added when its app exists. The admin's hue follows Admin.md §2.
**Cost:** two `layout.tsx` edits and the removal of `blocks` entries nothing used. **Rejected:** keeping placeholder blocks (a promise, not a token).

### D6 · The admin wears a Tool template (option B)
`Tool` = rail · header · main · inspector · footer bar, as its own template in the package. Main is fluid with 32px gutters and gets its density from `Table`; the header carries the layer eyebrow, the title and the screen's actions; inspector and bar appear only where a screen has a selection or a viewport. `Page` stays a reading layout.
**Cost:** `Table`, `Tabs` and `Segmented` are built first; the admin's nine screens are re-poured with zero utility classes. **Rejected:** A (patch Page — leaves stat cards and utility spacing in place); C (canvas-first — rejected already in Admin.md §3).

### D7 · Three contrast numbers
`--muted` → `oklch(0.52 0.01 60)` · `--pink-ink` → L 0.42 · `--blue-ink` → L 0.40. The showcase's report goes green.
**Cost:** none visible beyond the three colours darkening slightly.

### D8 · One icon set, one weight (from the 2026-09-14 note)
An `Icon` atom — `sm` 16 · `md` 20 · `lg` 24, `--icon-stroke` 1.5, `currentColor`, `aria-hidden` unless labelled. Source: **Phosphor**, regular weight, as an optional peer (`@phosphor-icons/react`), the same shape as `@xyflow/react`; duotone only on a current or loud item. No app imports an icon library directly.
**Cost:** §11.2 rule 1 gains a second named exception. **Rejected:** drawing our own (slow — the reason icons are missing today); Lucide (the generic weight); Hugeicons (licence); Iconoir (no duotone).

### D9 · One Menu (from the 2026-09-14 notes)
A `Menu` organism — column 280 · icon rail 72 · two columns 280 + 240 · floating on the canvas · bottom sheet — replaces `Rail`, `CanvasShell`'s built-in `menu` panel and the NavBar's sheet. Every form shares the column's radii: xl outside, pill items (Bhargav, note 4). The current item is an ink pill (his reference), replacing the Rail's 2px edge bar — an amendment to Admin.md §10. Placeable as a `menu` node; items `{ icon?, label, view | href, badge? }` edited in the inspector.
**Cost:** three hand-built menus are deleted; `Tooltip` is needed for the rail's labels. **Rejected:** keeping Rail and Menu as siblings (two answers to "where am I").

## 5. The release, on disk

```
packages/ui/src/
├─ tokens/        tokens.css · tailwind.css · tokens.ts · theme.ts        layer 1 — values, the hue slot, both themes
├─ atoms/         *.tsx + atoms.css                                       layer 2
├─ molecules/     *.tsx + molecules.css                                   layer 3
├─ organisms/     *.tsx + organisms.css                                   layer 4
├─ templates/     Page · Tool · Document · canvas/ (CanvasShell + nodes)  layer 5 — canvas keeps its own entry
├─ registry/      entries grouped by layer · Catalogue · ContrastReport
└─ css/index.css  @import tokens; @import atoms|molecules|organisms|templates layer(components)

apps/*            layer 6 — compose, never style; data-block names the app
```

`components.css` (76 KB, one file) splits into four by layer. Public exports and class names do not change except where D3–D5 say so, so the three apps keep building through the move.

## 6. Build order — and where it stands

1. ✅ **Tokens — done 2026-09-14.** D1 (the hue slot; 50 ladder rows deleted from the component CSS), D2 (`--s-*`, `--t-*` including `ui`/`ui-sm` and the four widget steps, `--ctl-*`/`--bar`), D5 (blocks are apps: `portfolio · design · admin`; the showcase turned blue, the admin lavender), D7 (the three contrast numbers — the showcase's report reads green), plus `--accent-ink` and the icon tokens. Every component emits `data-hue="accent"` for its default, so nothing inherits a hue it did not ask for. Verified: typecheck, and `pnpm review` green over 84 runs; the Field is 44 and the toggle track 28, as priced.
2. ✅ **Atoms — done 2026-09-14.** The package is on disk as §5 says: `tokens/ atoms/ molecules/ organisms/ templates/`, 172 imports rewritten, public exports unchanged (`./canvas` now resolves to `templates/canvas`). `components.css` is four files by layer, imported in the order they read from each other; the old name is an aggregate. D4: `.noo-glass`, `.noo-glass--N`, `.noo-rise`, `.noo-pop`, `.noo-lift`, `.noo-breathe`, with the bare names aliased for one release. New: `Ground` (and `.noo-graph` is its alias) and `Icon` at `@no-origins/ui/icons` (D8 — Phosphor regular through a curated `glyphs.ts` of 30 names, `@phosphor-icons/react` an optional peer). Two things wait for step 4: `SectionWidget` is exported but `@deprecated`, because `scene.tsx` and the bento fixture still render it; `RegionLabel` is `deprecated` in the registry. `bubble-text` stays as a class (a bubble is not a control; it is the `ui` step at weight 500).
3. ✅ **Molecules — done 2026-09-14.** D3, all six: `SectionHeader` takes `rhythm` and composes Label, Heading and Text (`Intro` is a deprecated alias for `rhythm={false}`); `BlockCard` takes `state="sleep"` and `progress` — the dot goes hollow — and `RoadmapItem` is a deprecated alias; `Segmented` is the control and `ThemeSwitch` an instance of it (`.noo-theme` aliased one release); `Dots` is rendered by Carousel and Deck; `Quote` stands on `Card padding="lg" radius="xl"` (Card gained both) and its unnamed 760 breakpoint is `sm`; `ContrastReport` is exported from `@no-origins/ui/registry` and the showcase imports it from there. New: `FieldShell` (the frame `Field` and `Select` both wear), `Select` (native), `Checkbox`, `Radio` + `RadioGroup`, `Tabs`, `Toast` + `ToastStack`, `Tooltip` — none needed a headless peer; a native control or the ARIA pattern did it. Every one is registered; `RegistryEntry` gained `layer` (atom · molecule · organism) so step 4 can group the catalogue by it, and two palette groups (`controls`, `feedback`). The portfolio's fixtures and roadmap content no longer name either alias. Verified: typecheck, `pnpm build`, `pnpm review` green over 84 runs, element crops of every new entry in light, dark and mobile. Left for step 4: Dialog · Sheet · Tree (and Menu, D9) — the one place an optional Radix/Base UI peer may still earn its keep is Dialog's focus trap.
4. ✅ **Organisms — done 2026-09-14.** `Menu` (D9) in five forms — column 280, rail 72, two columns when the current item declares a `panel` (≥ `lg`, folding into children below), floating 188 for the canvas, sheet below `sm` — with `auto` resolving by viewport; xl outside, pill items, the current item an ink pill, the current child a surface pill. `Rail` is a deprecated alias for the column; the NavBar's small-screen sheet is `Menu form="sheet"`; `CanvasShell` lost its `menu`/`menuLayout` props and renders `menu` scene nodes instead (anchored to a viewport corner with a px inset; a scene with `views` and no menu node gets the default), and the portfolio's scene has one. The rail's labels lift into an ink bubble on hover and focus in CSS alone, so no Tooltip was needed there. New: `Table` (mono headers, hairline rows, tabular numbers), `Dialog` + `Sheet` on a native `<dialog>` (top layer, focus trap, Escape and backdrop from the platform — still no headless peer), `Tree` (the WAI-ARIA pattern, roving tabindex), `Speaker` (blob + bubble; `BlobNode` renders it in document mode). `Catalogue` is grouped by layer with a ground-coloured well and no utility classes; `RegistryEntry.layer` drives it. `SectionWidget` moved into `apps/portfolio/src/components/` (rule 5: it is the portfolio's composition) and its export is gone; `RegionLabel`'s export is gone too (RegionNode keeps the markup). Fixes: MediaCard's stale "no photographs" docstring, the footer's literal 16px. Found on the way: the seven `*-ink on *` pairs failed 4.5:1 in **dark** mode (3.2–4.1) — the dark blocks now carry their own ink tier at L 0.28, and the report reads green in both themes. Verified: typecheck, `pnpm build`, `pnpm review` green over 84 runs, element crops of every new entry in both themes, Tree and Tabs keyboard paths. The admin renders the Menu through `AdminRail` but is not in the sweep; step 5 re-pours it anyway.
5. ✅ **Templates — done 2026-09-14.** `Tool` + `ToolScreen` (D6, option B): the shell holds a `Menu` beside a column; each screen is a 60px header on the ground — layer eyebrow, title, `meta`, `actions` — then `main#main` fluid with 32px gutters, and an `inspector` (320, glass-1, sticky) and a `bar` (glass-2) only where a screen passes them. Below `lg` the inspector drops under main; the Menu keeps its own forms beside the column. `Document`: the 68ch reading column with every element markdown produces set on the ramp (`.noo-prose` aliased). `Container` gained `size="sm"` (480) for the sign-in. **The admin's nine screens are re-poured** with zero utility classes and Tailwind removed from its globals: every screen is a `ToolScreen` whose eyebrow is the rail group's own word (Projects · Systems · Products); stat cards are gone — Tables carry the density (documents, projects, systems, the registry by layer, buckets and files, products), `Steps` carries the publish pipeline, and Systems → Design System renders the package's own `Catalogue` and `ContrastReport` in `Tabs`, which is what Admin.md §13 step 5 asked for. `Page`'s `rail` prop is deprecated. Reviewed by signing in through Mailpit's magic link and screenshotting all nine screens at 1440, 1100, 760 and 412 in both themes, plus the new `/fixtures/tool` route in the sweep (Tool with every region filled, and Document). Found and fixed on the way: below `md` the rail took the whole first grid row and pushed the content off screen; the rail's trailing slot (theme switch, address) cannot fit 72px and is hidden in that form. Design-System.md §9's "not in v1" list and §11's package tree now point here.
6. ✅ **Release — done 2026-09-14.** Steps 1–5 are five commits on `docs/admin-design`, one per step (a narrative split: moved files carry their final content, so the tree is guaranteed green at the release commit, not at each). **Rule 1 is checked**: `packages/ui/.stylelintrc.json` forbids hex and colour functions, literal px font sizes (in `font-size` and the `font` shorthand), and literal radii other than the 1–2px hairline markers, in every layer stylesheet — tokens.css, which defines the values, is the one file it ignores; `pnpm --filter @no-origins/ui lint` runs it after `tsc`. The rule found sixteen literals the hand sweep had missed; eight took a token (the wordmark sizes → `--t-h4`/`--t-lead`, the region label → `--t-h2`, widget chips and tags → `--t-body`/`--t-body-sm`, a 999px → `--r-pill`) and five keep the literal with a stated reason on the line (a mask gradient reads alpha only; the host blob's white and the words over a photograph are not theme colours; a 10px count inside a 16px badge; React Flow's own attribution). Spacing is not in the rule yet — most remaining px are hairlines, dots and SVG geometry, and a rule that allowed those would need a longer allowlist than it is worth today. **`@no-origins/ui` is 0.1.0** via a changeset (minor; `CHANGELOG.md` written; `design` and `admin` joined `portfolio` in the changeset ignore list so an internal bump never renumbers an app). Not published to a registry — that is a separate act. The canvas's Main board reads as the record of the release, not the review.

Steps 1–4 carry no visitor risk: the portfolio reads the same class names throughout. Step 5 changes only the admin. All six shipped on 2026-09-14.

## 7. The canvas, and how to rebuild it

`packages/ui/design/release/` holds the source of the review canvas: `lib.mjs` (helpers; embeds the live package CSS; the icon glyphs), `boards/*.mjs` (one per layer, plus `icons` and `menu` — the two option boards that answer the 2026-09-14 notes), `build.mjs` (assembles `*.dc.html` and counts the tally), `canvas.json` (layout). `node build.mjs` re-renders every sample from the current `packages/ui/src/css/*` — so after a token change the boards show the new system with no edit to the boards. The seeded `no-origins-design-system-release.html` is the published page; it is regenerated, never edited.

Not rendered on the canvas: the blob's refraction pattern and the six illustrations (both need the runtime) and the canvas nodes (React Flow). All three are marked as stand-ins where they appear.
