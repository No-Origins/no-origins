@AGENTS.md

# apps/character — the character studio

`character.no-origins.com`. Where the agents' characters are designed: what an agent looks like, not how it moves.
**Character-Studio.md** (`packages/docs/apps/`) is its document; read it before changing anything here. His brief,
2026-09-30: *"pro level controls for the sphere which is now going to be the agent … the same setup like … motion
studio but only focusing on the characters of agents … the agent will not have any movements … it's just its
appearance properties."*

```bash
pnpm --filter character dev              # :3005 (portfolio :3000, design :3001, admin :3002, engineering :3003, motion :3004)
```

## The shape

The one route, `/`, is one `Grid` with the overlay and the cursor (no intro since Grid.md D49), the motion studio's shell, inside
`CharacterProvider` (`components/character-context.tsx`: the look, and its draft and versions). Its boxes are placed by
`studioLayout` (`src/lib/stage.ts`) from the measured field. **Everything round the circle is a section** (C7, his:
"individual cards of controls for each of that with heading … like we did for projects and case studies or work"):
its heading on a row of its own — the portfolio's section label, composed the same way (`SectionLabel`,
`components/section.tsx`) — and its cards under it, each as many rows as it has lines, never stretched to its room.
**The face** (`components/face-panel.tsx`, C5, C7) is a section a worn slot, flowing down the room to the circle's
left; **the body's Shape, Rotation, Colour, Texture and Rest** (`components/body-sections.tsx`, C10, C12) flow down the room to its
right, and nothing else (C11); **the body** (`components/appearance-card.tsx`, C4) is under the circle, or first in the
right room where it and the bar do not both fit there; **the draft's bar** (`components/versions-panel.tsx`, C6, C11)
is on the field's last row under the circle, between the rooms' pagers: a circle that opens the versions in a dialog
(the next major over them, to publish), and a pill of the agent's select, the draft's state and Publish, which makes the
next minor version at a press (C19: a version is `major.minor` and has no name; `lib/versions.ts` spells them). A column of air stands between the circle and each room. `flow` (`lib/stage.ts`) places a room's sections column by column, a section
whole unless it is taller than a column, and what the room cannot hold is its next page, turned by its pager on the
field's last row (`Flow`); a style picked that moves its section to another page turns to it. **A section folds to its
heading** (C9): the heading row is its toggle, a folded section flows as one row, and the page follows a section that
moves. The folds are held above the rooms (`FoldProvider`, `useFold`) and not saved. A field with no room
beside the circle has one room under it, where the body and its sections, then the face, flow, the bar on the row above
its pager. Every control is `PropertyControl` (`components/property-control.tsx`), a line of its card (`Line`, three
columns — label, control, value — that **every card in a room shares**, `LINE_LABEL` and `LINE_VALUE` in
`components/section.tsx`; the body's card placed on its own fits its label column), made from a setting's type in the
package's declaration (`@no-origins/ui/lib/properties`, `agent-face`, `agent-body`), never a list of its own. **One
grammar for every line** (C11): a number is a slider and its typed value; a choice a select across the control's and
the value's columns, what it offers that is not a value (a face slot's uploads, template and upload) at the end of its
list; a paint, and a colour by name, the design system's `ColourPicker` (C17: every pick of a colour is one); a switch at the control's start. The value's
column holds a number or nothing, and every box is 36px. Do not put a button at a line's end again. **The agent's cell** (C2) is a cell of
the field grown to a radius of three cells, six across, centred across the field **at the top, one row above it** (his);
a field too narrow or too short gives it fewer cells, kept even. **The body's card** (C4) is four across and two down,
centred under the circle, its heading on the row between them: Size, then Shade, one a row.

