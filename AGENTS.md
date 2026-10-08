# no-origins

pnpm workspace. Apps live in `apps/*` — `portfolio` (hiddenstack.no-origins.com, :3000; bhargav.no-origins.com
redirects to it), `design` (design.no-origins.com, the showcase, :3001), `admin` (admin.no-origins.com, the control
surface, :3002), `engineering` (engineering.no-origins.com, the engineering publish library, :3003) and `motion`
(motion.no-origins.com, the motion studio, :3004, since 2026-09-27), all Next.js 16; the shared design
system is `packages/ui` (`@no-origins/ui`, **2.0.0** since 2026-09-16), consumed from source. Each app has its own
CLAUDE.md / AGENTS.md; read them before editing app code.

`packages/docs` (`@no-origins/docs`) is the knowledge base — every document that decides something, grouped into
`brand/`, `system/`, `apps/` and `archive/`. It builds and exports nothing. `packages/docs/README.md` is the index
and says which documents are live and which describe the deleted 1.0 system. Documents cite each other by bare
filename (`Brand.md §1`, `Atomic.md D11`), never by path, and so do the ~50 source files that reference them —
keep it that way.

`services/agents` is the agents harness (Brand.md §1, §8): a Mix application on Jido, OTP app `:agents`,
supervised as `Agents.Jido`. It is not a pnpm package. `pnpm-workspace.yaml` matches `apps/*`, `packages/*` and
`supabase` only, and this directory has no `package.json`, so `pnpm build` does not compile it. Run it with
`cd services/agents && mix test`. The Next apps do not import it. A screen for the harness, when one exists,
is a block on the grid that talks to this runtime. Agent lifecycle stays on the BEAM. The swarm does not write
`packages/ui`, the portfolio, or the publish bucket.

`supabase/` is the admin's database — schema, RLS, the allowlist gate and both buckets. `supabase/README.md` says how
to run it and what has been verified. The portfolio and the showcase hold no database key for anything they render:
**the page is static, a component may be live** (Admin.md §0.6, 2026-09-18). A page's structure is baked at Publish
from the public `publish` bucket and served from the edge, never queried at visit; a component that needs live data
declares it, fetches with the anon key through a per-table RLS policy, and has a fallback state. The showcase and
engineering (Layer A) have no database anywhere near them, and that is deliberate.

## The design system

**Rebuilt on shadcn/ui, 2026-09-16.** Every component of the hand-written 1.0 system — the atoms, molecules,
organisms, templates, the registry, the blob, the patterns, the CSS layers — was deleted. What replaced it:

- **shadcn/ui**, style `radix-sera`, base `radix`, base colour `neutral`, RTL on, and **one radius, half the grid's
  cell** (`--radius`, `rounded-lg`; Grid.md D39 — it was `0` until 2026-09-26). 60 components in
  `packages/ui/src/components/*.tsx`, plus `theme-provider.tsx`.
