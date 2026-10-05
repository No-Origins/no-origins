@AGENTS.md

# apps/home — Home

`home.no-origins.com`. **The model of the house he is building** (Home.md, `packages/docs/apps/`; read it before changing
anything here) — and, later, the realistic pictures image models make from it (H5). His name for it, 2026-10-02:
*"name that as home"*.

```bash
pnpm --filter home dev              # :3006 (portfolio :3000, design :3001, admin :3002, engineering :3003, motion :3004, orbit :3005)
pnpm --filter home publish:house    # put the house on the site (H4); --dry checks without uploading
```

## The house is private, the app is not (H4)

**The house lives in `src/content/`, which is gitignored**, on his machine: the description (`home.ts` and its parts),
the tour (`tour.ts`), the tour's pictures (`pictures/*.webp`) and **`Home-plan.md`, the house's own record** — the plan
read off his wireframes (H7), every version since (H8), the tour's stops and versions (H9). **Read `Home-plan.md` before
changing the house.** Nothing in that folder is ever committed, pasted into a document in `packages/docs`, or written
into a file outside it; a commit that would carry it is wrong, whatever else it does.

The app imports the house as **`@house`** (`next.config.ts`'s alias, typed by `src/house.d.ts`): `src/content` where it
is, and the made-up **`src/sample`** where it is not — CI, the review sweep, a fresh clone, Vercel's build. **The
deployed site reads neither**: on Vercel the page reads `house.json` from the private Blob store `home-house` at each
request, and `/tour/<name>.webp` reads each picture from it (`src/lib/store.ts`, `src/app/tour/[file]/route.ts`).
**An edit shows locally at once and on the site only when published** — `pnpm --filter home publish:house` evaluates
the description, checks the pictures the tour names, and uploads all of it over the store's copy. Publishing is his
call; say when a change is waiting for it. `HOME_STORE=1` makes a local server read the store (the app's `.env.local`
has its id and token from `vercel env pull`).

## The shape

**The house is a description** (H2): typed by `src/lib/house.ts` — materials, pillars, walls by their centre lines with
their openings, slabs by outline, blocks, stairs and the named views (H5). Feet, the page's directions (x across, y
down), levels above the model's ground. `src/lib/build.ts` turns it into three.js — a box or an extrusion per element,
one flat colour each, edges drawn — and `src/lib/viewer.ts` mounts that on a canvas the way `packages/ui`'s avatar
viewer is mounted: plain three.js, rendering on demand, one sun and the sky, no React renderer.
`src/components/model-view.tsx` is the canvas in React; `src/components/home.tsx` the page, given the house and the tour
by `src/app/page.tsx`: one `Grid` with the overlay and the cursor, the stage on it, the view's name right over the
player as one `hero` (Type.md T5) and the player on the last row, a pill as wide as its controls, placed by
`src/lib/layout.ts`. The screen is his to design (H3).

**The tour is a description too** (H9): typed by `src/lib/tour.ts` — an opening (the long shot, and the `approach`
leg Play glides in by), the stops (each a fixed camera with the guide's line and, where one was made, the picture from
that very camera) and a leg between each pair (the points the camera passes, so it goes through doors, and the doors
that open). The numbers are `TOUR_MOTION` in `lib/tour.ts`, his to tune; they are not motion tokens yet. A picture
fades in only once it has loaded; one that does not come leaves its stop showing the room alone.

**To change the house, change its description** in `src/content`. He corrects it in words — *"move the kitchen window
40 cm left"* — and the next version is written and recorded in `Home-plan.md`; a number he gave is exact, every other one
is a guess listed there. Do not draw a wall in three.js by hand: add it to the description, or add to the description's
type what it cannot yet say (and to `src/sample` if the sample should show it).

## What is true here and easy to get wrong

- **Realism is not the model's job** (H5): plain surfaces, one colour a material, no textures, no glass, no attempt at
  a photograph. The image models make the pictures from it; the model is the exact reference they are guided by.
- **A view is a camera the description names** (H5), the same after every change; `plan` is from straight above with
  everything from `cut` up taken off, a `look` from a point at another — and a stop of the tour is one (H9). A drag
  leaves the named view, pauses a walking tour, and the bar presses no stop until one is picked again.
- **A picture is a proposal, not the model** (H9): each was made from a camera of an older version, so its walls and
  windows can sit a little off today's; the model is the measure. A stop with a picture keeps that picture's camera.
  Do not move a stop's camera to "fix" the model behind its picture.
- **The walk goes through doors, never walls.** When a wall or a door moves, move the legs' points with it and look at
  the walk (`e2e/.mcp/home-tour.mjs`, below).
- **Behind the sign-in, twice** (H4): the gate in `src/proxy.ts`, whose matcher exempts no image so the pictures are
  gated, and `signedIn()` in `src/lib/store.ts`, asked again where the house is read. **Open without a login only on a
  development server with no Supabase keys**, so `pnpm review` and CI see the sample.
- **Only `@no-origins/ui` stands on the page.** The canvas is the one element that is not a component of the system,
  as the avatar's is; every control is.

## Reviewing it

In the sweep: `pnpm review` boots this app on :3006 and screenshots `/` (`HOME_ROUTES` in `e2e/review.spec.ts`) on
desktop and mobile in both themes — the real house on his machine, the sample in CI. `npx playwright test
e2e/review.spec.ts -g "home /"` runs only this app's route. **To see the tour**, with the dev server up:
`node e2e/.mcp/home-tour.mjs e2e/.mcp/home-tour 1440x900 light stops` walks every stop and screenshots each with its
picture in; `… walk` takes frames mid-walk; `… play` presses Play and watches it advance; `… approach` frames the glide
in from the long shot; `pixel dark one` is a phone. The canvas carries `data-stop`, `data-phase` (`at` · `walk`) and
`data-picture` (the picture's fade, 0–100) for scripts to wait on.
