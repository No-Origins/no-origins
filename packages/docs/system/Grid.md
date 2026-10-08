# No Origins — The Grid

The base layout of the design system: the field of square cells every page is on, how boxes are placed on it, how a
layout pages, and everything the grid itself draws and moves — the pager and the turn, the pointer, the theme sheet,
the one radius, the reading order and the intro.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

Rule numbers are this document's own, D1 onward, with gaps where a rule no longer stands. The code is
`packages/ui/src/components/grid*.tsx`, `slot.tsx`, `registry.tsx`, `lib/grid-layout.ts` and `lib/grid-field.ts`
(§13); where the code and this document disagree, fix the one that is behind. Companion documents: **Slots.md** (a box
on the grid), **Type.md**, **Motion.md** (the motions the grid plays), **Brand.md** (upstream of everything visual).

---

## 1. The field

**D1 — One square cell is the unit.** Not a column, not a row: the cell. A box spans whole cells on both axes, and
everything, at every depth, snaps to the one grid (Slots.md S2).

**D3 — The grid never scrolls and never overflows its box.** The grid is always its box: the viewport (`h-dvh`,
full width). Nothing holds a grid as a block in a page, so there is no `fill`. A className may give it another height
when there is chrome above it, never a width.

**D9 — Cells are square, always.** No stretch: there is no `fit` prop, no `GridFit` type and no toggle, and none is
to come back. The side is the decided cell (D13); a cell is drawn as a circle inside its square (D40).

**D11 — Nothing forces a breakpoint.** `resolveField(config, width, height)` takes a box and nothing else, and no grid
component takes a `breakpoint` prop. To see another size, give the grid a box of that size: a browser window, a device
in the review sweep. Before the grid has measured its box, a page that lays itself out assumes its breakpoint's
reference box (`GRID_REFERENCE_BOX`, §4).

**D12 — The cell is decided; the counts derive.** Given a box, the field is as many whole cells as fit across and as
many as fit down — `floor((span − gap) / (cell + gap))` on each axis — then made even (D26) and never fewer than six
across (D33). Nobody decides cols or rows: nothing in the config or the props names them, and a field never grows
because something was put on it.

**D14 — The remainder is centred margin.** What is left over on an axis after the count — less than two cells and two
gutters, because counts are even (D26) — is split equally on both sides by the grid's flex box, so the field sits centred. The gutter
never widens to absorb it. On a box that divides exactly, the margin is one gutter (D15).

**D15 — A breakpoint is two numbers, `cell · gap`, and the box's padding is the gutter.** There is no `pad`, in the
config or as a prop: the field sits one gutter from every edge of its box, so the screen's edge is one more grid line
and a box is as far from the edge as from its neighbour. The config's third number per breakpoint is the pager bar's
width (D29).

**D26 — Counts are always even, never below two.** Each count is what fits, rounded down to the nearest even number:
`2 · floor((span − gap) / 2·(cell + gap))` (`countFor`). The field's centre is therefore always a grid line, so a
centred block (D14, D25) is symmetric and every field halves and quarters cleanly; the odd cell that would have fit
becomes margin. A slot's children resolve on the slot's own span, so a 3-wide slot still has three columns inside.

**D33 — A field is never fewer than six columns; below that the cell gives way.** Where the decided cell would give
fewer than `MIN_COLS` (6, `grid.tsx`), the count is held at six and the cell derives from the width — as big as six
cells and seven gutters allow, floored — and the rows are counted with that cell. The gutter does not change. Every
phone is here: 46px on a 360, 48 on a 375, 51 on a 390, 54 on a 412, 57 on a 430. Below `MIN_CELL` (24px) the cell
stops giving way and the box keeps whatever count fits.

---

## 2. Boxes, layouts and pages

**D4 — Boxes are placed by coordinate, 1-based like CSS grid lines.** A coordinate and a span may be given per
breakpoint (`Responsive`, resolved walking down to the nearest defined). Counts change with the box, so a coordinate
past the field's edge is clamped into it (`GridItem`), never allowed to overflow.

**D5 — Overflow goes to another page, never off the edge.** A layout is pages of the same field. What does not fit on
one goes to the next, and `GridPages` turns between them (§6).

**D18 — A layout is per breakpoint.** A `GridLayout` carries authored pages per breakpoint (`authored`), each
breakpoint's with the shape, cols × rows, it was written on (`layout.shapes`; `LEGACY_SHAPES` for a layout without
one). `resolvePages` shows a breakpoint's own pages on the shape they were written on and packs them onto any other
shape, the same breakpoint at another width included. A page that is content data — items, each with a span per
breakpoint and a render — is arranged by its app onto the field it is shown on (each app's `lib/arrange.ts`, §7). The
admin's home is the one layout authored in code (on `lg`'s 12 × 6).

