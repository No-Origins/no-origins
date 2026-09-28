---
"@no-origins/ui": major
---

Every corner is one cell's circle, and every cell is a circle (Grid.md D39, D40; 2026-09-26).

- `--radius` is half the grid's cell (it was `0`). `Grid` writes its measured cell on its root as `--grid-cell`, and
  outside a grid `globals.css` works the cell out from the viewport. Every box in the components is `rounded-lg`,
  which is `var(--radius)`, so a box a cell or less across is a pill or a circle and a bigger one gets a cell's curve
  at each corner. The underline fields, the arrow tips and a calendar range's middle days stay square.
- `Slot`: the `background`, `muted` and `card` fills are rounded and clip to the curve. `transparent` is not rounded.
- `Alert`: the accent is a 2px start border, where it was an `after:` bar.
- The field's painter draws a dashed ring in each cell where it drew a dashed square, and the glow of a lit cell is
  round. The pointer lights a cell only inside its circle.
- `startFieldPainter`'s `init` takes `lace`.
