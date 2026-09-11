"use client";
import { useEffect, useLayoutEffect, type RefObject } from "react";

/** Plain DOM behaviour (§11.2 rule 4): blink and look run on timers, one shared pointer listener and rAF. */

export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Deterministic 0..1 from a string — the breathe phase has to agree between server and client render. */
export function phaseOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const between = (a: number, b: number) => a + Math.random() * (b - a);

/** blink — scaleY 1 → 0.1 → 1 over 140ms, every 4–9s; 8–14s under reduced motion. Random per blob, never in sync. */
export function useBlink(eyes: RefObject<SVGGElement | null>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let next: ReturnType<typeof setTimeout> | undefined;
    let open: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      next = setTimeout(blink, prefersReducedMotion() ? between(8000, 14000) : between(4000, 9000));
    };
    const blink = () => {
      const el = eyes.current;
      if (el) {
        el.classList.add("is-blinking");
        open = setTimeout(() => el.classList.remove("is-blinking"), 200);
      }
      schedule();
    };
    schedule();
    return () => {
      if (next) clearTimeout(next);
      if (open) clearTimeout(open);
      eyes.current?.classList.remove("is-blinking");
    };
  }, [eyes, enabled]);
}

type Looker = (x: number, y: number) => void;
const lookers = new Set<Looker>();
let frame = 0;
let px = 0;
let py = 0;
function onMove(e: PointerEvent) {
  px = e.clientX;
  py = e.clientY;
  if (!frame) frame = requestAnimationFrame(flush);
}
function flush() {
  frame = 0;
  lookers.forEach((fn) => fn(px, py));
}
function subscribe(fn: Looker): () => void {
  if (lookers.size === 0) window.addEventListener("pointermove", onMove, { passive: true });
  lookers.add(fn);
  return () => {
    lookers.delete(fn);
    if (lookers.size === 0) {
      window.removeEventListener("pointermove", onMove);
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }
  };
}

/** Pointer within this many pixels of the blob's centre → the eyes follow it. */
export const LOOK_RANGE = 240;
/** …by at most this many user units (of the 96 × 64 box). */
export const LOOK_REACH = 3;

/** look — eyes translate toward the pointer; the CSS transition (240ms) does the easing. Off under reduced motion. */
export function useLook(outer: RefObject<HTMLElement | null>, eyes: RefObject<SVGGElement | null>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    let looking = false;
    return subscribe((x, y) => {
      const el = outer.current;
      const g = eyes.current;
      if (!el || !g) return;
      const r = el.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > LOOK_RANGE) {
        if (looking) {
          g.style.transform = "";
          looking = false;
        }
        return;
      }
      const k = (LOOK_REACH * Math.min(1, d / 48)) / (d || 1);
      g.style.transform = `translate(${(dx * k).toFixed(2)}px, ${(dy * k).toFixed(2)}px)`;
      looking = true;
    });
  }, [outer, eyes, enabled]);
}