- **The accents are lime and violet (2026-09-27, his, set in the portfolio's accent jig).** `--primary` is `--lime`
  and `--secondary` is `--violet`, each with its own ink; the grey of hover and of being active (`--muted`) is lime at
  14% mixed over the page, and a menu's highlighted item (`--accent`) lime at 4% over the popover — mixed, never
  translucent. The rest of the palette is still shadcn's neutral. `text-primary` is lime text, about 1.3 : 1 on white,
  so it is not for text on the light theme. The jig (`?jig` on the portfolio in development, `jig.tsx`) stays, to be
  showcased in experiments; its "Neutral" puts shadcn's greys back.
- **One stylesheet**, `packages/ui/src/styles/globals.css` — Tailwind, `tw-animate-css`, `shadcn/tailwind.css`, the
  `:root` / `.dark` tokens and the `@theme inline` map. Every app imports exactly this and nothing else.
- **`cn`** from the `cn` package, re-exported at `@no-origins/ui/lib/utils`.
- **`gsap`** for motion, since 2026-09-21 — his ask. It animates what is **inside** a box (`Progress`'s `animate`
  prop grows the fill; Portfolio.md P11) and plays the grid's loader (D48); the grid's page turn keeps its own
  per-frame writer for the pager's arrow (Grid.md D27). See `packages/ui/CLAUDE.md` rule 7.
- **Motion is tokens (Motion.md, 2026-09-27).** Every number a component moves by is a `--motion-*` custom property
  in globals.css, one family a group — surface, panel, state, disclose, grow — and components read them, CSS through
  `motion-surface`/`motion-panel` and token-valued utilities, script through `@no-origins/ui/lib/motion`. The values
  are the old defaults (shadcn's, Tailwind's, tw-animate's); none is his yet. Motion is designed in **the motion
  studio**, `apps/motion`: a transparent stage at the centre of the grid, jigs as slots around it, and the CSS lines
  to commit handed back (M7). **Its bench holds only what he names** (M9). The first is movement, how one-cell
  elements move when one grows, whose model is `@no-origins/ui/lib/cell-motion`. **Movement is decided** (his
  settings, 2026-09-27, the `--motion-move-*` tokens), the first motion in the system that is his, and **the
  portfolio's tech column plays it** (a hovered or selected mark grows to spell its name), as does the numbered pager bar
  (the page grows to spell its title, Grid.md D47), through `useCellMotion`
  (`@no-origins/ui/hooks/use-cell-motion`), the same hook the studio's stage plays through. **Loading is decided too**
  (his settings, the same night, the `--motion-load-*` tokens, `@no-origins/ui/lib/load-motion`): a square of dashed
  lime rings on the centre, one a section, turning, each going to its section as movement's dot and opening. **The
  grid loads every page with it** (Grid.md D48): the intro and every turn, where the ripple was. **Enter · exit** (M11, 2026-09-27), movement's first primitive (one
  cell's element coming in and going out), is on the bench and not decided. **Focus** (M13, 2026-09-28, `@no-origins/ui/lib/focus-motion`, `useFocusMotion`), a card in focus and the page
  blurring round it, least at the card and rising in rings out from it, a ripple in, **is decided too** (his settings,
  2026-09-28, the `--motion-focus-*` tokens): the portfolio's cards play it (Portfolio.md P18), the one blur anywhere
  since D48, his ask. Never write a literal
  `duration-*` or `zoom-in-95` on a component again: name the token. The grid's own motion is not on the layer yet (Motion.md §5).

Import a component by its own path — `@no-origins/ui/components/button` — never from a package root; there is no
barrel and there should not be one. Add components with the CLI, from `packages/ui`, never by hand:

```bash
cd packages/ui && npx shadcn@latest add <name>
```

Fonts stay the host's job: each app declares `--font-sans`, `--font-heading` and `--font-mono`; the package only
reads them. Theme is `next-themes` on the `.dark` class — `d` toggles it in the browser, through the grid's flip (D28) when a
grid is on the page; never call `setTheme` for a toggle, call `useThemeToggle`.

**Build UI only from the design system.** Every visible element in every app is composed from `@no-origins/ui`
components — never a hand-rolled control, a raw styled element standing in for one, or a component copied in from
another library or the web. If the design system lacks a component you need, do not improvise one: add it with the
shadcn CLI (`cd packages/ui && npx shadcn@latest add <name>`) so it lands in the system, or **stop and ask first**
— either Bhargav asks for the exception, or you propose one and he approves it before you write it. An app may
still *compose* system components into an app-specific island (Admin.md §10: "an admin-only component is a fork of
the design system wearing a different folder name"); what it may not do is invent primitives outside the system.
Layout utilities (Tailwind flex/grid/spacing) are not components and are fine.

**The old design docs describe a system that no longer exists.** `packages/docs/system/` (Design-System.md,
Atomic.md, Patterns.md) and `packages/docs/archive/Scene-Schema.md` were written for 1.0 and have not been
rewritten. Do not follow them for component work — read them for the reasoning, not the API. Brand.md and
Character.md are upstream of components and still stand.

## The grid — the base layout

Built on `packages/ui/src/components/grid.tsx` (the field), `grid-pages.tsx` (pages, the turn, the pager),
`grid-pager.tsx` (the bar) and `packages/ui/src/lib/grid-layout.ts` (the model, pure). **The grid renders; nothing
edits it** (Grid-v2.md D30, 2026-09-23): the composer at `design.no-origins.com/composer`, the admin's compose
dashboard, `GridEditor` and `GridFrame` were removed together — his words, "remove the Composer feature completely and
all the dead code". A layout is written in code or arranged at runtime from spans. **Grid.md is the
document** — a pointer, because the grid document is versioned: **Grid-v2.md is current** (2026-09-21) and Grid-v1.md
is the record of the version before, with a table of what v2 did to each of its rules. Rule numbers run in one
sequence across versions, so `Grid.md D7` is v1's D7 wherever it is written. The code is on v2 since 2026-09-21. The
rules in short, each one his:

- **The cell is decided; the counts derive (D12).** A breakpoint is **two numbers, `cell · gap`** (D13, D15), living
  in `DEFAULT_GRID_CONFIG`. A field is as many whole cells as fit the box it is given, across and down,
  `floor((span − gap) / (cell + gap))`, **rounded down to an even number, never below two (D26, 2026-09-21)** — the
  field's centre is always a grid line, so a centred block is symmetric. **And never fewer than six across (D33,
  2026-09-25):** where the decided cell gives fewer — every phone — the count is held at six and the cell derives from
  the width (51px on a 390). Nobody decides cols or rows, and nothing in
  the config or the props names them. **The grid never scrolls and never overflows its box.**
- **The numbers in `DEFAULT_GRID_CONFIG` are decided (D13, 2026-09-21):** `base`/`sm`/`md` 72 · 12, `lg`/`xl`
  60 · 12, and since D29 (2026-09-23) a third per breakpoint — the pager bar's width in cells, 6 everywhere.
  Fingers get 72 because a 1×1 is the touch target; pointers get 60; the gutter is one number so the field has
  one texture. Grid-v2.md §5 has the six principles they were checked against — change a number only against those,
  and record it in D13 (or D29 for the bar).
- **Cells are square, always** (D9, 2026-09-18: "only square. No stretch"). Trivially now: the side is the decided
  number. There is no `fit` prop, no `GridFit` type and no toggle. Do not reintroduce one.
- **Every corner is one cell's circle (D39, 2026-09-26, his: "hundred percent border radius I mean like circular
  design").** `--radius` is half the cell — `Grid` writes its measured `--grid-cell` on its root; off the grid (a
  portal, an app with no grid) globals.css reckons it from the viewport with D13's and D33's numbers — and every box
  takes it as `rounded-lg`. The browser shrinks a corner to fit, so a 1×1 is a circle, a box a cell tall a pill, a
  bigger one a cell's curve at each corner. One radius: never a second one, never `rounded-none` on a box (his two exceptions, D39: a fill inside a box meeting a divider takes 4px there — the portfolio's work tabs; and a picture inset in a box takes the box's radius less its inset — the portfolio's project cards, 2026-09-28). **Lines stay
  straight** — the underline fields, separators, table rows, a turned-square arrow tip — and a `transparent` slot is
  not rounded (it has no edge; it would only cut what it holds). **A cell is a circle (D40)**: the painter draws each
  cell's dashes as a ring and the pointer lights a cell only inside its circle. (The front cut a cell's disc first and
  the rest of its tile `LACE_MS` later — the lace — in the intro and the wash, until D48 took both out.) D9's cell is
  still a square box; the circle is drawn in it.