**Saving** (C6) is `src/app/actions.ts`, server functions on his session (`@no-origins/auth/server`), RLS deciding.
**There are six characters** (C13, Agents.md): Bali (the Agent until he named it) and Kino, Zaza, Oru, Mira and Lola, seeded at version 1 (1.0 since C19); the draft bar's select opens one, and makes a new one by its name at the end of its list (`createCharacter`, C19)
(`open` in the context settles what is pending first), every action takes the open one's `itemId`, and uploads are the
open character's own. The
draft loads when the studio opens, saves `SAVE_AFTER` ms after the last change, whole (`resolveCharacter`), on the
`rev` it was loaded at; a save another device made first is refused, and the draft's bar offers to load it.
Publishing saves what is pending first, then makes the latest version's next minor (`publish("minor")`) or, from the
versions, its next major (`publish("major")`), counted from the latest and never from the one pages show. With no keys it is `offline` and the page is all there is. To save locally,
put the local stack's two keys in `.env.local` (`.env.example`); the studio then asks for a sign-in, and a session made
on the admin (:3002) is this one too, since a localhost cookie is every port's.
Inside it the agent sits (C3), drawn by `AgentCell` (`src/components/agent-cell.tsx`). **The cell is part of the
grid** (his): every cell of the field its circle overlaps is not drawn (`coveredCells`, painted out under the circle),
and the four in the corners of its square, which it misses, stay. Its slot is `transparent`, because the `background`
fill would take those corners too.

