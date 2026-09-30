---
"@no-origins/ui": minor
---

Focus, the fifth motion on the motion studio's bench (Motion.md M13, decided 2026-09-28): a card in focus and a cloth
of blur round it, least at the card and thicker out from it. Since his note the same night the blur is a cloth, not a
ripple: it is drawn out from under the card, each of its four edges to the surface's, so every corner arrives at once
(`pull`), with a soft or crisp hem and an optional fold, and the card lifts over it, casting a shadow on it.
`@no-origins/ui/lib/focus-motion` (`readFocusMotion`, `focusRings`, `focusLayerStyles`, `focusShadow`, `clothEdges`,
`paintFocus` and the level helpers) is the model, and `@no-origins/ui/hooks/use-focus-motion` (`useFocusMotion`) plays
it on a surface with one GSAP ticker, writing a few custom properties and rendering nothing per frame. A card reached
from nothing brings the cloth by the motion's way, another card takes the focus over and the cloth moves to it, and
off every card it holds, then goes. Its 24 `--motion-focus-*` tokens are in globals.css, his settings: round 1's Tide,
tuned, on 2026-09-28, then round 2's C Unroll, tuned, on 2026-09-29 (an 80ms fade in, 1px at the card rising on
ease-in to 16px over 21 cells, a 120ms hold, a 400ms fade out, an 80ms glide). The motion studio's page 5 plays it; the portfolio does not (Portfolio.md P21). While a card is in focus a page may set
`data-cursor-still` on the grid, and the pointer lights no cell under the blur.
