# no-origins

pnpm workspace. Apps live in `apps/*` — `portfolio` (hiddenstack.no-origins.com, :3000; bhargav.no-origins.com
redirects to it), `design` (design.no-origins.com, the showcase, :3001), `admin` (admin.no-origins.com, the control
surface, :3002) and `engineering` (engineering.no-origins.com, the engineering publish library, :3003), all
Next.js 16; the shared design
system is `packages/ui` (`@no-origins/ui`, **2.0.0** since 2026-09-16), consumed from source. Each app has its own
CLAUDE.md / AGENTS.md; read them before editing app code.

`packages/docs` (`@no-origins/docs`) is the knowledge base — every document that decides something, grouped into
`brand/`, `system/`, `apps/` and `archive/`. It builds and exports nothing. `packages/docs/README.md` is the index
and says which documents are live and which describe the deleted 1.0 system. Documents cite each other by bare
filename (`Brand.md §1`, `Atomic.md D11`), never by path, and so do the ~50 source files that reference them —
keep it that way.

`services/agents` is the agents harness (Brand.md §1, §8): a Mix application on Jido, OTP app `:agents`,
supervised as `Agents.Jido`. It is not a pnpm package. `pnpm-workspace.yaml` matches `apps/*` and `packages/*`
only, and this directory has no `package.json`, so `pnpm build` does not compile it. Run it with
`cd services/agents && mix test`. The Next apps do not import it. A screen for the harness, when one exists,
is a block on the grid that talks to this runtime. Agent lifecycle stays on the BEAM. The swarm does not write
`packages/ui`, the portfolio, or the publish bucket.

`supabase/` is the admin's database — schema, RLS, the allowlist gate and both buckets. `supabase/README.md` says how
to run it and what has been verified. The portfolio and the showcase hold no database key for anything they render:
**the page is static, a component may be live** (Admin.md §0.6, 2026-09-18). A quest's structure is baked at Publish
from the public `publish` bucket and served from the edge, never queried at visit; a component that needs live data
declares it, fetches with the anon key through a per-table RLS policy, and has a fallback state. The showcase and
engineering (Layer A) have no database anywhere near them, and that is deliberate.

## The design system

**Rebuilt on shadcn/ui, 2026-09-16.** Every component of the hand-written 1.0 system — the atoms, molecules,
organisms, templates, the registry, the blob, the patterns, the CSS layers — was deleted. What replaced it:

- **shadcn/ui**, style `radix-sera`, base `radix`, base colour `neutral`, `--radius: 0`, RTL on. 60 components in
  `packages/ui/src/components/*.tsx`, plus `theme-provider.tsx`.
- **One stylesheet**, `packages/ui/src/styles/globals.css` — Tailwind, `tw-animate-css`, `shadcn/tailwind.css`, the
  `:root` / `.dark` tokens and the `@theme inline` map. Every app imports exactly this and nothing else.
- **`cn`** from the `cn` package, re-exported at `@no-origins/ui/lib/utils`.
- **`gsap`** for motion, since 2026-09-21 — his ask. It animates what is **inside** a box (`Progress`'s `animate`
  prop grows the fill; Portfolio.md P11); the grid's page turn keeps its own per-frame writer and `clip-path`, because
  that is one proportion shared by every box and the pager's arrow (Grid.md D27). See `packages/ui/CLAUDE.md` rule 7.

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

Built on `packages/ui/src/components/grid.tsx` (the field), `grid-pages.tsx` (pages, the flip, the pager),
`grid-editor.tsx` (the tools), `grid-frame.tsx` (the viewport a size is previewed in) and
`packages/ui/src/lib/grid-layout.ts` (the model, pure). Reviewed and **designed on** at `design.no-origins.com/composer`
(Grid-v2.md §8 — it was `/grid` until 2026-09-21). **Grid.md is the
document** — a pointer, because the grid document is versioned: **Grid-v2.md is current** (2026-09-21) and Grid-v1.md
is the record of the version before, with a table of what v2 did to each of its rules. Rule numbers run in one
sequence across versions, so `Grid.md D7` is v1's D7 wherever it is written. The code is on v2 since 2026-09-21. The
rules in short, each one his:

