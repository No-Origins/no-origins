# No Origins — Portfolio

*The portfolio at `hiddenstack.no-origins.com`, rebuilt on the grid. Opened 2026-09-21, the day the first screen was
built. Bhargav's words are quoted; the rest is the record of what he decided. Rule numbering is this document's own,
P1 onward.*

Companion documents: **Brand.md** (§5 voice, §9 the seven sections this portfolio will eventually hold),
**Grid-v2.md** (the field every page is on), **Slots.md** (a card on the grid is a slot holding a component),
**Type.md** (every piece of text is a `Text`), **Admin.md §0.6** (the portfolio as quest host — the path this is on).

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
(Grid.md D20), the authored `layout` is added beside the arrangement and wins.

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

**P5 — A card gets denser as its slot gets smaller; it never clips.** A slot clips (Slots.md), so a card reads its own
size off the grid. The profile card: under 360px wide the avatar and the name step down; under 480px tall the blurb
clamps to four lines; under 340px tall the blurb goes, and its body is spread with `justify-between` so a tall slot
distributes the air instead of pooling it above the footer. A role card carries as many of its lines as the slot holds
— all of them on a phone's six-row card, two on a five-row one, one under 300px — because a bullet cut in half is the
card saying its span is wrong. The packer helps: it gives up at most a quarter of an item's rows to keep it on a page
with its header, and starts a new page rather than squash it further.

**P6 — The content is a file, in his voice.** `src/content/resume.ts` holds every fact from the résumé, written first
person and plain (Brand.md §5). A link with no value is not rendered — nothing is invented to fill a slot. LinkedIn is
such a slot today: the résumé names it but does not print the URL. The résumé PDF itself is a download (Brand.md §11
decision 5), so what it prints is public — the phone number included.

**P7 — The site is sections, one a screen, in the résumé's order.** *2026-09-21, later: "use the content I have
provided you and create the remaining part of the portfolio … there can be multiple pages now since the scroll is
also added."* Home (the profile card) · **01 Work** (four role cards: the company's mark and name, the title and dates,
what I did, the stack as chips) · **02 Stack** (the stack as chip groups; the six skills as bars, drawn as the résumé
draws them) · **03 Beyond** (what I am after, Agents Society, No Origins, education, languages, outside the work) ·
**04 Say hello** (the contact card). Every section starts a new page and spills onto more when the field is short;
scrolling up turns the page (Grid.md D27). Each section has a one-row header — number, name, title — above its cards.

**P10 — The four roles stand side by side in one row from `lg` up.** *2026-09-21: "instead of having two cards in rows
and two cards in columns, let's have four cards vertically in a row."* Each takes a quarter of the band — three columns
on `lg`, four on `xl` — and most of the field's height, so the work section is one screen of four tall columns instead
of a 2 × 2 grid over two. Below `lg` they stay one to a row and run down the pages: a quarter of a tablet's eight
columns is 156px, which is not a card. A column card wears its company mark **above** the name rather than beside it,
and how many of its lines it shows is a budget, not a count — each line costed against the room the card has, because
Terribly Tiny Tales' lines are twice the length of Radise's and a fixed count clipped them (`linesThatFit`).

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

## 3. Where it lives

| Thing | Where |
|---|---|
| The page model (`PortfolioPage`, `PortfolioItem`, `PortfolioField`) | `apps/portfolio/src/content/index.ts` |
| The packer — top row, pager row, band, sections as hard breaks (P2, P3, P8) | `apps/portfolio/src/lib/arrange.ts` |
| The sections and every span (P7, P8) | `apps/portfolio/src/content/site.tsx` |
| The facts (P6) | `apps/portfolio/src/content/resume.ts` |
| The grid renderer (P2) | `apps/portfolio/src/components/portfolio-pages.tsx` |
| The profile card (P4, P5) | `apps/portfolio/src/components/profile-card.tsx` |
| The section header, the role, stack, bars, note, education, hobbies and contact cards (P7) | `apps/portfolio/src/components/cards.tsx` |
| The company mark on its tile (P9) | `apps/portfolio/src/components/logo.tsx` |
| The bars' growth (P11) | `packages/ui/src/components/progress.tsx` — `animate` + `delay`; `BarsCard` staggers |
| The redirect (P1) | `apps/portfolio/next.config.ts` |
| The 1.0 pages, parked | `apps/portfolio/.legacy/` — out of the build; delete when nothing in them is wanted |

## 4. Open

- **The rest of the résumé.** Work, the case studies, interests, philosophy (Brand.md §9) — each a page or a run of
  slots after the first screen, designed in the composer and pasted back (Grid.md D20).
- ~~**Turning the page on a phone.**~~ Closed by Grid.md D27: the pager on the bottom row and the scroll — a finger
  on a phone — turn it. Nothing to see until there is a second page.
- **The quest host.** Admin.md §0.6 says the portfolio becomes one renderer for many subdomains, with `bhargav` (now
  `hiddenstack`) a quest. This build is hand-written content on the same renderer; moving it into a quest is the step
  after the pipeline exists.
- **LinkedIn** — the URL (P6).
