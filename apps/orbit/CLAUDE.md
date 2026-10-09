@AGENTS.md

# apps/orbit — Orbit

`orbit.no-origins.com`, :3005. **Orbit is the agents, together** — each has its own name — **and this app, where they
are made** (Orbit.md C21). Here each agent's character is designed: what it looks like, not how it moves. **Orbit.md**
is its document; read it before changing anything here.

```bash
pnpm --filter orbit dev              # :3005
```

## The shape

`/` is one `Grid` with the overlay and the cursor, the motion studio's shell, inside `CharacterProvider`
(`components/character-context.tsx`: the look, and its draft and versions). Its boxes are placed by `studioLayout`
(`src/lib/stage.ts`) from the measured field.

- **The agent's cell** (C2) is a cell of the field grown to a radius of three cells, six across, centred across the
  field **at the top, one row above it**; a field too narrow or too short gives it fewer cells, kept even. Inside it the
  agent sits (C3), drawn by `AgentCell` (`components/agent-cell.tsx`). **The cell is part of the grid**: every cell of
  the field its circle overlaps is painted out under it (`coveredCells`), and the four in the corners of its square,
  which it misses, stay. Its slot is `transparent`, because the `background` fill would take those corners too.
- **Everything round the circle is a section** (C7): its heading on a row of its own — the portfolio's section label,
  composed the same way (`SectionLabel`, `components/section.tsx`) — and its cards under it, each as many rows as it
  has lines, never stretched to its room.
  - **The body** (`components/appearance-card.tsx`, C4): Size, then Shade, one a row, in a card four across and two
    down, centred under the circle, its heading on the row between them — or first in the right room where it and the
    bar do not both fit there.
  - **The face** (`components/face-panel.tsx`, C5, C7): a section a worn slot, flowing down the room to the circle's
    left.
  - **The body's own sections** (`components/body-sections.tsx`, C10, C12, C22) flow down the room to its right:
    **Shape** (with its Material), **Rotation**, **Colour**, **Surface** (its texture and depth), **Tail** (its first
    line the switch; off, the section is that line alone, C23) and **Rest**.
  - **The draft's bar** (`components/versions-panel.tsx`, C6, C11) is on the field's last row under the circle, between
    the rooms' pagers: a circle that opens the versions in a dialog (the next major over them, to publish), and a pill
    of the agent's select, the draft's state and Publish, which makes the next minor version at a press (C19: a version
    is `major.minor` and has no name; `lib/versions.ts` spells them) — or, for a visitor, "Yours to play with" and
    Sign in (C24).
- **Rooms flow and page.** A column of air stands between the circle and each room. `flow` (`lib/stage.ts`) places a
  room's sections column by column, a section whole unless it is taller than a column, and what the room cannot hold
  is its next page, turned by its pager on the field's last row (`Flow`); a style picked that moves its section to
  another page turns to it. **A section folds to its heading** (C9): the heading row is its toggle, a folded section
  flows as one row, and the page follows a section that moves. The folds are held above the rooms (`FoldProvider`,
  `useFold`) and not saved. A field with no room beside the circle has one room under it, where the body and its
  sections, then the face, flow, the bar on the row above its pager.
- **Every control is `PropertyControl`** (`components/property-control.tsx`), a line of its card (`Line`, three columns
  — label, control, value — that **every card in a room shares**, `LINE_LABEL` and `LINE_VALUE` in
  `components/section.tsx`; the body's card placed on its own fits its label column), made from a setting's type in the
  package's declaration (`@no-origins/ui/lib/properties`, `agent-face`, `agent-body`), never a list of its own. **One
  grammar for every line** (C11): a number is a slider and its typed value; a choice a select across the control's and
  the value's columns, what it offers that is not a value (a face slot's uploads, template and upload) at the end of its
  list; a paint, and a colour by name, the design system's `ColourPicker` (C17); a switch at the control's start. The
  value's column holds a number or nothing, and every box is 36px (Open: 36 or 40 — his decision). No button at a
  line's end.
- **Only what he names stands round the circle**, one piece at a time, as the motion studio's bench holds only what he
  names (Motion.md M9): the body and its sections, the face, and the draft and its versions. Its name, its meta and its
  personality are what he has named as coming.
- **`/hiddenstack`** (`components/hiddenstack-studio.tsx`) is Hiddenstack's figure, the design system's
  `HiddenstackAvatar` on the same shell. Open: `/hiddenstack`, in the code but not decided.

## Who may do what (C24)

**Orbit is everyone's to play with; saving is for whoever holds its permissions.** `src/proxy.ts` runs the shared gate
with `open`: nobody is sent to the sign-in, and `/sign-in` is there for whoever saves. `src/app/actions.ts` is server
functions for whoever asks (`@no-origins/auth/server`), the database deciding: every load says whether the page is
`editable` — the signed-in account holds `orbit.draft.save` (asked of the database, `noo_can`) — and each write asks
its own permission in `writer()`: `orbit.draft.save`, `orbit.version.publish`, `orbit.agent.create`,
`orbit.style.upload`. The Owner holds them all and may give them in a role (Access.md A3).

- **A visitor** loads each agent as **the version pages show, never the draft**, moves every control on the page, opens
  the six and reads the versions, and nothing is saved: the context schedules no save, and the server refuses before
  RLS would. The anon key's policies (`…_studio_public_read.sql`) read the agents and their versions and nothing else.
  Do not read the draft for a visitor, and do not offer them Publish, Go back, a new agent or an upload.
- **There are six characters** (C13, Agents.md): Bali, Kino, Zaza, Oru, Mira and Lola. The draft bar's select opens
  one, and makes a new one by its name at the end of its list (`createCharacter`, C19) (`open` in the context settles
  what is pending first); every action takes the open one's `itemId`, and uploads are the open character's own.
