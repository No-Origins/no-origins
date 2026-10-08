@AGENTS.md

# apps/design — the showcase

`design.no-origins.com`, :3001. It renders the design system and nothing else. The design system is `@no-origins/ui`
and every visual decision belongs there, not here.

```bash
pnpm --filter design dev                 # :3001
```

## The shape

Three routes, each a `GridPages` of boxes under the nav, so no page scrolls: overflow goes to the next page, turned by
the scroll, the pager's ↑ ↓ on the bottom row, a finger on a phone, or the keys ↑ ↓ ← → (Grid.md D27, D42).

- `/` — what the system is and which layers exist: one section on a 12-column band — the intro, the two layer cards
  side by side (six columns each, one to a row on a phone), the notes.
- `/atoms` — the 18 indivisible components, one section, each in a **card** slot.
- `/molecules` — the 46 that compose them, one section: 41 **on the molecule card** — `CARD(rows)` in `molecules.tsx`,
  one width (the band on a phone and a tablet, two to a row from `lg` up, eight columns on `xl`) in a **card** slot
  like the atoms, only the rows differing, so the page is two columns of cards — and five without a specimen, named in
  a footnote at the end.

**A page is data in `src/content/`** — `overview.tsx`, `atoms.tsx`, `molecules.tsx`, each exporting a `PageContent`:
a title, **sections** of `SpecimenItem`s (an id, a **span per breakpoint** in cells, a box variant or `none` for a
component that is its own box, a render function that receives its placed item), the default variant and an optional
narrower `band`. `src/content/index.ts` is the model (`findItem` walks the sections). The `page.tsx` files are one line
each. To change a page, change its data.

- **`src/lib/arrange.ts` packs a page on the field it is shown on**: every section starts a page and spills onto more;
  its items pack first-fit in reading order inside a **centred band of 4 · 6 · 8 · 12 · 16 columns** (a page may name a
  narrower one, `band`, when its items tile it — the overview's two cards divide 12); the pager's row is reserved; a
  page's block is **centred in the band and in the room** above the pager; an item taller than the room gives up at
  most a quarter of its rows to stay on a page. There is no top row (`TOP_ROWS` is zero): the nav is this app's
  chrome. The admin and the login carry copies of it; it is not a package export because the packer is an open
  question (Grid.md) the package must not decide — when it is decided, the copies become one.
- **`SpecimenPages`** (`src/components/specimen.tsx`) runs `arrange` **on the field the page is actually on**,
  re-arranging whenever the grid reports another shape — never onto a reference field and then derived, which keeps
  each packed page as a hard break.
- **Every specimen has a span per breakpoint** through three presets in `specimen.tsx`: `half(rows)` — two to a row
  from `lg` up (564px on xl, 420 on lg), the whole band under it; `quarter(rows)` — four to a row on xl (276px), two on
  lg and on a tablet; `band(rows, phoneRows)` — as wide as the band. Both widths divide the band, so rows tile. A phone
  takes a third more rows (`onPhone`), since its cell gives way to six columns (Grid.md D33); a tall `half` one more
  again. A specimen whose rows wrap on one breakpoint only spreads the preset and sets that breakpoint by hand
  (`Button` and `Input` on `lg`).
- **Each section has a one-row header** — `SectionHeader`: number and name in small caps, the title under them,
  stepping down a role on a phone.
- **Text is a `Text`** (Type.md T1): the header, the specimen's name and note, the overview's copy.
- **A specimen gets denser as its slot shrinks, and never clips** (Portfolio.md P5): a render function receives its
  placed item, so the `Card` specimen drops its body when the packer has given it a row back. **The span is the one
  design decision a specimen carries**: a specimen that is cut off has a span that is too small — grow it in its
  section, run the clip probe, look again.

**The nav bar is exactly `3.5rem` tall, border included.** Every page sizes itself with `calc(100dvh - 3.5rem)`, so
`h-14` sits on the `<header>` and not on the div inside it — with the border outside that height the page scrolled by
one pixel. `<main>` sets no width or padding.

## What is true here and easy to get wrong

- **The app owns no components.** Everything it renders is imported from `@no-origins/ui/components/*`;
  `specimen.tsx`, `showcase-nav.tsx` and `lib/arrange.ts` are the only things this app owns. If you find yourself
  writing a component here, it belongs in the package.
- **Every page is a client component**, the overview included: `GridPages` measures its box in the browser and a
  render function cannot cross the server boundary. Metadata lives in the layout.
- **Five components have no specimen** — `chart`, `combobox`, `message-scroller`, `questionnaire` and `direction`.
  Each needs a host that gives it data or a route of its own. They are installed and listed at the foot of
  `/molecules`, so the omission stays visible. `python3 .claude/skills/add-component/scripts/counts.py` prints the
  true counts.
- **A specimen writes its own note.** There is no registry of components to read a name and description from.
- **There is no database anywhere near this app**, and there should not be.

## Reviewing it

`pnpm review` boots this app and sweeps its three routes (`DESIGN_ROUTES` in `e2e/review.spec.ts`) on desktop and
mobile in both themes; CI runs the same sweep on every PR. Open the PNGs in `e2e/screenshots/<project>/design__*.png`
and look. Press `d` in the browser to switch theme. **The sweep shoots page 1 of each route only**:
`node e2e/.mcp/showcase-clip.mjs <outdir>` (gitignored) turns every page of the three routes at five sizes — desktop,
laptop, lg, tablet, phone — writes one PNG per page, prints the page count and the scroll size (which must equal the
viewport), and lists every box whose content is clipped. `Carousel` and `Pagination` always report: their own tracks
are the overflow.
