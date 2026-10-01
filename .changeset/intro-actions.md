---
"@no-origins/ui": minor
---

The intro plays the agents' actions (Grid.md D50, Motion.md M22, version 3).

- **`introActions` on `Grid`**: how the cast bounces, jumps and dives, each action's values as published (`IntroActions`).
  The cast stands at random in the field's centre four by four and Bounces, each at its own random times, for two
  seconds. Then each Jumps or Dives, at random, to the top-left cell of the box it opens. As each lands, a small
  ripple lights the cells round its nest, ring by ring, one pass of the field's painter an agent. Then the nests open
  into the boxes as before.
- **`@no-origins/ui/lib/intro-motion`**: `introSpots`, `introPlan`, `introAt`, `introSink`, `introRipple` and
  `introActionValues` are added. `introCast` no longer takes the field and no longer picks the spots.
  `introTimes`, `introHeight` and `introDive` are removed, and `INTRO_START` has version 3's tokens.
- **`sphereMotionOf(look, motion?)`** takes an action's values for how the agent moves.
- **`AgentActionPlay.lands`**: when an action first touches down in the nest it ends in.
- **The field's painter**: a pass's cell with an Infinity delay is never lit, and where passes cross, a cell shows the
  younger lighting. `intro` keeps the painter on by itself.
