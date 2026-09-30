import type { DrawingData, DrawingShape, FaceSlotId } from "@no-origins/ui/lib/agent-face";
import { COLOUR_NAMES, type ColourName } from "@no-origins/ui/lib/properties";
import { faceAnchors, type SphereMotion } from "@no-origins/ui/lib/sphere-motion";

/**
 * An uploaded style (Character-Studio.md C8): what one is kept as, how it is checked on the server, and the template a
 * slot gives him to draw on. Pure — no DOM, so the server checks a drawing with the same rules the page cleaned it by
 * (`./clean-svg.ts` cleans; it runs in the page, where an SVG can be parsed).
 *
 * **The slot's own space** (agreed with the motion studio's session, 2026-09-30): the slot's anchor at 0,0, x right and y
 * down, `unit` template units to the head's radius. The anchor is the left part's, as he sees it: the left eye's centre
 * for pupils and lids, the middle of the left brow's line for brows, the symbol's centre for symbols
 * (`faceAnchors`, `@no-origins/ui/lib/sphere-motion`). The agent places it there, moved, turned and sized by the
 * slot's upload settings, and mirrors it for a pair's right side.
 *
 * The shape is the package's (`DrawingData`, `@no-origins/ui/lib/agent-face`), which the agent draws and checks again
 * as it reads one back (`checkDrawing` there, lenient: a bad colour is dropped). `strictDrawing` here is the server's
 * check of an upload, strict: anything wrong refuses it, so nothing half-right is stored.
 */

/** Template units to the head's radius: the template is drawn in round pixels, the head 200 across. */
export const UNIT = 100;

export type { DrawingData, DrawingShape };

/** A colour: one of the agent's by name, or a flat one of his own. */
export type DrawingColour = ColourName | `#${string}`;

/** The slots a style can be uploaded for: those that wear a style. The eyes are one drawing and wear none. */
export const UPLOAD_SLOTS = ["pupils", "upper-lids", "lower-lids", "brows", "symbols"] as const satisfies readonly FaceSlotId[];
export type UploadSlot = (typeof UPLOAD_SLOTS)[number];
export const isUploadSlot = (slot: string): slot is UploadSlot => (UPLOAD_SLOTS as readonly string[]).includes(slot);

/** How much an upload may be: the file as he gave it, and its shapes once cleaned. */
export const MAX_FILE = 256 * 1024;
export const MAX_SHAPES = 400;
const MAX_PATH = 200 * 1024;

const PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+-]+$/;
const HEX = /^#[0-9a-f]{6}$/;

export const isColour = (c: unknown): c is DrawingColour =>
  typeof c === "string" && ((COLOUR_NAMES as readonly string[]).includes(c) || HEX.test(c));

/**
 * `raw` as a drawing, or why it is not one: the server's check of what the page cleaned, since a server function can be
 * reached with anything. Paths only, flat colours only, within the limits.
 */
export function strictDrawing(raw: unknown): { ok: true; data: DrawingData } | { ok: false; reason: string } {
  const r = raw as Partial<DrawingData> | null;
  if (!r || typeof r !== "object" || r.unit !== UNIT || !Array.isArray(r.shapes)) return { ok: false, reason: "It is not a cleaned drawing." };
  if (!r.shapes.length) return { ok: false, reason: "It has no shapes." };
  if (r.shapes.length > MAX_SHAPES) return { ok: false, reason: `It has more than ${MAX_SHAPES} shapes.` };
  let length = 0;
  const shapes: DrawingShape[] = [];
  for (const s of r.shapes as Partial<DrawingShape>[]) {
    if (!s || typeof s.d !== "string" || !PATH.test(s.d)) return { ok: false, reason: "A shape is not a path." };
    length += s.d.length;
    if (s.fill !== undefined && !isColour(s.fill)) return { ok: false, reason: "A fill is not a flat colour." };
    if (s.stroke !== undefined && !isColour(s.stroke)) return { ok: false, reason: "A stroke is not a flat colour." };
    if (s.width !== undefined && !(typeof s.width === "number" && s.width > 0 && s.width < 1000)) return { ok: false, reason: "A stroke's width is not a width." };
    if (s.rule !== undefined && s.rule !== "nonzero" && s.rule !== "evenodd") return { ok: false, reason: "A fill rule is not one." };
    if (s.fill === undefined && s.stroke === undefined) continue;
    shapes.push({
      d: s.d,
      ...(s.fill !== undefined ? { fill: s.fill } : {}),
      ...(s.stroke !== undefined ? { stroke: s.stroke, width: s.width ?? 1 } : {}),
      ...(s.rule ? { rule: s.rule } : {}),
      ...(typeof s.layer === "string" ? { layer: s.layer.slice(0, 80) } : {}),
    });
  }
  if (length > MAX_PATH) return { ok: false, reason: "Its paths are too long." };
  if (!shapes.length) return { ok: false, reason: "None of its shapes is filled or stroked." };
  const viewBox = typeof r.viewBox === "string" && /^[-\d.\s]+$/.test(r.viewBox) ? r.viewBox : undefined;
  return { ok: true, data: { unit: UNIT, shapes, ...(viewBox ? { viewBox } : {}) } };
}

