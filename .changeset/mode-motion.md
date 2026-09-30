---
"@no-origins/ui": minor
---

Focus mode, the sixth motion on the motion studio's bench (Motion.md M14, 2026-09-28), decided 2026-09-29: one vertical of the
page read at a time. A panel rises out of the page over the vertical in 3D, its whole border there from the start, the
vertical under it never moving, and a cloth of blur comes from the panel's edges over everything else, least at the
panel and rising outward; going is the same steps backward. Moving to another vertical, the one left goes as the next
comes, both from the same moment: every vertical has a panel and a cloth of its own (`cloths`), and `paint` gets a frame a
vertical and the one standing over the cloths (`ModeFrames`).
`@no-origins/ui/lib/mode-motion` (`readModeMotion`, `modeShape`, `paintModePanel`, `modeRings`, `modeLayerStyles`,
`paintMode`, and `modeOnAt`, `modeOffAt` and `modeSwitchMs` for the timing) is the model, and `@no-origins/ui/hooks/use-mode-motion`
(`useModeMotion`) plays it on a surface. Its 24 `--motion-mode-*` tokens are in globals.css, his settings (A As
described, tuned: a 90ms rise 80px out through 800px, and a drop timed on its own, `--motion-mode-drop` and
`-drop-ease`, at the rise's values until he tunes it, a cloth from 2px rising on expo out to
7px under a 60% veil, swelling in over 250ms and out over 1000ms), and `readModeMotion` falls back to
the same values. The motion studio's page 6 plays it; the portfolio does not (Portfolio.md P21).
