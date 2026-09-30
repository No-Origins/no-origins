# packages/ui — `@no-origins/ui`

The design system. shadcn/ui, style `radix-sera`, base `radix`, base colour `neutral`, RTL on, and **lime and violet
for the accents** since 2026-09-27: `--primary` lime, `--secondary` violet, `--muted` and `--accent` lime tints mixed
over the page (globals.css says what each is; the repo-root CLAUDE.md has the rule).
Rebuilt from nothing on 2026-09-16; the hand-written 1.0 system was deleted in full. **One radius, half the grid's
cell** since 2026-09-26 (Grid.md D39; it was `0`): every box is `rounded-lg`, which the browser shrinks to a pill or a
circle wherever a box is a cell or less across — a component that adds a box adds `rounded-lg`, never another radius,
and a sera component's `rounded-none` on a box is the old value, not a decision. Lines (separators, table rows) stay
straight. **The fields are boxes** since 2026-09-29 (his, D39 amended): Input, Textarea, InputGroup, the Select
triggers, the Combobox's chips, Command's search and the Questionnaire's answer are outlined pills, InputOTP's slots
circles — sera's underline fields are gone, and one added from the CLI arrives as an underline; outline it the same way.
**The slider is a bar** since 2026-09-30 (his, D39 amended): 8px tall since his second tuning of the grip (16px at
his pick, the cursor's ring, 24px, before it that day), drawn as parts that stop
2px short of a head; `--slider-bar`, `--slider-head`, `--slider-gap` on its root, and the parts placed from the values,
never measured. **Its head is merged into it** (his, the same day): a circle the bar's height over the join of the
lime and the grey, no gaps at rest; the held head (`data-held`) detaches into the cursor, which stays a ring, and the
bar parts 2px round it — the grip (Motion.md M16), `useGripMotion`. Its corners are half the bar, not `--radius`.
**The body is fluid** (his, the same night; a segmented variant was tried and taken out, Motion.md M18): it follows
each head on a spring whenever the value moves, its ends rounding when they leave the head and stretching as they
move; `--slider-height` sets the bar (8px on `:root` in globals.css with the grip's tokens, so a subtree still sets
its own).
**It can have marks** (his, the same night, Motion.md M21): `marks` puts a dot over every step's place (`marks={5}`,
every five of the value's units), in room the slider keeps above its bar; each has a zone, and a held head whose cursor
is in one snaps under the mark and takes its value. The snap, or a value landing, is the tick: the mark pops, the head
kicks, a phone vibrates. `--slider-mark-size`, `--slider-mark-lift` and the `--motion-step-*` tokens are read, never
declared; none is in globals.css yet.

```
src/components/*.tsx    61 shadcn components + theme-provider.tsx (`useThemeToggle` — every toggle goes through the
                          grid's flip, Grid.md D28; `useThemeFlipRegistry` is how the grid takes it)
                        + grid.tsx (field, `GridThemeFlip`, D28 — no loader since D49, 2026-09-30: a page is shown as
                          soon as the field is measured, and `useGridLoad` and `GridLoader` are gone — the intro, the
                          agent, D50, version 1: `intro` with `overlay`, `useGridIntro` holding the page back
                          (`data-intro`) and loading grid-intro.tsx only then — the
                          cursor — `cursor`, `useGridCursor`, D34, its ring
                          an image in globals.css, no lit cell while the grid is `data-cursor-still` — and `GRID_REFERENCE_BOX`), grid-pages.tsx, grid-pager.tsx — the base layout, ours
                          (see repo-root CLAUDE.md); grid-pager.tsx is the navbar on the bottom row — a slot whose
                          cells are sub-slots, width decided per breakpoint, arrows a registry molecule (Grid.md D27,
                          D29) — and grid-pages.tsx the turn (Grid.md D27, D35, D37, D49: the hand fills the arrow,
                          the page fades away, the next is put on the field and fades in). The grid renders and nothing edits it:
                          grid-editor.tsx and grid-frame.tsx went with the composer (Grid-v2.md D30, 2026-09-23)
                        + grid-intro.tsx — `GridIntro`, the intro played (D50): the agent in the page's
                          `data-intro-agent` circle, breathing (`sphereStill`) and hopping in place (`sphereCourse` nest to
                          nest) on GSAP's ticker, and the field's rings as one pass of its painter
                        + slot.tsx (the box on the grid: fill · inset · alignment; a component or sub-slots) and
                          registry.tsx (what a layout item can name by `kind`, drawn by `Placed` — the pager's
                          parts: the arrows as a pair, and for the numbered bar one arrow a cell and the pages
                          between as one block that plays movement, Grid.md D36, D46, D47) — Slots.md
                        + text.tsx — the seven typography roles, Type.md; every piece of text in an app is a Text
                        + portal.tsx — `PortalContainer` / `usePortalContainer`: where a subtree's surfaces portal to,
                          which every portalling component passes through (Motion.md M8); the motion studio's stage
                        + agent.tsx — THE AGENT drawn (2026-09-30, his approval; no registry has it): one frame of
                          `lib/sphere-motion` as an SVG group inside the caller's `<svg>` — the body painted in its
                          paint mixed toward black, its lit side cut to its outline, the tail cut to its nest, and the
                          face a layer of its own in the body's cut (the eyes and their lids; since version 13 a pupil or
                          a catchlight, a heavy lid's band and the brows), and a mood's symbol over the head; colours by
                          name (`ColourName`: paint, shade, deep, ink, light, the accents; `lib/agent-colours`), and
                          the uploaded drawings its look wears (`drawings`, by version id, checked by `checkDrawing`)
                          on their slots' anchors; since 2026-09-30 a SHAPE's faces where the head is not the sphere
                          (`frame.shape`, each face in its tone, `toneCss`) and a TEXTURE's tile over each face in its
                          tone (`<pattern>`s fixed to `frame.head`; Character-Studio.md C10). A still `frame` + `look`,
                          or `paint(frame, look)` through its ref every frame; it never moves itself. The motion studio's
                          stage and the character studio both draw it; keep its `data-sphere-*` (e2e/agent.spec.ts)
src/hooks/*.ts          use-mobile.ts; use-reading-focus.ts — Tab and the arrows move focus in reading order, left to
                          right and top to bottom as the boxes stand, over a scope a page opts in (Grid.md D45);
                          use-cell-motion.ts — `useCellMotion` plays movement (Motion.md M9) on a block: one GSAP clock
                          a change of the active element, each tick's `cellMotionFrame` handed to the caller's painter;
                          and `useCellEnter` plays enter and exit (M11), movement's first primitive, the same way;
                          use-load-motion.ts — `useLoadMotion` plays loading (M10): one GSAP ticker while the loader
                          turns and the sections expand, each tick's `loadFrame` handed to the caller's painter;
                          `paintLoadRing` and `paintLoadSection` are its painters; only the motion studio plays it
                          since the grid stopped loading pages (D49)
src/lib/utils.ts        re-exports `cn` from the `cn` package
src/lib/motion.ts       the motion tokens for script (Motion.md M3): `motionMs`, `motionEase` read a `--motion-*` token
                          off an element when a motion starts; `easing`/`cubicBezier` turn a CSS easing into a function
src/lib/cell-motion.ts  how one-cell elements move on the grid when one grows (Motion.md M9), pure: elements flow onto a
                          block by rows or columns (`flowSpots`), and a frame is where each ring and dot is at a time — the
                          dot's size a function of its place on the grid, seen only on the cell it leaves and the cell it
                          reaches, never over one between (`travelScale`), a dot changing lines overflowing, travelling or
                          fading; rings stay on their cells and only the active one grows and wears the lime. The motion
                          studio, the portfolio's tech column and the numbered pager bar (Grid.md D47) play it through
                          `useCellMotion`; the work menu does not yet
                          — and enter and exit (M11), movement's first primitive: one cell's element coming in and going
                          out (`readCellEnter`, `cellEnterFrame`), in place, through the cell along the flow, or rising;
                          only the studio plays it, and its `--motion-move-enter-*` tokens are not in globals.css yet
src/lib/load-motion.ts  how a page loads (Motion.md M10), pure: a square of dashed lime cells at the block's centre, one
                          a section, as near square as can be, never wider than tall (`loaderLayout`; ten stand as 3,
                          3, 3, 1), its rings turning (spin, gears, chase or
                          relay; his is chase) until released; when it is ready every ring is pressed to 0.5 at once,
                          its dashes closing into a full circle as it shrinks (his, 2026-09-28),
                          goes straight to its section's TOP-LEFT cell in one move of MOVEMENT's dot — its curve, its duration (all
                          land at once), its size by `travelScale`, unseen between the two cells (it reads the move
                          tokens with `readCellMotion`, never copies them) — is released into a plain border and opens
                          rightward and down from that corner, the border fading as the section comes in, never crossing (`openings` holds a
                          section back until a passing ring has left its box). His (2026-09-27, the `--motion-load-*`
                          tokens); the grid loaded every page with it (Grid.md D48) until D49 (2026-09-30, his: "remove
                          all the current loaders"), and the studio designs it and is all that plays it
src/lib/intro-motion.ts the intro (Motion.md M22, Grid.md D50), pure: when it breathes, hops, lands and gives way
                          (`introPlan`), and which ring of the field each cell is in, counted in whole pitches from the
                          agent's circle (`introRings`). Version 1's `--motion-intro-*` are read (`readIntroMotion`) but
                          not in globals.css: `INTRO_START` is them
src/lib/focus-motion.ts a card in focus and a CLOTH of blur round it (Motion.md M13; a cloth, not a ripple, since his
                          note the same night), pure: the field as rings measured from the card — its edges, the
                          circle through its corners, or its centre — least next to it and rising outward
                          (`focusRings`), drawn as one `backdrop-filter` layer a ring, each masked to its ring and to
                          the cloth's four edges (`focusLayerStyles`); the cloth drawn out from under the card, each
                          edge to the surface's so every corner arrives at once (`clothEdges`, `pull`); the card's
                          shadow on it as it lifts (`focusShadow`); how far out it is — drawn, strength, opacity
                          (`FocusLevel`) — and the lift written on the surface as custom properties (`paintFocus`).
                          Its `--motion-focus-*` tokens are in globals.css, his numbers since 2026-09-28 (his
                          second pick, C Unroll, tuned, since 2026-09-29);
                          `readFocusMotion` falls back to the same values (`FOCUS_START`). Nothing round the layers
                          may carry an opacity, a filter, a mask or `contain: paint`, and nothing in their stacking
                          context may blend unisolated (`mix-blend-mode`; the Avatar is `isolate` for this, 2026-09-29):
                          either becomes their backdrop root, and the grid's field under them stays sharp.
                          `hooks/use-focus-motion.ts` plays it (`useFocusMotion`: in, lift, hold, glide, out, one GSAP ticker) — the studio's page 5, named Hyper focus (the portfolio's hyper focus mode, P18 and P20, until P21 took it off on 2026-09-30)
src/lib/mode-motion.ts  focus mode (Motion.md M14), pure: a see-through panel over one vertical that rises straight
                          out of the page in 3D, its whole line there from the start (his, 2026-09-29; the line drawn
                          round it first, and the sticker's peel before that, are gone), and goes by the same steps
                          backward — the cloth, then the panel dropping (`modeOnAt`, `modeOffAt`; the lift and the
                          drop each their own time and curve, `--motion-mode-lift`, `--motion-mode-drop`) — an outline
                          whose every point is swung, lifted and projected (`modeShape`), drawn as SVG paths, the line
                          a filled band fine on the page and the border's width once up, with a shadow cut out where
                          the panel is (`paintModePanel`); the vertical under
                          it never moves or scales (his, 2026-09-28) — a cloth of blur round it — focus's field measured
                          from the panel's edges, one `backdrop-filter` layer a ring masked by four gradients
                          (`modeLayerStyles`), unfurling, swelling or fading, and attached to the panel: its hole is
                          the panel as seen, and it sets off the stagger after the lift. Its layers take no clip
                          but `inset()`: under a `path()` or a `polygon()` Chromium drops a backdrop layer's mask and
                          blurs everything. Nothing slides between verticals (his, 2026-09-29): every vertical has a
                          panel and a cloth of its own, and a switch is the one left's way out and the next one's way
                          in, from the same moment (`modeSwitchMs`); each cloth is written on its own element as
                          custom properties (`paintMode`).
                          `hooks/use-mode-motion.ts` plays it (`useModeMotion`, given one cloth a vertical, `cloths`,
                          and painting `ModeFrames`, a frame a vertical and the one `lifted`) — the studio's page 6 (the
                          portfolio's focus mode, P20, until P21 took it off on 2026-09-30); its `--motion-mode-*` tokens are in globals.css, his
                          numbers since 2026-09-29 (A As described, tuned), and `readModeMotion` falls back to the
                          same values (`MODE_START`)
src/lib/spring.ts       springs as a hand tunes them (Motion.md M16): a response (ms) and a bounce, solved in closed
                          form (`springAt`), at rest (`springSettled`), and following a moving target (`springFollow`)
src/lib/grip-motion.ts  the grip (Motion.md M16), pure: the slider's head, merged into the bar at rest, detaching into
                          the cursor while held — the bar's sides drawing back 2px clear of the ring and the head
                          going to the ring's centre — and the body following each head on a spring, its ends
                          stretching with their speed (`readGripMotion`, `gripAt`, `gripFrame`, `paintGrip`).
                          `hooks/use-grip-motion.ts` plays it on the slider (`useGripMotion`, one frame loop from a
                          hold to the end of its let go); the studio's timeline paints it from here. Its
                          `--motion-grip-*` tokens and `--slider-height` are in globals.css, his numbers since
                          2026-09-30 (A Today, tuned, his second tuning), and `GRIP_START` is the same values
src/lib/step-motion.ts  the slider's steps (Motion.md M21), pure: a mark over each step, lit where the value is and as
                          far as the body's lime still reaches (`markLit`); a zone round each that a held head snaps
                          into (`zoneOf`); and the tick — the mark's pop (`stepPopAt`), the head's kick on the same
                          curve and a vibration where the browser can (`stepHaptic`). `useGripMotion` plays it with the
                          grip, on the same loop. None of its tokens is in globals.css: `STEP_START` is version 1's
src/lib/motion-states.ts states (Motion.md M19, 2026-09-30), pure: a motion as he builds it on the studio's timeline —
                          a state a named window (start, end, a unit, the event that plays it) of rows, each a part
                          configured over a span or another state attached, linked, top to bottom in priority
                          (`flattenState`, `stateValuesAt`: rows that overlap both play, and where two set the same value
                          the higher wins; `canAttach`). No family is built from states since the pill agent was
                          deleted (M12, 2026-09-30); which one will be waits for the property model (M20)
src/lib/sphere-motion.ts the sphere, the AGENT since version 11 (Motion.md M17, 2026-09-30), pure: seen from the side, a sphere head
                          and a rubbery tail (a chain of discs hulled together, filled nonzero, one shade band down its
                          dark side). It settles into the bottom of its nest's circle as into a bowl — its outline a
                          circle cut by the nest's, keeping its area as it spreads, smoothed as soft as its `body`
                          (ball · jelly · slime) — its tail behind the page and, in a nest, cut to the nest's circle; a jump is a crouch, an arc under one
                          gravity to the nest its Columns and Rows reach (`sphereJump`), and a landing that is a slippery ball in
                          a bowl, simulated at a fixed step — touching down on the side it comes from, keeping some of
                          its speed along the bowl, sliding, rocking, its jelly swaying — the nest dipping (`sphereCourse`, `sphereStill`); the tail is a
                          spring chain stepped at a fixed 240Hz from the jump's start, drawn only in front of the page
                          (`sphereSpine`); `sphereFrame` draws it — and its eyes (version 11): circles riding the head as it
                          is drawn, looking where it goes (`aimOf`), their lids blinking on their own clock and squinting
                          shut as it lands; and since version 13 its face's parts (M20's face version 1): a pupil or a
                          catchlight, upper lids plain or heavy with an open, a slant and a curve, lower lids rising from
                          below, brows (line, arch, bushy), a mood's symbol by the head, and a pair's right side set
                          apart (`right`) — `faceAt`, `browOf`, `symbolOf`; `faceAnchors`, where each slot's parts sit on a round head at rest
                          (the upload templates'). One reader behind it, `sphereMotionFrom` (a
                          `SphereSource`), so tokens off an element (`readSphereMotion`) and a character's look
                          (`agent-body`'s `sphereMotionOf`) draw the same agent. None of its `--motion-sphere-*` tokens
                          is in globals.css: `SPHERE_START` is version 15's (his version 14 as it looks, slime spreading at 1.2 so Spread is 0.11), and the face's parts left off
src/lib/properties.ts   typed properties (Motion.md M20, 2026-09-30), pure: what a component can have, declared once — a
                          type (number, angle, duration, colour, choice, switch, drawing) and its meta (label, touches,
                          range, step, default) and where its rest is designed (`set`: the look, or motions);
                          `checkValue`, `eases`, `defaultsOf`, `COLOUR_NAMES`. The declaration is code; what he picks
                          is data, in the studios' drafts and versions (supabase `studio_*`)
src/lib/agent-face.ts   the agent's FACE declared (M20's face version 1, his "yes for both"): slots (eyes, pupils, upper
                          and lower lids, brows, symbols), each a style and its settings; `FaceLook`, what a look holds
                          of it (a pair's right side apart), `checkFace`; an uploaded style is `upload:<version id>`,
                          its drawing a `DrawingData` in its slot's own space (`checkDrawing`)
src/lib/agent-shape.ts  the agent's SHAPES (Character-Studio.md C10; C12, version 3: ROUNDED SOLIDS IN 3D), pure: a cube,
                          pyramid, hemisphere, cylinder, hexagonal prism or cone, each a core grown by a ball `RHO` wide
                          (`roundedMesh`: faces moved out, a band of facets an edge, a fan a corner; made once), in the
                          room the sphere's head takes (`shapeFrame`), turned by `rotate-x/y/z` and seen in perspective
                          from in front and above (each shape's natural view, `VIEWS`), a tone a facet from its normal
                          (facets of one tone one path; the `Agent` has 40 face slots), its outline the hull (round) or
                          the edges no two shown facets share (flat), its
                          face laid on its front by a matrix (`face`, `faceShown`; the frame's `faceTransform`), standing on the
                          sphere's bottom so it rests on the nest's floor (his: "any character will rest on the nest"),
                          its underside carried onto the bowl both ways, a cylinder into the page (`giveOf`, his: "they are
                          slimy … super smooth": every point a smooth function of the turn, no slots, no snapping),
                          so nothing passes the ring and the `Agent`'s bowl cut is only a guard; `front` is where its face is drawn round. `sphereFrame`
                          calls it when `m.shape` is not the sphere; the sphere's own drawing is untouched
src/lib/agent-texture.ts the agent's TEXTURES (C15, version 5: HAND-DRAWN ON THE SURFACE, 2026-09-30), pure: twenty-one
                          kinds of marks (stripes, zebra, meridians, latitudes, contours, spiral, strata, waves, chevron,
                          hatch, grid, bricks, weave, scales, honeycomb, crackle, woodgrain, marble, dots, splatter,
                          smears) drawn by hand on a PATCH of surface (`marksOn`, a seeded WOBBLE), each point carried
                          onto the surface, culled where it faces away and projected as the body is (`drawTexture`); a
                          solid declares its patches (`Solid.patches` in agent-shape), the sphere is `SPHERE_PATCH`; the
                          Agent paints the groups (`TextureGroup`, one a tone) in `data-agent-texture`; DEPTH is
                          the body's tone in flat bands (`bandsOf` in sphere-motion, the round solids in agent-shape).
                          Defaults none and 0: the body draws as it always has
src/lib/agent-colours.ts the agent's colours by name (`agentColours`), a face's tone (`toneCss`), and its PAINTS
                          (`AGENT_PAINTS`): lime, violet and, since 2026-09-30, five of its own (`--agent-*` in
                          globals.css, each with its ink) — the agent's, not the system's palette
src/lib/agent-body.ts   the agent's BODY declared (head with its shape, tail, jump, bounce, slide, rest, surface; version 12's defaults), and a
                          CHARACTER: `CharacterLook` ({ body, face }), `checkCharacter`, `resolveCharacter` (kept whole:
                          a version freezes every value, Admin.md §7), `sphereMotionOf` (the agent a look makes)
src/lib/grid-layout.ts  the grid's layout model as pure functions: rects, packing, pages, derivation
src/lib/grid-field.ts   the field's painter (Grid.md D38): the overlay's dashes and the pointer's cell, in a worker where a
                          canvas can be handed to one. It still carries the intro's passes and reveal (the lit lines),
                          which nothing sends since D48. The painter function must stay self-contained — the worker runs
                          it from its own source text
src/styles/globals.css  Tailwind + the theme + the @theme inline map — the only stylesheet in the workspace
components.json         what the CLI reads; aliases resolve to @no-origins/ui/*
```

## Rules

1. **Add components with the CLI, never by hand.** `cd packages/ui && npx shadcn@latest add <name>`. It writes into
   `src/components`, wires the imports to the `@no-origins/ui/*` aliases in `components.json`, and installs whatever
   the component needs.
2. **One stylesheet.** Tokens, the dark theme and the Tailwind map live in `src/styles/globals.css`. An app that
   needs a colour adds it there, not in the app.
3. **No barrel.** Consumers import `@no-origins/ui/components/<name>`. The `exports` map is per-file on purpose:
   a barrel would pull all sixty-two components into every page that wanted a button.
4. **The package ships no fonts.** It reads `--font-sans`, `--font-heading` and `--font-mono`; the host declares them.
5. **`exports` maps `components/*` to `.tsx` and `lib/*` to `.ts`.** A pure-logic module goes in `lib/`; a
   `.ts` file in `components/` is unreachable from the apps.
6. **Editing a shadcn component is allowed, and is a decision.** These are copies, not a dependency — that is the
   point of shadcn. But `shadcn add --overwrite` will discard your edit, so say in a comment why it diverged.
   One edit is in nearly every file and has no comment of its own: sera's `rounded-none` became `rounded-lg` on every
   box (Grid.md D39). A component added or overwritten from the CLI arrives square; round it the same way.
7. **Motion is GSAP, and the grid's turn is not.** `gsap` (3.15, a dependency of this package since 2026-09-21 —
   *"can we use gsap for better animations?"*) animates what is **inside** a box: `progress.tsx` is the first, whose
   `animate` prop grows the fill from empty, and the motion studio's loading turns and opens on its ticker. The
   grid's page turn keeps its own per-frame writer for the pager's arrow, which follows the hand (`grid-pages.tsx`,
   D27) — not a tween a library would help with — and fades the page away with CSS. It washed the boxes away with one
   Web Animations `clip-path` animation a box, stepped at the ripple's times, until D48. **Two GSAP gotchas, both paid for already:** it reads a
   starting transform from the COMPUTED matrix, which the browser has resolved to pixels, so an inline
   `translateX(-100%)` arrives as `x` in px and an `xPercent` tween lands on top of it — pin `x: 0` in the vars. And
   drop any CSS `transition` on a property GSAP writes every frame. Reduced motion is checked in the component, not
   globally; `gsap.set` to the end state.
   **The grid's field is neither** (Grid.md D31, D38): the overlay and the lit cell — and until D48 the intro's
   drawing and the ripple — are painted on canvases by one painter in a worker (`lib/grid-field.ts`). It was hundreds of CSS animations, one a
   cell — and before that a per-frame script writing every cell — and each way the page's own load paid for it: 216
   layers made at once, cells handed out from the main thread that went missing when it was busy (measured in WebKit,
   2026-09-25). Never animate many elements, from a script or from CSS: paint them, off the main thread.
   Three more from the ripple between pages (D32), each a dropped frame: a custom property written every frame goes on
   the narrowest element that reads it, because it restyles everything under it; many identical glows are a
   box-shadow, whose blur is cached, not a `filter: drop-shadow`, which is rasterised per element; and hundreds of
   animations are handed out a few frames before they are due, not all at once, because each is a new layer. And two
   from the cursor and the scroll (D34, D35, 2026-09-25): nothing follows the pointer by being moved from a pointer
   event — any move cost a whole-page layerize, so the ring is a cursor image — and an animation that ends where its
   element rests does not fill forwards, because every finished fill stays in effect and weighs on the compositor.
