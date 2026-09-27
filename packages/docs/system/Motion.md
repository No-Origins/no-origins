# No Origins — Motion

*How the design system moves, and the studio where that is decided. Opened 2026-09-27, the day the studio was asked
for and its first slice built. Bhargav's words are quoted; the rest is the record of what he decided and what is still
his to decide. Rule numbering is this document's own, M1 onward.*

Companion documents: **Brand.md** (§7 principle 3, "play without noise", and principle 5, "same tokens, type, motion
and components everywhere"; §8's motion line), **Grid-v2.md** (the grid's own motion — the intro D31, the ripple D32,
the wash D37, the lace D40, the turn D27 and D35, the theme's sheet D28, the pointer D34 — none of it on the layer
yet, §5 below), **Slots.md** (the studio's jigs are slots), **Type.md** (every piece of text in the studio is a
`Text`). **Design-System.md §7** and **Atomic.md D12** are the record of 1.0's motion: five named patterns and a
`Motion` atom, deleted with the rest of 1.0 on 2026-09-16. Its reasoning holds, its API does not.

---

## 1. What it is

**Bhargav, 2026-09-27:** *"Let's build a motion studio application in no origins. The goal of this or the purpose of
this application is to experiment and design our motion as part of the design system so I'm thinking in terms of
something like story UI but I don't want to use story UI it's too heavy we, I just want to have that lab but still
built with our own design system I need jigs so that I can play around test with the motion and animations."*

Motion has been designed twice before, both times outside the system. The grid's intro came from the **Grid Intro
Study**, a claude.ai artifact that rebuilt the field with a control for every number. He tuned it and sent the
settings back, and they were copied into `grid.tsx` by hand (Grid-v2.md D31). The accents came from the portfolio's
**accent jig** (`?jig`, 2026-09-27), a dev-only panel that retunes the live page. The studio keeps what worked in
each: a control for every number, and the real component under it. It lives in the workspace, where both can stay.

## 2. What moves today

When the studio was opened, the system's motion was spread across three places, and almost none of it had been
decided by anyone:

| Motion | Where | Numbers | Whose |
|---|---|---|---|
| A surface arriving and leaving: dialog, alert dialog, popover, menus, tooltip, hover card, select, combobox | the class strings of twelve shadcn components, run by `tw-animate-css` | 100ms in and out, `ease`, from 95% scale, 0.5rem of slide, from opacity 0. The tooltip had no duration class and ran at tw-animate's 150ms | shadcn's (radix-sera) |
| A panel sliding in from an edge: sheet | `sheet.tsx` | 200ms in and out, `ease-in-out`, 2.5rem of slide | shadcn's |
| A control changing in place: hover, press, checked (`transition-*`) | Tailwind's defaults | 150ms, `cubic-bezier(0.4, 0, 0.2, 1)` | Tailwind's |
| Content opening in place: accordion, collapsible | tw-animate's keyframes | 200ms, `ease-out` | tw-animate's |
| A value growing into place: `Progress`'s `animate` | `progress.tsx`, GSAP | 900ms `power3.out` for the first growth, 400ms `power2.out` for a change | mine, 2026-09-21, at his ask |
| Ambient: skeleton pulse, spinner | Tailwind's `animate-pulse`, `animate-spin` | 2s, 1s linear | Tailwind's |
| The grid: intro, ripple, wash, lace, turn, theme sheet, lit cell | module constants in `grid.tsx`, `grid-pages.tsx`, `lib/grid-field.ts` | `INTRO_*`, `LACE_MS`, `TURN_MS`, `FALL_MS` … | his, from the study and his notes; the rest mine, flagged in Grid-v2.md |
| The portfolio's "HEY!" | `hey-overlay.tsx`, GSAP | its own | his, 2026-09-24; the app's, not the system's |

So the grid's motion was designed and the components' motion was not. Every surface in the system moved the way
shadcn ships it, and none of it could be changed without editing a class string in twelve files.

## 3. The rules

**M1 — The studio is its own app.** `apps/motion`, at `motion.no-origins.com`, on `:3004`. *"A motion studio
application."* The showcase shows what a component **is**. The studio shows how it **moves**, and lets him change it.
It is a lab, not a catalogue. It is not Storybook (*"it's too heavy"*), and it is built only from `@no-origins/ui`,
like every app. Like the showcase, it has no database.

