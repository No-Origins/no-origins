# No Origins — The World

The base UI of No Origins: a 3D world that keeps growing, in which every app becomes a place. This document decides how
the world is made, how it reaches a visitor and how it is explored. It takes over from the grid (Grid.md) as the base
every app stands on, one app at a time. Orbit (`apps/orbit`, orbit.no-origins.com) is the world's first app.

**Draft, not signed off.** What is marked *his* he said in his own words; what is marked *mine* Claude proposes, for
him to keep, change or drop.

Current as of 2026-10-16.

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
- **The world is called the Orbit** (his: "And the world is called 'The Orbit'"): an open box a kilometre each way, west to east, north to south and up (his, W33), its ceiling the clouds, with no ground plane: its land is what is built in it, its ecosystems, habitats, sectors, zones and blocks (W4, W23, W24, W25); the earlier sphere is historical (W16).

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
  long, 0.25 to 2.5 m high. *Mine:* a whole multiple, so every block stays on the lattice below. *W93 lifted the
  lattice: a block is 1 to 100 each way, in metres or centimetres, turned any way.*
- **Each block has its own colour** (his: a zone's colour, "Drop it"), one of the world's colours, picked with a
  `ColourPicker` (the root CLAUDE.md).
- **Blocks combine into a zone, zones into a sector, sectors into a habitat, habitats into an ecosystem, and every
  ecosystem together is the world** (his). The block, the zone and one sector are built (W24); the hierarchy's entries,
  coordinates and data are W25. **For now the world holds sectors, and habitats and ecosystems are set aside** (W81;
  his, 2026-10-15: "currently at this point, I don't want to have habitat and ecosystems").
- **A zone is a named group of assets: blocks, portals, rocks, and later a library of assets** (his: "Group of assets -
  Blocks, Portals, Rocks etc (we will eventually have library of assets)").
- **A sector is a named group of zones, a habitat of sectors, an ecosystem of habitats, and each has an entry zone**
  (his: "Similar to Zones, we can name it and group zones under it"; "A habitat will also have entry zone"; "An eco
  system will also have an entry zone"). How an entry is held is W25. **A sector is also a place in the world with a
  size, 50 to 1000 m each way, and a zone has a name and no size** (W81).
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
  world, its items his (W73): **World** first, the world as the sectors build it, every sector drawn where it stands,
  since everything else is inside it (W29, W33, W73, W82); **Spaces**, a group, where the world's spatial units are made (W81; his: "create another section
  called Spaces"), its page **Sectors**; **Environment**, a group, a page each for **Sky** (with Motion), **Clouds**
  (the ceiling, W38), **Camera**, **Map**, **Base clouds**, **Light and texture** and **Fog** (his: "under environment,
  we should have clouds, camera, map, and base clouds, light and texture, fog, individually to configure"); then
  **Elements**, a group, **Mountains**, **Portal**, **Human**, the figure the visitor travels as (W51), and **Trees**
  (W67), each the element alone with its variants. The Sector was an element until W81 (his: "Let's remove sector
  from elements"). *Mine:* folded, it keeps its icons; on a phone it is a sheet, opened by a button at the top left;
  `/build` opens on World.
- *Mine:* **every jig has a page, `/build/<jig>`**, where it is tuned: the world seen as that jig needs it, and its card
  of controls. The world stays mounted from a place to a page and back (W2); only the view changes. World is the
  visitor's camera, which travels up to the world's sides and is held there, the map drawing them (W29, W33). Environment looks
  across the open square at the sector's entry floor, for the sky, clouds, light and fog (W23); a drag goes round, a
  right-drag moves, the wheel comes nearer; Clouds sees the same, for the ceiling clouds alone (W38). Camera is the visitor's eye itself; Portal looks into the portal, which
  stands on that page alone, on a block of its own, cut into its top, and opens as the page comes into view; Sectors
  sees the world as placed and goes to the sector picked, and is where sectors and zones are made and blocks are built
  into zones (W24, W25, W81). A drag goes round what Environment, Portal and Sectors look at.
- **An element's page is a studio** (W72, W73; his: "just like human, where there is only one base and a human
  standing there, similarly that should be the case with everything", then "I don't want inspect, I want mountains"):
  Mountains, Portal, Human and Trees each show one of their element alone at the world's middle, the sky and
  the gas around it and nothing else of the world's elements, with a dropdown of its variants, saved in the database
  (W73). The World page is where they are placed, and the Environment's pages tune one atmosphere, a group each.
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
- **The world's colours stand in rows by family** (his, 2026-10-14: "I'm unable to recognise colors from color
  palettes. Organize them and break them into rows."), **and there are more of them, white and the brand's among them**
  (his, 2026-10-15: "we need more colors … I'm also missing white color"; "Our brand colors are also missing - like
  Lime"): `colours.ts` holds fifty-three in eight families, **Brand** (Lime, Violet: the theme's, as hex, since a
  shader takes a colour and not a variable), **Neutrals** (White, Pale cream, Cream, Powder cream, Sand, Warm cream,
  Linen), **Greys** (Fog, Silver, Pewter, Stone, Slate, Charcoal, Black), **Warm** (Apricot, Pale rose, Peach, Powder
  blush, Rose, Coral, Raspberry, Rosewood), **Earth** (Butter, Straw, Tan, Honey, Amber, Clay, Terracotta, Bark,
  Umber), **Greens** (Mint, Pale sage, Sage, Sage shade, Fern, Moss, Forest), **Blues** (Teal, Powder blue, Milky aqua,
  Sea blue, Sky blue, Ocean, Navy) and **Violets** (Lilac, Lavender, Lilac shade, Mauve, Dusk, Plum), each row light
  to dark by relative luminance, and the picker draws a family a row, every swatch the small size, its name a tooltip
  (Orbit.md C17). *Mine:* the families and their order, and every colour past his mock's seven, black and the clouds'
  three, named for what it looks like, his to cut or rename; a value is its hex, so no saved setting moved; the
  agents' seven paints stay the agents' (Orbit.md C20) unless he says otherwise. A jig's own reference colour stands
  once, ahead of the palette (`paletteWith`): the mountain's stone and algae are the palette's Stone and Moss now, and
  its clear white is White. **A colour's picked name stands after its label**, as a number's value does, so a pale one
  is read as well as seen.
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
| **World** | 6, **his size; places nothing** | The world's size (W29, W33, W42), on a page of its own at the top of the builder: **a cylinder 1000 m across and 1000 m high**, fixed (his: "It should be 1000m length, width and height", then "Instead of cuboid shaped world, lets make it cylindrical"), a note and no controls for it; and **its sectors** (W82), a note listing each, its size and where it stands; the world drawn as they build it, with no edges (W103). **Nothing is placed here** (his, W82: "we will not place anything in the world explicitly"): elements are placed into a zone on the Sectors page. Save and Publish keep the world, one item in the database. A builder's view, looked round and travelled. Version 5, which placed (W73: Place and Picked, a click on the ground placing where a ring showed), is frozen (`bounds-v5.ts`); versions 1 to 3, boxes, too (`bounds-v1.ts` to `bounds-v3.ts`); version 4 was version 5 without placing. | his |
| **Environment** | 36, a page a group | **Current (W73, W76): Motion a switch, and Sky's Colour flow, Base clouds and Fog each a Shown switch (W76; version 35, Motion a choice, frozen as `environment-v35.ts`); the atmosphere alone, on four pages of the sidebar's Environment, Sky (with Motion), Base clouds, Light and texture and Fog, one jig and one store, each page's Reset putting back its own groups; what stands in the world is placed on the World page (version 34 placed the ring's variants and the grove by seeds, frozen as `environment-v34.ts`). Before that: mirror-capped stone monoliths (W50); physical sun lighting and cloud scattering (W49); wall-only directional shade with a neutral ceiling join (W48); soothing sun-directed cloud-wall shade (W47); neutral sky-like cloud walls with controlled pigment spill (W46); grass-green-to-white mountain gradients (W45); smooth violet-to-white pastel mountain gradients (W44); a cloud-enclosed cylinder with joined upper/lower clouds at its side and only mountain tips at the concealed base (W43); plain tips with roughness controls, spaced seeded placement and one violet/white mountain material (W41); lower fog has independent controls, thinner defaults and varied bank heights (W40); distinct pastel alpine peaks, blue ridges, lavender crags, sage hills, terracotta buttes and ochre mesas from his mountain sheet (W39); flowing white gas/fog at the base around huge mountains' tips (W34, W37); the clouds are the world's ceiling, a painted layer whose underside is at 1000 m, drawn with the sky (W33), with no cloud controls (W32), on the open 1000 × 1000 m square's atmosphere, travel and cardinal directions (W23), and nothing built: no ground plane and no blocks (his: "remove it", W24); its Grain went with its blocks, and Grain size is now the clouds' alone. Version 11 is frozen with its blocks' builder (`environment-v11.ts`, `build-blocks-v11.ts`).** Versions 13–15 and their decisions are W26–W28. The following describes its earlier versions: The Orbit, dome, sky and clouds, water, fog and editable blocks of version 2, with the colouring and texture of his landscape reference (2026-10-12). **Light and texture**: Horizon, Sunlight and Shadow colours; Warmth (0–1); Sun height (0–90°), Sun turn (−180–180°); Shade (0–1); Grain (0–0.5), Grain size (0.02–0.3 m). The sky goes from blue-lavender overhead to apricot at the horizon with a low sun; the clouds and block faces take peach light and lavender shade from that same direction. Two scales of mineral grain are anchored to the surfaces, never the screen, and are still. His correction on version 3: the reflective water overwhelmed the pastel texture, and the camera inside the sphere looked out into infinity. **Version 4** keeps his chosen soft pastel layer below the dome: a matte finite disc with anchored grain, no reflected scene or glints. Water adds **Viscosity** (0–1, higher slows and broadens ripples) and **Reach** (1.25–5 times the radius, its finite edge). These are art controls, not fluid simulation. Dome adds **Contours** (0–1): three sparse great-circle seams and an equator make its enclosing curvature readable. The lower dome is no longer painted as opaque deep water, so being inside does not look submerged. Starts: sky blue, apricot horizon and fog, peach sunlight, lilac shade, rose water, sand blocks; Warmth 0.55, Sun height 12°, Sun turn 135°, Shade 0.45, Grain 0.18, Grain size 0.06 m. The existing radius, dome, sea level, wave, cloud, fog distance and block settings remain as in version 2, except that a block is 1 m high (his: "reduce the block height from 5m to 1 meter"), so a Level is a metre (−200 to 199). Version 4 starts with Water level 0 m over the sphere bottom, Waves 0.25, Speed 0.5×, Viscosity 0.7, Reach 2.5×; Dome Tint 0.28, Gloss 0.12, Contours 0.25. Reset uses these starting values; Copy includes all atmosphere settings and blocks. Version 5 adds sculpted clouds with independent pastel shading and efficient instancing (W17). Version 6 adds animated pastel water and viscous sky gases, with independent flow controls (W18). Version 7 follows his pastel threaded-water reference (W19); version 8 softens the swells and adds a dreamy haze finish (W20). Version 9 replaces the remaining puff clusters with connected liquid clouds (W21). Version 10 follows his chosen powdered pastel image (05), using flowing cloud volumes, soft irregular water and a reproducible tuning loop (W22). Versions 1–10 are frozen, their builders where present too. | his reference; first values mine, his to tune |
| **Clouds** | 5 | The ceiling clouds (W33, W36), his to tune (W38: "Give me jig controls for the clouds above"), on `/build/clouds`, seen as the Environment's page sees them, looking up. **Layer**: Shown (W76: off, the sky shows overhead and the walls stay; version 4 frozen), Thickness (0–600 m, how high the masses rise from the ceiling), Coverage (0–1), Masses and Billows (the sizes of the big forms and the puffs on them, 3–12 km and 1–5 km), Stretch (1–4× along the Sky's Wind). **Edge**: Feather (0–0.2, how far an edge fades, like a dry brush), Wisps (0–1). **Paint**: Cream, Rose and Sage from the swatches; Wash (0–0.5, the sky's colour over every cloud), Haze (2–20 km, where they dissolve into it), Glow (0–1, the sun through the thin margins), Grain (0–0.1). **Motion**: Drift (0–150 m a second of the clouds' clock, along the Sky's Wind; the Environment's Motion pauses it), Roll (0–5×) (his, W74; 30 and 2× to version 3). Starts: W36's values, 240 m, 0.5, 8000 m, 2600 m, 1.6×; 0.08, 0.45; Pale cream, Pale rose, Pale sage, 0.1, 9000 m, 0.3, 0.035; 10 m/s, 0.6×. | *mine*, his to tune |
| **Camera** | 12 | **Shows the helmet's inside round the visor** (W79, W80: Visor view's Inside, Inside colour, Inside light, Inside opacity; versions 10 and 11 frozen; the Suit's helmet alone, W102: the Clay has none). **Is steered from the human's helmet** (W78): the figure faces the way the eye looks; a drag looks round (Turn, and Angle from −60° up to 90° down, the head tilting with it), W A S D go by the view; Steering (Drag, Look speed, Reverse across, Reverse up and down, Look up, Look down, A and D, Turn speed, Smoothing) and Visor view (Clear air, Haze, Rim in view) are the helmet's; version 9 frozen. Version 9: **Is in the human's helmet** (W69): at the ball's centre behind the visor, looking the way the figure faces and down its Angle; its Height is the figure's and moves nothing. Before that, **it followed the human** (W51): it stands back from the figure where the visitor is, at its Height, looking down its Angle at the figure's hips, the figure at the middle of the view, walking ahead of it as it travels; version 8, which stood where the visitor is and saw the ground ahead, is frozen (`camera-v8.ts`). What the world is seen from (his: "We don't need modes. Since I can decide on height and angle, and since we also decided to have movement of the camera rather than distance from center, click and drag or arrows or qwerty should move"). **He decides how it looks at the world** — **View**: Height (0 to 30 m over the ground), Angle (0°, level, to 90°, straight down), Turn (−180° to 180°, the way it faces; 0 the way the start faces); **Lens**: Field of view (20° to 90°, top to bottom, a degree a step: his "Angle of view should give me 1 degree level controls"), Zoom (0.5× to 4×, narrowing it; the wheel zooms on its page, a step a notch) — **and the camera moves over the ground**, keeping them: where it is in the world is not a setting, so nothing on the card moves with it. **Movement**: a drag slides it, the ground under the hand following the hand at a Speed of 1× (0.2× to 3×); the arrows and W A S D carry it forward, back, left and right of the way it faces at the Keys' speed (1 to 20 m a second); it picks up and loses speed over the Glide (0 to 2 s), a let-go drag carrying on over it, or, After a drag: Return, springing back to where the hand took hold on Response and Bounce. The keys are the world's unless a control on the card is in use; a press on the world gives them back; on the visitor's camera D walks and no longer flips the theme (the design system's `d`). There are no modes and no locks. **Focus and Flight**: a click on a portal moves the camera so the portal is at the middle of the view (on the camera's page, of the room the card leaves), at Focus's Height (0.5 to 20 m), Angle (10° to 90°, a degree a step) and Zoom (1× to 4×), facing the way it faced, flying on Flight's spring (Response, Bounce), lifting by its Arc (0 to 10 m); the card's values move as it flies. A click on the ground, or Escape, flies back; the hand or a key stops a flight where it is; the pointer is the design system's ring over all of it (W10). Starts at 3.2 m, 18°, Turn 0°, behind the human on the visitor's cell (version 8: 1.6 m, 22°, seeing the cell two ahead), 50°, 1×; Speed 1×, Keys 4 m/s, Glide 0.4 s, Stay; Focus 3 m, 50°, 1.5×; Flight 900 ms, 0.1, 1 m. Under reduced motion nothing glides, springs or flies. His notes: on version 1, more distance, zoom, tilt and height; on version 2, the drag; on version 3, seeing the values and the lock; on version 4, the click; on version 5, the camera set by what it looks at; on version 6, the height; on version 7, no modes and movement by drag and keys; on version 8, the human to travel as. Versions 1 to 8 are frozen. | *mine*, his to tune |
| **Map** | 4 | Shown, a switch (W76: off, the map is gone; version 3 frozen). Square plane with N/E/S/W markers, camera dot and view wedge (the environment's blocks, drawn by column, went with them; W24). Visible on the Environment, Camera, Map and start views, beneath the compass. Click anywhere to travel: Environment translates its orbit rig immediately; the visitor flies there. Both stay within the square. Size 120–320 px (at most 40vw); Shows The plane or Around the camera; Reach 10–1000 m; Turns Fixed or With camera. The full-plane map leaves its corners inside the rounded Card; with camera rotation it also fits the diagonal. Starts shown, 200 px, The plane, Reach 40 m, Fixed. Versions 1–3 are frozen. | *mine*, his to tune |
| **Portal** | 7, gone (W93) | **Gone with W93** (his: "Let's remove Portal because Pipes can be portals now. And there will be no motion"): no page (`/build/portal` leads to Sectors), no item, none drawn, and a portal kept in a world is let go; what follows is what it was. **Version 7 (W89, P1): a variant is how it opens alone**, its card the Opening group; its look (Size, Rim, Wall below) is each placed portal's own, set on the Sectors page as it is placed, and its page shows it in the look last set there; version 6 is frozen (`portal-v6.ts`). A round portal cut into the ground, called the hole until version 4 (his: "Let's add a hole", then "Let's call these holes as portals"; his first mock): its opening, a thin line round its edge, level with the ground, and its wall falling smoothly into the dark like a shadow. Size: Radius, Depth. Rim: Width (1 to 10 cm), Colour. Wall: Colour, Darkness (how dark the bottom gets), Reach (how far up the wall the dark climbs, 0 to 2: past 1 it climbs beyond the opening, at 2 the wall half dark already at its edge; his: "Increase the range for reach till 2.0"); it starts dark from the opening. **Opening** (his: "Portals should expand while it loads with a fluid motion"): it grows out of a point to its size on a spring, Response and Bounce, its edge rippling like a liquid's as it spreads (Ripple, how far), the ripple dying away as the spring comes to rest. **Waves** is a range, from and to, on one slider of two heads, and each time it opens three waves are drawn at random from it, each a whole number round and starting at a random place, so no two openings ripple alike (his: "I need waves to be range I can set and the waves should be random values between the range"). It opens as the world arrives, on its first frames, and again on Play. The ground is cut past the furthest the opening reaches, and a collar of the ground's colour fills the rest, so the portal never meets the ground while it moves. Lit by nothing; the colours to pick are seven from his mock and black (his: "We need black in the color palette"). It stands on its own page alone, two cells ahead of the visitor, cut into the start location's blocks, opening as the page comes into view; the environment has no portals (his: "Portals are not space units. We don't need those in the environment now"). His notes on the hole: on version 1, "Instead of steps and shade, I think it should be gradient like a shadow or dark hole"; on version 2, "We don't need rim and glow"; on version 3, "I think we should have rim. I'm thinking minimal line rim at the edge?". Versions 1 to 5 are frozen beside it. **His settings** (2026-10-12): Radius 0.5 m, Depth 2.0 m; Rim 0.01 m, Black; Wall Cream, Darkness 1.0, Reach 1.0; Opening Response 300 ms, Bounce 0.4, Ripple 0.10, Waves 3–8. | his settings; anyone plays with it on its page |
| **Sectors** | 4, Spaces' page | **Version 4 (W93): a block is 1 to 100 each way in metres or centimetres, turned round X, Y and Z (on the card, and R in the world), Smooth or Grain, placed flush on what the pointer meets; a pipe, a road and a grove take their whole look on the item's card; the Portal left the items; version 3 is frozen (`spaces-v3.ts`).** **Version 3 (W91): no zones.** This card holds Sector and Build; what is built and placed goes into the sector picked; a grove's Area (Width, Length, Corners, Hollow) is on the item's card, its outline under the pointer; version 2 is frozen (`spaces-v2.ts`). **Version 2 (W89): two cards.** This card keeps Sector, Zone (with its shape: X with Width, Z with Length, Corners 0–100%, and a Hollow of its own) and Build's Tool and Item (Block, Mountain, Trees, Portal, Human, Pipe, Road); what the item takes, and what is picked, stand on the item's card on the right. Trees are a grove that fills the zone. Version 1, below, is frozen (`spaces-v1.ts`). Where the world's spatial units are made (W81; his: "spaces is where we will see the world, and I should be able to create spatial units - Zones and Sectors"), on `/build/sectors`, the world seen as placed and every sector drawn by its edges, the one picked violet. **Sector**: the one picked in a Select, New sector, Go to it and Delete (with its zones, after asking; the last sector's is off) as icon buttons, its Name, and X (±500 m) with Width, Z (±500 m) with Length, Y (0 to 950 m, its floor) with Height, each a slider with its value typed, its place the middle of its floor, its width, length and height 50 to 1000 m (his); its note says its size, where it stands, when part of it is outside the world, and its zones. The camera glides to the sector picked, made, moved or sized, and on Go to it. **Zone**: the one picked in its sector, the entry marked, New zone, Make it the entry and Delete (the entry's off), its Name, no place or size (his). **Build**: Tool (Place, Select) and, with Place, the Item it puts into the picked zone, inside its sector alone (W82): a Block (Level, Width, Length, Height, Colour, as the Sector's version 5 below), or a Mountain, a Tree or a Portal, of a Variant from its library, a tree by the grove brush (Count, Spacing, Radius, Randomize), a ring under the pointer showing where and how wide. With Select a click picks blocks (Shift-click more) or one element, a drag moves an element within its sector, and Backspace removes what is picked. **Picked**: the element picked (its variant, Let it go, Remove, X, Z and Turn typed) or the blocks picked, as the Sector's version 5 below, their X, Y and Z from the middle of the sector's floor. **Grain**: Grain, Grain size, every block's. Copy sends the grain and each sector, its place, size and entry, and its zones' counts, then the world's data. Starts: his world read as one sector, Sector 1, the whole world, its Entry zone holding everything placed; a new sector 100 m each way. The Sector element's versions 1 to 5 are frozen (`sector-v1.ts` to `sector-v5.ts`, with `sector-zones-v3.tsx` and `build-blocks-sector-v3.ts`). | his sizes; the rest *mine*, his to tune |
| **Sector** | 5, frozen (W81) | The element Spaces took over: where the world's hierarchy was made, blocks built into its zones, and a block edited (W4, W24, W25); the plane in version 1, the sector on a plane in version 2, a sector of named zones on an N × N entry floor in version 3 (his: "In elements, add controls for the plane", "let's call it sector", "Let's remove the plane and instead of side, give me number of blocks"). **Ecosystem**, **Habitat**, **Sector**, **Zone**, a group each: the one picked, among those it sits with, in a Select (the entry marked), its menu (New, Make it the entry, Delete with all it holds; the entry's and the last ecosystem's Delete is off), its Name, and X, Y and Z in metres from the origin of what holds it, typed (X and Z a whole metre, ±500; Y a level, 0.25 m, ±50). **Build**: Tool (Place, Select), Level (0 to 99, over the zone's origin), Width, Length and Height (1 to 10 times the default), Colour; Select picks blocks, Shift-click more, Backspace removes them, for **Picked**: X, Y and Z typed, Width, Length, Height and Colour on every block picked. **Grain**: Grain (0 to 0.5), Grain size (0.02 to 0.3 m). | *mine* |
| **Human** | 6 | **Version 6 (W102): two Forms, the Suit and the Clay.** The Clay is his turnaround's figure, its outlines the picture's from the front, the side and the back, and three quarters round within a few pixels: a faceted head, paddle arms and column legs, no joints, visor or boosters; the variant **Clay** is it at the picture's measures. Its card: Form, then Head (Expression, Looks at cursor, Width, Height, Depth, Neck, Neck height), Body (Width, Depth), Arms (Length, Width, Depth, Groove), Legs (Length, Width, Depth, Gap), each starting at the picture's (head 74 × 62 × 62 cm, body 67 × 59, arms 73 × 34 × 42, legs 71 × 44 × 49). Kept under `no-origins:orbit:human:v6`, reading version 5's once; version 5 frozen. **The Suit, as version 5 was:** The figure the visitor travels as and looks out of, through its helmet (W51, W69); on `/build/human` it stands on a 4 × 4 m block and is looked round. **8 feet tall** (his). **His sketch's silhouette, puffed and jointed, with his visor** (W69): every part a round volume; an arm two bars bending at its elbow, a leg a thigh, knee and shin, a ball at the shoulder, elbow, hand, knee and foot, every bar and ball its own width, a joint wider than its bars a swell blended in over the limb's Blend; the head a ball with a round glass lens in a metal rim on its front; every hand and foot cut flat with a hole in a matte black rim standing out of it, its boosters. **Figure**: Colour, Shows (Look · Head · Skeleton · Boost), Posture (Stand · Walk · Run · Hover · Wave), Motion (Still · Walking · Running · Hovering · Flying); **Head**: Expression (Ahead · Up · Down · Left · Right · Tilt left · Tilt right · Curious · Shy), Looks at cursor (On · Off), Size (40–100 cm), Visor (10–90 cm), Bulge (0–20 cm), Rim (0–5 cm), Inset (0–5 cm), Neck (10–40 cm), Neck height (0–20 cm); **Body**: Width (50–120 cm), Depth (20–80 cm), Edge (2–40 cm), Dome (0–12 cm), Slope (0–40 cm); **Arms**: Length (50–140 cm), Groove (0–6 cm), Shoulder, Upper arm, Elbow, Forearm, Hand (10–60 cm each), Blend (0–30 cm); **Legs**: Split (30–120 cm), Gap (0–20 cm), Thigh, Knee, Shin, Foot (10–60 cm each), Blend (0–30 cm); **Torch**: Torch (On · Off), Colour, Strength (0–2000), Spread (10–90°); **Boost**: Colour, Length (0.2–3 m), Strength (0–30); **Boosters**: Hole (2–20 cm), Extrude (0–10 cm), Rim (0–4 cm), Curve (0–4 cm), Edge (1–16 cm); **Gait**: Walk up to (1–8 m/s), Stands under (0.05–2 m/s), Turn (0–1 s), Settle (0–600 ms). Starts at his settings (W71). Versions 1 to 4 are frozen with their builders. | the Suit's settings his (W71), the Clay his picture's; the rest *mine*, his to tune |
| **Trees** | 9, set as a grove is planted (W93, W98) | **Version 9 (W98): the flower's Shapes, several, each tree one of them by its seed; version 8 is version 9 with one shape.** **Version 8 (W93): no page and no variants.** A grove's trees are its look, set on the Sectors page's item card as it is planted: Trunk (Colour, Bend radius, its Length 1 to 100 m shortest to tallest on the grove) and Flower (Shape: Cube, Cylinder or Allium; Colours, several), every size following the trunk's length, the flower a plain colour that lights nothing; version 7, a variant's look with a light, is frozen (`tree-v7.ts`, `build-tree-v7.ts`). What follows is how it came. The awakening light (W67; his sheet: "We need this sort of trees (these are 1 type of many trees we will create later) in the orbit"), on `/build/trees`, among the grove: a white trunk of one radius, **100 to 150 m long, straight to 50 m and bent once from there** (his, W68) along one continuous curve, and at its tip, on its tangent, a closed tube wider than the trunk, its top and bottom covered (his), emitting blue, with a light that falls on what stands near. **Trunk**: Colour, Radius (1–20 m), Length (50–300 m, a range), Bend starts (0–200 m), Bend radius (10–400 m, a range); **Light**: Colour, Radius (1–30 m), Length (2–60 m), Strength (0–20000; Brightness and Reach until W90); **Grove**: Count (0–40), Spacing (10–300 m), Spread (50–400 m), Clearing (0–200 m), Seed, Randomize: a natural, park-like scatter round the world's middle, the trees standing everywhere at his settings, their feet in the base gas and their lights above it. Starts Cream, 4 m, 100–150 m, 50 m, 40–120 m; Awakening blue, 6.5 m, 25 m, 8000, 250 m; 16 trees, 60 m, 250 m, 40 m, seed 7. Version 1, a few metres tall, is frozen (`tree-v1.ts`, `build-tree-v1.ts`). | his length; the rest *mine*, his to tune |
| **Pipes** | 3, set as one is drawn (W93, W94) | A tube of one radius along its skeleton (W84, W87), drawn on the Sectors page a joint a click; its look, Colour, Start face, End face and Radius, is its own, set on the item's card (his: "Pipes will have Color and Radius", then "I want option to delete face of pipe at start and/or end"); an end without its face is open, the pipe lined inside. A pipe can be subtracted from blocks (W95). No page and no variants: version 1, a variant's look with a Gloss, is frozen (`pipe-v1.ts`); version 2 is version 3 closed at both ends. | *mine* until his |
| **Roads** | 2, set as one is drawn (W93) | A slab of one width and thickness along its skeleton, level from side to side, drawn as a pipe is; its look, Colour, Width and Thickness, its own (his: "Roads will have color, start and end similar to Pipes, width and thickness"); no lines on it. Version 1, a variant's look with edges and a dashed centre line, is frozen (`road-v1.ts`). | *mine* until his |

Each element has **variants** (W72, W73): its settings, named and saved in the database (an item of its kind, its draft and its published versions, as the agents' actions are), his published copy in code (`published.json`: eight mountains, Mountain 1 to 8; the tree, Awakening light; the human; the portal; and the world), and the human's second variant, Clay, in `human.ts` until he publishes it (W102). An element's page shows one of it alone with its variants; the Sectors page places them into a zone (W82). Trees is version 3, the tree alone; Mountains is the mountain's page, version 14 of its jig.

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
- **Square bounds** (now a 1000 m cube, its top the clouds: W29, W33): each camera stays half a metre inside each X/Z edge and above y = 0.2 m. Height is independent
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

- **W81 moves it** (his, 2026-10-15): the sector is no longer an element but a spatial unit, made on Spaces' Sectors
  page with a place in the world and a size; its zones keep their entry, Build and Picked as below, and what is said here
  of its page's view and of `/build/sector` is W81's now.
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
- **Blocks already built are edited** (his, 2026-10-15: "Along with Place and Remove option in Sector Page, add Select
  option too, so that I can edit the existing items"; then "We should be able to do multi-select", and of the Remove
  tool, "instead of an extra remove option, in the drop-down, let's have that in the select only. I mean, I can select
  and then use backspace"): Build's Tool is Place or Select; with Select a click picks the block the pointer meets,
  from any zone, Shift-click more, each wearing an outline, Backspace (or Delete) removes them, and the card's Picked
  group edits them: X, Y and Z from the zone's origin, Width, Length and Height, Colour, and Remove in its menu.
  *Mine:* a plain click picks one block alone and Shift-click (Command, Control) adds or takes one out, as selection
  works everywhere; the values shown are the last picked block's, a size or colour set is every picked block's, and
  a typed coordinate moves them all by the same step, so a group keeps its shape; the group also lists the zone's
  blocks in a Select, so one is picked without a click; a changed place is never refused, as a unit's is not (W25),
  and the note says what overlaps or stands outside the world, undrawn; a click on nothing or Escape lets them go;
  the pick is this browser's, let go on a reload, as the World page's is; Build and Picked are the groups open as the
  card arrives; Backspace never fires from a field being typed in.
- **Version 4 answers this section and W25** (W15). Version 3, the N × N entry floor and a colour a zone, is frozen.
  **Version 5 adds Select and Picked**; version 4 is frozen.

## W25. The hierarchy: entries, coordinates, and what is kept

- **W81 narrows it** (his, 2026-10-15): for now only sectors and zones; a sector's place is the middle of its floor in
  the world's coordinates, and a zone has no place of its own, so what it holds stands from its sector's. A world kept
  with ecosystems and habitats is read as W81 says, nothing moving.
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

- **His** (2026-10-12): "Can we set the world width, breadth and height?" This replaced W23's fixed 1000 × 1000 m
  square with a box, and then **he fixed its size** (W33): **1000 m west to east, north to south and up**.
- **The world is not in a sector** (his, on the first try, a World group on the sector's card: "Why is world inside a
  sector? All these groups and spacial units are inside the world? I just asked I can set boundaries for the world").
  **The world has its own jig and page, World** (`/build/world`), first in the builder's sidebar (W14), since the
  environment and every unit of the hierarchy are inside it. Its card says the size and has no controls (W33). The
  sector's card is as it was (version 4).
- *Mine:* **width runs west to east (x), breadth north to south (z), each centred on the middle; height runs up from
  the world's floor, y 0**, where every camera already stopped (W23).
- *Mine:* **every camera and every block stays inside it**: a camera half a metre inside each side and under the top,
  and over 0.2 m (W23), the visitor's camera held where it is over the floor, a looked-round page's clipped along its
  line of sight. A block is placed only where all of it fits, on or over the floor and under the top; one left
  outside is kept and not drawn.
- *Mine:* **the World page is the visitor's camera**, as at `/`: it travels with the keys, the drag and the map up to
  the world's sides and is held there. **The compass shows the size** (width × breadth × height), and **the map draws
  the floor**.
- **Its top is the clouds' underside** (his, W33): the cloud layer is the world's ceiling, and reaches past its sides
  to the horizon (*mine*).
- *Mine:* **its sides are unseen**, as W24's square was; the map shows them. Open: whether they are drawn.

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

## W32. Irregular clouds across the sky

- **His** (2026-10-12): asks why the clouds form a pattern. The explanation identifies v17's repeated bank and
  periodic weather as a performance shortcut, and proposes irregular weather formations while retaining its worker
  and budget. He accepts with **"okay"**. Work continues in the main checkout on `design/cleanup`, following his
  request to merge the worktree there; the architecture agent's worktree stays intact.
- **Environment v18** replaces the repeated sculpted bank and periodic weather map with a deterministic world-space
  density field. Broad weather and displacement vary formation shape, coverage, pigment and layer height; irregular cellular features and three erosion
  scales form billows and open gaps. The cloud silhouette has no repeated UV tile or fixed lobe arrangement.
  Coverage remains an internal art value; no Count is introduced.
- **His**, during this change: remove unwanted cloud controls from the jigs, then clarifies **"I don't need any
  controls for clouds"**, including colours; match the target instead. The entire **Clouds** group and the separate
  Cloud texture/colour groups are absent from the active jig. All cloud distribution, motion, material and colour
  values remain internal art settings. The cloud-only Grain size knob is also absent from Light and texture.
  General sky and world lighting controls remain. Saved sky/light/fog tuning is retained; cloud art values use the
  current internal preset on read, so hidden former edits cannot override it. Frozen jigs retain their historical controls.
- **Internal art values**, mine to review against 05: layer clearance 140 m, reduced sage shade strength 0.6,
  and blush restricted to higher pigment deposits. This keeps cream dominant and lifts clouds above the visitor.
- **A rolling region**: the worker prepares a 2048 × layer-height × 2048 m window at 128 × 64 × 128 voxels, with
  sunlight/sky depth at 64 × 40 × 64. When travel moves more than 256 m from the desired centre, it prepares an
  overlapping region, snapping its centre by 256 m. Density and coordinate origin swap together when the latest
  reply arrives. Overlapping density is identical at aligned world positions; sunlight cache boundaries remain an
  approximation. Coarse fallback uses 64 × 40 × 64 density and 32 × 24 × 32 lighting.
- **Material and budget**: a small generated 32³ texture adds metre-scale powder erosion and tooth; only this fine
  material repeats, not whole-cloud shape. The ray takes three volume samples on occupied steps, with weather held
  in density's third channel. W31's 180,000-pixel ceiling, adaptive 16–48 samples, cached frames, visibility guards,
  worker job coalescing and disposal remain. Field preparation may take longer than v17's smaller bank; it stays in
  the worker, and sustained fast travel and physical-phone performance still need profiling.
- **History**: v17's environment, density, job, worker, cloud builder/pass, sky and surroundings are frozen. The
  current tuning key is `no-origins:orbit:environment:v18`; older keys and built-world data remain. The local review
  uses the active source at the same URL. No new artwork is required; the hosted gallery still has v15.

## W33. A kilometre cube, and the clouds are its ceiling

- **His** (2026-10-12), comparing his painted target (`notes/world/sky-target.png`) with version 18
  (`notes/world/sky-v18.png`): five ways to close the gap were put to him (A, restyle the gas; B, a ceiling, not a
  volume; C, sculpted surfaces; D, brush strokes in 3D; E, a painterly filter over the frame). **"Let's go with B."**
  Then: **"Let's fix world dimensions. It should be 1000m length, width and height. Then we can place the cloud layer
  at the ceiling."**
- **The world is 1000 × 1000 × 1000 m, fixed** (his; a cylinder of that diameter and height since W42): World version 3 has no controls; its card says the size. Version
  2 is frozen (`bounds-v2.ts`), and the boundaries a visitor set on its page are no longer read.
- **The clouds are the world's ceiling** (his): the cloud layer's underside is at y 1000 m, the world's top. *Mine:* it
  reaches past the world's sides to the horizon, where it thins into the haze, since the world's sides are unseen
  (W29). No camera is ever above it or inside it (each stays half a metre under the top), so it is only ever seen
  from below.
- **B, a ceiling, not a volume**: each pixel of sky finds where its line of sight meets the layer, and reads the cloud
  there from noise, so there is no grid of gas to blur its edges and perspective alone composes the sky: big masses
  overhead, streaks toward the horizon, blue between. *Mine:* the masses stand on the ceiling and rise up to 320 m,
  tallest at their cores, their height from the broad noise alone so they never rise in spikes, and each ends in a wall
  at least a third its height; a short climb through the layer (twelve steps, fine near the ceiling and growing, then
  four to refine) finds the first mass a line of sight meets, so near masses overlap far ones and show their sides.
  Past 1.5 km the masses flatten, to a twentieth of their height by 7 km, so the far layer is streaks, never a fence
  of sides.
- **The paint** (*mine*, to match his target): colour by light, never by darkening: cream where lit, rose in the
  middle tones, a light sage only in the thickest shade, all high in value; rose in patches, so masses differ; a
  bright thin margin toward the sun; each billow a round puff lit on its sunward side; a side's foot as bright as the
  margin it rises from, so no darker rim; crisp, scalloped edges, broken by finer noise, with a little sky showing
  through the thinnest;
  pale feathered wisps at the margins, drawn along the wind; a fine tooth fixed to the clouds. Far clouds mix into
  the sky's colour at the horizon, so the layer dissolves into the peach haze. The sky behind is dithered, so its
  blue-to-peach gradient no longer bands.
- **What it costs** (*mine*): no worker, no 3D textures and no separate cloud pass. One small tileable noise image
  (256 × 256), made once in the page, is read at several rotated scales, so its tile never shows as a repeated
  cloud (W32); distant noise is read from its smaller copies, so the horizon does not shimmer. The clouds are drawn
  at the world's own resolution, behind everything built, since everything built is under the ceiling. Version 18's
  low-resolution cloud pass, which made its clouds blurred, is gone.
- **No controls** (W32 stands): coverage, thickness, colours and drift are internal art values (`CLOUD_ART`); the
  drift follows the Sky's Wind, about 4.5 m a second, on the clouds' clock, which the base's clouds share (W34);
  Motion, Pause, reduced motion and a hidden tab rest it. While only the sky and clouds move, the world redraws at most
  every 50 ms.
- **Seen** (*mine*): WebGL 2 and WebGPU, at 60 frames a second in a headless Chromium at 1440 × 900. Not yet seen on
  his own screen or a phone. Still short of his target: the masses have less sculpted volume than the painting and no
  brush texture in their bodies, and the wisps barely show.
- **History**: version 18's environment, cloud field, job, worker, pass and builder, sky and surroundings are frozen
  beside version 19; its tuning key is `no-origins:orbit:environment:v19`, earlier keys untouched.

## W34. White clouds and mountain tips at the base

- **The base of the world has white clouds flowing, with the tips of huge mountains visible through them**
  (his, 2026-10-12). The ceiling clouds (W33) remain a separate layer.
- *Mine:* the cloud bed lies below the building floor at y 0, with irregular stone summits emerging through it;
  their massifs descend to y −180 m, hidden by the clouds. The base is scenery, separate from the hierarchy's assets.
- *Mine:* two world-space cloud surfaces form a billowing white bed and broken drifting veils that intersect the
  mountain slopes. Mineral faces and crooked secondary summits give the exposed tips relief. The art values are
  internal, with no new controls; Sky's Wind directs them, and the existing cloud clock carries them. Motion,
  zero flow/speed, reduced motion and a hidden tab rest the base with the ceiling.
- **Environment version 20** includes the base's first version (`build-world-base.ts`); version 19's environment,
  sky, ceiling and surroundings are frozen. Its tuning key is `no-origins:orbit:environment:v20`.

## W35. The base clouds follow his illustrated mountain reference

- **The base clouds do not look like clouds** (his, correcting version 20, 2026-10-12). His inspiration is an
  illustrated mountain landscape with piled, scalloped white cumulus, blue recesses and bright sunlit crowns.
- *Mine:* version 21 replaces the two displaced sheets with overlapping three-dimensional cloud lobes gathered
  into broad banks. White/cream crowns, pale blue middle tones and deeper blue recesses have stepped shading;
  real silhouettes, overlap and depth testing let banks hide the mountain slopes as they pass.
- *Mine:* instanced tiles share a scalloped lobe geometry across a seeded field extending beyond the world;
  tiles outside the view are culled. Broad bodies carry
  smaller irregular crowns; a deep opaque fill seals the distant gaps. Slow bounded drift follows Sky's Wind,
  with slight breathing of the crowns. The existing cloud clock, Pause, zero speed/flow and reduced motion apply.
- **Environment version 21**, base version 2; version 20's base, environment and surroundings are frozen.
  The tuning key is `no-origins:orbit:environment:v21`.

## W36. The ceiling, softer and pastel

- **His** (2026-10-12), on the first ceiling (W33) as seen in Environment version 21: "The clouds no way look like the
  inspiration I provided", then **"Make the clouds softer and pastel effect."** Five ways to paint the ceiling's
  material were put to him (A, the v15 artwork laid flat on the ceiling; B, procedural nested domes; C, procedural
  heaps with the painting as their skin; D, one painted sky dome at infinity; E, a painterly filter), with A grown into
  C recommended; he has not picked one. This version answers his note on the ceiling as it is.
- *Mine:* **every edge feathers, like a dry brush**: a mass's underside edge fades over its own band (`feather`, a few
  tens of metres at a billow, a hundred or two along a broad margin, never under a pixel and a half), broken up by fine
  noise; a wall met beyond it wears the same feather, by how far inside the outline the line of sight enters it, and
  fades where the mass is thin and along its crown, so a mass's own wall never cuts its feather off. No edge is a hard
  line.
- *Mine:* **the paint is paler**: cream `#fff6e8`, rose `#f7cdd8`, sage `#cdd4c3`, every blend between them wide, the
  grain halved; each billow a soft puff, lighter sunward and in its belly, shaded in the recess between puffs, with
  finer billows nested in it fainter still; the sun's glow at the margins softer.
- *Mine:* **a wash of the sky lies over every cloud** (`wash`, a tenth even overhead), growing with distance until the
  far layer dissolves into the horizon, which is what keeps the paint pastel rather than white.
- *Mine:* **the heaps are lower and rounder**: 240 m at a core (was 320), a wall at least a quarter its height.
- **Frozen**: the ceiling as he saw it, `build-clouds-v21.ts` (`build-clouds-v19.ts` is an earlier draft of it).
  The environment's version and keys are the base's (W34, W35), untouched by this.
- **Seen** (*mine*): WebGPU at 60 frames a second, headless, 1440 × 900. Still short of the target: the nesting of
  billows is soft noise, not the painting's cauliflower; the flattened far masses mid-sky carry sage streaks that
  read muddy; the wisps are faint. The material question (A–E above) is still his.

## W37. The base clouds are gas, fog and air

- **His reference guided the implementation in the wrong direction** (his, correcting version 21, 2026-10-12):
  **"I did not want those billows. I wanted the clouds to be in the gas(fog/air) form."** This supersedes W35's
  illustrated cumulus direction for the base. The base remains white flowing clouds around huge mountain tips (W34).
- *Mine:* version 22 replaces the rounded cloud geometry with continuous, irregular volumetric white fog. Density
  grows below the building floor, feathering through y −55 to 10 m and extending down to −185 m. There is no
  visible cloud surface; mountain faces gradually disappear through the gas with their upper tips visible.
- *Mine:* a small filtered numeric 3D texture supplies broad density and finer wind-stretched strands. Twenty-four
  samples integrate transmittance and pale white scattering along a ray, stopping at each mountain face; the same
  integration applies to the distant fill and sky, so the horizon dissolves into the fog. Spatial jitter is fixed,
  so pausing never flickers. Gas advection follows the existing cloud clock and Sky's Wind; Pause, zero flow/speed,
  reduced motion and a hidden tab hold it still.
- **Environment version 22**, base version 3 (`build-world-base.ts`, `build-base-fog.ts`); version 21's base,
  environment and surroundings are frozen. Tuning key: `no-origins:orbit:environment:v22`.

## W38. Controls for the ceiling clouds

- **His** (2026-10-12), on W36's ceiling: **"Give me jig controls for the clouds above."** For the ceiling clouds this
  supersedes W32's "I don't need any controls for clouds"; the lower gas gains its own controls in Environment (W40).
- *Mine:* **Clouds is a jig of its own, version 1** (`clouds.ts`, `build-clouds.ts`), with its page `/build/clouds` in
  the sidebar after Environment (W14): the clouds are the environment's (W31), but a builder of their own by the
  two-file rule, and the environment's card is full. Its page sees the ceiling as the Environment's page does, looking
  up across the open square, so the two are tuned on one view; its settings show on its page alone, and the world
  everywhere else is his (W14).
- *Mine:* **its groups are what the art was** (W33, W36), by what they are: **Layer** (Thickness, Coverage, Masses,
  Billows, Stretch), **Edge** (Feather, Wisps), **Paint** (Cream, Rose, Sage, Wash, Haze, Glow, Grain) and **Motion**
  (Drift, Roll); W15 has their ranges. The Environment's Motion still pauses them, and its Wind still directs them.
- *Mine:* **it starts at W36's values**, so nothing he saw moves until he tunes it, and **three swatches join the
  world's palette**, Pale cream, Pale rose and Pale sage, so his start colours are the ones he saw.
- **Frozen**: `build-clouds-v22.ts`, the ceiling as he saw it in Environment version 22, its art fixed. The climb's
  steps (twelve) are not a control.

## W39. Different mountain forms, with pastel texture

- **His** (2026-10-12): the mountains below the environment all look the same. Use the mountain types in his
  attached reference sheet, and match the pastel effect of the world.
- *Mine:* twelve formations now use six distinct landforms: snowy alpine massifs, elongated blue ridges,
  jagged lavender crags, rounded sage hills, narrow terracotta buttes and wide ochre mesas with horizontal strata.
  The sheet guides the silhouettes and geology; its saturated colours are softened to the world's pastel palette.
- *Mine:* each is solid procedural geometry, with multiple unequal summits or rounded lobes, eroded flutes on
  cliffs, and genuine flat tops on tablelands. Their bases descend to y −180 m; tips rise 32–66 m above the floor
  so their different forms read through the gas. They remain scenery beneath what is built (W34).
- *Mine:* matte vertex pigments, broken alpine snow lines, cream strata and restrained stepped peach light/lavender
  shade carry the paint. Two scales of still world-space grain give dry pastel tooth. The existing Sunlight,
  Shadow, Warmth, Shade and sun direction settings affect the mountains. Fog veils the faces with the same ray
  integration as the sky. No artwork downloads, extra controls or animated mountain textures.
- **Environment version 23** includes this mountain iteration (`build-mountains.ts`, `build-world-base.ts`).
  Version 22's mountain base, surroundings and environment are frozen; its tuning key stays intact.

## W40. Thinner lower clouds at varied heights, with their own controls

- **His** (2026-10-12), on version 22's white gas: **"I like this"**, but it feels like a pattern, the clouds are
  all at the same level, and it is too dense. He asks for relevant changes and jig controls for the clouds below.
  The gas direction in W37 stands; the request for lower-cloud controls supersedes their earlier lack of controls.
- *Mine:* a non-repeating, domain-warped weather field determines gaps, bank centres and local thickness separately.
  The finer gas texture is rotated within it. Fog has a soft vertical profile around each bank's own height,
  rather than a shared ceiling. There is no uniform density floor, so coverage can create genuinely clear patches.
  Lower starting density and partial coverage make the white gas lighter while still veiling mountain slopes.
- **Environment › Base clouds**, using the shared jig controls: **Density** (0–2), **Coverage** (0–1), **Height**
  (−120 to 60 m, bank centre relative to y 0), **Height variation** (0–100 m), **Thickness** (20–160 m), **Scale**
  (40–300 m), **Speed** (0–3×) and **Wind** (−180–180°). Starts: 0.65, 0.65, −45 m, 50 m, 85 m, 130 m, 0.6×, 45°.
  Density or Coverage at zero hides the lower fog; zero Speed rests it. Copy includes these values, Reset restores
  them and browser storage keeps them on Environment's page alone (W14). Ceiling controls stay on Clouds (W38).
- *Mine:* the lower fog has its own clock, speed and wind. Global Motion, reduced motion and hidden tabs still
  rest the whole atmosphere. Uniform changes retune the existing gas without rebuilding the mountains or textures.
- **Environment version 23**, base fog version 4; version 22's environment, gas and surroundings are frozen.
  Tuning key: `no-origins:orbit:environment:v23`. This version also includes the mountain changes in W39.

## W41. Plain mountain tips, consistent paint and spaced random placement

- **His** (2026-10-12): make the mountain tips plain, provide roughness and random-placement controls, reduce
  crowding, and use the violet mountain with a white tip's colour and consistent texture on every mountain.
- **Environment version 24** adds **Mountains**: Roughness (0–1), Count (0–18), Spacing (0–300 m), Layout seed
  (0–9999), and Randomize. Starts: roughness 0, eight mountains, a 150 m clear gap, seed 17. Zero roughness removes
  erosion and top ripples; mesas and buttes have flat plain tops. The reference's distinct landforms remain.
- *Mine:* every form shares the same violet pigment, white upper cap, matte shading and anchored fine grain.
  The earlier green, blue, ochre and terracotta paints and mesa stripes are superseded. Roughness alters relief
  and the snow edge without changing the common material treatment.
- *Mine:* seeded random placement rejects overlapping footprints, including each shape's stretch and maximum
  erosion. Spacing measures the clear gap between those footprints. The starting viewpoint has open space around
  it. Higher counts or wider gaps expand scenery outward rather than silently reducing the requested spacing.
  Randomize picks a different seed; saved seeds reproduce the layout on reload. Count zero hides the mountains.
- Copy includes every mountain setting; Reset restores the starts. Storage is `no-origins:orbit:environment:v24`;
  version 23's environment, mountain geometry, base, fog and surroundings are frozen. Mountain edits replace only the mountain geometry and dispose the previous meshes’ geometry; fog and wind
  edits continue to retune uniforms without rebuilding the fog textures.

## W42. The world is a cylinder

- **His** (2026-10-12): "Instead of cuboid shaped world, lets make it cylindrical." The world is a cylinder standing
  on its floor, y 0, its round centred on the middle, its top the clouds' underside (W33).
- *Mine:* **its size stays his fixed kilometre** (W33): 1000 m across and 1000 m high, so the round fits inside the
  square it replaces, touching the middle of each side; the square's corners are now outside. World version 4 says it
  and has no controls; versions 1 to 3, boxes, are frozen.
- *Mine:* **everything held inside the box is held inside the round**: a camera half a metre inside the round side and
  under the top, and over 0.2 m (W23), brought in toward the middle where it would leave; a looked-round page's camera
  clipped where its line of sight meets the side; a block placed only where its whole footprint lies within the round.
- *Mine:* **at the side, a camera slides round it**: a key or a hand that carries the camera and what it looks at into
  the side carries them along it instead of stopping dead, as the box's flat sides let them.
- **The map draws the round** (*mine*), the camera on it, and a click outside it takes the camera to the side; **the
  compass says the size** as ⌀ 1000 m · 1000 m high.
- *Mine:* **what is beyond the side is unchanged**: the ceiling clouds, the base clouds and the mountains reach past
  the world's side as they reached past the box's, since the side is unseen (W29). Open: whether the side is drawn,
  and whether the mountains stand on a ring round the round rather than the square they are scattered over now.

## W43. Cloud boundaries enclose the world; mountain tips stand at its concealed base

- **His** (2026-10-12): the world's boundaries must conceal everything outside. Its walls are foggy clouds;
  the upper and lower clouds merge at the wall through a gradient formula. Only mountain tips are needed at the
  base, with clouds concealing that there is a base. This supersedes W34's buried mountain bodies and W42's
  scenery continuing outside the cylinder. The world remains the 1000 m diameter × 1000 m high cylinder.
- **Environment version 25**: floor, round side and ceiling are closed cloud-rendering surfaces inside the
  cylinder. The side's paint follows `t = clamp(y / height, 0, 1)`, then `t² × (3 − 2t)` to mix lower white gas
  into the ceiling's cream/rose/sage paint. This height gradient is his explicit world direction. Powder noise
  breaks the finish; a 140 m inward fog band conceals the side as a solid wall. The ceiling rim shares the
  side's paint and gradient, preventing a sky gap or a sharp join.
- *Mine:* the ceiling's painterly cloud shader is drawn on a closed circular cap at y 1000; open patches show
  the enclosed sky colour. The wall is opaque at the final boundary, so neither a gap nor travelling right up to
  it exposes the outside. The lower fog integrates the same air toward the floor, mountain tips and side.
- *Mine:* only 42–64 m high tip geometry is generated, starting at y 0, with footprints 25–40 m before shape
  stretch. No vertex or submerged mountain body lies below the world. The violet/white paint, plain tips and
  roughness control remain. A thin permanent cloud veil conceals the geometry's foot and the floor, even if the
  adjustable lower banks are turned down. Lower banks now start at Height 0 m; its range is 0–180 m.
- *Mine:* seeded placement keeps complete tip footprints within the cylinder, with a 20 m boundary clearance,
  and retains the requested gap. When Count and Spacing cannot fit, fewer tips are placed; the Mountains note
  reports how many fit. Expanding scenery outside the world is superseded.
- Version 24's surroundings, mountain geometry, placement, fog, sky, ceiling and environment are frozen beside
  this version. Tuning key: `no-origins:orbit:environment:v25`.

## W44. Smooth mountain tips with violet-to-white pastel gradients

- **His** (2026-10-12): make the mountains smoother, with nice pastel gradients between white and the other
  mountain colour. This explicitly supersedes the earlier narrow white cap and stepped surface shading.
- **Environment version 26** rounds the summits and their joining saddles, retaining distinct silhouettes,
  flat tableland tops and Roughness. The material blends pale violet through lavender into warm white across
  most of each tip's height; light and shade blend continuously, and the dry pigment grain is reduced.
  The gradient is his explicit mountain direction. Placement and the cloud enclosure remain W43's.
- Version 25's mountain geometry, base, surroundings and environment are frozen. The tuning key is
  `no-origins:orbit:environment:v26`; roughness still starts at zero.

## W45. Grass-green mountain pigment

- **His** (2026-10-12): replace the mountains' violet with grass green.
- **Environment version 27** uses pastel grass green `#91b86f`, pale green `#c6dbae` and the same warm white
  `#faf7f4`. W44's smooth geometry, continuous shading, broad colour gradient and fine grain remain.
- Version 26's mountain geometry, base, surroundings and environment are frozen. Tuning key:
  `no-origins:orbit:environment:v27`.

## W46. Sky overhead, neutral cloud walls

- **His** (2026-10-12): looking up, the ceiling's colour spreads too strongly onto the world's sides; it should
  feel like sky. This refines W43's join, keeping the cloud enclosure while reducing coloured spill onto its walls.
- **Clouds version 2 / Environment version 28** keep the boundary mostly neutral white with a faint sky wash.
  Ceiling pigment reaches it only through **Clouds › Paint › Wall tint** (0–1, starts 0.04). Zero removes cloud
  pigment from the wall; the overhead clouds retain their own colours and controls. A lightly irregular neutral
  feather joins the ceiling to the wall, avoiding the previous uniform coloured halo.
- Existing cloud tuning is retained under `no-origins:orbit:clouds`; its missing Wall tint takes the new start.
  Environment's unchanged configuration retains its v27 key. Copy includes Wall tint, browser storage saves it,
  and Reset restores 0.04. Version 1's cloud jig and version 27's ceiling, wall paint, fog and surroundings are frozen.

## W47. Soothing directional shade on the cloud walls

- **His** (2026-10-12): the sun is not directly above the cylinder, so the side walls should carry a nice,
  soothing shadow. This refines W46's neutral walls with directional lighting from the existing sun.
- **Environment version 29** adds a broad soft wash: cooler shade on the wall away from the sun, gentle warmth
  on its sun-facing side. Sun height and Sun turn orient it; Shade, Shadow, Warmth and Sunlight tune it through
  Environment's existing Light and texture controls. A high sun reduces the difference between the sides.
- *Mine:* the wash blends continuously with no hard shadow edge. It fades at the base and continues through
  the ceiling rim using the shared boundary paint. Wall tint remains independent and keeps coloured cloud
  pigment subdued. The thin base veil is integrated analytically to avoid speckled wall shading on upward rays. This is a
  painterly directional wash, not a physical cloud-shadow simulation.
- Version 28's boundary paint, ceiling, fog and surroundings are frozen. Existing environment and cloud tuning
  remain saved under their current keys.

## W74. The clouds' Drift and Roll reach further

- **His** (2026-10-15), on the Clouds jig's Motion: "Currently, the jig speed maximum is at 30 meters per second.
  Make it up to 150 meters per second. And maybe give roll also up to 5x."
- **Clouds version 4**: Drift 0 to 150 m a second of the clouds' clock (a mark every 25), Roll 0 to 5× (a mark every
  1); the steps stay 1 m/s and 0.1×, the starts 10 m/s and 0.6×. Nothing else on the card changes. Version 3 is
  frozen (`clouds-v3.ts`).

## Open

- **What is built in the world** (his, after the world is built): whether each app becomes a place inside Orbit, travel
  between them seamless and their old hosts redirecting to their place (*mine*), or stays its own site with its own
  terrain, going from one to another a page load.
- **One library with Cinema** (his to decide): a mountain made for a film could stand in the world, at the cost of
  porting Cinema's entries to TSL (W9).
- **The cell's size in metres**, and which unit of the hierarchy is the chunk sent (W4, W5): decided with the first place.
  The block is decided (his).
- **How the builder shows the hierarchy** (his): making a habitat or an ecosystem (set aside, W81), and whether a block
  or an asset may move from one zone to another, or a zone from one sector to another (W25).
- **Where the world is entered** (his, with the flow; W25).
- **The sector's entry zone, designed** (his: "which we will design later"; W24).
- **What a block is to see** (his): a solid of ground, as version 2 draws it (*mine*), or a room of air that things are
  built in.
- **Which assets come after the block and the portal**, and the library they come from (his: "we will eventually have
  library of assets").
- **Where the agents' looks are made** (his to decide). The editor went with the old Orbit. The looks it published
  are still in the database, and the motion studio still reads them.


## W48. Keep the wall shade below the sky

2026-10-13. His correction on version 29: the shade reads on both sides and spreads toward the sky rather than
following the cylindrical wall.

- **Environment version 30** separates the neutral boundary paint from the vertical wall's directional wash.
  The ceiling rim uses only neutral paint. Wall shade fades to that paint over the upper 160 m, so the join
  cannot cast a dark ring across the sky.
- Shade occupies the hemisphere away from the sun, with a smooth falloff to zero at its sides. Sun turn rotates
  it; Sun height softens it toward overhead; Shade sets its strength. Warmth gently paints the sun-facing side.
- Fog carries directional paint only for endpoints on the cylinder's side. Floor and mountain endpoints stay
  neutral, including when viewed near the boundary. The existing settings and saved tuning are retained.
- Version 29 and its connected builders are frozen beside the active version.


## W49. Sun lighting and cloud light scattering

2026-10-13. His request after W48: the painted shadow still does not look realistic; implement real lighting.

- **Environment version 31** adds a Three.js directional sun, positioned from Sun height and Sun turn, and
  diffuse hemisphere sky fill. Mountains use fully rough, non-metallic physical materials; their green/white
  vertex pigment remains. Mountain meshes cast and receive shadow maps. The opaque boundary shell also uses a
  physical material, with fog composited after surface lighting instead of lighting the fog as solid stone.
- The cloud wall is participating air. Each view-ray sample traces twelve midpoint samples toward the sun to
  the outer cylindrical bank or top. Beer–Lambert extinction measures transmitted sunlight through the same
  radial wall-density field. A normalized Henyey–Greenstein phase controls scattering toward the eye.
  There is no wall-facing colour-gradient shadow. The sun-facing cloud bank can transmit light from behind.
- **Clouds version 3** traces sunlight through the actual procedural ceiling mass, using its shape, coverage
  and thickness to accumulate optical depth. Its pastel pigment is independent of this illumination. The same
  wall fog now composites over the ceiling as well, so both surfaces share attenuation at their join.
- Diffuse sky fill approximates multiple scattering; the wall light trace does not integrate the lower weather
  banks or solid-object occlusion. This is a bounded real-time single-scattering approximation, not complete
  global illumination. The independent ceiling/wall density fields are retained, rather than a unified cloud
  simulation. Sunlight, Warmth, Shadow and Shade tune the sun colour and diffuse fill, with saved settings intact.
- Fog uses 32 deterministic midpoint view samples. Screen jitter made high-sun transmission speckle; deterministic
  integration keeps it smooth. The thin floor veil retains its analytic integral.
- Version 30's connected builders and Clouds version 2 are frozen. Visual review covers opposite sun directions,
  an overhead sun, and the ceiling join. Pixel comparisons change for low-sun rotation and are identical for
  rotation at 90°; browser review reports no errors. Typecheck and lint pass.


## W50. Stone mountains with slanted reflective summits

2026-10-13. **His:** make Orbit's mountains like the supplied reference: steep stone emerging from clouds,
moss on the lower slopes and a thin reflective plate over a slanted summit.

- **Environment version 32** replaces rounded green/white landforms with tapered monoliths: broad rounded
  rectangular rock faces, vertical fissures, mineral grain and irregular moss near the base. Each summit meets a
  thin rectangular mirror plate on an inclined plane. Roughness deepens erosion without breaking that plane.
- Stone retains W49's physical sun lighting and shadows. The mirror uses a view-dependent procedural reflection
  of sky/cloud colours and the sun direction; it does not reflect nearby geometry or exactly reproduce the ceiling
  cloud field. This bounded approximation requires no extra render pass and works with both renderer backends.
- W43's cloud enclosure, fog veil and seeded placement remain. Footprints enclose the complete rotated monolith;
  Count, Spacing and Layout seed still govern placement. Tips are now 110–145 m tall so the broad cliffs remain visible above the lower banks; atmosphere defaults
  remain as in version 31. The new tuning key is `no-origins:orbit:environment:v32`.
- Version 31's environment, surroundings, mountain base, shape and placement are frozen beside the active version.

## W51. The visitor is a human, eight feet tall

2026-10-13. **His:** "We need a human character of 8 feet in orbit. I will later give you the look of the character,
currently we will need human skeleton at the least to travel in the orbit." This decides how a visitor moves (Open,
before): walking a figure.

- **The visitor travels as a human figure, 8 feet tall** (his), 2.44 m from sole to crown. It stands where the visitor
  is, starting on the visitor's cell at the world's middle, facing north, and goes where the visitor goes: the arrows
  and W A S D, a drag and a click on the map (the Camera's Movement, W15) all move it, and the camera follows.
- **Its look is his to give later** (his). Until then it is its skeleton. He gave it the same day: his sketch, W65. *Mine:* a real bone hierarchy from the design
  system's human rig (`@no-origins/ui/lib/human-motion`: the nineteen joints the Hiddenstack rig declared, scaled to
  the figure's height), drawn as a rod from each joint to its parent's, a ball at each joint, an egg for the skull and a
  foot from each ankle to its toe, in one flat colour of the world's (Dusk to start), lit by the sun and the sky and
  casting its shadow (W49). A look given later binds to the same bones.
- *Mine:* **it walks and runs as it travels**, the rig's walk and run (Motion.md, the `--motion-human-*` tokens:
  starting values, his to tune): it walks up to a speed and runs over it; a stride's cycle covers the ground it
  travels, so its feet never slide; it turns to face the way it goes and keeps facing there when it stops; its limbs
  take a moment to start and to stop. Under reduced motion it faces its way and stands or walks at once.
- **The camera follows it** (Camera version 9, W15): it stands back from the figure the way it faces, at its Height,
  looking down its Angle at the figure's hips, so the figure is at the middle of the view and walks ahead of it. Its
  Height, Angle and Turn never move with it, as before; where it stands follows from them and the figure. *Mine:* it
  starts 3.2 m up, looking down 18°, about six metres behind. Version 8, which stood where the visitor is and saw the
  ground ahead, is frozen (`camera-v8.ts`).
- **Human, version 1, is a jig** (`/build/human`, under Elements after Sector, W14): **Figure**: Colour (the world's
  swatches), Bone and Joint (2 to 12 cm and 2 to 16 cm thick); **Gait**: Walk up to (1 to 8 m/s), Turn (0 to 1 s),
  Settle (0 to 600 ms). Its page is the visitor's camera, so the figure is walked while it is tuned. Its height is not a
  control: 8 feet is his.
- Open: where a visitor stands while the floor is concealed in gas (W43): the figure stands at y 0, in the mist, until
  the land is built. The map marks the camera, not the figure. A click on a portal (none stands on a visitor's view
  now) walks the figure to where version 8's camera stood to see it, the camera behind.


## W52. Element inspection and mountain jigs

2026-10-13. **His:** the mountains do not yet match the reference; give them jigs. First adapt the controls
from Motion Studio. A dropdown must select from the hierarchy of spatial units; selecting an element drives the
camera to it and then opens its controls.

- The established hierarchy is **World → Ecosystem → Habitat → Sector → Zone**, with assets inside a zone
  (W4, W25). Entries point to children and coordinates are relative to the parent. The selector follows actual
  saved parents, with kind and full path for every item; it does not flatten units into unrelated presets.
- Mountains remain environment scenery (W34, W43), rather than being silently reassigned to a zone. They appear
  under **World → Environment**, alongside ceiling clouds. Portal and Human appear as elements. The selector is
  also present on each existing jig page and opens `/build/inspect`; the sidebar calls it **Inspect**.
- The controls adapt Motion Studio's parameter rows: a label and typed value, the system slider below,
  two controls to a row, small Selects for choices and ColourPickers for paint. Each group is a separate foldable
  Card. Reset, Copy and Play belong to the jig's actions menu. A constrained panel scrolls its own groups on
  desktop and mobile; the world remains visible beside or above it. This refines W14's single large card.
- **Mountain version 1** tunes a selected mountain independently: height, width, depth, taper, roundness,
  turn, erosion, moss height, stone and moss colours, summit surface (Mirror/Stone), tilt, overhang and thickness.
  The stone and its plate share the inclined summit plane. The camera starts above the selected mountain so the
  summit is visible. Tuning changes live, without moving the camera on every slider update.
- Each layout seed and mountain index identify its tuning. Browser storage is separate from Environment's
  placement settings (`no-origins:orbit:mountains:v1`). Reset removes only that mountain's tuning; Copy sends
  its settings. Large widths/tapers are fitted within the cylinder and the requested spacing between mountains.
  The fixed appearance of W50 is frozen in the version 32 mountain/base/surroundings builders.
- Units and blocks also have their own controls. Unit editing reuses the existing hierarchy controls; blocks
  expose position, size and colour. Reset never erases spatial data. Block edits must remain inside the world
  and cannot introduce an overlapping block. The sector page remains where new blocks are placed.
- Camera travel uses the existing camera flight spring and one frame loop. Controls stay hidden until the
  arrival callback for the current request. A newer selection cancels the old journey and discards stale arrivals;
  returning to Inspect travels again before reopening controls. Reduced motion cuts to the target. If 3D cannot
  start, the page says camera travel is unavailable rather than reporting an arrival.


## W53. Stable mountain feet and organic moss

2026-10-13. **His:** lowering Roundness also distorts the bottom; remove Erosion and Moss height; moss should
have balanced ups and downs rather than a simple repeating pattern.

- **Mountain version 2** holds the lower third's broad rounded rectangular cross-section fixed. Roundness
  gradually shapes only the shoulders and summit. Width, Depth and Taper still size the foot; minimum Roundness
  cannot turn it into an oval. The top remains fitted to the inclined plate.
- Erosion and Moss height are removed from the mountain jig; the environment's old mountain Roughness control
  is retired too. The former fluted geometry no longer runs. Fixed mineral grain remains on the physical stone.
- Moss has a seamless seeded contour around the mountain: broad irregular rises and falls balanced about its
  midpoint, with a soft vertical edge. Its heights do not oscillate with the vertical coordinate. Mineral colour
  variation uses continuous spatial noise instead of the diagonal repeating sine bands. Shadow-map bias gives
  steep smooth cliffs enough clearance to avoid repeated self-shadow bands at the kilometre-wide light scale.
- Existing shape and colour tuning migrates to `no-origins:orbit:mountains:v2`; the removed settings are dropped.
  Version 1's jig and mountain geometry are frozen (`mountain-jig-v1.ts`, `build-mountains-mountain-v1.ts`).

## W54. Circular mountains and stronger taper

2026-10-13. **His:** Taper must reach 10; the rounding is insufficient and the mountains should be circular.

- **Mountain version 3** replaces the rectangular body with a circular cross-section at every ring, including
  the foot. Diameter replaces Width, Depth and Roundness. The square inclined mirror plate stays as in his reference.
- Taper runs from **0 to 10**: zero has straight sides; ten makes the foot eleven times the summit radius before
  placement fitting. The body and plate scale equally in X/Z to preserve circles and clearance within the world
  and between mountains. Tilt uses the summit radius, so a wide foot cannot pull the stone below the floor.
- Selecting a mountain frames its fitted foot as well as its height and inclined summit. The camera stays put
  while a control is tuned; selecting it again frames the changed shape.
- Existing paint, height, taper and summit settings survive. The larger former Width/Depth becomes Diameter.
  The existing `no-origins:orbit:mountains:v2` storage key remains compatible; retired rectangle/roundness settings
  are dropped. Version 2's jig and geometry are frozen beside version 1.

## W55. The supplied mountain side profile

2026-10-13. **His:** update the mountain from the supplied 2D side view (`mountain.png`).

- **Mountain version 4** follows the drawn four-edge silhouette: a level summit, straight tapered sides,
  a sloping foot and a summit offset towards the low side of the foot. The circular body from W54 remains.
  *Mine:* the sketch's proportions give summit diameter/height 110/173, foot width/summit width 141/110,
  a 38.5/173 sideways offset and an 80/141 base slope. These are the new starting shape.
- Lean (−45 to 45°) and Base tilt (0 to 55°) belong to Shape. Diameter reaches 150 m to allow the sketch's
  broader summit. Taper still reaches 10. Sides interpolate the foot/summit directly; there is no curved flare.
  The high edge of the foot is limited below the summit at extreme combinations. The sloped underside is closed.
- The square mirror plate now rests level on the offset summit. Summit's former Tilt control is replaced by
  Shape's Base tilt. Moss keeps W53's irregular edge. Placement fitting and camera framing include the lean.
- Saved older shapes adopt this new profile while retaining height, turn, paint and plate settings. Version 4
  uses `no-origins:orbit:mountains:v4` and reads the earlier v2 key once. Version 3's jig and geometry are frozen.

## W56. The complete mountain: curved body and separate head

2026-10-13. **His:** the grey shape is the mountain's head; the body is the border below it. The earlier image
was missing that border. The complete reference is `MacBook Pro 14_ - 1.png`. This corrects W55's interpretation.

- **Mountain version 5** has a broad circular body with curved shoulders narrowing to an inclined neck. Two
  cubic curves trace the drawn left/right body edges; circular rings join them in 3D. The bottom is level and
  the neck slopes down towards the head's low side. The body and head are separate volumes.
- The grey head's four-edge side profile is a solid circular frustum with a level top, inclined underside and
  sideways offset. It stands above the neck with the drawn small connector. The head sides are stone; Mirror
  paints only the upper square surface. Moss remains on the body with W53's irregular edge.
- Starting dimensions follow the complete drawing: body height 547.5, neck width 106, base width 738, neck lean
  60, head height 173 and vertical neck/head gap 21.5, scaled to each mountain's body height. Body Taper starts
  around 5.96 and still reaches 10. Diameter sizes the neck; Neck tilt replaces Base tilt. Head has Height and
  Gap controls, plus Surface, Overhang and Thickness. Extreme head heights grow enough to clear the inclined underside.
- Placement clearance and selection framing include the full curved body and head. Selecting a mountain views
  its side profile from the nearer inward-facing side, at a shallow elevation; dragging still looks around it.
- Saved v4 shapes adopt the complete profile, keeping height, turn, paint and surface/thickness settings.
  Storage is `no-origins:orbit:mountains:v5`, with v4 as its predecessor. The v4 jig/geometry are frozen.

## W57. Glass head and open world-floor cut

2026-10-13. **His:** the glass head replaces the glass slab. The mountain is chopped off by the world;
its bottom must remain open, without the closed underside visible in the screenshot.

- **Mountain version 6** applies the former reflective slab material to the whole head, including its sides
  and inclined underside. There is no separate plate. Head Surface calls this Glass (the saved `mirror` value
  remains compatible); Stone remains available. The reflection still approximates sky/clouds as in W50.
  The head extrudes the drawn quadrilateral into a solid with planar faces, keeping its reflections coherent.
- The body stops at y 0 with an open ring and no bottom triangles. Only its inclined neck is capped.
  Stone shows its outward faces, and the last 12 m blend into the floor fog so the cut does not reveal an underside.
- Head Height controls the volume; the obsolete slab Thickness control is removed. All other v5 tuning survives
  under the existing storage key. The v5 jig, profile and geometry are frozen.

## W58. Attached head and glass tuning

2026-10-13. **His:** the neck and head should be attached; give glass types and controls to tweak the head.

- **Mountain version 7** seats the inclined underside directly on the neck's plane with a 2 cm overlap to
  prevent a visible seam. Gap and the separate connector are removed. Head keeps Height and Overhang and gains
  Depth (0.5–2 times the neck diameter). The open world-floor cut and curved body remain as W57.
- **Glass** chooses Clear, Frosted, Tinted or Mirror, with Stone available. Choosing a type applies its starting
  finish; Tint, Clarity, Roughness, Refraction (IOR 1–2.5) and Optical depth remain independently tunable.
  Clear/frosted/tinted use physical transmission, roughness and refraction; tint also colours absorption through
  the volume. Optical depth tunes the light's path through glass, independently of the head's geometric Depth.
- Mirror remains opaque and uses W50's procedural sky reflection; its Tint and Roughness change its finish.
  Stone uses the body material. The clear glass is the new starting head. Changing a glass rebuilds only the
  selected mountain; owned glass materials are disposed with their geometry.
- Existing tuning survives in the v5 storage key. Old Gap/Thickness fields are dropped; saved mirror settings
  acquire the mirror finish defaults. Version 6's jig, profile and geometry are frozen.

## W59. Open floor transition and a separate algae layer

2026-10-13. **His:** the bottom is still not fixed; algae should be a layer, not a gradient on the mountain.

- **Mountain version 8** removes algae paint from the stone vertices. A separate raised mesh follows the body,
  with a seeded, balanced, irregular contour and a closed lip at its upper edge. It has its own colour and relief;
  there is no interpolation from stone to green across that edge.
- The stone and algae side walls continue below y 0, with no bottom disk or terminal ring at the visible floor.
  The lower 30 m reveal the actual scene behind them instead of painting a different fog colour over the rim.
  Version 9 refines this to a smooth transparent lower band, while retaining opaque upper surfaces for depth
  and glass refraction. The temporary coverage dithering is retired.
- The v7 jig, profile and geometry are frozen. Existing body/head/glass values remain in the v5 storage key.

## W60. Mountain body texture and colour controls

2026-10-13. **His:** add controls for the mountain body's textures and colours.

- **Mountain version 9** gives Body its own Texture (Granite, Basalt, Sandstone, Smooth), Colour, Roughness,
  Texture scale and Texture strength. Granite has fine mineral grain, basalt broader grain, sandstone horizontal
  layered grain, and Smooth removes the grain relief. Colour and roughness remain independent of texture choice.
- **Algae** has Colour, Thickness (0.1–2 m) and Texture scale. Its mesh samples the body more densely, keeping
  the coating raised above the stone at strong tapers. Placement/framing include the coating's thickness.
  Its edge remains sharp and irregular, as in W59.
- Each mountain owns its surface materials. Tuning changes only that mountain, and geometry/materials are disposed
  when it is rebuilt. An opaque upper body remains available to physical glass transmission; only the lower band
  blends into the fog. There is no cap below the world floor, and no dithering in that blend.
- Existing colours remain compatible (`stone` and `mossColour` in saved data); missing texture controls acquire
  the starting values. The v8 jig, profile, geometry and algae builder are frozen.

## W61. A mountain ring facing the world centre

2026-10-13. **His:** the mountains should form a circle, all rotated towards the cylindrical world's centre.

- **Environment version 33** places mountain centres at equal angular intervals on one ring centred at x/z 0.
  It starts at radius 350 m, moving outward only when requested spacing requires it. The layout seed turns the
  complete ring and determines individual heights/surface seeds. Count and Spacing remain the placement controls.
  If the requested ring cannot fit within the cylinder, reduce the count while keeping a complete, evenly spaced ring.
- Each mountain's local +Z (its head lean and the neck's low side) points at the world centre. Rotation is
  derived from position for both drawing and inspection, so old saved turns cannot send a mountain outwards.
  **Mountain version 10** removes the independent Turn control; Shape explains the centre-facing rotation.
- Edited bodies/heads/algae still fit within the cylinder and requested gaps without moving their centres.
  Existing shape, colour, texture and glass settings remain compatible. Environment v33 reads v32's saved settings.
- The earlier random placement is frozen in `mountains-v32.ts`; historical environment/base builders use it.
  Environment v32 and Mountain v9's jig/profile/geometry/algae builder are frozen beside the active versions.


## W62. A thin illuminated neck and pastel algae

2026-10-13. **His:** a thin connector between the mountain body and glass head, with a bulb/light at the tip
that enters the head and controls for it. Algae should feel like textured pastel, especially at its edge,
and vary between mountains.

- **Mountain version 11** raises the head by Neck's Length (0.5–20 m), connecting it through a thin stem.
  Diameter (0.2–5 m) sizes the stem. Both ends enter their adjoining volume, including on an inclined neck;
  the upper tip holds a bulb inside the glass. Head framing and placement include the connector and bulb.
  Extreme settings increase the head's minimum height enough to contain the bulb.
- **Neck light** has On/Off, Colour, Strength (0–1000) and Bulb size (0.25–5 m); W90 made Brightness and Reach one
  Strength, its reach following from it. Strength controls both the visible emissive bulb and an inverse-square local point light; Off leaves the
  unlit bulb and stem attached. Light works with the existing glass finishes; opaque Mirror/Stone can conceal
  the internal bulb. Lights cast no additional shadow maps and add no screen glow pass.
- **Algae** remains a raised coating. Each seeded pattern varies its coverage height, contour scale and
  asymmetry, with smaller broken marks along the edge. Pastel mixes chalk into the chosen pigment, more strongly
  at the edge; fine colour and relief grain anchor to the surface. Edge softness widens a fringe of irregular
  pigment flecks that reveal the stone between them, rather than blending green into the stone.
  Variation and Pattern seed tune the individual mountain; colour, thickness and texture scale remain.
- Existing body/head/glass tuning and colours remain under the v5 storage key. Older saved mountains acquire
  distinct brush seeds by layout/index and starting neck/light settings. The circular inward-facing layout and
  open floor transition remain. Version 10's jig, profile, shape, algae, fitting and mountain base are frozen.


## W63. Matching head Height and Depth ranges

2026-10-13. **His:** the head's Height and Depth ranges should be the same.

- **Mountain version 12** measures both head controls in metres: 2–100 m, step 0.5 m, marks every 20 m.
  Depth now directly sizes the head's full thickness; it no longer multiplies the neck diameter.
  Height retains the inclined-underside and bulb containment minimum from W62.
- The saved Depth ratio converts to metres using the saved neck Diameter, preserving the existing head size.
  `headDepthMetres` identifies the new value, so later loads cannot multiply it again. The starting proportions
  and the other shape, light, glass and algae settings remain. Version 11's builders and jig are frozen.
- 2026-10-14, **his:** "The height, depth and overhang of the head should have steps multiple of 5 but I see steps of
  10 and base is 2." The scale reads in fives: Height and Depth run from 5 to 100 m with a mark every 5 m, Overhang
  keeps 0–0.3 with a mark every 0.05; a held head snaps to the marks, and the value typed beside the label still moves
  by the fine step (0.5 m, 0.01) between them. A saved head under 5 m loads at 5 m. No new version: the jig's scale
  changed, not what it draws.


## W64. Visible glass finishes and internal head light

2026-10-13. **His:** changing glass types, colours and neck light settings does not visibly change the head.

- **Mountain version 13** keeps the live settings/rebuild path, but adds the missing physical glass reflection
  environment. An analytic sky/cloud radiance field supplies the physical lighting model's reflected direction
  and roughness-dependent spread, sharing the world's sky, cloud and sunlight colours. This is a bounded
  approximation, not a capture of nearby objects or the exact moving cloud field.
- The neck point light remains for nearby surfaces. Because a light inside the glass cannot illuminate its
  outward-facing normals, glass gains an approximation of internal scattering: coloured local emission falls
  off from the bulb over its reach (W90), driven by On/Off, Strength and Clarity. Frosted scatters most strongly,
  Tinted less and Clear least. Physical transmission/refraction and tint absorption remain.
  This does not add a screen glow pass or a volume simulation.
- The bulb's emission is bounded so high brightness retains the chosen hue instead of clipping to white.
  Mirror remains opaque; Stone uses Body's colour and texture. Only controls a finish uses are shown:
  Mirror offers Tint/Roughness, Stone only its type, and transmitting glasses offer all glass controls.
- The persistent canvas replaces its engine when the mountain renderer version changes during development
  refresh, preventing a fresh jig from continuing to drive old rendering code. Normal control edits reuse
  the existing engine. Saved settings remain compatible; version 12's jig and builders are frozen.
- 2026-10-14, **his:** "I selected Frosted and violet color. But the head is still orange", every head the same flat
  apricot. The glass head, the stem and the bulb were the one part of the world still taking the scene fog (the
  Environment's Fog, apricot by default), which at its distance painted over the type, the tint and the transmission;
  the body, the trees and everything else take the base gas (W37). They now take the base gas as the body does, and
  the scene fog paints only the blocks and the portal.

## W65. The human's look is his sketch

2026-10-13. **His:** "I want the character in the world to be like the inspirations I provided. The sketch is what I had
in mind. And the image is a generation which is not exactly what I expected." Two pictures: a pen sketch of a figure,
and a generated picture of a soft white one. This gives the look W51 left his to give.

- **The look is the sketch** (his; the Suit's since W102, which adds the Clay, his picture): a figure of flat pieces, each a plain shape with rounded corners, and nothing else:
  a head that is a regular polygon with a flat side up, on a short neck; one body from the shoulders down to where the
  legs part; an arm a single piece each, hanging straight and flush against the body, with no elbow and no hand; a leg
  a single piece each, flat on the ground, with no foot; no face. *Measured against its height (mine, from the
  drawing):* the head a quarter of it and a little wider than tall, a regular octagon; the body a third of it wide, an
  arm a seventh, the three together over half; the arms reach down to where the legs part, which is just over a
  quarter of the height off the ground, at the rig's knee; the legs are parted by a line.
- **What the generation got wrong** (his: "not exactly what I expected"; *mine, read from the two*): it inflated every
  piece into a cushion. Its arms bulge out from the shoulders instead of hanging flat, its body swells, its legs are
  stubs, its head a rounder ball of many sides, and its corners are large and soft where the sketch's are small and
  crisp. The sketch is a cut-out; the generation is a pillow. The look refuses the pillow.
- *Mine:* **Human, version 2, is the sketch cut out and given a thickness.** Every piece is a slab of one thickness,
  the Depth, with every edge and corner rounded by one radius, the Edge, so that two pieces that touch meet in a
  groove, the sketch's line; all one flat colour, lit and casting its shadow (W49). It hangs on the same bones (W51):
  the head on the head bone, its top the crown, so the figure keeps its eight feet whatever its head's size; the body
  on the chest, the spine and the hips, as the rig's own clothes were; each arm whole on its upper arm, swinging from
  the rig's shoulder, hanging from under the body's round shoulder, which lands on the arm's top; each leg running up
  inside the body to the rig's hips, nested a centimetre in, so it hinges where the rig's leg does, the body keeps
  covering it as it swings, and the walk's knee bends it where the sketch parts the legs. Its walk and run are
  unchanged (the rig's tokens, Motion.md).
- **Its jig** (`/build/human`, the visitor's camera): **Figure**: Colour (the world's swatches), Shows (Look ·
  Skeleton: version 1's rods and balls, to see what the look hangs on), Depth (10 to 60 cm), Edge (1 to 20 cm);
  **Head**: Sides (5 to 8), Width and Height (40 to 100 cm), Depth (10 to 60 cm), Neck (10 to 40 cm wide); **Body**:
  Width (50 to 120 cm), Shoulder (0 to 40 cm, the round of the body's shoulders and the arms' outer tops), Split (30 to
  120 cm off the ground, where the legs part), Gap (0 to 20 cm between the legs); **Arms**: Width (15 to 50 cm),
  Length (50 to 140 cm); **Gait** as version 1. It starts at the sketch's measure: Cream (both pictures are cream),
  30 cm thick, an 8 cm edge; 8 sides, 65 × 61 × 40 cm, a 24 cm neck; 76 cm wide, a 12 cm shoulder, parting at 68 cm
  with a 6 cm gap; arms 32 × 104 cm. Every one is his to tune; the height is not a control.
- Open: the shoulder (the sketch's is one slope from the neck to the arm's outer edge, which flat pieces cannot make
  unless the arm and its shoulder are one piece over the body; a version, if he asks); the elbow (the sketch has none,
  so the run's elbow bend is not drawn); hands, feet and a face (none); and the colour (Cream is the pictures', but in
  the mist the figure is pale). Version 1, the skeleton alone, is frozen (`human-v1.ts`, `build-human-v1.ts`).


## W66. Refining the human from both inspirations

2026-10-13. **His:** "Now we have human character. It doesn't look great. I've provided my inspirations. Use them to
refine the character. It should look great." The two supplied pictures are the soft cream rendered figure and the
pen sketch from W65. This asks for the current look to be refined from both.

- **The previous cut-out treatment was an implementation interpretation** (W65), including its refusal of the
  rendered figure's softness; it is not a restriction in this request. *Mine:* version 3 keeps the sketch's compact
  silhouette, polygon head, short neck and blunt limbs, and takes fuller volume, rounded ends, a matte finish and
  softly sloping continuous shoulders from the rendered reference. No face, hands or separate feet are added.
- *Mine:* **Human version 3 joins the body, neck, arms and legs into one smooth surface.** `lookOf` supplies overlapping
  rounded volumes; `build-human.ts` samples their signed distance on a bounded grid and meshes their smooth union.
  The rounded polygon head remains separate and keeps its crown at W51's eight-foot height. Fine anchored relief
  gives the cream surface texture without changing its silhouette. The figure uses the world's physical light.
- The existing skeleton carries dense surface vertices, with blended weights through the shoulders and hips so
  the joined surface can move. Walk, run, turn, stride and settle remain W51's, using the same human motion tokens.
  The look's shoulder pivots fit its proportions; the lower arms and legs keep independent influences across their
  open clefts, blending only at their joined roots. Shows: Skeleton retains version 1's rods, balls and joint positions.
- **The jig keeps its groups and ranges from W65:** Figure, Head, Body, Arms and Gait. Its notes explain the shape
  and what each control changes in plain language. *Starting refinement (mine, his to tune):* Pale cream `#fff6e8`, Look,
  body Depth 44 cm, Edge 12 cm; 8 sides, Head 70 × 64 × 46 cm, Neck 24 cm; Body Width 82 cm, Shoulder 18 cm,
  Split 74 cm, Gap 5 cm; Arms 34 × 98 cm. Gait remains 3 m/s, Turn 0.25 s, Settle 200 ms. These dimensions and the
  meshing method are implementation choices, not measurements or technical requirements supplied by him.
  Larger Head Height values lower the shoulder line to preserve the full control range and the eight-foot crown;
  odd-sided heads fit their actual vertical bounds so they reach the crown too.
- **Version 2 is frozen** (`human-v2.ts`, `build-human-v2.ts`) beside version 1. Human v3 starts at the refinement's
  values under `no-origins:orbit:human:v3`; it leaves the earlier browser tuning in its old key. The persistent
  world's renderer version now includes the human version as well as the mountain version, so a development
  refresh cannot keep the old figure builder while showing the new jig.

## W67. Trees: the awakening light

2026-10-13. **His:** "We need this sort of trees (these are 1 type of many trees we will create later) in the orbit",
with a sheet, *Awakening light: tree anatomy and form properties*. The sheet is the tree's definition; what it says is
his, how it is drawn is mine.

- **The tree is two parts aligned on one axis** (his sheet): a **white trunk**, a circle in section, one constant radius
  from base to tip, a smooth white surface, bent once along **one continuous curve**, no reverse bend and no kink; and
  at its tip a **light cylinder**, blue emission, wider than the trunk, following the trunk's tangent (**tip
  alignment**). The sheet drew it with no top and no bottom cover; **it is closed** (his, 2026-10-14, on version 2:
  "the top and bottom of the light is open. It should be closed"): the tube has its top and its bottom, and the trunk
  enters it through the bottom. Its measures are the trunk's length, the trunk's radius, the bend radius and the
  light's radius. **What varies** from tree to tree is the trunk's length, its bend radius and the way it leans; the
  trees stand in a **natural, park-like spacing**.
- **This is the first type of tree; others come later** (his). *Mine:* the Trees are an element, a builder with a page
  of its own, `/build/trees`, under Elements after Human; a later type joins it as another kind on the same page,
  rather than a page a type.
- *Mine:* **the trunk is an arc**: it stands up from the floor and turns on a circle of its bend radius for its length,
  so the tip has turned length over bend radius from upright; a bend too tight for its length is widened so the tip
  turns at most 120°, one curve that never curls back. It is a tube of one radius along that arc, capped at its tip,
  open at its base, which stands in the base gas at y 0 (W37), and it is a flat colour lit by the sun and the sky,
  casting its shadow (W49).
- *Mine:* **the light is a closed tube on the tip's tangent**, the trunk entering it through the bottom by a quarter of
  its length, as the sheet draws it; it emits its colour, lit by nothing, and carries a point light that falls on what
  stands within its reach (by its Strength since W90), with no glow pass. The sheet's blue is offered as a swatch, Awakening blue, beside the world's colours.
- *Mine:* **the grove is scattered from a seed**: candidates drawn at random within the Spread of the world's middle,
  each kept only where it stands at least the Spacing from every tree kept before it and the Clearing from the middle,
  where the visitor starts and the portal stands, until the Count stands or the candidates run out. The same seed
  places the same trees; Randomize draws another. Each tree draws its length and bend radius from the card's ranges and
  its lean from the seed. The trees stand everywhere at his settings, and on their page as someone plays with them
  (W14); both the trunk and the light take the base gas as the mountains do, so a far tree fades into it. They do not
  stand on cells (W4): a park's spacing is not a lattice's. Open: whether they should.
- **Trees, version 1**: **Trunk**: Colour, Radius (5–40 cm), Length (1–15 m, a range of two heads), Bend radius (2–40 m,
  a range); **Light**: Colour, Radius (5–80 cm), Length (0.2–3 m), Brightness (0–500), Reach (0–40 m, 0 for no light);
  **Grove**: Count (0–40), Spacing (2–30 m), Spread (10–300 m), Clearing (0–20 m), Seed, Randomize. Starts (*mine*, the
  sheet's proportions against the human's 8 feet): Cream, 15 cm, 4–8 m, 6–14 m; Awakening blue, 26 cm, 1.2 m, 120,
  12 m; 16 trees, 5 m apart, within 40 m, a 6 m clearing, seed 7. Copy sends every tree's place, length, bend and lean.
  The page looks over the clearing into the grove from a little above a visitor's eye; a drag goes round, a right-drag
  moves, the wheel comes nearer, the keys and the map travel. Inspect lists the Trees under World › Environment and
  frames the nearest tree. Its settings are kept under `no-origins:orbit:trees`.
- Open: where the trees belong once the hierarchy takes assets (a zone's asset placed by a click, W4, W25, as the
  blocks are, or the environment's scenery as now, placed by the seed); the ground the light falls on, since there is
  no floor to catch it, only the gas and what is built; the cost of a light a tree past a few dozen trees.

## W68. Trees: a hundred metres and more, straight to the bend

2026-10-13. **His**, on version 1: "For trunk length, I want range from 100 to 150 m. The bend should start only above
100m. Adjust remaining accordingly."

- **The trunk is 100 to 150 m long** (his): Length starts at that range (its control 50–300 m).
- **The bend starts only above 100 m** (his), then **above 50 m** (his, the same day: "let's start bend above 50m
  instead of 100"): the trunk stands straight up from its foot to where the bend starts, a control, Bend starts (0–200
  m, starting at 50 m), and bends once from there along one continuous curve to its tip. *Mine:* a tree no longer than
  Bend starts stands straight; the bend radius is drawn for what is left, and widened where it would turn the tip past
  120° (W67). At 50 m the bent part is 50 to 100 m long, so on the starting bend radii the tip turns 24° up to the
  120° limit; the radii are left as they were, his to tune.
- **The rest is scaled to that length** (*mine*, "adjust remaining accordingly"): the sheet's proportions at a trunk of
  100 to 150 m. Trunk Radius 4 m (1–20 m); Bend radius 40–120 m (10–400 m); Light Radius 6.5 m (1–30 m) and Length 25 m (2–60 m), Brightness 8000 (0–20000: a point light at a hundred
  metres needs the inverse square of version 1's), Reach 250 m (0–500 m); Grove Spacing 60 m (10–300 m) between
  feet, Spread 250 m (50–400 m, short of the mountain ring at 350 m, W61), Clearing 40 m (0–200 m), Count 16 and seed
  7 as before. Every measure is now in metres.
- *Mine:* **the trees' feet stand in the base gas and their lights rise clear of it** (W37, W40): at this height the
  grove reads as the mountains do, emerging through the gas, the blue lights above it. A visitor on the floor looks up
  a white column and does not see its light; the page stands off the nearest tree by its own height, above the gas,
  looking at its upper half, so the bend and the light are whole in view. Trunks may lean across one another: Spacing
  measures the feet, and a lean is the seed's.
- Version 1, a few metres tall and measured in centimetres, is frozen (`tree-v1.ts`, `build-tree-v1.ts`); version 2's
  settings are kept under `no-origins:orbit:trees:v2`, and version 1's key is read by nothing.


## W69. The human, jointed and puffed, with his visor

2026-10-13. **His**, on version 4: "My first preference is to match the character body to the sketch I did. And then
the character should look like the rendered inspiration." Then, on what he saw: "The arms and legs should have
joints. Right now, they look like they don't have. Puff up the character. Make the head rounded. Arms and legs
rounded. Controls to puff up at joints like the ends of arms and legs, but smoothly." And a picture: "I want the head
of the character to be like the image I provided": a white matte sphere with a round convex glass lens set into its
front in a thin metal rim. Then, on the first version 5: "when the character is walking, the arm and knee are
sticking to each other … at the joints we were able to see that as bulges, and there is no way for me to have the
same width, or smoothen, or have the same width or different width between the area of any two joints." And: "After
walking and coming to rest, the character comes to rest very slowly for the last step. No change in Gait was able to
fix it." Then: "for the ends of arms and legs, I want the end to be a flat cut with some small hole with a rim. It is
for boosters to hover and glide. Also, currently in Human, place the character on a 4x4 block, so that I can rotate
and see the character. I also need postures of the character to select from", and "give me a toggle if I want the
character to walk". On the boosters: "The rims have to be matte black. Instead of depth, replace with some extrude
option so that I can set how much should it extrude out. And also, these rims are smooth and are curved. I need
controls for that curve too. I want to try zero curve." And: "we need hover and fly option in the character motion."
Then: "The viewer camera should be through the helmet. The Rim on the helmet should be light source like a torch
light with on/off, colors and intensity control. Also, I think we need the following options: 1. Head 2. Skeleton 3.
Boost (boost will only come from legs)." Then, on the head: "I meant possible head rotation, tilt and direction
options for expression."

- **The silhouette is the sketch, measured** (his first preference; *mine*, the numbers): against the figure's height,
  the head 0.265 wide and 0.26 tall, the neck 0.10 wide, one shoulder slope from the neck's base to the arm's top at
  0.65, the arms 0.125 wide reaching 0.29, the body 0.31 between them, the legs parting at 0.27, 0.345 wide together
  with a line between, the whole 0.52 wide at the shoulders and 0.60 at the arms' ends. Version 5 starts there; its
  front silhouette reads every landmark within 0.03 of the sketch's.
- **Every part is a round volume** (his: "Puff up … Arms and legs rounded"; the render's softness, W66): the body a
  thick slab, two thirds as deep as it is wide, its edges rounded by half its depth so no flat is left, its faces
  domed; the neck a column; each shoulder one slope, a bar hidden in the body's roof, the arm's dome standing a little
  proud of it; an arm two round bars, upper arm and forearm; a leg a thigh hidden in the body, a shin and a foot the
  ground cuts flat, its rim rounded by the Sole.
- **The limbs have joints** (his): an arm bends at its elbow, at its middle, and a leg at its knee, the rig's, just
  under the body; the rig's walk and run bend them. *Mine:* the look's elbow and hand bones stand where the look's
  are, as the shoulder's has since version 3, so the bend is in the swell.
- **Every bar and every joint has its own width** (his: "Controls to puff up at joints like the ends of arms and
  legs, but smoothly", then "the same width or different width between the area of any two joints"): a ball at the
  shoulder, the elbow, the hand's end, the knee and the foot, and the bars between them (upper arm, forearm, thigh,
  shin), each a width in centimetres; alike, one smooth tube; a joint wider than its bars, a swell, its root rounded
  over the limb's Blend, so a swell is a swell and never a step. The arms hang flush, the Groove of air away (the
  sketch's line, and air, so a swing never stretches a web). **An arm and a knee never touch** (his: "sticking to each
  other"): from its dome down, an arm tilts out just as far as a wider joint, a wider forearm or the legs' widest part
  needs, never back in, so its inner side keeps the Groove above the legs and a centimetre of air from them below
  their top, whatever either swings; the legs stand their widest part from the middle line.
- **The head is his picture**: a ball, its top the crown, on the head bone, with a round visor on its front: a glass
  lens doming out of a metal rim set into the ball, a dark dish behind it. *Mine:* the rim's metal and the lens's glass
  reflect a plain sky, grey below and bright above, since the world's reflections are painted, not rendered (W50); the
  lens is the world's glass, transmitting and refracting (W58). It faces the way the figure goes, so the camera behind
  it sees the ball; Inspect, or walking it towards the camera, shows the visor. Open: what the visor shows (a face, a
  light, nothing); the rim's and the lens's colours as controls; the "rounded head" he asked for before the picture is
  the ball.
- **Human, version 5's jig** (`/build/human`): **Figure**: Colour, Shows; **Head**: Size, Visor, Bulge, Rim, Inset,
  Neck, Neck height; **Body**: Width, Depth, Edge, Dome, Slope (how far the arm's top falls below the neck's base);
  **Arms**: Width, Length, Groove, and the puffs Shoulder, Elbow, Hand; **Legs**: Width, Split, Gap, the puffs Knee and
  Foot, and Sole; **Gait** as before; the ranges and starting values in the table (W15). Its settings are kept under
  `no-origins:orbit:human:v5`, starting fresh.
- *Mine:* **how it is made**: each part has an exact distance (a rounded slab, a bar between two balls, a ball), and
  the figure is nine pieces that overlap rather than join: the trunk (the body, the neck, the shoulders' slopes and
  the arms' domes, which never move from the chest), and on each side an upper arm (dome, bar, elbow) on the arm bone,
  a forearm (elbow, bar, hand) on the elbow's, a thigh (bar, knee) on the hip's and a shin (knee, bar, foot) on the
  knee's, the ground cutting the shin flat. A joint's ball is in both its pieces, the lower copy a millimetre
  smaller, and turns about its own centre, which keeps its shape, so no bend opens a seam at any angle (one joined
  skin tore at the run's elbows and hips). Each piece's parts are joined by a smooth union over its Blend (the trunk's
  a crease, widening round each dome), its field sampled on a grid stepped finer through the figure than across it,
  within a budget of samples, only the parts within reach of a column shaping it; marching cubes mesh it with a vertex
  a grid edge, and every vertex is put back on the exact surface with its gradient as its normal. The trunk alone is
  skinned, to the chest, the spine and the hips by height. Version 4 is frozen (`human-v4.ts`, `build-human-v4.ts`);
  the renderer version follows `HUMAN_VERSION`.
- **It does not crawl to a stop** (his: "comes to rest very slowly for the last step"). The camera coasts to a stop on
  its Glide, its speed falling away by e every Glide and never quite to nothing, and the stride was driven by the
  ground going by, so the last step took as long as the coasting. *Mine:* a step never takes longer than the gait's
  own cycle (the rig's walk and run cycles, Motion.md), so a figure slowing down shortens its steps instead; and under
  **Stands under** (Gait, 0.05–2 m/s, starts at 0.4) it stands, blending out over the Settle, while the camera coasts
  the last few centimetres. Neither Settle nor Walk up to touched this, which is why no Gait setting could fix it.
- **The ends are boosters** (his): every hand and foot is cut flat across its end, with a round hole in the middle of
  the cut and a **matte black rim** round it standing out of the cut, what it hovers and glides on. **Boosters**: Hole
  (2–20 cm), Extrude (0–10 cm, how far the rim stands out), Rim (0–4 cm, its width), Curve (0–4 cm, the round of its
  corners: none, a square edge), Edge (1–16 cm, the cut's own round); starts 8, 2, 1.5, 0, 8. *Mine:* the cut takes
  off a third of the ball's radius; the hole is a shaft into the limb twice its radius deep, its inside near the
  rim's black; the rim is a ring turned from a rectangle seated two centimetres into the limb, its corners rounded by
  the Curve; the feet stand on their rims, so the foot's cut is the Extrude above the ground.
- **On its page the figure stands on a 4 × 4 m block and is looked round** (his: "so that I can rotate and see the
  character"): the block round the visitor's cell, a default block high, in Sand, the page's own, as the portal's is;
  the camera before the figure, a little above its eye, looking at its hips, its visor towards the camera; a drag
  goes round it, the wheel comes nearer. It no longer walks on its own page; it walks in the world (`/`, the camera's
  page) as before.
- **Postures and a toggle to walk** (his): **Posture** (Stand · Walk · Run · Hover · Wave) is what it holds on its
  block: a step of its walk or its run a quarter through the cycle, hovering with its arms a little out and back and
  its knees a touch bent, as a thing balanced on its boosters, or waving its right arm. **Motion** (Still · Walking ·
  Running · Hovering · Flying) plays a motion in place on the block instead, to go round it as it moves: its walk or
  its run at the gait's own pace; **hovering**, floating over the block in its hover posture, bobbing slowly, its arms
  swaying a little; **flying**, floating higher, leaning into the way it faces with its arms swept back and its legs
  trailing, banking gently either way. Both are the Figure's; the postures are the rig's joints in degrees, data in
  `human.ts`, his to add to. *Mine:* the hover's and the flight's numbers are `--motion-human-hover-*` and
  `--motion-human-fly-*` tokens read off the canvas with starting values (Motion.md M3; on the bench, not in
  globals.css): a 2.6 s cycle 0.4 m up bobbing 6 cm; a 3.2 s cycle 0.9 m up bobbing 8 cm, a 60° lean, a 5° bank.
- **The head has expressions** (his: "possible head rotation, tilt and direction options for expression"): **Head ›
  Expression**: Ahead · Up · Down · Left · Right · Tilt left · Tilt right · Curious (up a little, turned left, tilted
  right) · Shy (down, turned right, tilted left), each the head bone's turn in degrees within the rig's limits, held
  on its page, in every motion and in the world, over whatever the gait does with the head. *Mine:* the numbers
  (25° up and down, 45° either way, 20° of tilt) are data in `human.ts`, his to add to.
- **The head looks at the cursor** (his: "a switch to enable the head locked to looking at the cursor"): **Head ›
  Looks at cursor** (On · Off, off to start), a switch. On, the head turns to the pointer wherever it is over the
  world, as far as the rig's neck allows (45° down or up, 80° either way, no tilt), on its page, in every motion and
  in the world, instead of its Expression; off the world (the card, the sidebar) it is held in its Expression again.
  Seen from outside, it looks at the point under the pointer half way between it and the camera, so it turns by
  the pointer's own angle from the view's middle; in the helmet, where the eye is
  at the head's centre, it looks along the pointer's line as the eye held ahead casts it, so the pointer at the
  middle of the view holds it ahead and at an edge turns it half the view across, the view turning with it. *Mine:*
  a pointer behind the head turns it as far as it can to that side (`gazeAt`, `human.ts`).
- **The visitor looks out through the helmet** (his: "The viewer camera should be through the helmet"): on the eye's
  views (`/`, the camera's page) the camera is at the ball's centre behind the visor, looking where the head is held
  (the way the figure faces, turned and tilted by its Expression and its gait) and down the camera's Angle, out
  through the visor, the lit rim framing the view's edge; a tilted head tilts the view. **The view is clear** (his,
  2026-10-14: "Since we will have 1 view camera inside the head of the character, the view should be clear. Currently
  through visor I was unable to see clearly"): the dish and the lens have an outside face alone, so from the ball's
  centre nothing is drawn between the eye and the world, and the rim alone frames the view. *Mine:* the camera's
  Height no longer moves the eye (the helmet's height is the figure's); its Turn turns the standing figure to face
  that way; the keys are still the camera's Turn's (W north of it), the figure turning to face its way and the eye
  with it. Why the glass is not made clear from inside instead: the world's glass is drawn by sampling the picture
  behind it (W58), which lifts it toward the sky it reflects, tints it, blurs it (the sample is bicubic, soft even at
  full size) and refracts it, and no setting of the glass makes that sample the picture itself; from outside it is
  drawn as before. Without a head (Shows: Skeleton) the camera stands back as version 9 did. Open: turning by the
  keys in the helmet (A and D as a turn), and seeing the figure's own body from inside.
- **The visor's rim is a torch** (his): **Torch** (On · Off), Colour (the world's swatches), Strength (0–2000; W90) and
  Spread (10–90°). Lit, the rim glows the torch's colour (full at 300) and a spot of it is thrown ahead from just
  outside the lens, reaching 60 m. Starts On, Pale cream, 100, 40°.
- **Shows: Look · Head · Skeleton · Boost** (his: "options: Head, Skeleton, Boost"): the look; the head alone (the
  helmet, its visor and torch, to see close); the skeleton; the look with its boosters firing. **The boost comes from
  the legs alone** (his): a jet of one flat colour narrowing away from each foot's nozzle, with a light under it;
  **Boost**: Colour, Length (0.2–3 m), Strength (0–30; W90); starts Sky blue, 1.2 m, 2. The feet boost whenever it hovers
  or flies too. Open: what a jet looks like beyond a flat cone (the world paints, it does not glow); a standing
  figure's jets go into the ground.
- Open: hands (none; the boosters are the ends); the legs' knees stand just under the body, since the rig's knee is
  at the sketch's split, so a thigh shows only when the Split is raised; where a piece enters another (a knee's ball
  the body's bottom, a forearm its elbow's ball) is a crease, not a fillet; the hover and the flight are motions in
  place, for the page: travelling the world by them is to design.


## W70. Algae reach

2026-10-14. **His:** "I want to have algae reach control: in the mountains we have algae, and this reach should define
how close to the neck the algae will grow."

- **Algae › Reach** (0–1, a mark every 0.25): how far up the body the algae climbs, a share of the body from the floor
  (0) to the neck (1), where the stem leaves it. The seeded brush line (W62) is scaled so its crest stands exactly at
  Reach: at 1 the highest tongue touches the neck's rim, at 0 the body is bare stone. Variation and Pattern seed shape
  the contour under the crest and no longer move the crest itself.
- **Each mountain starts at its own Reach**: the crest version 13's seeded coverage drew for its pattern (between about
  0.4 and 0.73), so nothing he has seen changes until Reach is moved; a mountain saved before Reach loads at the crest
  its saved seed and Variation drew. No new version, as W63's scale change: the control starts where version 13 drew.
  The line, its crest and the contour live in `mountain-profile.ts` beside the body's rings, with no three.js, so the
  jig reads a mountain's starting crest without loading the world.


## W71. His settings are the world's, and the grove gathers at the mountains

2026-10-14. **His:** "Now that we have different elements, I have decided on the values. So currently whatever I have
configured in inspect for the mountains, then human and trees, I want you to make all of them default and these
defaults should reflect in the environment, and in environment place the trees in such a way that they are lot of
trees and they should tend to grow around mountains more and use Awakening blue, Powder blush, Lavender and cream
colors for light." Then: "add copy option in each element."

- **His settings are what the world draws** (W14, now for every element he has tuned): the human's start
  (`HUMAN_START`), the trees' (`TREES_START`), and each mountain's as he tuned it on Inspect (`MOUNTAIN_EDITS_START`
  in `mountain-jig.ts`, keyed as the store keys them, by the layout seed and the mountain's index). The world draws
  them on every view; on Inspect and Environment the browser's edits stand over them; and a mountain's Reset on
  Inspect goes back to his, not to the shape its layout derives (`mountainStartOf`). His values are kept only in his
  browser, which Claude cannot read; **Copy settings is on every element's card** (the actions menu at the card's top
  right, on Inspect as on each page), and he sent each one's by it: the mountains', the clouds', the environment's
  and the trees' Copy already ended with a `Settings JSON` line, and now the human's, the portal's, the camera's and
  the map's do too, so what he sends back is exactly what the world starts from. **His values, 2026-10-14:**
  Mountain 1 to 6 (verbatim in `MOUNTAIN_EDITS_START`), the human (verbatim in `HUMAN_START`, the Suit's; W102 adds the Clay's sizes to it) and the trees. The
  mountains are keyed by **his layout, seed 2000** (*mine:* found by searching every seed for the heights his pastes
  left untouched, since he sent no Environment; `ENVIRONMENT_START`'s Layout seed is 2000 now, 17 before, its Count 8
  and Spacing 150 unchanged), so the seventh and eighth mountains derive from that layout until he sends them. His
  Mountain 1 paste read Neck Diameter 4.2 m and Texture scale 4.1 in its lines but 4.0 and 4.0 in its JSON; the JSON
  stands. His World on Inspect copies only the world's size (its own jig).
- **The grove is many, and gathers at the mountains' feet** (his). *Mine:* the Grove draws each tree, by its
  **Gathering** (0–1, the share; starts at 0.8), at a mountain's foot, the mountain picked at random, standing from
  the clear air beside its body out to the **Skirt** (0–400 m; starts at 150 m) and thickest beside it, the distance
  out drawn squared so the grove thins as it goes; the rest stand within the Spread of the middle as before. A tree
  never stands in a mountain's body (two metres and its own radius clear of the fitted foot, `mountainFeet` in
  `mountain-fit.ts`), within the Clearing, or past the world's side. Count runs to 200 (was 40) and starts at 120 (was
  16); Spacing starts at 40 m (was 60). The feet are the mountains as the world draws them, his or the page's edits
  fitted within the ring, so a mountain moved or widened on Inspect moves its trees; with no mountains, every tree
  stands in the open. The trees' page stands off the nearest tree as before. **His trunk and light** (his Copy): a
  Pale sage trunk 1 m in radius, 50 to 100 m long, bent from its foot (Bend starts 0) on a radius of 160 to 360 m, so
  a tip turns 8° to 36°; the light 6 m in radius and 2 m long, brightness 5000, reach 100 m; Spread 250 m, Clearing
  40 m, seed 7. *Mine:* his Copy's Count 10 and Spacing 60 were his tuning from before "lot of trees", so Count 120
  and Spacing 40 stand, with Gathering 0.8 and Skirt 150 m, his to tune.
- **The lights are four colours** (his): Awakening blue, Powder blush, Lavender and Cream, the Light group's First to
  Fourth colour, each tree's drawn by the seed, its tube and its point light that colour; Copy names each tree's.
  *Mine:* his trees' Copy read First colour Cream and Fourth colour Cream with no Awakening blue, the Cream his single
  colour from before and the rest the starts, not a choice; the four he named stand.
- *Mine:* **the point lights are a pool.** A point light a tree cost a frame about 95 ms here at forty trees as at two
  hundred, and 21 ms with none; the grove keeps twelve (`LIT_TREES`, `build-tree.ts`) and carries them, each frame,
  to the trees nearest the camera, in their colours: every tree lights what stands near it while the visitor is near
  it, and a far tree's light is its tube alone. At 120 trees a frame is about 23 ms here, as with no point lights.
- Open: on Inspect a mountain is now seen through its trees, which stand between the camera and it; whether Inspect
  should frame a mountain from above its grove, or stand the trees aside while one is inspected, is his.

## W72. An element alone on its page, and its variants

2026-10-14. **His:** "When it comes to inspect portal sector human trees, we have in inspect the whole world and then
we are selecting one of them. Regarding elements, I want to create variations of it, but I don't want to see them all
together, because while configuring with all the elements within the inspect, or all the elements in trees, or any
other, are slowing down, consuming a lot of resource, so the configuring process is very slow. Just like human, where
there is only one base and a human standing there, similarly that should be the case with everything. In inspect we
should have one mountain, and everything I can have as a variant: I can configure, save as a variant, configure, save
as a variant. Similarly for every other element."

- **Decided (his): an element is tuned alone.** An element's page shows one of it, as the Human's page does: one
  base, one element, nothing else of the world's elements drawn. Inspect shows one mountain, not the ring. This holds
  for every element: the mountain, the tree, the portal, the sector's block, the human.
- **Decided (his): an element has variants.** He configures one, saves it as a variant, configures another, saves
  that; every element keeps its variants.
- *Mine, measured, why it is slow:* a frame on Inspect, in headless Chromium at 1440 × 900, a drag keeping the engine
  drawing:

  | Drawn | A frame |
  |---|---|
  | The base alone: sky, gas, ceiling clouds, no mountains, no trees | 16.6 ms |
  | The base and the eight mountains | 24.2 ms |
  | The base and the 120 trees | 18.7 ms |
  | The base, the eight mountains and the 120 trees (Inspect today) | 34.4 ms, at three quarters of the pixels |
  | The human's page | 16.9 ms |

  An element alone costs the base; the ring and the grove together double it. His screen has more pixels than this,
  so his frames are longer in the same proportions.
- *Mine, the rules the decision implies, for him to confirm:*
  1. **A builder's page is a studio** (W14 revised, as Motion.md M15 has it for the interface): the element stands
     alone on its stand at the world's middle, the sky and the gas around it, the camera where its page puts it now;
     no other element is drawn there. The ring of mountains and the grove stand on the Environment's page alone, and
     on the world's.
  2. **Placement lives on the Environment; the element's page holds the element.** The trees' Grove group (Count,
     Spacing, Gathering, Skirt, Spread, Clearing, Seed, Randomize) moves to the Environment beside Mountains, since it
     places trees rather than describing one; the Trees page keeps Trunk and Light. The Mountains group stays where it
     is.
  3. **A variant is one element's settings, named and saved**, within the element's version: a version is the jig's
     code (frozen once seen, W14), a variant is data within it. The element's card opens with a **Variants** group: the
     one picked in a Select, its actions in its own menu beside it (Save, New variant, Delete), its Name typed under,
     as the sector's units are; the card tunes the one picked, its version line says *Unsaved* while it is tuned away
     from it, Reset goes back to it as saved, Copy settings sends it and Copy variants the whole library. The library
     (W15) grows a column: each element's variants.
  4. **The world places variants.** Each place of the mountain ring names its variant (the Environment's Mountains
     group: under the layout's seed, count and spacing, a Select a place, *Mountain 1 … 8*, naming a variant or *The
     layout's own*, the derived shape); the grove draws each tree's variant from the trees' variants by the seed, as it
     draws each light's colour; the portal's page and the human show one. Inspect lists the Mountain once, the element
     alone; its hierarchy of units and blocks stays as it is.
  5. **His six mountains become six variants**, placed at the places they were tuned at; the human's, the trees' and
     the portal's settings become each element's first variant. Nothing he has seen changes.
- **Open, five options: where a variant lives, and how his become the world's.** Each a different mechanism; he picks
  by id, and the pick's rule goes in here.
  - **A. The browser, and Copy to code** (how his settings travel today, W14): the variants are kept in the browser
    beside the element's settings; Copy sends one, or every variant of an element at once; his become the element's
    variants in code (`MOUNTAIN_VARIANTS`, beside `MOUNTAIN_EDITS_START`), which the world draws. Nothing new in the
    stack. *Fails* when he tunes on two devices, or wants a variant in the world without a paste and a commit between.
  - **B. A variants file in the repo, written by the dev server**: `apps/orbit/src/world/variants/<element>.json`;
    on `next dev` alone, Save writes it through a route handler, so what he saves is in the repo at once and the next
    commit ships it; production reads the file and its Save says it saves only on the dev server. *Fails* as a new kind
    of thing in a static app (Admin.md §0.6: the page is static; a route that writes is not), and when two sessions
    write one file.
  - **C. The database**, as the motion studio keeps the agents' actions (Motion.md M24): drafts, saved versions, an
    `orbit.open` permission to save, the world reading published variants through a public policy with a fallback to
    the variants in code. *Fails* the deliberate "no sign-in, no database" of Orbit (W1, the app's rules), and makes
    a public world wait on a query unless the fallback is what it draws.
  - **D. Files he keeps**: Save downloads the variant as a `.json`, Load reads one back; he puts the files under
    `variants/` and commits them. Works anywhere, on any device. *Fails* in the handling: a file a variant, by hand,
    and nothing is in the world until he commits.
  - **E. The link**: a variant is its settings in the page's address (`/build/mountain?variant=…`), Save copies the
    link, the list is his bookmarks, and a link opens the element at those settings on any device; his become code by
    sending the link. *Fails* as a list on the page (there is none) and as the world's data (a link is not placed).
  - *Recommendation:* **A** now, since it is the loop in use and changes nothing in the stack, with Copy sending an
    element's whole library in one paste; **C** when the world has a reason for a database beyond this.
- **His pick, 2026-10-14: A now, C later** ("Proceed with recommendations"). *Built:* `variants.ts` (a variant, a
  library, its operations, no three.js) and `libraryStore` (`store.ts`): each element's library kept in the browser
  (`no-origins:orbit:<element>:variants`), starting as his variants in code (`MOUNTAIN_VARIANTS`, `TREE_VARIANTS`,
  `HUMAN_VARIANTS`, `PORTAL_VARIANTS`), a kept variant read against the jig (`configOf`, `jig.ts`). The world places
  his variants in code everywhere but the Environment's page and Inspect, which place the browser's library, so what
  is saved shows up placed while he builds. **Environment version 34** places: Mountains gains a Select a place
  (`mountainAt`, his six at places 1 to 6, the seventh and eighth the layout's own), and **Trees** is its group now
  (Count, Spacing, Gathering, Skirt, Spread, Clearing, Seed, Randomize, from the trees' page); version 33 is frozen.
  **Trees version 3** is the tree alone, Trunk and Light, starting at his tree; its page stands off one tree at the
  world's middle, the middle of its ranges, bent east, its first colour (`studioTree`); version 2 is frozen
  (`tree-v2.ts`, `build-tree-v2.ts`). **The mountain's studio is on Inspect**: *Mountain*, once, alone at the middle
  (`mountainStore`, `studioMountain`), with its variants; the places' edits of version 5 went with the places. The
  human's and the portal's pages gain their Variants group; their versions stay. `aloneOn` (`start.ts`) says which
  element a view shows alone; the engine draws no ring and no grove there, and the base as before.

## W73. The database, the elements as pages, and the world placed by hand (draft, his to decide)

- **W82 moves the placing** (his, 2026-10-15: "we will not place anything in the world explicitly"): the World page
  places nothing and draws the sectors; elements are placed on the Sectors page, into a zone, inside its sector.

2026-10-14. **His:** "I think we should start using database, because here is how I want to see the builder. The world
should actually be the world that we create using all the elements. But when it comes to elements like mountains,
portal, sector, human and trees, even in inspect, I don't want inspect, I want mountains. And when I select that, I
should see variations of mountains to select from the dropdown. Currently I'm seeing a Spatial units and elements card
with a Select an element dropdown. But what I want to see for each element is the element name, which will be
mountain, portal, sector, human and trees. And when I open mountain, or any one of these elements, I should just see
the mountain and a dropdown of variants that I have created and saved. Similar for portal, sector, human and trees.
And then once we save them, I can go into the world, and there we can place these elements and their variations
wherever we want. That's how I want to create the world. And when it comes to environment, along with elements we
should have environment as a section, and under environment we should have clouds, camera, map, and base clouds,
light and texture, fog, individually to configure."

- **Decided (his): the database, now.** W72's option C, no longer later: variants are saved to the database, and the
  world placed from them.
- **Decided (his): the sidebar.** **World**; **Environment** › Clouds, Camera, Map, Base clouds, Light and texture,
  Fog; **Elements** › Mountains, Portal, Sector, Human, Trees. No Inspect.
- **Decided (his): an element's page is the element and its variants.** It shows one of the element alone and a
  dropdown of the variants he has made and saved, and nothing else: no Spatial units and elements card.
- **Decided (his): the world is placed by hand.** The World page is where the saved elements and their variants are
  placed wherever he wants; the world is what is made of them.
- *Mine, the rules this implies, for him to confirm:*
  1. **The database is the studios' one** (Admin.md §8, Orbit.md C24): `studio_items` is the thing, its kind and
     name; `studio_drafts` his work in progress; `studio_versions` what is published, the current one what pages show.
     The kinds grow by `mountain`, `tree`, `portal`, `human` and `world` beside `character`, `motion` and `drawing`: **a
     variant is an item** of its element's kind, its settings its data; **the world is an item** of kind `world`, its
     data the hierarchy (W25) with what is placed in it. The public-read policies of 2026-10-03 (C24) extend to the new
     kinds: everyone reads every item's current version, nobody reads a draft. *Alternative, if he prefers:* tables
     of Orbit's own (`orbit_variants`, `orbit_world`), which would repeat the draft-and-version shape for no gain.
  2. **Everyone plays, he saves** (W14, C24): the builder stays public and nothing a visitor does is saved; signed in
     through the shared gate (Admin.md §8.4), with `orbit.draft.save` and `orbit.version.publish` (in the catalogue
     since the looks; their sentences reworded to an element's variant and the world), Save keeps a draft and Publish
     makes a version, as the agents' actions have. A card not signed in says so where Save is. Orbit's route is not
     gated; the world is public.
  3. **The page is static; the world is live** (Admin.md §0.6): the world's page and the builder read the published
     variants and the published world with the anon key, through those policies, once on screen; the fallback is the
     variants and the world in code, his last published copied in (as the portfolio copies the agents), so a visit
     with no keys, CI and a fresh clone draw his world. Orbit's project already carries the two keys, unread since the
     looks; they are read again.
  4. **A placed element is an asset of a zone** (W4, W25): as a block is, a kind, a variant, its place relative to its
     zone and its turn; so the world's data stays one tree of units and assets, and a placed mountain, tree or portal
     is picked, moved, turned and removed as a block is. The human is not placed: it is the visitor (W51). The ring's
     seeded layout and the grove's seeded scatter (W41, W61, W71) go with this: nothing is placed by a seed.
  5. **Mountains is a page** (`/build/mountains`), the studio Inspect held: the mountain alone at the middle, its
     variants, its groups. Portal, Sector, Human and Trees as they are, their Spatial units and elements card gone.
     Sector keeps the hierarchy and its blocks (W24, W25): a zone's blocks are built there, and its placed elements are
     listed there too.
  6. **Environment is a section**, a page a group of version 34's card: Base clouds (W40), Light and texture (W23),
     Fog, with Clouds (the ceiling, W38), Camera and Map moved under it. *Open, his:* where Sky (the open sky's colour,
     pigment and flow) and Motion (every atmosphere clock paused together) go: a Sky page of their own (*mine*), or
     under Light and texture.
  7. **His variants in code are published once**: the six mountains, the tree, the human and the portal become items
     with a version 1.0, by a script he runs signed in (as `publish:house` is his to run), and stay in code as the
     fallback (rule 3).
- **Open, five options: how an element is placed in the world.** Each a different mechanism; he picks by id.
  - **A. A click on the World page, as the Sector's blocks** (W24): the card picks the element and its variant, a
    click on the ground places it, a ghost showing where; a placed one is picked by a click, dragged to move, turned
    by its Turn, removed from its menu. *Fails* at the scale: a mountain a hundred metres across is placed from a
    camera metres high, so each placing is a flight, and the cell's precision (W4) is wasted on it.
  - **B. The map as the placing surface**: on the World page the map opens wide, a drop on it places at that spot
    and the camera flies there to see; the rest as A. *Fails* for height and feel: a kilometre on a card three hundred
    pixels across, and no view of what is being placed until the flight lands.
  - **C. Typed placement**: a list of what is placed, each with X, Z and Turn typed (Inspect's block controls), and
    Add from a variant. Exact, and dull. *Fails* for feel and for number: a hundred trees by hand is an afternoon.
  - **D. Place one, scatter many**: single elements, a mountain, a portal, placed as A; trees by a grove brush: a
    variant, Count, Spacing and Radius round a click, Randomize, each tree then its own asset, so any can be moved
    or removed after. *Fails* as two tools to learn, and the brush fills a zone's assets by the hundred.
  - **E. Zones place by rule**: a zone of a kind holds what it holds by its rule (a grove: variant, count, spacing; a
    ring: a variant a place), and the world generates from it; placing is making zones and drawing their bounds.
    *Fails* his "wherever we want": nothing is placed singly, and a rule is a seed by another name.
  - *Recommendation:* **D**, with A's gesture for the single ones and the brush for the trees, the data as rule 4.
- *Mine, the order of building once he has picked:* the pages first (rules 5 and 6, no database: Mountains as a page,
  the card without the picker, Environment split, Inspect gone); then the database (rules 1 to 3 and 7: the kinds,
  the policies, the permissions' sentences, Save and Publish on every element's card, the live read with its
  fallback); then the World page's placing (his pick, rule 4); each looked at in the browser before the next.
- **Decided (his, 2026-10-14, "let's give Sky page of their own … let's go with your recommendation"): a Sky page**,
  Sky's controls and Motion together, first under Environment; **and D**, place one, scatter many. *Mine, with it:*
  - **The World page is a builder's view**, looked round as the Environment's was (a drag goes round, a right-drag
    moves, the wheel comes nearer, the keys and the map travel), not the visitor's camera: a mountain is placed from a
    camera that can stand back far enough to see where. The visitor's camera stays `/`, the Camera page and the Map's.
  - **Placing**: the card picks the element (Mountain · Portal · Tree), its variant and the zone it goes into; a click
    on the ground places it, a ring on the ground showing where and how wide; a mountain faces the world's middle as
    the ring's did, a tree leans its own way. A tree's click is the grove brush: Count trees, none nearer than Spacing
    to another, within the Radius of the click, each its own asset with its own seed; Randomize draws them again. A
    placed element is picked by a click (a ring at its foot), moved by a drag or by its X and Z typed, turned by its
    Turn, and removed from its menu. A portal placed on a block cuts into its top, as on its page.
  - **The ids are the database's from the start**: every variant in code carries the uuid its item will have, and the
    world's assets name variants by those ids, so nothing is renumbered when he publishes. New variants are made with a
    uuid the same way.
  - **No seeding script.** His variants in code are published from their cards, Save then Publish, each once (nine
    and the world); rule 7's script is withdrawn. The script that stays goes the other way: `pnpm --filter orbit
    copy:published` reads what is published and writes it into code as the fallback (rule 3), run after a publish
    when the fallback should move.
  - **The start world is today's**: the ring at layout seed 2000 and the grove of W71, placed as assets of the start's
    entry zone, so the world is as it was until he moves something. The seventh and eighth mountains become variants
    too, Mountain 7 and 8, as the layout derived them.
  - **Delete is for a variant never published**: a version keeps its item (W20's rule); retiring a published variant
    is open, his.
  - `/build` opens on World, first in the sidebar. Built in the order pages, placing, database, so the database's
    Save and Publish are wired to every card at once.
- **Built, 2026-10-14** (all of it; nothing of it is committed or pushed to the hosted database, his call):
  - **The pages**: the sidebar as decided; `/build/mountains` the mountain's page (the studio Inspect held, seen from
    the east; W64's glass filtering kept); `/build/sky`, `/build/base-clouds`, `/build/light` and `/build/fog` the
    Environment's, each a slice of one jig (`environmentPage`, version 35) and one store whose Reset puts back only
    that page's groups; `/build/inspect` and `/build/environment` redirect to them. No Spatial units and elements
    card anywhere.
  - **The database**: `…_orbit_elements.sql` adds the kinds `mountain`, `tree`, `portal`, `human` and `world` to the
    studios' tables (rule 1), Orbit's by `noo_studio_app`, made and saved with `orbit.draft.save`, published with
    `orbit.version.publish` (rule 2; the two sentences reworded), read by everyone where published (rule 3, the
    public-read policies widened); `supabase/tests/orbit_elements_test.sql` is its seventeen tests. Orbit depends on
    `@no-origins/auth` for the browser client; the page is static and the libraries (`library.ts`) read what is
    published with the anon key once a card or the world is on screen, his drafts too when he is signed in, and fall
    back to `published.json` in code, where `copy:published` writes what is published. Every element's card and the
    World's and Sector's offer Save, Publish, New variant, the Name and Delete to an account that may, and a visitor
    the sign-in (Orbit.md C24); the version line says Unsaved, the status line what was done last.
  - **Placing** (rule 4, option D): a placed element is an asset of a zone (`PlacedAsset`: its kind, its variant's
    id, its place, its turn, a tree's seed); the engine draws the mountains, trees and portals placed in the world
    from the libraries' variants, a tree's length, bend and light's colour drawn by its seed (`treeOf`); the World
    card and the gestures as decided, Escape letting the picked one go; a portal placed on a block cuts into it and
    the map shows it. The seeded ring and grove are frozen (`environment-v34.ts`, `tree-grove-v3.ts`).
  - Looked at: every page, light, at 1440 × 900; placing, dragging, picking, removing, the grove brush (twelve, ten
    and eight trees at three clicks, the Spacing holding) and Reset, headless; and, signed in as the review's
    account, New variant, Save, the Name and Delete on the mountain's page against the local database, the test
    item deleted after. Publishing is tested in the database's tests alone, since a version never deletes.
  - *Open, his:* retiring a published variant; whether the world's page should fly to a picked element from the
    map; the hosted database (`db push`) and the first publishes, from each card, then `copy:published`.

## W75. The Environment is published by version, unnamed

- **His** (2026-10-15): "we have introduced publishing different variants in elements. But in environment, we don't
  have such an option to publish. So basically, we don't need names in environment. We need versions to keep
  publishing."
- **Decided (his): the Environment publishes, by version, with no names.** It has no variants to choose among and
  nothing to name: Save keeps it as its draft, and each Publish makes the draft the next version (`major.minor`, the
  next minor), the current one what the world shows.
- *Mine, the rules this implies, for him to confirm:*
  1. **The Environment is one item**, as the world is (W73 rule 1): kind `environment` in the studios' tables, Orbit's,
     made and saved with `orbit.draft.save`, published with `orbit.version.publish`, read by everyone where published,
     its draft by nobody but an account that may save. Its data is everything under the sidebar's Environment, kept
     together: `{ atmosphere, clouds, camera, map }`, the Environment jig's settings (Sky, Base clouds, Light and
     texture, Fog, and Motion), the ceiling clouds' (W38), the visitor's camera and the map, each its jig's settings
     whole. Its item is called Environment; no card shows the name. *Alternative, if he prefers:* an item a page,
     seven versioned things where he tunes one atmosphere across four of them.
  2. **Every Environment page carries it** as the World and Sector cards carry the world: Save and Publish in the
     card's own menu, saving the whole environment wherever they are pressed; the status line under the name says
     Not published, Published 1.2, or Published 1.2 · draft ahead; the version line Unsaved while anything under
     Environment is tuned away from the draft, on any of its pages. Reset puts back that page's part as saved.
  3. **The world draws it as published** (W73 rule 3): every page but the one tuning a part draws the atmosphere, the
     clouds, the camera and the map as published (or as he last saved them, signed in), and each Environment page
     opens on that until this browser tunes it. The fallback is his copy in code, `published.json`'s `environment`,
     made from the code's own starts (2026-10-15) and moved by `copy:published` after a publish.
- **Built, 2026-10-15** (nothing committed or pushed to the hosted database, his call):
  `…_orbit_environment.sql` (the kind, its app, the insert rule and the public reads, the two sentences reworded) and
  `supabase/tests/orbit_environment_test.sql` (fourteen tests, publishing 1.0 then 1.1); `environmentLibrary` and
  `publishedEnvironment` in `store.ts`, the four stores reading the published environment where this browser keeps
  none; `EnvironmentData` and `environmentOf` in `environment.ts`. Looked at on all seven pages, signed out (Save and
  Publish off, the sign-in offered) and signed in as the review's account (Publish on, Save on once tuned; Unsaved on
  Fog after tuning Light; Reset clearing it). Nothing was saved or published locally.
  - *Open, his:* the hosted database (`db push`) and the first Publish from any Environment card, then
    `copy:published`; whether he wants to see and return to earlier versions.

## W76. Switches in the Environment, and every card action a click

- **His** (2026-10-15): "give me option to enable or disable something just by using toggle. In environment, and also
  instead of giving options in the drop-down, I think you can convert them into icon buttons for easy clicking. Like
  right now I have two steps, I have to go select the three-dot icon button and then click on the option." Asked
  which toggles, he picked all three offered: Motion, each layer, and the map.
- **Decided (his): Motion is a switch.** On, every clock of the atmosphere runs; off, they pause together
  (Environment version 36; version 35, Motion a choice of Flowing or Paused, is frozen).
- **Decided (his): each layer has a switch.** Sky's **Colour flow**, and **Shown** on Base clouds, Fog, the ceiling
  (Clouds' Layer, Clouds version 5) and the Map (Map version 4), first in its group. They are the Environment's
  settings, so they are saved and published with it (W75). *Mine, how off is drawn:* a part switched off is drawn as if
  its amount were nothing (`drawnOf`: the colour flow and the base clouds' density nothing, the fog beyond the far
  plane), so the renderer remakes nothing for a switch; the ceiling is not drawn and the sky shows overhead, the walls
  staying; the map is not drawn. What Base clouds' switch takes away is its banks: the floor's thin veil (which hides
  where the mountains' tips are cut at the floor) and the walls' fog are not the base clouds and stay. The fog paints
  the blocks and the portals, never a mountain, so its switch shows only where they stand.
- **Decided (his): a card's actions are icon buttons**, a click each, never a ⋯ menu: on every jig card in Orbit,
  Play, Save, Publish, Reset, Copy settings and Copy variants beside its name; Save, Publish, New variant and Delete
  after the variant picker; the Sector's unit actions (New, Make it the entry, Delete with all it holds) and its picked
  blocks' (Let it go, Remove); the World page's picked element's Remove. *Mine:* each is the system's small ghost icon
  button (36px, the control height), named in a tooltip and to a screen reader, drawn off when it cannot be done now
  with its tooltip still naming it; a Delete that cannot be undone (a variant's, a unit with all it holds) asks first
  in the system's alert dialog, answered Keep it or Delete. The root `CLAUDE.md`'s rule that a control's actions go in
  their own menu now excepts Orbit's jig cards.
- **Built, 2026-10-15** (nothing committed): `environment.ts` (v36, `drawnOf`), `clouds.ts` (v5), `map.ts` (v4), their
  frozen versions, the engine reading the drawn atmosphere and hiding the ceiling, the map's switch in `world.tsx`,
  `IconAction` and `IconActions` in `jig-card.tsx`, the World and Sector cards; `published.json`'s environment copy
  refreshed to version 36's starts (nothing is published yet). Looked at in the browser: every switch flips and marks
  the Environment Unsaved; looking up, the ceiling goes and the sky shows; at Density 2 the base clouds bury the
  mountains and switched off they are gone; the map goes; the icon buttons with their tooltips, and Delete's question
  answered Keep it.
  - *Open, his:* whether the icon buttons should replace the ⋯ menus in the other apps too.
- **Decided (his, later the same day): the switch is on the card's header.** "Instead of having the toggle as shown in
  the jigs of environment, the toggle has to be on the card header": each switch stands on its group's header, after
  the group's name and before its arrow (his: "The arrow in the header … should be on the right"), a click away even
  while the group is folded, named by its label in a tooltip (Motion, Colour flow shown, Base clouds shown, Fog shown, Ceiling shown on
  Clouds' Layer, Map shown); a control marks it with `heads`. *Mine, with it:* the sky's switch is its colour flow's, so
  a switch on Sky's header would read as the sky off: the flow's controls (Pigment, Flow, Billows, Speed, Wind,
  Viscosity, Turbulence, Softness) are a group of their own, **Colour flow**, under Sky, which keeps its Colour. No
  setting changed, so no version did. *Mine, how:* the arrow is the accordion's trigger's own and a switch cannot go
  inside a button, so the trigger runs the header's width and the switch stands over it, 12px before the arrow
  (inline and inline-tight: the system's switch takes a press 12px past its edge, and nearer it would take the
  arrow's). The icon buttons' helpers are `IconAction` and `IconActions`, since the system's card has a `CardAction`.


## W77. The eye in the helmet holds steady

2026-10-15. **His:** "the camera behind the visor … Through it, I'm unable to see anything. And the movement of the head
when I view through the camera inside the head is not controllable and it is not smooth. Even when I'm walking or
running, it is not smooth."

- **The eye goes where the head is, every frame** (a fault, mended): the camera was put in the head before the figure
  took its step and its pose, so it was a frame behind it, and while the figure settled, or was dragged, it was not
  moved at all; the rim jumped about the view, up to 85 px of 1200 running ahead. Now each frame the figure steps, is
  posed, and then the eye is put in its head; running ahead, the rim stays where it is to the pixel.
- *Mine:* **the head holds steady in the helmet**: the eye rides neither the stride's bounce nor the body's sway and
  twist. It does go with the lean a walk or a run holds all along, since a head left upright over the hips sees its own
  neck lean out in front of it. It comes round to where the head is held (the way the figure faces, its Expression or
  the pointer), and to a new lean, over the eye's settle, so a turn starts and ends softly rather than snapping by the
  Gait's Turn. The head bone is put there, so the rim and the lens keep their place in the view; the neck rising and
  falling under the ball is never seen from inside. Seen from outside (the Human page) the figure is as before. The
  settle was first a token; since W78 the look comes round over Camera › Steering's Smoothing and the lean over the
  Gait's Settle.
- *Found, not changed:* **why nothing can be seen.** The eye is 2.1 m over a floor drawn one flat white (`#f5f7fa`,
  the floor the base gas conceals), inside the base gas (Height 0, Thickness 85 m), so below the horizon is all white
  and the trees and mountains past about 50 m are washed into it. The published camera already looks level (Angle 0°,
  Field of view 70°). The helmet does not hide anything now: the lens and the dish are drawn from outside alone (W69).
- *Found, not changed:* **why it is not his to steer.** The figure faces the way it travels and the eye is in its
  head, while the keys go by the camera's Turn: A, D or S, or a drag to the side, swing the whole view round to face
  that way, and W is then no longer ahead in the view.
- Open, his: how he steers and looks round in the helmet; what is to be seen from 2 m in the gas. Both answered in W78.


## W78. Steering from the helmet, and the view through the visor

2026-10-15. **His**, of five ways to steer put to him (W77): "Let's go with C2 and give me controls to configure this
steering." Then: "for seeing, I've tried toggling the base clouds and fog off, but I don't see any change in the view
too. And also we will need options for visor to control how it should look from the visor."

- **Decided (his, C2): a drag looks round, the keys go by the view.** In the helmet the figure faces the way the eye
  looks, the camera's Turn, whichever way it goes, so nothing swings the view but the visitor: a drag turns the look
  across (the Turn) and up and down (the Angle, the head tilting with it, so the rim stays round the view); W and S go
  ahead and back the way it looks, A and D step sideways; a click on a portal is still a click. The figure walks or runs
  as before, its body turned to the look, stepping sideways or backing up.
- **Steering** (his: "controls to configure this steering"; Camera version 10, the ranges and starts *mine*): **Drag**
  (Look · Slide: the drag over the ground of before, the figure still facing the look), **Look speed** (2–40° a drag of
  100 px; 12), **Reverse across** and **Reverse up and down** (switches, off: the hand carries the world with it, as a
  drag over the ground did, so a drag to the right turns the look left and a drag down looks up), **Look up** (0–60°;
  40) and **Look down** (0–90°; 60), how far from level the drag may tilt it, **A and D** (Step · Turn; Step, the arrows
  ← → too), **Turn speed** (0–360° a second; 90), and **Smoothing** (0–400 ms; 100), how long the eye takes to come round
  to where it is steered. The Angle's range is now −60° to 90°, under 0 looking up, in the helmet. The camera's page
  shows Turn and Angle moving as it looks. In the helmet the head is the visitor's: its Expression and Looks at cursor
  are the figure's seen from outside, on the Human page. Version 9 is frozen (`camera-v9.ts`).
- **Why the switches changed nothing** (found): the white below about 8 m is the floor's thin veil (W43, W76), which
  hides where the mountains' tips are cut at the floor, and neither Base clouds nor Fog takes it away; at the eye's
  2.1 m it hides nine tenths of what is 50 m off. And the world and the camera's page draw the environment as
  published (W75): a switch on an Environment page shows there, and in the world once saved and published.
- **Visor view** (his: "options for visor to control how it should look from the visor"; on the Camera card, where
  the view through it is seen; the ranges and starts *mine*): **Clear air** (0–300 m; 150), how far round the eye no
  air is drawn: the floor's veil, the base clouds and the walls' fog begin there; **Haze** (0–100%; 35), how much of
  them is drawn past it, 100% as everywhere else; **Rim in view** (a switch, on), whether the visor's rim frames the
  view. They are the helmet's alone: every other view, and the world seen from the builder's pages, keeps its air.
  *Mine, how:* the base gas's integration (`build-base-fog.ts`) weighs every sample by its distance from the eye (none
  within half the clear air, all of it, times the haze, past it) and integrates the veil from the clear air's end, so
  everything the air paints (the floor, the mountains, the trees, the walls, the sky's edge) clears together.
- Seen through the helmet with the starts: the mountains, their algae, the trees and their lights, and the ceiling's
  clouds read in colour; below the horizon the floor is still one flat white, as it is drawn.
- Open, his: the floor seen from 2 m (one flat white: a floor that reads, V2 of W77's five, is still to pick); a
  drag that carries on after the hand lets go (it stops where let go).


## W79. The helmet's inside, seen round the visor

2026-10-15. **His:** "I should also be able to see the body around the rim in the head. Because right now uh, the rest
of the head apart from the visor is transparent. I should see the controls for it."

- **Decided (his): the eye sees the head round the visor.** The shell was drawn from outside alone (W69), so from the
  ball's centre everything past the visor's opening showed the world. Now the shell's inside is drawn too, so the head
  frames the view round the rim, as a helmet does. *Mine, how:* a second surface on the shell's own line, seen from
  within alone (`head lining` in `build-human.ts`), so from outside it is always behind the shell and the figure looks
  as it did (its head measured pixel for pixel on the Human page). The visor is set into the ball by its Inset, so the
  ball ends a little outside the rim (with his head, 25.9 cm out against the rim's 25): from within, the inside's lip runs
  in from the ball's edge to under the rim and closes that ring, which otherwise showed a band of world between the two.
  It neither casts nor takes a shadow (inside a closed ball it would be all shade), and the dish and the lens stay
  unseen from within (W69), so nothing is drawn across the opening.
- **Its controls are Visor view's** (Camera version 11; the card where the view through the visor is seen; version 10
  frozen, `camera-v10.ts`), *mine*, the ranges and starts: **Inside** (a switch, on), **Inside colour** (the world's
  swatches; Cream, the figure's colour) and **Inside light** (0–100%, 20): the world's light shades it as it falls in,
  and Inside light lifts it toward its colour whole (100%), so a dark inside can still read. Shown in the helmet alone,
  as the rest of Visor view.
- How much of it is seen depends on the lens: at his 70° field of view on a wide screen, the inside shows at the sides
  and the corners, round the rim.
- Open, his: the inside's colour following the figure's Colour by itself (now it is its own pick, starting at the
  figure's Cream).


## W80. The helmet's inside has an opacity

2026-10-15. **His:** "Opacity control is also needed."

- **Visor view › Inside opacity** (Camera version 12; version 11 frozen, `camera-v11.ts`), *mine*, its range and start:
  0–100%, starting at 100%, opaque, as version 11 drew it. Under 100% the inside is drawn over the world, which shows
  through it, and it writes no depth; at 0% it is not drawn, as with Inside off. Seen through the helmet with a black
  inside: whole at 100%, the mountains half through it at 50%, gone at 0%.



## W81. Spaces: sectors with a place and a size, and their zones

*Zones went with W91: what a zone held is its sector's.*

2026-10-15. **His:** "Let's remove sector from elements and create another section called Spaces. So basically, spaces
is where we will see the world, and I should be able to create spatial units - Zones and Sectors. Currently at this
point, I don't want to have habitat and ecosystems. So currently we'll only have zone and sector. And here are the
controls that we need. So first, I should be able to create a sector. A sector will have name, and then a location in
the world. And in that location, I will describe the width and height of the sector. I mean, I can have the control
to set the sector width, length and height. Up to the maximum of thousand meters. And minimum of 50 meters. And then
once I create the sector and decide its location and its dimensions, the camera should take me to that location. And
there, I will create zones. And now zones similar to sectors will also have name, but not dimensions. Zones will become
the group of items that I create and attach to that zone."

- **Decided (his): the Sector leaves Elements, and Spaces is a section of the sidebar**, where the world is seen and
  its spatial units are made.
- **Decided (his): two units for now, the sector and the zone.** Habitats and ecosystems are set aside (W4, W25).
- **Decided (his): a sector has a name, a place in the world, and a width, length and height, each 50 to 1000 m.**
- **Decided (his): once a sector is made and placed, the camera goes to it**, and its zones are made there.
- **Decided (his): a zone has a name and no size**: it is the group of what is made and attached to it.
- *Mine, how, for him to keep, change or drop:*
  - **Spaces holds one page, Sectors** (`/build/sectors`), second in the sidebar after World, since its units are the
    world's own; habitats and ecosystems would be its next pages. `/build/sector` and `/build/plane` lead there. Its
    card is the Sectors jig, version 1 (`spaces.ts`); the Sector element's version 5 is frozen (`sector-v5.ts`).
  - **The page shows the world as placed**, not an element alone (W72): the mountains, the trees, the portals and the
    blocks, with **every sector drawn by its twelve edges**, the one picked violet and the others lilac, as a block
    picked and a block to pick are (W24), never fogged, so a sector far off still shows where it stands.
  - **A sector's place is the middle of its floor**: X and Z over the world's floor (−500 to 500 m), Y its floor (0 to
    950 m, so the least sector still fits under the clouds), each a slider with its value typed, a row a way with the
    size that runs along it: X and Width, Z and Length, Y and Height. A place or a size is never refused, as a unit's
    never was (W25); the note says when part of the sector stands outside the world's round or above its top.
  - **A new sector is 100 m each way**, at the world's middle, or a metre further east at a time while its entry's
    block would stand on one already built, and he places it on the card. It is made with its entry zone of one block
    (his, W24). The world keeps one sector; a sector is deleted with its zones and all in them, after asking.
  - **The camera goes to the sector picked** whenever one is made, picked, moved or sized, and on **Go to it**, an icon
    button beside New: it glides on the camera's Flight spring (Response and Bounce, W15's Camera) to look at the
    sector's middle, no more than 50 m over its floor where what is built stands, from 30° above level, the way it
    faced, far enough for every corner to be in view, but never past four fifths of the way to the world's side or top,
    so a sector as big as the world is seen from inside it, clear of the cloud walls. The hand, the wheel or a key
    stops the glide where it is; the page arrives on the sector picked at once; under reduced motion it is always at
    once.
  - **A zone has no place**: what it holds stands from the middle of its sector's floor, so moving a sector moves
    everything in its zones. The zone keeps W25's entry (a sector's entry zone, Make it the entry) and W24's Build and
    Picked: blocks are built into the zone picked, on a level over the sector's floor, **inside its sector alone** (a
    click outside it builds nothing); the World page still places elements into a zone, listed "Sector › Zone".
  - **A world kept before this is read as it is now, nothing moving**: each sector stands where its ecosystem's,
    habitat's and own places put it and is the whole world in size (1000 × 1000 × 1000 m), since it held everything
    built; a zone's own place is added to its assets'. His published world reads as one sector, **Sector 1, the whole
    world** at its middle, its Entry zone holding the start's block, the eight mountains and the grove. The next Save
    writes the world as it is now; `published.json` keeps the copy as published until `copy:published`.
  - Copy lists each sector with its place, size and entry, and under it each zone with what it holds.
- Looked at (1440 × 900 and a phone, signed out, the world in that browser alone): the sidebar; a new sector framed;
  typed X, Z, Width, Length and Height moving and sizing it with the camera following; a new zone; a block built inside
  the sector and a click outside it building nothing; Go to it after dragging away; Sector 1 seen from inside the world;
  the World page's zones; the old addresses.
- *Open, his:* whether sectors are drawn on the map; Sector 1's size once he has made his own sectors. Where elements
  are placed is W82.


## W82. Nothing is placed in the world; it is put into a sector's zone

2026-10-15. **His** (asked whether an element placed on the World page must stand inside its zone's sector): "The
world page should not have elements be placed in it. Since we are using the spaces to create sectors, the sectors also
hold location. So we will not place anything in the world explicitly. But the sectors that are created should be
rendered in the world. In the location that they were designed to stay." Then, of two questions, his picks: elements
are placed **on the Sectors page, into a zone**, and a sector is rendered on the World page **by its outline**.

- **Decided (his): the World page places nothing.** It shows the world as the sectors build it. World version 6; its
  version 5, which placed (W73), is frozen (`bounds-v5.ts`).
- **Decided (his): every sector is drawn in the world where it stands, by its edges**, on the World page: lilac, none
  picked; the card's Sectors group lists each, its size and where it stands. *Replaced by W103: the World page draws
  no edges.*
- **Decided (his): mountains, trees and portals are placed on the Sectors page, into the zone picked, inside its
  sector.** W73's placing moves there whole: the gesture (option D), the ring, the grove brush, the variants.
- *Mine, how, for him to keep, change or drop:*
  - **Build's Tool decides what a click does**: **Place** puts the **Item** into the zone picked, a Block (as before:
    Level, Width, Length, Height, Colour) or a Mountain, a Tree or a Portal (its Variant in a Select from its library,
    and for a tree the grove brush's Count, Spacing and Radius with Randomize); **Select** picks what is there, blocks
    (Shift-click more) or one element, so Place never picks and Select never places. A press with Select on an element
    picks it unless a block stands nearer along the pointer's line.
  - **Inside the sector alone**: the ring under the pointer shows only over the picked sector's floor, and a click
    outside it places nothing; the grove brush's Radius may reach past the sector's edge, and a tree that would stand
    outside it is left out. A portal lands on a block's top inside the sector, or its floor.
  - **A mountain or a tree stands on the world's floor**, as they are drawn (W34, W71), so a sector whose floor is over
    the world's (its Y above 0) takes neither, and the note says so; it takes blocks and portals.
  - **A placed element is picked with Select**: a violet ring at its foot, and the card's Picked group shows it (its
    variant, Let it go, Remove, and X, Z and Turn typed); a drag moves it within its own sector, stopping at the edge;
    Backspace removes it, Escape lets it go, a click on a block or the ground picks that instead. One pick at a time:
    blocks or an element. A typed X or Z is never refused; the note says when it stands outside its sector. The pick
    is let go on a reload, as the blocks' is.
  - The Sectors card opens with Sector, Zone, Build and Picked, so what a click does and what it picked are in view.
  - What W73 placed before stays where it is: the eight mountains and the grove are Sector 1's, its Entry zone's.
- Looked at (1440 × 900, signed out, the world in that browser alone): a mountain placed inside a sector of 150 m and a
  click outside it placing nothing; a grove of twelve at 120 m placing the seven that fit inside; Select picking the
  mountain and Backspace removing it; a click on the World page placing nothing; a sector's outline from the World page.

## W83. E and Q, and Option-drag, raise and lower a looked-round camera

2026-10-15. **His**: on a looked-round page, the wheel goes nearer, W A S D travel and Shift- or Command-drag pans,
"but only in horizontal direction. So, there is not way currently for me to move vertically."

- *Mine, how, for him to keep, change or drop:* **E raises and Q lowers** the camera and what it looks at together,
  held as W A S D are, at the camera's Keys speed (4 m a second as published), picking up and losing speed over its
  Glide, on every looked-round page (World, Sectors, the Environment's, Clouds, Mountains, Trees). The camera stops at
  the world's floor and both stop at its top; what it looks at may sink below the floor, as an orbit's may. The
  visitor walks on the ground, so on `/` and the Camera page E and Q do nothing.
- The drag is as it was: Shift-, Command- or right-drag still pans over the ground (W23).
- **Decided (his): Option-drag (Alt) goes up and down** ("I want to hold option + drag up and down to move up and
  down"), on every page where Shift-drag pans. *Mine, how:* a drag up rises and a drag down sinks, the camera and what
  it looks at together, as far a pixel as Shift-drag pans one; a drag across moves nothing; it stops at the floor and
  the top as E and Q do. Option-drag on a picked pipe's or road's joint still moves the joint (W84), and a gizmo's
  arrow is still its own (W88): those are caught first.
- Looked at (1440 × 900, the World page): E held 3 s rises and Q held sinks, X and Z unchanged; held on, Q stops at
  the floor. Option-drag (the World and Sectors pages): up rises, down sinks into the base clouds, across holds still,
  X, Z and the heading unchanged; on Sectors with Place, nothing placed; Shift-drag still pans.

## W84. Pipes and roads, each shaped by a skeleton

*W93 drew them a joint a click, their look their own, set as they are placed: their pages, variants, Joints count, the
pipe's Gloss and the road's lines went.*

2026-10-15. **His:** "Pipes will have start and an end. I should be able to select or like pick a start on the screen
and then I can select the end. And then in between pipe will be formed. And for the pipe, I should be able to decide
the shape of it, like I should be able to mold it to any way that I want." "Roads can basically also work like pipe, I
will define the start and end, and I should be able to decide the shape of it." "For pipes and roads, we can have
something like skeleton, where I can select the joints to define the shape by moving the joints." He asked for them in
the Cinema Studio; the tree whose light he named in the same breath is Orbit's (W67, W85), so they are built here
(*mine*, his to move).

- **Decided (his): a pipe and a road each have a start and an end, picked on the screen, and are formed between
  them.** A road works as a pipe does.
- **Decided (his): its shape is a skeleton's**: its joints, picked and moved, shape it.
- *Mine, how, for him to keep, change or drop:*
  - **Pipes and Roads are elements**, each a page under Elements after Trees (`/build/pipes`, `/build/roads`), one
    alone along a skeleton of its own at the world's middle, with its variants, saved and published as every
    element's are (W72, W73; the database's kinds `pipe` and `road`). The look is the variant's; where it runs, its
    skeleton, is the world's, an asset of a zone, so one variant runs as many ways as it is placed.
  - **They are placed on the Sectors page** (W82): Place, with Pipe or Road the Item, its Variant, and Joints (0 to 10,
    starting at 3). The first click is the start, a ball whose bone follows the pointer; the second is the end. The
    skeleton is made between them, its joints evenly along the straight line from one to the other, and picked. A
    start or an end lands on the picked zone's sector's floor, or on a block's top, inside the sector alone; Escape
    lets a start go; a new start lets what was picked go.
  - **The skeleton** is drawn over the pipe or road picked: its bones, straight from joint to joint, violet, and a ball
    a joint, lilac, the picked one larger and darker, all drawn over everything and the same few pixels however far,
    so a joint behind the pipe or under the ground is still taken hold of. **A press on a joint takes hold of it,
    whatever the tool**: a drag moves it over the ground at its height, and **Option-drag (Alt) moves it up and
    down**, within its sector, on the lattice (whole metres across, quarter metres up, W4). The world keeps it as the
    hand lets go.
  - **Between the joints it runs along one smooth curve through every joint**: it passes through each, never loops
    or overshoots between two (a centripetal Catmull-Rom); two joints are a straight line.
  - **A joint is where the underside passes**: a pipe's middle runs its radius over it, a road's top its thickness,
    so one placed on a floor lies on it, and a road's joint raised makes a ramp. A road stays level from side to side.
  - **The card's Picked group, for a pipe or a road**: its variant, Let it go and Remove; then Joint (Start, Joint 1
    and on, End) in a Select, with Add a joint after it (half way to the next) and Take the joint out (never below its
    start and its end); then the picked joint's X, Y and Z, in the world's metres, typed. Backspace takes the picked
    joint out, or with none picked removes the pipe or road; Escape lets the joint go, then the pipe or road. With
    Select, a press on the pipe or road itself picks it, and a drag moves it whole, every joint by the same whole
    metres, within its sector.
  - **Pipes, version 1**: Pipe's Colour, Radius (0.25–20 m) and Gloss (0–1); starts Silver, 1.5 m, 0.3. A tube closed
    at both ends, a flat colour lit by the sun and the sky, casting shadows and taking them, fogged as the blocks are
    (it is built, as they are).
  - **Roads, version 1**: Road's Colour, Width (2–60 m) and Thickness (0.25–5 m); and Lines, painted on its top: Edge
    colour, Edge width (0–3 m), Centre colour, Centre width (0–2 m) and Dash (0–20 m, each dash as long as the gap
    after it; 0 one line). Starts Slate, 10 m, 0.5 m; Cream edges 0.4 m; a Cream centre line 0.3 m in dashes of 4 m.
  - His first variants, Pipe and Road, are in the copy (`published.json`) at these starts, to be published from their
    cards.
- Looked at (1440 × 900 and 390 × 844, signed out, the world in that browser alone): both pages; on the Sectors page,
  in a sector of 150 m, a pipe made by two clicks with three joints between, its middle joint dragged over the ground,
  Option-dragged up, typed to 20 m, and a joint added after it; a road made and its middle joint dragged; Escape
  letting the joint go, Backspace taking a joint out (five to four), then the road.
- *Open, his:* whether they belong in the Cinema Studio too; whether a road banks on its bends or follows the ground
  under it; a joint added by a click on the pipe itself; pipes and roads meeting (a junction); the lines' look; the
  hosted database needs `…_orbit_pipes_roads.sql` pushed before a variant saves there.

## W85. Trees: a light shaped as an allium

*W93 made the light a flower (Cube, Cylinder or Allium) of plain colours, lighting nothing, its size following the
trunk's; the allium's head is as drawn here.*

2026-10-15. **His:** "currently we have only a cylinder-shaped light for a tree. … I also need options with different
shape to look like allium flower".

- **The light has a Shape** (his): Cylinder, the closed tube it was (W67), or Allium, a choice at the head of the Light
  group. The light's colours (W92: the variant's Colours, several) and its Strength (W90: Brightness and Reach until then) are both shapes'; the card shows a cylinder's Radius and Length or an
  allium's Head radius, Florets and Floret size, never both, as the mountain's Glass shows only its cap's (W64).
- *Mine, how, for him to keep, change or drop:* **the allium is Allium giganteum's head** ('Globemaster'): the trunk
  is its bare stem, coming up into the ball from below and ending at its middle, as a scape ends where its stalks
  start; from there each floret stands on its own thin stalk out to the Head radius, spread evenly over the ball by
  the golden angle (a Fibonacci sphere) and facing out, with an opening left round the trunk. A floret is a
  six-pointed star of narrow tepals, cupped a little out of its plane so a star seen edge-on still shows its points,
  each turned on its stalk, and each tree's ball turned by its seed so no two trees' stars line up. The stars emit the
  light's colour, lit by nothing, as the tube does; the stalks and a core at seven tenths of the radius are one flat
  step deeper, the light's colour mixed half way to the trunk's, so each star stands out on the ball and the ball reads
  as a ball from afar. No gradient, glow or glass. The point light stands at the ball's middle; the florets cast
  shadows as the tube does.
- **Starts** (*mine*, at his tree's scale, a trunk 50 to 100 m long and a metre in radius): Head radius 10 m (2–40 m),
  Florets 200 (12–400), Floret size 3 m (0.5–8 m). At 90 florets the head reads as a dandelion's clock, its stalks
  in view; at 200 of 3 m the stars close into a ball, as a Globemaster's do.
- **His tree stands as it was**: his published variant, Awakening light, and every variant kept without a Shape read
  as a cylinder, the published copy and what the database holds both read over the version's starts (`SHAPE_START`,
  `configOf`). Trees is version 4; version 3 is frozen (`tree-v3.ts`, `build-tree-v3.ts`). The page's tuning is kept
  under `no-origins:orbit:trees:v4`, which reads version 3's.
- *Mine:* **what it costs**: an allium's head is one instanced mesh a tree, its floret (18 triangles) made once for
  every tree of the same head, and its core, so a tree is four draws where a tube's is three. The published world's 120
  trees as alliums of 200 florets turned on the World page at about 5 ms a frame more than as tubes here (26 and 31 ms
  in the quietest pair; 0 to 7 ms more across interleaved runs on a busy machine, headless Chromium on WebGPU). A click
  on a floret or the core picks its tree on the Sectors page, as a click on the tube did.
- Looked at (1440 × 900, signed out, the allium in the test browser alone): the trees' page as a cylinder, the same
  to the pixel as before; as an allium at 90, 160, 200 and 240 florets, far and near; the published grove as alliums
  from the World page, the Sectors page and the visitor's start (the tree's variant answered in the test browser as if
  published with Shape Allium; nothing was written); Select picking an allium by its head.
- Open, his: whether a tree's seed should vary its florets' size or count; a Cream allium is faint against the pale
  sky, as a Cream tube is. The core's size and the stalks' step are controls now (W86).

## W86. Trees: colour and height picked as a tree is placed

*W93 put the whole look on the grove, set as it is planted: its Length 1 to 100 m, its trunk's radius following the
length, Core and Stalk shade fixed at their starts.*

2026-10-15. **His**, on the allium (W85): "Yes, the inner [ball] size and the [stalk shade] become controls." Then:
"For trees, instead of us just randomly rendering random sizes, I think I will create trees with different
combinations and select colors … but not as first color, second color, third color, fourth color. I just want to
select colors from the swatch. And then while placing, then you can give me options of size." Asked how a tree's light
colour is picked, he chose **Pick it while placing**; and of its size: "Similar to tree color. But instead of multiple
selections, I will select a range. So, when placing we can just place it by choosing a size from the range. And also,
additionally I want the width of the tree to also be proportional to the height but with min and max radius."

- **Core and Stalk shade are controls** (his), in the Light group, an allium's alone: Core, the inner ball's radius
  as a share of the head's (0–0.95, starting at 0.7; 0 draws none), and Stalk shade, how far the stalks and the core
  are shaded from the light's colour towards the trunk's (0–1, starting at 0.5), the values W85 drew.
- **First to Fourth colour go** (his). **A tree's light colour is one of its variant's Colours** (W92, his; until
  then it was picked as a tree was placed, on the Sectors page, and a tree placed so keeps the one it was given).
- **A tree's height is picked as it is placed, from its variant's range** (his): Length stays a range on the variant;
  under Build a Height, a slider over the picked variant's Length, its value typed. Every tree a click places (the
  grove brush's Count) takes that colour and that height and still leans its own way by its seed: a lean is a
  direction, not a size. *Mine:* a tree stands within its variant's Length even when the range changes after it was
  placed, so the variant governs and the Picked slider shows what stands; a variant of one length shows no Height.
- **The trunk's radius follows its height, between a least and a most** (his): Radius is a range (0.5–20 m); a tree
  at the shortest of Length has the least, at the tallest the most, in proportion between. *Mine, for him to keep,
  change or drop:* **Bend radius follows the height the same way** (his: no random sizes), the shortest tree the
  least, widened as before where it would turn the tip past 120°; a variant of one length stands at the middle of
  each. The Trunk group's note says so, with how far the shortest and the tallest tree's tips turn.
- **A placed tree keeps its own**: a tree asset carries its colour and its height (`PlacedAsset`); the Sectors page's
  Picked group shows a tree's Light colour and Height, in its variant's Length, and writes them.
- **His world stands as it was**: the trees placed before this have no colour or height of their own, and each is
  drawn as version 4 drew it, its seed drawing its length and bend radius from its variant's ranges and its light's
  colour from his four of W71 (Awakening blue, Powder blush, Lavender, Cream); picked, a tree shows those until one is
  picked. A variant kept with one trunk Radius reads as a range from it to it, so Awakening light keeps its 1 m trunk.
  The trees' page shows its one tree at the middle of each range, in Awakening blue, as before. Trees is version 5;
  version 4 is frozen (`tree-v4.ts`, `build-tree-v4.ts`). The page's tuning is kept under
  `no-origins:orbit:trees:v5`, which reads version 4's but lets its one Radius go (the range starts at his tree's).
- **A click's Height is a range** (his, asked whether it should be: "Yes. I will set lowest and highest"): under
  Build, Height is one slider of two heads over the picked variant's Length, the lowest and the highest typed beside
  it, each kept within the other. Each tree a click places stands at its own height between them, drawn from its own
  seed, which the brush's seed draws, so one click is a grove of differing heights, and a single tree one height within
  it; the colour stays one pick, and a tree picked keeps its one Height. A Height kept before it was a range reads as
  the lowest. *Mine:* the Height starts at 50 to 100 m, his tree's whole Length, and the Light colour at Awakening
  blue. **Bend radius following the height stays** (his: "Keep that").
- Looked at (1440 × 900, signed out, the world in the test browser alone): the trees' page, the World page and the
  visitor's start, the same to the pixel as before, but for the card's words; a grove of twelve placed in Lavender at
  60 m among his trees, and one of them picked, showing Lavender and 60 m; one of his trees picked, showing Awakening
  blue and 75 m (its seed's length, rounded); his grove with a Radius range of 0.5–4 m (the variant answered in the
  test browser as if published), the taller trunks the wider; an allium with Core 0 and Stalk shade 1.
- His 120 trees placed before this are to be removed from his world (his), not given a colour and a height.

## W87. Pipes and roads attach to what they start on, and their joints take a way

2026-10-15. **His**, on W84: "there is no way for me to attach the pipe to other element basically let's say I want to
attach the pipe to the block which is lying down on the plane when I select the position of the pipe or like starting
point or ending point of the pipe on the block it starts on the block but the whole of the block is in the horizontal
direction so there is no way for me to set the direction of the joint of a pipe or road". Of three ways to set it, he
picked all three: out of the face clicked, an arrow to drag, and Turn and Tilt on the card.

- **Decided (his): a start or an end clicked on a block's face, or on another element, attaches there and leaves out
  of that face.** *Mine:* a pipe's way at its start is out of the face, at its end into it, so a pipe off a block's top
  rises out of it and one off its side comes out level, its middle on the point clicked. A road takes a block's side the
  same way, level, and on any top (a block's, the floor) it lies, as before. The floor itself attaches nothing: a pipe
  started on it lies on it (W84). What a click may attach to: any face of a block, a mountain, a tree, a portal,
  another pipe or road, inside the sector picked; the nearest along the pointer's line wins.
- **Decided (his): a joint has a way, set by an arrow to drag and by Turn and Tilt on the card.** *Mine:* the way is
  the way the pipe or road runs through the joint, from its start towards its end: a Turn round from north and a Tilt
  up from level, in whole degrees; a joint without one is Free and the curve decides it, as every joint did in W84.
  - **The arrow**: the picked joint shows an arrow along its way, violet where it is set, lilac where it is free (then
    it shows the way the curve runs there), its shaft and head the same few pixels however far. A press on its head
    takes hold of it: a drag aims it in the picture's plane through the joint, an Option-drag (Alt) aims it level; a
    road's is always level, its deck level from side to side.
  - **The card**: under the picked joint's X, Y and Z, Way (Free or Set), and set, its Turn (0–359°) and Tilt (−90 to
    90°, a road's −45 to 45°), each a slider with its value typed. Setting it starts from the way the curve runs there.
    The joint's Select marks each joint whose way is set.
- *Mine:* **a joint with a way is held to it**: the curve runs straight along the way for a reach either side of the
  joint before it bends (a pipe's four radii, a road's width, never more than two fifths of the way to the next joint),
  a centripetal Catmull-Rom through those points as before. A joint is still where the underside passes; a pipe's
  middle there is its radius off the joint across its way, so a pipe running level has its underside on the joint, and
  one leaving a face upright stands on the point clicked.
- *Mine:* **joints are kept to a quarter metre every way** (W84 kept them to whole metres across), so an end lands
  where it was clicked on a block's face, not at its corner; a joint's X and Z are typed in quarter metres. A pipe or a
  road kept before is read where it was. A Picked joint's way is part of the world's data with its joints.
- Looked at (1440 × 900, signed out, the world in that browser alone): in a sector of 50 m, a pipe started on a block's
  top, its start's way straight up and the pipe rising out of the block before it bends to the floor; its arrow aimed by
  a drag; its Tilt typed; a free joint set from the card at the way the curve ran there; on a stack of four blocks, a
  road started on the stack's side, leaving it level eastward and ramping down to the floor; W84's script again, every
  step as before.
- *Open, his:* whether an attached end follows what it is attached to when that moves (it does not: it is a place, not
  a link); a pipe started on the floor rising instead of lying; the reach a way is held for, as a control.

## W88. Anything moves any way, as in Blender; the first grove is gone

2026-10-15. **His**: "I am for some reason unable to move a joint or like any element in a sector in z-axis or like up
and down. I'm able to move in the horizontal plane, but not in the vertical plane." Then: "I should be able to move
anything in any direction. So, I think every element/joint in any element can have options like blender." And of the
trees placed so far: "Let's remove all the trees currently placed."

- **Decided (his): anything picked on the Sectors page moves any way**, a pipe's or a road's joint, a whole pipe or
  road, a mountain, a tree, a portal, the blocks picked, **with Blender's ways of moving**.
- *Mine, how, for him to keep, change or drop:*
  - **The move gizmo**: what is picked wears three arrows from its middle, one an axis of the world as the card names
    it, X east–west, Y up–down, Z north–south, coloured as a world whose Y is up colours them (X red, Y green, Z blue:
    the world's Raspberry, Fern and Ocean), drawn over everything and the same few pixels however far. A press on an
    arrow's outer part or its head moves what is picked along that axis alone; the middle stays what it was (a joint's
    ball to drag over the ground, an element to slide). A move keeping to an axis draws that axis's line through it.
  - **G grabs what is picked**: it follows the pointer in the picture's plane through its middle; X, Y or Z keeps it
    to that axis, the same key again lets it go free; a click or Enter keeps the move, Escape or a right-click puts it
    back, as in Blender. **Y is up here, as on the card**: in Blender Z is up, so its Z here is north–south. Whether the
    world should name its axes as Blender does, Z up, everywhere (the card, the compass, the map), is his.
  - Each moves on its own grid: a joint, or a whole pipe or road, a quarter metre every way; an element a metre across
    and a level (0.25 m) up; a block the lattice's steps, every block picked together. Each stays inside its sector,
    a block as it always did (never refused, the note says what overlaps).
  - **A mountain, a tree or a portal stands at any height** (W82 kept mountains and trees to the world's floor):
    placed, it lands on a block's top where the pointer meets one, else on the floor of the sector picked, however
    high that floor is; dragged over the ground it keeps its height; the card's Picked group types its Y beside X and Z.
    A mountain raised off the world's floor shows its foot, which the base gas hid.
  - A pipe's joint still moves up and down with Option-drag (W84), and its way with its arrow (W87), whose head now
    stands further out than the gizmo's arrows so the two are never confused.
- **Decided (his): the trees placed until now are gone.** The 120 trees of W71's grove are out of the published copy
  (`published.json`), and a world kept before, a browser's or a paste, is read without them (`grove-w71.ts`: each by
  its place and seed, so a tree placed since stays). The local database held no world, so nothing there changed; the
  hosted one, if a world was published there, still has them until it is published again without them.
- Looked at (1440 × 900, signed out, the world in that browser alone): a block's Y arrow dragged up and its X arrow
  across; a mountain grabbed with G, kept to Y, put back with Escape, then raised 22 m with Enter; a pipe's joint
  raised 14.5 m by its Y arrow; W84's script again, every step as before.

## W89. What an element takes as it is placed, and a zone's shape

*W97 put Spacing, how far apart its trees stand in metres, in place of a grove's Density.*

*W93 removed the portal, and gave a pipe, a road and a grove their whole look on the item's card.*

*W91 took the zones away: a zone's shape is now a grove's area, and a grove is placed by it.*

2026-10-15. **His:** "Let's organize what will be the variables that we can change when we are placing an element in
the sectors. Let's start with portal. For portal, color swatch, width of the rim, radius, and depth should be
configured at the time of placement, and also wall color, darkness, and reach. So when I am placing that in the
sector, the controls related to the element should be on the right. Similarly, for mountains, I just need a drop down
of variants to select from on the right. For human, we don't need any, but only variants similar to mountains. For
trees, these can be placed in a zone and I will give the inputs for density of the trees and based on the min-max
values and multi-select of variants of trees I want in that zone. So now I will also need to update zones with the
following options. I need options like allowing me to create a hollow within the shape of the zone, so that when I
place trees, I can only place them on the zone which is not hollow. And also, I need border radius for the zone, so
that I can also make it like a pill or a circle." Of the choices put to him: **T1, Z3, P1**.

- **Decided (his): what an element takes as it is placed is set on a card on the right** of the Sectors page.
- **Decided (his): a portal's look is set as it is placed**: its Radius and Depth, its rim's Width and Colour, and its
  wall's Colour, Darkness and Reach.
- **Decided (his, P1): a portal's variant keeps how it opens alone** (Response, Bounce, Ripple, Waves); its look is each
  portal's own. Portal is version 7; version 6 is frozen (`portal-v6.ts`).
- **Decided (his): a mountain takes its variant alone**, from a Select of its library; **so does a human, which is now
  placed as a mountain is** (until now it was the visitor alone, W51).
- **Decided (his, T1): trees are placed into a zone as a grove**: one asset of the zone holding Density, the lowest and
  highest its trees stand (*mine, read so:* W86's Height range; he did not say otherwise), its variants, several picked
  at once, its light colour and a seed; its trees are drawn from those and the zone's shape, so a change shows at once,
  and it is removed whole. A zone may hold more than one. No single tree of it is moved or removed by hand.
- **Decided (his): a zone has a shape**, its corners rounded as far as a pill or a circle, **and (Z3) a hollow of its
  own** inside it, its own X, Z, Width, Length and Corners, anywhere in the zone, where no tree stands. W81 gave a zone
  no size (his then); this gives it one.

What the card on the right holds while placing, by Build's Item:

| Item | Its card |
|---|---|
| Portal | Variant (how it opens) · Size: Radius (0.2–1.2 m), Depth (0.2–2 m) · Rim: Width (0.01–0.1 m), Colour · Wall: Colour, Darkness (0–1), Reach (0–2) |
| Mountain | Variant |
| Human | Variant |
| Trees | Grove: Variants (several), Density, Height (lowest–highest); its trees' colours their variants' (W92) |
| Block | Level, Width, Length, Height, Colour (*mine*: moved here from Build) |
| Pipe, Road | Variant, Joints (*mine*: moved here from Build) |

- *Mine, how, for him to keep, change or drop:*
  - **Two cards.** The Sectors card, on the left, keeps Sector, Zone, and Build's Tool and Item: where, and what; its
    Picked group went. The item's card, on the right, is named for what it shows: once something is picked, whatever
    the tool, the picked one's own (its variant, Let it go and Remove, X, Y, Z and Turn, and a portal's look, a
    grove's numbers, a pipe's joints, the blocks' shape); else, with Place, what the next Item placed takes; else, with
    Select, how to pick and the zone's blocks to pick from. Its Reset puts the next one's values back to their starts;
    Copy sends what it shows. Both cards are six cells wide (Motion.md M15); the item's stands on the right under the
    compass and the map, as the map stands under the compass; the world centres in the room between the two cards
    (the engine's `roomLeft`). On a phone the item's card stands along the top under the compass, the Sectors card along
    the bottom, and the map is not drawn on this page.
  - **The next one starts from the last set**: a portal's look and a grove's numbers changed on a picked one are also
    what the next one placed takes.
  - **A placed portal keeps its own look** (`PlacedAsset`'s `look`); one placed before W89 has none and is drawn in its
    variant's, which version 7 still reads from what was kept. The portal's page draws it in the look last set.
  - **A placed human stands still**, in its variant's Posture and Expression, facing its sector's middle (a turn round
    from north, typed on the card), a part a human, made anew only when its variant changes. The visitor is still the
    human at the start (W51). A ring 0.8 m round its feet shows where it goes and that it is picked.
  - **A zone's shape**, in the Zone group under its name: X and Width, Z and Length, a row a way as a sector's are, X
    and Z its middle from its sector's floor's middle, Width and Length a metre up to its sector's; Corners, 0 to 100%
    of half its shorter side: 0 square, 100% a pill, and a circle where Width and Length are equal, so a pill stays a
    pill as it is sized. **Hollow** is a switch; on, the hollow starts at the zone's middle at half its size with the
    zone's corners, its own X and Width, Z and Length, from the zone's middle, and Corners; a part of it outside the zone
    cuts nothing. The zone lies on its sector's floor, drawn there on the Sectors page alone by its outline and its
    hollow's, the picked zone's violet, the sector's other zones lilac, as sectors are (W81). A zone with no shape
    covers its sector's floor, square, with no hollow, and follows the sector as it is sized; a zone kept before this
    reads so, so nothing in the world moved. Its note says its shape and when part of it reaches past its sector.
  - **A grove is planted by a click on the zone's ground**, with Trees the Item, and then picked, so its card tunes it;
    Picked has Let it go, Scatter anew (another seed) and Remove, and says how many trees stand and how far apart.
    Backspace removes it, Escape lets it go; a click on any of its trees with Select picks it, and it is never dragged:
    it stands where its zone's ground is.
  - **Density is trees a hectare** (a square 100 m a side), 1 to 50, starting at 10, about 32 m apart. They stand evenly
    but never in rows: one a cell of a lattice anchored to the middle of the sector's floor, each moved off its cell's
    middle by the grove's seed, so a zone sized, moved or hollowed keeps the trees it still holds where they stood (a
    zone moved 10 m kept 16 of its 17), and a new Density is a new lattice. A tree stands only on the zone's ground,
    inside its outline and outside its hollow by half a metre, inside its sector, on its floor, and never where a block
    stands on that floor. Each is one of the grove's variants by its own draw, at its own height between the lowest and
    the highest, within its own variant's Length (W86). **A grove draws at most 500 trees** (`GROVE_MOST`): past it the
    lattice widens, and the note says it was thinned (a whole sector of 1000 m at 50 a hectare draws 494).
  - **Several variants are the system's Combobox, a chip a variant**; the Height slider runs from the least Length of
    the variants picked to the most. A picked grove keeps one variant at least. **The grove brush went** (Count,
    Spacing, Radius): the trees a brush placed before stay, each its own tree, as they were.
  - **The world's data**: a zone keeps its `shape` (`zone.ts`: `ZoneShape`, `onGround`, `outlinePoints`), a portal its
    `look`, a human is a `PlacedAsset` of kind `human`, a grove a `GroveAsset` (`hierarchy.ts`; its trees `grove.ts`).
    The world is one item in the database, its settings JSON, and the human's kind was there already, so the database
    did not change. The Sectors card is version 2, version 1 frozen (`spaces-v1.ts`).
- Looked at (1440 × 900 and 390 × 844, signed out, the world in that browser alone; nothing saved): both cards and the
  room between them; a zone made a pill 120 × 60 m with a hollow 50 × 20 m, then a circle 30 m across round a hollow of
  14 m; a grove of 30 a hectare planted on the pill's ground, 17 trees, and 7 at 10 a hectare, none in the hollow,
  outside the pill or in a block (checked by the scatter itself too); three on the circle's ring; a portal placed at
  Radius 1.2 m and Rim 0.1 m, keeping that look; a human placed facing its sector's middle (Turn 146°), picked by a
  click, its arrows on it; the portal's page with its Opening alone; World, Trees, Human and the visitor's start with
  no errors. Scripts: `e2e/.mcp/orbit-w89.mjs`, `orbit-w89-near.mjs`, `orbit-w89-pages.mjs`.
- *Open, his:* whether a zone's shape also holds what else is placed in it (blocks, mountains, portals and humans stand
  anywhere in their sector, as before); a zone turned; the 500 trees a grove may draw; **the room the two cards leave**: at 1440 px with the sidebar open about
  320 px of world stand between them, so a sector is framed from about twice as far (the sidebar folded gives more);
  on a phone the two cards leave little of the world in view.

## W90. A light's Strength, in place of Brightness and Reach

*The trees' light went with W93 (a flower lights nothing); the mountain's neck light keeps its Strength.*

2026-10-15. **His:** "we can replace reach and brightness with strength", once Brightness and Reach were explained to
him (Brightness how strong a light is, Reach how far it goes before it is gone), then "yes and also implement".

- **Decided (his): a light has one Strength** where it had Brightness and Reach: the trees' light (Trees, version 6)
  and the mountain's neck light (Mountain, version 14). The human's torch and boost had a Brightness alone, which is
  now called Strength.
- *Mine, how, for him to keep, change or drop:*
  - **A light's reach follows from its Strength.** Its light weakens with the square of the distance and ends where it
    has faded to a twentieth of the world's sun (strength 2): √(10 × Strength) metres (`strength.ts`: `FAINT`,
    `reachOf`). 150 reaches about 39 m, 500 about 71 m, 1000 about 100 m, 5000 about 224 m. Each light's group says how
    far its light reaches now. The glow in a mountain's glass head spreads over the same reach.
  - **What is lost**: a bright light with a short, sharp edge. A light that is brighter close by also reaches further.
  - **His variants keep their values**: each one's Strength is the Brightness it was saved with. The settings keep
    their names (`lightBrightness`, `lightPower`), so the copy, the database and a browser's tuning read as they were,
    and the Reach each kept is let go. A tree's light kept at Reach 0, which gave no light, reads as Strength 0.
    **So his lights now reach as far as their Strength takes them, not as far as he set them**:

    | His | Strength | Reach he set | Reaches now |
    |---|---|---|---|
    | Mountains 1, 4, 5 | 500 | 30 m | 71 m |
    | Mountain 2 | 750 | 55 m | 87 m |
    | Mountains 3, 7, 8 | 150 | 30 m | 39 m |
    | Mountain 6 | 250 | 55 m | 50 m |
    | Awakening light (tree) | 5000 | 100 m | 224 m |

  - **The torch and the boost reach as far as they did** (60 m and 20 m, fixed in code); their values do not change,
    so Human stays version 5.
  - Trees version 5 is frozen (`tree-v5.ts`, `build-tree-v5.ts`), and so is Mountain version 13 (`mountain-jig-v13.ts`
    with its profile and its neck, body, algae and world-base builders). No store key changes.
- Looked at (1440 × 900, signed out, in the test browser alone; nothing saved): the trees' page, Version 6, its Light
  group's Strength 5000 and no Reach, its note "reaches about 224 m"; the mountain's page, Version 14, its Neck light's
  Strength 500 and Bulb size and no Reach, "about 71 m"; the human's Torch, its Strength.
- *Open, his:* where a light ends (a twentieth of the sun); whether the torch's and the boost's reach should follow
  their Strength too.

## W91. No zones: elements are placed in a sector, and a grove by an area seen under the pointer

*W96 stands a grove's trees on whatever is under them, a block, a mountain, a pipe or a road, not its sector's floor.*

2026-10-15. **His**, on W89: "A zone will not have a shape. As I said, a zone is just collection of elements. You know
what? Actually, let's even remove zones. We'll only have sectors, and inside sectors, I will place the elements." And:
"when I selected trees to place, I don't understand where I can place it … So just like how I see a placeholder when
I'm placing a portal, similarly when I select trees to place, give me dimensions to set and once I set the dimensions I
should see that placeholder with that dimension so that I will know where I am placing." And: "The grove for trees
should allow me to select multi-colors so that we can randomly distribute these colors on the trees that are placed."

- **Decided (his): there are no zones.** A sector holds what is built and placed in it, blocks and elements; habitats
  and ecosystems stay set aside (W81). The Sectors card is version 3, its Zone group gone; version 2 is frozen
  (`spaces-v2.ts`).
- **Decided (his): trees are placed by dimensions he sets, their placeholder under the pointer.** With Trees the Item,
  the item's card holds the grove's **Area**, Width and Length, and its outline follows the pointer over the sector's
  floor, as a portal's ring does; a click plants the grove there.
- **Decided (his, said to the other session at 17:50, which builds it as W92): a tree's light colours are its
  variant's**, several picked on the Trees page, each tree lit one of them; so a grove has no colour of its own, and
  its card no Light colour. His words here asked for the colours on the grove; his later words there put them on the
  variant, and the two sessions built only that.
- *Mine, how, for him to keep, change or drop:*
  - **What a zone held is its sector's** (`sector` on every asset), standing where it stood; a zone's name went with
    it. A sector's entry (W25), a zone, went too. A new sector still starts with one block at its middle (W24's
    default, his then for the zone). A world kept before (his published copy, a browser's, a paste) reads so, nothing
    moving: his published world is one sector holding the start's block and the eight mountains.
  - **The grove's area keeps W89's corners and hollow** (his then, for the zone: "border radius … like a pill or a
    circle", "a hollow … so that when I place trees, I can only place them on the zone which is not hollow"): Corners,
    0 square to 100% a pill or a circle, and Hollow, a switch, with the hollow's own X and Width, Z and Length and
    Corners from the area's middle. They are one switch and one slider each from going, if he wants dimensions alone.
    A new grove's area is 60 m square (`AREA_START`), and the next starts from the last set.
  - **The placeholder** is the area's outline and its hollow's, lilac, on the floor under the pointer, its middle on
    the whole metre the click would plant it at; the grove planted is picked, its outline violet. Both are drawn after
    the floor's base gas, which painted over a line that near the floor before (why W89's outlines of zones and picked
    groves could vanish).
  - **A grove moves whole**: its trees stand on a lattice anchored to its own middle, so a drag on any of its trees, its
    X and Z arrows (it has no Y arrow: it stands on its sector's floor) or its X and Z typed on its card carry every tree
    with it, a whole metre a step. Sized or hollowed, it keeps the trees it still holds where they stood.
  - A grove of W89, kept in a zone, takes its zone's shape as its area, and one in a zone with none its sector's whole
    floor; its one light colour is let go.
  - **The item's card never covers the Sectors card**: it is six cells wide where there is room on the right, and on a
    narrower screen it narrows to the room left (at 1024 px, 308 px wide). Folding the sidebar to its icons gives the
    world more room between them.
  - The design system's ColourPicker picks several (`multiple`, never none), for the variant's colours (W92).
- Looked at (1440 × 900, 1280 × 720, 1512 × 945 and 1024 × 700, signed out, the world in that browser alone; nothing
  saved): the Sectors card with Sector and Build alone; a new sector holding its block; Trees with an area of 80 × 40 m
  at 100% corners, its outline under the pointer (60 m square before it was set), planted with a click where it showed
  and picked; its X typed 20 m east; a hollow switched on; a click on one of its trees picking it with Select, and a
  drag on that tree carrying the grove 26 m east and 11 m south, outline and all; the two cards at each size, apart.
  Old worlds read by a script: his published one (an ecosystem, a habitat, a sector, a zone, 9 assets) as one sector
  holding all 9; a W89 world's grove taking its zone's pill and hollow. Scripts: `e2e/.mcp/orbit-w91.mjs`,
  `orbit-w91-ghost.mjs` (the canvas's `data-ghost` says where the next click would place).
- *Open, his:* whether the grove's area keeps its corners and hollow; whether a grove may pick its own colours as well
  as its variants' (W92); the hosted database's published world still holds zones, read as above until it is
  published again.

## W92. Trees: a variant's light colours, several

*W93 moved the Colours from the variant to the grove (no variants): each tree is still one of them, by its seed.*

2026-10-15. **His**, of the trees' light: "I don't see color swatch and … I should be able to select multiple colors in
the swatch. So that it becomes part of the variant. And … when we are rendering them, we can pick the colors from the
selected set of colors from the swatch." Minutes before, of a grove (W91): "allow me to select multi-colors so that we
can randomly distribute these colors on the trees that are placed"; read with this, the later and the more particular,
the colours are the variant's, and a grove holds none (W91).

- **Decided (his): a variant holds its light's colours, several.** On the trees' page, the Light group's Colours: the
  light's swatches (Awakening blue beside the world's colours, a family a row), each one pressed picked, pressed again
  let go, the last one kept, so a variant always has one; the picked ones are named after the label. W86's "a variant
  holds no light colour" is undone.
- **Decided (his): each tree is lit one of its variant's colours**, drawn as the tree is drawn. *Mine:* by the tree's
  own seed (`treeOf`), so the same tree is the same colour every time it is drawn, and a grove mixes them about evenly
  (two thousand trees of his four: 500, 499, 502, 499); a colour picked or let go draws them again.
- *Mine, for him to keep, change or drop:*
  - **A grove holds no colour** (W91): its trees take their variants', so a grove of two variants mixes both sets, each
    tree from its own variant's.
  - **A tree given a colour as it was placed keeps it** (W86's brush, a pick a click): it was his pick. A tree placed
    with neither a colour nor a height (before W86) draws from its variant's set as any tree does.
  - **His tree's colours are the four he kept**: Awakening light was published with First to Fourth colour (W71:
    Awakening blue, Powder blush, Lavender and Cream), and those are its set, in the swatches' order: Awakening blue,
    Cream, Powder blush, Lavender. A variant saved since version 5, which kept none, reads his four (the jig's start).
    Kept, the colours are hexes, each once, in the swatches' order (`coloursOf`); none at all reads as the start.
  - **The trees' page draws its one tree in the first colour** (Awakening blue, for his), and the Light group's note
    says how many it has.
  - `jig.ts` has a control of several colours (`colours`, `ColoursControl`): the design system's `ColourPicker`, its
    several-picked mode (`multiple`, added the same hour for W91), each picked one's name in Copy. Trees is version 7;
    version 6 is frozen (`tree-v6.ts`); its builder did not change. The store key stays `trees:v5`.
- Looked at (1440 × 900, signed out, in the test browser alone; nothing saved): the trees' page, Version 7, Colours
  naming Awakening blue, Cream, Powder blush and Lavender and those four pressed, its tree lit Awakening blue; Awakening
  blue let go, the tree lit Cream and the note saying three; Lime added, then all but Lime let go and Lime pressed again,
  Lime kept; a grove of his variant, 160 m a side at 40 a hectare (100 trees), seen close, its lights the four mixed; no
  errors. Scripts: `e2e/.mcp/orbit-tree-colours.mjs`, `orbit-tree-colours-grove.mjs`.
- *Open, his:* whether the trees' page should stand a tree a colour rather than the first alone; whether a brush tree's
  own colour should give way to its variant's.

## W93. Sectors hold blocks and elements, each set as it is placed; the portal goes

*W98 let a grove's flowers be several Shapes, each tree one of them by its own seed.*

2026-10-15. **His** ("a detailed reconstruction and review of the Cinema Studio, the orbit"; it is Orbit's builder):
"In terms of Spaces, we will only now have Sectors. Sector: A sector will have Length, Width and Height. A sector will
hold elements in it." "Block: A block is a simple basic block. It will have length, width, height, rotation, color and
texture. These will be decided while they are being placed in the sector. The min and max for length, width and height
should be 1 m/cm to 100 m/cm." "Mountains will remain as what we currently have. We will place the mountains in
sectors." "Pipes will have Color and Radius. The way we create pipes is by placing start and then the sub sequent
joints. The pipe will take share as we place the points. Let's remove Portal because Pipes can be portals now. And
there will be no motion." "Roads will have color, start and end similar to Pipes, width and thickness." "Trees will
have trunk and flower. Trunk will have min and max lenth - from 1m to 100m, color and bend radius. Flowers will now be
Cube, Cylinder and Allium. They will not have lights. They will just have colors. The sizes of the flower should be
derived from size of trunk." "Human remains as is." Of four questions put to him, his picks: a block's sizes **1–100
with a m/cm switch**; its textures **Smooth and Grain**; a pipe's, a road's and a tree's look set **as they are placed,
like a block**; its rotation **any axis, as in Blender**.

- **Decided (his): Spaces is Sectors alone**, each with its Width, Length and Height (W81's, 50 to 1000 m), holding what
  is built and placed in it. Nothing changed here: W91 had already taken the zones.
- **Decided (his): a block has a width, length and height, a rotation, a colour and a texture, all set as it is placed.**
  - **Its sizes are 1 to 100 each way, with a unit switch, metres or centimetres** (his pick). *Mine:* one Unit for the
    block, so all three are in it; a switched Unit keeps the numbers (50 m becomes 50 cm); whole numbers.
  - **Its texture is Smooth or Grain** (his pick): Grain wears the Sectors card's Grain (W81's, how strong and how
    fine); Smooth is its colour alone. *Mine:* a new block starts Grain, as every block was grained until now.
  - **It turns any way, as in Blender** (his pick): Rotation's X, Y and Z on the card, −180 to 180°, turned round Y,
    then X, then Z of its own (three.js's `YXZ`); and **R** in the world: the blocks picked turn round their middle (one
    block's own, several round theirs, as Blender's median point), following the pointer round it on the screen, round
    the line of sight, or with X, Y or Z round that axis of the world (again lets it go), Control or Command for 5°
    steps; a click or Enter keeps it, Escape or a right-click puts it back, their outlines showing where the turn has
    them.
- *Mine, how, for him to keep, change or drop:*
  - **A block lands flush on what the pointer meets**, a block's face (turned or not), a mountain, a tree, a human, a
    pipe or a road, or the sector's floor: its middle out along the face's way by as far as it reaches that way,
    however it is turned (`landing`). On a face square to the world its sides across the face keep to its step (W4's
    corner on the lattice: a quarter metre for a block in metres, a centimetre for one in centimetres); G and the
    arrows move it by the same steps. Its middle must stand inside the sector picked; a block reaching past it, or
    into another, is never refused: the card says so (overlaps are found turned or not, `overlapsOf`). The lattice of
    W4 went, and with it the Level a block was placed on: G or the Y arrow raises a block, and a block on a block's top
    stands on it.
  - **A block's place is its middle**, in metres from its sector's floor's middle, to the millimetre; the card types X,
    Y and Z of it. The picked block's card has Picked (which, X, Y, Z), Block (Unit, Width, Length, Height, Colour,
    Texture) and Rotation (X, Y, Z); a change goes to every block picked, each keeping the rest of its own.
  - **A new sector's block is the default block as it was**, 100 × 100 × 25 cm, in Sand, grained, now centred on the
    floor's middle.
  - **A world kept before reads as it was**: a block on the lattice a metre or less every way is the same block in
    centimetres (his published world's one block is 100 × 100 × 25 cm, exactly); one bigger is in metres, each way to the
    nearest whole metre, standing on the floor it stood on, so a block 0.5 m or 2.5 m high reads 1 m or 3 m high.
- **Decided (his): mountains stay as they are, placed in sectors; so does the human.**
- **Decided (his): a pipe has a Colour and a Radius, and is made by placing its start and then each joint after; it
  takes shape as the points are placed.**
  - *Mine:* with Pipe the Item, each click puts a joint where the pointer meets (attaching to a face as W87's start and
    end did: the start's way out of the face clicked, the last's into it, every joint between free). From the second
    click it is kept in the world and picked, and the pipe runs from its last joint to where the pointer would put the
    next, its skeleton drawn over it, the last joint larger. **A click on the last joint (so a double click), Enter or
    Escape ends it**, kept as drawn and picked, its joints to take hold of as W84's were; Backspace while drawing takes
    the last joint back; another Item, Tool or sector ends it too. At most 32 joints (`JOINTS_MOST`). W84's two clicks
    and Joints count went.
  - **Its look is its own** (his pick), Colour and Radius (0.25 to 20 m) on the item's card, the picked one's changed
    there, the next starting from the last set. Gloss went: a pipe is as glossy as version 1 started (0.3).
- **Decided (his): the portal goes; pipes can be portals now, and there is no motion.** The Portal left the Items, its
  page and the sidebar (`/build/portal` leads to Sectors), the engine draws none and its opening and flight went, the
  map lost its rings, and a portal kept in a world is let go. *Open, his:* what a pipe as a portal does (a way through
  to another sector, or to an app).
- **Decided (his): a road has a Colour, a Width and a Thickness, and is made as a pipe is.** *Mine:* its lines (edges
  and a dashed centre line, W84's, mine) went with the list he gave.
- **Decided (his): a tree is a trunk and a flower.** Trees are planted as a grove (W91), and the whole look is the
  grove's, set on the item's card as it is planted (his pick):
  - **Trunk**: its Length, shortest to tallest, 1 to 100 m (the grove's, each tree at its own height between); its
    Colour; its Bend radius. *Mine:* the Bend radius is the tallest tree's, and each shorter one bends on its share of
    it, so every tree of a grove is the same shape at its own size (W86's "bend follows the height", his "Keep that"),
    from its foot (his tree bent from its foot; Bend starts went), widened so a tip turns at most 120° (W68's).
  - **Flower**: its Shape, **Cube, Cylinder or Allium**, and its **Colours**, several, each tree one of them by its seed
    (W92's). **No light** (his): a flower is a plain colour lit by the sun as the trunk is, and lights nothing (the
    trees' point lights and Strength went).
  - **Every size follows the trunk's length** (his), *mine, at his tree*, Awakening light, at its middle length, 75 m:
    the trunk's radius 1/75 of its length (his 1 m); a cylinder 0.08 of it in radius and 0.027 long (his light, 6 m and
    2 m, a disc); a cube 0.16 a side (as wide as his cylinder); an allium's head 0.133 in radius (his 10 m), its florets
    three tenths of the head across, 200 of them, its core seven tenths, its stalks and core shaded half way to the
    trunk's colour (W85's and W86's starts). Florets, Core and Stalk shade are no longer controls; the trunk's Radius
    range (W86, his) went with "derived from size of trunk", the radius following the length.
  - A grove starts from his tree: Pale sage, a bend radius of 360 m, a cylinder in his four colours, 50 to 100 m.
  - A grove or a tree kept with variants reads in its (first) variant's look; a tree placed alone before groves keeps
    its own colour and height.
- **The pages of the portal, the trees, the pipes and the roads went** (their looks are set as placed): the sidebar's
  Elements are Mountains and Human; the old addresses lead to Sectors. Their libraries are no longer read; the
  database keeps their items, and nothing in it changed. Versions: Sectors 4 (`spaces-v3.ts` frozen), Trees 8
  (`tree-v7.ts`, `build-tree-v7.ts`), Pipes 2 (`pipe-v1.ts`), Roads 2 (`road-v1.ts`), the skeletons' builder
  (`build-skeletons-v1.ts`) and the blocks' (`build-blocks-v4.ts`). The builder's state is kept under a new key
  (`no-origins:orbit:build:v4`), since version 3's block numbers would read as a centimetre block.
- **Decided (his): on the Sectors page, V is Select and P is Place** (his: "In orbit, Spaces > Sectors, key "v" is for
  select and "p" is for place"). *Mine:* a key does what a click on Build's Tool does, so a pipe or a road being drawn
  ends as it does on another Tool; like G and R, never while a field or a control on the card has the focus, nor with
  Command, Control or Option held, nor during a move or a turn. The Build note names both keys.
- Looked at (1440 × 900, signed out, the world in that browser alone; nothing saved): the four old addresses leading
  to Sectors; a block of 10 × 6 × 4 m turned 30° placed on a sector's floor, and a 1 m cube landing on its top (its
  middle 4.5 m up); R round Y by the pointer (30° to 180°), X 45° typed; a pipe of four joints drawn and ended by
  Enter, a road ended by a double click, Backspace taking a joint back while drawing; a grove of each flower, seen
  near (alliums of florets in his four colours, cylinders as discs, cubes); a 12 m cube turned and a 10 × 4 × 2 m slab
  tilted round X and Z; an old world (a zone, lattice blocks, a pipe, a road and a grove of variants, a portal, two
  trees alone) read as above; every Orbit page drawn with no errors. The rotation's axes match three.js's `YXZ`.
  Scripts: `e2e/.mcp/orbit-w93.mjs`, `orbit-w93-look.mjs`, `orbit-w93-old.mjs`, `orbit-w93-pages.mjs`.
- *Open, his:* a Unit for each measure (a 10 m slab 50 cm thick cannot be made with one); R for a mountain or a human
  (they keep their Turn on the card); whether a block is an Element with a page of its own (it is an Item alone); a
  rotate gizmo on the block beside the move arrows; near the floor the base gas whitens blocks and pipes seen from a
  sector's framing distance.

## W94. A pipe's ends, each with its face or open

2026-10-15. **His**: "I want option to delete face of pipe at start and/or end".

- **Decided (his): either end of a pipe can lose its face.** Start face and End face, two switches on the item's
  card, on as a pipe starts; a pipe kept before reads closed at both ends. The picked pipe's are changed there, and the
  next pipe drawn starts from the last set, as its Colour and Radius do.
- *Mine, for him to keep, change or drop:* **an open pipe is lined**: its inside, seen through an open end, is its
  colour in a darker shade (three tenths of it, a stepped shade, not a gradient), so the opening reads as hollow; a pipe
  closed at both ends has no lining, its inside never seen. The two switches share a row, under Colour and over Radius.
  Pipes 3; nothing is frozen, since version 2 is version 3 closed at both ends.
- Looked at (1440 × 900, signed out, the world in that browser alone; nothing saved): a pipe of radius 4 m drawn, each
  face switched off and on, the card's note saying which ends are open, the look kept over a reload; its end seen near,
  closed and open, from the same place. Script: `e2e/.mcp/orbit-pipe-faces.mjs`.
- *Open:* near the floor the base gas whitens the inside floor of an open pipe lying on it (W93's open note).

## W95. A pipe subtracted from blocks

2026-10-15. **His**, of a pipe with its start face off and its opening flush with a block's top face: "the face doesn't
show the hole. So, I need option to subtract while I select two items at once using cmd."

- **Decided (his): a pipe and blocks picked together, with Command, can be subtracted.** With Select, a Command-click
  (Shift or Control too) on a pipe while blocks are picked, or on a block while a pipe is picked, keeps both picked; the
  item's card then shows Subtract over the pipe's groups, its two icon actions Subtract (the pipe from the block, or
  from every block picked) and Put back whole.
- *Mine, how, for him to keep, change or drop:*
  - **The pipe cuts the block and stays**, as Blender's Difference with the cutter kept in view: nothing of the block is
    drawn inside the pipe, so the pipe's own tube is the hole's side, and an open end flush with a face opens it. A pipe
    only touching a block cuts the face under its end alone (a centimetre's slack past a flat end, so a face flush with
    it opens); seen down that pipe, the block's inside shows, in the shade the pipe's lining has.
  - **The cut is live**: the block keeps the pipe's id (`cuts`), not a shape, so the hole follows the pipe as its
    joints move or its radius changes; a pipe dragged whole shows its hole where it is let go. A pipe removed cuts
    nothing, and a block whole again has no `cuts`.
  - **Only a pipe cuts, and only a block is cut** (his case); a road, a block or an element subtracted is his call.
  - **Drawn, not built**: the block's faces are kept and the cut is its shader's, from the same points the pipe's tube
    is made through, a little inside its radius so no sliver of the block shows; at most 128 lengths of pipe a block
    (a longer run through one block is thinned).
- Looked at (1440 × 900, signed out, this browser's world alone; nothing saved): a 20 × 20 × 10 m block and a pipe of
  radius 3 m, its open start flush with the block's top face, running down inside it and out of its east side; the
  block picked from the card and the pipe Command-clicked, Subtract: the top face opens onto the pipe's dark inside;
  the same view with the block whole, closed; the pipe's start moved 4 m west, the hole with it; the cut kept over a
  reload; WebGPU and WebGL 2 alike. Scripts: `e2e/.mcp/orbit-subtract.mjs`, `orbit-subtract-webgl.mjs`.
- *Open, his:* a click into a hole lands on the block's face as if it were whole; Backspace with a pipe and blocks
  picked removes the pipe alone.

## W96. A grove's trees stand on any surface

*W99 stands them on the ground of the space the grove was planted in, not the topmost surface: a block over it is not
climbed.*

2026-10-15. **His**, asked whether trees could be placed on a block: "I should be able to place trees any surface".

- **Decided (his): a tree stands on whatever is under it.** A block's top, turned or not, a mountain, a pipe, a road,
  or the sector's floor where nothing stands. W91's "it stands on its sector's floor" goes, and so does the code's
  keeping trees off the blocks on that floor (never written here): a grove over a block plants the trees over the
  block on its top.
- *Mine, how, for him to keep, change or drop:*
  - **Seen from above.** Each tree drops straight down its own column and stands on the topmost surface there, so a
    grove drapes over whatever its area covers, and a tree at a block's edge stands on the block or beside it, never
    in it. Where that topmost surface rises over the sector's top (a mountain taller than the room), no tree stands
    there, rather than one inside the mountain. So nothing is planted under a roof or an overhang, and a sector
    stacked under another's blocks loses the trees those blocks cover.
  - **What counts as a surface**: blocks, mountains, pipes and roads. Not a human, not another grove's trees, and not
    the pipe or road still being drawn (the trees land on it once it is ended).
  - **The outline drapes too**: the placeholder under the pointer and the picked grove's outline lie on the same
    surfaces the trees stand on, a point every metre, so the outline shows where the trees will land. The placeholder
    follows the pointer over a mountain, a pipe or a road too, not only a block's top or the floor.
  - **A grove keeps no height**: its middle is still X and Z, and its trees land again whenever what is under them
    changes (a block placed, moved or turned, a mountain moved, a pipe reshaped). While the grove itself is dragged
    its trees slide at the heights they stood at, and land where it is let go. Its gizmo stands on the surface under
    its middle, X and Z alone.
  - **Fast enough to land 500 trees**: blocks are met as boxes; a mesh's triangles are sorted into 2 m columns the
    first time a tree or the outline looks over it, so a tree reads only the triangles of its own column.
- Looked at (1440 × 900, signed out, this browser's world alone; nothing saved): a 120 m sector holding a 24 × 24 ×
  10 m block, a 20 × 20 × 4 m block turned 18° round X and 30° round Y, a road cresting at 6 m and a pipe of radius
  4 m on the floor; the placeholder hovered over each reads its height (the block's top 10 m, the turned block's
  10.1 m, the road's crest 7 m, the floor 0 m), and a 100 m grove planted over the block stands its trees on both
  blocks' tops, the pipe, the road and the floor, its outline climbing over the block and the pipe. His mountain 5
  in a sector 300 m high: the placeholder over it reads 167 m, and the grove planted there stands trees on its glass
  head and down its slopes. Scripts: `e2e/.mcp/orbit-w96.mjs`, `orbit-w96-mountain.mjs`.
- *Open:* the item card's count of a grove's trees reads the blocks alone, so it also counts trees under a mountain,
  pipe or road that rises over the sector's top, which are not drawn.

## W97. A grove's Spacing, in place of its Density

2026-10-15. **His**, of a grove of 12 × 8 m planted on a block's top: "I'm unable to figure out how to place trees. I
clicked on Scatter anew and nothing worked." At 10 a hectare its trees stood about 32 m apart, so the area held none;
at the most, 50 a hectare (14 m apart), it still mostly held none, and each click planted another empty grove (17 in
his sector). Of five ways (Spacing, a Count, a wider Density, at least one tree, spacing following the trees' size),
his pick: **1, Spacing**.

- **Decided (his): a grove's trees are set by how far apart they stand**, Spacing, 1 to 50 m, in place of Density
  (W89's trees a hectare). A 12 × 8 m grove at 2 m holds about 24 trees; a 200 m one at 30 m about 44. The trees still
  stand one a cell of a lattice anchored to the grove's middle, so a grove sized or moved keeps the trees it holds where
  they stood; past 500 trees the lattice still widens, and the card says so.
- *Mine, for him to keep, change or drop:*
  - **Whole metres**, marked every 10. A grove kept with a Density reads as the Spacing it stood at (100 m over the
    square root of the Density, rounded): 10 a hectare is 32 m. The next grove starts at 32 m, the old start's, so the
    starting grove is unchanged.
  - **No empty grove is planted.** The next grove's card says how many trees it will hold at its Spacing, and when it is
    none it says why and what to change; a click then plants nothing. (A grove's count is its area's alone; one planted
    where little of it is inside its sector, or over something rising past the sector's top, may hold fewer.)
  - **Empty groves can be cleared.** The Sector's note says how many of its groves hold no trees, and the Sector's
    actions gain Remove the empty groves, asking first; a grove with no trees cannot be clicked to pick it.
- Looked at (1440 × 900, signed out, this browser's world alone; nothing saved): a 12 × 8 m grove (corners 100%) at
  32 m over a 24 m block: the card says no tree fits and why, and a click on the block plants nothing; Spacing typed
  2 m, the card says 19 trees, and a click plants 19 on the block's top inside the outline. Three groves kept before
  W97 (a Density of 10, 12 × 8 m) read as 32 m and empty: the Sector's note says so, Remove the empty groves (3) asks
  first and leaves the one grove with trees, then stands disabled. Script: `e2e/.mcp/orbit-w97.mjs`.

## W98. A grove's flower Shapes, several

2026-10-15. **His**: "While planting trees, I should be able to multi select flower shapes."

- **Decided (his): a grove's flowers may be several shapes**, Cube, Cylinder and Allium, any of them picked together, on
  the item's card as it is planted and once it is picked; each tree is one of them.
- *Mine, for him to keep, change or drop:*
  - **Each tree is one shape, drawn by its own seed**, as its colour is (W92), each picked shape as likely as the
    others. The draw is apart from the colour's, so shapes and colours mix freely (a cube is not always the first
    colour), and a tree's colour stays what it was. Scatter anew draws both again.
  - **The control is the design system's toggle group, several pressed** (Shapes, in the Flower group, in the order
    Cube, Cylinder, Allium), never none: the last one pressed stays pressed. The picked ones are named after its label,
    as the Colours are, and its row is a control's height, 36 px.
  - A look kept with one Shape reads as that shape alone, so every grove planted before stands as it did. Trees 9;
    nothing is frozen, since version 8 is version 9 with one shape.
- Looked at (1440 × 900, signed out, this browser's world alone; nothing saved): the next grove's Shapes, Cylinder
  pressed, Allium and Cube pressed beside it, the three named after the label; let go down to Allium, which then stays
  pressed; a 40 m grove at 4 m planted with all three, 94 trees of cubes, cylinders and alliums in its four colours; a
  grove kept with one shape still read. Script: `e2e/.mcp/orbit-w98.mjs`.

## W99. A grove stays at the height it was planted

2026-10-16. **His**, planting on a block 100 m under another: "when I'm trying to place trees in the below block, the
area outline is going up to the upper block. Fix it." W96 stood each tree on the topmost surface of its column (mine),
so under the upper block the outline and the trees went up onto it.

- **Decided (his): a grove planted on the lower block stays on it**; the block over it is not where its trees stand.
- *Mine, how, for him to keep, change or drop:*
  - **A grove keeps the height it was planted at**: where the pointer met its middle, kept as its Y over its sector's
    floor (a grove kept before reads as planted on the floor). Dragging it or typing its X and Z keeps its Y.
  - **Each tree stands on the ground of the open space at that height**: down its column to the highest top under that
    height (so at a block's edge it drapes down to the floor below), or, where something stands in the way at that
    height (a block on the block, a mountain's slope), up onto that thing's top. Nothing over open air is climbed, so a
    roof or an overhang no longer takes the trees; a tree whose top would be over the sector's top is not planted.
  - **The same rule draws both outlines** and stands the gizmo, so the outline shows where the trees will be.
  - A surface faces up or down by its triangles' winding (a pipe's lining by its inside), which is how a column knows
    it is inside a mountain or a pipe; a block is met as a box.
- Looked at (1440 × 900, signed out, this browser's world alone; nothing saved): a 40 m block 10 m high and another 40
  m block from 110 to 120 m over most of it, a pipe hanging between; the outline hovered on the lower block where the
  upper does not cover it lies on the lower block and drapes down its edge to the floor, none of it on the upper block;
  planted there (Y 10 m), its 94 trees stand on the lower block, those under the upper block too. W96's script again:
  the block's top 10 m, the turned block's 10.1 m, the road's crest 7 m, the floor 0 m; his mountain 5's grove planted
  at 123 m where the pointer met it. Script: `e2e/.mcp/orbit-w99.mjs`.

## W100. Two cameras, View and Character, and a glide between them

2026-10-16. **His:** "Now when I'm in the world, I want to transition between character camera and view camera."

- **Decided (his): in the world there are two cameras, and he moves between them.** *Mine, read from his words:* the
  **View** camera is the eye in the helmet (W69, his "1 view camera inside the head of the character"), and the
  **Character** camera is one that sees the figure. If he meant otherwise (a free camera, say), this is to change.
- *Mine, how, for him to keep, change or drop* (Camera version 13; version 12 frozen, `camera-v12.ts`):
  - **C switches them**, on every view that is the visitor's (`/`, the camera's page, the map's); on the camera's page
    the card's **Switch › Camera** (View · Character) shows which and switches too. The world opens in the View camera,
    as before. At `/` C keeps nothing, and a reload opens in the camera the settings name; on the camera's page it sets
    the card's Camera, as a drag sets its Turn, so saving and publishing there is what makes the world open in one.
  - **The camera glides** from where it is to the other, turning as it goes, on a spring: **Response** (200–2000 ms;
    700) and **Bounce** (0–0.9; 0). Going out, it leaves the head backwards and up to stand behind the figure; going
    in, it comes down into the head. The air through the visor clears, or comes back, with it (W78's Clear air and
    Haze). Under reduced motion it is there at once.
  - **The Character camera** stands behind the figure the way you look (View's Turn), **Distance** (1–40 m; 6) off a
    point **Looks at** (0–4 m; 1.8, the shoulders) over its feet, looking down its own **Angle** (−20° to 80°; 15°), so
    the figure stands a little under the view's middle. W A S D go by its way, as in the helmet; the figure faces the
    way it walks, so S walks it towards you. With Steering's Drag on Look a drag goes round the figure, across and up
    and down within the Angle's range (Slide still slides over the ground); A and D on Turn turn it round the figure.
  - **Into the helmet, the eye looks the way the figure faces**, so its body does not swing round to the camera's way;
    out of it, the camera goes behind the figure the way the eye looked.
  - Without a head (Shows: Skeleton) it is the Character camera, in place of version 9's camera standing back by
    View's Height and Angle. **View's Height went from the card**: it moved nothing in the helmet, and nothing else
    used it.
- **On the World page too** (his, asked where he had pressed C and what it should switch between: the World page, and
  "Both", the builder's camera and the two cameras): *mine, how:* C steps in a camera at a time, **from the builder's
  camera down to the Character camera, into the helmet, and back up to the builder's camera** where it was, its lens
  too; Escape goes straight back up. Going down, the camera flies down behind the human placed nearest the point the
  builder's camera looked at (below); from there it is walked as at `/` (W A S D,
  a drag round it, the map), with the world as the page draws it, the sectors' edges included. Going back up, the
  human stays where it was walked to until the camera is there, then stands where it was placed again (walking it
  moves nothing kept), and the builder's camera is the hand's again. All on the Switch's spring. Open, his: the
  Sectors page (a click there builds, so on foot it would build as he walks).
- **The visitor walks as the human placed** (his: "I haven't placed the human character at the bottom in the world. I
  placed one in one section. But I see that along with another one in the world. Remove the one that I did not
  place."): the figure on the floor was the visitor's own, the start's (W51), drawn beside his. Now the visitor is a
  human placed in the world, in its variant's look and gait, standing where it was placed, at its height, facing its
  way, and that human is drawn once. *Mine:* on the World page C goes to the one placed nearest the point the builder's
  camera looks at, and with none placed C does nothing (the card says so); on the visitor's views (`/`, the camera's
  page, the map's) the visitor starts as the first placed in the world; a world with none (the published one, so far)
  keeps the start's figure on the visitor's cell, since a visit needs someone to walk as. How it stands on what is
  built is W101.
- Looked at (1440 × 900, signed out, a fresh browser; nothing saved): from the helmet, C pulls the camera out through
  the back of the head to stand 6 m behind the figure, the figure whole a little under the middle; W runs it ahead,
  the camera following; a drag goes round it to show its side; C again glides back in, the eye looking the way the
  figure faces, the rim round the view. On the camera's page C sets the card's Camera to Character, and picking View on
  the card glides back in. On the World page, C flew the builder's camera down to the figure at the world's middle, W
  ran it, C went into the helmet, C flew back up to the builder's view, the same to the pixel, and a drag then went
  round as before; C and Escape the same. Scripts: `e2e/.mcp/orbit-camera-switch.mjs`, `e2e/.mcp/orbit-world-on-foot.mjs`.
- Open, his:
  - Whether the Character camera should see through the same clear air as the visor: it sees the world's air, as every
    view but the helmet does, so the mountain ahead is washed pale behind the figure where in the helmet it is clear.
  - A way to switch without a keyboard (a phone): an icon button over the world, or the wheel (out of the head, into it).
  - The Character camera goes through blocks and mountains it backs into: nothing pulls it in front of them yet.

## W101. The figure stands on what is built, and falls

2026-10-16. **His:** "I took the character on to the pipe, I thought the character fits into it and it must fall.
What went wrong?" His pipe in the Gateway stands upright, 6 m across, open at its top under the hole it cuts in the lime
slab (W95) inside his gate, closed at its bottom 40 m down.

- **What went wrong** (found): the figure walked level at the height it stood (W100), so it crossed the hole; the
  ground under it read the slab whole, not cut; and the pipe's closed end was drawn from outside alone, so from inside
  it was no floor (and was seen through).
- **Decided (his): it falls.** *Mine, how, for him to keep, change or drop:*
  - **It stands on what is under it**: a block's top, a mountain, a pipe, a road, else the world's floor (0 m); never
    a tree or a human. It **steps up** onto anything at most half a metre over its feet; anything taller is a **wall**
    it stops at, sliding along it whichever way is free.
  - **With nothing under its feet it falls**, at the Earth's 9.8 m/s², never faster than 50 m/s, onto the first thing
    under it; under reduced motion it is there at once. Flown somewhere by the map, it stands on top of what is there.
  - **A hole is open**: where a pipe is cut out of a block, the figure goes through the hole as it is drawn (the same
    test the drawing makes).
  - **A pipe's wall holds it**, inside or out, half a metre off; it goes in and out at an open end alone. A closed end
    of a pipe open at the other is lined inside as the pipe is, so from within it is the pipe's floor, and is seen.
  - **The Character camera comes in front** of a block, a mountain, a pipe or a road between it and the figure, so in
    the pipe it sees the figure there, not the pipe's outside.
- Looked at (1440 × 900, a fresh browser holding a copy of his world; nothing saved): from his human on the purple
  platform (175.5 m), W walked it north into the gate; over the hole it fell, 40 m down the pipe, its wall holding it
  2.5 m off the middle, and landed on the closed end (135 m); D slid it along the wall, inside; the helmet saw the
  pipe's inside. Script: `e2e/.mcp/orbit-fall-into-pipe.mjs`.
- Open, his: a pose for falling and landing (it falls standing); whether it climbs out (it cannot: a pipe's wall is
  taller than a step, and nothing jumps); the figure is a point for the ground and the walls, so its arms may pass into
  a wall beside it; a mountain is walked up as long as each step is under half a metre, so steep slopes are climbed.

## W102. Another human, his turnaround's: the Clay

2026-10-16. **His:** "Create another human in the orbit that looks exactly like the character created in the image. It
should match exactly." The image: one soft, matte, off-white figure in five views, FRONT, 3/4 LEFT, LEFT SIDE, BACK and
3/4 RIGHT: a big faceted head, seven-sided from the front with a flat foot, on a short wide neck; broad round shoulders
flowing into thick paddle arms pressed to the torso, their round ends at the crotch; two thick column legs parted by a
narrow slit, flat round feet; no face, hands or joints. His picture is kept beside his mocks,
`notes/world/clay-turnaround.png`.

- **Decided (his): another human, the picture's, exactly.**
- *Mine, how, for him to keep, change or drop:*
  - **Human, version 6, has two Forms**: the **Suit**, version 5's figure as it was (his settings, his first variant,
    drawn the same to the pixel), and the **Clay**, the picture's. A look is its version's code and a human is a variant
    (W72), so the Clay is version 6's, and a second variant, **Clay**, is it at the picture's measures. It is in code
    until he publishes it from its card, under the id its item will have (W73); its name is not "Human 2", which New
    variant gives and which may be taken in the database. Version 5 is frozen (`human-v5.ts`, `build-human-v5.ts`); the
    page's tuning moved to `no-origins:orbit:human:v6`, which reads version 5's once and lets its key go.
  - **Its outlines are the picture's, measured.** Three readings of the picture, by its edges, by a model of its
    background, and by eye against a ruler, were reconciled row by row, every 4 of the 561 pixels from sole to crown,
    every disagreement settled by eye (`apps/orbit/scripts/clay/`: the measure, and what writes `clay-turnaround.ts`
    from it). The front and the back are one symmetric outline (the picture's lean a little, the same way in both, so
    the lean is the picture's, not the figure's); the side is as seen; the views three quarters round set how square
    the head is, row by row. The picture's slit is a hair at the crotch, opening down the legs.
  - **How it is made**: each part a soft column whose cross-section at every height is a rounded box, as wide as the
    picture from the front and as deep as it from the side at that height. The torso, the legs, a dome over each arm's
    top and the neck are one skin, so the belly runs into the thighs and the shoulders into the neck with no line. The
    arms are pieces of their own, pressed flat against the torso on their inner side (the picture's dark crease is the
    two pressed together); each turns at its top in a ball under its dome, as the Suit's shoulder does. The dome runs a
    little way down the arm and the arm a little way up inside the dome, so the two meet with one slope. The head is a
    piece of its own: its crown follows the picture's round, its chin rounds under onto the neck, and the neck runs up
    inside it, so a head turned, tilted or raised never shows it. The soles are flat, their edges rounded as the
    picture's are. A fine dry grain, as the picture's clay has, the same matte colour as the Suit.
  - **It moves as the Suit does**: the rig's walk, run, postures, hover and flight, Expression and Looks at cursor, its
    bones standing at its own pivots. The legs bend in their skin at the hips; the arms turn in their balls. Nothing
    bends at an elbow or a knee, since the picture has none: it walks stiff-legged, a toy's waddle, its stride the length
    its own leg swings. It has no visor, torch or boosters: Shows: Boost draws nothing more, it hovers and flies without
    jets. In the world the visitor looks out from the middle of its head; the helmet's inside and rim (W79, W80, the
    Camera's Visor view: Inside, Inside colour, Inside light, Inside opacity, Rim in view) are the Suit's alone, so the
    Clay's view is the world with nothing round it.
  - **The card**: **Form** (Suit · Clay) in Figure; with Clay the Suit's Head, Body, Arms, Legs, Torch, Boost and
    Boosters give way to the Clay's: **Head**: Expression, Looks at cursor, Width (40–110 cm), Height (40–100), Depth
    (40–100), Neck (20–60), Neck height (0–20); **Body**: Width (40–100), Depth (30–90); **Arms**: Length (40–120 from the
    armpit), Width (15–60), Depth (15–60), Groove (0–6, air opened between arm and torso); **Legs**: Length (40–120 to the
    crotch), Width (20–70), Depth (20–70), Gap (0–20). Each starts at the picture's measure, to the centimetre: head 74 ×
    62 × 62 cm, neck 42 wide showing 3.5, body 67 × 59, arms 74 × 36 × 42 pressed to the torso, legs 71 × 44 × 49 meeting
    at the crotch. The height stays 8 feet: a taller head lowers the shoulders.
  - **What it changes of the human before it**: W65's sketch, W69's visor, boosters and helmet, and W79 and W80 are the
    Suit's; the Clay is the soft, puffed figure W65 set aside, now his picture. W51's bones hold for both.
- Looked at (the five views rendered at the picture's own scale and laid over it, headless; the Human page in a fresh
  browser, signed out, nothing saved; a fresh browser's world with a Clay placed, nothing saved): its outline is within
  about 0.3 to 4 pixels of the picture's on average from the front, the side and the back (the masks 98 to 99% the
  same), and within 2 to 9 three quarters round (94 to 96%), where the picture's two views are not turned alike; a
  pixel is 4 mm. The Suit is unchanged, pixel for pixel. Clay picked on the card shows the Clay and its groups, and
  Human the Suit again. Standing, walking, running, waving and hovering hold together, with no holes; C steps down
  behind a placed Clay and into its head, and the view from there is clear. Scripts: `e2e/.mcp/clay-turnaround.mjs`
  (the five views at the picture's scale, `HIDE`, `POSE`), `e2e/.mcp/clay-variant.mjs`, `e2e/.mcp/clay-world-eye.mjs`,
  `e2e/.mcp/clay/` (compare, compose, zoom).
- Open, his:
  - Its colour: Cream, the Suit's (his settings); the picture's lit white reads nearest Sand or Linen.
  - Its name: the Form and the variant are both Clay, and so is a colour swatch on the same card.
  - What still differs from the picture: a soft band round each upper arm under the shoulder, where the arm meets its
    dome, and a soft band at the hips; three quarters round, the near shoulder is a few pixels narrow. In motion, a soft
    notch at each shoulder and fold at the hips, as a ball joint and a bending skin make.
  - Knees and elbows (the picture has none, so it walks stiff-legged); boosters and a visor (none); what the eye sees
    round the view from inside its head (nothing frames it).
  - It builds in about a third of a second, a Suit's in a tenth, and is built again at every step of a slider on its
    card; placed many times, each is built.
  - Publishing the Clay from its card, then `copy:published`; placing it in a sector to walk as it. In a narrow pipe
    its arms, wider than the Suit's, may pass into the wall (W101 keeps the figure's middle half a metre off).

## W103. The World page draws no sector's edges

2026-10-16. **His:** "Remove the edge lines of sector when rendering in world."

- **Decided (his): the World page draws no sector's edges.** It shows the world as the sectors build it, and nothing
  over it; W82's lilac edges go. The card's Sectors group still lists each, its size and where it stands.
- *Mine:* the Sectors page keeps its edges (W81), the one picked violet and the others lilac, since there a sector's
  place and size are being set.


## W103. Clay v7: the reference's volumes and finish, not only its outline

2026-10-16. **His:** the first turnaround is the target; the previous comparison is close but "no where good enough".
"I want exactly what we imagined." The generated reference remains the target, and a high silhouette overlap does
not establish that the material, transitions or three-dimensional volumes match it.

- **Human version 7** revises the Clay. Version 6's human, builder and generated measurement file are frozen beside
  it. The Suit's geometry and material stay as before; compatible tuning stays under the v6 key. Nothing is saved or
  published to the database by this revision.
- **Body and legs:** the two leg section fields morph continuously into the torso above the crotch (`ForkPart`),
  replacing overlapping caps that produced a hip band. The torso, legs and neck share one skin. A rounded sole stays
  on the ground. More regular section profiles, two shrink/expand mesh-fairing passes and normals computed from the
  faired mesh remove tracing ripples and grid-scale pinches.
- **Arms:** each is one continuous loft from the full shoulder to its rounded end; no horizontal joint divides its
  visible surface. Its inner side presses against the torso. It moves whole at a higher shoulder pivot; a smaller
  rounded closed underlay, hidden inside it at rest, closes the body when it lifts. A trial welding the entire arm
  to the torso was rejected during motion review: contact below the armpit stretched into a sheet when raised.
- **Head and finish:** the measured faceted front outline remains; its depth is faired independently and normalised
  to the Depth control. The visible neck starts at 2 cm. The material is fully rough with restrained cloth sheen,
  fine skin-anchored normal grain and slight fibre-scale variation in the colour, replacing the nearly smooth
  plastic finish. No artwork is pasted onto the model.
- **The Clay's inspection page:** warm front-left key and diffuse fill, shadows fitted to metres instead of the
  world's kilometre, and a physically lit copy of its 4 × 4 m block receiving its contact shadow. The painted world
  blocks do not receive shadows. Leaving the page, or choosing Suit, restores the world lighting and painted block.
  Clay placed in the world uses that world's lighting. On a portrait screen its preview is fitted to the space
  above the card and left of the compass, keeping the whole figure visible.
- **Review:** `scripts/clay/review.mjs` renders the same rigged source in five views, shaded and as masks, plus a
  shared studio-floor scene; its README records the options and how to regenerate the measured rows. The shared
  scene uses four nearby keys for softer shadows; Orbit's inspector uses one. The Suit's five shaded views compared
  pixel-identically with its frozen v6 renderer. Browser review covers selecting Clay and returning to Suit, and
  checks the actual WebGPU path as well as the review script's WebGL fallback. No database writes are part of review.
- **Still for his judgment:** the exact fibre/pile appearance, the three-quarter head volumes, the shoulder when
  lifted, and folds in the continuously skinned hips. This is an actual renderer iteration against his target,
  not a declaration that the images are pixel-identical or that he has accepted the look.


## W104. Smooth Clay articulation through every posture

2026-10-16. **His:** "Different posters of the character is not smooth. fix these issues", with the raised-arm
pose showing the fixed shoulder underlay as a shelf and a creased hip. Version 8 replaces the fixed cover with
a connected deforming shoulder. Its skin is bound with the arms separated so the lower arms do not weld to the
torso, and rotation-preserving skinning carries the joints through large turns. Version 7 is frozen beside it.


- **One connected body:** the arms are opened 30 degrees while the surface is meshed and bound. Only their roots
  join the chest; their close contact farther down stays separate. The measured arm/shoulder lofts remain, and both
  fixed shoulder underlays are removed. The medial shoulder is carried by the chest and blends into the moving arm.
- **Articulation:** `clay-skin.ts` fairs bone influences along mesh edges, blends rigid transforms as dual
  quaternions to preserve round limb sections, and fairs the shoulder and hip neighbourhoods after each pose.
  Normals are recomputed on the posed surface, so folds cannot survive as misleading shading. The CPU surface is
  also what shadows, picking and bounds use. A rest-position attribute anchors the fabric grain. Updates always
  start from the bind mesh and skip an unchanged pose, so returning to a posture cannot accumulate shrinkage.
  The deforming body keeps a centimetre-scale mesh within the animation budget; the head retains its finer outline.
- **Inspector:** world blocks now follow `aloneOn` as the placed elements already did: a published block cannot
  obscure the human's legs on its own page. Portrait fitting includes the held pose's asymmetric extent, with a
  stable wider envelope during motion, so the raised arm stays in view beside the compass.
- **Review:** the five postures, eight phases each of walk and run, hover and flight are rendered from the actual
  rig. `SWEEP=on` in `scripts/clay/review.mjs` reuses one mesh and checks that returning to Stand and Wave reproduces
  the same vertices. WebGPU browser review covers the live motion and a 390 px portrait view; the offline renderer
  also exercises WebGL. Suit's five shaded views remain pixel-identical to the frozen v7 source under the same
  harness. Orbit's typecheck, lint and production build pass. No publishing or database writes are part of this fix.


## W105. Full view on the World page

2026-10-16. **His:** "Give an option to view the world in full view in the world". The World page's card carries
**Full view** among its icon actions (W76), and **F** does the same: the sidebar, the card, the compass and the map
are put away and the world is alone on the screen, centred in the whole of it (nothing over it is `data-world-aside`),
looked round, travelled and walked (C, W100) as before. The one thing left over it is an outline icon button at the top
right, **Leave full view**; it, F again or Escape brings the interface back. Escape on foot goes back up to the
builder's camera first, so it leaves full view only from there. *Mine:* full view is held for the visit and never
kept: leaving the page or a reload brings the interface back; it is the World page's alone, and it is not the
browser's fullscreen (the browser's own bars stay). Open, his: whether other pages take it, and whether it also
asks the browser for fullscreen.


## W106. The visitor walks, runs with Shift, jumps with Space and flies with Space twice

2026-10-16. **His:** "The default motion of the character the orbit should be walk. And should run using Shift. Space
should jump. And double space should enable flight. When in flight, the rest state should be hover and moving should
be flying with boosters on."

- **What was wrong** (found): the keys carried the visitor at the camera's Keys (his 20 m/s) and the figure walked only
  up to its Gait's Walk up to (his 1 m/s), so every key press was a run.
- **Decided (his):** the keys **walk** it; **Shift** held **runs** it; **Space jumps**; **Space twice** starts its
  **flight**, in which it **hovers** at rest and **flies** as it moves, its **boosters firing** (the feet's jets and
  their lights, W90) all the while it is in the air, and never on the ground.
- *Mine, how, for him to keep, change or drop* (`air.ts`; every number a `--motion-human-*` token read with a fallback,
  on the bench, not in globals.css):
  - **Speeds:** a walk is the Gait's Walk up to (1 m/s), a run the camera's Keys (20 m/s), a flight 1.5 × the Keys
    (`fly-pace`, 30 m/s), so a flight is always faster than a run. The keys pick the gait outright; a drag still walks
    or runs by its speed.
  - **The jump** rises 1.2 m (`jump-height`) and falls under W101's gravity, its head stopping under anything over it;
    under reduced motion it does not jump.
  - **Space twice** is two presses within 300 ms (`fly-tap`): the first jumps, the second takes off where it is.
    **In flight Space held rises and Shift held sinks**, at 6 m/s (`fly-rise`), easing over the camera's Glide, its head
    stopping under anything over it and half a metre under the world's top. **Sunk onto the ground it lands** and walks
    again; **Space twice in the air lets go**, and it falls.
  - **The poses** are the Human page's Hovering and Flying (`inPlaceOf`, W69's tokens): it eases from its gait into the
    hover, and from the hover into the flight once it moves faster than its Stands under, over its Settle. From the
    helmet the eye rises with the hover and leans with the flight, so nothing of the body comes into view.
  - The canvas's `data-gait` says `hover` or `fly` in flight.
- **The Clay has no boosters** (W102), so the figure he walks as now, his Clay, hovers and flies without jets; the Suit
  fires them.
- Looked at (1440 × 900, fresh browsers, nothing saved), from the Character camera and the helmet, as his Clay and,
  off the database, as the copy's Suit: W walked at 0.9 m/s, Shift+W ran at the Keys, Space rose 1.15 m and landed,
  Space twice hovered at the jump's height with the Suit's jets lit, Space held climbed 6 m/s to 10 m, W flew leaning
  into it, let go it hovered again, Shift sank it to the floor and it stood, and Space twice in the air dropped it.
  Script: `e2e/.mcp/orbit-walk-run-fly.mjs` (`WORLD`, `OFFLINE`, `HELMET`).
- Open, his: whether the Clay gets jets from its soles; a pose for the jump (it jumps in its gait); whether the Camera
  card and the Human card should carry the jump's and the flight's numbers instead of tokens; a phone's way to jump and
  fly.


## W107. Clay’s Gentle Hover, Jet Boost and Float Glide

2026-10-16. **His:** “Can we create these feature for clay human character?”, with a reference showing gentle
levitation, warm propulsion from the feet, and a tilted air-cushion glide with fine surrounding trails; each takes
off, remains airborne and lands. Human version 9 adds the three abilities to Clay’s Motion selector and blends
through takeoff, mode changes and landing when Still is selected. Version 8 is frozen beside it.


- **Gentle Hover:** restrained buoyant rise and bob, low relaxed arms and small balancing tilts; the physical
  shadow separates from the feet without propulsion effects.
- **Jet Boost:** a forward lean with warm soft propulsion from both soles, sparse embers and restrained reflected
  light. No nozzle, ring or hardware is added to Clay. The brighter propulsion in his reference is an explicit
  effect for this character, resolving W106’s open question about Clay’s soles.
- **Float Glide:** arms held outward, a gentle bank and lateral drift, with three thin open ribbons passing around
  its waist. They use depth testing so the body conceals their rear sections.
- **Lifecycle:** selection lifts off and remains airborne; switching ability starts from the current pose and height;
  Still brings it down into its selected Posture. `human-flight.ts` uses quintic settling and separate clocks for
  hover, boost and glide. Motion values are `--motion-human-clay-*` fallbacks, not settled design-system tokens.
  Reduced motion holds a still airborne pose and takes off/lands immediately. Motion changes keep the same Clay
  mesh; geometry controls still rebuild it. `build-human-flight.ts` follows posed foot and hip bones with its effects.
- **In the world:** the existing double-Space flight remains in charge of height and travel. Clay uses these poses
  and effects there, with warm sole propulsion as its default airborne effect, or the variant’s chosen hover/glide
  style. The Suit retains its existing poses and boosters.
- **Compatibility:** the saved values Hovering and Flying now read as Gentle Hover and Jet Boost for Clay; Float
  Glide adds `gliding`. Suit keeps its original labels and options. Switching from Clay’s glide to Suit uses Flying.
  The v6 tuning key remains. Renderer v8, its skin and the then-published human data are frozen beside v9.
- **Checks:** pure regressions cover takeoff/landing, interruptions and mode changes, finite cycles and reduced
  motion. Browser review checks selection, takeoff, mode changes, landing to zero height, stationary reduced motion,
  desktop and 390 px portrait, and switching forms. The same review harness renders all five views; the Suit’s five
  shaded views remain pixel-identical. Typecheck, lint and production build pass; nothing is saved or published to
  the database by this work.
