# no-origins

The rules for working in this repository: what is here, the design system, how he works, the grid, and how it all
builds and ships. Every agent session loads this file; `AGENTS.md` points Codex here.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

## What is here

A pnpm workspace (`apps/*`, `packages/*`, `supabase`) of nine Next.js 16 apps. Each app has its own `CLAUDE.md`: read
it before editing the app (its `AGENTS.md` points there and carries the Next.js rules `next dev` writes).

| App | Folder | Host | Port | What it is |
|---|---|---|---|---|
| Portfolio | `apps/portfolio` | hiddenstack.no-origins.com (bhargav.no-origins.com redirects) | 3000 | His portfolio: one agent's section a page, turned by the agents (Portfolio.md P24) |
| Showcase | `apps/design` | design.no-origins.com | 3001 | The design system's specimens, atoms and molecules |
| Admin | `apps/admin` | admin.no-origins.com | 3002 | People, Roles, Invitations, Audit and Settings (Access.md); `admin.open` and a second factor |
| Engineering | `apps/engineering` | engineering.no-origins.com | 3003 | The engineering publish library: public explanations, no auth |
| Motion studio | `apps/motion` | motion.no-origins.com | 3004 | Where the system's motion is designed (Motion.md); `motion.open` |
| Orbit | `apps/orbit` | orbit.no-origins.com (character.no-origins.com 308s here) | 3005 | The agents' looks (Orbit.md); open to everyone, publishing the owner's (C24) |
| Home | `apps/home` | home.no-origins.com | 3006 | A three.js model of the house he is building, and its tour (Home.md); `home.open` |
| Status | `apps/status` | status.no-origins.com | 3007 | Where every app stands; public, no database (Status.md) |
| Login | `apps/auth` | auth.no-origins.com | 3008 | Signing in, making an account, the apps one may open, one's account (Admin.md §8.4) |

- **`packages/ui`** (`@no-origins/ui`, 2.0.0): the design system, consumed from source; its rules are in
  `packages/ui/CLAUDE.md`. **`packages/auth`** (`@no-origins/auth`): the one sign-in, below.
- **`packages/docs`** (`@no-origins/docs`): every document that decides something, in `brand/`, `system/` and `apps/`;
  `README.md` is the index. It builds nothing. Documents and source comments cite a document by bare filename and ID
  (`Grid.md D39`), never by path, and cite only IDs the document defines.
- **`supabase/`** (`@no-origins/supabase`): the database (schema, RLS, the allowlist gate, both buckets, the access
  tests; `supabase/README.md`), a workspace package with only a `package.json` so a change here rebuilds no app.
- **`services/agents`**: the agents harness (Brand.md §1), a Mix application on Jido, OTP app `:agents`, supervised as
  `Agents.Jido`, outside the pnpm workspace: `cd services/agents && mix test`. The Next apps do not import it; a screen
  for it is a block on the grid that talks to this runtime. Agent lifecycle stays on the BEAM. The swarm does not
  write `packages/ui`, the portfolio, or the publish bucket.

**Orbit** is the six agents together (Bali, Kino, Zaza, Oru, Mira, Lola; Agents.md) and the app where they are made
(Orbit.md C21). A *character* is one agent's look: `CharacterLook`, the database's rows of kind `character`. **Home's
house is not in the repo** (Home.md H4): it lives in `apps/home/src/content` (gitignored) and the private Vercel Blob
store `home-house`; `pnpm --filter home publish:house` fills the store, and running it is his call.

**The page is static; a component may be live** (Admin.md §0.6). A page's structure is served from the edge, never
queried at visit; the portfolio and the showcase hold no database key for anything they render. A component that needs
live data declares it, fetches with the anon key through a per-table RLS policy, and has a fallback state. The showcase
and engineering have no database anywhere near them, deliberately.

**The sign-in.** `packages/auth` (Admin.md §8.4) holds the Supabase clients, the gate (`authGate`, from each app's
`proxy.ts`), the callback, the sign-out, the login cards and the sign-in screen: one session for every app (the cookie
is on `.no-origins.com`), one allowlist.

