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
    it looks at in the room the card leaves (`data-world-aside`).
  - `start.ts`: the cells (2 m, `CELL`), the cell two ahead (`AHEAD`: where the visitor's camera
    starts looking, and where the portal stands on its page), which portals a view shows (`portalsOn`: the portal's
    page one, every other view none; his: "Portals are not space units"), and the views (`viewFor`).
  - `orbit.ts` (no three.js): the world's size (`WorldSize`, World.md W29): width (x) and breadth (z) centred at x/z
    0, height up from y 0; it starts 1000 × 1000 × 1000 m (`WORLD_SIZE_START`), within `WORLD_SIZE_RANGE`. The default block
    is 1 × 1 × 0.25 m (`BASE_BLOCK`, W4); `SECTOR_BLOCK` (0.3 m) and `BLOCK` (10 × 10 × 1 m), with the
    `[column, row, level]` lattice helpers, are kept only for frozen versions. Camera X/Z limits are independent of
    height: `onPlane`, `overGroundPlane` and `lookingOverPlane` hold every camera above ground and half a metre inside
    the world's sides and top (`edgesOf`), from the world's size in the settings. North is −Z, East +X, South +Z, West −X. The sphere is historical (W16).
  - `hierarchy.ts` (no three.js; World.md W4, W25): **what is built**, flat data: units (ecosystem › habitat › sector
    › zone), each naming its parent, its place relative to it (his: "Let's go relative") and its entry, a pointer to
    one of its own; and each zone's assets, blocks with a size (1–10 × the default each way) and a colour. Places
    are lattice steps `[x m, z m, level]`, a block's its north-west bottom corner. `worldOf` mends what was kept;
    `make` (never empty, placed east), `remove` (not an entry), `makeEntry`, `moveTo`, `rename`, `withBlockAt`,
    `withoutAsset`; `boxesOf`/`originsOf` place it in the world; `inside` holds a box within the boundaries;
    `placeUnder`/`boxUnder` aim; `occupancyOf`/`overlapsOf` are one block a step.
  - `build-orbit.ts`: the open painted sky background (`build-fluid-sky.ts`), and no ground plane (World.md W24: the
    land is what is built). There is no dome or continuous water; ponds will be added later.
    `build-clouds.ts` ray-marches a continuous sky layer with integrated pigment and scattered light (W31);
    `clouds.ts` and `cloud-job.ts` prepare density and sun/sky depth through `cloud-worker.ts`. `cloud-pass.ts`
    caps cloud pixels, adapts quality and caches frames while keeping the world resolution. Coverage replaces Count.
    V15's image layers and v14's ribbon-like volumes are frozen; current clouds download no artwork. Billow scale is metres and Above is clearance from ground, independent of the plane size.
    Sky and clouds have independent clocks and uniform controls; pause/zero speed/reduced motion rests them (W8).
    `build-blocks.ts` draws a zone's blocks as one solid, each its own size and colour, a face the zone covers whole
    skipped (a top cut round a portal), and the ghost at the next block's size. Fog is
    `scene.fog`.
  - **A builder is two files**: what it is, its controls and its motion, with no three.js, so a page reads it without
    loading the world (`portal.ts`), and what makes it (`build-portal.ts`). A version he has seen is frozen beside the
    next (`portal-v1.ts` to `portal-v5.ts` and their builders; 1 to 4 the hole's), and nothing draws them.
  - `store.ts`: a store a jig, and `worldStore` (what is built, parsed by `worldOf`) and `buildStore` (the builder's
    state: zone picked, tool, level, the next block's size and colour), kept apart from the sector's tuning (W25);
    the portal's settings while he tunes, kept in the browser (`no-origins:orbit:portal`; the hole's key
    is read once and let go), and `portalOpening`, Play on the card heard by the world.
- **The builder** (World.md W14), `src/app/build/`: its layout holds the sidebar (`src/components/build-sidebar.tsx`,
  the design system's `Sidebar`, floating, folding to icons, a sheet on a phone) with World (the boundaries), Environment, Camera, Map, and
  Elements › Portal and Sector, and each item is a jig's page. `/build` opens on Environment.
- **A jig is data** (`src/world/jig.ts`): its name, version, his settings (`start`) and its groups of controls (a
  number, a range of two heads, a colour, a choice; a long range marks every `marks` of its units; each named with its
  group, so View's Height and Focus's are told apart). **The slider is the design system's, untouched**: never override
  its marks' snapping (`--motion-step-zone`) here. A single number's value is typed beside its label (`TypedValue`, the
  motion studio's `ParameterControl` way): any value on its step, set by Enter or blur, Escape to let it go. A jig may say what moves a value in the world (`movedBy`, read
  against its `inputs`), and the card then locks what nothing on is moving (`lockOf`); the camera no longer does. Every jig's card is the one `JigCard` (`src/components/jig-card.tsx`; bound
  to its store in `jigs.tsx`): `inset` padding, right of the sidebar and centred down the page, along the bottom of a
  phone; Play where the jig has a motion, Reset, Copy. Every control is the system's (a stepped, marked `Slider`, the
  `ColourPicker`). A group may carry a `note` (a caption under its name: what was built, how), and a jig's `copy` adds
  lines to Copy (the blocks). The jigs (World.md W15): **World v1** (`bounds.ts`, World.md W29: the boundaries, Width,
  Breadth, Height, on `/build/world`, first in the sidebar, the visitor's camera; `boundsStore`, `sizeOf`; the engine's
  `bounds` setting), **Environment v17** (`environment.ts`: the open square, Sky, Clouds,
  Cloud texture/colour, Light and texture (Grain size is the clouds'), Fog; it builds nothing (his: "remove it" the
  blocks); v1–v16 frozen, v17 with continuous coverage, worker preparation and bounded rendering cost (W31); v16 with sculpted gas (W30); v15 with painted billows and veils (W28); v14 with local gas banks (W27); v11 with `build-blocks-v11.ts`;
  Motion Flowing/Paused and Copy's Settings JSON, with version-specific storage), **Camera v8** (`camera.ts`: Height, Angle and Turn his, `eyeOf` over where it is on the ground, `at`, not a value,
  starting where it sees the cell two ahead, `startAt`; its zoom narrowing the field of view, `fovOf`; the wheel zooms on its
  page; it moves by `movement.ts` and flies by `focus.ts`; versions 1 to 7 frozen, with 5 to 7's drags and flights).ts`), **Portal v6, his settings**
  (`portal.ts`; `/build/hole` redirects to its page), **Sector v4** (`sector.ts`, World.md W4, W24, W25; v1 the plane to v3 frozen,
  with `sector-zones-v3.tsx` and `build-blocks-sector-v3.ts`; `/build/plane` redirects to its page): the jig's own
  settings are the Grain alone; its Ecosystem, Habitat, Sector and Zone groups and Build are drawn by
  `sector-world.tsx` from `worldStore` and `buildStore` (`JigCard`'s `sections` and `notes`; the Build group through
  the shared `JigControls`), and its Copy (`copy`) adds `worldLines`. Picking a unit picks its entry zone and the view
  travels there; a click on its page builds into the picked zone (`building()` in the engine, `withBlockAt`/
  `withoutAsset`, `onWorld` to `worldStore`); the engine makes a part a zone (`zone <id>`), so a click remakes one.
  The portal's page stands the portal on its own 2 × 2 m block (`PORTAL_STAND`, `PORTAL_TOP` in `start.ts`). A jig control may be `text` (a name, `TypedText`).
- **The hand moves every view.** A jig's page that is looked round (Environment, Portal, Sector) is OrbitControls',
  held above the ground on every change (`holdLook`). **On the Sector page a click builds** (a press under 5 px and 500
  ms) into the zone picked: the ghost shows where (`aim`), and the engine tells the world to `onWorld`, which
  `world.tsx` writes to `worldStore`; on Environment and Sector a right-drag pans, the wheel dollies, and it stays above
  ground. The
  visitor's camera (`/` and the Camera page) moves over the ground (`movement.ts`): a drag slides it, carrying on over
  the Glide or springing back (After a drag), and the arrows and W A S D carry it while held, at the Keys' speed. Its
  Height, Angle and Turn never move with it. The keys are the world's unless a control on the card or the sidebar has
  focus (`busy` in the engine); a press on the world focuses the canvas and gives them back. The engine's one frame loop
  runs while a portal opens, a drag carries on, a key is held or easing, the camera flies, or the sky/clouds flow.
- **The map** (`minimap.tsx`, `map.ts`, Map v3; v1/v2 frozen) covers the world's floor, width by breadth, with N/E/S/W labels,
  blocks and the camera wedge. It appears on Environment as well as visitor views; a click travels there. Its jig is
  Size, Shows (The plane/Around the camera), Reach (10–1000 m), Turns. `world-compass.tsx` composes a Card and Text
  over every view for cardinal directions, heading and X/Z metres. Both receive the actual camera pose (`onWhere`).
- **Environment keys** also travel across the plane: WASD/arrows translate the orbit target and camera together.
  Right-drag pans along the ground. A world press takes focus back; focused controls keep their own keys.
- **The camera's keys are caught first** (`keydown` on capture): on the visitor's camera and Environment, D walks, so the design
  system's `d` (the theme) never sees it; elsewhere `d` still flips the theme.
- **A click on a portal flies the camera to it** (`focus.ts`): a press that moves under 5 px and lifts within 500 ms is
  a click; the ray meets the ground and `portalUnder` names the portal. `focusOn` is where it ends (Focus's Height,
  Angle and Zoom, standing where it sees the portal at the middle, `overlooking`), `flightAt` the flight on Flight's
  spring with its Arc; the flight tells its values (`onEye`) and the Camera page writes them to its store, so the card
  moves with it. The engine keeps where the camera was (`focused.before`); a click on the ground or Escape flies back.
  `data-focus` names the portal. The engine's one frame loop
  runs while a portal opens or a drag carries on.
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
- **The portal opens** as its page comes into view and on Play (`openingAt`, `edgeAt` in `portal.ts`): it grows from a point on
  the design system's spring (`@no-origins/ui/lib/spring`, Response and Bounce), its edge rippling, the ripple dying as
  the spring rests; its three waves are drawn at random from the Waves range each time it opens (`drawWaves`; the
  engine keeps each portal's draw for the opening). `buildPortal` makes each surface once and `pose(t)` moves its points round the edge; the engine
  draws every frame only while it opens, then stops (W8). Under reduced motion it arrives open. Between the rim and the
  ground's cut lies a collar of the ground's colour, so the moving edge never meets the ground.
- **Nothing is lit**: every surface is a flat colour, except the portal's wall, painted a colour a row as it falls into
  the dark, the blocks and clouds, clouds integrate cream/blush pigment and sage recesses through their gas, with cached sun/sky depth and bounded flow; block faces take adjustable sunlight and lavender shade with anchored mineral grain, the painted sky with its low sun and the powdery ground.
- **No sign-in, no database.** The world is public and static (Admin.md §0.6).
- `character.no-origins.com` still 308s here (`next.config.ts`).

The canvas carries `data-ready="true"` once its first frame is drawn, `data-backend` (`webgpu` or `webgl`), and
`data-opening` while a portal opens, for the visual review, which visits `/` and each jig's page once they rest.
