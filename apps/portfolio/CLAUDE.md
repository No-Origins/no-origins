@AGENTS.md

# apps/portfolio — the portfolio

`hiddenstack.no-origins.com` (`bhargav.no-origins.com` redirects here, permanently — `next.config.ts`). **Portfolio.md**
is the document; read it before changing what is on a page.

```bash
pnpm --filter portfolio dev                # :3000 (design :3001, admin :3002)
```

## The shape

**Recruiter preview (Portfolio.md P17):** `/` now mounts `RecruiterView`. This branch implements the approved
screening review for hurried recruiters. Its measured grid keeps contact actions first, uses tabs on compact
fields, and offers a complete reading composition. That composition may scroll: it is the deliberate accessibility
exception for narrow/short fields and enlarged text. There is no intro hold, staged wake, spatial arrow-key focus,
or pagination in this view. The previous composition below is historical on this branch. Facts remain in
`resume.ts`; concise evidence lives in `screening.ts`; shared components and tokens remain authoritative.

Rebuilt from nothing on 2026-09-21, on the grid. There is one route, `/`, and since 2026-09-27 it is **one page**
(Portfolio.md P15, his: "We don't need multiple pages in portfolio now. Remove pagination navbar"): the first screen,
and the pieces of the pages that went — Beyond and Say hello — in the profile's column since 2026-09-27 (they were in
the room it leaves). There is no pager, no turn and
nothing that turns: the scroll and a finger do nothing, and the arrow keys move focus like a game controller's (Grid.md
D45). The first screen is three columns (P4, 2026-09-26), in this order since 2026-09-27: who he is — the avatar and
the name, his words, Résumé · Email, then the degree and Hyderabad (his order, the same day), then the marks of
GitHub, X and Instagram (his, the same day: "put that row under education row") — the work and
the projects, then the technical skills and the art skills. It loads as sections, one loader ring each (Grid.md D48,
`load` on an item): the profile (the card, the note, the links and the degree), the work, the projects, the
technical skills and the art skills, and the case studies under the projects ("Work In Progress", 2026-09-27), and the content
under the art skills, a row of air over it (the same pill, `comingSoon` in `site.tsx`). The socials were a section
under the content until the same day, and are the profile column's marks since. **No empty rows are kept on a
pointer any more** (2026-09-27): the top row went with his "push all the verticals one row up" and the case studies,
and the pager's old bottom row with the case studies (`TOP_ROWS`, `FOOT_ROWS`), so a field twelve rows deep is the
first screen from top to bottom; on a taller one it is centred and leans a row up (`FIRST_SCREEN_LIFT`). Touch keeps
the bottom row, where the room puts the case studies and the content.
Nothing scrolls, and **what the field has no room for is not shown** — on a field too small for the first screen
that includes the tech and the work (P15 lists what each size shows).

- **The site is data in `src/content/`.** `site.tsx` exports the `PortfolioPage`: sections of items, each item an id,
  a **span per breakpoint** and a render function. `resume.ts` is every fact from the résumé, in his voice (P6) — a
  link with no `href` is not rendered. `index.ts` is the model.
