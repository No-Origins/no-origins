"use client"

import * as React from "react"

/**
 * The registry (Slots.md §3): the components a layout item can name by `kind` — `component: { kind }` — and a slot
 * draws with `Placed`. It filled the composer's palette until the composer was removed (2026-09-23); what is left is
 * what a layout still places: the pager's parts, in the bar — the arrows as a pair (Grid.md D29), and one arrow and one
 * page number a cell (D36). Each entry loads its module on first render.
 */

type Props = Record<string, unknown>
type View = React.ComponentType<{ props: Props }>
type RegistryEntry = { kind: string; View: View }

/** A lazy view over a module: `load` imports it, `view` draws it. */
function lazy<M>(load: () => Promise<M>, view: (m: M, props: Props) => React.ReactNode): View {
  const Lazy = React.lazy(() => load().then((m) => ({ default: ({ props }: { props: Props }) => <>{view(m, props)}</> })))
  return function View({ props }) {
    return (
      <React.Suspense fallback={<div className="bg-muted/40 h-full w-full" aria-hidden />}>
        <Lazy props={props} />
      </React.Suspense>
    )
  }
}

const REGISTRY: RegistryEntry[] = [
  {
    // The pager's ↑ ↓ as one molecule (Grid.md D29): it reads the turn from context rather than its props, so it
    // means nothing outside the bar. The lazy import is also what keeps grid-pager → slot → registry from being a
    // static cycle.
    kind: "pager-arrows",
    View: lazy(
      () => import("@no-origins/ui/components/grid-pager"),
      (m) => <m.GridPagerArrows />,
    ),
  },
  {
    // One arrow on one cell, `dir` "up" (forward) or "down" (back), and one page number on one cell, the `at`-th of the
    // `of` the bar numbers (Grid.md D36): the numbered bar's parts, bar only for the same reason as the pair.
    kind: "pager-arrow",
    View: lazy(
      () => import("@no-origins/ui/components/grid-pager"),
      (m, props) => <m.GridPagerArrow dir={props.dir === "down" ? "down" : "up"} />,
    ),
  },
  {
    kind: "pager-page",
    View: lazy(
      () => import("@no-origins/ui/components/grid-pager"),
      (m, props) => <m.GridPagerPage at={Number(props.at ?? 0)} of={Number(props.of ?? 1)} />,
    ),
  },
]

const BY_KIND = new Map(REGISTRY.map((entry) => [entry.kind, entry]))

/** A component from the registry, drawn with its props. Unknown kinds say so rather than rendering nothing. */
export function Placed({ kind, props }: { kind: string; props?: Record<string, unknown> }) {
  const entry = BY_KIND.get(kind)
  if (!entry) {
    return (
      <div className="text-destructive border-destructive flex h-full w-full items-center justify-center border border-dashed p-2 font-mono text-[10px]">
        {kind}?
      </div>
    )
  }
  return <entry.View props={props ?? {}} />
}
