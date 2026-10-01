"use client";

import * as React from "react";
import gsap from "gsap";

import type { Family, FamilyId, PresetId, Values } from "@/content/families";
import { readDecided, sameValues } from "@/lib/tokens";

/**
 * What every slot on a studio page shares (Motion.md M6): each family's values on its jig, the specimen's own options
 * (its block's columns and rows, every family's, then its own), the timeline's settings — tempo, loop, hold, the same
 * on every motion — and the transport the timeline drives and the stage answers. Kept in the browser only
 * (`no-origins:motion`), wrapped so a blocked storage costs nothing but the memory — and where he has dragged each
 * family's jigs.
 */

export type Tempo = 1 | 2 | 5 | 10;

/**
 * A part of a play, named — "grow", "hold", "expand" — and how long it takes in real ms, slowed by the tempo. A part
 * whose length is a setting of the play rather than motion carries `drag`, and is set by dragging it on the timeline.
 */
export type Phase = {
  label: string;
  ms: number;
  drag?: PhaseDrag;
  /** What the part is, in a line, shown as its title on the timeline. */
  note?: string;
};

/**
 * How a phase that is a setting is dragged on the timeline (his, 2026-09-27: "Hold should also be a hold and drag on
 * the time line"): the setting's range and step, in its own ms; `scale`, the phase's ms for each of the setting's — the
 * tempo where the tempo slows the phase, 1 for a hold, which is real time; and where the new value goes. The hold is one
 * on every motion; the page's loading time is loading's.
 */
export type PhaseDrag = { min: number; max: number; step: number; scale: number; set: (value: number) => void };

/** The hold every play has, in real ms: its range and step on the timeline. */
export const HOLD = { min: 200, max: 3000, step: 50 } as const;

/** The hold, as a phase of a play — the active state held, the page held — dragged on the timeline. */
export const holdPhase = (hold: number, setHold: (hold: number) => void): Phase => ({
  label: "hold",
  ms: hold,
  drag: { ...HOLD, scale: 1, set: setHold },
});

/**
 * The timeline's transport (his, 2026-09-27: "While playing for any jiggle motion show a timeline bar", then "I don't
 * think we need scrub we can just have timeline but I also want control over the timeline … a slider on every
 * frame"). One play of the motion on the stage, as phases, and a playhead `t` in ms through it. **Live**: the stage is
 * its own — a hover moves the block, the loader turns. **Playing**: the playhead runs, on a GSAP ticker, and the stage
 * paints the play at it; at the end it loops or goes live. **Paused**: the stage holds the frame at the playhead, where
 * a drag of the slider put it.
 *
 * An external store rather than React state: the playhead moves every frame, and only the timeline and the stage's
 * painter read it at that rate. Everything else reads the mode, which changes a few times a play.
 */
export type TransportMode = "live" | "playing" | "paused";
export type TransportState = { family: FamilyId | null; phases: Phase[]; t: number; mode: TransportMode };
export type Transport = {
  get: () => TransportState;
  subscribe: (listener: () => void) => () => void;
  /** A stage's play, new or retuned: its phases. The playhead stays where it is, within the new length. */
  load: (family: FamilyId, phases: Phase[]) => void;
  /** Run the playhead from where it is — or from the start, when asked or when it is at the end. */
  play: (fromStart?: boolean) => void;
  pause: () => void;
  /** Put the playhead at `t` ms and hold the frame there. */
  seek: (t: number) => void;
  /** A stage leaving (a page turned): its play is over. */
  release: (family: FamilyId) => void;
  /** Let go of the frame held, keeping the play: the stage is its own again (Motion.md M19, a row let go of). */
  live: () => void;
  setLoop: (loop: boolean) => void;
};

const LIVE: TransportState = { family: null, phases: [], t: 0, mode: "live" };
const lengthOf = (phases: Phase[]) => phases.reduce((sum, p) => sum + p.ms, 0);

