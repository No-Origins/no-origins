import svgpath from "svgpath";

import { COLOUR_NAMES } from "@no-origins/ui/lib/properties";

import { MAX_FILE, MAX_SHAPES, UNIT, type DrawingColour, type DrawingData, type DrawingShape } from "@/lib/drawing";

/**
 * Cleaning an uploaded SVG (Character-Studio.md C8), in the page, where it can be parsed: never taken as it is.
 *
 * 1. **Lined up by its own guides.** Design tools move the origin, and may scale, when they export, so the file's
 *    coordinates are not the template's. The group Guides the template gave (kept in the export) says where the head
 *    and the anchor ended up: the drawing is moved so the cross is at 0,0 and scaled so the head's radius is `UNIT`,
 *    the slot's own space. Then the guides are dropped. Without them it is refused.
 * 2. **Flattened.** Every shape — path, rect, circle, ellipse, line, polyline, polygon — becomes one absolute path with
 *    its own transform and every group's round it worked into its points (`svgpath`, in call order: its own first, then
 *    each parent's outward). Groups, transforms and anything not drawn go.
 * 3. **Coloured flat.** A shape's fill and stroke are read as the browser would — its style, its class, its attribute,
 *    inherited — and kept as a plain colour, or, in a layer named for one of the agent's colours, as that name.
 * 4. **Refused, saying why**, for what the system never draws (2026-09-16: no gradient, no glass): a gradient or
 *    pattern (`url(…)`), an opacity, a filter or a mask, a picture, text, a script, or a reference to another element.
 *    A clip is dropped rather than refused: design tools wrap every frame in one.
 */

export type Cleaned = { ok: true; data: DrawingData } | { ok: false; reason: string };

const fail = (reason: string): Cleaned => ({ ok: false, reason });

/** Where nothing is drawn, so nothing in it is checked or kept. */
const UNDRAWN = new Set(["defs", "clipPath", "mask", "pattern", "symbol", "marker", "linearGradient", "radialGradient", "filter", "metadata", "title", "desc", "style"]);
const SHAPES = new Set(["path", "rect", "circle", "ellipse", "line", "polyline", "polygon"]);
const REFUSED: Record<string, string> = {
  image: "It has a picture in it: draw with shapes only.",
  text: "It has text in it: turn the text into outlines, or draw it.",
  use: "It refers to another element (a use): flatten or detach it in your design tool.",
  foreignObject: "It has something in it that is not a drawing.",
  script: "It has a script in it.",
};

const NAMED: Record<string, string> = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff", yellow: "#ffff00",
  orange: "#ffa500", purple: "#800080", gray: "#808080", grey: "#808080", silver: "#c0c0c0", maroon: "#800000",
  navy: "#000080", teal: "#008080", olive: "#808000", lime: "#00ff00", aqua: "#00ffff", fuchsia: "#ff00ff",
};

/** A layer's or an element's name, as design tools write it: its id, Illustrator's data-name, Inkscape's label. */
const nameOf = (el: Element) =>
  (el.getAttribute("inkscape:label") ?? el.getAttribute("data-name") ?? el.getAttribute("id") ?? "").trim();
/** The name without the numbers tools add to keep ids apart ("paint_2", "paint-3", "paint 4"). */
const bare = (name: string) => name.toLowerCase().replace(/[\s_-]+\d+$/, "");

/** The simple class rules of the file's own stylesheets (Illustrator's `.cls-1 { fill: … }`). */
function classRules(doc: Document): Map<string, Record<string, string>> {
  const rules = new Map<string, Record<string, string>>();
  for (const style of Array.from(doc.getElementsByTagName("style"))) {
    const css = (style.textContent ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const props = declarations(body!);
      for (const sel of selectors!.split(",")) {
        const m = /^\s*\.([\w-]+)\s*$/.exec(sel);
        if (m) rules.set(m[1]!, { ...rules.get(m[1]!), ...props });
      }
    }
  }
  return rules;
}

function declarations(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of body.split(";")) {
    const i = part.indexOf(":");
    if (i > 0) out[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
  }
  return out;
}

