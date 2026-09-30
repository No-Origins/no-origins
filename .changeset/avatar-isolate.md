---
"@no-origins/ui": patch
---

`Avatar` is `isolate`. Its ring's `mix-blend-*` made Chrome isolate the nearest stacking context to blend it, and where
that box also held a cloth of `backdrop-filter` layers (focus and focus mode, Motion.md M13, M14) it became their
backdrop root, so the grid's field under the cloth stayed sharp. The ring now blends with the avatar's own picture only.
