---
"@no-origins/ui": minor
---

The document layer (Scene-Schema.md §10; Admin.md §13 step 6), at `@no-origins/ui/document`: the document schema and the registry's prop schemas as Zod, refs, markdown with the `:pan` and `:chip` directives (`PanLink` is in the package now), and `documentToScene` — a document in, the `SceneNode[]` the canvas takes out, with `pages`, `issues` and `valid`. `RegistryEntry` gains `childrenFrom` and `adapt`; `BentoCell` takes `pattern` and `hue`. `zod` is a dependency.
