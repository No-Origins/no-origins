@AGENTS.md

# apps/design — the showcase

`design.no-origins.com`. It renders the design system and nothing else. The design system is `@no-origins/ui`
and every visual decision belongs there, not here.

```bash
pnpm --filter design dev                 # :3001 (portfolio :3000, admin :3002)
```

## The shape

Three routes, rebuilt 2026-09-16 when the design system was replaced with shadcn/ui, **put on the grid on
2026-09-21** — his rule: "the grid is the viewport", so no page here scrolls — and **arranged the portfolio's way on
2026-09-22** — his ask: "similar to how portfolio is designed, update the design app too." Every page is a `GridPages`
of boxes; overflow goes to the next page, turned by the scroll, the pager's ↑ ↓ on the bottom row, or ← → (Grid.md
D27 — a finger turns it on a phone). The fourth route, `/composer`, was removed on 2026-09-23 with the Compose button
on every page (Grid-v2.md D30): his words, "remove the Composer feature completely and all the dead code".

What "the portfolio's way" means here (Portfolio.md P2, P5, P7, P8, and `apps/portfolio/CLAUDE.md`):

- **A page is sections, arranged on the field it is shown on.** `src/lib/arrange.ts` is the portfolio's `arrange`,
  copied — every section starts a page and spills onto more; its items pack first-fit in reading order inside a
  **centred band of 4 · 6 · 8 · 12 · 16 columns** (a page may name a narrower one, `band`, when its items tile it —
  the overview's two cards divide 12); the pager's row is reserved; a page's block is **centred in the band and in
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

- `/` — what the system is and which layers exist: one section on a 12-column band — the intro, the two layer
  cards side by side (six columns each, one to a row on a phone), the notes.
- `/atoms` — the 18 indivisible components, one section, each in a **card** slot.
- `/molecules` — the 39 that compose them, one section, **each on the molecule card** — his call, 2026-09-22, when
  three widths read as scattered: "a Responsive card that takes full width in small screens and maybe around 8 cols
  in large." `CARD(rows)` in `molecules.tsx` is one width — the band on a phone and a tablet, two to a row from `lg`
  up, eight columns on `xl` — in a **card** slot like the atoms; only the rows differ, so the page is two columns of
  cards. The five without a specimen are named in a footnote at the end.

**A page is data in `src/content/`** — `overview.tsx`, `atoms.tsx`, `molecules.tsx`, each exporting a `PageContent`:
a title, **sections** of `SpecimenItem`s (an id, a **span per breakpoint** in cells, a box variant or `none` for a
component that is its own box, a render function that receives its placed item), the default variant and an optional
narrower `band`. `src/content/index.ts` is the model (`findItem` walks the sections). The `page.tsx` files are one line
each.

`SpecimenPages` (`src/components/specimen.tsx`) runs `arrange` **on the field the page is actually on**,
re-arranging whenever the grid reports another shape. Not onto a reference field and then derived: a derived layout
keeps each packed page as a hard break, and a screen one row shorter than the reference put every page's last row on
a page of its own. **The span is the one design decision a specimen carries**, and changing a page means changing its
data — there is no composer to arrange it in. A box clips what does not fit (the grid never scrolls, and neither does anything on it), so a specimen that
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
  the turn — wheel up part way, let go, all the way, wheel down, the ↑ button — and prints each state, with each
  box's X and Y scale (X must stay 1).
- **Five components have no specimen yet** — `chart`, `combobox`, `message-scroller`, `questionnaire` and
  `direction`. Each needs a host that gives it data or a route of its own. They are installed; they are listed at
  the foot of `/molecules` so the omission stays visible.
- **The old showcase is gone.** The token screens, the registry-driven `/components/[layer]` route and the `Tool`
  shell went with the components they documented. The registry does not exist any more: there is no array to read a
  component's name and description out of, so a specimen writes its own note.
- **There is no database anywhere near this app** and there should not be.

## Reviewing it

`pnpm review` boots this app and sweeps its three routes on desktop and mobile in both themes — they are
`DESIGN_ROUTES` in `e2e/review.spec.ts`; add new ones when you add pages. CI runs the same sweep on every PR. Then open the PNGs in
`e2e/screenshots/<project>/` and look. Press `d` in the browser to switch theme by hand.
