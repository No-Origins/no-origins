# No Origins — Slots

The layer between the grid and the components: what a box on the grid is, what it holds, its tokens, and the registry
of components a layout can name.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

Companion documents: **Grid.md** (the field a slot sits on; D21 its four fills), **Brand.md** (upstream of everything
visual), **Type.md** (a `Text` in a slot). Rule numbering is this document's own, S1 onward.

---

## 1. What a slot is

A **slot** is a box on the grid — a position and a span, per breakpoint (Grid.md D18) — that holds either **one
component** with its props, or **sub-slots**, or nothing. It has tokens: a **fill**, a **padding** and an
**alignment**. A layout item carries `slot`, `component` and `children`, and `SlotContent` renders any of them with no
custom `renderItem`.

A card is a slot holding sub-slots for a heading, a paragraph and a button; a section is a slot holding those.
Organisms and templates are slots with sub-slots: nothing above the grid needs a second mechanism.

---

## 2. The rules

**S1 — A component goes in a slot; a slot goes on the grid.** The showcase's specimens are documentation, not
building blocks: what a slot holds is a component — an `Input`, a `Button`, a `Card` — not a card describing one.

**S2 — Sub-slots sit on the same cells.** A slot spanning 6 × 4 is a 6 × 4 field for its children, with the parent's
cell and gutter. No second coordinate system: everything, at every depth, snaps to the one grid (Grid.md D1). A slot
holding sub-slots has **no padding** — its children's own padding does that work — because a padded parent would pull
its children off the cells.

**S3 — A slot's tokens are fill, padding and alignment; there is no margin.** On the grid the gutter is the margin
(Grid.md D15), and a slot pushed off its cells no longer snaps. Air comes from padding; the gap between sub-slots is the
gutter.

| Token | Values | Default |
|---|---|---|
| `fill` | `transparent` · `background` · `muted` · `card` (Grid.md D21) | `transparent` |
| `inset` | a step of the spacing scale, `0 · 4 · 8 · 12 · 16` (`SlotInset`, from `GRID_SPACING`) | `0`; `12` for `muted` and `card` |
| `alignX` | `start` · `center` · `end` · `stretch` | `stretch` |
| `alignY` | `start` · `center` · `end` · `stretch` | `stretch` |

Alignment is of the **component** within the slot: `stretch` makes it fill the slot; anything else lets it take its
own size and places it. A slot holding sub-slots ignores alignment and inset: its children are placed by coordinate.

Every slot fills its span and **clips**: nothing on the grid scrolls (Grid.md D3), so a component that is cut off is in
a slot that is too small. A component that is already a box (a `Card`) goes in a `transparent` slot, inset 0, stretch,
so the slot is invisible round it and the card's own border shows.

The three surfaces — `background`, `muted`, `card` — are **round**: the system's one radius, half a cell (Grid.md
D39), so a 1×1 surface is a circle, one a cell tall a pill, and a bigger one has a cell's curve at each corner, and the
slot clips to it. `transparent` is not rounded: it has no edge to see, and a round clip would only cut its contents at
the corners. There is no radius token — one radius is the rule.

**S4 — A placed component's props are written in its layout item.** `component: { kind, props }`. A registry entry
carries no default span and no default props: a layout says what it places, at what size, with what props.

**S5 — A slot's children are a layout, per breakpoint like everything else.** `children` is a `GridLayout`: pages
authored per breakpoint on the slot's span, deriving where they are not (mobile-first, Grid.md D22) and, on another
breakpoint, kept and centred in the slot when they fit and packed only when they do not (Grid.md D25) — **with nothing
reserved**: one page only, because a slot does not turn pages, so no row is held for a pager (`resolveSubSlots`). A
child that still does not fit is not shown; the slot is too small.

The pager's bar is a slot of this kind: the bottom row is a reserved slot whose children are the bar's cells (Grid.md
D29), one page that does not turn, hung off the layout (`layout.bar`) rather than a page, because there is one bar for
every page of a layout.

**S6 — The registry lives in the package, and loads lazily.** It belongs to the design system. Each entry loads its
component on first render, so a page that renders a layout does not pull every component.

**S7 — Slots are written, not placed.** A slot is written in code, as a layout item, or arranged at runtime from spans
by an app's packer. Nothing places, moves or resizes one by hand: there is no palette, no inspector and no composer
(Grid.md D30).

---

## 3. The registry

`packages/ui/src/components/registry.tsx`: the components a layout item can name by `kind` (`component.kind`), drawn by
`Placed`. An entry is a `kind` and a lazy view — no name, group, span or props. A kind with no entry draws itself as
`kind?` in the destructive colour rather than rendering nothing.

There are three entries, the pager's parts, and all three belong in the pager's bar only (Grid.md D29):

| Kind | What | Grid.md |
|---|---|---|
| `pager-arrows` | forward and back as one molecule, 2 × 1 | D27, D29 |
| `pager-arrow` | one arrow on one cell, `dir` `up` (forward) or `down` (back) | D36 |
| `pager-pages` | the pages between the arrows, one block that plays movement, `cells` wide | D46, D47 |

Each reads the turn from context (`useGridTurn`), not from its props. A component joins the registry when a layout
needs to name it.

---

## 4. Open

- **Overflowing children.** A sub-slot that does not fit its parent's field on some breakpoint is dropped silently from
  the render; nothing flags it.
- **Components that are triggers.** A Dialog, Sheet, Drawer, a menu, Popover, Tooltip or HoverCard in a slot would show
  only its trigger; whether the slot should also say what opens is undecided.
- **Slots as named organisms** — saving a slot with its children under a name so it can be placed again whole. This is
  the organism library, and it is the next document once a few have been made by hand.

---

## 5. Where it lives

| Thing | Where |
|---|---|
| `Slot`, its fill, inset and alignment, and `SlotContent` (a component or children on the slot's cells) | `packages/ui/src/components/slot.tsx` |
| The registry — `Placed` and the pager's three parts | `packages/ui/src/components/registry.tsx` |
| The model: `slot`, `component`, `children` on a layout item; `SlotFill`, `SlotInset`, `resolveSubSlots` | `packages/ui/src/lib/grid-layout.ts` |
| The slots written in the package: the pager's bars, `defaultPagerBar` and `numberedPagerBar` | `packages/ui/src/components/grid-pager.tsx` |