function createTransport(): Transport {
  let state = LIVE;
  let loop = false;
  let last = 0;
  const listeners = new Set<() => void>();
  const emit = (next: Partial<TransportState>) => {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };
  const halt = () => gsap.ticker.remove(tick);
  function tick() {
    const now = performance.now();
    const end = lengthOf(state.phases);
    let t = state.t + (now - last);
    last = now;
    if (t >= end) {
      if (loop && end > 0) t %= end;
      else {
        halt();
        emit({ t: end, mode: "live" });
        return;
      }
    }
    emit({ t });
  }
  return {
    get: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    load: (family, phases) => {
      if (state.family !== family) {
        halt();
        emit({ family, phases, t: 0, mode: "live" });
      } else emit({ phases, t: Math.min(state.t, lengthOf(phases)) });
    },
    play: (fromStart = false) => {
      if (!state.family) return;
      halt();
      emit({ t: fromStart || state.t >= lengthOf(state.phases) ? 0 : state.t, mode: "playing" });
      last = performance.now();
      gsap.ticker.add(tick);
    },
    pause: () => {
      halt();
      if (state.mode === "playing") emit({ mode: "paused" });
    },
    seek: (t) => {
      halt();
      emit({ t: Math.max(0, Math.min(t, lengthOf(state.phases))), mode: "paused" });
    },
    release: (family) => {
      if (state.family !== family) return;
      halt();
      emit(LIVE);
    },
    live: () => {
      halt();
      if (state.mode !== "live") emit({ mode: "live" });
    },
    setLoop: (on) => void (loop = on),
  };
}
export const TEMPOS: readonly Tempo[] = [1, 2, 5, 10];

type Saved = {
  values: Partial<Record<FamilyId, Values>>;
  /** The preset each family's values were last set from. */
  from: Partial<Record<FamilyId, PresetId>>;
  /** The specimen's options, which are not motion and never go into the settings. */
  options: Partial<Record<FamilyId, Options>>;
  tempo: Tempo;
  loop: boolean;
  /** How long a play holds its end state before letting go, in ms — real time, never slowed by the tempo. */
  hold: number;
  /** Where he has put each family's jigs, by dragging them (his, 2026-10-01): their ids, column by column. */
  jigs: Partial<Record<FamilyId, JigArrangement>>;
};

/** A family's jigs as he has arranged them: the ids in the stage's left column and its right, top to bottom. */
export type JigArrangement = { left: string[]; right: string[] };

const KEY = "no-origins:motion";
export type Option = string | number | boolean;
type Widen<T> = T extends string ? string : T extends number ? number : boolean;
type Options = Record<string, Option>;
const EMPTY: Saved = { values: {}, from: {}, options: {}, tempo: 1, loop: false, hold: 900, jigs: {} };

function load(): Saved {
  if (typeof window === "undefined") return EMPTY;
  try {
    const text = window.localStorage.getItem(KEY);
    if (!text) return EMPTY;
    // The agents' states were kept here as `data` until Motion.md M24 took them out: not carried on.
    const kept = JSON.parse(text) as Partial<Saved> & { data?: unknown };
    delete kept.data;
    return { ...EMPTY, ...kept };
  } catch {
    return EMPTY;
  }
}

type Studio = {
  /** The decided values, off the page's root; null until the browser has them. */
  decided: Record<FamilyId, Values> | null;
  values: (family: Family) => Values;
  setValue: (family: Family, token: string, value: Values[string]) => void;
  /** Every value at once, as kept somewhere else: an action's draft, loaded from the database (Motion.md M24). */
  replaceValues: (family: Family, values: Values) => void;
  applyPreset: (family: Family, id: PresetId) => void;
  reset: (family: Family) => void;
  /** The preset a family's values match exactly, or null once they have been tuned. */
  presetOf: (family: Family) => PresetId | null;
  /** The preset its values started from. */
  fromOf: (family: Family) => PresetId;
  /** An option, typed as its fallback is — a string, a number or a boolean, never the fallback's literal. */
  optionOf: <T extends Option>(family: Family, key: string, fallback: T) => Widen<T>;
  setOption: (family: Family, key: string, value: Option) => void;
  /** The specimen's block as set, in cells — the `columns` and `rows` options, from the family's `block`. */
  blockOf: (family: Family) => { columns: number; rows: number };
  tempo: Tempo;
  setTempo: (tempo: Tempo) => void;
  loop: boolean;
  setLoop: (loop: boolean) => void;
  hold: number;
  setHold: (hold: number) => void;
  /** Where a family's jigs stand, as he left them; undefined until he has moved one. */
  jigsOf: (family: FamilyId) => JigArrangement | undefined;
  setJigs: (family: FamilyId, jigs: JigArrangement | null) => void;
  /** Play from the start, on the timeline. */
  play: () => void;
  transport: Transport;
};

