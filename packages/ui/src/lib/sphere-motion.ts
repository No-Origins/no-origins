import { agentPaintOf } from "./agent-colours"
import { AGENT_FACE, UPLOADED, isUploaded, uploadSettings, type FaceSlotId } from "./agent-face"
import { isAgentShape, shapeFrame, type AgentShape, type ShapeFrame } from "./agent-shape"
import { drawTexture, isAgentTexture, SPHERE_PATCH, type AgentTexture, type TextureGroup } from "./agent-texture"
import { checkValue, COLOUR_NAMES, type ColourName } from "./properties"

/**
 * The sphere (Motion.md M17, his, 2026-09-30): a character, "an energetic and calm, 3D sphere that travels by diving
 * from one cell to another". Pure: the motion studio paints any moment of it from here, and a page that shows it will
 * read the same `--motion-sphere-*` tokens off its element.
 *
 * **Version 6, sitting in its nest** (his, on version 5: *"the head is not properly resting on the circle … it should
 * properly rest on the bottom of the circle. As if it's sitting there and then it's spread a little … because it is
 * where the pressure is applied … And then instead of showing the tail outside of the circle, it should be behind the
 * screen. So it's only visible when it's jumping."*). So it is seen from the side, and down is down the screen:
 *
 * - **A nest is a cell's circle, and its floor is the circle's bottom.** The head sits inside it on the bottom, spread a
 *   little where its weight presses (`spread`), breathing slowly (`breath`).
 * - **The tail is behind the screen while it sits**: it points straight back into the page, and only what is in front
 *   of the page is drawn. When it leaps the tail swings out behind it and trails; as it settles it goes back in.
 * - **A jump**: it crouches, squashing down on the floor and drawing back (`crouch`, `squat`); leaps on an arc up over
 *   the page and down into the next nest (`height`, above the higher of its two nests, and `hang`), the arc a thrown
 *   thing's, under one gravity, so it rises fast and slows, and falls faster and faster; lands on the bottom of the
 *   nest it reaches with a squash (`squash`) and bounces there under the same gravity, each bounce lower than the last
 *   (`bounces`, `first`, `bounciness`); jiggles as it settles (`wobble`, `wobbleSpeed`); and the nest dips under each
 *   landing and the push of leaving, springing back (`give`).
 * - **The tail is rubbery**: a chain of springs following the head, stepped at a fixed rate from the start of the jump
 *   so any moment of it is the same frame however it is reached; pulled to its shape by `stiffness`, swinging on for
 *   as long as `swing` says, longer at speed (`stretch`), drooping under the gravity.
 *
 * **Version 7, a body that settles** (his, on version 6, the spread turned all the way up: *"it became some random shape
 * instead of a slime … I also need control on the type of the body because there's no smoothness to it … it is not
 * even resting inside the circle on the surface it just got extended outside"*). Sitting, it settles into its nest as
 * into a bowl: its outline is a circle cut by the nest's circle, so its underside follows the ring's curve and it never
 * leaves it; it keeps its size as it spreads (the circle grows until what is inside the nest is as much as the head),
 * so more spread is a wider, flatter puddle along the bottom; and its edge is smoothed. What it is made of is `body`:
 * a ball barely settles and keeps its edge crisp, jelly settles and softens, slime settles deep and pools.
 *
 * **Version 8, a landing that carries on** (his, on version 7: *"when it's landing … the bounce is either too stiff or
 * … it just came there and got stuck. Instead of … continuation of the motion … if it's coming from left to right, it
 * might fall into the right circle and then slide over in the clockwise direction which can be the control and also
 * body could … squeeze a little and then come back like a jelly action"*). Landing is a ball in a bowl, simulated at a
 * fixed step from the moment it lands: it bounces off the bowl's curve (`bounces`, `first`, `bounciness`), rides round
 * it the way it was going or the way it is told (`slide`, `slideWay`), rocks back and forth, each rock a share of the
 * one before (`rocking`), and comes to rest at the bottom; its jelly leans against every push and wobbles back
 * (`sway`, on the wobble's spring).
 *
 * **Version 9, falling into it and sliding** (his, on version 8: *"the sphere falls into the other circle and then it
 * sticks to the place that it falls in and then only the body feels like it is trying to slide … the ball … because
 * it's flying and it's softy and it is slippery it will fall and then it will slide and then slowly come back"*).
 * Version 8 cut its speed round the bowl to what `slide` asked the moment it landed, so it braked there. Now it touches
 * down on the bowl where `landAt` says — on the side it comes from — and keeps `slippery` of its speed along the bowl,
 * so its fall turns into a slide down through the bottom and up the far side, and it rocks back slowly, as heavy in the
 * bowl as `weight` says.
 *
 * **Version 10, slippery and soft** (his, on version 9: *"I kept the slippery to maximum one … it slides, but then it
 * hits the wall … and then slowly reaches back to the center … if the slippery is maximum, it should be almost like
 * fluid level slippery … the body should also not be so stiff that it hits the wall and then bounces back … it should
 * just fall, slide and … get squeezed … in the direction … then slide back … I should define energy levels … if the
 * energy is high, it falls, it slips, and it comes back … immediately … smoothly … defined by time"*). Sliding, it never
 * leaves the bowl: far up the side the bowl is a soft wall it squishes into, flattening against it (`squeeze`, which it
 * also does as it brakes), losing its speed there rather than bouncing off; how lively it is in the bowl is `energy`,
 * and how long it takes from landing to rest is `comeBack` — together they say whether it glides back once or rocks.
 *
 * **3D without a gradient** (the no-gradient and no-glass rules, 2026-09-16): one flat colour, lime or violet, with a
 * flat darker band down the side away from a fixed light at the top left.
 *
 * It is designed version by version (his, 2026-09-30), and none of its tokens is in globals.css yet, so the fallbacks
 * here are the version's, and the studio's family (`apps/motion/src/content/sphere.ts`) carries the same. Change one,
 * change both.
 */

export type SphereBody = "ball" | "jelly" | "slime"

/** The face's styles (version 13, Motion.md M20's face version 1), as `./agent-face` declares them. */
export type SpherePupils = "none" | "dot" | "shine"
export type SphereUpperLids = "plain" | "heavy"
export type SphereLowerLids = "none" | "plain"
export type SphereBrows = "none" | "line" | "arch" | "bushy"
export type SphereSymbol = "none" | "anger" | "sweat" | "zzz" | "sparkle" | "question"

/** The face's numbers a pair can set apart on its right side, as you see it (`SphereMotion.right`). */
export const SPHERE_SIDED = [
  "eyeSize", "eyeHeight", "lookX", "lookY", "pupilSize", "shineSize", "shineAngle", "lidOpen", "lidSlant", "lidCurve",
  "lowerRaise", "lowerSlant", "lowerCurve", "browHeight", "browAngle", "browArch", "browLength", "browThickness",
] as const
export type SphereSided = (typeof SPHERE_SIDED)[number]

export type SphereMotion = {
  // ── Head ──
  /** The head's diameter, as a share of the cell. */
  size: number
  /**
   * Its colour: `lime` (the system's primary), `violet` (its secondary), or since 2026-09-30 one of the agent's own
   * (`AGENT_PAINTS`, `./agent-colours`; a paint that went is read as the one it became, `RENAMED_PAINTS`).
   */
  paint: string
  /** How dark its side away from the light is, 0 flat. */
  shade: number
  /** What it is made of: a `ball` barely settles, `jelly` settles and softens, `slime` settles deep and pools. */
  body: SphereBody
  /**
   * What its head is drawn as (Character-Studio.md C10, 2026-09-30): the sphere, or a shape in its room (`./agent-shape`),
   * which moves, settles and breathes as the sphere would. Look only: it changes nothing of how it moves.
   */
  shape: AgentShape
  /**
   * How it is turned, degrees (C10, version 2, his: "control over rotation in 3D axis"): X toward you or away, Y about
   * its upright, Z about the way you look. A shape turns whole; the sphere turns its face. Look only, but a number, so a
   * motion's row may ease it.
   */
  rotateX: number
  rotateY: number
  rotateZ: number
  // ── Tail: the rubbery body ──
  /** How long the tail is, in heads (the head's diameter). */
  length: number
  /** How thick the tail's tip is, as a share of the head; 0 a point. */
  taper: number
  /** How hard the tail pulls back into its shape, 0 limp to 1 stiff. */
  stiffness: number
  /** How long the tail swings on after the head stops, 0 not at all to 1 a long time. */
  swing: number
  /** How much longer speed makes it, 0 never. */
  stretch: number
  // ── Jump ──
  /** How far it jumps, in whole cells: columns right positive, rows down positive. Both at once is a diagonal. */
  columns: number
  rows: number
  /** The crouch before it leaps, ms; 0 it leaps from where it sits. */
  crouch: number
  /** How far the crouch squashes it, as a share of its height. */
  squat: number
  /** How high the leap goes over the higher of its two nests, in cells. */
  height: number
  /** How long it is in the air, ms. */
  hang: number
  // ── Bounce ──
  /** How many times it bounces in the nest it lands in, 0 it stays down. */
  bounces: number
  /** The first bounce's height, as a share of the leap's. */
  first: number
  /** Each bounce's height, as a share of the one before. */
  bounciness: number
  /** How far a landing squashes it, as a share of its height. */
  squash: number
  /** How long it jiggles after a landing, ms (the time the jiggle takes to fall to a third). */
  wobble: number
  /** One jiggle, squashed to stretched and back, ms. */
  wobbleSpeed: number
  /** How far the nest dips under a landing, as a share of its size. */
  give: number
  // ── Slide ──
  /** Where on the bowl it first touches down, degrees from the bottom: − on the side it comes from, + the far side. */
  landAt: number
  /** How much of its speed along the bowl it keeps at each impact: 1 all of it, 0 it sticks. */
  slippery: number
  /** Which way it slides: `with` the way it was going, or `clockwise` or `anticlockwise` as you see it. */
  slideWay: "with" | "clockwise" | "anticlockwise"
  /** How lively it is in the bowl, 0 slow and lazy to 1 quick and snappy: its pace sliding and coming back. */
  energy: number
  /** How long it takes from landing to rest, ms. With much energy and a long time it rocks; else it glides back once. */
  comeBack: number
  /** How far its jelly leans against a push, as a share of its height, and wobbles back on the wobble's spring. */
  sway: number
  /** How far it squeezes along its way, squishing into the bowl's side and as it brakes, as a share of its size. */
  squeeze: number
  // ── Rest ──
  /** How far it spreads sitting on the nest's floor, as a share of its height. */
  spread: number
  /** One breath at rest, ms; 0 none. */
  breath: number
  /** How far a breath spreads it more, as a share of its height. */
  breathDepth: number
  // ── Surface (Character-Studio.md C10, 2026-09-30): look only ──
  /**
   * Its surface (C14, C15): what it is drawn with — hand-drawn marks (`./agent-texture`), `none` plain — a cell of them
   * across, of the head, how hand-drawn they are, and what they are drawn in, by name, shaded as the face they are on;
   * and its depth — how far its tone steps in flat bands from the light to the far side, 0 the two tones it has always had.
   */
  texture: AgentTexture
  textureSize: number
  textureWobble: number
  textureColour: ColourName
  /** How far its marks stand out from the body: their colour mixed this much into the paint, 0 unseen, 1 as named (flat, not see-through). */
  textureOpacity: number
  depth: number
  // ── Eyes (version 11: the sphere is the agent) ──
  /** An eye's diameter, as a share of the head across. Its size never changes, whatever the head does. */
  eyeSize: number
  /** How far apart the eyes' centres are, as a share of the head across. */
  eyeSpacing: number
  /** How high they sit over the head's middle, as a share of its radius; − lower. */
  eyeHeight: number
  /** How far they look where it is going, as a share of the head's radius; 0 they never look. */
  look: number
  /** How long before it leaps its eyes turn to the nest it is going to, ms (never before its crouch starts). */
  lookLead: number
  /** ms from one blink to the next, 0 never; and a blink's ms, shut and open again. */
  blinkEvery: number
  blink: number
  /** How far a landing squeezes them shut, 0 not at all to 1 shut, easing open as its jiggle dies. */
  squint: number
  // ── The face (version 13: Motion.md M20's face version 1, declared in `./agent-face`) ──
  /** Where they look, left −1 … right 1 and down −1 … up 1: a pupil moves in its eye; an eye with none, on the face. */
  lookX: number
  lookY: number
  /** Solid eyes, a pupil in a light eye, or a catchlight on a deep one; each of the eye across; the catchlight's place, degrees round from straight up. */
  pupils: SpherePupils
  /** What the eyes are drawn in, by name (2026-10-01): the eye, the pupil in a light one, or the eye under a catchlight; `ink` as they always were (`eyeColours`). */
  eyeColour: ColourName
  pupilSize: number
  shineSize: number
  shineAngle: number
  /** Cutting the eye, or a heavy band of the body; how open at rest (a blink shuts them from there); their tilt, + the inner ends down; how round their edge. */
  upperLids: SphereUpperLids
  lidOpen: number
  lidSlant: number
  lidCurve: number
  /** None, or rising from below; how far up the eye; their tilt, + the inner ends up; their edge, + arched up. */
  lowerLids: SphereLowerLids
  lowerRaise: number
  lowerSlant: number
  lowerCurve: number
  /** Over the eye, of the head's radius; their tilt, degrees, + the inner end down; their arch; across, of the eye; thick, of the head across. */
  brows: SphereBrows
  browHeight: number
  browAngle: number
  browArch: number
  browLength: number
  browThickness: number
  browColour: ColourName
  /** A symbol by the head, which a mood plays: its size, of the head across; where, degrees round from straight up. */
  symbol: SphereSymbol
  symbolSize: number
  symbolAt: number
  symbolColour: ColourName
  /** A pair's right side, as you see it, set apart: its own values over the ones above. Empty, every pair is mirrored. */
  right: Partial<Record<SphereSided, number>>
  /**
   * The slots wearing an uploaded drawing (M20's "An uploaded style"): its version's id, and where it sits — across and
   * up from its anchor in head radii, turned in degrees, and its size of as drawn. Such a slot draws no style of its own.
   */
  uploads: Partial<Record<FaceSlotId, SphereUploadWear>>
}