- **Permissions are code; roles are his** (Access.md). A permission is declared in `packages/auth/src/permissions.ts`
  with a migration calling `noo_permission_upsert` in the same change (the typecheck fails when they disagree). Every
  database rule asks `noo_can()`; the token carries the permissions.
- **The gate's `permission`** (`admin.open`, `motion.open`, `home.open`) sends an account without it to the no-access
  card; `motion.open` alone tries every control and saves nothing. An `admin.*` permission counts only after a second
  factor (Access.md A12). Orbit's gate is `open`: it refreshes the session, and RLS decides who may publish.
- **Without its two keys the gate refuses in production.** On a development server with none, the motion studio, Home
  and the login open (`openWithoutKeys`) and Orbit opens anywhere, so CI and a fresh clone see them.
- **The login app is built and deployed; the gates do not use it yet**: each still sends people to its own `/sign-in`
  until the next part of Access.md A11's step 5 points them at auth.no-origins.com.
- `npx supabase test db` runs the access tests. On the hosted project a hook change is `db push`, then `config push`;
  `[remotes.production]` in `config.toml` keeps a push to what was meant.

## The design system

shadcn/ui, style `radix-sera`, base `radix`, base colour `neutral`, RTL on: 74 components in
`packages/ui/src/components`, 61 from shadcn and 13 of the house's (`grid`, `grid-pages`, `grid-pager`, `grid-intro`,
`slot`, `registry`, `text`, `portal`, `theme-provider`, `agent`, `colour-picker`, `liquid`, `hiddenstack-avatar`).

1. **Build UI only from the design system.** Every visible element in every app is composed from `@no-origins/ui`:
   never a hand-rolled control, a raw styled element standing in for one, or a component copied from elsewhere. When
   one is missing, add it with the CLI (`cd packages/ui && npx shadcn@latest add <name>`; the `add-component` skill is
   the procedure) or **stop and ask**: he asks for the exception, or you propose it and he approves it first. An app may
   compose system components into an island; it may not invent primitives. Layout utilities are not components.
2. **Import a component by its own path** (`@no-origins/ui/components/button`). There is no barrel, and should not be.
3. **One stylesheet**, `packages/ui/src/styles/globals.css` (Tailwind, `tw-animate-css`, `shadcn/tailwind.css`, the
   tokens, the `@theme inline` map); every app imports exactly this. `cn` is at `@no-origins/ui/lib/utils`.
4. **Fonts are the host's**: each app declares `--font-sans`, `--font-heading`, `--font-mono`; the package reads them.
5. **Theme** is `next-themes` on `.dark`. `d` toggles it, through the grid's sheet (Grid.md D28). Never call
   `setTheme` for a toggle: call `useThemeToggle`.
6. **The accents are lime and violet**: `--primary` is `--lime`, `--secondary` `--violet`, each with its ink; `--muted`
   is lime at 14% mixed over the page, `--accent` lime at 4% over the popover: mixed, never translucent. The rest is
   shadcn's neutral. Lime is about 1.3 : 1 on white, so `text-primary` is not text on the light theme; Type.md T4's
   `lime` tone is the one exception (Open: its light-theme contrast). The portfolio's accent jig (`?jig`) stays.
7. **The agent's paints are the agent's** (Orbit.md C20): lime, violet and `--agent-*` (pink, red, orange, gold, green,
   teal, blue), each with its ink, at least 3.3 : 1 from the page and the nest in both themes. Nothing else paints with
   them; widening the palette is his call. A retired paint's name reads as its replacement (`RENAMED_PAINTS`).
8. **Every pick of a colour is a `ColourPicker`**: swatches, one a colour, the picked one pressed, each named in its
   title. Never a select of colour names or a row of worded toggles.
