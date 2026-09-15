import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Hue } from "../../tokens/tokens";
import { cx } from "../../cx";
import { SIZE, bands, pebbles, polar, ring, rosette, spiral, stack } from "./primitives";
import { illo, type Family } from "./generator";
import { patterns, type PatternName } from "./patterns";

/**
 * Pattern (Patterns.md) — a named picture, drawn by code from the grammar in primitives.ts.
 *
 * A fine line in one hue, never a fill (principles 1–2). No two lines in a picture cross or touch (principle 3).
 * EVERY line in a picture has the same weight and the same colour (Bhargav, 2026-09-11) — there are no depths and
 * no gradient along the stroke. The light and the material are the card's job now (principle 6), which leaves the
 * drawing to be nothing but geometry: if something should read as further away, that has to come from where it is
 * and how much room it has, not from how faint it is. Deterministic: the same SVG on the server and the client.
 *
 * Colours are set through `style`, because SVG presentation attributes do not accept `var()`.
 */
/** A field, by name or by parameters (Patterns.md §6.0a). What every live widget is drawn from. */
export interface PatternProps extends Omit<ComponentPropsWithoutRef<"svg">, "name"> {
  /** One of the six measured families. */
  name?: PatternName;
  /** Raw parameters, for a candidate that is not in the library yet — the studio draws this way. */
  family?: Family;
  hue?: Hue;
  title?: string;
  /** Names the drawing for `probe10` and `probe11`. Omit outside a fixture. */
  id?: string;
  /**
   * `field` positions it absolutely across its cell (`inset: 0`) — what a bento's loud cell wants, and what it
   * has to be for a drawing to leave through the edges.
   *
   * **`inline` is the default, and that is a correction.** It shipped as `field` unconditionally on 2026-09-11
   * and escaped the first container that was not a bento cell: `position: absolute` with no positioned ancestor
   * anchors to the page, so a quote's portrait slot drew a 1400px illustration across the header. A component
   * cannot assume the box it will be put in.
   */
  placement?: "inline" | "field";
}

/** The one line. There is no second one: same weight, same colour, everywhere in every picture. */
const LINE: CSSProperties = { stroke: "var(--ill-line)", fill: "none", strokeWidth: "var(--ill-w)" };

/** Every shape in a picture takes its style from this and nothing else. */
export type Line = () => CSSProperties;

export interface PatternCanvasProps extends Omit<ComponentPropsWithoutRef<"svg">, "children"> {
  hue?: Hue;
  title?: string;
  /** Draws the picture. Style every shape with `line()` — never with a weight or a colour of its own. */
  children: (line: Line) => ReactNode;
}

/**
 * The surface every illustration is drawn on: the viewBox, the light, and the one line style.
 *
 * Split out of `Pattern` so a picture that is not in the library yet can still be drawn on the real thing —
 * the studio at `/fixtures/studio` draws its candidates here, and one day so will the model in the blob.
 */
export function PatternCanvas({ hue, title, className, children, ...rest }: PatternCanvasProps) {
  const line: Line = () => LINE;
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cx("noo-ill", className)}
      data-hue={hue ?? "accent"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children(line)}
    </svg>
  );
}

/**
 * Pattern — a FIELD: fine lines in one hue crossing the whole cell and leaving through its edges.
 *
 * Draws `illo()` from the generator, which is what `SectionWidget` did inline until the parameters moved into the
 * package (`patterns.ts`). Give it a `name` for one of the six, or a `family` for a candidate the studio is still
 * arguing over.
 */
export function Pattern({ name, family, hue, title, id, placement = "inline", className, ...rest }: PatternProps) {
  const params = family ?? (name ? patterns[name] : undefined);
  if (!params) return null;
  return (
    <PatternCanvas
      hue={hue}
      title={title}
      data-ill={id}
      // A field crosses the whole cell and leaves through its edges (principle 7), so it SLICES rather than fits:
      // fitting would letterbox it inside the cell and every line would end in mid-air.
      preserveAspectRatio="xMidYMid slice"
      className={cx(
        placement === "field" && "noo-bento__ill noo-bento__ill--field",
        name && `noo-ill--${name}`,
        className,
      )}
      {...rest}
    >
      {(line) =>
        illo(params).flatMap((runs, i) =>
          runs.map((d, j) => <path key={`${i}-${j}`} d={d} style={line()} />),
        )
      }
    </PatternCanvas>
  );
}

