@AGENTS.md

# apps/portfolio — the portfolio

`hiddenstack.no-origins.com`, :3000 (Portfolio.md P1; `bhargav.no-origins.com` redirects here permanently, path and query
intact — `next.config.ts`). **Portfolio.md** is its document; read it before changing what is on a page.

```bash
pnpm --filter portfolio dev                # :3000
```

## The shape: one agent's section a page (P24)

One route, `/`. **Six pages, one agent's section each, turned by the agents.** The order is `PAGES` in
`src/content/site.tsx`, and each page's name (`PAGE_TITLES`) is its section's label:

| Page | Agent | What is on it |
|---|---|---|
| About me | Bali | the profile (avatar and name), his line and More about me, Email · GitHub · Résumé, the degree and the city |
| Tech stack | Mira | the tech stack's marks |
| Work | Oru | the companies |
| Projects | Kino | the projects' carousel, and the case studies (Work In Progress) |
| Interests | Lola | his statement about AI, and the interests |
| Socials | Zaza | the social marks |

A page is the items whose `by` names that agent first, one under the other, centred (`arrangeAgent` in
`src/lib/arrange.ts`). Where the rows are short, an item that `grow`s gives up rows first, down to `FLOW_GROW_MIN`,
then the last items are left off, whole: **what the field has no room for is not shown**, and nothing scrolls.

- **`PortfolioPages`** (`src/components/portfolio-pages.tsx`) is the renderer: a `Grid` — not a `GridPages`, so there is
  no pager bar — with the overlay, the cursor (Grid.md D34, D43) and the intro. It passes the page asked for to the grid
  as `introFocus` and puts the next section on the field when the grid calls `onIntroFocus`.
