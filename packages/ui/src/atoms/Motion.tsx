"use client";
import { useSyncExternalStore, type ComponentPropsWithoutRef, type CSSProperties, type ElementType } from "react";
import { cx } from "../cx";
import type { MotionPattern } from "../tokens/motion";

/**
 * Motion (Design-System.md §7) — one of the system's named patterns, applied to whatever it wraps.
 *
 * `rise` for an arrival, `pop` for a bubble, `breathe` for something alive, `lift` for a surface under a pointer.
 * The classes in motion.css do the work; this atom exists so a pattern is a thing a document can name and the
 * catalogue can show, not a class an app has to remember. `delay` staggers siblings by hand where `:nth-child`
 * cannot see them. Every pattern is off under `prefers-reduced-motion`, with no opt-out.
 */
export type MotionEffect = Exclude<MotionPattern, "blink">;

export interface MotionProps extends ComponentPropsWithoutRef<"div"> {
  as?: ElementType;
  effect: MotionEffect;
  /** Milliseconds before the pattern starts; a sibling's stagger. */
  delay?: number;
}

export function Motion({ as, effect, delay, className, style, ...rest }: MotionProps) {
  const Tag: ElementType = as ?? "div";
  const delayed: CSSProperties | undefined = delay ? { animationDelay: `${delay}ms` } : undefined;
  return <Tag className={cx(`noo-${effect}`, className)} style={{ ...delayed, ...style }} {...rest} />;
}

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined;
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const read = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches;
const serverRead = () => false;

/** The reduced-motion preference, live: a script that animates asks this before it moves anything. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, serverRead);
}
