---
"@no-origins/ui": major
---

No page loads behind a loader (Grid.md D49, 2026-09-30).

- **A page is shown as soon as the grid has measured its field.** Nothing holds its boxes back. Nothing waits for the
  fonts, the window's load or the images, and there are no 2s of artificial load.
- **A turn fades the page away and fades the next one in**, 160ms each (`TURN_MS`), whatever the next page holds.
  Nothing waits for page 1 before a turn.
- **Removed from the API:** the `intro` prop on `Grid` and `GridPages`, and the `page` prop on `Grid`. Also gone:
  `useGridLoad`, `GridLoader`, the grid's `data-loading` and `data-intro`, and their rules in globals.css. The same
  goes for `data-load-section` and `data-load-box`, which nothing reads now.
- **Kept:** loading itself (Motion.md M10). `@no-origins/ui/lib/load-motion`, `useLoadMotion`, `paintLoadRing`,
  `paintLoadSection` and the `--motion-load-*` tokens stay, and the motion studio's Loading page still plays it.
