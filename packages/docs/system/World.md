# No Origins — The World

The base UI of No Origins: a 3D world that keeps growing, in which every app becomes a place. This document decides how
the world is made, how it reaches a visitor and how it is explored. It takes over from the grid (Grid.md) as the base
every app stands on, one app at a time. Orbit (`apps/orbit`, orbit.no-origins.com) is the world's first app.

**Draft, not signed off.** What is marked *his* he said in his own words; what is marked *mine* Claude proposes, for
him to keep, change or drop.

Current as of 2026-10-12.

Rule numbers are this document's own, W1 onward. Companion documents: **Grid.md** (the base this replaces),
**Cinema.md** (the other 3D work, whose libraries this may share), **Brand.md**.

---

## W1. What it is for

- **The base UI of No Origins is a 3D world** (his), in place of fixed layouts of grids and cells.
- **The world keeps being built and grown** (his). Each app becomes a place in it, a terrain he describes and Claude
  builds (his). Whatever he describes in the world, its terrains or anything else, is built from his words and
  corrected in words, as Home's house and Cinema's libraries are.
- **Exploring it is easy for every visitor** (his): the architecture is judged first by that.
- **The start location** is where every visit begins (his first mock: a pale plain of round portals with an agent
  in each, a figure sitting on a rock, mesas in a sea of mist, floating islands, a low sun).
- **Orbit is the world's app** (his): the old Orbit, where the agents' looks were made, was deleted for it.
- **First the world, then what is built in it** (his, 2026-10-12): what goes in the world, the apps among it, is
  thought about once the world is built.
- **The world is called the Orbit** (his: "And the world is called 'The Orbit'"): an open box of his size, its width, breadth and height (W29), starting as W23's 1000 × 1000 m square, with no ground plane: its land is what is built in it, its ecosystems, habitats, sectors, zones and blocks (W4, W23, W24, W25); the earlier sphere is historical (W16).

## W2. One world, one canvas that never reloads

- *Mine:* **the world is drawn by one renderer, mounted once in the root layout**, and it stays mounted through every
  navigation.
- *Mine:* **every place has a URL. Going to a place is the camera travelling, never a page load.** Back and forward
  travel back and forward; a link to a place lands there directly.
- *Mine:* so seamless travel holds only inside one app. An app that becomes a place becomes a route of Orbit (Open:
  what is built in the world).

## W3. The world is data; what a thing can be is code

As Motion.md M20 and Cinema.md F4 decide for their libraries:

- *Mine:* **a builder is code**: one kind of thing (a ground, a mesa, a portal, a scatter of rocks, a floating island)
  with its controls, versioned. A version he has seen is frozen, and a change is the next version.
- *Mine:* **a place is data**: where it stands in the world, and its entries, each a builder at a version with its
  configuration and its cells.
- *Mine:* his description becomes data, or a new builder where the library has none. **Growing the world adds data and
  builders; it never changes the engine.**

## W4. The world is built of blocks

- **A block is the world's spatial unit, by default 1 m wide, 1 m long and 0.25 m high** (his, 2026-10-12: "Each
  block will be 1m x 1m x 0.3m", then "Lets make the height 0.3 to 0.25"). The environment's blocks, 10 × 10 × 1 m,
  from before, are removed (his: "remove it"; Environment version 12).
- **Each block's width, length and height is set on its own, as a multiple of 1 to 10 of its default** (his: "I should
  be able to configure with each of width, length and height in the range of multiple from 1 to 10 individually on
  their default sizes. Example I can just set height to 1 (since it is 4x of default height)"): 1 to 10 m wide and
  long, 0.25 to 2.5 m high. *Mine:* a whole multiple, so every block stays on the lattice below.
