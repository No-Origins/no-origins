# packages/ui — `@no-origins/ui`

The design system: shadcn/ui (style `radix-sera`, base `radix`, base colour `neutral`, RTL on) with the house's edits
and components. The repo-root `CLAUDE.md` holds the system-wide rules; this file is the package's map and its own rules.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

**What every component wears.** Lime and violet accents (`--primary`, `--secondary`; `--muted` and `--accent` are lime
mixed over the page, never translucent). **One radius**, half the grid's cell (Grid.md D39): every box is `rounded-lg`,
which the browser shrinks to a pill or a circle wherever a box is a cell or less across; lines (separators, table rows)
stay straight. **Fields are outlined pills** (Input, Textarea, InputGroup, the Select triggers, the Combobox's chips,
Command's search, the Questionnaire's answer), InputOTP's slots circles; a field added from the CLI arrives as sera's
underline and is outlined the same way. **The slider is a bar** (`--slider-height`, 8px in globals.css) drawn as parts
that stop 2px short of a head, placed from `--slider-bar`, `--slider-head` and `--slider-gap` on its root, never
measured; its corners are half the bar, not `--radius`. Its head is a circle the bar's height merged into the lime end;
held (`data-held`), the head goes into the cursor, which stays a ring, the bar parts 2px round it, and the body follows
each head on a spring, its ends stretching as they move: the grip (Motion.md M16), `useGripMotion`. **`marks`** puts a
dot over each step (`marks={5}`, every five of the value's units) in room the slider keeps above its bar; a held head
whose cursor is in a mark's zone snaps under it, and the snap is a tick (the mark pops, the head kicks, a phone
vibrates; M21). `--slider-mark-size`, `--slider-mark-lift` and the `--motion-step-*` tokens are read, not declared.

## The files