/** A property as set on this element alone: its style, then its class, then its attribute, as CSS weighs them. */
function own(el: Element, prop: string, rules: Map<string, Record<string, string>>): string | undefined {
  const style = el.getAttribute("style");
  if (style) {
    const v = declarations(style)[prop];
    if (v !== undefined) return v;
  }
  for (const cls of (el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean).reverse()) {
    const v = rules.get(cls)?.[prop];
    if (v !== undefined) return v;
  }
  return el.getAttribute(prop) ?? undefined;
}

/** A property inherited down to `el`: its own, else its nearest parent's. */
function inherited(el: Element, prop: string, rules: Map<string, Record<string, string>>): string | undefined {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const v = own(node, prop, rules);
    if (v !== undefined && v !== "inherit") return v;
  }
  return undefined;
}

type Colour = { ok: true; colour: DrawingColour | null } | { ok: false; reason: string };

/** A paint value as a flat colour, none, or why it cannot be one. */
function colourOf(value: string | undefined, el: Element, rules: Map<string, Record<string, string>>, fallback: string | null): Colour {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return { ok: true, colour: fallback as DrawingColour | null };
  if (v === "none" || v === "transparent") return { ok: true, colour: null };
  if (v.startsWith("url(")) return { ok: false, reason: "It has a gradient or a pattern: use flat colours only." };
  if (v === "currentcolor") return colourOf(inherited(el, "color", rules), el, rules, "#000000");
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v);
  if (hex) {
    const h = hex[1]!;
    if (h.length === 3) return { ok: true, colour: `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` };
    if (h.length === 8 && h.slice(6) !== "ff") return { ok: false, reason: "It has a see-through colour: use solid colours only." };
    return { ok: true, colour: `#${h.slice(0, 6)}` };
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(v);
  if (rgb) {
    if (rgb[4] !== undefined && parseFloat(rgb[4]) < (rgb[4].endsWith("%") ? 100 : 1)) {
      return { ok: false, reason: "It has a see-through colour: use solid colours only." };
    }
    const to = (n: string) => Math.max(0, Math.min(255, Math.round(parseFloat(n)))).toString(16).padStart(2, "0");
    return { ok: true, colour: `#${to(rgb[1]!)}${to(rgb[2]!)}${to(rgb[3]!)}` };
  }
  if (NAMED[v]) return { ok: true, colour: NAMED[v] as DrawingColour };
  return { ok: false, reason: `It has a colour this studio cannot read (“${value}”): use a hex colour.` };
}

const num = (el: Element, name: string, fallback = 0) => {
  const raw = el.getAttribute(name);
  if (raw === null || raw.trim() === "") return fallback;
  if (raw.trim().endsWith("%")) return NaN;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : NaN;
};

/** A shape as one path, in its own coordinates; null when it draws nothing, NaN sizes when it cannot be read. */
function pathOf(el: Element): string | null {
  switch (el.localName) {
    case "path":
      return el.getAttribute("d");
    case "rect": {
      const [x, y, w, h] = [num(el, "x"), num(el, "y"), num(el, "width"), num(el, "height")];
      if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return null;
      let rx = num(el, "rx", NaN);
      let ry = num(el, "ry", NaN);
      if (!Number.isFinite(rx)) rx = Number.isFinite(ry) ? ry : 0;
      if (!Number.isFinite(ry)) ry = rx;
      rx = Math.min(rx, w / 2);
      ry = Math.min(ry, h / 2);
      if (rx <= 0 || ry <= 0) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
      return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
    }
    case "circle":
    case "ellipse": {
      const cx = num(el, "cx");
      const cy = num(el, "cy");
      const rx = el.localName === "circle" ? num(el, "r") : num(el, "rx");
      const ry = el.localName === "circle" ? rx : num(el, "ry");
      if (![cx, cy, rx, ry].every(Number.isFinite) || rx <= 0 || ry <= 0) return null;
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
    }
    case "line": {
      const [x1, y1, x2, y2] = [num(el, "x1"), num(el, "y1"), num(el, "x2"), num(el, "y2")];
      return [x1, y1, x2, y2].every(Number.isFinite) ? `M${x1} ${y1}L${x2} ${y2}` : null;
    }
    case "polyline":
    case "polygon": {
      const pts = (el.getAttribute("points") ?? "").trim().split(/[\s,]+/).map(Number);
      if (pts.length < 4 || pts.length % 2 || !pts.every(Number.isFinite)) return null;
      const pairs = [];
      for (let i = 0; i < pts.length; i += 2) pairs.push(`${pts[i]} ${pts[i + 1]}`);
      return `M${pairs.join("L")}${el.localName === "polygon" ? "Z" : ""}`;
    }
  }
  return null;
}

