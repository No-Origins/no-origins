# No Origins — Orbit

**Orbit is what the agents are called together, and the app where each one's look is made**: `apps/orbit` on
`orbit.no-origins.com`. This document decides what the app holds — the agent's look and how it rests, never how it
moves — how its controls stand and read, how a look is saved and published, and who may do what in it. A companion to
**Motion.md**, the studio of how the agents move, and to **Brand.md** §1 and §8 and **Agents.md**, which say what the
agents are.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

## C1. What it is for

- **Each agent is a character**: what it looks like — its shape, colour, surface, face, tail and how it sits — with a
  name of its own. Its meta and its personality are to come, and how they are shown.
- **Orbit is appearance; the motion studio is motion.** Here the agent does not move: it rests (C3, C22). What it is
  designed on is what it looks like.
- **The same setup as the motion studio**: one `Grid` with the overlay and the cursor, in the review sweep. Open to
  everyone; publishing is the owner's (C24).

## C2. The stage is one cell, grown to a radius of three

- **The stage is one cell of the field, a circle six cells across, centred across the field, at the top with one row
  above it**: its first row is the field's second. The field's counts are even (Grid.md D26), so its centre is a grid
  line and the six cells stand on it symmetrically. It is drawn as the motion studio draws a nest: the muted tint in a
  lime hairline. On a phone, six columns across, it is the whole width. A field with fewer than six cells across gives
  it as many as it has; one too short for the row above, the circle and the draft's bar (C11), or too narrow for the
  rooms beside it (C7), gives it four, kept even so it stays centred (`studioLayout`, `lib/stage.ts`).
- **It is part of the grid: it takes the place of the cells it overlaps.** Every cell of the field its circle meets is
  not drawn, so none shows cut at its edge; the cells it misses stay — six across, the four in the corners of its
  square. A cell is its circle (Grid.md D40), so overlapped means the two circles meet (`coveredCells`). The covered
  cells are painted out in SVG in the page's colour under the circle; the slot is `transparent`, since the
  `background` fill would take the corner cells too.
- The cell is abstract geometry drawn in SVG round the `Agent`, as the motion studio's nests are: the one element here
  that is not a component of `@no-origins/ui`. Every control is.

## C3. The agent in the cell plays its rest

- **It is drawn by the design system's `Agent`** (`@no-origins/ui/components/agent`), the component the motion
  studio's stage draws too, so an agent looks the same wherever it is. Never a copy of its model or its painting here.
  It is drawn from the look through `sphereMotionOf(look)` (`@no-origins/ui/lib/agent-body`); no tokens are written.
