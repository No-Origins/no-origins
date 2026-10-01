import { AGENT_PAINTS, RENAMED_PAINTS } from "./agent-colours"
import { AGENT_FACE, checkFace, isUploaded, uploadSettings, type FaceLook, type FaceSlotId } from "./agent-face"
import { COLOUR_NAMES, checkValue, type PropertyValues, type Setting } from "./properties"
import { SPHERE_START, sphereMotionFrom, type SphereMotion } from "./sphere-motion"

/**
 * THE AGENT'S BODY, declared (Motion.md M20): the head, its tail, and how it hops, lands and rests, as typed properties
 * (`./properties`), in the groups the motion studio's jigs have had since version 8. The face is `./agent-face`; the two
 * together are what a character is (`CharacterLook`).
 *
 * `set` says where each rest is designed: what it looks like still — its size, paint, shade and material, its tail's
 * length and taper, how far it settles into its nest — is the **look**, in the character studio; everything that shows
 * only as it moves is **motion**. The defaults are version 12's, his settings (`SPHERE_START`). Ids are the tokens'
 * names without `--motion-sphere-`, unique with the face's, so a motion's row keys any of them alone.
 */

export type BodyGroup = { id: string; label: string; settings: readonly Setting[] }

const S = SPHERE_START

export const AGENT_BODY: readonly BodyGroup[] = [
  {
    id: "head",
    label: "Head",
    settings: [
      { id: "size", label: "Size", touches: "The head across, of the cell", type: "number", unit: "cell", min: 0.1, max: 0.9, step: 0.01, default: S.size, set: "look" },
      {
        id: "paint", label: "Paint", touches: "Its colour: the two accents, or one of its own", type: "choice",
        options: AGENT_PAINTS.map(({ value, label }) => ({ value, label })), renamed: RENAMED_PAINTS, default: S.paint, set: "look",
      },
      { id: "shade", label: "Shade", touches: "Its side away from the light, 0 flat", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: S.shade, set: "look" },
      {
        id: "body", label: "Body", touches: "Ball firm, jelly as set, slime soft and oozing", type: "choice",
        options: [{ value: "ball", label: "Ball" }, { value: "jelly", label: "Jelly" }, { value: "slime", label: "Slime" }], default: S.body, set: "look",
      },
      // Character-Studio.md C10 (his, 2026-09-30: "create shapes for basic shapes like cube, pyramid, hemi sphere,
      // cyclinder, hexagonal prism, cone"). Version 1.
      {
        id: "shape", label: "Shape", touches: "What its head is: the sphere, or a solid that moves and rests as it would", type: "choice",
        options: [
          { value: "sphere", label: "Sphere" },
          { value: "cube", label: "Cube" },
          { value: "pyramid", label: "Pyramid" },
          { value: "hemisphere", label: "Hemisphere" },
          { value: "cylinder", label: "Cylinder" },
          { value: "hexagonal-prism", label: "Hexagonal prism" },
          { value: "cone", label: "Cone" },
        ],
        default: S.shape, set: "look",
      },
    ],
  },
  {
    // Character-Studio.md C10, version 2 (his, 2026-09-30: "I will also need control over rotation in 3D axis"): a shape
    // turns whole, the sphere its face. Its rest is the look's; a motion's row may ease it, as any number.
    id: "rotation",
    label: "Rotation",
    settings: [
      { id: "rotate-x", label: "X", touches: "Tipped toward you +, or back −", type: "angle", min: -180, max: 180, step: 1, default: S.rotateX, set: "look" },
      { id: "rotate-y", label: "Y", touches: "Turned on the spot: its front to your right +, or left −", type: "angle", min: -180, max: 180, step: 1, default: S.rotateY, set: "look" },
      { id: "rotate-z", label: "Z", touches: "Rolled about the way you look: clockwise +", type: "angle", min: -180, max: 180, step: 1, default: S.rotateZ, set: "look" },
    ],
  },
  {
    id: "tail",
    label: "Tail",
    settings: [
      { id: "length", label: "Length", touches: "How long the tail is, in heads", type: "number", unit: "head", min: 0, max: 6, step: 0.1, default: S.length, set: "look" },
      { id: "taper", label: "Taper", touches: "Its tip, of the head: 0 a point", type: "number", unit: "share", min: 0, max: 1, step: 0.05, default: S.taper, set: "look" },
      { id: "stiffness", label: "Stiffness", touches: "How hard it pulls back into shape, 0 limp", type: "number", unit: "share", min: 0, max: 1, step: 0.05, default: S.stiffness, set: "motion" },
      { id: "swing", label: "Swing", touches: "How long it swings on after the head stops", type: "number", unit: "share", min: 0, max: 1, step: 0.05, default: S.swing, set: "motion" },
      { id: "stretch", label: "Stretch", touches: "How much longer speed makes it", type: "number", unit: "share", min: 0, max: 2, step: 0.05, default: S.stretch, set: "motion" },
    ],
  },
  {
    id: "jump",
    label: "Jump",
    settings: [
      { id: "columns", label: "Columns", touches: "How far across: right +, left −", type: "number", unit: "cell", min: -8, max: 8, step: 1, default: S.columns, set: "motion" },
      { id: "rows", label: "Rows", touches: "Down +, up −; with columns, a diagonal", type: "number", unit: "cell", min: -6, max: 6, step: 1, default: S.rows, set: "motion" },
      { id: "crouch", label: "Crouch", touches: "Squatting before it leaps, 0 none", type: "duration", min: 0, max: 1000, step: 10, default: S.crouch, set: "motion" },
      { id: "squat", label: "Squat", touches: "How low the crouch squashes it", type: "number", unit: "share", min: 0, max: 0.8, step: 0.01, default: S.squat, set: "motion" },
      { id: "height", label: "Height", touches: "How high over the higher of its nests", type: "number", unit: "cell", min: 0, max: 4, step: 0.05, default: S.height, set: "motion" },
      { id: "hang", label: "Hang", touches: "How long it is in the air", type: "duration", min: 100, max: 2000, step: 10, default: S.hang, set: "motion" },
    ],
  },
  {
    id: "bounce",
    label: "Bounce",
    settings: [
      { id: "bounces", label: "Bounces", touches: "Off the bowl before it slides, 0 it slides at once", type: "number", unit: "count", min: 0, max: 8, step: 1, default: S.bounces, set: "motion" },
      { id: "first", label: "First bounce", touches: "Its height, of the leap's", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: S.first, set: "motion" },
      { id: "bounciness", label: "Bounciness", touches: "Each bounce's height, of the one before", type: "number", unit: "share", min: 0, max: 0.95, step: 0.01, default: S.bounciness, set: "motion" },
      { id: "squash", label: "Squash", touches: "How flat a landing presses it", type: "number", unit: "share", min: 0, max: 0.8, step: 0.01, default: S.squash, set: "motion" },
      { id: "wobble", label: "Wobble", touches: "How long it jiggles after landing", type: "duration", min: 20, max: 1500, step: 10, default: S.wobble, set: "motion" },
      { id: "wobble-speed", label: "Wobble speed", touches: "One jiggle, flat to tall and back", type: "duration", min: 40, max: 1000, step: 10, default: S.wobbleSpeed, set: "motion" },
      { id: "give", label: "Nest give", touches: "How far the nest dips under a landing", type: "number", unit: "share", min: 0, max: 0.5, step: 0.01, default: S.give, set: "motion" },
    ],
  },
  {
    id: "slide",
    label: "Slide",
    settings: [
      { id: "land-at", label: "Land at", touches: "Where it touches the bowl: − its near side, + far", type: "angle", min: -70, max: 70, step: 1, default: S.landAt, set: "motion" },
      { id: "slippery", label: "Slippery", touches: "Its speed along the bowl it keeps: 1 all, 0 sticks", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: S.slippery, set: "motion" },
      {
        id: "slide-way", label: "Way", touches: "The way it was going, or clockwise or anticlockwise", type: "choice",
        options: [{ value: "with", label: "With its jump" }, { value: "clockwise", label: "Clockwise" }, { value: "anticlockwise", label: "Anticlockwise" }],
        default: S.slideWay, set: "motion",
      },
      { id: "energy", label: "Energy", touches: "How lively it slides and comes back, 0 lazy", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: S.energy, set: "motion" },
      { id: "come-back", label: "Come back", touches: "From landing to rest; longer and lively, it rocks", type: "duration", min: 200, max: 6000, step: 50, default: S.comeBack, set: "motion" },
      { id: "sway", label: "Sway", touches: "How far its jelly leans as it lands and slides", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: S.sway, set: "motion" },
      { id: "squeeze", label: "Squeeze", touches: "Squished along its way, into the side and braking", type: "number", unit: "share", min: 0, max: 0.8, step: 0.01, default: S.squeeze, set: "motion" },
    ],
  },
  {
    id: "rest",
    label: "Rest",
    settings: [
      { id: "spread", label: "Spread", touches: "How far it settles into the nest", type: "number", unit: "share", min: 0, max: 0.6, step: 0.01, default: S.spread, set: "look" },
      { id: "breath", label: "Breath", touches: "One breath at rest, 0 none", type: "duration", min: 0, max: 10000, step: 100, default: S.breath, set: "motion" },
      { id: "breath-depth", label: "Breath depth", touches: "How far a breath spreads it more", type: "number", unit: "share", min: 0, max: 0.3, step: 0.01, default: S.breathDepth, set: "motion" },
    ],
  },
  {
    // Character-Studio.md C15 (his, 2026-09-30, a sheet of hand-drawn swatches: "Take inspiration from the image I
    // provide and then update the textures"), and C14's depth. Defaults leave the body as it has always been.
    id: "surface",
    label: "Surface",
    settings: [
      {
        id: "texture", label: "Texture", touches: "What its surface is drawn with, by hand, on the surface itself", type: "choice",
        options: [
          { value: "none", label: "None" },
          { value: "stripes", label: "Stripes" },
          { value: "zebra", label: "Zebra" },
          { value: "meridians", label: "Meridians" },
          { value: "latitudes", label: "Latitudes" },
          { value: "contours", label: "Contours" },
          { value: "spiral", label: "Spiral" },
          { value: "strata", label: "Strata" },
          { value: "waves", label: "Waves" },
          { value: "chevron", label: "Chevron" },
          { value: "hatch", label: "Hatch" },
          { value: "grid", label: "Grid" },
          { value: "bricks", label: "Bricks" },
          { value: "weave", label: "Weave" },
          { value: "scales", label: "Scales" },
          { value: "honeycomb", label: "Honeycomb" },
          { value: "crackle", label: "Crackle" },
          { value: "woodgrain", label: "Woodgrain" },
          { value: "marble", label: "Marble" },
          { value: "dots", label: "Dots" },
          { value: "splatter", label: "Splatter" },
          { value: "smears", label: "Smears" },
        ],
        default: S.texture, set: "look",
      },
      { id: "texture-size", label: "Size", touches: "How big its marks are, of the head across", type: "number", unit: "head", min: 0.04, max: 0.5, step: 0.01, default: S.textureSize, set: "look" },
      { id: "texture-wobble", label: "Wobble", touches: "How hand-drawn its marks are, 0 ruled", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: S.textureWobble, set: "look" },
      { id: "texture-colour", label: "Colour", touches: "What its marks are drawn in, shaded as the body is", type: "colour", options: COLOUR_NAMES, default: S.textureColour, set: "look" },
      // His, 2026-09-30: "add opacity to these lines so that the lines feel like they are part of the body". A mix into
      // the paint, flat — nothing see-through (2026-09-16) — so a mark is a tint of the body, not a colour laid on it.
      { id: "texture-opacity", label: "Opacity", touches: "How far its marks stand out from the body: their colour mixed into the paint this much, flat", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: S.textureOpacity, set: "look" },
      { id: "depth", label: "Depth", touches: "How far its tone steps in flat bands from the light to the far side, 0 its two tones", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: S.depth, set: "look" },
    ],
  },
]