/** The transforms from `el` out to the root, its own first: the order `svgpath` applies them in. */
function transforms(el: Element): string[] {
  const out: string[] = [];
  for (let node: Element | null = el; node; node = node.parentElement) {
    const t = node.getAttribute("transform");
    if (t) out.push(t);
    // A nested svg places what is in it at its x and y.
    if (node !== el && node.localName === "svg" && node.parentElement) {
      const x = num(node, "x");
      const y = num(node, "y");
      if ((x || y) && Number.isFinite(x) && Number.isFinite(y)) out.push(`translate(${x} ${y})`);
    }
  }
  return out;
}

const through = (d: string, chain: string[]) => chain.reduce((p, t) => p.transform(t), svgpath(d));

/** How much a chain of transforms scales a length, on average: a stroke's width goes with it. */
function scaleOf(chain: string[]) {
  const pts: number[][] = [];
  through("M0 0L1 0M0 0L0 1", chain).abs().iterate((seg) => void pts.push(seg.slice(1) as number[]));
  const [o, x, , y] = pts;
  const sx = Math.hypot(x![0]! - o![0]!, x![1]! - o![1]!);
  const sy = Math.hypot(y![0]! - o![0]!, y![1]! - o![1]!);
  return Math.sqrt(sx * sy) || 1;
}

type Box = { x0: number; y0: number; x1: number; y1: number };

