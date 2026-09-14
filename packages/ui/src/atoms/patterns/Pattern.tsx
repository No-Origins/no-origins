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
/**
 * @deprecated The original grammar of six primitives — corner OBJECTS, not patterns.
 *
 * Retired 2026-09-10 when Bhargav set the four conditions (fine lines, no fill, textured cards, no colliding
 * lines) and the library was redrawn as patterns drawn by the generator. No live widget has used these since.
 * They are kept, and shown beside the real ones at `/fixtures/bento`, until the grammar is deleted.
 *
 * Renamed from `Pattern` on 2026-09-11: the current name belongs to the current system. Registering the
 * retired glyphs as the authorable illustration was a real error, caught by Bhargav on the catalogue page —
 * `work` here is literally `stack(4)`, four capsules, which is what it drew.
 */
export type GlyphName = "status" | "work" | "cases" | "projects" | "interests" | "philosophy";
export const glyphNames: GlyphName[] = ["status", "work", "cases", "projects", "interests", "philosophy"];

export interface GlyphProps extends Omit<ComponentPropsWithoutRef<"svg">, "name"> {
  name: GlyphName;
  /** The one hue. Defaults to the block accent. */
  hue?: Hue;
  /** Describes the picture; without it the glyph is decorative and hidden from assistive tech. */
  title?: string;
}

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

/** @deprecated See {@link GlyphProps}. */
export function Glyph({ name, hue, title, className, ...rest }: GlyphProps) {
  return (
    <PatternCanvas hue={hue} title={title} className={cx(`noo-ill--${name}`, className)} {...rest}>
      {(line) => draw(name, line)}
    </PatternCanvas>
  );
}

function draw(name: GlyphName, line: Line) {
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

/** @deprecated Renamed `Pattern` on 2026-09-14 (Admin.md §6.5b — "the word is pattern"); alias removed next minor. */
export const Illustration = Pattern;
/** @deprecated Renamed `PatternCanvas`; alias removed next minor. */
export const IllustrationCanvas = PatternCanvas;
/** @deprecated See {@link PatternProps}. */
export type IllustrationProps = PatternProps;
/** @deprecated See {@link PatternCanvasProps}. */
export type IllustrationCanvasProps = PatternCanvasProps;
