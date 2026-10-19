"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { motionEase, motionMs, motionNumber } from "../lib/motion";

type ElementRef = RefObject<HTMLDivElement | null>;

/** One GSAP clock moves the viewing strip; cards keep their own stable hit areas (World.md W109). */
export function useVisorMotion(open: boolean, root: ElementRef, viewport: ElementRef) {
  const target = useRef(0);
  const closing = useRef(false);
  const nativeScroll = useRef(false);
  const closingTween = useRef<gsap.core.Tween | null>(null);
  const closingTick = useRef<(() => void) | null>(null);
  const reveal = useCallback((element: HTMLElement | null) => {
    const view = viewport.current;
    if (!element || !view) return;
    nativeScroll.current = false;
    target.current = Math.max(0, Math.min(view.scrollWidth - view.clientWidth, element.offsetLeft + element.offsetWidth / 2 - view.clientWidth / 2));
  }, [viewport]);
  const close = useCallback((done: () => void) => {
    const element = root.current;
    if (closing.current) return;
    closing.current = true;
    if (!element) { done(); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 0 : motionMs(element, "--motion-visor-exit", 240) / 1000;
    const started = performance.now();
    const fade = { opacity: Number(getComputedStyle(element).opacity) };
    const tween = gsap.to(fade, { opacity: 0, duration, ease: motionEase(element, "--motion-visor-ease"), paused: true, onUpdate: () => { element.style.opacity = String(fade.opacity); } });
    closingTween.current = tween;
    const tick = () => {
      tween.totalTime(Math.min(duration, (performance.now() - started) / 1000));
      if (performance.now() - started >= duration * 1000) {
        gsap.ticker.remove(tick); closingTick.current = null; done();
      }
    };
    closingTick.current = tick;
    if (reduced) { tween.progress(1); done(); closingTick.current = null; } else gsap.ticker.add(tick);
  }, [root]);
  useEffect(() => {
    const element = root.current, view = viewport.current;
    if (!open || !element || !view) return;
    closing.current = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const enter = motionMs(element, "--motion-visor-enter", 650) / 1000;
    const response = motionMs(element, "--motion-visor-turn", 420) / 1000;
    const speed = motionNumber(element, "--motion-visor-pan-speed", 520);
    const deadzone = motionNumber(element, "--motion-visor-deadzone", 0.12);
    const max = () => Math.max(0, view.scrollWidth - view.clientWidth);
    let position = max() / 2, previous = 0, published = Infinity;
    nativeScroll.current = false;
    let left = false, right = false;
    target.current = position; view.scrollLeft = position;
    const entered = performance.now();
    // Animate a plain value: the dialog’s Tailwind translates must remain independent of the animation.
    const fade = { opacity: 0 };
    element.style.opacity = "0";
    const opening = gsap.to(fade, { opacity: 1, duration: reduced.matches ? 0 : enter, ease: motionEase(element, "--motion-visor-ease"), paused: true, onUpdate: () => { element.style.opacity = String(fade.opacity); } });
    if (reduced.matches) opening.progress(1);
    const publish = () => {
      const value = max() ? view.scrollLeft / max() * 2 - 1 : 0;
      if (Math.abs(value - published) < 0.0002) return;
      published = value;
      window.dispatchEvent(new CustomEvent("orbit:visor-look", { detail: value }));
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced.matches || left || right || closing.current) return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width * 2 - 1;
      const amount = Math.abs(x) < deadzone ? 0 : Math.sign(x) * (Math.abs(x) - deadzone) / (1 - deadzone);
      target.current = (amount + 1) / 2 * max();
      nativeScroll.current = false;
    };
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || !["KeyA", "KeyD"].includes(event.code)) return;
      event.preventDefault(); nativeScroll.current = false;
      left = event.code === "KeyA" || left; right = event.code === "KeyD" || right;
      if (reduced.matches) { target.current = Math.max(0, Math.min(max(), view.scrollLeft + (event.code === "KeyD" ? 1 : -1) * view.clientWidth / 2)); }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "KeyA") left = false;
      if (event.code === "KeyD") right = false;
    };
    const clear = () => { left = right = false; target.current = view.scrollLeft; };
    const touch = (event: PointerEvent) => { if (event.pointerType !== "mouse") { nativeScroll.current = true; clear(); } };
    const wheel = () => { nativeScroll.current = true; clear(); };
    const visibility = () => { if (document.hidden) clear(); previous = 0; };
    const tick = () => {
      const now = performance.now() / 1000;
      if (document.hidden || closing.current) { previous = 0; return; }
      opening.totalTime(Math.min(enter, (performance.now() - entered) / 1000));
      const dt = previous ? Math.min(now - previous, 0.25) : 0;
      previous = now;
      if (nativeScroll.current) { position = target.current = view.scrollLeft; publish(); return; }
      if (!reduced.matches && (left || right)) target.current = Math.max(0, Math.min(max(), target.current + (Number(right) - Number(left)) * speed * dt));
      target.current = Math.max(0, Math.min(max(), target.current));
      position += (target.current - position) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 5 / Math.max(0.001, response)));
      if (Math.abs(position - target.current) < 0.2) position = target.current;
      view.scrollLeft = position; publish();
    };
    const resize = new ResizeObserver(() => { position = target.current = Math.min(max(), view.scrollLeft); publish(); });
    resize.observe(view);
    element.addEventListener("pointermove", move);
    view.addEventListener("pointerdown", touch);
    view.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", visibility);
    gsap.ticker.add(tick);
    return () => {
      opening.kill(); closingTween.current?.kill(); closingTween.current = null; gsap.ticker.remove(tick); resize.disconnect();
      if (closingTick.current) gsap.ticker.remove(closingTick.current); closingTick.current = null;
      element.removeEventListener("pointermove", move); view.removeEventListener("pointerdown", touch); view.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [open, root, viewport]);
  return { close, reveal };
}
