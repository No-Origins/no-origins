"use client";
import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Deck (§9) — a stack of cards, one of them forward.
 *
 * **It is still a scroll container.** The same argument as `Carousel`: scroll-snap gives the trackpad, the swipe,
 * the arrow keys and a screen reader's own scrolling for free, and a JS `translateX` gives none of them. What
 * this adds on top is depth — each card's distance from the centre of the track is published to CSS as `--d`,
 * and the stylesheet scales it down, pushes it back and tucks it behind its neighbour.
 *
 * So the cards overlap without the scrolling becoming a lie: the track really is scrolled, the snap points really
 * are the cards, and `--d` is a *description* of where the scroll got to rather than the thing driving it.
 *
 * `visible` is how many cards show either side of the front one — 1 gives the three of the reference, 2 gives
 * five. It sets the track's padding, so the front card stays centred whatever the number.
 *
 * Under `prefers-reduced-motion` the transforms are dropped by the stylesheet and this degrades to a plain
 * snapping row, which is the honest fallback: less depth, identical behaviour.
 */
export interface DeckProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children: ReactNode[];
  /** Cards visible either side of the front one. 1 → three across, 2 → five. */
  visible?: 0 | 1 | 2;
  /** How much a neighbour tucks under the front card, as a fraction of card width. */
  overlap?: number;
  dots?: boolean;
  /** Which card is forward on load. `"middle"` opens with a neighbour on each side, which is what a deck is for. */
  start?: number | "middle";
  /** Names the group for assistive tech — "The team", not "deck". */
  label: string;
}

export function Deck({ children, visible = 1, overlap = 0.28, dots = true, start = 0, label, className, style, ...rest }: DeckProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const count = children.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;

    const paint = () => {
      frame = 0;
      const slides = [...track.querySelectorAll<HTMLElement>(".noo-deck__slide")];
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let min = Infinity;
      slides.forEach((s, i) => {
        const centre = s.offsetLeft + s.offsetWidth / 2;
        // distance in CARD WIDTHS, so the styling is independent of how wide a card happens to be
        const d = (centre - mid) / s.offsetWidth;
        s.style.setProperty("--d", d.toFixed(3));
        s.style.setProperty("--ad", Math.min(Math.abs(d), 3).toFixed(3));
        // behind by distance: the front card must cover its neighbours, not sit between them
        s.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
        const away = Math.abs(d);
        if (away < min) { min = away; best = i; }
      });
      setCurrent(best);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };

    // Land on the starting card before the first paint the reader sees. `instant` on purpose: a deck that
    // animates itself into position on load is a deck that looks like it is loading.
    const from = start === "middle" ? Math.floor((count - 1) / 2) : start;
    const first = track.querySelectorAll<HTMLElement>(".noo-deck__slide")[from];
    if (first) {
      track.scrollTo({ left: first.offsetLeft - (track.clientWidth - first.offsetWidth) / 2, behavior: "instant" });
    }

    paint();
    track.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(paint);
    ro.observe(track);
    return () => {
      track.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [count, start]);

  const go = useCallback((i: number) => {
    const track = trackRef.current;
    const slide = track?.querySelectorAll<HTMLElement>(".noo-deck__slide")[i];
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2, behavior: "smooth" });
  }, []);

  return (
    <div
      className={cx("noo-deck", className)}
      style={{ "--deck-visible": visible, "--deck-overlap": overlap, ...style } as React.CSSProperties}
      {...rest}
    >
      <div ref={trackRef} className="noo-deck__track" tabIndex={0} role="group" aria-label={label}>
        {children.map((child, i) => (
          <div
            key={i}
            className="noo-deck__slide"
            aria-label={`${i + 1} of ${count}`}
            aria-current={i === current ? "true" : undefined}
          >
            {child}
          </div>
        ))}
      </div>

      {dots ? (
        <div className="noo-deck__dots" role="tablist" aria-label={`${label} — choose a card`}>
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Card ${i + 1} of ${count}`}
              className="noo-carousel__dot"
              onClick={() => go(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
