"use client";
import { createContext, useContext } from "react";

/**
 * Where the grid lines are, in viewport pixels — what the blob's refraction band re-draws inside the pill
 * (§3 cue 4). `x`/`y` is any one crossing, `box` the spacing, `line` the stroke width. `scale` is a CSS zoom the
 * blob is rendered under (React Flow's viewport transform) so its layout width converts to screen pixels.
 *
 * LINES since 2026-09-11: the ground was a 32px dot grid, tuned in the Blob Lab, and the canvas grew a 160 box
 * grid under it. Two grounds at two scales was one too many, and refracting the lines turned out to be the
 * better effect anyway — at the canvas origin both axes pass straight through the one glass blob.
 *
 * Without a provider the blob measures the nearest `.noo-ground` ancestor itself. The canvas wraps its nodes in
 * a `GroundProvider` derived from the viewport, so blobs stay phase-aligned while panning.
 */
export interface Ground {
  x: number;
  y: number;
  box: number;
  line: number;
  scale?: number;
}

export const GroundContext = createContext<Ground | null>(null);
export const GroundProvider = GroundContext.Provider;
export function useGround(): Ground | null {
  return useContext(GroundContext);
}

/** Reads the CSS grid (`--grid-box`, `--grid-line-w`) off the nearest ground, else the body. */
export function measureGround(from: Element): Ground {
  const host = (from.closest(".noo-ground, [data-ground]") ?? from.ownerDocument.body) as HTMLElement;
  const cs = getComputedStyle(host);
  const box = px(cs.getPropertyValue("--grid-box"), 160);
  const line = px(cs.getPropertyValue("--grid-line-w"), 1);
  const r = host.getBoundingClientRect();
  // the gradients start at the padding box, so the first crossing is at its top-left corner
  return { x: r.left + host.clientLeft, y: r.top + host.clientTop, box, line, scale: 1 };
}

function px(value: string, fallback: number): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

/** One blob's pattern: tile size and line width in user units (the 96 × 64 box), and the phase of the crossing. */
export interface RefractionGeometry {
  tile: number;
  line: number;
  dx: number;
  dy: number;
}

/** The grid is magnified 6% about the centre — his number, from the Blob Lab. */
export const REFRACTION_ZOOM = 1.06;

/** Fallback before measurement (server render, first paint): the right tile size for the width, arbitrary phase. */
export function refractionFallback(widthPx: number, box = 160, line = 1): RefractionGeometry {
  const s = widthPx / 96;
  const tile = box / s;
  return { tile, line: line / s, dx: tile / 2, dy: tile / 2 };
}

export function refractionFor(el: HTMLElement, grid: Ground): RefractionGeometry | null {
  const scale = grid.scale ?? 1;
  // layout size → screen pixels: untouched by the breathe / hover transforms, unlike getBoundingClientRect
  const w = el.offsetWidth * scale;
  const h = el.offsetHeight * scale;
  if (!w || !h) return null;
  // both transforms scale about the centre, so the centre of the transformed rect is the untransformed centre
  const b = el.getBoundingClientRect();
  const left = b.left + b.width / 2 - w / 2;
  const top = b.top + b.height / 2 - h / 2;
  const s = w / 96;
  const tile = grid.box / s;
  return { tile, line: grid.line / s, dx: mod((grid.x - left) / s, tile), dy: mod((grid.y - top) / s, tile) };
}

export function patternTransform(g: RefractionGeometry): string {
  return `translate(48 32) scale(${REFRACTION_ZOOM}) translate(-48 -32) translate(${(g.dx - g.tile / 2).toFixed(2)} ${(g.dy - g.tile / 2).toFixed(2)})`;
}

export function sameGeometry(a: RefractionGeometry | null, b: RefractionGeometry): boolean {
  if (!a) return false;
  const eps = 0.01;
  return Math.abs(a.tile - b.tile) < eps && Math.abs(a.line - b.line) < eps && Math.abs(a.dx - b.dx) < eps && Math.abs(a.dy - b.dy) < eps;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;
