# No Origins — Motion

*How the design system moves, and the motion studio where that is decided. The rules are this document's own, M1
onward.*

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

Companion documents: **Brand.md** (§6, principles 3, "play without noise", and 5, "same tokens, type, motion and
components everywhere"; §8's motion line), **Grid.md** (the grid's own motion: the turn, D27 and D37; the theme's
sheet, D28; the pointer, D34; the intro, D50), **Slots.md** (the studio's jigs are slots), **Type.md** (every piece of
text in the studio is a `Text`), **Orbit.md** (what an agent looks like; this document has how it moves), **Status.md**
(where the liquid plays).

---

## 1. What it is

Motion is designed in the **motion studio**, `apps/motion` (M1). It is a lab built from the design system: every
number a component moves by has a control, and the real component plays under it (M2). What he decides there becomes a
token in `globals.css` (M3, M7). The agents' actions are the exception: they become published versions in the
database (M24).

## 2. What moves today

| Motion | Where its numbers live | What plays it | Whose |
|---|---|---|---|
| Surface, panel, state, disclose, grow (M4) | `--motion-*` in globals.css | every component that arrives, slides in, changes state, opens in place, or grows (`Progress`) | shadcn's, Tailwind's and tw-animate's defaults, GSAP's power3 for grow; none his yet |
| Movement (M9) | `--motion-move-*` in globals.css | the portfolio's tech column and status pill, the numbered pager bar, the studio | his |
| Loading (M10) | `--motion-load-*` in globals.css | the studio's Loading page only (Grid.md D49) | his |
| Enter · exit (M11) | `--motion-move-enter-*`, not in globals.css | the studio only | undecided |
| Hyper focus (M13), focus mode (M14) | `--motion-focus-*`, `--motion-mode-*` in globals.css | the studio only (Portfolio.md P21) | his |
| Grip (M16) | `--motion-grip-*` and `--slider-height` in globals.css | every `Slider` | his |
| Steps (M21) | `--motion-step-*`, `--slider-mark-*`, not in globals.css (`STEP_START`) | a `Slider` with `marks`: the studio and the showcase | version 1 |
| Liquid (M25) | `--motion-liquid-*`, not in globals.css (`LIQUID_START`) | `Liquid`: the status page, the showcase, the studio | version 1 |
| The agent's motion settings (M17, M23) | `SPHERE_START`; `--motion-sphere-*` on the studio's stage | every agent, under every action | his version 15 |
| The agents' actions (M24) | the database: `studio_items` of kind `action` and their versions | the studio's Agents page; the portfolio's intro, from a copy | his, published |
| The intro (M22) | `INTRO_START`; `--motion-intro-*`, not in globals.css | the portfolio | his 2s gather; the rest mine |
| The farewell (M4) | `--motion-farewell-*` in globals.css | Home, at the tour's end | Home's; not on the bench |
| The grid: the turn, the theme's sheet, the lit cell | module constants: `TURN_MS` (`grid-pages.tsx`), `FALL_MS`, `LIT_FADE_MS` (`grid.tsx`) | every grid | Grid.md |
| Ambient: skeleton pulse, spinner | Tailwind's `animate-pulse`, `animate-spin` | `Skeleton`, `Spinner` | Tailwind's (§5) |
| The portfolio's HEY! | `hey-overlay.tsx`, GSAP | the portfolio | the app's, not the system's |
| A human figure's walk and run | `--motion-human-*` in globals.css (`lib/human-motion.ts`) | Orbit's `/hiddenstack` | starting values. Open: his |

## 3. The rules

**M1 — The studio is its own app.** `apps/motion`, at `motion.no-origins.com`, on `:3004`. The showcase shows what a
component **is**; the studio shows how it **moves**, and lets him change it. It is a lab, not a catalogue, and not
Storybook ("too heavy"). It is built only from `@no-origins/ui`, like every app.

- **It is behind the one sign-in.** Its `proxy.ts` calls `authGate` with the permission `motion.open` (Access.md A3,
  A6). An account that holds `motion.open` alone (a Member, Access.md A4) tries every control and saves nothing. A
  development server with no Supabase keys opens without a sign-in, so the review sweep and CI see it. Production never
  opens without them.
- **What it keeps, and where.** The agents' actions, their drafts and published versions, are in the admin's database
  (the `studio_*` tables, M20, M24). Everything else is in the browser under `no-origins:motion`: each family's values,
  the specimen's options, the tempo, the loop, the hold, and where the jigs stand. Nobody but the viewer needs it.

**M2 — The studio plays the real motion, never a copy.** Everything on the stage is the package's own component or
model, reading its numbers from the motion layer (M3). A jig moves those numbers and nothing else. A pick made on a
replica would drift from the thing it copies and have to be carried across by hand.

**M3 — Motion is tokens, in the one stylesheet.** Every number a component moves by is a `--motion-*` custom property
on `:root` in `globals.css`, and the value written there **is** the decision (packages/ui rule 2). CSS reads the tokens
through Tailwind:
- `motion-surface` and `motion-panel`, two `@utility` rules for the in and out timing of a surface;
- `zoom-in-(--motion-surface-scale)` and `slide-in-from-top-(length:--motion-surface-shift)`;
- Tailwind's own `transition-*` and tw-animate's accordion and collapsible, remapped in `@theme inline` so that their
  defaults are the tokens.

Script reads them through `lib/motion.ts`, off its own element: `motionMs`, `motionNumber` and `motionEase`.
`motionEase` turns a CSS easing into a function GSAP can take. Durations are in ms. Eases are CSS easing strings, a
keyword or a `cubic-bezier()`. Never write a literal `duration-*` or `zoom-in-95` on a component: name the token.

A token overridden on a subtree moves only that subtree. That is how the studio's stage plays a tuned motion while the
jigs round it keep the decided one. A motion still being designed has no tokens in globals.css. Its model reads its
`--motion-*` names off its element and falls back to its `*_START` constant, which holds the values it is designed
from.

**M4 — Motion is in families, named for what the motion is for.** A new component joins a family rather than getting
numbers of its own.

| Family | What it is for | Tokens |
|---|---|---|
| **surface** | Something arrives over the page and leaves: dialog, alert dialog, popover, dropdown and context menus, menubar, tooltip, hover card, select, combobox | `--motion-surface-in` 100ms · `-out` 100ms · `-ease-in` `ease` · `-ease-out` `ease` · `-scale` 0.95 · `-shift` 0.5rem |
| **panel** | A panel slides in from an edge: the sheet, and the drawer's scrim | `--motion-panel-in` 200ms · `-out` 200ms · `-ease-in` `ease-in-out` · `-ease-out` `ease-in-out` · `-shift` 2.5rem |
| **state** | A control changes in place: hover, press, checked, selected | `--motion-state` 150ms · `--motion-state-ease` `cubic-bezier(0.4, 0, 0.2, 1)` |
| **disclose** | Content opens in place: accordion, collapsible | `--motion-disclose` 200ms · `--motion-disclose-ease` `ease-out` |
| **grow** | A value grows into place, then moves to the next one: `Progress`'s `animate` | `--motion-grow` 900ms · `--motion-grow-change` 400ms · `--motion-grow-ease` `cubic-bezier(0.215, 0.61, 0.355, 1)` |
| **move** | One-cell elements move when one grows (M9); one element entering and exiting (M11) | `--motion-move-*`, `--motion-move-enter-*` |
| **load** | A page's sections load out of rings (M10) | `--motion-load-*` |
| **focus** | Hyper focus (M13) | `--motion-focus-*` |
| **mode** | Focus mode (M14) | `--motion-mode-*` |
| **grip** | The slider's head and body (M16) | `--motion-grip-*`, `--slider-height` |
| **step** | The slider's marks (M21) | `--motion-step-*`, `--slider-mark-*` |
| **liquid** | A box filled to a level (M25) | `--motion-liquid-*` |
| **sphere** | The agent (M17, M23, M24) | `--motion-sphere-*` |
| **intro** | The grid's intro (M22) | `--motion-intro-*` |
| **farewell** | Home's closing sequence | `--motion-farewell-*` |

