# No Origins — Portfolio

*The portfolio at `hiddenstack.no-origins.com`, rebuilt on the grid. Opened 2026-09-21, the day the first screen was
built. Bhargav's words are quoted; the rest is the record of what he decided. Rule numbering is this document's own,
P1 onward.*

Companion documents: **Brand.md** (§5 voice, §9 the seven sections this portfolio will eventually hold),
**Grid-v2.md** (the field every page is on), **Slots.md** (a card on the grid is a slot holding a component),
**Type.md** (every piece of text is a `Text`), **Admin.md §0.6** (the page is static, a component may be live; its quest host was withdrawn with quests, §0.7),
**portfolio/Brainstorming.md** (user personas, journeys, and UX brainstorming).

---

## 1. What it is

**Bhargav, 2026-09-21:** *"To build create response and beautiful portfolio from my resume. We should always use our
layout grid from our design system."*

The portfolio is the first block on No Origins (Brand.md §1) and the first app to be **designed on the grid** rather
than ported to it. Its content is the résumé; its layout is the field; its components are the design system's. Nothing
in it scrolls: what does not fit a screen goes to the next page, turned with ← → (Grid.md D5, D23). *Since
2026-09-27 (P15) it is one page: what the first screen has no room for is not shown.*

## 2. The rules

**P1 — It lives at `hiddenstack.no-origins.com`.** *"Portfolio will be hosted on hiddenstack.no-origins.com.
bhargav.no-origins.com should also redirect to hiddenstack.no-origins.com."* The redirect is permanent, path and query
intact, and is a `has: host` rule in the app's Next config so it goes with the app wherever it is deployed. Both hosts
are attached to the same Vercel project (`no-origins`); attaching the new one is his step in the Vercel dashboard.

**P2 — A page is arranged on the field it is shown on.** A portfolio page is its items plus an **arrangement** — a
function from the live field (`bp · cols × rows`) to pages with every coordinate on that field. It is not authored on
a reference field and derived, because the first screen's one rule is about the top of *this* field (P3), and D25's
centring of a kept page would not honour it. When the composer has been over a page and its export pasted back
(Grid.md D20), the authored `layout` is added beside the arrangement and wins. **Withdrawn 2026-09-23 (Grid.md
D30):** the composer and its export are gone, so the arrangement is the whole of a page.

**P3 — An empty row on top where there is room for one; on a phone and a tablet the content takes it.** It began as
one row everywhere — *"let's leave 1 row on top in all breakpoints for first screen"* — and was **amended the same
day**: *"in small to md devices, instead of leaving the first row empty, let's not waste that space and use it."* So
`base`, `sm` and `md` start at row 1 and `lg` and `xl` keep the air (`TOP_ROWS` in `arrange.ts`). The split falls on
the line the cell already falls on (Grid.md D13, 72 for fingers and 60 for pointers): a touch field is six to twelve
rows deep, so a row there is a tenth of the screen and costs a card, while a pointer field has the room. The row is
air, not a nav — the portfolio has no chrome above the grid — and the bottom row is always the pager's (D27). *Since Grid.md D27 (the same day) the bottom row is the pager's at every breakpoint too, so the card has
`rows − 2` to work with.*

**Amended 2026-09-26: at most four empty rows over the first screen.** *"Leave only a maximum of 4 rows above in the
first page."* The first page is still centred down (P8), until the rows left empty over its whole block — the tagline
included, and the reserved top row counted — would be more than four; then it stands four rows down
(`FIRST_SCREEN_AIR` in `arrange.ts`), and what is left goes under it. Only a tall field meets it: the mock's 1743 ×
1341 had six rows over the tagline and has four; 1440 × 900 has three and 1280 × 720 two, as before. Every other page
is centred as it was.

**P4 — The profile card is the first thing on the page.** *"Add a profile card which will have my avatar, name, and
some information about me."* It is a `Card` on the grid unwrapped (Grid.md D21 — a Card is already a box) holding
`Avatar`, `Text` in its roles, `Badge`s for the facts and `Button`s for the links — **no company marks**, since P9 was
amended. **The name comes first and the role line under it** — his correction the same day: the first build had the
role above the name. Its span per breakpoint: **4 × 6** on a phone (the whole width), **6 × 6** on a tablet,
**8 × 6** on `lg` and **8 × 7** on `xl` — about 500px wide everywhere, and 492px tall on both cell sizes, so it is the
same physical card on every device (Grid-v2.md §5 P3). Centred on the field's width, which the even count makes a grid
line (D26).