8. **A component moves by tokens, never by literals** (Motion.md M3, M4, 2026-09-27). Every duration, easing, scale and
   travel a component animates by is a `--motion-*` token in globals.css, in a family named for what the motion is
   for: `surface` (dialogs, menus, popovers, tooltips, selects — the `motion-surface` utility sets their in and out
   timing, and `zoom-in-(--motion-surface-scale)`, `slide-in-from-*-(length:--motion-surface-shift)` their travel),
   `panel` (sheet, drawer scrim, `motion-panel`), `state` (every `transition-*` without its own duration, through
   Tailwind's defaults in `@theme inline`), `disclose` (the accordion's keyframes, remapped the same way) and `grow`
   (`Progress`, read with `motionMs`/`motionEase` off its own element). A component added from the CLI arrives with
   shadcn's `duration-100`, `zoom-in-95` and `slide-in-from-top-2`: swap them for its family's tokens, as for the
   radius (rule 6), and pass `usePortalContainer()` to its portal. Script reads a token when the motion starts, never
   at import, so the motion studio (`apps/motion`) can retune it on its stage. **`move`** (one-cell elements moving
   when one grows, M9) is his (2026-09-27): play it with `useCellMotion`, which reads it off the block with
   `readCellMotion(el)` and draws `cellMotionFrame`, and never copy its numbers. **`load`** (how a page loads, M10) is
   his too, the same night: its `--motion-load-*` tokens are in globals.css, `readLoadMotion`'s fallbacks are the same
   values, and `useLoadMotion` plays it — the studio alone since no page loads with it (Grid.md D49). It moves its rings as `move`'s dot, read off the
   page with `readCellMotion`: a family that plays a part of another reads that family's tokens, never copies them.
   **`focus`** (hyper focus, M13) and **`mode`** (focus mode, M14) are his as well, both last picked on 2026-09-29:
   their `--motion-focus-*` and `--motion-mode-*` tokens are in globals.css, `FOCUS_START` and `MODE_START` are the
   same values, and `useFocusMotion` and `useModeMotion` read them off their surface — the studio's pages 5 and 6 (the portfolio's two modes
   until 2026-09-30, Portfolio.md P21). **`grip`** (the slider, M16) is his since 2026-09-30: its `--motion-grip-*`
   tokens and the bar's `--slider-height` are in globals.css, `GRIP_START` and the slider's fallback are the same,
   and `useGripMotion` reads them off the slider — every `Slider`, in every app.

`pnpm --filter @no-origins/ui typecheck` checks the package on its own. Everything visual is reviewed through the
showcase — see the repo-root CLAUDE.md.
