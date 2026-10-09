---
"@no-origins/ui": minor
---

A component may scroll its own content, and the cursor shows how far (Grid.md D52, Motion.md M26, version 4): `ScrollArea` has no scrollbar. Over a box that scrolls, the cursor's ring holds flowing liquid at the share scrolled (`scrollLevel`: a little at the top, full at the end), drawn into the cursor's own image every 50ms (`scrollCursorAt`) and, while a wheel turns, by a ring and `Liquid` drawn at the point that grow to twice the cursor and ease back when the scrolling stops; it floats up as the pointer enters and disappears once the hand is still. `Liquid` takes `from`, the level it arrives from. `lib/scroll-motion.ts` holds the tokens (`SCROLL_START`) and `scrollerAt`; `GridPages` leaves a wheel, a finger or a key over a scrolling component to it.
