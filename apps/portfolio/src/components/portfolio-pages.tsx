"use client";

import * as React from "react";

import { countFor, DEFAULT_GRID_CONFIG, Grid, GRID_REFERENCE_BOX, GridItem, specFor } from "@no-origins/ui/components/grid";
import { useReadingFocus } from "@no-origins/ui/hooks/use-reading-focus";

import { AgentHome, AgentPill, AgentSpot, useAgentPill } from "@/components/agent-pill";
import { STATUS_CELLS, StatusPill } from "@/components/status-pill";
import type { PortfolioField, PortfolioPage } from "@/content";
import { INTRO_ACTIONS } from "@/content/actions";
import { INTRO_CAST } from "@/content/intro";
import { PAGE_TITLES, PAGES } from "@/content/site";
import { AGENT_PILL_CELLS, arrangeAgent } from "@/lib/arrange";

/** The field assumed before the grid has measured itself: the xl reference box, bare — the portfolio has no chrome above the grid. */
const XL = GRID_REFERENCE_BOX.xl;
const XL_SPEC = specFor(DEFAULT_GRID_CONFIG, "xl");
const FIRST_FIELD: PortfolioField = {
  bp: "xl",
  cols: countFor(XL.width, XL_SPEC.cell, XL_SPEC.gap),
  rows: countFor(XL.height, XL_SPEC.cell, XL_SPEC.gap),
};

/**
 * One scroll is one turn (P24): a wheel turns the page on its first event, and nothing more of that gesture turns it — a trackpad's fling goes on sending events for a
 * second or more. A new gesture is a wheel event after this long with none.
 */
const WHEEL_GAP_MS = 200;
/** A wheel event smaller than this, in px, is a hand resting on the trackpad, not a scroll. */
const WHEEL_MIN_PX = 4;
/** A swipe shorter than this, in px, is a tap. */
const SWIPE_MIN_PX = 40;

/**
 * The portfolio on the grid, ONE AGENT'S SECTION A PAGE (Portfolio.md P24): whichever agent is in focus dives in to
 * show its section, and on a turn it dives back home and the next agent dives in.
 *
 * A `Grid`, not a `GridPages` — there is no bar, and the turn is the agents' (Grid.md D50). The page on the
 * field is `PAGES[shown]`, arranged alone (`arrangeAgent`); the page asked for is `PAGES[want]`, the grid's `introFocus`.
 * They differ while the page turns: the section on the field fades away as its agent dives home, the grid asks for the
 * next one (`onIntroFocus`) and its agent dives in. The intro opens on Bali's: the six stand in their row,
 * Bali, Kino and Mira bounce, then Bali goes into the centre of the profile and the rest go home to the field's last
 * column — its bottom row on a phone.
 *
 * **What turns it**: the wheel or a trackpad, either way, one gesture one turn — a positive delta is forward, never
 * negated (Grid.md D27): fingers moving up or left on a trackpad, a wheel turned toward you; a swipe, a finger moving
 * left or up; Page Down and Page Up; **and a click on an agent at home**, which turns straight to its page
 * (`AgentHome` on every home cell but the empty one of the agent on the field, `homes` from `arrangeAgent`). Nothing turns
 * it while it is turning or while the intro plays, and the first and last pages go no further. The arrows still move
 * focus in reading order (Grid.md D45), and a swipe across the projects' carousel turns the carousel.
 *
 * **The agent of the page** stands in one cell on every page of a wide field — the third row from the bottom, at its
 * centre — and below its section on a phone (`stand`), where the grid draws it (`introFocusAt`). Hovering it opens its
 * pill beside it (`AgentSpot`, `AgentPill`, `useAgentPill`): its name, a chat button and ↗ to Orbit. A click on it — a
 * tap, Enter — plays his Bounce where it stands (`introAct`), as the intro plays it, never while it is in the air or the page is turning.
 * Leaving the agent and the pill, Escape, a press anywhere else or a turn closes it; a tap or the keys open it where
 * there is no hover.
 */
