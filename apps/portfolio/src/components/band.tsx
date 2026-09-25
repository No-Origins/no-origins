"use client";

import gsap from "gsap";
import type { ReactNode, RefObject } from "react";

import { cn } from "@no-origins/ui/lib/utils";

/**
 * The band behind a mark while the pointer is on it (Portfolio.md P13): a company on the Work screen, and since
 * 2026-09-25 a link's cell on the first screen (P4). His mock, 2026-09-25, measured off it: 1.29 of the mark wide, 0.60
 * of it tall at its upright edges, sloping up 16° to the right, centred on the mark, and in the system's lime or
 * violet, one value in both themes, alternating along the row. It is drawn like a stroke of a highlighter: in from its
 * left edge, and out through its right when the pointer leaves after it has finished, or back the way it came when it
 * leaves sooner. Touch has no hover, so it draws nothing; reduced motion shows and hides it at once.
 */
const BAND = { width: 1.29, height: 0.6, slant: -16, inS: 0.28, outS: 0.22 };

/**
 * The band itself, undrawn, centred in a box `box` px a side. Behind a company's mark it is sized off the mark, `mark`
 * px a side, and overhangs it (P13). With `edge` it is sized off the box instead — exactly its width, its upright edges
 * on the box's left and right, and 0.60 of it tall — so a small mark (a link's icon on the first screen, half its cell)
 * sits wholly on it rather than having a patch of its own size laid across it (his, 2026-09-25: "under the icon … from
 * edge to edge of the cell").
 *
 * `ink` is the mark again, drawn inside the band in a colour that reads on it, so that where the band has reached, the
 * mark is that colour and where it has not, the mark is its own (his, the same day: on lime a light icon "doesn't have
 * much contrast and feels like the band is over the icon"). It is counter-slanted about the same centre, so it lands
 * exactly on the mark under it, and it is revealed by the same sweep as the fill, so the two never part. A band with ink
 * is drawn over its mark, not under it; the ink is what shows the mark through.
 *
 * The slant is the outer span's and never moves. The sweep is a `clip-path` on the fill, in the slanted span's own
 * coordinates — so its edge stays upright, as the fill's scaled edge did — because a scale would squash the ink. Whoever
 * holds the pointer calls `drawBand` on `fill`.
 */
export function MarkBand({ box, mark, edge, accent, fill, ink }: { box: number; mark: number; edge?: boolean; accent: "lime" | "violet"; fill: RefObject<HTMLSpanElement | null>; ink?: ReactNode }) {
  const bw = edge ? box : Math.round(mark * BAND.width);
  const bh = Math.round((edge ? box : mark) * BAND.height);
  return (
    <span aria-hidden className="absolute" style={{ width: bw, height: bh, left: (box - bw) / 2, top: (box - bh) / 2, transform: `skewY(${BAND.slant}deg)` }}>
      <span ref={fill} className={cn("absolute inset-0", accent === "lime" ? "bg-lime" : "bg-violet")} style={{ clipPath: clip(HIDDEN) }}>
        {ink ? (
          <span
            className="absolute flex items-center justify-center"
            style={{ width: mark, height: mark, left: (bw - mark) / 2, top: (bh - mark) / 2, transform: `skewY(${-BAND.slant}deg)` }}
          >
            {ink}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** How much of the band is cut off at its left and at its right, in percent. Undrawn, it is all cut off at the right. */
type Sweep = { l: number; r: number };
const HIDDEN: Sweep = { l: 0, r: 100 };
const clip = ({ l, r }: Sweep) => `inset(0% ${r}% 0% ${l}%)`;
const sweeps = new WeakMap<HTMLElement, Sweep>();

/**
 * In from the left edge; out through the right edge once it is all drawn, or back the way it came if the pointer leaves
 * sooner — and, coming back while it is going out, back in from the right. The durations and eases are P13's.
 */
export function drawBand(el: HTMLElement, on: boolean) {
  const at = sweeps.get(el) ?? { ...HIDDEN };
  sweeps.set(el, at);
  gsap.killTweensOf(at);
  const write = () => {
    el.style.clipPath = clip(at);
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    Object.assign(at, on ? { l: 0, r: 0 } : HIDDEN);
    return write();
  }
  if (on) {
    if (at.l >= 100 || at.r >= 100) {
      Object.assign(at, HIDDEN);
      write();
    }
    gsap.to(at, { ...(at.l > 0 ? { l: 0 } : { r: 0 }), duration: BAND.inS, ease: "power3.out", onUpdate: write });
  } else {
    const drawn = at.l === 0 && at.r === 0;
    gsap.to(at, { ...(drawn || at.l > 0 ? { l: 100 } : { r: 100 }), duration: BAND.outS, ease: "power2.in", onUpdate: write });
  }
}
