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
in it scrolls: what does not fit a screen goes to the next page, turned with ← → (Grid.md D5, D23).

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

**P11 — Motion is GSAP, and it animates what is INSIDE a box; the grid's turn stays CSS.** *2026-09-21: "Can we use
gsap for better animations?"* — yes, with a line drawn. The turn (Grid.md D27) keeps its own per-frame writer and its
`clip-path`: it is **one proportion, no wave** by his own rule, and every box plus the pager's arrow fill reads the
same CSS variable, which is what makes them one motion. Replacing that with a tween library would buy nothing and put
a dependency in the frame loop. GSAP's place is the content: what a card does when it appears.

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

## 3. Where it lives

| Thing | Where |
|---|---|
| The page model (`PortfolioPage`, `PortfolioItem`, `PortfolioField`) | `apps/portfolio/src/content/index.ts` |
| The packer — top row, pager row, band, sections as hard breaks (P2, P3, P8) | `apps/portfolio/src/lib/arrange.ts` |
| The sections and every span (P7, P8) | `apps/portfolio/src/content/site.tsx` |
| The facts (P6) | `apps/portfolio/src/content/resume.ts` |
| The grid renderer (P2) | `apps/portfolio/src/components/portfolio-pages.tsx` |
| The profile card (P4, P5) | `apps/portfolio/src/components/profile-card.tsx` |
| The section header, the stack, bars, note, education, hobbies and contact cards (P7) | `apps/portfolio/src/components/cards.tsx` |
| A company on the Work screen, mark and name (P12), and its hover band (P13) | `CompanyMark`, `BAND` and `drawBand` in `apps/portfolio/src/components/cards.tsx` |
| The company mark, straight on its cells (P9, P12) | `apps/portfolio/src/components/logo.tsx` |
| The bars' growth (P11) | `packages/ui/src/components/progress.tsx` — `animate` + `delay`; `BarsCard` staggers |
| The redirect (P1) | `apps/portfolio/next.config.ts` |
| The 1.0 pages | deleted 2026-09-23 (they were parked in `apps/portfolio/.legacy/`); git history keeps them |

## 4. Open

- **The rest of the résumé.** Work, the case studies, interests, philosophy (Brand.md §9) — each a page or a run of
  slots after the first screen, designed in the composer and pasted back (Grid.md D20). *Since 2026-09-23 (Grid.md
  D30) there is no composer: each is a section in `site.tsx`, arranged like the rest (P2, P7).*
- ~~**Turning the page on a phone.**~~ Closed by Grid.md D27: the pager on the bottom row and the scroll — a finger
  on a phone — turn it. Nothing to see until there is a second page.
- **The quest host.** *Withdrawn 2026-09-23 with quests (Admin.md §0.7).* Admin.md §0.6 says the portfolio becomes one renderer for many subdomains, with `bhargav` (now
  `hiddenstack`) a quest. This build is hand-written content on the same renderer; moving it into a quest is the step
  after the pipeline exists.
- **LinkedIn** — the URL (P6).
