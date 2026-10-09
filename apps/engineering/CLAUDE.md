@AGENTS.md

# apps/engineering — the engineering library

`engineering.no-origins.com`, :3003. Public explanations and breakdowns on one subdomain: static pieces written in the
repo on `@no-origins/ui`. No auth, no database, no public write UI.

```bash
pnpm --filter engineering dev                 # :3003
```

## Routes

- `/` — what Engineering is, and the index of pieces (one so far, the Jido tour).
- `/learn/jido` — the interactive layered tour of Jido (`components/jido-tour.tsx`, its layers in
  `components/jido-layers*.tsx`, their names in `lib/jido-meta.ts`), driven by its buttons and by ← → / Page Up · Page
  Down / Home.
- `/jido` — a redirect to `/learn/jido` (`next.config.ts`).

## The shape

**It is not on the grid.** `/` is a centred column that scrolls (`Reading`, `components/reading.tsx`, `max-w-5xl`), and
the tour is a full-height column — its head, a stage that scrolls (`overflow-y-auto`) and a footer of controls. Open:
engineering on the grid, or an exemption — his decision.

- Compose only from `@no-origins/ui/components/*` (today `Button`, `Card`, `Badge`, `Progress`, `Table`, `Tooltip`
  and the `Toaster`). A layout helper (`Reading`) may live here; a design-system primitive may not — add it with the
  shadcn CLI in `packages/ui`, or ask first.
- Fonts: `--font-sans` / `--font-heading` / `--font-mono` (Inter / Montserrat / Geist Mono), as the sibling apps.
- Open: whether the pieces move into Supabase with an MCP publish (`list` / `create` / `update` / `publish`, writers
  him and his bots) — not built, and his to decide.

## Reviewing it

`pnpm review` boots this app on :3003 and visits `ENGINEERING_ROUTES` (`/`, `/learn/jido`) in `e2e/review.spec.ts` on
desktop and mobile in both themes; CI runs the same sweep on every PR. Screenshots land as
`e2e/screenshots/<project>/engineering__<route>.png`. `/jido` is only a redirect and is not swept. Add a route to the
list when you add one.
