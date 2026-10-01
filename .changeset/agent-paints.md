---
"@no-origins/ui": minor
---

The agent's paints stand out from the page in both themes (Orbit.md C20).

- `styles/globals.css`: `--agent-peach`, `--agent-yellow` and `--agent-grey` and their inks are gone. `--agent-red`,
  `--agent-orange`, `--agent-gold`, `--agent-green` and `--agent-teal` are new, each a mid-tone at least 3.3 : 1 from
  the page and from the muted nest, light and dark, with a dark ink at least 5.3 : 1 on it.
- `lib/agent-colours`: `AGENT_PAINTS` is nine, round the wheel: lime, violet, pink, red, orange, gold, green, teal,
  blue. `RENAMED_PAINTS` reads peach as orange, yellow as gold and grey as teal, and `agentPaintOf` checks a paint
  through it.
- `lib/properties`: a choice may declare `renamed`, its options that went and the one each became. `checkValue` reads
  through it, so a saved value keeps its nearest option rather than falling to the default.
- `lib/agent-body`: the paint declares `renamed: RENAMED_PAINTS`. `lib/sphere-motion` reads the paint token through
  `agentPaintOf`.
