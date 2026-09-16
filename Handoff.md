# Handoff — after v1

*Written 2026-09-16 at the end of the session that revamped the design system and released 1.0.0. Read this first, then Atomic.md §4 (D10–D13) and §6 step 7, which are the decisions and the record of the release.*

## Where things stand

- **`@no-origins/ui` is 1.0.0** — a major, because the revamp removes public API rather than only adding it. `version` in `src/index.ts` says so and a major changeset carries the bump. **Not published to npm**, which remains a separate act nobody has asked for.
- **What Bhargav asked for**, in one message on 2026-09-16: *"complete revamp… finalise and release the v.1 of the design system today. No more glass effects. Let's remove the react flow and all react flow related items completely. I want to take a different approach later. Motion should also be part of the design system. Remove rail too."* Four decisions came out of it — Atomic.md **D10** (one flat surface), **D11** (no React Flow), **D12** (motion is a layer), **D13** (one navigation, one width) — and each records its cost, including the ones that are real.
- **What was removed.** The `Glass` atom, `glass.css`, every `--glass-*` token and `.noo-glass*` class; `Card`'s `surface`, `BentoCell`'s `glass` tone, `Blob`'s `refraction` and the ground providers, `ProfileCard`'s `bloom` and its frosted bottom. The `@no-origins/ui/canvas`, `/editor` and `/document` subpaths with everything in them, plus `editor.css`, `@xyflow/react` and `zod`. The `Rail` organism, `Menu`'s `rail` and `floating` forms and its collapse, `Page`'s `rail`, `ToolScreen`'s `flush`. And **every deprecated alias** from the 0.1.0 release — `Intro`, `RoadmapItem`, `RegionLabel`, `Illustration*`, `fields*`, `Glyph*`, `CellHead`'s `dot`, and the bare CSS class names (`.glass*`, `.rise-in`, `.pop-in`, `.lift`, `.breathe`, `.noo-prose`, `.noo-theme*`, `.noo-graph`, `.noo-intro`).
- **What was added.** `Surface` (`level` 1 | 2 | 3 = e1 · e2 · e4, `radius`, `as`) — the one material, worn by everything that was translucent. `tokens/motion.ts` (`durations`, `easings`, `motionPatterns`, `motionNotes`, `prefersReducedMotion`), the `Motion` atom and `useReducedMotion()`, and a `motion` group in the registry holding both new entries.
- **The portfolio is pages.** The home introduces him and carries the six widgets; each widget links to its section's own route. The canvas, the ring, the snap and the viewport-as-navigation are gone with React Flow — Design-System.md §8 carries a superseded banner and keeps §8.1–§8.7 as the record of what was built and why. The widgets, the bento and the box grid are untouched: they were the layout, not the canvas.
- **The admin authors nothing.** The editor route (`/projects/portfolio/edit`) and the draft autosave API (`PATCH /api/documents/:id/draft`) are gone with the document layer they drove, and the rail is a plain `Menu`. Everything else about the admin — the nine screens, the Tool shell, auth, RLS, the buckets — stands.
- **The showcase wears the same Menu**, and `/tokens/motion` is a real screen now: it reads `durations`, `easings` and `motionNotes` out of the package and plays each pattern, so it cannot describe motion the system does not have.
- Branch `feat/tool-sidebar`; remote is `origin` = `No-Origins/no-origins` (private). PR #1 was the 0.1.0 release, merged 2026-09-14.

## How to review

- `pnpm review` from the repo root — both dev servers, every route in `ROUTES` and `DESIGN_ROUTES`, desktop and Pixel 7, both themes, failing on uncaught page errors and on `probe12` (exactly one loud cell per widget). Narrow with `pnpm review -g "<pattern>"`. **Open the PNGs in `e2e/screenshots/<project>/` and look at them** — a passing typecheck has never caught a visual problem here.
- **The admin is not in the sweep**: every route is behind auth and needs a running Supabase. Sign in with the Mailpit magic link (`http://127.0.0.1:54324/api/v1/messages`, the allowlist has hiddenstack@icloud.com) with the local stack up — `apps/admin/CLAUDE.md` has the commands. The gitignored helpers in `e2e/.mcp/` still sign in and screenshot; `signin.mjs` mints a link with the local service-role key, because the local stack allows two sign-in emails an hour.
- Package: `pnpm -C packages/ui lint` = `tsc --noEmit && stylelint "src/css/*.css"` (wiring rule 1 enforced: no literal colours or px sizes outside tokens.css), then `pnpm -C packages/ui build`.