- **What turns it**: one scroll — the first wheel event of a gesture, either axis, a positive delta forward (Grid.md
  D27) — a swipe (across the projects' carousel, the carousel turns instead), Page Down / Page Up, and **a click on an
  agent at home**, which turns straight to its page (`AgentHome`, on every home cell but the empty one of the agent on
  the field; `turnTo`). The section fades away as its agent Dives home, the next agent Dives in below its own section,
  ripples, and the section fades in, about a second. Nothing turns it while the intro plays or a page turns, and the
  first and last pages go no further.
- **The keys go in reading order** (Grid.md D45): `useReadingFocus` on the box holding the grid, so Tab and ← → ↑ ↓
  move focus line by line as the boxes stand; the arrows never turn the page. The agents at home are read after the
  section (`data-reading-after`).
- **The agent of the page** stands, on a field wider than tall, in **one cell for every page** — the third row from the
  bottom at the field's centre, lower only where the tallest page needs the rows; on a phone, in the cell below its
  section (`stand` from `arrangeAgent`, given to the grid as `introFocusAt`); its cell at home is empty. Hovering it
  opens its pill beside it (`components/agent-pill.tsx`: `useAgentPill`, `AgentSpot`, `AgentPill`), three cells: its
  name (semibold), a chat button that does nothing yet (his to build), and ↗ to Orbit (`ORBIT_URL`) in a new tab. It
  stays while the pointer is on the agent or the pill and goes 200ms after it leaves both; a tap toggles it and the
  keys' focus opens it where there is no hover; Escape, a press elsewhere or a turn closes it. **A click on the agent**
  (a tap, Enter) plays his Bounce where it stands (`introAct`), never in the air or while the page turns.
- **Home** is the field's last column, or its bottom row on a field taller than wide, the six in page order.
- **The status pill** (P25, `components/status-pill.tsx`): a bordered circle one cell big with a violet dot, on the
  field's bottom-right cell (`status` from `arrangeAgent`: the cell left of it where an agent's home is the corner; on a
  phone the right end of the row over the agents' row). Under the pointer or the keys' focus it grows LEFT to three
  cells — "Status page ↗" beside the dot, the border violet — by movement (`useCellMotion`, mirrored); the whole pill is
  the link to `STATUS_URL` (status.no-origins.com) in a new tab.
- **Fixtures**: the agent's cell, its pill, the agents at home and the status pill carry `data-intro-fixed` — a turn
  leaves them alone.

## The intro (P23, Grid.md D50)

The grid's `intro`, once per document load: the six agents of `INTRO_CAST` stand side by side in a row on the field's
middle, in a random order; Bali, Kino and Mira bounce, each at its own random times, the other three resting, for 2s;
then the agent of page 1 (Bali) jumps or dives, at random, to its cell below its section, a small violet ripple
spreading round it as it lands, and the section fades in; the other five go straight home. They stay there, breathing
and blinking. Under reduced motion they are drawn once, still, in their cells. There is no loader (Grid.md D49).

- `content/intro.ts`: the cast, in page order, each with whether it `bounces`.
- **`content/agents.ts` and `content/actions.ts` are snapshots, not links**: each agent's look copied whole from its
  current version in Orbit, and Bounce, Jump and Dive from theirs in the motion studio, because the page holds no
  database key (Admin.md §0.6). When he publishes a new version of a look or an action, copy it again —
  `node e2e/.mcp/intro-snapshot.mjs` (gitignored) rewrites both files from the local stack's `studio_versions` — or
  the page keeps the old one.

## The pieces

- **The site is data in `src/content/`.** `site.tsx` exports the `PortfolioPage` — one section of items, each an id, a
  **span per breakpoint**, the agent it is `by` and a render function — and `PAGES`. `resume.ts` is every fact from
  the résumé, in his voice (P6); a link with no `href` is not rendered, except the social marks below. `index.ts` is
  the model.
- **The cards** (`profile-card.tsx`, `cards.tsx`, `profile-*.tsx`, `logo.tsx`) are app-specific islands composed from
  `Card`, `Avatar`, `Text`, `Badge`, `Button`, `Carousel`, `Dialog`, `Slot` and the rest of the system — nothing
  hand-rolled. Each reads its own size off the grid and gets denser as its slot shrinks (P5); a slot clips, so a card
  that is cut off is in a slot that is too small.
  - **The profile** (`ProfileCard`): the avatar in a card two cells square, ringed in lime, and the name and role in the
    card beside it. A click on the face pops a HEY! out of it (`hey-overlay.tsx`; Open: two motions, `slap` and `snap`,
    take turns until he picks one). No company mark on it: those are the work's.
  - **His line and More about me** (`AboutCard`): his line as a `StatementCard` and, on its last line at the right edge,
    a lime button one cell big with a →, which opens the system's `Dialog` with his six paragraphs (`profile.story`).
    It `grow`s: shown only where the page leaves it three rows.
  - **Email · GitHub · Résumé** (`ProfileLinks`): his address in a card that is its `mailto:` with a button that copies
    it (`EmailCard`), GitHub's mark and name on an outlined pill (`GitHubCard`), and Résumé ↗ on the system's lime
    `Button`. One row on eight cells (4 · 2 · 2); two rows on six, the address alone and then GitHub · Résumé.
  - **The degree and the city** (`ProfileFacts`): the degree's pill (`EducationPill`) taking what the city's two cells
    leave, one row at every size.
  - **The tech stack** (`profile-tech.tsx`): a simple-icons mark a cell, in the text's colour, as many as the rows hold.
    **A hovered or selected mark grows to spell its name and the rest move on** — movement (Motion.md M9), played by
    `useCellMotion` on the tokens, never by numbers copied here; the grown mark is ringed in lime over a lime wash, its
    mark in its brand's colour. Hover is read from the cell under the pointer; a click, a tap, Space or Enter selects;
    focus alone never grows a mark. A spare row is kept for what a grown mark pushes over (`TECH` in `site.tsx`).
  - **The work** (`profile-work.tsx`): its label's row, then a row a company, newest first — the company's mark in a
    bordered circle and a pill with the role over the company and the years. Nothing in it is a Tab stop.
  - **The projects** (`profile-projects.tsx`): cards two cells by three rows in the system's `Carousel`, each its image
    a step inside the border (a lime and violet gradient until there are pictures — the no-gradient rule's one
    exception, his) over its name. His projects are Orbit and No Origins, whose card is its link, to the showcase. Two
    dummies (`DUMMY_PROJECTS`) follow them until his own fill `PROJECTS`. ‹ › on the label row's end cells where there are more cards than fit; turned by them, a
    swipe or a drag, never by ← →. The case studies under them are a Work In Progress pill.
  - **His statement about AI** (`StatementCard`): a card the page's colour with no border, the words in quotes in Anton
    at the display size (`--font-display`, the app's own), muted.
  - **The interests** (`SkillPill`s wrapped after the label's row) and **the socials** (`SocialMark`s: X, Instagram,
    YouTube, LinkedIn, Discord — each a simple-icons mark in the text's colour on a cell of its own, a link out in a new
    tab with its name as its tooltip). X and Instagram are @hiddenstack; LinkedIn, Discord and YouTube stand with no
    link until their URLs are filled in `LINKS` (the one exception to P6). LinkedIn's path is in `profile-card.tsx`
    (`LINKEDIN`): simple-icons has none.
  - **Each section's label is its first row** (`SectionCell`): no border, a `background` slot that stops the field's
    lines, the section's icon in violet and its word in `body`, centred. Where the rows do not hold it, the label goes.
- **A card whose air pools in one place has a span that is too big** — the mirror of P5. `justify-between` turns the
  surplus into a visible hole; correct the span from a measurement, not a guess.
- **The shell is the theme and the fonts.** `layout.tsx` has no nav, footer or container: the page takes the whole
  viewport, and it is a client component — the `Grid` measures its box in the browser. In development, `?jig` opens the
  accent jig (`jig.tsx`), kept to be showcased later.

## What is true here and easy to get wrong

- **The app owns no primitives.** Everything visible is from `@no-origins/ui/components/*`. If you are writing a
  component here, it belongs in the package (or it is a composition of package components, like the cards).
- **There is no database anywhere near this app** (Admin.md §0.6: the page is static, a component may be live). The
  agents and their actions are copied in (above).
- **Turbopack caches the design system's `exports` map.** If `@no-origins/ui/globals.css` is reported as "not
  exported under the condition style" after the package manifest changed, stop the dev server and delete
  `.next/dev/cache`. It is the stale cache, not the manifest.

## Reviewing it

`pnpm review` boots this app on :3000 and sweeps `ROUTES` in `e2e/review.spec.ts` on desktop and mobile in both themes,
waiting for the intro to hand over; open `e2e/screenshots/<project>/home.png` and look — it is page 1 only.
Gitignored helpers in `e2e/.mcp/`, the dev server running:

- `pages-shot.mjs <outdir> [w|pixel] [h] [scheme] [turns]` shoots every page and times each turn;
  `pages-turn-frames.mjs <outdir> [w] [h] [step] [count]` shoots one turn frame by frame and checks a second scroll in
  the same gesture does nothing and a resize keeps the agent below its section; `pages-reduced.mjs <outdir>` checks
  reduced motion.
- `agent-pill.mjs <outdir> [w|pixel] [h] [scheme]` checks the agent's cell on every page and the pill;
  `agent-hover.mjs <outdir>` the hover, the keys and a tap; `agent-bounce-click.mjs <outdir> [w|pixel] [h]` the
  bounce; `agent-home-click.mjs <outdir> [w|pixel] [h] [scheme]` clicks the agents at home; `status-pill.mjs <outdir>`
  shoots the status pill at rest, hovered, through a turn and on a phone.
- `intro-settled.mjs <out>` checks the agents resting under reduced motion and after a resize; `intro-end.mjs [w] [h]
  [runs]` times when the intro hands over; `intro-fps.mjs [w] [h] [cpu]` times its frames.
- `tech-motion.mjs <outdir> [w] [h] [scheme] [marks]` hovers the tech's marks and shoots them mid-move and settled.