export type SphereUploadWear = { id: string; x: number; y: number; turn: number; size: number }

/**
 * Version 12's values (2026-09-30): **his**, the settings he fixed upon for the agent from version 11 (*"the settings that
 * I have currently fixed upon for the agent, so let's use that and we'll continue our state machines from there"*) —
 * a violet slime head three fifths of a cell across, deeply shaded, with a short limp tail and no squash, spread or sway;
 * jumping one column and six rows on a 60ms crouch, 550ms in the air; touching down 30° up its near side, keeping all of
 * its speed along the bowl, squeezing 40%; breathing every 4s; its eyes a quarter of the head across and 0.3 up, looking
 * 0.8 of its radius where it goes, squinting 60%. **Version 13, tuned** (his, the same night, sent back from version 13:
 * *"This becomes the rest state of the motion"*) is the same but for Come back, 1000ms where it was 1200: it is these
 * values, and the face's parts left off. **Version 14** (his, sent back as *"Agent — Version 13, tuned, tuned"*) comes back
 * to rest in half a second and settles a little into its nest (Spread 0.05). **Version 15** is version 14 as it looks,
 * with slime spreading at 1.2 where it spread at 2.6 (his "Yes", 2026-09-30, to the whole of Spread doing something on
 * slime: at 2.6 the puddle filled the bowl by 0.3 and the rest of the slider moved nothing): Spread 0.11 is version
 * 14's 0.05. It is these values.
 */
export const SPHERE_START = {
  size: 0.6,
  paint: "violet",
  shade: 0.75,
  body: "slime",
  length: 0.8,
  taper: 0,
  stiffness: 0,
  swing: 0,
  stretch: 0,
  columns: 1,
  rows: 6,
  crouch: 60,
  squat: 0.25,
  height: 0.95,
  hang: 550,
  bounces: 0,
  first: 0,
  bounciness: 0,
  squash: 0,
  wobble: 20,
  wobbleSpeed: 40,
  give: 0,
  landAt: -30,
  slippery: 1,
  slideWay: "with",
  energy: 0.53,
  comeBack: 500,
  sway: 0,
  squeeze: 0.4,
  spread: 0.11,
  breath: 4000,
  breathDepth: 0.1,
  // Its shape and surface (2026-09-30): the sphere, plain, as every version before drew it.
  shape: "sphere",
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  texture: "none",
  textureSize: 0.16,
  textureWobble: 0.6,
  textureColour: "light",
  textureOpacity: 0.45,
  depth: 0,
  eyeSize: 0.24,
  eyeSpacing: 0.45,
  eyeHeight: 0.3,
  look: 0.8,
  lookLead: 1000,
  blinkEvery: 3600,
  blink: 170,
  squint: 0.6,
  // Version 13's face: every part as version 12 draws it — solid eyes, plain upper lids open wide, nothing else.
  lookX: 0,
  lookY: 0,
  pupils: "none",
  eyeColour: "ink",
  pupilSize: 0.55,
  shineSize: 0.3,
  shineAngle: -45,
  upperLids: "plain",
  lidOpen: 1,
  lidSlant: 0,
  lidCurve: 0.5,
  lowerLids: "none",
  lowerRaise: 0,
  lowerSlant: 0,
  lowerCurve: 0,
  brows: "none",
  browHeight: 0.12,
  browAngle: 0,
  browArch: 0.3,
  browLength: 1.2,
  browThickness: 0.06,
  browColour: "deep",
  symbol: "none",
  symbolSize: 0.35,
  symbolAt: 45,
  symbolColour: "paint",
  right: {},
  uploads: {},
} as const

const finite = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback)
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, finite(n, lo)))
const clamp01 = (n: number) => clamp(n, 0, 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => {
  const p = clamp01(t)
  return p * p * (3 - 2 * p)
}

const bodyOf = (v: string): SphereBody => (v === "ball" || v === "slime" ? v : "jelly")
const wayOf = (v: string): SphereMotion["slideWay"] => (v === "clockwise" || v === "anticlockwise" ? v : "with")

/** How far each body sinks into its nest for a squash, and how many times its outline is smoothed sitting. */
const SINK: Record<SphereBody, number> = { ball: 0.5, jelly: 1, slime: 1.4 }
const SOFT: Record<SphereBody, number> = { ball: 0, jelly: 3, slime: 7 }

/**
 * What each body is made of, against jelly, which moves by the numbers as they are set (his, on version 9: "I don't see
 * any difference between jelly ball and slime"). A **ball** is firm: it sits nearly round, squashes and stretches
 * little, jiggles quick and small, bounces higher and slides further. **Slime** is soft: it pools, squashes and
 * stretches far, leans more, sticks to the bowl, hardly bounces, and oozes back from a squash where jelly wobbles
 * (`jiggle`, the sway's damping in `landing`). Each is a share of the value set on the jig.
 */
const MATERIAL: Record<SphereBody, { squash: number; spread: number; wobble: number; wobbleSpeed: number; stretch: number; sway: number; slippery: number; bounce: number }> = {
  ball: { squash: 0.35, spread: 0.3, wobble: 0.5, wobbleSpeed: 0.6, stretch: 0.3, sway: 0.3, slippery: 1.3, bounce: 1.3 },
  jelly: { squash: 1, spread: 1, wobble: 1, wobbleSpeed: 1, stretch: 1, sway: 1, slippery: 1, bounce: 1 },
  slime: { squash: 1.5, spread: 1.2, wobble: 2.2, wobbleSpeed: 2, stretch: 2, sway: 1.6, slippery: 0.6, bounce: 0.35 },
}

/**
 * `v` up to `cap`, eased where it was cut: itself up to `from`, then nearing `cap` as it grows and never reaching it, so
 * every further inch still moves it (2026-09-30, with version 15: a deep spread on slime sank no further past 0.95).
 * Below `from` nothing changes, so no version set there moves.
 */
const knee = (v: number, from: number, cap: number) =>
  v <= from ? Math.max(0, v) : from + (cap - from) * Math.tanh((v - from) / (cap - from))

/** The motion as its body makes it: the jig's values, scaled by what it is made of. */
function made(m: SphereMotion): SphereMotion {
  const k = MATERIAL[m.body]
  return {
    ...m,
    squash: clamp(m.squash * k.squash, 0, 0.9),
    squat: clamp(m.squat * k.squash, 0, 0.9),
    spread: clamp(m.spread * k.spread, 0, 0.9),
    wobble: m.wobble * k.wobble,
    wobbleSpeed: m.wobbleSpeed * k.wobbleSpeed,
    stretch: m.stretch * k.stretch,
    sway: clamp(m.sway * k.sway, 0, 1.5),
    squeeze: clamp(m.squeeze * k.squash, 0, 0.8),
    slippery: clamp01(m.slippery * k.slippery),
    first: clamp01(m.first * k.bounce),
    bounciness: clamp(m.bounciness * k.bounce, 0, 0.95),
  }
}

/**
 * Where a motion's values come from, by id (a token's name without `--motion-sphere-`): a number, a duration in ms, a
 * word, and a pair's right side set apart; each undefined where it is unset, so the version's value stands.
 */
export type SphereSource = {
  num: (id: string) => number | undefined
  ms: (id: string) => number | undefined
  word: (id: string) => string | undefined
  right: (id: string) => number | undefined
}

/** The sphere's tokens off `el`, read when a jump starts or a token changes, never cached. */
export function readSphereMotion(el: Element): SphereMotion {
  const css = getComputedStyle(el)
  const raw = (id: string) => css.getPropertyValue(`--motion-sphere-${id}`).trim()
  const number = (r: string) => {
    const n = r === "" ? NaN : Number(r)
    return Number.isFinite(n) ? n : undefined
  }
  return sphereMotionFrom({
    num: (id) => number(raw(id)),
    ms: (id) => {
      const match = /^(-?[\d.]+)(ms|s)$/.exec(raw(id))
      const n = match ? Number(match[1]) * (match[2] === "s" ? 1000 : 1) : NaN
      return Number.isFinite(n) && n >= 0 ? n : undefined
    },
    word: (id) => raw(id) || undefined,
    right: (id) => number(raw(`${id}-right`)),
  })
}

/**
 * The sphere a source's values make, each checked as the tokens always were and scaled by what its body is made of: the
 * one reader behind `readSphereMotion` (tokens off an element) and `sphereMotionOf` (a character's look, `./agent-body`).
 */
export function sphereMotionFrom(src: SphereSource): SphereMotion {
  const S = SPHERE_START
  const n = (id: string, fallback: number) => src.num(id) ?? fallback
  const ms = (id: string, fallback: number) => src.ms(id) ?? fallback
  const paint = src.word("paint") ?? S.paint
  return made({
    size: clamp(n("size", S.size), 0.1, 0.9),
    paint: agentPaintOf(paint) ?? "lime",
    shade: clamp01(n("shade", S.shade)),
    body: bodyOf(src.word("body") ?? S.body),
    shape: ((w) => (isAgentShape(w) ? w : S.shape))(src.word("shape")),
    rotateX: clamp(n("rotate-x", S.rotateX), -180, 180),
    rotateY: clamp(n("rotate-y", S.rotateY), -180, 180),
    rotateZ: clamp(n("rotate-z", S.rotateZ), -180, 180),
    length: clamp(n("length", S.length), 0, 8),
    taper: clamp01(n("taper", S.taper)),
    stiffness: clamp01(n("stiffness", S.stiffness)),
    swing: clamp01(n("swing", S.swing)),
    stretch: clamp(n("stretch", S.stretch), 0, 2),
    columns: Math.round(finite(n("columns", S.columns))),
    rows: Math.round(finite(n("rows", S.rows))),
    crouch: ms("crouch", S.crouch),
    squat: clamp(n("squat", S.squat), 0, 0.8),
    height: Math.max(0, n("height", S.height)),
    hang: Math.max(1, ms("hang", S.hang)),
    bounces: Math.round(clamp(n("bounces", S.bounces), 0, 8)),
    first: clamp01(n("first", S.first)),
    bounciness: clamp(n("bounciness", S.bounciness), 0, 0.95),
    squash: clamp(n("squash", S.squash), 0, 0.8),
    wobble: Math.max(1, ms("wobble", S.wobble)),
    wobbleSpeed: Math.max(20, ms("wobble-speed", S.wobbleSpeed)),
    give: clamp(n("give", S.give), 0, 0.5),
    landAt: clamp(n("land-at", S.landAt), -70, 70),
    slippery: clamp01(n("slippery", S.slippery)),
    slideWay: wayOf(src.word("slide-way") ?? S.slideWay),
    energy: clamp01(n("energy", S.energy)),
    comeBack: Math.max(200, ms("come-back", S.comeBack)),
    sway: clamp(n("sway", S.sway), 0, 1),
    squeeze: clamp(n("squeeze", S.squeeze), 0, 0.8),
    spread: clamp(n("spread", S.spread), 0, 0.6),
    breath: ms("breath", S.breath),
    breathDepth: clamp(n("breath-depth", S.breathDepth), 0, 0.3),
    texture: ((w) => (isAgentTexture(w) ? w : S.texture))(src.word("texture")),
    textureSize: clamp(n("texture-size", S.textureSize), 0.04, 0.5),
    textureWobble: clamp01(n("texture-wobble", S.textureWobble)),
    textureColour: ((w) => ((COLOUR_NAMES as readonly string[]).includes(w ?? "") ? (w as ColourName) : S.textureColour))(src.word("texture-colour")),
    textureOpacity: clamp01(n("texture-opacity", S.textureOpacity)),
    depth: clamp01(n("depth", S.depth)),
    eyeSize: clamp(n("eye-size", S.eyeSize), 0, 0.6),
    eyeSpacing: clamp(n("eye-spacing", S.eyeSpacing), 0, 1),
    eyeHeight: clamp(n("eye-height", S.eyeHeight), -0.8, 0.8),
    look: clamp(n("look", S.look), 0, 1),
    lookLead: Math.max(0, ms("look-lead", S.lookLead)),
    blinkEvery: Math.max(0, ms("blink-every", S.blinkEvery)),
    blink: Math.max(1, ms("blink", S.blink)),
    squint: clamp01(n("squint", S.squint)),
    ...faceFrom(src),
  })
}

/** The fields the face's version 13 added, read by their declaration; version 11's eyes are read above. */
type Face13 = Pick<
  SphereMotion,
  | "lookX" | "lookY" | "pupils" | "eyeColour" | "pupilSize" | "shineSize" | "shineAngle" | "upperLids" | "lidOpen" | "lidSlant"
  | "lidCurve" | "lowerLids" | "lowerRaise" | "lowerSlant" | "lowerCurve" | "brows" | "browHeight" | "browAngle"
  | "browArch" | "browLength" | "browThickness" | "browColour" | "symbol" | "symbolSize" | "symbolAt" | "symbolColour"
  | "right"
  | "uploads"
>
const FACE_13 = new Set([
  "lookX", "lookY", "pupils", "eyeColour", "pupilSize", "shineSize", "shineAngle", "upperLids", "lidOpen", "lidSlant", "lidCurve",
  "lowerLids", "lowerRaise", "lowerSlant", "lowerCurve", "brows", "browHeight", "browAngle", "browArch", "browLength",
  "browThickness", "browColour", "symbol", "symbolSize", "symbolAt", "symbolColour",
])
/** What only its look is — its shape and its surface (C10): the landing's simulation never reads them, so its cache drops them. */
const LOOK_ONLY = new Set(["shape", "rotateX", "rotateY", "rotateZ", "texture", "textureSize", "textureWobble", "textureColour", "textureOpacity", "depth"])
const camel = (id: string) => id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())

