@AGENTS.md

# apps/motion — the motion studio

`motion.no-origins.com`, :3004. The lab where the design system's motion is designed: the real components, with every
number they move by on a jig, and the CSS lines to commit handed back (Motion.md M7). **Motion.md** is its document;
read M1–M9 before changing anything here.

```bash
pnpm --filter motion dev                 # :3004
```

## The shape

`/` is one `Grid` with the overlay and the cursor (`components/studio.tsx`), inside `StudioProvider`. **Motion.md M15 is
the layout**, derived from the measured field by `studioLayout(cols, rows, picks)` (`src/lib/layout.ts`):

- **The head**, one row: the studio's bar (four cells, lime, with the theme toggle), the **family** select (three),
  then the preset select or the version (three), **Reset** and **Copy** (one each). On Agents (M24) the head picks
  twice — the action, then the agent it is previewed on, three cells each — and the bar gives up a cell under sixteen
  columns. Copy puts every token of the family on the clipboard as the settings block to send back (M7).
- **The stage** is always at the field's centre, **transparent** (a specimen stands on the field's own cells, so place
  things a whole number of pitches, `cell + gap`, in from its corner).
- **The jigs**, on a field fourteen columns or wider, are a column either side of the stage, four to six cells each
  (`JIG_MAX`), from under the head to the foot (`components/jig-columns.tsx`). Every token group is a card of its own
  (Timing, Shape and Easing where a family has none), then Scene; an action leads with its own card. They are split
  between the columns in order so the taller is as short as it can be, each card as tall as its content, a card paging
  its controls when its share of the column is short, and a column too short for each card's three lines folding them,
  one open. **A jig is dragged by its grip** to either side or another place in its column (Escape puts it back; the
  grip's arrows move it), and where he leaves them is kept per motion in the browser (`jigs` in `no-origins:motion`).
- **The timeline**, ten cells at the most (`TIMELINE_MAX`), centred under the stage.
- **A narrow field** visits one workspace at a time — Preview, or one jig six cells at the most, centred — through a
  select in the head; the real stage stays mounted while a jig is visited.

**The bench holds only what he names** (Motion.md M9). The family select holds nine:

| Family | What it is | Its start |
|---|---|---|
| **Movement** (M9) | how one-cell elements move when one grows | five presets; **decided**, A is "Today" |
| **Loading** (M10) | a square of dashed lime rings at the centre, one a section, each going to its section and opening | five presets; **decided** |
| **Enter · exit** (M11) | movement's first primitive: one cell's element coming in and going out | five presets; not decided |
| **Hyper focus** (M13) | a card in focus and a cloth of blur drawn out from under it to the stage's corners, the card lifting over it | five presets; **decided** |
| **Focus mode** (M14) | one vertical at a time: a panel rising out of the page in 3D, a cloth rolling out over the rest | five presets; **decided** |
| **Grip** (M16) | the slider: its head detaching into the cursor while held, its fluid body following on a spring | five presets; **decided** |
| **Steps** (M21) | the slider's marks: a dot over each step, a zone a held head snaps into, the tick | version 1, no presets |
| **Liquid** (M25) | a box filled to a level, its surface flowing — the design system's `Liquid` | version 1, no presets |
| **Agents** (M23, M24) | the agents' actions, previewed on any agent | each action its version |

Decided means its tokens are in globals.css — the `--motion-move-*`, `--motion-load-*`, `--motion-focus-*`,
`--motion-mode-*` and `--motion-grip-*` (with `--slider-height`) — so its preset A is "Today", read off the page.
Enter · exit's, Steps' and Liquid's are not there yet: they start from preset A's values or their version's. Open:
whether the older families keep their presets — his decision; a family designed version by version has none
(`family.version`).

**Each control lives with what it is about, the same on every motion** (M6): how a play runs — Play, Loop, Tempo, and
the phases that are settings (the hold; loading's page time), dragged — is on the timeline; what plays is on the
specimen's jig (Scene); the motion is the tokens. A new family gets the timeline and the block for nothing: give it a
`block` in `families.ts`, and a `drag` on any phase of its play whose length is a setting.

## The files

- `src/content/families.ts` — the motions on the bench: each one's tokens (name, unit, range, what it touches), its
  presets or its `version`, its `block`, and what it `borrows` (loading borrows movement's hand-over, at movement's
  decided values). `focus.ts`, `mode.ts`, `steps.ts`, `liquid.ts` and `agent-actions.ts` declare the rest;
  `sphere.ts` turns the agent's body and face settings into tokens (`SPHERE_TOKENS`, `settingToken`) for an action's
  jigs and the agent previewed.
- `src/components/studio-jigs.tsx` — the token jigs: `jigSections` groups a family's tokens, `TokenJig` is a group's
  card, paged by `linePages` with each control's real height, and **`ParameterControl` is every token's control**: its
  label and its value typed beside it, the slider (or a select, for an ease or a choice; the `ColourPicker` for a
  choice of colours) under them, and what it moves in a line. Also the head's `PresetSelect`, `PresetJig` (a narrow
  field's Presets), `ResetMotion` and `CopySettings`.
- `src/components/jigs.tsx` — the `Timeline` and the `Specimen` (Scene: Columns and Rows, then the family's own options,
  `SPECIMEN`), built from `Jig`, `Control` and `Controls`, which carry the jigs' rhythm: 12px down, 24px across, a
  control 8px under its head. Build every new control from them, and never set a gap of its own on one.
- `src/components/stage.tsx` — `Stage` writes the family's tokens on the stage (slowed by the tempo, with any it
  borrows) and draws the family's stage: `MoveStage`, `LoadStage`, `EnterStage`, `GripStage` here; `FocusStage`
  (`focus-stage.tsx`), `ModeStage` (`mode-stage.tsx`), `StepStage` (`step-stage.tsx`), `LiquidStage`
  (`liquid-stage.tsx`), and an action's `ActionStage` (`sphere-stage.tsx`).
- `src/components/studio-context.tsx` — what the slots share: the values, the specimen's options (`blockOf` reads the
  block), the tempo, loop and hold, the transport and Play. Saved in the browser under `no-origins:motion`.