- **The cell is decided; the counts derive (D12).** A breakpoint is **two numbers, `cell · gap`** (D13, D15), living
  in `DEFAULT_GRID_CONFIG`. A field is as many whole cells as fit the box it is given, across and down,
  `floor((span − gap) / (cell + gap))`, **rounded down to an even number, never below two (D26, 2026-09-21)** — the
  field's centre is always a grid line, so a centred block is symmetric. Nobody decides cols or rows, and nothing in
  the config or the props names them. **The grid never scrolls and never overflows its box.**
- **The numbers in `DEFAULT_GRID_CONFIG` are decided (D13, 2026-09-21):** `base`/`sm`/`md` 72 · 12, `lg`/`xl`
  60 · 12, and since D29 (2026-09-23) a third per breakpoint — the pager bar's width in cells, 6 everywhere.
  Fingers get 72 because a 1×1 is the touch target; pointers get 60; the gutter is one number so the field has
  one texture. Grid-v2.md §5 has the six principles they were checked against — change a number only against those,
  and record it in D13 (or D29 for the bar). The **Cell** popover on `/composer` steps all three, for trying, not
  for deciding.
- **Cells are square, always** (D9, 2026-09-18: "only square. No stretch"). Trivially now: the side is the decided
  number. There is no `fit` prop, no `GridFit` type and no toggle. Do not reintroduce one.
- **The remainder is centred margin (D14).** What is left after the count is split equally on both sides by the
  flex box; the gutter never widens to absorb it. **The box's padding is the gutter (D15)**: the field sits one gap
  from every edge, so the screen edge is one more grid line. There is no `pad` — not in the config, not as a prop.
- **The grid is always its box.** There is no `fill`: nothing holds a grid as a block in a page — "everything will
  always be on the grid once we are out of the grid editor" — so the grid is the viewport (`h-dvh`), or the frame
  inside a `GridFrame`. A className may give it another height when there is chrome above; never a width.
- **The spacing scale is `GRID_SPACING`, `0 · 4 · 8 · 12 · 16`**, the grid's and not a general spacing system. The
  gap is a step of it; the cell is not on it.
