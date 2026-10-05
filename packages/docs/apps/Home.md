# No Origins — Home

*Opened 2026-10-02. The 3D model of the house Bhargav is building — the fifth floor, before its walls go up — and
the realistic pictures to be made from it. The app `apps/home` on `home.no-origins.com` (H3), behind the one sign-in
of **Admin.md** §8.4, built the same evening. Its three.js follows the avatar viewer's in `packages/ui` (H2). Since
2026-10-03 the model gives **the home tour** (H9): fixed cameras through the house, a walk between them at a press of
Play, and the realistic pictures hanging in its rooms where they were taken.*

*This document is the app's: what it is for and how it works. **The house itself is not here** (H4): its plan and
every version of it (H7, H8), and the tour's stops and versions, are recorded in `Home-plan.md`, which lives beside the
description on his machine and in no repository.*

## H1. What it is for

His brief, 2026-10-02:

> "I want to create a 3D model of my house before the construction begin"

> "right now, I only have uh, dimensions and ideas in my head. So yeah, we'll build the model. And then I will use uh,
> AI models to generate realistic images from the model."

So:

- **There are no architect's drawings.** No plan, no CAD file. The model starts from his dimensions and ideas: in
  words, and since the same evening in his own wireframes (H7). **Construction has begun**: the wireframes show the
  pillars and this floor's ceiling as "currently constructed", so the model is made before the walls go up, not
  before the first brick.
- **The plan is the fifth floor, and the model is that floor alone** (his, the same evening: *"this plan is for the
  fifth floor. But we don't want all the floors below, so we can just have pillars extending down for like one
  floor, and then have steps to it."*). Under it stands a bare frame of pillars one storey tall, for the floors
  below, with the steps rising from it to the plan; over it, its own ceiling.
- **Two things come out of it.** The model itself, to look at, walk round and change. And realistic pictures of the
  house, which image models make from the model (H5). The model does not try to be realistic itself.

## H2. Three.js, and the house is written as code

His pick, the same day: *"let's go with uh, three J's"*.

**OpenPlan3D** was his first thought and is not the base. It is real, free and MIT-licensed: a browser editor where
you draw walls, doors and windows in 2D and look at them in 3D. It was set aside because:

- it lays out rooms. Its documentation shows no multi-floor support, no roof and no plot, and those are most of what
  a house before construction is;
- it is a SvelteKit app, and every app here is Next.js built from the design system, so it cannot sit inside the
  workspace;
- the house would be drawn by hand in its editor, with no versions.

Its JSON export stays a way in if a room is ever sketched there. **That Open Engine** (IFC in the browser) was the
other candidate, for showing an architect's BIM model. There is no such model, so it is not needed.

**So the house is a description**: typed data from which three.js builds every wall, slab and opening.

- **Claude writes it** from his dimensions and ideas. **He corrects it in words**, like "move the kitchen window 40 cm
  left" or "make the landing deeper".
- **Every change is a version**: he looks, says what is wrong, and gets the next one. That is how the studios work
  (versions, not presets).
- **Three.js is already in the system.** `packages/ui`'s avatar viewer (`mountHiddenstackViewer`) mounts plain three.js
  on a canvas, and the house viewer follows that pattern, with no React renderer on top. The viewer belongs to the
  app (`apps/home/src/lib`), not the package, until a second app needs it.

## H3. Where it lives

His, the first message: *"I'm not sure if I want to put that and a part of no origins and deploy it on a subdomain
um, I think that also should be good"*; then, the same evening, *"name that as home. And you know now you can
proceed."* So:

- **`apps/home` on `home.no-origins.com`**, port 3006, since 2026-10-02. **Home** is his name for it; it was "house"
  for an evening. The Vercel project `home` was made on 2026-10-03 by the recipe in the root CLAUDE.md; production is
  `main`. It needs the two `NEXT_PUBLIC_SUPABASE_*` variables every gated app has, and the private Blob store of H4.
- **Behind the one sign-in** (`packages/auth`), like the admin and the motion studio, because a house is private
  (H4); open on a development server with no keys, so the review sweep and CI see it — the sample house, there.
- **Its screen is his to design**: where the 3D view sits on the grid and what stands round it. Orbit's stage was
  designed the same way.

## H4. The house is private; the repo is public (built 2026-10-06)

`No-Origins/no-origins` is public. The app's code can be public. The house should not be: its plan, its dimensions,
its plot, and above all where the plot is. So the house is never committed, and the app is:

- **On his machine** the house is `apps/home/src/content/`, gitignored and kept out of every Vercel upload by
  `.vercelignore`: the description (`home.ts` and its parts), the tour (`tour.ts`), the tour's pictures (`pictures/`)
  and its record (`Home-plan.md`). Every version is written there, as before; the app imports it as `@house`.
- **Deployed**, it is in a **private Vercel Blob store**, `home-house`, connected to the `home` project (his ask,
  2026-10-03: *"Can we host images for free on vercel"*, then *"Proceed"* — it was to be a Supabase bucket when this
  was proposed). The page reads `house.json` — the description and the tour, evaluated from the TypeScript — and the
  route `/tour/<name>.webp` reads each picture, at each request and behind the sign-in, asked twice: by the gate in
  `proxy.ts`, which exempts no image, and again where the house is read (`lib/store.ts`). A private store is never
  readable by its URL: the SDK reads it with the project's own short-lived OIDC token. The free Hobby allowance is
  1 GB stored and 10 GB sent a month, and the house is under 2 MB.
- **Publishing is his step, from his machine**: `pnpm --filter home publish:house` (`--dry` to check without
  uploading) evaluates the description, checks every picture the tour names is there, and uploads them and the
  description over what was in the store. A visit after it shows the new version within a minute. Editing the files
  changes the local model at once and the deployed one only when published.
- **The code is written against the description's type**, which is public, and **a made-up sample house**
  (`apps/home/src/sample`, a two-room pavilion with a tour of three stops and no pictures) is what CI, the review sweep,
  a fresh clone and Vercel's build see. `@house` is the house folder where it exists and the sample where it does not
  (`next.config.ts`); on Vercel the page reads the store instead, so a build there never holds the house.

**The record of the decision.** Proposed 2026-10-02 as above, with a Supabase bucket. On 2026-10-03 his *"I want all
of that to be deployed"* and *"I don't see home.no-origins.com"* were first read as making the plan public, and the
commit that would have put the description in the repository was refused by the session's own permission check as a
publication of the house; the store was built instead, and this section is what stands.

## H5. The model is exact; realism is the image models' job

The model is built to be the reference the pictures are made from:

- **Exact geometry, plain surfaces.** Every dimension as he gave it. Each material has a name and one flat colour:
  no textures, no lighting tricks, no attempt at realism in three.js.
- **Named cameras**, like "the street, from the gate" or "the kitchen, from the door", saved with the house. The same
  view can be rendered again after every change, and two versions of a picture compared.
- **From a camera, the app exports what an image model is guided by**: the plain render, a line drawing of the edges,
  a depth map and a mask of which material is where. With them goes a written description of the materials, for the
  prompt.
- **Which image model is open, and his.** Any model that keeps a reference image's layout will do, or a diffusion
  model guided by depth or edges. Also open: whether the pictures are made in the app later, or whether he takes the
  exports to a model himself, which is what happens first.

## H6. What the description holds (proposed)

Version 1:

- **The plot**: its outline, which way is north, which side the road is on, and the setbacks.
- **The floors**: one level each, with its height floor to floor and its slab's thickness.
- **The walls**: each a line on a floor, from one point to another, with a thickness and a height. External walls are
  thicker.
- **The openings**: a door or window in a wall, at an offset along it, with a width, a height and a sill.
- **The rooms**: named spaces bounded by walls, for labels, floor finishes and the materials list.
- **The stairs, the roof** (flat or pitched, with or without a parapet), **and the columns and beams** if the
  structure is a frame.
- **The materials**: a name and a flat colour for each surface, meaning wall faces, floors, the roof and frames.

The description uses one unit throughout, his choice.

**The order it is built in:** the frame and the floor's walls first (H7), seen from above and from around. Then
the openings. Then the stairs, the ceiling and whatever is above it. Then the materials and the cameras. Then the
exports.

## H7, H8. The plan and its versions — in `Home-plan.md`

The wireframes read into the first description (H7), version 1 and every version since (H8), with every number he
gave and every guess beside it, are the house: they are in `Home-plan.md` beside the description (H4), not here.

## H9. The home tour (2026-10-03)

His brief, after the realistic pictures were made:

> "Fix different cameras in the house … we need an auto traveling path where if I just play I should be able to
> start from this steps … basically I need a home tour guide … I'm not sure if we can exactly replicate what was
> created in the images … if that is not possible only then I would want some workaround like every place that I go
> in the house we should map the images of that area and show them like AR floating window images within the 3D
> space."

**The pictures cannot be put back into the model, so the tour hangs them in it.** A picture is what an image model
made *from* a camera of the model, and everything that makes it a picture — the finishes, the furniture's fabric, the
light — is the image model's proposal, not a surface the description has. The model is exact and plain on purpose
(H5), so the workaround he named is the design. The tour is a description, like the house (`content/tour.ts`, typed by
`lib/tour.ts`), and the viewer plays it:

- **The opening** is the long shot the page stands on before the tour, the whole house from afar, no stop pressed.
  Play glides in from it over its own time, the house in view all the way, to the first stop.
- **A stop is a fixed camera** — where it stands, what it looks at, its field of view, in the description's feet —
  with the guide's line (kept as the stop's description; nothing says or shows it since tour version 7, his: the voice
  went) and, where an image model has made one, the picture of that place. A stop with a picture *is* the picture's
  camera, copied from its capture, so the picture lines up with the room behind it.
