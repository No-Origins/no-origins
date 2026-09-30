---
"@no-origins/ui": minor
---

`Slider` takes `marks` (2026-09-30, his, Motion.md M21): a dot over every step's place, or `marks={n}` one every `n` of
the value's units from `min`, in room the slider keeps above its bar (before it, standing vertical). A mark is the
bar's grey and lime where the value is, and stays lime until the fluid body's lime has flowed back past it. Every mark
has a zone: a held head whose cursor comes within `--motion-step-zone` of a mark snaps right under it on a spring and
takes the mark's value, and out of every zone the value lands on no mark it has not snapped to. The snap — or, with no
zone or from the keys, the value landing on a mark — is a tick: the mark pops, the head kicks on the same curve, and
the device vibrates where the browser has the Vibration API. `lib/step-motion.ts` is the model; `useGripMotion` plays
it on the grip's loop (`land`, `snapped`, `onSnap`). `--slider-mark-size`, `--slider-mark-lift` and the
`--motion-step-*` tokens fall back to version 1's values (`STEP_START`) until he picks.

Fixed with it: radix hides a slider's heads on their first render, so the grip's first measure found every head at the
start edge and the first move of any slider poured the lime in from there; it measures again once they are placed.