/** A path's box, from every point it passes and every control point once its arcs are curves: never smaller. */
function boxOf(d: string, into?: Box): Box {
  const box = into ?? { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const add = (x: number, y: number) => {
    box.x0 = Math.min(box.x0, x);
    box.y0 = Math.min(box.y0, y);
    box.x1 = Math.max(box.x1, x);
    box.y1 = Math.max(box.y1, y);
  };
  svgpath(d).abs().unarc().iterate((seg, _i, x, y) => {
    const [cmd, ...n] = seg as [string, ...number[]];
    if (cmd === "H") return add(n[0]!, y);
    if (cmd === "V") return add(x, n[0]!);
    for (let i = 0; i + 1 < n.length; i += 2) add(n[i]!, n[i + 1]!);
  });
  return box;
}

const inside = (el: Element, ancestor: Element) => ancestor.contains(el);
const undrawn = (el: Element) => {
  for (let node: Element | null = el.parentElement; node; node = node.parentElement) if (UNDRAWN.has(node.localName)) return true;
  return false;
};

/** The first element under `from` (itself included) whose name starts with `name`. */
function named(from: Element, name: RegExp): Element | null {
  if (name.test(bare(nameOf(from)))) return from;
  for (const el of Array.from(from.getElementsByTagName("*"))) if (name.test(bare(nameOf(el)))) return el;
  return null;
}

export function cleanSvg(text: string): Cleaned {
  if (text.length > MAX_FILE) return fail(`The file is larger than ${MAX_FILE / 1024} KB.`);
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const root = doc.documentElement;
  if (doc.getElementsByTagName("parsererror").length || root.localName !== "svg") return fail("The file is not an SVG that can be read.");
  const rules = classRules(doc);

  // The guides: where the template's head and anchor ended up in this file.
  const guides = named(root, /^guides$/);
  const head = guides && named(guides, /^head$/);
  const anchor = guides && named(guides, /^anchor$/);
  if (!guides || !head || !anchor) return fail("It has no guides: draw on the template, and keep its group Guides in the file you export.");
  // Each guide is the shape itself, or a group round it: measured where it is drawn, through its own transforms.
  const drawn = (el: Element) => [el, ...Array.from(el.getElementsByTagName("*"))].map((e) => ({ el: e, d: pathOf(e) })).filter((p) => p.d);
  const headPaths = drawn(head);
  const anchorPaths = drawn(anchor);
  if (!headPaths.length || !anchorPaths.length) return fail("Its guides have lost their head or their cross: export them as the template drew them.");
  const hb = headPaths.reduce<Box | undefined>((box, p) => boxOf(through(p.d!, transforms(p.el)).toString(), box), undefined)!;
  const ab = anchorPaths.reduce<Box | undefined>((box, p) => boxOf(through(p.d!, transforms(p.el)).toString(), box), undefined)!;
  const radius = Math.max(hb.x1 - hb.x0, hb.y1 - hb.y0) / 2;
  if (!(radius > 0)) return fail("Its head guide has no size.");
  const ax = (ab.x0 + ab.x1) / 2;
  const ay = (ab.y0 + ab.y1) / 2;
  const k = UNIT / radius;

  const shapes: DrawingShape[] = [];
  const all = Array.from(root.getElementsByTagName("*"));
  for (const el of all) {
    const tag = el.localName;
    if (UNDRAWN.has(tag) || undrawn(el) || inside(el, guides)) continue;
    if (REFUSED[tag]) return fail(REFUSED[tag]!);
    if (!SHAPES.has(tag)) {
      // A group or the root: what it carries is checked with its shapes; nothing else is drawn.
      continue;
    }
    // Hidden: not drawn, not kept.
    if (inherited(el, "visibility", rules) === "hidden") continue;
    let hidden = false;
    for (let node: Element | null = el; node; node = node.parentElement) {
      if (own(node, "display", rules) === "none") hidden = true;
      for (const prop of ["opacity", "fill-opacity", "stroke-opacity"]) {
        const v = own(node, prop, rules);
        if (v !== undefined && parseFloat(v) < (v.trim().endsWith("%") ? 100 : 1)) return fail("It has something see-through: use solid colours only.");
      }
      const filter = own(node, "filter", rules);
      if (filter && filter !== "none") return fail("It has a filter (a blur or a shadow): draw flat shapes only.");
      const mask = own(node, "mask", rules);
      if (mask && mask !== "none") return fail("It has a mask: flatten it in your design tool.");
    }
    if (hidden) continue;

    const fill = colourOf(inherited(el, "fill", rules), el, rules, "#000000");
    if (!fill.ok) return fail(fill.reason);
    const stroke = colourOf(inherited(el, "stroke", rules), el, rules, null);
    if (!stroke.ok) return fail(stroke.reason);
    if (!fill.colour && !stroke.colour) continue;
    const d = pathOf(el);
    if (d === null) continue;
    if (!d.trim()) continue;

    // In a layer named for one of the agent's colours, it wears that colour.
    let layer: string | undefined;
    for (let node: Element | null = el; node && node !== root; node = node.parentElement) {
      const name = bare(nameOf(node));
      if ((COLOUR_NAMES as readonly string[]).includes(name)) {
        layer = name;
        break;
      }
    }
    const chain = transforms(el);
    const path = through(d, chain).translate(-ax, -ay).scale(k).abs().round(2).toString();
    const width = parseFloat(inherited(el, "stroke-width", rules) ?? "1");
    const rule = inherited(el, "fill-rule", rules);
    shapes.push({
      d: path,
      ...(fill.colour ? { fill: (layer as DrawingColour | undefined) ?? fill.colour } : {}),
      ...(stroke.colour
        ? { stroke: (layer as DrawingColour | undefined) ?? stroke.colour, width: Math.round((Number.isFinite(width) ? width : 1) * scaleOf(chain) * k * 100) / 100 }
        : {}),
      ...(rule === "evenodd" ? { rule: "evenodd" as const } : {}),
      ...(layer ? { layer } : {}),
    });
    if (shapes.length > MAX_SHAPES) return fail(`It has more than ${MAX_SHAPES} shapes: simplify it.`);
  }
  if (!shapes.length) return fail("It has nothing drawn besides the guides.");

  const box = shapes.reduce<Box | undefined>((b, s) => boxOf(s.d, b), undefined)!;
  const pad = Math.max(4, ...shapes.map((s) => s.width ?? 0));
  const viewBox = [box.x0 - pad, box.y0 - pad, box.x1 - box.x0 + 2 * pad, box.y1 - box.y0 + 2 * pad].map((n) => Math.round(n * 100) / 100).join(" ");
  return { ok: true, data: { unit: UNIT, shapes, viewBox } };
}
