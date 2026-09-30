---
"@no-origins/ui": minor
---

The intro is the agent (Grid.md D50, Motion.md M22, version 1).

- **`intro` is back on `Grid`**, with `overlay`. The agent stands in the page's `data-intro-agent` circle and breathes
  for 2s, then hops in place. As it lands, the field's cells light violet ring by ring from its circle out to the
  field's edges, as one pass of the field's painter. When the last ring has lit, the agent fades and the page's boxes
  come in. Once per document load, never under reduced motion.
- **Added:** `@no-origins/ui/components/grid-intro` (`GridIntro`), which the grid loads only while an intro plays, and
  `@no-origins/ui/lib/intro-motion` (`readIntroMotion`, `introRings`, `introPlan`, `INTRO_START`). The field handle
  takes a `pass`.
- **globals.css** holds the page back while `data-intro` is `agent`, and brings it in while it is `reveal`. It does the
  same for anything an app draws behind the grid that carries `data-intro-held`.
