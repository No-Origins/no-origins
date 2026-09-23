@AGENTS.md

# apps/design — the showcase

`design.no-origins.com`. It renders the design system and nothing else. The design system is `@no-origins/ui`
and every visual decision belongs there, not here.

```bash
pnpm --filter design dev                 # :3001 (portfolio :3000, admin :3002)
```

## The shape

Four routes, rebuilt 2026-09-16 when the design system was replaced with shadcn/ui, **put on the grid on
2026-09-21** — his rule: "the grid is the viewport", so no page here scrolls — and **arranged the portfolio's way on
2026-09-22** — his ask: "similar to how portfolio is designed, update the design app too." Every page is a `GridPages`
of boxes; overflow goes to the next page, turned by the scroll, the pager's ↑ ↓ on the bottom row, or ← → (Grid.md
D27 — a finger turns it on a phone). **Every page has a Compose button** in the nav (Grid.md D17) that opens the
composer on that page's layout.

What "the portfolio's way" means here (Portfolio.md P2, P5, P7, P8, and `apps/portfolio/CLAUDE.md`):

- **A page is sections, arranged on the field it is shown on.** `src/lib/arrange.ts` is the portfolio's `arrange`,
  copied — every section starts a page and spills onto more; its items pack first-fit in reading order inside a
  **centred band of 4 · 6 · 8 · 12 · 16 columns** (a page may name a narrower one, `band`, when its items tile it —
  the overview's three cards divide 12); the pager's row is reserved; a page's block is **centred in the band and in
  the room** above the pager; an item taller than the room gives up at most a quarter of its rows to stay on a page.
  **One difference: no top row.** The portfolio reserves one on `lg`/`xl` because it has no chrome; the nav is this
  app's chrome, so `TOP_ROWS` is zero everywhere. It is a copy and not a package export on purpose — the packer is
  one of Grid-v2.md's open questions and the package must not decide it; when it is decided, both copies become one.
- **Every specimen has a span per breakpoint** through three presets in `specimen.tsx`: `half(rows)` — two to a row
  from `lg` up (564px on xl, 420 on lg), the whole band under it; `quarter(rows)` — four to a row on xl (276px), two
  on lg and on a tablet; `band(rows, phoneRows)` — as wide as the band. Both widths divide the band, so rows tile. The
  rows are the same at every breakpoint (a touch cell is a fifth taller), except that a tall `half` takes one more on
  a phone. A specimen whose rows wrap on one breakpoint only spreads the preset and sets that breakpoint by hand
  (`Button` and `Input` on `lg`).
- **Each section has a one-row header** — `SectionHeader`, the portfolio's: number and name in small caps, the title
  under them, stepping down a role on a phone.
- **Text is a `Text`** (Type.md T1): the header, the specimen's name and note, the overview's copy. Nothing here
  reaches for `text-2xl`.
- **A specimen gets denser as its slot shrinks, and never clips** (P5): a render function receives its placed item,
  so the `Card` specimen drops its body when the packer has given it a row back. `e2e/.mcp/showcase-clip.mjs`
  (gitignored) turns every page at five sizes and prints every box whose content is cut off — a span is corrected
  from that report, not from a guess. `Carousel` and `Pagination` always report; their own tracks are the overflow.

- `/` — what the system is and which layers exist: one section on a 12-column band — the intro, the three layer
  cards side by side (four columns each, one to a row on a phone), the notes.
- `/atoms` — the 18 indivisible components, one section, each in a **card** slot.
- `/molecules` — the 39 that compose them, one section, **each on the molecule card** — his call, 2026-09-22, when
  three widths read as scattered: "a Responsive card that takes full width in small screens and maybe around 8 cols
  in large." `CARD(rows)` in `molecules.tsx` is one width — the band on a phone and a tablet, two to a row from `lg`
  up, eight columns on `xl` — in a **card** slot like the atoms; only the rows differ, so the page is two columns of
  cards. The five without a specimen are named in a footnote at the end.
- `/composer` — **where a page is designed** (Grid.md §8; it was `/grid` until 2026-09-21). Opened with
  `?from=<route>` it loads that page's content and lets you arrange **slots** (Slots.md) **per breakpoint** in the
  frame (D18): pages, the flip, drag, resize, undo; **Add**, a palette of empty slots, atoms and molecules from the
  registry — drag onto cells for a new slot, onto a slot to put the component in it, click for the first free cell
  (D19, S1); **Slot**, the inspector — fill, inset, alignment, the component's props, Enter, Clear; **double-click** a
  slot to edit its sub-slots where they are, on the slot's own cells (S2), with the rest of the page dimmed to 25% and
  a one-line crumb; Escape or a double-click outside goes up; a selection dims everything else to 60%; **Span**, the selected slot's size at every
  breakpoint, authoring each on its reference field; the
  **Cell** popover (`cell · gap` per breakpoint, D15); the **frame** (D11), snapping to a breakpoint's reference box
  *less the nav*, since that is the box a page's grid really gets; the page opens in the **xl** frame, not fit, because
  authoring is on a reference field (D18); rulers draw over the top row and left column and take no space (D24); and **Export**, two copy blocks (D20) — the
  `GridLayout` to paste to the agent, then the `GridConfig`. Pages turn from ‹ › beside the counter, the pager's
  ↑ ↓ on the field, the wheel over the frame (up is forward, D27), or ← → with nothing selected. Inside a slot the
  pager is not drawn and its cells are not reserved (S5). Its state is per page in `localStorage`
  (`no-origins:composer:v1:<route>`); the reset button starts again from the page as it is.

**A page is data in `src/content/`** — `overview.tsx`, `atoms.tsx`, `molecules.tsx`, each exporting a `PageContent`:
a title, **sections** of `SpecimenItem`s (an id, a **span per breakpoint** in cells, a box variant or `none` for a
component that is its own box, a render function that receives its placed item, `palette: false` for page
furniture), the default variant, an optional narrower `band`, and — once the composer has been over it and its export
pasted back (Grid.md D20) — an authored `layout`, which then wins. `src/content/index.ts` is the model and the
registry the composer reads (`PAGES`, by route; `itemsOf` and `findItem` walk the sections). The `page.tsx` files are
one line each.

Without an authored layout, `SpecimenPages` (`src/components/specimen.tsx`) runs `arrange` **on the field the page is
actually on**, re-arranging whenever the grid reports another shape. Not onto a reference field and then derived: a
derived layout keeps each packed page as a hard break, and a screen one row shorter than the reference put every
page's last row on a page of its own. The composer seeds from the same `arrange` (`seedFrom`), so Compose opens on
exactly what the page shows. **The loop** (D20): open a page → Compose → arrange → Export → paste the `GridLayout`
block to the agent → it goes on the page's content as `layout`. **The span is the one design decision a specimen
carries.** A box clips what does not fit (the grid never scrolls, and neither does anything on it), so a specimen that
is cut off is a specimen whose span is too small — grow it in its section, run the clip probe, look again. `<main>` in
the layout sets no width or padding and every page takes the viewport under the nav. `specimen.tsx`,
`showcase-nav.tsx` and `lib/arrange.ts` are the only things this app owns.

**The nav bar is exactly `3.5rem` tall, border included.** Every page sizes itself with `calc(100dvh - 3.5rem)`, so
`h-14` sits on the `<header>` and not on the div inside it — with the border outside that height the page scrolled
by one pixel.

## What is true here and easy to get wrong

- **The app owns no components.** Everything it renders is imported from `@no-origins/ui/components/*`. If you find
  yourself writing a component here, it belongs in the package.
- **Every page is a client component**, the overview included: `GridPages` measures its box in the browser and a
  render function cannot cross the server boundary. Metadata lives in the layout.
- **Later pages are not in the sweep.** `pnpm review` screenshots page 1 of each route.
  `node e2e/.mcp/showcase-clip.mjs <outdir>` (gitignored) turns every page of the three reading routes at five sizes
  — desktop, laptop, lg, tablet, phone — writes one PNG per page, prints the page count and the scroll size (which
  must equal the viewport), and lists every box whose content is clipped. A turn takes about 0.35s. `e2e/.mcp/turn-review2.mjs <outdir>` drives
  the turn — wheel up part way, let go, all the way, wheel down, the ↑ button, the composer — and prints each state,
  with each box's X and Y scale (X must stay 1). `e2e/.mcp/composer-probe.mjs` drives the
  composer — palette drag, inspector, export — and prints page errors.
- **Five components have no specimen yet** — `chart`, `combobox`, `message-scroller`, `questionnaire` and
  `direction`. Each needs a host that gives it data or a route of its own. They are installed; they are listed at
  the foot of `/molecules` so the omission stays visible.
- **The old showcase is gone.** The token screens, the registry-driven `/components/[layer]` route and the `Tool`
  shell went with the components they documented. The registry does not exist any more: there is no array to read a
  component's name and description out of, so a specimen writes its own note.
- **`/composer` is a working tool, not a specimen.** The toolbar is the page's; every page operation it performs is a
  pure function from `@no-origins/ui/lib/grid-layout` applied to the current breakpoint's pages. Two things it does
  that the package does not: it finds the cell under the pointer for a palette drop by reading the field's box from
  the DOM (`[data-slot="grid-tracks"]`), and it draws the drop ghost — and, inside a slot, the dimmed rest of the page
  and the slot's dashed edge — as `GridItem` children of `GridEditor`. Editing inside a slot is the slot's children
  translated onto the page's field with every cell outside the slot `reserved`, so a drag refuses at the slot's edge;
  a commit translates back and re-authors the slot's `children` on its span. It is the surface the grid system is
  being designed on; expect it to change shape often.
- **There is no database anywhere near this app** and there should not be.

## Reviewing it

`pnpm review` boots this app and sweeps its four routes on desktop and mobile in both themes — they are
`DESIGN_ROUTES` in `e2e/review.spec.ts`; add new ones when you add pages. Then open the PNGs in
`e2e/screenshots/<project>/` and look. Press `d` in the browser to switch theme by hand.
