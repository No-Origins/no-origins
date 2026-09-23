@AGENTS.md

# apps/engineering — the engineering publish library

`engineering.no-origins.com`. Public explanations and breakdowns on one subdomain. Layer A is a
static/seeded shell on `@no-origins/ui`; Layer B (later) moves pieces into Supabase + MCP publish.
No auth, no public write UI, no canvas/tldraw in A.

```bash
pnpm --filter engineering dev                 # :3003 (portfolio :3000, design :3001, admin :3002)
```

## Routes (Layer A)

- `/` — what Engineering is + index of pieces (starts with Jido).
- `/learn/jido` — client interactive layered Jido tour (ported from the CoS HTML deck into React).
- `/jido` — redirect → `/learn/jido`.

Later (B): `/learn/[slug]` driven from Supabase published pieces.

## Shape

- Compose only from `@no-origins/ui/components/*`. Layout helpers (`Reading`) may live here; do not invent
  design-system primitives — add via shadcn CLI in `packages/ui` or ask first.
- Fonts: `--font-sans` / `--font-heading` / `--font-mono` (Inter / Montserrat / Geist_Mono) like sibling apps.
- Jido tour uses a fuller-height shell (sticky meta + scrollable stage + footer nav) but still system
  Button / Card / Badge / Progress / Table.

## Layer A vs B

- **A (this PR):** static seed. First piece is the Jido tour in-repo. No Supabase, no MCP.
- **B (next):** pieces table; MCP `list` / `create` / `update` / `publish`; writers = Bhargav + bots only.

## Reviewing it

In the sweep since 2026-09-23: `pnpm review` boots this app on :3003 with the portfolio and the showcase and visits
`ENGINEERING_ROUTES` (`/`, `/learn/jido`) in `e2e/review.spec.ts` on desktop and mobile in both themes; CI runs the
same sweep on every PR. Screenshots land as `e2e/screenshots/<project>/engineering__<route>.png`. `/jido` is only a
redirect and is not swept. Add a route to the list when you add one.

## Non-goals (A)

Auth, CMS UI, search, full MDX pipeline, Supabase, MCP publish, tldraw/canvas, new UI primitives.