/**
 * The face from `src`: each of version 13's settings checked by its declaration (`./agent-face`), and every pair's right
 * side where one is set apart. Version 11's eyes are read with the rest, as they were.
 */
function faceFrom(src: SphereSource): Face13 {
  const out: Record<string, unknown> = {}
  const right: Partial<Record<SphereSided, number>> = {}
  const uploads: Partial<Record<FaceSlotId, SphereUploadWear>> = {}
  for (const slot of AGENT_FACE) {
    // An uploaded drawing in the slot: its id and where it sits; the slot's own style stays its default, drawing nothing.
    const worn = slot.style ? src.word(slot.style.id) : undefined
    if (isUploaded(worn)) {
      const [x, y, turn, size] = uploadSettings(slot.id).map((p) => checkValue(p, src.num(p.id)) as number)
      uploads[slot.id] = { id: worn.slice(UPLOADED.length), x: x!, y: y!, turn: turn!, size: size! }
    }
    for (const p of [...(slot.style ? [slot.style] : []), ...slot.settings]) {
      const key = camel(p.id)
      if (FACE_13.has(key)) out[key] = checkValue(p, p.type === "choice" || p.type === "colour" ? src.word(p.id) : src.num(p.id))
      if (!slot.paired || !(SPHERE_SIDED as readonly string[]).includes(key)) continue
      const own = src.right(p.id)
      if (own === undefined) continue
      const v = checkValue(p, own)
      if (typeof v === "number") right[key as SphereSided] = v
    }
  }
  // Every field of FACE_13 is set above, each checked by its declaration, so the record is the face's fields.
  return { ...out, right, uploads } as unknown as Face13
}

// ── where it goes ───────────────────────────────────────────────────────────────────────────────────────────────

/** A cell of the field, from the top-left of the box the sphere is drawn in: a nest. */
export type SphereCell = { col: number; row: number }
export type SphereGeometry = { cell: number; gap: number }
export type SphereTrip = { from: SphereCell; to: SphereCell }

/**
 * The jump its Columns and Rows say, on a box `cols` × `rows` cells: from the nest that centres it on the box to the
 * nest that many columns and rows away. A jump longer than the box is held to it.
 */
export function sphereJump(m: SphereMotion, cols: number, rows: number): SphereTrip {
  const axis = (d: number, n: number) => {
    const span = Math.round(clamp(d, -(n - 1), n - 1))
    const first = Math.floor((n - 1 - Math.abs(span)) / 2)
    const from = span >= 0 ? first : first - span
    return [from, from + span] as const
  }
  const [c0, c1] = axis(m.columns, Math.max(1, cols))
  const [r0, r1] = axis(m.rows, Math.max(1, rows))
  return { from: { col: c0, row: r0 }, to: { col: c1, row: r1 } }
}

/** A point, px: x right and y down the screen, z out of it toward you. The page is z 0; what is behind it is hidden. */
export type V3 = { x: number; y: number; z: number }

const centre = (c: SphereCell, g: SphereGeometry) => ({
  x: c.col * (g.cell + g.gap) + g.cell / 2,
  y: c.row * (g.cell + g.gap) + g.cell / 2,
})
const radius = (m: SphereMotion, g: SphereGeometry) => (m.size * g.cell) / 2
/** The radius of a nest's circle to the inside of its line. */
const ring = (g: SphereGeometry) => g.cell / 2 - 1

/**
 * How far the head's centre stands over the nest's floor, squashed `s`: squashed (+), it sinks toward the floor as far as
 * its body sinks, and settles round it; stretched tall (−), a pill standing up, taller.
 */
const halfHeight = (m: SphereMotion, R: number, s: number) =>
  s >= 0 ? R * (1 - knee(s * SINK[m.body], 0.5, 0.95)) : R * (1 + 0.6 * -s)

/** The leap: where it starts and lands, its gravity, px/ms², and when it is highest. */
function leapOf(m: SphereMotion, g: SphereGeometry, trip: SphereTrip) {
  const pitch = g.cell + g.gap
  const R = radius(m, g)
  const a = centre(trip.from, g)
  const b = centre(trip.to, g)
  const dir = Math.sign(b.x - a.x) || 1
  const back = R * m.squat * 0.6
  const start = { x: a.x - dir * back, y: a.y + ring(g) - halfHeight(m, R, m.squat) }
  // It comes down on the bowl where `landAt` says, its centre on the circle its bottom runs on: − on the side it comes
  // from, + the far side.
  const land = (m.landAt * Math.PI * dir) / 180
  const track = Math.max(1, ring(g) - R)
  const end = { x: b.x + track * Math.sin(land), y: b.y + track * Math.cos(land) }
  const apex = Math.min(start.y, end.y) - Math.max(m.height * pitch, pitch * 0.25)
  const up = Math.sqrt(start.y - apex)
  const down = Math.sqrt(end.y - apex)
  // Under one gravity the rise and the fall take as long as the square roots of their heights.
  const peak = up / (up + down)
  const G = (2 * (up + down) ** 2) / (m.hang * m.hang)
  return { start, end, apex, peak, G, fall: end.y - apex, land }
}

/**
 * The landing, from the moment it touches down on the bowl of the nest it reaches: a ball in a bowl, simulated at a
 * fixed step so it is the same however a moment of it is reached, sampled every `SAMPLE` ms. Its centre runs on a
 * circle the nest's less its radius, under the leap's gravity quickened or slowed by `energy`. It arrives where
 * `landAt` says with the leap's speed, and at every impact keeps `slippery` of its speed along the bowl (going the way
 * `slideWay` says) and bounces off the curve as long as it has bounces left, the first as high as `first` of the leap
 * and each after `bounciness` of the one before. Then it slides and never leaves the bowl: past `WALL` up its side the
 * bowl is a soft wall, which it squishes into, losing its speed there, and comes back from; and it is damped to be still
 * `comeBack` after it lands. Its jelly leans on a spring against every push, and it squeezes along its way into the
 * wall and as it brakes.
 */
type Landing = {
  /** ms from landing until it is still. */
  duration: number
  /** Per sample: where its centre is from the nest's centre, its sway, its squeeze, and how far it is on the bowl. */
  x: number[]
  y: number[]
  sway: number[]
  squeeze: number[]
  on: number[]
  /** Its impacts, ms from landing, and how hard, 1 the landing. */
  hits: { at: number; n: number }[]
}
const STEP_MS = 0.5
const SAMPLE = 2
const MAX_LAND = 8000
/** How far up the bowl's side it slides freely, radians; past it, the bowl is a soft wall. */
const WALL = (65 * Math.PI) / 180
const landings = new Map<string, Landing>()

