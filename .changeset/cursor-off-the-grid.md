---
"@no-origins/ui": minor
---

The system's cursor, the violet ring (Grid.md D34), is worn wherever an element carries `data-cursor`, not on the grid
alone.

- `styles/globals.css`: the ring, its fill while pressed, the scroll's liquid and the held slider's ring select
  `[data-cursor]` instead of `[data-slot="grid"][data-cursor]`. The grid sets it on its field as before; a surface off
  the grid sets it on its own element (Orbit's world, World.md W10).
- `components/scroll-area.tsx`: the liquid is held in the ring wherever one is worn (`closest("[data-cursor]")`).
