---
"@no-origins/ui": minor
---

The agent's face has parts, and what a component can have is declared once (Motion.md M17 version 13, M20).

- `lib/properties`: typed properties, each a type (number, angle, duration, colour, choice, switch, drawing) with its
  meta and where its rest is designed; `checkValue`, `eases`, `defaultsOf`, `COLOUR_NAMES`.
- `lib/agent-face` declares the agent's face: eyes, pupils, upper and lower lids, brows and symbols, each with its
  styles and settings, plus `FaceLook` and `checkFace`. `lib/agent-body` declares its body and a character's look
  (`CharacterLook`, `checkCharacter`, `resolveCharacter`, `sphereMotionOf`).
- `lib/sphere-motion` draws the parts. Pupils are dot or shine. Upper lids are plain or heavy, each with open, slant
  and curve. Lower lids rise from below. Brows are line, arch or bushy. A mood's symbol appears by the head, and a
  pair's right side can be set apart. One reader sits behind it, `sphereMotionFrom`, fed by `readSphereMotion` or by a
  look. Unset, the body now reads as `SPHERE_START`'s slime where it used to fall back to jelly.
- `components/agent` paints the face's parts and the symbol. Colours are named, and `deep` is new
  (`lib/agent-colours`: `agentColours`, `colourCss`).
- An uploaded style (`upload:<id>`) is drawn from `Agent`'s `drawings` prop. Each one is a `DrawingData`, checked by
  `checkDrawing`, and placed on its slot's anchor, with a pair's right part as the mirror. `faceAnchors` gives the
  anchors for the templates.
- A settled head's face stays on the puddle it's drawn as. At a high spread, the eyes had sunk with the course's
  centre below the bowl's edge and were cut.
- Slime spreads at 1.2 where it spread at 2.6, so all of Spread settles it, and how far a spread sinks is eased into
  its limit rather than cut. `SPHERE_START`'s Spread is 0.11, which keeps version 14's look.