**Amended 2026-09-25: one row, and nothing under the role line.** *"Remove everything below senior full stack
developer · Radise in the profile card … the avatar, the name and title will be in one card in a row."* The blurb, the
badges (where, how long, the handle) and the buttons are gone from the card; the email, GitHub and résumé buttons are
still on the Say hello screen, the blurb is still the page's description, and every fact is still in `resume.ts`. What
is left is **one row**: the avatar on the left with its ring (the HEY! still pops from it), and beside it the name in
`display` with the role line under it in `label`, the pair centred down the card. So the card is **two rows at every
breakpoint** — 156px on touch, 132px on a pointer — and **4 · 6 · 6 · 8 · 8 columns** (`md` gave back two, below). On
a pointer the two rows are 24px shorter than a touch pair, so there the card takes the small padding and the face is
88px rather than 96; under 360px wide (a phone) it is 64px and the name steps down to `title`, where name and role
each run to two lines. `md` went from eight columns to six because the row is about 470px and eight left 187px
pooled at its end (P9's rule: air in one place is a span too big); a pointer keeps eight because six is 420px, short
of the row, and seven is not even (Grid.md D26).

**And a quote under it, the same day.** *"I want to have a quote in a very subtle way … some tokens that reduce the
opacity … with our bold text, the title font, that says 'Start with curiosity. Let the stack overflow.'"* It went in
under the card in `title` and a new **`faint`** tone (Type.md T3), the pair centred as one block. *Moved over the card
the same day, below.*

**Then a tagline over it, in the display face and in quotes.** *"I have a different take on the tagline … using a
display font, and it should be at the top, as if it's absolute above the profile card — 'Start with curiosity' in one
line, 'Let the stack overflow' in the second line — and add quotes."* So `ProfileTagline` is:

- **In the display face** — the app's own `--font-display`, Anton, until now the HEY!'s alone — at the `display` size,
  36px, and still in the `faint` tone, which he did not take back. Anton has one weight, so the role's bold is set back
  to normal rather than let the browser fake a heavier one. Under 360px wide it steps down to `title`, as the card's
  name does: a phone's four columns are 324px and the second line is 326px at `display`. *(Six columns since
  Grid.md D33, 294 to 402px: a phone's tagline is `title` under 420.)*
- **In curly quotes, a sentence a line** — “Start with curiosity. / Let the stack overflow.” — each line kept whole.
- **Over the card, out of the flow.** It is an **`above`** item (`PortfolioItem.above`, `arrange.ts`): the page is
  packed and centred without it, so **the card is exactly where it was alone**, and the tagline takes the two rows
  directly over it, as wide as the card, its text at the foot of them so it stands a gutter above the card. Where the
  room over a centred card is short — an iPhone SE, one row — the card moves down just enough; what still did not fit
  would come off the tagline's height. Straight on the grid with no box, flush with the card's left edge.

The words are his and are not from the résumé; they live in `resume.ts` as `profile.tagline`. The `below` item that
put the quote under the card went with the move.

**And two lines under the card, and an @ in the role line, the same day.** *"Add @ between senior full stack
developer and Radise … below the card, use the Hyderabad logo that I have in the downloads folder … put the Hyderabad
logo in the cell without any container or anything, directly in the cell, and beside that write Hyderabad … before the
Hyderabad line, add six in the cell with display font, and beside that write 'years shipping products from 0 → 1'."*

- **The role line reads "Sr Full Stack Developer @ Radise"** — `@` where the `·` was.
- **Two lines under the card, each one row as wide as it**: first **"6+"** in the display face (Anton, at `display`,
  the résumé's figure) on one cell, and beside it *years shipping products from 0 → 1*; then **the Charminar** on one
  cell, and beside it *Hyderabad*. Each mark is exactly one cell — no tile, no ring, no box, the way the company marks
  sit on theirs (P12) — and its words start on the next cell's line, in `heading`, muted. On a phone the first line's
  words run to two lines inside the cell's height.
- **The Charminar is his picture**, `hyderabad.png` from his Downloads: black ink on a white square, so the white was
  made transparent and the margin trimmed (`public/hyderabad.png`, 206 × 288) — otherwise it would have been a white
  tile on the cell. It fills its cell's height at its own proportion, and the dark theme inverts it to light ink. *He
  saw it clipped once — 84px tall in a 60px cell, because a percentage height does not resolve inside a grid item —
  and it was fitted the same hour.*
- **They go `below`** (`PortfolioItem.below`, back), because on `xl` the sixteen-column band would pack a card-wide
  line beside the card. They are in the flow, so the block that is centred is now the card and its two lines, and the
  tagline (`above`) stands over that block.

**And the handle, and a row of links, the same day.** *"In the tagline, beside the 'Let the stack overflow' line, add
a hyphen, @hiddenstack, in lime colour with a small text font that we have in our tokens, and when the user clicks it
the HEY overlay should come up. Under Hyderabad, leave a row, and then after that add an icon of GitHub, Discord, X,
Instagram and a download button to download the resume. And when hovering on these cells, use the same hovering
effect that we have in the logos of the work page."*

- **"— @hiddenstack"** follows the second line on its baseline: `caption`, in a new **`lime`** tone (Type.md T4), an
  attribution dash rather than a bare hyphen. It is a button, and it sets off **the avatar's HEY!**: the face leaps
  from the card, exactly as a click on the face does (`useHey`, shared by both, one motion count between them). On a
  phone the line has no room for it and it wraps under the line. **Lime on white is 1.3 : 1** — it reads on dark
  (15 : 1) and barely on light; that is his to weigh.
- **Five cells, one row of air under the city**: GitHub, Discord, X, Instagram, and the résumé's download. Each is
  one cell with nothing else in it — the mark at half the cell, centred, in the text's own colour — and each is a
  `Button` (`ghost`, its hover fill taken off, because the band is the hover). The brand marks are **simple-icons**
  (CC0 path data; lucide dropped its brand icons at 1.0); the download is lucide's. On a pointer the **P13 band** is
  drawn behind the mark, violet, lime, violet along the row (`MarkBand` and `drawBand` in `band.tsx`, which the Work
  screen now shares). On a phone the band is four columns, so the download wraps to a second row. *(Six since
  Grid.md D33: one row everywhere.)*
  *Resized the same hour:* *"the hover effect is over the icon — it should be under the icon, and it should reach
  from edge to edge of the cell."* Sized off the icon, as a company's band is off its mark, it was a 39 × 29 patch the
  icon's own size laid across it, lime through Discord's eyes and between X's strokes, 11px short of each side. Now it
  is sized off the cell (`MarkBand`'s `edge`): **exactly the cell's width, its upright edges on the cell's borders,
  0.60 of it tall** — 60 × 36 at its edges on a pointer, 53 high with the slant, inside the cell — so the whole icon
  stands on it. The Work screen's band is unchanged.
  *And inked, the same day:* *"the icons on the violet band are visible, they have enough contrast, but the icons over
  the lime don't have much contrast and it feels like the band is over the icon."* Lime is light in both themes, so
  the dark theme's white mark on it was 1.3 : 1 (violet: 4.0 : 1 white, 5.0 : 1 dark — fine as it was). So the band
  now carries the mark again as **ink**, drawn inside it and revealed by the same sweep: where the band has reached,
  the mark is **`--lime-foreground`** — a new token, the dark the pager's arrow already wears on lime (Grid.md D32),
  one value in both themes, 15 : 1 — and where it has not, the mark is its own colour. It is the highlighter's own
  trick, and the two never part, so nothing goes dark on the dark page ahead of the band. On violet the ink is the
  mark's own colour, so a violet cell looks as it did. To carry ink the band's sweep became a `clip-path` on the
  fill rather than a scale, which would squash it (P13's timing and eases unchanged).
  *And two marks a step smaller:* *"reduce the size of X icon by one token, and also the download icon."* X fills its
  whole 24-unit box and lucide's arrow is stroked, so at half the cell both read bigger than the three filled marks;
  they are one step of the grid's spacing scale (`GRID_SPACING`, 4px) smaller — 26px on a pointer, 32 on touch.

**And on a phone, the same evening** — *"none of the pages, loaders, intros are optimized for mobile."* Since Grid.md
D33 every field is at least six columns, and a phone's cell gives way to them (51px on a 390), so the portfolio's
phone was re-measured, not scaled:

- **The band on a phone is six, the whole field** (`BAND_COLS`, was four), and every phone span is six wide.
- **The first screen stays one page on every phone from 360 to 430** — *"the row where we have socials and download
  resume has been moved to the next page in the mobile, so that should also stay in the first page."* The card is
  three rows on a phone (its name balanced over two lines, "Bhargav / Reddy V"), the tagline two with the handle on
  its own line under it, and the five link cells fit one row of six. **The page is centred down with the tagline** —
  centring the block alone had left the tagline on the room's first row and the air all under the links. On a phone
  the fact lines' words are `body`: the cell is 51px and `heading` wrapped the years to 56.
- **The Work marks** — *"the icons are too big in the mobile"* — **are two cells a side on every field** (P12's rule,
  now held in `CompanyMark` as well as the span): 114px on a 390 phone, 156 before; two to a row in three-column
  slots, four rows tall, so a two-line name has its room.
  *Then one cell on a phone, the same evening:* *"in mobile, in work reduce the logos size more."* Marks are sized in
  cells, not tokens, so the next size down on the grid is one cell: **46 to 57px on a phone** (51 on a 390), two cells
  from a tablet up as P12 has it. The slots are three rows, the name has the two under the mark, and "Terribly Tiny
  Tales" still takes two lines on the narrower phones. At one cell Radise's wordmark is small — it is wide — and the
  names in `heading` now outweigh the marks.
- **Everything else took the rows it needed at a phone's cell**, measured by `e2e/.mcp/phone-sweep.mjs` (every page,
  every run of text and every image against its own box): Skills six, the notes three, Languages and Hobbies five,
  Contact five; the degree wraps to two lines instead of an ellipsis. Nothing clips from 360 to 430 wide, on a
  tablet or on a desktop. **A 320 phone** (the first SE) still clips a section header and three cards: its 39px cell is
  too short for a header's two lines. It is the one size left.
- **Discord, X and Instagram have no URL yet.** Their cells show the mark and go nowhere — no cursor, not focusable —
  until he gives them one; this bends P6 (a link with no value is not rendered) for the row's sake, and is his to
  settle.
- **The first screen is now eight rows on a pointer** (the tagline two, the card two, the two lines, the air and the
  links) **and nine on a phone**, so where the room is shorter, what does not fit goes to the next page (Grid.md
  D5): on a 1280 × 720 laptop and a 390 × 844 phone the links are page 2, on an iPhone SE the city and the links.
  The tagline's rows are **held back** while the first page packs, so it is never the one squeezed out; the row of
  air (`PortfolioItem.air`) is not left when the links open a page.

**Amended 2026-09-26: the first screen is cards, from his mock.** *"This is the layout I've been thinking about. Focus
only on the cards on the grid and recreate the layout in portfolio."* The mock was drawn on the grid's own field and
every card in it sits on whole cells, so it was read in cells:

- **The profile card is seven columns on a pointer and six on touch** — 492px both, the row with room either side,
  where eight left the rest pooled at its end — and its row is centred across the card. Seven is not even, so on a
  pointer the block stands half a cell left of the field's centre line, which is where the mock has it (Grid.md D26
  evens the field's count, not a span).
- **The role line is the role alone, in lime:** *Senior Full Stack Developer* — his word, not the résumé's "Sr" — in
  `label` and the `lime` tone (Type.md T4). The "@ Radise" went; Radise is in the row of marks.
- **Under it, two facts, each a Card one row tall**, so a pill (Grid.md D39): a pin and *Hyderabad* on three cells,
  *6+ Years  Building Products* on four — three and three on touch. They share the row, so they are one item
  (`ProfileFacts`); on a phone three cells do not hold the years, so there they stack and the item is two rows. They
  replace the two fact lines, the "6+" in Anton and the Charminar; the Charminar's picture went with its line.
- **Under those, a row of marks, a Card one row tall** (`ProfileWork`): a briefcase, the four companies newest first as
  the résumé lists them, and *Résumé ↗* in lime, each on its own cells with a line in the gutter between each two. A
  mark is half the cell less a step of the spacing scale — 26px on a pointer, as the mock has them — and a wordmark up
  to half as wide again. The résumé takes the cells that are left, two of a pointer's seven; on six (touch, a phone) the
  briefcase gives its cell to the résumé (P5). The résumé opens in a new tab, which is what the arrow says; Say hello's
  button still downloads it. The companies are named for a screen reader and not on the screen, and only the résumé is
  a link. **A company's mark is on the first screen again** (P9) — on its own card, never the profile card.
- **Kept, his call the same day:** the tagline over the card, still `above`, and the avatar's lime ring, which the mock
  did not draw. **Gone:** the row of GitHub, Discord, X, Instagram and the download — GitHub is still on Say hello and
  the other three had no URL — and with it the band's `edge` and `ink` (the Work screen's band is as P13 has it) and
  `simple-icons`.
- **The type is the nearest role, not the mock's.** The name is `display`, exactly the mock's. The mock's role line is
  about 15px where `label` is 12, and its facts and *Résumé* are Montserrat at about 16px, tracked, where `body` is Inter
  at 14. Anything closer is an eighth role (Type.md §1), and his to decide.
- **Lime is 1.3 : 1 on the light theme** (Type.md T4), and the role line and *Résumé* now wear it: they read on dark and
  barely on light.
- The first screen is four rows on a pointer and six on a phone — six and eight with the tagline — so it is **one page
  from an iPhone SE up**, the laptop's and the SE's included.
- **Made consistent, the same day.** *"Review the work and location icon. They are inconsistent. Look for consistency
  issues and fix them too."* The briefcase was sized as a mark (26px) and the pin as an icon beside text (16px), and
  lucide's line grows with its box, so one drew 2.17px and the other 1.33; the pin also floated 30px in from the
  briefcase under it, because its words were centred. Now:
  - **The line icons are one size, 20px** — the pin, the briefcase and the résumé's arrow — the line height of the
    `body` text they sit with, **so one weight, 1.67px**. The briefcase is an icon, not a mark; the marks stay half the
    cell less a step. The lines between the marks are an icon tall.
  - **Everything is centred in its box** — *"why did location card is justify start and 6+ years is center. Let's keep
    everything center aligned."* The pin and the city are centred in their pill as one, as the years are in theirs and
    each mark and the résumé in their cells. For an hour the pin stood on its pill's first cell, directly over the
    briefcase, and the city started from the pill's left beside a centred pill; that went, so the pin and the briefcase
    are no longer one column.
    **And the row of marks, the same day** — *"The work icon is not center aligned in it's container. It's close to the
    border."* Each item had been centred on its cell, and a cell at an end has the half gutter on its separator's side
    only, so the briefcase was 19px from the border and 25.5 from its line, and the résumé leant the other way. Now
    each item is centred between the lines either side of it, the card's border counting as one — 22px each side of
    the briefcase on a pointer — and the lines stay in the field's gutters, so the marks between them are still on
    their cells. `node e2e/.mcp/strip-ends.mjs [w] [h]` (gitignored) prints both ends' two distances.
  - **An icon and its words are 8px apart, a step of the spacing scale** (`GRID_SPACING`), where the pin had 10 and the
    arrow 6, both off it; the years' two phrases are 8 apart too.
  - **The résumé is *Résumé***, its name in `LINKS` and on Say hello, not the mock's *Resume*.

**And the row of marks is the Navigation Menu, the same evening.** *"Let's use our Navigation menu for the Work row
logos. When we hover on a logo, a card should show the work I did in the company."* (His first ask, cut off: *"add hover
for work logos too just like resume."*) The row is the system's `NavigationMenu` (`profile-work.tsx`), each mark a
trigger and the company's card its content:

- **A mark's hover is the résumé's** — the muted fill of its room between the lines, a pill — and stays on while its
  card is open. The trigger's chevron is hidden: a mark on one cell has no room for one. The row keeps its cells and its
  centring between the lines (above).
- **The card is what I did there**: the company and its dates, the title as the profile card's role line is (`label`,
  lime), a line for each thing in `ROLES`' `did`, and the stack at its foot as the Stack card's chips.
- **It covers the block the row is the foot of** — the tagline, the profile card and the facts — exactly: as wide as the
  row, from the block's top to a gutter above the row, so its four edges are the field's lines, as a box's are, and it
  is the same size for every company. Moving along the row slides one company's card into the next, the menu's own
  motion, and nothing else moves. A card with more to say than the block holds would grow up from the row, never past
  the top of the screen. Five rows on a pointer, 348px; seven on a phone.
- **It is portalled into the grid's box**, because a slot clips (Slots.md) and a card hung from the row inside it would
  be cut off. The menu's hover, focus and dismissal still hold, and inside the grid it keeps the violet pointer (Grid.md
  D43) and the one radius (D39). It closes when the page turns (a scroll or a swipe), when the pointer leaves, and on
  Escape; a tap opens it on a phone. While the menu has focus its keys (← → ↑ ↓, Home, End) move along it rather than
  turn the page (Grid.md D42).
- *The first build of it, the same hour, left the card 0px wide on every pointer (the content was sized off the viewport
  and the viewport off the content), and on a phone read the card's height mid-zoom, a tenth short, so the card sat
  over the row and took the next tap. It is sized to the row now, and measured as laid out.*
- *Mine, his to change:* covering the block rather than opening under the row (the room under it is two rows on a
  1440 × 900 screen); the company's dates and not its city; the lines in the muted tone.

*Withdrawn the same night, below: the card went into the grid and the menu went with it.*

**Then three columns, the same night.** *"Instead of showing the cards above, show it below. And instead of hovering
over, it should be part of the grid just like the other cards."* And then, instead: *"Let's have three verticals. The
first vertical is what we have, the center one … placed in the center. We will move the work to the right side
section. And there will be left side section where each cell will be filled with logos of the tools, languages, any
tech that I use or used … In the work vertical, by default, one company will be active and we will show the work that
we did in that company in the part below."* Asked, he picked the rest:

- **The centre is eight cells on a pointer**, so it stands on the field's centre line, and **the two sides are equal**
  and take the room either side of it: 4 · 8 · 4 on a 16-column field (1280 wide), 5 · 8 · 5 on 18 (1440), 6 · 8 · 6
  from 20 (1536 and up) *(since 2026-09-27 a column of air between each, below: 4 · 1 · 8 · 1 · 4 on 18, 5 · 1 · 8 · 1 · 5
  from 20, and under the centre on 16)*. The first screen's band is twenty columns (`band` on the section) where the rest keep
  `BAND_COLS`. The columns are `side` items (`PortfolioItem.side`, `arrange.ts`): out of the flow like the tagline,
  level with the block's top and at least as tall as it. **Where the room either side is under four cells** *(five
  since 2026-09-27, below, and the centre narrows first where that leaves five)* — a
  1024-wide screen, a tablet, a phone — they are packed under the centre instead, work first, then the tech, and spill
  onto the next page as any item does: on a phone the first page is the centre and the second the work and the tech.
- **The centre is what it was, less the row of marks**: the tagline, the profile card, the two facts, and the résumé,
  which kept its two cells — a pill of its own centred under the facts (`ProfileResume`). Six rows on a pointer.
- **The work column is the system's Tabs** (`profile-work.tsx`), his pick over the hover: the four marks on a pill one
  row tall and the active company's card under them, **a box on the grid** on the column's other rows. Radise, the
  newest, is active to begin with; a click or a tap makes another active; ← → move along the marks and leave the page
  alone (Grid.md D42) *(since 2026-09-27 every mark is a Tab stop and the keys go in reading order, D45, below)*. A mark's hover and its being active are the résumé's muted fill. The card is the company and
  its dates, the title in the profile's lime `label`, a line for each thing done, and the stack at its foot. Where the
  column is short it gets denser rather than clip (P5): the stack goes first, then the lines from the last, whole —
  on 1280 × 720, four cells wide, Radise and Dataflix give up their stack. The Navigation Menu, its portal and its
  chevrons went; so did the briefcase.