**D21 — Four fills.** A box on the grid is a slot (Slots.md), and its `fill` is one of four:

| Fill | Draws | Inset by default | For |
|---|---|---|---|
| `transparent` | nothing | 0 | text on the field; a component that carries its own surface |
| `background` | the page's background | 0 | a mask over the grid lines behind a component, and nothing more |
| `muted` | the muted surface (`--muted`) | 12 | a filled box with content in it |
| `card` | the card surface and a hairline `border` | 12 | a box that reads as a card |

`--card` is the page's background in both themes, so a `card` fill is the `background` fill with a hairline. The three
surfaces are round (D39); `transparent` is not.

**D22 — Derivation is mobile-first.** A breakpoint with no pages of its own derives from the nearest authored
breakpoint narrower than it, and only when none exists from the nearest wider. Every other field packs each authored
page in reading order; an authored page break is a hard break; overflow adds pages. A layout made on a small field
adapts upward into more room, which never spills onto extra pages; packing a wide layout down is the lossy direction.

**D25 — A derived page that fits is kept and centred; only a page that does not fit is packed.** Take the block the
page uses — the bounding box of its boxes. If it fits the field, every coordinate is kept as authored and the block is
moved to the field's centre, the difference split as margin is (floored, so an odd difference leans to the top-left).
Otherwise the packer reflows the page. A kept page is centred in the room above the pager's row. Sub-slots follow the
same rule inside their slot (Slots.md S5).

**D30 — The grid renders; nothing edits it.** There is no composer, no design mode and nothing editable in place.
`Grid` draws the field, and `GridPages` and `GridPager` render a `GridLayout` on it; nothing in the package changes
one. The grid reads `DEFAULT_GRID_CONFIG` and nothing else — no prop overrides a breakpoint's numbers. A layout is
written in code, or arranged at runtime from spans. A tool for arranging by hand would be a new decision.

---

## 3. The spacing scale

```
0 · 4 · 8 · 12 · 16
```

`GRID_SPACING`, the grid's own and not a general spacing system. The gutter is one of these (D13), and so is a slot's
inset (`SlotInset`, Slots.md S3), so the space between boxes and the space inside them are one family.

- **4px steps**, the base of the Tailwind spacing the apps lay out with, so the grid and the utilities agree on a step.
- **It stops at 16.** Past that the gutter out-measures a dense field's cell; a breakpoint that wants more air wants
  fewer columns, not a wider gutter.
- **0 is on it on purpose**: cells that touch, the field as one lattice, separation left to each box's inset.

The cell is not on this scale: it is a size, not a spacing (D13).

---

## 4. The numbers

**D13 — One cell per breakpoint, decided.** Each breakpoint names a cell and a gutter, and its counts derive from
whatever box it is given (D12). Within a breakpoint the brick is fixed and only the counts move. `DEFAULT_GRID_CONFIG`
is this table verbatim:

| Breakpoint | Width | cell | gap | pager | Why |
|---|---|---|---|---|---|
| `base` | 0 – 639 | 72 | 12 | 6 | a 1×1 is a finger's target (P1); the cell gives way on phones (D33) |
| `sm` | 640 – 767 | 72 | 12 | 6 | still fingers; the same brick as a phone, so a card is the same card |
| `md` | 768 – 1023 | 72 | 12 | 6 | the same |
| `lg` | 1024 – 1279 | 60 | 12 | 6 | a pointer is likely from here; the brick shrinks once (P2) and never again |
| `xl` | 1280 + | 60 | 12 | 6 | the same brick as `lg`: crossing 1280 changes a window's count, never its card |

One gutter everywhere, so the field has one texture (P5) and one edge margin. A 2×2 card is 156px on touch and 132px on
a pointer (P3). Change a number only against §5's principles, and record it here (and the bar's width in D29).
globals.css reckons the cell off the grid from the same numbers (D39): change them, change it too.

**`metrics.bp` is the breakpoint that supplied the cell**, walking down the config from the box's width — the config
key, not the field: two boxes in `lg` can have different fields. It keys the cell and gap, the pager's width, and a
layout's authored pages (D18).

**The reference boxes** (`GRID_REFERENCE_BOX`, `grid.tsx`): the size a page assumes for its first frame before the
grid has measured (D11). A breakpoint is a range, so these are starting points, not the only sizes a page meets.

