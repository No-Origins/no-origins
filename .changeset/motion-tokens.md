---
"@no-origins/ui": minor
---

Motion is tokens (Motion.md, 2026-09-27). Every number a component animates by is now a `--motion-*` custom property
in globals.css, in five families: `surface` (dialog, alert dialog, popover, the menus, tooltip, hover card, select,
combobox), `panel` (sheet, the drawer's scrim), `state` (every `transition-*` without its own duration), `disclose`
(accordion) and `grow` (`Progress`'s `animate`). The values are the ones the components already had, so nothing moves
differently, with two exceptions too small to see. The tooltip runs at the surfaces' 100ms instead of tw-animate's
150ms. `Progress`'s change of value uses the grow curve (power3 out) instead of power2 out.

New: the `motion-surface` and `motion-panel` utilities, which set a surface's in and out timing.
`@no-origins/ui/lib/motion` (`motionMs`, `motionEase`, `easing`, `cubicBezier`) reads a token from script.
`@no-origins/ui/components/portal` (`PortalContainer`, `usePortalContainer`) gives a subtree an element for its
surfaces to portal into. Every component that portals now passes it through, and still goes to `document.body` when
there is none.

`@no-origins/ui/lib/cell-motion` (`flowSpots`, `stateOf`, `dotScale`, `cellMotionFrame`, `cellMotionTotal`,
`CELL_WRAPS`) is how one-cell elements move on the grid when one of them grows (Motion.md M9). They flow by rows or
columns, and a dot that changes lines overflows, travels or fades. It is pure, and it is the motion the studio designs
for the work menu.

Movement is decided (2026-09-27, his settings from the studio): the `--motion-move-*` tokens are in globals.css, at
400ms, a 20ms stagger (40ms as first picked, halved for the portfolio's tech column), overflow at a line's end, cubic out on the ring and the dot, the dot vanishing at a border, and
setting off a tenth of the move before the cells change. `readCellMotion(el)` reads them off an element, and
`motionNumber` joins `lib/motion` for unitless tokens. `motionMs` takes `signed` for a token that may run negative.

`@no-origins/ui/hooks/use-cell-motion` (`useCellMotion`) plays movement on a block. It runs one GSAP clock for each
change of the active element and hands each frame to the caller's painter, and it jumps under reduced motion unless
told `always`. The motion studio and the portfolio's tech column both play through it. `flowSpots` takes the grown
element's length (two by default), and `cellMoves` and `settledFrames` join `lib/cell-motion`.
