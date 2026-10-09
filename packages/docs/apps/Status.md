# No Origins — Status

Where every app of No Origins stands, as one public page: `apps/status` on `status.no-origins.com`. Each app is a row
— its name and host, the state it is in, and a cell of liquid as full as it is far along. This document decides what
the page says and how it is laid out.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

## S1. What it is for

- **A status page is its own app, and it is public** (his, 2026-10-03). Anyone who follows the portfolio's pill can
  see it, so it is not a route of the admin, which is behind the sign-in (Admin.md §8.4). It holds no key and touches
  no database: the page is static (Admin.md §0.6), with nothing live on it yet.
- **It says where every app stands.** All nine, itself included, each one in progress today. The order is the
  repo-root CLAUDE.md's: portfolio, design, admin, engineering, motion, orbit, home, status, auth.
- **The progress is drawn, not written**: a cell beside the state, filled with flowing liquid as far as the app is
  along. 40% today for every app, his number. The page plays the design system's `Liquid` (Motion.md M25).
- **The way in is the portfolio's pill** (Portfolio.md P25): a violet dot in a circle at the field's bottom-right
  corner, which grows to "Status page ↗" under the pointer and opens this page in a new tab.

## S2. The apps and their states

The page is data: `src/content/apps.ts`, one entry an app — its id, its name, its host (which is its link), the state
it is in and how far along it is, 0 to 1. To change what the page says of an app, change it there; the page does
nothing else.

| App | Host | State | Done |
|---|---|---|---|
| Portfolio | hiddenstack.no-origins.com | In progress | 40% |
| Design | design.no-origins.com | In progress | 40% |
| Admin | admin.no-origins.com | In progress | 40% |
| Engineering | engineering.no-origins.com | In progress | 40% |
| Motion | motion.no-origins.com | In progress | 40% |
| Orbit | orbit.no-origins.com | In progress | 40% |
| Home | home.no-origins.com | In progress | 40% |
| Status | status.no-origins.com | In progress | 40% |
| Account | auth.no-origins.com | In progress | 40% |

*His:* every app in progress, and 40%. *Mine, his to change:* the order, the hosts as the apps' names, and the page
itself in the list.

## S3. The page

One route, `/`, one `Grid` with the overlay and the cursor (Grid.md D34), nothing else on the page — no nav, no
footer, nothing that scrolls. `src/components/status.tsx` arranges it on whatever field the grid reports
(`arrangeStatus`):

- **One block, centred** across the field and down it. Its first row is the page's name, "Status", a `hero` (Type.md
  T5), and under it a row an app.
- **A row is three boxes on the field's cells**: a `Card` with the app's name and its host, as wide as the field
  leaves beside the other two (three cells at the least, six at the most), which is a link to the app in a new tab, its
  border lime under the pointer; a pill two cells wide saying the state; and one cell of liquid, the design system's
  `Liquid` at the app's `done` — a cell is a circle (Grid.md D39), so it is a round glass filled to its level. The
  gutter is the margin, as everywhere on the grid: no air between the three.
- **What the field has no room for is not shown**, never scrolled: the rows hold as many apps as they can after the
  name's row. A 1440 × 900 window shows all nine; 1280 × 720, eight rows deep, shows seven and leaves the last two off.
  A phone shows all nine, the name's card three cells, the host truncated.
- **Every liquid pours in** as the page arrives (Motion.md M25's pour) and flows from then on; under reduced motion
  each stands still at its level.

*Mine, his to change:* the hero's row and the block centred; the card as a link; the name's width; what is left off a
short field.

## S4. Where it lives

| Thing | Where |
|---|---|
| The app | `apps/status`, Next.js 16, `pnpm --filter status dev` on **:3007** |
| The apps and their states (S2) | `apps/status/src/content/apps.ts` |
| The page and its arrangement (S3) | `apps/status/src/components/status.tsx` |
| The liquid, its motion and its hook (Motion.md M25) | `packages/ui/src/components/liquid.tsx`, `lib/liquid-motion.ts`, `hooks/use-liquid-motion.ts` |
| The portfolio's pill (Portfolio.md P25) | `apps/portfolio/src/components/status-pill.tsx` |
| The review sweep | `STATUS_ROUTES` in `e2e/review.spec.ts`; the server in `playwright.config.ts` |

**Public.** There is no `proxy.ts`: no gate, no sign-in, no Supabase key anywhere in the app. `next.config.ts`
transpiles the design system and nothing else. `vercel.json` is byte-identical to the other apps'.

**Deployed** on the Vercel project `status` (root directory `apps/status`, production `main`, no environment
variables, since it has no database), made by the repo-root CLAUDE.md's recipe.

## S5. Open

- **What "done" means**, and who moves it. Today it is a number written in the data. Whether it is read from
  somewhere — the repo, a document, the admin — is his to decide; the page is static until then (Admin.md §0.6: a
  component may be live).
- **States beyond "In progress"**: live, paused, planned. The pill takes any words; the liquid any level. Nothing
  names them yet.
- **A page a visitor can do nothing on.** It is a reading page; whether each row opens more — the app's own notes,
  its last release — is open.
- **The liquid's values** are the studio's starting values (`LIQUID_START`, Motion.md M25), none his yet. The
  studio's Liquid page is where he tunes them, and his pick goes to globals.css (Motion.md M7) and plays here with no
  second edit.