| Breakpoint | Reference box |
|---|---|
| `base` | 390 × 844 · phone |
| `sm` | 640 × 960 |
| `md` | 768 × 1024 · tablet portrait |
| `lg` | 1024 × 768 · tablet landscape |
| `xl` | 1440 × 900 · desktop |

---

## 5. The six principles

What a row of §4 is checked against before it is written down. Looking is where a row starts; these are the check.

- **P1 — The 1×1 is a target where there are fingers.** The pager's buttons fill their cells, so the cell is the touch
  target: at least 44px where there are fingers, about 32 where a pointer is certain. Everything larger is a multiple,
  so the cell only has to be right for the smallest thing. A phone's derived cell (D33) is 46px on a 360-wide phone
  and larger on every wider one; six columns outrank the 44 below that, his call.
- **P2 — A bigger screen gets more cells, never bigger ones.** The cell stays flat or shrinks as breakpoints grow; it
  never rises from one breakpoint to the next.
- **P3 — The same component stays recognisable.** A 2×2 card is a different physical size wherever the cell differs.
  Keep the swing under about a fifth across the whole config, checked on a 2×2 and a 4×1.
- **P4 — Test real device widths, not the reference box.** The remainder is the tax on a fixed cell, and its worst case
  is nearly `2·(cell + gap)`, because columns arrive in pairs (D26): a pair appears where the box equals
  `n·(cell + gap) + gap` for even `n`. Check that the devices in a range land on the same count, and that the common
  ones sit just above a boundary, never just below.
- **P5 — The gap is texture and edge at once.** Gap over cell is what makes the field read as one lattice across
  breakpoints, so it stays roughly constant; and since the pad is the gap (D15), it is the minimum distance from the
  screen's edge, so it is never smaller than an acceptable page margin.
- **P6 — Rows are capacity.** Columns times rows is what a page holds. Check heights with the browser's chrome taken off
  (about 100px on a desktop) and check the short landscape phone.

The config at the reference boxes and a few real devices:

| Box | bp | cell | cols × rows | margin per side |
|---|---|---|---|---|
| 360 × 800 · small phone | base | 46 | 6 × 12 | 12 × 58 |
| 375 × 667 · iPhone SE | base | 48 | 6 × 10 | 13.5 × 39.5 |
| 390 × 844 · phone | base | 51 | 6 × 12 | 12 × 50 |
| 412 × 915 · Pixel 7 | base | 54 | 6 × 12 | 14 × 67.5 |
| 430 × 932 · big phone | base | 57 | 6 × 12 | 14 × 58 |
| 640 × 960 | sm | 72 | 6 × 10 | 74 × 66 |
| 768 × 1024 · tablet | md | 72 | 8 × 12 | 54 × 14 |
| 1024 × 768 · tablet on its side | lg | 60 | 14 × 10 | 14 × 30 |
| 1440 × 900 · desktop | xl | 60 | 18 × 12 | 78 × 24 |
| 1920 × 1080 | xl | 60 | 26 × 14 | 30 × 42 |
| 2560 × 1440 | xl | 60 | 34 × 18 | 62 × 78 |
| 844 × 390 · phone on its side | md | 72 | 8 × 4 | 92 × 33 |

A desktop at 1440 pays 78px a side because the nineteenth column that fits is dropped to keep the count even (D26);
the twentieth arrives at 1452. A phone on its side is just a wide short box with more columns than rows.

---

## 6. The pager and the turn

