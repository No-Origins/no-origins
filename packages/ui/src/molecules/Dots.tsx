"use client";
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";

/**
 * Dots (§9) — the pagination row under a `Carousel` or a `Deck`: one dot per item, the current one stretched to a
 * bar. Each dot is 8px and reaches the 44px hit target through a pseudo-element (§12).
 *
 * A tablist, because that is what it is: the dots select which item is shown, and a screen reader announces
 * "Slide 2 of 5, tab, selected". `itemName` is the word that announcement uses — "Slide", "Card".
 */
export interface DotsProps extends Omit<ComponentPropsWithoutRef<"div">, "onSelect" | "children"> {
  count: number;
  current: number;
  onSelect: (index: number) => void;
  /** Names the group — "Testimonials", "The team". */
  label: string;
  itemName?: string;
}

export function Dots({ count, current, onSelect, label, itemName = "Item", className, ...rest }: DotsProps) {
  return (
    <div className={cx("noo-dots", className)} role="tablist" aria-label={`${label} — choose one`} {...rest}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === current}
          aria-label={`${itemName} ${i + 1} of ${count}`}
          className="noo-dots__dot"
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