- **A leg is the way to the next stop**: the points the camera passes, two feet before and after each door on its
  axis, so it goes through doors and never walls, and the doors it opens. The camera walks a smooth curve through them
  at about four and a half feet a second, up to speed over the first three tenths and slowing over the last, its look
  turning at sixty degrees a second at the most and onto the stop's over the second half; it waits three seconds at a
  stop. A drag pauses the walk, and the next leg starts from wherever the camera is. A door within nine feet swings
  open over 0.7 s, away from the side the camera comes from.
- **The picture is a window hanging in the room**, his "AR floating window": on the camera's axis, upright, fitted to
  78% of the view, with the system's corners and a drawn edge, drawn over the model so no wall cuts it. It fades in
  over 0.6 s once it has loaded and the camera has arrived, and out over 0.35 s as it leaves; a picture that does not
  come (not published, or the sign-in lapsed) leaves the stop showing its room alone.
- **The name, the player and the end.** The view's name stands right over the player as one `hero` (Type.md T5): the
  opening's, the stop's, or "Plan", and a new name arrives as a surface does. The player is a pill as wide as its
  controls: back, play or pause, forward, the stops as numbered circles (the one the camera is at pressed, its name on
  hover), the speed — 1× or 2× — and Plan. At the tour's end the plan settles and the farewell plays (Motion.md, the
  farewell tokens).

The tour's numbers are `TOUR_MOTION` in `lib/tour.ts`, the viewer's and not `--motion-*` tokens — the intro's are the
same (Grid.md D50) — and his to tune once he has walked it. **Which stops, in what order, with which pictures, and
every version of the tour** are the house's (H4): in `Home-plan.md`.
