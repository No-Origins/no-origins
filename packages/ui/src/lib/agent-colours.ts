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
 * The paints a body can be (Character-Studio.md C10): the two accents, and since 2026-09-30 the agent's own pastels
 * (`--agent-*` in globals.css, his sketch's), each with its ink. Version 1.
 */
export const AGENT_PAINTS = [
  { value: "lime", label: "Lime", fill: "var(--lime)", ink: "var(--primary-foreground)" },
  { value: "violet", label: "Violet", fill: "var(--violet)", ink: "var(--secondary-foreground)" },
  { value: "pink", label: "Pink", fill: "var(--agent-pink)", ink: "var(--agent-pink-ink)" },
  { value: "peach", label: "Peach", fill: "var(--agent-peach)", ink: "var(--agent-peach-ink)" },
  { value: "yellow", label: "Yellow", fill: "var(--agent-yellow)", ink: "var(--agent-yellow-ink)" },
  { value: "blue", label: "Blue", fill: "var(--agent-blue)", ink: "var(--agent-blue-ink)" },
  { value: "grey", label: "Grey", fill: "var(--agent-grey)", ink: "var(--agent-grey-ink)" },
] as const

export type AgentPaint = (typeof AGENT_PAINTS)[number]["value"]
export const isAgentPaint = (p: unknown): p is AgentPaint => AGENT_PAINTS.some((each) => each.value === p)

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
