---
"@no-origins/ui": major
---

The composer is removed, and with it everything only the composer used (2026-09-23).

- `grid-editor.tsx` is deleted: `GridEditor` and `useHistory`. Render a layout with `GridPages`.
- `grid-frame.tsx` is deleted: `GridFrame`, `referenceBox`, `referenceShape`, `MIN_FRAME`. `GRID_REFERENCE_BOX` moved
  to `grid.tsx` and lost its `label`.
- `grid.tsx`: no `GridFrameContext`, `useGridFrame` or `metrics.scale`, and no `MIN_CELL`, `MAX_CELL`, `MIN_PAGER`,
  `MAX_PAGER`, `PAGER_STEP` or `GridSpacing`.
- `grid-pages.tsx`: the surface is read-only — no `GridEditing`, no drag or resize, and `RenderGridItem` takes only
  the item. `GridPageSurface` is no longer exported. `GridPages` loses `config`, `rulers` and `onResolved`.
- `Grid` loses `config` (it reads `DEFAULT_GRID_CONFIG`, as D13 decided) and `rulers` (D24, withdrawn).
- `resolvePages` returns the pages; `ResolvedPages` and its source/shape/mode report are gone.
- `grid-layout.ts`: no `withAuthored`, `withoutAuthored`, `addPage`, `removePage`, `moveItemToPage`,
  `evictFromPagerCells`, `newPageId`, `layoutCode`, `configCode`, `widestAuthored`, `narrowestAuthored`,
  `countOverlaps`, `layoutFromSpans` or `GridSpan`, and no `keep` option. `SlotInset` derives from `GRID_SPACING`.
- `registry.tsx`: only `Placed` is exported, and the registry holds the one entry a layout still places, the pager's
  arrows. `REGISTRY`, `PALETTE`, `registryEntry`, `defaultProps` and the prop fields are gone.
- `slot.tsx`: no `SLOT_FILLS` or `SLOT_ALIGNS`.
- `zod` is no longer a dependency.
