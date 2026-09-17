# packages/ui — `@no-origins/ui`

The design system. shadcn/ui, style `radix-sera`, base `radix`, base colour `neutral`, `--radius: 0`, RTL on.
Rebuilt from nothing on 2026-09-16; the hand-written 1.0 system was deleted in full.

```
src/components/*.tsx    60 shadcn components + theme-provider.tsx
                        + grid.tsx, grid-pages.tsx, grid-editor.tsx — the base layout, ours (see repo-root CLAUDE.md)
src/hooks/*.ts          use-mobile.ts
src/lib/utils.ts        re-exports `cn` from the `cn` package
src/lib/grid-layout.ts  the grid's layout model as pure functions: rects, packing, pages, derivation, page ops
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

`pnpm --filter @no-origins/ui typecheck` checks the package on its own. Everything visual is reviewed through the
showcase — see the repo-root CLAUDE.md.