function landing(m: SphereMotion, g: SphereGeometry, trip: SphereTrip): Landing {
  // Keyed on what moves it: the face does not, so tuning a brow never lands it again.
  const key = JSON.stringify([m, g, trip], (k, v) => (k === "right" || k === "uploads" || FACE_13.has(k) || LOOK_ONLY.has(k) ? undefined : v))
  const known = landings.get(key)
  if (known) return known
  const pitch = g.cell + g.gap
  const R = radius(m, g)
  const L = Math.max(1, ring(g) - R)
  const leap = leapOf(m, g, trip)
  // Energy: the bowl's pull, a quarter to four times the leap's gravity about the middle.
  const G = leap.G * 4 ** (2 * (m.energy - 0.5))
  const vx = (leap.end.x - leap.start.x) / m.hang
  const vy = Math.sqrt(2 * leap.G * leap.fall)
  const vIn = Math.max(1e-6, Math.hypot(vx, vy))
  // Coming back: damped so what is left of its swing is a fiftieth by `comeBack`.
  const beta = (2 * Math.log(50)) / m.comeBack
  const w0 = Math.sqrt(G / L)
  // The jelly's sway: a spring as quick as its wobble, leaning `sway` against a push as hard as gravity.
  const k = ((2 * Math.PI) / m.wobbleSpeed) ** 2
  // Slime's lean oozes back, past critical damping; jelly's and a ball's spring back and wobble.
  const c = Math.max(2 / m.wobble, m.body === "slime" ? 2.4 * Math.sqrt(k) : 0)
  const gain = (m.sway * k) / G
  const firstHigh = m.first * Math.max(m.height * pitch, pitch * 0.25)

  let theta = leap.land
  let px = L * Math.sin(theta)
  let py = L * Math.cos(theta)
  let vxs = 0
  let vys = 0
  let air = false
  let omega = 0
  let bounced = 0
  let sw = 0
  let swv = 0
  let on = 1
  const hits: { at: number; n: number }[] = [{ at: 0, n: 1 }]
  // An impact with the bowl at `theta`, going into it at `vn` and along it at `along`: it keeps `slippery` of its speed
  // along the bowl, going the way it is told; it bounces if it has a bounce left, else it slides. The jelly takes the
  // change in its speed along the bowl as a push.
  const impact = (vn: number, along: number) => {
    let vt = along * m.slippery
    if (m.slideWay !== "with") vt = Math.abs(vt) * (m.slideWay === "clockwise" ? -1 : 1)
    const e = bounced < m.bounces ? (bounced === 0 ? Math.min(1, Math.sqrt(2 * G * firstHigh) / Math.max(vn, 1e-6)) : Math.sqrt(m.bounciness)) : 0
    swv -= gain * (vt - along)
    const nx = Math.sin(theta)
    const ny = Math.cos(theta)
    const tx = Math.cos(theta)
    const ty = -Math.sin(theta)
    if (e * vn > 0.02) {
      bounced++
      vxs = tx * vt - nx * vn * e
      vys = ty * vt - ny * vn * e
      air = true
    } else {
      air = false
      omega = vt / L
    }
  }
  // Touching down: into the bowl and along it with the leap's speed.
  impact(vx * Math.sin(theta) + vy * Math.cos(theta), vx * Math.cos(theta) - vy * Math.sin(theta))

  const xs: number[] = []
  const ys: number[] = []
  const sws: number[] = []
  const sqs: number[] = []
  const ons: number[] = []
  let squish = 0
  let t = 0
  for (let next = 0; t <= MAX_LAND; t += STEP_MS) {
    if (t >= next) {
      xs.push(px)
      ys.push(py)
      sws.push(sw)
      sqs.push(squish)
      ons.push(on)
      next += SAMPLE
    }
    let push = 0
    if (air) {
      vys += G * STEP_MS
      px += vxs * STEP_MS
      py += vys * STEP_MS
      const d = Math.hypot(px, py)
      if (d >= L) {
        px = (px / d) * L
        py = (py / d) * L
        theta = Math.atan2(px, py)
        const vn = vxs * Math.sin(theta) + vys * Math.cos(theta)
        const along = vxs * Math.cos(theta) - vys * Math.sin(theta)
        if (vn > 0) {
          hits.push({ at: t, n: vn / vIn })
          impact(vn, along)
        }
      }
    } else {
      let alpha = -(G / L) * Math.sin(theta) - beta * omega
      // Past the wall's foot it squishes into the soft wall: pressed back, harder the further in, and losing speed there.
      const into = Math.abs(theta) - WALL
      if (into > 0) alpha += -Math.sign(theta) * 40 * w0 * w0 * into - 10 * w0 * omega
      omega += alpha * STEP_MS
      theta += omega * STEP_MS
      if (theta > Math.PI) theta -= 2 * Math.PI
      else if (theta < -Math.PI) theta += 2 * Math.PI
      px = L * Math.sin(theta)
      py = L * Math.cos(theta)
      push = alpha * L
    }
    const swa = -k * sw - c * swv - gain * push
    swv += swa * STEP_MS
    sw += swv * STEP_MS
    // Its squeeze: squished into the wall as far as it has gone into it, and braking as far as it leans.
    squish = m.squeeze * Math.max(clamp01((Math.abs(theta) - WALL) / 0.35), 0.6 * clamp01(Math.abs(sw) / 0.66))
    on += ((air ? 0 : 1) - on) * Math.min(1, STEP_MS / 40)
    // Still: on the bowl at the bottom, hardly moving, its sway spent.
    if (!air && Math.abs(theta) < 0.004 && Math.abs(omega * L) < 0.004 && Math.abs(sw) < 0.004 && Math.abs(swv) < 2e-4) break
  }
  // The jelly leans at most two thirds of its height, however hard it is pushed, softly.
  const out = { duration: Math.round(t), x: xs, y: ys, sway: sws.map((v) => 0.66 * Math.tanh(v / 0.66)), squeeze: sqs, on: ons, hits }
  if (landings.size > 16) landings.delete(landings.keys().next().value!)
  landings.set(key, out)
  return out
}

/** The landing at `tau` ms after it, between two samples. */
function landedAt(l: Landing, tau: number) {
  const f = clamp(tau / SAMPLE, 0, l.x.length - 1)
  const i = Math.floor(f)
  const j = Math.min(l.x.length - 1, i + 1)
  const u = f - i
  return {
    x: lerp(l.x[i]!, l.x[j]!, u),
    y: lerp(l.y[i]!, l.y[j]!, u),
    sway: lerp(l.sway[i]!, l.sway[j]!, u),
    squeeze: lerp(l.squeeze[i]!, l.squeeze[j]!, u),
    on: lerp(l.on[i]!, l.on[j]!, u),
  }
}

/** How long the tail swings on, its springs' time, ms. */
const tailTau = (m: SphereMotion) => 20 + m.swing * 600
/** How long it takes to come to rest after its last bounce: the jiggle and the tail's swing dying out. */
const settleMs = (m: SphereMotion) => Math.round(Math.max(3 * m.wobble, 2.5 * tailTau(m)))

/** A part of a jump, named as the studio's timeline shows it. A part it goes without lasts 0. */
export type SpherePhase = { label: string; ms: number }

/** A jump's parts in order: crouch · leap · land (sliding, and coming back) · settle. With no crouch, it lasts 0. */
export function spherePhases(m: SphereMotion, g: SphereGeometry, trip: SphereTrip): SpherePhase[] {
  return [
    { label: "crouch", ms: m.crouch },
    { label: "leap", ms: m.hang },
    { label: "land", ms: landing(m, g, trip).duration },
    { label: "settle", ms: settleMs(m) },
  ]
}

/** How long a jump lasts, ms. */
export const sphereTripMs = (m: SphereMotion, g: SphereGeometry, trip: SphereTrip) =>
  spherePhases(m, g, trip).reduce((sum, p) => sum + p.ms, 0)

// ── a course: the head through time ─────────────────────────────────────────────────────────────────────────────

/**
 * The head's way through a jump, `t` = 0 at its start, defined for every t: before it, sitting in the nest it leaves;
 * after it, sitting in the nest it reaches. A still course is one that never jumps.
 */
export type SphereCourse = {
  m: SphereMotion
  g: SphereGeometry
  trip: SphereTrip
  /** How long the jump lasts, ms; 0 for a still course. */
  total: number
  /** Where the head's centre is, on the page. */
  head: (t: number) => { x: number; y: number }
  /** How squashed the head is: + flattened, − stretched tall, as a share of its height. */
  squash: (t: number) => number
  /** How lit each nest is (the one it leaves, the one it reaches), 0..1. */
  lit: (t: number) => [number, number]
  /** How far each nest has dipped, px: + down, − springing back up. */
  dip: (t: number) => [number, number]
  /** The leap's gravity, px/ms²: the bounces fall under it, and the tail droops under it. */
  gravity: number
  /**
   * How far its jelly leans and squeezes along its way, as shares of its size, and which way is out of the bowl where it
   * sits (a unit vector).
   */
  lean: (t: number) => { sway: number; squeeze: number; nx: number; ny: number }
  /** How hard its landings still hit it, 0 none to 1 the moment the leap lands, dying as its jiggle does: the squint. */
  impact: (t: number) => number
}

/** An impulse: a landing, or the push of leaving; `n` how hard, 1 the leap's landing. */
type Hit = { at: number; n: number; nest: 0 | 1 }

/**
 * A jiggle after impulses: squashed, then stretched, dying away — or, for slime, squashed and oozing back, never
 * springing past. A nest always springs.
 */
function jiggle(m: SphereMotion, hits: Hit[], t: number, nest?: 0 | 1) {
  let s = 0
  const ooze = m.body === "slime" && nest === undefined
  for (const h of hits) {
    if (t < h.at || (nest !== undefined && h.nest !== nest)) continue
    const d = t - h.at
    s += h.n * Math.exp(-d / m.wobble) * (ooze ? 1 : Math.cos((2 * Math.PI * d) / m.wobbleSpeed))
  }
  return s
}

/** Sitting: spread, and a breath spreading it a little more and back. */
const sat = (m: SphereMotion, rested: number) =>
  m.spread + (m.breath > 0 ? m.breathDepth * (0.5 - 0.5 * Math.cos((2 * Math.PI * Math.max(0, rested)) / m.breath)) : 0)

/** A course that never jumps: sitting in `cell`, `rested` ms after it arrived. */
export function sphereStill(m: SphereMotion, g: SphereGeometry, cell: SphereCell, rested = 0): SphereCourse {
  const c = centre(cell, g)
  const R = radius(m, g)
  const squash = (t: number) => sat(m, rested + t)
  return {
    m,
    g,
    trip: { from: cell, to: cell },
    total: 0,
    head: (t) => ({ x: c.x, y: c.y + ring(g) - halfHeight(m, R, squash(t)) }),
    squash,
    lit: () => [1, 0],
    dip: () => [0, 0],
    gravity: leapOf(m, g, { from: cell, to: cell }).G,
    lean: () => ({ sway: 0, squeeze: 0, nx: 0, ny: 1 }),
    impact: () => 0,
  }
}

/**
 * The jump `trip` as a course, `rested` ms after it arrived where it sits: it crouches on its nest's floor, drawing
 * back; leaps from the crouch on the arc; lands on the bottom of the nest it reaches and carries on round its bowl —
 * bouncing, sliding, rocking (the landing); and settles.
 */
export function sphereCourse(m: SphereMotion, g: SphereGeometry, trip: SphereTrip, rested = 0): SphereCourse {
  const R = radius(m, g)
  const a = centre(trip.from, g)
  const b = centre(trip.to, g)
  const leap = leapOf(m, g, trip)
  const Tc = m.crouch
  const Th = m.hang
  const landed = landing(m, g, trip)
  const launch = Tc
  const land = Tc + Th
  const still = land + landed.duration
  const total = still + settleMs(m)
  const s0 = sat(m, rested)
  // The impulses: pushing off its nest, landing in the next, and every impact with the bowl after, as hard as it hit.
  const hits: Hit[] = [{ at: launch, n: 0.6, nest: 0 }, ...landed.hits.map((h) => ({ at: land + h.at, n: h.n, nest: 1 as const }))]
  const dip = (t: number): [number, number] => [m.give * ring(g) * jiggle(m, hits, t, 0), m.give * ring(g) * jiggle(m, hits, t, 1)]
  const on = (t: number) => (t < land ? 0 : t >= still ? 1 : landedAt(landed, t - land).on)

  const squash = (t: number) => {
    if (t < 0) return sat(m, rested + t)
    if (t < launch) return lerp(s0, m.squat, smooth(t / Tc))
    if (t < land) return m.squat * Math.max(0, 1 - (t - launch) / (0.15 * Th))
    // Landed: the jiggles; spread as far as it is on the bowl; breathing once it has settled.
    return m.squash * jiggle(m, hits, t) + m.spread * on(t) + (t >= total ? sat(m, t - total) - m.spread : 0)
  }
  const head = (t: number) => {
    const s = squash(t)
    if (t < 0) return { x: a.x, y: a.y + ring(g) + dip(t)[0] - halfHeight(m, R, s) }
    if (t < launch) {
      const e = smooth(t / Tc)
      return { x: lerp(a.x, leap.start.x, e), y: a.y + ring(g) + dip(t)[0] - halfHeight(m, R, s) }
    }
    if (t < land) {
      const u = (t - launch) / Th
      const y = u <= leap.peak
        ? leap.apex + (leap.start.y - leap.apex) * (1 - u / leap.peak) ** 2
        : leap.apex + (leap.end.y - leap.apex) * ((u - leap.peak) / (1 - leap.peak)) ** 2
      return { x: lerp(leap.start.x, leap.end.x, u), y }
    }
    const cy = b.y + dip(t)[1]
    if (t < still) {
      // In the bowl: where the landing puts it, sunk into the bowl along its floor as far as it is on it.
      const q = landedAt(landed, t - land)
      const d = Math.hypot(q.x, q.y) || 1
      const reach = lerp(d, ring(g) - halfHeight(m, R, s), q.on)
      return { x: b.x + (q.x / d) * reach, y: cy + (q.y / d) * reach }
    }
    return { x: b.x, y: cy + ring(g) - halfHeight(m, R, s) }
  }
  const lean = (t: number) => {
    if (t < land || t >= still) return { sway: 0, squeeze: 0, nx: 0, ny: 1 }
    const q = landedAt(landed, t - land)
    const d = Math.hypot(q.x, q.y) || 1
    return { sway: q.sway, squeeze: q.squeeze, nx: q.x / d, ny: q.y / d }
  }
  const lit = (t: number): [number, number] => {
    const u = (t - launch) / Th
    return [t < launch ? 1 : 1 - smooth((u - 0.2) / 0.4), t < launch ? 0 : smooth((u - 0.35) / 0.4)]
  }
  const impact = (t: number) =>
    clamp01(hits.reduce((sum, h) => (h.nest === 1 && t >= h.at ? sum + h.n * Math.exp(-(t - h.at) / m.wobble) : sum), 0))
  return { m, g, trip, total, head, squash, lit, dip, gravity: leap.G, lean, impact }
}

// ── the tail ────────────────────────────────────────────────────────────────────────────────────────────────────