const StudioContext = React.createContext<Studio | null>(null);

/**
 * The decided values, read once in the browser — the stylesheet is on the page before any script runs — and none on
 * the server, where nothing of the studio is drawn anyway: the grid places no box until it has measured.
 */
let decidedOnce: Record<FamilyId, Values> | null = null;
const readDecidedOnce = () => (decidedOnce ??= readDecided());
const never = () => () => {};

export function useStudio() {
  const studio = React.useContext(StudioContext);
  if (!studio) throw new Error("useStudio outside StudioProvider");
  return studio;
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = React.useState<Saved>(load);
  const decided = React.useSyncExternalStore(never, readDecidedOnce, () => null);
  const [transport] = React.useState(createTransport);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {}
  }, [saved]);
  React.useEffect(() => transport.setLoop(saved.loop), [transport, saved.loop]);

  const studio = React.useMemo<Studio>(() => {
    // A saved choice the family no longer offers (a round that replaced its options) gives way to the decided value.
    const offered = (family: Family, values: Values | undefined): Values =>
      Object.fromEntries(
        Object.entries(values ?? {}).filter(([name, v]) => {
          const token = family.tokens.find((t) => t.name === name);
          return !!token && (token.kind !== "choice" || !!token.choices?.some((c) => c.value === v));
        }),
      );
    const valuesOf = (family: Family): Values => ({ ...decided?.[family.id], ...offered(family, saved.values[family.id]) });
    const presetValues = (family: Family, id: PresetId) => (id === "A" ? decided?.[family.id] : family.presets.find((p) => p.id === id)?.values);
    const update = (fn: (s: Saved) => Saved) => setSaved(fn);
    const optionOf = <T extends Option>(family: Family, key: string, fallback: T) => {
      const value = saved.options[family.id]?.[key];
      return (typeof value === typeof fallback ? value : fallback) as Widen<T>;
    };
    return {
      decided,
      values: valuesOf,
      setValue: (family, token, value) =>
        update((s) => ({ ...s, values: { ...s.values, [family.id]: { ...decided?.[family.id], ...s.values[family.id], [token]: value } } })),
      replaceValues: (family, values) => update((s) => ({ ...s, values: { ...s.values, [family.id]: { ...decided?.[family.id], ...values } } })),
      applyPreset: (family, id) =>
        update((s) => ({ ...s, values: { ...s.values, [family.id]: { ...presetValues(family, id) } }, from: { ...s.from, [family.id]: id } })),
      reset: (family) =>
        update((s) => {
          const values = { ...s.values };
          delete values[family.id];
          return { ...s, values, from: { ...s.from, [family.id]: "A" } };
        }),
      presetOf: (family) => {
        const now = valuesOf(family);
        return family.presets.find((p) => sameValues(family, now, presetValues(family, p.id)))?.id ?? null;
      },
      fromOf: (family) => saved.from[family.id] ?? "A",
      optionOf,
      setOption: (family, key, value) =>
        update((s) => ({ ...s, options: { ...s.options, [family.id]: { ...s.options[family.id], [key]: value } } })),
      blockOf: (family) => ({ columns: optionOf(family, "columns", family.block.columns), rows: optionOf(family, "rows", family.block.rows) }),
      tempo: saved.tempo,
      setTempo: (tempo) => update((s) => ({ ...s, tempo })),
      loop: saved.loop,
      setLoop: (loop) => update((s) => ({ ...s, loop })),
      hold: saved.hold,
      setHold: (hold) => update((s) => ({ ...s, hold })),
      jigsOf: (family) => saved.jigs?.[family],
      setJigs: (family, jigs) =>
        update((s) => {
          const next = { ...s.jigs };
          if (jigs) next[family] = jigs;
          else delete next[family];
          return { ...s, jigs: next };
        }),
      play: () => transport.play(true),
      transport,
    };
  }, [decided, saved, transport]);

  return <StudioContext.Provider value={studio}>{children}</StudioContext.Provider>;
}
