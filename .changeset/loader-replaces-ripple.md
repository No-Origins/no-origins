---
"@no-origins/ui": major
---

The grid loads every page with the loader, and the ripple is gone (Grid.md D48, 2026-09-27).

- **The intro is page 1's load.** A square of dashed lime rings stands on the field's centre, one ring a box, a closed
  ring chasing round it for 2s at the least and until the page is ready. Then each ring goes to its box's top-left
  cell and the box opens from it: loading, `--motion-load-*` (the turn is now `chase`), Motion.md M10.
- **A turn fades the page away over `TURN_MS`.** The next page loads only if its boxes have images still to come;
  otherwise it shows at once and fades in.
- **The grid no longer draws itself in.** The front, its lit lines and their glow, the cover, and the drawing going
  again while the page loads are gone. So are the ripple between pages and its wash.
- **Removed from the API:** the `ripple` prop on `Grid` and `GridPages`, and the `washAway`, `washSpan` and
  `rippleSpan` exports.
- **Sections:** boxes that carry the same `data-load-section` load as one section, out of one ring, over the rectangle
  round them all. An element inside a box that carries `data-load-box` is a section of its own, one ring (a card, a
  button, a label, a mark); a box with any is no section itself.
- **Added:** `useGridLoad` and `GridLoader` (internal) play the loader through `useLoadMotion`. `paintLoadRing` and
  `paintLoadSection` are new exports of `@no-origins/ui/hooks/use-load-motion`. `useLoadMotion` takes `onIn`. A
  loading page's boxes are held by `data-loading` in globals.css.
