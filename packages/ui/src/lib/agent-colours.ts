import type { ColourName } from "./properties"
import type { SphereMotion } from "./sphere-motion"

/**
 * The agent's colours by name, as CSS (Motion.md M20): what `components/agent` paints with, and what anything that paints
 * a part as the agent does uses — the character studio's preview of an upload. Flat, every one (2026-09-16).
 *
 * `paint` is its body's colour; `shade` the same mixed toward black by its shade, its dark side; `deep` the paint most
 * of the way to black; `ink` the eyes' colour since version 11, drawn for each paint to stand out on it; `light` the
 * page's white.
 */

/**
 * The paints a body can be (Character-Studio.md C10, C20): the two accents, and the agent's own (`--agent-*` in
 * globals.css), each with its ink, round the wheel from pink to blue. Version 2 (2026-10-01): peach, yellow and grey
 * went for red, orange, gold, green and teal, which stand out from the page in both themes.
 */
export const AGENT_PAINTS = [
  { value: "lime", label: "Lime", fill: "var(--lime)", ink: "var(--primary-foreground)" },
  { value: "violet", label: "Violet", fill: "var(--violet)", ink: "var(--secondary-foreground)" },
  { value: "pink", label: "Pink", fill: "var(--agent-pink)", ink: "var(--agent-pink-ink)" },
  { value: "red", label: "Red", fill: "var(--agent-red)", ink: "var(--agent-red-ink)" },
  { value: "orange", label: "Orange", fill: "var(--agent-orange)", ink: "var(--agent-orange-ink)" },
  { value: "gold", label: "Gold", fill: "var(--agent-gold)", ink: "var(--agent-gold-ink)" },
  { value: "green", label: "Green", fill: "var(--agent-green)", ink: "var(--agent-green-ink)" },
  { value: "teal", label: "Teal", fill: "var(--agent-teal)", ink: "var(--agent-teal-ink)" },
  { value: "blue", label: "Blue", fill: "var(--agent-blue)", ink: "var(--agent-blue-ink)" },
] as const

export type AgentPaint = (typeof AGENT_PAINTS)[number]["value"]
export const isAgentPaint = (p: unknown): p is AgentPaint => AGENT_PAINTS.some((each) => each.value === p)

/**
 * The paints that went (C20) and the one each is read as now: the nearest of the new, so a look saved in one — a draft,
 * or a version, frozen with the name — keeps its colour's place on the wheel rather than falling to the default.
 */
export const RENAMED_PAINTS: Readonly<Record<string, AgentPaint>> = { peach: "orange", yellow: "gold", grey: "teal" }

/** `p` as a paint this version knows: one of `AGENT_PAINTS`, a renamed one as what it is now, else nothing. */
export const agentPaintOf = (p: unknown): AgentPaint | undefined => {
  const now = typeof p === "string" ? (RENAMED_PAINTS[p] ?? p) : p
  return isAgentPaint(now) ? now : undefined
}

/** A paint's colour and its ink, as CSS; lime's for a paint this version does not know. */
export const paintCss = (paint: string) => AGENT_PAINTS.find((each) => each.value === paint) ?? AGENT_PAINTS[0]

export function agentColours(look: Pick<SphereMotion, "paint" | "shade">): Record<ColourName, string> {
  const { fill: body, ink } = paintCss(look.paint)
  return {
    paint: body,
    shade: toneCss(body, -1, look.shade),
    deep: `color-mix(in oklch, ${body}, black 80%)`,
    ink,
    light: "var(--secondary-foreground)",
    lime: "var(--lime)",
    violet: "var(--violet)",
  }
}

/**
 * The agent's colours as its eyes are drawn in them (2026-10-01, the eyes' Colour): its colours, but for `ink` with a
 * pupil or a catchlight, which is `deep`. Ink is the colour the eyes have always been — the paint's ink on a solid eye,
 * `deep` for a pupil on a light eye and for an eye under a catchlight (version 13) — so a look saved before the eyes had
 * a colour of their own draws as it did, and a pupil in ink never vanishes into the light eye it is on.
 */
export function eyeColours(look: Pick<SphereMotion, "paint" | "shade" | "pupils">): Record<ColourName, string> {
  const colours = agentColours(look)
  return look.pupils === "dot" || look.pupils === "shine" ? { ...colours, ink: colours.deep } : colours
}

/**
 * `colour` in a face's tone (`./agent-shape`): as it is at 0; toward black below it, −1 as far as its shade takes the
 * dark side; toward white above it, as far again. Flat: one colour a face.
 */
export function toneCss(colour: string, tone: number, shade: number): string {
  const amount = Math.round(Math.abs(tone) * shade * 100)
  if (!amount) return colour
  return `color-mix(in oklch, ${colour}, ${tone < 0 ? "black" : "white"} ${amount}%)`
}

/** A drawing's colour as CSS: one of the agent's by name, a `#rrggbb` as it is, and anything else none. */
export function colourCss(colour: string | undefined, colours: Record<ColourName, string>): string {
  if (!colour) return "none"
  if (colour in colours) return colours[colour as ColourName]
  return /^#[0-9a-f]{6}$/i.test(colour) ? colour : "none"
}
