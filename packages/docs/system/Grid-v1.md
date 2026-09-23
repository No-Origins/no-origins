# No Origins — The Grid, v1

*The first grid document, opened 2026-09-18 and **superseded 2026-09-21 by Grid-v2.md**. **Grid.md** always points at the
current version; this file is the record of the one before it. Below the summary is the full text as it stood on the day
the direction changed, unedited, so that a `Grid.md D7` or `Grid.md §4` written in a source comment before 2026-09-21 can
still be read where it was written. The code in `packages/ui/src/components/grid*.tsx` implemented this version until
2026-09-21, when it moved to v2 the same day the direction did.*

---

## Summary — what v1 decided, in a page

**The idea.** A field of square cells, so many columns by so many rows, **decided per breakpoint**; every visible thing
is a box placed on it by coordinate; the field fits the viewport and never scrolls; overflow goes to another page.

**The eleven rules.**

| | Rule | Fate in v2 |
|---|---|---|
| D1 | One square cell is the unit; a box spans whole cells on both axes. | **Stands**, and becomes the founding decision |
| D2 | Column AND row counts are decided per breakpoint, never by content. | **Dissolved** — counts derive from the viewport |
| D3 | The grid never scrolls and never overflows its box. | **Stands** |
| D4 | Boxes are placed by 1-based coordinate; a move is refused, never reflowed. | **Stands** |
| D5 | Overflow goes to another PAGE; the pager sits in the bottom corners; the flip. | **Stands** |
| D6 | The widest authored breakpoint is the truth; narrower ones derive by packing. | **In force** — authoring deferred in v2 (§7); redecided later |
| D7 | The field IS the breakpoint (`metrics.bp`). | **Dissolved** — the field is the viewport |
| D8 | A short landscape box turns the field on its side (4×8 → 8×4). | **Dissolved** — falls out for free |
| D9 | Cells are square, always; `stretch` deleted; the field is centred and the remainder is margin. | **Stands**; the `min()` is no longer needed |
| D10 | Gutter and pad are decided per breakpoint, with the counts, from the spacing scale. | **Amended** — the gutter stays, per breakpoint, from the scale; the pad is no longer a decided number (v2 D15) |
| D11 | A breakpoint is previewed in a FRAME (reference box, corner drag, rotate, fit-scale), never forced. | **Stands**, and is the method for picking the cell |

**The spacing scale**, `0 · 4 · 8 · 12 · 16`, the grid's own and not a general system. Carried into v2 unchanged (§3).

**The table it never filled.** §4 asked for `cols · rows · gap · pad` per breakpoint, five rows, read off the frame at
both ends of each range. It stayed empty from 2026-09-18 to 2026-09-21, and the reason is v2's premise: it was asking
him to decide something the viewport should decide. Today's defaults in the code — base 4×8, sm 6×8, md 8×7, lg 12×6,
gap 12, pad 16, no `xl` — were never his decisions and still are not.

**Why it changed.** *"Does the breakpoints of the grid and fixed number of rows and columns matter? In the end, all
these boxes are the basis of Lego blocks."* The full account is Grid-v2.md §1.

---
---

# The document as it stood on 2026-09-21

# No Origins — The Grid

*The base layout of the 2.0 design system. Opened 2026-09-18, the first live document in `system/` since the
rebuild. Bhargav's words are quoted; the rest is the record of what he decided and the one table he has yet to fill.*

Companion documents: **Brand.md** (upstream of everything visual), **Admin.md §0.5** (quests are composed on this
grid), and the **repo-root CLAUDE.md**, which stays the authority on how the code is built. **Design-System.md §7**
(layout) and **Atomic.md** describe the deleted 1.0 system and are not a guide here. This document decides the
grid; the code in `packages/ui/src/components/grid*.tsx` and `packages/ui/src/lib/grid-layout.ts` implements it.

---

## 1. What the grid is

**Bhargav, 2026-09-16: "the most important part of the design system … a grid system that adapts to the viewport
size and the number of columns and rows … anything in the applications will snap grid items onto the grid."**

The grid is a field of **square cells**, so many columns by so many rows, decided per breakpoint. Every visible
thing in every app — a heading, a card, a quest's whole surface, the admin's own home — is a box placed on that
field by coordinate, spanning whole cells. The field fits the viewport it is given and **never scrolls**; when a
layout holds more than one field can, the surplus goes to another *page* of the same field, never off the edge.

