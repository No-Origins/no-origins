import {
  COLOUR_NAMES,
  checkValue,
  type ChoiceProperty,
  type PropertyValue,
  type PropertyValues,
  type Setting,
  type SettingSet,
} from "./properties"

/**
 * THE AGENT'S FACE, declared (Motion.md M20): the parts it can wear, their styles, and each part's settings as typed properties (`./properties`). Orbit
 * builds its library from this and the motion studio its controls; the drawing (`sphere-motion`, `components/agent`)
 * reads the values a look and a motion give.
 *
 * - **A slot is a place on the face** — eyes, pupils, upper lids, lower lids, brows, and the symbols a mood pops up
 *   in a slot of their own. Mustache, hair and marks come later (M20).
 * - **A slot wears one style, or none.** Its style is a choice property whose first option is the default, so an
 *   untouched look is the agent's own face: solid eyes, plain upper lids, nothing else. A style of `none` shows no
 *   settings. A style can also be an uploaded drawing, `upload:` and its version's id (M20's "An uploaded style"),
 *   whose settings are `uploadSettings`, the same for every drawing.
 * - **A pair is mirrored until a look sets its right side apart** (`FaceWear.right`), which is what gives one raised
 *   brow. A mirrored value reads the same on both sides: a slant or an angle is measured from the inner end, so 0.8 is
 *   both inner ends down.
 * - **`set` says where a setting's rest is designed**: `look`, in Orbit, as part of the character; or `motion`, by an
 *   action's controls (Motion.md M24), its rest the default here, every agent's alike. A look marked `pose` — how open
 *   the lids are, the brows' angle — is one a motion may move for a while, which is how a mood is made; no motion
 *   touches the rest of the look, and a motion never puts a part on.
 * - **`worn` or `played`**: a look picks a worn slot's style; a played slot (the symbols) shows only while a motion sets
 *   its style.
 *
 * Ids are unique across the face, so a motion's row keys a value by its id alone, and a right side apart by
 * `sideKey(id, "right")`. The defaults are his settings (`SPHERE_START`) where those have the setting.
 */

export type FaceSlotId = "eyes" | "pupils" | "upper-lids" | "lower-lids" | "brows" | "symbols"

/** A face setting: a typed property, where its rest is designed, and the styles it belongs to. */
export type FaceSetting = Setting & {
  /** The styles it belongs to; every style but `none` when left out. */
  only?: readonly string[]
}

export type FaceSlot = {
  id: FaceSlotId
  label: string
  /** `worn`: a look picks its style. `played`: only a motion's row shows one, over its span. */
  use: "worn" | "played"
  /** Two of it, left and right, mirrored until a look sets the right side apart. */
  paired: boolean
  /** Its style, the first option the default. The eyes have none: they are one drawing. */
  style?: ChoiceProperty & { set: SettingSet }
  settings: readonly FaceSetting[]
}

/** A style that is an uploaded drawing: this, then its version's id. */
export const UPLOADED = "upload:"
export const isUploaded = (style: string | undefined): style is `upload:${string}` =>
  typeof style === "string" && style.startsWith(UPLOADED) && style.length > UPLOADED.length

const NONE = { value: "none", label: "None" }

