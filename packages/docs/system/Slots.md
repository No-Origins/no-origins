# No Origins — Slots

*The layer between the grid and the components. Opened 2026-09-21, the second live `system/` document after
Grid-v2.md, the evening the composer got a palette and he saw it hand him the wrong thing. Bhargav's words are
quoted; the rest is the record of what he decided.*

Companion documents: **Grid-v2.md** (the field a slot sits on; §8 the composer, removed by D30; D21 the box this
document renames), **Brand.md** (upstream of everything visual), **Admin.md §0.5** (a quest was slots on the grid,
until §0.7 removed quests). Rule numbering is this document's own, S1 onward.

---

## 1. What a slot is

**Bhargav, 2026-09-21:** *"I think we should rename grid boxes as slots so that I can place slots and then put these
atoms or molecules into them. To these slots, I should be able to select tokens like padding, margin, alignment, and
filling. I should be able to fill slots with multiple slots or sub-slots."*

A **slot** is a box on the grid — a position and a span, per breakpoint (Grid-v2.md D18) — that holds either **one
component** with its props, or **sub-slots**. It has tokens: a **fill**, a **padding** and an **alignment**. It is the
thing you place, move and resize in the composer; a component never sits on the grid bare, it sits in a slot.
*(Since 2026-09-23 there is no composer, S7: a slot is written in code, as a layout item.)*

This is the layer organisms and templates were waiting for. A card is a slot holding sub-slots for a heading, a
paragraph and a button. A section is a slot holding those. Nothing above the grid needs a second mechanism.

---

## 2. The rules

**S1 — A component goes in a slot; a slot goes on the grid.** The palette (Grid-v2.md D19, amended below) offers
components — an `Input`, a `Button`, a `Card` — not specimens. Dropping one on empty cells makes a slot holding it;
dropping one on a slot puts it in that slot. *"If I want to add an Input atom, I should be able to add an Input atom.
It gives me a card that tells me that it is an Input, the explanation of it and all the different states of it. That is
not what is expected."* The showcase's specimens stay what they are, documentation; they are not building blocks.
**Withdrawn in part 2026-09-23 (S7).** The palette and the drops went with the composer; that a component goes in a
slot, and that a specimen is documentation and not a building block, stand.

**S2 — Sub-slots sit on the same cells.** A slot spanning 6 × 4 is a 6 × 4 field for its children, with the parent's
cell and gutter. No second coordinate system: everything, at every depth, snaps to the one grid (Grid-v2.md D1). A
slot holding sub-slots has **no padding** — its children's own padding does that work — because a padded parent
would pull its children off the cells.

**S3 — A slot's tokens are fill, padding and alignment; there is no margin.** *Recommended and accepted 2026-09-21.*
On the grid the gutter is the margin (Grid-v2.md D15), and a slot pushed off its cells no longer snaps. Air comes from
padding; the gap between sub-slots is the gutter, already decided per breakpoint.

| Token | Values | Default |
|---|---|---|
| `fill` | `transparent` · `background` · `muted` · `card` (Grid-v2.md D21, unchanged) | `transparent` |
| `inset` | a step of the spacing scale, `0 · 4 · 8 · 12 · 16` | `0`; `12` for `muted` and `card` |
| `alignX` | `start` · `center` · `end` · `stretch` | `stretch` |
| `alignY` | `start` · `center` · `end` · `stretch` | `stretch` |

Alignment is of the **component** within the slot. `stretch` makes it fill the slot; anything else lets it take its
own size and places it. A slot holding sub-slots ignores alignment: its children are placed by coordinate.

**S4 — A component has default props, and a few of them are editable.** *Recommended and accepted.* The registry
(§3) gives every component a default span and default props, and the composer's inspector shows the props that change
what you see — text, a variant, a placeholder — one field each. It grows as components get used; it does not start as a
full schema per component, which v1 had and which took weeks (Scene-Schema.md). **Withdrawn 2026-09-23 (S7).** The
inspector is gone, and a registry entry carries no default span or props; a placed component's props are written in
its layout item (`component.props`).

