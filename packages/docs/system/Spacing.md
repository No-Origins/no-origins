# Spacing

How much room goes between things and inside them: one base scale, and on it every space named by its job. The tokens
are in `packages/ui/src/styles/globals.css`; the design site's Tokens → Spacing shows them.

Current as of 2026-10-09. Earlier versions and what they decided are in git history.

**SP1 — Spacing is two layers: a base scale, and jobs on it.** Decided 2026-10-09 (his pick, E of five: a stepped
scale alone, spacing following the cell, spacing by job alone, everything a fraction of the cell, and the two layers).
A component never picks a number for a space: it asks for the job (SP3), and the job is a step of the base (SP2), or
a step held clear of a round corner (SP4). The base is what the jobs are made of and what a space with no job yet is
drawn from.

**SP2 — The base: nine steps, and no others.**

```
0 · 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 px
```

Tailwind's own steps `0 · 0.5 · 1 · 2 · 3 · 4 · 6 · 8 · 12` (its spacing unit is 4px), and `SPACE_STEPS` in
`lib/spacing.ts` for script. The grid's scale, `GRID_SPACING` (0 · 4 · 8 · 12 · 16, Grid.md §3), is the part of it the
grid uses. A space off these steps (shadcn's 6, 10, 14, 20px) is to move onto them.

**SP3 — The jobs.** Each is a `--space-*` token and a Tailwind spacing name, so a component writes `p-inset`,
`gap-stack` or `p-inset-pill`, and a script reads `var(--space-inset)` (`space()`, `spaceOf()`).

| Job | Value | What it is for |
|---|---|---|
| `inset` | 32px, or more (SP4) | A box's padding: a card, a dialog, a slot with a surface (its default), an alert. 32px since his "I don't feel the padding is enough … go to next two tokens up" (2026-10-09), from 16 |
| `inset-tight` | 12px, or more (SP4) | A dense box's padding: a menu's panel, a list of choices, the showcase's sidebar list |
| `inset-pill` | 16px, or more (SP4) | A box one cell tall, a pill, where the corner is half the box; the same on every side |
| `stack` | 8px | Between things stacked in a box: a heading and its text, one paragraph and the next |
| `stack-tight` | 4px | Between a label and what it names, a title and its note |
| `inline` | 8px | Between things side by side in a row: controls, chips |
| `inline-tight` | 4px | Between an icon and its word inside one control |
| `gutter` | 12px | Between boxes on the grid, and the grid's own padding (Grid.md D13, D15) |

A `Slot` takes its inset by job too (`inset="inset-pill"`), and a surface slot with none set takes `inset`
(Slots.md S3). A box one cell across cannot hold `inset` (twice it is more than a cell): it is a pill (`inset-pill`), or
empty and padded `0`, as the pager's empty cells are.

**SP4 — A box's padding clears its round corner.** Every box's corner is half the cell (Grid.md D39), and text set
closer to the edge than about 0.3 of that radius runs under the curve and is cut. So each inset is the larger of its
step and 0.3 of the radius: `max(32px, calc(var(--radius) * 0.3))` for a box; the pill's is half the radius. Every inset is the
same on all four sides (his, 2026-10-09: "On the left and right, the padding is more than the top and bottom. I want
that to be equal"). With today's cells (60 and 72px; about 54 on a phone) the steps are the larger, and the rule holds
if the cell grows. The insets read the radius where they are used, so they are declared on every grid as the radius
is.

**SP5 — Between boxes there is no margin.** On the grid the space between boxes is the gutter and the space round the
field is the gutter (Grid.md D15); a box has no margin, and a cell of air between blocks is a whole cell, laid out on
the grid. Inside a box the space between things is a gap on their container (`gap-stack`, `gap-inline`), not a margin
on one of them.

## Open

- The components and apps still use spaces off the base (SP2); they move onto it, and a lint keeps them there.
- Whether `stack` and `inline` stay the same size.
