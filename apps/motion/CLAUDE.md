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

The main route, `/`, is one `Grid` with the cursor (no intro since Grid.md D49). **Motion.md M15 is the layout, as
amended 2026-10-01** (his: "the component should always be in the center", jigs "a maximum of six columns", the
timeline "maximum of 10 columns", and jigs he can "drag and drop … into different locations"): the stage at the
field's centre; on a field fourteen columns or wider, a column of jigs either side of it, four to six cells each, from
under the head to the foot; the timeline under the stage, ten cells at the most, centred. The head is one row: the
studio bar four cells, family and preset three each, Reset and Copy one each — on Agents (M24) the family, the action
and the agent previewed, three each, the bar three cells under sixteen across. Every token group is a card of its own
(Timing, Shape and Easing where a family has none), then Scene; an action leads with its own card.
They are split between the columns in order, so the taller is as short as it can be, sized to their content, a card
paging its controls when its share of the column is short, and a column too short for each card's three lines folding
them, one open (`components/jig-columns.tsx`). **A jig is dragged by its grip** to either side or another place in
its column (Escape puts it back, the grip's arrows move it), and where he leaves them is kept per motion in the browser
(`jigs` in `no-origins:motion`). Live, the agent sits at the stage's centre. Narrow fields visit one workspace at a
time, the jig six cells at the most and centred; on Agents the action and the agent take a head row of their own. The real stage stays
mounted while visiting controls. Theme is in Studio's bar.
`studioLayout(cols, rows, actions, lanes)` derives placements from the measured field.
The `/concepts/*` routes are earlier comparison studies. **The bench holds only what he names** (Motion.md M9, his, 2026-09-27:
"I'll tell you what we will work on and then you can add them"). Today that is eight families (the eighth motion, the agent, is **Agents** since 2026-10-01, M23: its own page went and its motions are every agent's; since M24 the same day, the agents' actions): the pill agent was deleted on 2026-09-30 and the sphere became the agent (a ninth, the segmented slider, M18, was tried and taken out the same night, his: "let's not have segments"). The studio's `Token` takes `--slider-*` names and a `px` kind, for the slider's Height on Grip's page. **The agent** — the sphere (M17, the eighth, 2026-09-30, his; **the agent since version 11**, keeping its `--motion-sphere-*` tokens) is a character, "an energetic and calm, 3D sphere that travels by diving from one cell to another", **version 15** (his version 14 as it looks, the same night: version 12's with Come back 500ms and the face's parts, slime spreading at 1.2 so Spread 0.11 is 14's 0.05; version 13, tuned, is the database's 13; his: "jumping from nest to nest", then "properly rest on the bottom of the circle … the tail … behind the screen", then "control on the type of the body", then a landing that is a "continuation of the motion", then "it will fall and then it will slide and then slowly come back"), designed version by version: seen from the side, a sphere head and a rubbery tail. It settles into the bottom of its nest's circle as into a bowl (its outline a circle cut by the nest's, keeping its size as it spreads, its edge smoothed; Body ball · jelly · slime sets how deep and how soft), its tail behind the page and, in a nest, cut to the nest's circle; a jump is a crouch, an arc under one gravity to the nest its Jump jig's Columns and Rows reach, the tail swinging out behind it, a landing that is a slippery ball in a bowl (simulated at a fixed step: it touches down on the side it comes from — Land at — keeps Slippery of its speed along the bowl, slides through the bottom and up the far side — never off it: far up its side the bowl is a soft wall it squishes into (Squeeze) — and comes back, its jelly swaying; Energy is how lively, Come back how long until it rests; Body scales it all as a material), the nest dipping, and the tail going back in. The tail is a spring chain stepped at a fixed 240Hz from the jump's start, so a timeline moment is the same frame however it is reached. Its pure model is `@no-origins/ui/lib/sphere-motion` (`sphereCourse` the head, `sphereSpine` the tail, `sphereFrame` the drawing); `components/sphere-stage.tsx` draws it through the design system's `Agent` (`@no-origins/ui/components/agent`, 2026-09-30), handing it a frame each tick, and keeps the nests, the course, the timeline and the blink clock; Orbit (`apps/orbit`) shows the same component still. Its page went on 2026-10-01 (M23), and the Hop motion it became went with M24. **Version 11 gives it eyes**, version 1 of them: two circles on its face in the ink of its paint, riding the head as it squashes, spreads and leans, looking where it goes, their lids blinking and squinting shut as it lands. **Version 13 gives its face parts** (M20's face version 1, his "yes for both"): Pupils (none, a dot, a shine), Upper lids (plain, heavy), Lower lids, Brows (line, arch, bushy) and Symbols (a mood's anger, sweat drop, Zzz, sparkle or question mark by the head), each a jig group whose jigs are the package's declaration (`@no-origins/ui/lib/agent-face`, `settingToken` in `content/sphere.ts`), every part left off so it looks as version 12 did until a Style is picked. A pair's right side set apart (`--motion-sphere-<id>-right`) is drawn but has no jig yet. Its `--motion-sphere-*` tokens (`SPHERE_TOKENS` in `content/sphere.ts`, a group a group of the body and a slot of the face), built from the package's declarations (`AGENT_BODY`, `AGENT_FACE`, `settingToken`), are not in globals.css: `SPHERE_START` is their start, and the defaults every agent moves by (M23). **Grip** (M16, page 7, 2026-09-30, his) is the slider: its head, merged into the bar at rest, detaching into the cursor while it is held — the bar parting 2px round the cursor's ring, the head a dot inside it, the cursor staying a ring — and its body fluid, following the head on a spring, its tokens in two groups, Head and Body (with the bar's Height): `GripStage` in stage.tsx is the system's own `Slider` on the stage's rows (Columns its length, Rows how many, every second a range), pressed by hand when live and painted from `@no-origins/ui/lib/grip-motion` on the timeline, with a drawn ring for the cursor. **It is decided** (his settings, 2026-09-30, "A As described, tuned", then tuned again, "A Today, tuned"): its `--motion-grip-*` tokens and the bar's `--slider-height` (8px) are in globals.css, so its preset A is "Today", read off the page, and every `Slider` plays it. **Steps** (M21, 2026-09-30, his, after Grip in the select) is the slider's steps, **version 1**, versioned with no presets: `Slider marks`, a dot over each step's place in room the slider keeps above its bar, lit where the value is and as the body's lime flows back; a zone round each mark that a held head snaps into, taking the mark's value; and the tick — the snap, or a value landing with no zone — the mark popping, the head kicking and a phone vibrating. Its ten tokens are in three groups, Marks (`--slider-mark-size`, `--slider-mark-lift`), Tick and Feel (`--motion-step-*`), none in globals.css (`STEP_START`, the package's `lib/step-motion`). `components/step-stage.tsx` is three system `Slider`s with marks (1 to 5, a range 0 to 10, 0 to 20 marked every 5), each lifted by half the marks' room so its bar is on the row's middle; it borrows the grip, and its timeline play steps the hand, the zone, the snap and the follow from the start by the slider's own rules. **The pill agent is deleted** (his, 2026-09-30: "we'll remove agent and the sphere will become the agent"; M12's last amendment): its family, stage, model and the statechart beside it are gone. **Agents** (M23, M24, 2026-10-01, his: "now I need more bounce action so now you add bounce action you add uh, the controls that are needed") is the agents' actions: the head's **Action** select picks one of those the package declares (`@no-origins/ui/lib/agent-actions`, `content/agent-actions.ts`: each a family of its own, `action-<id>`, so its values are apart from every other's), the head's **Agent** select (`components/agent-preview.tsx`, `loadAgents` in `src/app/actions.ts`) previews one of Orbit's agents as Orbit has it, its draft and its uploads, or the code's "Default" with no database, and the bench is the action's: its card first (`components/action-draft.tsx`: what it is, the version pages play, the save, **Publish** for the next minor and **Versions** to go back or publish the next major) and a card a group of its controls; its timeline is its phases, as long as its controls make them, never dragged (his: "length should follow from the controls"); its stage (`ActionStage` in `components/sphere-stage.tsx`) sits the agent at rest at the centre, breathing and blinking, plays the action on a click — one that travels (Jump, Dive) to the cell clicked, where it stays; Bounce where it sits — and plays it from the centre on the timeline, a traveller's path centred by its Where; a dive is drawn moved behind the page and cut to its nest's circle, going out of it the way it travels and into the next from the side it comes from, cut to the bowl (`sphereBowl`) as it carries on in front, and not at all while it is under. **Bounce**, **Jump** (version 1 each) and **Dive** (version 2) are the three. `e2e/.mcp/agent-dive-ways.mjs <out> [ms,…] [rest ms]` sends the agent up, left and down by live clicks at 10× tempo and shoots the dive at the moments given. Its draft is in the database (`src/app/actions.ts`: an item of kind `action`, `{ action, values }`, saved half a second after the jigs stand still on its `rev`, published through `studio_publish`), in the browser where there are no keys or he is signed out. **There is one draft an action, and it is his**: `e2e/agents.spec.ts` (desktop only) plays Bounce on the agent previewed and checks it against the values on the jigs, checks Jump and Dive end in the nest their Where reaches (the dive gone while under), and edits only where the values are the browser's; it never writes his drafts. `e2e/.mcp/agent-bounce.mjs <out> [WxH] [theme] [ms,…] [action]` shoots the bench and an action (Bounce unless named) at moments, logging the head and the sink; `agent-bounce-publish.mjs` publishes, changes, goes back and reloads — it WRITES versions to his local database, which are removed after with the frozen trigger disabled for them alone (supabase/README.md). The motions bench before it (M19, M20: tabs, rows, the Hop) went with M24, and `e2e/.mcp/agent-motions.mjs`, `agent-curious.mjs` and `motions-db.mjs` shoot what is gone. **Movement** (M9) is how one-cell
elements move when one of them grows, for the work menu and the tech verticals. **Loading** (M10) is how a page loads:
one dashed lime cell per section turns at the centre, and each expands into its section when the page is ready. **Enter · exit** (M11, page 3) is movement's first primitive: one cell's element coming in and going out, its ring lighting and its dot floating up, then the dot drowning and the ring going out. **Hyper focus** (M13, page 5, 2026-09-28; named so on 2026-09-29, when the portfolio took it as a mode) is a card in focus and a cloth of blur round it, least at the card and thicker out from it, drawn out from under the card to every corner of its container, here the stage (a cloth, not a ripple, since his note the same night), the card lifting over it: the portfolio played it as its hyper focus mode (Portfolio.md P18, P20) until 2026-09-30. **Focus mode** (M14, page 6, 2026-09-28) is one vertical at a time: a panel comes out of the page over it in 3D, a cloth of blur rolls out from the panel's edges over the rest, and another of the three verticals, picked from cells at the bottom centre, is the one left unfocusing as it focuses, both at once (his, 2026-09-29: "Instead of sliding the focus container, we should just unfocus while refocusing on the next one"; the panel slid until then). The portfolio played it as its focus mode from 2026-09-29 (P20). **Both are off the portfolio since 2026-09-30** (Portfolio.md P21, his: "We can have it the motion studio but I did not like it in the portfolio"): they play here only. Both are decided (his settings, 2026-09-29: hyper focus "C Unroll, tuned", focus mode "A As described, tuned"), their tokens in globals.css. The two families keep their ids and tokens (`focus`, `mode`). **All slots follow the measured field** (`src/lib/layout.ts`); M15 supersedes the original three-column layout (M5). **Each control lives with what it is about, the
same on every motion** (M6, his, 2026-09-27): how a play runs — Play, Loop, Tempo, and the phases that are settings
(the hold; loading's page time), dragged — is on the timeline; what plays is on the specimen's jig; the motion is the
tokens. A new family gets the timeline and the block for nothing: give it a `block` in families.ts, and a `drag` on any
phase of its play whose length is a setting.
`src/components/studio-jigs.tsx` provides the token jigs (one a group, paged by `linePages` with each control's real
height), numeric inputs and header actions; `src/components/jig-columns.tsx` the two columns, the grip, the drag, the
shares and the fold; `src/components/studio.tsx` composes the workbench. Keep every token accessible when a group needs
more room.

**The stage is transparent** (his: "we have to see the grid and how these work on grids"), and a specimen stands on
the field's own cells. The stage starts on a cell, so place things a whole number of pitches (`cell + gap`) in from
its corner, and they are on the grid.

- `src/content/families.ts` — the motions on the bench: each one's tokens (name, unit, range, what it touches) and
  **five presets**. A family whose tokens are in globals.css starts from "Today", read off the page. One still being
  designed has no tokens there yet, so its preset A carries the brief's values (M6). Movement's and loading's are in
  globals.css since his picks (2026-09-27), hyper focus's and focus mode's since 2026-09-29, the grip's since 2026-09-30, so each A is "Today". A new round
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
- `src/content/focus.ts` and `src/components/focus-stage.tsx` — focus (M13): its twenty-four tokens in four groups
  (Cloth, Intensity, Lift, Release; the tokens' jig shows one at a time, for any grouped family), its five presets, and
  `FocusStage`, a page of system `Card`s like the portfolio's first screen. It plays through `useFocusMotion`
  (`@no-origins/ui/hooks/use-focus-motion`), which reads `--motion-focus-*` off the stage with `readFocusMotion` and
  writes a few custom properties on the cloth's surface (`paintFocus`). Its layers are `focusLayerStyles`, one
  `backdrop-filter` element a ring, and the card's shadow last. The rings are drawn over the page (circles, or squares
  measured from the card's edges), labelled with the blur they reach (the specimen's Rings), and a play goes in on a
  card, holds, moves to the next, holds and goes out. **The cloth covers its container, the stage, never the screen**
  (his, 2026-09-28: "I meant the container, whatever the container we are putting it in"): its edges go to the
  stage's corners and the jigs stay sharp. **Its stage has no paint containment** (stage.tsx): Chrome makes
  `contain: paint` the layers' backdrop root, and the field's dashes under the stage would not blur. Its tokens are
  in globals.css (his numbers, round 2's C Unroll, tuned, 2026-09-29; round 1's Tide, tuned, before it), so its
  preset A is "Today", read off the page, and the package falls back to the same (`FOCUS_START`); B–E are round 2, the
  cloth.
- `src/content/mode.ts` and `src/components/mode-stage.tsx` — focus mode (M14): twenty-four tokens in five groups
  (Lift — lift and drop, each its time and curve, his ask 2026-09-29 — Panel, Line, Cloth, Roll; Slide went with the
  slide, and Line's Draw and Draw ease with the draw), five presets, and `ModeStage`, three verticals of system `Card`s, three columns wide with two between (his, 2026-09-29; a narrower stage gives up the air first), with Focus (a `Toggle`)
  and the verticals' cells on the stage's bottom row (his: never right under the verticals), the cells at its centre, grown and moved by `useCellMotion` as the
  numbered pager's are. It plays through `useModeMotion` (`@no-origins/ui/hooks/use-mode-motion`), which reads
  `--motion-mode-*` off the stage with `readModeMotion`, writes each cloth's custom properties (`paintMode`) and hands
  the frames to the stage to draw the panels. **Every vertical has a cloth and a panel of its own** (`cloths`, one
  `data-mode-cloth` a vertical in the surface, and one panel group each), so a switch plays the one left's way out and
  the next one's way in at once; on the timeline it is a `switch` phase, `modeSwitchMs` long. **Only the panel lifts**: the verticals' cards never move or scale (his,
  2026-09-28), and the one in focus is only stacked over the cloth once its cloth is the only one out. **It rises
  straight out of the page, its whole line there** (his, 2026-09-29: "rise from the viewport directly without that
  border animation"), and goes by the same steps backward, the cloth first and then the panel sinking back into the
  page; its line was drawn round it first, from the top down, until then. The panel is SVG, the package's `modeShape`
  projected in 3D and drawn by `paintModePanel`, never a CSS box with a transform, since each point of it is swung and
  seen through the perspective. Like focus's, its stage has no
  paint containment. Its tokens are in globals.css (his numbers, A As described, tuned, 2026-09-29), so its preset A
  is "Today", read off the page, and the package falls back to the same (`MODE_START`); B–E are round 1's other four.
- **The timeline is the transport** (Motion.md M6): a row under the stage, `Timeline` in jigs.tsx. The playhead is
  an external store in the studio context (`transport`: phases, `t`, and live · playing · paused), run on a GSAP ticker.
  Only the timeline and the stage's painter read it every frame. A stage puts its play on it with `useTrack`
  (stage.tsx): `build` returns the play's phases and a `paint(t)` made from the package's own frames
  (`cellMotionFrame`, `loadFrame`), and while `useHeld` says the timeline holds the stage, the stage's motion hook gets
  `still` and `paint` runs at every move of the playhead. Movement paints through `useCellMotion`'s `draw`, so when the
  timeline lets go, the block moves on from the frame it was left on. The timeline's ⏮ is `transport.play(true)`,
  from the start; beside it play/pause from the playhead, then Loop and Tempo. There is no scrub any more: the
  timeline replaced it. **It is drawn as his player** (2026-09-29): ↺ outlined and play or pause lime, the time, Loop a
`Switch` and Tempo a `Select` on the first line; the slider (lime range, violet thumb) over the phases as pills, the one
the playhead is in the muted tint, and a violet line from the thumb through them. The phases stand a thumb's half in
from the slider's ends, so slider and phases are one axis. Each pill carries `data-phase={phase.label}` (the pill
agent's spec found its greeting by it) and is a container of its own (`@container/phase`, the timeline's is `/timeline`), so the ms,
then the grip, give way in a thin pill. **A phase that is a setting carries `drag`** (`PhaseDrag` in studio-context: range, step,
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
  `paintLoadRing` and `paintLoadSection`, the painters the grid loaded every page with (Grid.md D48) until no page
  loaded with it (D49, 2026-09-30): this page is the only place loading plays. The family
  `borrows` movement, so the stage carries movement's decided tokens, slowed by the tempo. Tune movement on its own
  page, never here.
- **The jigs keep one rhythm** (Motion.md M6): `Control` and `Controls` in jigs.tsx carry it, 12px down, 24px across,
  and a control 8px under its head, with its value right after its label and the control centred in a band as tall as
  its row. Build every new control from them, and never set a gap of its own on one.
- **A half-width choice token is a select**, since half a jig is too narrow for a row of toggles (none on the bench today; loading's Settle was one until it went).
- **The specimen is abstract geometry, by his spec**: lime rings and dots, not a component. That is the one kind of
  element here that is not `@no-origins/ui`. Everything the jigs are made of is.
- **The studio is behind the sign-in** since 2026-09-30 (Motion.md M20, his: "lock the motion studio behind authentication, let's use the same auth"): `src/proxy.ts` calls the shared gate (`@no-origins/auth`), `/sign-in` is the shared login card, and the session is the admin's. **On a development server with no Supabase keys it opens without a login** — that is how `pnpm review`, CI and a laptop offline see it; `.env.example` says what to set to lock it locally. Production never opens without them. It had no database near it until that night; his versions will live in the admin's Supabase once their design (M20) is agreed. Nothing reads a table yet.

## Reviewing it

In the sweep since 2026-09-27: `pnpm review` boots this app on :3004 and screenshots `/` (`MOTION_ROUTES` in
`e2e/review.spec.ts`) on desktop and mobile in both themes. The sweep sees Movement first, and nothing played. `e2e/motion-studio.spec.ts` checks editing, playback, export, all six families and card fit; `e2e/agent.spec.ts` checks the Agent (the sphere, version 15): its version, its Eyes group and one for each face part, both eyes on the head, their turn toward the next nest in the crouch, and a Style putting each part on. `e2e/.mcp/agent-face.mjs <out> [theme]` puts each part on through the jigs and shoots the head up close. `e2e/.mcp/steps.mjs <out> [theme] [WxH]` turns to Steps, drags the first head across its marks shooting each frame and logging the value and each mark's scale and colour, presses → on the range and plays; `steps-seek.mjs <out> [ms,…]` seeks its timeline; `steps-key.mjs` logs a key step's segments frame by frame. `e2e/.mcp/agent-eyes.mjs <out> [theme] [ms,…]` shoots the head up close at the moments given; `e2e/.mcp/sphere.mjs` shoots the jump's frames. To see a
motion, run the app and press the timeline's ⏮, at a tempo of 10× if it is quick, or drag the timeline.
`motion-timeline-controls.mjs <out> [theme]` drags each page's setting phases, checking their ends follow the pointer,
then opens Tempo, turns Loop on and plays; `motion-phone-timeline.mjs <out>` shoots the phone's two-row timeline and
the specimen's page. `e2e/.mcp/motion-move.mjs`
(gitignored) shoots a slowed hover through the move. `motion-hover.mjs` sweeps the
pointer across a block, changing cells mid-move, and prints where it settles. `motion-load.mjs <out> A,B,C,D,E 6 5 dark`
turns to the loading page and shoots each preset's turn, then Play and the expansion, slowed by the tempo.
`turn-loader.mjs` logged the grid's loader on a turn (Grid.md D48) and has nothing to log since D49;
`no-loader-turn.mjs <url> <out>` presses ↓ on a paged grid and logs the fade out and in. `motion-load-rules.mjs [steps] [layouts]` steps the loading timeline through the expansion on eleven layouts and fails
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
`focus-cloth-seek.mjs <out> [preset] [theme] [WxH] [card] [ms…]` turns to focus (the ↓ key), starts the play on a card
and seeks the timeline to each moment given, printing the cloth's four edges, the lift and which card is focused and
lifted, and shoots the page; `focus-cloth.mjs <out> [theme] [WxH]` hovers the avatar through the cloth's way out and
off. (`motion-focus.mjs` is the ripple's, and prints fronts that are gone.) Shoot the whole page: a `clip`ped screenshot at a device scale of 2 drops the
backdrop blur in headless Chromium, and the blur is there on the page.

## Hosting

The Vercel project and the domain are his step in the dashboard, as for the other apps. The project needs its root
directory set to `apps/motion`, and `vercel.json` here is byte-identical to the others.
