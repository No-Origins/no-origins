import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";
import type { Hue } from "../tokens/tokens";

/**
 * Steps (§9) — a numbered sequence on a rule.
 *
 * **The numbering is a CSS counter, not a prop.** An `index` on each step is a number that can disagree with the
 * order it is rendered in, and under free composition that disagreement is one drag away. The counter cannot be
 * wrong: reorder the steps and they renumber themselves.
 *
 * The rule between markers is drawn by the step, not by the container, so it stops at the last one without the
 * container having to know how many there are — `:not(:last-child)` does what a `steps.length` check would.
 *
 * Structure is information (Patterns.md principle 8 in another key): use this only where the order is real
 * and the reader needs it. A list of four features is a list, not a sequence, and numbering it is decoration.
 */
export interface StepsProps extends ComponentPropsWithoutRef<"ol"> {
  /** The rule and the markers. Defaults to the block accent. */
  hue?: Hue;
  /** Across instead of down. Below `sm` it stacks regardless — four columns of prose on a phone is unreadable. */
  orientation?: "vertical" | "horizontal";
}

export function Steps({ hue, orientation = "vertical", className, ...rest }: StepsProps) {
  return (
    <ol
      className={cx("noo-steps", orientation === "horizontal" && "noo-steps--across", className)}
      data-hue={hue ?? "accent"}
      {...rest}
    />
  );
}

export interface StepProps extends Omit<ComponentPropsWithoutRef<"li">, "title"> {
  title: ReactNode;
  children?: ReactNode;
}

export function Step({ title, children, className, ...rest }: StepProps) {
  return (
    <li className={cx("noo-step", className)} {...rest}>
      {/* aria-hidden: the number is the ordered list's job to announce, and saying it twice is worse than once */}
      <span className="noo-step__marker" aria-hidden="true" />
      <div className="noo-step__body">
        <p className="noo-h4 noo-step__title">{title}</p>
        {children ? <div className="noo-body-sm noo-step__text">{children}</div> : null}
      </div>
    </li>
  );
}