The first five are the values shadcn, Tailwind and tw-animate shipped, lifted out of twelve class strings so they can
be tuned at all. None of them is his yet, and none is on the bench (M9). A family has one curve.

**The farewell** is Home's (Home.md), played by `useFarewellMotion` on one GSAP timeline:
- At the tour's end the Plan's box moves to its place as one compositor transform over `--motion-farewell-plan-in`
  (1200ms). Its start scale matches the content's fit in the box before, and the canvas is refitted once before paint,
  never animated.
- The hero comes in over `-in` (1200ms) on `-ease` (`cubic-bezier(0.22, 1, 0.36, 1)`), rising `-shift` (16px).
- The destinations follow `-links-delay` (500ms) after it settles, each over `-links-in` (700ms), `-links-stagger`
  (90ms) apart, rising `-links-shift` (8px).
- Under reduced motion it settles at once and keeps only the links' delay.

**M5 — The stage is transparent, and it holds its own surfaces.** The stage is a `transparent` slot, so the field's
cells show through it and a specimen stands on the field's own cells. The stage starts on a cell, so an element placed
a whole number of pitches in from its corner is on the grid. The stage is a containing block (`contain: layout paint`,
except for hyper focus and focus mode, M13) and hands its element to `PortalContainer` (M8). So a dialog opens over the
stage and not the viewport, a sheet slides in from the stage's edge, a menu is clipped at the stage's corner, and the
overrides a jig makes on the stage reach the portalled surfaces too.

**M6 — What a jig is.**

- **Each control lives with what it is about, the same on every motion.** How a play runs is on the timeline: Play,
  Loop, Tempo, and every phase whose length is a setting. What plays is on the specimen's jig, **Scene**: first its
  block's **Columns and Rows** (`block` in `families.ts`, trimmed to the stage), then the family's own options
  (movement's flow, → along rows or ↓ down columns; loading's layout and sections). The motion is the tokens. The
  specimen's options and the play's settings never go into the settings Copy hands back.
- **One rhythm.** Everything in a jig is 12px apart down. A control is its label with its value right after it, in its
  unit; a one-line caption where it has one; then the control. Every control says what it moves.
- **The timeline is the transport,** a row under the stage, drawn as his player:
  - its first line holds ↺ (from the start) in an outline circle and play or pause (from the playhead) in a lime one,
    the time so far, Loop (a switch) and Tempo (1× · 2× · 5× · 10×, a select). Tempo slows the stage and nothing else,
    and never goes into the settings;
  - its second line is a `Slider` across one play, lime with a violet thumb, over the play's phases. The phases are
    pills side by side, each as long as it lasts and labelled with its ms, the one the playhead is in tinted. A violet
    line runs from the thumb down through them. The slider and the phases are one axis;
  - drag the slider, or click along it, and the stage holds that frame;
  - **a phase that is a setting is dragged** by its grip: the hold on every motion but the actions (200–3000ms in
    50ms steps, real time) and loading's page time (500–6000ms in 100ms steps, slowed by the tempo). The timeline
    keeps its scale for the drag, and the arrows step it;
  - **live**, when no play holds the stage, the stage is its own: a hover moves movement's block, and the loader turns.
    A play that ends goes live; a loop wraps instead. The playhead is a store that only the timeline and the stage's
    painter read every frame.
- **How a family starts.** A family designed since 2026-09-30 is designed **version by version**, his rule: it has one
  start, its version's values, and the head says "Version N" where a preset select would stand. Reset goes back to the
  version. Copy hands his tuning back, headed with the version, and his tuning is the next version's start. The older
  families (movement, loading, enter · exit, hyper focus, focus mode and the grip) offer five presets, A to E, each with
  its reason and how it could fail (`content/`). A is "Today", read off the page, where the family's tokens are in
  globals.css. **Open:** whether the older families keep their presets.
- **Copy** prints every token of the family, on whichever jig, as the CSS lines that would go into `globals.css`.
  **Reset** puts the decided values back.

**M7 — A pick becomes the default.** When he sends settings back, their values replace the family's tokens in
`globals.css` verbatim, and the package's fallback constant takes the same values. The studio never copies a decided
value: it reads it off the page's root, so a committed pick is "Today" with no second edit. Nothing in the studio
writes to the package. A pick travels as he sends it, and is committed. The agents' actions are the exception: they are
published from the studio into the database (M24).

**M8 — Portals take their container from context.** `components/portal.tsx`: `PortalContainer` gives a subtree an
element for its surfaces to portal into, and `usePortalContainer()` reads it. Every component that portals passes it
through: dialog, alert dialog, sheet, drawer, popover, tooltip, hover card, the dropdown and context menus, menubar,
select and combobox. With no container, a portal goes to `document.body`. It is a rule-6 edit (packages/ui CLAUDE.md),
and each file says why.

**M9 — The bench holds only what he names, and the first is movement.** Nothing goes on the studio's bench until he
names it. The bench is Movement, Loading, Enter · exit, Hyper focus, Focus mode, Grip, Steps, Liquid and Agents. The
component families (M4's first five) are not on it.

**Movement** is how one-cell elements move when one of them grows.

- **The specimen.** Elements on the field's cells fill a block of Columns × Rows, one to six each way, three in a row
  to start, flowing along rows or down columns. Each cell is a 1px ring holding a lime dot, half the cell less a step
  of the spacing scale. **Only the active element's ring is lime**; the rest wear the system's hairline. Hover a cell
  and it grows to two along the flow. Every element after it moves one cell on and wraps at a line's end. A grown
  element with no room left in its line starts the next line. The block keeps one spare line. The hover is read from
  the cell under the pointer and where the elements are going, so a block pushed under a still pointer does not hand
  the hover on.
- **The dot's size follows where it is, not the clock** (`dotScale`). It is whole at a cell's centre and smallest at the
  middle of the gutter, on a smoothstep from `-dot-from` of the way out. So a move interrupted half way turns round
  where it stands and still reads right.
- **A dot is seen only on the cell it leaves and the cell it reaches** (`travelScale`). Going further, it drowns once,
  is drawn over no cell between, and floats up once. A dot that changes lines goes by `-wrap`: **overflow** (out past
  its line's end, in at the next line's start), **travel** (straight across, unseen), or **fade**.
- **The rings never move, only the dots.** A ring is a cell. When its element moves on, the new cell lights in the first
  half of the move and the old goes out in the second. The active ring glides the one edge that grows or gives back.
- **The model is the package's.** `lib/cell-motion.ts` is pure (`flowSpots`, `stateOf`, `dotScale`, `travelScale`,
  `cellMoves`, `cellMotionFrame`, `cellMotionTotal`, `readCellMotion`). `hooks/use-cell-motion.ts` (`useCellMotion`)
  plays it, one GSAP clock a change, each frame written onto the elements by the caller's painter. Under reduced motion
  it jumps; the studio's stage passes `always`.
