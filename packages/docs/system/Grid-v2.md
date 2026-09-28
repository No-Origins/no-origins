# No Origins — The Grid, v2

*The base layout of the 2.0 design system, second document. Opened 2026-09-21, the day the direction changed.
**Grid.md** points here for as long as this is the current version; **Grid-v1.md** is the document before it, with a
summary of what it decided in front of its full text. Bhargav's words are quoted; the rest is the record of what he
decided, and the field is now fully decided (§4). Authoring on it is deferred (§7). The composer that authored on it
(§8) was removed on 2026-09-23 (D30): the grid renders, and nothing in the system edits it.*

Companion documents: **Brand.md** (upstream of everything visual), **Admin.md §0.5** (quests were composed on this
grid until Admin.md §0.7 removed them, 2026-09-23), **Grid-v1.md** (D1–D11, which this document keeps, amends or
dissolves one by one in §2) and the **repo-root CLAUDE.md**, which stays the authority on how the code is built.
**The code moved to v2 on 2026-09-21**, the same day; this document decides the grid and the code follows it.

Rule numbering **continues from v1** — the first rule here is D12 — so that any `Grid.md Dn` is one rule, in one
version, wherever it is cited.

---

## 1. What changed

**Bhargav, 2026-09-21:** *"I had this question in my mind that asked, does the size of the canvas matter? So now I'm
going to ask, does the breakpoints of the grid and fixed number of rows and columns matter? In the end, all these boxes
are the basis of Lego blocks, right? We can add more, we can expand more. So the only thing that I want to be bothered
about right now is the size of each grid item. If that is fixed, if that is decided, the whole viewport can be filled
with grid items, we can avoid scrolling in any direction, we can have items that flow to the next page. Over time we
can figure out some function that arranges the components on the grid."*

v1 decided four numbers per breakpoint — `cols · rows · gap · pad` — and the cell fell out as whatever was left. v2
decides **the cell**, and the counts fall out. Given a box, the field is as many whole cells as fit across and as many
as fit down, the remainder is margin, and whatever does not fit goes to the next page.

```
cols = floor( (W − gap) / (cell + gap) )      ← W less one gutter of pad each side, plus one gutter (D15)
rows = floor( (H − gap) / (cell + gap) )
```

*Amended the same evening by D26 (§8): each count is then rounded down to even, never below two.*

That is the whole inversion. What it does to the rest of v1 is §2; the three picks it left him are decided in §4.

Why it is the better question: v1's §4 table stayed empty for three days because it asked him to decide, five times
over, something the viewport can answer by itself. A Lego brick has one size; the baseplate is however big the table
is. And the thing every later decision actually waits on — how big a molecule's default box is, what a card *is* in
pixels — is meaningless while the cell varies by breakpoint, and settled the moment it does not (Admin.md §0.5 carries
placeholder sizes for exactly this reason). Fixing the cell unblocks the organisms and templates without waiting on a
table.

---

## 2. What v1's rules become

Every rule is kept, amended or dissolved here, by number. The full text of each is in Grid-v1.md §2.

**Stand unchanged:**

- **D1 — One square cell is the unit.** Now the founding decision rather than one of eleven.
- **D3 — The grid never scrolls and never overflows its box.** `floor` guarantees it.
- **D4 — Boxes are placed by coordinate; a move is refused, never reflowed.**
- **D5 — Overflow goes to another PAGE.** More important than before, because the field now differs at every viewport
  and paging is what absorbs that.
- **D9 — Cells are square, always.** Trivially now: the cell is a decided number, nothing has to be squared. Where the
  remainder goes is D14: centred, as v1 already had it.
- **D11 — The frame.** Stands whole and becomes the method (§5): drag its corner and watch the counts change.
  **Withdrawn in part 2026-09-23 (D30).** The frame is deleted (`GridFrame`, `metrics.scale`); D11's other half
  stands — nothing forces a breakpoint: `resolveField` takes a width and a height, and no grid component takes a
  `breakpoint` prop. A size is seen by sizing a window.

**Amended:**

- **D6 — was: the widest authored breakpoint is the truth.** With no breakpoints there is nothing to be widest. What it
  becomes is **one authored field and everything else derives**, by the packer that already exists, with authored page
  breaks as hard breaks. Which field is authored is §4 pick 3. The packer is v1's reading-order packer today, and
  improving it is the *"function that arranges the components"* — ongoing work, not a precondition.
- **D10 — was: gutter and pad are decided per breakpoint, with the counts.** There are no counts to decide them with.
  The gutter is still one step of the spacing scale (§3), per breakpoint, never typed freely (D13). **The pad is no
  longer a decided number** (D15): the field's margin is whatever the remainder is, and there is no minimum. v1's
  *"Let's keep the pad"* of 2026-09-18 is reversed by his 2026-09-21 *"I should just be able to define the size of the
  cell and the gutter."*

**Dissolved:**

- **D2 — counts decided per breakpoint, never by content.** Counts are decided by the box. Still never by content: a
  field does not grow because something was put on it.
- **D7 — the field IS the breakpoint.** The field is the viewport. The grid stops reading breakpoints at all; Tailwind's
  still exist for type and app chrome, and the grid never consults them. `metrics.bp` goes.
