"use client";
import { forwardRef, useId, useRef, useState, type CSSProperties, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { blobSizes, type BlobSize, type Hue } from "../../tokens/tokens";
import { measureGround, patternTransform, refractionFallback, refractionFor, sameGeometry, useGround, type RefractionGeometry } from "./grid";
import { phaseOf, useBlink, useIsomorphicLayoutEffect, useLook } from "./behaviour";

/**
 * The blob — Design-System.md §3 (material) and §4 (geometry, sizes, states).
 * Everything is drawn on a 96 × 64 box and scaled, never redrawn.
 *
 *  - `character` — tinted glass: the hue's tint at 24% (36% dark), frost 2px that mutes, one thin rim lit from −45°,
 *    the grid refracted inside the pill, a drop shadow beneath. `hue` picks the tint; default = the block accent.
 *  - `glass` — the host: the same material with nothing in it (white at 5%, rim 0.95). `hue="grey"` renders this too.
 *  - `logotype` — the outline in `currentColor`, for the wordmark and print. No material, no motion by default.
 *
 * Behaviour is plain DOM (blink timers, one shared pointer listener, rAF) so a non-React surface can copy the SVG.
 */
export type BlobVariant = "character" | "logotype" | "glass";
export type BlobState = "idle" | "sleep";

export type { BlobSize };

export interface BlobProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  variant?: BlobVariant;
  size?: BlobSize | number;
  state?: BlobState;
  /** Tint hue. `accent` (default) follows the block's `--accent-tint`. Ignored by `glass` and `logotype`. */
  hue?: Hue | "accent";
  /** Accessible name. Without one the blob is decorative (`aria-hidden`). */
  label?: string;
  /** Eyes close for 140ms every 4–9s. Default: on for idle characters, off for the logotype. */
  blink?: boolean;
  /** Eyes follow a pointer within 240px. Default: on for idle characters. Off under reduced motion. */
  look?: boolean;
  /** Body scales 1 → 1.03 → 1 over 6s (9s asleep). Default: on except for the logotype. */
  breathe?: boolean;
  /** Re-draw the dot grid inside the pill (§3 cue 4). Turn off over a solid surface, where there is no grid to bend. */
  refraction?: boolean;
  /** Hover scale 1.04. Defaults to true when `onClick` is given. Wrap in a <button> for keyboard users. */
  interactive?: boolean;
}

/** Light from −45°: the rim gradient runs top-left → bottom-right. */
const LIGHT = { x1: 0.146, y1: 0.146, x2: 0.854, y2: 0.854 };

export const Blob = forwardRef<HTMLSpanElement, BlobProps>(function Blob(
  { variant = "character", size = "md", state = "idle", hue = "accent", label, blink, look, breathe, refraction = true, interactive, className, style, ...rest },
  ref,
) {
  const id = "noo" + useId().replace(/\W/g, "");
  const outer = useRef<HTMLSpanElement | null>(null);
  const eyes = useRef<SVGGElement | null>(null);

  const isType = variant === "logotype";
  const isHost = variant === "glass" || (variant === "character" && hue === "grey");
  const asleep = state === "sleep";
  const alive = !isType && !asleep;
  const doBlink = blink ?? alive;
  const doLook = look ?? alive;
  const doBreathe = breathe ?? !isType;
  const doRefract = refraction && !isType;
  const isInteractive = interactive ?? typeof rest.onClick === "function";

  useBlink(eyes, doBlink && !asleep);
  useLook(outer, eyes, doLook && !asleep);

  // refraction — measured after layout, re-measured on resize and when fonts settle (em-sized blobs move)
  const grid = useGround();
  const [geo, setGeo] = useState<RefractionGeometry | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (!doRefract) return;
    const el = outer.current;
    if (!el) return;
    let live = true;
    const align = () => {
      if (!live) return;
      const next = refractionFor(el, grid ?? measureGround(el));
      if (next) setGeo((prev) => (sameGeometry(prev, next) ? prev : next));
    };
    align();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(align) : null;
    ro?.observe(el);
    window.addEventListener("resize", align);
    if (typeof document !== "undefined" && document.fonts?.ready) document.fonts.ready.then(align, () => {});
    return () => {
      live = false;
      ro?.disconnect();
      window.removeEventListener("resize", align);
    };
  }, [grid, doRefract]);

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

  const fallbackWidth = typeof size === "number" ? size : typeof blobSizes[size] === "number" ? (blobSizes[size] as number) : 72;
  const g = geo ?? refractionFallback(fallbackWidth);
  // `accent` is said out loud (Atomic.md D1): a blob with no data-hue would inherit its container's hue, and the default means the block's.
  const hueAttr = variant === "character" && hue !== "grey" ? hue : undefined;

  return (
    <span ref={setRef} className={classes} data-hue={hueAttr} data-state={state} style={{ ...vars, ...style } as CSSProperties} {...a11y} {...rest}>
      <span className="noo-blob__glass">
        <svg className="noo-blob__svg" viewBox="0 0 96 64" focusable="false" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-rim`} x1={LIGHT.x1} y1={LIGHT.y1} x2={LIGHT.x2} y2={LIGHT.y2}>
              <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="0.4" stopColor="#fff" stopOpacity="0.171" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.4" />
            </linearGradient>
            {doRefract && (
              <>
                <radialGradient id={`${id}-band`} cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0.32" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.92" stopColor="#fff" stopOpacity="1" />
                </radialGradient>
                <mask id={`${id}-mask`} maskContentUnits="objectBoundingBox">
                  <rect width="1" height="1" fill={`url(#${id}-band)`} />
                </mask>
                <clipPath id={`${id}-clip`}>
                  <rect width="96" height="64" rx="32" />
                </clipPath>
                {/* a CROSSING, not a dot: the ground is grid lines now, so the glass bends one of each axis */}
                <pattern id={`${id}-grid`} patternUnits="userSpaceOnUse" width={g.tile} height={g.tile} patternTransform={patternTransform(g)}>
                  <rect className="noo-blob__gline" x={g.tile / 2 - g.line / 2} y={-g.tile} width={g.line} height={g.tile * 3} />
                  <rect className="noo-blob__gline" x={-g.tile} y={g.tile / 2 - g.line / 2} width={g.tile * 3} height={g.line} />
                </pattern>
              </>
            )}
          </defs>
          <rect className="noo-blob__body" width="96" height="64" rx="32" />
          {doRefract && (
            <g className="noo-blob__ref" clipPath={`url(#${id}-clip)`} mask={`url(#${id}-mask)`}>
              <rect width="96" height="64" fill={`url(#${id}-grid)`} />
            </g>
          )}
          <rect className="noo-blob__rim" x="0.5" y="0.5" width="95" height="63" rx="31.5" fill="none" stroke={`url(#${id}-rim)`} />
          <g ref={eyes} className="noo-blob__eyes">{eyeShapes}</g>
        </svg>
      </span>
    </span>
  );
});
