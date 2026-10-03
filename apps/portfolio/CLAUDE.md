@AGENTS.md

# apps/portfolio — the portfolio

`hiddenstack.no-origins.com` (`bhargav.no-origins.com` redirects here, permanently — `next.config.ts`). **Portfolio.md**
is the document; read it before changing what is on a page.

```bash
pnpm --filter portfolio dev                # :3000 (design :3001, admin :3002)
```

## The shape

**Since 2026-10-03 it is six pages, one agent's section each** (Portfolio.md P24, his, after a friend in HR found the
one page too much at once: "each agent can pick a section. So we scroll from one agent to another"). The page order is
`PAGES` in `site.tsx` — Bali (the profile, his line, and since the same day Email · GitHub · Résumé, the degree and the
city, his: "I need a the resume, Hyderabad, education, GitHub, and email in the first page"), Mira (the tech stack —
Technical skills until the same evening, his: "rename as tech stack"), Oru (the work), Kino (the projects, the case
studies under them), Lola (the statement about AI, the interests), Zaza (the socials) — his order, the same evening
("the socials should be in the end … tech stack … 2nd, work … 3rd. Projects … 4th, Case studies … 5th"; the socials
were second until then) — and a page is the items whose `by` names that agent first, one under the other, centred
(`arrangeAgent` in `arrange.ts`); the tabs (`compact`) are on none. `PortfolioPages` passes the page asked for to the
grid as `introFocus` and puts the next section on the field when the grid calls `onIntroFocus`. The agents turn it
(Grid.md D50 version 9): the agent of the page on the field stands, on a wide field, in ONE cell for every page — the
third row from the bottom, at the field's centre, lower only where the tallest page needs the rows (his: "put the agent
in the bottom third row in the large screen"); on a phone, the cell below its section — `stand` from `arrangeAgent`,
given to the grid as `introFocusAt`; its cell at home empty. Hovering it opens its pill beside it (his: "let's show it with
hover"; a click until then), three cells: its name, a chat button that does nothing yet, and ↗ to Orbit (`ORBIT_URL`,
behind the sign-in) in a new tab (`agent-pill.tsx`: `useAgentPill`, `AgentSpot`, the round button under the drawn
agent, and `AgentPill`); it stays while the pointer is on the agent or the pill and goes 200ms after it leaves both; a
tap toggles it and the keys' focus opens it where there is no hover; Escape, a press elsewhere or a turn closes it; the
name is semibold. A click on the agent (a tap, Enter) plays his Bounce where it stands (`introAct`; his: "When we click
on the agent, add bounce"), never in the air or while the page turns; `node e2e/.mcp/agent-bounce-click.mjs <outdir>
[w|pixel] [h]` measures it. **A click on an agent at home turns straight to its page** (his, the same evening: "travel to
pages by clicking on the agent on the right column"): `AgentHome`, a spot like the agent's on every home cell but the one
left empty (`homes` from `arrangeAgent`, `turnTo` in `portfolio-pages.tsx`), named by its page and its agent
(`PAGE_TITLES`); `node e2e/.mcp/agent-home-click.mjs <outdir> [w|pixel] [h] [scheme]` clicks them.
**The status pill** (Portfolio.md P25, his, the same evening: "Add a pill in the bottom right of the portfolio with a
'violet' circle. When hovered on it, it should expand to 'Status page' with link icon that opens new tab"): a bordered
circle one cell big on the field's bottom-right cell (`status` from `arrangeAgent`: the cell left of it where an agent's
home is the corner, the right end of the row over the agents' row on a phone), a violet dot in it, that grows LEFT to
three cells under the pointer or the keys' focus — "Status page ↗" beside the dot, the border violet — by movement
(`useCellMotion`, mirrored, `status-pill.tsx`); the whole pill is the link to `STATUS_URL` (status.no-origins.com,
Status.md) in a new tab. It is a **fixture** (`data-intro-fixed`, Grid.md D50 version 9 amended): a turn leaves it
alone, and so are the agents' cells to click. `node e2e/.mcp/status-pill.mjs <outdir>` shoots it at rest, hovered,
through a turn and on a phone.
`node e2e/.mcp/agent-pill.mjs <outdir> [w|pixel] [h] [scheme]` checks the cell on every page and the pill, and `node
e2e/.mcp/agent-hover.mjs <outdir>` the hover, the keys and a tap; at home they are the field's last column, or its bottom row on a phone, in page order. One scroll — the
first wheel event of a gesture, either axis, a positive delta forward — a swipe, or Page Down / Page Up turns it: the
section fades away as its agent Dives home, the next agent Dives in below its own section, ripples, and the section
fades in, about a second. Nothing turns it while the intro plays or a page turns. `node e2e/.mcp/pages-shot.mjs
<outdir> [w|pixel] [h] [scheme] [turns]` shoots every page and times each turn, `node e2e/.mcp/pages-turn-frames.mjs
<outdir> [w] [h] [step] [count]` shoots one turn frame by frame and checks a second scroll in the same gesture does
nothing and a resize keeps the agent below its section, and `node e2e/.mcp/pages-reduced.mjs <outdir>` checks reduced
motion. **What follows describes the one page (P15) the pages were cut from**: the items, their spans and the cards
are the same, and `arrange` is kept, uncalled.

Rebuilt from nothing on 2026-09-21, on the grid. There is one route, `/`, and since 2026-09-27 it is **one page**
(Portfolio.md P15, his: "We don't need multiple pages in portfolio now. Remove pagination navbar"): the first screen,
and the pieces of the pages that went — Beyond and Say hello — in the profile's column since 2026-09-27 (they were in
the room it leaves). There is no pager, no turn and
nothing that turns: the scroll and a finger do nothing, and the arrow keys move focus like a game controller's (Grid.md
D45). The first screen is three columns (P4, 2026-09-26), in this order since 2026-09-27: who he is — the avatar and
the name, his line (2026-10-01), the technical skills (2026-10-01, his: "move the technical skills between the tagline
in the first vertical and email"), Email · GitHub · Résumé (2026-10-01), then GitHub's mark, the degree and Hyderabad (his order, the same day; GitHub
since 2026-09-28) — the work and
the projects, then his AI statement, the interests (the art skills until 2026-10-01, his: "Rename art skills to
interests") and the socials. **It has no loader** (Portfolio.md P22, Grid.md D49,
2026-09-30, his: "remove all the current loaders … let the components load quickly"): the page is on the field as soon
as the grid has measured it. It loaded a card at a time out of dashed rings (P19, `data-load-box`), and as six sections
before that, until then. The columns hold the case studies under the projects ("Work In Progress", 2026-09-27), and **the
socials** under the interests, a row of air over them — an at sign's label and the marks of X, Instagram, YouTube,
LinkedIn and Discord since 2026-10-01 (his: "rename content as socials and update the icon accordingly and also move
LinkedIn and Discord logos into socials"; `SOCIALS` in `site.tsx`). It was the content, with X, Instagram and YouTube
(2026-09-28), and a Work In Progress pill before that (`comingSoon`); LinkedIn and Discord were a row of marks under the
degree (`ProfileSocials`, deleted). A phone has no social marks since: the socials are a column, and a phone has tabs in
the columns' place (Portfolio.md P4, his to decide). **No empty rows are kept on a
pointer any more** (2026-09-27): the top row went with his "push all the verticals one row up" and the case studies,
and the pager's old bottom row with the case studies (`TOP_ROWS`, `FOOT_ROWS`), so a field twelve rows deep is the
first screen from top to bottom; on a taller one it is centred and leans a row up (`FIRST_SCREEN_LIFT`). Touch keeps
the bottom row.
Nothing scrolls, and **what the field has no room for is not shown** — on a field too small for the first screen
that includes the tech and the work (P15 lists what each size shows).

**A phone and a tablet have tabs** (2026-09-28, the recruiter quick view's mobile layout): where the columns cannot
stand beside the profile, at the touch breakpoints, `ProfileSections` (`profile-sections.tsx`, an item marked
`compact`) takes their place under the profile's column — a bar of Work, Projects, Tech and Interests, the one shown lime,
and a panel of the rows left holding that section as it is drawn beside the profile, without its label. `arrange`
leaves the `side` items off there, and the tabs off where the columns stand beside. A laptop's small window keeps the
note and no columns.

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
  the projects are 1, the tech 2), every column one width and two columns of air from the next where the band still leaves
  them five cells, else one (`SIDE_GAPS`, 2026-09-28, his: "add two column gap in large screen"), the block and its
  columns centred in the band together, where the band leaves
  `SIDE_MIN` (five) cells — the block taking its items' `narrow` spans where only those leave five, the centre's six on
  an eighteen-column field (2026-09-27) — and packed under it
  where it does not — the first screen's columns, whose section widens its `band` to twenty-four, so a column is six
  cells (`SIDE_MAX`) on a field that wide, 8 · 2 · 6 · 2 · 6, five on twenty-two with the air still two, and five on
  twenty or eighteen with one. Several items on one side stack down its
  column in order, each after the first `air` rows under the one above; one that `grow`s takes the rows its column has left (the tech, over the interests), up to its `growMost` — the tech's label, its marks and one row for what a grown mark pushes over, which is the air under it, so one empty row stands between the tech and the interests at every size (2026-09-28); the rest are the column's foot, and a
  column with none leaves its spare rows empty at its foot), the pager's row and (on
  `lg`/`xl`) the top row are reserved, overflow goes to the next page, and a page's block is centred in the band **and
  in the room** — across and down, between the top row and the pager's (P8, amended 2026-09-21); a block that fills an
  axis does not move on it. An item taller than the room gives up rows — at most a quarter of them while it shares a page, then it takes a
  page of its own.
- **`PortfolioPages`** (`src/components/portfolio-pages.tsx`) is the renderer: a `Grid` — not a `GridPages`, so no
  bar; since P24 its turn is the agents' (above) — that runs `arrangeAgent` (`arrange` until P24) on whatever field
  the grid reports, so every coordinate is honoured as written. It opens with the grid's `intro` (Grid.md D50, P23, version 8 since 2026-10-01, his: "we'll bring them to
  the right the last most column vertically centered"): the six agents of `INTRO_CAST` (`content/intro.ts`: the six
  of `content/agents.ts`, each copied whole from its current version in Orbit, with whether it `bounces`) stand side by
  side in a row on the field's middle, in a random order; Bali, Kino and Mira bounce, each at its own random times, and
  the other three rest, for 2s; then each jumps or dives, at random, to the cell at the centre of the boxes it opens
  (every item names its agent with `by`, P23 has the table, and on a phone three land on their tabs), a small violet
  ripple spreading round it as it lands; then it Dives out of its nest, the nest going back to a plain cell, its boxes
  fading in once it is gone, and comes up in a cell of its own in the field's last column — the six one above the
  other, centred down it, Bali at the top — where they stay, breathing and blinking (P23 has what stands under that
  column at each size: nothing keeps it free yet). They bounce, jump and dive as `INTRO_ACTIONS` says (`content/actions.ts`, each action copied whole
  from its current version in the motion studio).
  **Both files are snapshots, not links**: the page holds no database key, so when he publishes a new version of a
  look or an action, copy it again from the local database's `studio_versions` (the item's `current_version_id`), or
  the page keeps the old one: `node e2e/.mcp/intro-snapshot.mjs` (gitignored) rewrites both files from the local stack. The tagline behind the grid is held with them (`data-intro-held`). `node
  e2e/.mcp/agent-intro-v8.mjs <out> [w|pixel] [h] [scheme] [ms…]` shoots it on the page's own clock and logs who jumps,
  who dives, when each lands, where each settles and which boxes stand under those cells; `node
  e2e/.mcp/intro-settled.mjs <out>` checks them resting under reduced motion and after a resize; `node e2e/.mcp/intro-end.mjs [w] [h] [runs]` times when it hands over; and `node
  e2e/.mcp/intro-fps.mjs [w] [h] [cpu]` times its frames. D49 had taken the loader off
  (P22), where it had turned for 2s at the least (D48, P19), and the grid drew itself in before that (D31). It takes `cursor`
  (D34, D43): the pointer is a violet ring that fills while pressed, and the cell under it turns its dashes violet.
  `node e2e/.mcp/no-loader.mjs <url> <out> [w] [h] [scheme]` times the first box, checks nothing of the loader is on
  the page. **Nothing wakes after the intro** (P16 withdrawn, 2026-10-01, his: "after they load, they uh, glow up. So
  I don't think we need that anymore"): a box is in its own colours as soon as the intro fades it in. Until then every
  box came in faded into the page, keeping 40% of its colour, and brightened as a front from the avatar crossed it
  (`WAKE_MS`, `wakeFront`, the registered `--box-active`, all gone). **No modes and no
  blur** (P21, 2026-09-30, his: "remove both focus modes from the portfolio … I did not like it in the portfolio"):
  the card under the pointer in focus with the page blurring round it (P18, hyper focus) and focus mode's panel and
  cloth (P20) went, with their row (`modes.tsx`), `CardFocus`, `data-focus-group`, `data-vertical` and `only`. Their
  motions stay the system's (`useFocusMotion`, `useModeMotion`, the `--motion-focus-*` and `--motion-mode-*` tokens) and
  play on the motion studio's pages 5 and 6.
- **The pieces that were in the room** (P15, P4, `cards.tsx`): under the avatar and the name, **his line and More
  about me** (`AboutCard`, 2026-10-01, his: "the tag line should replace the card like other taglines. And then add
  'More about me' button which opens a model with the text from the card"): "I'm a developer at the intersection of
  system design and design systems." (`profile.lead`) as a `StatementCard`, and on its last line, at the card's right
  edge, a lime button one cell big with a → (his, the same day: "make it filled with lime but make it only one cell and
  just put a right arrow icon", then "the same last line … completely right side"), its name its label and tooltip,
  that opens the system's `Dialog` with
  his six paragraphs (`profile.story`). Three
  rows; it `grow`s, so it is shown only where it has them (not on a phone or a tablet, where the work has the rows, nor
  at 1280 × 720, where the work takes them). It replaced What I am after, a `NoteCard` of the six paragraphs from
  2026-09-27 (his: "the about me text should be just below the avatar and name row"), which is unused since. Under it, **Email · Résumé**
  (`ProfileLinks`, `below`) — **Email · GitHub · Résumé** since 2026-10-01 (his: "place GitHub between email and
  resume … give it the size of the resume button and also put the text GitHub in it"): his address,
  hiddenstack@no-origins.com, in a card with a button that copies it (`EmailCard`) — the card is the address's
  `mailto:`, its border lime under the pointer, the copy button over the link (2026-10-01) — then GitHub's mark and name
  on an outlined pill (`GitHubCard`, the same hover), then Résumé ↗ on the system's lime Button (`ResumeButton`,
  2026-09-28, his: "the resume button with filled lime color … place it on the right side of email"). One row on eight
  cells, 4 · 2 · 2; two rows on six (1440 × 900, a tablet, a phone; his pick), the address alone and then GitHub ·
  Résumé, three cells each (`LINKS_ROW` in `site.tsx`). Then the degree taking what the city leaves, and Hyderabad
  (`ProfileFacts`; GitHub's mark stood at its start from 2026-09-28 until it went into the links — the degree drops its
  cap under 228px and steps to the caption's size under 190, P5) — the last of the column since 2026-10-01. **The social
  marks** are the socials section's (above): each a `SocialMark`, a simple-icons mark in the text's colour (his: lime
  "looks very inconsistent") on a cell of its own, a circle, a link out in a new tab with its name as its tooltip, from
  the column's start. X and Instagram are @hiddenstack. LinkedIn, Discord and YouTube stand with no link until their URLs
  are filled in `LINKS` (his: "we'll add the URLs later" — the one exception to P6). LinkedIn's path is in
  `profile-card.tsx` (`LINKEDIN`): simple-icons and lucide have none. The years are off the page (not in his
  list; `profile.years` is kept). The hobbies are the third column's interests since 2026-09-27 (named so 2026-10-01),
  each a `SkillPill` wrapped after a palette's label cell, under his AI statement. **The projects are a carousel**
  (`ProfileProjects`, `profile-projects.tsx`, 2026-10-01, his: "I did not like the cards … keep the image … remove the
  text … expand the card to another row … place the name of the project", then "like a carousel not vertically
  stacked", "only two columns width and three rows height"): a card two cells by three rows for each project, its
  image a step inside the border at the top and the sides, a lime and violet gradient until there are pictures (the
  no-gradient rule's one exception, his), and its name a step under it in `heading` (his: "a little bigger and bolder";
  the body's size on a phone's narrow cards), the image taking the rest (his: "reduce that gap"). No Origins' card is
  its link, lime-bordered under the pointer. The cards stand side by side in the system's `Carousel`, a whole number
  of cards in its window so every stop is on the cells, one card a turn; ‹ › on the label row's end cells where there
  are more than fit (on the row under the cards, with "1 / 2", in the phone's tab), turned by them, a swipe or a drag,
  never by ← → (D45). Agents Society is **Orbit** since 2026-10-01, and two dummies, Project 3 and Project 4
  (`DUMMY_PROJECTS`, `resume.ts`), follow his two "so that it feels like a carousel". (From 2026-09-28 the cards were
  the recruiter quick view's, as wide as the column, a square image at the left and the name, the line and "Explore
  the system ↗" beside it.) The degree went
  into the first screen's columns on 2026-09-27, and the languages came off. **Each section's label is its first
  row** (`SectionCell`): the whole row with no border, a `background` slot that stops the field's lines, the section's
  icon in the secondary colour (violet) and its word after it in `body`, centred on the column (2026-09-28, the
  recruiter quick view's labels; it was a transparent pill in `caption`, as many cells as the word needed). The interests, the socials' marks and the Work In Progress pill wrap from the row under it (`CellWrap`,
  every `wraps` starting with `LABEL_ROW`), the projects' cards stand under it (`lead` on `ProfileProjects`), the tech's marks flow from the row under it (`lead` on `ProfileTech`), and
  the company marks stand under it (`lead` on `ProfileWork`). Where the rows do not hold it, the label goes. A column
  beside the centre that is short of rows even with no air loses its last items, whole, first (2026-09-28), and then
  gives up its air, the last first (`arrange.ts`). **His statements** (2026-09-28, his: "break down that large piece
  about me into small statements", the note kept for now) are `StatementCard`s (`cards.tsx`): a Card the page's
  colour with no border and no padding top and bottom (2026-10-01, his: "I don't want a background behind it"; it was
  the muted surface; the sides keep the card's, which Anton's opening quote overhangs into),
  the words in quotes in **Anton at the display size** (`StatementWords`, the same day, his: "the biggest font that we
  had, which is also thick", and his pick of Anton over the display role), muted. The one about AI is over the Technical skills label and
  takes its rows from the tech (`profile.statements.ai`; `STATEMENT_AI` in `site.tsx`). The one about roles stood under
  the projects, in the case studies' rows on a twelve-row field, until 2026-10-01 (his: "remove the love being in new
  roles … tagline"); its words are kept. The degree has no label cell
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
  company and the years in `caption`, left-aligned since 2026-09-28 (TTT where the full name does not fit). Five rows,
  one a company; with fewer, the label goes first, then the oldest company. He allowed two rows a company, and none
  needs them. The Tabs, the active company's growth and its card of lines and stack went (the lines are still in
  `resume.ts`), and nothing in the column is a Tab stop. (`work-tabs.mjs` pressed the tabs; there are none to press.)
  **The keys go in reading order** (Grid.md D45): `PortfolioPages` calls
  `useReadingFocus` on the box holding the backdrop and the grid, so Tab runs line by line — at 1440 × 900 (2026-10-01) the avatar, More about me, then the tech's marks a row
  at a time, the projects' › taken on its row between them, then No Origins, the address, its copy button, GitHub, the résumé, and X and Instagram in the socials — and ← → ↑ ↓ always move focus (the first press lights the avatar) and never turn the page; `node e2e/.mcp/focus-order.mjs [w] [h]
  [keys]` prints where each key lands. The centre stands level with the columns' top, their labels and all, not centred down between them. The tech stack (`profile-tech.tsx`) is
  a simple-icons mark a cell, the text's colour, in the profile's column under his line since 2026-10-01 (the third
  column's first until then), a grower in the flow: as many marks as the rows the column leaves it hold, at least three
  rows or it is not shown there (16 marks at 1440 × 900, all 23 at 1920 × 1080, none at 1280 × 720). **A hovered or selected mark grows to spell its name, and the rest
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
  pill); on a `Grid` a card mounts as soon as the field is measured (no intro holds it since D49), so a card that
  animates on arriving can start when it mounts.
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
