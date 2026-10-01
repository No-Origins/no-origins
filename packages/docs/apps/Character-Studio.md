# No Origins — Character Studio

*Opened 2026-09-30. `character.no-origins.com`, the app `apps/character`. A companion to **Motion.md**, whose studio
it copies and whose sphere (M17) is its first agent, and to **Brand.md** §1 and §8, which say what the agents are. Not
to be confused with the "Character Studio" of **Character.md** §9: that was a 1.0 artifact for picking Bhargav's
illustrated avatar. This is a different thing with the same name.*

## C1. What it is for

His brief, 2026-09-30:

> "I need a new application called Character Studio. The Character Studio is basically pro level controls for the
> sphere which is now going to be the agent … we will have the same setup like motion studio but only focusing on the
> characters of agents … currently it's sphere but I would want different types of shapes in 3D and pro level controls
> to manipulate and like shape the characters … here the agent will not have any movements or anything it's just its
> appearance properties like what does the texture of the body feel like, what shape it is, what color is it, how
> does it sit, how does it hover, are there any accessories to this shape."

So:

- **The sphere is the agent.** The character that jumps from nest to nest on the motion studio's bench (Motion.md M17)
  is what an agent looks like now.
- **This studio is appearance, the motion studio is motion.** Here the agent does not move. What it is designed on is
  what it looks like: texture, shape (other 3D shapes than the sphere), colour, how it sits, how it hovers, and
  accessories.
- **Each agent is a character**, with a name, its meta and a personality (his, the same message). How those are shown
  is still to come.
- **The same setup as the motion studio**: one `Grid` with the intro and the cursor, behind the shared sign-in, in the
  review sweep.

## C2. The stage is one cell, grown to a radius of three

> "Instead of multiple cells, we will pick a cell at the center and make it with radius of three cells so that … circle
> should occupy the major three cell radius space in the center and inside that we will have the agent."

The stage is **one cell of the field, a circle six cells across, centred across the field**. The field's counts are
even (Grid.md D26), so its centre is a grid line and the six cells stand on it symmetrically. **It stands at the top,
one row above it** (his, the same day: *"move the sphere to the top and leave only one row above it"*): its first row
is the field's second. It stood on the field's centre, both ways, until then. It is drawn as the motion
studio draws a nest, which is movement's active cell (Motion.md M9): the muted tint in a lime hairline. On a phone, six
columns across, it is the whole width. A field with fewer than six cells across gives it as many as it has; one too
short for the row above, the circle and the draft's bar under it (C11), or too narrow for the rooms beside it (C7),
gives it four, kept even so it stays centred (`studioLayout`). Until C11 a field too short for the body under it gave
it four too; now the body goes to the room beside it first.

