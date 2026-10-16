---
"@no-origins/ui": patch
---

`AccordionContent` no longer pins its content to the height measured as the item opened (sera's
`h-(--radix-accordion-content-height)`), which clipped anything that grew while it was open: a jig's group gaining its
controls as a block is picked (Orbit's Sector card, World.md W24). The open and close keyframes animate the outer
element's height, so nothing moves differently.
