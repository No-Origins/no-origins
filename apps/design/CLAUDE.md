@AGENTS.md

# apps/design — the showcase

`design.no-origins.com`. It renders the design system and nothing else. The design system is `@no-origins/ui`
and every visual decision belongs there, not here.

```bash
pnpm --filter design dev                 # :3001 (portfolio :3000, admin :3002)
```

## The shape

Three routes, rebuilt 2026-09-16 when the design system was replaced with shadcn/ui:

- `/` — what the system is and which layers exist.
- `/atoms` — the 18 indivisible components.
- `/molecules` — the 42 that compose them.
- `/grid` — the base layout, live and editable. Pages, the flip, drag, resize, undo, export, and a breakpoint
  preview that forces a narrow field onto a wide screen so derivation can be seen without resizing the window.

The three reading routes are a column of `Specimen` blocks — a name, a note, live examples — inside `Reading`,
which is the max-width column. `/grid` opts out of it: `<main>` in the layout sets no width or padding, so a page
that wants the viewport takes it. `src/components/specimen.tsx` and `src/components/showcase-nav.tsx` are the only
things this app owns.

**The nav bar is exactly `3.5rem` tall, border included.** `/grid` sizes itself with `calc(100dvh - 3.5rem)`, so
`h-14` sits on the `<header>` and not on the div inside it — with the border outside that height the page scrolled
by one pixel.

## What is true here and easy to get wrong

- **The app owns no components.** Everything it renders is imported from `@no-origins/ui/components/*`. If you find
  yourself writing a component here, it belongs in the package.
- **The specimen pages are client components.** Most of what they demo is interactive, and a page that is half
  server and half client is a page that will surprise you. Metadata lives in the layout.
- **Five components have no specimen yet** — `chart`, `combobox`, `message-scroller`, `questionnaire` and
  `direction`. Each needs a host that gives it data or a route of its own. They are installed; they are listed at
  the foot of `/molecules` so the omission stays visible.
- **The old showcase is gone.** The token screens, the registry-driven `/components/[layer]` route and the `Tool`
  shell went with the components they documented. The registry does not exist any more: there is no array to read a
  component's name and description out of, so a specimen writes its own note.
- **`/grid` is a working tool, not a specimen.** It keeps its layout in `localStorage` (key
  `no-origins:grid-playground:v2`), so what you see is whatever was last arranged — the reset button puts the seed
  back. The toolbar is the page's; every page operation it performs is a pure function from
  `@no-origins/ui/lib/grid-layout` applied to the current breakpoint's pages. It is the surface the grid system is being
  designed on; expect it to change shape often.
- **There is no database anywhere near this app** and there should not be.

## Reviewing it

`pnpm review` boots this app and sweeps its three routes on desktop and mobile in both themes — they are
`DESIGN_ROUTES` in `e2e/review.spec.ts`; add new ones when you add pages. Then open the PNGs in
`e2e/screenshots/<project>/` and look. Press `d` in the browser to switch theme by hand.