```
src/components/*.tsx      74 components: 61 shadcn copies, edited on purpose (rule 6), and the house's 13 below
  theme-provider.tsx      `ThemeProvider`; `useThemeToggle`, through which every toggle plays the grid's sheet (Grid.md
                            D28); `useThemeFlipRegistry`, how the grid takes the toggle
  grid.tsx                the field (`Grid`, `GridItem`): `DEFAULT_GRID_CONFIG`, `GRID_SPACING`, `MIN_COLS`,
                            `resolveField`, `GRID_REFERENCE_BOX`; the theme sheet (`GridThemeFlip`, D28); the cursor
                            (`cursor`, D34, its ring an image in globals.css); the painter fed (D38); the intro's props
                            (`intro`, `introAgents`, `introActions`, `introFocus`, `introFocusAt`, `introAct`,
                            `onIntroFocus`; D50), loading grid-intro.tsx only when there is an intro
  grid-pages.tsx          `GridPages`: pages on the field and the turn (D27, D35, D37, D49; `TURN_MS`, `keyboard`)
  grid-pager.tsx          the bar on the bottom row, a slot of sub-slots (D27, D29): `defaultPagerBar`,
                            `numberedPagerBar` (D36, D46, D47)
  grid-intro.tsx          `GridIntro`: the intro played (D50, Motion.md M22), then the agents resting in their cells for
                            good (`settled`); a new focus played as a page turn by the agents
  slot.tsx                `Slot`, `SlotContent`: the box on the grid, fill · inset · alignment, a component or
                            sub-slots (Slots.md)
  registry.tsx            `Placed`: what a layout item names by `kind`, the pager's parts (the arrows as a pair; for the
                            numbered bar an arrow a cell and the pages between as one block that plays movement)
  text.tsx                `Text`: eight roles, four tones, alignment, `weight` (Type.md); every piece of text is one
  portal.tsx              `PortalContainer`, `usePortalContainer`: where a subtree's surfaces portal to, which every
                            portalling component passes through (Motion.md M8)
  agent.tsx               `Agent`: the agent drawn, one frame of `lib/sphere-motion` as an SVG group in the caller's
                            `<svg>`, in its look (shape, texture, face, colours by name, uploaded drawings). It draws,
                            never moves: a still `frame` + `look`, or `paint(frame, look)` through its ref each frame.
                            The motion studio and Orbit draw it; keep its `data-sphere-*` (e2e/agents.spec.ts)
  colour-picker.tsx       `ColourPicker`: swatches composed from `ToggleGroup`, one a colour, the picked one pressed,
                            each named in its title; every pick of a colour in every app
  liquid.tsx              `Liquid`: a box filled to `level`, its surface two flowing SVG waves (the back a tone of the
                            front mixed toward the card, never translucent), played by `useLiquidMotion` (Motion.md
                            M25); a 1 × 1 is a round glass. The status page's cells
  hiddenstack-avatar.tsx  `HiddenstackAvatar`: his rigged 3D figure on a canvas over a poster `Avatar`, three.js loaded
                            only when it mounts, posed by `rig` (`lib/human-motion`), turned by drag or the arrow keys.
                            Orbit's `/hiddenstack` page
src/hooks/*.ts            use-mobile; use-reading-focus (`useReadingFocus`, Grid.md D45: reading order over a scope a
                            page opts in, `data-reading-after` stops last); and a hook a motion, each one clock
                            handing every tick's frame to the caller's painter: use-cell-motion (`useCellMotion` M9,
                            `useCellEnter` M11), use-load-motion (M10), use-focus-motion (M13), use-mode-motion (M14),
                            use-grip-motion (M16 and the slider's steps, M21), use-liquid-motion (M25),
                            use-farewell-motion (`useFarewellMotion`: Home's closing, the plan settling onto its cells,
                            then the hero and the links, on the `--motion-farewell-*` tokens)
src/lib/utils.ts          `cn`, re-exported from the `cn` package
src/lib/motion.ts         tokens for script (Motion.md M3): `motionMs`, `motionNumber`, `motionEase` read a `--motion-*`
                            token off an element when a motion starts; `easing`, `cubicBezier` turn CSS easing into a
                            function
src/lib/*-motion.ts       a motion's pure model: its tokens read off an element, a frame for any moment, and `*_START`,
                            the values it falls back to
  cell-motion.ts          movement (M9): one-cell elements flowing onto a block as one grows (`flowSpots`,
                            `cellMotionFrame`, `travelScale`); and enter · exit (M11, `cellEnterFrame`)
  load-motion.ts          loading (M10): dashed lime rings at the centre, one a section, opening into their sections
  intro-motion.ts         the intro (M22, Grid.md D50): who opens which box, where each stands, lands and rests
                            (`introCast`, `introSpots`, `introHome`), the plan of its moves (`introPlan`), a page turn's
                            two Dives (`introGoIn`, `introGoHome`), the ripple (`introRipple`)
  focus-motion.ts         hyper focus (M13): a cloth of blur round a card, one `backdrop-filter` layer a ring. Nothing
                            round the layers may carry an opacity, a filter, a mask or `contain: paint`, and nothing in
                            their stacking context may blend unisolated: either becomes their backdrop root
  mode-motion.ts          focus mode (M14): a panel rising out of the page over one vertical, a cloth of blur round
                            it. Its layers take no clip but `inset()`: under `path()` or `polygon()` Chromium drops a
                            backdrop layer's mask and blurs everything
  grip-motion.ts          the grip (M16); spring.ts the springs it follows on (`springAt`, `springFollow`)
  step-motion.ts          the slider's marks, zones and tick (M21)
  liquid-motion.ts        liquid (M25): the waves, the bob and the pour
  sphere-motion.ts        the agent's body (M17): a sphere head and a tail settling into its nest as into a bowl, a
                            jump, a landing, its eyes and face (`sphereFrame`, `sphereCourse`, `sphereBowl`)
  human-motion.ts         the human rig: joints and their limits (`HUMAN_JOINTS`), a walk and a run
                            (`humanGaitAt`) on the `--motion-human-*` tokens, starting values
src/lib/agent-*.ts        the agent declared: `agent-body` (the body, `CharacterLook`, `resolveCharacter`),
                            `agent-face` (slots and styles, uploads), `agent-shape` (rounded solids in 3D),
                            `agent-texture` (marks drawn on the surface), `agent-colours` (`AGENT_PAINTS`, colours by
                            name), `agent-actions` (Bounce, Jump, Dive: M24)
src/lib/properties.ts     typed properties (M20): what a component can have, declared once; what he picks is data, in
                            the studios' drafts and versions
src/lib/hiddenstack-*.ts  his figure in three.js: `-model` (geometry), `-rig` (bones and weighted meshes), `-viewer`
                            (renderer, camera, controls; a GSAP ticker only while a gait plays)
src/lib/grid-layout.ts    the grid's model, pure: rects, packing, pages, derivation
src/lib/grid-field.ts     the field's painter (Grid.md D38): dashes, the pointer's cell, the intro's ripples, in a
                            worker where a canvas can be handed to one; `gridFieldPainter` stays self-contained, since
                            the worker runs it from its source text
src/styles/globals.css    Tailwind, the theme, the motion tokens and the @theme inline map: the only stylesheet
components.json           what the CLI reads; aliases resolve to `@no-origins/ui/*`
```

## Rules

1. **Add components with the CLI, never by hand**: `cd packages/ui && npx shadcn@latest add <name>`, following the
   `add-component` skill. The CLI writes into `src/components`, wires the imports to the `@no-origins/ui/*` aliases in
   `components.json`, and installs what the component needs.
2. **One stylesheet.** Tokens, the dark theme and the Tailwind map live in `src/styles/globals.css`. An app that needs a
   colour adds it there, not in the app.
3. **No barrel.** Consumers import `@no-origins/ui/components/<name>`. The `exports` map is per file on purpose: a
   barrel would pull all 74 components (61 from shadcn, 13 the house's) into every page that wanted a button.
4. **The package ships no fonts.** It reads `--font-sans`, `--font-heading` and `--font-mono`; the host declares them.
5. **`exports` maps `components/*` to `.tsx`, `lib/*` and `hooks/*` to `.ts`.** Pure logic goes in `lib/`, a hook in
   `hooks/`; a `.ts` file in `components/` is unreachable from the apps.
6. **Editing a shadcn component is allowed, and is a decision.** These are copies, not a dependency, but
   `shadcn add --overwrite` discards an edit, so say in a comment why it diverged. One edit is in nearly every file and
   has no comment of its own: sera's `rounded-none` became `rounded-lg` on every box (Grid.md D39). A component added or
   overwritten from the CLI arrives square, with underline fields and literal motion: round it, outline its fields and
   give it the motion tokens (rule 8).
7. **Motion is GSAP inside a box, and the grid's turn is not.** `gsap` animates what is inside a box (`Progress`'s
   `animate` grows the fill; most motion hooks run on its ticker, the grip on a frame loop of its own). The page turn
   keeps its own per-frame writer for the pager's arrow, which follows the hand (`grid-pages.tsx`), and fades the page
   with CSS. Two GSAP gotchas: it reads a starting transform from the computed matrix, resolved to pixels, so an
   inline `translateX(-100%)` arrives as `x` in px and an `xPercent` tween lands on top of it (pin `x: 0` in the vars);
   and drop any CSS `transition` on a property GSAP writes every frame. Reduced motion is checked in the component, not globally; `gsap.set` to the end state.
   **Never animate many elements**, from a script or from CSS: paint them, off the main thread, as the field is
   (`lib/grid-field.ts`, Grid.md D38). A custom property written every frame goes on the narrowest element that reads
   it, because it restyles everything under it. Nothing follows the pointer by being moved from a pointer event (the
   ring is a cursor image). An animation that ends where its element rests does not fill forwards.
8. **A component moves by tokens, never by literals** (Motion.md M3, M4). Every duration, easing, scale and travel is a
   `--motion-*` token in globals.css, in a family named for what the motion is for: `surface` (dialogs, menus,
   popovers, tooltips, selects; the `motion-surface` utility sets their timing, `zoom-in-(--motion-surface-scale)` and
   `slide-in-from-*-(length:--motion-surface-shift)` their travel), `panel` (sheet, drawer scrim, `motion-panel`),
   `state` (every `transition-*` without its own duration, through Tailwind's defaults in `@theme inline`), `disclose`
   (the accordion's keyframes, remapped the same way) and `grow` (`Progress`, read with `motionMs`/`motionEase`). A
   component from the CLI arrives with `duration-100`, `zoom-in-95` and `slide-in-from-top-2`: swap them for its
   family's tokens, and pass `usePortalContainer()` to its portal. Script reads a token when the motion starts, never at
   import, so the motion studio can retune it on its stage.
   - **His, in globals.css**, with `*_START` the same values: `move` (M9; play it with `useCellMotion`, which reads it
     with `readCellMotion`, and never copy its numbers), `load` (M10, the studio alone; it moves its rings as `move`'s
     dot, reading `move`'s tokens: a family that plays a part of another reads that family's tokens), `focus` (M13)
     and `mode` (M14), the studio's pages only, and `grip` with `--slider-height` (M16, every `Slider`).
   - **Read, not declared** (their `*_START` are the values): `--motion-move-enter-*` (M11), `--motion-step-*` (M21),
     `--motion-liquid-*` (M25), `--motion-intro-*` (M22), `--motion-sphere-*` (M17).
   - **Declared for an app**: `farewell` (Home's closing) and `human` (the human rig, starting values).

`pnpm --filter @no-origins/ui typecheck` checks the package on its own. Everything visual is reviewed through the
showcase and the review loop in the repo-root `CLAUDE.md`.
