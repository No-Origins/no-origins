@AGENTS.md

# apps/cinema — the Cinema Studio

**The engine where a world is described, played and rendered**, and the commands that change it. On his machine only:
:3009, no host, no Vercel project (Cinema-Engine.md E1). Its documents are **Cinema.md** (what the studio is),
**Cinema-Agents.md** (the agents) and **Cinema-Engine.md** (this app); read the last before changing anything here.

```bash
pnpm --filter cinema dev                  # :3009, the screen and the renderer's page
pnpm --filter cinema cmd help             # the commands (E6); renders need the dev server running
```

## Private and public (E5)

**His library, shots, agents, renders and exports live in `src/content/`, gitignored and in `.vercelignore`.** Nothing
in it is ever committed, pasted into `packages/docs`, or written outside it: an entry built from his description is his
idea in code. The app imports it as **`@cinema/content`** (`next.config.ts`; typed by `src/content.d.ts`), and the
command line and the server read shots from the same folder (`src/data/store.ts`). Where it is missing (CI, a fresh
clone) both use the made-up **`src/sample/`**. The folder is in the tree that runs the app: moving the app to another
checkout means moving the folder by hand, never through git.

**His assets** are there too (`assets/<id>/<n>.json`, E9): configurations he saved under his own names. An asset's name
is his: never save one for him under a name he did not give, and a test saves its own probe and deletes it after.

**His palette** is there too: `PALETTE` in `src/content/index.ts`, the colours he has named, offered first by every
colour control on the screen. A colour joins it when he names one.

**Public**: the engine, the types, the stand-ins (`src/engine/builtins`: a placeholder figure, two camera moves, a
sun; tools, not his ideas), the commands, the renderer, the screen and the sample.

## The shape

- `src/engine/`: the types of a shot and an entry (`types.ts`, E3, E4), controls (`controls.ts`), the library, which
  keeps every version of an entry (`library.ts`), the timeline (`shot.ts`), and the engine, plain three.js
  (`engine.ts`, E2).
- `src/cli/cmd.ts`: the commands; `src/cli/render.ts`: stills, sheets, clips and exports through Playwright (Metal on a
  Mac) and ffmpeg (E7).
- `src/data/store.ts`: shots on disk (`shots/<id>/draft.json`, `versions/<n>.json`), renders, exports and the agents'
  session lines (Cinema-Agents.md R6).
- `src/app/page.tsx` + `src/components/home.tsx`: the home page (Cinema.md F11), its sections, Assets first (the
  entries his folder lists in `ASSETS`). `src/app/asset/[id]` + `src/components/bench.tsx`: an asset's bench, the
  asset alone, looked round freely, its controls either side, saved to `benches/<id>.json` (`engine/bench.ts`,
  `/asset/<id>/bench`).
- `src/components/studio.tsx`: the shots' screen at `/shots`, one `Grid` (E1): the picture at the centre, the jigs
  either side (`jigs.tsx`, drawn from the entries' declarations), saved through `PATCH /shot/<id>`; `picture.tsx`: the
  shot in its box, playing from its own clock, with free look; `render-target.tsx`: the canvas the renderer drives, at
  `/render`.
- `src/engine/edit.ts`: setting controls and a grid's cells, the changes the screen and the `set` and `cell` commands
  share. `src/engine/assets.ts`: his assets (E9): finding one by `id` or `id@n`, and pinning them when a shot is
  published. `src/components/world-jigs.tsx`: "Save as asset" and a grid's map of cells.

## What is true here and easy to get wrong

- **Every frame is a function of time** (E2). Nothing in the engine or an entry reads the clock or `Math.random`: use
  `random`/`noise` from `engine/math.ts` with a seed. Only the screen's player reads the clock, to move `t` on. A thing
  that moves by itself does it in its `at(t)` (`Built`), set from `t` alone, never from the frame before.
- **Node runs the engine as it is** (`node src/cli/cmd.ts`). Every import in `engine/`, `cli/`, `data/`, `sample/` and
  `content/` names its file with `.ts`, and only erasable TypeScript is allowed: no enums, no parameter properties.
- **An entry's version goes up when its code changes after a shot has used it** (E4): keep the old version beside the
  new one and list both in the library, so the old shot still plays as it was made. Until he has seen a version, it is
  still being made and keeps its number.
- **The commands are the only way a shot changes** (E6), for him, Claude and the agents alike; the screen's jigs save
  through the same change (`engine/edit.ts`), refused when the shot moved on since the screen read it. Each checks its values
  and the agent's department before writing; a refusal changes nothing and records nothing. With `--agent` and
  `--session` each writes its own line in that session; never write a session by hand.
- **`/render` is not a page.** It is the renderer's canvas at the frame's exact size, so it is off the grid on purpose
  and not in the sweep. Every page anyone visits is on the grid.
- **The frame is free** (Cinema.md F2): light, fog and later effects in the picture. The screen round it is the system.

## The agents

Cinema-Agents.md, built: the procedure is the **`cinema` skill** (`.claude/skills/cinema/SKILL.md`): making an agent
from the factory once he has named it, briefing it (`cmd agent brief`), starting it as a subagent with the whole brief
in its prompt, looking at what it made, recording his feedback, and the day's review. Each agent is a folder in his
private folder (`agents/<id>/`, R2), the factory's templates are `factory/departments/<department>.md`, and `describe`
tells an agent the world it works in. A camera agent's vocabulary is the camera library: `move` (any path, chained),
`orbit`, `push`.

## Reviewing it

To check CI's build on his machine without touching his folder: `CINEMA_SAMPLE=1 pnpm --filter cinema build` (the
sample instead of `src/content`, for the build and the store alike). Never move his folder aside under a running studio.

In the sweep: `pnpm review review.spec.ts -g cinema` screenshots `/` (`CINEMA_ROUTES`) on desktop and mobile in both
themes, the sample in CI. With the dev server up, `node e2e/.mcp/cinema-look.mjs <prefix>` (gitignored) does the same
against his shots and reports the grid, the page's scroll size and console errors. To look at a shot, render it:
`cmd still`, `cmd sheet`, `cmd clip`.
