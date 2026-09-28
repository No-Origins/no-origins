---
"@no-origins/ui": minor
---

Loading, the second motion on the motion studio's bench (Motion.md M10). `@no-origins/ui/lib/load-motion`
(`readLoadMotion`, `loaderLayout`, `loadPlan`, `loadFrame`, `loadTotal`, `loadSettled`, `loadRing`) is how a page
loads on the grid: a square of dashed lime cells at the centre, one per section and never wider than tall, its
rings turning (spin, gears, chase or relay) until they land. Each ring goes to its section's top-left cell, and the
section opens from it. When the page is ready every ring is pressed to 0.5 at
once and goes straight to its section in one move of movement's dot, every ring landing at once, reading movement's
tokens with `readCellMotion`, and all are released into plain borders that open outward into their sections, never
crossing another.

Movement's dot (`@no-origins/ui/lib/cell-motion`, Motion.md M9) is now seen only on the cell it leaves and the cell it
reaches: a dot going further than a cell drowns once, is not drawn over the cells between, and floats up once
(`travelScale`, which `cellMotionFrame` and loading both use). A move of one cell is unchanged. `CellMove` carries
`shown`, so a dot turned round between cells stays unseen until it arrives. `@no-origins/ui/hooks/use-load-motion` (`useLoadMotion`) plays it with one GSAP ticker and a
painter the caller provides. Its `--motion-load-*` tokens are in globals.css, his pick of 2026-09-27 (a chase,
once round every 6s, a 200ms press and a 1200ms opening the section comes in over). The grid loads every page with it
(Grid.md D48).