- **`arrange`** (`src/lib/arrange.ts`) places the site on the live field as ONE page (P2, P8, P15). It arranges the
  first screen exactly as it did when the site was pages (`paginate`, over the bottom row it kept for the pager, so
  none of its boxes moves), keeps that first page, and places everything else — the later sections, then the first
  section's own overflow on a short field — in **the room it leaves** (`fillRoom`): the well under the profile's column, between the
  columns, and every row under the block that the tagline does not keep. Each item takes the first of its spans that
  fits (`span`, then `fallback`), first-fit in `site.tsx`'s order, and one that fits nowhere is left off; a row of
  one-row pieces under the block is centred in the band. `paginate` is as it was: every section starts a page, items
  pack first-fit inside a centred band of 4 · 6 · 8 · 12 · 16 columns (an item marked `below` starts under everything
  before it, never beside it, `air` rows lower — the note, the links and the degree under the profile card; one in
  the flow that `grow`s takes the rows the first page leaves under the flow, at most its span's, sized by arranging the
  section without it (`sizeGrowers`), and is left off under `FLOW_GROW_MIN` (three) — the note; one marked
  `backdrop` takes no box: the first page keeps its rows free over the pager's, as many as the block leaves, and the
  renderer draws it there behind the grid — the tagline until 2026-09-27, off the page since; one marked `side` is a
  column beside the block, numbered from it (1 the first right of it, 2 the next, −1 the first left; the work and
  the projects are 1, the tech 2), every column one width and a column of air (`SIDE_GAP`) from the next, the block and its
  columns centred in the band together, where the band leaves
  `SIDE_MIN` (five) cells — the block taking its items' `narrow` spans where only those leave five, the centre's six on
  an eighteen-column field (2026-09-27) — and packed under it
  where it does not — the first screen's columns, whose section widens its `band` to twenty-two, so a column is six
  cells (`SIDE_MAX`) on a field that wide and five on twenty or eighteen. Several items on one side stack down its
  column in order, each after the first `air` rows under the one above; one that `grow`s takes the rows its column has left (the tech, over the art skills), and a
  column with none leaves its spare rows empty at its foot), the pager's row and (on
  `lg`/`xl`) the top row are reserved, overflow goes to the next page, and a page's block is centred in the band **and
  in the room** — across and down, between the top row and the pager's (P8, amended 2026-09-21); a block that fills an
  axis does not move on it. An item taller than the room gives up rows — at most a quarter of them while it shares a page, then it takes a
  page of its own.
- **`PortfolioPages`** (`src/components/portfolio-pages.tsx`) is the renderer: a `Grid` — not a `GridPages`, so no
  bar and no turn (P15) — that runs `arrange` on whatever field the grid reports, so every coordinate is honoured as
  written. It opens with the grid's `intro` (Grid.md D31, D48): the grid's loader, his loading motion — a square of
  dashed lime rings on the field's centre, one a box, a closed ring chasing round it for 2s at the least and until the
  page is ready, then each going to its section's top-left cell and opening from it; and `cursor` (D34, D43): the pointer is a violet ring that fills while pressed, and the cell under it
  turns its dashes violet. The grid drew itself in and looped while the page loaded until D48; the ripple (D32) went
  first, with the turns it played between. `node e2e/.mcp/intro-loader.mjs <out> [WxH] [scheme] [ms…]` logs the
  intro's phases and the rings, and shoots the page at the moments given. **The page wakes from the avatar** (P16,
  amended twice on 2026-09-27, his: "once all the components render, lets everything get activated", then "the
  activation is smooth and starts from the avatar"): every box is inactive, its colour tokens mixed into the page
  keeping 40%, until the grid's load is over (`data-loading` comes off the grid). Then a front grows from the avatar's
  centre over the page in `WAKE_MS` (1200), and each box brightens linearly from when the front reaches its nearest
  point until it has passed its farthest (`wakeFront`, a delay and a duration a box), at every size. They stay active;
  the pointer and the focus change nothing (they chose the vertical in focus until then). No blur and no opacity on a box, since the
  dashes would show through. `node e2e/.mcp/page-wake.mjs <outdir> [w] [h] [scheme] [ms…]` checks it.
