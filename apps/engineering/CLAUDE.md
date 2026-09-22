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

## Review sweep TODO

`pnpm review` currently boots only the design showcase on :3001. When convenient, add
`ENGINEERING_ROUTES = ["/", "/learn/jido"]` and a `webServer` entry for
`pnpm --filter engineering dev` on :3003 in `e2e/review.spec.ts` / `playwright.config.ts`.
Until then, review this app by running the filter and looking by hand — do not break the design-only sweep.

## Non-goals (A)

Auth, CMS UI, search, full MDX pipeline, Supabase, MCP publish, tldraw/canvas, new UI primitives.
