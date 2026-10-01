---
"@no-origins/ui": minor
---

The intro's cast stands in a row, and only the agents a page names bounce (Grid.md D50, Motion.md M22, version 5).

- **`introSpots`** stands the cast side by side, a cell each, centred across the field on its middle row (or the
  nearest row no agent lands in), in a random order. The random cells of the centre four by four are gone.
- **`IntroAgent.bounces`**: whether an agent bounces while they stand; it does unless the page says not. `introPlan`
  takes `bounces`, one an agent.
- **Each agent's rest starts part-way through** (`IntroPart.since`): as if it had sat one to two blinks' time, so it
  is seen breathing and blinking while they stand. Every nest is a cell of the field.
