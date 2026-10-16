@AGENTS.md

# apps/orbit — Orbit, the world

`orbit.no-origins.com`, :3005. **Orbit is the world**: the 3D world that is No Origins' base UI, where every app
becomes a place (World.md W1). **World.md** is its document; read it before changing anything here. It is a draft
until he signs it off.

```bash
pnpm --filter orbit dev              # :3005
```

## The shape

- **The world is drawn in the root layout** (`src/app/layout.tsx`, World.md W2) by `World`
  (`src/components/world.tsx`): one canvas, mounted once, so it outlives every navigation. Each route is a place or a
  builder's page, and its page is the interface over the world (W10). The route picks the view (`viewOf`).
- **The engine is `src/world/`** (W12), loaded after the page, never on the server:
  - `engine.ts`: the WebGPU renderer (WebGL 2 behind it, W9), the scene, the camera and the drag round what a builder's
    view looks at; it **draws on demand** (W8): a resize, a setting, a view, a drag. On a builder's page it centres what
    it looks at in the room the cards leave (every `data-world-aside`, `roomLeft`: a narrow card on the left or the
    right, a wide one along the top or the bottom; the Sectors page has two, W89).
  - `start.ts`: the cells (2 m, `CELL`), the visitor's cell (`VISITOR`: where the human stands as a visit begins,
    World.md W51, the camera behind it), the human's page's block (`HUMAN_STAND`, a `Solid`, and `HUMAN_TOP`), the
    views (`viewFor`, `viewOf`) and which element a view shows alone (`aloneOn`: the mountain's and the human's pages).
    The portal's, the trees', the pipes' and the roads' views went with W93.
  - `orbit.ts` (no three.js): the world's size (`WorldSize`, World.md W29, W42): a cylinder, its round centred at x/z
    0, height up from y 0, fixed at 1000 m across and 1000 m high (`WORLD_SIZE`, his, W33, W42), its top the clouds'
    underside; `BoxSize`, `WORLD_SIZE_START` and `WORLD_SIZE_RANGE` are the frozen World versions' boxes. The default block
    is 1 × 1 × 0.25 m (`BASE_BLOCK`, W4); `SECTOR_BLOCK` (0.3 m) and `BLOCK` (10 × 10 × 1 m), with the
    `[column, row, level]` lattice helpers, are kept only for frozen versions. Camera X/Z limits are independent of
    height: `onPlane`, `overGroundPlane` and `lookingOverPlane` hold every camera above ground and half a metre inside
    the world's round side and top (`edgesOf`), from the world's size in the settings; `slideInside` carries a
    looked-round camera and what it looks at along the side instead of stopping them. North is −Z, East +X, South +Z, West −X. The sphere is historical (W16).
  - `hierarchy.ts` (no three.js; World.md W4, W25, W81, W91): **what is built**, flat data: units, sectors alone (W81;
    his: "I don't want to have habitat and ecosystems"; W91: "let's even remove zones. We'll only have sectors"): a
    `Sector` its name, its place (the middle of its floor, in the world) and its size (`Dimensions`, 50–1000 m each
    way, his); and what each sector holds, its assets, each naming its `sector`: blocks (W93: `BlockAsset`, its middle
    in metres from the sector's floor's, its size 1 to 100 each way in its `unit`, m or cm, its `rotation` in degrees
    round X, Y and Z, three.js's `YXZ`, its colour and its `texture`, smooth or grain), placed elements (a mountain, a
    human, W89, or a tree placed alone before groves, with its own `look`), pipes and roads (each its own `look`, W93),
    and groves (`GroveAsset`, W89, W91, W93: `at`, its middle in whole metres from the
    sector's floor's, its `area` (`area.ts`, no three.js: `Area` size, corners a share of half its shorter side, 1 a
    pill, and a hollow `Outline` from its middle; `onGround`, `areaLines`, `groundOf`, `AREA_START`),
    its trees' `look` (`tree.ts`'s `TreeLook`, W93), spacing (W97: metres apart, 1 to 50, `SPACING_LEAST`/`_MOST`; one kept with W89's density reads as the spacing it stood at, `spacingOfDensity`), heights (1 to 100 m), seed; `withGroveAt`, `withGrove`,
    `groveOf`; its trees `grove.ts`'s `groveTrees`, one a cell of a lattice anchored to the grove's own middle, on its
    area's ground alone, inside its sector, each on the ground of the open space at the grove's height `y`, `footAt`, W96, W99, at most
    `GROVE_MOST`). A sector's place and a placed element's are lattice
    steps `[x m, z m, level]`. `worldOf` mends what was kept (`mended`: a world kept with ecosystems and habitats reads
    as sectors where they stood, the whole world in size; what a zone held (W81 to W90) is its sector's, a zone's old
    place added to its assets', a W89 grove taking its zone's shape as its area, nothing moving; a block kept on the
    lattice reads as the same block, `latticeBlock`, in centimetres where it is a metre or less every way, else in whole
    metres; a pipe, a road or a grove kept with variants takes its variant's look from the published copy, a grove its
    first's; a portal is let go; sectors in the order kept, so a world read again is the same); `WORLD_START` is his
    published world read so. `makeSector` (100 m, with the default block, `BLOCK_START`, 100 × 100 × 25 cm, at its
    middle, at the world's middle or east while that block would stand in one), `remove` (not the last sector,
    `keptBecause`), `withSector`, `rename`, `withBlockAt`, `withBlocksChanged`, `withBlocksMoved` (metres),
    `withBlocksTurned`, `withoutAsset`; `sectorsOf`/`assetsOf`/`sectorOf`; `roomOf` a sector's box in metres,
    `sectorInside`. **A block where it stands is a `Solid`** (`solidsOf`): its middle, its half sizes and its three axes
    (`axesOf`, `bodyOf`); `solidUnder` meets one along a ray (its face's way out), `insideSolid`, `cornersOf`,
    `solidInside` (inside the world), `overlapsOf` (separating axes, turned or not), `reachAlong` and `landing` (a block
    flush with a face, its sides across a square face kept to its step, `stepOf`: a quarter metre or a centimetre).
    `Box`, `Size`, `SIZE_MOST` and `occupancyOf` are the lattice's, kept for frozen versions.
  - `build-orbit.ts`: the open painted sky background (`build-fluid-sky.ts`), and no ground plane (World.md W24: the
    land is what is built). There is no dome or continuous water; ponds will be added later.
    `build-clouds.ts` is the world's ceiling (W33, option B): a sphere drawn with the sky, behind everything, where each
    pixel meets the cloud layer at the world's height, climbs it to the first mass, and paints it by light (pale cream,
    rose and sage, W36), its edges feathered like a dry brush, with a wash of sky growing with distance into the
    horizon's haze; its layer, edge, paint and motion are the clouds' jig's (`clouds.ts`, W38), read as uniforms, so a
    change on the card is in the sky at once. The ceilings he saw are `build-clouds-v21.ts` and `-v22.ts`.
    `cloud-noise.ts` makes its one 256 × 256 tiling noise image and mip levels, once a page. There is no worker, 3D
    field or separate cloud pass (v18's are frozen as `*-v18.ts`). The engine redraws at most every 50 ms while only
    the sky and clouds move. Sky and clouds have independent clocks; pause/zero speed/reduced motion rests them (W8).
    `build-world-walls.ts` closes the cylinder with cloud paint that blends lower white gas into the ceiling by height; the ceiling is a circular cap with the same paint at its rim (`boundary-paint.ts`, W43). `build-world-base.ts` conceals the floor with white gas/fog, integrating density through
    `build-base-fog.ts` along rays to each mountain face and the sky, with only
    mountains' tips standing at y 0 inside the cylinder and emerging through the gas (W34, W37); `build-mountains.ts` shapes steep stone monoliths with mossy feet, vertical fissures and thin slanted mirror caps (W50); Environment’s Mountains group controls spaced random placement (W41); Mountain v2 holds the foot stable, removes erosion and paints irregular rising/falling moss (W53); it has its own speed, wind and clock, with global pause behavior; Environment’s Base clouds group tunes it (W40).
    `build-blocks.ts` (version 5, W93) draws a sector's blocks, each face of each turned box toned by the sun as it
    faces, a mesh of the smooth and a mesh of the grained (`grainOf`), and the ghost, a box turned as the block is (the
    next one's, the one Select would pick, the ones picked); version 4, the lattice's one solid cut round a portal, is
    `build-blocks-v4.ts`. A block a pipe is subtracted from (W95, `BlockAsset.cuts`, `withCut`; `withoutAsset` lets a
    removed pipe's cuts go) is a part of its own (`cut <id>`, `buildCutBlock`): its faces drawn from both sides, the
    inside `INSIDE_SHADE`, and a `maskNode` discarding what lies inside the lengths of its pipes that pass through it
    (`cutSegmentsOf`, at most 128, a uniform array updated by `cutParts` whenever the pipes are drawn, so a joint moved
    moves its hole with no shader made anew). Fog is `scene.fog`.
  - **A builder is two files**: what it is, its controls and its motion, with no three.js, so a page reads it without
    loading the world (`tree.ts`), and what makes it (`build-tree.ts`). The portal's (`portal.ts`, `build-portal.ts`)
    stay for the frozen versions; nothing draws a portal since W93.
  - **The trees** (World.md W67, W68, W85, W93; his: "Trees will have trunk and flower. Trunk will have min and max
    lenth - from 1m to 100m, color and bend radius. Flowers will now be Cube, Cylinder and Allium. They will not have
    lights. They will just have colors. The sizes of the flower should be derived from size of trunk", and their look
    set "As they are placed, like a block"): `tree.ts` (no three.js), version 9 (W98; 8 is 9 with one shape), has no variants and no page. A grove's
    `TreeLook` is its trees': the trunk's Colour and Bend radius (the tallest tree's, `BEND_RADIUS`), the flower's Shapes
    (`flowers`, several, W98; `FlowerShape`: cube, cylinder, allium, `FLOWER_SHAPES`; a look kept with one `flower`
    reads as that alone) and Colours (several, `FLOWER_COLOURS`, the sheet's blue
    beside the world's), set on the Sectors page's item card (`TRUNK_CONTROLS`, `FLOWER_CONTROLS`); the grove holds its
    Length, 1 to 100 m (`TRUNK_LENGTH`). `treeOf(look, seed, x, z, lean, height, tallest, own)` is one tree: its length
    its own, its radius `SIZES.trunk` of it, bent from its foot on the look's Bend radius times its share of the tallest
    (so a grove's trees are one shape at their sizes), widened to `TIP_TURN`, its colour one of the look's by its seed
    (version 4's draws, so a tree's colour stays) unless it has its own, and its shape one of the look's by the draw
    after (`Tree.flower`, W98), so shapes and colours mix freely; `build-tree.ts` draws each tree's own. **Every size of the flower is a share of the
    trunk's length** (`SIZES`: a cube 0.16 a side, a cylinder 0.08 in radius and 0.027 long, an allium's head 0.133 in
    radius of 200 florets three tenths of it across round a core of seven tenths, its stalks shaded half way to the
    trunk, all from his tree at 75 m). `trunkAt`, `tipTurnOf`, `tallestTurnOf`, `floretsOf` (a Fibonacci sphere).
    `TREE_LOOK_START` is his tree, Awakening light, as a look (`lookOfVariant`; `lookOfVariantId` and
    `lengthsOfVariantId` read a kept variant id from the published copy, `tree-v7.ts`'s `TREE_VARIANTS`); `treeLookOf`
    reads a kept look. `build-tree.ts` makes them (`buildTrees`): a `TubeGeometry` of the tree's radius along its arc,
    capped at its tip, and its flower on the tangent turned by its seed: one unit cube, one unit cylinder and one
    allium head (`floretGeometry`, an `InstancedMesh` a tree, and its core) made once for every tree and each scaled to
    its own; trunk and flower `MeshStandardNodeMaterial`s, a plain colour lit by the sun, casting shadows, taking the
    base gas (`airAt`), lighting nothing (version 7's point-light pool went). Each tree's group carries its asset's id
    (its grove's). Versions 7 (a variant's light) to 1 are frozen (`tree-v7.ts` … `tree-v1.ts`, `build-tree-v7.ts` …).
  - **Pipes and roads** (World.md W84, W87, W93; his: "for pipes and roads, we can have something like skeleton",
    then "Pipes will have Color and Radius. The way we create pipes is by placing start and then the sub sequent joints.
    The pipe will take share as we place the points", "Roads will have color, start and end similar to Pipes, width and
    thickness"): elements shaped by a skeleton, drawn on the Sectors page, each in its own look. `skeleton.ts` (no
    three.js) is the skeleton, its joints in metres from start to end, a quarter metre a step (`onLattice`, W87), each
    with a `Way` (turn, tilt) or none, Free (`directionOf`, `wayOf`, `wayAlong`; `centreOf`/`jointOf`: a pipe's middle
    at a joint, its radius off it across its way; `withJointAfter`, `withoutJoint`, two to `JOINTS_MOST`, 32);
    `pipe.ts` (Pipes v3, W94: `PipeLook`, Colour, Radius and `startFace`/`endFace`, `PIPE_CONTROLS`, `pipeEndsOf`,
    `pipeLookOf` (a face not kept is on), `pipeLookOfVariant` for a pipe kept with a variant of `pipe-v1.ts`) and `road.ts` (Roads v2: `RoadLook`, Colour, Width and Thickness,
    `ROAD_CONTROLS`, no lines). `build-skeletons.ts` (version 2) makes them along one centripetal Catmull-Rom through
    every joint (`curveOf`): a pipe a `TubeGeometry` its radius over its joints, a disc closing each end that keeps its face,
    and where one is open a lining inside (`INSIDE_SHADE` of its colour, `BackSide`), a little glossy (`PIPE_GLOSS`);
    `pipeCutOf` is a pipe's cut (W95: the points its tube's rings stand at, a radius a little inside its own); a road a slab of its own faces, level from side to side (never the curve's Frenet frame, which flips
    at every change of bend); both `MeshStandardNodeMaterial`, lit by the sun, fogged as the blocks are; and
    `buildSkeletonOverlay`, the bones and a ball a joint, drawn over everything, each ball kept a few pixels by
    `scaleFor` before every render. A joint with a way holds the curve to it for a reach either side (`LEAD`,
    `courseOf`), and the overlay draws an arrow at the picked joint (`tip()` its head). Version 1's builder (a
    variant's look, Gloss, the road's lines) is `build-skeletons-v1.ts`. A placed one is a `PipeAsset` or `RoadAsset` of
    a sector (`SkeletonAsset`: kind, `look`, `joints` in metres from its sector's floor and `ways`; one kept in W84's
    lattice steps is read as metres; `skeletonsOf`, `withSkeletonAt`, `withSkeleton`; `isPlaced`/`isSkeleton`/`isBlock`
    tell the assets apart, and `placedOf` is mountains, humans and trees placed alone); the engine makes a part each
    (`skeleton <id>`), so a joint moved remakes its own.
  - **The human, version 9, two Forms** (World.md W102–W104, W107): the **Suit**, version 5's figure (below), and the
    **Clay**, his turnaround's. Version 8 is frozen (`human-v8.ts`, `build-human-v8.ts`, `clay-turnaround-v8.ts`,
    `clay-skin-v8.ts`, and its published human data in `published-humans-v8.ts`). Version 7 is frozen (`human-v7.ts`, `build-human-v7.ts`, `clay-turnaround-v7.ts`),
    beside version 6. Its measured outline comes from `scripts/clay/consensus.json`; regenerate `clay-turnaround.ts`
    using `generate.mjs` and `tuning.json` (README beside them). The torso, arms, legs and neck are **one connected
    surface**, meshed with the arms open 30 degrees so contact down the torso does not weld them to it. There are
    no fixed shoulder covers. `ForkPart` morphs the leg section fields into the torso above the crotch without caps.
    `clay-skin.ts` fairs influences along the mesh, blends bone transforms as dual quaternions, fairs the shoulder
    and hip neighbourhoods after posing and recomputes normals on that surface. It starts from bind positions each
    time, skips unchanged poses, and updates bounds for picking. The cloth grain stays anchored to a rest-position
    attribute. Its head is separate, the measured faceted outline kept, its depth faired. The visible neck starts
    at 2 cm. A rough physical material has restrained cloth sheen and fine grain. The rig's pivots carry it at the
    shoulders and hips; the elbows and knees carry nothing. `look.eye` is the head group's centre on the head bone,
    found by `helmetEye`; `legOf` gives its stride's length. Clay alone on `/build/human` gets a warm inspection key,
    diffuse fill, metre-scale shadows (`buildOrbit.inspectHuman`), and a physically lit shadow-receiving 4 × 4 m block
    (`build-human-stand.ts`). Element inspectors omit world blocks as well as placed elements so the figure stays
    visible. Leaving the page, or choosing Suit, restores the world's lighting and painted block. Portrait framing
    keeps the figure clear of its card. Compatible tuning stays under the v6 key; the renderer version is 9.
    Clay's Motion choices are **Gentle Hover**, **Jet Boost** and **Float Glide** (W107), beside Still, Walking and
    Running. `human-flight.ts` samples the three poses and an interruptible takeoff/mode-change/landing transition;
    selecting Still lands in the held Posture. `build-human-flight.ts` draws warm soft propulsion from the posed soles,
    a few embers and fine open glide ribbons, with no hardware on the body. The two propulsion lights remain in the
    scene at zero intensity when idle so takeoff does not rebuild the skin's lighting shader. A motion change keeps
    the same Clay mesh. All motion values read `--motion-human-clay-*` fallbacks; reduced motion holds a stationary
    airborne pose and settles immediately. World flight uses the same poses/effects; its travel controls still own
    the actual height. Suit's existing motion is retained.
  - **The human** (World.md W51; his: "a human character of 8 feet … human skeleton at the least to travel in the
    orbit"): `human.ts` (no three.js) is what it is, 8 feet tall (`HUMAN_HEIGHT`), the design system's human rig's
    joints (`@no-origins/ui/lib/human-motion`, `HUMAN_JOINTS`) scaled to its height (`UNIT`), its jig, and how it
    travels (`figureStep`: it faces its way over the Turn, walks up to a speed and runs over it, stands under the
    Stands under while the camera coasts, a stride's cycle covering the ground it went so its feet plant but never
    slower than the gait's own cycle, its limbs starting and stopping over the Settle; `poseOf` is its
    limbs now, from the rig's walk and run, the `--motion-human-*` tokens read off the canvas as it sets off).
    `lookOf` is its look (World.md W65, W66, W69): his sketch's silhouette, measured, as round volumes, each part an
    exact distance of its own kind (a rounded slab, a bar between two balls, a ball), every bar and ball its own
    width from the config, in nine pieces (`Piece`) that overlap rather than join: the trunk (the body, the neck, the
    shoulders' slopes and the arms' domes) on the chest, spine and hips by height, and on each side an upper arm, a
    forearm, a thigh and a shin, each on one bone, a joint's ball in both its pieces (the lower a millimetre smaller)
    so no bend opens a seam; the head, a ball with a glass visor in a metal rim (`Head`); and the boosters, every
    hand and foot cut flat with a darkened hole and a matte black ring turned from a rectangle, standing out of the
    cut by the Extrude with its corners rounded by the Curve, the feet standing on theirs (`Cut`). An arm tilts out just enough for its
    joints to keep the Groove and clear the legs' widest part. On its page it stands on `HUMAN_STAND` (4 × 4 m,
    `start.ts`) facing the camera in its Posture (`postureOf`, the rig's joints as data) or walks, runs, hovers or flies in place
    (`inPlaceOf`, Motion; the hover's and flight's numbers are `--motion-human-hover-*` and `-fly-*` tokens read with
    fallbacks, `readHoverMotion`); in the world it walks where the visitor goes, and the visitor looks out of its
    helmet (`helmetEye` in the engine: the ball's centre, the head bone's own attitude, the camera's Angle; the dish and
    the lens have an outside face alone, so nothing is drawn between the eye and the world, W69). **The eye holds steady**
    (W77): each frame the figure steps and is posed and then `aimEye` puts the camera in its head, never a frame behind;
    `steadyHead` puts the head bone where the figure's head would be standing upright, leaning with the gait's lean
    alone (no bounce, sway or twist, eased over the Gait's Settle), facing the camera's Turn and tilted down its Angle
    as the visitor steers them (eased over Steering's Smoothing), so the rim keeps its place in the view. **Steering**
    (W78, Camera v10): in the helmet (`inHelmet`) the figure faces the look whichever way it goes (`figureStep`'s
    `facing`); a drag looks round (`steerLook`; Drag: Slide keeps the drag over the ground), W A S D go by the view, A
    and D step or turn (`keysTurn`); the head's Expression and Looks at cursor are the figure's seen from outside.
    **Visor view**: `orbit.eyeAir` clears the air within Clear air of the eye and draws Haze of it past that
    (`build-base-fog.ts`), and Rim in view hides the rim, both in the helmet alone (set at the end of `build`). **The
    helmet's inside** (W79, Camera v11): `head lining`, the shell's line seen from within alone (`BackSide`, no
    shadows), its lip run in under the rim, shown in the helmet with Visor view's Inside, Inside colour, Inside light and Inside opacity (W80: under 100%
    transparent, no depth written). The head's Expression (`withExpression`, the bone's turn in
    degrees, data) is held over every pose, on the page, in motion and in the world, and the eye looks where it is
    held; with Looks at cursor on, the head turns to the pointer instead while it is over the canvas (`hold` and
    `cursorGaze` in the engine, `gazeAt` and `withGaze` in `human.ts`: seen from outside, at the point under the
    pointer half way between the head and the camera, so it turns by the pointer's angle from the view's middle; in the helmet, along the pointer's line as the eye held ahead casts it, so the view
    turns with the head and the pointer's line stays put), and off the canvas it is held in its Expression again. The visor's rim is a torch (a lit emissive rim and a `SpotLight` thrown
    from just outside the lens; Torch: On/Off, Colour, Strength (W90, kept as `torchBrightness`), Spread); Shows is Look, Head (the head alone),
    Skeleton or Boost (the feet's jets, flat-colour cones with a `PointLight` each, drawn whenever `boosting`: Shows
    Boost, or hovering or flying; Boost: Colour, Length, Strength, kept as `boostBrightness`). `build-human.ts` joins each piece's
    parts by a smooth union over its Blend (the trunk's a crease, widening round each dome), cuts the shin flat on the
    ground, samples each field within a budget of samples (only the parts within reach of a column), meshes it by its
    own marching cubes with a vertex a grid edge, and puts every vertex back on the exact surface with its gradient as
    its normal; a limb's piece is a plain `Mesh` on its bone, the trunk a `SkinnedMesh` (the skeleton is made after
    the bones stand, so its inverses are the rest pose; the look's shoulder, elbow and hand bones stand where the
    look's are). The head is lathed on the head bone: a shell with a round opening, a dark dish behind it, a metal
    ring and a glass lens (the world's glass, their reflection a plain sky).
    Fine surface relief is anchored to the figure, and its finish is matte. Shows: Skeleton draws version 1's rods and
    balls instead. Versions 1 (the skeleton), 2 (the cut-out slabs), 3 (the joined volumes), 4 (the domed surfaces) and
    5 (the Suit alone) are frozen (`human-v1.ts` to `human-v5.ts` and their builders). `HUMAN_VERSION` joins the mountain renderer
    version in `world.tsx`'s `rendererVersion`, so a development refresh replaces the persistent engine when either
    look changes. A version he
    has seen is frozen beside the next (`portal-v1.ts` to `portal-v6.ts` and their builders; 1 to 4 the hole's; the
    portal itself went with W93), and nothing draws them.
  - `store.ts`: a store a jig, and `worldStore` (what is built and placed, parsed by `worldOf`; `kept()` says whether
    this browser holds one, else the world is as published, `publishedWorld`), `buildStore` (the builder's state,
    `no-origins:orbit:build:v4` since W93: sector picked, tool, item, the next block's shape as the card has it,
    `BlockCard`, the blocks picked) and `placeStore` (the placing's, `place.ts`: a mountain's and a human's variant, the
    next pipe's, road's and grove's look, `pipeLook`, `roadLook`, `treeLook`, the next grove's area, Spacing (one kept as a density is let go, 32 m), Length and
    seed, the one picked and its joint), kept apart from the Sectors page's tuning (`spacesStore`, W25). Human v9 keeps
    `no-origins:orbit:human:v6`, reading v5's tuning once where it has none and letting v5's key go at the first change
    (it only adds to v5); v1 to v4's tuning stays in their keys.
    `environmentPageStore(page)` is the one atmosphere store with a Reset of that page's groups alone. The atmosphere,
    clouds, camera and map stores read the environment as published (`publishedEnvironment`, W75) wherever this
    browser keeps none of its own (`overPublished`).
  - **The libraries** (World.md W72, W73; `library.ts`, no three.js): each element's variants and the world, from
    the database: `libraryStore(kind, his, settingsOf)` reads the items of its kind, the current version of each
    with the anon key (everyone's) and, signed in with `orbit.draft.save`, the drafts too, over his published copy in
    code (`published.json`, `published.ts`: `PUBLISHED_MOUNTAINS`, `_HUMANS`, `_WORLD`, and `_TREES`, `_PORTALS`, `_PIPES`, `_ROADS`, read only for old worlds since W93, every
    id the item's uuid); `save` the picked variant's draft on its `rev`, `publish` the draft as the next minor
    (`studio_publish`), `create` an item with a new uuid and its first draft, `rename`, `remove` an item never
    published; `who` is loading · offline · visitor · editor and `may` what the token allows. `mountainLibrary`,
    `humanLibrary`, `worldLibrary` (one item, kind `world`), `environmentLibrary`
    (one item, kind `environment`, unnamed, W75: `EnvironmentData`, `{ atmosphere, clouds, camera, map }`, read by
    `environmentOf`; `PUBLISHED_ENVIRONMENT` its copy). `variants.ts` is a
    variant, `byId`, `newVariantId`, `nextName`; a kept variant is read against the jig (`configOf`). `mountainStore`
    is the mountain being tuned on its page. The trees', portal's, pipes' and roads' libraries and stores went with W93
    (the database keeps their items). `scripts/copy-published.mjs`
    (`pnpm --filter orbit copy:published`) writes what is published back into `published.json`. The browser client is
    `@no-origins/auth`'s; the keys are `NEXT_PUBLIC_SUPABASE_*` (without them everything draws the copy and nothing
    saves).
- **An element's page is a studio** (World.md W72, W73; his: "just like human, where there is only one base and a
  human standing there", then "I want mountains … and a dropdown of variants"): `aloneOn` (`start.ts`) says which
  element a view shows alone (the mountain's and the human's pages), and the engine draws nothing placed there (the
  mountain's page its one mountain at the middle, `mountainOf(config)` at the origin). Everywhere else the world is as
  placed (W73): `placedOf(settings.world)` with the libraries' variants by id (`settings.mountains`,
  `settings.humanVariants`), a mountain where it stands facing its turn (`PlacedMountain`, `buildWorldBase`), each
  grove's trees in its look (`groveTrees`, `treeOf`, `PlacedTree`, `buildTrees`), and the pipes and roads in theirs.
  **A card with a `library`** (`JigCard`, a
  `CardLibrary`: the store, the settings it would save, how a pick is applied, `single` for the world) opens with a
  Variants group: the picked one in a Select, then Save, Publish, New variant and Delete (which asks first) as icon
  buttons (W76), its Name under;
  the version line says Unsaved while tuned away from the draft, the status line under the title what the database
  said last and, for a visitor, the sign-in (the login app, back here); Reset goes back to the draft, Copy variants
  sends the library. The World and Sectors cards carry the world's one item: Save and Publish beside the card's name; and
  every Environment page's card (Sky, Clouds, Camera, Map, Base clouds, Light and texture, Fog) the environment's
  (W75; his: "we don't need names in environment. We need versions to keep publishing"): no name, Save keeping the
  whole environment, each Publish the next version, Reset that page's part as saved.
- **Placing, on the Sectors page** (World.md W73, option D, moved by W82, W89, W93; his: "we will not place anything
  in the world explicitly", then "the controls related to the element should be on the right", then of a block, a
  pipe, a road and a tree "As they are placed, like a block"; `place.ts`, the engine's `placing`): Build's Tool Place
  with an element the Item (`BuildState.item`, `elementOf`) places it into the sector picked, inside its room alone
  (`floorAt`'s `room`, `inRoom`): a mountain or a human of the Variant picked (`placeStore`, `pickedVariant`), a ring
  under the pointer (`build-ring.ts`, `ghostAt`) showing where and how wide (a mountain's extent, a human's
  `HUMAN_RING`), a click placing it (`withPlacedAt`; a mountain faces the middle, `mountainTurn`; a human its sector's,
  `facing`). **What the item takes stands on the item's card on the right** (`ItemJig` in `spaces-world.tsx`,
  `itemShown`: a `JigCard` with `side="end"`, under the compass and the map, `below`; keyed by what it shows and its
  groups, so every group opens): picked, the picked one's own; else with Place the next Item's (Block: Block, Unit,
  Width, Length, Height, Colour, Texture, `shapeControls`, and Rotation, `ROTATION_CONTROLS`, `blockGroups`, bound to
  `buildStore` through `BlockCard`, `cardOf`/`shapeOf`; Mountain, Human: Variant; Pipe, Road: its look,
  `skeletonLookGroup`; Trees: Area, `AreaControls`; Grove, `GroveControls`: Spacing `SPACING_CONTROL` (W97) and Length, one
  slider of two heads with the shortest and tallest typed, `Lengths`, `LENGTH_CONTROL`, `heightsIn`; Trunk and Flower,
  `treeLookGroups`); else with Select, the sector's blocks to pick. The next one starts from the last set (a picked
  grove's or pipe's change sets the next one's too, `placeFromGrove`). The item's card never covers the Sectors card:
  its left inset is the Sectors card's right edge (W91). **Trees are a grove** (W89, T1, W91, W93, W96): with Trees the
  Item its area's outline and hollow follow the pointer, lilac, its middle where the pointer meets anything
  (`groveMiddleAt`, `meetAt`; `ghostAt`, `buildOutlines`, drawn after the base gas, `renderOrder` 1), and a click
  plants it there in the look set (`withGroveAt` with `nextGrove`), picked at once, its outline violet
  (`groveOutline`). **No empty grove** (W97): the next grove's card counts the trees its area holds at its Spacing
  (`areaTrees`, wherever it stands) and says when none fits; a click whose grove would land none plants nothing (the
  engine's `groveTrees` with `groundColumn`); the Sector's note counts its groves holding none (`emptyGroves`), and its
  actions' Remove the empty groves clears them, asking first. **A tree stands on any surface** (W96), **at the grove's height** (W99): a grove keeps the
  height the pointer met its middle at (`GroveAsset.y` over its sector's floor, `groveMiddleAt`, `withGroveAt`; kept
  before, 0), and `groveTrees` stands each tree on the ground of the open space at that height in its column
  (`footAt`: the highest top under it, so an edge drapes down; or, where something stands in the way at that height,
  up onto its top; none where that is over the sector's top; nothing over open air is climbed, so a block over the
  grove is not where its trees go). A column is its crossings, each a surface's height and whether it faces up
  (`Crossing`, `ColumnAt`): the engine's `groundColumn`, the blocks met as boxes (`blockColumnAt`) beside the drawn
  mountains', pipes' and roads' meshes read by `surface-crossings.ts` (`meshColumnAt`: each mesh's triangles sorted
  once into 2 m columns, kept while it stands as it did, each facing as it is wound, turned for a mesh drawn from its
  back), never a human, a tree, or the pipe or road being drawn (`endDrawing` lands them again); worked out again
  only when the world, the mountains' variants, the bounds or the one being drawn change (`columnFor`). Both outlines
  drape the same way from the grove's height (`drapedLines`, a point a metre, each with its own height,
  `buildOutlines`), and the grove's gizmo stands where a tree at its middle would. The pipes and roads are
  made before the trees (`skeletonParts`, then `treeParts`). Each tree carries the grove's id, so a click on one picks the grove, and a drag on one moves it whole
  (`dragging.ground`, `groveTreeObjects`, `previewGrove`), as its gizmo does with X and Z alone (`Movable.axes`) and
  its card's X and Z typed. The canvas says where the next click would place (`data-ghost`, metres: a block's middle,
  an element's foot, a pipe's next joint), for the review scripts. **Humans are placed** (W89): `placedHumans`, a part
  `placed human <id>` each, `buildHuman` of its variant (`settings.humanVariants`) posed in its Posture and
  Expression, moved without being remade; `placedParts` lists what a press may pick. With Select a press on a placed
  element (its group's `userData.asset`, `assetAt`; `elementToPick`, unless a block is nearer) is caught before
  OrbitControls sees it and picks it (`onPick` to `placeStore.picked`, a violet ring at its foot, the blocks picked let
  go), a drag moves it within its own sector (`roomOfAsset`, `withPlaced`, `onWorld`); the item's card's Picked group
  (`PickedElement`) types X, Y, Z and Turn, picks another variant (a tree placed alone has its look's groups and a
  Height instead), and removes it; Backspace removes it, Escape lets it go, a reload too. **Anything picked moves any
  way** (W88; his: "options like blender"; the engine's `movable`, `moving`, `build-gizmo.ts`): the joint, else the
  pipe or road, else the element, else the grove, else the blocks picked wears the move gizmo, X red, Y green (up), Z
  blue; a press on an arrow's outer part (`arrowUnder`, `ARROW_REACH`, caught first, `pressToMove`) moves it along
  that axis (`alongAxis`); G grabs it (`grabPicked`: free in the picture's plane, `inPicture`), X/Y/Z keep it to an
  axis, a click or Enter keeps it (`endMove`), Escape or a right-click puts it back; each on its own grid (`snap`; a
  block by `stepOf` its unit), within its sector; `preview` moves the drawn thing, `moved` is the world. **R turns the
  blocks picked** (W93, his pick "Any axis, as in Blender"; the engine's `turning`, `turnPicked`, `showTurn`,
  `endTurn`): round their middle, following the pointer's angle round it on the screen (`angleRound`, unwound), round
  the line of sight or, with X, Y or Z, that axis of the world (`turnAxis`), Control or Command for 5° steps; their
  outlines show the turn (`turning.shown`, `turnedBy`); a click or Enter keeps it (`withBlocksTurned`, the rotation
  read back from the axes, `rotationFrom`, `YXZ`), Escape or a right-click puts it back; the canvas says the turn
  (`data-turn`). Mountains, trees and humans stand at any height (`PlacedMountain.y`, `PlacedTree.y`); `floorAt` lands
  a mountain or a human on a block's top (turned or not) or the sector's floor (a grove, W96, on anything); the canvas says where the gizmo is
  (`data-gizmo`). The first grove (W71's 120 trees) is out of the copy and dropped from any kept world (`grove-w71.ts`,
  `mended`). **A block lands flush on what the pointer meets** (W93; `building`, `buildsAt`, `meetAt`): the nearest
  of a block's face (`solidUnder`), an element's surface (`surfaceAt`) and the sector's floor, inside the sector's
  room; `landing` puts its middle out along the face's way by its reach (`reachAlong`), its sides across a square face
  kept to its step; the ghost is the block turned as it will be (`aim`, `buildGhost`). **A pipe or a road is drawn a
  joint a click** (W93; the engine's `drawing`, `drawAt`, `endDrawing`, `takeBack`, `nextJoint`, `drawnTo`): each
  click lands a joint (`landAt`, W87: `meetAt`'s nearest; on a face it attaches, the start's way out of it, the last's
  into it, every joint between free); from the second it is kept (`withSkeletonAt` in the card's look) and picked,
  each click after adding the next (`withSkeleton`), the one being drawn shown reaching to where the pointer would put
  the next (`skeletonsShown`, its own part never met by `surfaceAt`) with its skeleton over it, the last joint larger;
  a click on the last joint (a double click), Enter or Escape ends it, Backspace takes the last joint back, another
  Item, Tool or sector ends it; the canvas says how many joints it has (`data-drawing`). A press within `JOINT_REACH`
  of a joint of the one picked takes hold of it whatever the tool (caught first, on capture; never while drawing), a
  drag moving it over the ground at its height and an Option-drag up and down, within its sector (`reshaping` drawn as
  the hand goes, `withSkeleton` as it lets go); a press on the picked joint's arrow head aims its way (`aiming`: the
  picture's plane, level with Option, a road's always level); the canvas says where the picked skeleton's joints and
  arrow head are on the screen (`data-skeleton`), for the review; with Select a press on it picks it and a drag moves
  it whole (`skeletonMovedBy`); Backspace takes the picked joint out, else the asset; Escape lets the joint go, then the
  asset. The card's Picked (`PickedSkeleton`) picks a joint, adds one after it, takes it out, and types its X, Y and Z,
  and its Way (Free or Set, Turn and Tilt); its look is the card's next group. **The World page places nothing** (W82):
  World v6, its card the size and its Sectors listed, the world drawn as the sectors build it, with no sector's edges
  (W103: `sectorBounds` draws on the Sectors page alone). **Full view** (W105, `full-view.ts`, `useFullView` in `jigs.tsx`): the card's Full view or F puts the sidebar, the card, the compass and the map away, one button at the top right, F or Escape (from the builder's camera) bringing them back; held for the visit alone. A placed element is an asset of a sector (`PlacedAsset`: kind, variant, place,
  turn, seed; `placeAt` rounds to the floor's lattice), so the world stays one tree of units and assets (W25),
  `worldLines` counting elements beside blocks.
- **The builder** (World.md W14, W73, W81), `src/app/build/`: its layout holds the sidebar (`src/components/build-sidebar.tsx`,
  the design system's `Sidebar`, floating, folding to icons, a sheet on a phone) with World (the world as the sectors
  build it, W82), Spaces › Sectors (W81), Environment › Sky, Clouds, Camera, Map, Base clouds, Light and texture, Fog, and
  Elements › Mountains, Human, each item a jig's page (W93: a block, a tree, a pipe and a road are set as placed, on the
  Sectors page, and the portal went). `/build` opens on World; `/build/inspect`, `/build/environment`, `/build/sector`,
  `/build/plane`, `/build/hole`, `/build/portal`, `/build/trees`, `/build/pipes` and `/build/roads` redirect (to
  Mountains, Sky and Sectors).
- **A jig is data** (`src/world/jig.ts`): its name, version, his settings (`start`) and its groups of controls (a
  number, a range of two heads, a colour, several colours (`colours`, the `ColourPicker`'s `multiple`, W92; `coloursOf`
  reads them as kept), a choice, several choices (`choices`, W98: the design system's `ToggleGroup`, several pressed, never none, in the options' order, every picked one named after its label; `choicesOf` reads them as kept), a switch (a boolean, the design system's `Switch` beside its label, or, one that `heads` its group, on the group's header between its name and its arrow, W76); a long range marks every `marks` of its units; each named with its
  group, so View's Height and Focus's are told apart). **The slider is the design system's, untouched**: never override
  its marks' snapping (`--motion-step-zone`) here. A single number's value is typed beside its label (`TypedValue`, the
  motion studio's `ParameterControl` way): any value on its step, set by Enter or blur, Escape to let it go. A jig may say what moves a value in the world (`movedBy`, read
  against its `inputs`), and the card then locks what nothing on is moving (`lockOf`); the camera no longer does. Every jig's column is the one `JigCard` (`src/components/jig-card.tsx`; bound
  to its store in `jigs.tsx`): `inset-pill` padding (Spacing.md SP6: a folded group is a pill), six cells wide, right of the sidebar and centred down the page, along the bottom of a
  phone; foldable group cards adapted from Motion Studio; Play, Reset and Copy beside its name (W52), **every action an icon button, a click each, named in its tooltip** (`IconAction`, `IconActions`; World.md W76; his: "instead of giving options in the drop-down … convert them into icon buttons for easy clicking"), a Delete that cannot be undone asking first in the system's alert dialog; no card in Orbit has a ⋯ menu. Every control is the system's (a stepped, marked `Slider`, the
  `ColourPicker`, the world's colours in rows by family, `colours.ts`, the picked one named after its label). A group may carry a `note` (a caption under its name: what was built, how), and a jig's `copy` adds
  lines to Copy (the blocks). The jigs (World.md W15): **World v6** (`bounds.ts`, World.md W29, W33, W42, W82: the size, a
  cylinder, fixed, a note and no controls for it, and Sectors, a note the page writes listing each (`jigs.tsx`), on `/build/world`, a builder's view placing nothing; v5, which placed (W73), frozen (`bounds-v5.ts`), v1 to v3, boxes, frozen, v4 v5 without placing; `boundsStore` always
  `WORLD_SIZE`; the engine's `bounds` setting), **Environment v36** (`environment.ts`, World.md W73, W76: the atmosphere alone, a switch on the header of Motion, Colour flow (the sky's flow, a group of its own beside Sky's colour), Base clouds and Fog, drawn off as if their amount were nothing (`drawnOf`, the engine's; the floor's thin veil and the walls' fog stay, they are not the base clouds); v35 frozen (`environment-v35.ts`, Motion a choice); Motion, Sky, Base clouds, Light and texture and Fog, a page a group (`ENVIRONMENT_PAGES`, `environmentPage`, `environmentKeys`), `AtmosphereSettings` what the sky, the base gas and the cloud light are built from; v34 frozen (`environment-v34.ts`, the ring's places and the grove by seeds, W72; `tree-grove-v3.ts` its grove); v33: an evenly spaced mountain ring facing the centre (W61), the open square, Sky,
  Light and texture, Fog, and Base clouds (W40: Density, Coverage, Height, Height variation, Thickness, Scale, Speed, Wind); ceiling controls are on Clouds (W38); it builds nothing (his: "remove it" the
  blocks); v1–v32 frozen, v32 with mirror-capped stone monoliths (W50), v31 with a directional sun, physically lit mountains and cloud light attenuation (W49), v30 confines directional shade to the vertical wall with a neutral ceiling join (W48), v29 with soothing sun-directed shade on the cloud walls (W47), v28 with neutral walls and Clouds’ Wall tint control (W46), v27 with grass-green-to-white mountain gradients (W45), v26 with smoother mountain summits and continuous violet-to-white pastel gradients (W44), v25 with joined cloud walls, a concealed floor and only mountain tips inside the cylinder (W43), v24 with plain tips, roughness and random placement controls and one violet/white material (W41), v23 with thinner lower gas at varied bank heights and its jig controls (W40), and distinct pastel mountain landforms (W39), v22 with continuous white base fog (W37), v21 with illustrated cumulus banks (W35), v20 with white cloud billows and mountain tips at the base (W34), v19 with the painted ceiling (W33), v18 with irregular world-space formations (W32); v17 with continuous coverage, worker preparation and bounded rendering cost (W31); v16 with sculpted gas (W30); v15 with painted billows and veils (W28); v14 with local gas banks (W27); v11 with `build-blocks-v11.ts`;
  Motion Flowing/Paused and Copy's Settings JSON, with version-specific storage), **Clouds v5** (`clouds.ts`, World.md W38, W74, W76: the switch on Layer's header, Ceiling shown, hides the ceiling, the sky overhead and the walls staying; v4 frozen; the ceiling clouds' Layer, Edge, Paint and
  Motion, on `/build/clouds`, the Environment's view, `cloudsStore`; starts at W36's values with Wall tint 0.04 (W46); versions 1 and 2 frozen; v3 traces sunlight through the masses (W49)), **Camera v13** (`camera.ts`, W78, W79, W80, W100: two cameras, `kind`, View the eye in the human's helmet (`helmetEye`,
  World.md W69) and Character behind the figure (`characterEye`: Distance off a point Looks at over its feet, its own
  Angle, behind it the way it looks, the Turn), C or the card's Switch › Camera switching them (the engine's
  `switchCamera`), the camera gliding from where it was to the other on the Switch's spring (`glideBetween`, the visor's
  air clearing or coming back with it, `helmetShare`, `dressVisor`), the canvas saying which (`data-camera`: view ·
  character · switching); from the Character camera a drag goes round the figure (`steerLook`, `CHARACTER_ANGLE`) and
  the figure faces the way it walks; into the helmet the eye takes the figure's heading; without a head it is the
  Character camera; a new view opens in the settings' camera, the same view keeps the one C switched to; on the World
  page C steps in from the builder's camera (`stepCamera`): down to the Character camera behind the human placed
  nearest what it looked at (`goOnFoot`, none placed: nothing; the page then the visitor's view, `onFoot`, `roaming`
  false), into the helmet,
  and back up to the builder's camera where it was, its lens too (`leaveFoot`, `unride`; Escape too), `data-camera`
  `builder` there; **the visitor walks as a placed human** (`walker`, `walkAs`, `walkable`, `figureConfig`: its
  variant's look and gait, standing at its height, `standY`, its placed self not drawn while walked; on an eye view the
  first placed, re-seated when the world is read; none placed, the start's figure on the visitor's cell); **it stands on what is built and falls** (W101, `walking.ts`, no three.js: `groundUnder`, a step up
  `STEP_UP`, a wall over it, `fallen` at `GRAVITY` to `FALL_MOST`, `throughPipeWall` with `BODY`; the engine's
  `walkColumn`, `groundColumn`'s with a cut block open where `insideCut` says its hole is drawn and the meshes met from
  both sides, `meshColumnAt`'s `sides`; `walkTo` for keys and drags, `falls` each frame, `standY`, a map flight landing
  on top, `footAt`; `pipeBodies`, `cutSegments`; the Character camera in front of what is in the way, `clearSight`;
  a lined pipe's closed end lined too, `inside end`; the canvas says where the feet are, `data-feet`, x y z);
  Steering and Visor view, with the helmet's inside and its opacity, the helmet's; v12, v11, v10 and v9 frozen,
  `camera-v12.ts`, `camera-v11.ts`, `camera-v10.ts`, `camera-v9.ts`; Angle and Turn his; View's Height went from the
  card, moving nothing); its zoom
  narrowing the field of view, `fovOf`; the wheel zooms on its page; it moves by `movement.ts` and flies by `focus.ts`;
  versions 1 to 8 frozen, 8 standing where the visitor is, with 5 to 7's drags and flights), **Human v9, two Forms, with its variants** (`human.ts`, `HUMAN_VARIANTS`, W72, W102, W103: Form Suit · Clay; with Clay
  the card shows the Clay's Head (Expression, Looks at cursor, Width, Height, Depth, Neck, Neck height), Body (Width,
  Depth), Arms (Length, Width, Depth, Groove) and Legs (Length, Width, Depth, Gap) in place of the Suit's groups; v5
  frozen; the Suit as v5 had it:
  World.md W51, W65, W66, W69, on `/build/human`, looked round on its 4 × 4 m block: Figure's Form, Colour, Shows
  (Look · Head · Skeleton · Boost), Posture (Stand · Walk · Run · Hover · Wave) and Motion; Head's Expression, Looks at cursor (a switch), Size, Visor,
  Bulge, Rim, Inset, Neck and Neck height; Body's Width, Depth, Edge, Dome and Slope; Arms' Length, Groove, the
  widths Shoulder, Upper arm, Elbow, Forearm and Hand, and Blend; Legs' Split, Gap, the widths Thigh, Knee, Shin and
  Foot, and Blend; Torch's Torch, Colour, Strength and Spread; Boost's Colour, Length and Strength; Boosters' Hole, Extrude, Rim, Curve and Edge; Gait's Walk up to, Stands under,
  Turn and Settle; the groups explain the figure in plain language; `humanStore`; its height is his, not a control;
  v1 to v4 frozen), **Mountain v14, with its variants** (`mountain-jig.ts`, `MOUNTAIN_JIG`, v13 frozen with its builders, on `/build/mountains`: the mountain alone at the middle, seen from the east, `mountainStore`, `mountainLibrary`; W64's glass filtering in `MountainJig`), **Sectors v4, Spaces' page** (`spaces.ts`, World.md W24, W25,
  W81, W89, W91, W93, on `/build/sectors`; v3 to v1 frozen, `spaces-v3.ts` to `spaces-v1.ts`; the Sector element's v1 to v5 frozen, `sector-v1.ts` to `sector-v5.ts`, with
  `sector-zones-v3.tsx` and `build-blocks-sector-v3.ts`): the jig's own settings are the Grain alone (`spacesStore`,
  reading the Sector's kept grain once); its Sector and Build groups are drawn by `spaces-world.tsx` from
  `worldStore` and `buildStore` (`JigCard`'s `sections` and `notes`; Sector's place and size and Build's Tool and Item through the shared
  `JigControls`, `SECTOR_CONTROLS` a row a way: X and Width, Z and Length, Y and Height), open as
  the card arrives, and its Copy (`copy`) adds `worldLines`; the item's card on the right (`ItemJig`, above) holds what
  the item takes and what is picked. **The page sees the world as placed** (`aloneOn` is null on
  `spaces`) with every sector's room drawn by its edges (`buildSectorBounds`, the engine's `sectorBounds`: the picked
  one violet, the others lilac, never fogged). **The camera goes to the sector picked** (his: "the camera should take me
  to that location"): `world.tsx`'s `frameSector` calls the engine's `frame` (`frameRoom`) when the room of the picked
  sector changes (picked, made, moved, sized), at once as the page arrives, and on Go to it (`sectorFraming` in
  `store.ts`); it looks at the room's middle, no more than `FRAME_UP` (50 m) over its floor, 30° down, far enough for
  every corner (`halfView`, the room the cards leave), held within `FRAME_INSIDE` (four fifths) of the world's side and
  top, gliding on the camera's Flight spring (`glide`, stopped by OrbitControls' `start` and the keys). A new sector is
  `makeSector`'s; a click on its page builds into the sector picked, inside its room (`building()` in the engine,
  `room`, `withBlockAt`/`withoutAsset`, `onWorld` to `worldStore`); the engine makes a part a sector's blocks
  (`blocks <id>`), so a click remakes one. Build's Item (W82, W89, W93: Block · Mountain · Trees · Human · Pipe · Road,
  `ITEMS`) says what Place puts in; what it takes is on the item's card (above). **Build's Tool is Place or
  Select** (V picks Select and P Place, W93: the engine's `keydown` to `onTool`, as G and R are kept from fields) (his,
  2026-10-15: "add Select option too, so that I can edit the existing items", then "We should be able to do multi-select" and, of the
  Remove tool, "I can select and then use backspace"): with Select the block under the pointer is ghosted lilac, a
  click picks it alone, from any sector, Shift-click (Command, Control) adds one or takes it out, a click on the ground
  lets them all go (`onPickBlocks` to `buildStore.picked`, in the order picked, each outlined violet, `buildGhost`'s
  `picked`); a Command-click (Shift, Control) on a pipe keeps the blocks picked, and on a block keeps the pipe picked
  (`isPipeId`, W95), the pipe's card then showing Subtract (`Subtract`, `subtractNote`: Subtract and Put back whole); Backspace or Delete removes them (the engine's `keydown`, never while a field is being typed in, `busy`);
  the Picked group lists a sector's blocks in a Select (the last picked's sector, or the one built into while none is
  picked, so a block is picked there too; several picked, it says how many), Let it go and Remove in its menu, X, Y and
  Z of its middle typed from the middle of the sector's floor, the last picked block's, the others moving with it by
  the same metres (`withBlocksMoved`); its Block and Rotation groups the last picked's values, a change set on every
  block picked, each keeping the rest of its own (`withBlocksChanged`); a placed or moved block is never refused, the
  note says what overlaps or stands outside its sector or the world; Escape lets them go, and so does a reload
  (`buildStore`'s parse). A jig control may be `text` (a name, `TypedText`).
- **The hand moves every view.** A jig's page that is looked round (World, Sectors, the Environment's, Mountains, Human) is OrbitControls',
  held above the ground on every change (`holdLook`). **On the Sectors page a click builds** (a press under 5 px and 500
  ms) into the sector picked, inside it: the ghost shows where (`aim`), and the engine tells the world to `onWorld`, which
  `world.tsx` writes to `worldStore`; on Environment and Sectors a right-drag pans, the wheel dollies, and it stays above
  ground. The
  visitor's camera (`/` and the Camera page) moves over the ground (`movement.ts`): a drag slides it, carrying on over
  the Glide or springing back (After a drag), and the arrows and W A S D carry it while held, at the Keys' speed. Its
  Height, Angle and Turn never move with it. **The visitor is the human** (World.md W51, W69): `at` is where the figure
  stands, the camera in its helmet or behind it (C, W100); each frame it moves, `stride` turns the figure to face its way and walks or runs it
  (`figureStep`), and `placeFigure` stands it there in its pose; the loop runs on until it has settled. **It walks, Shift runs it, Space jumps it and Space twice flies it**
  (World.md W106, `air.ts`, no three.js): the keys walk it at its Gait's Walk up to and with Shift run it at the Keys
  (`onFootSpeed`, the gait the keys' `pace`); Space jumps it (`jump`, a fall that starts upwards, stopped under a
  ceiling, `ceilingOver`); two Spaces within the `fly-tap` take off (`takeOff`), and in flight (`flying`, `climbs`) it
  hovers, flies at the `fly-pace` × Keys, Space held rising and Shift held sinking, landing on the ground or let go by
  Space twice; its limbs ease into the Human page's Hovering and Flying (`aloft`, `easeAloft`, `mixPoses`), and the
  world's figure is built with its jets (as hovering) and fires them in flight alone (`fireJets`). The keys are the world's unless a control on the card or the sidebar has
  focus (`busy` in the engine); a press on the world focuses the canvas and gives them back. The engine's one frame loop
  runs while a drag carries on, a key is held or easing, the camera flies, or the sky/clouds flow.
- **The map** (`minimap.tsx`, `map.ts`, Map v4, the switch on its group's header, Map shown, taking it away, W76; v1 to v3 frozen) covers the world's round floor (W42), with N/E/S/W labels
  and the camera wedge (the portals' rings went with W93). It appears on Environment as well as visitor views; a click travels there. Its jig is
  Size, Shows (The plane/Around the camera), Reach (10–1000 m), Turns. `world-compass.tsx` composes a Card and Text
  over every view for cardinal directions, heading and X/Z metres. Both receive the actual camera pose (`onWhere`).
- **Environment keys** also travel across the plane: WASD/arrows translate the orbit target and camera together.
  **E and Q raise and lower them** (World.md W83; `keysRise`, `riseSpeed` in the engine), on every looked-round page,
  never the visitor's, held within the floor and top by `riseInside`; so does **Option-drag** (Alt, W83;
  `pressToRise`), wherever Shift-drag pans, a drag up rising as far a pixel as a pan goes, caught after a joint's and a
  gizmo arrow's press and before a placed element's. Right-drag pans along the ground. A world press
  takes focus back; focused controls keep their own keys.
- **The camera's keys are caught first** (`keydown` on capture): on the visitor's camera and Environment, D walks, so the design
  system's `d` (the theme) never sees it; elsewhere `d` still flips the theme.
- **The map flies the visitor's camera** (`focus.ts`, `travelTo`): `flightAt` the flight on Flight's spring with its
  Arc; the flight tells its values (`onEye`) and the Camera page writes them to its store, so the card moves with it. A
  click on the world flies nowhere since the portal went (W93).
- **The pointer is the design system's ring** (Grid.md D34, World.md W10): `world.tsx` puts `data-cursor` on the body
  where the device hovers with a fine pointer, so the canvas, the card, the sidebar, the map and anything portalled
  wear it, filled while pressed. Never set a cursor here (no `grab`, `pointer`, `crosshair`); the engine clears the
  `cursor: auto` OrbitControls leaves on the canvas when it lets go of it.
- **The interface's layer lets the pointer through** (`pointer-events-none` in the root layout): a drag and the wheel
  reach the world, and only the sidebar and the card take it back (`pointer-events-auto`). Anything new drawn over the
  world takes it back the same way, or it cannot be clicked.
- **Every jig's page is a playground for everyone** (his): `store.ts` keeps a store a jig, in the browser
  (`no-origins:orbit:<jig>`), shown only on that jig's page (`settingsFor` in `world.tsx`); the world everywhere else is
  his settings, and Reset goes back to them. The engine draws from all three (`WorldSettings`) and makes anew only what
  changed.
- **The current mountains and boundary shell are physically lit** (W49): one directional sun and diffuse sky fill; clouds use Beer–Lambert light attenuation and single scattering. The earlier painted surfaces remain: every surface is a flat colour, the blocks and clouds, the clouds painted by light (cream, rose, light sage) rather than lit; block faces take adjustable sunlight and lavender shade with anchored mineral grain, the painted sky with its low sun and the powdery ground.
- **No sign-in page, no gate; the world is live** (Admin.md §0.6, World.md W73): the page is static and public; a card
  reads the published variants and the world in the browser with the anon key, and an account signed in through the
  shared login (the cookie is on `.no-origins.com`; locally on `localhost`) saves and publishes by its permissions.
- `character.no-origins.com` still 308s here (`next.config.ts`).

The canvas carries `data-ready="true"` once its first frame is drawn, `data-backend` (`webgpu` or `webgl`),
and `data-gait` (`rest`, `walk`, `run`, and in flight `hover` or `fly`), the human's, for the visual review, which visits `/` and each jig's page once they rest.


## His elements and the world (World.md W52, W71, W73)

**His variants are the world's**: `published.json` holds his six mountains, verbatim from his Copy of 2026-10-14
(W71), named Mountain 1 to 6 for the places he tuned them at, the seventh and eighth as the ring's layout derived
them, his tree (Awakening light), his human and his portal, each with the uuid its item in the database has, and the
world: the start's units and, placed in it as assets (its entry zone's until W91), the eight mountains where the ring of layout seed
2000 stood (W71's 120 trees went, W88). `MOUNTAIN_START` and `HUMAN_START` are each the first variant; his tree is the
grove's starting look (`TREE_LOOK_START`, W93), and the portal, the pipe and the road are read only for worlds kept
with them; `WORLD_START` the world. **Nothing is seeded by a script**: he publishes each from its card,
Save then Publish, and `copy:published` brings what is published back into the copy; until then the libraries show
the copy as "not published". **Copy settings is among every card's actions**, and every jig's Copy ends with a
`Settings JSON` line, so what he sends back is what the world starts from.

`mountain-jig.ts` declares the mountain's shape and surface settings (version 14, W90: the neck light's one Strength,
kept as `lightPower`, its reach following from it, version 13 frozen as `mountain-jig-v13.ts` with its profile, neck,
body, algae and world-base builders; W70: Algae's Reach, the share of the body, floor to neck, the algae climbs to, each mountain starting at the crest its pattern drew; W64: glass reflection lighting and coloured internal scattering; W63: matching head Height/Depth ranges in metres; W62: thin connecting neck, bulb/light controls and varied pastel brush algae; W60's body textures/colour/roughness and algae colour/thickness/grain, W59's open floor transition, W58's attached glass head, W54's Taper 0–10); `mountainOf(config)` is the mountain the builders shape, `mountainStart` the shape a ring's layout derived (kept for the frozen builders and the copy). `build-world-base.ts` draws each placed mountain where it stands, facing its turn, remade only where its variant changes. Geometry and
head follow `mountain-profile.ts`, tracing the complete drawing. The body has an open floor cut and sloped neck;
`build-mountain-algae.ts` coats the body with a separate raised layer climbing to its Reach (`algaeContour` in `mountain-profile.ts`, beside the body's rings, no three.js), a seeded contour under it and a textured pastel brush edge.
`build-mountain-neck.ts` attaches the body and head through a thin stem, with a bulb and local point light at its tip
(its reach `reachOf` its Strength, as the glass's scattered glow's is);
the head has an inclined underside above the neck and a level top. Clear/frosted/tinted glass transmits/refracts;
Physical glass and the mirror approximate sky reflection; glass also approximates local light scattering,
rather than reflecting nearby scene objects. The head, the stem and the bulb take the base gas (`airAt`, W37) as the
body does, never `scene.fog`: the Fog group's colour and distance paint the blocks, not a mountain, so a
short fog range cannot turn every head the fog's apricot and hide its type and tint. `mountain-fit.ts` (`mountainFits`)
stays for the frozen ring builders alone.