- **The tech column is a mark a cell** (`profile-tech.tsx`), straight on the field with no tile, in `STACK`'s order,
  at the company marks' size: **all in the text's colour, and a mark takes its brand's colour under the pointer** (his
  pick), unless the brand is black (Next.js, Express, Rust, shadcn, Ollama) and would vanish on the dark theme. simple-icons
  (CC0, back as a dependency) draws 23 of the 35; Zustand, Jotai, gRPC, Tiptap, Auth.js, AWS, AWS CDK, IBM, AutoGen,
  Atomic Agents and OpenAI have no mark there, and SQL is not MySQL's. Cells past the last mark are the field's own, so
  a six-wide column is two-thirds full until he gives the other eleven. *(Since 2026-09-27 a hovered or selected mark
  grows to spell its name, and the rest move on: movement, below.)*
- **The Work and Stack screens went** (his pick): they were what the two columns now hold. The site is the first
  screen, 01 Beyond and 02 Say hello — three pages on a desktop, four on 1280 × 720, five on a tablet, six on a phone
  and seven on an SE. The Skills bars went with the Stack screen; `SKILLS` is still in `resume.ts`. `CompanyMark`,
  `ChipGroupsCard` and `band.tsx` went with their screens, and so P10, P12 and P13 describe screens that are gone.

**And the tagline behind the field, 2026-09-27.** *"Move the tagline from the top of the card to just above the nav bar,
make it much more bigger. Instead of making it part of the grid it should look like it's behind the cells."*

- **It is no box on the grid.** It is a `backdrop` item (`PortfolioItem.backdrop`, which replaced `above`, whose one
  user it was): the first page keeps the rows its span asks for free at the foot of the room, over the pager's — four
  on a pointer, two on touch — as many as the block leaves, and the block is centred in the rows over them. The page
  carries where they are, and `PortfolioPages` draws the tagline there **before the grid**, so the field's dashes and
  the pointer's ring are drawn over its letters and the cards stand in front of it. It is the first page's only, and
  fades as the page turns.
- **It is as big as its rows and the band allow**: both lines measured once at 100px and scaled to the box — 134px on
  a 1440 × 900 screen, 138 on wider ones, 66 on 1366 × 768, where two rows are free. Still Anton, `faint`, in quotes,
  centred. **Where no row is free it is not drawn**: on 1280 × 720 the three columns take all six.
- **— @hiddenstack** still follows the second line and still sets off the HEY!: it is the one piece drawn over the
  grid, so it can be pressed. It takes its own tracking, since the tagline's tight tracking inherits as a length.
- **The two lines are centred on each other** (his, the same day: *"text align center the portfolio tagline"*). The
  handle had been centred with the second line, which put that line 52px left of the first on 1440 × 900. It now
  takes no width in the line and hangs past the end, still on the baseline, so the second line leaves the handle's
  room on both sides. That costs size: 118px on 1440 × 900 (was 134) and 134 on 1920 × 1080 (was 138). On 1366 × 768 it
  is still 66, because the height sets it there. A phone keeps the handle on its own line, centred.
