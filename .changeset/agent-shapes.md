---
"@no-origins/ui": minor
---

The agent can be more than the sphere (Orbit.md C10, version 1). `lib/agent-shape.ts` draws its head as a
cube, a pyramid, a hemisphere, a cylinder, a hexagonal prism or a cone, faced to you and seen a little from above, each
face one flat colour in its tone (`toneCss`: the paint, toward black away from the light, toward white on top), its
silhouette rounded, and taking the room the sphere would so it settles, breathes and squashes as the sphere does,
standing on the sphere's bottom so it rests on its nest's floor, what of it passes the bowl cut there by the `Agent`;
its face is drawn round the middle of its front. `lib/agent-texture.ts` patterns its surface with
flat tiles (dots, stripes, checks, grid, speckle), each face's in that face's tone, fixed to the head. `AGENT_PAINTS`
(`lib/agent-colours.ts`) adds five paints of the agent's own beside lime and violet — pink, peach, yellow, blue and grey,
the `--agent-*` tokens in globals.css with their inks, not the system's palette. The declaration (`lib/agent-body.ts`)
has `shape` in Head and a Surface group (`texture`, `texture-size`, `texture-colour`), all set in the look; `Agent`
paints them, and a look with none of them draws exactly as before. Since version 2 (C12) each shape is a solid in 3D,
turned by a Rotation group (`rotate-x`, `rotate-y`, `rotate-z`) and seen in perspective from in front and above, its
face laid on its front and turned with it (`faceTransform` on the frame); the sphere turns its face. In a nest its
underside gives to the bowl, a cylinder into the page, so its base bends to the ring rather than being cut by it; and
every edge is rounded in the solid itself (a core grown by a ball), so no character has a sharp edge. Its textures
are drawn by hand on its surface (C15): twenty-one kinds of marks with a wobble, from his sheet, carried onto each
solid's faces and round its sides and the sphere's longitude and latitude, one flat colour over the paint, and its
depth is its tone in flat bands (C14) — no gradient — as the Surface group's settings (texture, texture-size,
texture-wobble, texture-colour, depth).