- **What plays it:**
  - the studio's stage;
  - the portfolio's tech column (Portfolio.md P4). The hovered or selected mark grows by its name, as many whole cells
    as its mark and name need. The name rides a step after its mark inside the ring, which clips it, and fades in with
    the ring's lime. The other marks have no ring;
  - the portfolio's status pill (Portfolio.md P25), mirrored, growing left;
  - the numbered pager bar, where the page grows to spell its title (Grid.md D47).

**Decided, his (2026-09-27), in globals.css:**

```css
--motion-move-duration: 400ms;
--motion-move-stagger: 20ms;
--motion-move-wrap: overflow;
--motion-move-ring-ease: cubic-bezier(0.215, 0.61, 0.355, 1);
--motion-move-dot-ease: cubic-bezier(0.215, 0.61, 0.355, 1);
--motion-move-dot-min: 0;
--motion-move-dot-from: 0;
--motion-move-dot-lag: -0.1;
```

Both curves are cubic out. The dot is gone at a border (min 0, from 0) and sets off a tenth of the move before the cells
change (lag −0.1). Each element sets off 20ms after the one before it, outward (a negative stagger runs inward).

**M10 — Loading: a square of rings that go to their sections and open.** Decided (his, 2026-09-27). **No page loads
with it** (Grid.md D49): it plays on the studio's Loading page only, kept whole until he names a page for it.

- **The specimen.** A page of one to eight `Card`s, packed in reading order into the block the jig's Columns and Rows
  set. Layout is **Sample** or **Random**. Every press of Random deals a new page from a seed shown on the jig, so a
  layout survives a reload. A random section is up to 4 × 3, at a random free place that shares an edge with one
  already down. Live, the page is loading. On the timeline a play is loading for the page's loading time, then the
  expansion, then the page held.
- **The square.** While it loads, one lime ring per section stands at the stage's centre, each a cell, 1px, dashed
  (`LOAD_DASHES`, twelve round a cell, half dash and half gap). The rings make a block as near a square as can be: as
  many rows as the side of the smallest square that holds them all, and as few columns as fill those rows, so it is
  never wider than tall (ten stand as 3, 3, 3, 1). The block is filled in reading order, a row that is not full centred
  under the rest.
- **The turn never stops** (`-turn`, `-lap`). **Spin**: each ring's dashes go round. **Gears**: neighbours turn opposite
  ways. **Chase**: a closed ring goes round the square clockwise, handing over as movement's rings do. **Relay**: one
  ring at a time turns once round. The lap is speed and nothing else: the page is ready when it is ready.
- **When the page is ready:**
  - **Press, all at once.** Every ring is pressed to 0.5 (`LOAD_PRESS`, his) over `-press`, its dashes closing into a
    full circle as it shrinks. Pressed, it is movement's dot at rest.
  - **One move of movement's dot, all landing at once.** Each ring goes straight from its cell to its section's
    top-left cell, on movement's `-dot-ease` and `--motion-move-duration` however far it goes, sized by where it is
    (`travelScale`). It is unseen between its two cells. A ring with nowhere to go stays pressed until the rest land.
  - **Release, together, into a plain border.** Every ring grows back to its cell over `-press`, its lime turning into
    the plain `--border` a section wears.
  - **Each section opens** from its cell out to its edges, **smooth** or **by whole cells** (`-open`), over `-duration`,
    on movement's ring ease. The section is clipped to its ring's box and comes in over the last `-reveal` of the
    opening, while the ring's border fades into the section's own, or into none.
  - **Nothing crosses.** A section waits to open until every ring still to pass through its box, seen, has left it.
- **Loading borrows movement.** Its travel's curve, duration and size, and the one curve for the press, the release
  and the opening, are movement's (`borrows` on the family), read off the page and tuned on movement's page. Loading
  has no curve and no speed of its own.
- **The model is the package's.** `lib/load-motion.ts` (`readLoadMotion`, `loaderLayout`, `loadPlan`, `loadFrame`,
  `loadTotal`, `loadSettled`, `loadRing`) is pure but for reading the tokens. `hooks/use-load-motion.ts`
  (`useLoadMotion`, with the painters `paintLoadRing` and `paintLoadSection`) plays it on one GSAP ticker. Under reduced
  motion it holds the cells still while loading and puts the sections in at once.

**Decided, his (2026-09-27), in globals.css:**

```css
--motion-load-turn: chase;
--motion-load-lap: 6000ms;
--motion-load-press: 200ms;
--motion-load-open: smooth;
--motion-load-duration: 1200ms;
--motion-load-reveal: 1;
```

A closed ring goes round the square once every 6s. With his movement, the expansion takes 2000ms: the 200ms press, the
400ms move, the 200ms release and the 1200ms opening, the section coming in over the whole of it.

**M11 — Enter · exit: movement's first primitive.** Undecided. On one cell movement has nothing to move. What is left
is an element arriving and leaving, and a move of one cell is an exit from one cell and an enter into the next.

- **The specimen** is one of movement's cells at the stage's centre, gone at rest. Hover it and it enters: its ring
  lights and its dot floats up into the cell. Leave, and it exits. A bigger block enters and exits in flow order,
  movement's stagger apart (borrowed). A hover that changes its mind turns an element round where it stands. Rings
  still never move: an element's ring lights as it enters and goes out as it exits. On the timeline a play is enter,
  hold and exit.
- **The tokens are movement's, `--motion-move-enter-*`:**
  - `--motion-move-enter` and `-exit`, with `-enter-ease` and `-exit-ease`: coming in and going out, each with its own
    length and curve;
  - `-enter-way`, where the dot comes in and goes out: **place** (it grows and shrinks where it stands), **through** (in
    at the flow's start border, out at its end) or **rise** (up from the cell's lower border and back down it);
  - `-enter-scale` and `-enter-opacity`: the dot's size and opacity at the way in and out;
  - `-enter-ring`, the ring's lead: positive, the ring lights before the dot comes and goes out after it leaves.
  As in the move, the dot's size follows its place: through and rise come in from the middle of the gutter.
- **The model is the package's:** `lib/cell-motion.ts` (`readCellEnter`, `cellPresence`, `cellEntries`,
  `cellEnterFrame`, `cellEnterSettled`, `cellEnterTotal`), played by `useCellEnter` in `hooks/use-cell-motion.ts`. Only
  the studio plays it. None of its tokens is in globals.css. Its preset A, *From the move*, is movement's dot at his
  settings taken apart: through, 320ms in on cubic out, 80ms out, linear.
- **Open:** whether movement's move then takes its leaving and arriving halves from these tokens (§5).

**M13 — Hyper focus: a card in focus, and a cloth of blur over the rest.** Decided (his, 2026-09-29). **It plays on the
studio's Hyper focus page only** (Portfolio.md P21): no page in any app blurs. Its blur is his exception to the no-glass
rule, in the studio.

- **The field.** The blur is a field of rings measured from the card: from the circle through its corners, its centre,
  or its edges (`-from`). It is `-near` px next to the card, sharp in all but that for a clear ring `-clear` cells wide,
  then rising to `-far` px over `-reach` cells along the curve `-rise`, drawn as `-rings` steps. Each step is a
  full-surface layer with a `backdrop-filter` blur, and since blurs compound (a over b is √(a² + b²)), each ring adds
  what takes the field from the last step's level to its own. The field only rises.
