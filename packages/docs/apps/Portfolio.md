# No Origins — Portfolio

*The portfolio at `hiddenstack.no-origins.com`: what is on it, how it is arranged on the grid, and how its pages turn.
Rule numbers are this document's own, P1 onward, and source comments cite them.*

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

Companion documents: **Brand.md** (§5, the voice), **Agents.md** (the six agents), **Grid.md** (the field; D45 reading
order, D50 the intro), **Motion.md** (M9 movement, M22 the intro, M24 the actions), **Slots.md**, **Type.md**,
**Status.md**, **Orbit.md**, **Admin.md §0.6** (the page is static), **Brainstorming.md** (who visits and why).

Paths below are under `apps/portfolio/` unless they say otherwise.

---

## 1. What it is

- **One route, `/`.** Its content is his résumé and his own words (P6); its layout is the grid's field; every visible
  element is composed from `@no-origins/ui`. The app's own pieces (`cards.tsx`, `profile-*.tsx`, `agent-pill.tsx`,
  `status-pill.tsx`, `hey-overlay.tsx`) are compositions of the system's components, nothing hand-rolled.
- **Six pages, one agent's section each** (P24), on a `Grid` with no pager bar. A scroll, a swipe, Page Down / Page Up
  or a click on an agent at home turns the page, and the agents play the turn. Nothing scrolls, and what a field has
  no room for is not shown.
- **The agents open it** (P23). The page holds no database key (Admin.md §0.6), so their looks and moves are copied
  into the app.
- **The grid takes `overlay` and `cursor`**: the field's dashes, and the pointer as a violet ring with the cell under
  it lit violet (Grid.md D34, D43). `d` flips the theme (Grid.md D28).
- **The shell is the theme and the fonts** (`src/app/layout.tsx`): no nav, footer or container. The faces are Inter
  (`--font-sans`), Montserrat (`--font-heading`), Geist Mono (`--font-mono`) and the app's own **`--font-display`,
  Anton**, which the HEY!'s word and his statements wear.
- **The accent jig** (`src/components/jig.tsx`, development only, on `?jig`) retunes the system's primary, secondary,
  `--muted` and `--accent` on the live page and prints the settings to send back. Its defaults are what shipped, lime
  and violet, so an untouched jig changes nothing. It stays, to be showcased in experiments (his).

## 2. The rules

**P1 — It lives at `hiddenstack.no-origins.com`, and `bhargav.no-origins.com` redirects there.** The redirect is
permanent (308), path and query intact, a `has: host` rule in `next.config.ts` (`CANONICAL_HOST`), so it goes with the
app wherever it is deployed. Both hosts are attached to the Vercel project `no-origins`.

