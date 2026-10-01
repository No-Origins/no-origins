---
"@no-origins/ui": patch
---

The agent's shapes have smooth edges (Character-Studio.md C18, version 5 of the shapes).

- `lib/agent-shape`: a flat-sided shape's faces are each one tone, and every point of its edges' and corners' rounds is
  in the tone of the way it faces, in steps of a twenty-fourth (`TONE_STEPS`), so an edge rounds smoothly from one
  face's tone to the next. An edge is drawn in runs of one step (`runsOf`); a corner's ball is cut between the circles
  where its tone crosses a step (`cornerOf`). It was five facets an edge with a fan at each corner.
- The outline of every shape is the hull of its balls' horizons and its rims (`horizonOf`), found as the shape stands
  and then bent (`bendOf`, which replaces `giveOf`), so it is a curve wherever the solid is round. The round shapes no
  longer take the hull after the bend.
- `ShapeFrame` is unchanged, and the sphere draws exactly as before.
