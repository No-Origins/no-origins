@AGENTS.md

# apps/status — Status

`status.no-origins.com`, :3007. **Where every app of No Origins stands**, one public page: a row an app — its name and
host, the state it is in, and a cell of liquid as full as it is far along. **Status.md** is its document; read it
before changing anything here.

```bash
pnpm --filter status dev              # :3007
```

## The shape

**The page is data** (S2): `src/content/apps.ts` is every app of the repo-root CLAUDE.md — nine, the login among them —
with its host, its state and how far along it is, 0 to 1: every one "In progress" at 0.4 today, his number. To change
what the page says of an app, change it there. `src/components/status.tsx` is the page: one `Grid` with the overlay
and the cursor, and `arrangeStatus` placing one centred block on whatever field the grid reports — the name's row (a
`hero`, Type.md T5), then a row an app of three boxes on the field's cells: a `Card` with the name and the host, a link
to the app in a new tab, as wide as the field leaves (three to six cells); a pill two cells wide with the state; and a
cell of the design system's `Liquid` (`@no-origins/ui/components/liquid`, Motion.md M25) at the app's level. What the
field has no room for is not shown, never scrolled (S3).

**Public, and nothing near it.** No `proxy.ts`, no sign-in, no Supabase key, no database: the page is static. Do not add
a gate here — signing in is the login app's (`auth.no-origins.com`), and this page is for anyone.

**The liquid is the design system's, and its motion is the studio's.** `Liquid` reads the `--motion-liquid-*` tokens
off its own box; none is in globals.css yet, so it plays version 1's values (`LIQUID_START`). He tunes it on the motion
studio's Liquid page, and his pick lands in globals.css (Motion.md M7) and plays here with no edit. Never copy a value
of the motion into this app.

## What is true here and easy to get wrong

- **The app owns no components.** Everything visible is from `@no-origins/ui/components/*`; the page composes `Grid`,
  `GridItem`, `Card`, `Text` and `Liquid`.
- **Deployed** on the Vercel project `status` (root directory `apps/status`, production `main`, no environment
  variables). The portfolio's status pill (Portfolio.md P25) points here.
- **Turbopack caches the design system's `exports` map.** If `@no-origins/ui/globals.css` is reported as not exported,
  stop the dev server and delete `.next/dev/cache`.

## Reviewing it

In the sweep: `pnpm review` boots this app on :3007 and screenshots `/` (`STATUS_ROUTES` in `e2e/review.spec.ts`) on
desktop and mobile in both themes. `node e2e/.mcp/status-shot.mjs <outdir>` (gitignored) waits for the server and
shoots the page at 1440 × 900, on a Pixel 7 and at 1280 × 720, logging every box, the liquids and the scroll size, which
must equal the viewport.