**P2 — A page is arranged on the field it is shown on.** A page is its items — each an id, a span per breakpoint and a
render function (`src/content/site.tsx`; the model is `src/content/index.ts`) — and an arrangement: a function from the
live field (`bp · cols × rows`, as the grid reports it) to boxes on that field. Nothing is authored on a reference field
and derived. The portfolio's arrangement is `arrangeAgent` (`src/lib/arrange.ts`, P24). The showcase, the admin and the
login arrange their pages the same way (P8; the showcase's are sections, P7), each with its own copy of the packer
(`arrange.ts` in each app): a copy, not a package export, because the packer is one of Grid.md's open questions and
the package must not decide it.

**P4 — Who he is comes first, and every section is drawn on the field's own cells.** What each page holds, top to
bottom; which agent's page it is and the order they turn in are P24. Every box is a `GridItem` holding an
app-specific island composed from the design system; a Card is a box already and goes on the grid unwrapped (Grid.md
D21).

*About me — page 1, Bali's.* Seven rows on a pointer, eight on touch; eight cells wide on a pointer, six on touch.

- **The profile** (`ProfileCard`), two rows: his avatar in a card two cells square, and his name and role in the card
  beside it, a gutter between. The face fills its card less a gutter all round, inside a lime ring (`--stroke-accent`,
  3px, 3px clear of the face): 96px on a pointer, 120 on a tablet, 78 on a phone. The name, **Bhargav**, is `display`
  where its card is 400px wide or more, `title` from 300, `heading` under that; under it the role, *Senior Full Stack
  Developer*, in `label` and the `lime` tone (Type.md T4). Both are centred and balanced. The role names no company
  (P9).
- **The HEY!** (`hey-overlay.tsx`). A click, Enter or Space on the face flings it out of its card and onto the screen
  with the word HEY! in Anton, portalled to the body because a slot clips. The face is one of two HEY faces
  (`profile.heyFaces`), picked at random. It holds 0.5s once landed and falls off; a click anywhere or Escape takes it
  down sooner. Two motions are on trial, `slap` and `snap`, played turn about (`HEY_MOTIONS`). Under reduced motion it
  shows the held frame.
- **His line** (`AboutCard`), three rows: *“I'm a developer at the intersection of system design and design
  systems.”* (`profile.lead`), drawn as his statements are (below), and on its last line, at the card's right edge,
  **More about me**: one cell, the system's `Button` in lime with a →, its name its label and its tooltip. It opens the
  system's `Dialog`, *About me*, with his six paragraphs (`profile.story`), all of them, since a dialog does not clip.
- **Email · GitHub · Résumé** (`ProfileLinks`). His address, hiddenstack@no-origins.com, in a card that is its
  `mailto:`, with a lime ghost button over the link that copies it (a check for 1.6s after; where the browser refuses
  the clipboard, the address is selected for the keys). GitHub's mark and name on an outlined pill, in a new tab.
  **Résumé ↗** on the system's lime `Button`, the PDF in a new tab. One row on eight cells, 4 · 2 · 2; on six, the
  address alone and then GitHub · Résumé, three cells each.
- **The degree · Hyderabad** (`ProfileFacts`), one row: the degree's pill — a cap, *Computer Science (Hons.)* over
  *LPU · 2017 — 2021* in `caption` — taking what the city's two cells leave, and a pin with *Hyderabad*.

*Tech stack — page 2, Mira's* (`ProfileTech`). The label, and under it a mark a cell for 23 of the stack, in `STACK`'s
order: simple-icons' (CC0), half the cell less a step of the spacing scale, in the text's colour, straight on the field
with no tile. Five rows of eight cells on a pointer, six of six on touch, which keeps a row spare for what a grown mark
pushes over.

- **A hovered or selected mark grows to spell its name, and the rest move on.** This is movement (Motion.md M9),
  played by the system's `useCellMotion` on the `--motion-move-*` tokens, never by numbers copied here. The grown mark
  takes as many whole cells as its mark and name need; a mark pushed past a row's end comes in at the start of the
  next; only the marks travel. The names are the résumé's (Tailwind, Postgres, GCP, Apollo).
- **The grown mark** is ringed in lime over a lime wash (`ACTIVE_FILL`, lime 12% mixed into the card), its name lime on
  dark and the ink on light, its mark in its brand's colour — unless the brand is near black (Next.js, Express, Rust,
  shadcn, Ollama) and would vanish on the dark theme. The other marks have no ring.
- **Hover is read from the cell under the pointer** (mouse and pen), never from the mark, which moves. A click, a tap,
  Space or Enter selects a mark, which stays grown until it is pressed again. Every mark is a Tab stop in reading
  order, and focus alone never grows one: the marks it pushed would move under the keys.

*Work — page 3, Oru's* (`ProfileWork`), five rows: the label, then a row for each company, newest first as the résumé
lists them — Radise, Dataflix, Hashnode, Terribly Tiny Tales. Each row is the company's mark in a bordered circle one
cell big (P12) and, on the rest of the row, a pill: the role over the company and the years in `caption` (*Radise ·
2025 — Present*), left-aligned, 16px inside each round end. The company takes its short name (TTT) where the full one
and the years do not fit. Nothing in it is pressed, so nothing is a Tab stop. What he did at each company and its
stack are in `resume.ts` (`ROLES`), not on the page.

*Projects — page 4, Kino's* (`ProfileProjects`). The label's row, and under it cards two cells by three rows, side by
side in the system's `Carousel` from the column's start. Its window is a whole number of cards, so every stop is on the
field's cells, and it turns a card at a time. Where there are more cards than fit, ‹ and › stand on the label row's
first and last cells, circles, the label between them. The arrows, a swipe and a drag turn it; ← and → do not, since
they move focus (Grid.md D45); a swipe across it turns the carousel, not the page.

- **A card** is its image, 8px inside the border at the top and the sides, and its name centred under it in
  `heading`, 8px from the image and 12px from the card's foot (the body's size on a card under 112px). The image's
  radius is the card's less the inset, `--radius` − 8px (Grid.md D39's second exception). A project with a URL is its
  card's link, in a new tab, the border lime under the pointer and the keys' focus.
