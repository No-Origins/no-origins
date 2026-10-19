---
"@no-origins/ui": minor
---

The colour picker's swatches stand in rows, each named in a tooltip (Orbit.md C17; his, 2026-10-14: "I'm unable to
recognise colors from color palettes. Organize them and break them into rows"; 2026-10-15: "add tooltips to these colors
because I'm unable to see which color it is").

- `components/colour-picker`: every swatch is the small size, 36px, and they wrap into rows as the column holds them,
  never growing smaller to share it. A `ColourOption` may name its family (`group`); a family's swatches share a row,
  in the order given, so a palette organised by family reads as its families. Each swatch's name is the system's
  `Tooltip`, on hover and on focus, in place of a `title`; its dot of colour is 20px, from 16.
