---
"@no-origins/ui": minor
---

The sphere is the agent, version 11 (Motion.md M17, M12, 2026-09-30): `lib/sphere-motion.ts` gives it eyes — two circles
riding the head as it is drawn, looking where it goes, their lids blinking on their own clock and squinting shut as it
lands (`SphereFrame.eyes`, `sphereFrame(course, t, blinkAt)`, `SphereCourse.impact`, eight `--motion-sphere-eye-*`,
`-look`, `-look-lead`, `-blink-every`, `-blink` and `-squint` tokens, `SPHERE_START` version 11's). Removes
`lib/agent-motion.ts`, the pill agent's unplugged statechart, with the pill.
