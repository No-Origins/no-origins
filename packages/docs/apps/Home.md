# No Origins — Home

The 3D model of the house Bhargav is building — its fifth floor, before the walls go up — the home tour through it,
and the realistic pictures image models make from it. The app is `apps/home` on `home.no-origins.com` (H3), behind
the one sign-in (Admin.md §8.4). This document decides what the app is for and how it works. **The house itself is not
here** (H4): its plan, every version of it and the tour's stops are in `Home-plan.md`, which lives beside the
description on his machine and in no repository.

Current as of 2026-10-08. Earlier versions and what they decided are in git history.

## H1. What it is for

- **There are no architect's drawings.** The model starts from his dimensions and ideas, in words and in his own
  wireframes (H7). The pillars and this floor's ceiling are built; the model is made before the walls go up.
- **The model is the fifth floor alone.** Under it stands a bare frame of pillars one storey tall, for the floors
  below, with the steps rising from it to the plan; over it, its own ceiling.
- **Two things come out of it**: the model itself, to look at, walk round and change; and realistic pictures of the
  house, which image models make from the model (H5). The model does not try to be realistic itself.

## H2. Three.js, and the house is written as code

**The house is a description**: typed data from which three.js builds every wall, slab and opening. Not a room
editor such as OpenPlan3D, which lays out rooms only, is not Next.js, and keeps no versions.

- **Claude writes it** from his dimensions and ideas. **He corrects it in words**, like "move the kitchen window 40 cm
  left".
- **Every change is a version**: he looks, says what is wrong, and gets the next one — versions, not presets, as in
  the studios.
- **Plain three.js, mounted the way the design system mounts its avatar viewer** (`mountHiddenstackViewer` in
  `packages/ui`): a canvas, rendering on demand, no React renderer on top. The viewer belongs to the app
  (`apps/home/src/lib/viewer.ts`), not the package, until a second app needs it.

## H3. Where it lives

- **`apps/home` on `home.no-origins.com`**, port 3006. The Vercel project `home`, made by the root CLAUDE.md's recipe;
  production is `main`. It needs the two `NEXT_PUBLIC_SUPABASE_*` variables every gated app has, and the private Blob
  store of H4.
- **Behind the one sign-in** (`packages/auth`), asking for `home.open` (Access.md A6), because a house is private (H4).
  Only the Owner holds it until he gives it in a role (Access.md A4). The app opens with no login only on a development
  server with no Supabase keys, so the review sweep and CI see it — the sample house, there.
- **Its screen is his to design**: where the 3D view sits on the grid and what stands round it. What is placed today
  (`src/lib/layout.ts`) is mine.

## H4. The house is private; the repo is public

`No-Origins/no-origins` is public. The app's code is public. The house is not: its plan, its dimensions, its plot, and
above all where the plot is. So the house is never committed:

- **On his machine** the house is `apps/home/src/content/`, gitignored and kept out of every Vercel upload by
  `.vercelignore`: the description (`home.ts` and its parts), the tour (`tour.ts`), the tour's pictures (`pictures/`)
  and its record (`Home-plan.md`). Every version is written there; the app imports it as `@house`.
- **Deployed**, it is in a **private Vercel Blob store**, `home-house`, connected to the `home` project. The page
  reads `house.json` — the description and the tour, evaluated from the TypeScript — and the route
  `/tour/<name>.webp` reads each picture, at each request and behind the sign-in, asked twice: by the gate in
  `proxy.ts`, which exempts no image, and again where the house is read (`signedIn()` in `lib/store.ts`). A private
  store is never readable by its URL: the SDK reads it with the project's own short-lived OIDC token. The house is
  under 2 MB, inside the free plan's 1 GB stored and 10 GB sent a month.
- **Publishing is his step, from his machine**: `pnpm --filter home publish:house` (`--dry` to check without
  uploading) evaluates the description, checks every picture the tour names is there, and uploads them and the
  description over what was in the store. A visit after it shows the new version within a minute. Editing the files
  changes the local model at once and the deployed one only when published.
- **The code is written against the description's type**, which is public, and **a made-up sample house**
  (`apps/home/src/sample`, a two-room pavilion with a tour of three stops and no pictures) is what CI, the review sweep,
  a fresh clone and Vercel's build see. `@house` is the house folder where it exists and the sample where it does not
  (`next.config.ts`); on Vercel the page reads the store instead, so a build there never holds the house.

## H5. The model is exact; realism is the image models' job

The model is the reference the pictures are made from:

- **Exact geometry, plain surfaces.** Every dimension as he gave it. Each material has a name and one flat colour:
  no textures, no glass, no lighting tricks, no attempt at realism in three.js.
- **Named views**, saved with the house (`views` in the description): `plan`, from straight above with everything
  from `cut` up taken off, and a `look` from a point at another. The same view can be rendered again after every
  change, and two versions of a picture compared.
- **From a view, the app is to export what an image model is guided by**: the plain render, a line drawing of the
  edges, a depth map and a mask of which material is where, with a written description of the materials for the
  prompt. Not built yet; until it is, he takes renders to a model himself.
- **Open:** which image model, and whether pictures are made in the app later. Any model that keeps a reference
  image's layout will do, or a diffusion model guided by depth or edges. His to decide.

## H6. What the description holds

Typed by `src/lib/house.ts`, in feet throughout, plan coordinates as the wireframes are read (x across to the right,
y down the page), a level a height above the model's ground:

- **Materials**: a name and one flat colour each (H5). A door leaf is painted `door`, a window's frame `frame`.
- **Pillars**, **walls** by their centre lines (a thickness, a base and a height), and each wall's **openings** — a
  door (one leaf or two, or sliding) or a window (with a sill) at a distance along it.
- **Slabs** by their outline, with holes; **blocks**; **stairs** in a well and free-standing **flights**; **railings**.
- **Views** (H5).

Not in it yet: the plot (its outline, north, the road, the setbacks) and a roof. What the description cannot yet say
is added to its type, and to `src/sample` if the sample should show it — never drawn in three.js by hand.

## H7, H8. The plan and its versions — in `Home-plan.md`

The wireframes read into the description (H7) and every version since (H8), with every number he gave and every
guess beside it, are the house: they are in `Home-plan.md` beside the description (H4), not here.

## H9. The home tour

**The pictures cannot be put back into the model, so the tour hangs them in it.** A picture is what an image model
made *from* a view of the model, and its finishes, fabric and light are the image model's proposal, not a surface the
description has. The model is exact and plain on purpose (H5), so each picture hangs in the room it shows, an "AR
floating window" (his words). The tour is a description, like the house (`content/tour.ts`, typed by `lib/tour.ts`),
and the viewer plays it:

- **The opening** is the long shot the page stands on before the tour: the whole house from afar, no stop pressed.
  Play glides in from it over its own time (`approach`), the house in view all the way, to the first stop.
- **A stop is a fixed camera** — where it stands, what it looks at, its field of view, in feet — with the guide's line
  (kept in the description; nothing shows it) and, where an image model has made one, the picture of that place. A
  stop with a picture *is* the picture's camera, copied from its capture, so the picture lines up with the room behind
  it.
- **A leg is the way to the next stop**: the points the camera passes, two feet before and after each door on its
  axis, so it goes through doors and never walls, and the doors it opens. The camera walks a smooth curve through them
  at 4.5 feet a second, up to speed over the first three tenths and slowing over the last, its look turning at sixty
  degrees a second at the most and onto the stop's over the second half; it waits three seconds at a stop. A drag
  pauses the walk, and the next leg starts from wherever the camera is. A door within nine feet swings open over
  0.7 s, away from the side the camera comes from.
- **The picture is a window hanging in the room**: on the camera's axis, upright, fitted to 78% of the view, with the
  system's corners and a drawn edge, drawn over the model so no wall cuts it. It fades in over 0.6 s once it has loaded
  and the camera has arrived, and out over 0.35 s as it leaves; a picture that does not come (not published, or the
  sign-in lapsed) leaves the stop showing its room alone.
- **The name and the player.** The view's name stands right over the player as one `hero` (Type.md T5): the
  opening's, the stop's, or "Plan", and a new name arrives as a surface does. The player is a pill as wide as its
  controls: back, play or pause, forward, the stops as numbered circles (the one the camera is at pressed, its name on
  hover), the speed — 1× or 2× — and Plan.
- **The farewell.** At the tour's end the camera pulls back into the plan over eight seconds, and the plan settles in
  a box five cells across. Then a heavy `hero`, "Thanks for visiting, have a good day", and four links on the field's
  cells — Design, Portfolio, Motion, Orbit — come in, by the `--motion-farewell-*` tokens in globals.css
  (`useFarewellMotion`, `farewellLayout` in `lib/layout.ts`). The player stays under them where the field has room.

The tour's numbers are `TOUR_MOTION` in `lib/tour.ts`, the viewer's and not `--motion-*` tokens, and his to tune once
he has walked it. **Which stops, in what order, with which pictures, and every version of the tour** are the house's
(H4): in `Home-plan.md`.
