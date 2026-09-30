---
"@no-origins/ui": minor
---

`Slider` is a bar with its head merged into it, the head detaching into the cursor when it is held, and a fluid
body (2026-09-30, his, over a night of notes). The bar is a pill, 8px tall — `--slider-height`, in globals.css since
his grip pick and his second tuning of it, which a subtree may set — the head is a circle the bar's height over the join of the lime and the grey, so the lime ends
in it, with no gaps at rest. The track is drawn as segments — `slider-range` lime, `slider-rest` the input's grey —
placed from the values, so the slider now holds an uncontrolled value itself as well as passing it to radix.

The grip (Motion.md M16): the head the pointer holds is marked `data-held`, and `useGripMotion`
(`hooks/use-grip-motion.ts`) plays it — the bar's sides draw back 2px clear of the cursor's ring and round their ends,
and the head goes to the cursor's centre as an 8px dot, following the hand over the bar; let go, it comes back and the
bar closes over it. The body follows every head on a spring whenever its value moves, by the hand or the keyboard, its
ends rounding as they leave the head and stretching with their speed. `lib/spring.ts` is the springs (a response and a
bounce, in closed form), `lib/grip-motion.ts` the model. The grip is decided (his settings, "A As described, tuned", then
"A Today, tuned"): its `--motion-grip-*` tokens are in globals.css — the head in the cursor at once (0ms), and letting
go over 240ms on cubic out, the bar closing and the head coming back after it (a lead of −0.5), the body following on a
180ms spring with a bounce of 0.2 and a stretch of 0.6 — and `GRIP_START` is the same values. The grid's pressed cursor stays a ring while a slider's head is held (globals.css).
