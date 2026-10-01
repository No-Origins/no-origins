---
"@no-origins/ui": minor
---

The intro's agents land on the centre of their sections, and the sections fade in once the agents have dived (Grid.md
D50, Motion.md M22, versions 4 to 7).

- **Each agent lands on the centre of the boxes it opens**: the cell at the middle of the rectangle round them all, or,
  where that falls between cells, the first cell next to it that is in one of the boxes. One that opens none still
  sits on the box that names it.
- **Its small ripple spreads, then it dives, then its boxes fade in.** It dives into its nest once its ripple's last
  ring has lit, and every box it opens then fades in by one Web Animations opacity fade. The top-left opening by the
  loader's `openBox`, and the boxes' lime lines, are gone.
- **`@no-origins/ui/lib/intro-motion`**: `introNestLeft` is added and `introOpening` is removed. `introPlan` takes the
  page's `boxes` in place of `count` and `load`. `IntroRole.boxes` is a list of box indices. `INTRO_START` has version
  7's tokens: `reveal` is new, `settle` counts from the ripple's last ring, and `cascade` is gone.