- **The cloth.** The field lies on a cloth attached to the card's box. Its way in (`-way`) is **spread** (drawn out from
  under the card, each edge to its container's matching edge and past it by the hem), **swell** or **fade**. **Pull**
  is how the edges share the way: at 100% all four corners arrive together, at 0 the nearest edge lands first. The
  **hem** is the cloth's soft edge in cells, and the **fold** an extra blur along it. The four edges are four gradients
  on each layer's mask (`clothEdges`, `focusLayerStyles`), never a clip-path. The cloth covers its container, whatever
  that is: on the studio's stage, the stage, and the jigs round it stay sharp.
- **The lift.** The card in focus comes up over the cloth over `-lift` on `-lift-ease`, and may cast a `-shadow` (px) of
  a `-shade` on it, black in either theme. The card itself is never moved or scaled.
- **The way out** (`-exit`) is **withdraw** (drawn back under the card), **ebb** or **fade**, over `-out` on `-out-ease`.
  Off every card it waits `-hold` first, so a gutter crossed to the next card keeps it. From card to card the field
  **glides** over `-glide` on `-glide-ease`, or **jumps** (`-shift`). A card reached from another is lifted once the
  field has arrived; the card left goes under at once.
- **The model is the package's:** `lib/focus-motion.ts` (`readFocusMotion`, `focusRings`, `clothEdges`,
  `focusLayerStyles`, `paintFocus`, `FOCUS_START`), played by `hooks/use-focus-motion.ts` (`useFocusMotion`), one GSAP
  ticker while anything moves. Only a few custom properties on the surface move, and each layer's mask reads them.
- **The stage keeps no paint containment for this family, nor for focus mode.** `contain: paint` makes an element the
  backdrop root in Chrome, and the field's dashes under the stage would stay sharp. The stage's slot still clips it.
- **The specimen** is a page like the portfolio's first screen, made of system `Card`s. A hovered card is in focus, its
  border violet over `--motion-state`. The specimen's jig says which card a play starts on and whether the rings are
  drawn, as dashed lime circles labelled with the blur the field reaches there. On the timeline a play goes in on a
  card, holds, moves to the next card in reading order, holds, and goes out. Twenty-four tokens in four groups: Cloth,
  Intensity, Lift, Release.

**Decided, his (2026-09-29), in globals.css:** the way in a **fade** over 80ms, so the cloth has no edges to move and
its pull (0.5) and hem (12 cells) play no part; no fold; 1px next to the card and a clear ring one cell wide, then
rising on ease-in to 16px over 21 cells in ten rings, measured from the circle through the corners; the card lifting
in 300ms with no shadow; a 120ms hold, a 400ms fade out and an 80ms glide; every curve cubic in-out.

**M14 — Focus mode: one vertical at a time, under a panel, with a cloth over the rest.** Decided (his, 2026-09-29).
**It plays on the studio's Focus mode page only** (Portfolio.md P21). Its veil is his second exception to the no-glass
rule, in the studio.

- **The panel** is a see-through frame in the secondary colour: the vertical's box plus a margin (`-pad`), lifted
  `-depth` px towards the eye through a `-perspective`, swinging `-tilt` degrees about its horizontal axis on the way
  (none at rest, all of it half way). **It rises straight out of the page**, its whole line there from the start, over
  `-lift` on `-lift-ease`. Its line is `-border-fine` on the page and grows to `-border` as it rises (by the square of
  the rise). Its flat shadow grows with the lift up to `-shadow`, cut out where the panel is, in the line's own colour
  mixed 12% to 22%. The panel is SVG (`modeShape`, `paintModePanel`): each point of its rounded rectangle is swung,
  lifted and projected, so it is never a CSS box with a transform.
- **Only the panel lifts.** The vertical's cards never move, scale or swing. They keep their place under the panel and
  stand over the cloth.
- **The panel stands over everything** but the cells and Focus, and the cloth is attached to it: the cloth's hole is the
  panel as seen, so the cloth meets the line all round. Each layer is masked by four gradients, never clipped with
  `path()` or `polygon()`, under which Chromium drops a `backdrop-filter` layer's `mask-image`.
- **The cloth** is hyper focus's field (`focusRings`) measured from the panel's edges, and it covers its whole
  container: on each side the rise spreads over the reach or what is left to the container's edge, whichever is less
  (`modeRingEdges`), so every edge of the container is at the far blur. A `-veil` of the page's colour lies over it. It
  comes by its way (`-way`): **unfurl** (rolled out from the panel), **swell** or **fade**, over `-in` on `-in-ease`, and
  goes over `-out` on `-out-ease`.
- **On and off are the same steps, backward.** On: the panel rises, and `-stagger` after it sets off the cloth comes
  (`modeOnAt`). Off: the cloth goes, and `-stagger` after it the panel sinks back into the page over `-drop` on
  `-drop-ease` (`modeOffAt`).
- **A switch: the one left unfocuses as the next focuses**, both from the same moment, each on its own clock, so the
  switch is over when the longer is (`modeSwitchMs`). Every vertical has a panel and a cloth of its own; where both
  cloths are out, their blurs compound. Nothing slides.
- **The cells.** One a vertical on the stage's bottom row, at its centre, the one in focus grown to two with its title:
  the numbered pager's shape, playing movement (M9). Focus, the toggle, is on the bottom-right cell, violet when on. A
  card of another vertical, pressed, moves the focus there too.
- **The model is the package's:** `lib/mode-motion.ts` (`readModeMotion`, `modeShape`, `paintModePanel`, `modeOnAt`,
  `modeOffAt`, `modeSwitchMs`, `modeRingEdges`, `paintMode`, `MODE_START`), played by `hooks/use-mode-motion.ts`
  (`useModeMotion`).
- **The specimen** is the portfolio's first screen as three verticals of system Cards, each three columns wide with two
  columns between them; where the stage is narrower, the air goes first. On the timeline a play is on, hold, a switch,
  hold, a switch, hold, off. Twenty-four tokens in five groups: Lift, Panel, Line, Cloth, Roll.
- The `Avatar` is `isolate`, so its blended ring does not make the stage the cloth's backdrop root.

**Decided, his (2026-09-29), in globals.css:** the panel lifting in 90ms on ease-out, 80px out through an 800px
perspective, a swing of −3°, a 16px margin, its line 0.5px on the page and 2px once up, a 40px shadow; dropping in 90ms
on ease-out; the cloth 2px at the panel rising on expo out to 7px over at most 16 cells in seven rings, no clear margin,
under a 60% veil; swelling in over 250ms on ease-in, thinning out over 1000ms on cubic in-out, 120ms of stagger.

**M15 — The studio's layout.** The main route is one `Grid` with the cursor, every box on the measured field
(`studioLayout` in `src/lib/layout.ts`).

- **The head is one row:** the studio bar (four cells, "Motion studio" on a lime bar, the theme toggle at its round end),
  the family select (three cells), the preset select or the version (three), Reset and Copy (a cell each). On Agents
  the head picks twice, the action and the agent previewed, three cells each, and the bar takes three cells under
  sixteen columns.
- **The stage is always at the field's centre.** On a field fourteen columns or wider and eight rows or taller, the jigs
  stand in two columns either side of it, from under the head to the field's foot, each as wide as the room left, four
  cells to six (`JIG_MAX`). Where the stage would be narrower than ten, it takes the room before the jigs grow past
  four. The timeline is under the stage, centred, two rows, **ten cells at the most** (`TIMELINE_MAX`). Live, the agent
  sits at the stage's centre.
