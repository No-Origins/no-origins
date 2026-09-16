# @no-origins/ui

## 1.0.0

### Major Changes

- **1.0 — the revamp (2026-09-16).** Bhargav: _"No more glass effects. Remove React Flow and all React Flow related items completely. Motion should also be part of the design system. Remove rail too."_ Recorded as Atomic.md D10–D13.

  - **One flat surface (D10).** `Glass`, `glass.css` and every `--glass-*` token are gone. `Surface` is the material — the `--surface` fill, a `--rule` hairline, an elevation at three levels (e1 · e2 · e4) — and everything that was glass wears it: Menu, NavBar, the Tool's sidebar, inspector and bar, Card, the secondary Button, Field, Segmented and ThemeSwitch, Bubble, ChatInput, Toast, Dialog. `Card` lost `surface`; `BentoCell` lost the `glass` tone. The Blob is flat: the character is the opaque pastel, the host (`variant="host"`, was `"glass"`) is the surface with a hairline; frost, refraction and the rim light are gone with `refraction`, `GroundProvider`, `useGround`, `measureGround` and `REFRACTION_ZOOM`. ProfileCard lost its frosted bottom and its `bloom`; a scrim holds the words up.
  - **No React Flow (D11).** The `@no-origins/ui/canvas`, `/editor` and `/document` subpaths are removed with everything in them — `CanvasShell`, the node renderers, the scene types, `documentToScene`, the schema, the editor's chrome — and with them the `@xyflow/react` peer and the `zod` dependency. `ToolScreen` lost `flush`. A different approach to the canvas comes later; the registry (`kind`, `slots`, the catalogue, the fingerprint) survives as the description of what a component is.
  - **Motion is a layer (D12).** `tokens/motion.ts` exports `durations`, `easings`, `motionPatterns`, `motionNotes` and `prefersReducedMotion`; the `Motion` atom applies a named pattern (`rise · pop · breathe · lift`) with a `delay`; `useReducedMotion` reads the preference live. motion.css keeps the five patterns and nothing else. The registry gained a `motion` group with `Motion` and `Surface` entries.
  - **One navigation, one width (D13).** The `Rail` organism, `Page`'s `rail` prop, the Menu's `rail` and `floating` forms and its `onToggleForm` toggle are gone. `Menu` is `column` · two columns (when the current item has a `panel`) · `sheet`; `auto` is the column from `md` and the sheet below it.
  - **Every deprecated alias went with the major**: `Intro`, `RoadmapItem`, `RegionLabel`, `Illustration`, `IllustrationCanvas`, `fields`, `fieldNames`, `FieldName`, `Glyph`, `glyphNames`, `GlyphName`, `CellHead`'s `dot`, and the bare classes `.glass*`, `.rise-in`, `.pop-in`, `.lift`, `.breathe`, `.noo-prose`, `.noo-theme*`, `.noo-graph`, `.noo-intro`.

### Minor Changes

- `Catalogue` gains `layer`: render one Atomic layer, without its header, for a screen that already names the layer. The showcase's `/components/atoms` and its two siblings are this; the admin still renders the catalogue whole, so there is still exactly one rendering of the registry.

  The layer's own words move with it. `layerNotes` — title, route slug, line and source path per layer — is now a registry export rather than a private map inside `Catalogue`, alongside `layerBySlug` for turning a route segment back into a layer. A screen that prints "Atoms" in its header and the catalogue that describes what an atom is now read the same declaration.

  Also fixed: the layer eyebrow's index came from the position in the rendered list, so a filtered catalogue would have called every layer "layer 2 of 6". It comes from `layers` now.

- 5219696: The inspector controls (Admin.md §6.5a–b, decided 2026-09-14): `HueSwatch`, `PatternPicker`, `Repeater` (rows and chips), `Range`, the `PatternStudio` organism, and reordering on `Tree` (Alt + arrows, drag, `onReorder`, `moveTreeNode`). Illustrations are **patterns** now — `Pattern`, `PatternCanvas`, `patterns`, `patternNames`, `PatternName`, the `pattern` prop type — with the old names kept as deprecated aliases for one minor; the library grows from six to eighteen.

## 0.1.0

### Minor Changes

- The 2026-09-14 release: the package organised by Atomic layer (tokens · atoms · molecules · organisms · templates), one hue slot instead of twelve ladders, space/control/type tokens, noo- prefixed glass and motion classes (bare names aliased for one release), and the components the admin needed — Menu, Table, Dialog/Sheet, Tabs, Toast, Tooltip, Select, Checkbox, Radio, Segmented, Tree, Speaker, Icon — plus the Tool and Document templates. Deprecated aliases: Intro, RoadmapItem, Rail, Page's `rail` prop, `.glass*`, `.rise-in/.bubble-pop/.lift/.breathe`, `.noo-prose`, `.noo-theme`. Details in Atomic.md at the repo root.
