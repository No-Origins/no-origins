---
"@no-origins/ui": major
---

The numbered pager bar grows the current page to two cells, showing its number and title, and its pages move by
movement (`--motion-move-*`, `useCellMotion`) when the page changes (Grid.md D46, D47; 2026-09-27). On six cells the
first page sits on the second and third cells, a page with pages on both sides sits on the middle two, and the last
page sits on the fourth and fifth. `GridPage` takes an optional `title`, and a page that gets split across several pages
on a smaller field keeps that title on each of them. The pages between the arrows are now a single registry entry,
`pager-pages`, which replaces `pager-page`. `pagerWindow` is replaced by `pagerStart`.
