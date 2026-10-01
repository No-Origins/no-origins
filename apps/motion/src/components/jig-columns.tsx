"use client";

import * as React from "react";
import { ChevronRight, GripVertical } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardHeader } from "@no-origins/ui/components/card";
import { GridItem } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import type { FamilyId } from "@/content/families";
import { useStudio, type JigArrangement } from "@/components/studio-context";
import type { StudioBox } from "@/lib/layout";

/**
 * The jigs' two columns, either side of the stage (his, 2026-10-01: "it will be nice if I can drag and drop these jigs
 * into different locations if I want to. And the component should always be in the center"). Each jig is a card with a
 * grip at the head of it: pressed and dragged, the card goes to the column and the place the pointer is over, the rest
 * making room as it passes; let go, it stays there, and the studio keeps it there for that motion (`no-origins:motion`).
 * Escape while dragging puts it back. From the keyboard, the grip's arrows move it: up and down in its column, left and
 * right to the other.
 *
 * A column stacks its cards at their own height. A card that pages its controls (`natural`, the height it needs for
 * all of them) is given the room the others leave, shared out so the smaller take what they need and the rest split
 * what is left — never squeezed past it, paged instead (Grid.md D5). **A column too short for all its cards to read**
 * (each its `min`, three lines of controls) **folds them**: one open, the rest their heading alone, and a heading pressed
 * opens its card and folds the one that was open — as Orbit's sections fold from their heading (Orbit.md C9).
 */

export type JigSpec = {
  id: string;
  title: string;
  /** Pages its controls to the room it is given; its height with all of them, px — Infinity for whatever is left. */
  natural?: number;
  /** The least it reads in, px — three lines of its controls; a column that cannot give it this folds its cards. */
  min?: number;
  /** Its height before it is measured, px, for the first arrangement's split. */
  estimate: number;
  render: (budget: number) => React.ReactNode;
};

const GAP = 12;
/** A folded card's height, px: a small card's insets, its 28px head and its border. */
const FOLDED = 70;

/** The grip a card in a column draws at its head; nothing off the columns (a phone's one jig at a time). */
const HandleContext = React.createContext<React.ReactNode>(null);
export const useJigHandle = () => React.useContext(HandleContext);

/** The width of the column a card stands in, px, or 0 where it is not known: how many controls it puts on a line. */
const WidthContext = React.createContext(0);
export const JigWidth = WidthContext.Provider;
export const useJigWidth = () => React.useContext(WidthContext);
/** Two controls on a line from this card width, px — six cells; one below it. */
export const perLineOf = (width: number) => (width === 0 || width >= 416 ? 2 : 1);

/** The jigs split into the two columns, in order, so the taller column is as short as it can be. */
export function balanced(jigs: readonly JigSpec[]): JigArrangement {
  let best = { split: jigs.length, worst: Infinity };
  for (let split = 0; split <= jigs.length; split++) {
    const sum = (list: readonly JigSpec[]) => list.reduce((total, jig) => total + jig.estimate + GAP, 0);
    const worst = Math.max(sum(jigs.slice(0, split)), sum(jigs.slice(split)));
    if (worst < best.worst) best = { split, worst };
  }
  return { left: jigs.slice(0, best.split).map((j) => j.id), right: jigs.slice(best.split).map((j) => j.id) };
}

/** What he left, held to the jigs there are: one gone is dropped, a new one goes where the split would put it. */
function settle(ids: readonly string[], saved: JigArrangement | undefined, start: JigArrangement): JigArrangement {
  if (!saved || !Array.isArray(saved.left) || !Array.isArray(saved.right)) return start;
  const known = new Set(ids);
  const left = saved.left.filter((id) => known.has(id));
  const right = saved.right.filter((id) => known.has(id) && !left.includes(id));
  for (const id of ids) if (!left.includes(id) && !right.includes(id)) (start.left.includes(id) ? left : right).push(id);
  return { left, right };
}

type Side = keyof JigArrangement;

/** The arrangement with `id` taken out and put at `index` of `side`. */
function place(a: JigArrangement, id: string, side: Side, index: number): JigArrangement {
  const without = { left: a.left.filter((x) => x !== id), right: a.right.filter((x) => x !== id) };
  const column = [...without[side]];
  column.splice(Math.max(0, Math.min(index, column.length)), 0, id);
  return { ...without, [side]: column };
}

const same = (a: JigArrangement, b: JigArrangement) => a.left.join() === b.left.join() && a.right.join() === b.right.join();

/**
 * The room each paged card is given: what the column has once its fixed cards and gaps are taken, shared out smallest
 * first — a card that needs less than an even share takes what it needs, and the rest split what is left.
 */
