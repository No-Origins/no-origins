---
"@no-origins/ui": minor
---

The agent's eyes have a colour (Orbit.md C16).

- `lib/agent-face`: the eyes declare `eye-colour`, one of the agent's colours by name, default `ink`.
- `lib/sphere-motion`: `SphereMotion.eyeColour`, read through the face's declaration like the rest of version 13's
  face. `SPHERE_START.eyeColour` is `ink`.
- `lib/agent-colours`: `eyeColours`, the agent's colours as its eyes are drawn in them. `ink` with a pupil or a
  catchlight is `deep`, so a look without a colour draws as it did.
- `components/agent`: a solid eye, a Dot's pupil and a Shine's eye are drawn in the eyes' colour, and `AgentLook`
  takes `eyeColour`.