- `src/lib/tokens.ts` — reading the decided values off `:root` (`readDecided`, else preset A), writing a value as CSS,
  the settings block.
- `src/app/actions.ts`, `components/action-draft.tsx`, `components/agent-preview.tsx` — the agents' actions in the
  database (below).

## The stages

- **Movement** (`MoveStage`) draws the block of rings and dots, laid out by `flowSpots` and `stateOf`, and plays through
  `useCellMotion` (`@no-origins/ui/hooks/use-cell-motion`), which reads the motion off the block with `readCellMotion`
  and writes each frame of `cellMotionFrame` straight onto the elements, one GSAP clock a move. **The motion is the
  package's**, and the portfolio's tech column and the numbered pager play it through the same hook, so what is tuned
  here is what they do. Do not grow a second copy of it here. The stage passes `always`, so it plays under reduced
  motion, where a component jumps.
- **Loading** (`LoadStage`) is a page of `Card`s on the stage's cells (`samplePage`: the first `sections` of `SECTIONS`
  packed in reading order, or with Layout on Random a page dealt from a `seed` by `randomPage`; every press of Random
  deals a new seed), played through `useLoadMotion` while live, when it is always loading. A play on the timeline is
  loading for the page's loading time (the `load` option, dragged on the timeline), then the opening, then the page
  held. Its square, its move and when each section opens are the package's `loaderLayout`, `loadFrame` and `openings`,
  painted with `loadRing`, `paintLoadRing` and `paintLoadSection`. This page is the only place loading plays (Grid.md
  D49). It borrows movement's tokens: tune movement on its own page, never here.
- **Enter · exit** (`EnterStage`): one of movement's cells (1 × 1 unless Columns and Rows make more), gone at rest,
  entering while the pointer is on the block and exiting when it leaves, played through `useCellEnter`, which reads
  `--motion-move-enter-*` with `readCellEnter`. It borrows movement's stagger. Whether movement's move reads these
  tokens is his call (M11).
- **Hyper focus** (`FocusStage`, `content/focus.ts`): twenty-four tokens in four groups (Cloth, Intensity, Lift,
  Release), a page of system `Card`s, played through `useFocusMotion`, which writes a few custom properties on the
  cloth's surface (`paintFocus`); its layers are `focusLayerStyles`, one `backdrop-filter` element a ring, the card's
  shadow last. **The cloth covers its container, the stage, never the screen.**
- **Focus mode** (`ModeStage`, `content/mode.ts`): twenty-four tokens in five groups (Lift, Panel, Line, Cloth, Roll),
  three verticals of system `Card`s with Focus (a `Toggle`) and the verticals' cells on the stage's bottom row, played
  through `useModeMotion` (`paintMode`). **Every vertical has a cloth and a panel of its own**, so a switch plays the
  one left's way out and the next one's way in at once (`switch`, `modeSwitchMs`). **Only the panel lifts**: the
  verticals' cards never move or scale. It rises straight out of the page, its whole line there, and sinks back the
  same way. The panel is SVG, the package's `modeShape` projected in 3D and drawn by `paintModePanel`, never a CSS box
  with a transform. **Neither focus stage has paint containment**: Chrome makes `contain: paint` the layers' backdrop
  root, and the field's dashes under the stage would not blur.