It is a layout system and a coordinate system at once: the layout because boxes are laid on it, the coordinate
system because a box is *only* a position and a span, so what the admin saves is exactly what a quest renders.

---

## 2. The rules

Each one is his, dated. Where two conflict, the later one says so.

**D1 — One square cell is the unit.** Not a column, not a row: the cell. A box spans whole cells on both axes.

**D2 — Column AND row counts are decided per breakpoint, never by content.** A field does not grow because
something was put on it. If it does not fit, it goes to another page (D5).

**D3 — The grid never scrolls and never overflows the viewport.** With `fill`, the field is the viewport
(`100dvh`); as a block in a page, it is as tall as its rows make it. Either way nothing spills.

**D4 — Boxes are placed by coordinate, 1-based like CSS grid lines, and a move is refused, never reflowed.**
Landing out of bounds, on another box or on a pager cell leaves the box where it was and turns the ghost red.
Nothing shuffles to make room.

**D5 — Overflow goes to another PAGE.** A layout is a list of pages of the same field. The pager is ‹ in the
bottom-left cell and › in the bottom-right, each present only when it has somewhere to go, and the packer treats
those cells as taken. Turning the page flips the boxes edge-on in a wave from the top-left; the field, rulers and
pager stay put.

**D6 — The widest authored breakpoint is the truth.** Narrower breakpoints *derive* by packing each authored page
in reading order; an authored page break is a hard break; overflow adds pages. Hand-editing a derived breakpoint
writes its pages down and it stops deriving (`withAuthored`); `withoutAuthored` lets it derive again. A breakpoint
is therefore in one of three states — source, authored, derived — and `/grid` says which.

**D7 — The field IS the breakpoint.** `metrics.bp` is the config key that produced the field, so a viewport that is
`xl` by width on a config with no `xl` entry is `lg`, and shares `lg`'s layout.

