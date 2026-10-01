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
  sits in a band as tall as the tallest control in its row (36px for a toggle group or a select, 20px for a slider — its bar is 8px since his second tuning of the grip, M16,
  16px at his pick and 24px before it that day, Grid-v2.md D39, 2026-09-30),
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
      **Its dashes close as it shrinks** (his, 2026-09-28: *"just before the transition from one cell to another, the
      circle shrinks. So, while shrinking it should not be bordered circle. The dashes should slowly as they shrink
      should become full circle"*): each dash grows into its gap on the press's own curve, so the ring leaves its cell
      as a full circle and travels as one. *Before*, it travelled dashed and its dashes closed at the release.
    - **One move of movement's dot, straight there, all landing at once.** Then each goes straight from its cell to
      its section's, in one move with movement's values, nothing of its own: its curve (`-dot-ease`), its duration
      (`--motion-move-duration`), however far it goes, so every ring lands in the same moment, and its size, set by
      where it is (`travelScale`, M9, with `-dot-min` and `-dot-from`). So it drowns leaving its cell, is not seen over
      any cell between, and floats up in the cell it reaches, as movement's dot now does too. A ring with nowhere to go
      stays pressed on its cell, a full circle, until the rest land.
    - **Release, together, into a plain border.** As they land, every ring grows back to the cell's size over the
      press time. In the same moment their lime turns into the plain border a section wears (`--border`); their dashes
      closed at the press. The turn stops there.
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
  through the press and the travel, until each ring is released into a plain border (*"without the dashed borders"*),
  though from the press on its dashes are closed and it goes round unseen. `--motion-load-lap` is how fast it
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
rectangle round them (Grid.md D48, `data-load-section`). Since 2026-09-28 it goes the other way too. His words were
"I want all the cards to have one circle", so every card, label, button and mark on the portfolio is a ring of its
own, marked `data-load-box`. That is 37 at 1440 × 900.

`useGridLoad` and `GridLoader` (grid.tsx) play it through `useLoadMotion` and its painters, the same as the studio's
stage, on the tokens above. The ten rings on the portfolio's desktop stand as 3, 3, 3 and 1 (4, 4 and 2 first), and the page is in 2.4s
after load on a local server. The same night the fold became the square (above), and the border began to fade as the
section comes in (above), both first seen there.

**Off every page, 2026-09-30.** *"I want to remove all the current uh, loaders that we have. I did not like it. So, uh,
currently, just remove it and uh, let the components load quickly."* No page loads with it (Grid.md D49): the intro, a
turn's load, `useGridLoad`, `GridLoader` and the `data-load-*` marks are gone, and a page is shown as soon as the grid
has measured it. The motion is kept whole: `lib/load-motion.ts`, `useLoadMotion`, its painters, its tokens as he
picked them, and this page of the studio, where it still plays.

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

**M12 — Agent character design lives on the motion bench.** Bhargav, 2026-09-28: “I want that in motions library with jigs to design and control these properties of the agent.” The portfolio character is his **personal agent**, a **guide for visitors**, with an **energetic and expressive** temperament. Source observations and the developing brief are in Ontology-source.md and Agent-design.md.

The fourth family, **Agent**, is a design study: an abstract pill and two eyes on the transparent stage. As with the ring-and-dot specimens, this is drawn geometry; all controls use the design system. Its pure pose and timeline frames live in `lib/agent-motion.ts` in the package, so a future portfolio implementation can use the same motion model. The agent has not been added to the portfolio.

**The agent is authored directly (2026-09-28).** Bhargav rejected the suggested presets and asked to define his own with the controls to animate the character. Action and emotion menus and the five suggested personalities are removed. A blank pose is the reset state, not a personality recommendation.

The jig groups are **Body** (colour, opacity), **Start pose** and **End pose** (horizontal and vertical position in cells, rotation in degrees), **Path** (lift, sway, waves, rocking), **Left eye** and **Right eye** (diameter, position, gaze travel, end-size multiplier), **Blink** (depth, position, length, relative eye timing), and **Timing** (delay, outward and return duration, separate easing). Hold, loop and tempo remain on the transport. Motion is an outward gesture, a hold and a return, with an optional delay. Seeking paints the same pure frame as playback. The live view shows the end pose. Eye movement clamps inside the capsule; circular blinking shrinks the radius, never stretches an eye.

**Your presets** saves named snapshots of all values plus hold, loop and tempo, supports load, update/rename and deletion, and persists in the browser. Save new makes a distinct copy; Update replaces the selected snapshot explicitly. Reset clears the draft without deleting presets. Copy exports the draft, playback settings and named presets. This is local authoring, with no runtime or portfolio integration.

**M13 — The fifth is focus: a card in focus, the page blurring round it.** (*Named **hyper focus** on 2026-09-29,
his: "hyper focus will have the page five focus … even in motion let's change the names accordingly": the portfolio
plays it as one of its two modes, Portfolio.md P20. The studio's page 5 says Hyper focus; the family's id and its
`--motion-focus-*` tokens keep their name. **Off the portfolio since 2026-09-30** (Portfolio.md P21, his: "remove both
focus modes from the portfolio. We can have it the motion studio"): it plays on page 5 only, and stays decided.*) *2026-09-28, his, after seeing the
portfolio's first version (Portfolio.md P18): "the context of the component that I'm hovering on is lost … if I hover
on my name, my avatar is also blurred out. I want the blurring to start from the card with less intensity and then
increase the intensity in a circular fashion from the card … give me this effect with jigs in motion … I should be
able to control how the intensity starts flowing like a ripple … how do I define the intensity at each point … what
is the effect that it brings."* The first version blurred the screen from its centre out, wherever the card was. A
card by the edge had its neighbours blurred the most.

Focus is page 5. It is a model in the package, like loading: `lib/focus-motion.ts` (pure) and
`hooks/use-focus-motion.ts` (`useFocusMotion`, one GSAP ticker while anything moves). The portfolio played it through the
same hook until 2026-09-30 (Portfolio.md P21), so what was tuned here was what the portfolio did.

**The field.** The blur is a field of rings on the card's centre. It is least next to the card (`near`) and rises to
`far` over the reach (`reach`, in cells), along the rise's curve (`rise`, an easing of the way out). The rings are
measured from the circle through the card's corners, or from its centre (`from`), after an optional clear ring
(`clear`). The rise is drawn as `rings` steps. Each step is a full-surface layer with a `backdrop-filter` blur of what
is under it, the layers before it included. Blurs compound, since one of a over one of b is one of √(a² + b²), so each
ring adds what takes the field from the last step's level to its own. The field can only rise: a curve that dips is
held level.

**The motion.** The blur comes in by its way in (`way`):
- **ripple**: a front spreading from the card to the farthest corner, over `in` on `in-ease`, with a soft leading
  edge (`front`, in cells) and an optional extra blur riding it (`crest`);
- **swell**: the whole field's blur growing from nothing at once;
- **fade**.

It goes by its way out (`exit`), over `out` on `out-ease`:
- **clear outward**: a second front sweeping out from the card, sharpening as it goes;
- **recede inward**: the front going back into the card;
- **ebb**: the blur shrinking everywhere at once;
- **fade**.

Off every card it waits `hold` first, so a gutter crossed to the next card keeps it. From one card to the next the
field glides over `glide` on `glide-ease`, or jumps (`shift`). Only a few custom properties on the surface move: the
centre, the card's radius, the two fronts, the strength and the opacity. Each layer's mask reads them.

**The jigs.** Nineteen tokens in three groups, one on the tokens' jig at a time: **Intensity** (the field), **Ripple**
(the way in) and **Release** (the way out, the hold and the next card). The group select is now any grouped family's,
the agent's included. The Settings jig shows the group's lines, and Copy takes all nineteen.

The specimen is a page like the portfolio's first screen, made of system Cards: the avatar and the name, a note beside
four roles, the address and the résumé, three skills. Hover a card and it is in focus: its border goes violet over
`--motion-state`, and it stands over the blur until the blur has gone. The specimen's jig says which card a play starts
on and whether the rings are drawn. They are dashed lime circles, each labelled with the blur the field reaches there,
so the Intensity jig can be read on the stage.

On the timeline, a play goes in on a card, holds, moves to the next card in reading order, holds, and goes out.

**The stage keeps no paint containment for this family.** `contain: paint` makes an element the backdrop root in
Chrome, so the field's dashes under the stage stayed sharp while the cards blurred. The stage's slot still clips it.

**Decided, the same evening: round 1's C Tide, tuned.** He sent back the settings and said *"I like the following as
default"*. They are in globals.css verbatim, and `FOCUS_START` is the same values. The field is measured from the
circle through the card's corners:
- 1px next to the card, and nothing more for a clear ring four cells wide;
- then rising on ease-in to 22px over ten cells, in ten rings.

It comes in as a slow ripple from the card to the farthest corner, 1500ms, its front eight cells soft, with no crest.
Off every card it holds 250ms and fades over 800ms. From card to card it glides in 500ms. Every curve is cubic in-out.

From Tide he kept the ripple, the 8-cell front and the glide. He changed the rest:
- a clear ring of four cells, where Tide had none;
- ease-in for the rise, where Tide had linear;
- ten cells of reach, and ten rings;
- a fade out, where Tide receded.

Preset A is "Today" now, read off the page. B–E are the other four of round 1: B Ripple (round 1's A), C Swell,
D Spotlight, E Fade. It costs ten full-screen blurs plus the one at the card, eleven layers, each redrawn on every frame
of the 1500ms ripple. That is the place to look if it stutters on a slower machine, and Rings is the control that sets
the cost. **A card reached from another is lifted once the field arrives** (his "a lot of flicker while changing from one to
another", the same evening, Portfolio.md P18). The focus, and the violet, move at once. The card is lifted over the
blur only when the glide ends, so it never snaps from its place in the field to sharp. The card left goes under at
once, at the field's least. The layers also leave out any front the motion never moves: a ripple in with a fade out has
no clearing front. The five presets of round 1, as they were:
- **A Ripple**: 1 → 18px on ease-in over 8 cells, a 700ms ripple with a 6px crest, clearing outward, gliding.
- **B Swell**: no front; swells in and ebbs out.
- **C Tide**: a slow, wide linear ripple that recedes back into the card.
- **D Spotlight**: a clear ring a cell and a half wide, then a steep rise to 24px, a fast ripple with a strong crest,
  and a fade.
- **E Fade**: the portfolio's first version, but centred on the card, as the baseline.

Each preset's reason and risk are in `content/focus.ts`.

**Amended the same night: the blur is a cloth, not a ripple.** *His, hovering the avatar: "the blur sheet reaches
the bottom right corner … I want to consider that as a cloth, a blurring cloth, not as a ripple. So change the jig
controls based on that, and the cloth should reach every corner of the viewport. So I need controls about the lift,
about the intensity, about the cloth controls and all."* The ripple's circle is gone from the model. What replaced it:

- **The cloth.** The field is unchanged: the rings and their blurs, measured from the card. What changed is where it
  shows. The field now lies on a cloth: a rectangle attached to the card's box and drawn out from under it (`spread`,
  "Drawn out" on the jig). Each of its four edges goes out to the screen's matching edge, and past it by the hem, so
  its corners run straight to the screen's corners.
  - **Pull** is how the edges share the way. At 100% each goes at its own speed, and all four arrive together: every
    corner of the cloth reaches its corner at once. At 0 they all go at the farthest one's speed, so the nearest edge
    lands first and the far corner last. That is the sheet he saw going to the bottom right.
  - The **hem** is the cloth's edge, in cells: soft across that width, crisp at 0. It is the ripple's front, renamed.
  - The **fold** is an extra blur along the hem. It is the crest, renamed.
  - It can still **swell** or **fade** in instead of being drawn out.
  - The four edges are four gradients on each layer's mask (`clothEdges`, `focusLayerStyles`), never a clip, which
    Chromium mishandles under a `backdrop-filter` (M14).
- **Measured from** has a third choice, **its edges**: the rings are measured from the card's box, square-cornered as
  focus mode's are. The circle through its corners and its centre stay.
- **The lift.** The card in focus comes up over the cloth over `lift` on `lift-ease`, and casts a **shadow** on it (px,
  its offset half of that) of a **shade** (how dark). The shadow is a box drawn on the cloth's surface under the card,
  black in either theme, because a light one would be a glow. The card itself is never moved or scaled. Gliding to
  another card, the card left drops at once and the next lifts once the cloth has come. The lift goes down with the
  cloth as it goes.
- **The way out** is **drawn back** under the card (the spread reversed), where it was clear outward and recede inward.
  **Ebb** and **fade** stay.
- **Every corner of its container.** *His, after: "I did not mean the actual complete viewport … I meant the
  container, whatever the container we are putting it in."* The cloth's edges go to the corners of the surface it
  covers, whatever that is. On the portfolio that is the screen. In the studio it is the stage, clipped by its slot,
  and the jigs round it stay sharp. For one play the studio's surface was the whole screen, jigs and all, and he sent
  that back.

Twenty-four tokens in four groups, one on the jig at a time:
- **Cloth**: way in, in, in ease, pull, hem, fold;
- **Intensity**: at the card, far, clear, reach, rise, rings, measured from;
- **Lift**: lift, lift ease, shadow, shade;
- **Release**: way out, out, out ease, hold, next card, glide, glide ease.

`--motion-focus-front` and `--motion-focus-crest` are now `-hem` and `-fold`. `--motion-focus-way` is
`spread · swell · fade`, and `--motion-focus-exit` is `withdraw · ebb · fade`.

**Today keeps every number of his pick**: the field, the 1500ms in, the eight-cell hem that was his front, no fold, the
hold, the fade out, the glide, cubic in-out. The one value that changed is the way in, `spread` where it was
`ripple`, as he asked. The new tokens are mine, not his yet:
- pull 100%, since he asked for every corner;
- a 300ms lift;
- no shadow, so the portfolio looks as it did but for the cloth.

The portfolio plays it, since it is the package's hook. An eight-cell hem is wider than half the cloth for most of its
way out, so Today's cloth thickens in late rather than showing an edge. B shows one.

Round 2, the cloth (round 1's four are above):
- **B Sheet**: no hem, so a crisp edge; every corner at once in 900ms on expo out, measured from its edges; a 24px
  shadow; drawn back on the way out.
- **C Unroll**: pull 0, the nearest edge first and the far corner last; a four-cell hem with an 8px fold; round rings;
  a fade.
- **D Drape**: a twelve-cell hem, 2000ms on the iOS sheet's curve, pull 60%, 26px measured from its edges; a slow,
  deep lift; an ebb.
- **E Swell**: no travel, the cloth swelling over every corner in 500ms; the baseline.

*What is mine, his to change:*
- the reading of "lift" as the card coming up over the cloth, drawn as a shadow, rather than the card coming towards
  the eye (his note on focus mode, M14: the components "have to remain at the level that they are at");
- the cloth as a rectangle with square corners, which is what four gradients draw.

`node e2e/.mcp/focus-cloth-seek.mjs <out> [preset] [theme] [WxH] [card] [ms…]` starts the play on a card and seeks it
to the moments given, printing the cloth's four edges and the lift. `focus-cloth.mjs` hovers the avatar, and
`portfolio-cloth.mjs` does the same on the portfolio.

**Decided again, 2026-09-29: round 2's C Unroll, tuned.** He sent back the settings from the studio, *"Update the
Default hyperfocus values to the following"*, headed "Hyper focus — C Unroll, tuned". They are in globals.css verbatim,
and `FOCUS_START` is the same values. From Unroll he kept the circle through the corners, ten rings, ease-in, no fold,
the fade out and the glide. He changed the rest:
- the way in is a **fade** over 80ms, where Unroll drew the cloth out over 1400ms. Nothing is drawn out, so the cloth
  has no edges to move, and its pull (50%) and hem (twelve cells) are kept but play no part until a way in or out moves
  it (`focusLayerStyles` leaves the edges out);
- 1px next to the card and a clear ring **one cell** wide, then rising to **16px** over **21 cells**, more than most
  screens, so the far blur is seldom reached and the field stays near its middle;
- the card lifts in **300ms** on cubic in-out with **no shadow**, where Unroll had 400ms and 16px;
- a **120ms** hold, a **400ms** fade out and an **80ms** glide, every curve cubic in-out.

So hyper focus is now quick: the cloth is there within five frames of reaching a card and gone half a second after
leaving the last one. Preset A, "Today", is this; B–E are round 2 as they were. The Today it replaced, round 1's C
Tide, tuned, as a cloth, is recorded above. The portfolio plays it with no edit, since it reads the tokens.

**M14 — The sixth is focus mode: one vertical at a time, under a panel, with a cloth over the rest.** (*On the
portfolio from 2026-09-29 as its focus mode, the other being hyper focus (M13), Portfolio.md P20. **Decided the same
day**, his "A As described, tuned", below: its tokens are in globals.css. **Off the portfolio since 2026-09-30** with
hyper focus (Portfolio.md P21): it plays on page 6 only, and stays decided.*) *2026-09-28,
his, the same evening: "The portfolio has already a lot of information on it … the idea of having that page is to
quickly have a glance so that anyone can decide the value of the portfolio within seven seconds. So I want to provide
an option called focus mode where it can stay in the bottom right. Once we turn it on there should be an overlay on
top of the first section, and it should feel like it's a little above the section, like it's coming out of the screen
in 3D. The rest should feel like a cloth overlay … start blurring out from the edges of the focus component, like a
cloth, increasing the same blur default that we have right now … like we are looking through a panel that gives us more
focus on that vertical … three verticals … the user can click between the verticals … bottom center … should be the
cells … once we move from one vertical to another, the focus component should slide from one vertical to another …
add this to the motion application so that I can control using the jigs and then decide the settings."*

Page 6 of the studio. The motion is the package's: `lib/mode-motion.ts` (pure) and `hooks/use-mode-motion.ts`
(`useModeMotion`, one GSAP ticker), so what was tuned here was what the portfolio played (P20, 2026-09-29 until P21 took it off, 2026-09-30).

- **The panel.** A see-through frame in the secondary colour, the vertical's box plus a margin, lifted towards the eye
  through a perspective, swinging about its horizontal axis on the way (none at rest, all of the tilt half way, so
  nothing jumps as it sets off or lands), with a flat shadow that grows as it lifts. **Only the panel lifts** (his, the
  same night: "the components that are in the focus mode should not scale. They have to remain at the level that they
  are at"). The vertical's own cards are never moved, scaled or swung. They keep their place and their size on the
  page under the panel, and they stand over the cloth, under the panel. Until then they came out with it, by the
  same transform about the panel's centre, which made them 4% larger at A's depth and 12% at C's.
- **The panel rises straight out of the page, its whole line there** (his, 2026-09-29: *"Let's redesign. Instead of
  border start from top and all, let's just have the option to border to rise from the viewport directly with out
  that border animation"*, and, of a switch, *"the vertical in focus will repeat the steps backward and the other will
  get into focus"*). The way in is two steps: the panel rises to its depth over `lift` on `lift-ease`, and the stagger
  after it sets off, the cloth comes (`modeOnAt`). The way out is the same steps backward: the cloth goes over `out`
  on `out-ease`, and the stagger after it the panel sinks back into the page on the rise's time and curve
  (`modeOffAt`), by its own time and curve, the **drop**, since his ask the same day. The panel shows while it is off
  the page. The line is **fine** on the page and grows to the
  **border** as the panel rises (the square of the rise, so it stays fine for most of the way). `--motion-mode-draw`
  and `-draw-ease` and the arc-length cut of the line went, and `modePanelParts` with them; the rest of this bullet is
  the record of the draw, 700ms on cubic in-out at his numbers.
  *Before*, the same day: **the line was drawn, then the panel lifted.** *His, the night before: "Let's remove the peeling effect … I want the
  border of the focus panel to start from the top and then go down to the bottom … and then slowly rising up, so we
  can completely remove the peeling features and its jigs."* The panel's line sets off from the middle of its top and
  runs both ways round it at once, down the two sides and round the bottom corners, the two ends meeting at the middle
  of its bottom (**draw**, on its **draw ease**, by length along the line, so the top, the sides and the bottom each
  take their share of the time). Then the panel lifts off the page whole, to its depth. The two are parts on one clock
  (`modePanelParts`), and going back plays them mirrored: the panel comes down, then its line runs back up to the top.
  The line is **fine** on the page and grows to the **border** as the panel lifts (the square of the lift, so it
  stays fine for most of the way). A box's border cannot be drawn part way, so the panel is an outline (`modeShape`):
  each point of its rounded rectangle is swung by the tilt, lifted, and projected through the perspective from the
  panel's own centre, and `paintModePanel` draws it as SVG, the line a band filled inside the outline, as a border
  runs inside its box. Its shadow is cut out where the panel is, as a box-shadow never paints inside its box, and is
  **the line's own colour** (his, the same night: "the shadow should be derived from the border"): the panel's
  `currentColor`, the secondary, mixed 12% to 22% as it lifts. *Before*, it was the page's foreground, white on the
  dark theme.
  *Before*, the same night, it came off the page like a sticker (his: "starting from the bottom, it should come up like
  a sticker that is stuck on the surface"): a front crossed it from an edge or a bottom corner, the panel curling up
  behind it at an angle to a ceiling and running flat there, lifting off whole with part of the peel still to go, and
  letting its curl go as it rose, with its line only where it had come off the page. Ten tokens in a **Peel** group
  (from, peel, peel ease, angle, height, curl, release, keep, let go, let go ease) played it. All of it went on his
  note, the model's bending and the jig's group with it.
- **The panel is over everything, and the cloth is attached to it.** *His, the same night, of a frame early in the
  peel: "While peeling, the cloth is not attached to the panel … the panel should ideally be over the components and
  also cloth attached to it, but I see that the panel is still below the component and then after the animation is
  completed it's coming up."* The panel stands over everything on the page, the vertical it holds too, and under only
  the switcher and Focus. The cloth's hole is the panel as seen, no wider than it lying flat at its lift, so the cloth
  meets the line all round, and a part the tilt swings nearer than that passes over the cloth. The hole cannot be the
  outline itself. Clipping each layer to it with `clip-path: path()` was tried first, and Chromium then drops a
  `backdrop-filter` layer's `mask-image`, blurring everything to the far blur and blacking out narrow edges. It does
  this under any `path()` or `polygon()` clip, even a plain rounded rectangle written as a path. Only `inset()` and a
  plain rectangle keep the masks (measured 2026-09-28).
- **The cloth.** Focus's field (M13, `focusRings`), measured from the panel's edges instead of a circle round a card:
  each ring's layer is masked to what lies farther than its ring from the hole's rectangle, by four gradients. **It
  covers its whole container, full at its edges** (his, 2026-09-29: "the blur is not being applied on the grid, it is
  only being applied on the components … I expected cloth to work as the full container … that should be full
  overlay"). On each side of the panel the rise is spread over the reach or over what is left to the container's edge,
  whichever is less (`modeRingEdges`), so every edge of the container is at the far blur. *Before*, the reach was ten
  cells on every side, more than the stage has, and the field next to the panel was at a pixel or two, too little to
  take its dashes while the cards' text beside them went soft. And his note found a fault in the system: the Avatar's
  ring blends (`mix-blend-darken`, `-lighten`), and Chrome isolates the nearest stacking context to blend it (here the
  stage, which layout containment makes one), which made the stage the cloth's backdrop root and left the grid's field
  under it sharp whenever the profile was not lifted over the cloth: after any slide, and on page 5 whenever a card
  other than the avatar was in focus. The Avatar is `isolate` since (avatar.tsx), so the ring blends with its own
  picture only. It comes
  and goes by its way: **unfurl**, rolled out from the panel to the far corner (a rounded rectangle, the system's
  corner, clipping the layers) and rolled back into it; **swell**, strengthening everywhere at once; or **fade**. Coming
  in, the cloth sets off the stagger after the panel starts to rise; going, the panel sinks the stagger after the
  cloth, so the panel is up whenever the cloth is out. A **veil** of the page's colour can be laid over it.
- **The switch: the one left unfocuses as the next focuses** (his, 2026-09-29: *"Instead of sliding the focus
  container, we should just unfocus while refocusing on the next one. For example, if moving from 1 to 2, both 1
  unfocusing and 2 focusing should start at a time."*). Every vertical has a panel and a cloth of its own. Moving
  from one to another, the one left plays its way in backward (its cloth thins, then its panel sinks back into the
  page) and the next its way in (its panel rises, then its cloth comes), both from the same moment, each on
  its own clock (`modeOffAt`, `modeOnAt`), so the switch is over when the longer is (`modeSwitchMs`). The two cloths
  lie one over the other, and where both are out their blurs compound. The one left goes under the cloths at once,
  its own cloth's hole keeping it sharp while the next one's comes over it; the next stands over the cloths once the
  one left is all gone. A vertical pressed again while it is going comes back from where it stands. Neither moves.
  *Before*, the panel slid from vertical to vertical and the hole went with it, a lens, over `slide` on `slide-ease`,
  sinking by `dip` on the way; his were 500ms, cubic in-out, no dip. The three tokens and the jig's **Slide** group
  went with it, as the peel's did.
- **The cells.** Bottom centre, one a vertical, the one in focus grown to two with its title: the numbered pager's shape
  (Grid.md D47), playing movement (M9) at its decided values as the vertical changes. They come up with the panel.
  Focus, the toggle, is on the bottom-right cell, violet when on. **Both are on the bottom row** (his, the same night:
  "Move the one, two, three options to the bottom row. It's obstructing the view"): the stage's last row, never the
  row right under the verticals where the stage has room below them. A card of another vertical, pressed, moves the focus
  there too. Both stand over the cloth.

Twenty-four tokens in five groups, one on the tokens' jig at a time: **Lift** (lift, lift ease, drop, drop ease),
**Panel** (depth, perspective, tilt, shadow, margin), **Line** (border, fine), **Cloth** (at the panel, far, clear,
reach, rise, rings, veil) and **Roll** (way, in, in ease, out, out ease, stagger). A switch has none of its own: it is
the way out and the way in.
`--motion-mode-border` is the panel's line, 2px as it was, 0 to 8 (his ask, the same night: "I also
need a panel border width control"), the line once the panel is up; `--motion-mode-border-fine`, 0.5px, the line on
the page (E keeps 2px throughout, as the baseline). It runs inside the panel's box, as a border's does, and the shadow
is cut out under all of it. **The drop is timed on its own** (his, 2026-09-29: *"In Focus Mode, I need controls to
control the lift and drop timings"*): `--motion-mode-drop` and `-drop-ease` are the panel going back into the page,
where the lift's pair had timed both ways; they start at the lift's values, 90ms on ease-out, so nothing changed until
he tunes them, and a preset that names no drop drops as it lifts. When the drop starts is still the stagger after the
cloth sets off going, the same token that times the cloth after the lift. All twenty-four are in globals.css since his
pick (2026-09-29, below), so preset A is
"Today". The specimen is the portfolio's first screen as three verticals of system Cards (the profile, the work, the
projects), **each three columns wide with two columns between them** (his, 2026-09-29: *"focus mode should have 2
columns beween gap between one vertical and each vertical should have 3 columns"*; they were two wide with one
between, where the block had room), and a row of room over and under them. The block's Columns start at fifteen, the
thirteen and a column of margin either side for the panel. Where the stage is narrower the verticals keep their three
and the air goes first: the preview is nine columns at 1440 × 900 (M15's right half), so there they stand side by
side, and thirteen at 1920 × 1080, where the air is his but there is no margin and the outer panels' lines are cut at
the stage's edge; from 2560 wide all of it fits. Its jig says which vertical a play
starts on and whether the rings are drawn. On the timeline a play is on, hold, a switch, hold, a switch, hold, off.

*What is mine, his to change.* The presets, the four gradients' square-cornered falloff (a ring's corners are
Chebyshev distance, not rounded), the violet frame, the cells' movement, and a press on a card as a second way across.
The panel showing only while it is off the page, so it is there from the first frame of the rise and gone as it
lands; the way out taking the cloth's own out time and the rise's curve, not the way in's times played in reverse; and
the shadow, whose offset and blur grow with the lift and no further; and the drop starting at the lift's values. The line stays 2px however near it comes.

Round 1, as it was (A is "Today" since his pick, below; the slides went with the slide):
- **A As described**: his brief read literally. Its line is drawn from the top in 700ms on cubic in-out, then it
  lifts 48px out through 1200px on the iOS sheet in 520ms, a 6° swing, a 40px shadow, a margin of 8. The cloth is
  today's focus field with no clear margin, "from the edges": 1px rising on ease-in to 22px over ten cells in ten
  rings, unfurling in 1500ms from 120ms after the lift sets off, and rolling back in 800ms, 120ms before the panel
  comes down, cubic in-out. A 500ms slide that stays out.
- **B Lens**: the line snapped round in 280ms on expo out; barely lifted, no swing, a quick unfurl on expo out; a fast
  slide.
- **C Sheet**: the line drawn in 800ms on ease-in, slow off the top; then 96px out through a near 900px, a 14° swing
  and an overshoot; the cloth swells; the slide dips most of the way down.
- **D Drape**: a slow line, 1100ms on ease-out; a veil of 25% over a slow unfurl, a cell of clear margin, a slight dip.
  The veil is translucent, which the no-glass rule forbids outside his exception: it is here for him to see and refuse.
- **E Flat**: no 3D and no roll, the frame drawn in the state's time and a fade; the baseline.

(Until his note the presets differed in their peel too: A from the bottom round a 72px curl at 20°, B a crease, C the
bottom-right corner at 36° round 160px, D a 240px roll. The peel's values went with it.)

**Decided, 2026-09-29: A As described, tuned.** He sent back the settings from the studio with hyper focus's, *"and
focus mode to the following"*, headed "Focus mode — A As described, tuned". They are in globals.css verbatim, and
`MODE_START` is the same values. From As described he kept the line (drawn in 700ms on cubic in-out, 0.5px on the
page, 2px once up), the 40px shadow, no clear margin, the 120ms stagger and the 500ms slide that stays out (the slide
and then the draw went the same day, above; the line's widths stay). He changed the rest:
- **the panel**: a quick lift, **90ms on ease-out**, where A took 520ms on the iOS sheet; **80px** out through a near
  **800px** perspective, where A was 48 through 1200, so it stands about 11% larger than the vertical it frames; a
  swing of **-3°**, the other way round and half A's; and a **16px** margin, the most the jig has, where A had 8;
- **the cloth**: **2px** at the panel rising on **expo out** to **7px** over at most **sixteen** cells in **seven**
  rings, where A rose on ease-in to 22px over ten in ten. Expo out puts most of the rise next to the panel, so the
  cloth is nearly all at its 7px a cell or two out: a light, even blur rather than one thickening outward;
- **a veil of 60%** of the page's colour over it, the most the jig has, where A had none. The veil is a translucent
  wash, which the no-glass rule of 2026-09-16 forbids; this is his pick, so it is his second exception to it, beside
  hyper focus's blur;
- **the roll**: it **swells** in over **250ms** on ease-in and thins out over **1000ms** on cubic in-out, where A
  unfurled over 1500ms and rolled back over 800ms. A swell has no edge, so the rounded clip of the unfurl is not
  drawn.

Preset A, "Today", is this; B–E are round 1's other four as they were. The portfolio plays it with no edit, since it
reads the tokens.

*A switch no longer clears the page.* While the line was drawn, the one left's cloth was nearly gone (about 2%) by
the time the next one's set off after its 700ms line and the stagger, so for about a fifth of a second the page was
nearly sharp. With the draw gone the next cloth sets off 120ms in and is out by 370ms, while the one left's is still
at nine tenths, so there is always a cloth over the rest of the page (measured on the portfolio at 1440 × 900).

Each preset's reason and risk are in `content/mode.ts`. `node e2e/.mcp/motion-mode.mjs <out> [presets] [theme] [WxH]`
turns to the page, presses Focus, the second and third cells and Focus again, printing each cloth (shown, its swell,
its hole) and which vertical is lifted, and shoots each; `motion-mode-play.mjs <out> [preset] [theme] [WxH] [ms…]` shows the rings
and shoots a play from the start at the moments given. (`motion-mode-draw.mjs` shot the draw, which is gone.)
`motion-mode-still.mjs <out> [presets]` fails if a card's box moves by more than half a pixel through the rise and a
switch;
`motion-mode-line-jig.mjs <out.png>` shoots the Line group on the jig, and `motion-mode-lift-jig.mjs <out.png>` the
Lift group's two pages (the studio has no pages since M15: they pick the family from the nav's select). On the portfolio, `modes-switch.mjs <out> [WxH]
[theme] [ms…]` samples every vertical's cloth and panel each frame through a switch and a press back part way, and
`modes-tokens.mjs` prints both families' tokens as the page computes them; `modes-drop.mjs [--motion-mode-drop=1200ms …]`
overrides tokens and prints how long the panel stays up after the mode goes off.

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

## M15 — The studio workbench (2026-09-29)

Bhargav approved the generated layout and asked to implement it with the current work: *"all of them put on the grid
because that's our primary layer"*; navigation and the heading take the left half and the preview grows one row up.
This supersedes M5's three-column studio and its family pager, not the grid or any motion's behavior.

The main route is one `Grid`. The first row's left half is the motion-family selector and theme toggle; the second
is the family heading, preset selector, reset and copy. Four jig slots fill the left half below them. The right half
is a transparent stage, starting on the heading's row, one row above the jigs. The bottom two rows are the shared
transport across the entire field. All boxes use whole cells and the field's gutter; there is no independent preview
grid. Intro loading and the system cursor stay. The family selector replaces the numbered pager and accidental
wheel-driven family changes. There are still only the six named motions.

The jig titles and controls come from the family's real tokens. Movement is Timing, Scene, Shape and Easing; the
mockup's illustrative settings do not add motion parameters. Numeric inputs and sliders edit the same value, bounded
and snapped to the token's range and step. Longer groups page within their slot; grouped families let each token jig
choose a group, so Cloth, Intensity, Lift and Release all remain accessible. Presets and settings are actions in the
heading, not permanent tall side panels. Copy includes every token, even those on another jig page.

The Agent retains its chart, inspector, saved charts, settings, undo, recording and takes. Its left half shows one
of its four jigs at a time, selected in the heading; the stage and transport stay. On narrower fields a workspace
selector switches between Preview and the jigs without unmounting the real stage, so edits, recordings and a paused
playhead survive the switch. A shorter wide field shows one selectable jig beside the preview instead of squeezing
four cards. The older `/concepts/*` studies remain separate comparisons.

`layout.ts` derives the boxes from the measured field; `studio.tsx` composes them; `studio-jigs.tsx` composes the
system controls. No new primitive, stylesheet, motion token or copied motion model was introduced.

**Amended the same day, his** (*"I like the dropdowns in the image and the player control designs … place it in the
right half, under preview"*, then *"let's make the layout more functional and aesthetic"*). **The transport is the
preview's**: the bottom two rows of the right half, under the stage, and the jigs take the left half to the bottom.
It is drawn as his player: ↺ in an outline circle and play or pause in a lime one, the time, then Loop (a switch) and
Tempo (a select) on the first line; on the second, a lime slider with a violet thumb over the play's phases, each a
pill with its name and ms, the one the playhead is in the lime tint, and a violet line from the thumb down through
them. The slider and the phases are one axis — the phases stand a thumb's half in from the slider's ends — so the
line crosses each phase at the moment the thumb is at. A phase that is a setting still drags. A pill too thin for its
text lets the ms go first, then its grip, then sets its name a size down. Undocked, in a concept study's one-row slot,
it is his mock's one line. **The head is boxes of its own**, none inside another: the first row is the studio's name on
a lime bar, the theme toggle at its round end, and the family select a pill of three cells at the left half's far end;
the second is the heading, Reset and Copy a cell each — the cell's own circle — and the preset select under the
family's, three cells (the agent's jig select there). Each stands on the page's colour, which masks the field's lines,
and only the controls draw an edge. The bar is a surface slot in `--primary`: Slot's four fills (Grid-v2.md D21) have
none of lime, and a fifth is his call. On a narrow field the head is the field's width, the preset shares the third
row with the chooser, and a bar under four cells gives its toggle to the heading's row. The system's selects became
his dropdowns the same day: outlined pills with the chevron inside, `primary` filled lime.

**Control-room revision, 2026-09-30.** Bhargav asked to repair the layout, use the design system, and borrow from the
portfolio while keeping the studio a control room and experiments lab. The implementation now separates a five-cell
instrument column from the transparent stage with one column of air. The studio bar anchors the instruments;
family, preset and the two circular actions share the toolbar over the stage. The stage's player stays directly
beneath it. At twelve rows, the instrument column has a token jig above Scene, rather than four equally weighted
cards. Every token group is selectable, with controls paged to the slot's available height. Agent retains its own
four views. Shorter desktop fields keep the stage beside one selectable jig; medium widths put preset and actions
on a second toolbar row. Narrow fields retain the workspace selector and mounted stage. The composition uses the
existing system components and tokens; no motion behavior or decided value changes. Focus mode's specimen leaves
out its explanatory note when fewer than two rows remain, rather than clipping it into a single cell.

**Compact pass, later on 2026-09-30.** His: "Make it more compact and functional." The wide workspace now uses one
header row, no empty divider column, and a seven-cell instrument rail. Movement and Loading show their controls
together in two columns; larger sets page by the available height, and grouped families retain their group selector.
The Scene panel takes four rows, without repeating the specimen hint. The stage starts directly beneath the toolbar.
Medium widths retain the narrower rail and a selectable jig. The phone header takes two rows: Studio and family,
then workspace, preset and the two circular actions. Theme stays in Studio's bar. This returns one row to the phone
workspace without shrinking the grid's cells or its touch targets.

**Content-sized surfaces, same day.** His correction: "There are elements that are taking full widths and heights
even if it's not necessary." The token and Scene cards now size to their contents and stack with the standard gap
inside the instrument slot. Reserved rows bound pagination, not card height; the Scene card follows the actual token
card instead of starting at a fixed row. Other jig cards also stop stretching to fill the field. The desktop studio
bar is four cells, family and preset selectors three each, and Reset and Copy one each, leaving the unused toolbar
cells unfilled. The stage and transport retain their allocated workspace.

**The stage at the centre, the jigs either side and dragged, 2026-10-01.** His: *"Right now, Motion Studio is all over
the place … I want the timeline control to be maximum of uh, 10 columns … I want anywhere the control jigs to be a
maximum of uh, six columns. And I also think it will be nice if I can drag and drop these jigs into different locations
if I want to. And uh, the component should always uh, be in the center."* Version 1 of it:

- **The stage is at the field's centre**, always. On a field fourteen columns or wider and eight rows or taller, the
  jigs stand in two columns, one either side of it, from under the head to the field's foot: each as wide as the room
  left, four cells to six (four on a field of up to eighteen columns, 1440 wide; five on twenty; six from twenty-two,
  about 1600), and where the stage would be narrower
  than ten, it takes the room before the jigs grow past four. The timeline is under the stage, centred, **ten cells at
  the most**. The head keeps its one row. `studioLayout` in `src/lib/layout.ts` (`JIG_MAX`, `TIMELINE_MAX`).
- **The agent sits at the stage's centre** when nothing plays, the cell left of and over the middle where the stage is
  an even number of cells, so it stands on one. It sat in the nest the default jump started from until then.
- **Every group is a card of its own** in the columns: a family's token groups, or Timing, Shape and Easing where it has
  none, then Scene; on the agents, Motions and Row. They are split between the two columns in order, so the taller is
  as short as it can be. The group select on the token jig went: every group's heading is on the page, as his notes
  on Orbit asked (*"individual cards of controls for each of that with heading"*). A card is two controls to a line at
  six cells and one below.
- **A jig is dragged by its grip** (⠿, at the head of each card): to the other column or another place in its own, the
  cards making room as it passes, its border violet while it is carried, as the portfolio's hovered card was (P18).
  Escape while dragging puts it back; the grip's arrows move it from the keyboard (↑ ↓ in its column, ← → across). Where
  he leaves them is kept per motion, in the browser with the studio's other settings (`no-origins:motion`, `jigs`).
  The cards jump to their places; that move has no motion of its own yet.
- **A column too short for its cards folds them** (Orbit.md C9's pattern): when it cannot give each card three lines of
  controls, one is open and the rest are their heading alone, and pressing a heading opens that card and folds the
  other. Where they fit, the room is shared — a card that needs less than an even share takes what it needs — and a
  card pages its controls when its share is short (Grid.md D5).
- **Narrow fields** keep one view at a time, the jig six cells at the most and centred, the timeline ten. The agents'
  Rows is a view of its own there (it was under Motions, and cut off on a phone).

*Mine:* the stage's width is what is left: ten cells at 1440, eight at 1280, fourteen at 1920. At 1280 focus mode's
three verticals are tight in eight. And there is no button to put the jigs back where they started; dragging them is
the only way, for now.

## M16 — The seventh is the grip: the slider's head detaches into the cursor (2026-09-30)

*His, the morning after the slider became a bar (Grid-v2.md D39): "Let's try a motion for this slider."* A motion he
named, so it is on the bench (M9), page 7, after focus mode. It has had two briefs the same day.

**The brief now** (his, the second): *"We'll keep everything rounded, so including the head. But let's merge both head
and body. But when I click, the cursor doesn't need to fill: the head should detach and fit into the cursor."*

- **The shape is the component's.** At rest the slider is a 24px pill (16px at his pick, 8px since his second tuning, below) with its head merged into it: a circle the
  bar's height over the join of the lime and the grey, so the lime ends in the head (D39, withdrawn square). No gaps.
- **Held, two parts move.** **The bar** opens round the head: its two sides draw back to stand 2px clear of the
  cursor's ring (half the bar and the gap from the head's centre) and round their ends. **The head** shrinks to its size
  in the cursor, a 16px dot 2px clear inside the ring's line, and goes to the cursor's centre. **The cursor stays a
  ring** while a head is held (Grid-v2.md D43, amended). Let go, the head comes back to its place at the value and
  grows, and the bar closes over it.
- **The head follows the hand while held.** Along the bar it stays on the bar; across it, it follows the cursor
  anywhere over the bar, so a press off the bar's middle still puts it in the ring. The bar's opening moves with it, so
  a stepped slider's head is smooth under the hand and lands on its step when let go. *Mine:* the clamp to the bar.
- **Held is the pointer's, and the head it holds.** A press on a head holds it; a press on the bar holds the head
  nearest the press, the one radix moves there. The slider marks it `data-held` from the press to the release (or a
  lost capture), and follows the value if a range's head is dragged past the other. The keyboard never holds a head.
- **Played from script, modelled in the package.** `lib/grip-motion.ts` is the motion as a function of time
  (`readGripMotion`, `gripAt`, `gripFrame`, `paintGrip`); `hooks/use-grip-motion.ts` (`useGripMotion`) plays it on the
  slider, one frame loop from the hold to the end of the let go, writing the head's move and scale on the head and
  where each side stands on the track (`--slider-shift-<i>`, `--slider-hole-<i>`, `--slider-round-<i>`, which the
  segments read). A hold let go half way goes back from where it is. Under reduced motion both ways take no time.
- **The tokens, `--motion-grip-*`**, in globals.css since his pick (below; until then preset A carried them), and
  the model falls back to the same (`GRIP_START`): `-in` and `-out` (ms), `-in-ease` and `-out-ease`, `-size` (the head's side in
  the cursor, px; the ring is clear inside 20) and `-lead` (−0.6 to 0.6: + the bar opens first and closes last, − the
  head goes first).
- **The specimen** is the system's `Slider` on the stage's rows: Columns are the sliders' length in cells, Rows how
  many, every second a range. Live, it is pressed by hand. On the timeline a play is detach, hold and merge, a rest
  after it on a loop, painted on the first head of each slider, with the cursor drawn over it as a ring of its own.
- **The presets, round 2**, each a different mechanism. A *As described*: both parts at once, 200ms each way on cubic
  out, a 16px head. B *Part*: the bar first, lead +0.4. C *Lift*: the head first, lead −0.4. D *Snug*: a 20px head
  filling the ring, on an overshoot. E *Snap*: timing, 80ms in and 420ms out, a 12px head.

**The body flows** (his, the third brief, the same night, after the segments: *"Let's not have segments, I did not
like it. But instead of segments, let's make the body more fluid. I mean, give me the controls. And then the head
should be circular, and, as previously said, it should just fit into the cursor like previously."*). The head is the
grip's, as above. The body follows it:

- **On a spring.** Where the bar's two sides meet under the head at rest, or part round it held, chases the head on
  a spring of a response and a bounce (`lib/spring.ts`, solved in closed form): a quick drag leaves the lime behind and
  it pours after the head, a bouncy one overshoots and comes back, and a jump of the value by the keyboard flows the
  lime to it. Every head has one, held or not, whenever its value moves.
- **The ends round when they leave the head**, as well as when the bar opens, so an end left behind is a pill's end,
  never a square one; and **a moving end stretches** its cap along the bar with its speed (an elliptical corner).
- **The bar's height is a control**, `--slider-height` (the smooth slider's `--slider-bar` reads it; 8px since his
  second tuning, in globals.css, 16px at his pick, 24px until then): the
  half height he asked for with the segments is preset B's. The ring the head goes into stays the cursor's 24px.
- **The tokens now**, in two groups on the jig. **Head**: Detach and Merge (`-in`, `-out`, and their eases) and Size.
  **Body**: Height (`--slider-height`), Bar lead, Follow (`--motion-grip-follow`, ms) and Follow bounce, and Stretch
  (`--motion-grip-stretch`). In globals.css since his pick, below; `GRIP_START` is the same.
- **The presets, round 3**, each a different body. A *As described*: a soft follow, 320ms at 0.2, a little stretch, the
  bar 24px. B *Thin*: the same at 12px. C *Liquid*: a slow, bouncy follow, 700ms at 0.45, and a long stretch. D
  *Tight*: 140ms, no bounce, no stretch, the rigid baseline. E *Elastic*: springs everywhere, a 20px head on an
  overshoot, the body at 0.6.
- **On the timeline** a play is detach, a drag of two cells along the bar and back (the body following both ways,
  `springFollow`), hold, and merge.

**Decided, 2026-09-30: A As described, tuned.** He sent back the settings from the studio, *"The following should be
the values for sliders now"*, headed "Grip — A As described, tuned". They are in globals.css verbatim, the bar's
`--slider-height` with them, and `GRIP_START` and the slider's own fallback are the same values, so every `Slider` in
every app plays it. The studio's preset A is "Today", read off the page. He changed every token of A's:
- **the bar is 16px**, two thirds of the cursor's ring, where A had the ring's 24. Held, the ring stands 4px proud of
  it on each side; at rest the head is a 16px circle;
- **the bar leads, as far as it can**: a lead of **0.6**, the jig's most, where A moved both parts together, so each
  moves for 40% of its way. Taking hold, the bar opens and the head goes into the cursor after it, **260ms** in all;
  letting go, the head comes back first and the bar closes over it, **180ms**. A took 200ms each way;
- **an overshoot both ways**, `cubic-bezier(0.34, 1.56, 0.64, 1)` (E's), where A was cubic out;
- **the head in the cursor is 12px**, 4px clear inside the ring's line, where A's 16 was 2px clear;
- **the body follows on a quicker, bouncier spring**: **180ms** at **0.4**, where A was 320ms at 0.2, with a stretch of
  **0.6**, where A had 0.4.

**Tuned again, the same night: A Today, tuned.** He sent back the settings once more, *"I have updated the slider
settings a little more"*, headed "Grip — A Today, tuned", and they replaced the pick in globals.css verbatim, with
`GRIP_START` and the slider's fallback. From his pick:
- **the bar is 8px**, a third of the cursor's ring, where the pick had 16 — the jig's least. Held, the ring stands 8px
  proud of it on each side; at rest the head is an 8px circle;
- **taking hold takes no time**: **0ms**, where the pick took 260ms, so the head is in the cursor as it is pressed and
  only letting go is seen;
- **the head leads**, a lead of **−0.5**, where the pick's bar led at 0.6: letting go, the bar closes and the head comes
  back after it, each for half of **240ms** (the pick's 180);
- **cubic out both ways**, `cubic-bezier(0.215, 0.61, 0.355, 1)`, where the pick overshot;
- **the head in the cursor is 8px**, the bar's own size, so held it neither grows nor shrinks, where the pick's was 12;
- **the body's bounce is 0.2**, where the pick's was 0.4; its 180ms and its stretch of 0.6 stay.
The Steps (M21) play with it: at 8px the marks' 6px dots are nearly the bar's height, which is for him to judge there.

**Round 1, the first brief** (his: *"Let's make it a square, and the body also to become sharp … when the cursor …
held the head, the square should turn into sphere"*). The slider went square and sharp, and a held head's corners
rounded into a circle by a CSS transition on its radius, size and turn: A *As described*, the corners only; B *Pop*,
a quarter bigger on an overshoot; C *Roll*, a quarter turn; D *Pinch*, three quarters; E *Snap*, 60ms in, 420ms out.
The pressed cursor, a filled disc the head's size, hid it; his second brief kept the ring and put the head in it.

## M17 — The eighth is a character: a sphere that dives from cell to cell, now jumping nest to nest (2026-09-30)

*His, the same night: "I have a new idea. And that is character and motion studio item. I imagine is an energetic and
calm, 3D sphere that travels by diving from one cell to another. It should follow our design principles from motion
and design system. I want that in motion studio so that I can design its character and motion."* A motion he named, so
it is on the bench (M9), the eighth, family `sphere`, after the grip.

- **Designed version by version, like the agent** (his, the same night, of the agent: *"you give me phase one, I will
  try on that … then you can create version two"*). It has no presets: the head says which version where the preset
  select stands, Reset goes back to it, and Copy hands his tuning back for the next one. None of its tokens is in
  globals.css, so the version's values are carried by the family and by the package's `SPHERE_START`, the same.

**Version 12, the same night, is the current one: his settings.** His, sending them back from version 11: *"the
following are the settings that I have currently fixed upon for the agent, so let's use that and we'll continue our
state machines from there."* They are version 12's start, verbatim, in the family and in `SPHERE_START`: a violet slime
head three fifths of a cell across, shaded 0.75; a short limp tail (length 0.8, taper, stiffness, swing and stretch all
0); a jump of one column and six rows, crouching 60ms, a squat of 0.25, 0.95 of a cell over the higher nest, 550ms in the
air; no bounce, squash, give, sway or spread, a jiggle of 20ms at 40ms; touching down 30° up its near side, keeping all
of its speed along the bowl (slippery 1, with its jump), energy 0.53, at rest 1.2s after it lands, squeezing 0.4;
breathing every 4s, 0.1 deep; eyes 0.24 of the head across, 0.45 apart, 0.3 up, looking 0.8 of its radius, a look lead
of 1000ms, a blink of 170ms every 3.6s, squinting 0.6. They are the base the state machines start from (M19, M20). Not
in globals.css: nothing outside the studio plays the agent yet, and a character's settings go to its next version (M12,
the amendment of 2026-09-30); M7's move into the stylesheet waits for a page that plays it.

**The agent is drawn by the design system**, since later that night (his approval, given to Orbit's
session). It is drawn by `@no-origins/ui/components/agent`, which draws one `SphereFrame`: the tail, the body, its lit
side, and the eyes inside a face layer (`data-agent-face`) within the body's clip, where the face parts of M20 will go.
The stage keeps the nests, the courses, the timeline and the blink's clock, and hands each frame to the agent's
`paint`. Orbit draws the same component still. Before, it had its own copy, which had drifted and drew
no eyes.

**Version 13, the same night: the face's parts** (M20's face version 1, his *"yes for both"*). Version 12 with the
parts added and every one left off, so it looks as version 12 did until a Style is picked. Each part is a jig group,
and its jigs come from the package's declaration (`lib/agent-face`), not a list written in the studio:

- **Pupils:** None, the solid eyes of version 11. **Dot**: a `deep` pupil in a `light` eye, which Look X and Y move
  inside it. **Shine**: a `light` catchlight on a `deep` eye, which stays where the light is as the eye looks.
- **Upper lids:** **Plain** cuts the eye, as before. **Heavy** lays a band of the body over its top with a `deep` edge,
  never higher than 0.3 of the way down, so it hoods the eye even wide open. Both have an Open (how open at rest; a
  blink shuts from there, onto the lower lid wherever it is), a Slant (+ the inner ends down) and a Curve. The blink and
  the squint are theirs now.
- **Lower lids:** None, or **Plain**, rising from below with a Raise, a Slant and a Curve (+ arched up).
- **Brows:** **Line** (a round stroke), **Arch** (a crescent) and **Bushy** (thick at the inner end, tufted), each with
  a height over the eye, an angle from the inner end, an arch, a length, a thickness and a colour. They sit over the eye
  whatever the head does, since only their height is squashed with it, and they ride a little of the look.
- **Symbols**, played rather than worn: the cross of anger, a sweat drop, a Zzz, a sparkle and a question mark, drawn
  by the head where At says, in the agent's paint, and not cut to it.
- **Look X and Y** go on the Eyes group.

*Mine*, from looking at it:
- The heavy lid's hood exists because a heavy lid wide open drew nothing.
- The brows' height counts from the top of the eye, since measured from its middle they rode off the top of a settled
  head.
- The symbol's colour is the paint, because the ink is white on violet and a Zzz in it vanished on the light page.

Colours are named (`deep` is the paint most of the way to black) and flat. A pair set apart on its right side (one brow
raised) is drawn from `--motion-sphere-<id>-right`, but no jig sets it yet; that comes with the rows (M19 on the agent).

**Version 13, tuned, the same night: his settings** (sent back in Orbit's session,
headed *"Agent — Version 13, tuned"*: *"This becomes the rest state of the motion. So, in character studio also, let's
use the rest phase motion."*). All 65 of its values are version 13's but one, **Come back, 1000ms** where it was 1200.
It is `SPHERE_START` and the family's start, and it is **the agent's version 13 in the database**, the character every
motion's rows sit on (M20). It keeps the number 13, although his tuned settings would have been the next version until
now (M12's amendment). The database numbers versions from here: the studio's untuned 13 was never published, so his
publish is 13. **Orbit plays its rest** (his "rest phase motion"): the agent breathing and blinking
live, sitting in its cell.

**Version 14, the same night: his settings**, sent back headed *"Agent — Version 13, tuned,
tuned"*. Two of its 65 values move:
- **Come back** is 500ms, where it was 1000: it comes to rest from a landing in half a second.
- **Spread** is 0.05, where it was 0: it settles a little into its nest. As slime, that is 0.13 of its height.

It is `SPHERE_START` and the family's start, and the next of the agent's versions in the database.

**Shapes, colours and textures, the same night** (his, asked in Orbit; Orbit.md C10, drawn
by that studio's session in the package):
- A head can be the sphere or a solid: a cube, a pyramid, a hemisphere, a cylinder, a hexagonal prism, or a cone.
- There are five more paints, scoped to the agent (`--agent-*`, not the system's palette), and a surface texture.

All of it is look, and it defaults to the sphere and no texture, so version 14 draws as it did (diffed over 380
frames). A solid moves on the sphere's course, and its face sits on its front. **The motion studio's body jigs now come
from the declaration as well** (`AGENT_BODY`, as the face's already did), so the Head group has Shape and there is a
Surface group; the studio has 69 settings.

*Found by Orbit's session and mended here:* a settled head's face rode the course's centre, which sinks
into the bowl as the head spreads, so at a high Spread (0.4 on slime) the eyes sank below the puddle and were cut by
the bowl. The face now never sits lower than a little under the middle of the puddle drawn. At version 14's spread
that moves nothing you can see (0.6px on a 200px cell).

**Version 15, the same night, is the current one: version 14 as it looks, with the whole of Spread alive on slime**
(asked whether it should be, his *"Yes"*). On slime, Spread did nothing past about 0.35, and not only because of a cap
(0.9, which slime's 2.6 times reached at 0.35). At that rate the puddle had filled the bowl by 0.3: its top moved
12.7px from 0.05 to 0.2 and 1px from 0.3 to 0.6, on a 200px cell. So:
- **Slime spreads at 1.2 where it spread at 2.6.** Its puddle now settles across the whole slider: its top moves from
  84 to 103, still moving between 0.5 and 0.6.
- **His Spread is 0.11,** which at the new rate is version 14's 0.05 at the old: the same settle, to a tenth of a pixel.
- **How far a spread sinks is eased into its limit (0.95), not cut at it.** Nothing a version has set reaches the ease.

Version 14, stored with Spread 0.05, draws a little less settled under this code, as a version made with an earlier
package can (M20). Version 15 is the look he chose.

*Flagged:* his look lead is 1000ms, but a look turns no earlier than the crouch starts, and his crouch is 60ms, so it
acts as 60ms. A look that sets off well before the jump is the eyes moving on their own time, apart from the body's —
which is what a state's rows would give it (M19): an Eyes row starting a second before a Body row's jump.

**Version 11, the same night: the sphere is the agent, and it has eyes.** His: *"we'll remove agent
and the sphere will become the agent. And agent can have eyes."* Asked, he chose: this session to do it, after the
session building versions 1–10 stopped; the pill agent deleted (M12, below); the sphere keeping its own jump player for
now, not the states' timeline (M19), since its motion is a simulation that rows of values cannot yet say; and new eyes,
a version 1 of them, rather than the pill's.

- **It is the agent.** The family is shown as **Agent**, *Your personal guide*; it keeps its id, `sphere`, and its
  `--motion-sphere-*` tokens, as hyper focus and focus mode kept `focus` and `mode` when they were renamed.
- **Two eyes on its face**, circles the size they are set whatever the head does, in the ink of its paint (dark on
  lime, light on violet), cut to its outline. **They ride the head as it is drawn**: moved with its centre, flattened
  and widened with its squash and its puddle in the nest, stretched along its way in the air, leaning and squeezing
  with its jelly in the bowl, as its outline does (`leaned`, `squeezed`).
- **They look where it is going** (`aimOf`): turning to the nest it goes to from `look-lead` before it leaps (never
  before its crouch starts), then along the way it flies — up as it rises, down as it falls, round the bowl as it
  slides — and back to straight ahead as it slows and settles.
- **Lids**, as the pill's were since his note of 2026-09-29 (a blink is lids closing, not an eye scaling): the upper
  lid does most and sags a little as it comes down. They blink on a clock of their own (the play's on the timeline,
  live's while it is live) and **squint shut as a landing hits**, easing open as its jiggle dies (`impact` on the
  course).
- **The Eyes group, eight tokens**: Size, Spacing, Height, Look, Look lead, Blink every, Blink, Squint. **38 tokens.**
  Version 11's are mine: a quarter of the head across, a little under half of it apart, a tenth over its middle;
  looking 0.28 of its radius (at a third the eye nearest the next nest went half past the head's edge in the crouch),
  turning 160ms before the leap; a blink of 170ms every 3.6s; 80% shut on landing. *Flagged:* the head is a third of
  a cell, so the eyes are small, about 5px across on a desktop's cell.
- The model is the package's: `SphereFrame.eyes`, `eyesOf`, `blinkShut`, `aimOf`, `lidsOf` in `lib/sphere-motion.ts`;
  `sphereFrame(course, t, blinkAt)`. The stage paints them (`data-sphere-eye`). `e2e/agent.spec.ts` checks the
  version, the Eyes group, both eyes on the head, and the turn toward the next nest in the crouch.

**Version 10, the same night: slippery and soft, with energy and time.** His, on version 9: *"I
kept the slippery to maximum one, and when it falls into the other cell, it slides, but then it hits the wall on the
side, and then slowly reaches back to the center. … if the slippery is maximum, it should be almost like fluid level
slippery, and the body should also not be so stiff that it hits the wall and then bounces back … it should just fall,
slide and like get squeezed in the direction like with real physics and then slide back based on a slippery tool … I
should define energy levels … if the energy is high, it falls, it slips, and it comes back … immediately … smoothly,
but again, that can be defined by time."* At a high slippery, version 9 ran up past the bowl's side, fell off it and
hit the wall; and its rocking was a pendulum's, slow in a small bowl. So:

- **Sliding, it never leaves the bowl.** Past 65° up its side the bowl is a soft wall: it squishes into it, pressed
  back harder the further in and losing its speed there, and comes back down — it does not fly off and knock.
- **`-squeeze`**: it squeezes along its way — squished into the wall as far as it has gone into it, and braking as far
  as its jelly leans — shorter along its way and fuller across it, what that pushes past the nest laid on the ring, so
  it flattens against the side. Scaled by its body's squash (a ball hardly, slime more).
- **`-energy`** replaced `-weight`: how lively it is in the bowl, the bowl's pull a quarter to four times the leap's
  gravity. **`-come-back`** replaced `-rocking`: how long, ms, from landing to rest; it is damped so a fiftieth of its
  swing is left by then. Together they say how it comes back: lively and long, it rocks; lazy or short, it glides back
  once.
- **30 tokens.** Version 10's numbers: slippery 60%, half energy, at rest 1.4s after landing, squeeze 35%. At slippery
  1 it runs 70–85° up the far side into the wall, squishes and comes back.

**Body is a material (the same night, his: *"I don't see any difference between jelly ball and slime"*).** Until then
`-body` set only how deep it sat for a squash and how smooth its outline was — a pixel or two at the spread it
starts with — and the three moved alike. Now **jelly moves by the numbers as they are set, and a ball and slime scale
them** (`MATERIAL` in the package):

| | squash, crouch | spread | wobble, its speed | stretch | sway | slippery | bounce |
|---|---|---|---|---|---|---|---|
| **Ball** | 0.35 | 0.3 | 0.5, 0.6 | 0.3 | 0.3 | 1.3 | 1.3 |
| **Jelly** | 1 | 1 | 1, 1 | 1 | 1 | 1 | 1 |
| **Slime** | 1.5 | 2.6 | 2.2, 2 | 2 | 1.6 | 0.6 | 0.35 |

A ball sits nearly round, jiggles quick and small, stays round in the air and rolls further and higher; slime pools,
comes in drawn out, splats flat, sticks, and **oozes back** from a squash and a lean where jelly wobbles past (its
squash decays without the swing; its lean's spring is past critical damping). It sinks for a squash 0.5 of jelly
(ball) or 1.4 (slime), and its outline is smoothed 0, 3 or 7 times. The jig shows the values as set; the body scales
them.

**Version 9, the same night: it falls in and slides.** His, on version 8: *"you definitely get a
great job but … the sphere falls into the other circle and then it sticks to the place that it falls in and then only
the body feels like it is trying to slide but … in the real world the ball … because it's flying and it's like it's
softy and it is slippery it will fall and then it will slide and then slowly come back to its motion so I need
controls for that."* Version 8 cut its speed round the bowl, the moment it landed, to what `-slide` asked — far under
the leap's — so it braked where it fell and only its jelly's lean went on. So:

- **It touches down on the bowl where `-land-at` says** (degrees from the bottom; − on the side it comes from, + the far
  side, 40° up the near side to start with); the leap is aimed there, its centre on the circle its bottom runs on.
- **It keeps `-slippery` of its speed along the bowl** at every impact (1 all of it, 0 it sticks), going the way
  `-slide-way` says, so its fall onto the near side turns into a slide down through the bottom and up the far side.
  The jelly takes the change in its speed as a push.
- **`-weight`**: its gravity in the bowl against the leap's; lighter rocks back more slowly.
- `-slide` (degrees) went: where it lands and how slippery it is say it now.
- **The bowl is small against the leap's speed**: keeping much of it carries it right round the inside of the ring (at
  75%, with a lighter weight, it looped the ring once). Version 9 starts at 40% and a weight of 1, which carries it
  about 50° up the far side on a jump of three columns and one row, 27° to 51° on others, and it starts with no bounce
  — it falls and slides. At 0.7 of the cell across, a head nearly fills its nest and is thrown round it; its lean is
  held under two thirds of its height, softly.
- **The tail starts a little under the head** (0.8 of it) and thins, so a short tail by the head reads as a tail, not a
  second ball. **30 tokens.**

**Version 8, the same night: a landing that carries on.** His, on version 7: *"I like what we have
now. But I am unable to feel complete because when it's landing … the bounce is either too stiff or … it feels like it
just came there and got stuck. Instead of … continuation of the motion, I mean, it might just if it's coming from left
to right, it might fall into the right circle and then slide over in the clockwise direction which can be the control
and also body could like squeeze a little and then come back like a jelly action I don't have that control."* Version
7 dropped straight onto the bottom, bounced up and down in place and stopped. So:

- **The landing is a ball in a bowl**, simulated at a fixed step (half a ms) from the moment it lands, under the leap's
  gravity, and sampled, so any moment on the timeline is the same frame however it is reached. Its centre runs on a
  circle the nest's less its own radius.
- **It keeps its way.** It arrives with the leap's fall and a speed round the bowl, and each impact with the curve
  bounces it off as long as it has bounces left (`-bounces`; the first `-first` of the leap high, each after
  `-bounciness` of the one before), still moving round — so a bounce lands it higher up the side. Then it slides.
- **The Slide group.** `-slide`, degrees: the speed round the bowl it lands with is what would carry it that far up
  the far side. `-slide-way`: with its jump (the way it was going), clockwise or anticlockwise as you see it. `-rocking`:
  it rocks back and forth, a pendulum, each rock a share of the one before, and comes to rest at the bottom. `-sway`: its
  jelly leans against every push — the landing's change of speed, the bowl turning it — on the wobble's spring
  (`-wobble`, `-wobble-speed`), and wobbles back; the lean is its outline moved along the bowl's floor as far as it
  stands above where it sits.
- **Sitting spreads as far as it is on the bowl**, so it spreads as it slides and rounds as it bounces; every impact
  squashes it and dips the nest as hard as it hit.
- **The phases** are crouch · leap · land (the landing until it is still) · settle. **29 tokens**: version 7's and the
  Slide group's four. Version 8's numbers: one bounce, 30° with its jump, rocking at 45%, a sway of 35%.

**Version 7, the same night: a body that settles, and what it is made of.** His, on version 6,
with a violet sphere, its size and its spread turned up: *"I have completely increased the spread and it became some
random shape instead of a slime … I also need control on the type of the body because there's no smoothness to it right
now … it is not even resting inside the circle on the surface it just got extended outside for some reason."* Version
6's sitting head was a dome with a flat base: a straight base in a round nest stands out past the ring, and at a high
spread the flattening squared it off into points. So:

- **It settles into its nest as into a bowl.** Sitting, its outline is a circle cut by the nest's circle: what would
  be outside the nest is laid on the ring, so its underside follows the ring's curve and it cannot leave the nest. **It
  keeps its size as it spreads**: its circle grows until what is inside the nest is as much as the head, so more spread
  is a wider, flatter puddle along the bottom of the bowl. Its edge is smoothed. Only the nest its centre is in, low
  down, is a floor: passing through a ring's line higher up, as it leaves and arrives, it is not caught.
- **`-body`, what it is made of** (Head group): **Ball** barely settles for a squash (0.35 of it) and keeps a crisp
  edge; **Jelly** settles as far as it squashes and softens its edge; **Slime** settles deep (1.6 times) and pools, its
  edge softest. Version 7 starts as jelly.
- **In a nest, its tail is cut to the nest's circle**, the page's opening: what swings outside it as it settles is behind
  the page. Jumping, it is not cut. So outside a nest the tail is seen only in the air, as he asked of version 5.
- **25 tokens**: version 6's and `-body`. The spread's control now reads "how far it settles into the nest".

**Version 6, the same night: sitting in its nest, seen from the side.** His, on version 5:
*"right now this feels like the head is not properly resting on the circle … it should properly rest on the bottom of
the circle. As if it's sitting there and then it's spread a little … because it is where the pressure is applied … And
then instead of showing the tail outside of the circle, it should be behind the screen. So it's only visible when it's
jumping."* So:

- **Seen from the side, down the screen is down.** A nest is the cell's circle and its floor is the circle's bottom: it
  sits inside, on the bottom of the ring. Version 5 looked down on the page, a little from the side (`-view`), and sat
  it on the page in the middle of the cell.
- **Sitting, it spreads** (`-spread`, with the breath spreading it a little more and back): the head is a dome, round
  on top and wide, its underside flattened where its weight presses, flatter the more it is squashed — in the crouch
  and on landing too. Stretched tall springing back, or at speed, it is a pill as before.
- **The tail is behind the screen while it sits**: it points straight back into the page, and only what is in front of
  the page is drawn, cut where it goes through. As it leaps, the springs pull the tail out behind it and it trails; as
  it settles they pull it back in, and it goes. `-curl` went with the curl.
- **One gravity.** The arc rises over the higher of its two nests by `-height` and falls into the lower, and a rise and
  a fall under one gravity take as long as the square roots of their heights, so where the peak falls is no longer a
  setting (`-peak` went); the bounces and the tail's droop fall under the same gravity, down the screen.
- **The nest dips** under each landing and the push of leaving, and springs back (`-give`), and it sits on it as it
  does. There is no shadow: seen from the side, how high it is, is seen.
- **24 tokens**: Head (`-size`, `-paint`, `-shade`), Tail (`-length`, `-taper`, `-stiffness`, `-swing`, `-stretch`),
  Jump (`-columns`, `-rows`, `-crouch`, `-squat`, `-height`, `-hang`), Bounce (`-bounces`, `-first`, `-bounciness`,
  `-squash`, `-wobble`, `-wobble-speed`, `-give`) and Rest (`-spread`, `-breath`, `-breath-depth`). Version 6's
  numbers are version 5's, with a spread of 15%, a crouch squashing a third, a landing squash of 35% and a nest giving
  6%.

**Version 5, the same night: nest to nest.** His, on version 4: *"I had a better idea. Instead of
making the character float, I think we should see it like jumping from nest to nest … instead of jumping in like water,
it can be like jumping into that circle and then resting on that circle. So we can also control how it bounces,
rests."* Still his fish — a sphere head and a rubbery tail, one outline with one shade band (version 4) — but the cells
are nests now, not water: nothing goes under the page, and no cell opens.

- **It rests in its nest**, sitting on it, its tail curled round it (`-curl`), breathing slowly (`-breath`,
  `-breath-depth`).
- **A jump**: it crouches, squashing down, drawing back and turning to face the way it goes (`-crouch`, `-squat`; a
  crouch of 0 leaps from where it sits); leaps on version 3's arc (`-height`, `-hang`, `-peak`), from the middle of its
  nest to the middle of the next; lands with a squash (`-squash`) and bounces there **under the leap's own gravity** —
  each bounce's height a share of the leap's, then of the bounce before (`-bounces`, `-first`, `-bounciness`), and each
  as long in the air as that height takes to fall — squashing again on each landing, as hard as its fall was high;
  jiggles, flat to tall and back, dying away (`-wobble`, `-wobble-speed`); and **the nest gives** under each landing and
  under the push of leaving, springing back (`-give`). Then it sits.
- **The tail is a spring chain**, no longer laid on the head's path (a bounce in place goes nowhere a path could lay a
  tail on): twelve pieces following the head, each held its length from the one before, pulled toward a shape —
  curled in the nest at rest, straight behind the head in the air — by `-stiffness`, straightened while it moves so it
  never folds, swinging on after the head stops for as long as `-swing` says, drooping under the leap's gravity and
  lying on the nest's floor. It steps at a fixed 240 a second from the start of the jump, so any moment on the timeline
  is the same frame however it is reached.
- **The phases** are crouch · leap · bounce · settle (the jiggle and the swing dying out), then the hold, sitting in the
  nest it reached, and the jump back. A part it goes without (no crouch, no bounces) is not drawn.
- **The tokens, 26 in five groups.** **Head**: `-size`, `-paint`, `-shade`. **Tail**: `-length`, `-taper`,
  `-stiffness`, `-swing`, `-stretch`. **Jump**: `-columns`, `-rows`, `-crouch`, `-squat`, `-height`, `-hang`, `-peak`,
  `-view`. **Bounce**: `-bounces`, `-first`, `-bounciness`, `-squash`, `-wobble`, `-wobble-speed`, `-give`. **Rest**:
  `-curl`, `-breath`, `-breath-depth`. Version 4's water — `-circle`, `-lap`, `-build`, `-dip`, `-dive`, `-depth`,
  `-settle` — and its wiggle — `-wiggle`, `-beat`, `-waves`, `-whip`, `-whip-time` — are gone: the tail's life is its
  springs now.
- **Version 5's numbers are mine**: version 4's head and tail; a 220ms crouch squashing a quarter; the leap as before;
  two bounces, a third of the leap's height and then 45% of that, a 30% squash, a jiggle every 160ms dying over 180ms,
  a nest that gives 12%; a tail at 60% stiffness swinging a little; curled halfway round, a breath every 3.2s of 4%.
- **The model is the package's**: `sphereCourse` and `sphereStill` are the head (where, how squashed, which way it
  faces, how lit and how pressed each nest is), `sphereSpine` the tail's springs, `sphereFrame` the drawing.

**Version 4, the same night: version 3's fish as one body.** His, on version 3: *"currently the
head and tail … looks a little like two different parts attached together there is no smoothness to it and … there is
a lot of wiggle to the tail maybe I can have wiggle control."* Version 3 drew the head as a shaded disc laid over a flat
tube, a seam between them, and its tail's sway, a build-up that more than doubled it and the whip added up with no one
control. So:

- **One outline.** Head and tail are the envelope of a chain of discs down the body, the head the first of them, each
  disc hulled to the next by their outer tangents; every hull turns the same way, so filled nonzero they are one smooth
  shape, with no hole where the body curls on itself. The tail swells out of the head full and tapers (a smoothstep, so
  the outline leaves the head with no corner). At speed the head stretches as a disc a little ahead of it in the chain.
- **One shade.** The body is filled in its dark colour, and its lit side over it: each disc moved toward the light a
  third of its own radius, cut to the outline. What that leaves is one flat band down the whole far side, as thin at
  the tail as the tail is. The head's own crescent is gone.
- **Wiggle is a group of its own**: `-wiggle` (how much the tail wiggles as it swims, 0 none), its speed (`-beat`, one
  wiggle there and back) and `-waves`, and the whip at the water apart from it (`-whip`, `-whip-time`). The build-up now
  adds 80% to the wiggle, not 120%. Version 4 starts at a wiggle of 15% of the head every 900ms and a whip of 30% over
  350ms — about half of version 3's, and slower.
- **A tail laid on a slow swim.** Laying the tail back along the head's path, it steps back by about half a piece at the
  speed the head is going, so a slow swim round the cell is laid as far back as a fast leap; version 3 looked back a
  fixed time and ran out of path at rest, standing the rest of the tail straight out.
- **A little smaller, to fit its cell**: a head a third of the cell and a tail 1.8 heads long, where version 3's fish was
  as long as its pond is wide and curled right round it.
- **The groups are six, each a part of the fish**, the same 25 tokens: **Head** (`-size`, `-paint`, `-shade`), **Tail**
  (`-length`, `-taper`, `-bend`, `-stretch`), **Wiggle** (`-wiggle`, `-beat`, `-waves`, `-whip`, `-whip-time`), **Swim**
  (`-circle`, `-lap`, `-build`, `-dip`), **Jump** (`-columns`, `-rows`, `-height`, `-hang`, `-peak`, `-view`) and **Dive**
  (`-dive`, `-depth`, `-settle`). Version 3's `-wag`, `-flick` and `-flick-time` are `-wiggle`, `-whip` and `-whip-time`.

**Version 3, a fish, the same night.** His, on version 2: *"I did not like any of the controls for
the sphere … I imagine that sphere like a head and a tail which is a little fluidy rubbery body and jumps like a fish …
I want the controls where I can … configure the motion to jump like a fish because right now when I am trying to
configure gather or … landing while … dropping … they are just simply coming up straight … and going down straight …
instead of that … fluid … realistic jumpy feeling so I wanted to rethink and … give me better controls."* Versions 1
and 2 moved it only toward you and away, which seen from in front is straight up and straight down, and every part was
a separate straight move on its own curve. So:

- **A head and a tail.** The head is the sphere. The tail is a rubbery body behind it: laid back along the path the
  head took (`-bend` 1; 0 stands it straight behind the head), longer the faster it goes (`-stretch`), thinning to its
  tip (`-taper`), swaying side to side in a wave that runs down it (the swim: `-wag`, `-beat`, `-waves`), and whipping
  as it leaves the water and as it goes back in (`-flick`, dying away over `-flick-time`).
- **The cells are water.** Its cell is its pond: at rest it swims round in it at the surface (`-circle`, `-lap`), its
  tail curling after it: the calm. A leap is a fish's: it swims faster and dips to gather speed (`-build`, `-dip`; a
  build-up of 0 leaps from where it swims), leaps out of its pond, dives into the cell it reaches, glides under
  (`-dive`, `-depth`) and comes back up to swim round there (`-settle`). Under the page it is seen only through its two
  cells, and only they are open (M9's rule for the dot, kept).
- **One smooth path.** The head's way is a curve with no corner in it: each part hands the next its speed and its
  heading (cubic Hermites, their hand-over speeds held to what each part's way can take, so none loops back). The leap
  is a thrown thing's: across at one speed, up and down on two half parabolas meeting at the peak (`-height`, `-hang`,
  `-peak`, early or late).
- **Seen a little from the side** (`-view`): how high it is shows as rising up the screen, so the arc is seen as an
  arc, and its flat shadow stays on the page under it. 0 is straight on, as the page is; version 3 starts at 0.6.
  *Mine*: nothing else on the grid is seen from the side, which is why it is a control.
- **Its tokens were 25 in five groups**: Head, Tail, Swim (with `-wag`), Jump and Water (with `-flick` and
  `-flick-time`); version 4 regrouped them into six. There are no ease tokens: the curve is the
  path's, not a timing function's. The head's three and the jump's Columns and Rows are not motion; they are on the jig
  because he asked to design its character, and where it jumps, there.
- **The model is the package's**, `lib/sphere-motion.ts`, pure: `sphereCourse` is the head's path through a leap,
  defined for every moment before, during and after it (`sphereStill` for a fish that stays); `sphereSpine` lays the
  body on it; `sphereFrame` draws it — the head as a disc with its crescent, the tail as a tube, split where it crosses
  the water, the shadow, the open cells. The studio's stage, `components/sphere-stage.tsx`, paints it as SVG. The
  timeline plays the leap (build · leap · dive · settle, the build not drawn at 0), the hold swimming round the cell it
  reached, and the leap back; live, a click on a cell sends it there.
- **Version 3's numbers are mine**: a head 40% of the cell, a tail two and a half heads long, its tip 15% of the head,
  following 90% of the path, a third longer again at speed; a sway of 35% of the head every 700ms, 0.8 of a wave down
  the tail; swimming round 60% of the way to its ring, a lap in five seconds; three columns and one row, a cell and a
  fifth high, 520ms in the air, peaking at 45%, seen at 0.6; a 420ms build-up dipping 0.3 of a cell, a 380ms dive half
  a cell deep, a 900ms settle, a whip of 60% of the head dying away over 400ms.

**Version 2** (the same night) split a jump into a start (a wind-up that was a switch, None · Gather: draw back, hop,
squeeze; then leaving on its own time, curve and stretch), the way between (under the page or over it) and a drop
(arriving on its own time, curve and stretch, overshooting, settling, and a landing that was a switch, None · Squash),
and put the jump's Columns and Rows on the jig, 32 tokens. **Version 1** had one wind-up that was always there, one
stretch, lines round the sphere that showed it roll, and a jump from the last cell clicked. Both floated the sphere
over its cell, and both moved it only toward you and away; version 3 keeps their flat drawing (the disc, the crescent,
the flat shadow, the cells opening as irises in a lime ring) and their Columns and Rows, and nothing of their motion.

Open, his to say: whether the nest should look like a nest (it is the cell's ring and tint today); whether the tail
should show a little as it sits; whether
"combination" meant a diagonal, as built, or two jumps in a row; whether it is the agent's
next body (M12) or a character of its own; whether it wants eyes; whether the view from the side stays. Flagged: on
the dark theme a black shadow barely shows, and on the light theme the lime ring is about 1.3 : 1 on white (§5 item
11). Nothing plays it outside the studio, and adopting it on a page waits for his word.

## M18 — The segmented slider, withdrawn (2026-09-30)

*His, the same night: "We will have segments for the slider, and each segment represents … percentages … separated by
space … reduce the height … to half … I should be able to control the space, the radius, the tail radius and the end
radius and the head radius … a little spring control."* Built as `Slider variant="segmented"` and a ninth page: a
12px row of segments, one a value, the head the segment at the value, his five radii and the space as `--slider-*`
tokens, and the head and the body each on a spring (presets A *As described*, B *Stiff*, C *Bouncy*, D *Trail*, E
*Keys*). **Withdrawn within the hour** (his: *"let's not have segments, I did not like it"*): the variant, its page and
its model are gone. What he kept from it went into the grip (M16): the springs, as the body's follow, and the half
height, as a control and preset B.

## M19 — The player is his timeline: a state a tab, its parts configured and locked, states stacked by priority (2026-09-30)

*His, the same night, in two notes. The first: "instead of predefined player and its segments like settle, hold, back,
reset, rest sort of things I would want to have first control the like like select a starting time, select an end
time, and maybe either it could be in milliseconds or seconds, or maybe minutes … So once I decide that, then I can
create one state where between this time frame to this time frame, this motion happens. And so that I can attach
multiple independent motions into one state machine."* Asked three things, he answered: **on every bench**; **the
motion fills its span**; and a state plays **on an event too**, not only at a time.

*The second, taking the agent as the example: "I should be able to select which component of the agent will be
configured. And then once I configure, I can lock it. So that configuration can have its own state like start and end.
And then I can select another component set another timeline and then configure it. Maybe for the body … And then play
it. And then save it. And then maybe I can open another tab within the agent. Save the previous tab, we shall name it.
And in the other tab, I can again configure differently. So, like that, I can try many configurations. And maybe
sometimes I can also attach motions from different tabs. So, may be we can call each tab a state. And then I might be
able to attach multiple states. I can also overlap states. So, the preferences drives from top to bottom. The higher,
the more preference."* Asked three more, he answered: an attached state is **linked**; the agent's parts are **Body and
Eyes** (*"Agent has Body and Eyes only. We might add more parts later. But for now since we have these two, controls
should be provided for them"*); and where states overlap **both play**, the higher winning only where both change the
same thing.

It replaces M6's phases: each bench's fixed list (movement's grow · hold · back · rest, the sphere's gather · dive ·
rise · settle · hold · back, focus's in · hold · next · out), of which only the hold, and loading's page time, could be
dragged. ↺, play and pause, the slider and its playhead, Loop and Tempo stay as M6 and M15 have them. **Built on the
agent, 2026-09-30** (below, after the rules).

- **A tab is a state.** Each bench's states are tabs over its timeline. He names a state when he saves it, opens
  another tab to try a different configuration, and keeps as many as he likes. *The first note's "state", one motion
  over a span, is a row inside a state now.*
- **A bench has parts.** The agent has two, **Body** (its size, and its movement: move X, Y and Z, turn about X, Y and
  Z, and the ease) and **Eyes** (the eyes' size, spacing and height, the lids and their blinks, and the look in X and Y
  with its ease). Its controls are organised by the two, in place of the five groups of M12's version 1, and more
  parts come later. Every other bench names its parts when it gets the timeline. *Mine:* a bench with one motion has
  one part, its motion.
- **A row is a part, configured and locked.** He picks a part, sets it on its controls, gives it a start and an end,
  and locks it. Once it is locked the controls cannot change it, so the next part is configured on a row of its own
  without disturbing it. He unlocks a row to edit it. A row keeps only the values he moved off the part's rest (the
  version's values) and leaves the others to the rows under it.
- **The window comes first.** Each state has a start and an end, typed in one unit for its whole timeline: **ms · s ·
  min**. Every time on the timeline is typed and read in it, and the ruler counts in it. Underneath, everything is ms.
  *Mine:* seconds and minutes are for long plays, like an idle over a minute. A UI motion is read in ms.
- **A row's motion fills its span** (his first answer). The part sets off from wherever it stands at the row's start
  and reaches the row's values at its end, so the span is the row's time. Stretch 0–400ms to 0–800ms and it takes twice
  as long. So the agent's Time controls and the eyes' Lead are gone: an Eyes row starting before a Body row is the
  lead. A motion made of parts, like the sphere's trip or movement's stagger across the block, scales them together.
  Where a bench's motion ships as a duration token (movement, loading …), the span is sent as that token. *Open:*
  which row's span it is when two rows of one part differ.
- **A state attaches other states, linked** (his answer). An attached state is a row too, its span where it plays.
  Edit its tab and every state that holds it plays the edit. A state cannot attach itself, or a state that holds it.
- **Top to bottom is priority** (his rule). A state's rows stand one over another, its own and the attached alike, and
  he moves them up and down. Where rows overlap in time, **both play**: a higher row turning the body and a lower one
  making it jump give a body that turns and jumps. Only where both change the same value at the same moment does the
  higher row's value show. *Mine:* when the higher row ends while the lower is still in its span, the lower takes that
  value from where it stands, over what is left of its span, so nothing jumps.
- **A gap is a hold.** Outside every span a part stays where the last row left it. So hold, rest and "back" stop being
  parts of a play: the hold every play had (`HOLD`, `holdPhase`) and each bench's rest on a loop are gone, and back is
  a row he places.
- **An event plays a state** (his first answer, *"Events too"*). Each state says which event plays it. Every bench has
  **start**, which ↺ and Play fire and a page's ready would fire. A bench whose specimen answers the pointer adds
  **enter**, **leave**, **press**, **release** and **click**, where its stage answers them today: movement's hover,
  focus's card, the grip's press and drag, the sphere's click, focus mode's cells. Play plays the tab in front. **Live,
  the stage answers the real events by playing their states**, so a bench's live hover is a state, not code of its own.
  The agent's harness events (`run.*`, M12's statechart) wait for his word, as the statechart does.
- **An event in the middle of a play** (*mine*): the state it plays starts at once, and the rest of the one playing is
  dropped. Each part sets off from wherever it stands, not from its first frame, so nothing jumps, and it still takes
  its row's whole span. Whether the span should shrink by the share already done is his to say when he sees it.
- **Version 1 is today's play, written as a state**, so nothing a bench does now is lost the day it lands: the agent's
  there · hold · back is a Body row there, an Eyes row setting off before it, and the Body row back after the hold.
  Each bench is translated the same way, and his tuning is the next version (M12's amendment of 2026-09-30).
- **Built from the system.** The states are the system's `Tabs`. A row is a `Slider` with two thumbs, its range the
  span, on the timeline's axis, with its start and end as `Input`s beside it. The part, the event and the unit are
  `Select`s, the lock a `Toggle`, and adding, removing and moving a row up or down are `Button`s. That retires the phase
  grip, the one control M6 composed in the app (§5 item 13), if he agrees. *Mine:* where the rows are edited, on the
  player under the stage or on a jig of their own beside it, is version 1's layout for him to react to.
- **Where it lives.** In the browser with every other setting (`no-origins:motion`). Copy adds the states, as data,
  after the CSS lines. A state is not a token: it says when the parts move, and the tokens say how. Whether a component
  in the package will play a state one day, so that a hover on the portfolio is written here and not in code, is open.

**Built on the agent the same night** (his: *"Okay. Proceed."*), as the pill agent's **version 2** — deleted with the pill
later that night (M12's last amendment): the bench below stayed in the studio with no family on it until the agent's
motions (M20, the same night) were built on it. The other benches keep
M6's phases until each has named its parts. What is built, and where it went a different way from the rules above:

- **The model is the package's**, `lib/motion-states.ts`, pure: `flattenState` lays a state's rows out in its own time
  (an attached state's rows in its place, its window stretched onto the row's span); `stateValuesAt` gives every value
  at any moment, walked from one row's edge to the next, so a play is seekable and an event can start `from` where
  everything stands; `canAttach` keeps loops out. `lib/agent-rig.ts` adds the agent's rest (`AGENT_RIG_REST`: version
  1's shape, standing where it rests) and `agentRigOf`, the agent a state's values make. The blink's clock
  (`AGENT_RIG_DISCRETE`) is not eased between rows: a row sets it the moment it takes charge.
- **A row keeps the values set on it**, not the values off the rest as written above: a row that brings the body back
  sets Move X to 0, which is the rest, and has to keep it. So every control on a row shows what is underneath, dimmed,
  until it is moved; moved, it is set on that row, and a ✕ under it takes it off again.
- **Copy is the states alone**, as data, headed with the version (`/* Agent — Version 2 states, tuned */`). The
  agent's values live in its rows, so it has no CSS lines to send.
- **The bench.** On a wide field the instruments are the **States** card (the tabs; new, copy and delete; the name,
  what plays it and the window, its start, end and unit) over the **Row** card (the row selected: its start, end,
  ease and lock, Higher, Lower and Remove, and its part's controls, paged to the room). The player under the stage
  stands taller for it (as many rows of the field as leave the stage three, two to five) and holds a lane a row under
  the playhead: its name at its head, pressed to select it and again to let go, its span a two-headed slider on the
  playhead's axis, and the violet line through them all. Under the lanes, a row for each part and **Attach**. On a
  phone the lanes are a Rows card under the States, and selecting a row turns to its controls.
- **Selecting a row holds the stage at the row's end**, the playhead there, so what it sets is seen while it is
  configured; letting it go gives the stage back, live.
- **A new row** starts at the playhead, 400ms long or what is left of the window, above the row selected, so it wins
  where they meet; nothing is set on it until a control moves. **A new state** is an empty tab over the same window,
  played by the start. **Reset** puts the tab in front back to the version's state, keeping its name and every other
  state. **Saving is as he goes**, in the browser: there is no Save button. *Flagged:* he said "save it"; if he wants
  saving to be a step of its own, it is his to say.
- **Live, the agent answers the pointer on itself.** The state the start plays runs once when the bench opens. An
  enter fires again when the agent moves back under a pointer that has not moved, since the pointer enters it again.

**Amended 2026-10-01, his:** *"I don't have option to delete rows … in the timeline component … I'm still unable to figure
out uh, what are the options here what can I do … I don't understand what is this drop down for place."*

- **A row is deleted from its lane**: a bin at each lane's end (off while the row is locked, which says so), or Delete
  on the lane's name. The Row card's Remove is Delete.
- **Add row is one menu** where "+ Body" and the Place select stood: *a part's values* — every part the agents have, a
  part the motion does not tick shown and said so — and *another motion, placed in this one*, which plays at its own
  length and changes wherever it is edited (Place was M19's attach). Each group says what it does in a line. With no
  other motion, it says how to make one.
- **A ? beside the player's time** says how a motion works in five lines: a motion, a row, Add row, top to bottom is
  priority, and Lock and the bin.
- **A lane's name says what the row sets** when hovered ("Body 2, 0–1600 ms: Columns, Rows").

## M20 — Motion for any component: typed properties, versions, and the studio behind the sign-in (2026-09-30)

*His, the same night, after the agent's states: "I don't think what I'm trying to say was only specific to agent. The
thing is, we need to have defined set of rules and controls and boundaries … for any component that there is based on
the properties of that component I should be able to define the motion and then maybe all of that can be saved as
version in the database so that I can experiment a lot and then even when I'm not working with you an agent I can still
work on that from anywhere … we have to rethink everything from the beginning and the current use cases."* Then, of
what he meant by dynamic: *"we can have discussions and decide what properties will a component have and then we can
design a configuration based on what value is it and what is the type of that value. And any other necessary meta …
because there might be different types of values we should be able to cater to them so that it can scale so every time
that I save something I should be able to publish that as a version and yes let's … lock the motion studio behind
authentication let's use the same auth because it should be same across no origins later we will define roles."*

**Built the same night: the studio is behind the sign-in** (Admin.md §8.4, amended). The admin's sign-in became a
package, `@no-origins/auth`; the studio's `proxy.ts` calls its gate, `/sign-in` is its login card, and the session is
the admin's, one for every app (asked, he chose one package, one session, and open only locally). On a development
server with no Supabase keys the studio opens without a login, so the review sweep and CI still see it; production
never opens without them. Its Vercel project, its two variables and the hosted redirect URL are his steps
(CLAUDE.md, Deploying; supabase/README.md). Nothing in the studio reads a table yet.

**To design next, not built: the property model.** What he described, as I read it:

- **A component's properties are decided with him**, one component at a time: which of its values move.
- **Each property is a type and its meta.** The type says what the value is — a number in a unit, a duration, an ease,
  a colour, a choice, a switch, a vector in X, Y and Z, and whatever a later component needs — which control edits it,
  how it is checked, and how it moves between two values. The meta is the rest: its range and step, its default, its
  label, what it touches, which part of the component it belongs to. A new kind of value is a new type, added once,
  that every component can use: that is how it scales. The studio's `Token` kinds (`ms`, `ease`, `scale`, `share`,
  `choice`, `px`) and M19's parts are the first, partial version of both.
- **Motion is defined against those properties**: the states of M19, reading a component's declaration where the
  agent's rows read its two parts written in code.
- **Every save can be published as a version**, kept in the database, so he can experiment and come back to it from
  anywhere, without an agent.

What the design has to answer before any table exists: the types to start with, taken from the eight motions on the
bench; what a declaration holds, and where it lives (in the package beside its component, or in the database); what a
version is (a component's whole configuration, or one state), whether a published one is fixed (Admin.md R1: an integer
with a required label) and what a draft is between two publishes; how a published version reaches a component on a
page — a token in globals.css as M7 has it today, or read from the database, which the portfolio's rule (*the page is
static, a component may be live*) constrains; and who may publish, once there are roles. The next step is that
document, written from the current use cases.

**His model of a motion, the same night**, once version 12 (his settings) was the agent's base (*"let's use that and
we'll continue our state machines from there"*). Dictated, so the transcript's "ice" is eyes, and the bracket is my
reading: *"first I might define only movement of eyes while it's sitting idle so I don't need to put any settings for
the body so I can have one is angry one is patient one is curious one is calm one is sleeping one is distracted like
that I mean I should be able to add name to that motion and then I will just check the checkbox and then I will see
[the] eyes and then maybe sometime later I will define movement maybe from one cell to another so I might just pick a
time frame to the movement and then maybe I'll just put some eye motion in the row above the body motion … So a motion
will have master timeline and then maybe if I want to like add a motion which is 0.5 seconds of eyes and then the body
movement might take for three seconds and then maybe I want to put this eyes motion somewhere in between 0.5 and one
second so only those properties that I change of the eyes will merge with the properties that I set in that motion so
now that full thing will become one motion."* As I read it:

- **A motion has a name and a master timeline.** Angry, Patient, Curious, Calm, Sleeping and Distracted are six
  motions, with his names, and he makes as many more as he likes. This is M19's tab under his word for it, and its
  window is the master timeline.
- **A motion ticks the parts it moves.** Each of the component's parts has a checkbox; on the agent they are Body and
  Eyes. A ticked part shows its controls. A part left unticked is not touched by the motion. So an idle motion of the
  eyes sets nothing on the body, which sits in its nest as the agent's version has it, breathing.
- **A row sets only what he changes** (M19 as built). Everything else comes from the rows under it, and under all of
  them from the agent's version.
- **A motion goes into another motion as a row, at its own length.** His 0.5s of eyes, put into a 3s move from one
  cell to another, is a row from 0.5 to 1s. It is linked (M19): edit Curious, and every motion that holds it plays the
  edit.
- **The row above wins only on what both set** (M19's rule). With the eyes' row over the body's, from 0.5 to 1s the
  eyes do what Curious sets. Anything Curious leaves unset, they do as the move has them: looking where it goes, and
  blinking.
- **The whole is one motion.** It has a name, and it can go into other motions in turn.

```
Hop and wonder         0 ──── 0.5 ─── 1.0 ──────────────────── 3.0 s
  Curious   (eyes)            ███████
  Hop       (body)     ███████████████████████████████████████
```

*Mine:*

- **M19's bench is most of it.** What changes:
  - the part checkboxes;
  - a placed motion's row starts at the motion's own length (M19 stretched a state onto whatever span it was dropped
    on; dragging an edge still stretches it, and it plays slower);
  - the bench says **motion** where it says state;
  - the agent's Body is the sphere's hop, not the pill's move and turn in X, Y and Z.

  The build is that bench on the agent, once the eyes' properties below are his.
- **"State machine" is kept for what plays the motions:** the events that move the agent from one motion to another
  (a click, or a minute with nothing happening). M19's events are the first of them. The rest wait until he names them.
- **What M20 versions is a motion,** such as Curious, version 3. Each motion sits on the agent's own version, which is
  12 today. *Open,* with the rest of versioning.
- *Open:* a Body row that is the hop, given 3s. M19 scales all of a motion's parts together, so the hop would play in
  slow motion. The other reading keeps the leap at its speed and gives the rest of the span to landing and rest. This
  can wait until he places one.

**What his six need from the eyes.** Version 11's eight eye properties build the eyes (size, spacing and height) and
play them through a hop: they look where it goes, turn early by the look lead, blink, and squint on landing. None of
them can make the eyes angry or asleep. *Proposed:* four more, for him to confirm.

| Property | Type | Range | What it is |
|---|---|---|---|
| Look X | number | −1 left … 1 right | where they look, as a share of how far an eye can travel on the head |
| Look Y | number | −1 down … 1 up | the same, up and down |
| Open | share | 0 shut … 1 wide | how open the lids are at rest; a blink still shuts them from there |
| Slant | number | −1 sad … 1 angry | the upper lids' tilt: inner ends down is angry, outer ends down is sad |

Look X and Y add to the look where it goes, so a hop still looks ahead unless a row sets Look to 0. Here are his six in
these properties, as a first guess for him to tune, not as settings:

| Motion | Its eyes |
|---|---|
| Angry | Slant 0.8, Open 0.6, looking straight out, blinking every 6s |
| Patient | Open 0.8, looking straight out, a slow blink every 5s |
| Curious | Open 1, Look X from −0.6 to 0.6 and back, on two rows |
| Calm | Open 0.55, Slant −0.2, a slow blink every 4s |
| Sleeping | Open 0, no blink |
| Distracted | Look X 0.8 and Y 0.3, glancing back to the centre and away again |

**His answers, the same night:**

- **More parts than the eyes.** *"I still need more parts … currently I'm thinking pupils, lower lids, upper lids,
  brows, mustache, pimples, hair. I mean I want to have this like an asset library, I'm not sure what we can do here."*
  So the four properties above are not the eyes' whole set: the face is made of parts, taken from a library (below).
- **A motion played on its own stops on its last frame** and holds it: *"for now we will stop on its last frame."*
- **A hop keeps its speed:** *"No, currently let's keep its speed."* Given a longer span, it leaps at its own speed,
  and the rest of the span goes to landing and rest. *Mine:* a hop's span cannot be dragged shorter than its leap.

**The face is parts from a library.** This is *proposed*, not his yet:

- **It lives in Orbit.** Orbit is appearance, and C1 lists accessories among it
  (Orbit.md). There he picks what the agent wears and how it looks; the motion studio moves what it wears.
- **A library is slots, and each slot has styles.** The slots are upper lids, lower lids, pupils, brows, mustache,
  hair, and marks (the pimples). A style is one way of drawing a slot: Brows could be a Line, an Arch or Bushy. The
  agent wears one style in a slot, or none.
- **Each style has its own settings, typed** (M20's property model). Brows · Arch, for example, has thickness, length,
  arch, height, angle and colour. The motion studio shows every part the agent wears next to Body as a checkbox, and
  offers that part's settings as the controls a row can set.
- **A style is drawn in code from its settings**, as the eyes are. That way it bends with the head as the head
  squashes, stretches, leans and squeezes, every number on it can ease in a motion, and its colour stays flat. A
  drawing made in a design tool and uploaded could only move, turn, grow and fade as a whole. Uploaded drawings can come
  later, for things that do not bend with the head, such as a hat.
- **The eyes' parts come first:** pupils, upper and lower lids, and brows, because his six moods are made of them. The
  four properties above move onto those parts: Look X and Y to the pupils, Open and Slant to the upper lids. Mustache,
  hair and marks come after. *Mine:* hair can swing on the tail's spring as the agent hops.

**His answers on the library, the same night:**

- **Both kinds of style.** *"I haven't drawn paths myself in any design tool. I never tried them, but I might. So I
  think we should have option for both. I mean, if we have to upload, what is that we need? Or will the uploaded model
  just directly go into the code?"* So a slot's styles come in two kinds: drawn in code from settings, or drawings he
  uploads (below).
- **The eyes' parts come first** (*"Okay, sure"*): upper lids, lower lids, pupils and brows.
- **Marks are the textures that faces in animation wear** (*"I meant some texture that are usually used on face and
  animated characters, you might have better idea"*). He meant neither pimples nor dimples as such.
- **No mouth:** *"no I'm not giving any mouth to the agent."*

**An uploaded style.** This is *proposed*:

- **What he needs to make one:** an SVG, drawn in any tool on a template the studio gives for each slot. The template
  shows the head, the eye line, and the box the part sits in. The upload checks four rules:
  - flat fills only, with no gradient and no blur (the system's rules);
  - shapes only, with no picture inside;
  - one side of a pair, because the other side is its mirror;
  - colours by layer name: a shape in a layer named `ink`, `paint` or `light` wears the agent's colour of that name,
    and any other shape keeps its own colour.
- **Where it goes: not into the code.** It is cleaned down to its shapes and kept in the database's storage as a
  version. In the library it stands as a style of its slot, next to the styles drawn in code, and the agent draws it
  from there. A page that shows the agent carries the published version with it when the page is published (*the page
  is static*); it is never fetched at a visit.
- **What it can do:** follow the head, squashing and stretching with it as a whole; change colour; and move, turn, grow
  and fade in a motion. **What it cannot do** is change its own shape, the way a brow drawn in code arches further. For
  that he uploads one drawing per pose, a calm brow and an angry one, and a motion switches between them. If the second
  pose is made by moving the first one's points rather than by drawing it again, the motion can blend one into the
  other. *(This corrects my earlier note: an uploaded style does not have to slide over a squashing head.)*

**The types to start with** (the first of M20's questions). *Proposed:*

| Type | What it is | Between two values in a motion |
|---|---|---|
| number | a value in a range, with a step and a unit: a share of the head or of the eye, −1 … 1, px | eases |
| angle | degrees | eases |
| duration | ms, or s and min (M19's units) | eases |
| colour | one of the agent's named colours (paint, ink, light) or one of the palette's | switches at the row's start |
| choice | one of a list, such as a slot's style | switches |
| switch | on or off | switches |
| drawing | an uploaded drawing, by version | switches |

Every property carries the same meta: its label, its part, what it touches, its range and step, and its default (the
version's value).

**The face, version 1.** *Agreed* (his, the same night, of these parts and of the symbols below: *"yes for both"*):
the first four parts, drawn in code. Each pair is mirrored until he
unmirrors it; after that, left and right are set apart, which is what gives one raised brow.

| Part | Styles | Settings |
|---|---|---|
| Eyes (today's) | none | Size, Spacing and Height; **Colour** (2026-10-01, his: *"I should also be able to set the color of the eyes"*), one of the agent's colours by name — a solid eye, a Dot's pupil, a Shine's eye — and Ink, its default, the colours they have always been (`eyeColours`: ink on a solid eye, deep under a pupil or a catchlight); **Look X** and **Look Y** (−1 … 1): with a pupil, the pupil moves inside the eye, and without one the eye moves on the face; Look ahead and Look lead, as today |
| Pupils | **None**: the eye is solid ink, as today · **Dot**: the eye is light, with an ink pupil in it · **Shine**: solid ink, with a light catchlight that stays put as the eye looks | Size (a share of the eye), Shine size, Shine angle |
| Upper lids | **Plain**: cuts the eye, as today · **Heavy**: a band of the body over the top of the eye, with an ink line on its edge | Open (0 shut … 1 wide), Slant (−1 sad … 1 angry), Curve, Blink every, Blink, Squint on landing |
| Lower lids | **None**: as today · **Plain**: rises from below and cuts the eye | Raise (0 … 1), Slant, Curve (up gives the ^ ^ of a content face) |
| Brows | **Line** · **Arch** · **Bushy** | Height above the eye, Angle (−40° … 40°; the inner end down is angry), Arch, Length, Thickness, Colour |

His six in these parts, as a first guess and not as settings:

| Motion | Its face |
|---|---|
| Angry | brows low and angled 30° in; upper lids Slant 0.8, Open 0.6 |
| Patient | brows level; upper lids Open 0.75, a slow blink every 5s |
| Curious | brows up, one higher than the other; upper lids Open 1; looking left, then right |
| Calm | upper lids Open 0.55; lower lids Raise 0.25, curved up |
| Sleeping | upper lids Open 0; lower lids Raise 0.2; brows low and slack |
| Distracted | brows level; looking up and to the side, a glance back, then away again |

**Marks come after the four.** *Mine*, since he left the textures to me. They are flat, like every colour in the
system, so there is no soft-edged blush:

- **Blush:** a flat oval under each eye, or three short strokes (///), in a colour of its own.
- **Freckles:** a scatter of dots across the cheeks.
- **Symbols that pop up by the head in a mood,** drawn the way manga draws them: the cross of anger for Angry, a sweat
  drop, a Zzz rising for Sleeping, a sparkle, a question mark for Curious. **A slot of their own** (his *yes*), played
  by motions rather than worn: a row shows a symbol over its span.

Mustache and hair come after marks.

**Versions and publishing.** *Agreed* (his, the same night, given in Orbit's session: *"I agree to your
split. And yes, a published motion should freeze. And any new change will lead to new publish. Each publish should be
treated as a version."*). It answers the questions M20 left open above, and follows the admin's rules wherever they
already decide (Admin.md §6.4, §7, R1 to R3). A change never alters a published version: it is saved in the draft, and
the next publish makes the next version.

- **Three things get versions.**
  - A **character**: what the agent looks like, meaning its body, the parts it wears and their settings. It is edited
    in Orbit.
  - A **motion**, such as Curious or Hop and wonder: its timeline and its rows. It is edited here.
  - An **uploaded drawing**.

  A motion is made on a character's parts, so it plays on any version of that character. A row for a part the
  character does not wear does nothing.
- **What a component can have stays in code; what he chooses goes in the database.** The declaration lives in the
  package, beside the drawing that uses it, because the two change and ship together. It covers the parts, their
  styles, and each setting's type, range and default. The values he picks, a look or a motion, are data. Every
  uploaded drawing has the same declaration: where it sits, its turn, its size, and colour by layer.
- **A draft saves as he goes, in the database.** There is one draft per character and per motion, so the studio opens
  where he left off on any device. If two devices write at once, the later write is refused rather than merged, and
  the studio says so (Admin.md §6.4's `rev`). M19's bench saves in the browser today; that moves into the draft.
- **Publishing makes a version: a number and a name he types** (Admin.md R1), such as `13 — angry brows`. An empty or
  repeated name is refused.
  - A version never changes and is never deleted. Going back to an older one makes it the current version, and nothing
    is renumbered.
  - Each version records the package version it was made with (Admin.md §7), because a style drawn in code can change
    underneath it.
- **The agent's numbering carries on.** Version 12, his settings, is stored as the agent's first version and keeps
  its number, so the next publish is 13.
- **A published motion is frozen, along with the versions of the motions it holds.** In a draft, a placed motion is
  linked (M19): edit Curious, and every draft that holds it plays the edit. Once Hop and wonder is published, it keeps
  the Curious it was published with; publishing it again takes the newer one (his *yes*).
- **A page gets a version when the page is built, never when someone visits it** (*the page is static*).
  - Publishing writes the version to the public `publish` bucket at a fixed address (Admin.md §8.2).
  - It then asks every page that shows that character to rebuild (Admin.md R2, the revalidate).
  - It reads the live page back to check the new version is the one showing.

  No page shows the agent yet, so this waits for the first one.
- **The design system's own motions stay in code** (Admin.md R3). The loader, the slider's grip, hyper focus and focus
  mode are played by every page in every app, so their settings still reach globals.css the way M7 describes: Copy,
  then a commit. The database is for characters and their motions, which are his to make and change from anywhere
  (his: *"I agree to your split"*).
- **He is the one who publishes,** since he is the only person the sign-in lets in. Roles come later (Admin.md
  §8.3's owner, editor and viewer).
- **The tables follow once this is agreed:** characters, motions, their drafts and versions, and drawings, with the
  drawings' files in storage. RLS denies everything except the signed-in owner (Admin.md §8.3).

**Built the same night, in two sessions** (the split his *"I agree to your split"* approved: Orbit's
session builds the library and the upload; this one draws the parts and their motion):

- **The declaration**, in the package, pure:
  - `lib/properties`: the types, their meta, `set` (look or motion), and `checkValue`.
  - `lib/agent-face`: the slots, their styles and settings, and `FaceLook`.
  - `lib/agent-body`: the body's groups; `CharacterLook = { body, face }`, `checkCharacter`, `resolveCharacter`; and
    `sphereMotionOf`, the agent a look makes.

  Ids are unique across body and face (65), so a row keys any value by its id alone.
- **A look is kept whole** (mine, from the review of the tables). A draft is saved with every value, and a version is
  frozen with every value, not only the ones moved off a default. A default that changes in code later must not change
  what a published version looks like (Admin.md §7, the reason for the theme snapshot). A key missing from a look read
  back is a setting declared since it was saved, and takes its default.
- **The tables** are the migration of Orbit's session, reviewed here and applied to the local stack only
  (`supabase/migrations/20260930090000_studio_versions.sql`, supabase/README.md). One shape serves all three kinds:
  - `studio_items`, each with one draft (`studio_drafts`, whose `rev` refuses a stale write).
  - `studio_versions`, numbered max + 1 per item with a label that is never empty and never repeated, frozen by
    trigger, and made current as it is published (`studio_publish`).
  - The agent is seeded with version 12, its look whole.

  Pushing it to the hosted project is his step.
- **The face's parts are drawn** (M17, version 13), and the motion studio's jigs for them are built from the
  declaration.
- **Uploaded styles**, the same night:
  - **Orbit's session** built the library, the upload and its checks (Orbit.md). The
    template for a slot is drawn from the package's `faceAnchors` and has Guides the cleaner maps back from.
  - **This session** built the drawing: `DrawingData` and `checkDrawing` in `lib/agent-face`, and the `Agent`'s
    `drawings`, each drawing placed on its slot's anchor, a pair's right part mirrored, colours from `lib/agent-colours`.
  - **Checked end to end** against the local database: a brow drawn moved and scaled on its template cleans back to the
    same paths, and sits exactly where the template's cross was, mirrored.
  - A symbol can be uploaded as far as the package goes, but the library shows only worn slots, so nothing picks one
    yet.
- **Not built yet:** unmirroring a pair.

**The agent's motions, built the same night** (asked whether to start the timeline, his *"Yes"*). M19's bench is on
the agent as a family of its own, **Agent motions**, beside the Agent page (`content/agent-motions.ts`). It sits beside
the page rather than in its place, so the Agent page's jigs, where he tunes and sends back its versions, stay as they
are.
- **A motion is a tab:** a name, a window, and the parts it ticks. The parts are the agent's own: Body, and each slot of
  its face (Eyes, Pupils, Upper lids, Lower lids, Brows, Symbols), each part's controls those of its declaration.
  - A row can be added only for a ticked part.
  - A part unticked is not touched by the motion. Its rows are kept and dimmed, and not played: `flattenState` leaves
    them out (`MotionState.parts`).
- **Every row stands on the agent as the Agent page has it tuned** (`FamilyMachine.restFrom`). A row changes only what
  is moved on it, and a control shows the tuned value, dimmed, until it is.
- **A Body row that sets Columns or Rows is a hop** that many cells from wherever the agent sits. It starts with the row
  and flies at its own speed (his: *"keep its speed"*); the rest of the span is its landing and rest. A hop still in the
  air when the next would start goes first. Whatever else the row sets, the hop leaps with.
- **While a hop is in the air**, rows can still move the face and how the agent is turned. The rest of the body is the
  hop's, read at its start.
- **The agent sits** where the path its hops take is centred on the stage, and in the stage's middle when it does not
  hop.
- **A motion plays to its window's end and holds its last frame** (his: *"stop on its last frame"*). Another motion
  goes into it as a row at its own length (**Place**), linked.
- **Version 1 starts from the Agent page's play**, a Hop there and back, written as a motion. His six moods are his to
  make; none is seeded.
- **Where it is kept: in the database**, built the same night (asked whether saving should come next, his *"Yes"*).
  - **Each motion is an item** of kind `motion`, made for the Agent, with one draft (`apps/motion/src/app/actions.ts`,
    server functions as Orbit's are).
  - **It saves as he goes,** 500ms after the last change, whole, on the `rev` it was loaded at. Another device's save
    first stops the saving, and the card says *Changed elsewhere* and offers *Load it*.
  - **A new tab is a new item, made under its own id.** A deleted tab goes from the database if it was never published.
    A published one stays, and its Delete is off.
  - **Publishing** takes a name he types, beside the timeline on a wide field and on the Motions card on a narrow one.
    It pins every motion the motion places to that motion's current version (`AttachRow.version`), then makes the draft
    the next version. A motion that places one never published is refused until that one is. **Back to** makes an older
    version the one pages would play, and the draft its motion.
  - **The first time the database has none,** version 1's Hop is made there.
  - **With no keys, or signed out,** the motions are the browser's, as M19's were, and the card says *In this browser
    only*.
  - *Found while testing it:* React's development double mount loaded twice, and the second load came back after a new
    tab and put the page back to the database's. A load now never undoes edits made since it began, and nothing is
    edited while the first is on its way.
  - *Also found:* a control not set on a row showed the value underneath as its own, so typing that same value set
    nothing, and a hop of one column (his Columns is 1) could not be typed. That value is now the field's placeholder.
- **A pair set apart on a row** (his, the same night: *"I want to fix the mirror pairs"*; built). A row of a paired
  part — the eyes, their pupils and lids, the brows — has a **Mirrored** switch, on. Off, the right side starts as the
  left is, and **Left · Right** says which side the row's controls edit: a right-side value is the row's own
  (`<token>-right`, `AttachRow` untouched), read by the model as the pair's right (`SphereMotion.right`). Mirrored again,
  the right's values come off. One brow raised is a Brows row, Arch, the left's Angle −30 and the right's 35. Not every
  setting of a pair has a side: their spacing, a style, the blink's clock and the like are the pair's, and the right's
  controls for them are off. The Agent page itself has no right side yet: a character's set-apart pair is Orbit's,
  and reaches a motion when the motion studio reads the character (open).
- **Not built:**
  - an event other than Play (his, the same night: *"later, whenever we need, we can attach motions to triggers, so we
    don't need them"*);
  - a view that brings the agent nearer, since at a 60px cell a turned eye moves 4px.

## M21 — The slider's steps: a mark over each, a zone round each, and a tick as the head lands (2026-09-30)

*His, the same night: "For sliders, we need an option to have segments … if the smallest unit is 1 and if the total
slider numbers are 5, we can have small dots above them, which can be controlled, the size can be controlled of those
dots, and … basically it should give the tactile feedback, and the motion should also be designed."* Then, before he had
seen it: *"Give me a control where I can control the zone for each … mark. And if the cursor holding the head is in that
zone, the head should snap right under the mark."* A motion he named, so it is on the bench (M9), after the grip, as
**Steps**, designed version by version (no presets). It is not M18: the bar stays one fluid body, and the dots stand
over it.

- **The option is the component's.** `Slider marks` draws a dot over every step's place, and `marks={5}` one every five
  of the value's units from `min`. A mark stands where a head stands at its value (radix's in-bounds offset, reckoned
  from the values, never measured), so a head at rest is right under its mark. The dots are above the bar, before it
  when the slider stands vertical, **in room the slider keeps at the top of its box** (tried outside the box first: in
  the showcase's stack the dots read as the slider above's). `--slider-mark-size` and `--slider-mark-lift` set the dot
  and its distance from the bar; 6px and 6px unset.
- **The light.** A mark is the bar's grey, and lime where the value is: it lights the moment the value lands on it,
  with its tick, and one the value has left stays lime until the body's lime (M16's follow) has flowed back past it,
  fading over the dot's width. Arriving is a click; leaving drains. *Mine.* Version 1 lit them only as the body reached
  them, which made the tick's dot pop grey; changed before he saw it.
- **The zone** (his). Every mark has one, Zone px either side of it along the bar, never past half way to the next
  mark (zones meet at most, and then the head is always under a mark). While a head is held and its cursor is in a
  zone, the head goes right under the mark on a spring, Snap ms long, and the value is the mark's; out of every zone the
  head is the cursor's again and **the value lands on no mark it has not snapped to**, so a drag let go between two
  marks drops back to the last one it snapped to — a detent. A press outside every zone still takes radix's nearest
  value, so a click on the bar moves it. With Zone at 0 there is no snapping and the value is radix's. *Mine:* the
  value following the snap (his note spoke of the head; a head under a mark with the value elsewhere would jump when
  let go), the hold between zones, and the press's exception.
- **The tick.** With a zone, the snap is the tick; with none, or from the keys, it is the value landing on a mark.
  A tick is three things at once: **the mark pops** — up to Pop times its size in Pop in ms on cubic out, then back on a
  spring (Settle, Settle bounce), so a fast drag runs a wave through the marks; **the head kicks** on the same curve, to
  Kick times its size, a bump in the bar at rest and a pulse in the cursor while held, stopped at the ring's inside
  (20px); and **the hand feels it** where it can: a vibration Haptic ms long through the Vibration API, which Android's
  browsers have and iOS Safari and every laptop do not — there the tick is only seen. *Mine:* the kick, and the haptic's
  form.
- **Tried and taken out before he saw it: the notch.** The held body clicking a share of each step behind the head.
  It kept the bar's opening with the lime, so the held head sat over the grey instead of in its opening, breaking M16's
  grip; the kick replaced it.
- **Played on the grip's loop, modelled in the package.** `lib/step-motion.ts` is pure (`readStepMotion`, `stepPopAt`,
  `markLit`, `zoneOf`, `paintMark`, `stepHaptic`); `useGripMotion` plays it with the grip — `land` for a value landing,
  the zone found on every pointer move before radix reckons the value, `onSnap` handing the slider the mark's value and
  `snapped` telling it which mark holds it. At rest the marks are the slider's own render. Under reduced motion the pop,
  the kick and the snap take no time; the haptic stays.
- **The tokens**, in three groups on the jig. **Marks**: Size, Lift. **Tick**: Pop, Pop in, Settle, Settle bounce.
  **Feel**: Kick, Haptic, Zone, Snap. None in globals.css until he picks (M7); `STEP_START` and the slider's fallbacks
  are version 1's.
- **Version 1** (mine, from his two notes): a 6px dot 6px over the bar; Pop 1.8× in 60ms, Settle 360ms at 0.4; Kick
  1.2×; Haptic 10ms; Zone 16px; Snap 90ms, no bounce.
- **The specimen** is three system `Slider`s with marks on the stage's rows, a free row between: his example, 1 to 5;
  a range, 0 to 10; and 0 to 20 marked every 5, where the value steps by 1 and only a mark snaps and ticks. It borrows
  the grip at its own values. Live it is dragged by hand or stepped with the keys. On the timeline a play is the
  grip's detach, the hand dragging each first head two steps out and back from where it is, the way there is room —
  stepped from the start by the slider's own rules, so the zone, the snap, each tick and the body's follow are the same
  as a hand's — holding and merging, with the cursor drawn as a ring over the hand.
- **Fixed with it, in the grip's hook:** radix hides a head on its first render (it knows its index only once it is
  mounted), so the grip's first measure found every head at the start edge, and the first move of any slider poured
  the lime in from there. It measures again once the heads are placed.

Flagged: a zone wider than the ring pulls the head out of it (the head is under the mark and the cursor is not); on a
long slider with a mark every step the pops run together; iOS has no web haptics at all (a hidden switch input clicked
from script gives one tick on iOS 18, and is a hack — his call); and only the studio and the showcase draw marks.

## M22 — The intro is the agent: it breathes, hops in place, and the field wakes ring by ring (2026-09-30)

*"Here is the intro loader that I want. Uh, we created agent character. So now what should happen is that uh, take
the avatar. It should uh, breathe for like one, two seconds. And then it should jump within the same cell and create a
ripple activations of cells. Like, I mean, each cell in circles around the agent circle should activate. One circle by
one circle from center to the borders of the layout, and then the agent disappears and the card should render
smoothly."* Built on the portfolio as Grid.md D50, Version 1. It is a family of its own, `intro`, and it plays the
agent's parts rather than copying them. The breath is the agent's rest (`sphereStill`), and the hop is a
`sphereCourse` from its nest back to the same nest. Both are read off the page with `readSphereMotion`, as the
motion studio's stage reads them. What is the intro's own is when each part is and how far apart the rings are.

| Token | Version 1 | What |
|---|---|---|
| `--motion-intro-breathe` | 2000ms | how long it breathes before it hops |
| `--motion-intro-ring` | 45ms | from one ring of cells lighting to the next |
| `--motion-intro-vanish` | 300ms | the agent fading, once the last ring has lit |
| `--motion-intro-reveal` | 500ms | the page coming in, from the same moment |

None is in globals.css. `readIntroMotion` (`lib/intro-motion.ts`) falls back to `INTRO_START`, which holds these values.
A cell's lit ring fades over the field's 500ms, the pointer's (Grid.md D34). The intro is not on the bench. Putting it
there, so he can tune it and send the settings back, is the next step if he wants one.

### Version 2 — the six (2026-10-01)

*"Now this is what we will try to build. Is the intro scene. The complete motion design uh, based on our design system
motion principle and everything and uh, the thing is uh, the intro will be filled with six of our agents that we
designed uh, to be in the center. And then uh, after two seconds, they will jump into multiple sections and uh, build
these components on the page. I mean, it's the feeling that I'm trying to say. It's like it should feel like these
agents uh, are loading and then once everything is loaded, they jump into uh, different places and uh, they will open
up the components."* Grid.md D50 amended, Portfolio.md P23 amended. It replaces version 1 whole: no hop in place and
no rings of cells. Its parts are other families' decided motions, read and never copied:

- **The gather is his loader's square** (M10, `loaderLayout`): one agent a nest on the field's centre, as near square
  as can be and never wider than tall, so six stand two across and three down. Each breathes at its own pace, which is
  the loading. Where each one stands is the spot that leaves them least to travel all told, so they fan out.
- **The leap is the agent's own** (M17, `sphereCourse`), each with its look's crouch, landing and eyes leading. Two
  numbers are the intro's: every agent is in the air for `flight`, however far it goes, and the arc's height grows
  with the distance (`arc`), held so it never leaves the top of the screen. Each crouches as long as it does, so all
  leave the floor together and land together: his loader's rule, *"let all the loading cells reach their destination
  cell at once"*.
- **It lands on the box's top-left cell** (M10: *"always move them to the top left corner of any component"*). Each box
  names the agents that open it (`data-intro-by`). A box that names none goes to the nearest agent. An agent with no box
  of its own lands beside the one that opens the box naming it, along its top row. On a phone that is the tabs bar,
  one agent a tab.
- **It dives, and the nest opens into the box.** After `settle` it sinks through its nest's circle over `dive`, cut to
  the circle, through the page's opening its tail was always behind. From the same moment the nest opens rightward
  and down into the box. This is the loader's opening (`openBox`, the `--motion-load-*` duration and reveal, movement's
  ring curve). The lime line turns into a plain border over the loader's press as it grows, and the box comes in under
  it as the border goes. The agent's other boxes follow, each from its own top-left cell, `cascade` later for every
  pitch it is from the nest.

| Token | Version 2 | What |
|---|---|---|
| `--motion-intro-gather` | 2000ms | how long they stand together before they leave the floor (his "after two seconds") |
| `--motion-intro-flight` | 720ms | every agent's time in the air, however far |
| `--motion-intro-arc` | 0.2 | an arc's height over the higher nest, in cells for every cell travelled, on half a cell |
| `--motion-intro-settle` | 250ms | landed, before it dives |
| `--motion-intro-dive` | 320ms | the dive through the nest |
| `--motion-intro-cascade` | 80ms | each further box of its section, a pitch |

Version 1's four tokens are gone. None of these is in globals.css: `INTRO_START` holds them. The cast is the page's
(`introAgents` on `Grid`). The portfolio's is the six (brand/Agents.md), each at its current version in Orbit.

*Measured* (`e2e/.mcp/agent-intro.mjs`, `e2e/.mcp/intro-fps.mjs`, local dev server, 2026-10-01):
- **1440 × 900:** they land at 2.72s and open from 2.97s. The last box in, the statement about roles five rows down
  Kino's column, is in at about 4.6s, and the wake (Portfolio.md P16) follows. A 412 × 915 phone is the same.
- **Frame rate:** 60fps while all six paint, in headless Chromium on his Mac. With the CPU slowed four times it is
  about 28fps. One frame of a shaped agent costs 1.2 to 1.6ms (the cube, the cone, the prism, the hemisphere), the
  cylinder 0.4ms and the sphere 0.07ms. That cost is the shape model's (`agent-shape`), not the intro's.

*Mine, his to tune:* every number above; which agent opens which section on the portfolio (P23); the dive itself, where
"open up the components" could also be read as the agent staying on its box; landing all at once, not each at its own
pace.

### Version 3 — the actions (2026-10-01)

*"Now here is the motion design I want. For intro. Since we have now defined the motions for uh, dive, jump and bounce,
in intro, intro will be a three second sequence where all the six agents are randomly placed within the center four by
four cells and then they will randomly keep bouncing not together random agents will bounce at random times with random
frequency for uh, two seconds and then randomly some agents will dive and some agents will jump to their positions and
um, once they reach their destination cell we should have the ripple the first type of ripple that we had where um, the
agent jumps and then it spreads right so similarly but that should happen for all the agents with small radius."* Grid.md
D50 amended, Portfolio.md P23 amended. It replaces version 2's gather and leap. The landing on the box's top-left cell,
the dive into the nest and the box opening stay as they were.

- **The moves are his actions** (M24), as he published them: Bounce 1.1, Jump 1.3 and Dive 1.4. The portfolio copies
  their values (`content/actions.ts`, `INTRO_ACTIONS`, a snapshot as `agents.ts` is) and hands them to the grid
  (`introActions`). Each agent moves as its look makes it under each action's values (`sphereMotionOf(look, values)`).
  Nothing of how they move is the intro's. Version 2's `flight` and `arc` are gone.
- **They stand at random.** Six cells picked at random from the field's centre four by four, a different six on every
  load, never a cell an agent will land on. Each agent stands in the cell that leaves the cast least to travel overall,
  so they fan out and no two cross where that can be helped (`introSpots`).
- **They bounce, not together.** Each makes its first Bounce at a random moment in the first `first`, then again at its
  own pace: a wait it picks up to `rest`, each wait varying by about a third either way. Some bounce often, some seldom.
  A bounce may start once the last one has landed and come to rest, so the next one cuts its settle. His Bounce does
  not squash, so nothing is seen to cut. Waiting out the settle would have let Bali and Lola bounce once: on slime it
  runs about a second. No bounce starts that would not be at rest by the time its agent leaves.
- **They leave, some diving and some jumping.** Each leaves at a random moment in the `leave` after `gather`, by a Jump
  or a Dive picked at random, with at least one of each. It goes to the top-left cell of the box it opens first, as in
  version 2 (`introCast`, unchanged).
- **Each landing spreads a ripple.** This is version 1's ripple, made small. As an agent first touches down in its nest
  (the play's `lands`), the cells round it light in violet, ring by ring out from the nest's edge, as version 1 counted
  its rings. The rings are `ring` apart and go `ripple` rings out, and each cell fades as the pointer's cell does
  (500ms). Two rings is the eight cells round the nest, then the ring after them: a disc about two cells across each
  way. The nest's own cell, under it, never lights. Each agent's ripple is one pass of the field's painter, all sent as
  the intro starts and each timed from its landing on the painter's clock. Where two ripples cross, a cell shows the
  younger lighting (`grid-field.ts`).
- **Then the components open**, as in version 2. `settle` after landing, each agent dives into its nest over `dive`,
  and the nest opens into its box. Each agent does this from its own landing, not all at once.

| Token | Version 3 | What |
|---|---|---|
| `--motion-intro-gather` | 2000ms | how long they bounce before the first may leave (his "two seconds") |
| `--motion-intro-first` | 500ms | the latest an agent's first bounce starts |
| `--motion-intro-rest` | 700ms | the longest an agent's pace waits between one bounce at rest and the next |
| `--motion-intro-leave` | 300ms | the window after `gather` in which each leaves |
| `--motion-intro-ripple` | 2 | how many rings out a ripple goes |
| `--motion-intro-ring` | 80ms | from one ring of a ripple lighting to the next |
| `--motion-intro-settle` | 250ms | landed, before it dives into its nest |
| `--motion-intro-dive` | 320ms | that dive |
| `--motion-intro-cascade` | 80ms | each further box it opens, a pitch |

None is in globals.css: `INTRO_START` holds them. The ripple's 80ms a ring is slower than version 1's 45ms, so a
spread only two rings long is seen to spread.

*Measured* (`e2e/.mcp/agent-intro-v3.mjs`, `e2e/.mcp/intro-end.mjs`, `e2e/.mcp/intro-fps.mjs`, local dev server,
2026-10-01):
- **1440 × 900, three loads, at Jump 1.3 and Dive 1.4:** bouncing at random until 2s. They leave between 2.0 and 2.3s
  and land between 2.40 and 2.80s; a Jump touches down 380ms after it leaves (its crouch and his 320ms Air time). The
  ripples spread from each landing, and the page is handed over at 4.45 to 4.63s (version 2: about 4.6s).
- **412 × 915 and a Pixel 7:** the six start in the centre four by four. Four of them land on the tabs bar side by
  side, and their ripples join into one band across it. Handed over at about 4.3s.
- **Frame rate:** 60fps while all six paint. With the CPU slowed four times it is about 27fps, the same as version 2.
- **Reduced motion:** the page is on the field at once, with no layer.

*Mine, his to tune:* every number but the two seconds. Also mine: that the next bounce may cut the settle; that
departures are spread over 300ms; standing where travel is least, among the random cells; at least one Dive and one
Jump; the ripple in violet; and keeping version 2's ending. **His Jump is one Air time however far it goes** (320ms
in 1.3, 220ms in 1.2), so a leap across a desktop is quick and low (0.95 cells over the higher nest). That is the
action's, tuned on a four-row hop in the studio. If it reads too fast here, its Air time is the control to move.

*Open:*
1. On a phone a cell is 72px or more, so a two-ring ripple covers a good part of the screen.
2. The action values are a copy. A version he publishes later reaches the page only when `content/actions.ts` is copied
   again, as for the looks.
3. The intro is not on the motion studio's bench, so its numbers cannot be tuned there yet.

### Version 4 — the centre and the ripple (2026-10-01)

*"Right now, in intro, uh, when the agent jumps and reaches its destination cell, there are waves. But uh, what I want to
update is that the agent should jump to the center of the sections that it is rendering. And uh, instead of uh,
expanding these sections from top left they should render along with the uh, ripple."* Grid.md D50 amended, Portfolio.md
P23 amended. Version 3's standing, bouncing, leaving, settle and dive are unchanged. What changed is where each agent
lands and how its boxes come in.

- **It lands on the centre of the boxes it opens.** This is the middle of the rectangle round all of them
  (`introCast`). Where that rectangle is an odd number of cells across, the middle is a cell. Where it is even, the
  middle is half way between two cells, so the nest can stand on the gutter. On the portfolio, Zaza lands on the middle
  of its three rows (the links, the facts, the socials). Kino lands half way down the projects and its statement. Bali
  lands on the middle of the profile and the note together. An agent that opens no box sits where version 3 put it:
  on a phone that is Kino, Mira and Lola, each over its own tab.
- **Its ripple crosses its boxes.** As it touches down, the cells light ring by ring out from the nest's edge, counted
  as before. Every cell of the boxes it opens lights, plus `ripple` rings past their edges. An agent that opens no box
  still makes a small ripple, `ripple` rings round its nest (`introRipple`).
- **The boxes come in with the ripple.** A box no longer opens from its top-left corner. Each of its cells shows
  `behind` after the ripple lights it, so the violet front runs a ring ahead of the page. A cell first shows its disc,
  half a pitch round its centre, so two discs touch in the middle of the gutter. `lace` later it shows its whole tile.
  This is Grid.md D40's lace, the reveal his first intro had (`introPlan`, `introShown`, `introClip`). Each box is
  clipped to a path of the discs and tiles that are in. The path is written only when another cell comes in, so it
  changes in the ripple's steps, not every frame. A further box of the same agent comes in when the ripple reaches it,
  so `cascade` is gone. His loader's opening (M10) no longer plays in the intro, and neither do the boxes' lime lines.
- **The nest stays over the box** until its agent has dived into it, and then goes over another `dive`
  (`introNestLeft`).

| Token | Version 4 | What |
|---|---|---|
| `--motion-intro-gather` | 2000ms | how long they bounce before the first may leave (his "two seconds") |
| `--motion-intro-first` | 500ms | the latest an agent's first bounce starts |
| `--motion-intro-rest` | 700ms | the longest an agent's pace waits between one bounce at rest and the next |
| `--motion-intro-leave` | 300ms | the window after `gather` in which each leaves |
| `--motion-intro-ripple` | 1 | how many rings a ripple goes past the boxes it opens (round its nest, for one that opens none) |
| `--motion-intro-ring` | 80ms | from one ring of a ripple lighting to the next |
| `--motion-intro-behind` | 80ms | from a box's cell lighting to it starting to come in: the front's lead on the page |
| `--motion-intro-lace` | 90ms | from a cell's disc to its whole tile (D40's `LACE_MS`) |
| `--motion-intro-settle` | 250ms | landed, before it dives into its nest |
| `--motion-intro-dive` | 320ms | that dive; the nest goes over as long again |

None is in globals.css: `INTRO_START` holds them. `--motion-intro-cascade` is gone, and `ripple` now counts from the
boxes' edges, not from the nest.

*Measured* (`e2e/.mcp/agent-intro-v4.mjs`, local dev server, 2026-10-01, one load each):
- **1440 × 900, dark:** every nest stands on the centre of the boxes its agent opens. Bali's is at 210,282, the
  middle of the profile and the note. The six landed between 2.41 and 2.64s. Their boxes were in by about 3.0s, and
  the page was handed over between 3.45 and 3.8s. Version 3 handed over at about 4.5s: its loader's opening was the
  long part.
- **Pixel 7, light:** Bali lands on the profile row's middle and Zaza on its three rows'. Oru lands on the centre of
  the sections panel. Kino, Mira and Lola land on their tabs. The ripple of the sections panel spreads one ring past
  it, across the empty rows under it.
- No errors on either.

*Mine, his to tune:* every number but the two seconds. Also mine: the centre of the rectangle round all an agent's
boxes, rather than the centre of each box or of its biggest; one ring of spill past them; the page a ring behind the
front; bringing D40's disc-then-tile back for the cells; the dive still `settle` after landing, so an agent can go
before its last box is in; and the guests' seats on a phone.

*Open:*
1. Text that is half in shows as fragments between the discs, as D40's wash did. The lace is 90ms, so this lasts only
   a moment. If it reads as broken, the reveal could be a circle growing smoothly with the front instead of cell by cell.
2. A nest that stands on the gutter sits over the corners of four cells, which the ripple lights round it.
3. Version 3's open points 2 and 3 still stand (the action values are a copy; the intro is not on the bench).

### Version 5 — the row (2026-10-01)

*"Uh, now I want to make some small changes uh, instead of placing this agent's uh, randomly let's place them in uh,
row in a line uh, without any gaps in between them uh, their order will be random and also not all the agents will
bounce um, let's only make uh, Bali Kino and uh, Mira to bounce."* Grid.md D50 amended, Portfolio.md P23 amended.
Version 4 is unchanged except for how the six stand and who bounces.

- **They stand in a row.** Each agent takes one cell, side by side, with no empty cell between them. The field's gutter
  is still there, as it is between any two cells. The row is centred across the field. Six cells on a field of even
  width are symmetric about its centre (D26). It goes on the field's middle row, the upper of the two, because a
  field's rows are even. If an agent lands in that row, it goes on the nearest row where none does (`introSpots`). On a
  Pixel 7 that is the row under the tabs bar, where Kino, Mira and Lola land. Who stands in which cell is random on
  every load. Version 3's ordering by least travel is gone, so two can cross on the way to their boxes.
- **Only Bali, Kino and Mira bounce.** The page decides which agents bounce, with `bounces` on an `IntroAgent`; an agent
  bounces unless the page says otherwise. The portfolio sets it in `content/intro.ts`, apart from the snapshot
  `agents.ts`. Zaza, Oru and Lola sit in their nests, breathing and blinking, until they leave. The bouncers keep
  version 3's random pace.

No token changed.

*Measured* (`e2e/.mcp/agent-intro-v5.mjs`, `e2e/.mcp/intro-bounces.mjs`, local dev server, 2026-10-01):
- **1440 × 900:** the six stood in columns 7 to 12 of 18 on row 6 of 12, in a different order each load. Over the first
  1.95s, Bali, Kino and Mira rose about 60px off their nests. Zaza, Oru and Lola moved 1px at most, which is their
  breathing. Two loads gave the same result.
- **Pixel 7:** all six columns on row 7, one under the tabs bar.
- No errors.

*Mine, his to tune:* the upper middle row; moving off a row that an agent lands in.

### Version 6 — cells and rest (2026-10-01)

*"those who are not bouncing should uh, be in the rest motion. And I also saw that uh, after bouncing, they just
randomly appear over uh, some cell which is not part of the grid. And then they drop into it. They should actually drop
into the cells on the grid. I don't know why you are creating new cells."* Grid.md D50 amended. Version 5 is unchanged
except for these two things.

- **Every nest is a cell of the field.** Version 4 stood a nest half way between two cells wherever the boxes' middle
  fell between them. That was the "cell which is not part of the grid", and a Dive came up out of it. The nest is now
  the cell at the middle. Where the middle falls between cells, it is the first of the two or four cells round it, in
  reading order, that is in one of the agent's boxes (`introCast`). At 1440 × 900, Bali now lands on (2, 3) of the
  profile, where it stood at (2.5, 3.5).
- **Each is seen resting.** The rest is the agent's own: Breath 4s at depth 0.1, a blink every 3.6s (`SPHERE_START`;
  Orbit plays the same). It was already playing, but every clock started at 0. In the two seconds they stand, each was
  only half a breath in, and the first blinks fell after they had left, so the three that do not bounce looked frozen.
  Now each agent's rest plays as if it had already sat for one to two Blink every (or Breath, the longer), picked at
  random (`since` on its part). Its breath is at its own phase and its next blink at its own moment. A bouncer's rest
  between bounces runs on the same clock.

No token changed. *Measured* (`e2e/.mcp/agent-intro-v5.mjs`, `e2e/.mcp/intro-rest.mjs`, 2026-10-01):
- Every nest at 1440 × 900 and on a Pixel 7 is a whole cell.
- Over the two seconds in the row, in three loads, an agent blinked about half the time: one load four of the six,
  one load one, one load none.
- A breath widens the round agents by 1 to 3px and the boxy ones by almost nothing, at his Breath depth of 0.1.
- No errors.

*Mine, his to tune:* which of the cells round the middle; one to two blinks' worth of sitting. If the rest still reads
as too still, the agent's own Breath depth is the control to move, and it moves the rest everywhere.

### Version 7 — the small ripple, then the page (2026-10-01)

*"I see some uncomfortable problems uh, during the intro and uh, portfolio loading. Is that when the agents jump and uh,
reach to their sections, the ripple is now more stuttering it's not smooth and then also it stops at the borders of
the section and which is weird so i don't think we need such big uh, ripples i think we can just have small ripples and
uh, once the ripple ends we can drop the agents and then render the components."* Grid.md D50 amended, Portfolio.md
P23 amended. Version 6 is unchanged (the row, Bali, Kino and Mira bouncing, the rest, landing on the cell at the centre
of its boxes) except for what follows the landing.

- **The ripple is small again**: version 3's. As each agent touches down, the cells round its nest light ring by ring,
  two rings out, 80ms apart (`introRipple`, which no longer takes the boxes). Whatever the boxes round it, it never
  crosses them or stops at their edges.
- **Once it has spread, the agent drops.** 250ms after its last ring lights, it dives into its nest (`settle` now
  counts from the ripple's last ring, not from the landing).
- **Its nest goes back to a plain cell as it dives** (his, the same evening: *"while diving … I think the cell border
  should also turn to its default state while the agent is diving"*). The nest's lime ring and tint fade over the dive
  (`introNestLeft`), so the cell is the field's own by the time the agent is gone. The ripple's violet cells have faded
  by then too: the last ring lights 80ms after the landing and fades over 500ms.
- **Then its components render.** Once it is gone, every box it opens fades in over 500ms, version 1's "the card
  should render smoothly" (`reveal`). Each box is one Web
  Animations fade of its opacity, started once. The compositor plays it, so a busy main thread cannot make it stutter.
  Version 4's reveal was what stuttered: it re-cut each box's `clip-path` cell by cell, a ring at a time, on the main
  thread. It went, with `behind`, `lace`, `introShown` and `introClip`.

| Token | Version 7 | What |
|---|---|---|
| `--motion-intro-gather` | 2000ms | how long they stand before the first may leave (his "two seconds") |
| `--motion-intro-first` | 500ms | the latest a bouncer's first bounce starts |
| `--motion-intro-rest` | 700ms | the longest a bouncer's pace waits between one bounce at rest and the next |
| `--motion-intro-leave` | 300ms | the window after `gather` in which each leaves |
| `--motion-intro-ripple` | 2 | how many rings out from its nest a ripple goes |
| `--motion-intro-ring` | 80ms | from one ring of a ripple lighting to the next |
| `--motion-intro-settle` | 250ms | from its ripple's last ring to its dive |
| `--motion-intro-dive` | 320ms | the dive into its nest, its nest going back to a plain cell over it |
| `--motion-intro-reveal` | 500ms | its boxes fading in once it has dived |

None is in globals.css: `INTRO_START` holds them.

*Measured* (`e2e/.mcp/agent-intro-v5.mjs`, `e2e/.mcp/intro-fps.mjs`, local dev server, 1440 × 900, 2026-10-01):
- Each ripple is the two rings round its nest.
- Bali landed at 2.70s and dived at about 3.03s, and its profile was in at about 3.85s. The page was handed over at
  about 3.9s.
- **Frame rate:** at full speed, 60fps all through. With the wake still on (Portfolio.md P16), one frame after the
  landings took 35ms. With the wake gone, the worst frame after the landings took 21.7ms, and none over 20ms came while
  they leaped and landed. With the CPU slowed four times it ran at 27 to 38fps, as
  version 3 did.
- No errors.

*Mine, his to tune:* the 250ms, the 500ms fade, and all of an agent's boxes fading at once. The portfolio's wake after
the intro is gone too (Portfolio.md P16 withdrawn, his), so the boxes are in their own colours as soon as they are in.

### Version 8 — home (2026-10-01)

*"after the intro scene, once the agents jump into their sections and dive, they all should uh, come and settle in the
last row middle six columns cells"*, and before that was built: *"instead of uh, bringing them to the bottom, we'll
bring them to the right the last most column vertically centered."* Grid.md D50 amended, Portfolio.md P23 amended.
Version 7 is unchanged up to the ripple. What changes is where each agent goes after it.

- **Each has a cell of its own** (`introHome`). The cast stands one above the other in the field's last column,
  centred down it, in the cast's order: Bali at the top, then Kino, Zaza, Oru and Mira, and Lola at the bottom. On a
  field twelve rows deep that is rows four to nine.
- **It gets there by his Dive** (M24, as `content/actions.ts` copies it). It dives out of its nest behind the page,
  going the way it is headed, and comes up in its cell, carrying on into the bowl. Version 7's own sink went with its
  token, `--motion-intro-dive`: the Dive's length is his controls'.
- **It dives once its ripple has spread and its landing has come to rest**, whichever is later, because a Dive sets
  off from the agent sitting in its nest. With his Jump's 500ms come-back, a jumper now goes about 170ms later than in
  version 7.
- **Its nest goes as it dives into it** (`introNestLeft`, version 7's rule), over the Dive's way out of it. The cell it
  comes up in lights while it is under, as his Dive lights it, and stays lit under it.
- **Its boxes fade in once it is gone** behind the page (`IntroPart.gone`, the Dive's own `gone`).
- **It stays.** Once every box is in and every agent at rest, the grid hands the page over as before, and the agents
  go on breathing and blinking in their cells. On a field the grid is given after that, they are in its last column at
  once (`introResting`). Under reduced motion there is no intro and they are drawn once, still, each half way between
  two blinks.

| Token | Version 8 | What |
|---|---|---|
| `--motion-intro-settle` | 250ms | from its ripple's last ring to its Dive home |
| `--motion-intro-dive` | gone | his Dive's controls decide how long the dive takes |

The rest are version 7's.

*Measured* (`e2e/.mcp/agent-intro-v8.mjs`, `e2e/.mcp/intro-settled.mjs`, local dev server, 2026-10-01):
- At 1440 × 900 the six landed between 2.45s and 2.68s. The first boxes were in by 3.45s. The page was handed over at
  about 4.66s, about 0.8s later than version 7, because the Dive home is longer than the sink was.
- At every size all six stayed after the hand-over, each in its cell (1440 × 900: column 18, rows 4 to 9).
- After a resize they rested in the new field's last column. During the intro, a resize handed over and they rested
  on the new field.
- No errors.

*Mine, his to tune:* the cast's order down the column. Also open: what keeps the column free where boxes stand in it
(Portfolio.md P23 has the table).

## M23 — Agents: a motion is every agent's, and what is motion and what is character (2026-10-01)

*His, 2026-10-01:* "Currently review uh, motion in that we have agent and agent motion I think they are just duplicates
we can delete the agent and uh, we can also rename agents motion as agents and uh, there we are only dealing with motion
of an agent. So I want you to categorize what is related to motion and what is related to designing the character its
body etc." Then, of the list: *"motion is something that we can apply on any agent … every agent have the same parts …
if the motion contains something like … eyebrows and uh, Bali doesn't have eyebrows … only if the eyebrows are there
then the motion will work if not uh, the motion will not work but if the motion contains some other configuration for
the body since Bali has body the motion for the body will work … you can just give me a drop down to preview different
agents it's not that I'm defining motion for a specific agent."* And: *"I don't really need anything right now from
motion uh, right now the goal is to uh, full-fledgedly build these studios both motion studio and orbit studio."*

**Every setting of the agent is in one of four groups** (his word for the list was "groups"; the package declares them,
`set` and `pose` in `@no-origins/ui/lib/agent-body` and `agent-face`):

| Group | What it is | Where it is designed | Declared |
|---|---|---|---|
| **1. Character** | What the agent is. No motion changes it. | Orbit | `set: "look"` |
| **2. Pose** | How it holds itself at rest. A motion's row may move it for a while: that is how a mood is made. | Orbit, at rest; a motion's rows | `set: "look"`, `pose: true` |
| **3. How it moves** | How every agent jumps, lands, slides, breathes and blinks: the same for all, under every motion. | The declaration's defaults (his version 15, `SPHERE_START`); a motion's rows | `set: "motion"` |
| **4. What one motion does** | Where it hops, where it looks, the symbol it pops up. | A motion's rows | `set: "motion"` |

- **1:** Shape, Paint, Material (`body`), Size, Shade; Texture with its Size, Wobble, Colour and Opacity, and Depth; the
  tail's Length and Taper; the style each face slot wears and the uploaded drawings; Eye spacing, Eye height and Eye
  colour; the brows' Length, Thickness and Colour; the catchlight's Size and Angle.
- **2:** Rotation X, Y and Z; Spread; Eye size and Pupil size; the upper lids' Open, Slant and Curve; the lower lids'
  Raise, Slant and Curve; the brows' Height, Angle and Arch.
- **3:** Crouch, Squat, Height, Hang; Bounces, First bounce, Bounciness, Squash, Wobble, Wobble speed, Nest give; Land
  at, Slippery, Way, Energy, Come back, Sway, Squeeze; the tail's Stiffness, Swing and Stretch; Look ahead, Look lead,
  Blink every, Blink, Squint; Breath and Breath depth.
- **4:** Columns and Rows (a hop); Look X and Look Y; the Symbol, its Size, At and Colour.

Groups 3 and 4 are both `set: "motion"`: 3 has a base worth having (his version 15's), 4 only means something in a row.
Nothing in code tells them apart yet, and nothing needs to.

**The Agents page** is what the motion studio had of the agent then (since M24, the same day, it is the agents' actions,
each with its own controls; its motions, rows and Hop went):

- **The Agent page is deleted** (the family `sphere`): its jigs of every setting, its version-15 preset, its Copy and
  its play of the jump, the hold and the jump back. That play is the Hop motion; a click on a cell still sends the agent
  there, on the Agents stage. The settings it alone edited went to their groups' places: Material and the tail to Orbit
  (C22), the rest to the declaration.
- **Agent motions is renamed Agents** and keeps its id, `motions`, as the agent kept `sphere`.
- **A motion is every agent's.** The parts are the same on every agent — Body, Eyes, Pupils, Upper lids, Lower lids,
  Brows and Symbols. A row for a part the agent does not wear draws nothing on it, and the motion's other rows play. A
  row never puts a part on: which a character wears is group 1. Symbols are played, so a motion pops one up on any
  agent.
- **The head's Agent select previews one of them** where the preset select stands: the agent as Orbit has it, its
  draft, drawn with its uploads. It changes who is watched, never whose the motion is. It opens on Bali and remembers
  the last one picked. With no database it has the one agent the code declares, "Default".
- **A row offers groups 2, 3 and 4 of its part.** A value of group 1 left on a row saved before is not played.
- **Under every motion** stands the previewed agent's look (groups 1 and 2) and the declaration's defaults for the rest.
  There is no page to tune group 3 any more: a motion's row sets what it changes, and a default changes in code,
  version by version, as `SPHERE_START` always has. A page for it waits until he asks for one.
- **Each agent's own hop and breath go** (Agents.md A2's "Rest and hop"): a character holds groups 1 and 2 only
  (`resolveCharacter`, `checkCharacter`), so a value of 3 or 4 in a draft or a frozen version is not read. Nothing is
  deleted. The portfolio's intro (M22) leaps and breathes its six by the shared values. An agent still moves as its
  Material makes it: a ball lands firmer and slime oozes, whatever the motion.
- **Kept as it was, for now:** a motion is still a `studio_items` row of kind `motion` with Bali's `character_id`,
  which the schema requires (`…_studio_versions.sql`). The studio reads every motion whatever it names. Making the
  column empty for a motion is a migration, for the next time the schema changes.

## M24 — Actions: the agent does named things, each with its own controls (2026-10-01)

*His, 2026-10-01, having asked whether keyframes were what the studio lacked to make a bounce:* "instead of just
trying to control every aspect uh, maybe we can have something like the actions that the agent does I mean which will
become part of the code uh, if I say something like uh, we need jump action or like bounce action um, maybe you can
just uh, give me controls for uh, how high it will bounce uh, how much time will it bounce uh, what should happen once
it bounces and lands." *Then:* "we will remove everything uh, currently the agents have in motions and uh, probably I
might say something like uh, okay now I need more bounce action so now you add bounce action you add uh, the controls
that are needed uh, for bounce and uh, time frame and now I can adjust the bounce play it … once I like it I should be
able to publish it … every card on the grid or like every jig uh, becomes a configuration for an action … later we can
create something where uh, I can put in sequence of actions … use the same concept that we have for timeline right now
where we put in rows." *Asked four things, he answered:* the saved motions are **deleted**; an action's **length
follows from its controls**, the whole of it on one timeline; **the rest state is always there**; and **one Agents
page with a picker**.

**Built the same day** (his *"Okay. Proceed"*), with Bounce as the first action: below, after the rules. It replaces
M19's and M20's rows on the agent and M23's Agents page as it stood. No other bench is touched.

**Why not keyframes.** The rows were keyframes in all but name: a row moves a part from where it stands to its values
by its span's end, so two rows back to back are three keys. A bounce still could not be made, because nothing on the
body is a value a key can move. Its height and its squash are the hop's physics, worked out from Height, Squash and
Bounciness, and a hop of no cells is skipped. Keys on new channels (a lift, a squash) were drawn up and set aside: he
would place every frame by hand, the agents would stop moving as one body, and nothing would come of it that the
harness could name.

- **An action is code, and only what he names.** It has the name he gives it and is written in the package beside the
  agent's drawing, its frames worked out from its controls by the physics the agent already has (`sphere-motion`).
  Nothing exists until he names it, so a new kind of move is a new action written in code, which he then tunes in the
  studio. Bounce was his example; which comes first is his.
- **Its controls are its own.** Each is a typed property (M20, `lib/properties`), and the action's groups are the cards
  on the grid round the stage. For a bounce: how high, how many times, how it lands, what it does once landed. M23's
  groups 3 and 4 stop being settings shared under every motion: each control moves into the action it belongs to. The
  character's look (groups 1 and 2) stays Orbit's, and its Material still shapes every action: a ball lands firmer and
  slime oozes, whatever the action.
- **Its length follows from its controls** (his answer). There is no length to set. The page has one timeline for the
  whole action, its phases marked on it in order, each as long as its controls make it, growing and shrinking as they
  are moved. For a bounce the phases are the crouch, the rise, each bounce, the landing and what follows. The timeline
  is played and scrubbed, never dragged: to make an action longer, change what makes it long.
- **The rest state is always there** (his answer): the breath, the blinks and the pose the character holds. An action
  sets off from rest and hands back to it. Rest is not an action and needs no naming. Its values stay the declaration's
  (`SPHERE_START`).
- **One Agents page, with a picker** (his answer). The head holds two selects: the action being designed, and the agent
  it is previewed on (M23's, unchanged: it changes who is watched, never whose the action is).
- **An action is published as a character is** (M20, Orbit.md C19): a draft saves as he goes, and Publish makes the
  next `major.minor`, frozen; a new major is his to make. An action is every agent's, as a motion was (M23).
- **Later, the sequencer**, designed when he asks for it. Published actions are placed on rows, M19's concept kept: each
  a block at its own length (his model in M20, motions "placed in motions at their own length"), rows overlapping,
  the higher winning where two set the same thing, the whole sequence on one timeline.

**What went:**

- **Every saved motion is deleted** (his answer): the `studio_items` of kind `motion` never published, and their drafts
  (`…_studio_actions.sql`). On the local stack that was one, Bounce, a draft with no versions. A motion with a published
  version stays: `studio_versions_frozen` refuses its deletion (M20, "never deleted"), and lifting that for a kind that
  goes would be a migration of its own. The hosted project is checked when the migration is pushed.
- **The Hop motion** (`HOP`, version 1's), the tabs, the rows, the lanes and the timeline editor on the Agents page
  (`states.tsx`, `machine.tsx`, the app's `lib/states.ts`, `content/agent-motions.ts`), the server functions that kept
  motions, and **a click on a cell sending the agent there**: moving to a cell is a jump's, when he names one.

**What stays:**

- **`sphere-motion`'s physics.** Bounce is made from it, and Jump will be. The hop's Columns and Rows become a jump's,
  if he names one.
- **`lib/properties`, and versions.**
- **The timeline's model** (`lib/motion-states`), in the package and unplugged until the sequencer, as the statechart
  was kept (M12).
- **The portfolio's intro** (M22). It leaps and breathes its six by the package's values, not by a saved motion.

**Built, 2026-10-01:**

- **`@no-origins/ui/lib/agent-actions`** declares the actions: each its id, name, version, groups of typed properties
  (the agent's own motion settings with the action's labels and defaults, so `sphereMotionFrom` reads them), its
  course from the nest it sits in, and its phases. `checkActionValues` holds its values whole, as a look is held.
- **Bounce, version 1**: it crouches, leaps straight up out of its nest, falls back into the same nest, bounces off its
  floor, each bounce lower than the last, and settles; landing off the bottom (Land at) it slides round the bowl and
  comes back. Six groups: **Take-off** (Crouch 140ms, Squat 0.3), **Leap** (Height 1 cell, Air time 560ms), **Bounces**
  (Bounces 3, First bounce 0.6, Bounciness 0.55, Squash 0.35, Nest give 0.12), **After landing** (Wobble 280ms, Wobble
  speed 200ms, Land at 0°, Slippery, Way, Energy, Come back, Sway, Squeeze), **Tail** (Stiffness, Swing, Stretch at his
  0) and **Eyes** (Look ahead 0.8, Squint 0.6). Its Material scales them: on slime, which Bali is, a bounce is about a
  third of jelly's, so First bounce starts at 0.6 to be seen there. Its phases are **crouch · rise · fall · bounce 1…n
  · come back · settle**, from the physics' own beats (`sphereBeats`), a part shorter than 40ms folded into the next.
- **The physics, for a jump in place** (`sphereCourse` with the same nest at both ends): no drawing back in the crouch,
  one nest lit throughout, and its landings dipping that nest. And **the bowl is hit only in its lower half**: its top
  was a ceiling, so a bounce higher than the bowl is deep was cut off a few pixels up (Bali's head leaves its centre
  5px of room). A jump's landing bounces as high as its controls say now too; version 15's has no bounces, so no hop,
  and not the intro, moves differently.
- **The Agents page**: the head is the studio's bar, Agents, **the action** (a select of the actions there are) and
  **the agent** previewed (M23's), Reset and Copy; under sixteen cells across the bar takes three cells, and on a
  narrow field the two picks take a row of their own. Each action is a family of its own in the studio
  (`action-<id>`), so its values are kept apart from every other's, and the one picked is remembered in the browser.
  Its jigs are **its card** (what it is, the version pages play and whether the draft has moved since, how it is kept,
  **Publish** for the next minor and **Versions**, where it goes back to one or publishes the next major) and a card a
  group. Its timeline is its phases, scrubbed and played, never dragged. **Live**, a click on the stage plays it from
  where the agent sits; on the timeline it plays from the centre. **No rest on the timeline** (his, the same evening:
  *"I don't want to include uh, milliseconds, like uh, resting phase in bounds, like bounds will only deal with
  bouncing"*): the 700ms rest every other stage puts after a play on a loop is not put after an action's, so a loop
  goes again as soon as it has settled. The rest is still always there, between plays.
- **Its draft is in the database** (`apps/motion/src/app/actions.ts`): an item of kind `action` named as in code,
  its draft `{ action, values }`, made the first time its bench opens, saved half a second after the jigs stand still
  on the `rev` it was loaded at (another device's save first stops the saving: **Load**), and published through
  `studio_publish` a minor or a major. With no keys, or signed out, its values are the browser's.
- **Checked** against the local stack: a click bounces the agent a cell; Publish made 1.0 and then had nothing new to
  publish; a change read "changed since" and saved; Versions published 2.0 and went back to 1.0 with its values; a
  reload found it so. The two test versions were removed afterwards with the frozen trigger disabled for them alone,
  as supabase/README.md records. `e2e/agents.spec.ts` plays Bounce on the agent previewed and **writes his draft
  never**: there is one draft an action, and he may be tuning it as it runs (he was, the afternoon it was built). It
  edits, reloads and resets only where the values are the browser's.

**Jump and Dive, the next two** (his, the same evening): *"Next, I want to have motion for uh, diving. and jumping two
separate motions in agents uh, basically jumping is jumping over the cells from one cell to another diving is diving
behind from behind the screen from one cell to another."* Both version 1, both **travel**: their **Where** (Columns,
Rows) says where they go on the timeline, from the nest that centres the path on the stage (`sphereJump`), and live a
click on a cell sends the agent there, where it stays (Bounce plays where it sits).

- **An action plays** (`play`, replacing a bare course): from a trip, it gives where the agent ends up, how long it
  is, its phases, and any moment of it — the agent's frame, how far it has sunk into the page, the nest whose bowl it is
  cut to, and whether it is gone behind the page. `actionStill` is the agent sitting, the rest between plays. The
  bowl's path is the package's (`sphereBowl`), the one the `Agent` cuts a resting shape to.
- **Jump** is the agent's hop, nest to nest: crouch, an arc over the cells, the landing in the nest it reaches —
  bounces, the slide round the bowl and back — and the settle. **Its defaults are his version 15's** (`SPHERE_START`),
  the hop he tuned on the Agent page, going three cells across. Groups: Where, Take-off, Leap, Landing, After landing,
  Tail, Eyes (with Look lead, the eyes turning to the next nest before it leaps). Phases: crouch · rise · fall · …the
  landing's, no settle.
- **Dive** goes into its nest, behind the page and on into another. **Version 1** was the portfolio intro's grammar
  (M22): a spring, straight down through its floor cut to its bowl, under the page, and a pop straight up out of the
  next nest. **Version 2** (his, the same evening: *"dive is always uh, like falling down even if the direction that it
  is supposed to go is up so I think instead of falling down It should exit in the direction that it's supposed to go"*,
  and *"when it's popping from whatever that the direction it is coming from it is still popping up instead it should
  just go and uh, follow inertia"*): the nest is **the page's opening**. After its spring (Spring; 0, it slips straight
  in) it goes out of its nest behind the page **the way it is going**, cut to the nest's circle — through its top to a
  nest above, its side to one beside, its floor to one below — until it is gone; it is **under** for Under, its nest
  going out and the next lighting; it glides into the next nest behind the page the same way, on the line through its
  middle, and then **carries on** in front of the page: coming up from under, it flies up out of the nest and falls
  back in; from the side, it arcs into the bowl and slides up the far side and back; from above, it drops onto the
  floor (`sphereArrival`, a leap's landing started in the air, `bowlSim`). **Pop** is how fast it comes in: the height
  a fall that fast is from, so coming up it pops that high. **One gravity for all of it**: slipping straight down out
  of its nest from rest takes Dive, so the spring, the going out and the coming in take as long as their distances make
  them. A dive back into its own nest goes out through the floor and comes back up. The four are motion settings of
  the agent (`agent-body`'s Dive group, read by `sphereMotionFrom`): Spring 0.4 cells, Dive 320ms (the intro's), Under
  400ms, Pop 0.6 cells. Its Landing and After landing (Slippery, Way, Energy, Come back, Sway, Squeeze) are a jump's.
  Phases: crouch · spring · dive · under · come in · carry · …the landing's, no settle.
- **His answers on it** (the same evening): **Under is one length however far the dive goes** (*"we don't need uh, it
  to stay longer if the dive is longer"*), and **nothing lights along the way** (*"we also don't need to add any
  lighting up"*).
- **No settle on Jump and Dive** (his, the same evening: *"I don't think we need settle in this uh, for dive and
  jump"*): each is over once the agent has come to rest in the nest it reached, its last phase the landing's slide or
  bounce. What is left of its jiggle dies out in the rest after, never cut. Bounce keeps its settle.
- **Checked** on the stage: Jump goes three cells across and a cell up, lands and slides. Dive version 2, at his tuning
  (Spring 0, Dive 80ms, Under 50ms, Pop 0) slowed ten times and sent up, left and down by a click: up, it leaves through
  its nest's top and comes in from the next one's floor, flying up out of it; left, out of its side and in from the next
  one's right, arcing into the bowl; down, out of its floor and in from the top. `e2e/agents.spec.ts` checks each ends in the nest its Where reaches and that the dive is
  gone while under, reading their values and setting none.

**Open:**

1. **Look X, Look Y and the symbols** (group 4) were only ever set on a row. With the rows gone, they wait to be named
   as actions (a look, a symbol popping up) or for the sequencer.
2. **Whether the harness calls an action by its name.** The lifecycle stays on the BEAM and the browser presents it
   (Brand.md §8). An action's name would be the first word the two share. Not decided.
3. **How many times.** A bounce plays once, its bounces off the floor dying away; the timeline's Loop repeats the
   play. A count of leaps, each as high as the first, is not a control yet.
4. **The hosted project** has neither the kind nor the deletion until the migration is pushed, his step.
5. **A reload in the half second after a change** loses that change: the draft saves once the jigs stand still, as
   M20's did.
6. **Going out from no spring**, the crouch's squash springs back to its sitting shape as it starts to go; and going out
   sideways it keeps the shape it sits in. Coming in, it is round.

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

**M12 amendment — fixed character dimensions, 2026-09-28.** His: “the eyes should be circular” and “always be the height of the cells and 2 cells width.” The body is one measured cell high and spans two cells including their gutter; its dimensions never scale during playback. Its resting placement follows cell boundaries. Size, width, height, openness and elasticity jigs are removed. Eyes are SVG circles, with independent Eye size jigs under Left eye and Right eye; gaze and circular blinking never distort their shape. The specimen reports its fixed 2 × 1 size.

**M12 amendment — the agent is a statechart, 2026-09-29.** His, on the bench built the day before: *"I did not like
what it did. I want better controls and better state machines."* Five mechanisms were drawn up for him to compare
(Agent-motion.md, round 1: a statechart, inputs and layers, clips on a dope sheet, springs, layered axes), and he
picked the first: *"Let's go with A."* The one-gesture tween (delay, start pose to end pose, hold, back), its 33 tokens
and its presets are replaced.

- **Three regions run at once, each on its own clock:** Body (what the pill does), Gaze (where the eyes look) and Lids
  (how open they are, and the blinks). A blink can fall in any gesture and a glance never restarts the body.
- **States are his.** What ships is one blank state a region — `rest`, `ahead`, `open` — and nothing else: no
  suggested names, personalities or moods. A Body state may hold children one level deep, and a transition may return
  to the child last active (history).
- **Events are the page's and the harness's**, a fixed catalogue (the load, the wake reaching the agent, a card
  focused or blurred, a mode changed, the theme flip, the page hidden or shown; the harness idle, working, waiting,
  succeeded, failed, unreachable), plus the machine's own: a state's clip done, a Body state entered, and `after`
  timers. He chooses which to wire. The harness's status is also held as a level a transition can test, so a page that
  opens mid-work shows it working. The browser only presents it: the lifecycle stays on the BEAM.
- **Each transition says how it interrupts:** cut, blend over its ms, or spring — the body carries its speed through
  and curves on — and whether it lets the current gesture finish first. A lag on a Body transition lets the eyes lead.
- **A play is a take.** Events he fires live are recorded and compiled, on a simulated clock with seeded blinks, into
  a trace, so any t on the timeline paints the same frame as playback (M6). Only the gaps between his events are
  dragged there; a timer's length and a clip's are motion, set in the jigs. With no take, Play steps into the state he
  has selected and lets his wiring take it from there.
- **The motion is authored on the stage.** The pill's keys and the eyes' looks are set by dragging them on the drawn
  specimen, an exception built in the app like the phase grip (§5 item 13), which the pick carries.

Four choices were his and went unanswered, so these are mine and his to overrule: he drags on the stage (above); how
a transition interrupts is his choice per transition, blend by default; idle blinks run on a seeded, jittered schedule
he sets per Lids state, off (none a minute) until he sets one, and a Body state can also blink as it enters; and the
chart — structure and numbers together — is data, copied from Settings and committed as `AGENT_CHART` in the package's
`lib/agent-chart.ts` when he picks, not `--motion-agent-*` custom properties. States and keys named by him do not map
onto stable CSS names, and a rename would orphan them. That bends M3 for this one family, and is flagged for him.

**M12 amendment — the eyes have lids, 2026-09-29.** His, the same night: *"Currently eyes are blinking by just scaling
down. I need the effect of having eye lids."* An eye is now always a whole circle of its face's size, and an upper and a
lower lid in the body's colour close over it: the circle is clipped to what the lids leave open (`eyeAperture`), so a
blink is the lids meeting, and a narrowed or sleepy eye is lids part way down, never a smaller eye. The 2026-09-28
amendment's "circular blinking shrinks the radius" is replaced; its "never stretches an eye" still holds. A Lids
state's `open` is now how open its lids are, 0 shut to 1 wide, and it has a lid shape that moves with it over its
settle: **Lower lid** (how much of the closing the lower lid does — 0 the upper comes all the way down, 1 the lower
comes up), **Lid curve** (the edges' bow: positive sags like a lid over a round eye, negative arches, a smile's squint)
and **Lid tilt** (the lids slanted, mirrored: positive and the outer corners go down, negative a stern look). The
numbers a blank Lids state starts with — lower 0, curve 0.35, tilt 0 — are mine.

**M12 amendment — version 1, the agent's own controls, 2026-09-30.** His, on the statechart bench: *"none of the
controls related to the agent in the motion studio is intuitive nor understandable … I'm imagining the size of the
agent, the eyes, the lids, the movement of the eyes, the movement of the body, and I need the movement in multiple
directions, XYZ."* And of how the work goes from here: *"I don't want the jigs to give me presets. But instead … you
give me phase one, I will try on that and based on that I will give you the feedback, and then you can create version
two … once we hit what we need, from there … I can improve it and then update the settings for you."*

- **The bench is his five groups, in his order, and nothing else**: **Size** (width and height in cells), **Eyes**
  (size, spacing, height on the face), **Lids** (open, lower lid, curve, tilt, and the blinks: how often, how long),
  **Eye movement** (look X and Y, their time and ease, and how long before the body the eyes set off) and **Body
  movement** (move X, Y and Z in cells, turn about X, Y and Z in degrees, its time and ease). Up, right and toward you
  are positive everywhere. They are 24 ordinary `--motion-agent-*` tokens on the studio's own jigs, so M3 holds for the
  agent again: the chart-as-data of the amendment of 2026-09-29 is gone from the bench.
- **No presets, versions.** The family carries one start, its version's values, and the head says "Version 1" where
  another family's preset select stands (`version` on the family). Reset goes back to the version; Copy hands his
  tuning back as the settings block, headed with the version it started from. His settings are the next version's
  start. A family made this way from now on (his "from this time") is designed the same way.
- **The body is a capsule in 3D.** It moves in X, Y and Z, Z seen through a fixed perspective of twelve pitches, and
  turns about X (a nod), Y (a turn) and Z (a tilt). Its outline stays a pill, since a capsule is one from anywhere. The
  eyes ride its surface, so a turn carries them round and its edge cuts them as they go, and they fade as their side
  turns away. **They stay circles** (the amendment of 2026-09-28): only where they are is 3D. The lids are the lids of
  the amendment of 2026-09-29, rolling with the body's tilt.
- **What plays.** Live, it stands at the pose the controls set, blinking, its rest drawn dashed where it starts, so a
  move reads as from there to here. A play is the way there (the body and the eyes each on their own time and ease,
  whichever leads setting off first), the hold, and the way back, a rest after it on a loop. The blinks keep their
  clock through all of it.
- **The model is the package's**, `lib/agent-rig.ts` (`readAgentRig`, `agentRigFrame`, `agentRigAlong`, `agentBlink`),
  pure, falling back to version 1's values (`AGENT_RIG_START`); the studio draws it (`components/agent-rig.tsx`).
  None of its tokens is in globals.css. The statechart's model (`lib/agent-motion.ts`, `lib/agent-chart.ts`,
  `useAgentMotion`) and its bench (`agent-jigs.tsx`, `agent-stage.tsx`, `agent-store.tsx`, `lib/agent-edit.ts`) are
  unplugged, not deleted, until he says whether the page's and the harness's events come back to drive this body.

Version 1's numbers are mine, for him to react to: the pill he decided (two cells and their gap by one), eyes 30% of
its height and half its width apart, lids open with a 0.35 curve, a blink of 200ms every 4s, and a pose that shows each
kind of move once: two cells right and one up, turned 20° to the right, the eyes looking 15% of its height to the right
over 220ms on cubic out and setting off 150ms before the body's 700ms on cubic in-out.

**M12 amendment — the pill is deleted, and the sphere is the agent, 2026-09-30.** His, the same night: *"we'll remove
agent and the sphere will become the agent. And agent can have eyes."* Asked, he chose to delete the pill rather than
unplug it: its family (version 2, built from states, M19), its stage, its model (`lib/agent-rig.ts`), the statechart
unplugged beside it (`lib/agent-motion.ts`, `lib/agent-chart.ts`, `useAgentMotion`, `agent-jigs.tsx`, `agent-stage.tsx`,
`agent-store.tsx`, `lib/agent-edit.ts`) and their specs are gone; git keeps them, and this section keeps the record. His
personal guide is the sphere now, with eyes (M17, version 11). What the pill taught stands: circles for eyes, lids for a
blink, designed version by version.