/** Every body setting, in its groups' order. */
export const bodySettings = (): readonly Setting[] => AGENT_BODY.flatMap((g) => g.settings)

/**
 * A CHARACTER: what the agent looks like — its body's values and its face — as a look keeps it, in a character's draft
 * and in each of its versions (M20). **Kept whole** (`resolveCharacter`): a version is frozen, so it holds every value,
 * not only the ones moved off a default; a default that changes in code later must not change a published version
 * (Admin.md §7, the theme snapshot's reason). A value missing from one read back is a setting declared since it was
 * saved, and takes its default.
 */
export type CharacterLook = { body: PropertyValues; face: FaceLook }

/**
 * `look` whole: every body setting's value, and every face slot's style and every one of its settings' values, from the
 * look where it has them and else the declaration's default. A pair set apart keeps its right side. What a draft is
 * saved as and a version frozen as.
 */
export function resolveCharacter(look: CharacterLook): CharacterLook {
  const checked = checkCharacter(look)
  const body = Object.fromEntries(bodySettings().map((s) => [s.id, checked.body[s.id] ?? s.default]))
  const face: FaceLook = {}
  for (const slot of AGENT_FACE) {
    const wear = checked.face[slot.id]
    const settings = [...slot.settings, ...(isUploaded(wear?.style) ? uploadSettings(slot.id) : [])]
    face[slot.id] = {
      ...(slot.style ? { style: wear?.style ?? slot.style.default } : {}),
      values: Object.fromEntries(settings.map((s) => [s.id, wear?.values[s.id] ?? s.default])),
      ...(wear?.right ? { right: wear.right } : {}),
    }
  }
  return { body, face }
}

