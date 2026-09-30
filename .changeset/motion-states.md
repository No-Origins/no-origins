---
"@no-origins/ui": minor
---

Add `lib/motion-states.ts` (Motion.md M19, 2026-09-30): states, the way a motion is built on the studio's timeline — a
state a named window (start, end, a unit of ms · s · min, the event that plays it) of rows, each a part configured over
a span or another state attached, linked, top to bottom in priority. Pure: `flattenState` lays a state's rows out in its
own time, `stateValuesAt` gives every value at any moment (rows that overlap both play; where two set the same value the
higher wins, and a lower one takes it on from where it stands), `canAttach` keeps loops out. No family is built from states yet.

A state can list the parts it moves (`MotionState.parts`). `flattenState` leaves out the rows of a part the state doesn't
tick, so an unticked part isn't touched by it. The agent's motions are built on this (Motion.md M20).
A placed state can carry the version it was pinned to when the state holding it was published (`AttachRow.version`).
