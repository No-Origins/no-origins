# packages/ui — `@no-origins/ui`

The design system. shadcn/ui, style `radix-sera`, base `radix`, base colour `neutral`, `--radius: 0`, RTL on.
Rebuilt from nothing on 2026-09-16; the hand-written 1.0 system was deleted in full.

```
src/components/*.tsx    60 shadcn components + theme-provider.tsx (`useThemeToggle` — every toggle goes through the
                          grid's flip, Grid.md D28; `useThemeFlipRegistry` is how the grid takes it)
                        + grid.tsx (field, `GridThemeFlip`, D28, the intro — `intro`, `useGridIntro`, D31 — the cursor — `cursor`, `useGridCursor`, D34, its ring an image in globals.css — and `GRID_REFERENCE_BOX`), grid-pages.tsx, grid-pager.tsx — the base layout, ours
                          (see repo-root CLAUDE.md); grid-pager.tsx is the navbar on the bottom row — a slot whose
                          cells are sub-slots, width decided per breakpoint, arrows a registry molecule (Grid.md D27,
                          D29) — and grid-pages.tsx the turn (Grid.md D27, D35, D37: the hand fills the arrow,
                          the ripple washes the page away, `washAway` in grid.tsx, the next fades in). The grid renders and nothing edits it:
                          grid-editor.tsx and grid-frame.tsx went with the composer (Grid-v2.md D30, 2026-09-23)
                        + slot.tsx (the box on the grid: fill · inset · alignment; a component or sub-slots) and
                          registry.tsx (what a layout item can name by `kind`, drawn by `Placed` — the pager's
                          parts: the arrows as a pair, and one arrow or one page number a cell for the numbered
                          bar, Grid.md D36) — Slots.md
                        + text.tsx — the seven typography roles, Type.md; every piece of text in an app is a Text
src/hooks/*.ts          use-mobile.ts
src/lib/utils.ts        re-exports `cn` from the `cn` package
src/lib/grid-layout.ts  the grid's layout model as pure functions: rects, packing, pages, derivation
src/lib/grid-field.ts   the field's painter (Grid.md D38): the overlay's dashes, the lit lines, the pointer's cell and the
                          intro's reveal on two canvases, in a worker where a canvas can be handed to one. The painter
                          function must stay self-contained — the worker runs it from its own source text
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
7. **Motion is GSAP, and the grid's turn is not.** `gsap` (3.15, a dependency of this package since 2026-09-21 —
   *"can we use gsap for better animations?"*) animates what is **inside** a box: `progress.tsx` is the first, whose
   `animate` prop grows the fill from empty. The grid's page turn keeps its own per-frame writer for the pager's
   arrow, which follows the hand (`grid-pages.tsx`, Grid.md D27), and washes the boxes away with one Web Animations
   `clip-path` animation a box, stepped at the ripple's own times (`washAway` in grid.tsx, D37) — neither is a tween
   a library would help with. **Two GSAP gotchas, both paid for already:** it reads a
   starting transform from the COMPUTED matrix, which the browser has resolved to pixels, so an inline
   `translateX(-100%)` arrives as `x` in px and an `xPercent` tween lands on top of it — pin `x: 0` in the vars. And
   drop any CSS `transition` on a property GSAP writes every frame. Reduced motion is checked in the component, not
   globally; `gsap.set` to the end state.
   **The grid's field is neither** (Grid.md D31, D38): the intro's drawing, the ripple, the overlay and the lit cell
   are painted on canvases by one painter in a worker (`lib/grid-field.ts`). It was hundreds of CSS animations, one a
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

`pnpm --filter @no-origins/ui typecheck` checks the package on its own. Everything visual is reviewed through the
showcase — see the repo-root CLAUDE.md.
