---
"@no-origins/ui": minor
---

Focus mode, the sixth motion on the motion studio's bench (Motion.md M14, 2026-09-28), not decided: one vertical of the
page read at a time. A panel comes out of the page over the vertical, lifted in 3D, and a cloth of blur rolls out from
the panel's edges over everything else, least at the panel and rising outward; moving to another vertical, the panel
slides there. `@no-origins/ui/lib/mode-motion` (`readModeMotion`, `modeLift`, `modeHole`, `modeRings`,
`modeLayerStyles`, `paintMode` and the timing helpers) is the model, and `@no-origins/ui/hooks/use-mode-motion`
(`useModeMotion`) plays it on a surface. Its `--motion-mode-*` tokens are not in globals.css until he picks; the
fallbacks are the studio's preset A. Only the studio plays it.