9. **One radius, half the cell** (Grid.md D39): `--radius` is half `--grid-cell` (which `Grid` writes; off the grid
   globals.css reckons it from the viewport), and every box is `rounded-lg`, so a 1×1 is a circle and a box a cell tall
   a pill. Never a second radius, never `rounded-none` on a box, except a fill meeting a divider inside a box (4px
   there, the portfolio's work tabs) and a picture inset in a box (the box's radius less its inset, its project cards).
   Lines stay straight, and a `transparent` slot is not rounded. **Fields are outlined pills** (Input, Textarea, the
   Select triggers, InputGroup, Combobox, Command's search; InputOTP's slots circles), never sera's underline. **The
   slider is a bar**, 8px (`--slider-height`), its head merged into the lime end; held, the head goes into the cursor's
   ring, the bar parts 2px round it and the body follows on a spring (the grip, Motion.md M16).
10. **Motion is tokens** (Motion.md M3, M4): every number a component moves by is a `--motion-*` token in globals.css,
    in a family named for what it is for (`surface`, `panel`, `state`, `disclose`, `grow`: shadcn's and Tailwind's
    defaults, none his yet), read by CSS (`motion-surface`, `motion-panel`, token-valued utilities) and by script
    through `@no-origins/ui/lib/motion` as the motion starts. Never a literal `duration-*` or `zoom-in-95`. `gsap`
    animates what is inside a box (`packages/ui/CLAUDE.md` rule 7). The studio's bench holds only what he names (M9).
    - **Decided, his settings:** movement `move` (M9; `useCellMotion`: the portfolio's tech column, the numbered
      pager bar), loading `load` (M10), hyper focus `focus` (M13) and focus mode `mode` (M14), those three on their
      studio pages only, and the grip `grip` (M16, every `Slider`). The agents' actions, Bounce, Jump and Dive (M24),
      are data: drafts and `major.minor` versions in the database.
    - **On the bench, not decided:** enter · exit (M11), the slider's marks (M21), liquid (M25), the intro's tokens
      (M22); their tokens are read with fallbacks, not in globals.css. Home's closing (`farewell`) and the human rig
      (`human`, starting values) have tokens there and no bench.
11. **Text is a `Text`** (Type.md T1): eight roles (`hero`, `display`, `title`, `heading`, `label`, `body`, `caption`,
    `mono`), a tone (`foreground`, `muted`, `faint`, `lime`), an alignment, `weight="heavy"`. Never `text-2xl`.
12. **No gradients**: a surface is one flat colour, `color-mix`ed if it needs a hue. The one exception is the
    portfolio's project-card image placeholders (lime to violet, with grain) until real images arrive. The agents take
    depth from grain, relief and stepped shade.
