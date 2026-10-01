---
"@no-origins/ui": minor
---

The agent's actions (Motion.md M24). `lib/agent-actions.ts` declares the things an agent does, each by its name: its
groups of controls (the agent's own motion settings, with the action's labels and defaults, so `sphereMotionFrom` reads
them), its course from the nest it sits in, and its phases, as long as its controls make them (`AGENT_ACTIONS`,
`agentAction`, `actionSettings`, `actionDefaults`, `checkActionValues`). Bounce, version 1, is the first: it crouches,
leaps straight up out of its nest, falls back into it, bounces off its floor and settles. `lib/sphere-motion.ts` adds
`sphereBeats` (a jump's crouch, rise, fall, impacts, landing and settle) and plays a jump to the nest it left as a
bounce: straight up with no drawing back, one nest lit throughout, its landings dipping that nest. A landing's bowl is
now hit in its lower half only, so a bounce higher than the bowl is deep goes up out of it rather than stopping at its
top; version 15's defaults have no bounces, so no jump at them moves differently.