- **Each block has its own colour** (his: a zone's colour, "Drop it"), one of the world's colours, picked with a
  `ColourPicker` (the root CLAUDE.md).
- **Blocks combine into a zone, zones into a sector, sectors into a habitat, habitats into an ecosystem, and every
  ecosystem together is the world** (his). The block, the zone and one sector are built (W24); the hierarchy's entries,
  coordinates and data are W25.
- **A zone is a named group of assets: blocks, portals, rocks, and later a library of assets** (his: "Group of assets -
  Blocks, Portals, Rocks etc (we will eventually have library of assets)").
- **A sector is a named group of zones, a habitat of sectors, an ecosystem of habitats, and each has an entry zone**
  (his: "Similar to Zones, we can name it and group zones under it"; "A habitat will also have entry zone"; "An eco
  system will also have an entry zone"). How an entry is held is W25.
- **From the zone up, a thing is named, and groups what is in it** (his: "when creating anything from the level of
  zones and above, I should be able to name them. And then I should be able to group the items in it").
- **Portals are assets, not spatial units** (his: "Portals are not space units"): a zone may group one, as it groups
  blocks (his, above); the block is the unit everything is measured in.
- *Mine:* **blocks stand on one lattice**, in steps of the default block: 1 m across, 1 m along and 0.25 m up (a
  level), in the world's coordinates (W25). A block's place is its north-west corner at its bottom; it fills as many
  steps each way as its size, and no block is placed where another stands, anywhere in the world. A unit moved over
  another is not refused (its coordinates are his); the card counts the zone's blocks that overlap another's.
- *Mine:* **positions on the ground are cells**, the grid's own idea in three dimensions: 2 m (Open: the cell's size,
  now that a block is 1 m). An agent stands on a cell, never between two (the root
  CLAUDE.md, "How he works").
- *Mine:* **the unit the world is cut into and sent in (W5), a chunk, is one of the hierarchy's units**, which one decided
  with the first place.

## W5. Streamed by distance

- *Mine:* **a manifest lists every chunk**: where it is, and the hash of its file. Each chunk is a small file on the
  CDN, named by its hash and cached for good, so growing the world never makes a visitor fetch again what has not
  changed.
- *Mine:* **near chunks are built in full, far ones as simple silhouettes, and past the haze nothing.**
- *Mine:* **travel fetches the destination as the camera sets off**; the flight covers the time it takes.
- *Mine:* so **what a visitor pays for is what is near them, never the size of the world.**

## W6. Made on the device

- *Mine:* **geometry is generated on the visitor's device from a configuration of a few kilobytes**, in a worker, so
  the page never stutters (as the grid's painter does, Grid.md D38).
- *Mine:* **a downloaded model only where code cannot make the thing** (a character, perhaps), as compressed glTF.

## W7. No loader

- *Mine:* **the first frame is the start location at low detail**, from data in the page itself: the sky, the ground,
  the silhouettes. Detail arrives into it with no bar, no spinner and no blank screen (Grid.md D49).
- *Mine:* three.js loads after the page, so the page never waits for it.

## W8. Draw only what changes, as well as the device can

- *Mine:* **the world draws on demand**: when nothing moves, nothing is drawn, and a hidden tab draws nothing. Clouds and sky
  have independent clocks (W22, W23); while either flows the world draws every frame. Paused motion, zero flow/speed
  or reduced motion holds them still. The current world has no sea.
- *Mine:* **quality follows the device**, chosen at the start and adjusted by the time each frame takes: the pixel
  ratio (at most 2), shadows, how dense the scatter is, how far the view reaches.
- *Mine:* **light that never changes is worked out once** and kept in the ground and the rocks.

## W9. One renderer for every device

- *Mine:* **three.js's WebGPU renderer**: WebGPU where the device has it, WebGL 2 where it does not, from one set of
  shaders written in TSL. Plain three.js, as Home and Cinema are, with no React renderer.
- *Mine:* the cost: Cinema's entries are written in GLSL, and sharing them means porting them to TSL (Open 3).

## W10. The interface is the design system, over the world

- *Mine:* **text, lists, forms and controls are `@no-origins/ui` in the page, over the canvas**, pinned to a place
  when they belong to one. Text is never drawn in 3D.
- **The pointer is the design system's** (his: "Looks like Cursor is not used from design system. We should"): the
  ring of Grid.md D34, over the world and everything over it, filled while pressed; the world sets no cursor of its own
  (no hand, no grab, no crosshair). *Mine:* the page carries `data-cursor` where the device hovers with a fine pointer,
  as the grid's field does, so a phone keeps its own.
- *Mine:* **each place's page is rendered on the server at its URL**, so screen readers and search engines read it.

## W11. A way through without 3D

- *Mine:* **every place can be reached by keyboard**, and is listed in a menu of places.
- *Mine:* **under reduced motion, travel is a cut.**
- *Mine:* **a device that can draw neither WebGPU nor WebGL 2 gets the places as pages.**

## W12. Where the code lives

- *Mine:* **`apps/orbit` holds the world**: the engine in `src/world`, the places' data and their routes. The engine
  moves to a package of its own when a second app needs it, Cinema perhaps.

## W13. Brand.md is changed by the world, not followed by it

- **The world does not follow Brand.md as it stands** (his, 2026-10-12): the changes he brings in the world update
  Brand.md instead. Until a change is made there, what the world looks like is what he decides for it here.

## W14. The builder: a sidebar, and a page for each jig

- **The builder has a sidebar** (his: "We need Sidebar Menu we have"), the design system's `Sidebar` floating over the
  world, its items his: **World** first, the world's boundaries, since everything else is inside it (W29), **Environment** (the jigs for the layout of what stands in the environment), **Camera** (the
  jigs for the camera), **Map**, then **Elements**, a group, **Portal** its first, then **Sector** (his: "In elements,
  add controls for the plane", then "let's call it sector"; W24). *Mine:* folded, it keeps its icons; on a
  phone it is a sheet, opened by a button at the top left; `/build` opens on Environment.
- *Mine:* **every jig has a page, `/build/<jig>`**, where it is tuned: the world seen as that jig needs it, and its card
  of controls. The world stays mounted from a place to a page and back (W2); only the view changes. World is the
  visitor's camera, which travels up to the boundaries and is held there, the map drawing them (W29). Environment looks
  across the open square at the sector's entry floor, for the sky, clouds, light and fog (W23); a drag goes round, a
  right-drag moves, the wheel comes nearer. Camera is the visitor's eye itself; Portal looks into the portal, which
  stands on that page alone, on a block of its own, cut into its top, and opens as the page comes into view; Sector looks
  at the start's entry zone from about 8 m off, and is where the hierarchy is made and blocks are built into zones (W24,
  W25). A drag goes round what Environment, Portal and Sector look at.
- **The card stands right of the sidebar, centred down the page** (his: "Let the jigs align center"), and along the
  bottom of a phone (*mine*), at most half its height, its controls scrolling inside it; the view centres what it looks
  at in the room the card leaves (the camera's page too: the eye's picture is shifted, never the eye). *Mine:* the
  interface's layer lets the pointer through to the world, a drag and the
  wheel, and takes it back only on the sidebar and the card. **It has a card's padding, `inset`** (Spacing.md SP3; his: "I think we need more
  padding"), not the dense box's `inset-tight` it had.
- **Every control is the design system's** (the root CLAUDE.md): a number is a `Slider`, stepped and marked; a colour is
  a `ColourPicker`; an on and off is a `Switch`. **The slider is the design system's, as it is everywhere** (his: "Are
  you even following a design system?"): a held head snaps to a mark in its zone, with the tick (Motion.md M21), and a
  long range marks every so many of its units. **A number's value is typed beside its label**, as the motion studio's
  controls are: any value on its step, within its range, set by Enter or leaving the field (his: "Angle still doesn't
  provide 1 degree level control").
- *Mine:* **the settings are kept in the browser while he tunes**, and Copy puts them on the clipboard to send back. The
  next version answers his notes, and his values become what the builder starts from.
- **A builder's page stays open for everyone to play with** (his: "Let the build still be so that users can play with
  it"). *Mine:* what a visitor sets there is theirs alone, kept in their browser, and shown only on that page; the world
  everywhere else is his settings, and Reset goes back to them.
- *Mine:* **how a thing in the world moves is its builder's, tuned on its page** with Play, never on the motion
  studio's bench (Motion.md is the interface's motion): its numbers are the builder's settings, so its motion is data
  like the rest of it (W3). Where a motion has the system's own terms it takes them (a spring's Response and Bounce,
  `@no-origins/ui/lib/spring`). Under reduced motion a thing arrives at rest (W11).

## W15. The library

| Builder | Version | What it is | |
|---|---|---|---|
| **World** | 1 | The world's boundaries (W29), on a page of its own at the top of the builder: **Boundaries**, Width (west to east), Breadth (north to south), each 20 to 4000 m on a step of 2 m and centred on the middle, and Height (up from the floor, y 0), 10 to 2000 m. Starts: 1000 × 1000 m, 1000 m high. | *mine*, his to tune |
| **Environment** | 17 | **Current: a continuous cloud sky controlled by Coverage, worker-generated density/light and a bounded cloud render pass (W31), on the open 1000 × 1000 m square's atmosphere, travel and cardinal directions (W23), and nothing built: no ground plane and no blocks (his: "remove it", W24); its Grain went with its blocks, and Grain size is now the clouds' alone. Version 11 is frozen with its blocks' builder (`environment-v11.ts`, `build-blocks-v11.ts`).** Versions 13–15 and their decisions are W26–W28. The following describes its earlier versions: The Orbit, dome, sky and clouds, water, fog and editable blocks of version 2, with the colouring and texture of his landscape reference (2026-10-12). **Light and texture**: Horizon, Sunlight and Shadow colours; Warmth (0–1); Sun height (0–90°), Sun turn (−180–180°); Shade (0–1); Grain (0–0.5), Grain size (0.02–0.3 m). The sky goes from blue-lavender overhead to apricot at the horizon with a low sun; the clouds and block faces take peach light and lavender shade from that same direction. Two scales of mineral grain are anchored to the surfaces, never the screen, and are still. His correction on version 3: the reflective water overwhelmed the pastel texture, and the camera inside the sphere looked out into infinity. **Version 4** keeps his chosen soft pastel layer below the dome: a matte finite disc with anchored grain, no reflected scene or glints. Water adds **Viscosity** (0–1, higher slows and broadens ripples) and **Reach** (1.25–5 times the radius, its finite edge). These are art controls, not fluid simulation. Dome adds **Contours** (0–1): three sparse great-circle seams and an equator make its enclosing curvature readable. The lower dome is no longer painted as opaque deep water, so being inside does not look submerged. Starts: sky blue, apricot horizon and fog, peach sunlight, lilac shade, rose water, sand blocks; Warmth 0.55, Sun height 12°, Sun turn 135°, Shade 0.45, Grain 0.18, Grain size 0.06 m. The existing radius, dome, sea level, wave, cloud, fog distance and block settings remain as in version 2, except that a block is 1 m high (his: "reduce the block height from 5m to 1 meter"), so a Level is a metre (−200 to 199). Version 4 starts with Water level 0 m over the sphere bottom, Waves 0.25, Speed 0.5×, Viscosity 0.7, Reach 2.5×; Dome Tint 0.28, Gloss 0.12, Contours 0.25. Reset uses these starting values; Copy includes all atmosphere settings and blocks. Version 5 adds sculpted clouds with independent pastel shading and efficient instancing (W17). Version 6 adds animated pastel water and viscous sky gases, with independent flow controls (W18). Version 7 follows his pastel threaded-water reference (W19); version 8 softens the swells and adds a dreamy haze finish (W20). Version 9 replaces the remaining puff clusters with connected liquid clouds (W21). Version 10 follows his chosen powdered pastel image (05), using flowing cloud volumes, soft irregular water and a reproducible tuning loop (W22). Versions 1–10 are frozen, their builders where present too. | his reference; first values mine, his to tune |
| **Camera** | 8 | What the world is seen from (his: "We don't need modes. Since I can decide on height and angle, and since we also decided to have movement of the camera rather than distance from center, click and drag or arrows or qwerty should move"). **He decides how it looks at the world** — **View**: Height (0 to 30 m over the ground), Angle (0°, level, to 90°, straight down), Turn (−180° to 180°, the way it faces; 0 the way the start faces); **Lens**: Field of view (20° to 90°, top to bottom, a degree a step: his "Angle of view should give me 1 degree level controls"), Zoom (0.5× to 4×, narrowing it; the wheel zooms on its page, a step a notch) — **and the camera moves over the ground**, keeping them: where it is in the world is not a setting, so nothing on the card moves with it. **Movement**: a drag slides it, the ground under the hand following the hand at a Speed of 1× (0.2× to 3×); the arrows and W A S D carry it forward, back, left and right of the way it faces at the Keys' speed (1 to 20 m a second); it picks up and loses speed over the Glide (0 to 2 s), a let-go drag carrying on over it, or, After a drag: Return, springing back to where the hand took hold on Response and Bounce. The keys are the world's unless a control on the card is in use; a press on the world gives them back; on the visitor's camera D walks and no longer flips the theme (the design system's `d`). There are no modes and no locks. **Focus and Flight**: a click on a portal moves the camera so the portal is at the middle of the view (on the camera's page, of the room the card leaves), at Focus's Height (0.5 to 20 m), Angle (10° to 90°, a degree a step) and Zoom (1× to 4×), facing the way it faced, flying on Flight's spring (Response, Bounce), lifting by its Arc (0 to 10 m); the card's values move as it flies. A click on the ground, or Escape, flies back; the hand or a key stops a flight where it is; the pointer is the design system's ring over all of it (W10). Starts at 1.6 m, 22°, Turn 0°, seeing the portals at the middle of the view (on the start spot, where it first stood), 50°, 1×; Speed 1×, Keys 4 m/s, Glide 0.4 s, Stay; Focus 3 m, 50°, 1.5×; Flight 900 ms, 0.1, 1 m. Under reduced motion nothing glides, springs or flies. His notes: on version 1, more distance, zoom, tilt and height; on version 2, the drag; on version 3, seeing the values and the lock; on version 4, the click; on version 5, the camera set by what it looks at; on version 6, the height; on version 7, no modes and movement by drag and keys. Versions 1 to 7 are frozen. | *mine*, his to tune |
| **Map** | 3 | Square plane with N/E/S/W markers, camera dot and view wedge (the environment's blocks, drawn by column, went with them; W24). Visible on the Environment, Camera, Map and start views, beneath the compass. Click anywhere to travel: Environment translates its orbit rig immediately; the visitor flies there. Both stay within the square. Size 120–320 px (at most 40vw); Shows The plane or Around the camera; Reach 10–1000 m; Turns Fixed or With camera. The full-plane map leaves its corners inside the rounded Card; with camera rotation it also fits the diagonal. Starts 200 px, The plane, Reach 40 m, Fixed. Versions 1–2 are frozen. | *mine*, his to tune |
| **Portal** | 6, **his settings** | A round portal cut into the ground, called the hole until version 4 (his: "Let's add a hole", then "Let's call these holes as portals"; his first mock): its opening, a thin line round its edge, level with the ground, and its wall falling smoothly into the dark like a shadow. Size: Radius, Depth. Rim: Width (1 to 10 cm), Colour. Wall: Colour, Darkness (how dark the bottom gets), Reach (how far up the wall the dark climbs, 0 to 2: past 1 it climbs beyond the opening, at 2 the wall half dark already at its edge; his: "Increase the range for reach till 2.0"); it starts dark from the opening. **Opening** (his: "Portals should expand while it loads with a fluid motion"): it grows out of a point to its size on a spring, Response and Bounce, its edge rippling like a liquid's as it spreads (Ripple, how far), the ripple dying away as the spring comes to rest. **Waves** is a range, from and to, on one slider of two heads, and each time it opens three waves are drawn at random from it, each a whole number round and starting at a random place, so no two openings ripple alike (his: "I need waves to be range I can set and the waves should be random values between the range"). It opens as the world arrives, on its first frames, and again on Play. The ground is cut past the furthest the opening reaches, and a collar of the ground's colour fills the rest, so the portal never meets the ground while it moves. Lit by nothing; the colours to pick are seven from his mock and black (his: "We need black in the color palette"). It stands on its own page alone, two cells ahead of the visitor, cut into the start location's blocks, opening as the page comes into view; the environment has no portals (his: "Portals are not space units. We don't need those in the environment now"). His notes on the hole: on version 1, "Instead of steps and shade, I think it should be gradient like a shadow or dark hole"; on version 2, "We don't need rim and glow"; on version 3, "I think we should have rim. I'm thinking minimal line rim at the edge?". Versions 1 to 5 are frozen beside it. **His settings** (2026-10-12): Radius 0.5 m, Depth 2.0 m; Rim 0.01 m, Black; Wall Cream, Darkness 1.0, Reach 1.0; Opening Response 300 ms, Bounce 0.4, Ripple 0.10, Waves 3–8. | his settings; anyone plays with it on its page |
| **Sector** | 4 | Where the world's hierarchy is made, and blocks built into its zones (W4, W24, W25); the plane in version 1, the sector on a plane in version 2, a sector of named zones on an N × N entry floor in version 3 (his: "In elements, add controls for the plane", "let's call it sector", "Let's remove the plane and instead of side, give me number of blocks"). **Ecosystem**, **Habitat**, **Sector**, **Zone**, a group each: the one picked, among those it sits with, in a Select (the entry marked), its menu (New, Make it the entry, Delete with all it holds; the entry's and the last ecosystem's Delete is off), its Name, and X, Y and Z in metres from the origin of what holds it, typed (X and Z a whole metre, ±500; Y a level, 0.25 m, ±50); its note says what it is in, what it holds and its entry, and where it is in the world. Picking a unit picks its entry zone, following the entries down, and the view travels there. **Build**: Tool (Place, Remove), Level (0 to 99, over the zone's origin), Width, Length and Height (1 to 10 times the default), Colour. A click places a block into the picked zone, on the level's floor or against a block, a ghost at its size showing where; Remove takes away the block the pointer meets first, from any zone. **Grain**: Grain (0 to 0.5), Grain size (0.02 to 0.3 m), every block's: Reset puts these back and never touches what is built. Copy sends the grain and what is built, each unit, its place and entry, each zone's count, and the world's data. Starts: the world of W25 (one ecosystem, habitat, sector and Entry zone, one Sand block), Grain 0.1, Grain size 0.06 m, Level 0, a 1 × 1 × 1 Sand block next. Versions 1 to 3 are frozen (`sector-v1.ts` to `sector-v3.ts`, with `sector-zones-v3.tsx` and `build-blocks-sector-v3.ts`) | *mine*, his to tune |

## W16. The Orbit: a sphere, and nothing outside it (historical; superseded by W23)

- **The world is a floating space covered with a glossy spherical dome, clouds above the sphere and water below it**
  (his).
- **Spatial units are placed in the 3D space inside the sphere** (his: "I should be able to place these spacial units in
  the 3D space within the sphere"), on the environment's page (W14).
- **Everything is locked inside the sphere** (his: "We should always be locked/bounded inside the sphere"). *Mine:* a
  block is in the world only where all of it is inside (one the sphere has grown too small for is kept, and stands again
  when it grows); every camera stays half a metre inside the dome however it is moved, by a drag, the keys, a flight or
  the map: the visitor's camera keeps its height and stops at the sphere's round there, and a looked-round page's comes
  in along its line of sight.
- *Mine:* **the sphere's middle is the point the visitor starts on**, so half the Orbit is above the start location's
  floor and half below it.
- *Mine:* **how it looks**. Nothing is lit. The dome is glass seen from inside: its colour lies over everything behind it
  by its Tint, and it shines, a sharp spot and a soft sheen, where two lights (low behind the visitor's right, and
  fainter ahead on the left) are reflected off it, as bright as its Gloss; slantwise it shows more of itself. The clouds
  are puffs in a layer over the dome, from a fixed random draw, shaded from their colour on top to Dusk underneath. The
  sea in version 4 is a matte pastel disc below the dome, cut away where it would pass inside the sphere, with a finite
  feathered edge. Viscosity broadens and slows its coloured ripples; the surface carries still mineral grain. The dome
  has sparse adjustable great-circle contours, and its lower half keeps the dome's tint instead of becoming opaque
  deep water. The sky is painted from a cool zenith to a warm horizon, with a sun whose direction also shades the
  clouds and block faces. The faces blend towards Sunlight or Shadow by Warmth and Shade, with two scales of
  mineral grain in world space; a face two blocks share is never
  made. Brand.md does not bind any of it (W13).

## W17. Clouds: sculpted pastel shapes, efficient to draw

- **His brief** (2026-10-12): better cloud controls, very efficient construction, pastel artistic controls.
- **Environment version 5** separates **Sky**, **Clouds** and **Cloud colour**. Clouds: Count (0–60), Above
  (0–100 m clearance above the dome), Width (0.05–0.5 of the dome radius), Height (0.15–1.5 of puff width),
  Puffiness (0–1, three to eight puffs per cloud), Spread (1–5 times the radius), Scatter (0–1), Seed (0–999).
  Cloud colour: Colour, Light and Shadow swatches; Warmth and Shade (0–1), Softness (0.05–1, the transition from
  light to shade), Grain (0–0.5). Light direction follows the world's sun; cloud colours and strengths are independent.
- **The first values are mine, his to tune**: 28 clouds, Above 10 m, Width 0.2, Height 0.55, Puffiness 0.6,
  Spread 3, Scatter 0.65, Seed 7; cream colour, peach light, lilac shadow, Warmth 0.35, Shade 0.3,
  Softness 0.8, Grain 0.08. Copy includes them all, Reset restores them, and browser settings keep them.
- **The arrangement is deterministic** (`clouds.ts`): one fixed random draw a seed, a golden-angle placement
  with scatter. Increasing Count retains the existing clouds; changing Puffiness consumes the same random samples
  so other clouds do not move. A cloud's lowest puff stays above the dome even at the greatest Width and Height.
- **One instanced draw** (`build-clouds.ts`): at most 480 opaque puffs, one shared 180-triangle icosphere with
  smooth normals, one material, bounded for view culling. The previous puff was 320 triangles; this is 44% fewer.
  No downloaded textures, volume marching, shadow maps or transparency overdraw; clouds are still and have no frame loop.
- **Only the changed part updates**: cloud shape changes rebuild clouds alone, never the sea, dome, blocks or portals.
  Colour, light, shadow, softness and grain write shader uniforms without rebuilding geometry or recompiling the shader.
  Version 4's environment and surroundings builder are frozen alongside version 5.

## W18. Water and sky: animated pastel fluids

- **His brief** (2026-10-12): water and sky each have their own form, both pastel animated fluid; control waves
  and their speed. The sky is high-viscosity gases flowing with wind, with controls for that too.
- **Environment version 6**: **Water** adds Pigment, Wavelength (2–60 m), Direction (−180–180°) and Contrast
  (0–1), alongside its existing Waves, Speed and Viscosity. A finite sheet rolls gently in geometry, with folded
  pigment bands advecting over it. Higher viscosity slows the flow and lengthens the folds. A fragment is discarded
  wherever a crest would pass inside the dome; the finite Reach and soft outer edge remain. No mirror reflections.
- **Sky** adds Pigment, Flow (0–1), Billows (1–8, larger gives smaller folds), Speed (0–3×), Wind (−180–180°),
  Viscosity (0–1), Turbulence (0–1), Softness (0.05–1). A seamless field of pastel pigment moves over the sky shell
  in direction space: wind carries it, a domain warp curls it, and viscosity slows and stretches it along the wind.
  The horizon and sun remain; the sculpted clouds (W17) keep their own form above the dome.
- **First values are mine, his to tune**: sky rose Pigment, Flow 0.65, Billows 3, Speed 0.5×, Wind 45°,
  Viscosity 0.8, Turbulence 0.55, Softness 0.75; water cream Pigment, Wavelength 12 m, Direction 30°, Contrast 0.5.
  Other settings remain from version 5. Copy includes all settings; Reset restores them.
- **Independent clocks**: Sky Speed 0 freezes only the sky, Water Speed 0 freezes only the water. Sky Flow 0
  removes its moving pigment, Water Waves 0 makes the sheet still. When neither moves and no other action is running,
  the engine stops drawing. Under reduced motion both fluids hold still. A background tab receives no animation
  frames; elapsed time is capped on return so neither fluid jumps forward over the time away.
- **Efficient art-directed flow** (`build-fluid-sky.ts`, `build-fluid-water.ts`): one sky shell and one 64×64
  water sheet, no texture assets, volume marching or extra reflection render. Noise and smooth pigment mixing
  suggest the fluids rather than simulating their physics. Flow controls write uniforms, without rebuilding their
  geometry or recompiling shaders. Shared dome/light changes and spatial changes (the sphere, water Level/Reach)
  recreate the surroundings; fluid-only controls do not.
  Version 5's environment and surroundings builder are frozen alongside version 6.

## W19. Water: pastel swells with fine surface threads

- **His reference** (2026-10-12): rounded blue troughs and pink crests, with many fine pale contour threads running
  over the waves. He asks for this texture and these waves, with controls.
- **Environment version 7** adds Water Height (0–8 m, scaled by Waves) and Cross waves (0–1), with the existing
  Wavelength (shown as Length), Direction, Speed, Viscosity and Contrast. Three smoothly crossed swells give the sheet its form;
  their amplitude is normalised so Height is the maximum rise at Waves 1. Blue and pink mix by elevation, shaded
  gently from the displaced surface's normal and the world's sun.
- **Water threads** is its own group: Colour, Amount (0–1), Density (8–120 threads per wavelength), Width
  (0.03–0.5 of the thread spacing). The threads gently bend across the sheet and ride its actual displacement.
  A shader draws them with derivative antialiasing, and fades them when subpixel to avoid horizon shimmer.
  Amount 0 removes them; they are not a wireframe or separate line objects.
- **First values are mine, his to tune**: sea-blue base, rose pigment, Waves 0.7, Height 2.5 m, Wavelength 18 m,
  Cross waves 0.45, Contrast 0.65; cream threads, Amount 0.75, Density 48, Width 0.12. Speed, Direction and
  Viscosity carry on from version 6. Copy includes every setting; Reset uses these values.
- **One surface draw**: geometry adapts to Wavelength, from 64 to 192 segments per side (at most 73,728 triangles).
  Wavelength or spatial changes rebuild its sampling; other water controls update uniforms. The bounding sphere
  includes maximum displacement. Every fragment inside the enclosing sphere is discarded, including a crest;
  the finite outer edge is retained. The independent clocks and reduced-motion behaviour of W18 remain.
  Version 6's environment, fluid builders and surroundings builder are frozen alongside version 7.

## W20. Water: smoother swells and a dreamy haze finish

- **His note on version 7** (2026-10-12): it is nice, but the waves feel like lines; try smoothing them, with a
  dreamy, hazy texture.
- **Environment version 8**: threads start at Amount 0. Softness widens the swells, reduces the smaller crossed
  harmonics and broadens the colour transition, preserving the maximum height. The analytic slopes follow the
  softened geometry, so its lighting stays smooth.
- **Water finish** adds Haze colour, Softness (0–1), Haze (0–1), Mist size (4–80 m) and Grain (0–0.3,
  water-only). A broad slow-moving noise veil and distance colour scatter mix the water towards its haze colour.
  This is painted into the water's shader, not a screen blur, extra transparent layer or postprocessing pass.
  Grain stays anchored to the water. Optional threads can still be tuned in their own group.
- **First values are mine, his to tune**: Height 2 m, Length 24 m, Cross waves 0.35, Contrast 0.5,
  Softness 0.8, Haze 0.45, cream Haze colour, Mist size 24 m, Grain 0.05, Threads 0. Other values carry on.
  Copy includes the finish, Reset restores it, and browser settings keep the tuning.
- **The cost remains one water surface draw** with uniform finish controls. The independent water clock carries
  the haze too: Speed 0 freezes it, and reduced motion holds it still. The clipped dome boundary and finite Reach
  remain. Version 7's environment, fluid builders and surroundings builder are frozen alongside version 8.

## W21. Clouds: connected liquid forms, not puff clusters

- **His correction** (2026-10-12): clouds still looked basic and puffy, rather than liquid as discussed.
- **Environment version 9** replaces the puff builder entirely: **one connected, wind-stretched lens per cloud**,
  its cross-sections twisting and folding smoothly on the GPU. Pastel pigment drifts through the surface. There
  are no intersecting puff spheres or seams between separate lobes.
- **Clouds** replaces Puffiness with Stretch (1–6×), Flow (0–1), Speed (0–3×), Viscosity (0–1). Width, Height,
  Count, Above, Spread, Scatter and Seed remain. Wind follows Sky Wind. Higher viscosity slows the folding;
  Speed 0 freezes clouds independently of water and sky; Flow 0 gives a calm continuous lens. Their colours,
  shading softness and grain stay in Cloud colour.
- **First values are mine, his to tune**: Stretch 2.8×, Height 0.35×, Flow 0.65, Speed 0.5×, Viscosity 0.8;
  the other cloud values remain. Copy includes these values; Reset restores them. Old Puffiness is no longer read.
- **One instanced draw**: at most 60 connected surfaces, one shared 40×16 smooth geometry and material. One cloud
  consumes one fixed seeded placement, preserving the prefix as Count changes. Clearance and culling bounds include
  the maximum fold, so nothing falls inside the dome or vanishes while folding.
- **Independent cloud clock**: only its time uniform changes per frame. Shape controls rebuild clouds alone;
  Flow, Speed, Viscosity and shading controls do not rebuild geometry. Water and sky can both be stopped while
  clouds move. With all three still the renderer rests, and reduced motion freezes all three.
  Version 8's cloud builder, placement model and environment are frozen alongside version 9.

## W22. Powdered pastel world: real-time interpretation and feedback loop

- **His selection** (2026-10-12): clouds and water still looked mechanical and patterned. After image exploration,
  he picked **05**, the powdery sculptural world. Its five subsequent generations were too similar; he asks to build
  the Three.js version with controls, then improve it through feedback. These images establish the material target,
  not a promised pixel-identical render or evidence of animation quality.
- **Environment version 10** is the first real-time interpretation of 05: blush and cream cloud banks with sage
  shade, powder-blue sky, milky aqua water carrying rose pigment, soft warm light and fine grain. The sky's background
  wash starts off; the dimensional clouds provide the visible gas forms. The Environment view is wider and nearly
  level, with editable blocks below the centre and clouds overhead. Construction **Guides** can be Hidden or Visible;
  they start hidden, and the placement ghost and block editing still work.
- **Cloud density, not solid lenses**: one box encloses banks outside and above the dome, with a generated 96³
  density texture. Unequal lobes unite smoothly into one field. The shader samples through depth, absorbs light,
  mixes pigment, erodes edges and folds/drifts the density using a generated 32³ curl-velocity field. No image assets,
  detached puff meshes, reflection render or fluid solver. This remains a controllable procedural approximation;
  Viscosity slows transport and resists deformation, rather than claiming physical gas viscosity.
- **Cloud texture** adds Density (0.2–3), Erosion, Powder and Softness, Grain, and Detail (16–64 ray samples).
  **Cloud colour** adds Pigment and Blend. Count, Above, Width, Height, Stretch, Flow, Speed, Viscosity, Spread,
  Scatter and Seed remain. The seed preserves the placement prefix as Count changes. Shape/distribution changes
  rebuild only clouds; texture, colour, flow and sample-detail controls update uniforms. The volume bounds keep even
  its moving density above the dome; its empty border prevents an opaque box edge. Texture allocations are disposed
  with their material.
- **Water** replaces contour threads with five nonparallel, unequal swells, broad spatial phase warping and
  matching smooth normals. Viscosity suppresses smaller harmonics; unresolved wavelengths fade instead of aliasing
  into triangles. The sheet remains bounded, adaptively sampled up to 192 segments, with every fragment inside the
  dome discarded. **Water finish** adds Reflection, Current and Current speed. Reflection is a soft analytic sky/light
  approximation, not a live reflected cloud scene. Current transports pigment independently of wave speed.
  Softness, Haze, Mist size and Grain remain. Threads are retired from this version.
- **First values are mine, his to tune**: 24 cloud banks, Above 2 m, Width 0.42×, Height 1.1×, Stretch 1.6×,
  Spread 3.4×, Seed 7; Flow 0.8, Speed 0.7×, Viscosity 0.65; Density 1.3, Erosion 0.45, Powder 0.5,
  Softness 0.55, Grain 0.14, Detail 32; rose/cream with sage shade. Water Waves 0.7, Height 3 m,
  Length 18 m, Cross waves 0.65, Speed 0.5×, Viscosity 0.7, Current 0.6 at 0.5×, Reflection 0.45;
  aqua/rose, Softness 0.8, Haze 0.25, Grain 0.08. Sun height 24°, Turn −30°; dome Tint 0.1, Gloss 0.06,
  Contours 0.12. Water level stays below the dome and its Reach is finite.
- **The feedback loop**: Motion is Flowing or Paused, at the top of the card; pause retains every clock's current
  moment and resume continues it. Wave, current, sky and cloud clocks are independent; zero speeds stop their own
  motion, all stopped rests the renderer, and reduced motion freezes all of them. Copy includes the readable values,
  version number, blocks and a complete Settings JSON for reproducible feedback. Version 10 uses its own browser
  key, `no-origins:orbit:environment:v10`, so older tuning is retained under the previous key. Reset restores v10.
  The next version freezes this one and answers his copied settings and notes, rather than overwriting its history.
- **Drawing cost**: cloud sampling skips detailed work in empty density and ends at near-opacity. Detail controls
  its sample budget. The renderer starts at a pixel ratio of at most 1.5, lowers it under sustained slow frame cadence
  and recovers gradually; it measures frame intervals, not isolated GPU time. This is shared TSL for WebGPU and
  WebGL 2. Version 9's environment, cloud model, water/sky, atmosphere and surroundings builders are frozen.

## W23. Open plane and cardinal directions

- **His change** (2026-10-12): N, S, E, W directions; a **1000 m × 1000 m plane**; remove the sphere and travel
  across the plane; remove continuous water now and add **ponds later**. This supersedes W16's sphere requirement.
- **Environment v11**: ground at y = 0, spanning x/z −500 to +500 m. One two-triangle plane carried the blocks'
  pastel colour, sunlight tone and anchored grain; it is gone now (his, W24: "Let's remove the plane"), and the
  square is an open bound. Its nine starting blocks are gone too (W24). There is no dome,
  enclosing contour or ocean draw and no Radius, Dome, Water or Water finish control. Local ponds are not built yet.
  The painted sky background has no physical boundary or navigation constraint; clouds remain above the ground.
- **Square bounds** (its size is now his to set, and it has a top: W29): each camera stays half a metre inside each X/Z edge and above y = 0.2 m. Height is independent
  of distance from the middle: every corner is reachable. Whole block footprints must fit inside the square; their
  construction height remains independent. Orbit/pan, visitor drag, keys, map travel and flight share these limits.
  Portal inspection keeps its cut through the new base plane, as well as through the original blocks.
- **Directions**: North = −Z, East = +X, South = +Z, West = −X. Heading is clockwise from north: 0°, 90°, 180°, 270°.
  A design-system Card and Text compose the compass over every view, showing heading, X/Z metres and the plane size.
  The map's cardinal labels rotate with its selected orientation; the compass reads the actual camera direction,
  including a builder's orbiting camera. Atmosphere animation alone does not update React state.
- **Travel**: Environment retains drag-to-look and ground-aligned right-drag-to-pan, with WASD/arrows translating
  camera and target together at the camera's Keys speed. A world press takes focus back from controls. Its map offers
  longer journeys without walking a kilometre. The Camera/start/Map views retain visitor dragging, WASD/arrows,
  the Keys speed control and map-click flight. A focused control consumes its own keys.
- **Atmosphere controls remain**: clouds use Width in metres (20–120 m), Above as clearance from the plane
  (10–300 m), and a distribution/noise scale of 120 m independent of the ground size. Starts: Width 60 m, Above 70 m;
  existing pastel palette, flow, viscosity, powder, texture and colour controls carry on. Fog starts at 180 m and is
  complete at 1500 m. Motion Pause/Flowing, Copy and Reset retain the feedback loop.
- **History**: version 10's environment, atmosphere, cloud/sky/water/ground builders and spatial model are frozen;
  Map v2 and its drawing are frozen. Current settings use `no-origins:orbit:environment:v11` and
  `no-origins:orbit:map:v3`, preserving earlier browser tuning. Copy includes the fixed plane size, orientation,
  complete settings JSON and blocks. Camera remains v8, with its existing controls.

## W24. The sector: named zones, and its entry

- **His** (2026-10-12): "In elements, add controls for the plane"; then "let's call it sector"; then "Let's remove the
  plane and instead of side, give me number of blocks", and, asked what that meant, the block, the zone, the entry
  floor, naming and grouping (W4). The sector is an element under Elements after Portal, with its own page,
  `/build/sector` (`/build/plane` redirects there), and its own jig (W14, W15).
- **There is no ground plane** (his). The world's square (W23) still bounds every camera and what is built, unseen.
- **The environment builds nothing** (his, asked whether its 10 m blocks stay: "remove it"). Environment version 12 has
  no Blocks group and no Grain (it was the blocks'); what stands in the world is the sector's.
- **A sector's entry zone is made with it: a zone of one default block** (his, 2026-10-12: "A sector will have an entry
  zone, which we will design later. But for now, we should have a default created zone in a sector, with default setup
  of 1 block"). This replaces version 3's entry floor of N × N blocks (Blocks, 10 to 100). *Mine:* the entry's block
  is an ordinary block, sized, coloured and taken away like any other; the entry zone is what W25 says of an entry.
- **Zones are made, named and built into** (his). *Mine:* every zone is a row on the card, the entry first, with how
  many blocks it groups; the one picked is the one blocks are built into, as a group's items are put in it; its menu
  deletes it with what it holds, and the entry's menu has no Delete (W25). A zone has no colour (his: "Drop it"); each
  block has its own (W4). The sector has a name too.
- **Blocks are placed by level** (his): a level is the default block's height, 0.25 m. *Mine:* a click places a block
  on the level's floor or against a block's face, or with Remove takes away the block the pointer meets first; a ghost
  shows which, at the size the block will be. The card sets the size (Width, Length, Height, each 1 to 10 times the
  default) and the colour of the block a click places. The sector's grain is every block's in it; the light is the
  environment's.
- *Mine:* **a visitor's sector shows only on its page** (W14); everywhere else the world is his.
- *Mine:* **on the portal's page the portal stands on a block of its own**, wide enough to hold it, its collar the
  block's colour: at his settings its cut is just over a metre across, wider than one default block.
- *Mine:* **its page looks at the start's entry zone from about 8 m off**, near enough that a block is plain to place; a
  drag goes round, a right-drag pans, the wheel comes nearer, the keys and the map travel. A zone picked, or made, is
  travelled to.
- **Version 4 answers this section and W25** (W15). Version 3, the N × N entry floor and a colour a zone, is frozen.

## W25. The hierarchy: entries, coordinates, and what is kept

- **An entry is a pointer to one of the things a unit holds** (his: "Pointer"): a sector's entry is one of its zones, a
  habitat's one of its sectors, an ecosystem's one of its habitats. A habitat's entry zone is its entry sector's entry
  zone, and an ecosystem's its entry habitat's: there is one kind of zone, and every zone is in a sector.
- *Mine:* **a unit is never empty**: a new ecosystem is made with a habitat, a habitat with a sector, a sector with its
  entry zone of one block (his, W24), each the entry of the one above it. An entry cannot be deleted while it is the
  entry; another is made the entry first.
- **The world has coordinates, and he sets every unit's** (his: "In the world, we should have coordinates. And we
  should be able to define these coordinates for them"): in metres, with W23's directions (x east, z south, y up).
- **A unit's coordinates are its origin in the unit that holds it** (his: "Let's go relative"; an ecosystem's in the
  world's), and what it holds stands round that origin, so moving a unit moves everything in it. A block's or an asset's place is in its
  zone's coordinates. The builder shows a unit's own coordinates and where that puts it in the world.
- *Mine:* **coordinates stand on the lattice** (W4): whole metres across and along, whole levels (0.25 m) up, so every
  block in the world shares one lattice. Everything stands inside the world's square (W23).
- **Where the world is entered is decided with the flow** (his: "Eventually when we design the flow, I will decide").
  *Mine:* until then a visitor starts where they do now, over the world's middle looking north. The start's one block
  stands under the camera there, so the start shows no land, where version 3's floor filled it.
- *Mine:* **what is built is kept apart from how it is tuned and how it is being built**: the world's data (its units,
  their names, entries and coordinates, and each zone's assets) is one record; a jig's tuning (the sector's grain)
  another; the builder's state (what is picked, the tool, the level, the next block's size and colour) a third. Reset
  puts the tuning back and never touches what is built; Copy sends what is built and the tuning, not the builder's
  state.
- *Mine:* **the data is flat**: each unit and each asset is one entry naming its kind and the unit that holds it, and a
  unit's entry names one of its own. Moving a zone to another sector, or an asset to another zone, changes one name
  (Open: whether either is allowed). The same entries become a table's rows when the world is stored in a database.
- *Mine:* **a new unit stands clear of what is built**: a new zone at its sector's origin, holding nothing, to be built
  into; a new sector, habitat or ecosystem 2 m east of everything its parent holds (a cell of air), further east still
  while its block would stand where one is built. Names come in turn ("Habitat 2"); a sector's first zone is "Entry".
- *Mine:* **a world kept in a browser, or pasted, is mended as it is read**: a unit whose parent is gone is dropped
  with its blocks, an entry that is gone becomes the first held, and a unit holding nothing is given its default.
- *Mine:* **an asset is a builder at a version, with its configuration and its place** (W3): a block's is its size in
  multiples and its colour; a portal's is the portal's settings.

## W26. Orbit art: feathered clouds and quiet powder

- **His** (2026-10-12): review the Orbit's aesthetics against his Mathilde Loubes / Burberry reference, especially
  textures, clouds and the missing softer edges. After five generated studies and the implementation plan, he said
  **"Proceed"**. This authorizes the combined implementation direction; it does not select a generated image as a
  pixel-identical target.
- **Environment v13** is the first pass: unequal, curved wind-aligned banks and tapered density trails, open sky
  between them, dense cores with a low-density outer fringe, cream/blush pigment and sage shade. The generated
  density field is 128³ with an empty border, and includes medium-scale seeded folds baked once. It remains one
  bounded ray-marched volume, not an image backdrop, blur filter, fluid solver or collection of puff meshes.
- **Four art controls**: Wisps (0–1; rebuilds clouds only), Edge width (0–1), Pigment scale (40–300 m) and Distance
  softness (0–1; the latter three are uniforms). Erosion mainly affects thin margins. Existing Softness spreads the
  light transition; Powder gives diffuse fill, and fine Grain is derivative-filtered when unresolved. Broad pigment
  and medium mottling are separate from fine grain. Screen-space ray-start jitter is reduced, not confused with the
  material's world-space grain. Detail remains 16–64 samples, starting at 48.
- **Light and depth**: two taps toward the sun approximate absorption, with three world-space density-gradient taps
  giving the broad folds direction. Distance mixes cloud colour toward the sky wash inside the shader, since the
  cloud material bypasses scene fog. These are bounded artistic approximations, not physical multiple scattering.
  Cost per occupied ray sample is higher; empty-density skipping and opacity termination remain.
- **Motion**: wind-driven curl deforms the field in world metres. The field's transport is bounded so it cannot drift
  out of its volume after a long session. Speed 0, Pause and reduced motion retain their independent-clock behaviour.
- **Framing**: the Environment builder starts at [40, 24, 60], looking at [0, 40, 0], with its existing 75° lens; it
  may look upward to inspect the clouds. The eye is still held above ground and inside the square. Visitor, sector
  and portal views keep their existing settings. The sky reaches its cooler colour closer to the horizon, whose
  start is a quieter cream-apricot.
- **First values are mine, his to tune**: 12 banks, Width 70 m, Above 45 m, Height 0.85×, Stretch 2×, Spread 2.8×,
  Wisps 0.45; Flow 0.65, Speed 0.45×, Viscosity 0.65; Density 1.1, Erosion 0.3, Edge width 0.5, Softness 0.8,
  Powder 0.45, Grain 0.03; cream base, blush pigment, deeper sage shade (0.9) with Warmth 0.2, Blend 0.7, Pigment scale 120 m, Distance softness 0.4.
- **History and tuning**: environment, cloud field/builder, painted sky, surroundings and builder views are frozen
  beside the new files as v12. New tuning uses `no-origins:orbit:environment:v13`; v12's key is left intact and not
  imported into this different art direction. Reset restores v13 and never touches built world data. Copy includes
  its version and the complete settings JSON. Solids' materials remain a subsequent art pass.

## W27. Flowing cloud forms

- **His** (2026-10-12), after v13: "these clouds are no way close to the target. We need that flowing clouds form."
  He also cannot retain the streamed image previews on mobile. The agent used the flowing-form study as its comparison target;
  actual captures must be labelled separately from generated art direction.
- **Environment v14** replaces the single world-wide cloud texture with **local bank volumes**. Three seeded
  128 × 80 × 80 density fields are shared across the banks. Each has a continuous, twisting cross-section with an
  undulating centreline, unequal rolling crests, medium seeded billows, finer edge erosion and a broken trailing
  veil. The empty texture border and bounded deformation remain. The allocation resolves folds independently of
  the kilometres of empty space between banks; these are ray-marched gas banks, not solid ribbon meshes.
- **Light and texture**: central density differences along the three world axes give the folds their shade, with
  two sunward absorption taps. These broad light and colour approximations are evaluated once at the first visible
  density surface; only density and transmittance are marched through the gas. Local coordinates are transformed
  into world metres for pigment, distance softness, grain and extinction. Ray-start jitter spans one step to break sampling bands. The starting Detail is 64 samples;
  its existing 16–64 control remains. Several overlapping bank bounds can cost more than
  v13; high bank counts and hardware WebGPU performance remain to be measured on actual devices.
- **Motion**: each bank's density rolls and curls continuously inside its local bounds. Transport remains bounded;
  the engine's independent atmosphere clocks, Pause, zero Speed and reduced motion still rest the field.
- **First values are mine, his to tune**: 12 banks, Width 90 m, Above 45 m, Height 0.7×, Stretch 2.8×, Spread 2.4×,
  Density 1.4, Edge width 0.35, Shade 0.7, Warmth 0.3, Blend 0.9 and Detail 64. The remaining v13 controls, sky and
  builder framing remain. Shape and light are still an art iteration, not a claim of matching the generated target.
- **History**: v13's environment, local predecessor density/builder, sky and surroundings are frozen beside v14.
  `no-origins:orbit:environment:v14` starts fresh; v12 and v13 keys stay intact. Reset restores v14 and Copy includes
  version 14 and its complete settings. The built-world record stays separate.
- **Review delivery**: the private mobile gallery retains generated targets, the rejected v13 and actual v14
  captures so they remain accessible after streaming. This is a review artifact; the Orbit app itself is not deployed
  by publishing that gallery.

## W28. Integrated powder is the selected cloud target

- **His** (2026-10-12), rejecting v14: "the output doesn’t match the target. I’m expecting the clouds to match the
  integrated powder target image." **Study 05, Integrated powder, is the target.** The agent's choice of Study 02
  was wrong. Compare actual renders directly with 05; do not substitute another generated study.
- **Environment v15** follows the selected painting's cream billows, blush blooms, sage recesses, fine powder and
  dissolving edges. Procedural density/lighting trials still made flat pastel blobs or folded fabric. Instead, two
  transparent painted cloud elements were generated from 05 with the built-in image tool, and are stored as
  `public/clouds/powder-bank-v15.png` and `powder-veil-v15.png` (their exact prompts are in the review artifacts).
- **Rendering choice, mine**: camera-facing painted layers at different world positions, drawn through TSL's
  `SpriteNodeMaterial` on meshes. Their size attenuates with perspective and travel changes their overlaps and scale;
  they are **painted cutouts, not gas volumes**. Each bank and its thinner veil occupy distinct depths; reflected
  copies and unequal heights break repetition. There is no full-sphere backdrop, dome or image of the whole scene.
  A bank does not have volumetric detail to enter or inspect from its side. Its main lighting is painted in the
  texture; world Sun direction continues to light solids and tint the sky.
- **Motion and controls**: bounded UV deformation and slight rotation move the painted billows; independent clocks,
  Pause, zero Speed and reduced motion remain. Density controls opacity, Wisps the thinner layers, Edge width and
  Erosion their alpha margins, Softness their transition. Colour, Pigment, Shadow and Light remap the painted palette;
  Pigment scale adjusts the colour image independently of the silhouette. Powder gives a quiet cream fill and Grain
  adds restrained fine tooth. The old ray-sample Detail is removed from this jig and its current configuration.
- **Assets and lifetime**: the engine loads both alpha textures before the first frame and owns their lifetime;
  tuning reuses them and engine disposal releases them. Shape/tuning changes remake only the cloud part. Card bounds
  are held above the configured clearance. The sky's light is diffuse; the hard sun disc is removed for this version.
- **First values are mine**: 20 banks, Width 90 m, Above 40 m, Height 0.8×, Stretch 1.8×, Spread 3.5×,
  Wisps 0.7, Density 1.1, Edge width 0.6, Erosion 0.5, Powder 0.45; powder cream, powder blush and pale sage;
  Shade 0.8, Warmth 0.65, Blend 1 and Distance softness 0.25. The framing remains v13's. His to tune.
- **History and review**: v14's environment, density, cloud builder, sky and surroundings are frozen beside v15;
  storage starts fresh at `no-origins:orbit:environment:v15`. Earlier keys and built-world data remain. The private
  mobile gallery shows 05 beside the actual v15, then v14 and v13 as prior attempts. The app itself is not published
  by updating the review gallery. Hardware WebGPU and actual-phone performance remain unverified.

## W29. The world's boundaries: width, breadth and height

- **His** (2026-10-12): "Can we set the world width, breadth and height?" This replaces W23's fixed 1000 × 1000 m
  square: the world is a box of his size.
- **The world is not in a sector** (his, on the first try, a World group on the sector's card: "Why is world inside a
  sector? All these groups and spacial units are inside the world? I just asked I can set boundaries for the world").
  **The world has its own jig and page, World** (`/build/world`), first in the builder's sidebar (W14), since the
  environment and every unit of the hierarchy are inside it. Its one group is **Boundaries**. The sector's card is as
  it was (version 4).
- *Mine:* **width runs west to east (x), breadth north to south (z), each centred on the middle; height runs up from
  the world's floor, y 0**, where every camera already stopped (W23). Width and breadth are 20 to 4000 m on a step of
  2 m, so the middle stays on a whole metre and the edges on the lattice (W4); height is 10 to 2000 m, a metre a step.
- *Mine:* **it starts at 1000 × 1000 m and 1000 m high**, so nothing the world held moves until he sets it; his to tune.
- *Mine:* **every camera and every block stays inside it**: a camera half a metre inside each side and under the top,
  and over 0.2 m (W23), the visitor's camera held where it is over the floor, a looked-round page's clipped along its
  line of sight; boundaries made smaller hold the camera inside at once. A block is placed only where all of it fits,
  on or over the floor and under the top; one left outside is kept and not drawn.
- *Mine:* **the World page is the visitor's camera**, as at `/`: it travels with the keys, the drag and the map up to
  the boundaries and is held there. **The compass shows the size** (width × breadth × height), and **the map draws the
  floor** as it is, a rectangle when width and breadth differ, its longer side across.
- *Mine:* **like every jig, the page is a playground** (W14): boundaries set there show on that page only, kept in the
  browser; everywhere else the world is his, and Reset goes back to it.
- *Mine:* **the sky and the clouds are not bounded by it**: they are the backdrop (W23), so clouds may stand over a
  world lower than their Above. Open: whether the height should carry them.
- *Mine:* **its edges are unseen**, as W24's square was; the map shows them. Open: whether the world's sides and top
  are drawn.

## W30. Powder clouds remain spatial

- **His** (2026-10-12): the image clouds are close visually but he dislikes their experience; he asks for another
  way to achieve the texture and effects. After the proposal for sculpted gas with procedural flow and painterly
  lighting, he says **"Proceed"**. Study 05 remains the art target; this does not authorize replacing spatial depth
  with painted camera-facing elements again.
- **Environment v16** starts with **one bank for spatial and material review**. Its 160 × 96 × 96 four-channel
  numerical field holds gas density, broad and medium pigment, and material tooth. Seven unequal connected lobes,
  three-dimensional displacement, four erosion scales, internal density pockets and a broken curved wake create
  its form. All borders are empty. These are generated volume data, not cloud artwork files.
- **Lighting**: each bank caches sunward and upward optical depth at 112 × 64 × 64 samples. Twelve expanding
  intervals integrate density in world metres. Sun height/turn rebuild the cache; density applies extinction in the
  shader. The shader integrates gas extinction and coloured scattering at every view-ray sample, including inside
  the bounds. There is no visible-surface normal, image cutout or blur pass. Diffuse fill approximates multiple
  scattering; the cache follows the deformed density approximately rather than solving new light transport per frame.
- **Motion and material**: bounded three-dimensional curl/roll deforms density, pigment and its light cache together.
  Pigment scale changes broad deposits without changing the silhouette; quieter material tooth and filtered fine
  grain provide texture. Edge width retains thin gas, Erosion breaks margins, Wisps changes the wake. The engine's
  existing independent clocks, Pause, zero speed and reduced motion still apply.
- **First values are mine**: one bank north-west of the Environment eye, Width 120 m, Above 25 m, Height 0.7×,
  Stretch 2.4×, Spread 1.3×, Scatter 0.35, Seed 7, Density 1.2, Detail 80 (24–96), Powder 0.65, Softness 0.55,
  Shade 0.95, Blend 1, cream/blush with deeper sage; Sun height 35°, turn −90°. Other v15 art controls remain.
  This establishes a real volume to review, not a claim that its fine painterly detail fully matches 05.
- **History and lifetime**: v15's environment, cloud distribution/builder, sky and surroundings are frozen. The
  current engine no longer downloads cloud artwork; v15 assets remain for history. Generated density, light and
  velocity textures are disposed with the cloud part. Storage is fresh at `no-origins:orbit:environment:v16`;
  previous keys and built-world data remain. Reset/Copy use version 16.
- **Review**: the local interactive bank uses the same `buildClouds` source, with front, side, underneath and inside
  views, sun movement, flow and pause. Desktop/mobile-emulated WebGL captures and controls pass; hardware WebGPU,
  actual-phone performance and high bank counts remain unverified. Field generation and light caching are synchronous
  in this prototype and need device profiling before extending it across the sky. Publishing its renderer bundle to
  the private gallery was blocked by automatic approval review; upload awaits explicit authorization.

## W31. Clouds belong to the environment

- **His** (2026-10-12): the new volume makes the website slow; use better techniques. Clouds are part of the
  environment, so it should be a sky with clouds, without a number of clouds. Study 05 remains the art target.
- **Environment v17** removes Count, Spread and Scatter. **Coverage** (0–1, starts 0.65) opens or fills the sky;
  Billow scale (starts 120 m), Above, Height, Stretch, Wisps, pigment, density and flow tune its material. A single
  bounded layer follows the camera horizontally while density stays anchored in world coordinates, moderated by a
  seeded weather field. Coverage near 1 fills a thin background veil. There are no placed cloud objects or artwork downloads.
- **Preparation stays off the interface thread**: a worker generates 128 × 80 × 80 density/pigment data and
  64 × 40 × 40 sun/sky optical depth. Density is retained for relighting, transferred replies preserve its cache,
  and repeated edits coalesce to the latest job. Worker failure uses a smaller deferred fallback.
- **Rendering has a budget**: `cloud-pass.ts` renders clouds below half resolution with an absolute ceiling of
  180,000 pixels, adapting down toward 45,000 under sustained slow frame cadence. Ray marching uses 16–48 steps,
  at most 650 m after entry, analytic curl and early opacity termination. The world's other rendering keeps its
  resolution. A depth texture composites representative gas depth against opaque scene geometry. Slow cloud flow
  reuses the previous frame for 50 ms; camera, settings, field completion and resize invalidate it immediately.
- **Lifetime**: draw requests coalesce; hidden tabs stop animation, and the review also stops its offscreen canvas.
  Pause, reduced motion and zero speed draw on changes only. Workers and generated resources are disposed. V16's
  source and review are frozen, and the new key is `no-origins:orbit:environment:v17`; built-world data is retained.
- **Review and limits**: the local review uses the active renderer with sky, across, underneath and inside views,
  sunlight, coverage and pause. The actual Orbit WebGPU path uses the full worker field. Shader lighting under
  deformation, representative gas depth within partly transparent clouds, tile repetition and fine painterly detail
  remain approximations. Physical-phone performance is unverified. The hosted gallery remains v15; its renderer
  upload awaits authorization following W30's approval-review rejection.

## Open

- **What is built in the world** (his, after the world is built): whether each app becomes a place inside Orbit, travel
  between them seamless and their old hosts redirecting to their place (*mine*), or stays its own site with its own
  terrain, going from one to another a page load.
- **One library with Cinema** (his to decide): a mountain made for a film could stand in the world, at the cost of
  porting Cinema's entries to TSL (W9).
- **The cell's size in metres**, and which unit of the hierarchy is the chunk sent (W4, W5): decided with the first place.
  The block is decided (his).
- **How the builder shows the hierarchy** (his): making a habitat or an ecosystem, setting a unit's coordinates,
  picking a placed block to change its size or colour, and whether a block or an asset may move from one zone to
  another, or a zone from one sector to another (W25).
- **Where the world is entered** (his, with the flow; W25).
- **The sector's entry zone, designed** (his: "which we will design later"; W24).
- **What a block is to see** (his): a solid of ground, as version 2 draws it (*mine*), or a room of air that things are
  built in.
- **Which assets come after the block and the portal**, and the library they come from (his: "we will eventually have
  library of assets").
- **How a visitor moves** (his, not decided yet): walking a figure, as the one sitting in his mock, or a camera that
  travels between places.
- **Where the agents' looks are made** (his to decide). The editor went with the old Orbit. The looks it published
  are still in the database, and the motion studio still reads them.