- **The image is a lime and violet gradient with grain until there are pictures** (`FILLS`, `NOISE`): one card lime
  into violet and the next the other way, mixed in oklab through a pale step of each, under fractal noise blended
  `overlay`. **This is the no-gradient rule's one exception** (his): a stand-in for a picture, not a surface, and it
  licenses no gradient anywhere else.
- **The cards**: the projects with a link first, then the rest, then two dummies — No Origins (the showcase,
  `design.no-origins.com`), Orbit, *Project 3* and *Project 4* (`DUMMY_PROJECTS`), so the carousel has somewhere to
  turn.
- **The case studies** stand under them, a row of air between: the label and a *Work In Progress* pill.

*Interests — page 5, Lola's.* His statement about AI — *“Today, AI shortens the path from idea to execution, creating
more room for exploration and experimentation.”* (`profile.statements.ai`), three rows, five on a phone's narrower
cells — and under it, a row of air between, the interests: the label and a pill each for Sketching, Oil painting,
Designing, Editing and Ukulele (`HOBBIES`), each as many whole cells as its words need (`INTEREST_PILLS`), wrapped
along the rows (`CellWrap`).

*Socials — page 6, Zaza's.* The label and a mark a cell (`SocialMark`): X, Instagram, YouTube, LinkedIn and Discord,
the two with a URL first. Each is a Card the radius makes a circle, the mark in the text's colour, its name its
tooltip. LinkedIn's path is in `profile-card.tsx` (`LINKEDIN`), since no icon set draws it. X and Instagram are
@hiddenstack, links out in a new tab. YouTube, LinkedIn and Discord have no URL yet: their marks stand with no link,
are not pressed and are not Tab stops (P6).

*Throughout.*

- **A section's label is its first row** (`SectionCell`): the whole row with no border, a `background` slot so the
  field's lines stop at it, the section's icon in the secondary colour (violet, 20px) and its word in `body`, 8px
  apart, centred. A briefcase for Work, a folder with a branch for Projects, a code mark for Tech stack, an open book
  for Case studies, a palette for Interests, an at sign for Socials (lucide). Pieces under a label wrap from the row
  under it (`CellWrap`).
- **His statements** (`StatementCard`) are a Card the page's colour with no border — opaque, so the field's lines stop
  at it — the words in curly quotes, in Anton at the display role's size, muted, at normal weight and tracking. The
  card keeps its side padding, so its clip never takes the opening quote's overhang, and has none top and bottom.
- **A pill is a Card one row tall**, which the one radius makes a pill (Grid.md D39), its content centred across the
  whole of it (`FactCard`).
- **A card that is a link turns its border lime** under the pointer and while the link has the keys' focus
  (`LINK_CARD`): the address, GitHub, a project.
- **Line icons are 20px**, the line of the `body` text beside them, so they draw one weight; an icon and its words are
  8px apart, a step of the spacing scale (`ICON`, `ICON_GAP`).

**P5 — A card gets denser as its slot gets smaller; it never clips.** A slot clips (Slots.md), so a card reads its own
size off the grid (`useGridMetrics`) and steps down rather than be cut: the name's role by its card's width; the
address to the caption's size in a card under 227px; the degree drops its cap under 228px and its subject steps down
under 190; the city loses its pin where two cells are under 130px; a project's name steps down on a card under 112px; a
section's label goes before what is under it; the work drops its oldest company; the tech stack shows only the marks
that fit with one of them grown; `CellWrap` draws no piece past its rows. A card that is cut off is in a span that is
too small. **The mirror: a card whose air pools in one place is in a span that is too big.** The hole is the surplus;
measure it and give the span back, rather than guess. The showcase holds its specimens to the same rule.

**P6 — The content is a file, in his voice.** `src/content/resume.ts` holds every fact from the résumé, written first
person and plain (Brand.md §5), and his own words where they are not the résumé's: his line, his statements, his six
paragraphs, his interests. Nothing is invented to fill a slot, and **a link with no value is not rendered** — with one
exception, his: a social mark with no URL yet (YouTube, LinkedIn, Discord) stands with no link until its `href` is
filled in `LINKS`. The name on the page is **Bhargav** (`profile.name`): the name card, the avatar's label and the
tab's title. The résumé, `public/bhargav-reddy-v.pdf`, is public, so what it prints is public, the full name and the
phone number included. What the file holds that no page shows — each role's lines and stack, the skills, the
languages, the years — comes back only as he decides.

