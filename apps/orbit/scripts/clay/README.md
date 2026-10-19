# The Clay's measure (World.md W102)

`apps/orbit/src/world/clay-turnaround.ts` is written from here; regenerate it rather than edit it by hand.

His picture, the turnaround the Clay matches, is `notes/world/clay-turnaround.png` (his, kept beside his other mocks,
not in the repository). Three measurers read its outlines row by row, every 4 of its pixels, by its edges, by a model
of its background, and by eye against a ruler; a fourth reconciled them into `consensus.json` (the medians, every
disagreement settled by eye: its `notes`, `decisions` and `disagreements` say how). `tuning.json` holds what is chosen
on top of the measure: the head's foot at row 364 (the notch where it meets the neck), how square the torso's and the
arms' sections are, how far an arm presses into the torso, and how far the shoulder's dome runs down the arm.

From the repository's root:

    node apps/orbit/scripts/clay/symmetrize.mjs apps/orbit/scripts/clay/consensus.json /tmp/clay-sym.json
    node apps/orbit/scripts/clay/generate.mjs /tmp/clay-sym.json apps/orbit/src/world/clay-turnaround.ts apps/orbit/scripts/clay/tuning.json

`generate.mjs`'s comments say what each part takes from which view. To see the result against the picture, the
gitignored tools in `e2e/.mcp/` render the Clay in the picture's five views at its scale (`clay-turnaround.mjs`, with
`AXES='[179.86, 477.72, 719.68, 974.99, 1277.2]' GROUND=782.89 CROWN=221.53`, the views' middle lines, ground and
crown in the picture) and compare (`e2e/.mcp/clay/compare.mjs`, `compose.mjs`, `zoom.mjs`).


## Version 8 (World.md W104)

The measured outline and fabric finish remain the starting point. Body, arms, legs and neck form one connected
skin. The arms are opened 30 degrees when meshed and bound, keeping their close lower contact from welding to the
torso. No fixed shoulder cover remains. `clay-skin.ts` fairs weights along the surface, blends bone transforms as
dual quaternions and locally fairs posed shoulders and hips. Normals, bounds and picking follow the actual posed
surface; grain follows a rest-position attribute. Each update starts from bind positions, so poses cannot accumulate
shrinkage. Unchanged poses skip surface work. Version 7 is frozen as `human-v7.ts`, `build-human-v7.ts` and
`clay-turnaround-v7.ts` beside version 6.

Render the **actual rigged model**, five separate shaded views and masks plus one shared studio-floor scene:

    node apps/orbit/scripts/clay/review.mjs e2e/.mcp/clay-review

The tool bundles through `pnpm dlx esbuild`; set `ESBUILD=/path/to/esbuild` to use an existing offline installation.
`CONFIG='{"form":"suit"}'` checks the Suit, `POSE=walk` / `run` / `posture:wave` / `posture:hover` checks articulation,
`SWEEP=on` also renders all five postures and eight phases of each gait plus hover and flight on one reused mesh, reports pose costs, and checks replay drift;
`STUDIO=off` skips the shared floor scene, and `WORLD_DIR=/path/to/frozen/world` renders another version. The five
individual cameras stay level for outline measurement; the shared studio camera looks down 2 degrees to reveal
contact shadows. Its four nearby keys approximate a large studio source. Orbit's Clay page uses one key, diffuse
fill and a shadow-receiving four-metre block; the character mesh and material are the same in both. Review the
rendered volumes and finish as well as the outlines: silhouette overlap alone does not establish a visual match.

Make a labelled comparison with the reference (optional third argument overrides the reference path):

    node apps/orbit/scripts/clay/compose.mjs e2e/.mcp/clay-review


## Version 9 flight (World.md W107)

Clay's Motion selector names the three reference abilities: Gentle Hover, Jet Boost and Float Glide. Selecting an
ability takes off; choosing Still lands. `human-flight.ts` keeps those transitions interruptible and reads the
`--motion-human-clay-*` starting values; `build-human-flight.ts` adds soft warm sole propulsion and fine glide trails.
The original v8 surface and skin are frozen beside v9; historical published human settings are frozen too so a new
motion enum cannot change the older forms.

Use `POSE=motion:hovering`, `POSE=motion:flying` or `POSE=motion:gliding` with `PHASE=0..1` to render the actual
Clay ability and its effects. The browser checks cover the transition lifecycle, reduced motion, the phone preview
and switching forms. Pure transition regressions run with Node 24:

    node --test apps/orbit/scripts/clay/flight.test.mjs

## Approved VR turnaround profile

The clearing's `clay-vr.ts` uses the approved `public/references/clay-vr-turnaround-v1.png` and sets
`clayProfile: "vr-v1"`. Its proportions alone did not match the new reference: `human.ts` therefore gives this
profile a smooth, full-cheeked head loft, a rounder torso section, and longer elliptical paddle-end caps.
`build-human.ts` adds its relaxed outward arm rest to the existing posed rig; `clay-skin.ts` keeps its broader
pressed-clay marks anchored through deformation. The original measured turnaround and its generator stay intact
for the historical Clay profile. Review the clearing's actual assembled character, including the head-carried visor
and backpack, rather than treating a change in dimensions as proof of a visual match.
