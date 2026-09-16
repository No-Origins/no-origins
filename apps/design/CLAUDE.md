@AGENTS.md

# apps/design — the showcase

`design.no-origins.com`. What it is and why is Design-System.md **§14 step 14**; read that before changing the
shape of it. The design system is `@no-origins/ui` and every visual decision belongs there, not here.

```bash
pnpm --filter design dev                 # :3001 (portfolio :3000, admin :3002)
```

## The shape

Eleven screens under two headings, and both halves are generated rather than listed:

- **Tokens** — `/tokens` plus a screen per group. The list is `src/content/tokens.ts`; the menu's children and each
  screen's title and lead all read it, so a new token screen is one entry there plus a folder.
- **Components** — `/components` plus `/components/[layer]`, a dynamic route over the registry's `layers`. Adding a
  layer to the package adds its screen. The entries themselves are never listed here: the cards, the counts, the A–Z
  finder and the catalogue all come from `@no-origins/ui/registry`.

## What is true here and easy to get wrong

- **It is a Tool, not a Page** (since 2026-09-16). `Tool` + `ToolScreen` + the `Menu`, the same shell as the admin.
  `Page`, `NavBar` and `Footer` are not used here any more — the portfolio's `(page)` group is where they live.
  The `Menu` has one width: a column at 280 from 900 up, a sheet below it. The rail form and its collapse went in
  v1 (Atomic.md D13).
- **Nothing about a component is written in this app.** If you find yourself typing a component's name, a prop or a
  description into a page here, it belongs in the registry: the admin renders the same `Catalogue` from the same
  array, and a second description is how the two start disagreeing.
- **The menu is a client island, so what it imports ships to the browser.** It takes the layer counts as props from
  the layout because importing the registry to count to three would pull every component in the package with it.
  `src/content/tokens.ts` is safe there only because it is plain data.
- **The `Menu` falls back to a label's first letter** in its sheet form. Two top-level items starting with the same
  letter are two identical glyphs on a phone. Check a mobile screenshot after renaming one.
- **There is no database anywhere near this app** and there should not be. R3: tokens are the package's, a change is
  a code change and a deploy, and that is what lets `@no-origins/ui` stand alone on npm.

## Reviewing it

`pnpm review` covers every route here — they are `DESIGN_ROUTES` in `e2e/review.spec.ts`; add new ones when you add
pages. Narrow with `pnpm review -g "design"`, then open the PNGs in `e2e/screenshots/<project>/` and look.