- **Every group is a card of its own:** a family's token groups (Timing, Shape and Easing where it has none), then Scene,
  and Presets on a preset family; on Agents, the action's card first. Cards are as tall as their content and split
  between the two columns in order, so the taller column is as short as it can be. A column too short to give each
  card three lines of controls folds them, one open (Orbit.md C9's pattern); a card whose share is short pages its
  controls (Grid.md D5).
- **A jig is dragged by its grip** (⠿, at the head of each card) to the other column or another place in its own, the
  cards making room as it passes, its border violet while carried. Escape puts it back; the grip's arrows move it (↑ ↓
  in its column, ← → across). Where he leaves them is kept per motion, in the browser (`jigs` in `no-origins:motion`).
- **Narrow fields** show one view at a time, picked in the head: the stage, or a jig six cells at the most, centred, the
  timeline ten. The real stage stays mounted while a jig is shown, so edits and a paused playhead survive the switch.
- **Open:** the `/concepts/*` routes (Split bench, Dock, Focused inspector), earlier layout studies. Whether they stay
  is his. A lime slot fill for the bar (Slot's fills have none; Grid.md D21), and a way to put the jigs back where they
  started, are his to say.

**M16 — The grip: the slider's head detaches into the cursor, and its body flows after it.** Decided (his,
2026-09-30); every `Slider` in every app plays it.

- **At rest** the slider is a pill `--slider-height` tall, its head merged into it: a circle the bar's height over the
  join of the lime and the grey, so the lime ends in the head.
- **Held**, the bar's two sides draw back to stand 2px clear of the cursor's ring, and the head shrinks to `-size` and
  goes to the cursor's centre. **The cursor stays a ring** while a head is held (Grid.md D43). The head follows the hand
  along the bar and, across it, anywhere over the bar. Let go, the head comes back to its place at the value and the bar
  closes over it. A hold let go half way goes back from where it is.
- **Which head is held.** A press on a head holds it; a press on the bar holds the head nearest the press. The slider
  marks it `data-held` from the press to the release, and follows the value if a range's head is dragged past the
  other. The keyboard never holds a head.
- **The body is fluid.** Where the bar's two sides meet under the head, or part round it, follows the head on a spring
  (`-follow`, `-follow-bounce`; `lib/spring.ts`, solved in closed form), whenever its value moves, held or not. Its ends
  are round wherever they are, and a moving end stretches its cap along the bar with its speed (`-stretch`).
- **The model is the package's:** `lib/grip-motion.ts` (`readGripMotion`, `gripAt`, `gripFrame`, `paintGrip`,
  `GRIP_START`), played by `hooks/use-grip-motion.ts` (`useGripMotion`) on one frame loop from the hold to the end of
  the let go, writing the head's move and scale and where each side stands (`--slider-shift-<i>`, `--slider-hole-<i>`,
  `--slider-round-<i>`). Under reduced motion both ways take no time.
- **The tokens**, in two groups: **Head** (`-in` Detach, `-out` Merge, their eases, `-size`) and **Body**
  (`--slider-height`, `-lead`, `-follow`, `-follow-bounce`, `-stretch`). `-lead`, −0.6 to 0.6: positive, the bar opens
  first and closes last; negative, the head goes first.
- **The specimen** is the system's `Slider` on the stage's rows: Columns its length, Rows how many, every second a
  range. Live it is pressed by hand. On the timeline a play is detach, a drag of two cells along the bar and back, hold
  and merge, the cursor drawn as a ring over it.

**Decided, his (2026-09-30), in globals.css:**

```css
--motion-grip-in: 0ms;
--motion-grip-out: 240ms;
--motion-grip-in-ease: cubic-bezier(0.215, 0.61, 0.355, 1);
--motion-grip-out-ease: cubic-bezier(0.215, 0.61, 0.355, 1);
--motion-grip-size: 8;
--slider-height: 8px;
--motion-grip-lead: -0.5;
--motion-grip-follow: 180ms;
--motion-grip-follow-bounce: 0.2;
--motion-grip-stretch: 0.6;
```

The bar is 8px, a third of the cursor's 24px ring. Held, the head is in the cursor at once, an 8px dot, the bar's own
size. Let go, the bar closes and the head comes back after it, over 240ms, each for half the time. The body follows on a
quick spring.

**M17 — The agent.** One character, drawn by the design system's `Agent` (`components/agent.tsx`) from the pure model
`lib/sphere-motion.ts` (`sphereFrame`). Orbit shows it, the studio's Agents page plays it, and the portfolio's intro
casts six (Agents.md). What it looks like is Orbit's (Orbit.md C22). How it moves is here.

- **Seen from the side, it sits in a nest.** A nest is a cell's circle, and down the screen is down. Its head, a sphere
  or a solid (`AGENT_SHAPES`: cube, pyramid, hemisphere, cylinder, hexagonal prism, cone; a solid moves on the sphere's
  course), settles into the bottom of its nest as into a bowl. Its outline is a circle cut by the nest's, what would be
  outside laid on the ring, keeping its size as it spreads (Spread). Only the nest its centre is in, low down, is a
  floor.
- **Its tail** is a spring chain stepped at a fixed 240 a second. While it sits the tail is behind the page, cut to its
  nest's circle; in the air it trails out behind it.
- **A hop** is a crouch (Crouch, Squat), then an arc under one gravity over the higher nest by Height, in Air time. The
  landing is a ball in a bowl, simulated at a fixed half-ms step:
  - it touches down Land at degrees from the bottom, keeping Slippery of its speed along the bowl the way Way says;
  - it slides through the bottom and up the far side, never off it: past 65° the bowl is a soft wall it squishes into
    (Squeeze);
  - it comes back over Come back, as lively as Energy says, its jelly leaning (Sway) and jiggling (Wobble, Wobble
    speed);
  - it bounces off the floor (Bounces, First bounce, Bounciness, Squash), and the nest dips under each landing (Nest
    give).

  Any moment of it is the same frame however it is reached, so the timeline can hold it.
- **Material scales the motion settings** (Body; `MATERIAL` in the package). Jelly moves by them as set:

  | | squash, crouch | spread | wobble, its speed | stretch | sway | slippery | bounce |
  |---|---|---|---|---|---|---|---|
  | **Ball** | 0.35 | 0.3 | 0.5, 0.6 | 0.3 | 0.3 | 1.3 | 1.3 |
  | **Jelly** | 1 | 1 | 1, 1 | 1 | 1 | 1 | 1 |
  | **Slime** | 1.5 | 1.2 | 2.2, 2 | 2 | 1.6 | 0.6 | 0.35 |

  Slime oozes back from a squash and a lean where jelly wobbles past. A spread's sink eases into its limit (0.95).
- **Rest is always there:** it breathes (Breath, Breath depth) and blinks.
- **The eyes are always circles**, the size they are set. Where they sit rides the head as it is drawn: moved,
  squashed, stretched and leaned with it. They look where it is going (`aimOf`): to the next nest from Look lead before
  it leaps, then along its way, then straight ahead as it settles. **A blink is lids closing**, never an eye shrinking,
  and they squint shut as a landing hits. The face's parts (M20) sit in a face layer within the body's clip.
- **Its defaults are his version 15** (`SPHERE_START`, decided 2026-09-30): the motion settings every agent moves by
  under every action, unless the action sets them (M23, M24). None of its `--motion-sphere-*` tokens is in globals.css;
  the studio's stage writes them, and `readSphereMotion` and `sphereMotionFrom` read them.
