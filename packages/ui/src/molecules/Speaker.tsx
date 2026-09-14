import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Blob, type BlobProps } from "../atoms/blob/Blob";
import { Bubble } from "../atoms/Bubble";
import type { BlobSize, Hue } from "../tokens/tokens";
import { cx } from "../cx";

/**
 * Speaker (§9) — a blob with its bubble: the pairing the brand is built on, named.
 *
 * The bubble sits top-right of the blob with an 8px gap in a page; `below` puts it under the blob for a narrow
 * column. `BlobNode` renders this in document mode; the fixtures and the About panel used to build it by hand.
 * The blob is the mark for an agent (Brand.md §9), so this is for something that speaks — never decoration.
 */
export interface SpeakerProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** Names the blob for assistive tech — "Bhargav", "the editor". */
  label: string;
  hue?: Hue;
  variant?: BlobProps["variant"];
  state?: BlobProps["state"];
  size?: BlobSize;
  /** What it says. Without one it is a blob alone. */
  say?: ReactNode;
  /** Tint for the bubble; default is plain glass. */
  tint?: Hue;
  below?: boolean;
  /** Play bubble-pop on mount. */
  pop?: boolean;
  interactive?: boolean;
}

export function Speaker({ label, hue, variant = "character", state, size = "md", say, tint, below, pop, interactive, className, ...rest }: SpeakerProps) {
  return (
    <div className={cx("noo-speaker", `noo-speaker--${size}`, below && "noo-speaker--below", className)} {...rest}>
      <Blob variant={variant} hue={hue} state={state} size={size} label={label} interactive={interactive} />
      {say ? (
        <Bubble tint={tint} pop={pop} className="noo-speaker__bubble">
          {say}
        </Bubble>
      ) : null}
    </div>
  );
}
