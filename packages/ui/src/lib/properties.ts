/**
 * Typed properties (Motion.md M20, agreed 2026-09-30): what a component can have, declared once so every studio builds
 * its controls from it and every look and motion is checked against it. His: *"decide what properties will a component
 * have and then we can design a configuration based on what value is it and what is the type of that value. And any
 * other necessary meta … so that it can scale."*
 *
 * - **A property is a type and its meta.** The type says what the value is, which control edits it, how it is checked,
 *   and how a motion moves it between two values: a number, an angle or a duration eases; a colour, a choice, a switch
 *   or a drawing switches at a row's start. The meta is the rest: its label, what it touches, its range and step, and
 *   its default (the version's value).
 * - **The declaration is code; the values are data.** A component's properties live in the package beside the drawing
 *   that reads them, because the two change and ship together. What he picks — a look, a motion — is kept in the
 *   database as drafts and versions (M20's "Versions and publishing").
 *
 * Pure: no element, no clock. A new kind of value is a new type here, added once, that every component can use.
 */

export type PropertyType = "number" | "angle" | "duration" | "colour" | "choice" | "switch" | "drawing"

/** What a number is a share or a count of, so its control can say so. */
export type NumberUnit = "head" | "eye" | "cell" | "share" | "px" | "count"

/**
 * The colours a property can take, by name: the component's own (for the agent, its `paint`, the `shade` of its dark
 * side, `deep` — its paint most of the way to black — the `ink` its eyes have always been, and `light`, the page's
 * white) or the palette's accents. Flat, every one (2026-09-16).
 */
export type ColourName = "paint" | "shade" | "deep" | "ink" | "light" | "lime" | "violet"
export const COLOUR_NAMES: readonly ColourName[] = ["paint", "shade", "deep", "ink", "light", "lime", "violet"]

type PropertyBase = {
  /** Its key in a look's or a row's values. Unique across its component, so a motion's row can name it alone. */
  id: string
  /** What its control is called. */
  label: string
  /** What moving it changes, in a line. */
  touches: string
}

export type NumberProperty = PropertyBase & { type: "number"; min: number; max: number; step: number; unit?: NumberUnit; default: number }
/** Degrees. */
export type AngleProperty = PropertyBase & { type: "angle"; min: number; max: number; step: number; default: number }
/** Milliseconds, shown in M19's units. */
export type DurationProperty = PropertyBase & { type: "duration"; min: number; max: number; step: number; default: number }
export type ColourProperty = PropertyBase & { type: "colour"; options: readonly ColourName[]; default: ColourName }
export type ChoiceProperty = PropertyBase & {
  type: "choice"
  options: readonly { value: string; label: string }[]
  default: string
}
export type SwitchProperty = PropertyBase & { type: "switch"; default: boolean }
/** An uploaded drawing, by its version's id; `null` for none. */
export type DrawingProperty = PropertyBase & { type: "drawing"; default: string | null }

export type Property =
  | NumberProperty
  | AngleProperty
  | DurationProperty
  | ColourProperty
  | ChoiceProperty
  | SwitchProperty
  | DrawingProperty

export type PropertyValue = number | string | boolean | null
export type PropertyValues = Record<string, PropertyValue>

/** Whether a motion eases it from one value to the next, or switches it at the row's start (M20's types). */
export const eases = (p: Property): p is NumberProperty | AngleProperty | DurationProperty =>
  p.type === "number" || p.type === "angle" || p.type === "duration"

/**
 * `v` as `p` allows it: a number, an angle or a duration clamped into its range and snapped to its step; a colour or a
 * choice one of its options; a switch a boolean; a drawing an id or none. Anything else is the property's default, so a
 * value saved against an older declaration still draws.
 */
export function checkValue(p: Property, v: unknown): PropertyValue {
  switch (p.type) {
    case "number":
    case "angle":
    case "duration": {
      if (typeof v !== "number" || !Number.isFinite(v)) return p.default
      const clamped = Math.min(p.max, Math.max(p.min, v))
      const snapped = p.min + Math.round((clamped - p.min) / p.step) * p.step
      // Snapped on the step from the minimum, and rounded off the float's tail the step leaves.
      return Number(Math.min(p.max, snapped).toFixed(6))
    }
    case "colour":
      return typeof v === "string" && (p.options as readonly string[]).includes(v) ? v : p.default
    case "choice":
      return typeof v === "string" && p.options.some((o) => o.value === v) ? v : p.default
    case "switch":
      return typeof v === "boolean" ? v : p.default
    case "drawing":
      return typeof v === "string" || v === null ? v : p.default
  }
}

/**
 * Where a property's rest is designed (M20): `look`, as part of what the component looks like still (for the agent, in
 * the character studio); or `motion`, only by a motion's rows, its rest the default here. A motion may change either.
 */
export type SettingSet = "look" | "motion"

/** A property as a component declares it: its type and meta, and where its rest is designed. */
export type Setting = Property & { set: SettingSet }

/** Every property's default, keyed by id. */
export const defaultsOf = (properties: readonly Property[]): PropertyValues =>
  Object.fromEntries(properties.map((p) => [p.id, p.default]))
