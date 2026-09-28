@AGENTS.md

# apps/motion — the motion studio

`motion.no-origins.com`. The lab where the design system's motion is designed: the real components, with every number
they move by on a jig. **Motion.md** (`packages/docs/system/`) is its document. Read M1–M8 before changing anything
here. His brief, 2026-09-27: *"something like story UI but I don't want to use story UI it's too heavy … I just want
to have that lab but still built with our own design system I need jigs."*

```bash
pnpm --filter motion dev                 # :3004 (portfolio :3000, design :3001, admin :3002, engineering :3003)
```

## The shape

One route, `/`, one `GridPages` that is the viewport. **Each motion on the bench is a page**, turned by the numbered
pager, and each page the turn puts on the field loads with the grid's loader, page 1 in the intro (Grid.md D48). **The bench holds only what he names** (Motion.md M9, his, 2026-09-27:
"I'll tell you what we will work on and then you can add them"). Today that is six motions. **Agent** (M12, page 4) is the personal guide character design bench: body, eyes and movement jigs, start/end poses, paths, independent eyes, circular blinks, timing and user-authored presets and the shared timeline. Its pure frame model is `@no-origins/ui/lib/agent-motion`; the studio draws its abstract pill-and-eyes specimen. Its settings copy as JSON, including the scene and block. **Movement** (M9) is how one-cell
elements move when one of them grows, for the work menu and the tech verticals. **Loading** (M10) is how a page loads:
one dashed lime cell per section turns at the centre, and each expands into its section when the page is ready. **Enter · exit** (M11, page 3) is movement's first primitive: one cell's element coming in and going out, its ring lighting and its dot floating up, then the dot drowning and the ring going out. **Focus** (M13, page 5, 2026-09-28) is a card in focus and the page blurring round it, least at the card and rising in rings out from it, coming in as a ripple and going by its way out: the portfolio's cards play it (Portfolio.md P18). **Focus mode** (M14, page 6, 2026-09-28) is one vertical at a time: a panel comes out of the page over it in 3D, a cloth of blur rolls out from the panel's edges over the rest, and the panel slides between the three verticals, picked from cells at the bottom centre. On the bench only; the portfolio does not have it yet. **On a field fourteen or more columns
wide, the centre columns are the stage** between a one-row header and a one-row timeline, and the jigs are slots
either side: the specimen (its block's Columns and Rows, every family's, then its own: the flow, or the page) and the
presets on the left, the tokens and the settings on the right (M5). **Each control lives with what it is about, the
same on every motion** (M6, his, 2026-09-27): how a play runs — Play, Loop, Tempo, and the phases that are settings
(the hold; loading's page time), dragged — is on the timeline; what plays is on the specimen's jig; the motion is the
tokens. A new family gets the timeline and the block for nothing: give it a `block` in families.ts, and a `drag` on any
phase of its play whose length is a setting.
Narrower, the stage comes first and the jigs follow on the pages after it. `src/lib/layout.ts` places them, on the
live field, as the showcase does.

**The stage is transparent** (his: "we have to see the grid and how these work on grids"), and a specimen stands on
the field's own cells. The stage starts on a cell, so place things a whole number of pitches (`cell + gap`) in from
its corner, and they are on the grid.

- `src/content/families.ts` — the motions on the bench: each one's tokens (name, unit, range, what it touches) and
  **five presets**. A family whose tokens are in globals.css starts from "Today", read off the page. One still being
  designed has no tokens there yet, so its preset A carries the brief's values (M6). Movement's and loading's are in
  globals.css since his picks (2026-09-27), so each A is "Today". A new round
  replaces B–E and keeps the old ones in the document.
- `src/components/stage.tsx` — the stage and what plays on it, per family. `MoveStage` draws the block of rings and
  dots, laid out by `flowSpots` and `stateOf`, and plays through `useCellMotion` (`@no-origins/ui/hooks/use-cell-motion`),
  which reads the motion off the block with `readCellMotion` (here the stage's tokens) and writes each frame of
  `cellMotionFrame` straight onto the elements, one GSAP clock a move. **The motion itself is the package's**, and the
  portfolio's tech column plays it through the same hook (2026-09-27), so what is tuned here is what it does. Do not
  grow a second copy of it here. The stage passes `always`, so it plays under reduced motion, where a component jumps.
  `LoadStage` is the loading specimen: a page of `Card`s on the stage's cells (`samplePage`: the first `sections` of
  `SECTIONS` packed in reading order, or with Layout on Random a page dealt from the `seed` option by `randomPage`; every press of Random, even an
  already-pressed one, deals a new seed), laid in the block the jig's Columns and Rows set, played through `useLoadMotion`
  (`@no-origins/ui/hooks/use-load-motion`) while it is live, when it is always loading. A play on the timeline is
  loading for the page's loading time (the `load` option, dragged on the timeline), then the expansion, then the page held.
  Each ring is an SVG `rect` drawn with the package's `loadRing`, and each card is clipped to its ring's box as it
  opens.
  `EnterStage` is enter and exit's specimen: one of movement's cells (1 × 1 unless the jig's Columns and Rows make
  more), gone at rest, entering while the pointer is on the block and exiting when it leaves, played through
  `useCellEnter` (`@no-origins/ui/hooks/use-cell-motion`), which reads `--motion-move-enter-*` off the block with
  `readCellEnter`. None of those tokens is in globals.css until he picks, so its preset A carries them, and the family
  borrows movement's stagger. Movement's move does not read them: whether it will is his call (Motion.md M11).
- `src/content/focus.ts` and `src/components/focus-stage.tsx` — focus (M13): its nineteen tokens in three groups
  (Intensity, Ripple, Release; the tokens' jig shows one at a time, for any grouped family), its five presets, and
  `FocusStage`, a page of system `Card`s like the portfolio's first screen. It plays through `useFocusMotion`
  (`@no-origins/ui/hooks/use-focus-motion`), which reads `--motion-focus-*` off the stage with `readFocusMotion` and
  writes a few custom properties on the blur's surface (`paintFocus`). Its layers are `focusLayerStyles`, one
  `backdrop-filter` element a ring. The rings are drawn over the page, labelled with the blur they reach (the
  specimen's Rings), and a play goes in on a card, holds, moves to the next, holds and goes out. **Its stage has no
  paint containment** (stage.tsx): Chrome makes `contain: paint` the layers' backdrop root, and the field's dashes
  under the stage would not blur. Its tokens are in globals.css since his pick (2026-09-28, round 1's Tide, tuned), so
  its preset A is "Today", read off the page, and the package falls back to the same (`FOCUS_START`).
- `src/content/mode.ts` and `src/components/mode-stage.tsx` — focus mode (M14): twenty-three tokens in four groups
  (Panel, Cloth, Roll, Slide), five presets, and `ModeStage`, three verticals of system `Card`s with Focus (a `Toggle`)
  on the bottom-right cell and the verticals' cells at the bottom centre, grown and moved by `useCellMotion` as the
  numbered pager's are. It plays through `useModeMotion` (`@no-origins/ui/hooks/use-mode-motion`), which reads
  `--motion-mode-*` off the stage with `readModeMotion`, writes the cloth's custom properties (`paintMode`) and hands
  each frame to the stage to move the panel and the verticals. Like focus's, its stage has no paint containment. None of
  its tokens is in globals.css, so its preset A carries them.
- **The timeline is the transport** (Motion.md M6): a row under the stage, `Timeline` in jigs.tsx. The playhead is
  an external store in the studio context (`transport`: phases, `t`, and live · playing · paused), run on a GSAP ticker.
  Only the timeline and the stage's painter read it every frame. A stage puts its play on it with `useTrack`
  (stage.tsx): `build` returns the play's phases and a `paint(t)` made from the package's own frames
  (`cellMotionFrame`, `loadFrame`), and while `useHeld` says the timeline holds the stage, the stage's motion hook gets
  `still` and `paint` runs at every move of the playhead. Movement paints through `useCellMotion`'s `draw`, so when the
  timeline lets go, the block moves on from the frame it was left on. The timeline's ⏮ is `transport.play(true)`,
  from the start; beside it play/pause from the playhead, then Loop and Tempo. There is no scrub any more: the
  timeline replaced it. **A phase that is a setting carries `drag`** (`PhaseDrag` in studio-context: range, step,
  `scale` — the tempo for a phase the tempo slows — and where the value goes; `holdPhase` builds the hold every play
  has). `Phases` in jigs.tsx draws a grip on it and drags it at the scale the timeline had when it was pressed, which
  the timeline keeps for the drag; the arrows step it. It is the one control here not built from a system component
  (Motion.md §5).
- `src/components/jigs.tsx` — the jig slots: the timeline, the specimen (Columns and Rows, then `SPECIMEN`, per
  family), the presets, the tokens and the settings, each a `Card` but the timeline.
- `src/components/studio-context.tsx` — what the slots share: the values, the specimen's options (`blockOf` reads
  the block), the timeline's tempo, loop and hold, the transport and Play. It is saved in the browser under
  `no-origins:motion`, and nothing else.
- `src/lib/tokens.ts` — reading the decided values off `:root` (else preset A), writing a value as CSS, the settings
  block.

## What is true here and easy to get wrong

- **The decided values are never copied into the studio.** They are read off the page's root, so a pick committed
  to `globals.css` is "Today" here with no second edit. Only a motion with no tokens there yet carries its values
  in preset A.
- **The movement specimen's hover is read from the cell under the pointer**, turned into a place in the flow and
  checked against where the elements are going, not from the element under it. The elements move, and a block
  pushed under a still pointer must not pass the hover along.
- **The block is trimmed to fit the stage, with its spare line.** An across or down that would not fit is cut down,
  not clipped.
- **The dot's size follows its position on the grid, not the clock** (`dotScale`). That is what makes an interrupted
  move read right. Do not tween the scale on its own. **And a dot is seen only on the cell it leaves and the cell it
  reaches** (`travelScale`, his, 2026-09-27): one going further drowns once, is drawn over no cell between, and floats
  up once.
- **Rings never move; only the dots travel** (his: "we don't need the circles also to move, it's only the element
  inside the circles"). A ring that hands over lights on its new cell and goes out on its old one, and only the
  active ring grows, and **only it is lime** (his: "Only the element that is active should have lime border"). The
  rest are the system's hairline.
- **Loading's tokens are in globals.css since his pick** (2026-09-27), so its preset A is "Today", read off the
  page, as movement's is, and the package's `readLoadMotion` falls back to the same values.
- **The loader is a square, and its rings move as movement's dot does** (his notes, Motion.md M10): never wider
  than tall (ten stand as 3, 3, 3, 1), all pressed to his 0.5 at once, their dashes closing into full circles as they
  shrink (his, 2026-09-28), each going straight to its section's top-left
  cell in one move of movement's dot (its curve, its duration, all landing at once, unseen between its two cells), released together into
  plain borders that open from that corner, the border fading as the section comes in, and nothing crosses. The square, the move and when each section
  opens are the package's `loaderLayout`, `loadFrame` and `openings`, and the stage paints with the package's
  `paintLoadRing` and `paintLoadSection`, the painters the grid loads every page with (Grid.md D48). The family
  `borrows` movement, so the stage carries movement's decided tokens, slowed by the tempo. Tune movement on its own
  page, never here.
- **The jigs keep one rhythm** (Motion.md M6): `Control` and `Controls` in jigs.tsx carry it, 12px down, 24px across,
  and a control 8px under its head, with its value right after its label and the control centred in a band as tall as
  its row. Build every new control from them, and never set a gap of its own on one.
- **A half-width choice token is a select**, since half a jig is too narrow for a row of toggles (none on the bench today; loading's Settle was one until it went).
- **The specimen is abstract geometry, by his spec**: lime rings and dots, not a component. That is the one kind of
  element here that is not `@no-origins/ui`. Everything the jigs are made of is.
- **There is no database anywhere near this app**, and there should not be.

## Reviewing it

In the sweep since 2026-09-27: `pnpm review` boots this app on :3004 and screenshots `/` (`MOTION_ROUTES` in
`e2e/review.spec.ts`) on desktop and mobile in both themes. The sweep sees page 1 only, and nothing played. To see a
motion, run the app and press the timeline's ⏮, at a tempo of 10× if it is quick, or drag the timeline.
`motion-timeline-controls.mjs <out> [theme]` drags each page's setting phases, checking their ends follow the pointer,
then opens Tempo, turns Loop on and plays; `motion-phone-timeline.mjs <out>` shoots the phone's two-row timeline and
the specimen's page. `e2e/.mcp/motion-move.mjs`
(gitignored) shoots a slowed hover through the move. `motion-hover.mjs` sweeps the
pointer across a block, changing cells mid-move, and prints where it settles. `motion-load.mjs <out> A,B,C,D,E 6 5 dark`
turns to the loading page and shoots each preset's turn, then Play and the expansion, slowed by the tempo.
`turn-loader.mjs <out> [WxH] [scheme] [ms…]` presses the pager's "Page 2" and logs the turn's phases and the grid's
loader as it loads the page (Grid.md D48). `motion-load-rules.mjs [steps] [layouts]` steps the loading timeline through the expansion on eleven layouts and fails
on two rings overlapping (read at the scale they are drawn) or a ring seen on more than two cells on its way, and
prints when each section's ring lands and opens, for the presets given. `motion-load-handover.mjs <out> 8 A 1500 1600 …` shoots the move at the moments
given. `motion-load-turn.mjs <out>` checks the lap leaves the timeline's length alone and the turn goes on while
the page opens. `motion-load-phone.mjs <out.png>` finds the loading stage on a Pixel 7. `motion-timeline.mjs <out> 1` clicks each
page's timeline at 10, 30, 50, 70 and 90%, printing the time, shoots the stage and the timeline, then plays from the
playhead and pauses. `motion-load-random.mjs <out> 4 6 A` presses Random four times, printing each page's seed, and
shoots each page on the timeline, loading, part-way and in.
`motion-enter.mjs <out> A,B,C,D,E 10 dark` turns to enter · exit, shoots a hover in and out, then each preset on the
timeline at seven moments through the enter, the hold and the exit. `motion-enter-turn.mjs <out> A 10 1400 3 2 row` leaves
the block part way through an enter, logging each dot as it goes back the way it came, then shoots a staggered block.
`motion-enter-phone.mjs <out.png>` finds its stage on a Pixel 7 and plays it.
`motion-focus.mjs <out> [A,B,C,D,E] [theme] [WxH]` turns to focus (the ↓ key: the bar holds four pages), hovers a card,
the next and off, printing the fronts and which card is focused and lifted, then seeks each preset's play to six
moments and shoots the page. Shoot the whole page: a `clip`ped screenshot at a device scale of 2 drops the
backdrop blur in headless Chromium, and the blur is there on the page.

## Hosting

The Vercel project and the domain are his step in the dashboard, as for the other apps. The project needs its root
directory set to `apps/motion`, and `vercel.json` here is byte-identical to the others.
