---
"@no-origins/ui": minor
---

Enter and exit, movement's first primitive, the third motion on the motion studio's bench (Motion.md M11). Added to
`@no-origins/ui/lib/cell-motion`: `readCellEnter`, `cellPresence`, `cellEntries`, `cellEnterFrame`,
`cellEnterSettled` and `cellEnterTotal`. They describe one cell's element coming in and going out: its ring lighting on
the cell and its dot floating up into it, then the dot drowning out and the ring going out. The dot comes in place,
through the cell along the flow, or rising from its lower border. `useCellEnter` in
`@no-origins/ui/hooks/use-cell-motion` plays it with one GSAP clock a change, and one turned round part way goes back
the way it came. Its `--motion-move-enter-*` tokens are not in globals.css yet, and the fallbacks are the studio's
preset A: movement's dot at his settings, taken apart. Only the studio plays it. Movement's move is unchanged and does
not read these tokens.