**It is part of the grid: it takes the place of the cells it overlaps** (his, the same day: *"it should be part of the
grid. So the cells under it should not be visible … the bigger circle is taking up the space within the grid"*). Every
cell of the field its circle meets is not drawn, so none shows cut at its edge. **The cells it misses stay** (his, the
same day: *"the corners circles for which there is no effect from the circle. I need them back. I just don't want to
see those the main circle will overlap"*): six across, those are the four in the corners of its square. A cell is its
circle (Grid.md D40), so overlapped means the two circles meet (`coveredCells`). The cells are painted out in the page's
colour under the circle, one by one; the slot's `background` fill would take the corner cells too.

The motion studio's stage is transparent and many cells; this one is filled and one cell. The agent has a place of its
own on the grid, not a stretch of it.

## C3. The agent in it, for now, is the sphere as it is

> "Do not add any jigs yet … just add the circle … design this cell for the agent and for now place the agent that we
> have. After that I will keep telling you what we need around it."

The agent is the package's sphere, `@no-origins/ui/lib/sphere-motion`, read off its element and untuned, so it is the
version on the motion studio's bench. The cell is its nest, so it sits on the circle's floor, settled and spread as it
rests, its tail behind the page, at the size its nest gives it (a share of the cell across). It did not move at first:
one frame of it sitting, not breathing. **Since 2026-09-30 it plays its rest** (his, sending "Version 13, tuned": *"This
becomes the rest state of the motion. So, in character studio also, let's use the rest phase motion"*): breathing by
its Breath and Breath depth and blinking by its Blink every and Blink, on its own clock from when it sits down, never
jumping — a still course of the model painted every frame through the `Agent`'s painter, as the motion studio's stage
paints it live. Under reduced motion it holds its first frame. The painting is flat colour, its paint and the same mixed toward black on its side
away from the light. No gradient, no glass.

**It is drawn by the design system's `Agent`** (`@no-origins/ui/components/agent`, his approval, 2026-09-30, asked:
*"we must be using the design system, right? … is agent part of the design system?"*). Until then only its model was:
the motion studio's stage and this studio each painted it, and this studio's copy had already missed the eyes the
sphere was given (version 11). Now both draw the one component, the motion studio a frame at a time and this studio
one still frame, so the agent looks the same wherever it is. The cell it sits in stays this studio's.

Nothing else is on the page, and no jigs. What goes round the cell is his to name, one piece at a time, as the motion
studio's bench holds only what he names (Motion.md M9).

## C4. The body under it: Size, then Shade, under its heading

> "Let's add a card that takes up four columns and two rows. And the first item in it will be size and slider. And
> then the next one will be shade."

> "Even the size and shade should have the heading of body." (2026-09-30, C7)

A `Card`, **four cells across and two down, centred across the field under the circle**, and **its heading, Body, on
the row between them** (C7): the section's label, as every section has one. It holds one setting a row, each centred on
a row of the field: its label, a slider, and its value, which can be typed. First **Size**, how far across the agent
is, of its cell; then **Shade**, how dark its side away from the light is, 0 flat.

They are the body's `size` and `shade` as the package declares them (`@no-origins/ui/lib/agent-body`), read by the same
reader the sphere's tokens go through (`sphereMotionOf`), so the agent drawn is the model's with nothing copied. They
run as far as the model takes them (size 0.1 to 0.9, shade 0 to 1), in steps of 0.01, and they are the character's,
saved in its draft as he goes (C6).

## C5. The face is parts from a library, and the library is here

Agreed in the motion studio (Motion.md M20, his, 2026-09-30: *"yes for both"*, to the face's first four parts and to
mood symbols as a slot of their own). What it means for this studio:

- **The library lives here.** This studio is the agent's appearance, so this is where he picks what it wears: a
  **slot** (upper lids, lower lids, pupils, brows; then marks, mood symbols, mustache, hair) and one **style** in it, or
  none, and that style's **settings**. The motion studio moves what it wears.
- **Face version 1 is four parts, drawn in code**: Pupils (None · Dot · Shine), Upper lids (Plain · Heavy), Lower lids
  (None · Plain), Brows (Line · Arch · Bushy), with the eyes' Look X and Look Y. Each pair is mirrored until he
  unmirrors it. The table of their settings is M20's.
- **A style comes in two kinds** (his: *"we should have option for both"*): drawn in code from its settings, which
  bends with the head; or a drawing he uploads, on a template this studio gives for its slot, which moves, turns,
  grows and fades as a whole. The upload's four checks, and where it is kept, are M20's.
- **Who builds what** (his, 2026-09-30: *"I agree to your split"*): this studio's library screens and the upload are
  this studio's; drawing the parts, in the package's `Agent`, and their rows in a motion are the motion studio's. The
  declaration of the parts, their styles and their typed settings is the package's, beside the drawing, and the
  screens here are made from it.

## C6. A character is saved as a draft and published as versions

Agreed (his, 2026-09-30: *"yes, a published motion should freeze. And any new change will lead to new publish. Each
publish should be treated as a version"*, on Motion.md M20's "Versions and publishing"):

- **What this studio saves is a character**: the agent's body, the parts it wears, their styles and settings. Size and
  Shade (C4) are its first two settings, and they move from the page into the character's draft.
- **The draft saves as he goes, in the database**, one per character, so the studio opens where he left off on any
  device. A write from a second device at once is refused, not merged, and the studio says so (Admin.md §6.4's `rev`).
- **Publishing makes a version**: a number and a name he types (Admin.md R1) — **since C19 (2026-10-01) a `major.minor`
  and no name**, the latest's next minor at a press, a new major when he makes one. Any change after it is a new publish,
  never an edit: a version never changes and is never deleted, and going back to one makes it the current version
  without renumbering. Each records the package version it was drawn with (Admin.md §7).
- **The agent's numbering carries on**: version 12, his settings, is its first stored version. **Version 13, "Version
  13, tuned"** (his settings block, 2026-09-30: *"This becomes the rest state of the motion"*) is the second and the
  current one until the next — version 12 with Come back 1000 ms where it was 1200. **Version 14, "Version 13, tuned,
  tuned"** (his next block, the same night) is the third and the current one: 13 with Come back 500 ms and Spread
  0.05, so it sits settled into its cell. It is the rest under every motion's rows, and the draft starts from it. The
  next publish is 15. The package's defaults (`SPHERE_START`) are the same values since the motion studio's session
  took them in, so a look with nothing set is version 14.
- **A page shows a version from when it was built**, never from a visit (*the page is static*, Admin.md §0.6): the
  publish bucket and the revalidate (Admin.md R2). No page shows the agent yet.

**Built the same night.** The character studio loads the agent's draft when it opens, saves it half a second after
the last change, publishes it with the name he types, and goes back to any version (`apps/character/src/app/actions.ts`,
server functions on his session). Checked against the local database: a save, a style picked, a publish (13), the
same name refused, a going back to 12, and a draft another device saved first, refused here with "Load it" offered.

## C7. What stands round the cell: sections, each a heading and its cards

His, 2026-09-30, of the suggestion *"the face library on the left, the drafts and versions on the right, and the Size
and Shade card under the circle"*: *"let's go with your suggestion."* Then, the same night: *"everything feels very
cramped up … you are just allowing the components to take up the full height and full width and there is no spacing
respected there … instead of drop down for eyes pupils and all of that I want individual cards of controls for each of
that with heading. So even the size and shade should have the heading of body … like we did for projects and case
studies or work."*

- **A section is its heading and its cards** (`components/section.tsx`): the heading is the portfolio's section label
  (Portfolio.md, `SectionCell`) composed the same way here — the section's icon in the secondary colour and its word,
  centred on a row of its own with no border, the field's lines stopping at it — and the cards stand under it. **A
  card is as many rows as it has lines**, one line a row, never stretched to the room it stands in. Its lines share
  three columns — label, control, value — so its sliders start and end together.
- **The face is a section for each slot it wears**, where one panel's first line picked the slot: Eyes, Pupils, Upper
  lids, Lower lids, Brows, to the circle's left. A slot's card is its Style, with its template and its upload at the
  line's end (C8); then, for a pair with settings, Mirrored (off, Left and Right say which side the settings move); then
  the style's settings. Only what is designed here shows (`set: "look"`); what only a motion moves is the motion
  studio's. A slot wearing none is its Style alone, one row.
- **The versions were a section to its right** until C11: the draft's card — whether it is saved, and a name and
  Publish — then a card a row for each version, newest first. Since C11 they are the draft's bar on the last row under
  the circle, and the room to its right is the body's shape, colour, texture and rest (C10).
- **The body is the section under it** (C4).
- **There is air round the circle**: a column of cells between it and the rooms of sections beside it, each room as
  many columns of cards as it holds with a column of air between them, each column five or six cells (at least 320px,
  so a slider has room) — one column a side on a laptop.
- **What a room cannot hold is its next page**: nothing on the grid scrolls. A section goes to the next column or page
  whole, and only one taller than a whole column is split, at a line, its heading over each part. The room's pager is
  on the field's last row under it: the page before, which page it is, the next. A style picked that brings its
  settings, which then no longer fit where they were, turns the room to where they went. On a laptop's 1440 × 900 the
  face is two pages: the eyes and the pupils, then the lids and the brows.
- **Where the field is too narrow for rooms beside the circle** (a tablet stood up, a phone), there is one room under
  it, the circle's width, where the body, the face and the versions flow in that order, a page at a time.

## C8. An uploaded style: drawn on the slot's template, kept in the slot's space

His, in the motion studio (Motion.md M20): *"we should have option for both"*, drawn in code and uploaded; and
*"if we have to upload, what is that we need?"* What was agreed between the two studios' sessions, 2026-09-30, to
build next:

- **What he needs: an SVG drawn on the slot's template.** The studio gives one for each slot, in round pixels: the
  head as a circle 200 px across, the part's **anchor** marked as a small cross, and the box the part sits in, all in
  a group called **Guides**. He draws the left part as he sees it (a pair's right side is its mirror) beside the
  guides, and exports with them in. The anchor is the left eye's centre for pupils and lids, the middle of the left
  brow's line for brows, and the symbol's centre for symbols; each stands where version 12's defaults put it, so the
  head looks right round it.
- **Checked and cleaned when it is uploaded, never taken as it is.** Design tools move the origin, and may scale, when
  they export, so the drawing is mapped back by its own guides: the cross to the anchor, the head to a radius of 100.
  Then the guides are dropped, every group, transform and shape is flattened into absolute paths, and each shape's
  colour is resolved: in a layer named for one of the agent's colours (`paint`, `ink`, `light` and the rest), it wears
  that colour; otherwise it keeps its own, as a plain colour. It is refused, saying why, if it has no guides, a
  gradient or pattern, an opacity or filter, a picture, text, or a reference to another element.
- **Kept as a drawing's version**: the cleaned shapes in the slot's own space (the anchor at 0,0, 100 to the head's
  radius, strokes kept), with the file as he uploaded it in the private `assets` bucket beside it (C6's tables). It
  then stands in the slot's style list next to the drawn ones, and a look wears it as `upload:` and that version.
- **What it can do**: sit where the slot's anchor is, moved, turned and sized by its slot's settings, mirrored for the
  right side of a pair, in the agent's colours or its own. It follows the head as a whole; it does not change its own
  shape the way a drawn brow arches further. The agent draws it in the face layer (the motion studio's session).

**Built the same night** (his, asked about a library to flatten the file's shapes, `svgpath`: *"proceed"*). The face
library's Drawing line has **Template** — the slot's SVG, drawn round the agent as it is now, its eye spacing and
height included (`templatePartOf`, `faceAnchors`) — and **Upload**, which cleans the file in the page (`clean-svg.ts`)
and shows a dialog: the drawing on the agent's head where it will sit, a pair's right side mirrored, in the agent's
colours (`agentColours`), and a name; or why it was refused. Saved (`uploadDrawing`), the file goes to the private
bucket first, then the cleaned shapes become the drawing's next version (a new name is a new drawing), and the slot
wears it; it stands in the slot's style list by its name. Checked on the local database: the brows' template, a brow
drawn on it and exported moved and scaled, the preview, the save (a second upload of the same name its version 2),
the agent wearing it centred over each eye, mirrored, and a gradient refused with its reason. Symbols take uploads too
in the package's terms, but the library shows only worn slots, so their upload waits for a place to pick them.

## C9. A section folds to its heading

> "Make cards collapsible in character studio." (his, 2026-09-30)

- **The heading is the toggle.** A section's whole heading row is one button, a ghost `Button`: at rest it looks as
  the heading always has (the icon and the word, centred, no border). Under the pointer it turns lime with its ink,
  as every ghost button in the system does. Its chevron sits in the row's last cell, pointing up while the cards are
  open and down while they are folded, as the system's accordion shows it. Enter and Space press it too. A ghost
  button's open state is the muted tint, but that tint is for a menu, and here every section starts open, so it is
  set aside on these headings.
- **A folded section is its heading alone**, one row. In a room, the sections after it flow up into the rows its cards
  gave back (`flow` is handed the section with no cards), so folding what he is not working on brings the rest onto
  fewer pages. The body under the circle folds the same way (`PlacedSection`). Its card's rows stand empty, since
  nothing else is placed there.
- **What was pressed stays in view.** A section folded so that it fits a page before, or opened so that it no longer
  fits where its heading was, takes the room's page with it (C7's follow), and its heading keeps the keyboard's
  focus on the page it lands on.
- **A fold is the page's, not the character's**: it is not saved, and every section opens again when the studio
  loads. It is held above the rooms (`FoldProvider`), so a section stays folded when the field changes shape and it
  moves to another room. The Section shape is unchanged, so every section folds, and any added later will too.
- **It does not move yet.** The cards go and come at once, and the sections after them jump to their new rows. Boxes
  on the grid are never squeezed (Grid.md D37), so a fold is not a height animation. If it should move, that is his
  to name, likely as movement (Motion.md) on the boxes that shift.

Version 1, awaiting his look.

## C10. More of the body: its shape, colour, texture and rest

> "I want more controls. Rest section: 1. Spread 2. Breathing 3. Squeeze. I need shape controls too. So create shapes
> for basic shapes like cube, pyramid, hemi sphere, cyclinder, hexagonal prism, cone. I also need colors and texteures
> options." (his, 2026-09-30)

Four sections, each a heading and a card (C7), in the room to the circle's right (its pager says Body; after the
versions until C11), and after the body where everything flows under the circle. Every setting is the package's, set in the look
(`@no-origins/ui/lib/agent-body`: `shape` in Head, a Surface group), and the character's, saved in its draft. The
versions stored before them (12, 13, 14) have none of these keys, so they read as the sphere, plain — the rule for a
setting declared since.

- **Shape**: Sphere, Cube, Pyramid, Hemisphere, Cylinder, Hexagonal prism, Cone (`lib/agent-shape.ts`). **One view for
  all**: faced to you and seen a little from above, the light up and to the left as it is on the sphere. A round one
  is drawn straight on, its circles seen from above as ellipses. **The cube and the pyramid are straight on too** (his,
  the same night: *"except for cube and pyramid their base is completely not touching the nest fix it"*): they were
  drawn with their depth going up and to the right, so the back of their base rose off the bowl on that side while
  the front corner dug in. Now the cube is its front and its top over it, shaded as the round ones are, and the pyramid
  its front face with a sliver of each side; both bases are level and rest in the bowl across. The hexagonal prism
  keeps its depth up and to the right, its front square to you and a side each way of it: its corners either side
  rise together, so its base is level already. **Flat colour, a tone a face**: the front
  in its paint, the side away from the light its dark side (the sphere's shade), the top toward white by as much —
  every tone scaled by Shade, so Shade 0 is flat — and a round one shaded as the sphere is, its lit side moved toward
  the light. Its silhouette's corners are rounded. **It is the sphere's body in another shape**: it takes the room the
  sphere's head would, settled, breathing and squashed as it is, scaled to look as big; so Size, Spread and Breath move
  it as they move the sphere. **It rests on the nest, as every character does** (his, the same night: *"The new shapes
  that we added are not resting on the nest … which should be our default mode where any character will rest on the
  nest"*): it stands on the sphere's bottom, so its lowest point is on the floor of the bowl, as the settled sphere's
  is, and what of its rigid bottom passes the bowl is cut there, behind the page as the tail is, so its underside is
  the ring's curve where they meet. Until then it was centred in the sphere's room and only lifted where it would have
  gone through the bowl, so the smaller ones floated and the wider ones stood on the bowl's sides, up to 39 px over the
  floor. Its face is drawn round
  the middle of its front, a little bigger than the front so its eyes are near the sphere's size, and an uploaded
  part follows it. It does not turn with a stretch in version 1, and the tail is the sphere's. **Since version 2 each
  is a solid in 3D, and turns** (C12).
- **Colour**: the paint, as swatches, one a colour: lime and violet, and five of the agent's own — pink, peach,
  yellow, blue and grey, his sketch's pastels (Brand.md), lime and violet being its green and lavender. They are the
  agent's (`--agent-*` in globals.css, each with the dark ink its eyes are drawn in), not the system's palette, which
  stays lime and violet: that is his to widen. **Since C20 (2026-10-01) peach, yellow and grey are gone**, for red,
  orange, gold, green and teal: seven of the agent's own.
- **Texture**: its pattern — None, Dots, Stripes, Checks, Grid, Speckle (`lib/agent-texture.ts`) — and once it wears
  one, its Size (a tile across, of the head) and its Colour (one of the agent's by name, Light to begin). Flat: a tile
  of flat shapes repeated over each face in that face's tone, so its dark side's pattern is darker, fixed to the head
  so it rides it. Nothing see-through.
- **Rest**: Spread, Breath, Breath depth and Squeeze, as the motion studio has them. Breathing is Breath (one breath,
  0 none) and Breath depth. **Squeeze is how far it squishes into the bowl's side as it lands and slides**, so the rest
  played here does not show it: it is here because he named it, and shows in the motion studio.

With none of them picked — the sphere, plain — the agent draws exactly as before: every frame of the rest and of a
jump compared the same, and the motion studio's specs pass. Version 1, awaiting his look.

## C11. The controls, reorganised: where each stands, and one grammar for every line

> "Currently, the controls in the character studio are all over the place. They are not consistent. And uh, they are
> not aesthetically good looking. So I want you to uh, reorganize them." (his, 2026-09-30)

What was wrong: the room to the circle's right held the versions and then the body's shape, colour, texture and rest,
under one pager that said Body, so the body stood in two places and the character's record among its looks; every card
fitted its label column to its own labels, so no two cards' sliders started or ended in the same place; a face slot's
Style line carried two icon buttons in the value's column, so its select was shorter than every other one; the paint
was swatches and the texture's and brows' colours were selects of names; a line's boxes were 28, 36 and 40 px tall.

**Where each stands** (`studioLayout`, `lib/stage.ts`):

- **The face to the circle's left** (C7), as it was. **The body's own sections to its right**: Shape, Colour,
  Texture and Rest (C10), and nothing else, under the pager that says Body. **The body under the circle** (C4).
- **The draft and the versions are a bar on the field's last row under the circle**, between the two rooms' pagers
  and built as they are: a circle, then a pill (`DraftBar`, `components/versions-panel.tsx`). They are the whole
  character's, not a part of its look. The circle opens the versions in a dialog, a row each, newest first, the one
  pages show marked Showing and any other one to go back to, asked twice (C6). The pill is the draft's state, then the
  name and Publish. A bar only four cells across drops the state's words, and Publish its word for its mark, to leave
  the name its room. **Since C19 the name is gone**: the pill is the agent, the state and Publish with the version it
  makes, and the dialog opens with the next major.
- **The circle keeps its six cells before the body keeps its place under it.** Where the body's card and the bar do
  not both fit under the circle (a field of fewer than twelve rows), the body goes first in the right room, so the body is
  still one place. Until C11 a field too short for the body under a six-cell circle gave the circle four.
- **Where there is no room beside the circle** (a tablet stood up, a phone): the body, its sections and then the face
  flow in the one room under it, and the bar stands on the row above its pager. On a phone that room has three rows,
  one fewer than before.

**One grammar for every line** (`PropertyControl`, `ControlCard`):

- **Three columns, the same for every card in a room**: the label's, as wide as the longest (Breath depth, 6.25rem);
  the control's; and the value's, as wide as the widest number (0.060, 4rem). So every slider in a room starts and
  ends where the others do, and every value stands in one column. The body's card, placed on its own four cells
  across, fits its label column to its own labels, since the room's would leave its sliders no room.
- **A number** is a slider in the control's column and its value, typed, in the value's.
- **A choice** is a select across the control's column and the value's, always. What it offers that is not a value is
  at the end of its list: a face slot's, under **Your own**, his uploads by name, then **Download the template** and
  **Upload a drawing…** (C8), which waits for the database. They were two icon buttons at the line's end.
- **A paint** is swatches across the same two columns, one a colour, each at most the small size.
- **A colour by name** — paint, shade, deep, ink, light, lime, violet — was a select, each name with a dot of the
  colour it is on the agent now, until C17 made it swatches like the paint.
- **A switch** stands at the control column's start.
- The value's column holds a number or nothing. Every box in a line is the system's small size, 36 px.

Version 1, awaiting his look.

## C12. The shapes are solids, and they turn

> "The cube is broken now. I like the pyramid. Sphere, cylinder, hexagonal prism and cone, they all look fine except
> for cube … it doesn't look 3D. And also I will also need control over rotation in 3D axis." (his, 2026-09-30)

**Version 2 of the shapes** (`lib/agent-shape.ts`): each is a solid in 3D, where version 1 drew each flat from one
view — and the straight-on cube it came to, its front and its top with the round shapes' dark band beside it, did not
read as a solid.

- **A solid, turned, then seen.** The cube, the hexagonal prism and the pyramid are their faces; the cylinder, the
  cone and the hemisphere their circles and dome, sampled. Each is turned by **Rotation X, Y and Z** — Y on the spot,
  about its upright; X toward you or back; Z about the way you look, in that order — then seen **in perspective by a
  camera in front of it and above, looking straight ahead**. So at rotation 0 its front stands square to you and its
  base's front edge is level on the floor, as he asked the bases to be (C10), while its top and sides go back toward
  a point up and behind it: the cube shows its top and its right side and reads as a box, not a plate. The cube is
  drawn a little under the sphere's width: a square as wide as a circle looks the bigger, and its flat base sinks deeper
  into the bowl.
- **Each shape's natural view** is where that point is: up and to the right for the cube and the prism, straight
  above for the pyramid (so it is as he liked it, a sliver of each side past its front) and the round ones.
- **Tones from which way a face faces**, once turned: toward white facing up and a little facing left, toward black
  facing right or down — the light up and to the left, as the sphere's — measured from its front's, so the front is its
  paint. A round shape keeps the sphere's shading, its dark side and its lit side moved toward the light, with its flat
  ends painted where they face you. Its silhouette is the hull of what it shows (every shape here is convex).
- **The face is laid on its front and turns with it**: drawn about a patch of the front — a point, its across and its
  down — carried through the same turn and camera, so it is foreshortened as the front is and goes round a cylinder
  with it; hidden once the front has turned away. **The sphere turns its face**, its body being round: the face is laid
  where its front has turned to, so Y turns it to look aside.
- **It still stands where the sphere does**, its lowest point on the floor of the bowl, and **its underside gives to
  the bowl** (his, the same night: *"the part that is outside the nest … they are being clipped off instead they
  should adapt to the circle and bend their bottom accordingly … because they are slimy … imagine circle like a
  cylinder that is deep into the screen"*). The nest is a cylinder going back into the page, so its floor under a
  point depends only on how far across it is: where the floor comes up into the solid, its underside is pushed up
  onto it — the front of its base and the back alike, so the back's curve shows over the front's — and what is over
  it moves up with it, less the higher it is, so the bend fades up its body and its top stays as it was. Its edges
  are drawn in pieces so a flat one can bend. Nothing passes the ring any more — measured over a breath, every shape
  at five rotations — so the bowl's cut (C10) cuts nothing and stays only as a guard.
- **Smooth, however it turns** (his, the same night: *"it is not smooth at all. It breaks into segments and when I
  rotate so many pieces wobble. It has to be super smooth"*). The first bend found the underside in slots across and
  laid what passed the ring on it point by point, so pieces jumped between slots as he turned it. Now **its underside
  is carried onto the ring both ways** — up where it would pass it, down where it stands clear, as slime settles, the
  sag easing into a limit (a tenth of its height) so a turned corner hanging over the bowl settles rather than melts
  (`giveOf`) — from **its underside as its outline stands** (the lower edge of the outline, which moves smoothly as it
  turns); **where it stands follows its lowest and widest points softly**, so it never jumps when another corner
  becomes the lowest; and **a flat-sided one's outline is its silhouette** — the edges no two shown faces share —
  where a hull bridged a side the bowl had bent in. Measured turning each axis through 80° in half-degree steps, its
  bottom moves at most about a pixel a step and never jolts by more than one or two, where its underside first comes
  into view or a corner takes over as the lowest. The pyramid's base is a little narrower than the sphere is wide, so
  its corners do not stand where the bowl rises steeply. A shape he turns so that its base is not level stands on its
  lowest corner and settles where the bowl reaches it: that is his to choose.
- **Soft edges, in the solid** (version 3, his, the same night: *"let's not have sharp edges for the characters"*).
  Each core is grown by a ball a ninth of a head's radius wide (`RHO`, the Minkowski sum), so every edge is a
  quarter-round and every corner a piece of a sphere. A flat-sided solid is drawn as facets — its faces moved out, a
  band of five facets along each edge, a fan at each corner (`roundedMesh`, until version 4, C18) — each one flat colour from which way it
  faces, so an edge is a few steps of tone, never a gradient; facets of one tone are one path, and its silhouette is
  the edges its shown facets do not share, so it follows every facet exactly and rounds with them as it turns. Rounding
  the outline on the page (version 2's first try) popped as a turn crossed a threshold; rounding the solid cannot. The
  round solids keep the sphere's two tones over the hull of their rounded surface, their rims and the cone's tip
  rounded the same way. **Rechecked in the tunnel** (his: *"imagine each cell is a tunnel and the character is resting
  on the tunnel, so it should be a smooth curve"*): at rest in the studio's cell every shape's underside sits 1.8 px
  over the floor at every point across, as the sphere's does, its edges drawn in pieces a few px long (`PIECE`); a
  frame takes under 0.6 ms.
- **Rotation is the look's**, a group of its own in the declaration (`rotate-x`, `rotate-y`, `rotate-z`, −180° to 180°),
  and a number, so a motion's row may ease it — the agent turning to look.

With the sphere at rotation 0 the agent draws exactly as before: 760 frames of the rest and of a jump, at two sizes,
compared the same; the motion studio's specs pass. Version 2 of the shapes, version 1 of rotation, awaiting his look.

## C13. Six characters, and which one is open

> "Use the studio to design these, because that's how we save the configurations, and your configurations will become
> version one for each agent." (his, 2026-09-30, of the six agents of Agents.md)

- **Six characters in the database**, each a `studio_items` row of kind `character` with a draft and its versions
  (C6): **Bali** — the Guide of Agents.md, the Agent until he named it (his, 2026-09-30: *"the first agent can be
  named as guide. Bali"*), at version 15 — and **Kino, Zaza, Oru, Mira and Lola** (his names, the same night; the
  Maker, the Scout, the Keeper, the Editor and the Muse of Agents.md), each seeded
  with a **version 1, "Version 1"**, its whole look as the motion studio's session designed it (Agents.md A2), and a
  draft that starts from it. Their names are that session's proposals (Agents.md, Open); a rename is an update on the
  item, not a new item: each agent has a proper name of its own (his: *"we should have names for each agent"*), and
  its job — Guide, Maker — is what it is, not its name.
- **Which is open is chosen in the draft's bar** (C11): a select at the pill's start, listing every character this
  account may see. Opening another saves what is pending here first, then its draft, its versions and its uploads take
  the page. The studio opens on the Agent. With no database — a keyless dev server, CI — there is one character, the
  version the code declares, and no chooser.
- **Uploads are a character's own** (C8): each has a library of its own (`character_id`), so a brow drawn for the
  Maker is not offered to the Muse.
- **What a version is stays as it was**: publishing names the character's next number — 2 for the five, 16 for
  Bali — and going back is per character. **Since C19** a publish is the next minor (1.1 for the five, 15.1 for
  Bali), and a new agent is made from the end of the select's list, by its name.

Version 1, awaiting his look at the six.

## C14. Depth without a gradient (and the material that was the surface for an hour)

> "To be honest, I did not like the textures on the agents. They look very generic. I'd like to have more textures that
> have noise, gradient, depth." Then: "Let's try depth without gradient for now." Then: "I don't want patterns on the
> agents anymore … we shall rely only on additions that we are adding now — by additions I meant textures." (his,
> 2026-09-30)

C10's textures — dots, stripes, checks, grid, speckle, tiles repeated over the body — went through two versions that
night (grain jitter and a pixel of relief; then marks growing toward the light in three tone bands) and were then taken
out whole: a pattern was never what he meant. **The surface is a material** (`lib/agent-texture.ts`, version 3), two
things a plain body can have, each a setting of the Surface group and the character's, saved in its draft:

- **Grain**: fine noise over the whole body — many tiny flat flecks, seeded so they never flicker, denser into the
  shade and fewer toward the light — one tile covering the head, its middle on the head's, so nothing repeats
  (`grainTile`). Each face wears it in that face's tone, so it steps with the body's shading. How much (0 none), how
  big a fleck, and its colour by name.
- **Depth**: the body's tone stepping in flat bands from the light to the far side (`bandsOf`): a band between its
  dark side and its paint, and a lighter one toward the light, each the body moved toward the light by a share of
  the lit side's lift, their tones by the setting. The no-gradient reading of a body curving away: steps, never a
  falloff. A flat-sided shape already has this in its facets; a round one takes the bands as the sphere does.

Nothing see-through, no blur, no gradient (2026-09-16). **Depth stays** (C15 keeps it beside the textures); the
grain went the same night, when his sheet of swatches brought the textures back by hand (C15). The defaults leave every
body as it was: depth 0 draws Bali's version 15 exactly as before, and the six version 1s are plain.

## C15. Textures, drawn by hand on the surface

> "I see what you did. But I have better ideas. Take inspiration from the image I provide and then update the
> textures." Then, of the first try: "The texture is being applied as a plain flat image and it doesn't adapt to the
> face of the shape … Bali is a sphere and the lines are straight instead of bending based on the surface of the
> agent. I did not like rays, scribble, dashes, pebbles. Actually I loved stripes and contours. I want to see more
> variations like that. And try to create more textures. Find better inspirations." (his, 2026-09-30, with a sheet of
> twenty-four hand-made swatches)

His sheet is flat, two-tone and made by hand — a bright ground and one mark colour each. **A texture is marks drawn by
hand on the surface itself** (`lib/agent-texture.ts`, version 5; version 4, the same night, laid them on the screen as
a flat picture, and he saw it):

- **Patches.** Each solid says what its surface is made of, as sheets: the cube's six faces, each its own sheet with
  across along its edges; the cylinder's side as one sheet round, and its two ends; the cone's side from rim to tip
  and its base; the hemisphere's dome, longitude by latitude, and its base; the sphere one sheet of longitude and
  latitude, its front at the middle. The marks are drawn on the flat sheet by hand — placed, sized and bent by a
  seeded jitter, the same every frame, by his **Wobble** — then every point is carried onto the surface, turned as the
  body is, dropped where the surface faces away (a line breaks there), and projected as the body is. So a cube's grid
  runs along each face's edges and breaks at them, as paint on a box does; the sphere's stripes are its meridians,
  narrowing toward the rim, and its contours ring its front and flatten toward the edge; a cylinder's stripes follow its
  side round; and turning the body turns the drawing with it.
- **His family** — line textures that read as the form, from stripes and contours: **Stripes, Zebra, Meridians,
  Latitudes, Contours, Spiral, Strata, Waves, Chevron, Hatch, Grid** — and what surfaces are made of: **Bricks, Weave,
  Scales, Honeycomb, Crackle, Woodgrain, Marble, Dots, Splatter, Smears** (textiles, stone, glaze, coats, print).
  Twenty-one. Rays, scribble, dashes and pebbles went.
- **Two tones, flat, no gradient**: lines stroked with round ends, shapes filled, each in the mark colour toned as the
  surface it is on (the dark side's darker). The settings — Texture, Size, Wobble, Colour, and Depth (C14) — are the
  Surface group's and the character's. Default None: nothing stored changes its look.

- **To the edge** (his, the same night: *"their texture ends even before reaching the tip of the agent … only bricks,
  waves and scales managed to get it right"*). The sphere's drawing was fitted to a circle, and Bali at rest is a
  puddle, wider and flatter than one: wherever the body bulged past the circle the drawing stopped short, and a thin rim
  was left bare besides. Now how far out a point is on the sphere — 0 at the front, 1 at the rim — is laid along the
  body's own outline in that direction (`radialOf`), so the drawing reaches the edge of the body as it is drawn, and a
  shape is kept while most of it faces you, the body cutting what crosses the rim.

- **Smooth** (his, the same night: *"regarding scales and meridians I expect them to be more smooth. Right now they
  look very uneven"*). The wobble was a shake — a random push at every point of a line — and a line was ten straight
  pieces. Now a hand-drawn line wavers in one or two long bows (`drawn`), each scale is one arc with its own size and
  place rather than a jittered rim, and every line is drawn as a smooth curve through its points (`smooth`). The hand
  is still there; it no longer trembles. His picks at this pass: meridians, smears, woodgrain, dots, contours, scales,
  bricks, waves, honeycomb.

- **Part of the body, not laid on it** (his, the same night: *"instead of white lines which match with the eyes, can
  we add opacity to these lines so that the lines feel like they are part of the body rather than like an externally
  applied texture"*). **Opacity**, a setting: the marks' colour mixed into the paint by that much — at 0.45, the
  default, a "light" mark is the body's paint mixed 45% toward white — then toned as the surface under it is, so a mark
  is a tint of the body and shades with it, and no longer matches the eyes. It is a mix, flat: nothing is see-through
  (2026-09-16), which is why the name says what it looks like and the doc says what it is.

- **The tint keeps the paint's hue** (his, the same night: *"on violet it is becoming pink"*). Mixing violet toward
  white drifts it pink, so a light or a dark mark is now the paint itself, lighter or darker by the opacity, with its
  hue and its chroma kept (`oklch(from …)`); a named colour — lime on violet — is still mixed into the paint. Meridians
  and latitudes are ruled, as a globe's are (his: *"the lines are still crooked"*), and a hexagon keeps its corners
  (`sharp`) where every other line is drawn smooth.

Version 5 of the textures, awaiting his look.

## C16. The eyes have a colour

> "In character, I should also be able to set the color of the eyes." (his, 2026-10-01)

- **Colour, on the Eyes card**, under Height: one of the agent's colours by name, a select with a dot of each, as the
  brows' is (C11). It is the face's `eye-colour`, declared with the eyes (`lib/agent-face`), so the motion studio's
  Eyes group has it too, and a motion can switch it at a row's start.
- **Where it goes is the pupils' call**: a solid eye is drawn in it; a Dot is a pupil in it on a light eye; a Shine is
  a light catchlight on an eye in it. The light of the eye and the catchlight stay light.
- **Ink, the default, is the colour they have always been**: the paint's ink on a solid eye, and `deep` with a pupil
  or a catchlight (`eyeColours` in `lib/agent-colours`), so every character and version saved before it draws as it
  did, and a pupil in ink never vanishes into the light eye it sits on (on violet, the ink is white). The select's dots
  are the eyes' colours, so under a pupil Ink shows as Deep.

Version 1, awaiting his look.

## C17. Every colour is picked the paint's way

> "In the consistency with the color picker is not there. We have to keep it consistent, so make it part of the design
> system. That color pickers should always be like the paint we have in character studio." (his, 2026-10-01)

- **The colour picker is the design system's** (`@no-origins/ui/components/colour-picker`, `ColourPicker`): the
  Paint line's swatches, moved into the package whole. Swatches composed from `ToggleGroup`, one a colour, the one
  picked pressed with the foreground's edge, each a circle with a dot of its colour, standing together from its start
  at the small size and sharing out a column too narrow for them rather than wrapping. One is always picked. Written for
  the system, since no registry has one; on the showcase's molecules page.
- **Every pick of a colour is one.** Here: the paint, and every colour by name — the eyes' (C16), the brows', the
  texture's — whose swatches are what each name is on the agent now (the eyes' through `eyeColours`). In the motion
  studio: the agent's paint and its colours, on the bench and on a state's rows, where a token carries its swatches
  (`Token.swatches`, from the values: the paint makes the ink). On the portfolio's accent jig: the four accents
  (Neutral, Lime, Violet) and the work tab's name on light. A select of names and a row of worded toggles for a colour
  are gone.
- **Each swatch is named in its title** and as its accessible name. Two can look alike — on a violet body Paint and
  Violet are one colour, and Ink and Light another — and the name is what tells them apart: the reason C11 made a
  colour by name a select, which he has overruled for consistency.

Version 1, awaiting his look.

## C18. The shapes' edges are smooth

> "The edges of all shapes in … agent character are not smooth I can see the lines and … some weird edges and …
> corners. We want these shapes to be smooth." (his, 2026-10-01)

> "Now when I select cube shape, the edges are just a few subdivisions it's not even smooth." (his, the same day, of
> version 4)

**Version 5 of the shapes** (`lib/agent-shape.ts`). What he saw first was version 3's facets: five stripes of tone along
every rounded edge, a star of triangles at every corner where the fans met, an outline of straight pieces round each
corner, and on the round solids an outline that was the hull of a few rings of points, so the hemisphere's dome was a
handful of straight sides with corners between them. **Version 4** painted one tone a face and one an edge, each point
the nearest of those ways' tone: clean, but an edge read as a chamfer, three flat bands, not a round. Version 5 tones
the round itself.

- **Toned where it faces.** A face is its own tone, as it always was. Every point of an edge's quarter-round and of a
  corner's ball wears the tone of the way it faces there (`facing`), drawn in steps of a twenty-fourth (`TONE_STEPS`):
  an edge rounds from one face's tone to the next in steps of about a pixel, too fine to see, and a corner with them.
  Flat colour still, each step one flat path, and what is one step is one path, so nothing shows between them. It
  reads as a smooth round, which is what he asked for, and it is as near a gradient as flat colour comes: on the
  rounds only, never a sweep across a face.
- **Exact boundaries.** An edge is cut into runs of one step along its round, each run ending where the tone crosses
  into the next, found by halving (`runsOf`). A corner's ball is cut to its horizon, then into the four quarters where
  `facing` is a straight sum, then between the circles where its tone crosses a step (`cornerOf`), so every boundary
  is an arc on the ball; a step's circle that lies wholly inside a quarter is a hole in the region round it. Where an
  edge's straight runs meet a corner's curved ones, the steps turn a little sharply, as the shading of a rounded box
  does where its cylinder meets its ball; at the studio's size it shows only as a soft patch.
- **The outline is the solid's, finely** (since version 4). It is the hull of the horizon of each corner's ball, as
  the camera sees it, and of the rims' quarter-rounds, a few degrees apart; the hemisphere's dome is the horizon of the
  ball it is part of. It is found as the shape stands, then bent with everything else, so where the bowl bends a side
  in, the outline follows it. The round solids used to take the hull after the bend, which bridged it. At the studio's
  size the cone's lower sides now curve in as the pyramid's always have. The round solids keep the sphere's two tones.
- **Measured.** Every shape turned through 80° on each axis in half-degree steps: its outline moves at most 0.9 px a
  step, where version 3 moved up to 1.5 px. The pyramid's apex was a 66° point and is now an 11° curve. Nothing passes
  the ring. A flat-sided shape is at most 34 paths of the `Agent`'s 40 over every rotation, and every texture still
  draws on every shape. A cube frame takes about 1.5 ms where version 3 took 0.7, its paths about 49 K characters where
  they were 21 K, and the browser paints it every frame without dropping one.

Version 5 of the shapes, awaiting his look.

## C19. An agent is named once; its versions are major and minor

> "I don't want to give a name for each version … I should be able to create new agent so that means I should be able
> to name it and then once I have the name next time I can just keep publishing it with different versions. We should
> have major versions and minor versions. And minor versions should auto increment. Major versions is when I change
> it. So let's say if I am in version 2.1, and then if I publish directly then it should auto increment the minor
> version and publish it." (his, 2026-10-01)

What was wrong: the bar's pill held the agent's select, the draft's state, a field for the version's name and Publish,
and Publish waited for a name. Once C13 put the select at its start, the field was left about 40 px wide, its
placeholder ("Name v16") showing as an "N", and nothing said that a name was what Publish was waiting for.

- **A version is `major.minor`, and has no name.** Publish in the bar makes the latest version's next minor at a
  press: 15.0 → 15.1 → 15.2. **A new major** is his to make: the versions' dialog opens with the next one, 16.0, and
  its Publish. From then on the bar's Publish makes 16.1. A character's first version is 1.0. The next is always counted
  from the latest version, not from the one pages show: going back to 14.0 from 15.2 makes the next minor 15.3, and
  nothing is renumbered (C6).
- **What was stored keeps its number, at .0**: Bali's 12 to 15 are 12.0 to 15.0, the five's 1 is 1.0, so the next
  publish is 15.1 and 1.1. Their names stay and show beside them in the versions; a version published since has none.
- **A new agent is made by its name** (`New agent…`, at the end of the bar's agent select, under a line, as a choice's
  extra is at the end of its list, C11). It asks for the name and nothing else, and opens with the draft at the look
  the code declares (`resolveCharacter`, the package's defaults), with no versions. A name another agent has, in any
  case, is refused. Renaming one is not here yet.
- **The bar's pill** is the agent's select, the draft's state and **Publish 15.1**. A bar four cells across (a short
  laptop) drops the state's words and shows Publish as its mark and the number. The agent's select now gives way first,
  cutting a long name, and opens its list above the bar, whole: laid over its trigger on the field's last row, it
  scrolled and hid the new agent at its end.
- **The database** (`supabase/migrations/…_studio_minor_versions.sql`): `studio_versions.number` is the major and a
  new `minor` (from 0) counts the publishes within it. It is unique per item with the number, and the trigger refuses
  anything but the latest's next minor or the next major's .0. The name is optional, and a name given is still never
  empty and never repeated in its item. `studio_publish` takes a step, `minor` or `major`. Its default is `major`, what
  every publish was, so **the motion studio's call is unchanged**: it still names each motion version and numbers
  them whole. `studio_new_character` makes a character and its draft in one go. Stored versions were not written: the
  column's default filled them, which fires no trigger.

**Built the same day.** Checked against the local database through the studio, signed in: a new agent made by its
name and opened at Publish 1.0, published to 1.0 and 1.1, a major from the versions to 2.0 (2.0 Showing, the bar at
2.1), the same name in capitals refused, and Bali opened again at 15.1. The probe is `e2e/.mcp/character-versions.mjs`,
and the agent it made was deleted with its versions. **Pushed to the hosted database the same day**, before the code that
calls it was deployed. The studio deployed before it still published against it, with a name and no step, as the
motion studio does.

Version 1, awaiting his look.

## C20. The paints stand out from the page

> "Remove peach yellow and gray colors for characters and replace them with better colors, high contrast. I mean check
> for the contrast and then what if there are possible colors then add them." (his, 2026-10-01)

**Measured** with WCAG 2's contrast ratio, from the tokens as they are. An agent sits on the page and in its nest (the
muted tint, lime 14% over the page), so a paint is measured against all four: the light page, the light nest, the dark
page, the dark nest. Its eyes are measured against its paint, in its ink. 3 : 1 is WCAG's minimum for a shape against
what is next to it (1.4.11). The five pastels were drawn for the dark theme: each is 6.4 to 15 : 1 there, and on the
light page

| Paint | Light page | Light nest | Dark page | Dark nest | Eyes |
|---|---|---|---|---|---|
| peach | 1.75 | 1.69 | 11.3 | 9.1 | 11.3 |
| yellow | 1.30 | 1.25 | 15.2 | 12.3 | 15.2 |
| grey | 2.49 | 2.40 | 8.0 | 6.4 | 8.0 |

**Why mid-tones.** No one colour is far from both white and the dark page. Against all four backgrounds at 3.3 : 1 or
more, a paint's luminance must lie between about 0.17 and 0.26. With dark eyes at 5 : 1 or more, between 0.22 and
0.26. Violet sits there already (0.21). So the new paints are mid-tones of strong hues, with the same dark eyes the
pastels had. **No yellow passes**: at that luminance yellow is mustard, and gold, at hue 75, is the nearest one comes.

**Version 2 of the paints** (`AGENT_PAINTS`, `lib/agent-colours.ts`; `--agent-*` in globals.css), nine round the
wheel: lime, violet, pink, then

| Paint | oklch | Worst of the four | Eyes |
|---|---|---|---|
| Red | 0.642 0.207 27 | 3.55 | 5.38 |
| Orange | 0.649 0.167 50 | 3.32 | 5.74 |
| Gold | 0.64 0.131 75 | 3.31 | 5.76 |
| Green | 0.603 0.133 150 | 3.55 | 5.38 |
| Teal | 0.606 0.094 190 | 3.55 | 5.38 |

then blue. Each is held below the gamut's edge, where these hues turn neon. Orange and gold are a little lighter than
the rest (3.3 rather than 3.55 : 1) so they read warm rather than brown.

- **A paint that went is read as the one it became** (`RENAMED_PAINTS`: peach as orange, yellow as gold, grey as teal),
  through a choice's `renamed` in the declaration (`lib/properties.ts`) and the tokens' reader, so a look saved in one
  keeps its place on the wheel rather than falling to the default. Drafts take the new name at their next save.
  Versions are frozen with the old one and drawn in the new colour, as a paint always was its token's value. On the
  local database: Mira's draft (peach) is orange; Zaza's was yellow and became green, picked in the studio; frozen
  versions of Zaza, Lola and Mira wear yellow, peach or grey.
- **The swatches are smaller.** Nine share the Paint line's two columns as seven did, 18 px each at 1440 × 900 where
  seven were about 24. 24 px is WCAG 2.2's minimum target (2.5.8).
- **Kept, and still under 3 : 1 on the light page**: lime (1.32), pink (1.98) and blue (2.28), each fine on the dark
  page. Lime is the system's accent. Pink and blue could each be a mid-tone of its hue in the same way. Violet's eyes
  are white, at 3.82 : 1. In dark ink they would be 4.96. None of these changed: they are his to decide.

Version 2 of the paints, awaiting his look.

## Open

- **What goes round the cell**: his to name. The body (C4), the face (C7), the body's shape, colour, texture and rest
  (C10), and the draft's bar (C11) stand there now.
- **The shapes in the motion studio**: none yet — its jigs have no shape token until they are made from the
  declaration (the motion studio's session). A shape that turns with its stretch, and a tail that suits it, are open.
- **Their tokens' names**: the sphere's, `--motion-sphere-*`, because that is what the model reads. Appearance tokens
  may want their own family when the model is split into motion and appearance.
- **The appearance properties** he listed (texture, shape, colour, sitting, hovering, accessories): each one's
  properties are to be decided with him. Motion.md M20 describes a typed property model (a value type and its meta for
  each property, versions kept in the database) for any component. This studio is likely its first user, and that is
  still to be agreed with him.
- **The tables are on the local database only.** `…_studio_versions.sql` is applied locally; the hosted push is his.
  Its seed is version 12 whole as the package resolves it: regenerate it before that push if a default has moved,
  since once pushed it is frozen.
- **Uploads for symbols**: the symbols are played by motions, so they are not in the library, and nothing here uploads
  one yet.
- **The body's other look settings** (paint, material, the tail's length and taper, spread) are declared but not on
  the page: only Size and Shade are, as he named them.
- **Whether the agent sits or is centred in its cell.** It sits on the floor now because that is how the sphere rests.
  How it sits and how it hovers are on his list.
- **Its hosting**: the Vercel project and the Supabase redirect URL are his steps (`apps/character/CLAUDE.md`).