- **Grip** (`GripStage`): the system's own `Slider` on the stage's rows (Columns its length, Rows how many, every second
  a range), pressed by hand when live and painted from `@no-origins/ui/lib/grip-motion` on the timeline, with a drawn
  ring for the cursor. Every `Slider` plays the decided grip.
- **Steps** (`StepStage`, `content/steps.ts`): three system `Slider`s with `marks` (1 to 5, a range 0 to 10, 0 to 20
  marked every 5); ten tokens in three groups, Marks (`--slider-mark-*`), Tick and Feel (`--motion-step-*`), none in
  globals.css (`STEP_START`, `lib/step-motion`). Its timeline play steps the hand, the zone, the snap and the follow by
  the slider's own rules.
- **Liquid** (`LiquidStage`, `content/liquid.ts`): the design system's `Liquid` filling the block at the specimen's
  Level (40% unless moved); eleven tokens in four groups, Wave, Back wave, Sway and Pour (`--motion-liquid-*`), none in
  globals.css (`LIQUID_START`, `lib/liquid-motion`). Its timeline play is the pour, then the flow for the hold, painted
  from `liquidFrame` and `paintLiquid`. The status page (Status.md) plays it.
- **Agents** (M23, M24): the head's **Action** select picks one of those `@no-origins/ui/lib/agent-actions` declares —
  **Bounce** (version 1), **Jump** (version 1) and **Dive** (version 2) — each a family of its own (`action-<id>`,
  `content/agent-actions.ts`), so its values are apart from every other's. The head's **Agent** select
  (`agent-preview.tsx`, `loadAgents`) previews one of Orbit's agents as Orbit has it, its draft and its uploads, or the
  code's "Default" with no database. The bench is the action's: its card first (`ActionCard`: what it is, the version
  pages play, the save, **Publish** for the next minor and **Versions** to go back or publish the next major) and a card
  a group of its controls. Its timeline is its phases, as long as its controls make them, never dragged. Its stage
  (`ActionStage`) sits the agent at rest at the centre, breathing and blinking, and plays the action on a click — one
  that travels (Jump, Dive) to the cell clicked, where it stays; Bounce where it sits — and from the centre on the
  timeline. A dive is drawn moved behind the page and cut to its nest's circle, going out of it the way it travels and
  into the next from the side it comes from, cut to the bowl (`sphereBowl`) as it carries on in front, and not at all
  while it is under. The agent is the design system's `Agent`; its model is `@no-origins/ui/lib/sphere-motion`
  (Motion.md M17), its look Orbit's.

## The timeline

**The timeline is the transport** (M6): `Timeline` in `jigs.tsx`. The playhead is an external store in the studio
context (`transport`: phases, `t`, and live · playing · paused), run on a GSAP ticker; only the timeline and the stage's
painter read it every frame. A stage puts its play on it with `useTrack` (`stage.tsx`): `build` returns the play's
phases and a `paint(t)` made from the package's own frames (`cellMotionFrame`, `loadFrame`), and while `useHeld` says
the timeline holds the stage, the stage's motion hook gets `still` and `paint` runs at every move of the playhead.
Movement paints through `useCellMotion`'s `draw`, so when the timeline lets go the block moves on from the frame it was
left on. ↺ is `transport.play(true)`, from the start; beside it play or pause (lime) from the playhead, the time, Loop
(a `Switch`) and Tempo (a `Select`: 1×, 2×, 5×, 10×) on the first line; the slider (lime range, violet thumb) over the
phases as pills on the second, the one the playhead is in the muted tint. Each pill carries `data-phase` and is a
container of its own (`@container/phase`). **A phase that is a setting carries `drag`** (`PhaseDrag`: range, step,
`scale`, and where the value goes; `holdPhase` builds the hold every play has): `Phases` draws a grip on it and drags
it at the scale the timeline had when it was pressed; the arrows step it. It is the one control here not built from a
system component (Motion.md §5).

## What is true here and easy to get wrong

- **The decided values are never copied into the studio.** They are read off the page's root, so a pick committed to
  `globals.css` is "Today" here with no second edit. Only a motion with no tokens there yet carries its values in
  preset A or its version.
- **Movement's hover is read from the cell under the pointer**, turned into a place in the flow and checked against
  where the elements are going, not from the element under it: the elements move, and a block pushed under a still
  pointer must not pass the hover along.
- **The block is trimmed to fit the stage, with its spare line.** An across or down that would not fit is cut down,
  not clipped.
- **The dot's size follows its position on the grid, not the clock** (`dotScale`), so an interrupted move reads right;
  do not tween the scale on its own. **A dot is seen only on the cell it leaves and the cell it reaches**
  (`travelScale`): one going further drowns once, is drawn over no cell between, and floats up once.
- **Rings never move; only the dots travel.** A ring that hands over lights on its new cell and goes out on its old
  one; only the active ring grows, and **only it is lime**. The rest are the system's hairline.
