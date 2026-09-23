# packages/ui — `@no-origins/ui`

The design system. shadcn/ui, style `radix-sera`, base `radix`, base colour `neutral`, `--radius: 0`, RTL on.
Rebuilt from nothing on 2026-09-16; the hand-written 1.0 system was deleted in full.

```
src/components/*.tsx    60 shadcn components + theme-provider.tsx (`useThemeToggle` — every toggle goes through the
                          grid's flip, Grid.md D28; `useThemeFlipRegistry` is how the grid takes it)
                        + grid.tsx (field, `GridThemeFlip`, D28, and `GRID_REFERENCE_BOX`), grid-pages.tsx, grid-pager.tsx — the base layout, ours
                          (see repo-root CLAUDE.md); grid-pager.tsx is the navbar on the bottom row — a slot whose
                          cells are sub-slots, width decided per breakpoint, arrows a registry molecule (Grid.md D27,
                          D29) — and grid-pages.tsx the turn (Grid.md D27). The grid renders and nothing edits it:
                          grid-editor.tsx and grid-frame.tsx went with the composer (Grid-v2.md D30, 2026-09-23)
                        + slot.tsx (the box on the grid: fill · inset · alignment; a component or sub-slots) and
                          registry.tsx (what a layout item can name by `kind`, drawn by `Placed` — one entry left,
                          the pager's arrows) — Slots.md
                        + text.tsx — the seven typography roles, Type.md; every piece of text in an app is a Text
src/hooks/*.ts          use-mobile.ts
src/lib/utils.ts        re-exports `cn` from the `cn` package
src/lib/grid-layout.ts  the grid's layout model as pure functions: rects, packing, pages, derivation
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
   `animate` prop grows the fill from empty. The grid's page turn keeps its own per-frame writer and `clip-path`
   (`grid-pages.tsx`, globals.css, Grid.md D27) because it is one proportion shared by every box and the pager's
   arrow, which a tween library would only get in the way of. **Two GSAP gotchas, both paid for already:** it reads a
   starting transform from the COMPUTED matrix, which the browser has resolved to pixels, so an inline
   `translateX(-100%)` arrives as `x` in px and an `xPercent` tween lands on top of it — pin `x: 0` in the vars. And
   drop any CSS `transition` on a property GSAP writes every frame. Reduced motion is checked in the component, not
   globally; `gsap.set` to the end state.

`pnpm --filter @no-origins/ui typecheck` checks the package on its own. Everything visual is reviewed through the
showcase — see the repo-root CLAUDE.md.