- **Open:** whether the nest should look like a nest (it is the cell's ring and tint), and whether the tail should show
  a little as it sits.

**M20 — A component's properties are typed and declared in code; what he chooses is data, kept in versions.**

- **Typed properties** (`lib/properties`). A property is a type and its meta: its label, the part it belongs to, what it
  touches, its range and step, its default, and where its rest is designed, `set: "look"` or `set: "motion"` (and
  `pose`, M23). `checkValue` holds a value to its property. A new kind of value is a new type, added once, that every
  component can use. Orbit's controls and the studio's jigs are built from these declarations.

  | Type | What it is | Between two values |
  |---|---|---|
  | number | a value in a range, with a step and a unit | eases |
  | angle | degrees | eases |
  | duration | ms | eases |
  | colour | one of the agent's named colours, or one of the palette's | switches |
  | choice | one of a list, such as a slot's style | switches |
  | switch | on or off | switches |
  | drawing | an uploaded drawing, by version | switches |

- **What a component can have stays in code; what he chooses goes in the database.** The declaration lives in the
  package beside the drawing that uses it: the agent's body (`lib/agent-body`, `AGENT_BODY`), its face
  (`lib/agent-face`, `AGENT_FACE`) and its actions (`lib/agent-actions`). A look (`CharacterLook = { body, face }`) and an
  action's values are data. Ids are unique across body and face, so a value is keyed by its id alone.
- **The face is parts, each a slot with styles** (version 1), drawn in code from their settings so they bend with the
  head:
  - **Eyes**: size, spacing, height, colour (Ink by default), Look X and Y;
  - **Pupils**: None · Dot · Shine;
  - **Upper lids**: Plain · Heavy, with open, slant, curve, the blink and the squint;
  - **Lower lids**: None · Plain, with raise, slant, curve;
  - **Brows**: Line · Arch · Bushy, with height, angle, arch, length, thickness, colour;
  - **Symbols**, played rather than worn: the cross of anger, a sweat drop, a Zzz, a sparkle, a question mark.

  Colours are named and flat. A pair is mirrored until it is set apart in Orbit, and its right side reads `<id>-right`.
  The agent has no mouth. Mustache, hair and marks come later.
- **An uploaded style** is an SVG drawn on its slot's template (`faceAnchors`). It has flat fills only, shapes only, one
  side of a pair, and colours by layer name (`ink`, `paint`, `light`). Cleaned to its shapes (`checkDrawing`), it is kept
  as a version in the database's storage and stands in its slot beside the styles drawn in code (`upload:<id>`). It
  follows the head as a whole, changes colour, and moves, turns, grows and fades. It cannot change its own shape: a
  second pose is a second drawing. Orbit holds the library and the upload (Orbit.md).
- **Versions.** A character, an uploaded drawing and an action each have one draft and their published versions
  (`studio_items`, `studio_drafts`, `studio_versions`):
  - a draft saves whole, as he goes, on the `rev` it was loaded at; a write from a stale `rev` is refused, not merged,
    and the studio says so;
  - publishing (`studio_publish`) makes the next `major.minor` (Orbit.md C19) and makes it current;
  - a version never changes and is never deleted (a trigger refuses it). Going back makes an older one current and its
    values the draft, and renumbers nothing;
  - each version records the `@no-origins/ui` version it was made with (`ui_version`), since a style drawn in code can
    change under it;
  - a look or an action's values are held whole, every value and not only those moved off a default, so a default that
    changes in code later never changes a published version. A key missing from one read back takes its default.
- **The design system's own motions stay in code.** M4's tokens reach globals.css by M7, never through the database.
- **A page carries the versions it shows.** The portfolio copies the versions it plays into its own content (M22) and
  never fetches them at a visit. Orbit reads published agents live, under its own read policy (Orbit.md C24).

**M21 — The slider's steps: a mark over each, a zone round each, and a tick as the head lands.** Version 1, on the
bench as **Steps**, designed version by version.

- **The option is the component's.** `Slider marks` draws a dot over every step's place; `marks={5}` draws one every five
  of the value's units from `min`. A mark stands where a head stands at its value (reckoned from the values, never
  measured), so a head at rest is right under its mark. The dots are above the bar (before it, standing vertical), in
  room the slider keeps at the top of its box. `--slider-mark-size` and `--slider-mark-lift` set the dot and its
  distance from the bar, 6px and 6px unset.
- **The light.** A mark is the bar's grey, and lime where the value is. It lights the moment the value lands on it, and
  one the value has left stays lime until the body's lime (M16) has flowed back past it.
- **The zone** (his). Every mark has one, Zone px either side of it, never past half way to the next mark. While a head
  is held and its cursor is in a zone, the head goes right under the mark on a spring, Snap ms long, and the value is
  the mark's. Out of every zone the head is the cursor's again, and the value lands on no mark it has not snapped to: a
  detent. A press outside every zone still takes radix's nearest value. With Zone at 0 there is no snapping.
- **The tick.** With a zone, the snap is the tick; without one, or from the keys, it is the value landing on a mark. A
  tick is three things at once: the mark pops (up to Pop times its size in Pop in ms, then back on a spring, Settle and
  Settle bounce), the head kicks (to Kick times its size, stopped at the ring's inside), and the hand feels it where it
  can (a vibration Haptic ms long through the Vibration API).
- **The model is the package's:** `lib/step-motion.ts` (`readStepMotion`, `stepPopAt`, `markLit`, `zoneOf`,
  `paintMark`, `stepHaptic`, `STEP_START`), played with the grip by `useGripMotion`. Under reduced motion the pop, the
  kick and the snap take no time; the haptic stays.
- **The tokens**, in three groups: **Marks** (Size, Lift), **Tick** (Pop, Pop in, Settle, Settle bounce), **Feel**
  (Kick, Haptic, Zone, Snap). None is in globals.css. **Version 1** (mine): a 6px dot 6px over the bar; Pop 1.8× in 60ms;
  Settle 360ms at 0.4; Kick 1.2×; Haptic 10ms; Zone 16px; Snap 90ms, no bounce.
- **The specimen** is three system `Slider`s with marks: 1 to 5; a range, 0 to 10; and 0 to 20 marked every 5, where
  only a mark snaps and ticks. It borrows the grip at its own values. On the timeline the hand drags each first head two
  steps out and back, stepped by the slider's own rules.
- **Flagged:** a zone wider than the ring pulls the head out of it; on a long slider with a mark every step the pops run
  together; iOS has no web haptics, so there the tick is only seen; at the grip's 8px bar the 6px marks are nearly the
  bar's height.

**M22 — The intro: the six agents open the page and turn it.** The portfolio's (Grid.md D50, Portfolio.md P23, P24),
drawn by `grid-intro.tsx` from the pure `lib/intro-motion.ts`. It plays once per document load, never under reduced
motion. Its moves are his actions (M24): Bounce, Jump and Dive.

- **They stand in a row.** The cast (`introAgents` on `Grid`) stands side by side, a cell each, centred across the
  field's middle row (the upper of the two), or on the nearest row no agent lands in, in a random order (`introSpots`).
