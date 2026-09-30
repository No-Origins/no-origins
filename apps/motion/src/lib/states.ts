import {
  canAttach, STATE_EVENTS, STATE_UNIT_MS,
  type AttachRow, type MotionState, type PartRow, type StateRow, type StateValue,
} from "@no-origins/ui/lib/motion-states";

import type { Family, FamilyMachine, FamilyPart } from "@/content/families";

/**
 * A family's states as the studio keeps them (Motion.md M19): every state he has made, and the tab in front. They live
 * in the family's own data (`dataOf`/`setData`), in the browser like every other setting, beside anything the family
 * kept there before — the agent's unplugged statechart (M12) left its charts in the same place, and they stay.
 *
 * Every edit is a pure function of the states, so the bench, the stage and Copy all read one thing.
 */

export type Machine = { states: MotionState[]; front: string };

type Kept = { machine?: { version?: number; states?: unknown; front?: unknown } };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** The version's states, fresh. */
export const startOf = (machine: FamilyMachine): Machine => ({ states: clone(machine.start), front: machine.start[0]!.id });

/** A state as saved, if it still reads as one: anything else gives way to the version's. */
function wellFormed(v: unknown): v is MotionState {
  if (!isObject(v) || typeof v.id !== "string" || typeof v.name !== "string" || !Array.isArray(v.rows)) return false;
  if (!(typeof v.start === "number" && typeof v.end === "number" && v.end > v.start)) return false;
  if (!(typeof v.unit === "string" && v.unit in STATE_UNIT_MS)) return false;
  if (!STATE_EVENTS.includes(v.event as never)) return false;
  return v.rows.every((r) => isObject(r) && typeof r.id === "string" && typeof r.start === "number" && typeof r.end === "number"
    && ((r.kind === "part" && typeof r.part === "string" && isObject(r.values) && typeof r.ease === "string") || (r.kind === "state" && typeof r.state === "string")));
}

/**
 * A state read back from the database (Motion.md M20), under the item it is saved as — its id and name the item's — or
 * null when it no longer reads as one. At most `MAX_ROWS` rows, parts a list of words.
 */
export function checkState(raw: unknown, id: string, name: string): MotionState | null {
  if (!isObject(raw)) return null;
  const state = { ...clone(raw), id, name } as unknown;
  if (!wellFormed(state) || state.rows.length > MAX_ROWS) return null;
  if (state.parts !== undefined && !(Array.isArray(state.parts) && state.parts.every((p) => typeof p === "string"))) return null;
  return state;
}

/** The most rows a state may keep. */
export const MAX_ROWS = 200;

/** A new state's id: a UUID, so a state saved to the database is created under its own (`studio_items.id`). */
export const newStateId = () => crypto.randomUUID();

/** The family's states out of its saved data: the version's until he has made his own, and after a new version. */
export function readMachine(family: Family, data: unknown): Machine {
  const machine = family.machine!;
  const kept = isObject(data) ? (data as Kept).machine : undefined;
  if (!kept || kept.version !== family.version || !Array.isArray(kept.states)) return startOf(machine);
  const states = kept.states.filter(wellFormed);
  if (!states.length) return startOf(machine);
  const front = typeof kept.front === "string" && states.some((s) => s.id === kept.front) ? kept.front : states[0]!.id;
  return { states, front };
}

/** The family's data with its states written in, and whatever else it kept left as it was. */
export const writeMachine = (family: Family, data: unknown, next: Machine): unknown => ({
  ...(isObject(data) ? data : {}),
  machine: { version: family.version, states: next.states, front: next.front },
});

// ── edits ─────────────────────────────────────────────────────────────────────────────────────────────────────────

