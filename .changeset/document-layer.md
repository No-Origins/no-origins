---
"@no-origins/ui": minor
---

The document layer (Scene-Schema.md §10; Admin.md §13 step 6), at `@no-origins/ui/document`: the document schema and the registry's prop schemas as Zod, refs, markdown with the `:pan` and `:chip` directives (`PanLink` is in the package now), and `documentToScene` — a document in, the `SceneNode[]` the canvas takes out, with `pages`, `issues` and `valid`. `RegistryEntry` gains `childrenFrom` and `adapt`; `BentoCell` takes `pattern` and `hue`. `zod` is a dependency. Built to the §6.5c picks on top of it (Scene-Schema.md §10.4): `CellHead` spreads across its cell, drops the dot (a deprecated no-op prop for one minor) and gains a `media` slot for a logo; `Text` gains `size="widget"`; `Figure` gains `kind="word"` and a value cap of 24; `DocumentContext` gains `sampled` so a node reading sample copy renders the tag and reports it; and a `Text` list inside a bento cell loses its markers.