- **Some bounce.** Only Bali, Kino and Mira bounce (`bounces` on an `IntroAgent`; the portfolio's `content/intro.ts`).
  Each makes its first Bounce at a random moment within `-first`, then again at its own pace, waiting up to `-rest`
  between one bounce at rest and the next. The others sit in their nests, breathing and blinking, each as if it had sat
  one to two blinks already.
- **They leave.** After `-gather` each leaves at a random moment within `-leave`, by a Jump or a Dive picked at random,
  at least one of each. **Every nest is a cell of the field**, never a point between cells.
- **The one in focus goes below its section.** The page names one agent in focus (`introFocus`); the boxes on the field
  are its section alone. It lands in the cell under the section's last row, at its centre (the left of the two middle
  cells), or where the page says (`introFocusAt`; the portfolio's is the third row from the bottom, at the field's
  centre, on a wide field). Its landing lights the cells round its nest in violet, ring by ring, `-ripple` rings out,
  `-ring` apart, each cell fading as the pointer's does (500ms, Grid.md D34). As the ripple's last ring lights, the
  section fades in over `-reveal`, one opacity fade a box. Where no cell round the section is free, it dives into the
  section's centre and is held there behind the page (`hold`, `introComeHome`).
- **The rest go home**, by a Jump or a Dive, with no ripple. Home is a cell each in the field's last column, centred
  down it, in the cast's order (Bali at the top); on a field taller than wide, the bottom row (`introHome`,
  `introHomeSide`). They stay there, breathing and blinking, after the hand-over and on any field the grid is given
  later (`introResting`).
- **The agents turn the page.** A new `introFocus` fades the section away over `-out` while its agent Dives home
  (`introGoHome`); `onIntroFocus` asks for the next section; its agent Dives out of its cell at home and comes up below
  that section (`introGoIn`), its ripple spreads, and the section fades in. An empty cell at home is the page being
  shown. The grid carries `data-intro-turn` while it does.
- **A click bounces it** (`introAct`): the page may ask an agent for an action in its own cell, never while it is in
  the air, under the page, or while a page turns.
- **Without `introFocus`**, each agent lands on the cell at the centre of the boxes it opens (`data-intro-by`), ripples,
  Dives home `-settle` after its ripple's last ring and its landing at rest, and its boxes fade in once it is gone.
- **Under reduced motion** there is no intro and no dive: the agents are drawn once, still, and a turn puts the next
  section and its agent in place at once.

| Token | Value (`INTRO_START`) | What |
|---|---|---|
| `--motion-intro-gather` | 2000ms | how long they stand before the first may leave (his "two seconds") |
| `--motion-intro-first` | 500ms | the latest a bouncer's first bounce starts |
| `--motion-intro-rest` | 700ms | the longest a bouncer waits between one bounce at rest and the next |
| `--motion-intro-leave` | 300ms | the window after `gather` in which each leaves |
| `--motion-intro-ripple` | 2 | how many rings out from its nest a ripple goes |
| `--motion-intro-ring` | 80ms | from one ring of a ripple lighting to the next |
| `--motion-intro-settle` | 250ms | from a ripple's last ring to its agent's Dive home |
| `--motion-intro-reveal` | 500ms | boxes fading in |
| `--motion-intro-out` | 160ms | a section fading away as the page turns (the grid's turn, Grid.md D37) |

None is in globals.css. All but `gather` are mine, his to tune.

- **Open:** the intro is not on the bench, so its numbers cannot be tuned in the studio. The action values are a copy
  (`content/actions.ts`, `introActions`): a version he publishes later reaches the page only when it is copied again.
  On a phone a cell is 72px or more, so a two-ring ripple covers a good part of the screen.

**M23 — An action is every agent's; what is look and what is motion.** Every agent has the same parts: Body, Eyes,
Pupils, Upper lids, Lower lids, Brows and Symbols. Every setting is declared as one of three kinds:

| Kind | Declared | Designed in |
|---|---|---|
| **Look**: what the agent is; nothing moves it | `set: "look"` | Orbit |
| **Pose**: how it holds itself at rest | `set: "look"`, `pose: true` | Orbit |
| **Motion**: how it jumps, lands, slides, breathes and blinks | `set: "motion"` | the declaration's defaults (`SPHERE_START`), and each action's controls (M24) |

- A character holds look and pose only (`resolveCharacter`, `checkCharacter`). A motion value in a draft or a version
  is not read.
- An action plays on any agent. A part the agent does not wear draws nothing on it. Its Material still shapes every
  action: a ball lands firmer and slime oozes.
- The Agents page's head previews one agent as Orbit has it, its draft and its uploads, opening on Bali and remembering
  the last one picked. With no database it is the code's one agent, "Default". The preview changes who is watched,
  never whose the action is.

**M24 — Actions: the agent does named things, each with its own controls.**

- **An action is code, and only what he names.** It has the name he gives it and is declared in the package
  (`lib/agent-actions`, `AGENT_ACTIONS`) beside the agent's drawing: its id, label, version, groups of typed properties
  (M20), whether it travels, and how it plays. Its frames come from its controls through the physics the agent already
  has (`sphere-motion`). A new kind of move is a new action written in code, which he then tunes in the studio.
- **Its controls are its own.** Each group is a card on the bench. The character's look and pose stay Orbit's (M23).
- **Its length follows from its controls.** The timeline is the whole action, its phases marked in order, each as long
  as its controls make it (`sphereBeats`). It is played and scrubbed, never dragged: to make an action longer, change
  what makes it long. No rest is put after an action on a loop.
- **The rest state is always there:** breath, blinks and the pose. An action sets off from rest and hands back to it.
  Rest is not an action.
- **One Agents page.** Its head picks the action and the agent it is previewed on (M23). Each action is a family of its
  own in the studio (`action-<id>`), so its values are kept apart. **Its card** says what it is, which version pages
  play and whether the draft has moved since, how it is kept, **Publish** (the next minor) and **Versions** (go back to
  one, or publish the next major).
- **Live**, a click plays it: an action that travels goes to the cell clicked and stays there; Bounce plays where it
  sits. On the timeline it plays from the centre, a traveller's path centred by its Where (`sphereJump`).
- **Kept in the database.** Each action is an item of kind `action` named as in code, its draft `{ action, values }`,
  made the first time its bench opens, saved half a second after the jigs stand still, on its `rev` (another device's
  save first stops the saving: **Load**), and published through `studio_publish` (M20). With no keys, or signed out,
  its values are the browser's. `e2e/agents.spec.ts` plays the actions and **never writes his drafts**: there is one
  draft an action, and he may be tuning it while it runs.

The actions:

- **Bounce**, version 1. It crouches, leaps straight up out of its nest, falls back into it, bounces off its floor, each
  bounce lower than the last, and settles; landing off the bottom (Land at), it slides round the bowl and comes back.
  Groups: Take-off, Leap, Bounces, After landing, Tail, Eyes. Phases: crouch · rise · fall · bounce 1…n · come back ·
  settle. On slime a bounce is about a third of jelly's, so First bounce starts at 0.6.
- **Jump**, version 1. The hop, nest to nest: crouch, an arc over the cells, the landing in the nest it reaches, and the
  slide round the bowl. Its defaults are his version 15's (`SPHERE_START`), three cells across. Groups: Where (Columns,
  Rows), Take-off, Leap, Landing, After landing, Tail, Eyes (with Look lead). Phases: crouch · rise · fall · the
  landing's, **no settle**. *Flagged:* a look turns no earlier than the crouch starts, so at its 60ms crouch a Look lead
  of 1000ms acts as 60ms.