**D8 — A short landscape box turns the field on its side.** Height under 640 and wider than tall keys on the
height and swaps cols and rows (base's 4×8 becomes 8×4). Such a field always derives; it is never authored.
Landscape phones are second-class until there is an orientation-aware config, if there ever needs to be.

**D9 — Cells are square, always. 2026-09-18: "only square. No stretch."** Square cells and filling a viewport
disagree at most viewport ratios, and the square wins: the cell side is the smaller of what the width and the height
allow, **the field is centred in its box, vertically and horizontally**, and the remainder is margin. The `stretch`
fit that let cells drift off-square to fill the box exactly was **deleted** — no prop, no type, no toggle. It is not
to come back. Centred means centred: the rulers on `/grid` reserve their room on all four sides so drawing them
never pushes the field off centre (the same day — they had been nudging it 12px right and down).

**D10 — Gutter and pad are decided per breakpoint, with the counts, from the spacing scale. 2026-09-18.**
Bhargav: *"spacing tokens can be used for gutters so that for each breakpoint I can have a different size for
gutter … once I decide that we can fix on the number of columns and rows for each breakpoint along with the gutter
space."* The gutter (the gap between cells) and the pad (the field's margin against the viewport) are not one
number for the whole system; they are one number **per breakpoint**, chosen in the same breath as that breakpoint's
columns and rows, because the three trade against each other (§4). Each is picked from the spacing scale (§3), not
typed freely. A breakpoint's field is therefore four numbers — `cols · rows · gap · pad` — and they live together in
`DEFAULT_GRID_CONFIG`. Pad stays its own number: asked the same day whether it should fold into the gutter (pad =
gap) or go, he kept it — *"Let's keep the pad."*

**D11 — A breakpoint is previewed in a FRAME, never forced onto the screen you are on. 2026-09-21.**

Until today the breakpoint toggle on `/grid` forced the *field* — another breakpoint's columns and rows — while the
cells went on sizing themselves against the real desktop box. That preview showed a field no device produces:
`base`'s 4×8 on a 1440px screen gives a ~90px cell where a phone gives ~65px, and §4's two cell columns are exactly
the numbers it got wrong. §5 used to carry the apology — *"read the numbers on a real one where you can"* — which is
a tool admitting it cannot do the one job it exists for.

**The forcing is deleted.** No `force` argument on `resolveField`, no `breakpoint` prop on `Grid`, `GridPages` or
`GridEditor`, nothing in the toolbar that overrides what the box says. What replaces it is a **frame**: a plain box
of a stated width and height, drawn in the workspace, with the grid inside it. The frame resolves its breakpoint the
ordinary way, so nothing needs forcing — **the frame is the viewport**, and D7 stops being something the tool works
around and becomes the mechanism it runs on.

Six rules, his pick of 2026-09-21 (option **B** of five, plus the rotate button and nothing else, from **E**):

- **The frame starts at §4's reference box.** Those five sizes were already decided when the table was written;
  the frame renders them rather than inventing a second set. Choosing `md` means a 768 × 1024 frame.
- **The frame resizes, from its bottom-right corner, and is not clamped to the range.** A breakpoint is a *range*,
  not a size, and §4 asks for the cell at both ends of it: drag to 640 and read, drag to 767 and read. Dragging past
  a boundary is allowed and re-resolves the breakpoint — that is D7 happening in front of you, and clamping would
  hide the one lesson `lg` most needs, that it runs from 1024 to infinity with no top end.
- **Width decides the breakpoint; height is the other half of the cell.** `cell = min(width-derived, height-derived)`
  (§4), and with `fill` on a portrait frame the width almost always wins — but the height is what makes a landscape
  frame short, so both axes drag.
- **The frame rotates, swapping its width and height.** One button, no bezel, no notch, no device dressing: this is
  the only part of a device shell that earns its place, because rotating `base` to 844 × 390 is the only practical
  way to *see* D8 — the field turns on its side to 8×4 in front of you, and the editor goes read-only there,
  because a transposed field is never authored (D8).
- **The frame scales down to fit the workspace, never up.** md and xl do not fit under the toolbar on most screens,
  so the frame shrinks by a uniform transform; a frame that already fits is shown at true 1:1, because a 390px frame
  being literally phone-sized on the desk is worth more than filling the room. The readout says the scale whenever
  it is not 1.
- **The toggle stays, and means "snap the frame to that breakpoint's reference box".** There is no longer a *live*
  breakpoint separate from a *previewed* one, no `forced` state and no `· previewed on lg` on the badge. Whichever
  breakpoint the frame currently resolves to is the one shown pressed. A sixth position, **Fit**, sizes the frame to
  the workspace itself — which is the full-bleed view `/grid` has today, kept as one frame among the others rather
  than as a second mode, and where the page opens, so arriving at `/grid` looks exactly as it does now.

Two things the frame changes underneath, recorded here because they are constraints, not choices:

- **A scaled frame has to be divided back out of every drag.** The editor turns a pointer delta into cells by
  measuring it against `cellW + gap` in CSS pixels (`grid-pages.tsx`, `rectFor`); under a transform those two are in
  different units and every drag at md and xl would be wrong by `1/scale`. The scale travels with the metrics and
  the deltas are divided by it.
- **`fill` comes to mean "fill the frame".** It is `100dvh` today. Inside a frame the viewport it owns is the
  frame's, which is what D3 means by the field never overflowing — the rule is unchanged, the box it applies to is
  now stated rather than assumed.

The frame belongs in `packages/ui`, not in the showcase page. The quest composer (Admin.md §0.5) is blind in exactly
the same way `/grid` was — a quest is authored on a desktop and what a phone gets cannot be seen without resizing
the browser — and it should inherit the frame rather than grow its own.

---

## 3. The spacing scale

```
0 · 4 · 8 · 12 · 16
```

Five steps of 4px. The field's gutter and pad are each one of these, per breakpoint. A box's own inset — the room it
holds its content in from its own edge — draws from the same five, so the space *between* boxes and the space
*inside* them read as the same family rather than two unrelated numbers.

Why these:

- **4px steps** because that is the base of the Tailwind spacing the apps already lay out with (`gap-2` is 8,
  `p-4` is 16), so the grid and the utilities never disagree about what a step is.
- **It stops at 16** because past that, on any field dense enough to matter, the gutter out-measures the cell. If a
  breakpoint wants more air than 16px, the answer is fewer columns, not a wider gutter.
- **0 is on it on purpose.** A gutter of 0 means cells touch and the field reads as one continuous lattice, with
  separation left entirely to each box's inset. At high column counts this is the only value that still reads as a
  grid; at low counts a gutter is nearly free. Which is exactly why the number is per breakpoint (D10).

There is no other spacing token in the system. The `radix-sera` base carries colour and `--radius: 0`, nothing for
space; the 1.0 space scale went with 1.0. This scale is deliberately small and deliberately the grid's — it is not
a general spacing system, and should not quietly grow into one.

---

## 4. The table — the decision still to make

**This is the one open decision about the grid, and it is his.** Everything above is settled; the numbers below are
not. The row counts in the code today came from convention, not from him — 4×8 on a phone because the smallest
useful box is about 70px and 70 goes into 390 four times — and he has asked to decide them himself.

The three columns trade against each other, so a row is decided as a whole, not a column at a time. The cell that
results is:

```
cell = min( (W − 2·pad − (cols − 1)·gap) / cols ,
            (H − 2·pad − (rows − 1)·gap) / rows )
```

— the smaller of what the width and the height allow (D9). Every gap is width the field can never place anything
in, and there are `cols − 1` of them, so on a dense field the gutter costs more than it looks: at 50 columns on a
1440px screen, a 12px gutter is 588px — 42% of the width — and leaves a 16px cell; a 0px gutter leaves 28px.

**The `Reference box` column is not a note — it is what the tool draws (D11).** Picking a breakpoint on `/grid`
sizes the frame to that box, and the frame is what the field resolves against, so the cells you read there are the
cells that breakpoint really gets. The `Viewport` column is the range the frame drags across, and the last two
columns are read at its two ends.

| Breakpoint | Viewport | Reference box | cols | rows | gap | pad | cell, low edge | cell, high edge |
|---|---|---|---|---|---|---|---|---|
| **base** | 0 – 639 | 390 × 844 · phone | | | | | | |
| **sm** | 640 – 767 | 640 × 960 | | | | | | |
| **md** | 768 – 1023 | 768 × 1024 · tablet portrait | | | | | | |
| **lg** | 1024 – 1279 | 1024 × 768 · tablet landscape | | | | | | |
| **xl** | 1280 + | 1440 × 900 · desktop | | | | | | |

*Today's defaults, for reference and **not** as decisions:* base 4×8 · sm 6×8 · md 8×7 · lg 12×6, gap 12 and pad 16
on every one, and **no `xl` row** — so a 1440px desktop is `lg` today (D7). Whether `xl` gets a row of its own is
part of this decision: without one, `lg` runs from 1024 to infinity and its counts have to suit both a tablet on its
side and a 27-inch monitor.

When the table is filled it becomes `DEFAULT_GRID_CONFIG` verbatim, the repo-root CLAUDE.md's "defaults, not
decisions" bullet is rewritten to say decided, and the remaining two cells of every row get filled from the readout.

---

## 5. How to fill it in

*Rewritten 2026-09-21 for D11. The method it described before — force a narrow field onto a wide screen and squint —
produced cells no device has, which is why §4 is still empty.*

On `/grid` in the showcase, the grid is drawn inside a **frame** (D11), and the frame is the whole method: it is a
box of a stated size, the field resolves against it, and every number you read belongs to a viewport that exists.

The tools around it:

- **The breakpoint toggle** snaps the frame to that breakpoint's reference box (§4). **Fit** sizes it to the
  workspace instead. Whichever breakpoint the frame resolves to is the one shown pressed — there is no forcing and
  nothing to press twice.
- **The frame's bottom-right corner drags**, both axes, anywhere, including across a boundary into the next
  breakpoint.
- **Rotate** swaps the frame's width and height.
- **The Tracks popover** is one row per breakpoint with steppers for all four numbers; columns and rows run to 50,
  gap and pad step along the spacing scale, and the row in use is highlighted.
- **The readout** gives `cols × rows · cell · gap · pad · box` live, plus the frame's scale when it is not 1:1, and
  the badge says whether this breakpoint is source, authored or derived (D6).

The method, one row at a time:

1. **Snap to the reference box** and set the four numbers until the field looks right at that size.
2. **Drag the frame to the low edge of the range** — 640 for `sm`, 1024 for `lg` — and read the cell. Write it in
   `cell, low edge`.
3. **Drag to the high edge** — 767, 1279 — and read it again. That is `cell, high edge`. If the two are far apart,
   the row is carrying too much range and that is an argument for splitting it.
4. **Rotate** and look at what D8 does to it. The field turns on its side and goes read-only; you are checking that
   the turned field is not embarrassing, not authoring it.
5. **Write the row into §4 with the date.**

What to look at, per row:

- **The cell.** It is the smallest thing a box can be. Below about 24px a 1×1 box cannot hold a glyph and a 2×2
  barely a word; if the smallest thing you will ever place is a 40px control, a 20px cell is fine and a 10px cell is
  a lot of coordinates for nothing. Read it at true 1:1 where the frame fits — `base`, `sm` and `md` do on a
  desktop — because a scaled frame is honest about proportion and only approximately honest about size.
- **The texture.** Toggle **Cells** on and look at the empty field. Does it read as a grid or as specks? That is the
  gutter question, answered by eye.
- **The seed layout on it.** The two seed pages are authored on 12×6; watch what the packer does to them when the
  counts change — derived breakpoints are the real test of a count, because that is where every layout you author
  once ends up.
- **Both ends of the range**, which is now step 2 and step 3 rather than an instruction to resize your browser.
  `lg` has no top end at all: drag its frame past 1280 and, until an `xl` row exists, the badge still says `lg`
  (D7). That is the `xl` question in §6, shown rather than argued.

Fill a row, look, change one number, look again. When a row stops moving, write it down.

---

## 6. Open

- **The table (§4).** The only decision the grid is still waiting on.
- **Whether `xl` exists.** Part of §4. (His 2026-09-18 layout export had an authored `xl` — so it does; the row's numbers
  are still his to paste.) D11 makes it something to look at rather than reason about: drag `lg`'s frame past 1280
  and see whether one set of counts can serve a tablet on its side and a 27-inch monitor at once.
- **The frame in the quest composer.** `/grid` has it (built 2026-09-21, the same day as D11); the composer
  (Admin.md §0.5) still authors on the bare viewport and should take `GridFrame` rather than grow its own.
- **The pager as a placeable component — amends D5, his ask 2026-09-18:** *"make the page changing buttons as
  components that I can place them anywhere I want."* `PagerPrev`, `PagerNext` (and a `PageIndicator`) become
  design-system components that go into the palette and onto the grid like any box. Two ways they can behave, **his
  pick pending**: **A — fixtures**, placed once per breakpoint, shown on every page at that spot, staying put through
  the flip, reserved by the packer on every page (recommended — it is D5's behaviour with the position freed);
  **B — per-page boxes**, placed on each page, allowed to differ, flipping with the rest, and a page can end up with
  no way out. Either way the corners stay the default until one is placed.
- **Landscape phones** (D8) — second-class by choice until they matter. Orientation as a *config axis* (a portrait
  and a landscape field per breakpoint) was raised and **rejected the same day** — *"I think it's a wrong idea. Let's
  not have orientation. Let's just stick to breakpoints."* The table stays one row per breakpoint; a turned box
  gets D8.
- **What sits on the grid.** Organisms and templates do not exist yet; they get designed on this layer once the
  table is filled, because a molecule's default box size is meaningless until the field is fixed (Admin.md §0.5's
  palette carries placeholder sizes for exactly this reason).

---

## 7. Where it lives

| Thing | Where |
|---|---|
| The field: breakpoints, `DEFAULT_GRID_CONFIG`, the spacing scale, `resolveField`, metrics | `packages/ui/src/components/grid.tsx` |
| The model, pure: pages, packing, derivation, `withAuthored` / `withoutAuthored` | `packages/ui/src/lib/grid-layout.ts` |
| Pages, the flip, the pager | `packages/ui/src/components/grid-pages.tsx` |
| The tools: drag, resize, keyboard, history | `packages/ui/src/components/grid-editor.tsx` |
| The frame: reference boxes, resize, rotate, fit-scale (D11) | `packages/ui/src/components/grid-frame.tsx` |
| Where it is reviewed and where §4 gets filled | `apps/design/src/app/grid/page.tsx` → `design.no-origins.com/grid` |
| The first thing composed on it | Admin.md §0.5 — the quest composer |

The repo-root CLAUDE.md carries the same rules in short form for the harness; when this document and that file
disagree, fix the one that is behind, and say so here.