**D27 — The pager is a navbar on the bottom row, and the scroll turns the page.** A row of 1×1 cells at the bottom
centre of every field, on every page, drawn by `GridPages` (`GridPager`) — a fixture, never a box on a page. Its cells
are reserved in the model (`pagerCells`): nothing is packed there, and a kept page (D25) is centred in the room above
the row. By default the bar is empty `card` cells — four on a six-cell bar — then the arrows on the last two: forward,
wearing ↓, and back, wearing ↑ (the glyphs are his, set against the hand's direction). At the last page forward is
disabled; at the first, back.

*The turn* is a progress from 0 to 1. **Scrolling up is forward**, and up is the hand's up: fingers moving up the
trackpad or the screen, a wheel rolled towards you — a positive `deltaY`, never negated. The wheel or a finger drives
it by hand; a third of the field's height is one page of travel (`RANGE_OF_FIELD`). As it moves, **only the arrow
follows the hand**: the arrow being turned towards fills by that share, in the reverse colours, and let go short of
half way (`COMMIT_AT`) it settles back. Once the page turns, the fill leaves the way it came — its back edge advances
over the arrow — rather than filling again or pulling back. The fill's two edges are `--grid-turn-fill-front` and
`--grid-turn-fill-back`, written on the pager's bar: a custom property written every frame goes on the narrowest
element that reads it, because it restyles everything under it. A click on an arrow and the keys (D42) play the same
turn; a finger on the field drives it (`touch-none`). The field and the pager never move.

**D29 — The bar is a slot, its width is decided per breakpoint, and the arrows are one molecule placed in it.** The row
the pager occupies is one reserved slot spanning the bar's cells, and its `children` are a `GridLayout` on those cells
(Slots.md S2, S5): each cell is a sub-slot with a slot's own tokens, one page, nothing reserved inside. The width is
the `pager` number per breakpoint in `DEFAULT_GRID_CONFIG`, beside `cell · gap` — six everywhere (D13) — made even,
never below two, so the bar sits on the field's centre line, and never wider than the field (`pagerWidth`). Widening it
takes those cells from the page.

- **The arrows** are one registry entry (`pager-arrows`, 2 × 1) placed in the bar, not hardwired to it. They take the
  turn from context (`useGridTurn`), not props, and their fill reads the bar's custom properties, so they fill wherever
  in the bar they stand.
- **They belong in the bar only.** An ordinary box fades away with its page (D37, D49) and belongs to one page, so an
  arrow there would leave under the finger pressing it and be missing from the next page. A turner elsewhere would
  have to opt out of the fade and be drawn on every page, a second fixture.
- **One bar per layout** (`layout.bar`), never a page's: the bar is the one thing on the field that does not turn, and
  contents that changed between pages would move the arrows under the hand. With no `bar`, `GridPager` draws D27's
  (`defaultPagerBar`), built from the width so a wider bar adds empty cells and keeps the arrows at the end.
- **A bar may leave the arrows out**, and nothing guards it: the wheel, a finger and the keys still turn the page, but
  a phone has nothing to press.

**D35 — A hand that goes on scrolling goes on turning.** Only a fling's decaying tail is ignored, never the hand. Each
wheel event is read against the stream (`readWheel`, `grid-pages.tsx`): a tail is a run of five falls in the events'
size (`TAIL_RUN`), because a fling's momentum only ever shrinks; anything else — a push after a pause (`FRESH_MS`,
120ms), the other way, an event that rises, a steady roll of notches — is the hand. After a turn the tail is dropped
until the hand pushes again. While the page fades away the hand's travel counts towards the next page, and a page of it
turns on, steps no closer than half the fade (`STEP_MIN_SHARE`), never past the first page or the last. The page is
put on the field when the fade is over and the hand has stopped: quiet for 100ms on a trackpad (`SETTLE_MS`), 260ms
after a notch (`NOTCH_SETTLE_MS`; an event of 50px or more is a notch). The stroke that committed a turn counts for at
most half a page more (`FOLLOW_THROUGH`), so one flick is one page. A notch's jump is followed over 40ms (`FOLLOW_MS`);
a finger is not smoothed. Open: whether one notch should be a page — today it is a third of one (his to decide).

**D36 — A bar may number its pages: an arrow at each end, the pages between.** `numberedPagerBar` (`grid-pager.tsx`)
writes it from the bar's width: back (`pager-arrow`, `dir` `down`, wearing ↑) on the first cell, forward (`dir` `up`,
wearing ↓) on the last, and the pages as one block on every cell between (`pager-pages`, D47). Two cells wide it is the
two arrows. Every part reads the turn from context and belongs in the bar for D29's reason. A press on a page turns
straight to it: one turn, however far (`go`). No app's layout uses the numbered bar today; D27's is the default.

**D37 — The turn never shrinks a box.** The boxes do not follow the hand: until a turn commits they stay whole, and
then the page fades away and the next fades in (D49), opacity only. Nothing in a box is ever squeezed, scaled, clipped
or re-laid-out by a turn — never reintroduce a transform or a shrink here. The phase is `data-turn` on the grid's
tracks (`idle · drive · relax · wash · in`; `wash` is the page fading away), so a turn renders no card.

**D42 — ↑ ↓ on the keyboard press the arrows that wear them.** The ↓ key turns forward and ↑ back, as the arrows wearing
those glyphs do; → is forward and ← back. A key a focused component has taken (a menu, a select, a slider and a radio
group all move on ↑ ↓), a key held with a modifier, and a key in a field are left alone. `GridPages`' `keyboard`
(default on) turns the keys off for a page that moves focus with them instead (D45).