**S5 — A slot's children are a layout, authored per breakpoint like everything else.** *Recommended and accepted.*
`children` is a `GridLayout`: pages authored per breakpoint on the slot's span at that breakpoint, deriving where
they are not (mobile-first, Grid-v2.md D22). A slot's children on another breakpoint follow Grid-v2.md D25: kept and centred in the slot when
they fit, packed only when they do not — **with nothing reserved**: one page only, a slot does not turn pages, so no corner is held for a pager. (The
first build reserved it, and a slot's heading vanished on every narrow field — his report, 2026-09-21.) A child that
still does not fit is not shown; the slot is too small, and the composer should say so — §6.

*The pager's bar is this rule's first fixture.* Since Grid-v2.md D29 the bottom row is a reserved slot whose children
are the bar's cells, authored the same way — which is why nothing reserved inside a slot matters: the bar is one page
and does not turn, even though turning pages is what it is for. It hangs off the layout (`layout.bar`) rather than off
a page, because there is one bar for every page of a layout.

**S6 — The registry lives in the package, and loads lazily.** *Recommended and accepted.* It belongs to the design
system, so the admin's composer reads the same list as the showcase's. Each entry loads its component on first
render, so a page that renders an exported layout with one `Input` in it does not pull all sixty components.
**Amended 2026-09-23 (S7).** Still in the package and still lazy; it is no longer a palette's source — neither
composer exists — and it holds one entry, the pager's arrows.

**S7 — Slots are written, not placed: the composer and its palette are gone.** *2026-09-23: "And also let's remove
the Composer feature completely and all the dead code." And: "remove showcase /composes, admin's too and also quests
feature."* Both composers went (Grid-v2.md D30, Admin.md §0.7), and with them everything here that was about placing
a slot by hand: the palette and its drops (S1), the inspector and its editable props (S4), the registry as the
palette's source (S6), and all of §4 — Add, drop-into, the Slot inspector, focus by dimming, double-click in,
entering a slot, Export. Withdraws S4 and §4 whole, and S1 and S6 in part.

The registry keeps `Placed` and one entry, the pager's arrows (`pager-arrows`, Grid-v2.md D29). An entry is a `kind`
and a lazy view — no name, group, span, props or defaults, which were the palette's and the inspector's. What stands
is the model: a layout item carries `slot`, `component` and `children` (S1's first half, S2, S3, S5), `SlotContent`
renders any of them with no custom `renderItem`, and the pager's bar is still a slot whose cells are sub-slots (D29).
A slot is written in code, as a layout item; today the one that is written is the bar (`defaultPagerBar`).
`SlotInset` now derives from `GRID_SPACING` rather than repeating its five steps, so the inset and the gutter draw
from one list (S3).

---

## 3. The registry

`packages/ui/src/components/registry.tsx`. One entry per component the palette offers:

**Withdrawn 2026-09-23 (S7).** An entry is now a `kind` and a lazy view, and there is one: the pager's arrows, last
paragraph below. The shape and the first cut that follow are the record of the palette's registry.

```
kind      "input"                         the id a placed slot names (`component.kind`)
name      "Input"                         what the palette shows
group     "atom" | "molecule"             the palette's headings
span      { colSpan: 4, rowSpan: 1 }      the slot a fresh drop makes
props     [{ key, label, kind: "text" | "select", options?, default }]   what the inspector edits (S4)
render    (props) => ReactNode            the component, given its props — lazy
```

The first cut registers **Text** (Type.md — the text, its role, tone and alignment), the eighteen atoms and the
molecules that stand on their own with a few props: Card, Alert,
Accordion, Tabs, Breadcrumb, Pagination, ButtonGroup, ToggleGroup, Field, InputGroup, Empty, Item, Calendar, Table. The
ones that need a trigger and a portal (Dialog, Sheet, Drawer, the menus, Popover, Tooltip, HoverCard) are in the
system but not in the palette yet — in a slot they would show only their trigger, and what that should look like is a
question for when one is needed.

**The pager's arrows** join as one entry, span 2 × 1 (Grid-v2.md D29). It is the first registered component that
reads the grid rather than only its props — the turn comes from context, not from the inspector. It is offered inside
the pager's bar only, and the reason is the turn, not the wiring: an ordinary slot is clipped as the page turns, so an
arrow placed on a page would cut itself away under the finger pressing it and then leave with the page. What a
floating turner would cost is written in D29.

---

## 4. In the composer

**Withdrawn 2026-09-23 (S7).** The composer is gone, and every gesture below with it. A slot is written in code; the
list is kept as the record of how placing by hand worked.

- **Add** offers, in order: **Slots** (an empty slot in each fill), **Atoms**, **Molecules**. Drag onto cells for a new
  slot there; drag onto a slot to put the component in it (or, if the slot already holds sub-slots, to add a sub-slot
  at that cell); click to add at the first free cell. Only a slot takes a drop — one of a page's specimen boxes refuses.
- **A slot dragged onto a slot goes into it** as a sub-slot, at the cell it was dropped on; the target lights up while
  you hover. A slot holding a component takes nothing — clear it first. (His report that "nothing goes into a slot",
  2026-09-21: the move was being refused as an overlap, as D4 says; dropping in is its own gesture now.)
- **Slot** (the inspector, on the selected slot): fill, inset, alignX, alignY; a **Component** picker for putting a
  component in without dragging; the component's editable props; **Enter** to edit its sub-slots; **Clear** to empty it.
- **Focus is shown by dimming, and double-click goes in** (his idea, 2026-09-21: *"make the other cards slightly
  opaque so that the focus remains on where they are working; when I double-click it, we can just edit right there"*).
  With a slot selected, everything else drops to 60%; inside a slot, the rest of the page drops to 25%. Never on
  hover — the cursor is not the thing being worked on. **Double-click** a slot that is empty or holds sub-slots to go
  in and edit them where they are; double-click a slot that holds a component to open its props. **Escape** goes up a
  level (or clears the selection first), and so does double-clicking the dimmed field outside the slot. One level at a
  time: grandchildren are one more double-click away, because a drag must always know which level it belongs to.
- **Entering a slot** makes it the field: the composer shows the slot's cells at the slot's size and its children are
  the boxes, with a crumb above to go back up. Everything that works on a page — drag, resize, Span, Add — works
  inside a slot, on the same cells (S2).
- **Export** (Grid-v2.md D20) carries slots, components and children recursively in the `GridLayout` block.

---

## 5. What this changes upstream

- **Grid-v2.md D19** — the palette holds *components*, not specimens. Amended there.
- **Grid-v2.md D21** — `GridBox` is `Slot`; the four kinds are its `fill`. Amended there.
- **Grid-v2.md §7 "What sits on the grid"** — answered: slots. Organisms and templates are slots with sub-slots.
- **Admin.md §0.5** — the quest composer's stub palette becomes the registry, and a molecule's "default box size" is
  its registry span.

*Since 2026-09-23 (S7) the first and last of these are moot: D19 is withdrawn (Grid-v2.md D30), and the quest composer
went with quests (Admin.md §0.7). The middle two stand.*

---

## 6. Open

- **Overflowing children.** A sub-slot that does not fit its parent's field on some breakpoint is dropped silently
  from the render. The composer should flag it, as it flags overlaps. *Still open since S7, with no composer to flag
  it in.*
- ~~Editing sub-slots in place~~ — done by double-click and dimming (§4), 2026-09-21. *Withdrawn with §4, 2026-09-23
  (S7).*
- **Components that are triggers** (S3's list). Their slot shows the trigger; whether the slot should also say what
  opens is undecided.
- **Slots as named organisms** — saving a slot with its children under a name so it can be placed again whole. This is
  the organism library, and it is the next document once a few have been made by hand.

## 7. Where it lives

| Thing | Where |
|---|---|
| `Slot`, its fill/inset/alignment, and `SlotContent` (a component or children on the slot's cells) | `packages/ui/src/components/slot.tsx` |
| The registry — `Placed` and one entry, the pager's arrows (S7) | `packages/ui/src/components/registry.tsx` |
| The model: `slot`, `component`, `children` on a layout item | `packages/ui/src/lib/grid-layout.ts` |
| The one slot written today: the pager's bar, `defaultPagerBar` (Grid-v2.md D29) | `packages/ui/src/components/grid-pager.tsx` |
| ~~Where slots are placed~~ | ~~`apps/design/src/app/composer/page.tsx` → `design.no-origins.com/composer`~~ — deleted 2026-09-23 (S7) |