**Only what he names stands round it** (his: "do not add any jigs yet … after that I will keep telling you what we
need around it"), one piece at a time, as the motion studio's bench holds only what he names (Motion.md M9). So far
that is the body and its sections, the face, and the draft and its versions. Its name, its meta and its personality are what he has named as coming.

## What is true here and easy to get wrong

- **The agent is the design system's `Agent`** (`@no-origins/ui/components/agent`), drawing one frame of the package's
  sphere (`@no-origins/ui/lib/sphere-motion`, Motion.md M17). Never a copy of its model or its painting here: the
  motion studio's stage draws the same component. A look with nothing set is the package's defaults (`SPHERE_START`,
  version 14 since 2026-09-30), so a default changed there shows here.
- **An upload is cleaned in the page and checked again on the server** (C8): `lib/clean-svg.ts` lines it up by its
  template's Guides (the cross to the anchor, the head to a radius of 100), flattens every shape through its
  transforms (`svgpath`), resolves its colours and refuses what the system never draws; `lib/drawing.ts` has the
  template (`templateSvg`, `templatePartOf`) and `strictDrawing`, the server's refusal of anything half-right. The
  shape is the package's `DrawingData` (`@no-origins/ui/lib/agent-face`); the agent draws a look's `upload:<id>` from
  the `drawings` it is handed (every drawing version's shapes, loaded with the draft). The file goes to the private
  `assets` bucket before its version is written, so a frozen version never names a file that is not there.
- **The agent is drawn from the look**: `sphereMotionOf(look)` (`@no-origins/ui/lib/agent-body`), the reader the
  sphere's tokens go through too, then one still frame. No tokens are written here.
- **A look is held whole.** Save through `resolveCharacter`, never a partial look: a version is frozen, and one that
  said "the default" would change the day a default did.
- **The slider's body springs after a jump** (Motion.md M18): a typed value moves the head at once and the lime body
  follows. That is the system's slider, not lag here.
- **It plays its rest, and nothing else** (C3, his, 2026-09-30): a still course (`sphereStill`), one frame of it
  (`sphereFrame(course, t, t)`) painted through the `Agent`'s ref on every animation frame — breathing and blinking on
  one clock from when the cell mounts, carried on when the look changes. It never jumps: the motion studio moves it.
  Under reduced motion it paints its first frame and stops. Never pass the `Agent` a still `frame` here as well: it
  repaints that on every change of the look, and the breath would flick to its start while a slider is dragged.
- **The cell is its nest.** The sphere's size is a share of its nest, and the nest here is the whole cell, so its
  geometry is `{ cell: diameter, gap: 0 }`. The cell is drawn as the motion studio draws a nest: the muted tint in a
  lime hairline.
- **The cells it covers are painted out in SVG, not masked by the slot.** The `background` fill's corners are a cell's
  curve, which runs along the corner cells' rings; the outer edge of their dashes showed through it, and it hid the
  corner cells he wants kept.
- **The cell is abstract geometry, by his spec**, drawn in SVG round the `Agent` like the motion studio's nests. That
  is the one element here that is not `@no-origins/ui`. Every control is.
- **The studio is behind the sign-in** (`src/proxy.ts`, the shared gate of `@no-origins/auth`), and **opens without a
  login on a development server with no Supabase keys**, so `pnpm review` and CI still see it.

## Reviewing it

In the sweep since 2026-09-30: `pnpm review` boots this app on :3005 and screenshots `/` (`CHARACTER_ROUTES` in
`e2e/review.spec.ts`) on desktop and mobile in both themes. `pnpm review e2e/review.spec.ts -g character` runs only
this app's route. `node e2e/.mcp/character-look.mjs <out> [light|dark] [WxH …]` (gitignored, :3005 running) shoots
`/` at five sizes, or the ones given, and prints every box with its cells and anything drawn outside its box.
`node e2e/.mcp/character-flow.mjs <out> [WxH] [scheme]` turns the face's pages, arches the brows and checks the page
follows them. `node e2e/.mcp/character-controls.mjs <out>` types Size and Shade, drags Size and steps it with the
keys, printing the agent's body each time, and shoots it. `node e2e/.mcp/character-fold.mjs <out> [WxH] [scheme]`
folds and opens headings by pointer, Enter and Space, printing the boxes, the pager and each heading's `aria-expanded`
at every step. `node e2e/.mcp/character-chooser.mjs <out> [WxH] [scheme]` (signed in) opens each of the six from the bar's select,
prints its shape and next version, and shoots its cell; it saves nothing.
`node e2e/.mcp/character-eyes.mjs <out> [port] [scheme]` (signed in) picks each pupil style with the eyes' Colour at Ink
and at Lime, printing the eye's, the pupil's and the catchlight's fills and shooting the cell; it lets the draft load
and then aborts every server action, so it saves nothing.
`node e2e/.mcp/character-rotate.mjs <out> [WxH] [scheme]` (signed in, `e2e/.auth/state.json`) picks the cube and
shoots it at four rotations; it autosaves into the draft, so snapshot and restore the draft around it.
`node e2e/.mcp/character-shapes.mjs <out> [scheme]` (written for C10's textures, which went; its texture part is stale) picks every shape and paint and shoots the
agent's cell for each, then the page. A control is named by its section ("Body size value", "Brows style"), and the probes turn to a
section's page first (`toSection`).
`node e2e/.mcp/character-pages.mjs <out> [WxH] [scheme] [styled]` shoots every page of every room, `styled` picking a
style in three slots first and then opening the brows' style list and the versions, and prints anything clipped and
where every control starts and ends. `node e2e/.mcp/character-signed.mjs <out> [WxH]` (the same needs as the save
probe) signs in and, changing nothing, shoots the page and the versions and opens the template and the file picker
from the style list.
`node e2e/.mcp/character-save.mjs <out>` (gitignored; the local stack, the admin on :3002 and this app on :3005 with
`.env.local`) signs in through the admin's magic link, then saves, picks a brow style, publishes, refuses a repeated
name, goes back and meets a conflict, printing the database after each (written before C19: its publish types a version's
name, which the bar no longer has). `node e2e/.mcp/character-versions.mjs <out> [name]` (signed in) makes an agent by its
name, publishes it to 1.0 and 1.1, a major from the versions to 2.0, has the same name refused, measures the bar at three
sizes and opens Bali again; it leaves the agent and its versions behind, to clean out the same way. It leaves a version behind: versions are
frozen, so clean a test one out with the trigger disabled, locally only. `node e2e/.mcp/character-upload.mjs <out>`
(the same needs) takes the brows' template, uploads a brow drawn on it and exported moved and scaled, checks the
preview, the save, the file, the draft and where the agent wears it, then a refused one; it leaves a drawing and its
files behind, to clean out the same way (the files through the storage API). `node e2e/.mcp/character-clean.mjs
<dir-with-clean.js>` runs the cleaner on sample exports and refusals in a bare page.

## Deploying

No Vercel project yet: creating it (root directory `apps/character`, the `character.no-origins.com` domain, the
admin's two Supabase variables) and adding `https://character.no-origins.com/**` to the hosted Supabase's redirect URLs
are his steps. `vercel.json` is the same file as every app's.