- **Saving** (C6): the draft loads when the studio opens, saves `SAVE_AFTER` ms after the last change, whole
  (`resolveCharacter`), on the `rev` it was loaded at; a save another device made first is refused, and the draft's bar
  offers to load it. Publishing saves what is pending first, then makes the latest version's next minor
  (`publish("minor")`) or, from the versions, its next major (`publish("major")`), counted from the latest and never
  from the one pages show.
- **Locally**: with no keys the page is `offline`, and it is all there is. With the local stack's two keys in
  `.env.local` (`.env.example`) the studio shows the published agents and the bar offers the sign-in; a session made on
  any app on localhost is this one too, since a localhost cookie is every port's.

## What is true here and easy to get wrong

- **Orbit holds the look, never the motion** (C22, Motion.md M23): what the agent is, and how it rests — the
  declaration's `set: "look"`, a look a motion may move marked `pose`. How it moves (Breath, Squeeze, a jump's
  settings) is every agent's and the motion studio's, and a character saves none of it (`resolveCharacter`). Do not put
  a motion setting on a card here; the agent still plays its rest, by the shared values.
- **The agent is the design system's `Agent`** (`@no-origins/ui/components/agent`), drawing one frame of the package's
  sphere (`@no-origins/ui/lib/sphere-motion`, Motion.md M17), from the look through `sphereMotionOf(look)`
  (`@no-origins/ui/lib/agent-body`). Never a copy of its model or its painting here: the motion studio's stage draws the
  same component. A look with nothing set is the package's defaults, so a default changed there shows here. No tokens
  are written here.
- **It plays its rest, and nothing else** (C3): a still course (`sphereStill`), one frame of it
  (`sphereFrame(course, t, t)`) painted through the `Agent`'s ref on every animation frame — breathing and blinking on
  one clock from when the cell mounts, carried on when the look changes. It never jumps. Under reduced motion it paints
  its first frame and stops. Never pass the `Agent` a still `frame` here as well: it repaints that on every change of
  the look, and the breath would flick to its start while a slider is dragged.
- **A look is held whole.** Save through `resolveCharacter`, never a partial look: a version is frozen, and one that
  said "the default" would change the day a default did.
- **An upload is cleaned in the page and checked again on the server** (C8): `lib/clean-svg.ts` lines it up by its
  template's Guides (the cross to the anchor, the head to a radius of 100), flattens every shape through its
  transforms (`svgpath`), resolves its colours and refuses what the system never draws; `lib/drawing.ts` has the
  template (`templateSvg`, `templatePartOf`) and `strictDrawing`, the server's refusal of anything half-right. The
  shape is the package's `DrawingData` (`@no-origins/ui/lib/agent-face`); the agent draws a look's `upload:<id>` from
  the `drawings` it is handed (every drawing version's shapes, loaded with the draft). The file goes to the private
  `assets` bucket before its version is written, so a frozen version never names a file that is not there.
- **The slider's body springs after a jump**: a typed value moves the head at once and the lime body follows. That is
  the system's slider, not lag here.
- **The cell is its nest.** The sphere's size is a share of its nest, and the nest here is the whole cell, so its
  geometry is `{ cell: diameter, gap: 0 }`. The cell is drawn as the motion studio draws a nest: the muted tint in a
  lime hairline.
- **The cells it covers are painted out in SVG, not masked by the slot.** The `background` fill's corners are a cell's
  curve, which runs along the corner cells' rings; the outer edge of their dashes showed through it, and it hid the
  corner cells he wants kept.
- **The cell is abstract geometry, by his spec**, drawn in SVG round the `Agent` like the motion studio's nests. That
  is the one element here that is not `@no-origins/ui`. Every control is.

## Reviewing it

`pnpm review` boots this app on :3005 and screenshots `/` and `/hiddenstack` (`ORBIT_ROUTES` in `e2e/review.spec.ts`)
on desktop and mobile in both themes — the signed-in page on his machine, where the sweep's browser is signed in first
(`e2e/global-setup.ts`), the offline page in CI. `pnpm review e2e/review.spec.ts -g orbit` runs only this app's
routes. Gitignored helpers in `e2e/.mcp/`, each with :3005 running (and the local stack where it signs in):

- **They read only:** `orbit-public.mjs <out>` (C24's probe: a visitor reads the bar, lists the agents, types a Size
  and counts the server actions it sends — none — then, signed in as the owner, checks Publish, *New agent…* and the
  versions' actions); `orbit-look.mjs <out> [light|dark] [WxH …]` (every box with its cells, anything drawn outside its
  box); `orbit-pages.mjs <out> [WxH] [scheme] [styled]` (every page of every room, anything clipped);
  `orbit-flow.mjs`, `orbit-fold.mjs`, `orbit-controls.mjs`, `orbit-chooser.mjs`, `orbit-signed.mjs`. A control is
  named by its section ("Body size value", "Brows style"), and the probes turn to a section's page first
  (`toSection`).
- **They write his local database**, so clean up after them — versions are frozen, so a test one goes with the
  trigger disabled for it alone, locally only: `orbit-versions.mjs <out> [name]` (makes an agent and publishes it),
  `orbit-upload.mjs <out>` (uploads a drawing and its files), `orbit-rotate.mjs` (autosaves into the draft: snapshot
  and restore it around the run).

## Deploying

The Vercel project is named `character`, its root directory `apps/orbit` and its domain `orbit.no-origins.com`;
`character.no-origins.com` is still attached and 308s to it from `next.config.ts`, path and query intact. The hosted
Supabase lists both among its redirect URLs (`supabase/config.toml`). `vercel.json` is the same file as every app's.
