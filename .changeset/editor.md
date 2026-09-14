---
"@no-origins/ui": minor
---

**The editor's chrome, at a new `@no-origins/ui/editor` subpath** (Admin.md §6.5c). Everything visual the admin's
editor screen needs, in the package, because an admin-only component is a fork of the design system wearing a
different folder name (§10). None of it is registered: a palette that could be dropped onto a canvas would be a
palette inside a document.

- `PropsForm` renders a registry entry's `PropSchema` as controls, one per prop *type* (Scene-Schema.md §3.1) —
  hue → `HueSwatch`, text → `Field` with a live count, enum → `Segmented` (≤ 4) or `Select`, list → `Repeater`,
  pattern → `PatternPicker` with the studio behind *New pattern*, and so on. Several selections show the
  intersection of their schemas and *mixed* where they disagree (S4); a prop whose value is a `$ref` is shown,
  never overwritten.
- `DocumentForm` is the inspector with nothing selected: title, description, grid, reading order, views, patterns.
- `Palette` is the registry grouped by Atomic layer with a node-kind filter, each item draggable as
  `application/x-noo-component`, and `/` opens a command list (S2 + D).
- `SaveState` is S3: a `Dot` and a few words — saved · saving (pulsing, reduced-motion aware) · unsaved · failed
  with Retry · stale with Reload.
- `CanvasOverlay` draws S1 and S2 over the canvas in canvas space: the selection ring focus already wears, the
  kind · name tag that hides below zoom 0.4, the hover hairline, and the dashed drop ghost.
- `editor.css` ships as `@no-origins/ui/editor.css` and is imported by `index.css`.

**`CanvasShell` gains editor props, all additive**: `onSelect` / `selectedId` (a click selects instead of opening
a section, and the zoom snap is off while editing), `overlay` (rendered inside React Flow's viewport transform),
`onCanvasDragOver` / `onCanvasDrop` / `onCanvasDragLeave` in canvas coordinates, and `onNodeMove`. Without them a
click still opens a section and the snap still fires, so the live portfolio renders exactly as before.
`useCanvasZoom` is exported from `@no-origins/ui/canvas`, and `@no-origins/ui/document` gains an export map entry.