/** `raw` as a character's look: known body values checked, unknown ones dropped, and the face checked (`checkFace`). */
export function checkCharacter(raw: unknown): CharacterLook {
  const r = raw && typeof raw === "object" ? (raw as { body?: unknown; face?: unknown }) : {}
  const body: PropertyValues = {}
  if (r.body && typeof r.body === "object") {
    for (const [k, v] of Object.entries(r.body as Record<string, unknown>)) {
      const setting = bodySettings().find((s) => s.id === k)
      if (setting) body[k] = checkValue(setting, v)
    }
  }
  return { body, face: checkFace(r.face) }
}

/** Which slot each face id is in, its style's or a setting's. */
const SLOT_OF = new Map<string, FaceSlotId>(
  AGENT_FACE.flatMap((slot) =>
    [...(slot.style ? [slot.style] : []), ...slot.settings, ...uploadSettings(slot.id)].map((p) => [p.id, slot.id] as const),
  ),
)

/**
 * The agent a character's look makes (M20): what `sphereFrame` and the `Agent` draw, for a studio that holds a look
 * rather than writing tokens (the character studio). Read through the one reader the tokens go through
 * (`sphereMotionFrom`), so a look and the same values written as tokens draw the same agent. An uploaded style is not
 * drawn yet: its slot draws its default.
 */
export function sphereMotionOf(look: CharacterLook): SphereMotion {
  const whole = checkCharacter(look)
  const value = (id: string) => {
    if (id in whole.body) return whole.body[id]
    const slot = SLOT_OF.get(id)
    const wear = slot ? whole.face[slot] : undefined
    if (!slot || !wear) return undefined
    return AGENT_FACE.find((s) => s.id === slot)?.style?.id === id ? wear.style : wear.values[id]
  }
  const num = (id: string) => {
    const v = value(id)
    return typeof v === "number" ? v : undefined
  }
  return sphereMotionFrom({
    num,
    ms: num,
    word: (id) => {
      const v = value(id)
      return typeof v === "string" ? v : undefined
    },
    right: (id) => {
      const slot = SLOT_OF.get(id)
      const v = slot ? whole.face[slot]?.right?.[id] : undefined
      return typeof v === "number" ? v : undefined
    },
  })
}
