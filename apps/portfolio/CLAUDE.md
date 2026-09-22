@AGENTS.md

# apps/portfolio — the portfolio

`hiddenstack.no-origins.com` (`bhargav.no-origins.com` redirects here, permanently — `next.config.ts`). **Portfolio.md**
is the document; read it before changing what is on a page.

```bash
pnpm --filter portfolio dev                # :3000 (design :3001, admin :3002)
```

## The shape

Rebuilt from nothing on 2026-09-21, on the grid. There is one route, `/`, and it is the whole résumé as **sections,
one a screen** (Portfolio.md P7): the profile card, then Work, Stack, Beyond and Say hello. An empty row on top on
`lg` and `xl` only — on a phone and a tablet the content takes it (P3, `TOP_ROWS`) — and the pager on the bottom row
(Grid.md D27 — the arrangement leaves that row alone). Nothing scrolls; the next screen is the next page,
turned by the scroll, the pager's ↑ ↓ or ← →. With one page both arrows are disabled and the scroll does nothing.

- **The site is data in `src/content/`.** `site.tsx` exports the `PortfolioPage`: sections of items, each item an id,
  a **span per breakpoint** and a render function. `resume.ts` is every fact from the résumé, in his voice (P6) — a
  link with no `href` is not rendered. `index.ts` is the model.
- **`arrange`** (`src/lib/arrange.ts`) places a page on the live field (P2, P8): every section starts a page, items
  pack first-fit inside a centred band of 4 · 6 · 8 · 12 · 16 columns, the pager's row and (on `lg`/`xl`) the top row
  are reserved, overflow goes to the next page, and a page's block is centred in the band **and in the room** — across
  and down, between the top row and the pager's (P8, amended 2026-09-21); a block that fills an axis does not move on
  it. An item taller than the room gives up rows — at most a quarter of them while it shares a page, then it takes a
  page of its own.
- **`PortfolioPages`** (`src/components/portfolio-pages.tsx`) is the renderer: a `GridPages` that runs `arrange` on
  whatever field the grid reports, so every coordinate is honoured as written. When a section has been through the
  composer and its export pasted back (Grid.md D20), an authored `layout` beside its items is the thing to add.
- **The cards** (`profile-card.tsx`, `cards.tsx`, `logo.tsx`) are app-specific islands composed from `Card`,
  `Avatar`, `Text`, `Badge`, `Button`, `Progress` and `Slot` — nothing hand-rolled. Each reads its own size off the
  grid and gets denser as the slot shrinks (P5); a slot clips, so a card that is cut off is in a slot that is too
  small. A company's mark sits on a small white tile, because the marks are the companies' own colours, and lives on
  the role card for that company only — **never on the profile card** (P9, amended 2026-09-21).
- **A card whose air pools in one place has a span that is too big** — the mirror of P5. `justify-between` turns the
  surplus into a visible hole, and `node e2e/.mcp/profile-slack.mjs` prints that hole in rows, so the span is
  corrected from a measurement rather than a guess. This is how the profile card lost a row at every breakpoint (three
  on a tablet) when the logo strip left it.
- **`BarsCard`'s bars grow when their page arrives** (P11), with GSAP, through `Progress`'s `animate` and `delay`
  props. No visibility test is needed or wanted: `GridPages` mounts only the page it shows, so a card's first render
  *is* its page arriving. `node e2e/.mcp/bars-probe.mjs <outdir>` turns to each page and prints every bar's fill at
  the start and end of the growth — the end must be `-(100 − value)%`.
- **The shell is the theme and the fonts.** `layout.tsx` has no nav, footer or container: every page takes the whole
  viewport. Every page is a client component — `GridPages` measures its box in the browser.

## What is true here and easy to get wrong

- **The app owns no components.** Everything visible is from `@no-origins/ui/components/*`. If you are writing a
  component here, it belongs in the package (or it is a composition of package components, like the card).
- **`.legacy/` is the 1.0 site**, parked out of the build (`tsconfig` and eslint both exclude it) because it still
  imports the deleted system. It is there to read copy and content out of when the later screens are built; delete
  it when nothing in it is wanted. Do not import from it.
- **Turbopack caches the design system's `exports` map.** If `@no-origins/ui/globals.css` is reported as "not
  exported under the condition style" after the package manifest changed, stop the dev server and delete
  `.next/dev/cache`. It is the stale cache, not the manifest.
- **There is no database anywhere near this app** (Admin.md §0.6: the page is static, a component may be live).

## Reviewing it

`pnpm review` boots this app on :3000 and sweeps `ROUTES` in `e2e/review.spec.ts` on desktop and mobile in both
themes; add a route there when you add a page. Then open `e2e/screenshots/<project>/home.png` and look.
`node e2e/.mcp/portfolio-pages.mjs <outdir> [dark]` (gitignored) turns every page at five sizes — desktop, laptop,
tablet, phone, iPhone SE — shoots each one, and prints the page count and the scroll size, which must equal the
viewport. Look at the phone and the SE: that is where a span is wrong first.