13. **No glass**: no blur, frost, translucent surface, refraction, rim light or glow (none round the pointer). The
    exception is the motion studio's Hyper focus and Focus mode pages, hyper focus's blur and focus mode's 60% veil
    (Motion.md M13, M14); no page in any app blurs (Portfolio.md P21). Open: translucency (the overlays' `bg-black/20`).
14. **No loader on any page** (Grid.md D49): a page is on the field once the grid has measured it; loading plays on the
    studio's Loading page only, until he names a loader. The grid's intro (D50) is the agents, not a loader.
15. **Editing a shadcn component is a decision**: say why in a comment, since `shadcn add --overwrite` discards it.

## How he works

- **Every route of every app is on the grid**: `GridPages` (or `Grid`), boxes in `Slot`s, overflow to the next page,
  nothing scrolling, never a `max-w-* mx-auto` column. "Version 1" or "his to design" covers what sits on the grid,
  never whether; a page off the grid is to flag, not to copy. Check that `[data-slot="grid"]` is there and the page's
  scroll size is the viewport. Open: engineering and the sign-in screen (a card over a bare field), his to decide.
- **Size boxes to their content.** Never stretch a component to its room: a card spans the rows its content needs, a
  cell of air stands between neighbouring blocks, and a group is a heading row (the portfolio's section label: violet
  icon and word, centred, no border) with its cards under it, side by side, never behind a selector. Overflow pages
  (Grid.md D5); nothing is squeezed.
- **Controls read as one system.** Label, control and value columns shared across every card of a group; one widget
  per value type; one control height (36px, the system's small); a control's actions in its own menu, never buttons at
  a line's end; things grouped by what they are. Probe each control's edges to check. Open: the components default to
  40px; one height is his to decide.
- **Toggles that write data are a draft, saved once**: changed rows marked, a count with Discard and Save, one
  transaction (an RPC, as `noo_save_role`) so a refusal leaves everything as it was, and a warning before leaving
  unsaved. Never a write per tick.
- **A studio centres what is being designed** (Motion.md M15): the stage at the field's centre, jigs at most six cells
  wide in columns either side, a timeline at most ten, centred under it; jigs drag by their grip and stay where he
  leaves them (per page, in the browser); a column that overflows folds its cards to their headings.
- **An agent always stands on a cell of the field** (nest, landing, dive), never between cells or on an invented one;
  a centre between cells snaps to a real cell, and you say which.
- **Draw what he names.** When its data is missing (a URL, the copy), draw it inert (no link, no tab stop, its name
  kept) and say what it needs. Never invent the data.
- **The field stays plain**: no art, scene or colour painted into the grid's cells.
- **How he decides.** A design question gets five options at once, each testing a different mechanism, with its
  reasoning and how it could fail; he picks by id, his notes outrank your recommendation, and the rule the pick implies
  goes into its document. A character or a new motion family goes one version at a time instead ("Version N", no
  presets): he tunes it, Copy sends his settings back, the next version answers his notes, and a pick's values become
  the tokens in globals.css (Motion.md M7). Open: whether the families that already have five presets keep them.

## The grid

`packages/ui`: `components/grid.tsx` (the field, the theme sheet, the cursor), `grid-pages.tsx` (pages, the turn),
`grid-pager.tsx` (the bar), `grid-intro.tsx`, `slot.tsx`, `registry.tsx`, and `lib/grid-layout.ts` (the model, pure).
**Grid.md** is the document: cite `Grid.md Dn`. The grid renders and nothing edits it (D30). **A page is content
data**: items with a span per breakpoint and a render function, arranged on the field it is shown on (Portfolio.md P2).

- **The cell is decided; the counts derive** (D12). `DEFAULT_GRID_CONFIG` holds `cell · gap` per breakpoint (D13,
  D15): `base`/`sm`/`md` 72 · 12, `lg`/`xl` 60 · 12, and the bar's width, 6 cells (D29); change one only against
  Grid.md §5's principles, recorded in D13 (D29 for the bar). A field is `floor((span − gap) / (cell + gap))` cells
  each way, rounded down to even, never below two (D26), never fewer than six across: there the cell derives from the
  width (D33). Nothing names cols or rows. **Cells are square** (D9) and **drawn as circles** (D40).
- **The remainder is centred margin** (D14) and **the box's padding is the gutter** (D15); no `pad`. **The grid is its
  box**, the viewport (`h-dvh`; a className may change the height, never the width); it never scrolls or overflows.
  **`GRID_SPACING` is `0 · 4 · 8 · 12 · 16`**: the gap and a slot's `inset` (`SlotInset`) are steps of it.
- **A box is a `Slot`** (Slots.md): one registry component (`Placed`) or sub-slots on its own cells, with `fill`
  (`transparent` · `background`, masking the lines · `muted` · `card`; D21), `inset`, `alignX`/`alignY`, no margin.
  Every slot fills its span and **clips**: a cut-off component is in a slot that is too small. A Card in a slot gets
  `transparent`, inset 0, stretch. Boxes are placed by coordinate, 1-based; **overflow goes to another page** (D5).
- **The pager is a bar on the bottom row** (D27, D29): a fixture `GridPages` draws on every page, its cells
  reserved (`pagerCells`), one a layout (`layout.bar`), its cells sub-slots: four empty `card` cells, then the ↑ ↓
  pair, which takes the turn from context. `numberedPagerBar` numbers the pages (D36), the current one grown to two
  cells with its number and `title`, the pages playing movement (D46, D47).
- **The turn** (D27, D35, D37, D49): **scrolling up is forward** (a positive `deltaY`, never negated; ↑ is the next
  page). The hand drives a progress only the arrow follows (a third of the field is a page); short of half way it
  settles back. A committed turn fades the page away over `TURN_MS` (160ms), opacity only, and the next one in; no box
  is squeezed, scaled or re-laid out. A hand that keeps scrolling keeps turning; only a fling's tail is ignored. The ↓
  key turns forward and ↑ back (D42). The turn's custom properties are written on the bar, never the root.
- **Reading focus** (D45): a page that opts in with `useReadingFocus` (the portfolio) moves focus in reading order with
  Tab and the arrows, which then never turn it (`keyboard={false}`); `data-reading-after` stops read last.
- **The theme falls as a sheet of paint** (D28): a plain sheet in the new theme, its edges a sharp moving wave, falls
  over the outermost grid, the theme commits underneath, and it dissolves (`GridThemeFlip`, GSAP). No grid: instant.
- **The field is painted** (D38): dashes, lit cell and the intro's ripples are canvases drawn by `lib/grid-field.ts`,
  in a worker where possible; `gridFieldPainter` stays self-contained (the worker runs its source text).
- **The pointer is a violet ring** (D34): `cursor` on `Grid`/`GridPages`, a 24px ring drawn from an image in
  globals.css, filled while pressed; the cell under it lights its dashes violet, fading over 500ms; mouse and pen only,
  sent to the painter, never React state.
- **Nothing forces a breakpoint** (D11): `resolveField` takes a width and a height; to see a size, give the grid a box
  of it. `GRID_REFERENCE_BOX` is the first frame's assumption; `metrics.bp` is the breakpoint that supplied the cell.
- **Derivation is mobile-first** (D22): an unauthored breakpoint derives from the nearest narrower authored one, else
  the nearest wider. A page that fits is kept, coordinates verbatim, and centred (D25); one that does not is packed in
  reading order. Open: which field is authored on, and the packer; do not decide them in code.
- **The intro is the agents** (D50, Motion.md M22; `intro`, `introAgents`, `introActions` on `Grid`, the
  portfolio's). The six stand in a row while Bali, Kino and Mira bounce, each jumps or dives to the cell at the centre
  of the boxes it opens (`data-intro-by`) with a small ripple, then dives home to a cell of its own (the last column;
  the bottom row on a tall field) and rests there; each box fades in once its agent has gone. `introFocus` names the
  agent whose section is the page, standing below it (or at `introFocusAt`); a new one turns the page by the agents
  (`onIntroFocus`). `introAct` plays an action where an agent rests; `data-intro-fixed` marks a fixture no turn fades.
  Once per load; under reduced motion the agents are drawn still.

## Building and deploying

`pnpm -r build` builds all nine apps with no environment (the admin's clients are made per request).
`pnpm -r typecheck` and `pnpm -r lint` check the rest; `next build` does not lint in Next 16.

Nine Vercel projects in the `no-origins` team, one an app, Root Directory `apps/<app>`: `no-origins` (the portfolio),
`design`, `admin`, `engineering`, `motion`, `character` (Orbit: root `apps/orbit`, orbit.no-origins.com;
character.no-origins.com 308s from `apps/orbit/next.config.ts`), `home`, `status`, `auth`. Production is `main`. The
admin, motion, Orbit, Home and the login carry the two `NEXT_PUBLIC_SUPABASE_*` variables (without them production
answers 503); Home also the Blob store `home-house`. Open: Turnstile's site key joins the login's when he has made the
site. The hosted Supabase lists every app's domain among its redirect URLs (`supabase/config.toml`). A new project:
`vercel link` from the app's folder, `vercel project update --root-directory`, `vercel git connect`, `vercel domains
add`, `vercel env add --type config` for the two variables, then skip-unaffected through the API
(`vercel api -X PATCH /v9/projects/<name> --input -` with `enableAffectedProjectsDeployments`; the CLI has no flag).

**`apps/<app>/vercel.json` is the source of truth**: it overrides the dashboard. All nine are byte-identical:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install --frozen-lockfile",
  "regions": ["bom1"],
  "git": {
    "deploymentEnabled": {
      "**": false,
      "main": true
    }
  }
}
```

`pnpm run build` embeds no app name; `--frozen-lockfile` fails a stale lockfile loudly. **`bom1`** puts the functions
beside the hosted Supabase (`ap-south-1`): if the database moves, `regions` moves (Home's Blob store is still in `iad1`;
moving it is a new store and a `publish:house`, his call). **Only `main` deploys**: no previews, which used up the free
plan's daily deployments; `**`, not `*`, because branch names here have a `/`.

**Which apps a push builds is Vercel's call.** Every project skips unaffected deployments, reading the pnpm graph
against the last deployed commit: a project builds when its folder changed, a workspace package it depends on changed
(`packages/ui`: all nine; `packages/auth`: the admin, motion, Orbit, Home, the login; `packages/docs` and `supabase/`:
none) or the lockfile moved its dependencies; a skipped one shows *Canceled*. **A change outside the workspace rebuilds
all nine**, one at a time: root files (`CLAUDE.md`, `AGENTS.md`, `playwright.config.ts`), `.github/`, `.changeset/`,
`e2e/`, `services/`; a new top-level folder no app reads should be a workspace package, as `supabase/` is. **No
`ignoreCommand`**: a command sees only a push's last commit, the graph the whole push. The skip covers Git deploys only
(`vercel --prod` always builds), and connecting a project does not backfill.

A manual deploy runs from the repo root. `.vercel/project.json` is linked to `no-origins` and never rewritten; other
projects are picked by env var. The IDs are in `.private/vercel.env` (gitignored; the repo is public), which a fresh
clone must be given.

```bash
. .private/vercel.env                                           # the team ID and VERCEL_PROJECT_ID_<APP> for each
vercel --prod                                                   # portfolio
VERCEL_ORG_ID=$VERCEL_ORG_ID VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID_DESIGN vercel --prod # design; _ADMIN, _MOTION …
```

`.vercelignore` keeps `e2e/`, `supabase/`, `services/`, `.claude/`, `.private/`, the Playwright files and the house
out of the upload; its repo-root entries are anchored with a leading slash, since a bare name matches at every depth.

**CI** (`.github/workflows/ci.yml`) runs on every pull request and push to `main`; branch protection requires all five
checks, admins included. Warnings pass; errors fail. **Node is 24** everywhere (`.nvmrc`, `engines.node` `24.x`).

| Job | What it runs |
|---|---|
| **Typecheck and lint** | frozen install, `pnpm -r typecheck` (the packages included), `pnpm -r lint` |
| **Build** | `pnpm -r build`, all nine apps, no env |
| **Visual review** | `pnpm review`; screenshots and report uploaded as `review-screenshots` |
| **Agents tests** | `mix test` in `services/agents`, only when it changed |
| **Database tests** | `supabase start` (database and auth), an Owner through the allowlist, `supabase test db`; only when `supabase/` changed |

The last two are gated by a `What changed` job; a skipped job reports success, and when it cannot tell, both run.

## The visual review loop

After any UI change, look at the result before reporting done.

1. **`pnpm review review.spec.ts`** boots every app but the admin on its port (or reuses running servers), visits each
   route in `e2e/review.spec.ts`'s lists on desktop (1440×900) and mobile (Pixel 7) in both themes, waits for a grid's
   intro to hand over, fails on a 400+ or a throw, echoes `console.error`, and writes full-page screenshots to
   `e2e/screenshots/<project>/<app>__<route>.png`. Name the spec: a plain `pnpm review` (what CI runs) also runs
   `e2e/agents.spec.ts`, `e2e/motion-studio.spec.ts` and any gitignored stray spec under `e2e/.mcp/`.
2. Open the PNGs with Read. Narrow with `--project=desktop` or `-g "design /molecules"`.
3. For hover, click, scroll or the accessibility tree, use the `playwright` MCP server (`.mcp.json`, headless
   Chromium) against the app's dev server (`pnpm --filter design dev`, :3001). Its screenshots land in `e2e/.mcp/`.
4. `e2e/global-setup.ts` signs the browser in once (magic link, local mail catcher) as `E2E_EMAIL` or
   `.private/e2e-email`, into `e2e/.auth/state.json`, so the studios' local keys do not stop the sweep.

Add a page's route to its app's list in `e2e/review.spec.ts`. Screenshots, traces and reports are gitignored. **The
admin is not in the sweep** (every route is behind auth and needs a running Supabase): sign in and look
(`apps/admin/CLAUDE.md`).
