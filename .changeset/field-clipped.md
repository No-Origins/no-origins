---
"@no-origins/ui": patch
---

The field's paint is clipped to the grid's box. The lit lines' canvas runs `FIELD_PAD` (32px) past the field for the
glow, and wherever the count left less margin than that it stuck out of the grid and scrolled the page. With scrollbars
always shown (a Mac with a mouse, or the inspector docked on the right), the scrollbars took the box's width, the field
re-counted, they went away, and round again until React stopped with "Maximum update depth exceeded" in `Grid`'s
measuring.