**M2 — The studio plays the real motion, never a copy.** His pick, 2026-09-27, between real motion made tunable, a
replica per motion (the Grid Intro Study's way), and replay-only. A replica drifts from the thing it copies, and a
pick made on it has to be carried across by hand. Everything the studio plays is the package's own component,
reading its numbers from the package's motion layer (M3). The jig moves those numbers and nothing else.

**M3 — Motion is tokens, in the one stylesheet.** Every number a component moves by is a `--motion-*` custom
property on `:root` in `globals.css`. The value written there **is** the decision (packages/ui rule 2). CSS reads
the tokens through Tailwind: `motion-surface` and `motion-panel` (two `@utility` rules, the in and out timing of a
surface), `zoom-in-(--motion-surface-scale)`, `slide-in-from-top-(length:--motion-surface-shift)`, and Tailwind's own
`transition-*` and tw-animate's accordion, remapped in `@theme inline` so their defaults are the tokens. Script reads
them through `lib/motion.ts`: `motionMs(el, token)` and `motionEase(el, token)`. The second turns a CSS easing into
a function GSAP can take. So `Progress` reads the same token a stylesheet would, **off its own element**. Durations
are in milliseconds, as everywhere in the system. Eases are CSS easing strings: a keyword or a `cubic-bezier()`.

A token can be overridden in a subtree, and only that subtree moves differently. That is how the studio's stage
plays a tuned motion while the rest of the page, the jigs included, keeps the decided one.

**M4 — Five families to start, all of them component motion.** His first pick of what to jig, 2026-09-27: the
components, before the grid. Each family is named for what the motion is **for**, not for a component, so a new
component joins a family rather than getting its own numbers:

| Family | What it is for | Tokens, with their value today (M7: none of them is his yet) |
|---|---|---|
| **surface** | Something arrives over the page and leaves: dialog, alert dialog, popover, dropdown and context menus, menubar, tooltip, hover card, select, combobox | `--motion-surface-in` 100ms · `-out` 100ms · `-ease-in` `ease` · `-ease-out` `ease` · `-scale` 0.95 · `-shift` 0.5rem |
| **panel** | A panel slides in from an edge: sheet, and the drawer's scrim | `--motion-panel-in` 200ms · `-out` 200ms · `-ease-in` `ease-in-out` · `-ease-out` `ease-in-out` · `-shift` 2.5rem |
| **state** | A control changes in place: hover, press, checked, selected | `--motion-state` 150ms · `--motion-state-ease` `cubic-bezier(0.4, 0, 0.2, 1)` |
| **disclose** | Content opens in place: accordion, collapsible | `--motion-disclose` 200ms · `--motion-disclose-ease` `ease-out` |
| **grow** | A value grows into place, then moves to the next one: `Progress` | `--motion-grow` 900ms · `--motion-grow-change` 400ms · `--motion-grow-ease` `cubic-bezier(0.215, 0.61, 0.355, 1)` |

The values are what the components already did, so moving them onto tokens changed nothing on any page. There are
two exceptions, both too small to see. The tooltip joins the surfaces at 100ms, where it had run at 150ms because it
had no duration class. `Progress`'s change moves from GSAP's `power2.out` onto the grow ease (`power3.out`, written
as its cubic-bezier), because a family has one curve.

*Amended the same day (M9):* the five families stay in the package, tokens and all, but none of them is on the
studio's bench any more. He took them off to name what the studio works on himself.

**M5 — The studio is on the grid, with the output in a section at its centre and the jigs as slots around it.** His
pick, 2026-09-27, amending the full-screen stage with a floating panel: *"I like the first option but, I want the
jigs to be part of the grid. And we only want to see the output in a section center of the grid."* The grid is the
viewport. Each family is a page, and the numbered pager (Grid.md D36) turns between them with the ripple, like the
portfolio. On a field fourteen or more columns wide, the page's centre columns are the **stage**, between a
one-row header and a one-row timeline (M6), and the columns either side hold the jigs: the specimen and the presets on the left, the tokens and the
settings on the right. On a narrower field the stage comes first and the jigs follow on the pages after it (§5).

**The stage is transparent** (amended the same day, his: *"The stage should be transparent because we have to see the
grid and how these work on grids"*). It is a `transparent` slot, so the field's cells show through it, and a specimen
on it stands on the field's own cells: the stage starts on a cell, so an element placed a whole number of pitches in
is on the grid.

**The stage holds its own surfaces.** It is a containing block (`contain: layout paint`), and it hands its element
to `PortalContainer` (M8). So a dialog opens over the stage and not the viewport, a sheet slides in from the
stage's edge, and a menu is clipped at the stage's corner. The overrides a jig makes sit on the stage's element,
so the portalled surfaces inherit them.

**M6 — What a jig is.** Every jig in the studio works the same way:

- **One rhythm** (his, 2026-09-27: *"no spacing is being followed among the controls in the jigs, it's very
  confusing"*). Everything in a jig is 12px apart down: its head and its content, one control and the next. Two
  controls side by side are 24px apart, so each reads as its own. A control is always the same three parts: its label
  with its value right after it, a one-line caption where it has one, and then, 8px below, the control. The control
  sits in a band as tall as the tallest control in its row (36px for a toggle group or a select, 20px for a slider),
  centred, so a slider beside a select stands level with it. A jig's groups are split by a separator: on the
  specimen's jig, the block's Columns and Rows above the family's own options. *Before, the gaps were 8px in one jig and 12px in another, a slider sat right under its
  label while a select floated lower, values sat at the far edge where they read as the next control's, and captions
  came and went.*
- **Every control says what it moves**, with its value in its unit beside it. The tokens card says which components
  the family moves, and the settings block names every token. An in sits beside its out, so a family fits a
  ten-row field, which is what a laptop's browser gives.
- **Each control lives with what it is about, the same on every motion** (his, 2026-09-27: *"First find common and
  repeatable control … Play, Loop, Tempo should be part of the timeline controls. Hold should also be a hold and drag
  on the time line. Organise the controls that specifically belong to timeline should be in time[line] and across all
  the motions"*). So there are three kinds. **How a play runs** is on the timeline: Play, Loop, Tempo, and every phase
  whose length is a setting, not motion. **What plays** is on the specimen's jig: first its block's **Columns and
  Rows**, which every family has, then the family's own options. **The motion** is the tokens. *Before, a Play jig held
  Play in its head, Tempo, Loop and a Hold slider, and then the specimen's options, where movement's block was
  "Across" and "Down" and loading's page time was a Loading slider.*
- **Play, Loop, Tempo** are on the timeline, left and right of its slider. Play (⏮) runs the motion once from the
  start. Loop repeats it. Tempo (1× · 2× · 5× · 10×, a menu) slows the stage and nothing else, so a 100ms fade can be
  watched. Tempo never goes into the settings.
- **The timeline is the transport** (his, 2026-09-27, in two notes: *"While playing for any jiggle motion show a
  timeline bar or something where I can see the slider playing the loop or the motion itself"*, then *"I don't think
  we need scrub we can just have timeline but I also want control over the timeline … a slider on every frame and I
  should also have information on milliseconds at each section"*). It is a row of its own under the stage. One play
  of the motion is a `Slider` across it, with Play, a play/pause button, Loop, Tempo and the time so far. Drag the
  slider, or click along it, and the stage holds that frame. Play/pause runs on from the playhead. Under the slider, the play's phases are
  side by side, each as long as it lasts and labelled with its ms, and the one the playhead is in is brighter.
  **A phase that is a setting of the play is dragged there**: the hold on every motion, and on loading the page's
  loading time as well. It wears a grip at its end. Press it anywhere and drag, right to lengthen it and left to
  shorten it. The timeline keeps its scale for the drag, so the phase's end moves with the pointer, a step at a time,
  and it fits the play again when let go. The arrows move it a step from the keyboard. The hold is 200–3000ms in
  50ms steps, real time. Loading's time is 500–6000ms in 100ms steps, slowed by the tempo with the stage. On a phone's
  stage the buttons, the time, Loop and Tempo take a line of their own over the slider, and the timeline is two rows.
  Movement's play is grow, hold and back, with a rest on a loop. Loading's is loading, expand and hold. The phases
  are read off the stage's tokens at the tempo, so a jig moved while the timeline is paused repaints the frame at the
  playhead. **Live**: when no play holds the stage, it is its own. A hover moves the movement block, and the
  loader turns. A play that ends goes live, and a loop wraps instead. The playhead is a store the timeline and the
  stage's painter read every frame, and nothing else renders on it. *First the timeline was a display in the header,
  filling as a play ran, next to a separate scrub on the Play jig. The second note merged them and took the scrub out.*
- **The specimen's options** are on its jig, left of the stage: the block's Columns and Rows, every family's (in
  `families.ts`, `block`: what it starts at and the most either can be, trimmed to the stage), then its own: movement's
  flow, loading's layout and sections. They are not motion, and never go into the settings. *The flow was a toggle of
  "Rows" and "Cols"; beside the block's Rows and Columns it is two arrows now, → along rows and ↓ down columns.*
- **Five presets per family**, per his way of designing (five options side by side, each with its reasoning and how
  it could fail, and he picks one). **A is today's values** where the family's tokens are in `globals.css`. For a
  motion still being designed, which has no tokens there yet, A is his brief as described. A preset sets the
  tokens, and he tunes from there.
- **"Settings to send me"** prints the family's tokens as the CSS lines that would go into `globals.css`, with a Copy
  button, the way the accent jig and the intro study did. **Reset** puts the decided values back.
- Settings survive a reload, in the browser only (`no-origins:motion`). The studio holds no state that anyone but
  the viewer needs.

**M7 — A pick becomes the default.** When he sends settings back, their values replace the tokens in `globals.css`,
and the family's row in M4 records his words and the date, as D31 recorded the intro's. Until then, every value in
M4 is somebody else's default. Nothing in the studio writes to the package. The pick travels the way every pick in
this project has: he sends it, and it is committed.

**M8 — Portals take their container from context.** `components/portal.tsx` in the package: `PortalContainer`
gives a subtree an element for its surfaces to portal into, and `usePortalContainer()` reads it. Every shadcn
component that portals passes it through: dialog, alert dialog, sheet, drawer, popover, tooltip, hover card, the
dropdown and context menus, menubar, select and combobox. With no container, a portal goes to `document.body` as
before. This was the one package change the stage needed beyond the tokens. It is a rule-6 edit (packages/ui
CLAUDE.md), and each file says why.

**M9 — The bench holds only what he names, and the first is movement.** *2026-09-27, the same evening: "Remove the
exisiting components that you put in the studio. Because I'll tell you what we will work on and then you can add
them. First motion that we will work on is movement. I want to experiment on how one cell elements will move. For
example, let's take work menu and tech stack verticals. The elements expand and move when something is active. So, I
want to design this motion. So, have three cells with compete lime border and a small lime filled circle
(representing an icon size). And when I hover on the first cell it should get expand to two cells and the circles in
the second and third cells will scale down while moving towards next cell and start at the border and move towards
the center in the next cell while scaling up. I'm imaginging this as a fluid, transportation style animation. So,
give me jigs accordingly."*

- **The specimen.** Elements on the field's cells, filling a block of Columns × Rows (M6; it was "across × down"),
  one to six each way, three in a row by default. **They flow along rows or down columns** (his, the same evening: *"I also want to have an option to have
  both rows and columns … it can overflow to the next column"*). By rows, a full row goes on to the next, as the tech
  column's marks fill. By columns, a full column goes on to the next. A row of three is a block three across and one
  down; the tech verticals are one across, flowing down. Each cell is a complete ring, 1px, the width his accent jig gave the work
  tabs' ring, holding a lime dot the size of the portfolio's marks: half the cell less a step of the spacing scale.
  **Only the active element's ring is lime** (his, minutes later: *"Only the element that is active should have lime
  border"*). The rest wear the system's hairline, as the work menu's other cells do, and the lime comes and goes on
  the ring's own curve as the cell grows and gives the cell back. Under the one radius both are circles, and a ring
  two cells long is a pill. Hover a cell and it grows to two cells along the flow. Every element after it moves one
  cell on, and one at a line's end wraps to the next line. A grown element with no room left in its line starts the
  next line and leaves the rest of its own empty. The block keeps one spare line after its last, the field's own
  dashed cells, which the transparent stage shows. Leave, and the block comes back. The hover is read from the cell
  under the pointer and where the elements are going, so a block pushed under a still pointer does not hand the hover
  on.
- **The dot's size is a function of where it is on the grid.** It is whole at a cell's centre and smallest in the
  middle of the gutter between two cells, either way, on a smoothstep from a chosen share of the way out. So a dot moving to the
  next cell shrinks into the border and grows out of it into the next centre: his "transportation". Because the size
  follows the position and not the clock, a hover that changes its mind half way turns the line round from where it
  stands, and still reads right.
- **A dot is seen only on the cell it leaves and the cell it reaches** (his, later the same night, from the loading
  page: *"once the cell is moving from one cell to another, once it shrinks down and exits its first cell, it should
  not be visible anywhere else again except where it reached its destination cell"*, and *"apply this if it is also
  needed in the movement"*). It is: a mark that grows to spell its name pushes the marks after it several cells on, and
  a dot that travels across a line change crosses cells on its way. Such a dot drowns once, leaving, is not drawn over
  any cell between, and floats up once, in the cell it reaches (`travelScale`). A move of one cell is unchanged. The
  change from one cell to the next falls on the middle of the gutter, where at his `-dot-min` of 0 the dot is already
  gone, so it is seamless; a dot-min above 0 would wink out there. A hover that turns a dot round while it is between
  cells leaves it unseen until the cell it now reaches, where it grows in. *Before*, it dipped at every border it
  crossed and showed on every cell between: his "hopping from one cell to another".
- **A dot that changes lines goes by `wrap`**, the jig's answer to his "overflow". **Overflow:** it carries on
  along its line, out past the line's end border, and comes in at the next line's start border. Going back, it does
  the reverse. **Travel:** it goes straight across the block to its new cell, unseen over the cells it crosses.
  **Fade:** it shrinks away where it is and grows in its new cell. A dot that stays on its line travels along it in
  every mode.
- **The rings do not move, only the dots** (his, while it was being built: *"we don't need the circles also to move,
  it's only the element inside the circles"*). A ring is a cell. When its element moves on, the new cell lights in
  the first half of the move and the old one goes out in the second, so a cell that hands over and takes over at once
  never dips. A ring that only grows or shrinks, with one edge changing, glides that edge. That is the active one
  growing into the next cell or giving it back. A grown element that wraps whole to the next line hands over like
  any other. Until his note the ring could also slide or stretch, and both were taken out. (Slide is how the
  work menu moves today.)
- **The model is the package's:** `lib/cell-motion.ts` (`flowSpots` for where the elements go, `stateOf`,
  `dotScale`, `travelScale`, `cellMoves`, `cellMotionFrame`, `cellMotionTotal`). It is pure. `hooks/use-cell-motion.ts`
  (`useCellMotion`) plays it: one GSAP clock a change of the active element, each tick's frame written straight onto
  the elements by the caller's painter. The studio's stage, the portfolio's tech column and the numbered pager bar
  (Grid.md D47, where the page grows to spell its title) all play through it (M2), so a number tuned on the stage is
  the number they move by.
- **The tokens are `--motion-move-*`:** duration, stagger, wrap, ring ease (the active ring's growth, and the cells
  lighting and going out), dot ease, dot min, shrinks from and dot lag (against the cells). `readCellMotion(el)` reads
  them off an element as a move starts, which is how the studio's stage plays them and how a component will.

**Decided 2026-09-27: his settings, from preset A tuned, sent back from the studio and now in `globals.css`:**

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

Against A as described, he made four changes:
- The move is quicker, 400ms where it was 480.
- Both curves are cubic out, GSAP's power3, where they were in-out. So the move starts at once and settles, rather
  than easing in.
- The dot goes all the way to nothing at a border (min 0, from 0). It shrinks from the moment it leaves a centre,
  vanishes crossing the border, and grows from nothing into the next cell. That is the "transportation" of his brief,
  taken literally.
- The dot sets off a tenth of the move before the cells change (lag −0.1), so the passenger leaves before the
  station changes hands.

He kept the 40ms stagger outward and overflow at a line's end. This is the first motion in the system that is his,
start to finish. Preset A on the studio is now "Today", read off the page. *(The stagger is 20ms since the tech
column, below.)*

**On the tech column, 2026-09-27, the same night:** *"Now, let's use this motion in the technical stack vertical.
Whenever I hover/select a logo, it should expand to name the library or tool."* The portfolio's tech column
(`profile-tech.tsx`, Portfolio.md P4) plays movement on its tokens, with four differences from the specimen:
- **The active mark grows by its name,** as many whole cells as its mark and name need, not two. `flowSpots` takes the
  grown element's length for this.
- **The name rides a step after its mark,** inside the ring, which clips it as the ring glides open. It fades in with
  the ring's lime.
- **The other marks have no ring,** since the column never had a tile. The active one is ringed in lime over the work
  menu's wash.
- **Under reduced motion it jumps** to where it is going. The studio's stage plays regardless (`always`).

The marks flow along rows, and `overflow` carries one past a row's end into the next. At his 40ms stagger, the last
of twenty-three marks settled about 1.2s after the first was hovered. **So the stagger is 20ms** (his, the same
night: *"Let's change the 40ms stagger to 20 ms"*), in `globals.css` for everything that moves this way. The last
mark now starts 420ms after the first is hovered and settles at about 0.8s. On the studio's row of three, the
ripple is 20ms a cell shorter.

**M10 — The second is loading.** *2026-09-27, later the same night: "Let's add one more motion in, uh, that is
loading states. So ripple is not the loading state that I want. So yeah, I want to experiment with this motion where
uh, when it first loads, we will have X number of line dashed bordered cells at the center which will be rotating the
x is defined by the number of cards or sections in the page so they will rotate uh, and then once everything is ready
to render they will expand to the component that they are supposed to be."* "Line" is lime, as it was when he asked
for the pointer's lit cell (Grid.md D34). Today a page loads under the grid's own drawing (Grid.md D31): the front
runs again, pass after pass, until the page is ready. That loop is what this is for; he has picked (below), and no
page plays it yet.

- **The specimen.** The stage is a page of sections: a sample of one to eight `Card`s on its cells, packed in reading
  order inside the block the jig's Columns and Rows set (8 × 7 to start with, which holds all eight; a section with no
  room in a smaller block is left out), centred, each labelled with its number and its size in cells. **Or a random
  page** (his, the same night: *"give me option to randomized layouts of cells"*): the Layout option is Sample or
  Random, and **every press of Random deals a new page**, even when it is already on (his: *"every time I click on
  random button, I would want the layout to be randomized"*; a separate Shuffle button came first and went). Each section is a random size up to 4 × 3, put at a random free place that shares
  an edge with one already down, so it reads as one page, not scattered boxes. The page comes from a seed, shown on
  the jig (`#4832`), so a layout survives a reload. While it
  loads, the loader stands on the stage's centre with **one cell per section**, his X. Each is a lime ring in dashes,
  1px, on the field's own cells, so it sits over one of the field's grey dashed rings. **The loader is a square**
  (below). There are twelve dashes round a cell,
  half dash and half gap (mine, `LOAD_DASHES`): the field's own 3px dashes are too fine to be seen turning and
  shimmer instead. **Live, the stage is loading**, turning for as long as it is left. A play on the timeline
  loads the page from the start, turning for the page's loading time, the play's first phase, dragged on the timeline
  (M6). Then the page is ready: the cells expand, and
  the page holds. Every point of the play is one frame, which the timeline can hold. *For a while a scrub froze the
  expansion alone (his: "Scrub option is missing"). The timeline replaced it.* The options, Columns, Rows, Layout and
  Sections, are the specimen's, and the loading time the play's. None of them goes into the settings.
- **The loader is a square, and it opens without a crossing.** His note, the same night, on the first build, where
  the cells stood in one row and went diagonally to sections on other rows: *"the top row items should stay in the
  same row but come together as columns similarly next following rows and then while expanding it should not cross it
  can go vertically and horizontally but in the direction that it is in no cross directions or crossings among the
  cells."* So:
  - **The square** (his, later that night, on seeing the loader on the portfolio: *"I don't like the loader cells to be
    distributed randomly. I want them to be distributed between same number of columns and rows"*). The cells stand
    in a block at the centre as near a square as it can be: as many rows as the side of the smallest square that holds
    them all, and as few columns as fill those rows, so it is square or taller than wide, never wider (his, the same
    night: *"Instead of 4, 4, 2 for the first loaders, try 3, 3, 3, 1"*; as many columns as rows before that, which
    gave ten as 4, 4, 2). It is filled in the page's reading order row by row, with a row that is not full centred
    under the rest (mine). Ten sections stand as rows of 3, 3, 3 and 1; seven as 3, 3 and 1; five as 2, 2 and 1; nine
    as a 3 × 3. An even field's centre is a grid line (Grid.md D26), so an odd row
    sits half a cell left of it, on the grid.
  - *Before, the fold*: the sections grouped by the row they start on, each group a row of the loader, its cells side by
    side in the order of their columns, the rows stacked in the page's order. On the portfolio's ten boxes, which start
    on eight rows, that was a column, mostly one cell a row.
  - **The ring moves as movement's dot does** (his, the same night, in three notes: *"use the movement motion and
    move it to the cell that it should reach. From the cell it starts, directly to the cell it reaches"*; then *"the
    beauty in the movement motion that we designed is that there is a filled circle in the center … when it moves, it
    shrinks so that it appears as it is drowning into the cell and then floating back in another cell … the line
    dashed border treating it like a different component on the cell should scale down its size by 0.8 as if it's a
    tactical feedback and then perform the movement and then once it reaches its destination cell it should tactically
    scale up to fill the cell and then open up"*; then *"the press should happen to all the loading circles at once. And
    then they have to travel to their cell we can account for the distance so every cell can reach its destination cell
    based on the distance and then once they reach the press goes back to one and open … without the dashed borders
    just have the border"*; then, on seeing that, *"the cells are moving from its position to the destination hopping
    from one cell to another which was not expected the expectation was to do the movement directly from the cell it is
    in to its destination cell the values that we kept default in the movement motion should be the same … once it
    shrinks to 0.8 that means it is basically in the state of how we setup movement"*; and at once *"change the press
    to 0.5 instead of 0.8 … once it shrinks down and exits its first cell, it should not be visible anywhere else again
    except where it reached its destination cell"*; and last *"let all the loading cells reach their destination cell
    at once … every thing reaching at its own pace it feels a little off"*). **Each ring goes to its section's top-left
    cell**, and the section opens out from that corner, rightward and down (his, later the same night: *"Instead of
    moving the loader to the nearest corner, let's always move them to the top left corner of any component"*).
    *(Before, the nearest of its four corners — "Whenever a section is opening up it should open up only from the
    corners. So the movement of the loading cells should be to the nearest corners of its section" — and before that
    the nearest of any of its cells, which could open a section from the middle of an edge or from inside it; while
    the loader was the fold, the row was one its whole group shared.)*
    - **Press, all at once.** The moment the page is ready, every ring is pressed to his 0.5 (`LOAD_PRESS`, a constant,
      his number; 0.8 until his last note) over `--motion-load-press`. Pressed, it is movement's dot at rest.
    - **One move of movement's dot, straight there, all landing at once.** Then each goes straight from its cell to
      its section's, in one move with movement's values, nothing of its own: its curve (`-dot-ease`), its duration
      (`--motion-move-duration`), however far it goes, so every ring lands in the same moment, and its size, set by
      where it is (`travelScale`, M9, with `-dot-min` and `-dot-from`). So it drowns leaving its cell, is not seen over
      any cell between, and floats up in the cell it reaches, as movement's dot now does too. A ring with nowhere to go
      stays pressed on its cell, turning, until the rest land.
    - **Release, together, into a plain border.** As they land, every ring grows back to the cell's size over the
      press time. In the same moment their dashes close and their lime turns into the plain border a section wears
      (`--border`). The turn stops there.
    - **Movement's tokens, borrowed.** The travel's curve, duration and size are movement's, and so is the one curve
      for the press, the release, the opening and a chase's or a relay's hand-over: `-ring-ease`, the curve movement's
      own ring grows on. The loading family has no curve, and no speed, of its own. They are read off the page
      (`readCellMotion`), never copied, and tuned on the movement page. The loading stage carries them at their decided values, slowed by its
      tempo like the rest (`borrows` on the family). The ring is drawn scaled about its centre, so its dashes keep their
      count.
  - **Each opens the moment it has been released** (his: *"opening should start right after the loader cell reaches
    it's position"*): as that plain border, outward from its cell to its section's edges, with no dashes (*"without the
    dashed borders just have the border"*). Since every ring is released at once, every section opens at once.
  - **Why nothing crosses.** An opening section stays inside its own box. A section whose box a ring has yet to pass
    through, seen, from where it waits to where it lands, waits until that ring has left it (`openings`, which samples
    each ring's way at the size it is at each point; a ring unseen between cells passes under an open section as
    nothing). It waited until the ring landed at first, which held a section up for up to 800ms while a far ring went
    by. Measured on the stage (`e2e/.mcp/motion-load-rules.mjs`, eleven layouts, all five presets): no two rings ever
    overlap, and no ring is seen on more than two cells, the one it leaves and the one it reaches.
  - *Before*, the same night: first the rings slid, along their rows to their columns and then up or down (his
    *"Travel - columns first"*). Then they handed over as movement's rings do, the new cell lighting as the old went
    out. That lost the dot, and with it movement's point. Then they moved as the dot does but one at a time, movement's
    stagger apart, all on movement's duration however far they went, and opened still dashed. Then all at once, at a
    `--motion-load-pace` a cell of mine (240ms), dipping at every border they crossed, which read as hopping; and a
    `--motion-load-path` offered **along the grid** (along its row to its column, then up or down, for his earlier
    *"it can go vertically and horizontally … no cross directions"*) beside straight. His "directly", twice, settled
    it: straight, and both tokens went. Then straight, one move each, but at movement's speed, a cell every
    `--motion-move-duration`, so a far ring landed later (his "based on the distance"), and a ring with nowhere to go
    was released straight after the press. That read as everything arriving at its own pace, and went for all at once.
- **The rings turn, and the turn never stops (`--motion-load-turn`).** His notes, the same night: *"Setting lap speed
  is also increasing the timeline. I mean, I thought uh, lab speed is basically how fast the cell is evolving. Also,
  the turn should continue while expanding too."* So the turn is on the rings, never the page. It goes on unchanged
  through the press and the travel, until each ring is released into a plain border (*"without the dashed borders"*). `--motion-load-lap` is how fast it
  goes, and nothing else: the page is ready when it is ready, and the timeline's length does not move with the lap.
  **Spin**: every ring's dashes go round. A dashed ring is how a circle is seen to turn, which is why his cells are
  dashed. **Gears**: neighbouring rings turn opposite ways, meshed, so the square reads as one machine. **Chase**:
  no ring turns on its own. A closed ring goes round the square clockwise from its top-left, handing over as
  movement's rings do (M9): the next closes as the last opens. **Relay**: one ring at a time turns once round, then the
  next round the page does, a baton. For spin and gears the lap is a ring's revolution; for chase and relay, the turn
  once round the page. *What went*: a **settle** token, whose "after the turn" made the cells wait for the turn's next
  rest before they set off. That was what stretched the timeline with the lap. Two turns went with it: an **orbit**
  (the folded page turning as a wheel, which always had to finish its lap) and a **step** (the page stepping round a
  square). Both moved the page, and a page still moving would carry its cells off their rows and columns.
  *Before the fold*, the cells stood in one row (spin), rode a circle (orbit), or went round a loop of cells with a
  spot to spare (chase, step).
- **How a section opens (`--motion-load-open`).** **Smooth**: from its cell out to its edges in one glide. **By whole
  cells**: a cell at a time, snapping on from half way through each. `--motion-load-duration` is the opening's length
  and nothing else. The opening's curve is movement's ring curve (above). A loading **ease** token of its own went
  when the move became movement's, and so did a **press scale** token: the press is his 0.5. Spin and gears turn at a
  constant speed. Every box
  is a cell's circle at its corners (Grid.md D39), so the circle becomes the section's box with no second shape.
  *Before*, an **expand** token held two decisions at once (his: *"I didn't understand what expand is"*): which way
  the cells travel first (rows or columns) and how they open (smooth or by cells). The travel is now his columns
  first, and the opening is this token. A **stagger** between openings, in reading order, went with it. Before the
  fold, expand's choices were morph, travel and cells, and all three went diagonally.
- **The section shows inside its ring.** It is clipped to the ring's box and revealed as the ring opens, so it never
  shows past the ring. Over the last `--motion-load-reveal` of its opening the section comes in, and the ring's plain
  border fades as it comes: it hands over to the section's own border, or to none where the section wears none (mine,
  on adopting it: the portfolio's columns are borderless, and a border that went in one frame outlined them and then
  vanished). *Before*, the border stayed until the section was in and went at once.
- **The model is the package's:** `lib/load-motion.ts` (`readLoadMotion`, `loaderLayout`, `loadPlan`, `loadFrame`,
  `loadTotal`, `loadSettled`, `loadRing`). It is pure but for reading the tokens. `hooks/use-load-motion.ts`
  (`useLoadMotion`) plays it: one GSAP ticker while anything moves, and each tick's frame is painted by the caller. It
  reads the motion off the block when loading starts and again when the page is ready. `paintLoadRing` and
  `paintLoadSection` are its painters. The studio's stage plays through it (M2), and so does the grid, on every page
  (below).
- **The tokens are `--motion-load-*`,** in `globals.css` since his pick (below). The package falls back to the same
  values, so nothing that plays it without the tokens moves any other way.

**Decided 2026-09-27: his settings, from preset A tuned, sent back from the studio and now in `globals.css`:**

```css
--motion-load-turn: spin;
--motion-load-lap: 6000ms;
--motion-load-press: 200ms;
--motion-load-open: smooth;
--motion-load-duration: 1200ms;
--motion-load-reveal: 1;
```

Against A as described, he made four changes:
- The turn is slow, once round every 6s where it was 1.6s: the slider's end.
- The press, and the release, take 200ms each where they took 120.
- The opening is long, 1200ms where it was 480.
- The section comes in over the whole opening (reveal 1) where it came in over the last 60%, so the card fades in as
  its border opens rather than after.

He kept spin and the smooth opening. **The same night he changed the turn to chase** (*"the turn style that I chose is
chase"*): `--motion-load-turn: chase` in `globals.css`, a closed ring going round the square, still once round every
6s. The rest of the motion is in no token and was settled by his notes that night:
the square, the press to 0.5 (`LOAD_PRESS`), every ring going straight in one move of movement's dot and landing at
once, unseen between its two cells, and the release into a plain border. The travel reads movement's own tokens, so
with his movement the expansion is 2000ms: the 200ms press, the 400ms move, the 200ms release and the 1200ms opening.
It is the second motion in the system that is his. Preset A on the studio is now "Today", read off the page.

**On every page, the same night** (Grid.md D48). His *"Proceed"* put it on the portfolio in place of the intro's
looping drawing (Grid.md D31). Having seen it there: *"Let's remove the ripple effect intro and page transitions and
uh, replace with the current loaders that we created."* So the grid loads every page with it:
- **The intro:** page 1's boxes as the sections, the loader turning until the page is ready.
- **A turn:** the page fades away, and the next is loaded straight away.
- **What went:** the grid's drawing, the ripple between pages and its wash.

Then, the same night: *"The initial load of the application itself, add two seconds of artificial load, if there is
not throttle"*, so on the document's first load the loader turns for at least 2s (`INTRO_MIN_MS`), longer if the page
takes longer, 3s at most. And *"when all the pages are uh, either pre-rendered or already loaded and cached which
doesn't need any extra loading can directly render the page rather than showing any loading"*, so a turn loads its
page only when the page has images still to come; every other page shows at once and fades in. No paged grid has
images today, so no turn shows the loader.

A section of a page may be several boxes: on the portfolio, six rings, one a section (his, the same night: "Instead of
10 loading cells, let's have 6"), the profile's card, facts, links and note opening as one out of one ring, over the
rectangle round them (Grid.md D48, `data-load-section`).

`useGridLoad` and `GridLoader` (grid.tsx) play it through `useLoadMotion` and its painters, the same as the studio's
stage, on the tokens above. The ten rings on the portfolio's desktop stand as 3, 3, 3 and 1 (4, 4 and 2 first), and the page is in 2.4s
after load on a local server. The same night the fold became the square (above), and the border began to fade as the
section comes in (above), both first seen there.

**M11 — The third is enter and exit, movement's first primitive.** *2026-09-27, the next morning: "in movement of
motion when there is only one cell I would want to play with enter and exit so maybe we can make that as first
primitive of movement".* On one cell, movement has nothing to move: a line one cell long has no room to grow
(`flowSpots`), so a hover and a play did nothing there. What is left is the element arriving and leaving. A move is made
of exactly that. `travelScale` (M9) draws a moving dot on two cells only, drowning out of one and floating up in the
next, so a move of one cell is an exit from one cell and an enter into the next. That is why it is the first primitive.

- **A page of its own.** "Enter · exit" is page 3, after loading. A motion on the bench is a page with its own tokens,
  presets and settings, and movement's tokens already fill a ten-row field (M6), so enter and exit are not a mode of
  movement's page, where 1 × 1 still plays nothing (mine). It went after loading, not before movement, so the pages
  the review scripts turn to kept their numbers; the order is one line in `families.ts`.
- **The specimen.** One of movement's cells: its ring, the system's hairline, and its lime dot, on the field's own cell
  at the stage's centre, gone at rest. Hover it and it enters: the ring lights over the field's dashed ring and the dot
  floats up into the cell. Leave, and it exits. The block's Columns and Rows make more of them, entering and exiting in
  flow order, movement's stagger apart (borrowed, and tuned on movement's page), and the Flow says which way Through
  passes. A hover that changes its mind turns an element round where it stands, back the way it came, as a move does.
  On the timeline a play is enter, hold and exit, with a rest after it on a loop.
- **Rings still never move.** An element's ring lights on its cell as it enters and goes out as it exits, which is
  what a ring does when it hands over in a move (M9). Only the dot has a way in and out.
- **The tokens are movement's, `--motion-move-enter-*`,** since it is movement's primitive. None is in `globals.css`
  until he picks (M7), so preset A carries their values and the package falls back to the same:
  - `--motion-move-enter` and `-exit`, and `-enter-ease` and `-exit-ease`: coming in and going out, each with its own
    length and curve.
  - `-enter-way`, where the dot comes in and goes out. **In place**: it grows and shrinks where it stands.
    **Through**: in at the flow's start border and out at its end, as a dot passing through a cell does inside a move.
    **Rise**: up from the cell's lower border and back down it.
  - `-enter-scale` and `-enter-opacity`: the dot's size and opacity at the way in and out. 0 and 1 are from nothing
    and no fade.
  - `-enter-ring`, the ring lead. Positive, the ring lights before the dot comes in and goes out after it leaves: the
    station opens before the passenger comes and closes after they go. Negative, the dot goes first both ways.
  - **The size follows the dot's place, as in the move** (M9). Through and Rise come in from the middle of the gutter,
    half a pitch off the centre, where a moving dot changes cells: smallest there, whole at the centre, on a
    smoothstep, so an overshoot past the centre dips it again. In place has nowhere to travel, so its size is how far
    in it is.
- **The model is the package's:** `lib/cell-motion.ts` (`readCellEnter`, `cellPresence`, `cellEntries`,
  `cellEnterFrame`, `cellEnterSettled`, `cellEnterTotal`). `useCellEnter`, in `hooks/use-cell-motion.ts`, plays it
  with one GSAP clock a change, as `useCellMotion` plays a move. Only the studio plays it.
- **What it does not do yet.** Movement's move still reads its own tokens. Making the move take its leaving and
  arriving halves from these would make enter and exit its primitive in the code as well as on the bench. It would
  change a motion he has decided, so it waits for his pick and his word (§5).

## 4. The presets, round 1

`apps/motion/src/content/families.ts` is the source, and this is the record. The presets were chosen to test
different mechanisms, not different decorations.

- **Movement** (the bench since M9; rings stay, so every preset is about the dot). His pick came from A, tuned (M9),
  and A is now *Today*. Round 1 as it was: A *As described*: his brief,
  in-out at 480ms, a 40ms stagger, the dot to 30% at the border, overflowing at a line's end. B *Relay*: a long
  stagger, each dot setting off as the one before arrives, overflowing. C *Teleport*: the dot keeps its size to half
  way, vanishes at the border, goes after the cells have changed, and fades across a line change. D *Glide*: the dot
  leads the cells and settles on a long tail, barely dipping, and travels straight across a line change. E *Spring*:
  the dot overshoots the next centre and comes back, dipping a second time as it settles, overflowing. (The first B–E had rings that
  slid, stayed and stretched; his note took the ring out of the question before he saw them.)

- **Loading** (M10). Every preset tests a different turn, and each keeps his rules: the square, every ring pressed
  to 0.5 at once, going straight to its section in one move of movement's dot, all landing at once, released together
  into plain borders and opening from their sections' corners, and nothing crossing. The travel is movement's in every
  preset: its curve, its duration and its size. His pick came from A, tuned, then chase for the turn (M10), and A is
  now *Today*. Round 1 as it was: A *As
  described*: spin, a 1600ms revolution, a 120ms press, smooth, opening in 480ms, reveal over the last 60%. B *Gears*:
  neighbours turning opposite ways, a 2000ms revolution, a 100ms press, smooth, 560ms. C *Chase*: a closed ring round
  the square, 1200ms round, a 140ms press, opening a whole cell at a time over 640ms. D *Relay*: one ring at a
  time, 2400ms round the page, a 160ms press, smooth, 520ms: the calm one. E *Burst*: a fast spin (900ms), an 80ms
  press, 360ms: the page almost at once. Could fail, in order: six spinners rather than one loader; gears read as a
  shimmer on a page this small; opening by cells reads as a stutter; with one ring moving at a time the rest look
  stalled; a press so short the rings seem to set off unpressed. *Earlier rounds*: until the travel was movement's,
  each preset set a pace a cell (140–320ms) and a path (A, D, E straight; B, C along the grid). Until the press was at
  once, each preset set its own ease (expo out, in-out, the iOS sheet, an overshoot for E) and a press scale. While
  the rings slid, the durations covered the travel too (840–960ms). Until the travel pick, the presets also chose rows
  or columns first and a stagger. Before the lap note, B was an orbit and D a step. Before the fold, A was spin with
  morph, B orbit on a circle, C chase round a loop with cells, D step round a loop with travel, and E burst with morph.

- **Enter · exit** (M11). Nothing is picked, so A is not *Today*: it is movement's dot at his settings, taken apart.
  Inside his 400ms move the dot leaves in the first fifth of its curve, about 75ms, and arrives over the rest, about
  290ms, and the second half of cubic out is cubic out again. A *From the move*: Through, 320ms in on cubic out and
  80ms out, linear, from nothing, no fade, the ring leading by a tenth. B *Float*: in place, from nothing, 360ms in on
  expo out and 240ms out on ease-in, the ring with the dot. C *Surface*: Rise, from 40% and faded out, 440ms in on the
  iOS sheet and 300ms out on ease-in, the dot before its ring. D *Fade*: opacity only, 240ms in and 180ms out, the ring
  well before the dot and well after it. E *Pop*: in place, 420ms in with an overshoot, and 160ms out on expo in, at
  once. Could fail, in order: an 80ms exit on its own reads as vanishing rather than leaving, and in the move the old
  ring goes out well after its dot, which one lead cannot say; with no direction, nothing says where it came from;
  rising has nothing to do with the flow; it is flat, with nothing drowning or floating; an overshoot on every enter of
  a list is noise.

The component families' round 1, withdrawn from the bench with them (M9) and kept as the record:

- **Surface.** A *Today*: shadcn's 100 / 100, `ease`, 95%, 0.5rem. B *Decelerate*: in fast on a long tail (expo
  out), out quicker than it came. C *Float*: longer, softer, more travel from the anchor. D *Pop*: overshoot, the
  brand's "springy". E *Fade*: no scale, no travel, the reduced-motion baseline.
- **Panel.** A *Today*: 200 / 200, `ease-in-out`, 2.5rem. B *Glide*: expo out, lands softly. C *Brisk*: a panel as
  quick as a menu. D *Drawer*: iOS's sheet curve and a long travel. E *Fade*.
- **State.** A *Today*: Tailwind's 150ms. B *Snap*: 80ms, it answers at once. C *Soft*: 240ms ease-out. D *Spring*:
  overshoot. Only a thumb can overshoot, and a colour cannot, which is the test. E *Linear*.
- **Disclose.** A *Today*: 200ms ease-out. B *Quick*. C *Settle*: expo out. D *Smooth*: in-out. E *Spring*.
  Overshoot on a height shows a gap for a frame, and whether that reads as life or as a bug is the question.
- **Grow.** A *Today*: 900 / 400, power3 out. B *Quick*. C *Reveal*: slow, in-out. D *Spring*: the bar overshoots its
  value. E *Meter*: linear, mechanical.

## 5. Open

1. **The grid's motion onto the layer.** Its numbers are module constants, and the field's painter runs in a
   worker, which cannot read a custom property. They reach it by message. Its jigs need the whole field for a stage,
   not a section: the intro is the page's first paint, and the theme's sheet falls over the outermost grid. So the
   grid's families need their own page shape. This is the next round, if he wants it.
2. **Reduced motion for surfaces.** With tokens, "fade only" is one media query that sets `-scale` to 1 and
   `-shift` to 0. It is not written. Packages/ui rule 7 says reduced motion is checked in the component, and that
   rule was made for script.
3. **Ambient** (skeleton, spinner) has no tokens yet. **Navigation menu** keeps shadcn's 90% zoom and 300ms chevron,
   and **the drawer's own slide** is vaul's. None of these is in a family yet.
4. **A picture of the curve.** An ease is chosen by name from a list. A plot of it, built from the system's `Chart`,
   would let him judge a curve before watching it.
5. **A phone.** Below fourteen columns the stage and the jigs are on different pages, so he cannot watch and tune at
   once. The studio is a desk tool for now. The movement specimen answers a pointer's hover and Play. A finger and
   the keyboard are not wired yet.
6. **After the movement pick (made 2026-09-27).** The tokens are in `globals.css`, and the portfolio's tech column
   plays them (M9, the same night, at his ask). The work menu still grows by its 300ms width transition. Adopting
   movement there, through `useCellMotion` like the tech column, waits for his word. Whether a grown element's name
   should have a motion of its own, rather than riding after its mark and fading with the ring, is the next
   question. A play on the timeline always grows the first element; hovering is the way to grow any
   other. A move interrupted half way lets the ring it was leaving go at once, where it had been
   fading.
7. **A tooltip that opens instantly does not animate.** shadcn animates a tooltip's `delayed-open`, which a hover
   produces, and not `instant-open`: moving from one tooltip to the next, or opening one from code. The studio's Play
   hovers the trigger to get the motion. Whether the instant case should move too is a question for him.
8. **The scrims blur.** The dialog, alert dialog, sheet and drawer scrims carry shadcn's
   `supports-backdrop-filter:backdrop-blur-sm`. That is a backdrop blur, which the no-glass rule of 2026-09-16 took
   out of the system. It was not touched here. Flagged for him.
9. **Hosting.** The Vercel project and the `motion.no-origins.com` domain are his step in the dashboard, as for the
   other four apps. The app carries the same `vercel.json`.
10. **Loading on a page** is on the first load since Grid.md D48, 2s at the least, and on a turn to a page with images
    still to come. What is open is listed there:
    - Once round in 6s, a chase round ten rings hands on every 0.6s, so the 2s show about three steps.
    - The rings are painted from the main thread on the GSAP ticker, not by the field's painter in its worker (D38).
      There are ten or so, not the ~1,300 elements D38 moved, but a busy main thread can make a slow spin stutter.
11. **Lime on white.** The rings are lime on both themes, like movement's active ring. On the light theme lime is about
    1.3 : 1 on white (CLAUDE.md), and the dashes are faint there. It is flagged for him, not changed.
12. **The dashes are mine.** Twelve round a cell, 1px. Whether they should be the field's own finer dashes, or a heavier
    line, is his to say. It is a constant (`LOAD_DASHES`), not a token, since it is not motion.
13. **The phase grip is not a system component.** Dragging a phase on the timeline (M6) is the one control on the jigs
    composed in the app, with pointer capture and the arrows, and not built from a system primitive. Nothing in the
    system drags a length that the whole grows by: `Resizable` hands one panel's room to the next, which would shrink
    the play's other phases. Flagged for him: keep it in the app, or make it a component in the system.
14. **Rest and the block's reach.** Movement's rest on a loop (700ms) is still a constant, not a dragged phase. The
    Columns and Rows sliders run to the family's most (six, twelve), not to what the stage can hold, so past that the
    stage trims the block and the jig's number is more than is shown.
15. **Enter and exit into the move (M11).** When he picks, the values go into `globals.css` like any pick (M7). Whether
    movement's move then takes its leaving and arriving halves from them is a change to a decided motion, and his to
    say. The tokens cannot say two things the move does today: the old ring goes out well after its dot has left (one
    lead sets both ways), and a dot crossing more than a cell is unseen between its two cells, which an enter and an
    exit on one cell never need. Only a pointer's hover and Play enter it, as for movement (item 5).