export function PortfolioPages({ page }: { page: PortfolioPage }) {
  const [field, setField] = React.useState<PortfolioField | null>(null);
  // The page asked for and the page on the field (P24).
  const [want, setWant] = React.useState(0);
  const [shown, setShown] = React.useState(0);
  // The agent's pill, opened by hover, and its bounce, each press of it (P24).
  const [bounces, setBounces] = React.useState(0);
  const pill = useAgentPill(React.useCallback(() => setBounces((n) => n + 1), []));
  const { open, close, dismiss } = pill;
  const closeRef = React.useRef(close);
  React.useEffect(() => {
    closeRef.current = close;
  }, [close]);
  const pillId = React.useId();
  const arranged = React.useMemo(() => arrangeAgent(page, field ?? FIRST_FIELD, PAGES[shown]!, INTRO_CAST.length), [page, field, shown]);
  const items = React.useMemo(() => new Map(page.sections.flatMap((s) => s.items).map((item) => [item.id, item])), [page]);
  // Tab and the arrows move focus in reading order (Grid.md D45).
  const scope = React.useRef<HTMLDivElement>(null);
  useReadingFocus(scope);
  const grid = React.useRef<HTMLDivElement>(null);

  // The turn's triggers (P24).
  const asked = React.useRef({ want: 0, shown: 0 });
  React.useEffect(() => {
    asked.current.shown = shown;
  }, [shown]);
  // A turn straight to a page: what a click on an agent at home asks for.
  const turnTo = React.useRef<(next: number) => void>(() => undefined);
  React.useEffect(() => {
    const el = grid.current;
    if (!el) return;
    const goTo = (next: number) => {
      // Not while the intro plays or a page turns.
      if (el.hasAttribute("data-intro") || el.hasAttribute("data-intro-turn") || asked.current.want !== asked.current.shown) return;
      if (next < 0 || next >= PAGES.length || next === asked.current.want) return;
      asked.current.want = next;
      closeRef.current();
      setWant(next);
    };
    turnTo.current = goTo;
    const go = (step: 1 | -1) => goTo(Math.min(PAGES.length - 1, Math.max(0, asked.current.want + step)));
    let last = -Infinity;
    let armed = true;
    const wheel = (e: WheelEvent) => {
      // A dialog over the page keeps its own wheel.
      if (!(e.target instanceof Node) || !el.contains(e.target)) return;
      if (e.timeStamp - last > WHEEL_GAP_MS) armed = true;
      last = e.timeStamp;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!armed || (e.deltaMode === 0 && Math.abs(d) < WHEEL_MIN_PX) || d === 0) return;
      armed = false;
      go(d > 0 ? 1 : -1);
    };
    let from: { x: number; y: number; carousel: boolean } | null = null;
    const touchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      from = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY, carousel: !!(e.target as Element | null)?.closest?.('[data-slot="carousel"]') } : null;
    };
    const touchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!from || !t) return;
      const dx = t.clientX - from.x;
      const dy = t.clientY - from.y;
      const across = Math.abs(dx) > Math.abs(dy);
      const far = Math.max(Math.abs(dx), Math.abs(dy)) >= SWIPE_MIN_PX;
      // Across the carousel, the carousel turns.
      if (far && !(across && from.carousel)) go((across ? -dx : -dy) > 0 ? 1 : -1);
      from = null;
    };
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      // A dialog over the page keeps its keys, as it keeps its wheel.
      if ((e.target as Element | null)?.closest?.('[role="dialog"], [role="alertdialog"]')) return;
      if (e.key === "PageDown") go(1);
      else if (e.key === "PageUp") go(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("wheel", wheel, { passive: true });
    el.addEventListener("touchstart", touchStart, { passive: true });
    el.addEventListener("touchend", touchEnd, { passive: true });
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("wheel", wheel);
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchend", touchEnd);
      window.removeEventListener("keydown", key);
    };
  }, []);

  // The pill closes on Escape, back to the agent, and on a press anywhere but on it or the agent — a finger's way out.
  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const at = e.target as Element | null;
      if (!at?.closest?.("[data-agent-pill], [data-agent-spot]")) close();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", key);
    };
  }, [open, close, dismiss]);

  const onIntroFocus = React.useCallback((agent: string) => setShown(Math.max(0, PAGES.indexOf(agent as (typeof PAGES)[number]))), []);
  const onMetrics = React.useCallback(
    (m: { cols: number; rows: number; bp: PortfolioField["bp"] }) =>
      setField((prev) => (prev && prev.cols === m.cols && prev.rows === m.rows && prev.bp === m.bp ? prev : { cols: m.cols, rows: m.rows, bp: m.bp })),
    [],
  );

  return (
    <div ref={scope} className="relative" data-portfolio-page={PAGES[shown]}>
      <Grid
        ref={grid}
        overlay
        intro
        introAgents={INTRO_CAST}
        introActions={INTRO_ACTIONS}
        introFocus={PAGES[want]}
        onIntroFocus={onIntroFocus}
        introFocusAt={field ? arranged.stand : undefined}
        introAct={bounces ? { agent: PAGES[shown]!, action: "bounce", key: bounces } : undefined}
        cursor
        onMetrics={onMetrics}
      >
        {/* Only once the grid has measured: the first field is a guess, and a box placed on it would flash in the wrong
            cells for a frame. */}
        {field
          ? arranged.items.map((placed) => (
              <GridItem
                key={placed.id}
                col={placed.col}
                row={placed.row}
                colSpan={placed.colSpan}
                rowSpan={placed.rowSpan}
                data-box={placed.id}
                data-intro-by={items.get(placed.id)?.by}
                className="relative select-none"
              >
                {items.get(placed.id)?.render(placed)}
              </GridItem>
            ))
          : null}
        {/* The agent's cell, to click, and the pill it opens beside it. */}
        {field && arranged.stand ? (
          <GridItem col={arranged.stand.col} row={arranged.stand.row} colSpan={1} rowSpan={1} data-box="agent" data-intro-fixed className="relative" {...pill.spot}>
            <AgentSpot id={PAGES[shown]!} open={open} controls={pillId} />
          </GridItem>
        ) : null}
        {/* The agents at home, each a way to its page: a spot on every home cell but the empty one of the agent on the field. The keys read the column after the
            section (`data-reading-after`, Grid.md D45), not a cell at a time between its lines. */}
        {field && arranged.homes
          ? PAGES.map((id, i) => {
              const home = arranged.homes?.[i];
              return home && i !== shown ? (
                <GridItem key={id} col={home.col} row={home.row} colSpan={1} rowSpan={1} data-box="agent-home" data-intro-fixed data-reading-after className="relative">
                  <AgentHome id={id} title={PAGE_TITLES[id]} onClick={() => turnTo.current(i)} />
                </GridItem>
              ) : null;
            })
          : null}
        {/* The status pill (P25), a fixture: on the corner cell, with the two it grows into to its left. */}
        {field && arranged.status ? (
          <GridItem
            col={Math.max(1, arranged.status.col - STATUS_CELLS + 1)}
            row={arranged.status.row}
            colSpan={STATUS_CELLS}
            rowSpan={1}
            data-box="status"
            data-intro-fixed
            className="relative"
          >
            <StatusPill />
          </GridItem>
        ) : null}
        {field && open && arranged.pill ? (
          <GridItem
            col={arranged.pill.col}
            row={arranged.pill.row}
            colSpan={AGENT_PILL_CELLS}
            rowSpan={1}
            data-box="agent-pill"
            data-intro-fixed
            className="relative"
            {...pill.pill}
          >
            <AgentPill id={PAGES[shown]!} domId={pillId} />
          </GridItem>
        ) : null}
      </Grid>
    </div>
  );
}
