/**
 * A grove's area (World.md W91; his: "when I select trees to place, give me dimensions to set and once I set the
 * dimensions I should see that placeholder with that dimension so that I will know where I am placing"): a rounded
 * rectangle on its sector's floor, centred where the grove stands, and a hollow of its own inside it, where no tree
 * stands. The corners and the hollow are what W89 gave a zone (his: "border radius … so that I can also make it like a
 * pill or a circle", "a hollow … so that when I place trees, I can only place them on the zone which is not hollow"),
 * moved to the grove when zones went (W91). Nothing here is three.js, so the Sectors page's cards read it without
 * loading the world.
 *
 * Every measure is in metres: an outline's middle from the middle of its sector's floor (x east, z south); a hollow's
 * from its area's middle, so moving the grove moves its hollow.
 */

/**
 * An outline: its middle, its width (east) and length (south), and how round its corners are, a share of half its
 * shorter side: 0 square, 1 a pill, and a circle where its width and length are equal, so a pill stays a pill as it is
 * sized.
 */
export type Outline = { at: readonly [x: number, z: number]; size: readonly [width: number, length: number]; corners: number };
/** A grove's area: its size and corners, round the grove's place, and its hollow, or none. */
export type Area = { size: readonly [width: number, length: number]; corners: number; hollow: Outline | null };

/** An area's or a hollow's least width or length: a metre. */
export const OUTLINE_LEAST = 1;

/** A new grove's area until one is set (mine): 60 m square, its corners square, no hollow. */
export const AREA_START: Area = { size: [60, 60], corners: 0, hollow: null };

/** An area as an outline, standing at a place. */
export const outlineAt = (at: readonly [number, number], area: Area): Outline => ({ at: [at[0], at[1]], size: area.size, corners: area.corners });

/** The radius of an outline's corners, in metres. */
export const cornerOf = (outline: Pick<Outline, "size" | "corners">) => Math.max(0, Math.min(1, outline.corners)) * (Math.min(outline.size[0], outline.size[1]) / 2);

/** How far a point is outside an outline, in metres, less than 0 inside it: a rounded rectangle's distance. */
export function outsideBy(outline: Outline, x: number, z: number): number {
  const r = cornerOf(outline);
  const qx = Math.abs(x - outline.at[0]) - outline.size[0] / 2 + r;
  const qz = Math.abs(z - outline.at[1]) - outline.size[1] / 2 + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
}

/** An area's hollow where it stands, its middle from the sector's floor's, for an area at a place; or none. */
export const hollowAt = (at: readonly [number, number], area: Area): Outline | null =>
  area.hollow ? { ...area.hollow, at: [at[0] + area.hollow.at[0], at[1] + area.hollow.at[1]] } : null;

/**
 * Whether a point is on an area's ground, the area standing at a place (both from the middle of the sector's floor):
 * inside its outline and outside its hollow, each by `clear` metres. A hollow reaching past the area cuts nothing there.
 */
export function onGround(at: readonly [number, number], area: Area, x: number, z: number, clear = 0): boolean {
  if (outsideBy(outlineAt(at, area), x, z) > -clear) return false;
  const hollow = hollowAt(at, area);
  return !hollow || outsideBy(hollow, x, z) >= clear;
}

/** The ground's area, in square metres: the outline's less the hollow's, where the hollow is inside it (near enough). */
export function groundOf(area: Area): number {
  const of = (outline: Pick<Outline, "size" | "corners">) => {
    const r = cornerOf(outline);
    return outline.size[0] * outline.size[1] - (4 - Math.PI) * r * r;
  };
  return Math.max(0, of(area) - (area.hollow ? of(area.hollow) : 0));
}

/**
 * An outline's line round it, closed: points in metres (x, z) from where its middle is measured, along its four sides
 * and round its corners, `steps` a corner. A square corner is one point.
 */
export function outlinePoints(outline: Outline, steps = 16): [number, number][] {
  const r = cornerOf(outline);
  const hx = outline.size[0] / 2 - r;
  const hz = outline.size[1] / 2 - r;
  const [cx, cz] = outline.at;
  const points: [number, number][] = [];
  // The corners in turn round the outline, each arc's middle and the angle it starts from.
  for (const [sx, sz, from] of [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]] as const) {
    const count = r > 1e-6 ? steps : 0;
    for (let i = 0; i <= count; i++) {
      const angle = ((from + (90 * i) / Math.max(1, count)) * Math.PI) / 180;
      points.push([cx + sx * hx + r * Math.cos(angle), cz + sz * hz + r * Math.sin(angle)]);
    }
  }
  points.push(points[0]);
  return points;
}

/** An area's lines, at a place: its outline's and its hollow's. */
export const areaLines = (at: readonly [number, number], area: Area): [number, number][][] => {
  const hollow = hollowAt(at, area);
  return [outlinePoints(outlineAt(at, area)), ...(hollow ? [outlinePoints(hollow)] : [])];
};

/** A new hollow: at the area's middle, half its size each way, its corners as round as the area's. */
export const newHollow = (area: Pick<Area, "size" | "corners">): Outline => ({ at: [0, 0], size: [Math.max(OUTLINE_LEAST, area.size[0] / 2), Math.max(OUTLINE_LEAST, area.size[1] / 2)], corners: area.corners });

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const pair = (value: unknown): value is [number, number] => Array.isArray(value) && value.length === 2 && value.every(finite);

/** An outline as kept, or none: its middle, a size of a metre or more each way, and its corners held within 0 to 1. */
export function outlineFrom(value: unknown): Outline | null {
  if (!value || typeof value !== "object") return null;
  const { at, size, corners } = value as Record<string, unknown>;
  if (!pair(at) || !pair(size) || !finite(corners)) return null;
  return { at: [at[0], at[1]], size: [Math.max(OUTLINE_LEAST, size[0]), Math.max(OUTLINE_LEAST, size[1])], corners: Math.max(0, Math.min(1, corners)) };
}

/** An area as kept, or none. */
export function areaFrom(value: unknown): Area | null {
  if (!value || typeof value !== "object") return null;
  const { size, corners, hollow } = value as Record<string, unknown>;
  if (!pair(size) || !finite(corners)) return null;
  return { size: [Math.max(OUTLINE_LEAST, size[0]), Math.max(OUTLINE_LEAST, size[1])], corners: Math.max(0, Math.min(1, corners)), hollow: outlineFrom(hollow) };
}
