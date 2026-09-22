"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

/**
 * Switching the theme is a FLIP of the field when a grid is on the page (Grid-v2.md D28, 2026-09-21): the cells close
 * over the page in the new theme's colours, row by row from the top, the theme changes underneath, and they open
 * again. The grid does the flipping; this provider only knows that something may want to. A grid registers a flipper
 * here, and every toggle — the `d` key, the showcase's button — goes through `useThemeToggle`, which hands the switch
 * to the flipper when there is one and switches at once when there is not.
 */
export type ThemeFlipper = (next: "light" | "dark", commit: () => void) => void

type ThemeFlipRegistry = {
  flipper: React.RefObject<ThemeFlipper | null>
  register: (flipper: ThemeFlipper) => () => void
}

const ThemeFlipContext = React.createContext<ThemeFlipRegistry | null>(null)

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const flipper = React.useRef<ThemeFlipper | null>(null)
  const registry = React.useMemo<ThemeFlipRegistry>(
    () => ({
      flipper,
      register: (next) => {
        flipper.current = next
        return () => {
          if (flipper.current === next) flipper.current = null
        }
      },
    }),
    [],
  )

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeFlipContext.Provider value={registry}>
        <ThemeHotkey />
        {children}
      </ThemeFlipContext.Provider>
    </NextThemesProvider>
  )
}

/** A grid calls this to take over the theme switch while it is mounted. The last grid to register wins. */
function useThemeFlipRegistry() {
  return React.useContext(ThemeFlipContext)
}

/** The one way to toggle the theme: through the grid's flip when a grid is on the page, at once otherwise. */
function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const registry = React.useContext(ThemeFlipContext)
  return React.useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark"
    const flip = registry?.flipper.current
    if (flip) flip(next, () => setTheme(next))
    else setTheme(next)
  }, [resolvedTheme, setTheme, registry])
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const toggle = useThemeToggle()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      toggle()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [toggle])

  return null
}

export { ThemeProvider, useThemeToggle, useThemeFlipRegistry }