export const AGENT_FACE: readonly FaceSlot[] = [
  {
    id: "eyes",
    label: "Eyes",
    use: "worn",
    paired: true,
    settings: [
      { id: "eye-size", label: "Size", touches: "Each eye across, of the head's", type: "number", unit: "head", min: 0, max: 0.6, step: 0.01, default: 0.24, set: "look", pose: true },
      { id: "eye-spacing", label: "Spacing", touches: "How far apart, of the head across", type: "number", unit: "head", min: 0, max: 1, step: 0.01, default: 0.45, set: "look" },
      { id: "eye-height", label: "Height", touches: "Over the head's middle +, under it −", type: "number", unit: "head", min: -0.8, max: 0.8, step: 0.01, default: 0.3, set: "look" },
      // His, 2026-10-01: "I should also be able to set the color of the eyes". Ink is what they have always been drawn
      // in (`eyeColours`), so a look saved before they had a colour draws as it did.
      { id: "eye-colour", label: "Colour", touches: "What they are drawn in: the eye, the pupil in a light one, or the eye under a catchlight", type: "colour", options: COLOUR_NAMES, default: "ink", set: "look" },
      { id: "look-x", label: "Look X", touches: "Where they look, left − or right +, as far as an eye can go", type: "number", unit: "share", min: -1, max: 1, step: 0.01, default: 0, set: "motion" },
      { id: "look-y", label: "Look Y", touches: "Where they look, down − or up +", type: "number", unit: "share", min: -1, max: 1, step: 0.01, default: 0, set: "motion" },
      { id: "look", label: "Look ahead", touches: "How far they look where it is going", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: 0.8, set: "motion" },
      { id: "look-lead", label: "Look lead", touches: "Turning to the next nest before it leaps", type: "duration", min: 0, max: 1000, step: 10, default: 1000, set: "motion" },
    ],
  },
  {
    id: "pupils",
    label: "Pupils",
    use: "worn",
    paired: true,
    style: {
      id: "pupils",
      label: "Pupils",
      touches: "Solid eyes, a pupil in a light eye, or a catchlight",
      type: "choice",
      options: [NONE, { value: "dot", label: "Dot" }, { value: "shine", label: "Shine" }],
      default: "none",
      set: "look",
    },
    settings: [
      { id: "pupil-size", label: "Size", touches: "The pupil across, of the eye's", type: "number", unit: "eye", min: 0.2, max: 0.9, step: 0.01, default: 0.55, set: "look", pose: true, only: ["dot"] },
      { id: "shine-size", label: "Shine size", touches: "The catchlight across, of the eye's", type: "number", unit: "eye", min: 0.05, max: 0.5, step: 0.01, default: 0.3, set: "look", only: ["shine"] },
      { id: "shine-angle", label: "Shine angle", touches: "Where the light catches the eye, round from straight up", type: "angle", min: -180, max: 180, step: 1, default: -45, set: "look", only: ["shine"] },
    ],
  },
  {
    id: "upper-lids",
    label: "Upper lids",
    use: "worn",
    paired: true,
    style: {
      id: "upper-lids",
      label: "Upper lids",
      touches: "Cutting the eye, or a heavy band of the body with an ink edge",
      type: "choice",
      options: [{ value: "plain", label: "Plain" }, { value: "heavy", label: "Heavy" }],
      default: "plain",
      set: "look",
    },
    settings: [
      { id: "lid-open", label: "Open", touches: "How open at rest, 0 shut; a blink shuts them from here", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: 1, set: "look", pose: true },
      { id: "lid-slant", label: "Slant", touches: "Inner ends down +, angry; outer ends down −, sad", type: "number", unit: "share", min: -1, max: 1, step: 0.01, default: 0, set: "look", pose: true },
      { id: "lid-curve", label: "Curve", touches: "How round the lid's edge is, 0 straight", type: "number", unit: "share", min: -1, max: 1, step: 0.01, default: 0.5, set: "look", pose: true },
      { id: "blink-every", label: "Blink every", touches: "Time between blinks, 0 never", type: "duration", min: 0, max: 10000, step: 100, default: 3600, set: "motion" },
      { id: "blink", label: "Blink", touches: "One blink, shut and open again", type: "duration", min: 40, max: 1000, step: 10, default: 170, set: "motion" },
      { id: "squint", label: "Squint", touches: "How shut a landing squeezes them", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: 0.6, set: "motion" },
    ],
  },
  {
    id: "lower-lids",
    label: "Lower lids",
    use: "worn",
    paired: true,
    style: {
      id: "lower-lids",
      label: "Lower lids",
      touches: "None, or rising from below to cut the eye",
      type: "choice",
      options: [NONE, { value: "plain", label: "Plain" }],
      default: "none",
      set: "look",
    },
    settings: [
      { id: "lower-raise", label: "Raise", touches: "How far up the eye they rise, 0 not at all", type: "number", unit: "share", min: 0, max: 1, step: 0.01, default: 0, set: "look", pose: true },
      { id: "lower-slant", label: "Slant", touches: "Inner ends up +, outer ends up −", type: "number", unit: "share", min: -1, max: 1, step: 0.01, default: 0, set: "look", pose: true },
      { id: "lower-curve", label: "Curve", touches: "Arched up +, the ^ ^ of a content face; down −", type: "number", unit: "share", min: -1, max: 1, step: 0.01, default: 0, set: "look", pose: true },
    ],
  },
  {
    id: "brows",
    label: "Brows",
    use: "worn",
    paired: true,
    style: {
      id: "brows",
      label: "Brows",
      touches: "None, a line, an arch, or bushy",
      type: "choice",
      options: [NONE, { value: "line", label: "Line" }, { value: "arch", label: "Arch" }, { value: "bushy", label: "Bushy" }],
      default: "none",
      set: "look",
    },
    settings: [
      { id: "brow-height", label: "Height", touches: "Over the eye, of the head", type: "number", unit: "head", min: 0, max: 0.6, step: 0.01, default: 0.12, set: "look", pose: true },
      { id: "brow-angle", label: "Angle", touches: "Inner end down +, angry; up −, worried", type: "angle", min: -40, max: 40, step: 1, default: 0, set: "look", pose: true },
      { id: "brow-arch", label: "Arch", touches: "How it arches, 0 straight, − dipped", type: "number", unit: "share", min: -1, max: 1, step: 0.01, default: 0.3, set: "look", pose: true },
      { id: "brow-length", label: "Length", touches: "Across, of the eye's", type: "number", unit: "eye", min: 0.5, max: 2, step: 0.01, default: 1.2, set: "look" },
      { id: "brow-thickness", label: "Thickness", touches: "How thick, of the head", type: "number", unit: "head", min: 0.02, max: 0.2, step: 0.005, default: 0.06, set: "look" },
      { id: "brow-colour", label: "Colour", touches: "What they are drawn in", type: "colour", options: COLOUR_NAMES, default: "deep", set: "look" },
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    use: "played",
    paired: false,
    style: {
      id: "symbol",
      label: "Symbol",
      touches: "What pops up by the head, drawn as manga draws it",
      type: "choice",
      options: [
        NONE,
        { value: "anger", label: "Anger" },
        { value: "sweat", label: "Sweat drop" },
        { value: "zzz", label: "Zzz" },
        { value: "sparkle", label: "Sparkle" },
        { value: "question", label: "Question" },
      ],
      default: "none",
      set: "motion",
    },
    settings: [
      { id: "symbol-size", label: "Size", touches: "Across, of the head", type: "number", unit: "head", min: 0.1, max: 1, step: 0.01, default: 0.35, set: "motion" },
      { id: "symbol-at", label: "At", touches: "Where by the head, round from straight up", type: "angle", min: -180, max: 180, step: 1, default: 45, set: "motion" },
      { id: "symbol-colour", label: "Colour", touches: "What it is drawn in", type: "colour", options: COLOUR_NAMES, default: "paint", set: "motion" },
    ],
  },
]

/**
 * An uploaded style's drawing, cleaned (M20's "An uploaded style", agreed with Orbit's session): its
 * shapes in its slot's own space — the slot's anchor at the origin (`faceAnchors`), x right, y down, `unit` to the head's
 * radius (the template's 100) — each a flattened absolute path, filled and or stroked in one of the agent's colours by
 * name or a `#rrggbb`. A pair's is its left part, as you see it; the right is its mirror. `viewBox` is the library's
 * thumbnail's; `layer` where a shape came from, kept and not read.
 */
export type DrawingShape = {
  d: string
  fill?: string
  stroke?: string
  /** A stroke's width, in the drawing's units. */
  width?: number
  rule?: "nonzero" | "evenodd"
  layer?: string
}
export type DrawingData = { unit: number; shapes: readonly DrawingShape[]; viewBox?: string }

/** What a path's `d` may hold: its commands and numbers, nothing else. */
const PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\-\s]*$/
const COLOUR = (c: unknown): c is string =>
  typeof c === "string" && ((COLOUR_NAMES as readonly string[]).includes(c) || /^#[0-9a-f]{6}$/i.test(c))

/**
 * `raw` as a drawing, or null: every shape's path only commands and numbers, its colours named or `#rrggbb`, its width
 * a number, at most 400 shapes of at most 40,000 characters each. Orbit cleans an upload; this is what the
 * agent checks again before it draws one read back from the database.
 */
export function checkDrawing(raw: unknown): DrawingData | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as { unit?: unknown; shapes?: unknown; viewBox?: unknown }
  if (typeof r.unit !== "number" || !(r.unit > 0) || !Array.isArray(r.shapes) || r.shapes.length > 400) return null
  const shapes: DrawingShape[] = []
  for (const s of r.shapes as unknown[]) {
    if (!s || typeof s !== "object") return null
    const { d, fill, stroke, width, rule, layer } = s as Record<string, unknown>
    if (typeof d !== "string" || d.length > 40_000 || !PATH.test(d)) return null
    shapes.push({
      d,
      ...(COLOUR(fill) ? { fill } : {}),
      ...(COLOUR(stroke) ? { stroke } : {}),
      ...(typeof width === "number" && Number.isFinite(width) && width >= 0 ? { width } : {}),
      ...(rule === "evenodd" || rule === "nonzero" ? { rule } : {}),
      ...(typeof layer === "string" ? { layer: layer.slice(0, 80) } : {}),
    })
  }
  return { unit: r.unit, shapes, ...(typeof r.viewBox === "string" && PATH.test(r.viewBox) ? { viewBox: r.viewBox } : {}) }
}

