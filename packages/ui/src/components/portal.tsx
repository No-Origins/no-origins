"use client"

import * as React from "react"

/**
 * Where a subtree's surfaces portal to (Motion.md M8, 2026-09-27). Every component here that portals — dialog, alert
 * dialog, sheet, drawer, popover, tooltip, hover card, the dropdown and context menus, menubar, select, combobox —
 * passes `usePortalContainer()` to its portal, so a `PortalContainer` puts their surfaces inside its element instead
 * of `document.body`. With none, a portal goes to the body as it always did.
 *
 * It exists for the motion studio's stage (apps/motion): a dialog played there opens over the stage and not the
 * viewport, and inherits the motion tokens the stage overrides (M3), because it is inside the stage's element. The
 * element is the containing block for what it holds only if it makes itself one — `contain: layout` — since the
 * surfaces are `position: fixed`; that is the holder's job, not this one's.
 */
const PortalContainerContext = React.createContext<HTMLElement | null>(null)

function PortalContainer({ container, children }: { container: HTMLElement | null; children: React.ReactNode }) {
  return <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>
}

/** The element to portal into, or `undefined` for the body — what Radix's, Base UI's and vaul's portals default to. */
function usePortalContainer(): HTMLElement | undefined {
  return React.useContext(PortalContainerContext) ?? undefined
}

export { PortalContainer, usePortalContainer }