- **The cell is its nest**, so it sits on the circle's floor at the size its nest gives it (`{ cell: diameter, gap: 0
  }`), its tail behind the page.
- **It plays its rest, and nothing else**: breathing and blinking, on its own clock from when the cell mounts, by the
  values every agent moves by (C22) — a still course (`sphereStill`), one frame of it painted through the `Agent`'s ref
  every animation frame, carried on when the look changes. It never jumps: the motion studio moves it. Under reduced
  motion it paints its first frame and stops.
- **Flat colour**: no gradient, no glass.

## C4. The body under the circle: Size, then Shade

A `Card`, **four cells across and two down, centred across the field under the circle**, its heading, Body, on the row
between them (C7). It holds one setting a row: **Size**, how far across the agent is, of its cell (0.1 to 0.9); then
**Shade**, how dark its side away from the light is, 0 flat (0 to 1). Steps of 0.01. They are the body's `size` and
`shade` as the package declares them (`@no-origins/ui/lib/agent-body`), and the character's, saved in its draft (C6).
Where the body's card and the draft's bar do not both fit under the circle, the body goes first in the right room
(C11).

## C5. The face is parts from a library, and the library is here

- **The library lives here.** Orbit is the agent's appearance, so this is where each **slot** is given one **style**,
  or none, and that style's **settings**. The motion studio moves what it wears.
- **The slots and their styles**: **Eyes** (Size, Spacing, Height, Colour, C16); **Pupils** (None · Dot · Shine);
  **Upper lids** (Plain · Heavy); **Lower lids** (None · Plain); **Brows** (None · Line · Arch · Bushy). A pair is
  mirrored until he sets its sides apart (C7). Symbols are played by motions and are the motion studio's.
- **A style comes in two kinds**: drawn in code from its settings, which bends with the head; or a drawing he uploads
  on the slot's template (C8), which moves, turns, grows and fades as a whole.
- **Who builds what**: the library's screens and the upload are Orbit's; drawing the parts, in the package's `Agent`,
  and their rows in a motion are the motion studio's. The declaration of the parts, their styles and their typed
  settings is the package's (`@no-origins/ui/lib/agent-face`), beside the drawing, and the screens here are made from
  it.

## C6. A character is saved as a draft and published as versions

- **What Orbit saves is a character**: the agent's look — its body, the parts it wears, their styles and settings —
  whole (`resolveCharacter`), never a partial look.
- **The draft saves as he goes, in the database**, one per character, `SAVE_AFTER` (500 ms) after the last change, on
  the `rev` it was loaded at (Admin.md §6.4). A save another device made first is refused, not merged, and the draft's
  bar offers to load it.
- **Publishing makes a version**, `major.minor` with no name (C19). A version never changes and is never deleted;
  going back to one makes it the current version without renumbering. Each records the package version it was drawn
  with (Admin.md §7).
- **A look with nothing set is the package's defaults** (`SPHERE_START`), so a default changed there shows here — and
  never in a published version, which holds every value.
- **A page shows a version as it was copied at build, never from a visit** (Admin.md §0.6): the portfolio's agents are
  a copy of each one's current version (`apps/portfolio/src/content/agents.ts`).

## C7. What stands round the cell: sections, each a heading and its cards

- **A section is its heading and its cards** (`components/section.tsx`): the heading is the portfolio's section label
  composed the same way (`SectionLabel`) — the section's icon in the secondary colour and its word, centred on a row of
  its own with no border, the field's lines stopping at it — and the cards stand under it. **A card is as many rows as
  it has lines**, one line a row, never stretched to the room it stands in.
- **The face is a section for each slot it wears** — Eyes, Pupils, Upper lids, Lower lids, Brows — in the room to the
  circle's left. A slot's card is its Style (with its uploads, its template and the upload at the end of its list, C8,
  C11); then, for a pair with settings, **Mirrored** (off, Left and Right say which side the settings move); then the
  style's settings. Only what is designed here shows (`set: "look"`); what only a motion moves is the motion studio's.
  A slot wearing none is its Style alone, one row.
- **The body's own sections are in the room to its right** (C10), and **the body** under the circle (C4).
- **There is air round the circle**: a column of cells between it and each room beside it, each room as many columns
  of cards as it holds with a column of air between them, each column at least 320 px (so a slider has room) and at
  most six cells.
- **What a room cannot hold is its next page**: nothing on the grid scrolls (Grid.md D5). A section goes to the next
  column or page whole, and only one taller than a whole column is split, at a line, its heading over each part
  (`flow`). The room's pager is on the field's last row under it: the page before, which page it is, the next. A style
  picked that moves its section to another page turns the room to it.
- **Where the field is too narrow for rooms beside the circle** (a tablet stood up, a phone), there is one room under
  it, where the body and its sections, then the face, flow, a page at a time, and the draft's bar stands on the row
  above its pager.

## C8. An uploaded style: drawn on the slot's template, kept in the slot's space

- **What he needs: an SVG drawn on the slot's template.** Orbit gives one for each slot, in round pixels, drawn round
  the agent as it is now (`templatePartOf`, `faceAnchors`): the head as a circle 200 px across, the part's **anchor**
  as a small cross, and the box the part sits in, all in a group called **Guides**. He draws the left part (a pair's
  right side is its mirror) beside the guides and exports with them in. The anchor is the left eye's centre for pupils
  and lids, the middle of the left brow's line for brows, and the symbol's centre for symbols.
- **Checked and cleaned when it is uploaded, never taken as it is**, in the page (`lib/clean-svg.ts`) and again on the
  server (`strictDrawing`, `lib/drawing.ts`). The drawing is mapped back by its own guides — the cross to the anchor,
  the head to a radius of 100 — since design tools move the origin and may scale. Then the guides are dropped, every
  group, transform and shape is flattened into absolute paths (`svgpath`), and each shape's colour is resolved: in a
  layer named for one of the agent's colours (`paint`, `ink`, `light` and the rest), it wears that colour; otherwise it
  keeps its own, as a plain colour. It is refused, saying why, if it has no guides, a gradient or pattern, an opacity or
  filter, a picture, text, or a reference to another element.
- **The dialog before it is saved** shows the drawing on the agent's head where it will sit, a pair's right side
  mirrored, in the agent's colours, and asks for a name; or says why it was refused.
- **Kept as a drawing's version**: the file as uploaded goes to the private `assets` bucket first (Admin.md §8.2), then
  the cleaned shapes in the slot's own space (the anchor at 0,0, 100 to the head's radius, strokes kept) become the
  drawing's next version — a new name is a new drawing. The slot wears it as `upload:<id>`, and it stands in the
  slot's style list by its name. A frozen version never names a file that is not there.
- **What it can do**: sit at the slot's anchor, moved, turned and sized by its slot's settings, mirrored for the right
  side of a pair, in the agent's colours or its own. It follows the head as a whole; it does not bend the way a drawn
  brow arches.

## C9. A section folds to its heading

- **The heading is the toggle.** A section's whole heading row is one ghost `Button`: at rest it looks as a heading
  does (the icon and the word, centred, no border); under the pointer it turns lime with its ink, as every ghost button
  does. Its chevron sits in the row's last cell, up while the cards are open and down while they are folded. Enter and
  Space press it. The ghost button's open tint is set aside on these headings.
- **A folded section is its heading alone**, one row. In a room, the sections after it flow up into the rows its cards
  gave back, so folding what he is not working on brings the rest onto fewer pages. The body under the circle folds the
  same way (`PlacedSection`).
- **What was pressed stays in view.** A section that moves to another page as it folds or opens takes the room's page
  with it, and its heading keeps the keyboard's focus.
- **A fold is the page's, not the character's**: not saved, and every section is open when Orbit loads. It is held
  above the rooms (`FoldProvider`, `useFold`), so a section stays folded when the field changes shape.
- **It does not move.** The cards go and come at once. Boxes on the grid are never squeezed (Grid.md D37), so a fold
  is never a height animation; if it should move, that is his to name.

## C10. The body's sections: shape, rotation, colour, surface, tail and rest

The room to the circle's right holds the body's own sections, in this order, each a heading and a card (C7)
(`components/body-sections.tsx`): **Shape** (with Material), **Rotation** (C12), **Colour** (C20), **Surface** (C14,
C15), **Tail** (C23) and **Rest** (C22). Every setting is the package's (`@no-origins/ui/lib/agent-body`) and the
character's, saved in its draft. A version stored before a setting was declared has no key for it and reads its
default.

- **Shape**: Sphere, Cube, Pyramid, Hemisphere, Cylinder, Hexagonal prism, Cone (`AGENT_SHAPES`,
  `lib/agent-shape.ts`), each a solid drawn as C12 and C18 say. **It is the sphere's body in another shape**: it takes
  the room the sphere's head would, settled, breathing and squashed as it is, scaled to look as big, so Size, Spread and
  Breath move it as they move the sphere. **It rests on the nest, as every character does**: its lowest point on the
  floor of the bowl, as the settled sphere's is. Its face is laid on its front (C12). The tail is the sphere's.
- **Material**, a line of the Shape section: Ball (firm), Jelly (as set) or Slime (soft and oozing) — what it is made
  of beside what it is. It shows most in a landing, on the motion studio's stage.

## C11. Where each control stands, and one grammar for every line

**Where each stands** (`studioLayout`, `lib/stage.ts`):

- **The face to the circle's left** (C7). **The body's own sections to its right** (C10), and nothing else. **The
  body** under the circle (C4).
- **The draft and the versions are a bar on the field's last row under the circle**, between the two rooms' pagers
  and built as they are: a circle, then a pill (`DraftBar`, `components/versions-panel.tsx`). They are the whole
  character's, not a part of its look. The circle opens the versions in a dialog, a row each, newest first, the one
  pages show marked *Showing* and any other one to *Go back* to, asked twice; over them, the next major and its Publish
  (C19). The pill is the agent's select (C13), the draft's state, and **Publish** with the version it makes — or, for a
  visitor, "Yours to play with" and **Sign in** (C24). A bar four cells across drops the state's words and shows
  Publish as its mark and the number; the agent's select gives way first, cutting a long name, and opens its list above
  the bar, whole.
- **The circle keeps its six cells before the body keeps its place under it**: where the body's card and the bar do
  not both fit under the circle (a field of fewer than twelve rows), the body goes first in the right room.

**One grammar for every line** (`PropertyControl`, `components/property-control.tsx`), made from a setting's type in
the package's declaration (`@no-origins/ui/lib/properties`, `agent-face`, `agent-body`), never a list of its own:

- **Three columns, the same for every card in a room**: the label's, as wide as the longest (`LINE_LABEL`, 6.25rem);
  the control's; and the value's, as wide as the widest number (`LINE_VALUE`, 4rem). So every slider in a room starts
  and ends where the others do, and every value stands in one column. The body's card, placed on its own, fits its
  label column to its own labels.
- **A number** is a slider in the control's column and its value, typed, in the value's.
- **A choice** is a select across the control's column and the value's. What it offers that is not a value is at the
  end of its list: a face slot's, under **Your own**, his uploads by name, then **Download the template** and **Upload a
  drawing…** (C8). Never a button at a line's end.
- **A colour** — the paint, and every colour by name — is the design system's `ColourPicker` across the same two
  columns (C17).
- **A switch** stands at the control column's start.
- The value's column holds a number or nothing. Every box in a line is the system's small size, 36 px.

Open: the control height (36 or 40 px) and the line grammar across the apps are his to decide; this is the grammar as
built.

## C12. The shapes are solids, and they turn

`lib/agent-shape.ts`:

- **A solid, turned, then seen.** The cube, the hexagonal prism and the pyramid are their faces; the cylinder, the cone
  and the hemisphere their circles and dome. Each is turned by **Rotation X, Y and Z** — Y on the spot, about its
  upright; X toward you or back; Z about the way you look, in that order — then seen **in perspective by a camera in
  front of it and above, looking straight ahead**. At rotation 0 its front stands square to you and its base's front
  edge is level on the floor, while its top and sides go back toward a point up and behind it: up and to the right for
  the cube and the prism, straight above for the pyramid and the round ones. The cube is drawn a little under the
  sphere's width, since a square as wide as a circle looks bigger; the pyramid's base a little narrower than the sphere,
  so its corners do not stand where the bowl rises steeply.
- **Tones from which way a face faces**, once turned: toward white facing up and a little left, toward black facing
  right or down — the light up and to the left, as the sphere's — measured from its front's, so the front is its paint,
  and every tone scaled by Shade (Shade 0 is flat). A round shape keeps the sphere's two tones, its lit side moved
  toward the light, its flat ends painted where they face you.
- **The face is laid on its front and turns with it**: drawn about a patch of the front, carried through the same turn
  and camera, so it is foreshortened as the front is and goes round a cylinder with it; hidden once the front has
  turned away. A little bigger than the front, so its eyes are near the sphere's size; an uploaded part follows it. **The
  sphere turns its face**, its body being round: Y turns it to look aside.
- **Its underside gives to the bowl.** The nest is a cylinder going back into the page, so its floor under a point
  depends only on how far across it is. Its underside, as its outline stands, is carried onto the ring both ways — up
  where it would pass it, down where it stands clear, the sag easing into a limit of a tenth of its height (`giveOf`) —
  and what is over it moves with it, less the higher it is, so its top stays as it was. Where it stands follows its
  lowest and widest points softly, so it never jumps when another corner becomes the lowest. Nothing passes the ring;
  its edges are drawn in pieces (`PIECE`) so a flat one can bend. At rest every shape's underside sits on the floor as
  the sphere's does. A shape he turns so that its base is not level stands on its lowest corner: that is his to choose.
- **Soft edges, in the solid.** Each core is grown by a ball a ninth of a head's radius wide (`RHO`, the Minkowski
  sum), so every edge is a quarter-round and every corner a piece of a sphere, however it turns (C18).
- **Rotation is the look's**, a group of its own in the declaration (`rotate-x`, `rotate-y`, `rotate-z`, −180° to
  180°), and a number, so a motion's row may ease it — the agent turning to look.

## C13. Six characters, and which one is open

- **Six characters in the database**, each a `studio_items` row of kind `character` with a draft and its versions
  (C6): **Bali**, **Kino**, **Zaza**, **Oru**, **Mira** and **Lola** — the Guide, the Maker, the Scout, the Keeper, the
  Editor and the Muse of Agents.md. Each has a proper name of its own, and its job is what it is, not its name. A
  rename is an update on the item, not a new item.
- **Which is open is chosen in the draft's bar** (C11): a select at the pill's start, listing every character. Opening
  another saves what is pending here first, then its draft, its versions and its uploads take the page. Orbit opens on
  Bali. A new agent is made from the end of the list (C19). With no database — a keyless dev server, CI — there is one
  character, the look the code declares, and no chooser.
- **Uploads are a character's own** (C8): each has a library of its own (`character_id`), so a brow drawn for one
  agent is not offered to another.

## C14. Depth

**Depth**, a line of the Surface section: the body's tone stepping in flat bands from the light to the far side
(`bandsOf`, `lib/agent-texture.ts`) — a band between its dark side and its paint, and a lighter one toward the light,
their tones by the setting. The no-gradient reading of a body curving away: steps, never a falloff. A flat-sided shape
already has this in its facets; a round one takes the bands as the sphere does. 0, the default, is the body's two
tones. Nothing see-through, no blur, no gradient.

## C15. Textures, drawn by hand on the surface

**A texture is marks drawn by hand on the surface itself** (`lib/agent-texture.ts`), flat and two-tone, after his
sheet of hand-made swatches:

- **Patches.** Each solid says what its surface is made of, as sheets: the cube's six faces, each with across along its
  edges; the cylinder's side as one sheet round, and its two ends; the cone's side from rim to tip and its base; the
  hemisphere's dome and its base; the sphere one sheet of longitude and latitude, its front at the middle. The marks
  are drawn on the flat sheet — placed, sized and bent by a seeded jitter, the same every frame, by his **Wobble** —
  then every point is carried onto the surface, turned as the body is, dropped where the surface faces away (a line
  breaks there), and projected as the body is. So a cube's grid runs along each face's edges and breaks at them; the
  sphere's stripes are its meridians and its contours ring its front; a cylinder's stripes follow its side round; and
  turning the body turns the drawing with it.
- **The family** (`AGENT_TEXTURES`): line textures that read as the form — **Stripes, Zebra, Meridians, Latitudes,
  Contours, Spiral, Strata, Waves, Chevron, Hatch, Grid** — and what surfaces are made of — **Bricks, Weave, Scales,
  Honeycomb, Crackle, Woodgrain, Marble, Dots, Splatter, Smears**. Twenty-one, and None, the default.
- **Two tones, flat, no gradient**: lines stroked with round ends, shapes filled, each in the mark's colour toned as
  the surface it is on (the dark side's darker).
- **To the edge.** How far out a point is on the sphere — 0 at the front, 1 at the rim — is laid along the body's own
  outline in that direction (`radialOf`), so the drawing reaches the edge of the body as it is drawn, however it is
  squashed.
- **Smooth, by hand.** A hand-drawn line wavers in one or two long bows (`drawn`) and is drawn as a smooth curve
  through its points (`smooth`); each scale is one arc with its own size and place. Meridians and latitudes are ruled,
  as a globe's are, and a hexagon keeps its corners (`sharp`).
- **Part of the body, not laid on it.** **Opacity** (0.45 by default) is how far the marks stand out: a light or a dark
  mark is the paint itself, lighter or darker by that much, its hue and chroma kept (`oklch(from …)`); a named colour
  (lime on violet) is mixed into the paint by that much. Then it is toned as the surface under it is, so a mark is a
  tint of the body and shades with it. A mix, flat: nothing is see-through.
- **The settings**, in the Surface section: Texture; and once it wears one, Size (a cell of its marks across, of the
  head), Wobble, Colour and Opacity; then Depth (C14).

## C16. The eyes have a colour

- **Colour, on the Eyes card**, under Height: one of the agent's colours by name, as swatches (C17). It is the face's
  `eye-colour`, declared with the eyes (`lib/agent-face`), so the motion studio's Eyes group has it too.
- **Where it goes is the pupils' call**: a solid eye is drawn in it; a Dot is a pupil in it on a light eye; a Shine is
  a light catchlight on an eye in it. The light of the eye and the catchlight stay light.
- **Ink, the default, is the colour they have always been**: the paint's ink on a solid eye, and `deep` with a pupil
  or a catchlight (`eyeColours` in `lib/agent-colours`), so a pupil in ink never vanishes into the light eye it sits on
  (on violet, the ink is white). The swatches are the eyes' colours, so under a pupil Ink shows as Deep.

## C17. Every colour is picked the paint's way

- **The colour picker is the design system's** (`@no-origins/ui/components/colour-picker`, `ColourPicker`): swatches
  composed from `ToggleGroup`, one a colour, the one picked pressed with the foreground's edge, each a circle with a dot
  of its colour, standing together from its start at the small size and sharing out a column too narrow for them rather
  than wrapping. One is always picked. On the showcase's molecules page.
- **Every pick of a colour is one**, in every app — never a select of names or a row of worded toggles. Here: the
  paint, and every colour by name — the eyes' (C16), the brows', the texture's — whose swatches are what each name is on
  the agent now (the eyes' through `eyeColours`).
- **Each swatch is named in its title** and as its accessible name: two can look alike — on a violet body Paint and
  Violet are one colour — and the name tells them apart.

## C18. The shapes' edges are smooth

How a flat-sided solid's rounded edges and corners are toned (`lib/agent-shape.ts`):

- **Toned where it faces.** A face is its own tone. Every point of an edge's quarter-round and of a corner's ball
  wears the tone of the way it faces there (`facing`), in steps of a twenty-fourth (`TONE_STEPS`): an edge rounds from
  one face's tone to the next in steps of about a pixel, too fine to see, and a corner with them. Each step is one flat
  path, so nothing shows between them. It reads as a smooth round — flat colour on the rounds only, never a sweep
  across a face.
- **Exact boundaries.** An edge is cut into runs of one step along its round, each ending where the tone crosses into
  the next, found by halving (`runsOf`). A corner's ball is cut to its horizon, then into quarters, then between the
  circles where its tone crosses a step (`cornerOf`), so every boundary is an arc on the ball.
- **The outline is the solid's, finely**: the hull of the horizon of each corner's ball, as the camera sees it, and of
  the rims' quarter-rounds; the hemisphere's dome is the horizon of the ball it is part of. It is found as the shape
  stands, then bent with everything else (C12), so where the bowl bends a side in, the outline follows it.
- **What it must hold**: turned through 80° on each axis in half-degree steps, the outline moves at most about a pixel
  a step; nothing passes the ring; a flat-sided shape is at most 34 paths of the `Agent`'s 40 over every rotation; every
  texture draws on every shape; the browser paints it every frame without dropping one.

## C19. An agent is named once; its versions are major and minor

- **A version is `major.minor`, and has no name.** Publish in the bar makes the latest version's next minor at a
  press: 15.0 → 15.1 → 15.2. **A new major** is his to make: the versions' dialog opens with the next one and its
  Publish, and from then on the bar's Publish makes its minors. A character's first version is 1.0. The next is always
  counted from the latest version, not from the one pages show: going back to 14.0 from 15.2 makes the next minor
  15.3, and nothing is renumbered (C6).
- **Versions stored before** keep their number at .0, and their names show beside them in the versions.
- **A new agent is made by its name** (*New agent…*, at the end of the bar's agent select, under a line). It asks for
  the name and nothing else, and opens with the draft at the look the code declares (`resolveCharacter`, the package's
  defaults), with no versions. A name another agent has, in any case, is refused. Renaming one is not here yet.
- **The database** (`studio_versions`): `number` is the major and `minor` (from 0) counts the publishes within it,
  unique per item with the number; a trigger refuses anything but the latest's next minor or the next major's .0. A
  name is optional, and one given is never empty and never repeated in its item. `studio_publish` takes a step,
  `minor` or `major`, as the motion studio's actions do too. `studio_new_character` makes a character and its draft in
  one go.

## C20. The paints stand out from the page

**Nine paints** (`AGENT_PAINTS`, `lib/agent-colours.ts`; `--agent-*` in globals.css, each with the ink its eyes are
drawn in): **lime, violet, pink, red, orange, gold, green, teal, blue**. Lime and violet are the system's accents;
the other seven are the agent's own, which nothing but the agent paints with. The system's palette stays lime and
violet: widening it is his call.

- **The new paints are mid-tones of strong hues**, chosen to stand at least 3.3 : 1 from all four of what an agent
  sits on — the light page, the light nest, the dark page, the dark nest (WCAG 1.4.11's minimum for a shape is 3 : 1) —
  with dark eyes at 5 : 1 or more. That puts a paint's luminance between about 0.22 and 0.26. No yellow passes; gold
  is the nearest. Each is held below the gamut's edge, where these hues turn neon:

  | Paint | oklch | Worst of the four | Eyes |
  |---|---|---|---|
  | Red | 0.642 0.207 27 | 3.55 | 5.38 |
  | Orange | 0.649 0.167 50 | 3.32 | 5.74 |
  | Gold | 0.64 0.131 75 | 3.31 | 5.76 |
  | Green | 0.603 0.133 150 | 3.55 | 5.38 |
  | Teal | 0.606 0.094 190 | 3.55 | 5.38 |

  Orange and gold are a little lighter than the rest so they read warm rather than brown.
- **A paint that went is read as the one it became** (`RENAMED_PAINTS`: peach as orange, yellow as gold, grey as teal),
  through a choice's `renamed` in the declaration (`lib/properties.ts`) and the tokens' reader, so a look saved in one
  keeps its place on the wheel. Drafts take the new name at their next save; versions are frozen with the old one and
  drawn in the new colour.
- **The swatches share the Paint line's two columns**, 18 px each at 1440 × 900.

## C21. Orbit: the app, and the agents together

- **Orbit is the agents, together.** Each agent has its own name (Agents.md), and Orbit is what they are called as
  one. A sentence about one of them uses its name; a sentence about all of them may say the agents or Orbit.
- **Orbit is the app too**, where they are made: `apps/orbit`, the package `orbit` (`pnpm --filter orbit dev`, :3005),
  `ORBIT_ROUTES` in the review sweep, and the sign-in screen's "Orbit".
- **A character is still one agent's look**, so the word stays where it means that: the database's rows of kind
  `character` and `studio_new_character`, and the code's `CharacterLook`, `resolveCharacter` and `CharacterProvider`.
- **The hosting**: the Vercel project is named `character`, its root directory `apps/orbit`, its domain
  `orbit.no-origins.com`; `character.no-origins.com` is still attached and redirects to it, path and query intact
  (`next.config.ts`). The hosted Supabase lists both among its redirect URLs.

## C22. Orbit holds what the agent is and how it rests

Orbit is groups 1 and 2 of Motion.md M23: what the agent is (its character) and how it holds itself at rest (its
pose). Everything that shows only as it moves is the motion studio's.

- **Only the look is here**: the declaration's `set: "look"`, a look a motion may move marked `pose`. How it moves —
  Breath, Breath depth, Squeeze, where the eyes look, a jump's settings — is every agent's and the motion studio's.
- **Rest is Spread alone**: how far it settles into its nest.
- **Material** (C10) **and the Tail** (C23) **are here.** The tail is behind the page at rest, so the still agent here
  does not show it; the motion studio's stage does. Material shows most in a landing.
- **A character is groups 1 and 2, whole** (`resolveCharacter`): its draft and its versions keep no motion. A value of
  group 3 or 4 saved in one is not read.
- **The agent here still plays its rest** (C3), by the shared values every agent moves by.

## C23. The tail may be off

- **The Tail section's first line is whether it has one**: Tail, a switch, on by default. Off, the section is that
  line alone, as a face slot's settings go at None, and nothing of a tail is drawn, here or on the motion studio's
  stage, sitting or flying. It is the look's (`set: "look"`); no motion's row turns it on or off. On, its lines are
  **Length** (in heads, 0 to 6) and **Taper** (its tip, of the head, 0 a point).
- **A Length of 0 is no tail too.**
- **A switch is the word `on` or `off` as a token** (`--motion-sphere-tail`), the way the motion studio's stage holds
  it, its jig a choice of the two.

## C24. The controls are everyone's; publishing is his

"Let's make controls in Orbit public, and only when I log in as an admin I should be able to publish, so that users
can experiment and play around." (his)

- **Orbit opens for everyone.** `src/proxy.ts` runs the shared gate with `open` (`authGate`, Admin.md §8.4): it
  refreshes the one session the apps share and sends nobody to the sign-in. `/sign-in` and the `/auth` routes stay,
  and the sign-in on Orbit lands back on Orbit. Without keys an open app opens everywhere, production included.
- **Who may work on the draft is a permission**: the page is `editable` when the signed-in account holds
  `orbit.draft.save` (Access.md A3) — the Owner, and anyone he gives it to in a role. On the server every write goes
  through `writer()`, which asks its own permission — `orbit.draft.save` to save, `orbit.version.publish` to publish or
  go back, `orbit.agent.create` for a new agent, `orbit.style.upload` for a drawing — before the database's rules would,
  and refuses with "Sign in with an account that may save and publish here."
- **A visitor sees each agent as it was published**, the version pages show (`current_version_id`), never the draft.
  Before a first publish they see the look the package declares. The six open one after another from the bar's
  select.
- **For a visitor every control moves the look on the page, and nothing is saved**: a change schedules no save and
  asks nothing of the server. The bar reads **"Yours to play with"** and holds **Sign in** where Publish stands; its
  list ends with the agents, with no *New agent…*; the versions open to read, the one pages show marked *Showing*, with
  no *Go back* and no next major; and *Upload a drawing…* is there and disabled. Do not read the draft for a visitor,
  and do not offer them Publish, Go back, a new agent or an upload.
- **For an account that may save it is the studio**: the draft, saved after a change on its `rev`; Publish, the next
  minor; the next major and going back from the versions; a new agent by its name; uploads — each as its permission
  allows.
- **The database** (`…_studio_public_read.sql`): read policies for `anon` and `authenticated` alike on the items of
  kind `character` and `drawing` and the versions of those items; `anon`'s privileges on the studio tables revoked,
  then `select` granted back on the columns Orbit reads, never `created_by` or `published_by` and never the draft.
  Actions stay the motion studio's. This is Admin.md §0.6's live component: a per-table policy on the anon key, with
  the package's look as its fallback.
- **The review sweep** sees the signed-in page on his machine (its browser is signed in first, `e2e/global-setup.ts`)
  and the offline page in CI.

## Open

- **What goes round the cell**: his to name, one piece at a time, as the motion studio's bench holds only what he
  names (Motion.md M9). The body (C4), the face (C7), the body's sections (C10) and the draft's bar (C11) stand there
  now.
- **The agent's name, meta and personality**, and how they are shown (C1).
- **More face slots** — marks, mustache, hair — and **uploads for symbols**, which motions play and the library does
  not show.
- **How it sits and how it hovers**, and **accessories**: on his list, not yet designed. Whether the agent sits or is
  centred in its cell is part of it.
- **A shape that turns with its stretch, and a tail that suits a shape.**
- **The tokens' names**: the look is read through the sphere's family, `--motion-sphere-*`. Appearance tokens may want
  their own family when the model is split into motion and appearance.
- **Renaming an agent** (C19).
- **Lime, pink and blue stay under 3 : 1 on the light page** (1.32, 1.98, 2.28; each fine on the dark page), and
  violet's white eyes stand 3.82 : 1 (4.96 in dark ink). Lime is the system's accent; pink and blue could each be a
  mid-tone of its hue as the others are. His to decide (C20).
- **/hiddenstack** (the Hiddenstack avatar page) is in the code but not decided here.