- **Dive**, version 2. The nest is the page's opening. After its spring (Spring, in cells; 0 slips straight in) it goes
  out of its nest behind the page **the way it is going**, cut to the nest's circle: through its top to a nest above,
  its side to one beside, its floor to one below. It is under for Under, its nest going out and the next lighting; it
  glides into the next nest behind the page the same way; then it **carries on** in front of the page (`sphereArrival`):
  coming up from under, it flies up out of the nest and falls back in; from the side, it arcs into the bowl and slides;
  from above, it drops onto the floor. **Pop** is how fast it comes in, as the height a fall that fast is from. One
  gravity for all of it: slipping straight down from rest takes Dive ms. Under is one length however far the dive goes,
  and nothing lights along the way. Defaults: Spring 0.4 cells, Dive 320ms, Under 400ms, Pop 0.6 cells. Phases:
  crouch · spring · dive · under · come in · carry · the landing's, **no settle**.

**Open:**
1. **Look X, Look Y and the symbols** are motion settings no action offers: they wait to be named as actions (a look, a
   symbol popping up), or for the sequencer.
2. **The sequencer**, when he asks for it: published actions placed on rows, each a block at its own length, rows
   overlapping, the higher row winning where two set the same thing, the whole sequence on one timeline.
3. **Whether the harness calls an action by its name.** The lifecycle stays on the BEAM and the browser presents it
   (Brand.md §8). An action's name would be the first word the two share.
4. **How many times.** A bounce plays once, its bounces dying away; the timeline's Loop repeats the play. A count of
   leaps, each as high as the first, is not a control.
5. **A reload in the half second after a change** loses that change.
6. **Going out from no spring**, the crouch's squash springs back to its sitting shape as it starts to go; going out
   sideways it keeps the shape it sits in.

**M25 — Liquid: a box filled to a level, its surface flowing.** Version 1, on the bench as **Liquid**, designed version
by version. The status page plays it in a cell beside every app (Status.md); the showcase shows it among the molecules.

- **The component is the design system's.** `Liquid` (`components/liquid.tsx`) fills whatever box it is given up to
  `level`, 0 to 1; a 1 × 1 is a round glass (Grid.md D39). Its colour is the primary, lime, unless given (`colour`); it
  says "40% full" to a screen reader unless told otherwise. It is two SVG paths, the back wave and the front, painted
  each tick, in a `border bg-card` box.
- **The surface flows as two waves.** The front, in the liquid's colour: Height (a share of the box's height), Length
  (one wavelength, times the box's width) and Period (one wavelength passing, ms). Behind it the **back wave**, a tone of
  the colour mixed toward the card (`color-mix`, never an opacity): its Height times the front's, its Lag a share of a
  wavelength behind, its Speed times the front's, and its Tone, how far toward the card.
- **The level breathes:** Bob, how far it rises and falls, a share of the box; Bob period, one rise and fall. 0 holds it.
- **The pour.** Arriving, it pours from empty to its level over Pour ms on Pour ease, and a new level pours from wherever
  the liquid is. 0 and it is there at once.
- **Reduced motion:** a flat surface at the level; no waves, no bob, no pour.
- **The model is the package's:** `lib/liquid-motion.ts` (`readLiquidMotion`, `liquidFrame`, `liquidLevel`,
  `liquidStill`, `liquidPath`, `liquidBackColour`, `paintLiquid`, `LIQUID_START`), played on a box by
  `hooks/use-liquid-motion.ts`, one GSAP ticker for the box's life. The motion is read off the box when it starts and
  when `tuning` changes, never cached.
- **The tokens**, eleven in four groups: **Wave** (Height, Length, Period), **Back wave** (Height, Lag, Speed, Tone),
  **Sway** (Bob, Bob period), **Pour** (Pour, Pour ease). None is in globals.css. **Version 1** (mine): a wave 8% of the
  box tall and 1.2 boxes long passing in 2.4s; a back wave 70% as tall, 0.35 of a wavelength behind at 0.8 of the speed,
  mixed 45% toward the card; a bob of 1.5% over 4.2s; a 1.4s pour on expo out.
- **The specimen** is the system's own `Liquid` filling the block, a cell to start with, at the specimen's **Level**
  (40%, steps of 5). Live it flows and pours when the level changes. On the timeline a play is the pour from empty and
  then the flow for the hold.
- **Flagged:** in a 60px cell an 8% wave is under 5px and may read as a shimmer; the back wave's tone reads differently
  in the two themes; many liquids bobbing together on the status page may read as the page breathing. **Open:** the
  colour is a prop, not a token; whether a liquid's colour is his to pick per use.

## 5. Open

1. **The grid's motion onto the layer.** The grid's numbers are module constants, and the field's painter runs in a
   worker, which cannot read a custom property, so they would reach it by message. Its jigs need the whole field for a
   stage: the intro is the page's first paint, and the theme's sheet falls over the outermost grid. The grid's families
   need a page shape of their own. The next round, if he wants it.
2. **Reduced motion.** Every motion hook in the package answers `prefers-reduced-motion` itself: movement jumps to where
   it is going, loading holds still and puts the sections in at once, the grip and the steps take no time, the liquid
   is flat at its level, and the intro does not play. The studio's stages pass `always`, so it plays regardless. The
   surfaces have no reduced form yet: with tokens, "fade only" is one media query setting `-scale` to 1 and `-shift` to
   0, and it is not written.
3. **Literals and ambient motion not on the layer.** `NavigationMenu` keeps shadcn's literals: a 300ms chevron and
   content, `zoom-in-95` and `zoom-in-90`, and `duration-100` on its viewport. The drawer's own slide is vaul's.
   The skeleton's pulse and the spinner have no tokens. None of them is in a family.
4. **A picture of the curve.** An ease is chosen by name from a list. A plot of it, built from the system's `Chart`,
   would let him judge a curve before watching it.
5. **A phone.** On a narrow field the stage and the jigs are one view at a time, so he cannot watch and tune at once.
   The specimens answer a pointer's hover and Play; a finger and the keyboard are not wired.
6. **A grown element's name.** On the tech column the name rides a step after its mark and fades with the ring's lime.
   Whether it should have a motion of its own is open. A play on movement's timeline always grows the first element;
   hovering grows any other.
7. **A tooltip that opens instantly does not animate.** shadcn animates a tooltip's `delayed-open`, which a hover
   produces, and not `instant-open` (moving from one tooltip to the next, or opening one from code). Whether the
   instant case should move too is his question.
8. **Lime on light.** Movement's active ring and loading's rings are lime on both themes; on the light theme lime is
   about 1.3 : 1 on white. Open: his.
9. **Loading's dashes are mine.** Twelve round a cell, 1px (`LOAD_DASHES`, a constant, since it is not motion). Whether
   they should be the field's own finer dashes, or a heavier line, is his to say.
10. **The phase grip is not a system component.** Dragging a phase on the timeline (M6) is the one control on the jigs
    composed in the app, with pointer capture and the arrows. Nothing in the system drags a length that the whole grows
    by: `Resizable` hands one panel's room to the next, which would shrink the play's other phases. Keep it in the app,
    or make it a component in the system: his to say.
11. **Rest and the block's reach.** The rest after a play on a loop (700ms) is a constant, not a dragged phase. The
    Columns and Rows sliders run to the family's most, not to what the stage can hold, so past that the stage trims the
    block and the jig's number is more than is shown.
12. **Enter and exit into the move (M11).** When he picks, the values go into `globals.css` (M7). Whether movement's
    move then takes its leaving and arriving halves from them changes a decided motion, and is his to say. The tokens
    cannot say two things the move does: the old ring goes out well after its dot has left (one lead sets both ways),
    and a dot crossing more than a cell is unseen between its two cells.
