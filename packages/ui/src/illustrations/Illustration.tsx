import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import type { Hue } from "../tokens";
import { cx } from "../cx";
import { SIZE, bands, pebbles, polar, ring, rosette, spiral, stack } from "./primitives";

/**
 * Illustration (Illustrations.md) — a named picture, drawn by code from the grammar in primitives.ts.
 *
 * A fine line in one hue, never a fill (principles 1–2). No two lines in a picture cross or touch (principle 3).
 * EVERY line in a picture has the same weight and the same colour (Bhargav, 2026-09-11) — there are no depths and
 * no gradient along the stroke. The light and the material are the card's job now (principle 6), which leaves the
 * drawing to be nothing but geometry: if something should read as further away, that has to come from where it is
 * and how much room it has, not from how faint it is. Deterministic: the same SVG on the server and the client.
 *
 * Colours are set through `style`, because SVG presentation attributes do not accept `var()`.
 */
export type IllustrationName = "status" | "work" | "cases" | "projects" | "interests" | "philosophy";
export const illustrationNames: IllustrationName[] = ["status", "work", "cases", "projects", "interests", "philosophy"];

export interface IllustrationProps extends Omit<ComponentPropsWithoutRef<"svg">, "name"> {
  name: IllustrationName;
  /** The one hue. Defaults to the block accent. */
  hue?: Hue;
  /** Describes the picture; without it the illustration is decorative and hidden from assistive tech. */
  title?: string;
}

/** The one line. There is no second one: same weight, same colour, everywhere in every picture. */
const LINE: CSSProperties = { stroke: "var(--ill-line)", fill: "none", strokeWidth: "var(--ill-w)" };

/** Every shape in a picture takes its style from this and nothing else. */
export type Line = () => CSSProperties;

export interface IllustrationCanvasProps extends Omit<ComponentPropsWithoutRef<"svg">, "children"> {
  hue?: Hue;
  title?: string;
  /** Draws the picture. Style every shape with `line()` — never with a weight or a colour of its own. */
  children: (line: Line) => ReactNode;
}

/**
 * The surface every illustration is drawn on: the viewBox, the light, and the one line style.
 *
 * Split out of `Illustration` so a picture that is not in the library yet can still be drawn on the real thing —
 * the studio at `/fixtures/studio` draws its candidates here, and one day so will the model in the blob.
 */
export function IllustrationCanvas({ hue, title, className, children, ...rest }: IllustrationCanvasProps) {
  const line: Line = () => LINE;
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cx("noo-ill", className)}
      data-hue={hue}
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

export function Illustration({ name, hue, title, className, ...rest }: IllustrationProps) {
  return (
    <IllustrationCanvas hue={hue} title={title} className={cx(`noo-ill--${name}`, className)} {...rest}>
      {(line) => draw(name, line)}
    </IllustrationCanvas>
  );
}

function draw(name: IllustrationName, line: Line) {
  switch (name) {
    // looking, open: a ring left open at the top-right, a shorter arc inside it, and one mark already outside
    case "status": {
      const [outer] = ring([0.72], { radius: 86, rotate: 0, gap: 0.06 });
      const [inner] = ring([0.42], { radius: 58, rotate: 150, gap: 0.05 });   // up the left, echoing the outer arc; at the bottom the two read as a face
      const [dx, dy] = polar(120, 120, 86, -61);              // the middle of the opening
      return (
        <>
          <path d={outer!} style={line()} />
          <path d={inner!} style={line()} />
          <circle cx={dx} cy={dy} r={10} style={line()} />
        </>
      );
    }
    // four roles, told as four capsules climbing away — honest count (principle 8)
    case "work": {
      const blocks = stack(4);
      return blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.rx} style={line()} />
      ));
    }
    // three case studies, one behind the other — honest count
    case "cases": {
      const waves = bands(3);
      return waves.map((d, i) => <path key={i} d={d} style={line()} />);
    }
    // nothing shipped yet: the outlines of things not here. NOTE: this used to say absence by being thinner and
    // fainter than everything else, which one weight and one colour no longer allow — six equal circles now read
    // as six things. It has to say absence by geometry instead, and it gets redrawn with the rest as a field.
    case "projects": {
      const discs = pebbles(6);
      return discs.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} style={line()} />
      ));
    }
    // curiosity radiating — the asterisk, hollow, each spoke clear of the next
    case "interests": {
      const spokes = rosette(7);
      return spokes.map((c, i) => (
        <rect
          key={i}
          x={c.x}
          y={c.y}
          width={c.w}
          height={c.h}
          rx={c.rx}
          transform={`rotate(${c.angle} 120 120)`}
          style={line()}
        />
      ));
    }
    // a way of thinking unwinding from a point — one line, never touching itself
    case "philosophy":
      return (
        <>
          <path d={spiral()} style={line()} />
          <circle cx={120} cy={120} r={3.5} style={line()} />
        </>
      );
  }
}