- **The loader is a square, and its rings move as movement's dot does** (M10): never wider than tall (ten stand as 3,
  3, 3, 1), all pressed to his 0.5 at once, their dashes closing into full circles as they shrink, each going straight
  to its section's top-left cell in one move of movement's dot, all landing at once, released together into plain
  borders that open from that corner, and nothing crosses.
- **The specimen is abstract geometry, by his spec**: lime rings and dots, not a component, and the agent's nests. That
  is the one kind of element here that is not `@no-origins/ui`. Everything the jigs are made of is.
- **The studio is behind the sign-in** (Motion.md M1): `src/proxy.ts` runs the shared gate (`@no-origins/auth`) with
  `permission: "motion.open"`, `/sign-in` is the shared login card, and the session is every app's. **On a development
  server with no Supabase keys it opens without a login** — that is how `pnpm review`, CI and a laptop offline see it;
  `.env.example` says what to set to lock it locally. Production never opens without them.
- **The agents' actions are in the database** (`src/app/actions.ts`: an item of kind `action`, its draft
  `{ action, values }`, saved half a second after the jigs stand still on its `rev`, published through
  `studio_publish`, `major.minor`); with no keys or signed out, the values are the browser's. It also reads Orbit's
  agents to preview. **There is one draft an action, and it is his**: nothing automated writes it. **An account that
  may open the studio but not save** (`motion.open` alone, a Member — Access.md A4) is **trying** (`SaveStatus`):
  `loadActions` says what the session may do (`may`, from the token), it reads each action as published and each agent
  as Orbit publishes it, and `ActionDraftProvider` never saves or makes an item for it; the action's card shows the
  version and "Nothing you change is saved", without Publish or Versions.
- **`/concepts/split`, `/concepts/dock` and `/concepts/inspector`** (`components/concept-studio.tsx`) are layout
  studies of the bench, every family on the studio's own stage. Open: keep or remove — his decision.

## Reviewing it

`pnpm review` boots this app on :3004 and screenshots `/` and the three `/concepts/*` (`MOTION_ROUTES` in
`e2e/review.spec.ts`) on desktop and mobile in both themes; the sweep sees Movement first, nothing played.
`e2e/motion-studio.spec.ts` checks the workspace — editing, playback, the stage centred and the jigs where they are
put, and shorter fields; `e2e/agents.spec.ts` (desktop only) plays Bounce on the agent previewed against the values on
the jigs and checks Jump and Dive end in the nest their Where reaches, editing only where the values are the browser's —
it never writes his drafts. To see a motion, run the app and press the timeline's ↺, at a tempo of 10× if it is quick,
or drag the timeline.

Gitignored helpers in `e2e/.mcp/`, the dev server running:

- Movement and loading: `motion-move.mjs` (a slowed hover through the move), `motion-hover.mjs` (the pointer across a
  block, changing cells mid-move), `motion-load.mjs <out> A,B,C,D,E 6 5 dark` (each preset's turn, then the opening),
  `motion-load-rules.mjs [steps] [layouts]` (fails on two rings overlapping or one seen on more than two cells),
  `motion-load-random.mjs`, `motion-load-phone.mjs`.
- Enter · exit: `motion-enter.mjs <out> A,B,C,D,E 10 dark`, `motion-enter-turn.mjs`, `motion-enter-phone.mjs`.
- The focus families: `focus-cloth-seek.mjs <out> [preset] [theme] [WxH] [card] [ms…]` (the cloth's edges, the lift and
  the card at each moment), `focus-cloth.mjs`. Shoot the whole page: a `clip`ped screenshot at a device scale of 2 drops
  the backdrop blur in headless Chromium.
- Steps and Liquid: `steps.mjs <out> [theme] [WxH]`, `steps-seek.mjs`, `steps-key.mjs`; `studio-liquid.mjs <out>`.
- The timeline: `motion-timeline.mjs`, `motion-timeline-controls.mjs <out> [theme]` (drags each page's setting phases),
  `motion-phone-timeline.mjs <out>`.
- Agents: `agent-bounce.mjs <out> [WxH] [theme] [ms,…] [action]` shoots the bench and an action at moments;
  `agent-dive-ways.mjs <out> [ms,…] [rest ms]` sends the agent up, left and down by live clicks at 10×.
  `agent-bounce-publish.mjs` publishes, changes, goes back and reloads — it **writes versions to his local database**,
  which are removed after with the frozen trigger disabled for them alone (supabase/README.md).

## Deploying

The Vercel project `motion`, root directory `apps/motion`, production `main`, with the two `NEXT_PUBLIC_SUPABASE_*`
variables; `vercel.json` is byte-identical to every app's (repo-root CLAUDE.md, Deploying).
