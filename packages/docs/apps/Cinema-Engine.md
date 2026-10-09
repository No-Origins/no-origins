# No Origins — The Cinema Studio's engine

The engine is where a world is described, played and rendered, and the commands that change it. It is the only thing
the agents touch (Cinema.md F6, Cinema-Agents.md R5), and the first thing to build (Cinema-Agents.md R8). This
document decides what a shot is as data, how a library entry is built, the commands, how a shot plays and how it
becomes a still or a video.

**Signed off by him on 2026-10-09**, with "Start building". What is marked *his* he said in his own words; what is
marked *mine* Claude proposed and he agreed to, and it stays his to change.

Current as of 2026-10-09.

## E1. Where it runs

- **On a page on his machine, until the studio's app is hosted** (his, Cinema-Agents.md R8; Cinema.md F7).
- *Mine:* **that page is the studio's app, run only locally**: `apps/cinema`, a Next app in the workspace like the
  others, on port 3009, started with `pnpm --filter cinema dev`. It has no Vercel project and is deployed nowhere until
  he says. CI builds it like every app, against the sample (E5).
- **Its screen follows the system** (his, Cinema.md F2): one `Grid`, the picture in a box, and round it the controls
  built from `@no-origins/ui`.
- **He plays with the controls himself, and moves round the world** (his, 2026-10-09: "I don't see any controls for me
  to play around"). *Mine:* the picture at the field's centre, as every studio has it (Motion.md M15); in a column
  either side the jigs, every control of the world on the left and of the shot on the right (which shot, the frame to
  see it in, then its camera, lights and cast), drawn from the entries' declarations, so a control added in code is on
  the screen at once. A change shows at once and is saved to the draft once the jigs stand still, through the same
  change the `set` command makes (E6), from the revision the screen last saw: a command run meanwhile wins. Under the
  picture its name and a bar of play, the time to scrub, and **free look**: a drag turns round what the camera looks
  at, the wheel or a pinch goes nearer, and renders always use the shot's camera.

## E2. The engine

- *Mine:* **plain three.js on a canvas**, mounted as Home's viewer is (Home.md H2): no React renderer on top, the
  canvas the one element that is not a component of the system. It belongs to the app.
- **The frame is free** (his, Cinema.md F2): lights and shadows, fog, and effects over the picture (bloom, depth of
  field, grain, the grade). *Mine:* the effects are passes after the render, each an entry of the Effects or Grades
  library (E4).
- **Every frame is a function of time** (Cinema.md F5). *Mine:* nothing in a shot reads the clock; the engine asks
  "draw the shot at second *t*", and the same *t* is the same picture every time, however it is reached. Anything that
  simulates, such as an agent's landing, is stepped from the start of its action at a fixed step, as the agent's motion
  already is (Motion.md M17). *Mine:* a thing in a world that moves by itself (a cloud the wind carries) is moved to
  the moment asked for, by the moment alone. That is what lets a shot be scrubbed, rendered at any frame, and exported frame by frame.

## E3. A shot is a description

*Mine:* a shot is data, typed in code (public) and written in the private folder (Cinema.md F8):

| Part | What it holds |
|---|---|
| **Frame** | Wide or vertical (his, Cinema.md F1), the size, the frame rate |
| **World** | The environment and its props, each an entry with its controls set (Cinema.md F4) |
| **Cast** | Who stands where: each cast member's place on the floor and which way it faces |
| **Tracks** | One a department's kind of work (Cinema.md F6): camera, each light, each cast member, effects, grade, sound, music, titles. A track is a row of items |
| **Item** | An entry or a preset (Cinema.md F5) on a track: when it starts, how long it lasts, its controls' values |

- *Mine:* **a shot's length follows from its items**, as an action's does (Motion.md M24): nothing is placed after the
  last one ends.
- *Mine:* **a shot has a draft and published versions**, as a character has (Motion.md M20): the crew work on the
  draft; publishing makes a version that never changes; an export names the version it was made from.
- *Mine:* **a scene is a list of shot versions with their cuts** (Cinema.md F5), and a film a list of scenes.

## E4. How a library entry is built

- **He describes it; Claude or Codex build it in code; the agents set its controls** (his, Cinema.md F4).
- *Mine:* **an entry is a declaration and a builder.** The declaration is its name, its version and its controls, typed
  as the system's properties are (Motion.md M20: number, angle, duration, colour, choice, switch). The builder turns its
  values, and the moment, into what the engine draws. Each kind of library has its own builder's shape:

  | Kind | The builder gives |
  |---|---|
  | Environment, prop | Objects in the world, from the values |
  | Camera move | Where the camera is, what it looks at and its lens, at each moment of the move |
  | Light | Lights, their colour and strength at each moment |
  | State, action | The cast member's pose and motion at each moment (Cinema.md F3) |
  | Effect, grade | A pass over the picture, at each moment |
  | Sound, music | When it plays, how loud, and from where in the world |
  | Title | Text in the frame, at each moment |

- *Mine:* **an entry's version goes up when its code changes**, and a shot names the version of every entry it uses, so
  an old shot still plays as it was made, and an old session can still be read (Cinema-Agents.md R6).

## E5. What is public and what is private

- **Everything of his is private** (his, Cinema.md F8): the ideas, the worlds, the shots, the agents.
- **The library entries are private too** (his, 2026-10-09), since each one is built from his description: they are
  code, but his ideas in code. They live in `apps/cinema/src/content/library/`, gitignored, and the app imports them through an
  alias, as Home imports the house (`@house`, Home.md H4).
- **His palette is private too** (Cinema.md F10): the colours he names (`PALETTE` in his folder; White first, his,
  2026-10-09), which every colour control on the screen offers before the colours already in use.
- *Mine:* **until the app exists, the private folder is `.private/cinema/`**, gitignored already, and it moves into
  `apps/cinema/src/content/` when the app is built.
- *Mine:* **the stand-ins are public**: the placeholder figure, a plain camera move and a plain light that Claude
  adds so a shot can be made before he has described his own (E8). They are tools, not his ideas, and he replaces them
  as he describes his.
- *Mine:* **what is public** is the engine, the types of a shot and of every kind of entry, the commands, the
  renderer, the stand-ins, and a small made-up **sample** (one environment, one camera move, one light, a stand-in, one shot), which
  is what CI and a fresh clone see, as Home's sample house is.

## E6. The commands

**The agents work only through commands, and he and Claude use the same ones** (his, Cinema.md F6). *Mine:* a command
line in the app, `pnpm --filter cinema cmd <command> …`, which every agent can run, and which the screen calls too:

| Command | What it does | Department |
|---|---|---|
| `new` | Starts a shot: its title and its frame | Direction |
| `world` | Sets the shot's environment and its controls (`--keep` carries over what the new one takes) | Set |
| `asset save`, `assets` | Saves the shot's world as an asset under his name; lists his assets (E9) | Set; anyone |
| `cell` | Changes one cell of a grid: its asset, empty, back to the rules, or its copy's values (E9) | Set |
| `place` | Puts a cast member on the ground, facing a way | Direction, cast |
| `add` | Puts an entry or a preset on a track, at a time, with its values | The track's |
| `set` | Changes an item's values | The track's |
| `move`, `trim`, `remove` | Moves an item in time, changes its length, takes it off | The track's |
| `frame` | Wide or vertical, the size, the frame rate | Direction, camera |
| `shots`, `show`, `entries` | Read the shots, a shot as data, and the library with every entry's controls | Anyone |
| `still` | Renders the shot at a moment | Anyone |
| `sheet` | Renders a contact sheet: a still every so often across the shot | Anyone |
| `clip` | Renders a stretch of the shot as a short video | Anyone |
| `publish` | Makes the draft the shot's next version | Direction |
| `export` | Renders a published version as a video or stills, in its frame | Direction |

- *Mine:* **each command checks before it writes**: the values against their declaration, and the track against the
  calling agent's department (Cinema-Agents.md R5). A refusal says why, and changes nothing.
- *Mine:* **each command writes its own line** in the calling agent's session, and each render its artifact
  (Cinema-Agents.md R6). An agent cannot skip the record.
- *Mine:* **a command line, not a server, for now.** The agents are Claude Code agents, which run commands; the same
  commands can be offered over MCP when the harness comes (Cinema.md F8).

## E7. Rendering

- *Mine:* **a still, a sheet and a clip are drawn by the same page**: a headless browser (Playwright's Chromium,
  which the review loop already runs) opens the engine's page, `/render`, at a moment and takes the canvas, so what the
  agent checks is exactly what he sees. That page is the frame at its exact size, so it is not on the grid: it is the
  renderer's, and no one visits it.
- *Mine:* **a video is its frames**: the engine draws each frame in turn at its exact moment, never in real time, so a
  slow frame never drops; the frames go to ffmpeg (on his machine), which encodes the video. A clip for checking is
  small and quick; an export is at its full size and takes as long as it takes.
- *Mine:* **sound is mixed separately and joined**: the shot's sound and music items are mixed at their times into one
  track, offline, and ffmpeg puts it under the picture. Live, the engine plays them through the browser.
- **The frame is a control** (his, Cinema.md F1): wide or vertical, and one shot can be exported in both.
- *Mine:* **renders land in the agent's artifacts** (Cinema-Agents.md R2) and exports in the film's folder, named by
  the shot, its version and the frame.

## E8. The first world

*Mine:* what the first build has to show, before anything else is built: **one shot, made the whole way through.**

1. The engine's page, the screen round it, and the commands.
2. **His first environment, built from his description** (his, 2026-10-09). The description is his idea, so it is kept
   in the private folder (E5) and not here.
3. A camera move, a light and a stand-in where the cast will stand.
4. The shot exported as a video and a still, wide and vertical.

It is done when an agent, given his words, makes that shot through the commands alone, and its session is recorded.

## E9. Assets, and worlds built from them

- **An asset is a configuration he saves under a name of his own** (his, 2026-10-09: "I want to call this an asset…
  save this configuration… when saving, I will save with the name I want to"). It is an entry, its version and its
  values, kept in his private folder (E5). Saving under a name he has used makes the asset's next version.
- *Mine:* **a draft uses an asset's newest version; publishing pins it** to the version in use, so a published shot
  plays as it was made whatever he saves later (E3).
- **A world can be a grid of assets** (his: "use this asset to build a grid of assets which will create a world"),
  **filled by rules, then changed by hand** (his). *Mine:* such an environment declares its grid (its size, and which
  asset its rules put in each cell), and its cells, "column,row" from 1, are part of the shot's world: a cell may hold
  another asset, stay empty, or tune its own copy over the asset's values. The engine, the `cell` command and the
  screen all read the grid from the declaration, so the rules are written once.
- **A grid can have layers over its ground** (his, 2026-10-09: clouds as "a layer over the grid", and "we need
  controls to define the movements of clouds"). *Mine:* each layer has rules of its own and takes assets of one kind
  only; its cells are keyed "<layer>:column,row" and change by hand as the ground's do. What moves the layer (a wind)
  is the grid's controls; what each thing does by itself (a cloud churning) is its asset's. *Mine:* a grid hands its
  wind (velocity, turbulence, shear) to what it carries, so the wind can work inside a thing as well as move it; a
  wind made of noise, not a fluid simulation, so every moment stays a function of the time alone (E2).
- **An entry may be drawn by a shader of its own** (his pick, 2026-10-09: clouds as a real volume of gas, not balls).
  *Mine:* it reads the scene's sun and sky as they are when it is drawn, and its picture goes through the same tone
  mapping as the rest.
- *Mine:* **the screen** offers a world that is one tile a "Save as asset" card, where he types the name, and an asset
  control is a list of his assets by name, of the kind it takes. A grid's world has a map of its cells, seen from above,
  a layer at a time: a cell picked shows
  what stands there and takes another asset, empty, or back to the rules, and its copy's controls follow the map.

## Open

Nothing is open.
