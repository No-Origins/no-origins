---
"@no-origins/ui": minor
---

Liquid (Motion.md M25, 2026-10-03, his: "fill a cell beside in progress with flowing liquid").

- **`Liquid`** (`components/liquid.tsx`): a box filled to `level`, its surface flowing — two waves, the front in the
  liquid's `colour` (the primary unless given) and the back a tone of it mixed toward the card — pouring to its level
  when it arrives or the level changes. A cell is a circle, so a 1 × 1 is a round glass. `still`, `always` and `tuning`
  for the motion studio.
- **`lib/liquid-motion`**: the pure model (`readLiquidMotion`, `liquidFrame`, `liquidLevel`, `liquidStill`,
  `liquidPath`, `liquidBackColour`, `paintLiquid`, `LIQUID_START`) on eleven `--motion-liquid-*` tokens, none in
  globals.css yet.
- **`hooks/use-liquid-motion`**: `useLiquidMotion` plays it on a box, one GSAP ticker, a flat surface under reduced
  motion.
- **`data-intro-fixed`** on a `GridItem` makes it a fixture of the intro (Grid.md D50, version 9): a page's turn leaves
  it where it is, and the intro neither measures it as a box of the section nor fades it in; it is hidden while the
  intro plays and shown when it hands over. The portfolio's status pill and the agents' cells to click are fixtures.
