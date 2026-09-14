"use client";
import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cx } from "../cx";
import { Dots } from "../molecules/Dots";

/**
 * Carousel (§9) — a track of slides that snaps, with the neighbours showing.
 *
 * **It is a scroll container, not a transform.** CSS scroll-snap does the snapping, so the whole thing works
 * before hydration, with the trackpad, with a touch swipe, with the keyboard's arrow keys and with a screen
 * reader's own scrolling — none of which a JS-driven `translateX` gives you for free. The script adds exactly
 * two things on top: which slide is current, and dots that scroll to one.
 *
 * `peek` is what makes the neighbours visible. It is not decoration: a slide that fills the viewport gives no
 * sign there is another one, and a dot row is a poor substitute for seeing the edge of the next card.
 *
 * Reduced motion is honoured by the stylesheet (`scroll-behavior: auto`), so a dot still moves you — instantly.
 */
export interface CarouselProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children: ReactNode[];
  /** How much of the neighbouring slides shows. `none` fills the track. */
  peek?: "none" | "sm" | "md";
  gap?: 8 | 16 | 24 | 40;
  /** The dot row. Off for a track that is scrolled rather than stepped. */
  dots?: boolean;
  /** Names the group for assistive tech — "Testimonials", not "carousel". */
  label: string;
}

export function Carousel({ children, peek = "md", gap = 24, dots = true, label, className, ...rest }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const count = children.length;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = [...track.querySelectorAll<HTMLElement>(".noo-carousel__slide")];
    // Which slide holds the middle of the track. Cheaper and steadier than IntersectionObserver thresholds,
    // which fire on every pixel of a peeking neighbour and make the dots flicker mid-scroll.
    const onScroll = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let min = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
        if (d < min) { min = d; best = i; }
      });
      setCurrent(best);
    };
    onScroll();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [count]);

  const go = useCallback((i: number) => {
    const track = trackRef.current;
    const slide = track?.querySelectorAll<HTMLElement>(".noo-carousel__slide")[i];
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2, behavior: "smooth" });
  }, []);

  return (
    <div className={cx("noo-carousel", className)} {...rest}>
      <div
        ref={trackRef}
        className={cx("noo-carousel__track", `noo-carousel__track--peek-${peek}`, `noo-carousel__track--g${gap}`)}
        // A scroll container needs a tab stop and a name, or a keyboard user cannot reach the content in it.
        tabIndex={0}
        role="group"
        aria-label={label}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="noo-carousel__slide"
            aria-label={`${i + 1} of ${count}`}
            aria-current={i === current ? "true" : undefined}
          >
            {child}
          </div>
        ))}
      </div>

      {dots ? <Dots count={count} current={current} onSelect={go} label={label} itemName="Slide" className="noo-carousel__dots" /> : null}
    </div>
  );
}