- **The pieces that were in the room** (P15, P4, `cards.tsx`): What I am after is a `NoteCard` under the avatar and the
  name since 2026-09-27 (his: "the about me text should be just below the avatar and name row") — his six paragraphs
  (`profile.story`), with no heading and no state, centred down the card, letting paragraphs go from the one before
  the last backward where the span is short, the last always kept. It `grow`s: at most six rows, at least three, else
  it is not shown (a phone and a tablet, where the work has the rows). Under it, **Résumé · Email**
  (`ProfileLinks`, `below`), one row at every size — his address, hiddenstack@no-origins.com, in a card with a button
  that copies it (`EmailCard`); then the degree and Hyderabad (`ProfileFacts`); then **the social marks**
  (`ProfileSocials`, 2026-09-27): a simple-icons mark in the text's colour (his: lime "looks very inconsistent") on a cell of its own, a circle, a link out in a new tab
  with its name as its tooltip, centred on the column (an odd remainder leaning left): GitHub, X and Instagram
  (@hiddenstack), then LinkedIn and Discord, whose marks stand with no link until their URLs are filled in `LINKS`
  (his: "we'll add the URLs later" — the one exception to P6). LinkedIn's path is in `profile-card.tsx` (`LINKEDIN`):
  simple-icons and lucide have none. The years are off the page (not in his
  list; `profile.years` is kept). The hobbies are the left column's art skills since 2026-09-27, each a
  `SkillPill` wrapped after a palette's label cell, under the technical skills. The projects (`CellWrap`: `NotePill`s wrapped along the
  column's rows as words wrap, two of them placeholders, each its name and No Origins' ↗ — no state since 2026-09-27
  (his: "replace them with the link icon that No Origins has"), only No Origins a link — in the whole cells they need, declared per cell size
  in `site.tsx` and wrapped by `arrange`'s `wrap`, which gives the item its rows through `wraps`) and the degree went
  into the first screen's columns on 2026-09-27, and the languages came off. **Each section's label is its first
  row** (`SectionCell`): a transparent pill with the section's icon in the secondary colour (violet) and its word
  after it in `caption` (his, 2026-09-27: "expand them to also show the label of the section name"), as many whole
  cells as the two need — measured and declared per cell size in `site.tsx` (`LABELS`) — **alone on the row and
  centred on it** (his, the same day: "the labels should justify center in their own section … move all the cards or
  boxes that are in the row of the label … to the next row"), a cell wider where the row would not split evenly
  (`labelSpot`). The projects, the art skills and the Work In Progress pills wrap from the row under it (`CellWrap`,
  every `wraps` starting with `LABEL_ROW`), the tech's marks flow from the row under it (`lead` on `ProfileTech`), and
  the company marks stand under it (`lead` on `ProfileWork`). Where the rows do not hold it, the label goes. A column
  beside the centre that is short of rows gives up its air first, the last first (`arrange.ts`). The degree has no label cell
  since it went to the profile's column (2026-09-27); its pill keeps its cap. The section header, `BarsCard`, `HobbiesCard` and `ContactCard` are unused
  since, kept while this is a trial.
- **The cards** (`profile-card.tsx`, `cards.tsx`, `logo.tsx`) are app-specific islands composed from `Card`,
  `Avatar`, `Text`, `Badge`, `Button`, `Progress`, `Separator` and `Slot` — nothing hand-rolled. Each reads its own
  size off the grid and gets denser as the slot shrinks (P5); a slot clips, so a card that is cut off is in a slot that
  is too small. The first screen's centre (P4) is the profile — the avatar in a card two cells square and the name and
  role in the card beside it (`ProfileCard`, 2026-09-27) — then the note and the links (above), and last the degree
  and Hyderabad (`ProfileFacts`, one row at every size): the degree's pill (`EducationPill`, "Computer Science (Hons.)"
  over "LPU · 2017 — 2021", his: "remove B.Tech in") taking what the city's two cells leave, the city without its pin
  on a phone's narrow cells. Each is a Card one row tall with everything in it on the field's own cells. **The work
  column** (`profile-work.tsx`, 2026-09-27, his: "put the logos vertically under the work icon cell … minimum amount of
  information") is its label's cell and, under it, a row for each company, newest first: the company's mark in a
  bordered circle, so the marks stand in a column under the briefcase, and beside it a pill with the role over the
  company and the years in `caption`, as the degree's pill is drawn (TTT where the full name does not fit). Five rows,
  one a company; with fewer, the label goes first, then the oldest company. He allowed two rows a company, and none
  needs them. The Tabs, the active company's growth and its card of lines and stack went (the lines are still in
  `resume.ts`), and nothing in the column is a Tab stop. (`work-tabs.mjs` pressed the tabs; there are none to press.)
  **The keys go in reading order** (Grid.md D45): `PortfolioPages` calls
  `useReadingFocus` on the box holding the backdrop and the grid, so Tab runs line by line — the avatar, the tech's marks,
  then No Origins, the résumé, the address's copy button, GitHub, X and Instagram as the boxes stand at 1440 × 900 — and ← → ↑ ↓ always move focus (the first press lights the avatar) and never turn the page; `node e2e/.mcp/focus-order.mjs [w] [h]
  [keys]` prints where each key lands. The centre stands level with the columns' top, their labels and all, not centred down between them. The tech stack (`profile-tech.tsx`) is
  a simple-icons mark a cell, the text's colour, first in the third column, as many marks as the rows the art skills
  and the content under them leave hold. **A hovered or selected mark grows to spell its name, and the rest
  move on** (2026-09-27): movement, his pick in the motion studio (Motion.md M9), played by `useCellMotion` on the
  tokens, never by numbers copied here. The grown mark is ringed in lime over a lime wash (the work's active tab's, until it went), its mark in its brand's
  colour. Hover is read from the cell under the pointer, a click, a tap, Space or Enter selects, and focus alone never
  grows a mark (it moved the marks under the keys and Tab skipped one). Under the centre the column keeps a spare row
  for what a grown mark pushes over (`TECH` in `site.tsx`). `node e2e/.mcp/tech-motion.mjs <outdir> [w] [h] [scheme]
  [marks]` hovers marks and shoots the column mid-move and settled. The first screen stands at most four
  rows down (`FIRST_SCREEN_AIR`, P3). A company's mark is **never on the profile card** (P9). The Work and Stack
  screens, `CompanyMark`, the hover band (`band.tsx`) and the chip groups went into the columns on 2026-09-26.
- **A card whose air pools in one place has a span that is too big** — the mirror of P5. `justify-between` turns the
  surplus into a visible hole, and `node e2e/.mcp/profile-slack.mjs` prints that hole in rows, so the span is
  corrected from a measurement rather than a guess. This is how the profile card lost a row at every breakpoint (three
  on a tablet) when the logo strip left it.
- **`BarsCard`'s bars grew when their page arrived** (P11), with GSAP, through `Progress`'s `animate` and `delay`
  props, because `GridPages` mounted only the page it showed. It is not on the page since P15 (the languages are a
  pill); on a `Grid` a card mounts while the intro holds page 1 back, so a card that animates on arriving needs to
  wait for the intro to hand over first.
- **The shell is the theme and the fonts.** `layout.tsx` has no nav, footer or container: every page takes the whole
  viewport. Every page is a client component — the `Grid` measures its box in the browser.

## What is true here and easy to get wrong

- **The app owns no components.** Everything visible is from `@no-origins/ui/components/*`. If you are writing a
  component here, it belongs in the package (or it is a composition of package components, like the card).
- **The 1.0 site is gone.** It was parked in `.legacy/` to read copy out of, and deleted as dead code on
  2026-09-23. Its copy is in git history (anything before that date) if a later screen wants it.
- **Turbopack caches the design system's `exports` map.** If `@no-origins/ui/globals.css` is reported as "not
  exported under the condition style" after the package manifest changed, stop the dev server and delete
  `.next/dev/cache`. It is the stale cache, not the manifest.
- **There is no database anywhere near this app** (Admin.md §0.6: the page is static, a component may be live).

## Reviewing it

`pnpm review` boots this app on :3000 and sweeps `ROUTES` in `e2e/review.spec.ts` on desktop and mobile in both
themes; add a route there when you add a page. Then open `e2e/screenshots/<project>/home.png` and look.
`node e2e/.mcp/one-page-probe.mjs <outdir> [light|dark] [WxH ...]` (gitignored) shoots the page at eight sizes, from a
1920 × 1080 monitor to an iPhone SE, or the sizes given, and prints the field, the scroll size — which must equal the
viewport — and every box with its cells, so what a size shows and leaves off is read rather than guessed. Look at the
phone and the SE: that is where a span is wrong first. (`portfolio-pages.mjs`, `pager-numbers.mjs` and
`bars-probe.mjs` turned pages; there are none to turn.)
