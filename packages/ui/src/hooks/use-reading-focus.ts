import * as React from "react"

/**
 * Tab and the arrow keys move focus through what can take it inside `scope`, in reading order — left to right along a
 * line, then the next line down — as the boxes stand on the screen, not as they come in the document (Grid.md D45,
 * his, 2026-09-27: "tab and up down left right buttons should move focus from left to right and top to bottom"). On
 * the grid the two differ: a page's boxes are in the order they were packed, and what is drawn behind the field comes
 * first of all.
 *
 * - **Tab** goes to the next stop and Shift+Tab to the one before; from nothing focused, to the first or the last.
 *   Past either end the browser takes it on from the scope's first or last stop in the document, so focus leaves the
 *   page rather than coming round again.
 * - **The arrows are a game controller's** (his, the same night: "I asked to make it like a game controller"): they
 *   only ever move focus. **← →** are the stop before and after, the way Tab goes; **↑ ↓** the line above and below,
 *   at the stop nearest across. From nothing focused any of them lights the first stop, and past the first or the
 *   last stop, or the top or the bottom line, they do nothing. A page that uses this turns off the grid's own keys
 *   (`GridPages`' `keyboard={false}`), so the arrows never turn it. While a grid in the scope turns, a key is dropped.
 * - A control that moves on the arrows itself keeps them — a field, a select, a slider, a menu, a radio group — and a
 *   key held with Ctrl, Alt or ⌘, or already taken, is left alone.
 *
 * A line is the stops whose top is above the middle of the line's first, so a stop set a little down in its box (the
 * avatar in its card) reads with the row it stands in. A stop is anything the browser would tab to that can be seen:
 * not disabled, not inert, not hidden from assistive technology, not transparent.
 *
 * **A group that reads after the page** (`data-reading-after`, 2026-10-03): the stops inside an element so marked come
 * after every other stop, in reading order among themselves, as a navbar after the content — a column of controls
 * standing beside a page would otherwise be read a stop at a time between the page's lines, each with the line it
 * happens to share. The portfolio's agents at home, in the field's last column, are one (Portfolio.md P24).
 */
export function useReadingFocus(scope: React.RefObject<HTMLElement | null>, enabled = true) {
  React.useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      const root = scope.current
      const arrow = ARROWS[event.key]
      if (!root || (event.key !== "Tab" && (!arrow || event.shiftKey))) return
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
      const idle = !active || active === document.body
      if (!idle && !root.contains(active)) return
      if (arrow && !idle && usesArrows(active!)) return
      // While a grid turns (Grid.md D37, `data-turn`), what stands on the field is the page going away, and a stop
      // found there is gone before it can be used, taking focus with it: the key waits out the turn, as a game drops
      // input through a screen's transition.
      if (root.querySelector('[data-turn="wash"], [data-turn="in"]')) {
        event.preventDefault()
        return
      }
      const stops = tabbables(root)
      if (!stops.length) return
      const rtl = getComputedStyle(root).direction === "rtl"
      // The focused element is placed among the stops even when it is not one (a box a click focused), so the keys go
      // on from where it stands. A group marked to read after the page follows every other line.
      const after = stops.filter((el) => el.closest(AFTER))
      const page = stops.filter((el) => !after.includes(el))
      const lines = [...readingLines(idle || stops.includes(active!) ? page : [...page, active!], rtl), ...readingLines(after, rtl)]
      const flat = lines.flat().map((box) => box.el)
      const move = (el: HTMLElement | undefined) => {
        if (!el) return false
        event.preventDefault()
        // A slot clips (Slots.md) and nothing on the grid scrolls, not even a box to show what took focus.
        el.focus({ preventScroll: true })
        return true
      }

      if (!arrow) {
        const back = event.shiftKey
        if (idle) {
          move(back ? flat[flat.length - 1] : flat[0])
          return
        }
        if (move(flat[flat.indexOf(active!) + (back ? -1 : 1)])) return
        const edge = back ? stops[0] : stops[stops.length - 1]
        if (edge !== active) edge.focus({ preventScroll: true })
        return
      }

      event.preventDefault()
      if (idle) {
        move(flat[0])
        return
      }
      if (arrow.axis === "x") {
        move(flat[flat.indexOf(active!) + (rtl ? -arrow.dir : arrow.dir)])
        return
      }
      const at = lines.findIndex((line) => line.some((box) => box.el === active))
      const line = lines[at + arrow.dir]
      if (!line) return
      const x = centreX(active!.getBoundingClientRect())
      move(line.reduce((best, box) => (Math.abs(centreX(box.r) - x) < Math.abs(centreX(best.r) - x) ? box : best)).el)
    }
    // Capture, so the keys are placed before a component's own handler takes them — the Tabs' roving ← → among them.
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [scope, enabled])
}

const ARROWS: Record<string, { axis: "x" | "y"; dir: 1 | -1 }> = {
  ArrowLeft: { axis: "x", dir: -1 },
  ArrowRight: { axis: "x", dir: 1 },
  ArrowUp: { axis: "y", dir: -1 },
  ArrowDown: { axis: "y", dir: 1 },
}

/** Marks an element whose stops read after every other (above). */
const AFTER = "[data-reading-after]"

const TABBABLE =
  "a[href], area[href], button, input, select, textarea, iframe, summary, audio[controls], video[controls], [tabindex], [contenteditable]"

function tabbables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) =>
      // A tab list is a roving group: only its chosen tab is tabbable, and the list itself hands focus on to it. Here
      // every tab is a stop and the list none — as a stop it sent Shift+Tab and ← back to the chosen tab for good, and
      // the other tabs, which only the list's own arrows reach, could not be reached at all.
      (el.tabIndex >= 0 || el.getAttribute("role") === "tab") &&
      el.getAttribute("role") !== "tablist" &&
      !el.matches(":disabled") &&
      !el.closest("[inert], [aria-hidden='true']") &&
      (el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : el.getClientRects().length > 0),
  )
}

/** Roles whose own keyboard pattern moves on the arrows (WAI-ARIA APG). */
const ARROW_ROLES = new Set([
  "combobox",
  "grid",
  "gridcell",
  "listbox",
  "menu",
  "menubar",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "radiogroup",
  "scrollbar",
  "slider",
  "spinbutton",
  "tree",
  "treegrid",
  "treeitem",
])

function usesArrows(el: HTMLElement) {
  if (el.isContentEditable || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true
  if (el instanceof HTMLInputElement) return !["button", "checkbox", "image", "reset", "submit"].includes(el.type)
  return ARROW_ROLES.has(el.getAttribute("role") ?? "")
}

type Box = { el: HTMLElement; r: DOMRect }

function readingLines(els: HTMLElement[], rtl: boolean) {
  const boxes = els.map((el) => ({ el, r: el.getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top)
  const lines: Box[][] = []
  let lead: DOMRect | null = null
  for (const box of boxes) {
    if (lead && box.r.top < lead.top + lead.height / 2) lines[lines.length - 1].push(box)
    else {
      lines.push([box])
      lead = box.r
    }
  }
  for (const line of lines) line.sort((a, b) => (rtl ? b.r.right - a.r.right : a.r.left - b.r.left))
  return lines
}

const centreX = (r: DOMRect) => r.left + r.width / 2