- **A box on the grid is a `Slot`** (`slot.tsx`, **Slots.md**). It holds one component from the **registry**
  (`registry.tsx` — an Input is an Input, never a specimen) or sub-slots on its own cells, and has tokens: `fill` in
  four kinds (`transparent` · `background`, a mask over the grid lines · `muted` · `card`, Grid-v2.md D21), `inset`
  from the spacing scale, `alignX`/`alignY`. **No margin** — the gutter is the margin. Every slot fills its span and
  **clips**: nothing on the grid scrolls, so a component that is cut off is in a slot that is too small. A layout item
  carries `slot`, `component` and `children` (a `GridLayout` on the slot's cells), and `SlotContent` renders any of
  them with no custom `renderItem`. A Card in a slot gets `transparent`, inset 0, stretch, so its own ring shows.
- **Boxes are placed by coordinate**, 1-based like CSS grid lines. A move is **refused, never reflowed**: landing
  out of bounds, on another box or on a pager cell leaves the box where it was and turns the ghost red.
- **Overflow goes to another PAGE, never off the edge (D5).** A layout is pages. **The pager is a navbar on the bottom
  row (D27, 2026-09-21)**: 1×1 cells at the bottom centre of every field, on every page — by default four empty
  `card` slots then ↑ ↓ — a fixture drawn by `GridPages` and `GridEditor` (`grid-pager.tsx`), never a box on a page.
  Its cells are reserved in the model (`pagerCells`): nothing packs or drops there, and a kept page is centred in the
  room above the row. **The bar is a slot and its cells are sub-slots (D29, 2026-09-23)**: its width is a number per
  breakpoint in the config beside `cell · gap`, even and never below two, and the ↑ ↓ pair is one registry molecule
  placed in the bar rather than hardwired to the last two cells — it takes the turn from context, not from props, and
  is offered in the bar only, because an ordinary slot is clipped by the turn. The **Cell** popover steps the width
  in twos, for trying. **The bar is the layout's, one per layout** (`layout.bar`), never a page's — it is drawn on
  every page, so contents that changed between pages would move the arrows under the hand. A bar may leave the arrows
  out and nothing stops it; the default keeps them in the last two cells. **The scroll turns the page, and scrolling UP is forward — the hand's up: fingers moving up
  the trackpad or the screen, a positive `deltaY`, never negated** (↑ is the next page, ↓ the one
  before): a turn is a progress from 0 to 1 that the wheel or a finger drives (a third of the field is one page);
  every box **loses height from its bottom edge, keeping its top**, by exactly the share the arrow fills — one
  proportion, no wave — and at 1 the next page's boxes are revealed from their bottom edge upward. **Only the height
  changes, and the box is CLIPPED, never scaled** (D27): the content inside keeps its exact size and position, so
  nothing is squeezed, narrowed or re-laid-out. Scaling in Y squashed the glyphs and scaling uniformly changed the
  width; both were sent back on 2026-09-21. Do not reintroduce a transform here. Let go short of
  half way and it settles back. The arrows, ← → and the composer's toolbar play the same turn over time, and the
  wheel turns the composer's pages too; the flip is gone. The field, rulers and pager never move. What the bar's
  empty cells hold is now a layout question, not an open one (D29).
- **The theme falls over the field as a sheet of paint (D28, 2026-09-22).** Toggling light/dark — `d`, or the
  showcase's button, both through `useThemeToggle` — is one beat on the outermost grid: one sheet in the NEW theme's
  colours, plain — no cells drawn on it — with a sharp, moving wave of two to five uneven crests for its bottom and
  top edge, falls
  from above until the box is covered, the theme commits underneath, and the sheet dissolves. `GridThemeFlip` in `grid.tsx`, GSAP, one transform; the light tokens sit on `.light` as well as `:root` so
  the sheet wears the theme before the page does. No grid on the page: the switch is instant.
- **Nothing forces a breakpoint (D11).** `resolveField` takes a width and a height and nothing else; no grid
  component takes a `breakpoint` prop. A tool that wants to see another size wraps the grid in a `GridFrame` of that
  size — the reference box to start, the corner dragged anywhere from there, rotatable, scaled down to fit and never
  up. `metrics.scale` carries the frame's scale and pointer maths divides by it. A phone on its side is just a wide
  short box with more columns than rows; v1's transposition rule is gone.
- **`metrics.bp` is the breakpoint that supplied the cell**, walking down the config, not the field: two boxes in
  `lg` can have different fields. It keys the cell (D13) and, for now, the authored pages.
- **Derivation is mobile-first (Grid-v2.md D22).** A breakpoint with no layout of its own derives from the nearest
  authored breakpoint NARROWER than it, else the nearest wider — every other field packs each authored page in reading
  order; an authored page break is a hard break; overflow adds pages. Inside a slot nothing is reserved for a pager.
  **A page that FITS the target field is kept, coordinates verbatim, and centred (D25)**; only a page whose used block
  does not fit is packed. Rulers draw over the top row and left column and take no space (D24). Because counts follow the box, **authored pages carry the shape they were written on**
  (`layout.shapes`, `LEGACY_SHAPES` for anything saved before v2) and are packed whenever the field's shape differs —
  including the same breakpoint at another width. Hand-editing writes the pages down on the current shape
  (`withAuthored(layout, bp, pages, shape)`); `withoutAuthored` lets it derive again. The badge on `/grid` says
  source, authored, derived from, or packed from `cols×rows`. Which field is authored on, and the packer itself, are
  the open questions; do not decide them in code. **Authoring is per breakpoint, on its reference field, in the
  composer (D18)**; a box's span can be set for every breakpoint from the composer's inspector.

**Organisms and templates do not exist yet.** They get designed on top of this layer, not ported from 1.0. **The
showcase itself is on the grid** since 2026-09-21 and **arranged the portfolio's way** since 2026-09-22
(`apps/design/CLAUDE.md`, Portfolio.md P2, P7, P8): every reading page is a `GridPages` of sections whose specimens
carry a span per breakpoint, packed into a centred band above the pager's row, the block centred in the room; no page
in the workspace scrolls. **A page is designed in
the composer** and comes back as code: Compose → arrange → Export → the `GridLayout` block is pasted to the agent, who
puts it on the page (Grid-v2.md D20). There is no design mode and nothing is edited in place. Components go into slots; the palette reads the registry.
**Text is a `Text`** (`text.tsx`, Type.md): seven roles, tone, alignment — an app does not reach for `text-2xl`.

## What builds

**All four apps build** — `pnpm -r build` is green, admin included, since the grid moved to v2 on 2026-09-21. (This
section used to say the admin served no page; that was true until its quests, settings and composer were rebuilt in
the same commit. It stays out of the **review sweep** — every route is behind auth and needs a running Supabase,
which `pnpm review` does not boot — but that is the sweep, not the build.) **The portfolio was rebuilt on the grid on
2026-09-21** (Portfolio.md, `apps/portfolio/CLAUDE.md`): one route, the first screen; its 1.0 pages are parked in
`apps/portfolio/.legacy/`, outside the build.

## Deploying

Four Vercel projects under the `no-origins` team, one per app, each with its **Root Directory** set to `apps/<app>`:
`no-origins` → portfolio, `design`, `admin`, `engineering`. Production is `main`.

**`apps/<app>/vercel.json` is the source of truth, not the dashboard.** A `vercel.json` in a project's root directory
**overrides** the dashboard's fields, so the three commands live in the repo, travel through review, and cannot
quietly drift apart the way they did through 2026-09-22 (three projects, three different install commands). All four
files are byte-identical on purpose:

```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --frozen-lockfile",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- . ../../packages/ui ../../pnpm-lock.yaml"
}
```

`pnpm run build` rather than `pnpm --filter <app> build` so no app name is embedded and renaming a package breaks
nothing. `--frozen-lockfile` so a stale lockfile fails the build loudly instead of resolving something else — the
failure that produced the engineering lockfile PRs.

**The ignore step decides whether a push builds at all.** Vercel runs it from the root directory and reads the exit
code: **0 skips, 1 builds** — which is exactly what `git diff --quiet` returns. The watch list is the app, plus
`packages/ui` because all four consume it, plus the lockfile so a dependency bump rebuilds everything. Verified
against real history: the merge of PR #4 (which touched `packages/ui`) returns 1 for every app, while the
engineering-only commit `a14aa89` returns 0 for portfolio and design and 1 for engineering. If `HEAD^` cannot resolve
the command errors non-zero, so it fails **towards** building.

**Two things the ignore step does not cover.** It only runs for Git-triggered deploys — a manual `vercel --prod`
always builds, whatever changed. And connecting a project does not backfill: the hooks fire on the next push, so a
newly connected project stays on its last manual deployment until something lands on `main`.

A manual deploy, when one is wanted, runs from the repo root. The root `.vercel/project.json` is linked to
`no-origins`; every other project is selected with env vars, and that file is never rewritten:

```bash
vercel --prod                                                   # portfolio
VERCEL_ORG_ID=team_RUVcB0hsMzGRHyzJt1rTqwOd \
VERCEL_PROJECT_ID=prj_mL4BHwxlyyjBzkTGItoyf5amMXPE vercel --prod # design
```

`.vercelignore` at the repo root keeps `e2e/`, `supabase/` and `.claude/` out of the upload; its repo-root entries are
anchored with a leading slash on purpose, because an unanchored `supabase` would also drop
`apps/admin/src/lib/supabase/`.

## Visual review loop (Playwright)

After any UI change, look at the result before reporting done.

1. `pnpm review` boots the portfolio on :3000 and the showcase on :3001 (or reuses running ones), visits every route
   in `ROUTES` and `DESIGN_ROUTES` in `e2e/review.spec.ts` on desktop (1440x900) and mobile (Pixel 7) in both themes, fails on uncaught page errors,
   echoes `console.error` output, and writes full-page screenshots to `e2e/screenshots/<project>/<route>.png`.
2. Open the relevant PNGs with the Read tool and inspect them. Narrow with `pnpm review --project=desktop` or
   `pnpm review -g "/atoms"`.
3. For interactive checks (hover, click, scroll, accessibility tree) use the `playwright` MCP server declared in
   `.mcp.json`. It drives headless Chromium; start `pnpm --filter design dev` first and point it at
   http://localhost:3001. Its screenshots land in `e2e/.mcp/`.

`probe12` and `growForTool` went with the `Bento` and the `Tool` they policed.

Add new routes to `DESIGN_ROUTES` when you add pages. Screenshots, traces, and reports are gitignored.

**The admin is not in the sweep.** Every one of its routes is behind auth and needs a running Supabase, which
`pnpm review` does not boot. Review it by signing in and looking — see `apps/admin/CLAUDE.md`.

**Engineering (Layer A)** is also not in the sweep yet — see `apps/engineering/CLAUDE.md` for the TODO to add
`ENGINEERING_ROUTES` and a `:3003` webServer when convenient.
