"use client";
import { forwardRef, useId, useRef, type CSSProperties, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type { BlobSize, Hue } from "../../tokens/tokens";
import { phaseOf, useBlink, useLook } from "./behaviour";

/**
 * The blob — Design-System.md §4 (geometry, sizes, states). Everything is drawn on a 96 × 64 box and scaled,
 * never redrawn. Flat since v1 (2026-09-16): no frost, no refraction, no rim light — the material went with the
 * glass, and the character is the colour.
 *
 *  - `character` — the hue's pastel, opaque, with a drop shadow beneath. `hue` picks it; default = the block accent.
 *  - `host` — the one with no colour: the surface itself, with a hairline, so you can tell which one is you.
 *    `hue="grey"` renders this too.
 *  - `logotype` — the outline in `currentColor`, for the wordmark and print. No motion by default.
 *
 * Behaviour is plain DOM (blink timers, one shared pointer listener, rAF) so a non-React surface can copy the SVG.
 */
export type BlobVariant = "character" | "logotype" | "host";
export type BlobState = "idle" | "sleep";

export type { BlobSize };

export interface BlobProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  variant?: BlobVariant;
  size?: BlobSize | number;
  state?: BlobState;
  /** The fill. `accent` (default) follows the block's `--accent`. Ignored by `host` and `logotype`. */
  hue?: Hue | "accent";
  /** Accessible name. Without one the blob is decorative (`aria-hidden`). */
  label?: string;
  /** Eyes close for 140ms every 4–9s. Default: on for idle characters, off for the logotype. */
  blink?: boolean;
  /** Eyes follow a pointer within 240px. Default: on for idle characters. Off under reduced motion. */
  look?: boolean;
  /** Body scales 1 → 1.03 → 1 over 6s (9s asleep). Default: on except for the logotype. */
  breathe?: boolean;
  /** Hover scale 1.04. Defaults to true when `onClick` is given. Wrap in a <button> for keyboard users. */
  interactive?: boolean;
}

export const Blob = forwardRef<HTMLSpanElement, BlobProps>(function Blob(
  { variant = "character", size = "md", state = "idle", hue = "accent", label, blink, look, breathe, interactive, className, style, ...rest },
  ref,
) {
  const id = "noo" + useId().replace(/\W/g, "");
  const outer = useRef<HTMLSpanElement | null>(null);
  const eyes = useRef<SVGGElement | null>(null);

  const isType = variant === "logotype";
  const isHost = variant === "host" || (variant === "character" && hue === "grey");
  const asleep = state === "sleep";
  const alive = !isType && !asleep;
  const doBlink = blink ?? alive;
  const doLook = look ?? alive;
  const doBreathe = breathe ?? !isType;
  const isInteractive = interactive ?? typeof rest.onClick === "function";

  useBlink(eyes, doBlink && !asleep);
  useLook(outer, eyes, doLook && !asleep);

  const setRef = (el: HTMLSpanElement | null) => {
    outer.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  const classes = [
    "noo-blob",
    `noo-blob--${variant}`,
    typeof size === "string" ? `noo-blob--${size}` : "",
    isHost ? "noo-blob--host" : "",
    asleep ? "noo-blob--sleep" : "",
    doBreathe ? "noo-blob--breathe" : "",
    isInteractive ? "noo-blob--interactive" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const vars: Record<string, string> = { "--blob-phase": `-${(phaseOf(id) * 6).toFixed(2)}s` };
  if (typeof size === "number") vars["--blob-w"] = `${size}px`;

  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  const eyeShapes: ReactNode = asleep ? (
    <>
      <rect className="noo-blob__eye" x="20" y="29.75" width="20" height="4.5" rx="2.25" />
      <rect className="noo-blob__eye" x="56" y="29.75" width="20" height="4.5" rx="2.25" />
    </>
  ) : (
    <>
      <circle className="noo-blob__eye" cx="30" cy="32" r="10" />
      <circle className="noo-blob__eye" cx="66" cy="32" r="10" />
    </>
  );

  if (isType) {
    return (
      <span ref={setRef} className={classes} style={{ ...vars, ...style } as CSSProperties} {...a11y} {...rest}>
        <svg className="noo-blob__svg" viewBox="0 0 96 64" focusable="false" aria-hidden="true">
          <rect className="noo-blob__outline" x="2.75" y="2.75" width="90.5" height="58.5" rx="29.25" fill="none" />
          <g ref={eyes} className="noo-blob__eyes">{eyeShapes}</g>
        </svg>
      </span>
    );
  }

  // `accent` is said out loud (Atomic.md D1): a blob with no data-hue would inherit its container's hue, and the default means the block's.
  const hueAttr = variant === "character" && hue !== "grey" ? hue : undefined;

  return (
    <span ref={setRef} className={classes} data-hue={hueAttr} data-state={state} style={{ ...vars, ...style } as CSSProperties} {...a11y} {...rest}>
      <span className="noo-blob__skin">
        <svg className="noo-blob__svg" viewBox="0 0 96 64" focusable="false" aria-hidden="true">
          <rect className="noo-blob__body" width="96" height="64" rx="32" />
          <rect className="noo-blob__rim" x="0.75" y="0.75" width="94.5" height="62.5" rx="31.25" fill="none" />
          <g ref={eyes} className="noo-blob__eyes">{eyeShapes}</g>
        </svg>
      </span>
    </span>
  );
});