**P7 — A reading page is sections, one a screen.** Every section starts a new page, packs its items in reading order,
first-fit, and spills onto more where the field is short (Grid.md D5). Each section has a one-row header — its number,
its name and its title — above its items, the title a role smaller on a narrow slot. The showcase arranges its pages
so (`apps/design/src/lib/arrange.ts`, `SectionHeader` in its `specimen.tsx`). The portfolio's pages are one agent's
section each (P24), with no header.

**P8 — The content keeps a measure; the field is margin.** The packer's band is a number of columns per breakpoint
(`BAND_COLS`) — the showcase's 6 · 6 · 8 · 12 · 16 (`base` · `sm` · `md` · `lg` · `xl`), the admin's and the login's
twelve from `lg` up — centred on the field: a wider field gets the band with air round it, never a page stretched to
its edges. Spans are per breakpoint and chosen so a card is the same physical size wherever the cell
differs (Grid.md D13): six rows of 72 and seven of 60 are both 492px. A page's block is centred in the band and in the
room — across, so a lone box stands on the field's centre line (Grid.md D26), and down, in the rows above the pager's —
and an odd remainder leans to the top and the left. The showcase, the admin and the login pack this way (P2). The
portfolio's pages are centred on the field by `arrangeAgent`, at their own spans (P24).

**P9 — No company mark on the profile.** The profile is who he is; where he has worked is the work page's (P4).

**P11 — GSAP animates what is inside a box.** Motion in a box's content is GSAP, the system's rule (packages/ui
CLAUDE.md, rule 7): here the HEY! (`hey-overlay.tsx`); in the system, `Progress`'s `animate` and `delay`, which grow a
bar's fill as it mounts, reduced motion drawing it full at once. How the field itself moves is the grid's (Grid.md).

**P12 — A company's mark is its own file, on the theme's ground.** The marks are the companies' published logo files in
`public/logos/` (`CompanyLogo`, `logo.tsx`), with no tile under them in either theme, so a mark drawn in black —
Terribly Tiny Tales' disc — reads as a dark disc on the dark theme. A mark keeps its proportion. On the work page it is
half the cell less a step of the spacing scale tall, a wordmark (Radise) up to half as wide again, in a bordered circle
one cell big.

**P21 — No modes and no blur on the portfolio.** Neither hyper focus (Motion.md M13) nor focus mode (Motion.md M14)
plays on the page; both play on the motion studio's pages 5 and 6 only. Nothing on the page blurs, so the no-glass rule
holds here with no exception, and nothing on it sets the grid's `data-cursor-still` (Grid.md D34). More about me's
dialog does not blur the page either: the system's overlays carry no backdrop blur.

**P23 — The agents open the page.** The page's `Grid` plays its intro (Grid.md D50, Motion.md M22) with the six agents
(Agents.md).

- **The cast** (`INTRO_CAST`, `src/content/intro.ts`) is the six in page order (P24), the order they stand in at home,
  each with whether it bounces: **Bali, Kino and Mira bounce**; Zaza, Oru and Lola rest. Who bounces is kept apart from
  the looks, so a new snapshot does not lose it.
- **The looks and the moves are snapshots.** `src/content/agents.ts` holds each agent's current version in Orbit,
  copied whole; `src/content/actions.ts` holds Bounce, Jump and Dive (Motion.md M24) as their current versions in the
  motion studio. The page holds no database key, so a version he publishes later reaches it only when it is copied
  again: `node e2e/.mcp/intro-snapshot.mjs` (local, gitignored) rewrites both files from the local database's current
  versions, reading it and never writing it. Publish baking them is the way out of the copy.
- **Who opens what**: every item names its agent in `by`, which its box carries as `data-intro-by`; the first name is
  whose page the item is on.
- **What plays**, once per document load: the six stand side by side in one row on the field's middle, a cell each, in
  a random order. Bali, Kino and Mira bounce, each at its own random times, for 2s, while the rest breathe and blink.
  Then Bali goes to the cell the page's agent stands in (`stand`, P24), its small violet ripple spreads, and page 1
  fades in; the other five go home. Home is a cell each in the field's last column, one above the other and centred
  down it, Bali at the top — along the bottom row on a field taller than it is wide. They rest there, breathing and blinking, for as long as the page is open, and
  stand there at once on any field the grid is given later. Under reduced motion there is no intro: the agents are
  drawn in their cells, still.

