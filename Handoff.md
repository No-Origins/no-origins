# Handoff — the editor, after the inspector controls

*Written 2026-09-14 at the end of the session that decided and built the inspector controls. Read this first in the next session, then Admin.md §6.5 and Scene-Schema.md.*

## Where things stand

- **`@no-origins/ui` 0.1.0 is released and merged** (PR #1, 2026-09-14). Atomic.md is the record; the canvas *No Origins Design System* (artifact 13bff065) and its phone edition (artifact 13529f87) show it.
- **The inspector controls are decided and built** (commit `5219696` on `main`, pushed). A changeset for a **minor** bump sits in `.changeset/inspector-controls.md`; `pnpm changeset version` has *not* been run — do it with the next release, which makes the package 0.2.0.
- **Step 1 of §6.5's order of work — the ToolScreen sidebar — is built** (2026-09-14, branch `feat/tool-sidebar`, not pushed): `sidebar` and `flush` on `ToolScreen`, `AdminRail` in rail form on any `…/edit` path, the editor's shell as the third block of `/fixtures/tool`, changeset `.changeset/tool-sidebar.md` (minor). Recorded in Admin.md §6.5 row 1 and Atomic.md step 5. Reviewed with `pnpm review -g "fixtures/tool"` at 1440 / 1100 / 412 in both themes. One thing found: a flush screen must be `flex: none` — with `flex: 1` the grid sizes to its content and the bar drops below the fold.
- **Step 2 — the document layer — is built** (2026-09-14, same branch): `@no-origins/ui/document` (schema as Zod, prop validators, refs, markdown + directives, `documentToScene`), the portfolio as a document in `apps/portfolio/src/content/document.ts`, `/fixtures/document` (in the sweep), and `e2e/document.spec.ts` comparing it with the hand-written render pixel for pixel. Home map differs by 1 %, widgets by 2–9 %; adapter issues: none. **Scene-Schema.md §10 is the record** — eight amendments the code made (§10.1) and eight findings (§10.3) that want decisions. Changeset `.changeset/document-layer.md` (minor). `zod` is a dependency of the package.
- **Step 3 — the editor screen — is built** (2026-09-14, same branch, read-write; **publish is step 8**). Route `/projects/portfolio/edit`. The chrome is a new package subpath `@no-origins/ui/editor` — `PropsForm` (one control per prop *type*, the intersection and *mixed* for several selections, refs shown not overwritten), `DocumentForm` for nothing-selected, `Palette` (the registry by layer, drag or `/`), `SaveState` (S3's five states), `CanvasOverlay` (the ring, the kind · name tag, the hover hairline, the drop ghost) — plus `editor.css` and additive `CanvasShell` props (`onSelect`, `selectedId`, `overlay`, the three canvas drag handlers, `onNodeMove`, `useCanvasZoom`). Changeset `.changeset/editor.md` (minor).

  **What works:** the outline selects and reorders; the inspector renders any registry entry and the canvas re-renders as you type; Delete, ⌘D, Esc and arrows-by-one-box; dragging a palette item onto the canvas places it on a box corner with its defaults; autosave at 800 ms through `PATCH /api/documents/:id/draft` with the `rev` check, 409 → *stale* with a Reload; the bar's − / zoom / + / Fit, viewport and grid toggles, `ThemeSwitch`.

  **What is stubbed:** Preview (disabled) and Publish — enabled only when saved *and* the adapter says valid, and its dialog takes R1's required label and then closes, labelled honestly. The probes gate nothing yet. The seed draft is a **copy** of `apps/portfolio/src/content/document.ts` at `apps/admin/src/content/portfolio-home.json` + `portfolio-content.json`, because one app may not import another's source and the package may not hold a project's content.

  **How it was verified:** `pnpm review` (100 passed, the live portfolio unchanged); `pnpm -C packages/ui lint`; `tsc --noEmit` in the package and all three apps; then signed in against the local stack and looked — selection ring and `widget · Bento` tag, hue changed in the inspector and seen on the canvas, save `saving → saved` with the row's `rev` climbing and surviving a reload, a `Placeholder` dragged from the palette landing on a box corner (10 → 11 nodes, persisted). Screenshots in `e2e/.mcp/editor-*.png`; the scripts that made them are `e2e/.mcp/signin.mjs`, `editor-check.mjs`, `reset-draft.mjs` (gitignored).

  **Two things to know before you run it.** The local stack allows **two sign-in emails an hour** (`supabase/config.toml` → `auth.rate_limit.email_sent = 2`), which is fine for a person and useless for a script: `signin.mjs` mints a link with the local service-role key through `admin/generate_link` and verifies it against the app's own `/auth/callback?token_hash=…`. And `additional_redirect_urls` admits only `:3002`, so an admin on any other port cannot receive a real magic link — cookies are per-host, not per-port, so signing in on `:3002` does work for `:3012`.
- Remote is `origin` = `No-Origins/no-origins` (private).

## What the last session did

Bhargav picked **A on all four option boards** and left two sticky notes on the pattern-picker board: *"Let's have 18 pre defined illustrations. So, while deciding give me controls to create new if I want to."* and *"Rename 'Illustrations' to 'Patterns'."* Everything below follows from those picks and notes.

| Decided | Built | Where |
|---|---|---|
| E1 A — hue swatch: seven 20px dots, ink ring, name beside, accent as an eighth glass dot | `HueSwatch` | `packages/ui/src/molecules/HueSwatch.tsx` |
| E2 A — grid of drawn thumbnails, named; **three across** (four truncated the names — rule amended) | `PatternPicker` (+ `libraryPatterns`) | `molecules/PatternPicker.tsx` |
| Note — controls to create new patterns | `PatternStudio`: Dialog with 12 `Range` dials on a live thumbnail + a name; Save → `{ name, family }` for the document's `patterns` map | `organisms/PatternStudio.tsx`, `molecules/Range.tsx` |
| E3 A + C — rows on hairlines with grip / chips as compact form | `Repeater` with `density="rows" \| "chips"`, Alt + ↑/↓, drag, count against `max` | `molecules/Repeater.tsx` |
| E4 A — Alt + arrows and drag, one drop line | `Tree` gains `onReorder`, grip, drag; `moveTreeNode` exported | `organisms/Tree.tsx` |
| Note — rename | `Pattern`, `PatternCanvas`, `patterns`, `patternNames`, `patternNotes`, `PatternName`, prop type `pattern`; folder `atoms/patterns/`; doc `Patterns.md`. Old names (`Illustration`, `fields`, `FieldName`, …) are **deprecated aliases for one minor** | `atoms/patterns/*`, `src/index.ts` |
| Note — eighteen | Six measured sets kept (with `words`); twelve new, named for what shapes them, no `words`: `sweep fan waist bloom quicken tide hush lean swell ridge gather arc` | `atoms/patterns/patterns.ts`, Patterns.md §6.0b |

Also: one shared drop indicator `.noo-drop` (molecules.css); `grip` icon added to `icons/glyphs.ts`; registry entries for all five controls with client-side samples in `registry/examples.tsx`; fixture **`/fixtures/inspector`** (in the sweep) shows everything wired; `Tooltip` now renders one tree on server and client (it hydrated wrong on the catalogue one run in four).

Docs touched: Admin.md §6.5a–b (the rules), Scene-Schema.md §1 (`patterns` map, `"pattern"` prop), §3.1 (control per type), §3.2, §3.6 (geometry authorable, `words` never), Patterns.md (renamed; §6.0b), every `Illustrations.md` reference repo-wide.

## The canvases

| Canvas | URL | Source |
|---|---|---|
| **Editor Screen — nine option boards, awaiting his picks** (F1–F5 from the document proof, S1–S4 the screen questions; recommendation A on every board) | https://claude.ai/code/artifact/d713efe7-ed3b-4796-a0d2-93fcddf9b17b | `packages/ui/design/screen/` — `node build.mjs`, then seed with `canvas.json`; favicon 🧩 |
| Inspector Controls (decided + built banners, board 5 = the eighteen; **his two notes are on it — preserve them**) | https://claude.ai/code/artifact/3fcae316-ffad-47ff-a179-ff06b196dc43 | `packages/ui/design/editor/` — `node build.mjs`, then seed with `canvas.json` |
| Design System release record | https://claude.ai/code/artifact/13bff065-8753-40a2-8388-84ddd0f1d9ba | `packages/ui/design/release/` |
| Phone-readable release | https://claude.ai/code/artifact/13529f87-251d-46c3-8847-084227ac7677 | `packages/ui/design/release/build-reader.mjs` |

Canvas mechanics that bit before: re-read the artifact and `--extract` before any republish (he edits canvases himself); publish with `contract: "0.1.31"`, favicon `🎛️` (editor) / the release's own; no `capabilities` on republish; ≥80px between frames; `board/patterns.mjs` reads `patterns.json`, which is real SVG extracted from `/fixtures/inspector` with Playwright — regenerate it if the patterns change.

## How to review

- `pnpm review` from the repo root (both apps, four projects; 92 runs). `pnpm review -g "inspector"` narrows. Screenshots in `e2e/screenshots/<project>/fixtures__inspector.png`.
- Admin is not in the sweep: sign in with the Mailpit magic link (`http://127.0.0.1:54324/api/v1/messages`, allowlist has hiddenstack@icloud.com) with Supabase local up — see `apps/admin/CLAUDE.md`.
- Package: `pnpm -C packages/ui lint` = `tsc --noEmit && stylelint "src/css/*.css"` (rule 1 enforced: no literal colours/px sizes outside tokens.css).
- Gotcha found this session: a pattern thumbnail needs `color: var(--hue-ink)` on its tile, or the lines disappear in dark mode (the line colour is a mix with `currentColor`).

## What next — Admin.md §6.5's order of work

1. ~~**ToolScreen sidebar**~~ — **done 2026-09-14** (see above). The rail rule cannot be seen in the admin until the `/edit` route exists at step 3; `/fixtures/tool` shows it.
2. ~~**The document layer**~~ — **done 2026-09-14** (see above). What it found (Scene-Schema.md §10.3) wants **option boards before code**, five each: how a widget cell's head lays out (`CellHead` groups; a hand-written cell spreads — the diagonal); a component for the widget text scale; a component for the loud cell's word; where the sample-copy tag lives; a list inside a widget. Full views are pages the adapter returns and nothing mounts yet.
3. **The editor screen** at `/projects/portfolio/edit` — **boards published 2026-09-14** (canvas *No Origins Editor Screen*, above): S1 selected node · S2 palette landing · S3 autosave states · S4 inspector with none/several, plus F1–F5 from step 2's findings. **Waiting on his picks.** When they land: write each as a rule in Admin.md §6.5c, build F1–F5 in the package (and drop the thresholds in `e2e/document.spec.ts` to what they then measure), then the screen. His rule: he picks by letter, notes outrank recommendations, each pick becomes a rule in Admin.md first. Re-read the canvas (`--extract`) before any republish — he leaves notes on it.

He said "Proceed" on 2026-09-14: steps 1 and 2 were built and the step-3 boards published in the same session.

## Deferred, not forgotten

- `pnpm changeset version` → 0.2.0 at the next release; remove the deprecated aliases (`Rail`, `Intro`, `RoadmapItem`, `RegionLabel`, `Illustration*`, `fields*`) the minor after.
- Spacing in the stylelint rule; a `no-restricted-imports` check for wiring rule 3.
- `probe10`/`probe11` still live only in `e2e/.mcp/` (gitignored) — Admin.md §6.3 says they should move into the review spec.
- `flow` cost in the studio: the panel at `/fixtures/controls` shows what an angle costs the words; the studio only says it is measured where the pattern lands, because a library pattern has no words yet.
- npm publish only if asked.

## How he works (keep to it)

- Batches of five options with reasoning; he picks by letter and adds notes; picks become rules before code (feedback memories `feedback-design-batches`, `feedback-docs-before-code`).
- Use sub-agents for mechanical commits. Never track `.env.local`. Admin CLAUDE.md rules stand: anon key on the server client, `getUser()` not `getSession()`, sign-in message identical whatever happens.
- Look at the screenshots before reporting done; say what failed if something failed.