/** The settings of an uploaded style in `slot`, the same for every drawing: where it sits, its turn, its size. */
export function uploadSettings(slot: FaceSlotId): readonly FaceSetting[] {
  return [
    { id: `${slot}-x`, label: "Across", touches: "From where its template puts it, of the head", type: "number", unit: "head", min: -1, max: 1, step: 0.01, default: 0, set: "look" },
    { id: `${slot}-y`, label: "Up", touches: "From where its template puts it, of the head", type: "number", unit: "head", min: -1, max: 1, step: 0.01, default: 0, set: "look" },
    { id: `${slot}-turn`, label: "Turn", touches: "Turned about its middle", type: "angle", min: -180, max: 180, step: 1, default: 0, set: "look" },
    { id: `${slot}-size`, label: "Size", touches: "Of the size it was drawn", type: "number", unit: "share", min: 0.2, max: 3, step: 0.01, default: 1, set: "look" },
  ]
}

/** The slot `id`. */
export const faceSlot = (id: FaceSlotId): FaceSlot => AGENT_FACE.find((s) => s.id === id)!

/** The settings `style` shows in `slot`: its own, an uploaded drawing's, or none for `none`. */
export function settingsFor(slot: FaceSlot, style: string | undefined): readonly FaceSetting[] {
  if (!slot.style) return slot.settings
  const worn = style ?? slot.style.default
  if (worn === "none") return []
  if (isUploaded(worn)) return uploadSettings(slot.id)
  return slot.settings.filter((s) => !s.only || s.only.includes(worn))
}