**P24 — One agent's section a page, and the agents turn it.**

- **The pages** (`PAGES`, `src/content/site.tsx`), in his order:

  | Page | Agent | Its name (`PAGE_TITLES`) | What it holds (P4) |
  |---|---|---|---|
  | 1 | Bali, the Guide | About me | the profile, his line and More about me, Email · GitHub · Résumé, the degree and Hyderabad |
  | 2 | Mira, the Editor | Tech stack | every mark |
  | 3 | Oru, the Keeper | Work | the four companies |
  | 4 | Kino, the Maker | Projects | the projects, and the case studies under them |
  | 5 | Lola, the Muse | Interests | his statement about AI, and the interests |
  | 6 | Zaza, the Scout | Socials | the social marks |

- **A page is its section alone** (`arrangeAgent`): the items its agent opens, in `site.tsx`'s order, one under the
  other, each at its span (no wider than the room) and with its `air` over it, none over the first; centred across the
  field — never into the agents' column, nor the line of air before it — and down it. The agents' cells are kept free.
  **Short of rows, an item that `grow`s gives up rows first, down to three (`FLOW_GROW_MIN`), and then the last items
  are left off, whole**: nothing is squeezed and nothing scrolls, and what the field has no room for is not shown. The
  phone's tabs (`compact`) are on no page, since every section has a page of its own.
- **The agent of the page** stands in one cell while its page is on the field, its cell at home empty. On a field wider
  than tall it is the same cell for every page: the third row from the bottom, at the field's centre — the left of its
  two middle cells, since the count is even (Grid.md D26) — lower only where the tallest page needs the rows above it
  (at 1280 × 720, eight rows deep, the bottom row). Every section stands over it, a row of air between where there is
  one. On a phone it is the cell below the section, at its centre. The cell is `stand` from `arrangeAgent`, given to the
  grid as `introFocusAt`.
- **Its pill opens by hover** (`agent-pill.tsx`). A mouse or a pen on the agent opens a pill three cells wide beside
  it, to its right where it fits before the agents' column, else to its left (`AgentPill`): the agent's name in
  semibold, a chat button, and ↗ to Orbit (`orbit.no-origins.com`, its front page) in a new tab. It stays while the
  pointer is on the agent or the pill and closes 200ms after it has left both. The agent is the grid's drawing and
  takes no pointer, so a round button its cell's size stands under it (`AgentSpot`, `useAgentPill`) for the pointer, a
  finger, the keys and a screen reader: a tap opens and closes the pill, and the keys' focus opens it, Enter toggling
  it. Escape closes it and puts focus back on the agent; a press anywhere else, or a turn, closes it too. **The chat
  button is drawn and does nothing**: there is no chat yet.
- **A click on the agent bounces it.** A click, a tap or Enter plays his Bounce where it stands (`introAct`), the
  intro's action and values — never while it is in the air, while the page turns or while the intro plays.
- **A click on an agent at home turns straight to its page.** Every home cell but the empty one has a spot under the
  drawing (`AgentHome`), lit as a ghost button is under the pointer and named by its page and its agent (*Tech stack,
  Mira's page*). The cells are `homes` from `arrangeAgent`.
- **The turn.** One scroll is one turn: the first wheel event of a gesture turns the page and nothing more of that
  gesture does; a new gesture is a wheel event after 200ms with none, and one under 4px is a hand resting. Either axis
  turns it, and a positive delta is forward, never negated (Grid.md D27). A swipe of 40px or more turns it too, a finger
  moving left or up going forward; so do Page Down and Page Up, and a click on an agent at home. Nothing turns it while
  the intro plays or a page turns, the first and last pages go no further, and a dialog over the page keeps its own
  wheel and keys. The section on the field fades away while its agent Dives home; the next agent Dives from home to its
  cell, its ripple spreads, and its section fades in — about a second (Grid.md D50).
- **Fixtures.** The agent's cell, the agents at home, the pill and the status pill (P25) carry `data-intro-fixed`: a
  turn leaves them where they are.
- **The keys read in order** (Grid.md D45). `PortfolioPages` calls `useReadingFocus` on the box that holds the grid, so
  Tab and ← → ↑ ↓ move focus as the boxes stand and never turn the page. The agents at home are read after the page
  (`data-reading-after`): Tab goes through the page's stops and the status pill, then down the agents, Enter on one
  turning to its page.

*Open, his to decide:* the case studies sharing Kino's page — a page of their own needs an agent of their own, or an
agent with two pages; whether the last page wraps round to the first; and leaving off what does not fit rather than
making it smaller.

**P25 — The status pill.** The way from the portfolio to the status page (Status.md), where every app stands
(`status-pill.tsx`).

- **At rest** it is a bordered circle one cell big on the field's bottom-right cell, a violet dot in it (`--secondary`,
  half the cell less a step of the spacing scale). Where an agent's home is that corner (a field six rows deep) it takes
  the cell left of it; on a phone, where the agents have the bottom row, it is the right end of the row over them. Its
  cell is `status` from `arrangeAgent`.