- **D8 — a short landscape box turns the field on its side.** Free. A wide short box simply gets more columns than rows
  (§5's table shows 844 × 390 becoming 10 × 4 with no rule at all). The transposition, its read-only editor state and
  the "never authored" exception all go.

---

## 3. The spacing scale

```
0 · 4 · 8 · 12 · 16
```

Unchanged from v1 §3, and the reasoning there stands. The gutter is one of these, per breakpoint. The cell itself is **not**
on this scale — it is its own decision (D13), a size, not a spacing. There is no pad to draw from it (D15).

---

## 4. The picks — made 2026-09-21

Three questions were open the morning this document was written. Two he answered and one he set aside; each rule
below names the alternative it was chosen over.

**D13 — One cell per breakpoint. His pick: "1 per breakpoint."** Breakpoints stay in the grid for exactly this:
each names a cell size, and its gutter, from which its counts derive at whatever box it is given. A phone brick and a
desktop brick may differ in size; within a breakpoint the brick is fixed and only the counts move. The alternative, one
cell for the whole system (the strict Lego reading, which was recommended), was declined.

**The numbers — decided 2026-09-21, later the same day.** He read them off the frame, then checked them against §5's
principles: his first draft had `sm`/`md` at gap 8 and `xl` at 64, and both were changed on the principles (one
texture; the cell never rises). *"Let's go with your recommendation and set the tablets to 12 too."*

| Breakpoint | cell | gap | why |
|---|---|---|---|
| **base** | 72 | 12 | A 1×1 is a finger target (P1); every phone from 375 to 430 gets four columns (P4). *Since D33 no field is under six columns: a phone's cell gives way, 46 to 57px.* |
| **sm** | 72 | 12 | Still fingers; same brick as the phone, so a card is the same card |
| **md** | 72 | 12 | Same |
| **lg** | 60 | 12 | A pointer is likely from here; the brick shrinks once (P2) and never again |
| **xl** | 60 | 12 | Same brick as `lg`: a window crossing 1280 changes its count, never its card |

One gutter everywhere, so the field has one texture (P5) and one edge margin. A 2×2 card is 156px on touch and 132px
on a pointer, an 18% swing (P3). This table is `DEFAULT_GRID_CONFIG` verbatim.

**D14 — The remainder is centred margin. His pick: "the recommendation, stays centred margin."** A box is almost never
an exact multiple of `cell + gap`; what is left over on an axis — less than one cell plus one gutter — is split equally
on both sides of the field, which sits centred as v1's D9 already had it. The gutter does **not** widen to absorb it,
so it stays a step on the scale. The margin is therefore not a number anyone sets; it is a consequence, from zero up
to `cell + gap − 1`, and on a viewport that divides exactly the outer cells touch the edge.

**D15 — A breakpoint is two numbers: `cell · gap`. His words: "I should just be able to define the size of the cell and
the gutter."** That is the whole config. `cols` and `rows` are gone from it (D2 dissolved), and so is `pad`: he named
two numbers, not three, and with D14 the margin already exists without one. v1's D10 kept pad as its own number on
2026-09-18; this reverses that. If a minimum margin is ever wanted — so that on an exact-fit viewport the outer cells do
not touch the edge — that is a pad coming back, and it is one line in the config.

*Amended the same day, his idea, accepted:* **the pad is the gutter.** *"Make the container of the grid take up the full
viewport and then the padding of the container should be the same as the gutter."* The field sits one gutter from every
edge of its box, so the edge of the screen is one more grid line and a box is as far from the edge as from its
neighbour. This is not a third number — pad is *defined* as gap — so a breakpoint is still `cell · gap`. It does not
remove the remainder (D14), which cannot be removed without stretching something; the margin you see is the gutter plus
half the remainder, and at an exact fit it is exactly one gutter. The counts are therefore
`floor( (W − gap) / (cell + gap) )` and the same for H — rounded down to even since D26.

**Deferred — which field is authored, and how boxes are placed by hand.** *"Regarding placing the boxes by hand, we
shall define that later. Right now let's only focus on the grid."* The grid, in this document, is the **field**: what
D12–D15 describe. Everything about what goes on it — authoring, packing, derivation across fields, the pager as a
component — is §7, and v1's D6 stays in force there until it is redecided.

---

## 5. How to pick the cell

On `/composer` (it was `/grid` when this was written — D16), inside the frame (D11). The frame is the whole method here too, but what you read off it flips: v1 set four
numbers and read the cell; v2 sets the cell and reads the counts.

**The method withdrawn 2026-09-23 (D30).** The composer, the frame and the stepper are gone, so the four bullets
below are the record. The six principles and the table after them stand, and are now the whole of the check — P4
already asked for real devices. A number still changes only in `DEFAULT_GRID_CONFIG` and D13.

- **The cell stepper** replaces the Tracks popover: one row per breakpoint, two numbers — the cell in px and the gap
  along the scale (D15).
- **The readout** gives `cols × rows · cell · gap · pad · box` live, as before, and the counts are now the thing that
  moves.
- **Drag the frame's corner** and watch a column appear and vanish. Just before a column pops in is where D14's
  margin is at its widest; that is the moment to judge whether the cell is right for that breakpoint.
- **Rotate**, and see D8 happen with no rule: the counts swap because the box did.

**The six principles.** Written 2026-09-21 when he asked *"what are the principles that we have to follow to decide
on the sizes between different breakpoints"*, having picked a first draft by eye. Looking is where a row starts; these
are how it is checked before it is written down.

- **P1 — The 1×1 is a target where there are fingers.** The pager button fills its cell, so the cell IS the touch
  target: at least 44px on touch breakpoints, about 32 where a pointer is certain. Everything larger is a multiple, so
  the cell only has to be right for the smallest thing.
- **P2 — A bigger screen gets more cells, never bigger ones.** The cell stays flat or shrinks as breakpoints grow —
  targets go from finger to pointer, and density is the point of a larger screen. It never rises from one breakpoint
  to the next.
- **P3 — The same component stays recognisable.** A 2×2 card is a different physical size wherever the cell differs.
  Keep the swing under about a fifth across the whole config, checked on a 2×2 and a 4×1.
- **P4 — Test real device widths, not the reference box.** The remainder is the tax on a fixed cell and its worst
  case is nearly `2·(cell + gap)` (D26: a pair of columns arrives together). A pair appears exactly where the box
  equals `n·(cell + gap) + gap` for even `n`. Check that the
  devices in a range all land on the same count, and that the common ones sit just above a boundary, never just below.
- **P5 — The gap is texture and edge at once.** Gap over cell is what makes the field read as one lattice across
  breakpoints, so it wants to stay roughly constant — and since the pad is the gap (D15), it is also the minimum
  distance from the screen edge, so it is never smaller than an acceptable page margin.
- **P6 — Rows are capacity.** Columns times rows is what a page holds. Check heights with browser chrome taken off
  (about 100px on a desktop) and check the short landscape phone.

The decided config (D13) at the reference boxes, and a few real devices:

| Box | bp | cols × rows | margin per side |
|---|---|---|---|
| 375 × 667 · iPhone SE | base | 4 × 6 | 26 × 88 |
| 390 × 844 · phone | base | 4 × 8 | 33 × 92 |
| 430 × 932 · big phone | base | 4 × 10 | 53 × 52 |
| 640 × 960 | sm | 6 × 10 | 74 × 66 |
| 768 × 1024 · tablet | md | 8 × 12 | 54 × 14 |
| 1024 × 768 · tablet on its side | lg | 14 × 10 | 14 × 30 |
| 1440 × 900 · desktop | xl | 18 × 12 | 78 × 24 |
| 1920 × 1080 | xl | 26 × 14 | 30 × 42 |
| 2560 × 1440 | xl | 34 × 18 | 62 × 78 |
| 844 × 390 · phone on its side | md | 8 × 4 | 92 × 33 |

Counts are even since D26 (the table was redone that evening; before it the SE had 7 rows, the desktop 19 columns).
Two things the table shows that are worth knowing: the 430 phone sits 2px below the fifth column (which appears at
432), so it pays 53px a side for the stability of four columns on every phone — a flag, not a fault; and the desktop
pays 78px a side because the 19th column that fits at 1440 is dropped to keep the count even (D26) — the 20th appears
at 1452. Both are D14 doing what it says.

---

## 6. What this did to the code — done 2026-09-21

Recorded so the size of the change is known. Nearly all of it was deletion; the showcase and the admin typecheck and
`/grid` was reviewed on desktop and phone after it.

- `DEFAULT_GRID_CONFIG` becomes `cell · gap` per breakpoint (D15). `cols`, `rows` and `pad` leave it; the `pad`
  prop on `Grid` goes with them, and the container's padding is the gutter.
- **`fill` goes.** *"Ideally, everything will always be on the grid once we are out of the grid editor."* No page holds
  a grid as a block, so the grid is always its box — the viewport, or the frame inside `/grid` — and there is nothing
  for `fill` to switch. The rulers on `/grid` still reserve their own room; they are a tool's affordance and shift
  nothing in an app.
- `resolveField` takes a width and a height and returns counts by the §1 formula. `metrics.bp` goes (D7); the
  transposition branch goes (D8); the `min(trackW, trackH)` goes because the side is given (D9). Centring stays (D14).
- `grid-layout.ts` keeps its packer, pages and per-breakpoint `authored` — authoring is deferred (§7) and v1's D6
  still governs it. One consequence had to be handled now: within a breakpoint the counts vary with the box, so pages
  authored at one count must pack onto another. Authored pages therefore carry the **shape** they were written on
  (`layout.shapes`; `LEGACY_SHAPES` supplies v1's counts for anything saved before), `resolvePages` packs whenever the
  field's shape differs — the same breakpoint at another width included — and the badge says `packed from 12×6`. A
  layout saved before v2 (the admin's quests, the seed) still resolves.
- The Tracks popover on `/grid` becomes the cell-and-gap stepper (§5). The breakpoint toggle stays as "snap the frame to this
  reference box" — the boxes are still worth having as presets even though nothing resolves against them.
- The `Grid.md` citations in the grid's own source now name v2 rules; the frame cites Grid-v1.md §4 for its
  reference boxes, which is where they were decided.
- The quest composer (Admin.md §0.5) inherits all of it through the package and grows nothing.

*Undone in part on 2026-09-23 (D30): the stepper and the frame went with the composer, and the quest composer with
quests.*

---

## 7. Open

- **Authoring — decided later the same day, in §8.** Per breakpoint, on its reference field, in the composer. v1's
  D6 stays in force for derivation between breakpoints. (It had been deferred that morning: *"regarding placing the
  boxes by hand, we shall define that later."*) **Withdrawn as a tool 2026-09-23 (D30):** authored pages per
  breakpoint are still the model; nothing authors them by hand.
- **The packer** — *"some function that arranges the components"*. Reading-order first-fit today. What it should
  preserve when a page is repacked onto a different field (adjacency? relative size? reading order only?) is the design
  question under authoring, not a code one.
- **The first things on it — the showcase, 2026-09-21.** *"The rule was to always have grid as the viewport. But
  when I go to atoms, molecules and overview … they all have vertical scrolls. So let's just place the grid, take the
  items and place them on the grid."* Done the same day: the three reading pages became fields, each specimen a box
  sized in cells, packed in reading order by `layoutFromSpans` onto the field the page is on — not onto a reference
  field and derived, because derivation keeps a packed page as a hard break and a screen one row shorter than the
  reference left every page's last row on a page of its own, which he saw at once. Two things came out of it that belong to the system: **`GridBox`**, the box as a component, with a
  `box` variant (the surface, content inset by one step of the scale from its hairline) and a `plain` one — *"I think
  we might need a transparent container"* — with **no inset at all**, so a card placed in one snaps to the cells and
  text in one starts on a grid line (he saw the first draft's 12px inset at once: *"not exactly snapping"*); and the
  rule that **a box clips**: nothing on the grid scrolls, so a box that cuts its content off is the wrong size. Atoms sit in
  boxes, molecules in transparent containers because most carry their own surface, the overview's text in transparent
  containers and its cards as they are — his three calls. The showcase is therefore also the first real test of the
  reading-order packer, and what it does badly there (holes; a 6-wide box on a 4-wide phone) is the brief for §7's
  packer work.
- **A centre — parked 2026-09-21.** He asked whether the field could always have an odd (or always an even) number of
  columns and rows, so that a box can sit exactly centred. It can, in one line, and it costs a wasted track on about
  half of all devices per axis: always-odd takes every phone to three columns. The alternative is a box that asks for
  a centre and gets its span adjusted to the field's parity and placed at `(cols − span) / 2 + 1` — a new kind of item
  and the packer's first real rule. Neither is built. His call: *"let's park this."* When the first centred thing is
  designed (the portfolio's ring around Me is the likely one), it is built as the packer's rule, not as parity in the
  field, unless he says otherwise then.
- **The pager — decided 2026-09-21, D27.** A fixture (option A): six 1×1 cells on the bottom row of every field, four
  empty and ↑ ↓, and the scroll itself turns the page. A phone turns a page with a finger.
- **What sits on the grid — answered 2026-09-21: slots (Slots.md).** A slot holds a component or sub-slots on the
  same cells; organisms and templates are slots with sub-slots. A component's default size is its registry span.

---

## 8. The composer — decided 2026-09-21

*"We should have a composer … the composer is where we design."* The evening's decisions, after the showcase moved
onto the grid (§7). They close the authoring question and replace an idea that lasted an hour — a "design mode" toggle
in the nav that turned any page editable in place — with one place where design happens.

**Withdrawn 2026-09-23 (D30).** The composer is deleted. D16, D17, D19 and D20 go with it; D18 keeps its model and
loses its tool. D21–D29 were decided here but are the grid's, and stand; where they mention the composer, that is the
record of where they were first tried.

**D16 — `/grid` becomes `/composer`, and the composer is where design happens.** The tool that was `/grid` on the
showcase keeps everything it had — the frame (D11), the pages, the flip, drag, resize, undo, the Cell popover — and
becomes the one place a layout is arranged. There is no design mode, no toggle, nothing editable in place on a page.
**Withdrawn 2026-09-23 (D30).** `/composer` is gone and nothing replaces it; the half that said no — no design mode,
nothing editable in place — stands, and now covers the whole system.

*Two notes from the composer's first day:* it opens a page in the **xl** frame rather than fit, because fit on a wide
monitor authored xl on a 34 × 16 field that the reference frame then had to repack (D18 wants the reference field); and
the rulers moved onto the cells the same night (D24), so they no longer cost a frame a column.

**D17 — Every page has a Compose button, and the composer opens on that page's layout.** *"When I click on the
compose button, we go to the compose page, then I can arrange or design on the grid for each breakpoint."* The button
is in the showcase's nav and always shown: the showcase has no auth and no database (repo-root CLAUDE.md), and the
composer changes nothing on its own — a layout only reaches a page when its export is pasted into code. So the gate
is the one that already exists, his hands on the keyboard. **Withdrawn 2026-09-23 (D30).** The button, its `?from=`
and the `PAGES` loader behind it are gone.

**D18 — Authoring is per breakpoint, on its reference field.** In the composer you work inside the frame; editing on a
breakpoint writes that breakpoint's pages down on the frame's shape (`withAuthored`), and the others derive (v1 D6).
This is §4's deferred pick 3 answered — not "author once on the desktop", not "author against a count", but the
second option: one layout per breakpoint, made on the box the table in Grid-v1.md §4 names. A box's **span can also
be set for every breakpoint at once** from an inspector, without leaving the field you are on: setting `base`'s span
from the desktop authors `base` on its reference field. **Withdrawn in part 2026-09-23 (D30).** The model stands: a
`GridLayout` carries pages per breakpoint with the shape they were written on (`layout.shapes`), and `resolvePages`
derives the rest (D22, D25) — the admin's home is one, written in code on `lg`'s 12 × 6. The authoring went: the
frame, `withAuthored` / `withoutAuthored`, and the inspector's span for every breakpoint.

**D19 — The palette.** Components are dragged from a palette onto a cell; the ghost says where the box will land and
turns red where it cannot (D4). *Amended the same evening (Slots.md S1):* the palette lists **components** from the
registry — an `Input` is an Input — not the showcase's specimens, which the first build handed him: *"it gives me a
card that tells me that it is an Input … that is not what is expected."* A dropped component lands in a **slot**.
**Withdrawn 2026-09-23 (D30).** There is no palette; the registry keeps one entry, the pager's arrows (Slots.md S7).

**D20 — Export is JSX, in two copy blocks: the `GridLayout` first, the `GridConfig` second.** No JSON. *"I can copy
the grid layout and pass it to Claude so that Claude can use the grid layout and update the page that I came from."*
The loop is therefore: open a page → Compose → arrange per breakpoint → copy the first block → paste it to the agent →
the page's file gets the layout. A page then carries an authored layout rather than a list of sizes, and packs only
where a screen's field differs from an authored shape. **Withdrawn 2026-09-23 (D30).** `layoutCode` and `configCode`
are gone, and no layout reaches a page by paste. A page is content data — items with a span per breakpoint —
arranged on the live field (Portfolio.md P2; the showcase's copy of it since 2026-09-22).

**D21 — Four kinds of box.** Amends §7's `GridBox`. *Renamed the same evening: the box is a **slot** (Slots.md), and
the four kinds are its `fill`; everything else here stands.* *"I need a fourth variant … which uses background colour, because
I just want to fill that variant so that it masks the lines behind the component."*

| Variant | Draws | Inset | For |
|---|---|---|---|
| `transparent` | nothing | 0 | text on the field; a component that carries its own surface |
| `background` | the page background | 0 | a component that should hide the grid lines behind it and nothing more |
| `muted` | the muted surface | 12 | a filled box with content in it |
| `card` | the card surface and a hairline | 12 | the atoms' boxes; the editor's default item |

The `background` fill is the theme's background token, so in the light theme it is the page's white and in the dark
theme its near-black — invisible as a surface, which is the point; it is a mask. `muted` is `0.97` light / `0.269`
dark and reads as a surface in both. (`card` and `background` are the same colour in the light theme, which is why a
card-coloured fill could not be the "filled" variant.) *Amended 2026-09-25: they are the same colour in the dark theme
too — "the cards currently have gray background color … change it to the color that is in the viewport background.
And then add border to the cards." `--card` is `0.145` on dark, and `Card` draws a `border` where it drew a
`ring-1`; a `card` fill is now the `background` fill with a hairline.*

**D22 — Derivation is mobile-first.** *2026-09-21, his ask: "whenever a design is done at a lower breakpoint, that
should be adapted automatically to higher breakpoints. But I should still be able to design each breakpoint."* A
breakpoint with no layout of its own derives from the nearest authored breakpoint **narrower** than it, and only when
none exists from the nearest wider. This reverses v1 D6's "widest authored is the truth": a layout made on a small
field adapts upward into more room, which never spills onto extra pages, while packing a wide layout down is the
lossy direction. Authoring any breakpoint in its frame still writes that breakpoint down (D18); a breakpoint
authored is never derived. Two things came out of the same report: the composer now **opens in the xl frame** when
it comes from a page rather than on whatever monitor it is on, because fit on a wide screen authored xl on a 34 × 16
field that the reference frame then had to repack; and a bug — a slot's children were derived with the page's pager
corner reserved, so on a narrow field a slot's last child vanished onto a page a slot never shows. Sub-slots derive
with nothing reserved (Slots.md S5).

**D23 — No page-turn buttons on the field.** *2026-09-21: "We don't need page turn buttons any more. Remove them."*
The ‹ › that D5 put in the bottom corners are gone, and with them the cells the packer reserved for them: every cell
of every page is a box's to take. Pages themselves stay (D5 is otherwise unchanged): a layout is still pages, overflow
still goes to the next one, and the flip still turns it. **What turns a page now is ← → on the keyboard and the
composer's toolbar.** A phone has neither, so a showcase page on a phone shows its first page and no more until a
gesture or a placed pager exists — the placeable pager in §7 is that item, and a swipe is the other candidate.

**D24 — Rulers are drawn on the field, not beside it.** *2026-09-21: "Let's have rulers at the centre of each grid
item on top and left items."* The column number sits at the centre of each cell in the top row and the row number at
the centre of each cell in the left column, over the cells. Rulers take no space, so showing or hiding them changes
nothing about the field — which is what had been breaking a layout: the 24px strip they used to reserve came out of
the box in fit, the count changed by a column, and the arrangement was repacked. Rulers are a tool's affordance and
chrome never alters what is being designed.
**Withdrawn 2026-09-23 (D30).** The rulers went with the composer, the one tool that drew them.

**D25 — A derived layout that fits is kept and centred; only what does not fit is packed.** *2026-09-21: "I start
with mobile-first design. If the base layout has filled up a maximum of three columns and four rows, then even if I
don't configure the other breakpoints, they should follow the base layout — but place all the items at the centre. So
the centre three columns and four rows is where all the other breakpoints will follow, unless designed for each of
their breakpoints."* Deriving a page onto a field: take the block the page uses — the bounding box of its boxes — and
if the block fits the field, keep every coordinate as authored and shift the block to the field's centre, the
remainder split as D14 splits margin (floored, so an odd difference leans to the top-left). Only when the block does
not fit does the packer reflow the page. With D22 the source is the narrowest authored breakpoint, so a base layout
travels up unchanged, centred on every wider field, and a phone still packs a desktop-only layout. Sub-slots follow the
same rule inside their slot (Slots.md S2). A layout packed from a list of sizes (`layoutFromSpans`) never keeps: it has
no arrangement yet.

**D26 — Counts are always even.** *2026-09-21: "Here is a decision I am taking: we should always make sure there are
even number of rows and columns on the grid all the time."* Amends D12's formula: the count is what fits, rounded down
to the nearest even number, never fewer than two — `2 · floor((span − gap) / 2·(cell + gap))`. Both axes, every
field, sub-slots included (a slot's children resolve on the slot's own span, which is whatever was drawn, so the rule
holds only for the field the slot sits on; a 3-wide slot still has three columns inside). What it buys: the field's
centre is a grid line, never a cell, so a block centred by D14 or D25 sits symmetrically — equal cells either side —
and every field halves and quarters cleanly. What it costs: the odd column or row that would have fit becomes margin,
so the worst-case remainder D14 absorbs is nearly `2·(cell + gap)` rather than `cell + gap`, and P4's boundary moves
to every second count. The §5 table is rewritten below on the new formula. A box too small for two cells gets two and
clips, as it got one before.

**D27 — The pager is a navbar on the bottom row, and the scroll turns the page.** *2026-09-21: "Navbar sits at the
bottom center of the grid layout always. Navbar is basically a set of grid items, each occupying one block of grid
item, 1×1 … six of them. Leave the first four empty. The last two will have up arrow and down arrow … map the amount
of scroll with the components and the up and down arrow buttons."* Amends D23 — buttons are back on the field, as a
**fixture** (§7's option A), not as boxes on a page — and replaces D5's flip.

*The navbar.* Six 1×1 cells at the bottom centre of every field, on every page: four empty, then ↑ and ↓. Counts are
even (D26) and so is the bar, so it sits on the centre line. Its cells are **reserved in the model** (`pagerCells`):
nothing is packed there, nothing can be dropped there in the composer, and a kept page (D25) is centred in the room
above the row — the bottom row is the pager's. A field narrower than six gets as many cells as it has, arrows last;
a slot's children have no pager (Slots.md S5) and the composer draws none inside a slot. The four empty cells are
`card` slots — the bar reads as six cells, not two buttons — and hold nothing yet; what goes in them is not decided.

*The turn.* Turning a page is a **progress from 0 to 1**, and everything on the field follows it **in one
proportion**. **Scrolling up is forward** — *"if I'm scrolling up, that means going to next page"* — so ↑ is the
next page and ↓ the one before. **"Up" is the hand's up** (settled later the same day, *"let's drop the negation"*):
fingers moving up the trackpad or the screen, a wheel rolled towards you — a positive `deltaY`. The first build
negated the wheel's delta, reading the browser's "scroll up" instead, so on a Mac trackpad two fingers moving up
turned the page back while a finger on a phone turned it forward; the wheel and the finger now read the same gesture. The wheel or a finger drives it by hand: as it moves, every box on show **loses
height from its bottom edge, keeping its top**, and the arrow being turned
towards **fills by the same share**, ↑ from its bottom up, ↓ from its top down, the arrow inverting where the fill
covers it. At 1 the page turns and the next page's boxes are **revealed from their bottom edge upward** — and the
arrow's fill **leaves the way it came** as they are: for ↑, the bottom of the fill rises to the top, so the fill
crosses the arrow once, in one direction. *Amended 2026-09-22, twice: it had filled a second time during the reveal,
because it read the same progress the boxes do and that runs 0 → 1 twice in a turn — "it doesn't look polished and
feels like a glitch" — and the first fix drained it back the way it had grown, which he sent back too: "once the page
changes, don't pull back the fill … if the fill comes from bottom to top, once the page changes, bring the bottom to
top." The arrow now has two values, `--grid-turn-fill-front` and `--grid-turn-fill-back`: the front advances with the
hand, the back advances after the turn. Found with
it: a trackpad's momentum tail kept arriving after the turn and started a second turn that relaxed back, a wobble after
every turn — the wheel is now muted through the turn and until it has been quiet for 160ms (`MUTE_MS`), so the hand
pauses and scrolls again to turn twice. *(Replaced 2026-09-25 by D35: only the tail is dropped, and a hand that goes on
scrolling goes on turning.)* And the reveal's first frame had a negative progress, because a frame's
timestamp can predate the tween that scheduled it; the arrow blinked full → empty → draining. The tween's clock is
clamped at zero.* Scrolling
down is the mirror: boxes lose height from the top, the next page is revealed from its top down, the ↓ fills.

*(Replaced 2026-09-25 by D37: the boxes no longer follow the hand at all. A committed turn is washed away by the
ripple, cell by cell, and the next page fades in; the clip below is gone from the turn, and only the intro's reveal
(D31) keeps it. The rule under it — never distort what a box holds — stands.)*

**Only the box's height changes, and the box is CLIPPED rather than scaled — settled 2026-09-21 after two wrong
builds.** *"Only the components container height should change without squeezing the content inside it"*, and **no
horizontal scaling**, which he had said the first time and meant.

The first build scaled in Y alone, which changed the height but squashed every glyph with it: *"while scrolling, the
cards are squeezed and the content inside it is also squeezed."* The second read that as a request for a uniform
scale, which stopped the distortion but changed the width — *"I didn't want horizontal scaling"* — and was wrong.
Both are recorded because the distinction is the whole rule: **the container loses height; what it holds does not
change at all.** A clip is the only way to get that. Scaling any axis distorts the content, and animating the box's
real height re-lays-out what is inside it, which moves a card's footer up and re-wraps its text — a reflow is a
squeeze too. So the content keeps its exact size and position and is progressively cut off (`clip-path: inset(…)` in
`globals.css`, with `--grid-turn-hide-top` / `--grid-turn-hide-bottom` naming the edge it is taken from).

*Two things about the edges, found the same evening.* A clip removes everything the box paints, and a card's hairline
and shadow are box-shadows painted **outside** its border box — so the first clip, flush with the box, took the ring
off all four sides and the card went flat for the whole turn (*"looks like the components border and shadow are
missing"*). The three sides that are not moving now bleed 8px past the box, which is room for the ring and the blur
inside the 12px gutter, and keep both; the moving edge starts from the same 8px out and sweeps in, so its shadow fades
with the cut. **The cut edge itself carries no hairline and cannot**: the ring is painted 1px outside the box and the
cut is inside it, and drawing a line at the new height means changing the real height, which is the reflow above. So
mid-turn a card is whole on three sides and bare on the one being taken away, for the few hundred milliseconds a turn
lasts; at rest there is no clip and the card is whole. A hairline that follows the cut, drawn on the grid item in the
system's border colour, is possible and was offered; not taken yet. Let go short of the
turn and the boxes settle back. A click on an arrow, ← → and the composer's ‹ › play the same turn over time, and
**the wheel turns the composer's pages too**: one turn, whatever drives it, wherever the grid is. Reduced motion turns
the page without the scaling. At the last page ↑ is disabled and the progress will not go forward; at the first, ↓.

*The first build, the same afternoon, had the boxes scaling in both axes in a staggered wave from the bottom row, half
a field of scroll to a page, 280ms a box, and the wheel switched off in the composer. He sent all of it back: Y only,
fill and scale one proportion, up is forward, "a little faster and snappy", and the composer scrolls. Scaling itself
went the same evening, for the reason above.* Two numbers are
still mine: a third of the field's height is one page of travel (`RANGE_OF_FIELD`), and a turn let go **past half
way completes** rather than settles back (`COMMIT_AT`); the phase is 160ms (`TURN_MS`), all in grid-pages.tsx.

**And a card is not put in a box.** The overview's three cards had been placed inside transparent boxes and their
one-pixel ring was clipped at the cell edge, so they looked borderless while the molecules page's card did not. His
call: *"let's not put Card in overview inside a grid box."* A grid item may be the component itself, unwrapped — a
`Card` is already a box, and a box in a box is two boxes.

**D28 — The theme changes as a sheet of paint falling down the field.** The rule took a day to find, and the tries
are kept here because each was his call. *2026-09-21: "When we are toggling between dark theme and light theme …
cells from top to bottom, one after the other, should flip like components."* Then, the same evening: *"Each column's
cells should start flipping at different times. The gutter should also start filling like a gradient (between black
and white) along with the columns that it is in between … till the average of transition distance between the two
columns."* On 2026-09-22, when that ran left to right: *"I wanted them to start transitioning randomly."* Then,
watching it slowed down: *"Instead of flipping, let's fill the cells. Each from top to bottom."* And then: *"I didn't
like this too. I'm thinking we should just make it like a paint sheet falling down."* And on the sheet: *"Instead of
blurred edge, make it sharp. Instead of straight bottom, let's make it like a wave."* And: *"We should have dynamic
waves."* Then: *"We should just have 2 to 5 different sized crests of the waves."* And, watching it slowed: *"Looks like the
sheet has grids on it. It should not."* Then, at speed: *"Right when the sheet touches the bottom, remove the sheet,
because it's taking more time to get out of the screen and feels like something is broken as the user is waiting."*
And: *"Instead of immediately removing, dissolve it."*

*What it is.* The switch is a motion of the field, so the grid does it (`GridThemeFlip` in `grid.tsx`), and every
toggle goes through it: the `d` key and the showcase's sun/moon button both call `useThemeToggle`
(`theme-provider.tsx`), which hands the switch to the grid on the page when there is one and switches at once when
there is not — a framed grid in the composer never takes it, the outermost grid does. **One sheet**, the size of the
grid's box, in the **new** theme's colours from the first frame — the layer carries that theme's class, and the light
tokens are on `.light` as well as `:root` in globals.css for exactly this. The sheet is **plain paint** — it carried
the new theme's empty field for a day, the dashed cells drawn on it so the lines would come down with the paint, and
he took that off: the grid is what the paint reveals, not what it carries. Its bottom edge is a **wave, sharp, and moving**: **two to five crests of different
widths and heights, drawn afresh at every toggle**, drifting sideways and breathing in height as the sheet falls, so
no two falls are alike; the top edge that trails the fall is the same wave turned over. *(It was one crest per two
cells in two layers for an hour; he wanted fewer and uneven.)* *(A soft gradient edge came first and went the same
day; the no-gradient rule of 2026-09-16 stands, with no exception left.)* **One beat.** The sheet falls from above the box until it
covers it, gathering speed the way a thing falls (`power2.in`); the theme is committed under the cover and **the sheet
dissolves** — it is the new page's own background, so its fade is the content coming through. *(It fell on off the
bottom for a second beat at first, and the wait read as broken; then it was removed on the spot, and he asked for the
dissolve.)* 0.9s of fall and 0.35s of dissolve, a 72px wave, two to five crests, a width of drift
in two beats, a breath in 0.8s (`FALL_MS`, `DISSOLVE_MS`, `WAVE_H`, `WAVE_CRESTS`, `WAVE_DRIFT`, `WAVE_BREATH`, and `FLIP_TEMPO` to
stretch it for watching — mine, tune by looking). GSAP drives it (packages/ui/CLAUDE.md rule 7);
the page turn's one proportion is untouched. Reduced motion switches at once with no sheet; a toggle during a fall is
ignored. The names — flip, flipper — keep the word he first used for the whole motion.

*What the tries taught, kept in the code.* A tween per tile had GSAP reading each tile's computed style as each tween
began — 216 forced layouts in a burst at the start of every beat, which he felt as lag (*"It feels very laggy"*); the
fix was one writer per frame off one clock, and the sheet needs none of it: one element, one transform, nothing lays
out or repaints. And the first build replayed forever from light: the theme switch nudged layout, the grid's resize
observer made a new metrics object for the same numbers, and the timeline keyed on it started over and committed
again. The grid now reports only a **change** of size, and the timeline is built once per toggle from a ref. *(D28
had been the grid-as-canvas scene for an hour on 2026-09-21; he removed it and the number was reused.)*

**D29 — The pager's row is a strip of slots, its width is decided per breakpoint, and the arrows are one molecule
placed in it.** *2026-09-23, on the bar in the portfolio and the admin: "I want that to be a molecule … 1. Each item
should be a slot. 2. Controllable slots (increase or decrease the slots). 3. The pager buttons can also be one
molecule."* Amends D27, which left the bar six fixed cells and said outright that what the four empty ones hold "is
not decided". This decides it: they hold whatever a slot holds.

*The bar is a slot.* The row the pager occupies is one reserved **slot** spanning the bar's cells on the bottom row,
and its `children` are a `GridLayout` on those cells — S2 and S5 exactly, no new shape in the model. Each cell of the
bar is a sub-slot, with a slot's own tokens (S3), and is authored per breakpoint like every other slot's children.
Inside the bar nothing is reserved: it is one page and it does not turn (S5).

*The width is decided, not constant.* `PAGER_CELLS = 6` becomes a number per breakpoint in `DEFAULT_GRID_CONFIG`,
beside `cell · gap` (D13) — the same kind of decision, made the same way, against §5's principles. Six is the default
at every breakpoint, so nothing moves until a number is changed. Two rules bound it. It is **even**, rounded down and
never below two, because D26's promise is that the field's centre is a grid line and an odd bar sits half a cell off
it. And a field narrower than the number still gets as many cells as it has, arrows last — D27's clamp, unchanged.
The bar's cells stay **reserved** in the model (`pagerCells`), so the packer never lands on the bottom row and the
composer still refuses a drop there; widening the bar takes those cells away from the page, which is the cost of
asking for them. The composer's **Cell** popover steps it per breakpoint beside the cell and the gutter, in twos —
for trying, not for deciding, exactly as D13 says of the other two. A decision is a number in `DEFAULT_GRID_CONFIG`
and a line in this rule. **The popover withdrawn 2026-09-23 (D30):** it went with the composer, so the number is
changed only there.

*The arrows are a molecule.* ↑ and ↓ together are one registry entry (S6), span 2 × 1, dropped into the bar like any
other component rather than hardwired to the last two cells. Two consequences. It cannot take `onTurn` as a prop any
more — a molecule in a slot is handed props by the inspector, not by the pager — so `GridPages` publishes the turn on
context beside `useGridMetrics`, and the molecule reads it there. And its fill relocates for free: the band is driven
by `--grid-turn-fill-front` / `--grid-turn-fill-back`, which are custom properties inherited from the grid, so the
arrow fills in proportion in whatever cell it is placed. The part that looked most fragile is the part that already
works anywhere.

*Where it may go: the bar, and the reason is the clip, not the wiring.* Nothing stops the molecule working elsewhere —
the fill's custom properties inherit from the grid root and the turn is on context, so any box on the field could
drive a turn. Two things about the turn stop it being useful there. A page box carries `data-turn` and is clipped by
the turn (`globals.css`), so an arrow in an ordinary slot would cut its own height away under the finger pressing it
and then leave with the page; the bar's cells carry no `data-turn`, which is why the pager never moves. And a box
belongs to one page, so arrows placed on page 2 are not there on page 3 — being drawn on every page is the whole
reason the bar is a fixture. So the molecule is offered in the bar only. A floating turner is not forbidden, and this
is what it would cost: a slot that opts out of `data-turn` and is drawn as a second fixture on every page, which is a
larger change than this rule makes. Recorded so the next person reads a price rather than a prohibition.

*The default is D27's bar.* Four empty `card` slots then the arrows, which is what both apps draw today, so a layout
that says nothing about its pager gets exactly what it had. A bar is still a fixture in the sense that matters — it is
drawn on every page by `GridPages` and `GridEditor`, never packed, never a box on a page. What changed is that its
cells now have somewhere for their contents to be written down.

*One bar per layout, not per page — decided 2026-09-23.* *"Let's leave it on the layout."* The bar lives on the
`GridLayout` as `bar`, beside `authored` and `shapes`, and is drawn on every page of it. A page cannot have its own:
the bar is the one thing on the field that does not turn, and contents that changed between pages would move the
arrows under the hand reaching for them. It travels with the layout everywhere — `withAuthored` and `withoutAuthored`
carry it through, and the export writes it out — so re-authoring a breakpoint's pages never drops it. *(Those
three went on 2026-09-23, D30. The bar is written in code with its layout, and `GridPager` draws D27's default,
`defaultPagerBar`, when there is none.)*

*The arrows may be left out, and nothing stops you — decided the same day.* *"The bar can. But for now let's put them
in the same last two slots they are in."* So the default is unchanged: every cell but the last two an empty `card`
slot, then the arrows. A bar that omits them is allowed and is not guarded — no composer refusal, no export warning —
and the cost is known and accepted: the wheel, a finger and ← → still turn the page, but a phone has nothing to press,
so a reader who does not try the scroll stays on page one. If that ever bites, the guard goes here.

**D30 — The composer is removed, and the grid only renders.** *2026-09-23: "And also let's remove the Composer
feature completely and all the dead code." And, on how far that reaches: "remove showcase /composes, admin's too and
also quests feature."* Withdraws D16, D17, D19, D20 and D24 whole, and in part D11 (the frame), §5 (the method), D18
(the tool) and D29 (the popover), keeping what each of them says about the model.

*What went.* Both composers, and everything only they used. In the showcase: `/composer` (D16) with the nav's link,
the Compose button on every page and its `?from=` (D17), the palette (D19), the inspector, the two-block export
(D20), the `PAGES` loader that handed it a page, the authored `layout` a page could carry beside its arrangement
(Portfolio.md P2), and the `palette` flag on a specimen. The showcase is three routes: `/`, `/atoms`, `/molecules`.
In the admin: the quest compose dashboard, and the quests feature with it (Admin.md §0.7). In the package:
`grid-editor.tsx` (`GridEditor`, `useHistory`) and `grid-frame.tsx` (`GridFrame`, D11's frame, with
`referenceShape`); the drag, resize and drop-into surface in `grid-pages.tsx`; `metrics.scale` and the frame's
context; the page operations and the export in `grid-layout.ts` — `withAuthored`, `withoutAuthored`, `addPage`,
`removePage`, `moveItemToPage`, `layoutCode`, `configCode`, `layoutFromSpans`; the stepper ranges the composer's
Cell popover read (the popover went with the composer), and the `config` prop on `Grid` and `GridPages` that let it
try other numbers — the grid reads `DEFAULT_GRID_CONFIG` and nothing else, as D13 decided; the rulers (D24), a tool's
affordance nothing turned on once the tool was gone; `onResolved` and the `ResolvedPages` report (source, shape,
mode) that fed the composer's badge — `resolvePages` returns the pages; and every registry entry but one (Slots.md
S7).
`GRID_REFERENCE_BOX` moved into `grid.tsx`, where a page that lays itself out before the grid has measured its box
assumes one.

*Why nothing else had to move.* No page depended on it. None carried an exported layout when it went — the portfolio
and the showcase are arranged by code on the live field (Portfolio.md P2, P8) — and no quest had been published
(Admin.md §0.6 was decided and never built).

*What stands.* The field and its numbers (D12–D15, D26). Slots (D21, Slots.md) and `SlotContent`. The model's
authored pages per breakpoint, with their shapes, derived mobile-first and kept where they fit (D18's model, D22,
D25): `resolvePages`, `derivePages`, `layout.shapes` and `LEGACY_SHAPES` stay, because a layout written in code still
resolves — the admin's home is one — and the pager's bar is a layout on its own cells (D29). The pager and the turn
(D27, D29): the arrows, ← → (and ↑ ↓ since D42), the wheel and a finger; the composer's ‹ › in D23 and D27 went with it. The theme's sheet
(D28). And no design mode, nothing edited in place: D16's refusal outlives the tool it was said about.

*What the grid is now.* `Grid` draws the field, and `GridPages` and `GridPager` render a `GridLayout` on it; nothing
in the package changes one. A page is a content file — items with a span per breakpoint and a `render` — arranged
on the field it is shown on, and the packer that does it is still §7's open question. A tool for arranging by hand, if one is wanted again,
is a new decision; this one's code is in the history before this rule.

**D31 — The grid opens by drawing itself, and the drawing is the loader.** *2026-09-24: "Let's carefully design a
introduction screen, which is basically can also be a loader like initial loader when someone comes to the page. So
this should be part of our design system."* Decided and built the same day, after four rounds of a motion study: *"Let's
use the following settings … Let's proceed with building."*

*The brief, and what became of it.* His first description: *"If the user is on a light theme, we should start with the
black screen and then the cells of the grid should flip to light theme color along with their dotted border … it
should start with middle row middle of the viewport. First, five dots will flip like one by one and then after the
fifth one all the cells should flip like a ripple."* Every part of it was tried, and he changed most of it along the
way, so the rule reads differently from the brief. The five went (*"I also want an option to remove the five"*, then
his settings without them). That also dissolved the one conflict the brief had with this document: a field with even
counts (D26) has no middle row and no middle cell, so a run of five could only lean one cell left and half a row up,
and a phone's four columns could not hold it across at all. The black screen went last: *"in light theme also let's
start with the light background only."*

*How it was found.* A motion study on the real field — the D13 numbers, even counts, the dashed cells, the theme
tokens — published as a claude.ai artifact, *Grid Intro Study*, with a scrubbable timeline and a control for every
number. Round 1 was five mechanisms for the flip, each with how it could fail: **Turn** (a card turning over),
**Lattice** (the cells alone, the gutters left black and then dissolved), **Roll** (hinged, falling open away from the
start), **Split-flap** and **Cut** (no rotation; a cell switches in one frame). He took Cut: *"I like how the loading
of the cut is."* Round 2 took his notes: the ripple runs top to bottom, and the lines change colour while it runs and
fade back after. Round 3 made the ripple the loader. Round 4 gave him the ripple's shape to control — a front from any
edge with an edge of its own (flat, cone, reverse cone, rocket, arch, zigzag, or drawn by hand), or rings from any of
nine points — and lime and violet to alternate. Each round's pick and notes are logged in the study. The settings he
sent back with *"proceed with building"* are this rule, verbatim.

*What it is.*

- **The screen starts empty, in the visitor's own theme.** Light on light; on dark, black (`--grid-intro-from`). Both
  were his picks. On light the cover is the page's own colour and only hides the lines; on dark it is the black the
  drawing lifts. It is painted with the grid's first render, the server's included, so nothing shows before the
  drawing.
- **The grid is drawn in by a front rising from the bottom, with a cone for its edge.** The centre columns lead and
  the sides trail by twelve steps, the point in the middle: a rocket going up. Each step is 15ms and every cell is a
  cut — no turn, no fade. *(30ms in his settings; halved the next day, for the intro and D32 alike: "Increase the
  speed of the ripple.")* A cell's time is its row counted up from the bottom, plus twelve steps times its distance
  from the centre as a share of the half-width; counts are even (D26), so the two centre columns tie and the point is
  symmetric. A pass is about 0.33 s on a 1440 × 900 desktop (18 × 12) and 0.22 s on a phone (4 × 8). *(Amended by
  D44, 2026-09-27: the cone is now the frame, and the edge the tip of the circle fitted in it; a pass is 0.23 s on
  that desktop.)*
- **Each line is lit as it is drawn, and glows.** A cell's dashed border lights the moment its tile goes and fades
  straight back to its usual colour over 500ms, with no hold, so the front leaves a trail that dies behind it. The glow
  is 16px on light and 12px on dark.
- **The drawing is the loader.** *"Let's make the ripple itself a loop in the waiting. If the waiting is not required,
  the ripple will happen once and everything will load. If there is waiting required, then the ripple keeps
  happening."* When the page is ready, one pass. When it is not, the drawing goes again at once, with no gap, for as
  long as the page is loading: a pass begins only if the page is still not ready when it would begin, and the pass
  running when it becomes ready finishes. A repeat pass is **lines only** — the field stays drawn and the lit front
  rises through it again — and **lime and violet turn about, pass by pass**: the first is lime, a second violet, a
  third lime. *(Round 2 had the five hold, then loop, while the page loaded; he took it out: "let's remove the waiting
  what we have now".)*
  *(Replaced by D48, 2026-09-27: the grid no longer draws itself in, and the loader waits instead.)*
- **Page 1 turns in with the fade.** As the last pass ends, page 1's boxes and the pager are revealed from their
  bottom edge upward — the page turn's own "in" (D27), with its bleed — while the last lines fade. Until then nothing
  turns a page: the wheel, a finger and ← → wait for the intro. *(Amended by D48, 2026-09-27: page 1 opens out of the
  loader's rings; only the pager still comes up from its bottom edge.)*

*Whose numbers.* The bottom, the cone, its twelve steps and its centred point, the step (30ms, then 15ms), the cut, lines only, no
gap between passes, lime and violet each pass, the 12px and 16px glow, the 500ms fade with no hold, page 1 with the
fade, and both starting colours are his, from the settings he sent. Page 1's 420ms reveal is mine, and so are the five
answers under *Settled when it was built*, which were still open when he said build. Each is one constant in
grid.tsx.

*The glow is a blur, and it is kept.* The design system has had no glass since 2026-09-16 — no backdrop blur, no
frost, no rim light — and a glow is a blur. He was told so in round 2 and kept it through every round after. It is
recorded here as the one exception: on a line, for the length of the intro, never on a surface.

*Tried and not kept.* Turn, Lattice, Roll and Split-flap (round 1); a circle, square or diamond ripple spreading from
the five (round 2); black-and-white lines fading back all together, with a white glow on dark only (round 2); the five
holding, then looping, while the page loaded (round 3); the five themselves (round 3); a black screen for a light
visitor (round 4); a flat front from the top, one row at a time (his round-4 settings, until the cone from the
bottom); a band that took three rows back under the cover on each loop (until lines only). A dark visitor starting on
white, the literal mirror of the brief, was the study's first default; black replaced it in round 2, and he kept
black.

*Settled when it was built.* These were open when he said build. The answers are mine, each is one constant or one
line, and each is his to change.

1. **Black stays black.** His last settings kept a dark visitor starting on black (`oklch(0 0 0)`) rather than on
   the dark background, so the intro keeps a cover on both themes. Before the field is measured the cover is one
   sheet. Once the field is measured, it is one tile per cell: the cell and half the gutter round it, with the outer
   tiles running to the box's edge.
2. **The longest wait is 3 s** (`INTRO_MAX_WAIT_MS`). Then the pass running finishes and page 1 comes in anyway, so
   a slow network never leaves anyone on a loader.
3. **Ready is the fonts, the window's load, and every image already on the field.** A Radix `Avatar` loads its
   image off the page and draws no `<img>` until it has it, so the portfolio's avatar is not waited for; preloading it
   would put it under the window's load.
4. **Once per document load.** A reload plays it; a navigation that mounts another grid does not. Under reduced
   motion there is no intro at all: the field and page 1 are there at once.
5. **The portfolio has it; the other apps do not.** A grid asks for it with `intro`, on `Grid` or `GridPages`.

*Smooth, the same day.* *"We have to focus on optimising the intro. It feels like it's lagging. It's not smooth."*
The first build ran it as a frame loop: every frame, a script set the opacity of every line that was lit or fading,
and the glow was one drop-shadow on each whole layer of lines. So every frame repainted both layers and blurred them
again, field-sized and at the screen's density. A trace of the intro on a 1440 × 900 screen at 2× found **two seconds
of raster work inside a 1.2-second intro**, landing in the page's own load, when the main thread is busiest. Two
changes, measured the same way after each:

- **Every cell is a CSS animation, scheduled once.** A tile's lift and a line's fade are opacity animations with the
  cell's delay, set when the cover and the lines mount — the frame the intro starts — and for each later pass by a
  timer. The compositor runs opacity on its own thread, so nothing repaints per frame and a busy main thread cannot
  stall the drawing. The script is left with one timer per pass: at a pass's end, the page is either ready (page 1
  turns in, itself a CSS animation) or the next pass is scheduled, starting part-way if the timer fired late. Raster
  work fell from 2,000ms to 50ms.
- **The glow moved from the layer to each cell.** A filter on the whole layer made the compositor blur the field
  again every frame over the fading cells — its thread saturated and 17 frames dropped. On each cell's dashed box,
  inside the box that fades, the glow is painted once into that cell's layer, and a frame changes only an opacity. The
  look is the same filter on the same dashes. *(D32 changed it again the next day, to a box-shadow, and handed each
  cell its animation just before its turn, so the ripple between pages would not drop frames.)*

After both: no frame dropped once the drawing is under way (the one left is the page's first frame, before anything
moves, where the page mounts), in development and in the production build alike. The cost moved to memory: each cell
is its own compositor layer while it animates.

*Where it lives.* `grid.tsx`: `useGridIntro` (the timer per pass), `GridIntroCover`, the lit lines shared with D32
(`GridRippleLines`, played by `useGridLines`), `ripplePlan` (each cell's time), `pageReady`, and the numbers as
`INTRO_*`. `globals.css`: `--grid-intro-from`, `--grid-intro-glow`,
the lines' colours, the keyframes that lift a tile and fade a line, and the clip that holds page 1 back while
`data-intro` is on the grid (`drawing`, then `arriving`). `grid-pages.tsx` passes `intro` through and does not turn a
page while `data-intro` is set. The review sweep waits for the intro to hand over before it takes a screenshot
(`e2e/review.spec.ts`). There is no frame loop at all — the compositor runs the drawing, D28's lesson taken one step
further. The lines are the overlay's own cells and dashes drawn again in lime and violet, so a line fading back is
only a change of colour, never a second dash pattern. *(Replaced 2026-09-25 by D38: 216 animations at once cost the load
as much as the frame loop had, and later passes handed out from the main thread went missing when it was busy. The
drawing is painted now, by one painter in a worker, and the cover is the grid's own colour while the intro runs.)*

**D32 — The ripple plays between pages.** *2026-09-25: "Now, lets add this ripple between pages too."* Built the same
day.
*(Replaced by D48, 2026-09-27: a turn now fades the page away and loads the next with the loader.)*

*What it is.* When the page on the field changes, one pass of the intro's drawing (D31) runs through the field, lines
only: the field stays drawn and the lit front rises through it. **Forward, it rises from the bottom**, the way the next
page's boxes arrive from their bottom edge (D27); **back, it comes down from the top**, the cone pointing down. It has
the intro's numbers: the cone twelve steps deep with its point in the middle, 15ms a step, a cut per cell, each line
fading over 500ms, the glow. **Lime and violet keep turning about**, counted on from the intro. It starts at the change,
as the new page comes in, and not while the hand is scrolling, because a scroll let go short of the turn settles back
and turns nothing. It is `ripple` on `GridPages` (on `Grid`, with `page`); the portfolio had it until it became one page
(Portfolio.md P15, 2026-09-27). Under reduced motion
there is none.

*Mine, his to change.* Starting at the change rather than with the hand; the direction following the turn; the colour
counting on from the intro rather than one colour per direction. The lines sit under the boxes as they do in the intro,
so on a page the cards fill — the portfolio's page 2 — the ripple shows in the empty cells, the gutters and the margin.
Drawing it over the boxes would be a different rule.

*What it cost, and what was done about it.* On the production build at 1440 × 900 at 2×, a page turn dropped no frames
before the ripple and two with it. Three changes, each measured:

- **The turn's values moved from the grid to its tracks.** The turn writes its progress as custom properties every
  frame, and custom properties inherit: written on the grid, they restyled every element in it, and the ripple's line
  layers — mounted for as long as `ripple` is on — tripled that work (31ms → 103ms of style per turn). The only readers,
  the page's boxes and the pager's arrows, are in the tracks, so the values are written there. The overlay's cells
  stopped being restyled on every frame of every turn with it.
- **The glow became a box-shadow.** A pass restarts every cell's fade, a cell's layer is rebuilt for it, and each pass
  rasterised 216 drop-shadow filters at once. A box-shadow's blur is cached and reused across identical cells. It glows
  the cell's outline rather than each dash, which at a 12–16px blur reads the same; its strength was matched to the
  filter by eye. If the difference shows, the filter is one CSS rule away, at the cost of a dropped frame a turn.
- **Each cell is handed its animation just before its turn** (`LINES_LOOKAHEAD_MS`, 64ms): a few cells a frame across
  the pass, instead of all of them at its start, which made every cell a new layer in one frame — the frame that
  dropped. A cell handed out late gets a negative delay, so the front stays where the clock says. **Except the intro's
  first pass**, which is handed out all at once, as it was: its tiles lift on the compositor, and lines handed out
  from the main thread in the page's load — its busiest second — would start part-faded behind them. The frame that
  costs is the mounting one, under the cover, before anything moves.

After all three, no frame dropped at the page change in any run. *(All three went with D38, 2026-09-25: the ripple is
painted by the field's painter, in a worker, and a busy main thread no longer stalls it.)* *(The intro dropped none either while its first pass
was handed out ahead too; handed out at once again, it can drop the mounting frame, which nobody sees.)*

*The arrows fill in the ripple's colour — the same day, his pick.* *"Match the ripple color with the ripple in the Nav
bar up and down arrow."* Three readings were put to him — the ripple in the arrows' colour, the arrows in the
ripple's, or everything in the arrows' — and he picked the arrows in the ripple's. So where the grid ripples, the
arrow a turn fills (D27) is the colour of the ripple that turn will play, lime or violet, instead of the reverse
colours, with a dark glyph that reads on both (`--grid-ripple-ink`, about 16:1 on lime and 5:1 on violet). The grid
marks the next pass's colour on itself (`data-ripple-next`); the turn reads it as it starts and holds it until it ends
(`--grid-turn-fill-color`, on the tracks). Holding matters: the pass is played as the page changes, and the colour
after it is the other one, so a fill that read it live would change colour while it leaves. A grid without the ripple
keeps D27's reverse-colour fill, as the showcase does.

**Amended 2026-09-25, the same evening: the ripple first, then the page.** *"The ripple is now coming after the
components on the page are loading. I think it would be great if the ripple ends and then the components come up on
the grid."* The pass had played as the next page arrived, so the page rose in while the ripple ran under it. Now a turn
holds between its out and its in: once the last page's boxes are gone, **the ripple runs through the empty field, and
the next page is put on the field only when the pass has crossed it** (`rippleSpan`, about 345ms on an 18 × 12
desktop and 220ms on a phone, plus the frame the pass starts on); then it rises in, as the lines fade. The hold is
the out-phase's, so nothing turns and the wheel stays muted through it, and the arrow stays full in the pass's colour
until the page comes. *(Amended the same night by D35: the hold is a phase of its own, `hold`, the hand's travel
through it turns on to the next page with another pass, and the page comes only when the pass has crossed and the hand
has stopped. Amended again by D37: there is no out-phase, the ripple starts as the turn commits and washes the last
page away as it crosses, and the hold is that wash.)* Because the page mounts after the hold, what its cards do on arriving (the portfolio's bars) is
still seen. A turn is now about 660ms on a desktop, where it was 320; a grid without the ripple, and reduced motion,
do not hold. *(Since D37 a grid without the ripple holds too, for the wash; reduced motion still does not.)*

**D33 — A field is never fewer than six columns; below that the cell gives way. And the cone keeps its angle.**
*2026-09-25, looking at the deployment on his phone: "only having four cells on the mobile feels pretty off … minimum
number of columns in any screen should be six."* D12 decided the cell and derived the counts; on every phone that
gave four 72px columns. Now the count has a floor, `MIN_COLS` (6, `grid.tsx`): where the decided cell would give
fewer, the count is held at six and **the cell derives from the width** — as big as six cells and seven gutters allow,
floored, so the field still sits a whole gutter from each edge (D15) — and the rows are counted with that cell. The
gutter does not change (D13: one texture). On a 390 phone the cell is 51px and the field 6 × 12; 46px on a 360, 48 on
a 375, 54 on a 412, 57 on a 430. A tablet and every pointer field already had six or more, so nothing changed there.
Below `MIN_CELL` (24px) the cell stops giving way. **This relaxes D13's "a 1×1 is the touch target" on phones:** 51px
is still over the 44 a finger needs, and his call outranks the principle.

*The same day, of the ripple on his phone:* *"instead of just rippling with the four columns … the ripple completes
the middle two columns and then there is a ripple on the left and right columns."* D31's cone trailed its sides by
twelve steps at any width — a wide V on an 18-column desktop, a spike on a four-column phone, whose middle had drawn
all eight rows before its sides began. So `INTRO_DEPTH` is now how far the sides trail **on the field it was tuned
on** (`INTRO_CONE_COLS`, a 1440 desktop's eighteen), and a narrower field keeps that angle with a shallower cone: three
and a half steps on a phone's six columns, never deeper than twelve. Both the intro and the ripple draw from the same
plan, so both changed; a desktop is exactly as it was.

**D34 — The pointer is a lime ring, and the cell under it is lit.** *2026-09-25: "let's make the cursor transparent
line bordered circle and it should fill when clicked. Every cell on the grid should turn its border to line. Whenever
the cursor is on it."* Asked whether "line" meant the colour or a solid line, his pick was both — a solid lime line —
and **amended the same day to the dashes: "instead of full border, I think we should still have it dashed border for
cells when cursor is over them. Like what we have as default for cells."** So "line" was lime. `cursor` on `Grid` or `GridPages`; the portfolio has it. The ring is 24px across (mine),
a 2px lime line on nothing, filled lime while a button is held, and it is the pointer: the system's cursor is hidden
over the whole field, a link's hand included (globals.css). The cell the pointer is on draws its own dashes in lime,
exactly over the overlay's — the same box and border, as the ripple's lines are drawn — at once; a cell it leaves fades back over the intro's 500ms (`INTRO_FADE_MS`),
as a drawn line does in D31, so a moving pointer leaves a short trail. The cell is found from the field's numbers,
not by hit-testing: the gutter lights nothing, and a cell under a card is lit where the card hides it. No glow — the
intro's is the one blur kept. *(D41 made the cells round a moving pointer glow on 2026-09-26 and was withdrawn the
same day: this stands as written.)* A mouse or a pen only (`(hover: hover) and (pointer: fine)`); a phone keeps its own.
Nothing goes through React state: a move writes one transform, and at most two attributes when it crosses a cell. *(Since D38 the lit cell is painted by the field's painter: a move sends one message when it crosses
a cell, and the cells are no longer elements.)*
**Known cost:** lime on the light theme's white is about 1.3 : 1, so the ring and the lit dashes are faint there — said
before the pick, and taken.

*Amended the same night — the ring is the system's cursor, drawn from an image.* *"When the cursor is over the avatar,
it jitters."* The ring had been a div the page moved on every pointer move, and each move cost the main thread a
whole-page layerize — 60ms of it per 60 moves on an M-series Mac, several times that on a Windows laptop — and the ring
trailed the hand by at least a frame, more whenever the page was busy. Over the avatar, whose own dashed ring is right
under it, that is the likeliest jitter; nothing on the face itself changed from frame to frame in any headless run (the
screencast was compared frame by frame, at 1×, 1.25×, 1.5× and 2×, on a whole and a half-pixel field). So the ring is now
`cursor: url(…)` in globals.css — the same 24px ring, the same 2px lime line, the same fill while pressed (`:active`) —
drawn by the system where the hand is, costing the page nothing: 2ms of layerize per 60 moves. The colour is `--lime`
baked in as sRGB, 206 238 56, since an image cannot read a custom property; a 2x image comes through `image-set`. The
press fills at once rather than over 100ms. The lit cell still follows the pointer from the page, and writes only when
it crosses a cell. Found with it: the ripple's line cells kept their finished fades in effect (`animation-fill-mode:
forwards`) — 432 animations after one turn — which made any change on the page 40% dearer to layerize; the fades end
where the cells rest, at 0, so they no longer fill. **If the face still jitters, it is not the ring, and the next thing
to look at is its hover scale** (`hover:scale-105` in `profile-card.tsx`), which grows the face as the ring's centre
crosses its edge.

**A page may still the lit cell (2026-09-28).** While the grid carries `data-cursor-still`, the pointer lights no
cell. The ring is still the pointer. The portfolio sets it while a card is in focus (Portfolio.md P18), and the motion
studio does the same on its focus stage. The reason is the blur round a focused card (Motion.md M13): it lies over the
field, so a lit cell under it showed as a violet smear, and every frame of the cell's 500ms fade redrew all eleven of
the blur's layers. That was his "a lot of flickering during the hover".

**D35 — A hand that goes on scrolling goes on turning, and the page comes when it stops.** *2026-09-25, on a Windows
laptop: "scroll is not smooth enough … it feels like I have to wait … only after the ripple is gone and only after the
cards are rendered, only then I'm able to go to the next page … if I'm continuously slow scrolling, we can just continue
the ripple without loading or rendering the cards."* Amends D27 and D32.

*What was wrong, measured* (`e2e/.mcp/scroll-perf.mjs`, a production build, scripted wheel input). A mouse rolled
steadily — a notch every 180ms, 22 notches, seven pages of travel — turned **no page**: a notch is a third of a page, the
turn let go after 100ms of quiet, and the boxes fell back between every two notches. A fast spin, or a trackpad moved
slowly and steadily, turned **one page and then nothing**: D27's mute held while the wheel kept coming, so a hand that
did not stop could never turn a second page. And a notch was drawn in one frame, a jump of a third of a page. No frame
ran long and there was no long task, at full speed or at a quarter of it — the turn was slow because it ignored the hand,
not because the page was heavy.

*The rule now.* **Only a fling's tail is ignored; the hand never is.** Each wheel event is read against the stream
(`readWheel`, grid-pages.tsx): a tail is a run of five falls in the size of the events, because a fling's momentum only
ever shrinks; anything else — a push after a pause, the other way, an event that rises, a steady roll of notches — is the
hand. After a turn the tail is dropped until the hand pushes again, which is D27's fix for the wobble kept, without
muting the hand. **Through the hold the hand keeps turning:** its travel while the field is empty counts towards the next
page, and a page of it turns on — the ripple plays again, the arrow stays full in the new pass's colour, and nothing is
put on the field. Passes follow each other no closer than half a crossing, however fast the wheel spins, and never run
past the first page or the last. **The page comes when the pass has crossed and the hand has stopped** — quiet for 100ms
on a trackpad, 260ms after a notch, whose next notch can be that far off. What the hand had not finished a page with is
dropped; there is nothing on the field to settle back. The stroke that turned the page counts for at most half a page
more at the hold, so one flick is one page, as before. A notch's jump is followed over 40ms, not drawn in a frame; a
finger is not smoothed. A turn renders no card any more: the phase is an attribute on the tracks, not a prop on each box.

*After, the same probe.* The steady mouse roll and the spin both run through every page and land on the last; one notch
settles back; three quick ones turn one page; a slow steady trackpad runs through the pages and one that stops lands a
tenth of a second after the hand; a Mac flick, and a hard one with two seconds of momentum and coalesced frames, turn
exactly one page and nothing after it. The classifier was tuned first on randomised streams — jittery hands at 1–30px,
flings decaying at 0.94–0.985 a frame at 60 and 120Hz with coalesced and skipped frames, notches, a swipe interrupting a
fling — until a hand lost none of its travel and no fling read as the hand again after it was known.

*Mine, his to change.* The numbers: five falls for a tail, 120ms for a new gesture, 260ms for a notch's quiet, 40ms of
follow, half a crossing between passes, half a page of follow-through. **Still his:** whether one notch should be a
page. D27's third of the field makes it a third, and a steady roll turns a page every three notches.

**D36 — A bar may number its pages: an arrow at each end, the page numbers between.** *2026-09-25: "In the portfolio,
let's put the arrow buttons at the first and last items of the navbar. And in between, let's fill that with page
numbers."* Amends D29. The portfolio's bar was this one (Portfolio.md P14) until the portfolio became one page on a
`Grid`, with no bar (P15, 2026-09-27); nothing draws a numbered bar now. D27's default is unchanged, so the showcase
and the admin draw what they drew.

*The parts.* D29's pair is split, not replaced: `pager-arrow` is one arrow on one cell, `dir` `up` (forward) or `down`
(back), and `pager-page` is one page number on one cell. Both are registry entries, read the turn from context like
the pair, and belong in the bar for the pair's reason — an ordinary slot is washed away by the turn (D37). `numberedPagerBar`
(`grid-pager.tsx`) writes the bar from its width: back on the first cell, forward on the last, a number on every cell
between; two cells wide, it is the two arrows. **Back is on the left** so the numbers read up from it, and each arrow
keeps its glyph from the pair (D27, 2026-09-23): the first cell wears ↑ and the last ↓.

*More pages than cells.* A six-cell bar has four numbers, and the portfolio has five pages on a desktop and eight on a
phone. The numbers are a run of consecutive pages holding the current one second, one back and the rest ahead, slid
against the first page and the last (`pagerWindow`), so the marked cell stays put while the labels move under it.
With fewer pages than cells the spare cells are D27's empty `card` cells. *Mine, his to change:* the window, and
widening the bar instead, which is a number in the config (D29). **The window withdrawn 2026-09-27 (D46):** the
middle two cells are the page on the field with its title, and the cells beside them number the page before it and the
page after it.

*Which page is marked.* The one the field is turning to (`coming`), not the one on it: through the wash (D37) a hand still
scrolling turns on a page a pass (D35), and the mark runs ahead with it. It is filled in the reverse colours, the
Button's `default`, and carries `aria-current="page"`. A press turns straight to its page: one turn and one ripple,
however far it is. `GridPages` hands the bar `go` beside `turn` for it, and like the arrows it waits for the intro
(D31).

**D37 — The turn does not shrink the boxes: the ripple washes the page away, and the next page fades in.**
*2026-09-25: "when we are scrolling, right now the cards will shrink and then there's a ripple and then once the ripple
ends, the cards open up. There's a lot of spacing and waiting time in between that … let's not shrink the cards … let
the ripple wash away the cards and then let the new page … render" — and "not just in portfolio, I want this as part of
the design system."* Amends D27, D32 and D35.
*(The wash is replaced by D48, 2026-09-27: the page fades away and the next is loaded. Still nothing is squeezed.)*

*What it replaces.* Since D27 the hand's scroll clipped every box from its bottom edge and the next page was revealed
from its bottom edge, and since D32's amendment the ripple's hold sat between the two: a shrink (160ms, after however
long the hand took), a wait on an empty field (about 360ms on a desktop), and a grow (160ms). Three beats, the middle
one empty.

*The rule now.*

- **The boxes do not follow the hand.** The scroll fills the pager's arrow and nothing else; let go short of half way
  and the fill settles back. D35's reading of the hand is unchanged: a page of travel, or a let-go past half, commits.
- **A committed turn starts the ripple at once, and the ripple washes the page away.** Every box is cut away cell by
  cell as the pass's front reaches each of its cells, at the pass's own times and from the same plan the lines are
  drawn from, so where the front crosses a card the card is gone and the line lit under it shows. Forward from the
  bottom, back from the top, the cone (D31, D33) included. What the front has not reached is untouched: nothing is
  squeezed, scaled or moved, so D27's rule against distorting the content holds for the wash too.
- **The next page comes when the pass has crossed** — and, D35, the hand has stopped — **and fades in** over 160ms
  (`TURN_MS`), opacity only, as the arrow's fill leaves the way it came. A hand still scrolling turns on through the
  emptied field, a pass a page, as before.
- **Every `GridPages` turns this way**, with the ripple's lines or without them: `ripple` draws the lines, and the wash
  is the turn. The showcase and the admin, which have no ripple, wash too — their boxes are cut by the same front,
  with nothing lit under it.

*How.* One `clip-path` animation a box (`washAway`, grid.tsx): a staircase polygon that steps each time the front
crosses one of the box's cells — a cut, like every cell of the intro — so nothing is written per frame. A cut lies in
the middle of the gutter inside the box, where the intro's tiles meet; the sides the front has not touched keep D27's
8px bleed, so a card's shadow stays until the front takes it. The wash starts in the frame the lines' pass starts, on
the timeline's time, so the two keep step. The phases are `idle · drive · relax · wash · in` — `out` and `hold` are
gone, `wash` is both — still `data-turn` on the tracks, and the fade is a CSS animation off `data-turn="in"`. The fill's
two values moved from the tracks to the pager's bar: the boxes no longer read them, and a value written every frame
restyles everything under the element it is written on.

*Measured* (`e2e/.mcp/wash-frames.mjs`, `scroll-perf.mjs`, the dev server, 1440 × 900). The next page is on the field
about 350ms after the turn commits, where it was about 520, and the turn is over about 530ms after it commits, where
it was about 680. Every D35 scenario lands as it did: a slow roll and a spin run to the last page, one notch settles
back, a flick turns one page, a trackpad that stops lands a tenth of a second after it.

*Mine, his to change.* The fade — "render" could as well be a cut, the whole page at once, which is one CSS rule; the
cut in the middle of the gutter; the showcase washing without lines rather than being given the ripple; and the page
waiting for the whole pass rather than for the last box to be cut. The pass's last cells, the top corners going
forward, are often empty, so that is up to another 150ms on a desktop; D32's amendment asked for the ripple to end
first, and it does. **Unchanged:** the intro still reveals page 1 from its bottom edge (D31) — that is the intro's own,
not a turn's.

**D38 — The field is painted, not built from cells: one painter, in a worker.** *2026-09-25, of the intro: "the
ripples are not still efficient … The moment the page loads, the ripple is not smooth. Like it feels like there is a
lag. Like it starts, but then it disappears in the middle and then shows up in the end … I would also look at the logic
behind the ripple."* Amends D31, D32 and D34; the look of each is unchanged.

*What was wrong, measured* (`e2e/.mcp/intro-lag.mjs`, `intro-cost.mjs`, `intro-block.mjs`: cold loads of the production
build, Chromium and WebKit — Safari's engine, the browser on his Mac). The field was about 1,300 elements: a div per
cell for the overlay, two per cell for each of the two line colours, one per cell for the cursor, and a tile per cell
for the cover. A pass was 216 CSS animations started at once — 216 new compositor layers in one frame, in the page's
busiest second — and every pass after the intro's first, and every ripple between pages, was handed out cell by cell
from a frame loop on the main thread (D32's lookahead). So:

- **The lines cost the load itself.** In WebKit, with the lines on the page the intro lost 200–400ms of the main
  thread's frames; with them hidden, about 100. Half of that was the elements just being there, half their animations.
- **A busy main thread made the front go missing.** A cell handed out late either never showed or came in part-faded:
  the front stopped in the middle and came back at the end — his report, reproduced by blocking the main thread for
  250ms mid-pass.
- **WebKit ran the cover's lift on the main thread.** Blocked mid-intro, the black tiles froze over the field for the
  whole block and then jumped.

*The rule now.* **What the grid draws on its field is painted, by one painter, on its own clock** (`lib/grid-field.ts`):
the overlay's dashes and the intro's reveal on one canvas the size of the box, the lit lines and the pointer's cell on
another over the field, both under the page's boxes. Where the browser can hand a canvas to a worker — Chrome, Firefox,
Safari 16.4 and later — the painter runs in one, so **nothing the page does on its main thread can stall it**; elsewhere
it runs on the main thread with the same code. A pass is one message: the plan's per-cell delays (`ripplePlan`, the same
plan the wash cuts by, D37) and the moment it starts; the painter keeps time itself. The cover is no longer elements
either: **while the intro runs the grid wears the cover's colour** (`[data-intro]`, globals.css, from the server's first
paint), and the painter paints each tile back in the page's own colour as the front reaches it, its dashes with it, and
lets a line's glow show only on tiles already revealed, as the cover over them did.

*After, the same probes.* The page has about 150 elements where it had about 1,450. In the intro, WebKit loses about 115ms
of frames (it lost 200–400) and Chromium at a quarter of its speed about 75 (it lost 170–290); what is left is the page's
own hydration. **Blocked for 250ms mid-pass, both engines go on drawing the front**, the intro's and a page turn's
alike, with the cover lifting in step. A lit cell painted beside the old CSS one matches it: the same dashes, the same
four glows. Every D35 scroll scenario lands as it did.

*What it does not cover.* The wash (D37) is a clip animation on each box, and Chromium runs those on the main thread: a
block mid-turn holds the cut where it is until the block ends. The main thread is idle through a turn — the next page
mounts after the pass — so it has not been seen; if it is, the boxes' cut is the next thing to move to the painter.

*Mine, his to change.* The dashes are drawn as the engines draw a 1px dashed border — 3px dashes, each side a run that
starts and ends on a dash with its gaps evened out; WebKit's looked exactly so, Chromium's gaps were a little uneven. The
first pass starts 48ms ahead of the frame that asks for it (`INTRO_LEAD_MS`), room for the worker to start, under the
cover.

*Amended 2026-09-27: the reveal's tiles are cleared when it ends.* The painter paints each tile back in the page's
`--background` as the front reaches it, and when the reveal was over it painted nothing again, since the tiles looked
the same as the page. They are opaque: the portfolio drew its tagline behind the grid (Portfolio.md P4) and the tiles
hid it. The reveal's end now paints the field again, rings on a clear canvas.

**D39 — The corner is one cell's circle: the system has one radius, half the cell.** *2026-09-26: "Now the goal is
to change the design system from zero border radius to hundred percent border radius I mean like circular design."*
Asked how round a box bigger than one cell should be, he picked half a cell over a pill for every box and over
rounding the controls alone. Replaces `--radius: 0`, the rebuild's value since 2026-09-16.

*The rule.* **One radius on every box, half the grid's cell** (`--radius`, globals.css; `rounded-lg` in a component,
which is `var(--radius)`). A browser shrinks a box's corners to fit its shorter side, so the one number does the rest:

- **a circle** where a box is a cell or less on both sides: a 1×1 slot, the pager's cells, an icon button, a checkbox,
  a radio, the slider's thumb, an avatar, a chart's swatch;
- **a pill** where it is a cell or less on one side: a button, a badge, a key, a tab, a switch, a menu's item, a
  one-line alert, a slot one cell tall;
- **a quarter of one cell's circle at each corner** of anything bigger: a card, a dialog, a menu, a popover, a slot of
  two by two or more. It is the curve of the field's cells (D40) and of every 1×1, so there is one curve on the page.

*Why not the others.* A pill for every box turns a tall one's top and bottom into half-circles, and a menu, a dialog or
a card loses its first and last lines to them — a slot fills its span and clips (Slots.md), so there is nowhere for
the content to move. Round controls alone put pills in square boxes: two shapes.

*The number.* The cell is the grid's, so `Grid` writes its measured cell on its root (`--grid-cell`) and globals.css
declares the radius there again — a custom property's `var()` is resolved where it is declared — so on the grid it is
exact: 30px on a 60 cell, 36 on a 72, 25.5 on a 390 phone's 51 (D33). Off the grid — a dialog or a menu in a portal,
an app with no grid — the stylesheet reckons the cell the viewport would get from D13's and D33's numbers. Change
those, change it too.

*Where it does not apply.*

- **Lines are not boxes.** The underline fields — Input, Textarea, the Select and NativeSelect triggers, InputGroup,
  InputOTP's slots, the Combobox's chips field — keep a straight rule: a bottom border on a rounded box bends into a
  bowl. So do separators, table rows and a tab's underline.
- **A `transparent` slot is not rounded.** It has no edge to see, and a round clip would only cut what it holds at the
  corners. What it holds rounds itself.
- **A turned square stays square**: the tooltip's and the navigation menu's arrow tips.
- **Joined things round their outer ends only**: a ButtonGroup, a ToggleGroup with no spacing, a calendar's range —
  its middle days stay square so the run reads as one. Sheets and drawers round the edge that is not on the screen's.
- **The alert's accent is its start border, 2px**, where radix-sera drew a straight bar over a square edge; on a pill
  the bar ran off the curve, and the border follows it.

*Mine, his to change.* `rounded-lg` as the one utility; the transparent slot left square; the underline fields left
straight; the alert's border; checkboxes as circles (a tick in a circle, beside a radio's dot).

*An exception, his, 2026-09-27: a fill inside a box that meets a straight line.* The portfolio's work tabs fill the
active and the hovered mark's room between the dividers, and at the full radius the fill's ends curved away from the
dividers ("they don't align with the dividers"). So those fills take **4px** — a step of the spacing scale — on every
corner that is on a divider, and the box's own radius only on the corners on its border (Portfolio.md P4). Boxes keep
the one radius.

*A second exception, his, 2026-09-28: a picture inset in a box.* The portfolio's project cards hold their image a
step inside the border, and at the full radius the image's corners and the card's did not run together ("the border
radius of the image and the border radius of the card is not aligning … reduce the border radius a little for the
image"). So an inset picture takes the box's radius **less its inset** — `calc(var(--radius) - 8px)` for an 8px inset,
22px on a pointer's cell. It was the radius less the inset and the border's pixel, the curves exactly concentric, and he
asked for a pixel more the same day ("increase by 1 px"). It is derived from the one radius, never a number of its own
(Portfolio.md P4).

**D40 — A cell is a circle.** *2026-09-26, the same conversation: asked whether the field's painted cells should
become circles too, he picked "Cells become circles".* Amends D31, D34, D37 and D38; D9's cell stays square — the
circle is drawn in it.

*The rule.*

- **Every cell's dashes are a ring**: the circle through the middle of the cell's outermost pixel ring, where its 1px
  border ran, in 3px dashes evened out round it — D38's rule for a side, taken round the circle — with a dash centred
  at the top. The overlay, the lines the intro and the ripple light, and the pointer's cell (D34) all draw it, and a
  lit ring's glow is cast by its circle, so it glows round.
- **The pointer lights a cell only inside its circle.** The corners of its square light nothing, as the gutter does not.
- **The front cuts a circle, then the tile: the lace.** What the front reaches first is the cell's disc — half a pitch
  across, so neighbouring discs touch in the middle of the gutter — and `LACE_MS` later (90ms, six steps) the rest of
  its tile. In the intro the cover lifts so; in a turn the wash (D37) punches a round hole in a box wherever the front
  reaches one of its cells, and clears the webbing between the holes a moment later. The front leaves a band of round
  holes behind it and then nothing. Circles cannot tile a box: with no second cut the webbing would stay, and with it
  at once a hole would show for one frame and not be seen.
- **The turn holds for the whole wash** — the ripple's crossing and the lace after its last cell (`washSpan`) — so the
  next page comes 90ms later than it did.

*How.* The painter strokes arcs with a dash pattern where it filled 1px rects, casts the sprites' shadows off a disc,
and keeps a state per cell for the reveal — covered, disc, tile — painting a tile over its disc and its ring again on
top. The wash's clip is a `path()`, even-odd: D37's staircase of tiles gone, with a circle taken out of it for each
cell whose disc is cut and whose tile is not.

*Looked at* (`e2e/.mcp/wash-frames.mjs`, `intro-dark.mjs`, `ring-cursor.mjs`, the dev server, 1440 × 900). Mid-turn,
the profile card has round holes where the front has reached it and fragments of its name in the webbing between
them, and whole tiles gone a row behind. On dark, the intro lifts the black a disc at a time with its lime ring, and
the tiles follow. With the pointer on a cell's centre, the ring lights lime; with it in the square's corner, none does.

*Mine, his to change.* `LACE_MS`; the disc half a pitch rather than the ring's own size; the intro's tiles following
the discs rather than the cover staying black between them until the page arrives; the pointer's round hit test.

**D41 — The pointer glows, and the glow goes out when it rests.** *2026-09-26: "let's add some glow radius around the
cursor. The circles in the certain radius of the cursor should glow while moving. And when the cursor is resting, the
glow should slowly turn off."* Amends D34, which had "no glow — the intro's is the one blur kept": the intro's glow is
now the one blur kept, **on a line, for the length of the intro and while the pointer moves**, never on a surface.

**Withdrawn 2026-09-26, the same day.** His: *"I did not like the glow effect, or like the circles cells glowing when
around the cursor. Let's remove that glowing effect."* Nothing glows round the pointer; D34 stands as it was — the
pointer's own cell lit, no glow — and the intro's is again the one blur kept, for the length of the intro. The code went
with it: `CURSOR_GLOW` in `grid.tsx`, the painter's `glow` message and the pointer's sprite in `lib/grid-field.ts`. What
follows is the record.

*The rule, as it was.*

- **Every cell whose centre is within three pitches of the pointer glows** as a line the intro draws does: the ring in
  lime and its glow, cast by its circle (D40) — the intro's own sprite, in the pointer's colour. How much a cell glows
  goes smoothly from full at the pointer to nothing at the edge (`(1 − d²/R²)²`), so a cell comes up and goes out as the
  pointer nears and leaves it, and the glow reaches two cells out in every direction.
- **It comes up while the pointer moves and goes out once it rests.** A move brings the glow up over 240ms; 120ms
  without a move is rest; at rest it goes out over 1.5s, slow at first and slow at the end (smoothstep), where it is. A
  move before it is out picks it up from there. There is no trail: the glow is round the pointer, and a cell left
  behind goes out because it is further away.
- **It follows the hand anywhere over the grid**: over a cell, the gutter, the margin, and under a box, where the box
  hides it, as the lit cell (D34) is. It is drawn under the pointer's own lit ring, which is lit either way and at rest
  is all that is left.
- **Only while the intro has revealed the cells**, as the lines: nothing lights the cover's colour ahead of the front.
- **None under reduced motion.** A glow that follows the hand and dies away is motion; the lit cell stays.
- A mouse or a pen only, as D34.

*How.* The pointer's move sends its position to the field's painter as well as the cell it crosses into: one message a
move, no DOM write (D38). The painter keeps the level as a straight run from where it was, up or down, and switches
down 120ms after the last move, so it is the same on any frame rate; it paints while the level is above nothing and
stops when it is out. Each frame it stamps the pointer's sprite at `level × nearness` on the cells in the radius — about
twenty-five on a desktop.

*Looked at* (`e2e/.mcp/cursor-glow.mjs`, the dev server, 1440 × 900, both themes). A sweep along the third row leaves
the glow centred on the pointer's cell, two cells out; 300ms after it stops it is still bright, by a second it is
faint, and by two there is only the lit ring. Lime on the light theme's white is faint, as D34 said of the lit cell.

*Mine, his to change.* The radius of three pitches; 240ms up, 120ms to rest, 1.5s out; the smoothstep; the falloff; the
intro's glow and blur rather than one of the glow's own; off under reduced motion. The numbers are `CURSOR_GLOW` in
`grid.tsx`.

**D42 — ↑ ↓ on the keyboard press the arrows that wear them.** *2026-09-26: "Also map the up and down arrow with
keys."* Amends D27. The pager's arrows wear their glyphs against the hand's direction (his, 2026-09-23,
`grid-pager.tsx`): forward wears ↓ and back wears ↑. So the ↓ key turns forward and ↑ back, the button with that
glyph, and the key plays the same turn as a click. ← → are as they were. A key that a focused component has already
taken is left to it: a menu, a select, a slider and a radio group all move on ↑ ↓, and a component that handles a key
marks it so. A key held with a modifier is left alone too, and so is one in a field, as before. On the first page ↑
does nothing, as the arrow is disabled there.

*Mine, his to change.* Following the glyph rather than the wheel: a scroll up of the hand is forward (D27), so ↑ as
forward would match the wheel and not the button. Leaving modified keys alone.

**D43 — The ring is violet.** *2026-09-26: "change the cursor color to violet."* Amends D34. The pointer's ring — its
2px line, and its fill while a button is held — is `--violet` where it was `--lime`, baked into the image in
globals.css as sRGB 146 98 243 (`#9262f3`), for the same reason as before: an image cannot read a custom property.
Nothing else about the ring changes: 24px, the centre its hotspot, the system's cursor, mouse and pen only. D34's known
cost goes with it: violet is about 4 : 1 on the light theme's white, where lime was 1.3 : 1, so the ring is no longer
faint there.

**Amended the same day: the lit cell is violet too.** *"Change the cell color also to violet when hover."* The cell
under the pointer lights its dashes — its ring, since D40 — in `--violet` where it was `--lime`, so the ring and the cell
it is over are one colour. It is the painter's `cursor` colour, which `readFieldColours` (`grid.tsx`) reads off the
theme; nothing else about the lit cell changes — lit at once, faded back over 500ms when left, none in the gutter or a
square's corners, mouse and pen only. It was lime for the morning because "the cursor" was read as the ring alone.
Violet is about 4 : 1 on the light theme's white, so the lit cell is no longer faint there either. The intro's and the
ripple's lines still turn lime and violet about (D31, D32).

**D44 — The front's edge is the tip of a circle.** *2026-09-27: "instead of diamond shaped ripple let's make it a
curve since we have circles now … like tip of a circle."* Amends D31 and D33. The front the intro, the ripple and the
wash all run on (`ripplePlan`, `grid.tsx`) had a cone for its edge: the sides trailed the point in straight lines, so
a pass was a V rising with a V of fading lines behind it, a diamond. The edge is now an arc of a circle, and the point
is its tip.
*(Replaced by D48, 2026-09-27: the grid no longer draws itself in.)*

*Which circle.* D31's cone stays, as the frame the circle is fitted in: the edge is the circle tangent to the cone's
sides where they meet the field's sides, its centre on the point's column. So the front still leaves the field at the
cone's angle (his twelve steps over a desktop's half-width, D33's same angle on a narrower field, twelve steps on a
wider one), and the point is rounded all the way across. For a cone of slope `m` over a half-width `h`, in cells, the
radius is `h · √(1 + 1/m²)`, and a cell's time is its row plus `R − √(R² − x²)` steps, `x` its distance from the point
in cells. Cells are square (D9), so it is a circle on the screen as well as in cells. Nothing else changes: the step
(15ms), the cut, the lace (D40), the colours, the fade, and the direction — up going forward, down going back, the tip
leading either way.

*What it does to the numbers.* No circle can trail its sides twelve steps over eight and a half columns; a half-circle
trails by its radius, and that is as far as a circle goes. So the sides trail less: 4.4 steps on a 1440 desktop's
eighteen columns (a radius of 10.4 cells), 1.3 on a phone's six and 5 on a 1920's twenty-six. The pass is shorter by as
much: 231ms across an 18 × 12 desktop where it was 345, and 184ms across a 390 phone's 6 × 12 where it was 218. The
turn's hold (`washSpan`) is shorter by the same amount. `INTRO_DEPTH` and `INTRO_CONE_COLS` keep their names and their
meaning, the cone the circle is fitted in, so a deeper cone is still how to get a rounder and slower front.

*Mine, his to change.* The choice of circle, tangent to the cone at the field's sides, was mine: it keeps every number
he tuned and the angle he saw the front leave the field at. These were the others. A circle through the cone's point
and its corners cannot be drawn, because it is too deep. A half-circle as wide as the field drops the outer columns
behind all at once. A fixed radius in cells lies flat on a phone and runs out on a field wider than itself.

**D45 — Tab and the arrows move focus in reading order.** *2026-09-27, on the portfolio: "Right after I reloaded the
page, I clicked on tab and the focus straight away goes to @hiddenstack in the tagline … Ideally, I expected it to
start with avatar, to Radise, and then … navigate me between other work companies … tab and up down left right
buttons should move focus from left to right and top to bottom."* Amends D42. The browser tabs in document order, and
on the grid that is not the screen's: a page's boxes come in the order they were packed, the side columns after the
block they stand beside, and what is drawn behind the field before all of it. `useReadingFocus(scope)`
(`hooks/use-reading-focus.ts`) puts the keys in reading order over what can take focus inside `scope`:

- **Tab** is the next stop, left to right along a line and then the next line down, and Shift+Tab the one before;
  from nothing focused, the first or the last. Past either end the browser takes it on from the scope's first or last
  stop in the document, so focus leaves the page rather than being held on it.
- **← →** are the stop before and after, as Tab goes, and **↑ ↓** the line above and below, at the stop nearest
  across. A line is the stops whose top is above the middle of the line's first, so a stop set down in its box — the
  avatar in its card — reads with the row it stands in.
- **The arrows are a game controller's: they never turn the page.** *Amended the same night: "The arrow buttons are
  still acting on changing pages. I asked to make it like a game controller."* It had kept D42 while nothing was
  focused — after a load, after a turn took the focused box away, after Esc — so the same key turned the page one
  moment and moved focus the next. Now from nothing focused any arrow lights the first stop, and at the edges they
  stop. A page that uses this sets `keyboard={false}` on its `GridPages`, which turns the grid's keys off: it turns by
  the scroll, a finger and the pager, whose cells are stops, so Enter on ↓ or on a number turns from the keyboard. A
  key pressed while the grid turns (`data-turn` wash or in) is dropped, as a game drops input through a transition:
  the page going away is still on the field, and a stop found on it took focus with it when it went. Esc, which gave
  the arrows back to the turn, went.
- A control that moves on the arrows keeps them — a field, a select, a slider, a menu, a radio group (their ARIA
  roles) — and a key with Ctrl, Alt or ⌘, or already taken, is left alone. A stop is what the browser would tab
  to and can be seen: not disabled, not inert, not under `aria-hidden`, not transparent — so the tagline's handle, at
  opacity 0 on page 2, is not one.

It runs in the capture phase, ahead of a component's own keys, so a roving group — the Tabs' ← → — moves in reading
order with the rest of the page; the portfolio's work column makes every company a stop (Portfolio.md P4). The page
opts in: the portfolio calls it on the box that holds the backdrop and the grid, and nothing else does yet.

*Mine, his to change.* The arrows' meaning — ← → along the order and ↑ ↓ between lines, rather than both along it or
all four by nearest box — the first stop from nothing focused, the stop at the edges, the key dropped through a turn,
and leaving the page past the ends rather than going round.

**D46 — The numbered bar holds the page on its middle two cells, with its title, and the pages before and after beside
it.** *2026-09-27: "since we have at most of six cells right now, I think the arrows will remain where they are. If
it's pages in between, then previous page will be on the second one. Next page will be on the fifth one. And three and
four cells should be occupied by the active page with the page title."* Amends D36. The motion studio draws the one
numbered bar now (Motion.md M5), so this is where it shows. D27's default does not change, so the showcase and the
admin draw what they drew.

*The six cells.* Back is on the first cell and forward on the last, as D36 left them, each with its glyph (↑ first, ↓
last). The second cell is the page before the one on the field and the fifth is the page after, each showing its number,
and a press turns to it. The third and fourth are one box across both cells and the gutter between them. It is the page
on the field with its title, filled in the Button's `default` as D36's marked number was, and it carries
`aria-current="page"`. Like D36's mark, it is the page the field is turning to, so a hand that goes on turning sees the
title and both numbers run ahead of it (D35). On the first page the second cell is an empty `card` cell, like D36's
spare cells, and on the last page the fifth is. The arrow beside it is disabled.

*The title belongs to the page.* A `GridPage` has an optional `title` beside its `id`. A page packed into several on a
smaller field gives each of them its title (`derivePages`), so all three of the studio's narrow Movement pages say
Movement. `GridPages` passes the titles to the bar along with the turn. A title too long for two cells is cut with an
ellipsis and never wrapped.

*The parts.* `pager-page` is now the page `offset` away from the one on the field, not a place in a window.
`pager-title` is the title on two cells. It is a registry entry like the others, and bar-only for D29's reason.
`pagerWindow` is gone along with D36's window. *Both parts went the same day (D47): the pages are one block.*

*Mine, his to change.* His rule is for six cells. On a wider even bar, `numberedPagerBar` keeps the page on the middle
two cells and fills outward: pages further back on the left, further ahead on the right. Eight cells show two pages
each side, four show only the arrows and the title, and two show only the arrows. Also mine: an untitled page reads
"Page 3", and the title shows without its number because the numbers either side imply it. The title box is a Button
that does nothing on press, as D36's marked number was, so it stays a Tab stop (D45) and a screen reader hears "Page 2
of 6: Movement". **Amended the same day (D47):** the page is not always on the middle two cells, its number is in the
box with its title, and the pages move by movement.

**D47 — The bar's pages move by movement, and the page stands where the pages around it leave room.** *2026-09-27, on
D46: "for the first one let's start on the second cell only and also the number should be mentioned in the cell … the
number should follow the movement motion that we created and then once we move from first page to second page then it
can go to the center and then for the last page it will move to the fourth column."* Amends D46.

*Where the page stands.* On six cells, the first page is on the second and third cells, with the next two pages on the
fourth and fifth. A page with pages on both sides is on the middle two, as in D46. The last page is on the fourth and
fifth, with the two before it on the second and third. The four cells between the arrows show three pages and slide to
keep the current page in the middle of them, stopping at the first page and the last (`pagerStart`). No cell between
the arrows is empty unless the layout has fewer than three pages.

*The number is in the box.* The box reads "2 Movement": the page's number on its first cell, where it stood as a
one-cell page, then the title.

*It moves by movement* (Motion.md M9). The pages are one block across the cells between the arrows (`pager-pages`). It
plays through `useCellMotion` on the `--motion-move-*` tokens, the same hook and model as the portfolio's tech column.
Every page is a one-cell element, a ring with its number on it, and they stand on one line. The page the field is
turning to grows to two cells, and its title rides after the number and fades in with the ring. When the page changes,
the box it leaves shrinks and the new one grows. The numbers travel, shrinking into each border and growing out of it,
and the rings hand over rather than slide.

- From the first page to the second nothing slides: the first box gives back its second cell, and the second page grows
  into the middle.
- From a middle page on, the block slides a cell as well. The number coming in travels two cells into the box, and the
  one going out travels one cell left. The pages at the ends hand over to cells outside the block, which clips them.
- The box stays lime throughout, because the old ring going out is drawn over the new one coming in.
- It follows the page the field is turning to, so a hand that keeps turning turns it round from where it stands (D35).
- Under reduced motion it jumps, as every component does.

*A title that does not fit* in two cells steps down a role, from body to caption, the way the showcase's section header
does in a narrow slot. It is measured in the numbers' font. On a desktop "Movement" fits at body size. On a phone,
whose cell is derived (D33), it drops to caption.

*Mine, his to change.* With two pages, which is the studio on a desktop, the second page takes the middle, not the
fourth and fifth cells. It is both the second page and the last, and I read it as the second. That keeps the box on
the field's centre line and moves only by edges; the cell after it is D27's empty `card` cell. Also mine: the number is
semibold and the title regular.

**D48 — The loader loads every page, and the ripple is gone.** *2026-09-27: "ripple is not the loading state that I
want" (Motion.md M10); then, with his settings picked in the motion studio, "Proceed"; then, having seen it on the
portfolio: "Let's remove the ripple effect intro and page transitions and uh, replace with the current loaders that we
created … I don't like the loader cells to be distributed randomly. I want them to be distributed between same number
of columns and rows."* Replaces D31's drawing, D32, D37's wash and D44. D31's wait for the page, and its reveal of the
pager, stay.

*What it is.*

- **A page on the field is loaded by the loader.** This is loading, his motion (M10), on the page's own boxes, the
  field's and not the pager's. **A section may be several boxes** (his, the same night, of the portfolio's ten: "Instead
  of 10 loading cells, let's have 6. One for each section"): boxes that carry the same `data-load-section` share one
  ring, which opens over the rectangle round them all, each box shown where the ring has reached it. A box without one
  is its own section. The portfolio's six were the profile (its card, facts, links and note), the work, the projects,
  the degree, the technical skills and the art skills (`load` on an item in `site.tsx`), until the next day.
- **And a box may be several sections** (his, 2026-09-28, on the portfolio: "I want all the cards to have one circle
  … the avatar, the name card, the text cards, the email, the button, all the circles, all the social media circles,
  all the content … Everything … should have a circle"). An element inside a box that carries `data-load-box` is a
  section of its own: one ring, which opens over the element's own edges.
  - A box with any is not a section itself. Its pieces are held back instead, and anything it holds outside them is
    hidden until the load is over.
  - Pieces of one box that share a value are one ring: a tech mark is its toggle and its drawing. A bare
    `data-load-box` is a ring of its own.
  - A piece that is not laid out, such as one in a tab that is not shown, gets no ring.
  - The portfolio marks every card, every label row, the résumé's button, every mark and a phone's tab bar. That makes
    37 rings at 1440 × 900 and 18 on a phone, where there were six. `load` came off its items.
  - Where the field is narrower than the square, the square is as wide as the field and as tall as that takes.
  - While the page loads, a square of dashed lime rings stands on the field's centre, one ring a box. It is as many
    columns wide as rows tall, the fewest that hold them all, filled in reading order, with a row that is not full
    centred under the rest. The rings turn (his spin, once round every 6s).
  - When the page is ready, every ring is pressed to 0.5 at once, and its dashes close into a full circle as it
    shrinks (his, 2026-09-28: "The dashes should slowly as they shrink should become full circle").
  - Each goes straight to its box's nearest cell in one move of movement's dot, and all land together.
  - Each goes to its box's TOP-LEFT cell, and the box opens out from that corner, rightward and down (his, the same
    night: "let's always move them to the top left corner of any component"; the nearest of its four corners before,
    "it should open up only from the corners", and its nearest cell before that).
  - All are released into the plain border a box wears.
  - Each box opens out to its edges, shown inside its ring, and the border fades as the box comes in.
  - The turn is his chase since the same night ("the turn style that I chose is chase"): a closed ring goes round the
    square, once round every 6s.
  - Ten boxes stand as rows of 3, 3, 3 and 1 (his, the same night: "Instead of 4, 4, 2 for the first loaders, try 3, 3,
    3, 1"), and seven as 3, 3 and 1: as many rows as the smallest square that holds them, as few columns as fill them.
- **The intro is page 1's load.** It is held back from the server's first paint. The loader turns until the page is
  ready: D31's ready, the fonts, the window's load and the images on the field, 3s at most. **It turns for 2s at the
  least** (`INTRO_MIN_MS`, his, the same night: "add two seconds of artificial load, if there is not throttle"). It
  opens two frames after that, so a page arranged on the measured field has its boxes in the DOM. The pager is held too, and comes up from
  its bottom edge as page 1 opens (D31's reveal, kept for it). Nothing turns a page until page 1 is in. Once per
  document load, never under reduced motion. The grid no longer draws itself in, and there is no cover: the field's
  dashes and the rings are on the page's own colour from the start.
- **A turn loads the page it puts on the field only when there is something to load.** When the turn commits, the
  page fades away over the turn's 160ms (`TURN_MS`, opacity only, D37's rule that nothing is squeezed). Then the next
  page is put on the field. If its boxes have images still to come, it loads: the loader turns until they are in, 3s
  at most, and opens. Otherwise it shows at once and fades in over the same 160ms (his, the same night: "when all the
  pages are uh, either pre-rendered or already loaded and cached which doesn't need any extra loading can directly
  render the page rather than showing any loading"). Every page `GridPages` holds is rendered from its layout, and
  no paged grid has images today, so today no turn shows the loader. A hand that goes on scrolling still goes on
  turning through the emptied field (D35), a page a step, and the page it stops on is the one that loads. A turn the
  hand brings back to the page it left has nothing to load, and fades back in. Every `GridPages` turns this way, the
  showcase's and the admin's included: the wash was the turn for them too.
- **What went.**
  - D31's drawing: a front rising from the bottom, every cell a cut, and its lines lit lime and violet, glowing.
  - D31's cover, and the drawing going again while the page loaded.
  - D44's circle-tipped front.
  - D32's ripple between pages, and the pager's arrow filling in the ripple's colour.
  - D37's wash, the page cut away cell by cell as the front crossed it.
  - The `ripple` prop, `washAway`, `washSpan` and `rippleSpan`.
- **The painter paints less.** The field's painter (D38) now paints the overlay's dashes and the pointer's cell. Its
  passes, its reveal and its lines canvas are still in `lib/grid-field.ts`, but nothing sends it a pass or a reveal.

*Measured* (`e2e/.mcp/intro-loader.mjs`, `e2e/.mcp/turn-loader.mjs`, local, 2026-09-27):
- **The portfolio at 1440 × 900:** ten rings stand at 0.39s, the page is ready at once, and the intro ends at 2.4s.
- **The studio, turning to page 2:** the fade takes 0.2s, seven rings stand, and the page is in at 2.3s.
- **The showcase, turning with ↓:** eight rings, in at 2.25s.
- **The studio's specimen:** 55 runs of its rules probe, five presets on eleven layouts, with no two rings
  overlapping and none seen on more than two cells.
- **The portfolio with a ring a card** (2026-09-28): at 1440 × 900, 37 rings stand at 0.35s. They start moving at
  2.3s, and the intro ends at 4.3s. A 412 × 915 phone has 18 and ends at the same time. In three runs of
  `e2e/.mcp/loader-frames.mjs`, headless on an M-series Mac, no frame of the opening took over 20ms.

*Mine, his to change.*
- The page fading away over 160ms as a turn commits.
- The two frames' wait before page 1 opens.
- The border's fade (M10).
- A square's row that is not full centred.
- The boxes are read off the tracks where the grid put them, whenever the grid renders or a box comes or goes.
- Reading his "everything" as including the section labels' rows and the tech's marks, so each takes a ring (2026-09-28).

*Open.*
- Once round in 6s, a chase round ten rings hands on every 0.6s, so the intro's 2s show about three steps.
- A turn to a page with images to fetch is written but no page exercises it yet.
- Without the cover, what a page draws behind the grid shows while page 1 loads: the portfolio's tagline stands under
  the turning rings before anything else is in.
- The rings can stand a moment before the field's dashes come, which the worker paints (the cover hid that).
- The rings are painted from the main thread, on the GSAP ticker the studio uses, not by the field's painter in its
  worker (D38). A busy main thread can make a slow spin stutter. There were ten of them, and since 2026-09-28 there are
  up to 37 on the portfolio. That is still far from the ~1,300 elements D38 moved, and none of the measured frames
  dropped (above).
- The painter's unused passes and reveal are to come out of `lib/grid-field.ts`.

*Where it lives.* `useGridLoad` (the intro, and a change of `page`) and `GridLoader` (the rings and the boxes) in
grid.tsx. They play through `useLoadMotion`, with `paintLoadRing` and `paintLoadSection` (`hooks/use-load-motion.ts`),
the painters the motion studio's stage uses, so what is tuned there is what the page does. The square is
`loaderLayout` (`lib/load-motion.ts`). `GridPages` passes the page on the field as `page`; globals.css holds a loading
page's boxes (`data-loading`) and the pieces of a box of pieces (`data-load-box`), the pager while the intro runs, and fades a turning page away (`data-turn="wash"`).

---

## 9. Where it lives

Field, config and the reference boxes (`GRID_REFERENCE_BOX`) in `grid.tsx`, the model in `grid-layout.ts`, pages
and the turn in `grid-pages.tsx`, the pager in `grid-pager.tsx` (D27, D29) with its parts the registry's entries —
the arrows as a pair, and one arrow or one page number a cell for the numbered bar (`registry.tsx`, D36) with the
pages between the arrows as one block that plays movement (D46, D47) — each page's `title` on `GridPage` in
`grid-layout.ts` — the theme flip in `grid.tsx` with `theme-provider.tsx` (D28), the intro and the ripple between pages in `grid.tsx` with
their CSS in `globals.css` (D31, D32), the cursor in `grid.tsx` and its image in `globals.css` (D34), the hand and its fling's tail in `grid-pages.tsx`
(D35), the wash in `grid.tsx` (`washAway`), played by the turn in `grid-pages.tsx` and faded in by `globals.css` (D37),
the field's paint — the overlay's dashes, the lines, the pointer's cell and the intro's reveal — in `lib/grid-field.ts`,
started and fed by `useGridField` in `grid.tsx` (D38), its rings and the lace in the same two files (D40), the one
radius in `globals.css`, read off the cell `Grid` writes on its root (D39), the keys' focus order in
`hooks/use-reading-focus.ts` (D45), the slot in `slot.tsx`. All of it
renders; none of it edits (D30). The pages it carries are data: the showcase's in `apps/design/src/content/`,
arranged by `apps/design/src/lib/arrange.ts`, and the portfolio's in `apps/portfolio/src/content/`, arranged by
`apps/portfolio/src/lib/arrange.ts`. *Until 2026-09-23 the tools were in `grid-editor.tsx`, the frame in
`grid-frame.tsx` (with `referenceShape`) and the export in `grid-layout.ts` (`layoutFromSpans`, `layoutCode`,
`configCode`); it was designed on at `design.no-origins.com/composer` and composed on by the quest composer (Admin.md
§0.5). D30 removed all of it.* The repo-root CLAUDE.md carries these rules in short form for the harness and
says the code is on v2; when this document and that file disagree, fix the one that is behind, and say so here.
