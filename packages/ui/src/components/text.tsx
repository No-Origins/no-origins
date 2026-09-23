import * as React from "react"
import { cn } from "cn"

/**
 * Text (Type.md). Seven roles, read off the showcase as it stood on 2026-09-21; two knobs besides the role, tone and
 * alignment. Every piece of text in an app is one of these — a page does not reach for `text-2xl` on its own (T1).
 */

export const TEXT_ROLES = ["display", "title", "heading", "label", "body", "caption", "mono"] as const
export type TextRole = (typeof TEXT_ROLES)[number]
export const TEXT_TONES = ["foreground", "muted"] as const
export type TextTone = (typeof TEXT_TONES)[number]
export const TEXT_ALIGNS = ["start", "center", "end"] as const
export type TextAlign = (typeof TEXT_ALIGNS)[number]

const ROLE: Record<TextRole, { className: string; tag: keyof React.JSX.IntrinsicElements; tone: TextTone }> = {
  display: { className: "font-heading text-4xl font-bold tracking-tight", tag: "h1", tone: "foreground" },
  title: { className: "font-heading text-3xl font-bold tracking-tight", tag: "h2", tone: "foreground" },
  heading: { className: "font-heading text-xl font-semibold", tag: "h3", tone: "foreground" },
  label: { className: "font-heading text-xs font-bold tracking-widest uppercase", tag: "p", tone: "foreground" },
  body: { className: "font-sans text-sm", tag: "p", tone: "foreground" },
  caption: { className: "font-sans text-xs", tag: "p", tone: "muted" },
  mono: { className: "font-mono text-xs", tag: "p", tone: "foreground" },
}

const TONE: Record<TextTone, string> = { foreground: "text-foreground", muted: "text-muted-foreground" }
const ALIGN: Record<TextAlign, string> = { start: "text-start", center: "text-center", end: "text-end" }

export type TextProps = Omit<React.ComponentProps<"p">, "children"> & {
  role?: TextRole
  tone?: TextTone
  align?: TextAlign
  /** Override the element the role picks (`h1` for display, `h2` for title, `h3` for heading, `p` otherwise). */
  as?: keyof React.JSX.IntrinsicElements
  children?: React.ReactNode
}

function Text({ role = "body", tone, align = "start", as, className, ...props }: TextProps) {
  const spec = ROLE[role]
  const Tag = (as ?? spec.tag) as React.ElementType
  return (
    <Tag
      data-slot="text"
      data-role={role}
      className={cn("m-0 min-w-0 wrap-break-word", spec.className, TONE[tone ?? spec.tone], ALIGN[align], className)}
      {...props}
    />
  )
}

export { Text }