**D46 — A page has a title, and the numbered bar shows it.** A `GridPage` has an optional `title` beside its `id`; a
page packed into several on a smaller field gives each its title (`derivePages`), and `GridPages` hands the titles to
the bar. In the numbered bar the page the field is turning to (`coming`, so a hand that goes on turning sees it run
ahead, D35) is grown to two cells, its number on the first and its title after it, filled in the primary, carrying
`aria-current="page"` and read as "Page 2 of 6: Movement". An untitled page reads "Page". A title too wide for its two
cells steps down a role, from `body` to `caption` (Type.md), measured in the numbers' font; it never wraps.

**D47 — The bar's pages move by movement, and the page stands where the pages round it leave room.** The cells between
the arrows show `cells − 1` pages — three on a six-cell bar — sliding to hold the page on the field at their middle and
stopping at the first page and the last (`pagerStart`). On six cells the first page stands on the second and third
cells, a page with pages either side on the middle two, and the last on the fourth and fifth; with only two pages the
second takes the middle. Every page is a one-cell ring with its number on one line, and the page grown to two plays
movement (Motion.md M9) through `useCellMotion` on the `--motion-move-*` tokens, the same hook and model as the
portfolio's tech column: the box it leaves shrinks, the new one grows, the numbers travel shrinking into each border and
growing out of it, rings hand over rather than slide, and pages leaving the block are clipped by it. Under reduced
motion it jumps. Spare cells, with fewer pages than the block holds, are empty `card` cells.

**D49 — No page loads behind a loader.** A page is on the field as soon as the grid has measured it; nothing waits for
the fonts, the window's load or the images, and the wheel, a finger, the keys and the pager turn from the first frame.
A committed turn fades the page away over `TURN_MS` (160ms), then puts the next page on the field and fades it in over
the same, whatever it holds — and the page the hand brings a turn back to fades back in. Under reduced motion the page
swaps at once. The fade is CSS off `data-turn` (globals.css). Loading, his motion (Motion.md M10), plays on the motion
studio's Loading page only; no page loads with it until he names one. The one opening a page may have is the intro
(D50).

---

## 7. Open

- **Which field a layout is authored on, and the packer.** The packer is reading-order first-fit, the "function that
  arranges the components" still to be designed: what it should preserve when a page is repacked onto another field —
  adjacency, relative size, reading order only — is a design question, not a code one. Until it is decided the package
  does not decide it in code, and each app that arranges content data keeps its own copy (`lib/arrange.ts` in the
  showcase, the admin, the login and the portfolio).
- **One notch, one page?** D35.

---

## 8. The pointer and the field's paint

**D34 — The pointer is a ring, and the cell under it is lit.** `cursor` on `Grid` or `GridPages`. The ring is 24px
across, a 2px line on nothing, filled while a button is held (`:active`), its centre the hotspot — and it is **the
system's cursor, drawn from an image** (globals.css, a 2x through `image-set`), over the whole field, a link's hand and
a button's included. The system draws it where the hand is; it is never a div moved on every pointer move, which costs
a whole-page layerize a move and trails the hand. While a slider's head is held (`data-held`) the pressed cursor stays
the ring, and the head goes into it (Motion.md M16).

The cell the pointer is on draws its own dashes — its ring (D40) — lit at once, and a cell it leaves fades back over
500ms (`LIT_FADE_MS`). The cell is found from the field's numbers, never by hit-testing and never through React state:
a move sends the painter (D38) one message when it crosses into another cell. The gutter lights nothing, nor a
square's corners outside its circle, and a cell under a card is lit where the card hides it. While the grid carries
`data-cursor-still` the pointer lights no cell and the ring is still the pointer (the motion studio's focus and mode
stages, whose blur over the field would smear a lit cell). **No glow** round the pointer or its cells. A mouse or a pen
only (`(hover: hover) and (pointer: fine)`); a phone keeps its own.

**D38 — The field is painted, by one painter, off the main thread.** What the grid draws on its field — the overlay's
dashes (`overlay`), the pointer's cell (D34) and the intro's ripples (D50) — is painted on two canvases by one painter
(`lib/grid-field.ts`), started and fed by `useGridField` in `grid.tsx` whenever `overlay`, `cursor` or `intro` is on.
Where the browser can hand a canvas to a worker the painter runs in one, so nothing the page does on its main thread
can stall it; elsewhere it runs on the main thread with the same code. One canvas is the box, for the dashes; the other
is the field and `FIELD_PAD` round it, for lit cells; both are under the page's boxes. The painter keeps its own clock:
a lighting is one message — each cell's delay and the moment it starts — and a cell lit by two passes shows the younger.
Its colours are read off the theme (`readFieldColours`): the dashes `--border` at 70%, the pointer's cell `--violet`,
the ground `--background`. `gridFieldPainter` stays self-contained, because the worker runs it from its own source text.
The rule under it: never animate many elements, from a script or from CSS — paint them, off the main thread.

