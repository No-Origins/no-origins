import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";

/**
 * Image (§9) — a photograph.
 *
 * **Added 2026-09-11, reversing "no real images anywhere on the platform" (Bhargav).** What the reversal does and
 * does not mean is worth being exact about, because the old rule was two rules wearing one sentence:
 *
 *   Photographs are now allowed — portraits, case-study screenshots, anything genuinely photographic.
 *   **Illustrations are still code.** The generator, the six families and the one-line grammar are unchanged
 *   (Patterns.md); nothing here makes a drawn picture shippable as a raster.
 *
 * It is a plain `<img>`, never `next/image`: §11.2 rule 1 says the package imports React and its own CSS and
 * nothing else, so an Elixir or Vite host can use it unchanged. Optimisation is the host's job, exactly as fonts
 * are — a Next host can wrap this or pass an optimised `src`.
 *
 * `alt` is **required**, including as `""`. A decorative image is a decision, and a required empty string is how
 * you make someone decide rather than forget (§12).
 *
 * `width` and `height` are required with a `ratio` fallback for the same reason: an image without intrinsic
 * dimensions shifts the layout when it loads, and §12's LCP rules assumed there were no images at all.
 */
export interface ImageProps extends Omit<ComponentPropsWithoutRef<"img">, "alt"> {
  /** Required. `""` for decorative — deliberately, not by omission. */
  alt: string;
  /** Aspect ratio as `w / h`, e.g. `3 / 2`. Reserves the box before the bytes arrive. */
  ratio?: number;
  fit?: "cover" | "contain";
  radius?: "none" | "sm" | "md" | "lg" | "xl";
  /** Softens a photograph into the palette: the hue at low opacity over it. */
  tint?: boolean;
}

export function Image({ alt, ratio, fit = "cover", radius = "lg", tint, className, style, loading = "lazy", ...rest }: ImageProps) {
  return (
    <img
      alt={alt}
      loading={loading}
      decoding="async"
      className={cx("noo-img", `noo-img--r-${radius}`, tint && "noo-img--tint", className)}
      style={{ objectFit: fit, aspectRatio: ratio, ...style }}
      {...rest}
    />
  );
}