/** How many pieces the tail is. */
const PIECES = 12
/** The tail's springs step at 240 a second, whatever the frame rate, so a moment is the same frame however it is reached. */
const DT = 1000 / 240
/** The speed at which the tail is `stretch` longer, in cells a ms: a cell in 300ms. */
const QUICK = 1 / 300

/** The tail's radius at share `u` of the way down it: a little under the head's out of it, thinning to its tip. */
const girth = (m: SphereMotion, R: number, u: number) => R * lerp(0.8, m.taper, smooth(u))

/** How fast the head is going at `t`, px/ms. */
function velocity(course: SphereCourse, t: number) {
  const a = course.head(t - 4)
  const b = course.head(t + 4)
  return { x: (b.x - a.x) / 8, y: (b.y - a.y) / 8 }
}

/** The tail sitting: straight back into the page behind the head, a little lower toward its tip, all of it hidden. */
function tucked(m: SphereMotion, g: SphereGeometry, head: { x: number; y: number }): V3[] {
  const piece = (m.length * 2 * radius(m, g)) / PIECES
  const pts: V3[] = [{ ...head, z: 0 }]
  for (let i = 1; i <= PIECES; i++) pts.push({ x: head.x, y: head.y + piece * i * 0.15, z: -piece * i })
  return pts
}

type Sim = { t: number; p: V3[]; q: V3[] }
const sims = new WeakMap<SphereCourse, Sim>()

/** One step of the tail's springs, to time `t`. */
function step(course: SphereCourse, sim: Sim, t: number) {
  const { m, g } = course
  const pitch = g.cell + g.gap
  const R = radius(m, g)
  const head = course.head(t)
  const v = velocity(course, t)
  const speed = Math.hypot(v.x, v.y)
  const quick = Math.min(2, speed / (QUICK * pitch))
  const piece = ((m.length * 2 * R) / PIECES) * (1 + m.stretch * quick)
  // Its shape: tucked behind the page sitting, trailing behind the head in front of it as it flies, between the two
  // between.
  const rest = tucked(m, g, head)
  const w = smooth(quick)
  const back = speed > 1e-4 ? { x: -v.x / speed, y: -v.y / speed } : { x: 0, y: 0 }
  const keep = Math.exp(-DT / tailTau(m))
  const pull = m.stiffness * 0.08
  const fall = course.gravity * DT * DT
  sim.p[0] = { ...head, z: 0 }
  for (let i = 1; i <= PIECES; i++) {
    const p = sim.p[i]!
    const q = sim.q[i]!
    const trail = { x: head.x + back.x * piece * i, y: head.y + back.y * piece * i, z: R * 0.4 }
    const target = { x: lerp(rest[i]!.x, trail.x, w), y: lerp(rest[i]!.y, trail.y, w), z: lerp(rest[i]!.z, trail.z, w) }
    sim.q[i] = p
    sim.p[i] = {
      x: p.x + (p.x - q.x) * keep + (target.x - p.x) * pull,
      y: p.y + (p.y - q.y) * keep + (target.y - p.y) * pull + fall,
      z: p.z + (p.z - q.z) * keep + (target.z - p.z) * pull,
    }
  }
  // Moving, it straightens: each piece pulled toward the line of the two before it, so the tail trails and never folds.
  const straighten = (0.05 + 0.25 * m.stiffness) * w
  for (let i = 2; i <= PIECES && straighten > 0; i++) {
    const a = sim.p[i - 2]!
    const b = sim.p[i - 1]!
    const p = sim.p[i]!
    sim.p[i] = { x: lerp(p.x, 2 * b.x - a.x, straighten), y: lerp(p.y, 2 * b.y - a.y, straighten), z: lerp(p.z, 2 * b.z - a.z, straighten) }
  }
  // Each piece its length from the one before it, the head leading.
  for (let i = 1; i <= PIECES; i++) {
    const a = sim.p[i - 1]!
    const p = sim.p[i]!
    const l = Math.hypot(p.x - a.x, p.y - a.y, p.z - a.z)
    if (l > 1e-6) sim.p[i] = { x: a.x + ((p.x - a.x) * piece) / l, y: a.y + ((p.y - a.y) * piece) / l, z: a.z + ((p.z - a.z) * piece) / l }
  }
  sim.t = t
}

/** The body at `t` ms into `course`, head first: the head, then the tail's points. */
export function sphereSpine(course: SphereCourse, t: number): V3[] {
  const { m, g } = course
  if (course.total === 0 || t <= 0 || t > course.total + 1500) return tucked(m, g, course.head(t))
  let sim = sims.get(course)
  if (!sim || sim.t > t) {
    const start = tucked(m, g, course.head(0))
    sim = { t: 0, p: start, q: start.map((p) => ({ ...p })) }
    sims.set(course, sim)
  }
  while (sim.t + DT <= t) step(course, sim, sim.t + DT)
  return [{ ...course.head(t), z: 0 }, ...sim.p.slice(1)]
}

// ── a frame, drawn ──────────────────────────────────────────────────────────────────────────────────────────────

/** The light, toward it from the sphere: up and to the left. */
const LIGHT = (() => {
  const [x, y] = [-0.45, -0.6]
  const l = Math.hypot(x, y)
  return { x: x / l, y: y / l }
})()

const f2 = (n: number) => (Math.round(n * 100) / 100).toString()

type Drawn = { x: number; y: number; r: number }

/** A disc as a closed SVG subpath, turning the way every hull turns. */
function disc(c: Drawn): string {
  return `M ${f2(c.x + c.r)} ${f2(c.y)} A ${f2(c.r)} ${f2(c.r)} 0 1 0 ${f2(c.x - c.r)} ${f2(c.y)} A ${f2(c.r)} ${f2(c.r)} 0 1 0 ${f2(c.x + c.r)} ${f2(c.y)} Z`
}

/**
 * Two discs and the band between them, their outer tangents, as a closed SVG subpath. Every hull and disc turns the
 * same way, so a chain of them, filled nonzero, is one smooth outline with no hole where the body curls on itself.
 */
function hull(a: Drawn, b: Drawn): string {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const d = Math.hypot(dx, dy)
  if (d <= Math.abs(a.r - b.r) + 1e-6) return disc(a.r >= b.r ? a : b)
  const ux = dx / d
  const uy = dy / d
  const beta = Math.acos(clamp((a.r - b.r) / d, -1, 1))
  const [c, s] = [Math.cos(beta), Math.sin(beta)]
  const [px, py] = [ux * c - uy * s, ux * s + uy * c]
  const [qx, qy] = [ux * c + uy * s, -ux * s + uy * c]
  const pt = (o: Drawn, x: number, y: number) => `${f2(o.x + o.r * x)} ${f2(o.y + o.r * y)}`
  // Round b's far side, from +β to −β, 2β of it; round a's far side, from −β to +β, the rest of the circle.
  return [
    `M ${pt(a, px, py)}`,
    `L ${pt(b, px, py)}`,
    `A ${f2(b.r)} ${f2(b.r)} 0 ${beta > Math.PI / 2 ? 1 : 0} 0 ${pt(b, qx, qy)}`,
    `L ${pt(a, qx, qy)}`,
    `A ${f2(a.r)} ${f2(a.r)} 0 ${beta < Math.PI / 2 ? 1 : 0} 0 ${pt(a, px, py)}`,
    "Z",
  ].join(" ")
}

/** How much of a circle of radius `r` lies inside one of radius `n`, their centres `d` apart. */
function inside(r: number, n: number, d: number): number {
  if (d >= r + n) return 0
  if (d <= Math.abs(r - n)) return Math.PI * Math.min(r, n) ** 2
  const a = r * r * Math.acos(clamp((d * d + r * r - n * n) / (2 * d * r), -1, 1))
  const b = n * n * Math.acos(clamp((d * d + n * n - r * r) / (2 * d * n), -1, 1))
  const c = 0.5 * Math.sqrt(Math.max(0, (-d + r + n) * (d + r - n) * (d - r + n) * (d + r + n)))
  return a + b - c
}

/**
 * The head settled into a nest it presses into, as points turning the way every hull turns, or null when it presses
 * into none. Its centre stays where the course puts it; its circle grows until what is inside the nest is as much as
 * the head (it keeps its size as it spreads); what is outside is laid on the nest's circle, so its underside follows the
 * ring's curve; and the outline is smoothed as soft as its body is. Only the lower part of a nest is a floor: a head
 * passing through the ring's line higher up is not caught by it.
 */
function settled(m: SphereMotion, R: number, head: { x: number; y: number }, nests: { x: number; y: number; r: number }[]) {
  for (const n of nests) {
    const dx = head.x - n.x
    const dy = head.y - n.y
    const d = Math.hypot(dx, dy)
    // Only the nest its centre is in, and only if it presses past that nest's circle, low down.
    if (d >= n.r || d + R - n.r <= 0.05 || dy <= 0 || Math.atan2(Math.abs(dx), dy) > (75 * Math.PI) / 180) continue
    const whole = Math.PI * R * R
    let lo = R
    let hi = R * 4
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (inside(mid, n.r, d) < whole) lo = mid
      else hi = mid
    }
    const r = (lo + hi) / 2
    const K = 72
    let pts: { x: number; y: number }[] = []
    for (let i = 0; i < K; i++) {
      const a = (-2 * Math.PI * i) / K
      const p = { x: head.x + r * Math.cos(a), y: head.y + r * Math.sin(a) }
      const qx = p.x - n.x
      const qy = p.y - n.y
      const l = Math.hypot(qx, qy)
      pts.push(l > n.r ? { x: n.x + (qx * n.r) / l, y: n.y + (qy * n.r) / l } : p)
    }
    for (let pass = 0; pass < SOFT[m.body]; pass++) {
      pts = pts.map((p, i) => {
        const a = pts[(i + K - 1) % K]!
        const b = pts[(i + 1) % K]!
        return { x: lerp(p.x, (a.x + b.x) / 2, 0.5), y: lerp(p.y, (a.y + b.y) / 2, 0.5) }
      })
    }
    return pts
  }
  return null
}

/**
 * The settled head leaning: each point moved along the bowl's floor, the way the sway says, as far as it stands above
 * the point where it sits — its jelly swaying on its base.
 */
function leaned(pts: { x: number; y: number }[] | null, lean: { sway: number; squeeze: number; nx: number; ny: number }, R: number, head: { x: number; y: number }) {
  if (!pts || Math.abs(lean.sway) < 1e-4) return pts
  const tx = lean.ny
  const ty = -lean.nx
  const baseX = head.x + lean.nx * R
  const baseY = head.y + lean.ny * R
  return pts.map((p) => {
    const up = (baseX - p.x) * lean.nx + (baseY - p.y) * lean.ny
    const off = lean.sway * Math.max(0, up)
    return { x: p.x + tx * off, y: p.y + ty * off }
  })
}

/**
 * The settled head squeezed along the bowl's floor: shorter along its way and fuller across it, about its centre,
 * keeping its size; what that pushes past the nest's circle is laid on it, so it squishes flat against the side.
 */
function squeezed(
  pts: { x: number; y: number }[] | null,
  lean: { squeeze: number; nx: number; ny: number },
  head: { x: number; y: number },
  nests: { x: number; y: number; r: number }[]
) {
  if (!pts || lean.squeeze < 1e-3) return pts
  const n = nests.find((q) => Math.hypot(head.x - q.x, head.y - q.y) < q.r)
  const tx = lean.ny
  const ty = -lean.nx
  const along = 1 - lean.squeeze
  const across = 1 / Math.sqrt(along)
  return pts.map((p) => {
    const dx = p.x - head.x
    const dy = p.y - head.y
    const a = (dx * tx + dy * ty) * along
    const b = (dx * lean.nx + dy * lean.ny) * across
    const q = { x: head.x + tx * a + lean.nx * b, y: head.y + ty * a + lean.ny * b }
    if (!n) return q
    const ox = q.x - n.x
    const oy = q.y - n.y
    const l = Math.hypot(ox, oy)
    return l > n.r ? { x: n.x + (ox * n.r) / l, y: n.y + (oy * n.r) / l } : q
  })
}

/**
 * The body's depth (C14): flat bands between its dark side and its paint, and toward the light over it — each the body
 * moved toward the light by a share of the lit side's lift — their tones by `depth`, none at 0. The no-gradient reading
 * of a body curving away: steps, never a falloff.
 */