**D40 — A cell is a circle.** D9's cell is still a square box; the circle is drawn in it. Every cell's dashes are a
ring — the circle through the middle of the cell's outermost pixel ring — in 3px dashes evened out round it, with a dash
centred at the top. The overlay and every lit cell draw it, and the pointer lights a cell only inside its circle.

**D43 — The pointer is violet.** The ring's line and its fill while pressed are `--violet`, baked into the cursor image
as sRGB 146 98 243 (`#9262f3`), because an image cannot read a custom property; change the token, change the image. The
lit cell's ring is `--violet` too, so the ring and the cell it is over are one colour. Violet is about 4 : 1 on the
light theme's white.

---

## 9. The theme

**D28 — The theme falls over the field as a sheet of paint.** Toggling light and dark — the `d` key, or a button, both
through `useThemeToggle` (`theme-provider.tsx`), never `setTheme` — is one beat on the outermost grid on the page
(`GridThemeFlip`, `grid.tsx`). One sheet the size of the grid's box, in the **new** theme's colours from its first
frame (it wears that theme's class; the light tokens sit on `.light` as well as `:root` for this), and **plain**: no
cells drawn on it, because the grid is what the paint reveals. Its bottom edge is a sharp, moving wave of two to five
crests of uneven width and height, drawn afresh at every toggle, drifting sideways and breathing in height as it falls;
its top edge is the same wave turned over. It falls from above until it covers the box, gathering speed
(`power2.in`), the theme is committed underneath, and the sheet dissolves — it is the new page's own background, so its
fade is the content coming through. The numbers are constants in `grid.tsx`: a 0.9s fall (`FALL_MS`), a 0.35s
dissolve (`DISSOLVE_MS`), a 72px wave (`WAVE_H`), two to five crests (`WAVE_CRESTS`), a width of drift every two falls
(`WAVE_DRIFT`), a breath every 0.8s (`WAVE_BREATH`); `FLIP_TEMPO` stretches all of them for watching. GSAP drives it,
one element on a transform and then opacity; the timeline is built once per toggle, and the grid reports only a change
of its size, so a theme switch nudging layout never restarts it. A toggle during a fall is ignored; under reduced motion,
or with no grid on the page, the switch is instant.

---

## 10. The one radius

**D39 — Every corner is one cell's circle: the system has one radius, half the cell.** `--radius` is half the grid's
cell, and every box takes it as `rounded-lg` (a component added from the shadcn CLI arrives with `rounded-none` on its
boxes and is rounded the same way, packages/ui/CLAUDE.md rule 6). The browser shrinks a corner to fit a box's shorter
side, so the one number does the rest:

- **a circle** where a box is a cell or less on both sides: a 1×1 slot, the pager's cells, an icon button, a
  checkbox (a tick in a circle), a radio, an avatar, a chart's swatch, InputOTP's slots;
- **a pill** where it is a cell or less on one side: a button, a badge, a key, a tab, a switch, a menu's item, a
  one-line alert, a slot one cell tall, a field, the slider's bar;
- **a quarter of one cell's circle at each corner** of anything bigger — a card, a dialog, a menu, a popover, a slot of
  two by two or more — the curve of the field's cells (D40), so there is one curve on the page.

*The number.* `Grid` writes its measured cell on its root (`--grid-cell`), and globals.css declares the radius there
again, since a custom property's `var()` resolves where it is declared: on the grid it is exact — 30px on a 60 cell, 36
on a 72, 25.5 on a 390 phone's 51. Off the grid (a dialog or a menu in a portal, an app with no grid) globals.css
reckons the cell the viewport would get from D13's and D33's numbers: `min(72px, (100vw − 84px) / 6)`, and 60px from
`lg`.

*The fields are boxes.* Input, Textarea, the Select and NativeSelect triggers, InputGroup, the Combobox's chips field,
Command's search and the Questionnaire's answer are outlined pills — `rounded-lg`, a 1px `border`, the text a step
inside the ends — and InputOTP's slots are circles. Focus and an invalid value ring the outline; a Textarea grown past
a cell tall takes a cell's curve at each corner. A field has no hover tint; a number field has no spin buttons.

*The slider is a bar.* A pill `--slider-height` tall (8px, globals.css, with the grip's tokens; a subtree may set its
own), its head a circle the bar's height merged into it: the lime and the input's grey meet under the head's centre,
square there, so the lime ends in the head's round end, and there are no gaps at rest. The whole bar is the handle.
Held, the head detaches into the cursor's ring and the bar parts 2px clear round it, its ends rounding; the body
follows the head on a spring (the grip, Motion.md M16; marks, M21). A segment's corners are half the bar, not
`--radius`. The parts are custom properties on the slider (`--slider-bar`, `--slider-head`, `--slider-gap`) and are
placed from the values, never measured.

*Where it does not apply.*

- **Lines are not boxes.** Separators, table rows and a tab's underline keep a straight rule.
- **A `transparent` slot is not rounded.** It has no edge to see, and a round clip would only cut what it holds.
- **A turned square stays square**: the tooltip's and the navigation menu's arrow tips.
- **Joined things round their outer ends only**: a ButtonGroup, a ToggleGroup with no spacing, a calendar's range,
  whose middle days stay square. Sheets and drawers round only the edge that is not on the screen's.
- **The alert's accent is its start border, 2px**, which follows the curve.

*His two exceptions.* A fill inside a box that meets a divider takes **4px**, a step of the spacing scale, on each
corner on the divider, and the box's own radius on the corners on its border (the portfolio's work tabs, Portfolio.md
P4). A picture inset in a box takes the box's radius **less its inset** — `calc(var(--radius) - 8px)` for an 8px inset —
derived from the one radius, never a number of its own (the portfolio's project cards). Otherwise: one radius, never a
second one, never `rounded-none` on a box.

---

## 11. Focus in reading order

**D45 — Where a page opts in, Tab and the arrows move focus in reading order.** On the grid the document's order is
not the screen's: a page's boxes come in the order they were packed, and what is drawn behind the field before all of
it. `useReadingFocus(scope)` (`hooks/use-reading-focus.ts`) puts the keys in reading order over what can take focus
inside `scope`, left to right along a line and then the next line down, as the boxes stand:

- **Tab** is the next stop and Shift+Tab the one before; from nothing focused, the first or the last. Past either end
  the browser takes it on, so focus leaves the page rather than coming round again.
- **The arrows are a game controller's: they only ever move focus**, never turn the page. ← → are the stop before and
  after; ↑ ↓ the line above and below, at the stop nearest across. From nothing focused any arrow lights the first
  stop; at the edges they do nothing. A `GridPages` that opts in sets `keyboard={false}` (D42) and turns by the
  scroll, a finger and the pager, whose cells are stops.
- A line is the stops whose top is above the middle of the line's first, so a stop set down in its box reads with the
  row it stands in. A stop is what the browser would tab to and can be seen: not disabled, not inert, not under
  `aria-hidden`, not transparent.
- A control that moves on the arrows keeps them (a field, a select, a slider, a menu, a radio group), and a key with
  Ctrl, Alt or ⌘, or already taken, is left alone. A key pressed while a grid in the scope turns is dropped, as a game
  drops input through a transition.
- **A group reads after the page where it is marked so** (`data-reading-after`): its stops come after every other stop,
  in reading order among themselves, as a navbar after the content.

It runs in the capture phase, ahead of a component's own keys, so a roving group moves in reading order with the rest of
the page. The portfolio opts in (Portfolio.md P24); nothing else does yet.

---

## 12. The intro

**D50 — The intro is the agents.** A `Grid` with `intro` opens its page with its agents: `introAgents`, a cast of
`IntroAgent`s (an id the boxes name, a character's look, and whether it `bounces`), played by `introActions`, the values
of Bounce, Jump and Dive as he published them (Motion.md M24). With no cast, one agent as the grid's tokens make it.
`GridPages` does not take it. Motion.md M22 has the motion and its numbers (`INTRO_START` in `lib/intro-motion.ts`; its
`--motion-intro-*` tokens are read, and none is in globals.css yet).

- **The page is held.** From the server's first paint (`data-intro="agent"`) the page's boxes are laid out but unseen
  and out of the pointer's way, and what an app draws behind the grid is held with them (`data-intro-held`). When the
  intro hands over (`reveal`) the grid lets go of them all.
- **The cast stands in a row**, a cell each, side by side, centred across the field on its middle row (or the nearest
  row no agent lands in), in a random order. Those that bounce Bounce, each at its own random times, for 2s; the rest
  rest, breathing and blinking. Each sits in a nest a cell of the field — the muted tint in a lime line.
- **Then each Jumps or Dives, at random.** An agent that lands to open boxes ripples as it lands: the two rings of
  cells round its nest light in violet, one pass of the field's painter (D38) an agent, all sent as the intro starts
  and timed on the painter's clock. Every nest and landing is a cell of the field, never a point between cells.
- **One agent in focus.** `introFocus` names the agent whose section is the page's boxes. It lands in the cell
  `introFocusAt` names (1-based, placed as a box is), or else the cell below the section's last row at its centre
  (`introBeside`) — or, where no cell round the section is free, the section's centre, held behind the page. Its
  ripple spreads, and then the section fades in, one Web Animations opacity fade a box. The others Jump or Dive
  straight home, with no ripple.
- **Without `introFocus`, every agent opens its own boxes.** Each box names the agents that open it (`data-intro-by`,
  their ids, the first opening it); an agent lands in the cell at the centre of its boxes, its ripple spreads, it Dives
  home, and its boxes fade in once it is gone.
- **Home** is a cell each, one above the other, centred down the field's last column in the cast's order — or the
  bottom row, side by side, on a field taller than it is wide (`introHome`).
- **The agents stay.** Once the intro is over, `GridIntro` stays mounted (`settled`) and draws them resting at home and
  in focus on whatever field the grid is given. A grid that skips the intro draws them there from the start.
- **A new `introFocus` turns the page by the agents.** The section on the field fades away (`--motion-intro-out`,
  160ms) while its agent Dives home; the grid calls `onIntroFocus` and the page puts the next section on the field; its
  agent Dives from home to its cell, its ripple spreads, and the section fades in. While it turns the grid carries
  `data-intro-turn`, and globals.css holds back any box the agents have not shown. This is the agents' turn, not
  `GridPages`': no bar, no hand-driven progress.
- **`introAct`** (`{ agent, action, key }`) has an agent play one of its actions where it rests, each time `key`
  changes — once the intro is over, while no page is turning and the agent is not in the air.
- **Fixtures.** A `GridItem` carrying `data-intro-fixed` is no box of the page: the intro does not measure it, a turn
  neither fades it away nor in, and globals.css leaves it alone while a page turns. It is hidden while the intro plays
  and there the moment it hands over — something on the field for every page, as `GridPages`' bar is.
- **Once per document load**: a reload plays it, a navigation that mounts another grid does not. Never under reduced
  motion, where the agents are drawn in their cells once, still. A box that changes mid-intro hands straight over.

The portfolio is the one page with an intro: its cast, its sections, where its agent in focus stands and the bounce
on a click are Portfolio.md P24's, and its status pill is a fixture (P25).

---

## 13. Where it lives

| Thing | Where |
|---|---|
| The field: `DEFAULT_GRID_CONFIG`, `GRID_SPACING`, `GRID_REFERENCE_BOX`, `resolveField`, `MIN_COLS`, metrics; the cursor (`useGridCursor`); the painter's host (`useGridField`); the intro's state (`useGridIntro`); the theme sheet (`GridThemeFlip`); `GridItem` | `packages/ui/src/components/grid.tsx` |
| Pages and the turn: `GridPages`, `usePageTurn`, `readWheel`, `TURN_MS`, the keys | `packages/ui/src/components/grid-pages.tsx` |
| The pager: `GridPager`, `defaultPagerBar`, `numberedPagerBar`, `pagerStart`, the arrows and the pages, `useGridTurn` | `packages/ui/src/components/grid-pager.tsx` |
| The registry's entries: `pager-arrows`, `pager-arrow`, `pager-pages` (Slots.md S6) | `packages/ui/src/components/registry.tsx` |
| The slot: fill, inset, alignment, sub-slots | `packages/ui/src/components/slot.tsx` (Slots.md) |
| The model, pure: rects, packing, pages, derivation, `pagerCells`, `resolvePages`, `LEGACY_SHAPES`, a page's `title` | `packages/ui/src/lib/grid-layout.ts` |
| The field's painter: dashes, lit cells, the intro's ripples | `packages/ui/src/lib/grid-field.ts` |
| The intro: `GridIntro`, loaded only when a grid plays it; its plan, pure | `packages/ui/src/components/grid-intro.tsx`, `packages/ui/src/lib/intro-motion.ts` |
| Reading focus | `packages/ui/src/hooks/use-reading-focus.ts` |
| The theme toggle | `packages/ui/src/components/theme-provider.tsx` (`useThemeToggle`) |
| The radius, the cursor image, the turn's fade, the intro's hold | `packages/ui/src/styles/globals.css` |
| Pages as content data, and their packers | each app's `src/content/` and `src/lib/arrange.ts` |

The repo-root CLAUDE.md carries these rules in short form for the harness; when it and this document disagree, fix the
one that is behind.
