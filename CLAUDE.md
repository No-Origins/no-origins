# no-origins

pnpm workspace. Apps live in `apps/*` — `portfolio` (bhargav.no-origins.com, :3000), `design` (design.no-origins.com,
the showcase, :3001) and `admin` (admin.no-origins.com, the control surface, :3002), all Next.js 16; the shared design
system is `packages/ui` (`@no-origins/ui`, **2.0.0** since 2026-09-16), consumed from source. Each app has its own
CLAUDE.md / AGENTS.md; read them before editing app code.

`packages/docs` (`@no-origins/docs`) is the knowledge base — every document that decides something, grouped into
`brand/`, `system/`, `apps/` and `archive/`. It builds and exports nothing. `packages/docs/README.md` is the index
and says which documents are live and which describe the deleted 1.0 system. Documents cite each other by bare
filename (`Brand.md §1`, `Atomic.md D11`), never by path, and so do the ~50 source files that reference them —
keep it that way.

`supabase/` is the admin's database — schema, RLS, the allowlist gate and both buckets. `supabase/README.md` says how
to run it and what has been verified. The portfolio and the showcase have no database anywhere near them and that is
deliberate: the live site renders static output, never a query.

## The design system

**Rebuilt on shadcn/ui, 2026-09-16.** Every component of the hand-written 1.0 system — the atoms, molecules,
organisms, templates, the registry, the blob, the patterns, the CSS layers — was deleted. What replaced it:

- **shadcn/ui**, style `radix-sera`, base `radix`, base colour `neutral`, `--radius: 0`, RTL on. 60 components in
  `packages/ui/src/components/*.tsx`, plus `theme-provider.tsx`.
- **One stylesheet**, `packages/ui/src/styles/globals.css` — Tailwind, `tw-animate-css`, `shadcn/tailwind.css`, the
  `:root` / `.dark` tokens and the `@theme inline` map. Every app imports exactly this and nothing else.
- **`cn`** from the `cn` package, re-exported at `@no-origins/ui/lib/utils`.

Import a component by its own path — `@no-origins/ui/components/button` — never from a package root; there is no
barrel and there should not be one. Add components with the CLI, from `packages/ui`, never by hand:

```bash
cd packages/ui && npx shadcn@latest add <name>
```

Fonts stay the host's job: each app declares `--font-sans`, `--font-heading` and `--font-mono`; the package only
reads them. Theme is `next-themes` on the `.dark` class — `d` toggles it in the browser.

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
`grid-editor.tsx` (the tools) and `packages/ui/src/lib/grid-layout.ts` (the model, pure). Reviewed at
`design.no-origins.com/grid`. The rules so far, each one his:

- **One square cell is the unit.** Column AND row counts are decided per breakpoint in `DEFAULT_GRID_CONFIG`, never
  by content. **The grid never scrolls and never overflows the viewport.**
- **`fit`** reconciles square cells with filling a viewport, because at most viewport ratios they disagree:
  `square` keeps cells square and letterboxes the remainder, `stretch` fills the box exactly and lets cells drift
  off-square. **Not decided** — both ship, the page toggles between them.
- **`fill`** decides whether the grid takes the viewport (`100dvh`) or sits in a page as a block.
- **Boxes are placed by coordinate**, 1-based like CSS grid lines. A move is **refused, never reflowed**: landing
  out of bounds, on another box or on a pager cell leaves the box where it was and turns the ghost red.
- **Overflow goes to another PAGE, never off the edge.** A layout is pages; the pager is ‹ in the bottom-left cell
  and › in the bottom-right, each present only when it has somewhere to go, and the packer treats those cells as
  taken. Turning the page flips the boxes edge-on in a wave from the top-left; the field, rulers and pager stay put.
- **The widest authored breakpoint is the truth.** Narrower breakpoints DERIVE by packing each authored page in
  reading order; an authored page break is a hard break; overflow adds pages. Hand-editing a derived breakpoint
  writes its pages down and it stops deriving (`withAuthored`); `withoutAuthored` lets it derive again. The badge
  on `/grid` says which of the three states a breakpoint is in.
- **The field IS the breakpoint.** `metrics.bp` is the config key that produced the field, so an `xl` viewport on a
  config with no `xl` entry is `lg` and shares its layout.
- **The track counts in `DEFAULT_GRID_CONFIG` are defaults, not decisions.** 4x8 on a phone came from convention
  (the smallest useful box is ~70px and 70 goes into 390 four times), and he has asked to decide it himself. Do not
  present a count as settled; the Tracks popover on `/grid` is where he tries alternatives (5x10 keeps the shape).
- **A short landscape box turns the field on its side.** Height < 640 and wider than tall keys on the height and
  swaps cols/rows (base's 4x8 becomes 8x4). Such a field is never authored directly; it always derives. Landscape
  phones are still second-class (41px cells); an orientation-aware config is the real fix if they ever matter.

**Organisms and templates do not exist yet.** They get designed on top of this layer, not ported from 1.0.

## What does not build

The portfolio and the admin still import the deleted system from their page and content files, so neither serves a
page. Their root layouts, stylesheets and wiring are already on the new system; what is left is the pages themselves.
Both are out of the review sweep until they are rebuilt.

## Visual review loop (Playwright)

After any UI change, look at the result before reporting done.

1. `pnpm review` boots the showcase on :3001 (or reuses a running one), visits every route in `DESIGN_ROUTES` in
   `e2e/review.spec.ts` on desktop (1440x900) and mobile (Pixel 7) in both themes, fails on uncaught page errors,
   echoes `console.error` output, and writes full-page screenshots to `e2e/screenshots/<project>/<route>.png`.
2. Open the relevant PNGs with the Read tool and inspect them. Narrow with `pnpm review --project=desktop` or
   `pnpm review -g "/atoms"`.
3. For interactive checks (hover, click, scroll, accessibility tree) use the `playwright` MCP server declared in
   `.mcp.json`. It drives headless Chromium; start `pnpm --filter design dev` first and point it at
   http://localhost:3001. Its screenshots land in `e2e/.mcp/`.

`ROUTES` (the portfolio) is empty and `playwright.config.ts` boots only the showcase — put both back when the
portfolio serves pages again. `probe12` and `growForTool` went with the `Bento` and the `Tool` they policed.

Add new routes to `DESIGN_ROUTES` when you add pages. Screenshots, traces, and reports are gitignored.

**The admin is not in the sweep.** Every one of its routes is behind auth and needs a running Supabase, which
`pnpm review` does not boot. Review it by signing in and looking — see `apps/admin/CLAUDE.md`.
