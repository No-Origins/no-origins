import type { ComponentPropsWithoutRef } from "react";
import { Blob } from "../blob/Blob";

/**
 * The wordmark — Design-System.md §4.4.
 *  - `lockup`: N [blob] RIGINS in Bowlby One caps, tracking +0.01em; the logotype blob at 0.82em with 0.06em each side.
 *    Sizes with `font-size`. Reads as one image to assistive tech: "No Origins".
 *  - `text`: the name in running text — lowercase, Hanken Grotesk 600. Never mixed with the caps lockup on one line.
 */
export interface WordmarkProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  as?: "lockup" | "text";
}

export function Wordmark({ as = "lockup", className, ...rest }: WordmarkProps) {
  const cls = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(" ");
  if (as === "text") {
    return (
      <span className={cls("noo-wordmark noo-wordmark--text", className)} {...rest}>
        no origins
      </span>
    );
  }
  return (
    <span className={cls("noo-wordmark", className)} role="img" aria-label="No Origins" {...rest}>
      <span aria-hidden="true">N</span>
      <Blob variant="logotype" className="noo-wordmark__blob" />
      <span aria-hidden="true">RIGINS</span>
    </span>
  );
}