## The canvases

| Canvas | URL | Source |
|---|---|---|
| Design System release record — **0.1.0; still shows glass, the rail and the canvas nodes** (Atomic.md §7: not regenerated for v1) | https://claude.ai/code/artifact/13bff065-8753-40a2-8388-84ddd0f1d9ba | `packages/ui/design/release/` |
| Phone-readable release — same, same caveat | https://claude.ai/code/artifact/13529f87-251d-46c3-8847-084227ac7677 | `packages/ui/design/release/build-reader.mjs` |
| **Editor Screen — nine option boards.** A record of removed work: the screen it decided was built on 2026-09-14 and removed on 2026-09-16 (D11). The picks are still the picks; the code is gone | https://claude.ai/code/artifact/d713efe7-ed3b-4796-a0d2-93fcddf9b17b | `packages/ui/design/screen/` |
| **Inspector Controls** — also a record of removed work for the editor half, though five of its controls (`HueSwatch`, `PatternPicker`, `PatternStudio`, `Repeater`, `Tree`'s reorder) are in the package and shipped. **His two sticky notes are on it — preserve them** | https://claude.ai/code/artifact/3fcae316-ffad-47ff-a179-ff06b196dc43 | `packages/ui/design/editor/` |

Canvas mechanics that bit before: re-read the artifact and `--extract` before any republish (he edits canvases himself); publish with `contract: "0.1.31"`; no `capabilities` on republish; ≥ 80px between frames.

## Deferred, not forgotten

- **The different approach to the canvas.** *"I want to take a different approach later."* Nothing is designed for it yet, and nothing should be until he says so. What is kept for it, deliberately: the registry (`entries`, `layers`, `groups`, each entry's `kind` and `slots`), Scene-Schema.md §2–§3 as the contract that was learned, and §10's findings; Design-System.md §8.1–§8.7 as how the React Flow one actually behaved. All of it is banner-marked as superseded so nobody mistakes it for the system.
- **The design boards were not regenerated** (Atomic.md §7). The release boards would come back flat if rebuilt, since they re-read the live CSS; the editor and screen boards would have to be rewritten rather than rebuilt, because they describe work that no longer exists. Left alone on purpose.
- **The deprecated names are gone for good** — including the six-glyph grammar (`Glyph`, `glyphNames`) and the old `Illustration*` / `fields*` spellings. `Pattern`, `PatternCanvas`, `patterns`, `patternNames` are the names; Patterns.md is the document.
- Spacing in the stylelint rule; a `no-restricted-imports` check for wiring rule 3 (layers read downward only).
- `probe10` / `probe11` still live only in the gitignored `e2e/.mcp/` — Admin.md §6.3 says they belong in the review spec.
- Admin.md §13's build order: steps 6 and 7 (document layer, editor) were built and then removed in v1, and step 8 (publish and versions) is not applicable until a new approach exists. Steps 9–11 are untouched.
- **npm publish only if asked.**

## How he works (keep to it)

- Batches of five options with reasoning; he picks by letter and adds notes; picks become rules before code (feedback memories `feedback-design-batches`, `feedback-docs-before-code`).
- Use sub-agents for mechanical commits. Never track `.env.local`. Admin CLAUDE.md rules stand: anon key on the server client, `getUser()` not `getSession()`, sign-in message identical whatever happens.
- Look at the screenshots before reporting done; say what failed if something failed.
- No gradients anywhere in the system (2026-09-16): flat washes only, never a sweep, streak or film. The grid lines and ProfileCard's scrim are the named exceptions; the blob's rim light was the third and went with the glass.
