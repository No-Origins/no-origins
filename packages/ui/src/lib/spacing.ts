/**
 * Spacing (Spacing.md, 2026-10-09, his pick: E, two layers), for script. CSS asks for a job by its utility
 * (`p-inset`, `gap-stack`); script reads the same tokens off an element.
 *
 * The base layer: the steps, in px, and no others (SP2). Tailwind's own steps 0 · 0.5 · 1 · 2 · 3 · 4 · 6 · 8 · 12.
 */
export const SPACE_STEPS = [0, 2, 4, 8, 12, 16, 24, 32, 48] as const

export type SpaceStep = (typeof SPACE_STEPS)[number]

/**
 * The jobs (SP3), each a `--space-*` token in globals.css and a Tailwind spacing name (`p-inset`, `gap-stack`). The
 * insets are the larger of their step and what clears the box's round corner (SP4), so they follow the radius.
 */
export const SPACE_ROLES = ["inset", "inset-tight", "inset-pill", "stack", "stack-tight", "inline", "inline-tight", "gutter"] as const

export type SpaceRole = (typeof SPACE_ROLES)[number]

/** A job's token as CSS, for an inline style: `var(--space-inset)`. */
export const space = (role: SpaceRole) => `var(--space-${role})`

/** A job's value in px, read off an element where it is used (an inset follows the radius of the grid it is on). */
export function spaceOf(el: Element, role: SpaceRole): number {
  const probe = document.createElement("div")
  probe.style.cssText = `position:absolute;visibility:hidden;width:var(--space-${role})`
  el.appendChild(probe)
  const px = probe.getBoundingClientRect().width
  probe.remove()
  return px
}
