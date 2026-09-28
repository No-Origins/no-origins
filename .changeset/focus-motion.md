---
"@no-origins/ui": minor
---

Focus, the fifth motion on the motion studio's bench (Motion.md M13, decided 2026-09-28): a card in focus and the page
blurring round it, least at the card and rising in rings out from it. `@no-origins/ui/lib/focus-motion`
(`readFocusMotion`, `focusRings`, `focusLayerStyles`, `focusPlace`, `paintFocus` and the level helpers) is the model, and
`@no-origins/ui/hooks/use-focus-motion` (`useFocusMotion`) plays it on a surface with one GSAP ticker, writing a few
custom properties and rendering nothing per frame. A card reached from nothing brings the blur in by the motion's way,
another card takes the focus over and the field moves to it, and off every card it holds, then goes. Its 19
`--motion-focus-*` tokens are in globals.css, his settings. The portfolio's cards play it (Portfolio.md P18). While a card
is in focus a page may set `data-cursor-still` on the grid, and the pointer lights no cell under the blur.