function shares(room: number, naturals: readonly number[]) {
  const out = naturals.map(() => 0);
  let left = naturals.length;
  for (const [natural, i] of naturals.map((n, i) => [n, i] as const).sort((a, b) => a[0] - b[0])) {
    const give = Math.max(0, Math.min(natural, room / left));
    out[i] = give;
    room -= give;
    left--;
  }
  return out;
}

/** An element's height as laid out, following it as it changes. */
function useMeasured() {
  const [heights, setHeights] = React.useState<Record<string, number>>({});
  const observers = React.useRef(new Map<string, ResizeObserver>());
  // One ref a card, kept, so a render does not let go of the element and measure it again.
  const refs = React.useRef(new Map<string, (el: HTMLDivElement | null) => void>());
  const refFor = React.useCallback((id: string) => {
    let ref = refs.current.get(id);
    if (!ref) {
      ref = (el: HTMLDivElement | null) => {
        observers.current.get(id)?.disconnect();
        observers.current.delete(id);
        if (!el) return;
        const measure = () => {
          // A folded card is its heading: its height is what it takes open, measured while it was.
          if (el.dataset.folded !== undefined) return;
          const h = Math.round(el.getBoundingClientRect().height);
          setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
        };
        // The observer measures it as soon as it has been laid out, and again as it changes.
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        observers.current.set(id, observer);
      };
      refs.current.set(id, ref);
    }
    return ref;
  }, []);
  React.useEffect(() => () => observers.current.forEach((o) => o.disconnect()), []);
  return [heights, refFor] as const;
}

/** A folded jig: its grip and its heading, which opens it. */
function FoldedJig({ title, grip, onOpen }: { title: string; grip: React.ReactNode; onOpen: () => void }) {
  return (
    <Card size="sm" className="h-fit shrink-0 gap-3 shadow-none [--card-spacing:--spacing(4)]">
      <CardHeader className="flex h-7 items-center gap-1">
        {grip}
        <Button size="xs" variant="ghost" className="-ms-1 h-7 min-w-0 justify-start px-2" aria-expanded={false} aria-label={`Open ${title}`} onClick={onOpen}>
          <ChevronRight /> <span className="truncate">{title}</span>
        </Button>
      </CardHeader>
    </Card>
  );
}