- **The remainder is centred margin (D14).** What is left after the count is split equally on both sides by the
  flex box; the gutter never widens to absorb it. **The box's padding is the gutter (D15)**: the field sits one gap
  from every edge, so the screen edge is one more grid line. There is no `pad` — not in the config, not as a prop.
- **The grid is always its box.** There is no `fill`: nothing holds a grid as a block in a page — "everything will
  always be on the grid once we are out of the grid editor" — so the grid is the viewport (`h-dvh`). A className may
  give it another height when there is chrome above; never a width.
- **The spacing scale is `GRID_SPACING`, `0 · 4 · 8 · 12 · 16`**, the grid's and not a general spacing system. The
  gap is a step of it and a slot's `inset` is typed from it (`SlotInset`); the cell is not on it.
- **A box on the grid is a `Slot`** (`slot.tsx`, **Slots.md**). It holds one component from the **registry**
  (`registry.tsx`, drawn by `Placed` — since the composer went it holds one entry, the pager's arrows) or sub-slots on
  its own cells, and has tokens: `fill` in
  four kinds (`transparent` · `background`, a mask over the grid lines · `muted` · `card`, Grid-v2.md D21), `inset`
  from the spacing scale, `alignX`/`alignY`. **No margin** — the gutter is the margin. Every slot fills its span and
  **clips**: nothing on the grid scrolls, so a component that is cut off is in a slot that is too small. A layout item
  carries `slot`, `component` and `children` (a `GridLayout` on the slot's cells), and `SlotContent` renders any of
  them with no custom `renderItem`. A Card in a slot gets `transparent`, inset 0, stretch, so its own border shows.
- **Boxes are placed by coordinate**, 1-based like CSS grid lines.
- **Overflow goes to another PAGE, never off the edge (D5).** A layout is pages. **The pager is a navbar on the bottom
  row (D27, 2026-09-21)**: 1×1 cells at the bottom centre of every field, on every page — by default four empty
  `card` slots then ↑ ↓ — a fixture drawn by `GridPages` (`grid-pager.tsx`), never a box on a page.
  Its cells are reserved in the model (`pagerCells`): nothing packs there, and a kept page is centred in the
  room above the row. **The bar is a slot and its cells are sub-slots (D29, 2026-09-23)**: its width is a number per
  breakpoint in the config beside `cell · gap`, even and never below two, and the ↑ ↓ pair is one registry molecule
  placed in the bar rather than hardwired to the last two cells — it takes the turn from context, not from props, and
  belongs in the bar only, because an ordinary slot is faded away by the turn. **The bar is the layout's, one per layout** (`layout.bar`), never a page's — it is drawn on
  every page, so contents that changed between pages would move the arrows under the hand. A bar may leave the arrows
  out and nothing stops it; the default keeps them in the last two cells. **The scroll turns the page, and scrolling UP is forward — the hand's up: fingers moving up
  the trackpad or the screen, a positive `deltaY`, never negated** (↑ is the next page, ↓ the one
  before): a turn is a progress from 0 to 1 that the wheel or a finger drives (a third of the field is one page), and
  **only the arrow follows the hand** — it fills by that share; let go short of half way and it settles back. **The
  boxes do not shrink (D37, 2026-09-25, his: "let's not shrink the cards")**: when the turn commits, the page **fades
  away** over `TURN_MS` (160ms), opacity only, and the next page is put on the field and **loaded by the loader**
  (D48, below). Every `GridPages` turns this way. Until D48 the ripple washed the page away, every box cut cell by cell
  as its front crossed it (`washAway`, gone). Nothing in a box is ever squeezed, scaled or re-laid-out: D27's
  clip-by-height went for the wash, and scaling (in Y, then uniformly) was sent back on 2026-09-21 — do not
  reintroduce a transform or a shrink here. **A hand that goes on scrolling goes on turning (D35, 2026-09-25)**: only a fling's
  decaying tail is ignored after a turn, never the hand (`readWheel`), a notch glides rather than jumps, and the turn
  renders no card — the phase is `data-turn` on the tracks (`idle · drive · relax · wash · in`), the arrow's fill on
  the bar. The arrows, ← → and ↑ ↓ play the same turn — the ↓ key forward and ↑ back, pressing the arrow that wears
  that glyph (D42, 2026-09-26), a key a focused component took or a modified one left alone; the flip is gone.
  **Where a page opts in with `useReadingFocus` (D45, 2026-09-27 — the portfolio), Tab and the arrows move focus in
  reading order**, left to right and top to bottom as the boxes stand — **like a game controller's, the arrows never
  turn that page** (a `GridPages` that opts in takes `keyboard={false}`; the portfolio has no pages to turn since
  Portfolio.md P15). The field
  and the pager never move. What the bar's
  empty cells hold is now a layout question, not an open one (D29). **A bar may number its pages (D36, 2026-09-25)**:
  `numberedPagerBar` puts back (↑) on the first cell, forward (↓) on the last and a page number on every cell
  between, from the registry's `pager-arrow` and `pager-page`. **Since D46 and D47 (2026-09-27, his) the page on the field
  is grown to two cells showing its number and title** (a page's optional `title` on `GridPage`): on the bar's second
  and third cells for the first page, the middle two for a page with pages on both sides, and the fourth and fifth for
  the last. The pages between the arrows are one block (`pager-pages`) that **plays movement** as the page changes, and
  a number turns straight to its page. The motion studio draws it. The portfolio's bar was this one
  (Portfolio.md P14) until it became one page on a `Grid`, with no bar, on 2026-09-27 (P15); D27's is still the default.
- **The theme falls over the field as a sheet of paint (D28, 2026-09-22).** Toggling light/dark — `d`, or the
  showcase's button, both through `useThemeToggle` — is one beat on the outermost grid: one sheet in the NEW theme's
  colours, plain — no cells drawn on it — with a sharp, moving wave of two to five uneven crests for its bottom and
  top edge, falls
  from above until the box is covered, the theme commits underneath, and the sheet dissolves. `GridThemeFlip` in `grid.tsx`, GSAP, one transform; the light tokens sit on `.light` as well as `:root` so
  the sheet wears the theme before the page does. No grid on the page: the switch is instant.
- **Every page is loaded by the loader (D48, 2026-09-27, his: "remove the ripple effect intro and page transitions and
  replace with the current loaders that we created").** The loader is loading, his motion (Motion.md M10), on the
  page's own boxes (not the pager's) — boxes with one `data-load-section` are one section, one ring, and an element
  inside a box marked `data-load-box` is a section of its own (2026-09-28, his: "I want all the cards to have one
  circle"; the portfolio marks every card, label, button and mark, 37 rings on a desktop). A square of dashed lime rings stands on the field's centre, one ring a section, as
  near square as it can be and a row taller rather than wider (ten stand as 3, 3, 3, 1, his), in reading order, turning. When the
  page is ready every ring is pressed to 0.5 at once, its dashes closing into a full circle as it shrinks (his,
  2026-09-28), goes straight to its box's nearest cell in one move of movement's dot, lands with the rest, is released into a plain border and opens out to its box, the box shown inside it.
  **The intro** (`intro` on `Grid` or `GridPages`; the portfolio has it, D31) is page 1's load: held back from the
  server's first paint, the loader turns for 2 s at the least (his) and until the page is ready (fonts, window load,
  images on the field, 3 s at most), the pager comes up from its bottom edge as page 1 opens, and nothing turns a page
  meanwhile. Once per document load, none under reduced motion. Each ring goes to its box's top-left cell, and the box
  opens from it; the turn is his chase. **A turn** loads the page it puts on the field only if its boxes have images
  still to come; a page with nothing to load shows at once and fades in (his: "directly render the page"). `useGridLoad`
  and `GridLoader` in `grid.tsx` play it through `useLoadMotion`, the hook and painters the motion studio uses;
  globals.css holds a loading page's boxes (`data-loading`). **The ripple is gone**: the grid drawing itself in with a
  circle-tipped front and glowing lime and violet lines, and drawing itself again while the page loaded (D31's
  drawing, D44), the ripple between pages (D32) and its wash (D37), and the `ripple` prop. **The field is painted
  (D38, 2026-09-25)**: the overlay's dashes and the pointer's cell are canvases drawn by one painter
  (`lib/grid-field.ts`), in a worker where the browser can hand it a canvas, so the page's own loading on the main
  thread cannot stall it. They were ~1,300 elements. `gridFieldPainter` must stay self-contained — the worker runs it
  from its own source text. It still carries the intro's passes and reveal, which nothing sends any more.
  **The turn's custom properties are written on the pager's bar, not the grid's root or tracks**: they inherit, and on
  the root they restyled every element in the grid every frame of a turn; on the tracks, every box (until D37).
- **The pointer is a violet ring, and the cell under it is lit (D34, 2026-09-25).** `cursor` on `Grid` or `GridPages`;
  the portfolio has it. A 24px ring with a violet line, filled violet while pressed (**D43, 2026-09-26**, his: "change the
  cursor color to violet"; it was lime) — **the system's cursor drawn from an image**
  (globals.css), never a div moved on every pointer move: that cost a whole-page layerize a move and trailed the hand. The cell the pointer is on turns its **dashes** violet too (the default dashes, not a solid line — his, the same day; lime until D43)
  — its ring's since D40 — and fades back over 500ms when left;
  the gutter lights nothing, nor a square's corners outside its circle. Found from the field's numbers and sent to the field's painter (D38), never React state.
  Mouse and pen only; a phone keeps its own. **No glow round the pointer**: D41 had the cells round a moving pointer
  glow, and he withdrew it the same day (2026-09-26, "I did not like the glow effect") — do not bring it back. The
  intro's lines were the one blur kept, until they went with the drawing (D48): the system keeps none.
- **Nothing forces a breakpoint (D11).** `resolveField` takes a width and a height and nothing else; no grid
  component takes a `breakpoint` prop. To see another size, give the grid a box of that size — a browser window, a
  device in the review sweep. `GRID_REFERENCE_BOX` (`grid.tsx`) is each breakpoint's reference size, which a page
  assumes for its first frame before the grid has measured. A phone on its side is just a wide short box with more
  columns than rows; v1's transposition rule is gone.
- **`metrics.bp` is the breakpoint that supplied the cell**, walking down the config, not the field: two boxes in
  `lg` can have different fields. It keys the cell (D13) and, for now, the authored pages.
- **Derivation is mobile-first (Grid-v2.md D22).** A breakpoint with no layout of its own derives from the nearest
  authored breakpoint NARROWER than it, else the nearest wider — every other field packs each authored page in reading
  order; an authored page break is a hard break; overflow adds pages. Inside a slot nothing is reserved for a pager.
  **A page that FITS the target field is kept, coordinates verbatim, and centred (D25)**; only a page whose used block
  does not fit is packed. Because counts follow the box, **authored pages carry the shape they were written on**
  (`layout.shapes`, `LEGACY_SHAPES` for anything saved before v2) and are packed whenever the field's shape differs —
  including the same breakpoint at another width. Which field is authored on, and the packer itself, are the open
  questions; do not decide them in code. The one authored layout left is the admin home's, written in code.

**Organisms and templates do not exist yet.** They get designed on top of this layer, not ported from 1.0. **The
showcase itself is on the grid** since 2026-09-21 and **arranged the portfolio's way** since 2026-09-22
(`apps/design/CLAUDE.md`, Portfolio.md P2, P7, P8): every reading page is a `GridPages` of sections whose specimens
carry a span per breakpoint, packed into a centred band above the pager's row, the block centred in the room; no page
in the workspace scrolls. **A page is content data**: sections of items, each with a span per breakpoint and a render
function, arranged on the field it is shown on. To change a page, change its data. There is no design mode, no
composer and nothing is edited in place.
**Text is a `Text`** (`text.tsx`, Type.md): seven roles, tone, alignment — an app does not reach for `text-2xl`.

## What builds

**All five apps build** — `pnpm -r build` is green, and CI's **Build** job builds all five on every PR. The admin
builds with no Supabase keys, since its clients are made per request; it stays out of the **review sweep** because
every route is behind auth and needs a running Supabase, which `pnpm review` does not boot. **Quests are gone**
(Admin.md §0.7, 2026-09-23): the admin is sign-in, a home of three cards and `/settings`. **The portfolio was rebuilt on
the grid on 2026-09-21** (Portfolio.md, `apps/portfolio/CLAUDE.md`): one route, the first screen — and since 2026-09-27
one page, a `Grid` with no pager, the rest of the site in the room the first screen leaves (P15). Its 1.0 pages, parked
in `.legacy/`, were deleted on 2026-09-23 — git history keeps them.

## Deploying

Four Vercel projects under the `no-origins` team, one per app, each with its **Root Directory** set to `apps/<app>`:
`no-origins` → portfolio, `design`, `admin`, `engineering`. Production is `main`. **The motion studio has no project
yet** (2026-09-27): creating it, with root directory `apps/motion` and the `motion.no-origins.com` domain, is his step
in the dashboard. Its `vercel.json` is already the same file.

**`apps/<app>/vercel.json` is the source of truth, not the dashboard.** A `vercel.json` in a project's root directory
**overrides** the dashboard's fields, so the commands live in the repo, travel through review, and cannot quietly
drift apart the way they did through 2026-09-22 (three projects, three different install commands). The dashboards
carry the same commands since 2026-09-23; if they drift again, the file still wins. All five files are byte-identical on purpose:

```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

`pnpm run build` rather than `pnpm --filter <app> build` so no app name is embedded and renaming a package breaks
nothing. `--frozen-lockfile` so a stale lockfile fails the build loudly instead of resolving something else — the
failure that produced the engineering lockfile PRs.

**Which apps a push builds is Vercel's call, not a command's.** All eight projects have *Skip deployments for
unaffected projects* on (`enableAffectedProjectsDeployments` in the project API): Vercel reads the pnpm workspace
graph and compares against the last deployed commit. A project builds when its own folder changed, when a workspace
package it depends on changed — `packages/ui` rebuilds all eight, `packages/auth` the admin, motion, Orbit and Home,
`packages/docs` none — or when a lockfile change moved its own dependencies. PR #5 and PR #7 deployed engineering and
nothing else, #27 the admin and nothing else, #29 (documents only) nothing. A skipped project shows as *Canceled*,
"the commit didn't affect this project", not as a missing deployment. **A change outside the workspace is global and
rebuilds all eight** — Vercel's rule for anything `pnpm-workspace.yaml` does not match: the root's own files
(`CLAUDE.md`, `AGENTS.md`, `playwright.config.ts`), `.github/`, `.changeset/`, `e2e/`, `services/`. Until 2026-10-08
`supabase/` was one of them, so nearly every Access PR, because it carried a migration, rebuilt all eight apps
whatever else it touched (#26, #30, #31), and the builds run one at a time: #31's admin waited in the queue while
status, which #31 did not touch, built ahead of it. Since then `supabase/` is a workspace package no app depends on,
and a change there rebuilds nothing. A new top-level folder that no app reads costs the same until it is one. **There
is no `ignoreCommand`, and there should not be one.** One was written on 2026-09-23 (`git diff --quiet HEAD^ HEAD -- .
../../packages/ui ../../pnpm-lock.yaml`) and taken out the same day: it compared only a push's last commit, so a push
whose `packages/ui` commit was not the tip skipped every app it touched, and it rebuilt all four on any lockfile
change where the graph rebuilds only the apps whose dependencies moved.

**Two things the skip does not cover.** It only applies to Git-triggered deploys — a manual `vercel --prod` always
builds, whatever changed. And connecting a project does not backfill: the hooks fire on the next push, so a newly
connected project stays on its last manual deployment until something lands on `main`.

**CI is `.github/workflows/ci.yml`**, on every pull request and every push to `main`, and **branch protection on
`main` requires all four of its jobs**, admins included — nothing reaches production without them:

| Job | What it runs |
|---|---|
| **Typecheck and lint** | frozen install, `pnpm -r typecheck` (`packages/ui` on its own too), `pnpm -r lint` — `next build` stopped linting in Next 16 |
| **Build** | `pnpm -r build`, all eight apps, with no env — the one build check a merge can require |
| **Visual review** | `pnpm review` (below); the screenshots and report are uploaded as the run's `review-screenshots` artifact |
| **Agents tests** | `mix test` in `services/agents`, which no Vercel project builds |

Warnings pass; errors fail. Vercel's own checks are not required and cannot be: it skips an app a change does not
touch, and a skipped app reports no status, so a required Vercel check would hold every such PR open. **Node is 24
everywhere**: `.nvmrc` for fnm and CI, `engines.node` (`24.x`) in the root and every app's `package.json` for Vercel,
which reads it from the project's root directory and prefers it to the dashboard.

A manual deploy, when one is wanted, runs from the repo root. The root `.vercel/project.json` is linked to
`no-origins`; every other project is selected with env vars, and that file is never rewritten. **The IDs are not in
the repo**, which is public: they are in `.private/vercel.env`, gitignored, with a README saying what else belongs
there. A fresh clone has no `.private/` — copy it across.

```bash
. .private/vercel.env                                           # the team ID and VERCEL_PROJECT_ID_<APP> for each
vercel --prod                                                   # portfolio
VERCEL_ORG_ID=$VERCEL_ORG_ID VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID_DESIGN vercel --prod # design; _ADMIN, _ENGINEERING
```

`.vercelignore` at the repo root keeps `e2e/`, `supabase/`, `services/`, `.claude/` and `.private/` out of the upload; its repo-root entries are
anchored with a leading slash on purpose, because an unanchored `supabase` would also drop
`apps/admin/src/lib/supabase/`.

## Visual review loop (Playwright)

After any UI change, look at the result before reporting done.

1. `pnpm review` boots the portfolio on :3000, the showcase on :3001, engineering on :3003 and the motion studio on
   :3004 (or reuses running ones), visits every route in `ROUTES`, `DESIGN_ROUTES`, `ENGINEERING_ROUTES` and
   `MOTION_ROUTES` in `e2e/review.spec.ts` on desktop
   (1440x900) and mobile (Pixel 7) in both themes, waits for a grid's intro (D31) to hand over, fails on a route that
   answers 400+ or throws, echoes
   `console.error` output, and writes full-page screenshots to `e2e/screenshots/<project>/<route>.png`. CI runs the
   same sweep and uploads the screenshots.
2. Open the relevant PNGs with the Read tool and inspect them. Narrow with `pnpm review --project=desktop` or
   `pnpm review -g "/atoms"`.
3. For interactive checks (hover, click, scroll, accessibility tree) use the `playwright` MCP server declared in
   `.mcp.json`. It drives headless Chromium; start `pnpm --filter design dev` first and point it at
   http://localhost:3001. Its screenshots land in `e2e/.mcp/`.

`probe12` and `growForTool` went with the `Bento` and the `Tool` they policed.

Add new routes to the app's list in `e2e/review.spec.ts` when you add pages. Screenshots, traces, and reports are
gitignored.

**The admin is not in the sweep.** Every one of its routes is behind auth and needs a running Supabase, which
`pnpm review` does not boot. Review it by signing in and looking — see `apps/admin/CLAUDE.md`.