- **The pointer on it, or the keys' focus, and it grows left to three cells**: the dot stays in its cell, *Status
  page* ↗ comes in beside it, and its border turns violet. The growth is movement (Motion.md M9), played by
  `useCellMotion` on the tokens and mirrored, since it grows from its right edge. Leaving it, it closes the same way.
- **The whole pill is the link**, to `status.no-origins.com` in a new tab, so a finger with no hover taps the circle and
  goes. A screen reader hears *Status page (opens in a new tab)*.
- **It is a fixture** (P24): hidden while the intro plays, there when it hands over, and still through a turn.

*Open, his to change:* the dot's size, the three cells, the violet border, where it goes on a phone and on a six-row
field, and a cue before the hover that it is a link.

## 3. Where it lives

| Thing | Where |
|---|---|
| The page model (`PortfolioPage`, `PortfolioItem`, `PortfolioField`) | `src/content/index.ts` |
| The items, their spans and their agents (`by`); the pages' order (`PAGES`) and names (`PAGE_TITLES`) (P2, P4, P24) | `src/content/site.tsx` |
| The facts and his words (P6) | `src/content/resume.ts` |
| One page on the field: its boxes, its agent's cell, the pill's, the homes, the status pill's (P24, P25) | `arrangeAgent` in `src/lib/arrange.ts` |
| The renderer, the turn and what triggers it (P24) | `src/components/portfolio-pages.tsx` |
| The intro's cast, the agents' looks and their moves (P23) | `src/content/intro.ts`, `agents.ts`, `actions.ts` |
| The agent's cell, its pill and the agents at home (P24) | `src/components/agent-pill.tsx` |
| The status pill (P25) | `src/components/status-pill.tsx` |
| The profile, the links, the degree and the city, the social marks (P4, P5) | `src/components/profile-card.tsx` |
| The HEY! (P4, P11) | `src/components/hey-overlay.tsx` |
| The tech stack (P4) | `src/components/profile-tech.tsx` |
| The work (P4) | `src/components/profile-work.tsx` |
| The projects (P4) | `src/components/profile-projects.tsx` |
| Section labels, the wrap, his statements and More about me, the pills (P4) | `src/components/cards.tsx` |
| A company's mark (P12) | `src/components/logo.tsx`, `public/logos/` |
| The accent jig (§1) | `src/components/jig.tsx` |
| The redirect (P1) | `next.config.ts` |

## 4. Open

- **LinkedIn, Discord and YouTube** — their URLs (P6).
- **The HEY!** — `slap` or `snap`; both play turn about until he picks one (P4).
- **The projects** — pictures for the cards, and his own projects in place of the two dummies (P4).
- **The case studies** — what goes in them, and whether they get a page of their own (P24).
- **The tech stack** — marks for the twelve of the stack that simple-icons does not draw: Zustand, Jotai, gRPC, Tiptap,
  Auth.js, AWS, AWS CDK, IBM, AutoGen, Atomic Agents, OpenAI, and SQL, which is not MySQL's. They come in as he gives
  them.
- **The chat** behind an agent's pill (P24).
- **Lime text on the light theme** (Type.md T4): the role line is lime, about 1.3 : 1 on white. His to decide.
- **Translucency**: More about me's dialog keeps the system overlay's 20% black. His to decide.
- **The agents' snapshots** — Publish baking the looks and the moves, so they stop being copies (P23).