/** Every property of the face, each style's choice and every setting, uploads' excepted: the motion studio's list. */
export const faceProperties = (): readonly (FaceSetting | (ChoiceProperty & { set: SettingSet }))[] =>
  AGENT_FACE.flatMap((s) => [...(s.style ? [s.style] : []), ...s.settings])

/** A value's key in a motion's row: its id, or its id and `.right` for the right side of a pair set apart. */
export const sideKey = (id: string, side: "left" | "right" = "left") => (side === "right" ? `${id}.right` : id)

/** What a look holds of one slot: its style, its values, and a pair's right side set apart, if it is. */
export type FaceWear = {
  style?: string
  values: PropertyValues
  /** The right side's own values, over `values`. Left out, the pair is mirrored. */
  right?: PropertyValues
}

/** What a look holds of the face. A slot it leaves out wears its defaults. */
export type FaceLook = Partial<Record<FaceSlotId, FaceWear>>

/** The value of setting `id` in `slot` on `side`, from `look`, else its default. */
export function faceValue(look: FaceLook, slot: FaceSlot, id: string, side: "left" | "right" = "left"): PropertyValue {
  const wear = look[slot.id]
  const setting = [...slot.settings, ...uploadSettings(slot.id)].find((s) => s.id === id)
  if (!setting) return null
  const own = side === "right" ? wear?.right?.[id] : undefined
  return checkValue(setting, own !== undefined ? own : wear?.values[id])
}

/**
 * `raw` as a face look: every slot it names that exists, its style one of the slot's or an uploaded drawing, every value
 * checked against its setting and the unknown ones dropped. For a look read back from the database, saved against an
 * older declaration.
 */
export function checkFace(raw: unknown): FaceLook {
  const look: FaceLook = {}
  if (!raw || typeof raw !== "object") return look
  for (const slot of AGENT_FACE) {
    const wear = (raw as Record<string, unknown>)[slot.id]
    if (!wear || typeof wear !== "object") continue
    const w = wear as { style?: unknown; values?: unknown; right?: unknown }
    const style =
      slot.style && typeof w.style === "string" && (isUploaded(w.style) || slot.style.options.some((o) => o.value === w.style))
        ? w.style
        : undefined
    const known = [...slot.settings, ...uploadSettings(slot.id)]
    const values = (from: unknown): PropertyValues => {
      const out: PropertyValues = {}
      if (!from || typeof from !== "object") return out
      for (const [k, v] of Object.entries(from as Record<string, unknown>)) {
        const setting = known.find((s) => s.id === k)
        if (setting) out[k] = checkValue(setting, v)
      }
      return out
    }
    look[slot.id] = {
      ...(style ? { style } : {}),
      values: values(w.values),
      ...(slot.paired && w.right && typeof w.right === "object" ? { right: values(w.right) } : {}),
    }
  }
  return look
}
