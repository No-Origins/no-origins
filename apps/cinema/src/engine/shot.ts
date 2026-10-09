import type { Frame, Item, Shot, Track } from "./types.ts";

/** A shot's frame when it is made (Cinema-Engine.md E3): wide, 1080 on its short side, 30 frames a second. */
export const DEFAULT_FRAME: Frame = { aspect: "wide", size: 1080, fps: 30 };
/** A shot with nothing on it lasts this long, so there is something to scrub. */
const EMPTY_LENGTH = 4;

export function newShot(id: string, title: string, frame: Partial<Frame> = {}): Shot {
  return { schema: 1, id, title, rev: 0, frame: { ...DEFAULT_FRAME, ...frame }, world: null, cast: [], tracks: [] };
}

/** A frame's pixels: 16 : 9 wide, 9 : 16 vertical, its short side `size`, both even so a video can be encoded. */
export function frameSize(frame: Frame) {
  const long = Math.round((frame.size * 16) / 9 / 2) * 2;
  const short = Math.round(frame.size / 2) * 2;
  return frame.aspect === "wide" ? { width: long, height: short } : { width: short, height: long };
}

/** A shot lasts until its last item ends (E3): nothing is placed after it. */
export function shotLength(shot: Shot) {
  let end = 0;
  for (const track of shot.tracks) for (const item of track.items) end = Math.max(end, item.start + item.length);
  return end > 0 ? end : EMPTY_LENGTH;
}

/** The frames a shot is drawn at, in order: one every 1 / fps seconds from `from`, up to but not at `to`. */
export function frameTimes(fps: number, from: number, to: number) {
  const count = Math.max(1, Math.round((to - from) * fps));
  return Array.from({ length: count }, (_, i) => from + i / fps);
}

/**
 * Which item of a track holds the moment `t`, and how far through it. Between items the last one holds where it
 * ended, and before the first the first holds where it starts, so a camera is always somewhere.
 */
export function holding(track: Track, t: number): { item: Item; u: number } | undefined {
  const items = [...track.items].sort((a, b) => a.start - b.start);
  if (items.length === 0) return undefined;
  let found: Item | undefined;
  for (const item of items) if (item.start <= t) found = item;
  if (!found) return { item: items[0]!, u: 0 };
  return { item: found, u: found.length > 0 ? Math.min(1, (t - found.start) / found.length) : 1 };
}

/** The items of a track playing at `t`: a light is lit from its start to its end. */
export function playing(track: Track, t: number) {
  return track.items.filter((item) => item.start <= t && t <= item.start + item.length);
}

/** Every item and placement of a shot, by id, so a command can name one. */
export function itemsOf(shot: Shot) {
  const out = new Map<string, { track: Track; item: Item }>();
  for (const track of shot.tracks) for (const item of track.items) out.set(item.id, { track, item });
  return out;
}

/** The next free id with a prefix: `camera-1`, `camera-2`… */
export function nextId(taken: Iterable<string>, prefix: string) {
  const used = new Set(taken);
  let n = 1;
  while (used.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}