let count = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(count++).toString(36)}`;

/** The shortest a span may be, in ms, so its two heads never sit on one another. */
export const MIN_SPAN = 10;

export const frontOf = (m: Machine): MotionState => m.states.find((s) => s.id === m.front) ?? m.states[0]!;

const withState = (m: Machine, id: string, fn: (s: MotionState) => MotionState): Machine => ({
  ...m,
  states: m.states.map((s) => (s.id === id ? fn(s) : s)),
});

/** A new tab, empty, over the same window as the one in front, played by the start; it comes to the front. */
export function addState(m: Machine): Machine {
  const from = frontOf(m);
  const names = new Set(m.states.map((s) => s.name));
  let n = m.states.length + 1;
  while (names.has(`Motion ${n}`)) n++;
  const state: MotionState = {
    id: newStateId(), name: `Motion ${n}`, event: "start", start: from.start, end: from.end, unit: from.unit, rows: [],
    ...(from.parts ? { parts: [...from.parts] } : {}),
  };
  return { states: [...m.states, state], front: state.id };
}

/** A copy of the tab in front, beside it, to try it another way. Its rows are its own; what it attaches stays linked. */
export function duplicateState(m: Machine): Machine {
  const from = frontOf(m);
  const state: MotionState = { ...clone(from), id: newStateId(), name: `${from.name} copy`, rows: from.rows.map((r) => ({ ...clone(r), id: newId("row") })) };
  const at = m.states.indexOf(from) + 1;
  return { states: [...m.states.slice(0, at), state, ...m.states.slice(at)], front: state.id };
}

/** The tab in front, gone, and every row that attached it; never the last. */
export function deleteState(m: Machine): Machine {
  if (m.states.length < 2) return m;
  const gone = frontOf(m);
  const at = m.states.indexOf(gone);
  const states = m.states
    .filter((s) => s.id !== gone.id)
    .map((s) => ({ ...s, rows: s.rows.filter((r) => !(r.kind === "state" && r.state === gone.id)) }));
  return { states, front: states[Math.max(0, at - 1)]!.id };
}

/** The parts a state ticks (M20): the ones its rows may move; unticked, a part's rows are kept and not played. */
export const setParts = (m: Machine, id: string, parts: string[]): Machine => withState(m, id, (s) => ({ ...s, parts }));

/** The parts a state moves: the ones it ticks, or every part. */
export const partsOf = (family: Family, s: MotionState) => family.machine!.parts.filter((p) => !s.parts || s.parts.includes(p.id));

/** The state's window, name, event or unit; its rows are kept inside a new window, a span at the least. */
export function setState(m: Machine, id: string, patch: Partial<Pick<MotionState, "name" | "event" | "unit" | "start" | "end">>): Machine {
  return withState(m, id, (s) => {
    const next = { ...s, ...patch };
    if (!(next.end - next.start >= MIN_SPAN)) return s;
    const fit = (r: StateRow): StateRow => {
      const start = Math.min(Math.max(r.start, next.start), next.end - MIN_SPAN);
      return { ...r, start, end: Math.max(start + MIN_SPAN, Math.min(r.end, next.end)) };
    };
    return { ...next, rows: next.rows.map(fit) };
  });
}

/**
 * A row put in the state: over `span`, above the row `above` (the one selected, so the new one wins where they meet),
 * else at the top.
 */
function insertRow(m: Machine, id: string, row: StateRow, above: string | null): Machine {
  return withState(m, id, (s) => {
    const at = above ? Math.max(0, s.rows.findIndex((r) => r.id === above)) : 0;
    return { ...s, rows: [...s.rows.slice(0, at), row, ...s.rows.slice(at)] };
  });
}

/** Where a new row goes on the window: from the playhead, 400ms or as much as is left, never off the end. */
function spanFrom(s: MotionState, at: number, length = 400): [number, number] {
  const start = Math.min(Math.max(s.start, Math.round(at)), s.end - MIN_SPAN);
  return [start, Math.min(s.end, start + Math.max(MIN_SPAN, length))];
}

/** A part's row, nothing set on it yet: moving a control sets that value, and only those are the row's. */
export function addPartRow(m: Machine, family: Family, part: string, at: number, above: string | null, id = newId("row")): Machine {
  const s = frontOf(m);
  const [start, end] = spanFrom(s, at);
  const ease = family.machine!.parts.find((p) => p.id === part)?.ease ?? "ease";
  const row: PartRow = { id, kind: "part", part, start, end, ease, values: {}, locked: false };
  return insertRow(m, s.id, row, above);
}

/** Another state attached to the one in front, as long as its own window, from the playhead — if it may be. */
export function attachState(m: Machine, attach: string, at: number, above: string | null, id = newId("row")): Machine {
  const s = frontOf(m);
  const other = m.states.find((x) => x.id === attach);
  if (!other || !canAttach(m.states, s.id, attach)) return m;
  const [start, end] = spanFrom(s, at, other.end - other.start);
  const row: AttachRow = { id, kind: "state", state: attach, start, end, locked: false };
  return insertRow(m, s.id, row, above);
}

const withRow = (m: Machine, rowId: string, fn: (r: StateRow) => StateRow | null): Machine =>
  withState(m, frontOf(m).id, (s) => ({ ...s, rows: s.rows.flatMap((r) => (r.id === rowId ? [fn(r)].filter((x): x is StateRow => !!x) : [r])) }));

/** A row's span, inside the window and a span at the least. A locked row does not move. */
export function setSpan(m: Machine, rowId: string, start: number, end: number): Machine {
  const s = frontOf(m);
  return withRow(m, rowId, (r) => {
    if (r.locked) return r;
    const a = Math.min(Math.max(s.start, Math.round(start)), s.end - MIN_SPAN);
    return { ...r, start: a, end: Math.min(s.end, Math.max(a + MIN_SPAN, Math.round(end))) };
  });
}

export const setLocked = (m: Machine, rowId: string, locked: boolean) => withRow(m, rowId, (r) => ({ ...r, locked }));

export const setEase = (m: Machine, rowId: string, ease: string) =>
  withRow(m, rowId, (r) => (r.kind === "part" && !r.locked ? { ...r, ease } : r));

/** A value set on a part's row, or taken off it (`null`), leaving it to the rows under it. */
export const setRowValue = (m: Machine, rowId: string, key: string, value: StateValue | null) =>
  withRow(m, rowId, (r) => {
    if (r.kind !== "part" || r.locked) return r;
    const values = { ...r.values };
    if (value === null) delete values[key];
    else values[key] = value;
    return { ...r, values };
  });

export const removeRow = (m: Machine, rowId: string) => withRow(m, rowId, () => null);

/** A token's right side, as a row keys it (M20: a pair set apart). */
export const rightOf = (token: string) => `${token}-right`;

/** Whether a part's row has its pair set apart: any right-side value on it. */
export const unmirrored = (row: PartRow, part: FamilyPart) => (part.sided ?? []).some((t) => rightOf(t) in row.values);

/**
 * A row's pair set apart or mirrored again (M20, his: "fix the mirror pairs"). Set apart, the right starts as the left
 * is: every sided value the row sets is set on its right too, so nothing moves until one side does. Mirrored again, the
 * right's values come off and the left's stand for both.
 */
export const setMirrored = (m: Machine, rowId: string, part: FamilyPart, mirrored: boolean) =>
  withRow(m, rowId, (r) => {
    if (r.kind !== "part" || r.locked) return r;
    const values = { ...r.values };
    for (const t of part.sided ?? []) {
      if (mirrored) delete values[rightOf(t)];
      else if (t in values && !(rightOf(t) in values)) values[rightOf(t)] = values[t]!;
    }
    return { ...r, values };
  });

/** A row one place higher (−1) or lower (+1) in the priority. */
export function moveRow(m: Machine, rowId: string, by: -1 | 1): Machine {
  return withState(m, frontOf(m).id, (s) => {
    const i = s.rows.findIndex((r) => r.id === rowId);
    const j = i + by;
    if (i < 0 || j < 0 || j >= s.rows.length) return s;
    const rows = [...s.rows];
    [rows[i], rows[j]] = [rows[j]!, rows[i]!];
    return { ...s, rows };
  });
}

/**
 * Reset: the tab in front back to the version's first state — its window, its event and its rows — keeping its name,
 * so a reset never costs him the other states he has made.
 */
export function resetFront(m: Machine, machine: FamilyMachine): Machine {
  const start = clone(machine.start[0]!);
  return withState(m, frontOf(m).id, (s) => ({ ...start, id: s.id, name: s.name }));
}

/** The state a real event plays on the stage (M19): the tab in front if that event plays it, else the first that it does. */
export const stateFor = (m: Machine, event: MotionState["event"]) =>
  frontOf(m).event === event ? frontOf(m) : m.states.find((s) => s.event === event) ?? null;

/** A row's name on the timeline: its part's, or the state it attaches; numbered where its part has more than one row. */
export function rowLabel(family: Family, m: Machine, state: MotionState, row: StateRow): string {
  if (row.kind === "state") return m.states.find((s) => s.id === row.state)?.name ?? "Missing motion";
  const label = family.machine!.parts.find((p) => p.id === row.part)?.label ?? row.part;
  const same = state.rows.filter((r) => r.kind === "part" && r.part === row.part);
  return same.length > 1 ? `${label} ${same.indexOf(row) + 1}` : label;
}

/** Copy's text for a family built from states: its version, and every state as data. A state is not a token. */
export function statesText(family: Family, m: Machine): string {
  const tuned = JSON.stringify(m.states) !== JSON.stringify(family.machine!.start);
  return `/* ${family.label} — Version ${family.version} states${tuned ? ", tuned" : ""} */\n${JSON.stringify(m.states, null, 2)}\n`;
}
