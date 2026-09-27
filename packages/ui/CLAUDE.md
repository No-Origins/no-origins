# packages/ui — `@no-origins/ui`

The design system. shadcn/ui, style `radix-sera`, base `radix`, base colour `neutral`, RTL on, and **lime and violet
for the accents** since 2026-09-27: `--primary` lime, `--secondary` violet, `--muted` and `--accent` lime tints mixed
over the page (globals.css says what each is; the repo-root CLAUDE.md has the rule).
Rebuilt from nothing on 2026-09-16; the hand-written 1.0 system was deleted in full. **One radius, half the grid's
cell** since 2026-09-26 (Grid.md D39; it was `0`): every box is `rounded-lg`, which the browser shrinks to a pill or a
circle wherever a box is a cell or less across — a component that adds a box adds `rounded-lg`, never another radius,
and a sera component's `rounded-none` on a box is the old value, not a decision. Lines (underline fields, separators)
stay straight.

```
src/components/*.tsx    60 shadcn components + theme-provider.tsx (`useThemeToggle` — every toggle goes through the
                          grid's flip, Grid.md D28; `useThemeFlipRegistry` is how the grid takes it)
                        + grid.tsx (field, `GridThemeFlip`, D28, the loader — `useGridLoad`, `GridLoader`, D48: the
                          intro, `intro`, 2s at the least, and a page change with images to load; boxes sharing a
                          `data-load-section` are one section, one ring — the cursor — `cursor`, `useGridCursor`, D34, its ring
                          an image in globals.css — and `GRID_REFERENCE_BOX`), grid-pages.tsx, grid-pager.tsx — the base layout, ours
                          (see repo-root CLAUDE.md); grid-pager.tsx is the navbar on the bottom row — a slot whose
                          cells are sub-slots, width decided per breakpoint, arrows a registry molecule (Grid.md D27,
                          D29) — and grid-pages.tsx the turn (Grid.md D27, D35, D37, D48: the hand fills the arrow,
                          the page fades away, the next is put on the field and the grid loads it). The grid renders and nothing edits it:
                          grid-editor.tsx and grid-frame.tsx went with the composer (Grid-v2.md D30, 2026-09-23)
                        + slot.tsx (the box on the grid: fill · inset · alignment; a component or sub-slots) and
                          registry.tsx (what a layout item can name by `kind`, drawn by `Placed` — the pager's
                          parts: the arrows as a pair, and for the numbered bar one arrow a cell and the pages
                          between as one block that plays movement, Grid.md D36, D46, D47) — Slots.md
                        + text.tsx — the seven typography roles, Type.md; every piece of text in an app is a Text
                        + portal.tsx — `PortalContainer` / `usePortalContainer`: where a subtree's surfaces portal to,
                          which every portalling component passes through (Motion.md M8); the motion studio's stage
src/hooks/*.ts          use-mobile.ts; use-reading-focus.ts — Tab and the arrows move focus in reading order, left to
                          right and top to bottom as the boxes stand, over a scope a page opts in (Grid.md D45);
                          use-cell-motion.ts — `useCellMotion` plays movement (Motion.md M9) on a block: one GSAP clock
                          a change of the active element, each tick's `cellMotionFrame` handed to the caller's painter;
                          and `useCellEnter` plays enter and exit (M11), movement's first primitive, the same way;
                          use-load-motion.ts — `useLoadMotion` plays loading (M10): one GSAP ticker while the loader
                          turns and the sections expand, each tick's `loadFrame` handed to the caller's painter;
                          `paintLoadRing` and `paintLoadSection` are the painters the grid and the studio both use
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
                          goes straight to its section's TOP-LEFT cell in one move of MOVEMENT's dot — its curve, its duration (all
                          land at once), its size by `travelScale`, unseen between the two cells (it reads the move
                          tokens with `readCellMotion`, never copies them) — is released into a plain border and opens
                          rightward and down from that corner, the border fading as the section comes in, never crossing (`openings` holds a
                          section back until a passing ring has left its box). His (2026-09-27, the `--motion-load-*`
                          tokens); the grid loads every page with it (Grid.md D48), and the studio designs it
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
   a barrel would pull all sixty components into every page that wanted a button.
4. **The package ships no fonts.** It reads `--font-sans`, `--font-heading` and `--font-mono`; the host declares them.
5. **`exports` maps `components/*` to `.tsx` and `lib/*` to `.ts`.** A pure-logic module goes in `lib/`; a
   `.ts` file in `components/` is unreachable from the apps.
6. **Editing a shadcn component is allowed, and is a decision.** These are copies, not a dependency — that is the
   point of shadcn. But `shadcn add --overwrite` will discard your edit, so say in a comment why it diverged.
   One edit is in nearly every file and has no comment of its own: sera's `rounded-none` became `rounded-lg` on every
   box (Grid.md D39). A component added or overwritten from the CLI arrives square; round it the same way.
7. **Motion is GSAP, and the grid's turn is not.** `gsap` (3.15, a dependency of this package since 2026-09-21 —
   *"can we use gsap for better animations?"*) animates what is **inside** a box: `progress.tsx` is the first, whose
   `animate` prop grows the fill from empty, and the grid's loader (Grid.md D48) turns and opens on its ticker. The
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
   values, and `useLoadMotion` plays it — the grid, loading every page (Grid.md D48), and the studio. It moves its rings as `move`'s dot, read off the
   page with `readCellMotion`: a family that plays a part of another reads that family's tokens, never copies them.

`pnpm --filter @no-origins/ui typecheck` checks the package on its own. Everything visual is reviewed through the
showcase — see the repo-root CLAUDE.md.