- **A letter a cell, and a space an empty cell** (his, the same day: *"instead of just putting the text in the
  background like that … divide each letter between each cell, and space will be an empty cell"*). `TaglineCells` lays
  the backdrop out on the field's own cells, since the renderer hands it `--grid-cell` and `--grid-gap`. Every
  character takes a cell, the quotes and full stops included. Each word stays whole on a row, each sentence starts a
  new row, and each row is centred on the band, an odd remainder leaning left as `arrange` centres a block. The rows sit
  at the foot, over the pager's. A letter is Anton at 0.85 of the cell (51px on a 60px cell), still `faint`, centred in
  its cell, so capitals and ascenders stand inside the cell's circle (Grid.md D40) and the dashes ring each one. On a
  pointer's band of fourteen to twenty cells that is four rows: *“Start with / curiosity. / Let the stack /
  overflow.”* The handle starts in the cell after the closing quote, on the letters' baseline. The letters are
  hidden from assistive technology and the sentence is read once, whole.
- **Where the cells do not hold it, it is still one block of text** (`TaglineText`, the treatment above): wherever a
  word is longer than the band, the rows are more than the page keeps, or the last row leaves no cell for the handle.
  Today that is 1366 × 768, where two rows are free and the letters need four, and a tablet's eight columns, which
  cannot hold *curiosity.* (ten cells). A phone and 1024 × 768 keep no row for it at all, so nothing is drawn there.
- **In the role line's type, not Anton** (his, the same day: *"Use the text that is used for senior full stack
  developer. Do not change the text color"*). Both settings are now `label`: the heading face, bold, in capitals. The
  tone stays `faint`, and the role line's lime is not taken. A letter is 0.6 of the cell, 36px on a 60px cell, so the
  widest capital, W, stands inside the circle. The label's wide tracking is dropped on the cells, since a letter alone
  in a cell is spaced by the grid and the tracking after it would only push it off centre. The block of text keeps
  it: 61px on 1366 × 768 (Anton's was 66) and 25px on a tablet. The handle takes back its own weight and case, because
  a button inherits the label's bold.
- **And at the label's own size** (his, the same day: *"I wanted the same font size too"*): 12px, `text-xs`, a small
  capital in each cell's circle. So the size no longer comes from the cell, and nothing is scaled to the box. Where the
  cells do not hold it, `TaglineText` is two lines of the same 12px text, centred at the foot of its rows, with the
  handle after the second. A container query puts the handle on its own line under 420px wide: the second line is 203px
  and the handle with its gap 104, on each side.
- *It needed the grid's painter to clear the intro's tiles when the reveal ends (Grid.md D38, amended): they were
  opaque and hid it.*

**And the facts and the résumé on one row.** *"See if we can fit location, six plus years of building products and
resume in one row."* On a pointer's eight cells they do, 2 · 4 · 2 — the pills' content now centred across the whole
pill, the round ends its air. Six cells do not (the résumé needs two, the years three on touch), so a tablet keeps the
facts over the résumé and a phone stacks all three. The centre column is then three rows beside six-row columns, so
**every column takes the tallest one's height and the centre is centred down between them**. *(Amended 2026-09-27,
below: the centre stands level with the columns' top.)*

**And the tabs' fills meet the dividers.** *"The active button is also having full border radius … they don't align
with the dividers … the end buttons [should] have small border radius like 4 pixels on their parts that are closer to
the divider and the mid ones can have only 4 pixel radius."* So Radise's and TTT's fills keep the pill's radius on
their outer side and take 4px at their divider, and Dataflix's and Hashnode's take 4px all round — his exception to
the one radius, for a fill inside a box (Grid.md D39). *Withdrawn the next day with the pill and its dividers, below.*

**And a cell for each company, the active one holding its name, 2026-09-27.** *"In work, I am not liking the menu
bar. So we'll do this: we shall have one cell for each logo and the active cell will expand to have its company
name."* The pill of four marks with dividers went, and with it the 4px corners above.

- **Each mark is a trigger on a cell of its own** (`profile-work.tsx`, still the system's Tabs), bordered and filled
  `bg-card` like the pager's cells, so the one radius makes it a circle (Grid.md D39). The mark stays at its size,
  half the cell less a step, and Radise's wordmark is up to half as wide again.
- **The active one grows by whole cells to hold its mark and its name**, with a 12px pad inside each round end: a pill
  **ringed in lime, its name in lime** — his, the same day ("why is the active button hue
  gray and not lime?" … "lime outline and lime text"; it had kept the old pill's muted fill). He set the rest in the accent jig
  (`?jig` in development, `jig.tsx`): **the ring is a pixel, the fill lime at 12% mixed into the card, and the name
  lime on dark and dark ink on light**, where lime is about 1.3 : 1 on white. The same settings made lime and violet
  the design system's accents (the repo-root CLAUDE.md). Moving the choice shrinks one and grows the other over 300ms, the name fading and
  unclipping as its cell widens, and neither moves under reduced motion. A mark under the pointer takes the muted fill
  at 60%, mixed over the card rather than see-through, since the trigger is the box and a translucent fill showed the
  field's dashes through it.
- **The room is what the other three leave**: the column less a cell each. Where the name does not fit there it takes
  the short one (TTT); where that does not fit either, the active cell is only filled. On a 1440 desktop (five cells)
  every company is two cells and Terribly Tiny Tales is TTT. From 1536 (six cells) it gets its full name in three. On a
  1280 laptop (four cells) there is no room, so the active mark is only filled. *(Since the column gap, below, a 1440
  desktop's column is four cells too, so its active mark is only filled, and every field of twenty columns or more
  has five: two cells a name, and TTT. And since the centre narrows on eighteen, below, the 1440 desktop's is five
  again, and no field gives a column beside the centre four.)* On a 390 phone Hashnode takes three
  cells, since its 67px name does not fit two 51px cells, and the rest take two. The row starts at the column's start
  edge, and a cell the row does not use is the field's own.

**And the centre level with the columns, the same day.** *"There is one empty row above the center vertical … we
don't need that."* Beside six-row columns the three-row centre was centred down between them, which left it one empty
row on top and two below. It now stands level with the columns' top (`arrange.ts`) and the rows it leaves are all under
it, over the tagline. Every size keeps its page count.

**And a column of air between the verticals, the same day.** *"Leave one column gap between each vertical."* The tech
and the work stand one empty column from the centre (`SIDE_GAP`, `arrange.ts`), so the three read as three, and each
side column is the band's room less that column: **4 · 1 · 8 · 1 · 4 on an 18-column field** (1366 and 1440 wide),
where it was 5 · 8 · 5, and **5 · 1 · 8 · 1 · 5 from twenty** (1470 and up), where it was 6 · 8 · 6. A 16-column
field (1280) would leave three cells a side, under `SIDE_MIN`, so there the work and the tech go under the centre as on
a tablet, and 1280 × 720 is six pages where it was four. The work column's width follows: the active company's name
shows from twenty columns up, and a four-cell column only fills its active mark.

**And the profile in two cards, the résumé first, the same day.** *"Divide the avatar and name section into two cards
and we'll put the avatar in the two by two card which is above Hyderabad, and then keep the text in another card, and
then after that let's swap resume and Hyderabad."*

- **The avatar is a card of its own, two cells square**, and the name and the role line are the card beside it, the
  rest of the width — 2 · 6 on a pointer, 2 · 4 on touch. They are still one item (`ProfileCard`), each card on the
  field's own cells with a gutter between, the way the facts are. The face fills its card less a gutter all round,
  ring and all: **96px on a pointer**, as before, **120 on a tablet**, 78 on a phone, 72 on an SE. The HEY! still pops
  from it.
- **The name and the role are centred in their card** (mine, his to change: centred rather than started, so the air is
  split either side, P9's rule), and the name steps down with the card's width: `display` on six pointer cells,
  `title` on four touch cells, `heading` on a phone's four, where `title` would run it to two lines and the role to two
  more. The role still runs to two on a phone.
- **The pills read Résumé · years · Hyderabad**: the résumé under the avatar's card, the city at the row's end, 2 · 4 · 2
  on a pointer. On touch the résumé and the years are one row, 2 · 4, under the two cards, and the city is centred
  under them — on two cells on a tablet, on four on a phone, where two cells (108 to 114px) touched the pin and the city
  (about 100px).
- **A phone's profile is two rows, where it was three**, and its pills two, where they were three, so the centre is
  four rows on every touch field. The page counts are unchanged at the five review sizes (3 · 6 · 5 · 6 · 7). On a
  390 × 844 phone the work column now fits on the first page under the centre, and so no row is left for the tagline
  there; the SE, one row shorter, keeps it and turns to the work.

**And the centre narrows on eighteen columns, the same night.** *"Tab is not working on the work vertical of
portfolio."* The tabs pressed, tapped and took ← → at every size. What did not work was the growth: on an 18-column
field, 1308 to 1451 wide (1366 and 1440 among them), the work column was four cells, the four marks filled it, and the
active one had no room for its name. Asked, he picked narrowing the centre over dropping the column of air or stacking
the columns under it:

- **The centre is six cells on an 18-column field, and the sides five**: 5 · 1 · 6 · 1 · 5. The profile and the facts
  carry a `narrow` span, touch's six by two (`PortfolioItem.narrow`, `NARROW` in `site.tsx`), which `arrange` takes
  where their own span would leave the side columns under `SIDE_MIN` and the narrow one would not. `SIDE_MIN` is five:
  the four marks and a cell to grow into. Every other field is as it was — twenty columns and up keep
  5 · 1 · 8 · 1 · 5, and sixteen (1280) still goes under the centre, since a centre of six would leave it four.
- **The profile's name card is four cells there**, 276px, so the name is `heading` and the role runs to two lines, as
  on a phone; the facts are touch's two rows, the résumé and the years over the city.
- **Every active company shows a name wherever the column stands beside the centre**: two cells each, and TTT. The
  four-cell case in `profile-work.tsx`, only filled, is kept, but no field reaches it. The page counts at the five
  review sizes are unchanged (3 · 6 · 5 · 6 · 7).

**And the keys in reading order, the same night.** It was the Tab key he meant. *"Right after I reloaded the page, I
clicked on tab and the focus straight away goes to @hiddenstack … once I click tab again [after Radise], the focus
disappears … Ideally, I expected it to start with avatar, to Radise, and then … Dataflix, Hashnode, and TTT."* The
tagline comes first in the document because it is drawn behind the grid, only the active company was a stop (Radix's
roving focus), and the card under the marks was one with nothing in it to press. Now (Grid.md D45):

- **Tab goes the way the page reads**: the avatar, Radise, Dataflix, Hashnode, TTT, the résumé, @hiddenstack, then the
  pager's numbers and ↓ — on a phone and a tablet, where the work is under the centre, the résumé before the marks.
  `PortfolioPages` calls `useReadingFocus` on the box that holds the backdrop and the grid.
- **Every company is a stop, and focusing one opens it**, as a click does, so tabbing along the marks turns the card
  under them. The list and the card are no longer stops.
- **← → and ↑ ↓ move focus as well** — along the order, and up and down a line — and stop at the page's edges.
  **They never turn the page** (his, the same night: *"The arrow buttons are still acting on changing pages. I asked to
  make it like a game controller"*): from nothing focused the first press lights the avatar, the grid's keys are off
  (`keyboard={false}`), and a key pressed mid-turn is dropped. The page turns by the scroll, a finger, and Enter on the
  pager's ↓ or a number. `node e2e/.mcp/focus-order.mjs` (gitignored) presses a list of keys and prints where focus
  lands after each.

**And the tech column moves, the same night.** *"Now, let's use this motion in the technical stack vertical. Whenever
I hover/select a logo, it should expand to name the library or tool."* The motion is movement (Motion.md M9), his pick
in the motion studio, played by the package's `useCellMotion` on the `--motion-move-*` tokens in globals.css:

- **A hovered or selected mark grows to spell its name.** It takes as many whole cells as its mark and name need: two
  for Rust, three for JavaScript and ProseMirror. The marks after it move on along the rows. One pushed past a row's
  end goes out of it and comes in at the start of the next, the `overflow` of his pick. Only the marks travel, and each
  shrinks to nothing at a gutter and grows out of it. The names are the résumé's (Tailwind, Postgres, GCP, Apollo),
  not simple-icons' titles.
- **The grown mark looks like the work's active cell.** It is ringed in lime over the same lime wash (`ACTIVE_FILL`),
  its name lime on dark and the ink on light, and its mark takes its brand's colour, the colour the pointer gave it
  before. The other marks still have no ring (mine, his to change: the specimen gave them the hairline, but this
  column never had a tile).
- **Hover is the pointer's, mouse and pen; a click or a tap selects.** A selected mark stays grown after the pointer
  leaves, and pressing it again lets it go. Hover is read from the cell under the pointer and where the marks are
  going, as in the studio, so a row pushed under a still pointer does not hand the hover on.
- **Every mark is a Tab stop in reading order (D45), and Space or Enter selects it. Focus alone does not grow it.** It
  did at first. But the mark it pushed to the next row came back to a row Tab had already passed, and Tab skipped it.
  Tab now runs the first row of marks, the avatar, the four companies, the next row of marks, and so on: twenty-three
  stops more than before.
- **Under the centre the column keeps a spare row** for what a grown mark pushes over: five rows of six, four of eight
  (`TECH` in `site.tsx`). Beside the centre, five by six, it already had one. The page counts are unchanged at the
  five review sizes (3 · 6 · 5 · 6 · 7), and the column is on the page it was on at each.
- **The stagger is 20ms** (his, the same night: *"Let's change the 40ms stagger to 20 ms"*). At the 40ms he had
  picked on a row of three, the last of twenty-three marks started 840ms after the first was hovered and settled at
  about 1.2s. Now it starts at 420ms and settles at about 0.8s. The token is the system's (`--motion-move-stagger`,
  Motion.md M9), so the change is in globals.css, not here.

**And labels over the columns, the projects over the tech, the degree under the work (2026-09-27).** *"Subheadings
are missing … a label called work above work vertical … similarly add above libraries too, maybe call it skills, and
move skills down, and in place of that put projects, and put Agents Society, No Origins under it, and add some dummy
cards too, just to see how more work items will look like."* Asked where the skills go: *"Projects will still take 5
columns, same as skills (tech stack) did. But it's just that now Tech Stack section will be below the Project
section."* And: *"Let's put btech computer science card under work."*

- **Each column has a label** — WORK, PROJECTS, SKILLS — a `label` in the muted tone on a row of its own
  (`Headed`, `cards.tsx`). The first label in each column stands in the row above the centre, so the profile's top is
  level with the first project and the company marks. The row over the centre is empty. *Amended the same hour:* the
  labels are **transparent pills** (*"it's not following the design theme … labels such as them should be still kept
  in a pill, but a transparent pill"*): the facts' pill with the card's fill taken off, so the field shows through it,
  one cell tall and two cells wide, at the column's start. *And later the same day the centre moved up a row* (*"Work
  and Projects top row is above the middle vertical. Let's move the middle vertical a row up too"*): the profile's
  top is level with the WORK and PROJECTS pills, and the row that was over the centre is under it, in the well.
- **The left column is the projects, then the tech stack.** The projects are the room's pills (P15), one per row,
  each **only as many whole cells as its words need**, at the column's start (*"why are projects taking the full row
  … most take only the size that they need"*; they were the column's five). They are Agents Society (in progress),
  No Origins ↗, and **two placeholders, Project Three and Project Four**, which live in `site.tsx`, not `resume.ts`,
  and come out once he has seen them. `FitPill` measures each: four cells for Agents Society, two for No Origins,
  three for each placeholder. The tech stack takes the rows left under them.
  Beside the centre that is two rows, **eight of the twenty-three marks** (the languages, React, Next.js, Tailwind), on
  every field where the columns stand beside the centre. The grow motion works in two rows.
- **The right column is the work, then the degree**, a pill one row tall and the column's width.
- **Amended the same day: a row of air, a label for the degree, six-cell columns.** *"We should leave one row gap
  between projects and skills, and work and education. Even for education we will need a label. And for large screens
  can we go up to six columns for the left and right verticals too."* An item after the first in a column leaves its
  `air` over it, one row for the skills and the education. The degree is under an EDUCATION label, its pill as wide
  as its words (on a tablet's bottom row, where two rows do not fit, it is the pill alone, a `fallback`). The first
  screen's band is twenty-two columns, and a column is at most six cells (`SIDE_MAX`): six on a field of twenty-two
  columns and up (1728 wide), five on twenty (1512) and eighteen (1440). **The block is ten rows tall**, the work's
  column (label, marks, five rows of card, a row of air, label, pill). The skills get four rows, the label and three
  of marks: thirteen marks at five cells, sixteen at six. *What it costs:* a field twelve rows deep (1440 × 900,
  1512 × 982) has no row left for the tagline, so it is not shown there. At 1728 × 1117 and 1920 × 1080 it is two
  lines of text. At six cells the work's card has about a row of air over its stack, the mirror of P5.
- **Amended again: the projects wrap.** *"Let the projects wrap instead of behaving like a column of cards."* The pills
  go along the rows in order, as words wrap on a line, and one that does not fit the rest of a row starts the next
  (`wrap`, `arrange.ts`). They are straight on the field's cells. Each project's width in whole cells per cell size
  is declared in `site.tsx`, the way the room's pills are, from measuring the pills on the page: Agents Society 4, No
  Origins 2, Project Three 3, Project Four 3 on a pointer. `arrange` gives the item its label's row and the rows the
  wrap takes at the column's width (`wraps`), and `ProjectList` places the pills with the same function, so the two
  cannot disagree. Five cells wide, that is three rows: Agents Society; No Origins and Project Three; Project Four.
  Six wide, it is two rows. The rows the projects give back go to the skills: eighteen marks at 1440 × 900 and all
  twenty-three at 1920 × 1080.
- **How `arrange` does it.** A side can hold several items, stacked in `site.tsx`'s order (`side`). An item's label
  rows are its `head`. An item that `grow`s takes the rows its column has left, and its own rows do not set the
  column's height. The block is eight rows tall, which the work sets: its label, the marks, five rows of card and the
  degree. It was six. At 1440 × 900 that leaves the tagline two rows, so it is drawn as two lines of text. At
  1920 × 1080 it keeps its four rows of letters. The tech's two rows are the price of the projects above it. *Open, his to decide:* fewer placeholders, or letting the columns run taller than the
  centre (the tagline gives up the rows), would show more marks.
- **Amended once more: each label is its section's first cell, with an icon.** *"Let's add relevant icons to the
  section labels … instead of putting them in a separate row, let's make them part of the top first cell within their
  section. That means work can become the first cell before Radise logo, and project can also become first cell in
  the projects, similarly the skills and education."* This replaces the label rows, `Headed`, `FitPill`,
  `ProjectList` and `head` above.
  - **A label is one cell** (`SectionCell`, `cards.tsx`): the transparent pill, which the radius makes a circle,
    holding its icon in the muted tone — **in the secondary colour, the violet, since the same day** (*"let's try making
    the section label icons to secondary color"*). The icons are a folder with a branch for Projects, a code mark for Skills, a
    briefcase for Work and a cap for Education (lucide's `FolderGit2`, `CodeXml`, `Briefcase`, `GraduationCap`). A cell
    has no room for the word, so the word is the icon's tooltip (the system's `Tooltip`) and a heading for assistive
    technology. *Mine, his to change:* the icons, and the word only on hover. *The same day he asked for the word:
    each label is its icon and its word, over as many cells as they need (below, "the labels show their words").*
  - **It stands first in its section's first row, and the section flows on after it.** The projects wrap after it
    (`CellWrap`). The tech's marks flow from the next cell (`ProfileTech`'s `lead`: it flows first, one cell that never
    grows). The company marks follow it (`ProfileWork`'s `lead`). The degree stands beside it, without its own cap,
    since the label cell is the cap (`CellWrap`). The degree's pill is four cells on a pointer, measured.
    Where a row cannot hold the label and the pill (a tablet's bottom row), the label goes and the pill keeps its cap.
  - **The columns are eight rows again**: the work's marks and five rows of card, a row of air, the degree. So the
    tagline is back: two lines of text at 1440 × 900 and its four rows of letters at 1920 × 1080. The projects are three
    rows at five cells and at six. The skills take the four left and show seventeen marks at 1440 × 900 and nineteen
    at 1920 × 1080.
  - *What it costs:* on a column five cells wide (1440, 1512), the label cell takes the cell the active company grew
    into, so the active company is only filled, its mark and no name. At six cells (1728 and up) it has its name.
- **And art skills under the technical ones (2026-09-27).** *"Code skills — we have coding icon so we can treat them as
  technical skills. Now let's move the sketching, UI/UX Figma, video editing in DaVinci, that part, to something called
  art skills or design skills … and then that section should be under tech skills."*
  - **Skills is Technical skills** (the code mark's tooltip).
  - **Art skills** is a section of its own under it, a row of air between them, in the left column. It has a palette
    for its label cell (`PaletteIcon`), and the hobbies after it, each a pill of its own words (`SkillPill`) wrapped
    as the projects are. Measured on a pointer: Sketching 2, UI/UX in Figma 2, Video editing in DaVinci Resolve 4,
    Ukulele 2. So it is three rows at five cells and two at six. The one pill of four words with lines between them left
    the room, and `HobbiesPill` and `Divided` went with it. *Mine, his to change:* "Art skills" rather than "Design
    skills", because Ukulele is in it.
  - **A column with no growing item leaves its spare rows empty at its foot.** It had been giving them to its first
    item, and the work's card stretched to seven rows with three rows of air over its stack (the mirror of P5). An item
    that grows keeps at least two rows (`GROW_MIN`), so the tech stack keeps its label's row and one more.
  - *What it costs.* The left column is now the tallest: projects 3, air, tech 2, air, art 3 at five cells; 3, 1, 2, 1,
    2 at six. At 1440 × 900 and 1512 × 982 that is ten rows, the whole room. **The tagline is not shown there, and the
    technical skills show seven marks.** At 1920 × 1080 the block is nine rows, the tagline has three rows of letters,
    and the technical skills show nine marks. *Open, his to decide:* taking out the two placeholder projects gives the
    tech a row at five cells. Letting the block run taller than the room the tagline leaves would give the tech the
    tagline's rows.
- **And the columns reorder, and the tagline comes off (2026-09-27).** *"Let's change the order of verticals. Let's put
  the profile vertical in the left, then work and then projects vertical."* Then: *"Remove the quote from the bottom
  too."*
  - **The order is the profile, the work, the projects**, each a column of air from the next. The widths are as they
    were: 8 · 6 · 6 on twenty-two columns and up, 8 · 5 · 5 on twenty, 6 · 5 · 5 on eighteen. `side` is a number now,
    a column's place counted from the block: 1 the first column right of it, 2 the next, −1 the first left of it. The
    work is 1 and the projects 2. The block and its columns are centred in the band together. The block no longer
    stands on the field's centre line. On a tablet and a phone nothing moved: the work is still packed under the
    profile.
  - **The tagline is not on the page**, and **— @hiddenstack** went with it. The HEY! still pops from the avatar.
    `ProfileTagline` and the `backdrop` it used are kept. With no rows kept for it, the block is centred down the room:
    rows 3 to 11 at 1920 × 1080, where it had stood from row 2. At 1440 × 900 it is the whole room, as it was.
  - *Open, his to decide:* the technical skills still keep two rows (`GROW_MIN`), and the tagline's rows are empty now.
    Letting the column that grows run to the room's height would show all twenty-three marks at 1920 × 1080. At
    1440 × 900 it would change nothing.
- **And What I am after is his own words (2026-09-27).** *"I want to replace the what I am after content with the
  following"*: six paragraphs, where it was one line. They are in `resume.ts` as `profile.story`, as he wrote them,
  "sooo" and all. Only the spelling is mended: "I've love" → "I love", "keep track off" → "keep track of", "over night"
  → "overnight", "optinionated" → "opinionated", "mutiple" → "multiple", "deciplines" → "disciplines". The title and
  the state (open to it) were kept, then taken off the same day (below).
  - **The note asks for six rows** of the profile's eight cells, then of six, then a row fewer at a time down to
    three. Each span is every breakpoint's. Not two: two rows held the last paragraph alone, and on a tablet they took
    the bottom row from GitHub and the degree. `NoteCard` centres its words down the card with an auto margin, so
    overflow shows at its foot. It lets paragraphs go, each whole, from the one before the last backward, and **the
    last stays**: what I am after, which the title names.
  - *Measured:* all six at 1440 × 900 (six rows of six cells), 1512 × 982, 1728 × 1117 and 1920 × 1080 (six rows of
    eight). The first two and the last at 1280 × 720 (three rows). The first and the last on an iPhone SE (four rows).
    Not on a phone or a tablet, where the work fills the room. Email and GitHub left the well for the row under the
    block, centred in the band. On a tablet the degree has its label again, under them.
  - *What it costs:* on an iPhone SE the note takes the room the links had, so Email and GitHub are not shown there.
  - **Then the heading and the state came off** (*"Remove the 'What I'm after' heading and 'Open to it' text"*): the
    note is his paragraphs alone. `NoteCard` takes its title and state only if it is given them. The row the heading
    took went to the words: the first three and the last at 1280 × 720, the first two and the last on an iPhone SE, and
    all six from 1440 × 900 up, as before.
- **And the first screen a row up, the address in a card, and the links in the profile's column (2026-09-27).**
  *"Push all the verticals one row up. Replace Email button with card containing my email hiddenstack@no-origins.com
  and copy button to copy email to clipboard. Then place the email and github between the Resume row and the about me
  text box."* (Another session swapped the projects and the degree the same hour, from his "swap education and
  projects": the projects under the work, the degree first in the third column. This builds on that.)
  - **A row up** (`FIRST_SCREEN_LIFT`, `arrange.ts`): the first screen stands a row higher than it is centred, where
    there is a row over it. On a field twelve rows deep that is the empty top row P3 kept (1440 × 900, 1512 × 982 start
    on row 1). A taller field leans a row up: 1920 × 1080 starts on row 2, where it was 3. A phone and a tablet,
    already on row 1, do not move.
  - **The address is a card** (`EmailCard`, `profile-card.tsx`): hiddenstack@no-origins.com in the text's colour,
    which a click selects whole, and a ghost button in lime that copies it, its icon a check for 1.6s after. The two
    are a step of the spacing scale apart (8px, 12 to the icon), as an icon and its words are on the rest of the
    screen (*"add some spacing between email and copy icon, feels too tight"*; it was 4). A card too narrow for the
    step, an iPhone SE's 228px, keeps the half step. Where the
    browser refuses the clipboard, the address is selected for the keys. It is `profile.email` in `resume.ts`, and the
    Email link's `mailto:` is it too. It was hiddenstack@icloud.com.
  - **Email and GitHub are one item under the facts** (`ProfileLinks`, `below`): the card taking what GitHub's two
    cells leave, as the years do in the row above. One row at every size, a phone's included. There, four cells just
    hold the address and its button (7px of air a side on a 390-wide phone, 1px on an iPhone SE), and two rows put the
    work off the page. His words are under them, in the well; nothing is left in the room for the old pills.
- **And the degree is a card two rows tall (2026-09-27).** *"Increase the Btech card to two rows and add LPU and
  years."* `EducationBlock` puts the label's cell first and the card on the column's other cells, both rows, the cell
  under the label left empty. `EducationCard`, unused since P15, is rewritten for it: the degree in the text's colour,
  balanced where it runs to two lines (it does at five cells), then Lovely Professional University and 2017 — 2021 in
  `caption`, the three centred down the card. Where two rows do not fit, on the bottom row of a phone or a tablet, it
  is the one row it was: the label's cell and the pill, else the pill alone. *What it costs:* the third column's row
  came out of the technical skills, which show twelve marks at 1440 × 900 and nineteen at 1920 × 1080.
  - *Then back to one row, the same hour* (*"Can we fit the same in 1 row?"*): the degree's pill holds two lines,
    the degree and, in `caption`, "LPU · 2017 — 2021" (`EDUCATION.short`, his word). Two lines are 36px, which a
    row's pill holds inside its round ends: 18px of air a side and 12 over and under at 1440 × 900, 8 over and under
    on a phone. The full name does not fit beside the years at four cells. `EducationBlock` and the two-row
    `EducationCard` went. The technical skills have their row back.
- **And the case studies (2026-09-27).** *"Let's also add another section: case studies. It's something in which there
  is not content/work yet, so we can put 'Work In Progress' for it."*
  - **Under the projects in the second column**, a row of air over it: its label's cell (an open book,
    `BookOpenTextIcon`) and a pill that says Work In Progress, three cells on a pointer, wrapped as the projects are.
    It is last in `site.tsx`'s order, though it stands under the projects, so where the columns go under the profile
    the room gives the degree its row first. Phones and tablets do not show it; 1280 × 720 does, in the room.
  - **A pointer's first screen keeps no empty rows**, to fit it. The second column is twelve rows: work 6, air,
    projects 3, air, case studies 1. The block could have ten on a field twelve rows deep, so the work's card would
    have given up two. `TOP_ROWS` is 0 on `lg` and `xl` (the lift had taken the top row already), and a new
    `FOOT_ROWS` gives up the pager's old bottom row there (0 on `lg`/`xl`, 1 on touch, where the room puts the
    degree). At 1440 × 900 the first screen is the whole field. The third column grows to match, and **the technical
    skills show all twenty-three marks** at 1440 × 900 and up. On a taller field the block is centred and leans a row
    up, as before.
- **Then the content and the socials (2026-09-27).** *"Add another section for content - same as coming soon from case
  studies."* Asked where, since every column was full at 1440 × 900: *"Let's move art skills up by 2 rows and then
  under skills, let's add content. And under that add socials."*
  - **Under the art skills in the third column**, each one row: its label's cell (a newspaper, `NewspaperIcon`, for
    the content, and an at sign, `AtSignIcon`, for the socials) and the case studies' Work In Progress pill. All
    three are one helper in `site.tsx` (`comingSoon`), and each is its own loader ring. **The socials are coming soon
    too**: of his links only GitHub has a URL, and it is in the profile column. LinkedIn, Discord, X and Instagram
    have none in `LINKS` (P6), so they cannot be rendered yet.
  - **No air between them.** Moving the art skills up two rows frees exactly two rows, one each. The technical skills
    give them up, as the column's `grow` item: at 1440 × 900 the tech has four rows and shows seventeen of its
    twenty-three marks, and at 1366 × 768 and 1512 × 860 it has two rows and seven marks. Nothing else moves. Both are
    last in `site.tsx`'s order with the case studies, so where the columns go under the profile the room fills after
    the degree: 1280 × 720 shows the content and not the socials.
- **And the work is a column of companies (2026-09-27).** *"Work is too much information on portfolio with what we
  have right now … instead of horizontal placing of logos and changing them like tabs, I want to remove all the dense
  information in the cards and put the logos vertically under the work icon cell, and each company cell (similar to
  education) can have up to maximum of two rows height and minimum amount of information required in it."*
  - **The briefcase's cell, and under it a row for each company**, newest first (`ProfileWork`). Each row is the
    company's mark on a cell of its own, bordered and filled as the tabs' cells were, so the four marks stand in a
    column of circles under the briefcase. Beside the mark, on the column's other cells, is a pill: the role, and
    under it in `caption` the company and the years, "Senior Full Stack Developer" over "Radise · 2025 — Present"
    (his, the same day: "instead of SR, write senior"; the résumé has "Sr"). That is
    the degree's pill, the degree over "LPU · 2017 — 2021". The company takes its short name (TTT) where the full one
    does not fit beside the years. At every size measured it fits, so no company uses it.
  - **One row each.** He allowed two, but the two lines fit one row at every width the column takes, so no company
    uses the second. At 1440 × 900 the pill is four cells (276px) and the longest line, "Software Development
    Engineer II", is 225px (Dataflix's level, his, the same day: "in Dataflix it has to be SDE 2, two in Roman"). Two rows each would make the work nine rows. That is more than the column beside the centre
    has, with the projects and the case studies under it. *Mine, his to change:* the role first and the company in the
    caption, as the degree puts the degree first and the school in the caption. Also the years without months, as the
    degree's are.
  - **What went**: the Tabs, the active company's growth to spell its name and its lime ring, and the card under the
    marks (what I did there, a line each, and the stack). The lines and the stacks are still in `resume.ts` (P6).
    Nothing in the column can be pressed, so it has no Tab stops. Tab goes from the avatar to the résumé, then to the
    tech's marks. The accent jig's work-tab controls have nothing left to act on.
  - **The work is five rows at every size**: its label's row and one row a company. It was six, and seven on a phone.
    Where it gets fewer, the label goes first and then the oldest company (P5). At 1366 × 768 the column is two rows
    short, so the four companies stand without the briefcase.
  - *What it costs.* Beside the centre the work's column was the tallest, so it and the block are a row shorter. The
    technical skills give up that row: three rows and twelve marks at 1440 × 900 and 1512 × 982, where they had four
    rows and seventeen marks, and four rows at 1728 × 1117 and 1920 × 1080, where they had five. On a field twelve rows
    deep the bottom row is empty. *(The degree left the third column the same hour, below, and gave the tech its two
    rows.)*
  - *What it gives.* Under the centre the work fits where it did not. 1280 × 720 and the iPhone SE show the four
    companies without the label. In exchange, 1280 × 720 no longer shows the note, the case studies or the content, and
    showed no degree until it went to the profile's column (below). A phone and a tablet show the case studies under the
    degree's old row, which is the profile's since.
  - *Open, his to decide:* giving the row back. Either let the column that grows run to the room's height (the open
    question above), or let Radise take the second row he allowed.
- **And the profile's column in his order (2026-09-27).** First *"in the resume row, we shall have a resume, six plus
  years building products and GitHub … the education card … remove B.Tech in and put in only computer science honors
  with LPU 2017 to 2021 and then the email and then Hyderabad"*. Then, before it was built (it did not fit: the
  degree, the address and the city are nine of a pointer's cells, and the column is eight): *"Let's move the resume
  and email rows below the about me text. The about me text should be just below the avatar and name row, and then
  under that we will have resume, email and GitHub, and then underneath that we will have education and location."*
  So the column is, top to bottom:
  - **The avatar and the name**, as they were.
  - **His words** (`NoteCard`, `profile.story`), out of the room and into the column's flow, under the profile. The note
    **grows** (`grow` on an item in the flow, `sizeGrowers` in `arrange.ts`): it takes the rows the first screen leaves
    under the flow, at most six, which hold every paragraph at six cells and at eight. The first screen is arranged
    without it to find them: beside the columns where they stand beside the block, under everything where they go under
    it. Under three rows (`FLOW_GROW_MIN`) it is left off, and it is never put in the room. *Mine, his to change:* it
    gives way to every other box, so a phone and a tablet keep the work and show no note, as they did before.
  - **Résumé · Email · GitHub** (`ProfileLinks`): 2 · 4 · 2 on a pointer's eight cells, the address's card taking what
    the two pills leave. Six cells do not hold them, since the address and its copy button need four, so there
    (1440 × 900, 1366 × 768, a tablet, a phone) the résumé and the address are one row, and GitHub is centred under
    them. It is on two cells, and on four of a phone's, as the city was.
  - **The degree · Hyderabad** (`ProfileFacts`): the degree's pill takes what the city's two cells leave, one row at every
    size. It reads **Computer Science (Hons.)**, with "LPU · 2017 — 2021" under it in `caption` (`EDUCATION.subject` in
    `resume.ts`; the résumé's "B.Tech in Computer Science (Hons.)" is kept as `degree`). It has its cap again, since it
    has no section label beside it. It is about 205px, which a phone's four cells and an iPhone SE's (230px) hold. The
    city's pin and word are about 100px, which two of a phone's cells only touch, so a phone's city is the word alone
    (P5). `EducationPill` moved to `profile-card.tsx`, and the degree loads with the profile's ring.
  - **Gone from the page: 6+ Years Building Products.** It was in his first message and not in the second, which named
    the résumé's row as Résumé, Email and GitHub. The note's first line says it ("for over 6 years now"), and
    `profile.years` is kept in `resume.ts`. *His to put back.*
  - **The third column starts with the technical skills**, which take the degree's row and its air (`grow`).
  - *Measured, with the section labels two cells wide (another session's change, the same hour):* 1440 × 900 and
    1512 × 982, the note six rows, the tech five rows and eighteen marks. 1728 × 1117 and 1920 × 1080, the note six
    rows, the tech six and all twenty-three. 1366 × 768, the note five rows, the tech three and eight marks.
    1280 × 720, the profile, the links, the degree and the work, and no note. A tablet and a phone show the
    profile's column without the note, then the work, the case studies and the content, and an iPhone SE the work
    and the case studies. The Beyond section is gone from `site.tsx`: nothing was left in it.
- **And the labels show their words (2026-09-27).** *"The icon cells for each section, instead of just showing icons,
  let's expand them to also show the label of the section name."*
  - **A label is its icon and its word** (`SectionCell`, `cards.tsx`), in the transparent pill it was. The icon is
    still violet. The word comes after it in `caption`, in the muted tone, a step of the spacing scale away, as an icon
    and its words are everywhere on the first screen. The word is the section's heading, so the tooltip went. *Mine,
    his to change:* `caption`, not the `label` role the column labels had before the icons. It is the narrowest role,
    and Case studies must fit two of a pointer's cells so that its row still holds the label and the Work In Progress
    pill in five. In `label` it needs three cells, the case studies become two rows, and at 1440 × 900 the second
    column would be a row taller than the field.
  - **Each label is as many whole cells as its icon and its word need**, with a round end of air each side. The widths
    are measured off the page and declared in `site.tsx` (`LABELS`), the way the projects' pills are, so `arrange`
    gives a section its rows before it is drawn. On a pointer every label is two cells except Technical skills, which
    is three. On touch all are two. On a phone's cells (48 to 56px), Case studies and Technical skills are three.
  - **The section flows on after the label's cells.** The projects, the art skills and the Work In Progress pills wrap
    after them (`CellWrap`; `wraps` counts the label's cells first). The tech's marks flow from the next cell
    (`ProfileTech`'s `lead`). The work's label spans its first row, with the company marks under its first cell
    (`ProfileWork`). Where a row cannot hold the word, the label is its icon's cell again, with the word as its
    tooltip. Where a row cannot hold even that, the label goes (P5).
  - *What it costs.* On a five-cell column (1366 to 1512 wide) the projects and the art skills are each a row taller. A
    two-cell label and Agents Society's four do not fit one row of five, so the label stands alone on the projects'
    first row, and UI/UX in Figma stands alone on the art skills' second row. At 1440 × 900 and 1512 × 982 the second
    column is the whole field, twelve rows where it was eleven. The technical skills keep their five rows and show
    eighteen marks, their label taking two cells more. **At 1366 × 768 the work gives up the row**: it shows three
    companies, and Terribly Tiny Tales is not shown. On six-cell columns (1728 and up) nothing moves: the projects
    and the art skills keep their rows, and the technical skills show all twenty-three marks. A phone and a tablet
    show the work's, the case studies' and the content's labels with their words. Their rows had the room.
  - *Open, his to decide:* whether the projects' label goes back to its icon's cell on a five-cell column. That gives
    Terribly Tiny Tales its row back at 1366 × 768, and the projects their first row back at 1440 × 900. *Moot since
    the next entry: every label has a row of its own.*
- **And each label on a row of its own, centred (2026-09-27).** *"The labels should justify center in their own
  section. Move all the cards or boxes that are in the row of the label, move them to the next row. It has to be
  consistent across work, projects, technical skills, art skills, content, socials, case studies."*
  - **A label stands alone on its section's first row, centred on it** (`labelSpot`, `cards.tsx`), on the field's own
    cells. Its cells are the ones its word needs, and one more where the row's other cells would not split evenly
    either side. On a five-cell column every label is three cells. On a six-cell column they are two, and Technical
    skills is four. The pill, the icon and the word are as they were. The tooltip and the icon-only cell went, since a
    label now always has a row's width.
  - **Everything that stood beside a label starts on the next row.** The projects, the art skills and the Work In
    Progress pills wrap from the row under it, from the column's left edge, as before (`CellWrap`; every `wraps` starts
    with `LABEL_ROW`, a whole row). The tech's marks flow from the row under it (`ProfileTech`, whose `lead` takes the
    first row). The work's companies were already under its label. A section with nothing in it yet is two rows, in
    the room as well (`WIP_ROW`). Where the rows do not hold the label's row and what is under it, the label goes (P5).
  - **A column short of rows gives up its air first** (`arrange.ts`), the last first, and the item that grows keeps
    `GROW_MIN`. Before this change the work gave up the row, and at 1440 × 900 that took the work's label off. Now the
    row of air over the case studies goes: at 1440 × 900 and 1512 × 982 they stand straight under Project Four.
  - *What it costs.* **The technical skills give up the rows**: eight marks at 1440 × 900 and 1512 × 982 (it was 18),
    sixteen at 1728 × 1117 and 1920 × 1080 (it was 23), three at 1366 × 768. At 1366 × 768 the work still has no room
    for its label, and shows its four companies again (the air went first). The case studies, the content and the
    socials take two rows each where they took one. So 1024 × 768 no longer shows the case studies. A tablet and a
    phone show the case studies with their label and no longer show the content. An iPhone SE shows no case studies.
    On six-cell columns the art skills are three rows where they were two.
  - *Mine, his to change:* the pieces under a label start from the column's left edge, as they did. Only the label is
    centred.
  - *Open, his to decide:* the tech's marks. Letting the column that grows run to the room's height (the open question
    above) gives them the two empty rows under the block at 1920 × 1080. Taking the air between the sections out of the
    third column gives them one more row everywhere.
- **And the socials are marks in the profile's column; the projects wear the arrow (2026-09-27).** *"Remove socials as
  a section and add social media icons like X, Instagram along with GitHub. Put that row under education row. And then
  add one row spacing between art skills and content."* Then: *"Remove in progress, idea, shipped labels from the
  projects boxes and replace them with the link icon that No Origins has."*
  - **The socials section went** from under the content. **A row of marks is the last of the profile's column**, under
    the degree and Hyderabad (`ProfileSocials`, `profile-card.tsx`). Each mark is simple-icons' (CC0) on a cell of its
    own, a Card the radius makes a circle, like the company marks. It is in the text's colour, as the tech's marks and
    the cap and the pin over it are. *It was lime, as the links are, for an hour:* *"Why are the social icons lime
    color? It looks very inconsistent. Fix them."* Each is a link out in a new tab, its name its
    tooltip and its label. The marks stand on the field's cells, centred on the column. An odd remainder leans left,
    as a block does (P8): at eight cells the three marks are on cells 3 to 5, at six on cells 2 to 4.
  - **Which marks:** GitHub, X, Instagram, LinkedIn and Discord, in that order. X and Instagram are **@hiddenstack**
    (his, asked: `https://x.com/hiddenstack`, `https://www.instagram.com/hiddenstack` in `LINKS`). LinkedIn and Discord
    have no URL. They were left off at first (P6) and **put in the same hour** (*"Why didn't you add Discord and
    LinkedIn? Add them too. We'll add the URLs later."*). A mark with no URL is drawn with its name as its tooltip,
    but it is not a link, is not pressed and is not a Tab stop. It becomes a link when its `href` is filled. This is the
    one exception to P6. LinkedIn has no mark in simple-icons since v10 (LinkedIn asked for it out) or in lucide, so its
    path is in `profile-card.tsx` (`LINKEDIN`), the "in" in its rounded square as simple-icons last drew it. Five marks
    on eight cells are cells 2 to 6. On six cells (1440 × 900, 1366 × 768, a tablet, a phone) they are cells 1 to 5,
    the empty cell on the right.
  - **GitHub left Résumé · Email · GitHub**, which is Résumé · Email: 2 · 6 on a pointer's eight cells, 2 · 4 on six.
    It is one row at every size, where six cells made it two. So the column is as long as it was everywhere but on
    eight cells.
  - **A row of air between the art skills and the content** (`air: 1` on the content).
  - **The projects' states came off** (in progress, idea, shipped). Every project's pill is its name and No Origins' ↗
    in lime (`NotePill`). The pills are narrower: Agents Society 3 cells on a pointer where it was 4, Project Four 3,
    and on touch every one is 2. At five cells the projects wrap to the same four rows, Agents Society and No Origins
    side by side. *What it costs:* only No Origins has a URL, so on Agents Society and the two placeholders the arrow
    points nowhere. The pill is not a link there and does not take focus. *His to decide:* their URLs, or no arrow
    until they have one. The states are still in `resume.ts` (Agents Society's is a fact) and off the placeholders.
  - *Measured.* The technical skills get the socials' two rows less the air: 13 marks at 1440 × 900 and 1512 × 982
    (it was 8), 22 at 1728 × 1117 and 1920 × 1080 (it was 16), and 3 at 1366 × 768, as before. **At 1280 × 720 the
    work is not shown**: the profile's column is a row longer on eight cells, and three rows are left under it where
    the work needs four. His words take them (three rows, the first three paragraphs and the last). Everywhere else the
    work stands as it did, and the marks show at every size, an iPhone SE's included. Tab reaches them last, after the
    copy button.
  - *Open, his to decide:* 1280 × 720. Letting the work stand in three rows, the three newest companies without the
    label, would put it back under the marks.

**P5 — A card gets denser as its slot gets smaller; it never clips.** A slot clips (Slots.md), so a card reads its own
size off the grid. The profile card: under 360px wide the avatar and the name step down; under 480px tall the blurb
clamps to four lines; under 340px tall the blurb goes, and its body is spread with `justify-between` so a tall slot
distributes the air instead of pooling it above the footer. A role card carries as many of its lines as the slot holds
— all of them on a phone's six-row card, two on a five-row one, one under 300px — because a bullet cut in half is the
card saying its span is wrong. The packer helps: it gives up at most a quarter of an item's rows to keep it on a page
with its header, and starts a new page rather than squash it further. *The role card went on 2026-09-25 (P12), and its
line budget with it; the profile card's blurb went the same day (P4, amended), so what it has left to step
down is the face and the name.*

**P6 — The content is a file, in his voice.** `src/content/resume.ts` holds every fact from the résumé, written first
person and plain (Brand.md §5). A link with no value is not rendered — nothing is invented to fill a slot. LinkedIn is
such a slot today: the résumé names it but does not print the URL. The résumé PDF itself is a download (Brand.md §11
decision 5), so what it prints is public — the phone number included.

**P7 — The site is sections, one a screen, in the résumé's order.** *2026-09-21, later: "use the content I have
provided you and create the remaining part of the portfolio … there can be multiple pages now since the scroll is
also added."* Home (the profile card) · **01 Work** (four role cards: the company's mark and name, the title and dates,
what I did, the stack as chips — *since P12, the four marks and their names and nothing else*) · **02 Stack** (the stack as chip groups; the six skills as bars, drawn as the résumé
draws them) · **03 Beyond** (what I am after, Agents Society, No Origins, education, languages, outside the work) ·
**04 Say hello** (the contact card). Every section starts a new page and spills onto more when the field is short;
scrolling up turns the page (Grid.md D27). Each section has a one-row header — number, name, title — above its cards.
*Since 2026-09-26 (P4, three columns) the Work and Stack screens are the first screen's right and left columns, and
the sections are the first screen · 01 Beyond · 02 Say hello.* *Since 2026-09-27 (P15) there is one screen: Beyond and
Say hello are placed in the room it leaves, and the section headers went.*

**P10 — The four roles stand side by side in one row from `lg` up.** *2026-09-21: "instead of having two cards in rows
and two cards in columns, let's have four cards vertically in a row."* Each takes a quarter of the band — three columns
on `lg`, four on `xl` — and most of the field's height, so the work section is one screen of four tall columns instead
of a 2 × 2 grid over two. Below `lg` they stay one to a row and run down the pages: a quarter of a tablet's eight
columns is 156px, which is not a card. A column card wears its company mark **above** the name rather than beside it,
and how many of its lines it shows is a budget, not a count — each line costed against the room the card has, because
Terribly Tiny Tales' lines are twice the length of Radise's and a fixed count clipped them (`linesThatFit`). *Since
P12 (2026-09-25) a column holds a mark and a name, three rows rather than most of the field; the row of four stands.*

**P8 — The content keeps a measure; the field is margin.** The band is 4 · 6 · 8 · 12 · 16 columns by breakpoint,
centred on the field; a 26-column monitor gets the 16-column page with air around it. A "half" card is two to a row from
`lg` up and one to a row below. Spans are per breakpoint in `site.tsx` and chosen so a card is the same physical card
wherever the cell differs (Grid-v2.md §5 P3). The bottom row is the pager's on every page and nothing is placed on it.
*Since P15 (2026-09-27) there is no pager: the first screen is still arranged over that row, and the row is the
room's.*

**Amended 2026-09-21, later: a page's block is centred down as well as across.** *"Currently, we are trying to
horizontally center the cards in portfolio. Let's also do that vertically."* The room is the rows between the top row
(where the breakpoint has one, P3) and the pager's; a page whose block is shorter than the room sits in the middle of
it, and a page that fills the room does not move. An odd remainder is floored, so it leans to the top — the same lean
as the grid's own centring of a kept page (Grid.md D25). So on `xl` the profile card has two empty rows above (the
reserved one and one of the remainder) and two below before the pager; on a phone, where nothing is reserved on top,
it starts on row 1 when the room is one row taller than it. The top row stays reserved — it is air above the room, not
part of it — so the block on `lg` and `xl` sits half a row below the field's centre, which is what P3 asks for.

**Amended 2026-09-22: the showcase arranges its pages the same way.** *"Similar to how portfolio is designed, update
the design app too."* `design.no-origins.com` took P2, P5, P7 and P8 whole — sections one a screen with a one-row
header, a span per breakpoint, the band, the block centred in the band and in the room, a specimen that gets denser
rather than clipping — with one difference: it reserves **no top row** (P3), because its nav is the chrome above the
grid and the air is the nav's. Its `arrange` is a copy of this app's (`apps/design/src/lib/arrange.ts`), not a package
export, because the packer is one of Grid-v2.md's open questions and the package must not decide it; when it is
decided, both become one.

**P9 — Company marks on white tiles, on the Work screen only.** *"Try to use the logos of the companies that I have
worked in."* A mark is the company's own colours, so it sits on a small white tile with a hairline, fixed in height and
as wide as the logo needs — Radise is a wordmark, the other three are square. The marks are the companies' published
favicons and logo files, in `public/logos/`.

**Amended 2026-09-21, reviewing the deployment:** *"Remove company logos in the first page."* So **one mark, on the
role card that is about that company**, and none on the profile card. The first screen is who he is; where he has been
is what 01 Work is for, and the strip of four said it there already. Two things followed from taking the strip out,
both worth keeping in mind whenever a card loses a row of content:

- **The blurb took the row back** — a line or two more of it on a card that has the height.
- **The card had been over-tall all along and the strip was hiding it.** `justify-between` (P5) had been splitting the
  surplus into two gaps either side of the strip; with the strip gone it opened as one hole — 136px on a desktop, 252px
  on a tablet. The profile span gave back a row at every breakpoint and three on a tablet, so the card hugs its
  content again. The numbers were **measured, not guessed**: the gap `justify-between` opens inside the card *is* the
  surplus, and `e2e/.mcp/profile-slack.mjs` prints it in rows. A card whose air pools in one place is a span that is
  too big — the mirror of P5's rule that a card that clips is a span that is too small.

*The white tile was withdrawn on 2026-09-25 (P12, amended): the mark goes straight on the cells, in both themes.*
*Since 2026-09-26 the first screen has the marks again (P4): one cell each on a row of their own under the facts — still
never on the profile card.*

**P11 — Motion is GSAP, and it animates what is INSIDE a box; the grid's turn stays CSS.** *2026-09-21: "Can we use
gsap for better animations?"* — yes, with a line drawn. The turn (Grid.md D27) keeps its own per-frame writer and its
`clip-path`: it is **one proportion, no wave** by his own rule, and every box plus the pager's arrow fill reads the
same CSS variable, which is what makes them one motion. Replacing that with a tween library would buy nothing and put
a dependency in the frame loop. GSAP's place is the content: what a card does when it appears. *(Since Grid.md D37,
2026-09-25, the boxes no longer follow the hand: the per-frame writer fills only the pager's arrow, and the ripple
washes the boxes away with one `clip-path` animation each, stepped at its own times. Still CSS and the platform's own
animations, still no tween library.)*

The first of those is the **bars, which grow when their page arrives** — *"in stack page and Beyond page, when the
components progress in the progress bars should animate the fill."* `Progress` takes `animate` and a `delay` in ms;
`BarsCard` staggers its rows 70ms apart and holds the first 180ms so the fills read as the card settling rather than a
second motion competing with the turn. It needs no visibility test: `GridPages` only mounts the page it shows, so a
card's first render *is* the moment its page arrives, and the growth runs again every time the page is turned back to.
Reduced motion draws the bars full, at once.

**P12 — The Work screen is the four marks and their names, and nothing else yet.** *2026-09-25: "Instead of cards of
information, let's just use the logos of the companies and their names. Then we shall decide what we will add to
them."* Each company is its mark on the white tile (P9) with its name under it, and **no Card around either** — the
tile is the box. The tile is square and on the grid's own cells: two cells a side at every breakpoint (132px on a
pointer, 156px on touch), at the slot's top-left, so its edges are field lines and it stands under the first letter
of the section's header; the name takes the row under it, one gutter down, in `heading`, two lines at most. Four in a
row from `lg` up, a quarter of the band each (P10 stands), two to a row below, so the section is one screen from a
phone up — except an iPhone SE, whose five-row room holds the header and two, and puts the other two on a second page.
The columns beside each tile are air, and they are the room for what comes next. What the role cards carried — the
title and dates, what I did, the stack — is still in `resume.ts` (`ROLES`) and comes back only as he decides it;
`RoleCard` and `linesThatFit` went with the cards, and git history keeps them.

**Amended the same day: no tile — the mark goes straight on the cells.** *"Let's not place the logos on the cards.
Let's just directly place them in the cells."* The white tile, its hairline and its shadow are gone; the mark fills
the two-by-two square of cells itself, keeping its proportion (a square mark the whole square, Radise's wordmark its
whole width, centred down), and the field's lines show through wherever the mark is transparent. This withdraws P9's
white tile on the Work screen, which is the only place a mark appears: **the marks are on the theme's own ground in
both themes**, so a mark drawn in black — Terribly Tiny Tales' disc — reads as a dark disc on dark rather than a
shape, and Radise's small red INTERNATIONAL is faint there.

**Amended again the same day: centred, and a row of air under the header.** *"Also fix the spacing between the
heading 'Work' and the logos row"* and *"align the logo and the logo name should justify center."* The mark and its
name are **centred in the slot**, the name in `heading`, centred, two lines at most. On `xl` and `md` the slot is four
columns and on a phone two, so the centred mark's edges are still the field's lines; on `lg` and `sm` the slot is
three, and the mark is centred half a cell off them — the row of four (P10) is kept over the lines. A section header
sits a gutter above a card whose own padding is the rest of the air; the marks have no box to lend it any, so **the
Work header is two rows from `sm` up with its text at the head** — a row of air under it. On a phone that row is the
one the second pair of marks needs to stay on one screen (a 390 × 844 room is seven rows: header, then two rows of
three), so there the header keeps one row and only its text moves to the top of it. `SectionHeader` takes `alignY`
for this; every other header stays at the foot of its one row.

**And in the other order: oldest first.** *"Reverse the logos order."* Terribly Tiny Tales, Hashnode, Dataflix,
Radise — the row reads left to right, and a phone's two rows top to bottom, as the six years ran. `ROLES` in
`resume.ts` stays newest first, as the résumé has it; the Work section reverses a copy.

**P13 — On hover, a band of lime or violet behind the mark.** *2026-09-25, with a mock of all four: "The idea I have
for logos when hovered over a company."* While the pointer is on a company — its mark or its name — a flat band sits
behind the mark: a parallelogram whose upright edges stay upright and whose top and bottom slope up **16°** to the
right, **1.29** of the mark wide and **0.60** of it tall at its upright edges, centred on the mark. The numbers are
measured off his mock, and so are the colours, which are exactly the system's `--lime` and `--violet` (his HEY!
picks, one value in both themes): **violet, lime, violet, lime** along the row, so Terribly Tiny Tales and Dataflix
are violet and Hashnode and Radise lime. The mark is drawn over it, and where a mark is transparent the band shows
through — Hashnode's hole is lime. It is flat (no gradient, no glow), and it overhangs the mark's two cells into the
air beside it, which the slot has on every field with a pointer.

The mock is still; **the motion is ours, not his, and is his to change**: the band is drawn like a stroke of a
highlighter, in from its left edge (280ms, `power3.out`), and out through its right edge when the pointer leaves
after it has finished (220ms, `power2.in`) — back the way it came if it leaves sooner. GSAP, by P11, on the fill
only: the slant is on an outer element that never moves, so moving the fill's origin between its edges cannot shift
the band. *Since 2026-09-25 the fill is swept by a `clip-path` rather than scaled, so that a band can carry ink (P4);
the look and the timing are the same.* **Touch has no hover, so it draws nothing** on a phone or a tablet; reduced motion shows and hides it at
once. **The cursor is the pointer** over the whole company, mark and name — *"On hover change the cursor"*, the same
day — so a company says it can be clicked before a click does anything: nothing is focusable or clickable yet, and
what a click opens is the next thing to decide.

**P14 — The pager is numbered.** *2026-09-25: "In the portfolio, let's put the arrow buttons at the first and last
items of the navbar. And in between, let's fill that with page numbers."* The portfolio's bar is Grid.md D36's
`numberedPagerBar`: back (↑) on the first cell, forward (↓) on the last, and page numbers on the four cells between.
The site had more pages than that (five on a desktop, seven on a laptop, six on a tablet, eight on a phone), so the
four are a window that holds the current page second and slides against the ends; pressing a number turns straight
to it. The bar is built on the field's own bar width, which the renderer reads off the grid with the rest of the field.
*Since the first screen's three columns (P4, 2026-09-26) it is three pages on a desktop, four on 1280 × 720, five on a
tablet, six on a phone and seven on an SE; with three pages the bar's fourth number cell is empty, as D27's own cells
are.* *Withdrawn 2026-09-27 with the pages (P15): the portfolio draws no bar.*

**P15 — One page: the first screen, and the rest in the room it leaves.** *2026-09-27: "We don't need multiple pages
in portfolio now. Remove pagination navbar. For now, try arranging pieces from those pages to the first page, without
disturbing the current ones."* The renderer is a `Grid`, not a `GridPages`: no pager's bar, no turn, and nothing that
turns — the scroll and a finger do nothing, and the arrow keys only ever moved focus (Grid.md D45). The intro stays
(D31); the ripple went with the turns it played between (D32).

*The first screen does not move.* `arrange` arranges it exactly as before — over the bottom row it kept for the pager,
so not one of its boxes changes cell at any size — and keeps its first page. Everything that was not on that page goes
in **the room it leaves**, in `site.tsx`'s order, first-fit, each item at the first of its spans that fits (its own,
then its `fallback`s), and **what fits nowhere is not shown**. The room is two places: **the well** — the centre's
columns under the facts, down to the foot of the columns beside it, where they stand beside it — and **every row under
the whole block** that the tagline does not keep, the pager's old row among them. Nothing goes above the block, beside
it, in the air between the verticals (SIDE_GAP) or outside the band (P8). A row of one-row pieces under the block is
centred in the band.

*What went where.* **What I am after** is a note in the well — three rows of the centre's eight on a field of twenty
columns, two of its six on eighteen, the state beside the title and the line under both, centred down the card. The
rest are **pills**, the facts' own (P4): a Card one row tall, as many whole cells as its words need — **Email** and
**GitHub** first, since they are how to reach me, in the résumé's lime; then **Agents Society** and **No Origins**
(with its state, and the arrow out where it has somewhere to go); the **degree**; the **languages**; the **hobbies**.
The pills carry the facts and not the cards' prose: Say hello's paragraph, the languages' bars, the school and the
section headers are not on the page. *Mine, his to change:* all of it — the order, the pill forms, and that a piece with
no room is left off rather than made smaller.

*Amended the same day.* The languages came off (*"I don't want languages, we can remove it"*). The projects and the
degree went into the first screen's columns (P4, above). No Origins lost its state (*"we can remove 'you are here'"*):
the pill is the way out, to the showcase in a new tab, as it already was. GitHub has its mark before its name
(*"I think GitHub icon is missing"*), simple-icons' as the tech's are. So the room holds the note, Email, GitHub and
the hobbies, and **it takes the later sections' pieces first and the first screen's own overflow after**. Otherwise the
degree, which a phone packs under the work, took the phone's bottom row from Email and GitHub. Measured after:
1440 × 900 and 1920 × 1080 show the columns, the note and the links in the well, and the hobbies on the bottom row.
1280 × 720 shows the links and the hobbies. A tablet shows the links and the degree, a phone the links, and an iPhone
SE the note and the links. Where the columns go under the centre, the projects are off the page with the tech.

*What each field shows (measured 2026-09-27, before the amendment).* 1366 × 768, 1440 × 900 and 1512 × 860: the first screen, the note in
the well, and Email, GitHub, both projects and the degree on the bottom row — the languages and the hobbies do not fit.
1920 × 1080: everything, a row of pills under the columns and a second under the tagline. 1743 × 1341: everything, both
rows under the columns. **Where the first screen already spilled onto a second page, what spilled is now not shown:**
at 1280 × 720 the tech and the work are off the page (the room is the bottom row: the links, the projects and the
languages), at 1024 × 768 the tech; on a tablet and a phone the tech is off and the room is the bottom row — Email,
GitHub and Agents Society on a tablet, Email and GitHub on a phone; an iPhone SE shows the profile, the facts and the
note, and neither column. That is the question this leaves open: what a field too small for the first screen should
do.

*Since 2026-09-27 (P4, the profile's column in his order) the room holds none of this:* the note is in the profile's
column under the avatar, growing into the rows the first screen leaves there, and the links and the degree are under
it. What the room still takes is the first screen's own overflow on a small field.

**P16 — One vertical in focus at a time.** *2026-09-27: "When portfolio first loads, Only first vertical should be
active. Other two, should look inactive or out of focus because user will start reading from first vertical. When
anything is selected/hovered in any other vertical, then that vertical should be active and the other should go back
to being inactive."* Where the first screen's columns stand beside the block, `arrange` numbers its verticals from
the left (the profile's, the work's, the degree's) and says which one each box stands in (`verticals`). The room's
pieces count by where they landed, so the note in the well is the profile's. The first vertical is in focus when the
page opens. A pointer over any box of another vertical, or the focus reaching one (Tab, the arrows, a tap), moves the
focus there. It stays when the pointer leaves, because the vertical last touched is the one being read. Where the
columns went under the block (a phone, a tablet, 1280 × 720) there is one column, and nothing fades.

**Amended the same day: the page wakes from the top left.** *"Instead of making a vertical active based on the
cursor, once all the components render, lets everything get activated from left top to the right bottom."* Every box
on the page is inactive until the grid's load is over — the intro's loader has opened the last section (Grid.md D48),
or there was no intro to play — and then they become active in a diagonal front, from the block's top-left cell to its
bottom-right. A box becomes active when the front reaches its own top-left cell, so boxes on one diagonal wake
together. Once active, a box stays active: the pointer and the focus change nothing, and nothing fades again.
`arrange` no longer numbers the verticals. Every box takes part at every size, a phone's included, where before
nothing faded. The front first ran one cell down the diagonal per step of movement's stagger (20ms), and each box
switched over the state's 150ms once the front reached its top-left cell.

**And from the avatar, smoothly, the same day.** *"Instead of activating one section at a time, which doesn't feel
smooth, can we do something where the activation is smooth and starts from the avatar?"* Each box had switched on
whole, in 150ms, one after another, so the page lit in steps. Now the front is a circle that grows from the avatar's
centre at an even pace until it has passed the page's farthest corner. A box starts to brighten when the front reaches
its nearest point and is fully active once the front has passed its farthest point, evenly in between
(`wakeFront` in `portfolio-pages.tsx`). Every box the front is over is part way at once, and a big box brightens for
as long as the front takes to cross it. Where the field has no avatar, the front starts at the field's top-left corner.

*The front is mine, his to change.* It takes 1200ms to cross the page at every size (`WAKE_MS`). The front moves at an
even pace and each box brightens linearly, so there is no easing to pick. It is a number of the portfolio's own, like
the HEY!'s (Motion.md §2), and not a system token: no component moves by it. Measured 2026-09-27 at 1440 × 900, the
profile's column is active by 400ms, the work and the projects by 900ms and the right-hand column by 1400ms. A box
still brightens as one piece. A front that cuts across a box, half of it lit, would need a second copy of the box or a
see-through layer over it, and the page keeps neither. Under reduced motion the boxes are active from their first
paint.

*Inactive is mixed, not blurred and not see-through.* Mine, his to change: an inactive box has its text, its lines,
the lime and the violet and their inks mixed into the page, keeping 40% (`INACTIVE` in `portfolio-pages.tsx`). Its
images fade over their own cards, and a selected tech mark's brand colour fades with them. The cards, the page and the
shadows stay, so a box is still a box. There is no blur, because the system keeps none. There is no opacity on the box
either, because a faded card would show the field's dashes through it, the same reason the work's hover fill is
mixed. The change eases through one registered number a box, `--box-active`, which every mixed colour follows (it was
`--vertical-focus`). `node e2e/.mcp/page-wake.mjs <outdir> [w] [h] [scheme] [ms…]` shoots the page as the load ends
and at the moments given after it, prints each box's `--box-active` at each, and hovers a box to show nothing changes.

## 3. Where it lives

| Thing | Where |
|---|---|
| The page model (`PortfolioPage`, `PortfolioItem`, `PortfolioField`) | `apps/portfolio/src/content/index.ts` |
| The packer — top row, band, the first screen, and the room it leaves (P2, P3, P8, P15) | `apps/portfolio/src/lib/arrange.ts` |
| The sections and every span (P7, P8) | `apps/portfolio/src/content/site.tsx` |
| The facts (P6) | `apps/portfolio/src/content/resume.ts` |
| The grid renderer (P2), one page on a `Grid` (P15), and the page waking from the avatar (P16) | `apps/portfolio/src/components/portfolio-pages.tsx` |
| The first screen's centre: the profile card, the tagline, the résumé with Email, the degree with the city, and the social marks (P4, P5) | `apps/portfolio/src/components/profile-card.tsx` |
| The work column: the label's cell, then a mark and a pill for each company (P4) | `apps/portfolio/src/components/profile-work.tsx` |
| The tech stack, a mark a cell, under the projects (P4) | `apps/portfolio/src/components/profile-tech.tsx` |
| The columns beside a block (`side`, stacked; `air`, `grow`, `wraps`) and a section's own band (P4) | `arrange.ts` and `PortfolioItem` / `PortfolioSection` in `content/index.ts` |
| The sections' labels, an icon and a word, and the wrap (`SectionCell`, `CellWrap`, P4); the note and the pills (P15); the section header, bars, education, hobbies and contact cards, unused since | `apps/portfolio/src/components/cards.tsx` |
| The company mark, straight on its cells (P9, P12) | `apps/portfolio/src/components/logo.tsx` |
| The bars' growth (P11) | `packages/ui/src/components/progress.tsx` — `animate` + `delay`; `BarsCard` staggers |
| The redirect (P1) | `apps/portfolio/next.config.ts` |
| The 1.0 pages | deleted 2026-09-23 (they were parked in `apps/portfolio/.legacy/`); git history keeps them |

## 4. Open

### P17 — Recruiter quick view (2026-09-27, preview)

The approved UX review is implemented as a separate recruiter screening preview. This page is for HR and readers
with many portfolios to assess; it is not the full future portfolio. The persona study's approximately 7.2 seconds
is a design constraint supplied by Bhargav, not a general claim about recruiters.

`RecruiterView` replaces the first-fit composition at `/`. The actual measured field decides between three columns
and compact Work / Projects / Skills tabs. Identity, role, experience, résumé and email lead; each company carries
a contribution summary. Only real project links have outbound affordances. Unpublished work says so. Skill names
remain visible, and learning is distinct. Neutral ink replaces lime text; lime remains the primary action fill.

The screening view omits the intro and wake delays and uses ordinary DOM keyboard order. Copy email reports success
or a selectable-address fallback. A visible Read profile action provides the complete history, skills and biography.
For widths below 360px, heights below 640px, enlarged root text or overflowing card content, that reading composition
is automatic. **It scrolls normally**: this approved accessibility alternative is an exception to the viewport grid's
no-scroll rule, scoped to this page; the grid and other apps are unchanged. It is also server-rendered before sizing.

The prior P15/P16 composition is retained in source but is not mounted by this preview. Facts stay in `resume.ts`,
screening summaries in `screening.ts`, and composition in `recruiter-view.tsx` and `screening-cards.tsx`.
Review uses `REVIEW_PORT_OFFSET=100 pnpm review` to isolate branch servers from the original checkout.

The first refinement keeps the profile column on the grid's own units: Résumé and the single mailto/copy address
share one row; education and Hyderabad share the next. GitHub, X, Instagram, LinkedIn and Discord each occupy one
whole cell, followed by theme and, where the field has room, Read profile. LinkedIn and Discord remain honest
non-links until their URLs exist. The six screening skills stay visible and All skills opens the complete grouped
stack without leaving the quick view.

- **The rest of the résumé.** Work, the case studies, interests, philosophy (Brand.md §9) — each a page or a run of
  slots after the first screen, designed in the composer and pasted back (Grid.md D20). *Since 2026-09-23 (Grid.md
  D30) there is no composer: each is a section in `site.tsx`, arranged like the rest (P2, P7).*
- ~~**Turning the page on a phone.**~~ Closed by Grid.md D27: the pager on the bottom row and the scroll — a finger
  on a phone — turn it. Nothing to see until there is a second page.
- **The quest host.** *Withdrawn 2026-09-23 with quests (Admin.md §0.7).* Admin.md §0.6 says the portfolio becomes one renderer for many subdomains, with `bhargav` (now
  `hiddenstack`) a quest. This build is hand-written content on the same renderer; moving it into a quest is the step
  after the pipeline exists.
- **LinkedIn** — the URL (P6).
