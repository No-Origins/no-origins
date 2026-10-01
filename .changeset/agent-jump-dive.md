---
"@no-origins/ui": minor
---

Two more of the agent's actions (Motion.md M24): **Jump**, the agent's hop from one nest over the cells to another at
his version 15's values, and **Dive** (version 2), into its nest and out of it behind the page the way it is going, a
time under the page, and into the next nest from the side it comes from, carrying on in front of it into the bowl —
all under one gravity. `sphereArrival` (`lib/sphere-motion`) is that coming in: a leap's landing started in the air
over the bowl at a given speed, the landing's simulation now `bowlSim`, which a jump's landing goes through unchanged. An
action now `play`s from a trip (`AgentActionPlay`: where it ends, its total, its phases, and any moment of it as an
`AgentActionFrame` — the frame, how far it has sunk, the nest it is cut to, whether it is hidden), says whether it
`travels`, and `actionStill` is the agent sitting between plays. `agent-body` declares the Dive group (`spring`, `dive`,
`under`, `pop`), read by `sphereMotionFrom` into `SphereMotion`, and `SPHERE_START` gains their defaults.
`sphereBowl` (`lib/sphere-motion`) is a nest's bowl as an SVG path; the `Agent` cuts a resting shape with it as before. Jump and Dive end once the agent is still in the nest it reached, with no settle; Bounce keeps its.