// ── the template ────────────────────────────────────────────────────────────────────────────────────────────────

/** Where the slot's part stands and how big it is, in head radii from the head's centre (`faceAnchors` and its sizes). */
export type TemplatePart = {
  anchor: { x: number; y: number };
  /** The part's box, across and down, in head radii. */
  box: { w: number; h: number };
  /** The eyes' centres and radius, drawn for reference round an eye's part. */
  eyes?: { left: { x: number; y: number }; right: { x: number; y: number }; r: number };
};

/**
 * Where `slot`'s part stands on the agent as it is (`faceAnchors`) and how big it is, by the drawing's own sizes: an eye
 * `eyeSize` of the head's radius, a brow `browLength` eyes across and `browThickness` of the head thick, a symbol
 * `symbolSize` of it. So the template is drawn round his eyes as they are now, not version 12's.
 */
export function templatePartOf(slot: UploadSlot, m: SphereMotion): TemplatePart {
  const a = faceAnchors(m);
  const eyes = { left: { x: -m.eyeSpacing, y: -m.eyeHeight }, right: { x: m.eyeSpacing, y: -m.eyeHeight }, r: m.eyeSize };
  if (slot === "brows") return { anchor: a.brows, box: { w: m.browLength * 2 * m.eyeSize, h: Math.max(0.3, 4 * m.browThickness) }, eyes };
  if (slot === "symbols") return { anchor: a.symbols, box: { w: 2 * m.symbolSize, h: 2 * m.symbolSize } };
  return { anchor: a.eyes, box: { w: 2 * m.eyeSize, h: 2 * m.eyeSize }, eyes };
}

const LABEL: Record<UploadSlot, string> = {
  pupils: "a pupil",
  "upper-lids": "an upper lid",
  "lower-lids": "a lower lid",
  brows: "a brow",
  symbols: "a symbol",
};

const SIZE = 360;
const C = SIZE / 2;
const f = (n: number) => (Math.round(n * 100) / 100).toString();

/**
 * The template for `slot` (C8): the head as a circle 200 px across, the part's anchor as a cross and its box, and the
 * eyes for reference — all in the group Guides, which the upload maps his drawing back by and then drops. He draws the
 * left part, as he sees it, beside them.
 */
export function templateSvg(slot: UploadSlot, part: TemplatePart): string {
  const at = { x: C + part.anchor.x * UNIT, y: C + part.anchor.y * UNIT };
  const bw = part.box.w * UNIT;
  const bh = part.box.h * UNIT;
  const eyes = part.eyes
    ? [part.eyes.left, part.eyes.right]
        .map((e, i) => `    <circle id="eye-${i ? "right" : "left"}" cx="${f(C + e.x * UNIT)}" cy="${f(C + e.y * UNIT)}" r="${f(part.eyes!.r * UNIT)}" fill="none" stroke="#9ca3af" stroke-dasharray="3 3"/>`)
        .join("\n")
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!--
    No Origins · the agent's ${slot} — a template to draw ${LABEL[slot]} on (Character-Studio.md C8).
    Draw the LEFT one as you see it, in the box round the cross; the right side is its mirror.
    Keep the group "Guides" in the file you export: the upload lines your drawing up by it, then drops it.
    Flat colours only: no gradients, see-through, filters, pictures or text. A shape in a layer named paint, shade,
    deep, ink, light, lime or violet wears the agent's colour of that name; anything else keeps its own.
  -->
  <g id="Guides">
    <circle id="head" cx="${C}" cy="${C}" r="${UNIT}" fill="none" stroke="#9ca3af"/>
${eyes}
    <rect id="box" x="${f(at.x - bw / 2)}" y="${f(at.y - bh / 2)}" width="${f(bw)}" height="${f(bh)}" fill="none" stroke="#a3e635" stroke-dasharray="4 3"/>
    <path id="anchor" d="M${f(at.x - 6)} ${f(at.y)}H${f(at.x + 6)}M${f(at.x)} ${f(at.y - 6)}V${f(at.y + 6)}" fill="none" stroke="#8b5cf6"/>
  </g>
</svg>
`;
}