export function bandsOf(depth: number, moved: (k: number) => string): { d: string; tone: number }[] {
  if (depth <= 0) return []
  return [
    { d: moved(0.5), tone: -0.5 * depth },
    { d: moved(1), tone: 0 },
    { d: moved(1.6), tone: 0.35 * depth },
  ]
}

/** A face's matrix onto the box: its turn (`a b c d`) and where its middle is, as SVG. */
const matrixOf = (k: { a: number; b: number; c: number; d: number }, at: { x: number; y: number }) =>
  `matrix(${[k.a, k.b, k.c, k.d, at.x, at.y].map((n) => (Math.round(n * 10000) / 10000).toString()).join(" ")})`

/**
 * Where the sphere's face is once turned (C10, version 2): its front, the point of the head that faced you, turned by
 * Y, then X, then Z, and seen straight on — its across and its down turned with it, so the face is laid on the head's
 * curve there as on a flat patch. Shown while that point still faces you.
 */
/**
 * An outline as a function of direction from `c`: how far out it is at each angle on the page (radians, x right, y
 * down), between its points. For laying a drawing of a round body on the body as it is drawn.
 */
function radialOf(pts: { x: number; y: number }[], c: { x: number; y: number }): (a: number) => number {
  const polar = pts
    .map((p) => ({ a: Math.atan2(p.y - c.y, p.x - c.x), r: Math.hypot(p.x - c.x, p.y - c.y) }))
    .sort((p, q) => p.a - q.a)
  const n = polar.length
  return (a: number) => {
    const t = ((a + Math.PI) % (2 * Math.PI)) - Math.PI
    let i = 0
    while (i < n && polar[i]!.a < t) i++
    const b = polar[i % n]!
    const p = polar[(i + n - 1) % n]!
    const span = ((b.a - p.a) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) || 2 * Math.PI
    const k = (((t - p.a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / span
    return p.r + (b.r - p.r) * Math.min(1, k)
  }
}

/** His rotation as a turn of a point (y up): Y about the upright first, then X, then Z — the shapes' order. */
function rotator(turn: { x: number; y: number; z: number }) {
  const [ax, ay, az] = [turn.x, turn.y, turn.z].map((deg) => (deg * Math.PI) / 180) as [number, number, number]
  return (p: { x: number; y: number; z: number }) => {
    const a = { x: p.x * Math.cos(ay) + p.z * Math.sin(ay), y: p.y, z: -p.x * Math.sin(ay) + p.z * Math.cos(ay) }
    const b = { x: a.x, y: a.y * Math.cos(ax) - a.z * Math.sin(ax), z: a.y * Math.sin(ax) + a.z * Math.cos(ax) }
    return { x: b.x * Math.cos(az) - b.y * Math.sin(az), y: b.x * Math.sin(az) + b.y * Math.cos(az), z: b.z }
  }
}

function sphereFacing(turn: { x: number; y: number; z: number }, centre: { x: number; y: number }, R: number) {
  const rot = rotator(turn)
  // y up in the turn, y down on the box.
  const front = rot({ x: 0, y: 0, z: 1 })
  const across = rot({ x: 1, y: 0, z: 0 })
  const down = rot({ x: 0, y: -1, z: 0 })
  return {
    a: across.x,
    b: -across.y,
    c: down.x,
    d: -down.y,
    at: { x: centre.x + front.x * R, y: centre.y - front.y * R },
    shown: front.z > 0.12,
  }
}

/**
 * The room the sphere's head takes at a frame, as a box: what it covers settled, else its stretched or squashed
 * circle, square to the page (a shape does not turn with its stretch in version 1).
 */
function roomOf(sat: { x: number; y: number }[] | null, top: { x: number; y: number }, axis: { x: number; y: number }, long: number, short: number) {
  if (sat) {
    const xs = sat.map((p) => p.x)
    const ys = sat.map((p) => p.y)
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
  }
  const upright = Math.abs(axis.y) > Math.abs(axis.x)
  return { x: top.x, y: top.y, w: 2 * (upright ? short : long), h: 2 * (upright ? long : short) }
}

const outline = (pts: { x: number; y: number }[], dx = 0, dy = 0) =>
  `M ${pts.map((p) => `${f2(p.x + dx)} ${f2(p.y + dy)}`).join(" L ")} Z`

/** A chain of discs as one outline: each disc and the next, hulled. */
function chain(pts: Drawn[]): string {
  if (pts.length === 1) return disc(pts[0]!)
  const out: string[] = []
  for (let i = 0; i + 1 < pts.length; i++) out.push(hull(pts[i]!, pts[i + 1]!))
  return out.join(" ")
}

/** A jump's nest, on the box: its centre (dipped as it gives), its circle's radius, how lit. */
export type SphereNest = { x: number; y: number; r: number; lit: number }

/** What a frame draws, on the box, px. */
export type SphereFrame = {
  /** The head's outline: an SVG path filled nonzero. */
  body: string
  /**
   * Its lit side: the head again, moved toward the light a share of its size, so the dark band it leaves uncovered is
   * its far side. Cut to `body`.
   */
  lit: string
  /** What of the tail is in front of the page, as one outline, and its lit side, the same way (cut to `tail`). */
  tail: string
  tailLit: string
  /**
   * While it is in a nest, the nest's circle is the page's opening: what of the tail is outside it is behind the page, so
   * the tail is cut to it. Null while it jumps.
   */
  opening: { x: number; y: number; r: number } | null
  nests: [SphereNest, SphereNest]
  /** Its eyes (version 11), left and right as you see it: each a circle, and what its lids leave open of it. */
  eyes: [SphereEye, SphereEye]
  /** Its brows (version 13), left and right as you see it; null when it wears none. */
  brows: [SphereBrow, SphereBrow] | null
  /** The symbol a mood pops up by its head (version 13); null for none. Outside the head: it is not cut to it. */
  symbol: SphereSymbolFrame | null
  /** The uploaded drawings it wears, each placed on its slot's anchor: a pair's two parts, else one. */
  uploads: SphereUploadFrame[]
  /**
   * The head as a shape (C10), when it is not the sphere: its faces, each in its tone, cut to `body`, which is its outline;
   * `lit` is then empty. Absent or null for the sphere.
   */
  shape?: ShapeFrame | null
  /** Where the head is and how big — its centre and radius, px — which its texture is fixed to (C15). */
  head?: { x: number; y: number; r: number }
  /**
   * Its depth (C14): the sphere's body toned in flat bands between its dark side and its paint and toward the light,
   * each the outline moved toward the light, painted over `lit` in order. None at depth 0, so it draws as it always has.
   */
  bands?: { d: string; tone: number }[]
  /** Its texture, drawn on the sphere (C15): marks by tone, on the box; a shape's is on its `shape`. */
  texture?: TextureGroup[]
  /**
   * Where the face is laid when it is turned (C10, version 2): an SVG matrix from the face's own px — drawn about 0,0 —
   * to the box. Absent when nothing is turned: the face is then drawn on the box as it always was.
   */
  faceTransform?: string
  /** Whether the face is turned away, so it is not drawn. */
  faceHidden?: boolean
}

/**
 * An uploaded drawing placed on the box: its slot and version's id, and each part's place — its anchor moved as the
 * drawing is set, its turn in degrees, and whether it is the mirror (a pair's right). `scale` is px to one head radius:
 * a painter divides it by the drawing's own `unit`.
 */
export type SphereUploadFrame = {
  slot: FaceSlotId
  id: string
  scale: number
  parts: { x: number; y: number; turn: number; mirror: boolean }[]
}

/**
 * An eye on the box: its centre and radius, px, and about its centre: what its lids leave open of it, an SVG path; its
 * pupil or its catchlight, whichever it wears; and a heavy upper lid's band and edge, cut to a circle `hood` across.
 */
export type SphereEye = {
  x: number
  y: number
  r: number
  lids: string
  pupil: { x: number; y: number; r: number } | null
  shine: { x: number; y: number; r: number } | null
  lid: { band: string; edge: string; width: number; hood: number } | null
}

/** A brow on the box: a path to stroke `width` wide (a line), or to fill (an arch, bushy) when `width` is null. */
export type SphereBrow = { d: string; width: number | null }

/** A symbol on the box: what of it is stroked `width` wide, and what is filled. */
export type SphereSymbolFrame = { stroke: string; fill: string; width: number }

/** The sphere at `t` ms into `course`, drawn, its blinks at `blinkAt` ms on their own clock (the play's, or live's). */
export function sphereFrame(course: SphereCourse, t: number, blinkAt = t): SphereFrame {
  const { m, g } = course
  const pitch = g.cell + g.gap
  const R = radius(m, g)
  const spine = sphereSpine(course, t)
  const top = spine[0]!

  // The head's shape: settled into the nest it presses into; stretched tall as it springs back; stretched along the way
  // it flies at speed; else round.
  const [l0, l1] = course.lit(t)
  const [d0, d1] = course.dip(t)
  const c0 = centre(course.trip.from, g)
  const c1 = centre(course.trip.to, g)
  const nestsAt = [
    { x: c0.x, y: c0.y + d0, r: ring(g) },
    { x: c1.x, y: c1.y + d1, r: ring(g) },
  ]
  const s = course.squash(t)
  const v = velocity(course, t)
  const speed = Math.hypot(v.x, v.y)
  const along = 1 + m.stretch * 0.3 * Math.min(2, speed / (QUICK * pitch))
  const leaning = course.lean(t)
  const sat = squeezed(leaned(settled(m, R, top, nestsAt), leaning, R, top), leaning, top, nestsAt)
  let axis = { x: 1, y: 0 }
  let long = R
  let short = R
  if (!sat && s < -0.01) {
    long = R * (1 + -s * 0.6)
    short = R * (1 + s)
    axis = { x: 0, y: 1 }
  } else if (!sat && along > 1.01 && speed > 1e-6) {
    axis = { x: v.x / speed, y: v.y / speed }
    long = R * along
    short = R / Math.sqrt(along)
  }
  const reach = long - short
  const pill: Drawn[] = [
    { x: top.x - axis.x * reach, y: top.y - axis.y * reach, r: short },
    { x: top.x + axis.x * reach, y: top.y + axis.y * reach, r: short },
  ]
  const shape = (dx: number, dy: number) => (sat ? outline(sat, dx, dy) : chain(pill.map((d) => ({ ...d, x: d.x + dx, y: d.y + dy }))))
  // The tail as far as it is in front of the page, cut where it goes behind it.
  const tail: Drawn[] = []
  for (let i = 1; i < spine.length; i++) {
    const p = spine[i]!
    const prev = spine[i - 1]!
    const r = girth(m, R, i / PIECES)
    if (p.z >= 0) {
      tail.push({ x: p.x, y: p.y, r })
      continue
    }
    if (prev.z > 0) {
      const f = prev.z / (prev.z - p.z)
      tail.push({ x: lerp(prev.x, p.x, f), y: lerp(prev.y, p.y, f), r: lerp(girth(m, R, (i - 1) / PIECES), r, f) })
    }
    break
  }
  // The tail joins the head from a disc half the head across at its centre, and only while any of it is out.
  const discs = tail.length ? [{ x: top.x, y: top.y, r: R * 0.5 }, ...tail] : []
  const shift = (d: Drawn): Drawn => ({ x: d.x + LIGHT.x * d.r * 0.32, y: d.y + LIGHT.y * d.r * 0.32, r: d.r })
  const lift = R * 0.32
  const home = nestsAt.find((n) => Math.hypot(top.x - n.x, top.y - n.y) < n.r)
  // The eyes ride the head as it is drawn: settled, its puddle wider and lower; stretched, along its way.
  const face = sat
    ? (() => {
        const fy = halfHeight(m, R, s) / R
        return { axis: { x: 1, y: 0 }, along: Math.min(1.6, 1 / Math.sqrt(Math.max(0.2, fy))), across: fy }
      })()
    : { axis, along: long / R, across: short / R }
  // A shape (C10) takes the room the sphere would, settled, squashed or stretched as it is, and stands on its bottom,
  // so in a nest it rests on the floor (the `Agent` cuts it to the bowl); its face is drawn round the middle of its
  // front, as the sphere's is round its centre.
  const turn = { x: m.rotateX, y: m.rotateY, z: m.rotateZ }
  const turned = turn.x !== 0 || turn.y !== 0 || turn.z !== 0
  const textureLook = { texture: m.texture, size: m.textureSize, wobble: m.textureWobble }
  // The body's outline about the face's centre, by direction, for laying the sphere's texture on it as it is drawn.
  const rim = m.shape === "sphere" && m.texture !== "none" && sat ? radialOf(sat, sat ? onPuddle(sat, top, R) : top) : null
  const solid = m.shape === "sphere" ? null : shapeFrame(m.shape, roomOf(sat, top, axis, long, short), R, turn, home ?? null, m.depth, textureLook)
  // A shape's face is drawn about 0,0 and laid on its front (version 2); the sphere's is drawn where it always was
  // unless it is turned, when it is drawn about 0,0 and laid on the sphere where its front has turned to.
  const faceAtRest = sat ? onPuddle(sat, top, R) : top
  const facing = solid ? null : turned ? sphereFacing(turn, faceAtRest, R) : null
  const { eyes, brows, anchors } = solid
    ? faceAt(course, t, blinkAt, { x: 0, y: 0 }, solid.front.r, { axis: { x: 1, y: 0 }, along: 1, across: 1 })
    : faceAt(course, t, blinkAt, facing ? { x: 0, y: 0 } : faceAtRest, R, face)
  const laid = solid
    ? { faceTransform: matrixOf(solid.face, solid.front), faceHidden: !solid.faceShown }
    : facing
      ? { faceTransform: matrixOf(facing, facing.at), faceHidden: !facing.shown }
      : {}
  if (solid) {
    return {
      body: solid.outline,
      lit: "",
      tail: discs.length ? chain(discs) : "",
      tailLit: discs.length ? chain(discs.map(shift)) : "",
      opening: home ? { ...home } : null,
      nests: [
        { x: c0.x, y: c0.y + d0, r: g.cell / 2, lit: l0 },
        { x: c1.x, y: c1.y + d1, r: g.cell / 2, lit: l1 },
      ],
      eyes,
      brows,
      symbol: symbolOf(m, top, R),
      uploads: uploadsOf(m, anchors, symbolCentre(m, top, R), solid.front.r),
      shape: solid,
      head: { x: solid.front.x, y: solid.front.y, r: R },
      ...laid,
    }
  }
  return {
    ...laid,
    head: { x: top.x, y: top.y, r: R },
    body: shape(0, 0),
    lit: shape(LIGHT.x * lift, LIGHT.y * lift),
    bands: bandsOf(m.depth, (k) => shape(LIGHT.x * lift * k, LIGHT.y * lift * k)),
    // Its texture on the sphere (C15): drawn on the unit sphere, turned as its face is, dropped where it faces away,
    // and laid on the head as its face is (`face`: wider and lower when settled); in the lit or the dark tone by where it faces.
    texture:
      m.texture === "none"
        ? []
        : drawTexture(
            textureLook,
            [SPHERE_PATCH],
            (p) => {
              const q = rotator(turn)(p)
              if (q.z <= 0.005) return null
              // Laid on the body as it is drawn: how far out a point is on the sphere, 0 at the front to 1 at the rim,
              // along the body's outline in that direction — so the drawing reaches the edge of a settled puddle as it
              // does a circle's (his, 2026-09-30: "their texture ends even before reaching the tip of the agent").
              const rho = Math.min(1, Math.hypot(q.x, q.y))
              const a = Math.atan2(-q.y * face.across, q.x * face.along)
              const r = rim ? rim(a) : Math.hypot(q.x * R * face.along, q.y * R * face.across) / (rho || 1)
              return {
                at: { x: faceAtRest.x + Math.cos(a) * r * rho, y: faceAtRest.y + Math.sin(a) * r * rho },
                tone: q.x * LIGHT.x + -q.y * LIGHT.y > -0.25 ? 0 : -1,
              }
            },
            R,
          ),
    tail: discs.length ? chain(discs) : "",
    tailLit: discs.length ? chain(discs.map(shift)) : "",
    opening: home ? { ...home } : null,
    nests: [
      { x: c0.x, y: c0.y + d0, r: g.cell / 2, lit: l0 },
      { x: c1.x, y: c1.y + d1, r: g.cell / 2, lit: l1 },
    ],
    eyes,
    brows,
    symbol: symbolOf(m, top, R),
    uploads: uploadsOf(m, anchors, symbolCentre(m, top, R), R),
  }
}

// ── the eyes (version 11) ───────────────────────────────────────────────────────────────────────────────────────

/** The share of a blink spent closing; it opens over the rest. */
const CLOSING = 0.4
/** How long its eyes take to go from the nest it looks at to the way it flies, once it leaps, ms. */
const TURN_MS = 140

/**
 * How shut a blink has the lids `ms` into the blink clock, 0 not at all to 1 shut: the first a whole `blinkEvery` in,
 * then one every `blinkEvery`, each closing over the first 40% of `blink` and opening over the rest.
 */
function blinkShut(m: SphereMotion, ms: number): number {
  if (!(m.blinkEvery > 0) || !(m.blink > 0) || ms < m.blinkEvery) return 0
  const length = Math.min(m.blink, m.blinkEvery)
  const into = ms % m.blinkEvery
  if (into >= length) return 0
  const u = into / length
  return u < CLOSING ? smooth(u / CLOSING) : 1 - smooth((u - CLOSING) / (1 - CLOSING))
}

/**
 * Where its eyes look at `t`, as a vector as long as how far (at most 1): turning to the nest it is going to from
 * `lookLead` before it leaps, then along the way it flies — up as it rises, down as it falls, round the bowl as it
 * slides — and back to straight ahead as it slows and settles.
 */
function aimOf(course: SphereCourse, t: number) {
  const { m, g, trip } = course
  const a = centre(trip.from, g)
  const b = centre(trip.to, g)
  const d = Math.hypot(b.x - a.x, b.y - a.y)
  const target = d > 1e-6 ? { x: (b.x - a.x) / d, y: (b.y - a.y) / d } : { x: 0, y: 0 }
  const launch = m.crouch
  const lead = Math.min(m.lookLead, launch)
  if (course.total === 0) return { x: 0, y: 0 }
  if (t < launch) {
    const k = lead > 0 ? smooth((t - (launch - lead)) / lead) : 0
    return { x: target.x * k, y: target.y * k }
  }
  const v = velocity(course, t)
  const speed = Math.hypot(v.x, v.y)
  const quick = QUICK * (g.cell + g.gap) * 0.6
  const w = speed > 1e-6 ? smooth(speed / quick) / speed : 0
  const fly = { x: v.x * w, y: v.y * w }
  const k = smooth((t - launch) / TURN_MS)
  return { x: lerp(target.x, fly.x, k), y: lerp(target.y, fly.y, k) }
}

/** How far across an eye its lids' edges run, so a heavy lid's band covers its hood: of the eye's radius. */
const LID_REACH = 1.25
/** How many pieces a lid's edge is drawn in: enough for a curve, few enough to write each frame. */
const LID_PIECES = 12
/** Where a blink's lids meet, down from the eye's centre, of its radius: the upper lid does most. */
const MEET = 0.35
/** How shut a heavy upper lid is at the least, so its band hoods the eye even wide open. */
const HOODED = 0.3

/**
 * What the lids leave open of an eye of radius `r`, about its centre, and the upper lid's edge. `upper` and `lower` are
 * how shut each is, 0 open to 1 shut; the upper lid closes onto the lower wherever it is, so an eye shut from above
 * alone is shut. Each edge tilts (`slant`, + the inner end down for the upper, up for the lower) and bows (`curve`, the
 * upper's middle down, the lower's up); `inner` is the side the inner end is on, +1 right. Where the two would cross,
 * they meet.
 */
function lidEdges(
  r: number,
  upper: number,
  lower: number,
  top: { slant: number; curve: number },
  bottom: { slant: number; curve: number },
  inner: 1 | -1,
) {
  const w = r * LID_REACH + 1
  const meet = r * MEET
  const low = lerp(r + 1, meet, lower)
  const high = lerp(-r - 1, low, upper)
  const up: { x: number; y: number }[] = []
  const down: { x: number; y: number }[] = []
  for (let i = 0; i <= LID_PIECES; i++) {
    const u = i / LID_PIECES
    const x = lerp(-w, w, u)
    const bow = 4 * u * (1 - u)
    const tilt = (x / w) * inner * r * 0.5
    // The upper lid sags as it comes down, as a lid over a round eye does (version 11's sag, its curve 0.5).
    let a = high + bow * r * top.curve * upper + tilt * top.slant
    let b = low - bow * r * 0.6 * bottom.curve - tilt * bottom.slant
    if (b < a) a = b = (a + b) / 2
    up.push({ x, y: a })
    down.push({ x, y: b })
  }
  const line = (ps: { x: number; y: number }[]) => ps.map((p, i) => `${i ? "L" : "M"} ${f2(p.x)} ${f2(p.y)}`).join(" ")
  const open = `${line(up)} ${line([...down].reverse()).replace(/^M/, "L")} Z`
  return { open, up, w }
}

/** The pieces of a face a pair has: the right side, as you see it, has its own where the look sets them apart. */
const sided = (m: SphereMotion, side: -1 | 1) => (key: SphereSided) => (side === 1 ? (m.right[key] ?? m[key]) : m[key])

/**
 * Its eyes and brows at `t`: set on its face where their tokens say, moved with the head as it is drawn — squashed and
 * stretched with it (`shape`), leaning and squeezing with its jelly in the bowl — looking where it goes and where the
 * look sends them; the eyes always circles, the size they are set. Their lids blink on their own clock, squint shut as a
 * landing hits, and rest as open as the look has them; a lower lid rises from below. A pupil looks inside its eye; an
 * eye without one looks on the face. Brows ride a little of the eyes' look.
 */
function faceAt(
  course: SphereCourse,
  t: number,
  blinkAt: number,
  head: { x: number; y: number },
  R: number,
  shape: { axis: { x: number; y: number }; along: number; across: number },
): {
  eyes: [SphereEye, SphereEye]
  brows: [SphereBrow, SphereBrow] | null
  anchors: { eyes: [Point, Point]; brows: [Point, Point] }
} {
  const { m } = course
  const lean = course.lean(t)
  const aim = aimOf(course, t)
  const shut = clamp01(Math.max(blinkShut(m, blinkAt), m.squint * course.impact(t)))
  const px = -shape.axis.y
  const py = shape.axis.x
  // A point on the face, then as the head is drawn: along its axis and across it, squeezed and leaning as the outline is.
  const place = (ox: number, oy: number) => {
    const a = (ox * shape.axis.x + oy * shape.axis.y) * shape.along
    const c = (ox * px + oy * py) * shape.across
    let x = head.x + shape.axis.x * a + px * c
    let y = head.y + shape.axis.y * a + py * c
    if (lean.squeeze > 1e-3) {
      const tx = lean.ny
      const ty = -lean.nx
      const dx = x - head.x
      const dy = y - head.y
      const along = (dx * tx + dy * ty) * (1 - lean.squeeze)
      const across = (dx * lean.nx + dy * lean.ny) / Math.sqrt(1 - lean.squeeze)
      x = head.x + tx * along + lean.nx * across
      y = head.y + ty * along + lean.ny * across
    }
    if (Math.abs(lean.sway) > 1e-4) {
      const up = (head.x + lean.nx * R - x) * lean.nx + (head.y + lean.ny * R - y) * lean.ny
      const off = lean.sway * Math.max(0, up)
      x += lean.ny * off
      y += -lean.nx * off
    }
    return { x, y }
  }
  const part = (side: -1 | 1) => {
    const v = sided(m, side)
    const inner: 1 | -1 = side === -1 ? 1 : -1
    const r = v("eyeSize") * R
    // Where the look sends them, never further than an eye can go.
    let lx = v("lookX")
    let ly = v("lookY")
    const reach = Math.hypot(lx, ly)
    if (reach > 1) {
      lx /= reach
      ly /= reach
    }
    const dot = m.pupils === "dot"
    const onFace = R * (dot ? 0.08 : 0.28)
    const shift = { x: aim.x * m.look * R + lx * onFace, y: aim.y * m.look * R - ly * onFace }
    const at = place(side * m.eyeSpacing * R, -v("eyeHeight") * R)
    const pr = v("pupilSize") * r
    const sr = v("shineSize") * r
    const sa = (v("shineAngle") * Math.PI) / 180
    const lower = m.lowerLids === "plain"
    const heavy = m.upperLids === "heavy"
    const upper = clamp01(1 - v("lidOpen") * (1 - shut))
    const edges = lidEdges(
      r,
      // A heavy lid hoods the eye: never higher than a little way down it.
      heavy ? Math.max(upper, HOODED) : upper,
      lower ? Math.max(shut, v("lowerRaise")) : shut,
      { slant: v("lidSlant"), curve: v("lidCurve") },
      lower ? { slant: v("lowerSlant"), curve: v("lowerCurve") } : { slant: 0, curve: 0 },
      inner,
    )
    const band = heavy
      ? `${edges.up.map((p, i) => `${i ? "L" : "M"} ${f2(p.x)} ${f2(p.y)}`).join(" ")} L ${f2(edges.w)} ${f2(-r * 1.6)} L ${f2(-edges.w)} ${f2(-r * 1.6)} Z`
      : ""
    const eye: SphereEye = {
      x: at.x + shift.x,
      y: at.y + shift.y,
      r,
      lids: edges.open,
      pupil: dot ? { x: lx * (r - pr) * 0.9, y: -ly * (r - pr) * 0.9, r: pr } : null,
      shine:
        m.pupils === "shine" ? { x: Math.sin(sa) * (r - sr) * 0.55, y: -Math.cos(sa) * (r - sr) * 0.55, r: sr } : null,
      lid: heavy
        ? {
            band,
            edge: edges.up.map((p, i) => `${i ? "L" : "M"} ${f2(p.x)} ${f2(p.y)}`).join(" "),
            width: r * 0.16,
            hood: r * 1.14,
          }
        : null,
    }
    // The brow: its height over the top of the eye, squashed with the head, and the eye's radius, which never is;
    // riding a little of the eyes' look; tilted from its inner end. Its place is an uploaded brow's anchor too.
    const lifted = place(side * m.eyeSpacing * R, -(v("eyeHeight") + v("browHeight")) * R)
    const ux = lifted.x - at.x
    const uy = lifted.y - at.y
    const ul = Math.hypot(ux, uy)
    const up = ul > 1e-6 ? { x: ux / ul, y: uy / ul } : { x: 0, y: -1 }
    const b = { x: lifted.x + up.x * r + shift.x * 0.6, y: lifted.y + up.y * r + shift.y * 0.6 }
    const brow =
      m.brows === "none"
        ? null
        : browOf(m.brows, b, v("browLength") * 2 * r, v("browThickness") * 2 * R, v("browArch"), (v("browAngle") * inner * Math.PI) / 180, inner)
    return { eye, brow, browAt: b }
  }
  const left = part(-1)
  const right = part(1)
  return {
    eyes: [left.eye, right.eye],
    brows: left.brow && right.brow ? [left.brow, right.brow] : null,
    anchors: {
      eyes: [
        { x: left.eye.x, y: left.eye.y },
        { x: right.eye.x, y: right.eye.y },
      ],
      brows: [left.browAt, right.browAt],
    },
  }
}

type Point = { x: number; y: number }

/**
 * The uploaded drawings `m` wears, placed: an eye's part (pupils, lids) on its eye, a brow on the brow's place, a symbol
 * on the symbol's; moved across and up from there in head radii and turned — a pair's right part the mirror of its left,
 * so it moves and turns the other way.
 */
function uploadsOf(m: SphereMotion, anchors: { eyes: [Point, Point]; brows: [Point, Point] }, symbol: Point, R: number): SphereUploadFrame[] {
  const out: SphereUploadFrame[] = []
  for (const [slot, wear] of Object.entries(m.uploads) as [FaceSlotId, SphereUploadWear][]) {
    const at: Point[] = slot === "brows" ? anchors.brows : slot === "symbols" ? [symbol] : slot === "eyes" ? [] : anchors.eyes
    out.push({
      slot,
      id: wear.id,
      scale: wear.size * R,
      parts: at.map((a, i) => {
        const mirror = at.length === 2 && i === 1
        return { x: a.x + (mirror ? -wear.x : wear.x) * R, y: a.y - wear.y * R, turn: mirror ? -wear.turn : wear.turn, mirror }
      }),
    })
  }
  return out
}

/**
 * A brow `L` long and `T` thick at `at`, turned `turn` radians and bowed up `arch` (of its length), its inner end on the
 * `inner` side: a **line**, stroked round; an **arch**, a crescent pointed at both ends; or **bushy**, thick at its inner
 * end and thin at its outer, tufted along its top.
 */
function browOf(style: Exclude<SphereBrows, "none">, at: { x: number; y: number }, L: number, T: number, arch: number, turn: number, inner: 1 | -1): SphereBrow {
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  // Local x runs outer to inner for the brow on the left, mirrored for the right; then turned and put in place.
  const P = (x: number, y: number) => {
    const lx = x * inner
    return `${f2(at.x + lx * cos - y * sin)} ${f2(at.y + lx * sin + y * cos)}`
  }
  const bend = arch * L * 0.35
  const h = L / 2
  if (style === "line") return { d: `M ${P(-h, 0)} Q ${P(0, -2 * bend)} ${P(h, 0)}`, width: T }
  if (style === "arch") {
    return { d: `M ${P(-h, 0)} Q ${P(0, -2 * bend - T)} ${P(h, 0)} Q ${P(0, -2 * bend + T)} ${P(-h, 0)} Z`, width: null }
  }
  // Bushy: its middle line, and its thickness from 0.7 of T at the outer end to 1.8 at the inner.
  const N = 4
  const mid = (u: number) => ({ x: lerp(-h, h, u), y: -4 * u * (1 - u) * bend })
  const thick = (u: number) => T * lerp(0.7, 1.8, u)
  const below = Array.from({ length: N + 1 }, (_, i) => {
    const u = i / N
    return { x: mid(u).x, y: mid(u).y + thick(u) * 0.35 }
  })
  const above = Array.from({ length: N + 1 }, (_, i) => {
    const u = i / N
    return { x: mid(u).x, y: mid(u).y - thick(u) * 0.65 }
  })
  let d = `M ${P(below[0]!.x, below[0]!.y)}`
  for (let i = 1; i <= N; i++) d += ` L ${P(below[i]!.x, below[i]!.y)}`
  // Its inner end rounded, then back along its top in tufts.
  const end = thick(1) * 0.5
  d += ` Q ${P(h + end, (below[N]!.y + above[N]!.y) / 2)} ${P(above[N]!.x, above[N]!.y)}`
  for (let i = N - 1; i >= 0; i--) {
    const a = above[i + 1]!
    const b = above[i]!
    const tuft = thick((i + 0.5) / N) * 0.45
    d += ` Q ${P((a.x + b.x) / 2, (a.y + b.y) / 2 - tuft)} ${P(b.x, b.y)}`
  }
  return { d: `${d} Z`, width: null }
}

/**
 * The symbol a mood pops up by its head (version 13): drawn as manga draws them, flat, `symbolSize` of the head across,
 * standing off the head `symbolAt` degrees round from straight up. The cross of anger, a sweat drop, a Zzz, a sparkle,
 * a question mark. Null for none.
 */
function symbolOf(m: SphereMotion, head: { x: number; y: number }, R: number): SphereSymbolFrame | null {
  if (m.symbol === "none") return null
  const u = m.symbolSize * R
  const { x: cx, y: cy } = symbolCentre(m, head, R)
  const P = (x: number, y: number) => `${f2(cx + x * u)} ${f2(cy + y * u)}`
  switch (m.symbol) {
    case "anger": {
      // Four curved brackets round a cross, each corner toward the middle.
      const turns = [
        [1, 1],
        [-1, 1],
        [-1, -1],
        [1, -1],
      ] as const
      const stroke = turns
        .map(([sx, sy]) => `M ${P(sx * 0.22, -sy * 0.9)} Q ${P(sx * 0.22, -sy * 0.22)} ${P(sx * 0.9, -sy * 0.22)}`)
        .join(" ")
      return { stroke, fill: "", width: u * 0.22 }
    }
    case "sweat":
      return {
        stroke: "",
        fill: `M ${P(0, -0.95)} C ${P(0.3, -0.45)} ${P(0.62, -0.05)} ${P(0.62, 0.3)} C ${P(0.62, 0.7)} ${P(0.32, 0.92)} ${P(0, 0.92)} C ${P(-0.32, 0.92)} ${P(-0.62, 0.7)} ${P(-0.62, 0.3)} C ${P(-0.62, -0.05)} ${P(-0.3, -0.45)} ${P(0, -0.95)} Z`,
        width: 0,
      }
    case "zzz": {
      // Three, each bigger than the last, rising away from the head.
      const zs = [
        { x: -0.66, y: 0.66, h: 0.15 },
        { x: -0.08, y: 0.1, h: 0.22 },
        { x: 0.6, y: -0.58, h: 0.3 },
      ]
      const stroke = zs
        .map(({ x, y, h }) => `M ${P(x - h, y - h)} L ${P(x + h, y - h)} L ${P(x - h, y + h)} L ${P(x + h, y + h)}`)
        .join(" ")
      return { stroke, fill: "", width: u * 0.13 }
    }
    case "sparkle": {
      const star = (x: number, y: number, k: number) =>
        `M ${P(x, y - k)} Q ${P(x + k * 0.12, y - k * 0.12)} ${P(x + k, y)} Q ${P(x + k * 0.12, y + k * 0.12)} ${P(x, y + k)} Q ${P(x - k * 0.12, y + k * 0.12)} ${P(x - k, y)} Q ${P(x - k * 0.12, y - k * 0.12)} ${P(x, y - k)} Z`
      return { stroke: "", fill: `${star(-0.1, 0.1, 0.85)} ${star(0.65, -0.65, 0.32)}`, width: 0 }
    }
    case "question": {
      const dot = u * 0.14
      const [dx, dy] = [cx, cy + 0.74 * u]
      return {
        stroke: `M ${P(-0.42, -0.38)} C ${P(-0.42, -0.9)} ${P(0.45, -0.92)} ${P(0.45, -0.4)} C ${P(0.45, -0.05)} ${P(0, -0.05)} ${P(0, 0.34)}`,
        fill: `M ${f2(dx - dot)} ${f2(dy)} a ${f2(dot)} ${f2(dot)} 0 1 0 ${f2(2 * dot)} 0 a ${f2(dot)} ${f2(dot)} 0 1 0 ${f2(-2 * dot)} 0 Z`,
        width: u * 0.2,
      }
    }
  }
}

/** How far under the settled puddle's middle its face may sink, in head radii. */
const FACE_SINK = 0.1

/**
 * Where a settled head's face rides: its centre, but never lower than a little under the middle of the puddle it is
 * seen as. The course's centre sinks into the bowl as the head spreads while the puddle it draws stays in the bowl's
 * mouth, so past a little spread the eyes went down with it and were cut by the bowl (a Spread of 0.4 on slime, found in
 * the character studio). A little spread (version 14's) is under the bound and moves nothing.
 */
function onPuddle(pts: readonly Point[], head: Point, R: number): Point {
  let lo = Infinity
  let hi = -Infinity
  for (const p of pts) {
    lo = Math.min(lo, p.y)
    hi = Math.max(hi, p.y)
  }
  return { x: head.x, y: Math.min(head.y, (lo + hi) / 2 + FACE_SINK * R) }
}

/** How far from the head's centre a symbol stands, in head radii: clear of the head by a little more than its size. */
const symbolReach = (m: SphereMotion) => 1 + 1.1 * m.symbolSize

/** Where a symbol stands on the box: `symbolAt` degrees round from straight up, `symbolReach` from the head's centre. */
function symbolCentre(m: SphereMotion, head: Point, R: number): Point {
  const a = (m.symbolAt * Math.PI) / 180
  return { x: head.x + Math.sin(a) * symbolReach(m) * R, y: head.y - Math.cos(a) * symbolReach(m) * R }
}

/**
 * Where each slot's parts are anchored (the character studio's upload templates, M20's "An uploaded style"): the left
 * eye's centre (its pupil and lids), the middle of the left brow's line, and the symbol's centre, in head radii from the
 * head's centre, x right, y down, on a round head at rest — the same places `faceAt` and `symbolOf` put them before the
 * head squashes, leans or looks. An uploaded style's shapes are drawn about its slot's anchor.
 */
export function faceAnchors(m: SphereMotion): Record<"eyes" | "brows" | "symbols", { x: number; y: number }> {
  const a = (m.symbolAt * Math.PI) / 180
  return {
    eyes: { x: -m.eyeSpacing, y: -m.eyeHeight },
    brows: { x: -m.eyeSpacing, y: -(m.eyeHeight + m.browHeight + m.eyeSize) },
    symbols: { x: Math.sin(a) * symbolReach(m), y: -Math.cos(a) * symbolReach(m) },
  }
}