export function JigColumns({ family, jigs, boxes, pitch, gap }: {
  family: FamilyId;
  jigs: readonly JigSpec[];
  boxes: readonly [StudioBox, StudioBox];
  pitch: number;
  gap: number;
}) {
  const studio = useStudio();
  const ids = jigs.map((j) => j.id);
  const start = React.useMemo(() => balanced(jigs), [jigs]);
  const current = settle(ids, studio.jigsOf(family), start);
  const [drag, setDrag] = React.useState<{ id: string; arrangement: JigArrangement } | null>(null);
  const shown = drag?.arrangement ?? current;
  const [said, setSaid] = React.useState("");
  const [heights, refFor] = useMeasured();
  const columns = React.useRef<Record<Side, HTMLDivElement | null>>({ left: null, right: null });
  // The card open in each column where it folds: the one he last opened there, else its first.
  const [open, setOpen] = React.useState<Partial<Record<Side, string>>>({});
  const refocus = React.useRef<string | null>(null);

  const commit = React.useCallback((next: JigArrangement, id: string) => {
    if (!same(next, current)) studio.setJigs(family, same(next, start) ? null : next);
    const side: Side = next.left.includes(id) ? "left" : "right";
    const title = jigs.find((j) => j.id === id)?.title ?? id;
    setSaid(`${title}: ${side} of the stage, ${next[side].indexOf(id) + 1} of ${next[side].length}`);
  }, [current, start, studio, family, jigs]);

  // The grip a card was moved by from the keyboard keeps the focus, in whichever column the card is now.
  React.useLayoutEffect(() => {
    if (!refocus.current) return;
    document.querySelector<HTMLElement>(`[data-jig-grip="${CSS.escape(refocus.current)}"]`)?.focus();
    refocus.current = null;
  });

  /** Where a card dragged to (x, y) would go: the column nearer the pointer, before the first card whose middle is below it. */
  const targetOf = (x: number, y: number, id: string): { side: Side; index: number } | null => {
    const { left, right } = columns.current;
    if (!left || !right) return null;
    const middle = (left.getBoundingClientRect().right + right.getBoundingClientRect().left) / 2;
    const side: Side = x < middle ? "left" : "right";
    const cards = [...columns.current[side]!.querySelectorAll<HTMLElement>(":scope > [data-jig-id]")].filter((el) => el.dataset.jigId !== id);
    const index = cards.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2 < y;
    }).length;
    return { side, index };
  };

  const startDrag = (event: React.PointerEvent, id: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    let preview = current;
    setDrag({ id, arrangement: preview });
    // On the window, not the grip: a card that changes column is drawn again, and its grip with it.
    const move = (e: PointerEvent) => {
      const target = targetOf(e.clientX, e.clientY, id);
      if (!target) return;
      const next = place(preview, id, target.side, target.index);
      if (same(next, preview)) return;
      preview = next;
      setDrag({ id, arrangement: next });
    };
    const end = (keep: boolean) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key, true);
      setDrag(null);
      if (keep) commit(preview, id);
    };
    const up = () => end(true);
    const cancel = () => end(false);
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      end(false);
      setSaid("Put back");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key, true);
  };

  const keyMove = (event: React.KeyboardEvent, id: string) => {
    const side: Side = current.left.includes(id) ? "left" : "right";
    const index = current[side].indexOf(id);
    const to: { side: Side; index: number } | null =
      event.key === "ArrowUp" ? { side, index: index - 1 }
      : event.key === "ArrowDown" ? { side, index: index + 1 }
      : event.key === "ArrowLeft" ? { side: "left", index }
      : event.key === "ArrowRight" ? { side: "right", index }
      : null;
    if (!to) return;
    event.preventDefault();
    // Arrows never turn anything else from a grip.
    event.stopPropagation();
    if (to.side === side && (to.index < 0 || to.index >= current[side].length)) return;
    const next = place(current, id, to.side, to.index);
    if (same(next, current)) return;
    refocus.current = id;
    commit(next, id);
  };

  const height = (b: StudioBox) => b.rowSpan * pitch - gap;
  const width = (b: StudioBox) => b.colSpan * pitch - gap;
  const byId = new Map(jigs.map((j) => [j.id, j]));

  return (
    <>
      {(["left", "right"] as const).map((side, i) => {
        const b = boxes[i]!;
        const list = shown[side].map((id) => byId.get(id)!).filter(Boolean);
        const gaps = GAP * Math.max(0, list.length - 1);
        const fixedHeight = (j: JigSpec) => heights[j.id] ?? j.estimate;
        const least = list.reduce((sum, j) => sum + (j.natural === undefined ? fixedHeight(j) : Math.min(j.natural, j.min ?? j.natural)), 0);
        const folds = list.length > 1 && least + gaps > height(b);
        const opened = folds ? (list.find((j) => j.id === open[side]) ?? list[0]!).id : null;
        const paged = list.filter((j) => j.natural !== undefined);
        const fixed = list.filter((j) => j.natural === undefined).reduce((sum, j) => sum + fixedHeight(j), 0);
        const given = shares(height(b) - fixed - gaps, paged.map((j) => j.natural!));
        const budgetOf = (j: JigSpec) =>
          j.natural === undefined ? Infinity : folds ? height(b) - FOLDED * (list.length - 1) - gaps : given[paged.indexOf(j)]!;
        return (
          <GridItem key={side} {...b} data-studio-part={`jigs-${side}`}>
            <Slot fill="transparent" inset={0}>
              <JigWidth value={width(b)}>
                <div
                  ref={(el) => void (columns.current[side] = el)}
                  data-jig-column={side}
                  className={cn("flex h-full min-h-0 flex-col gap-3", drag && "select-none")}
                >
                  {list.map((jig) => {
                    const dragging = drag?.id === jig.id;
                    const grip = (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="-ms-1 shrink-0 touch-none"
                        data-jig-grip={jig.id}
                        aria-label={`Move ${jig.title}`}
                        aria-roledescription="draggable"
                        title="Drag to move it, to either side of the stage. Arrows move it too."
                        aria-pressed={dragging}
                        onPointerDown={(e) => startDrag(e, jig.id)}
                        onKeyDown={(e) => keyMove(e, jig.id)}
                      >
                        <GripVertical />
                      </Button>
                    );
                    const folded = opened !== null && opened !== jig.id;
                    return (
                      <div
                        key={jig.id}
                        ref={jig.natural === undefined ? refFor(jig.id) : undefined}
                        data-jig-id={jig.id}
                        data-folded={folded ? "" : undefined}
                        data-dragging={dragging ? "" : undefined}
                        className="flex min-h-0 shrink-0 flex-col [&>[data-slot=slot]]:h-auto data-dragging:[&_[data-slot=card]]:border-secondary"
                      >
                        {folded ? <FoldedJig title={jig.title} grip={grip} onOpen={() => setOpen((o) => ({ ...o, [side]: jig.id }))} />
                          : <HandleContext.Provider value={grip}>{jig.render(budgetOf(jig))}</HandleContext.Provider>}
                      </div>
                    );
                  })}
                  {side === "left" ? <Text role="caption" className="sr-only" aria-live="polite">{said}</Text> : null}
                </div>
              </JigWidth>
            </Slot>
          </GridItem>
        );
      })}
    </>
  );
}
