"use client";

import * as React from "react";

import type { MotionState, StateRow } from "@no-origins/ui/lib/motion-states";

import type { Family } from "@/content/families";
import {
  createMotion, deleteMotion, loadMotions, publishMotion, restoreMotion, saveMotion,
  type MotionVersion, type Outcome, type SavedMotion,
} from "@/app/actions";
import { useStudio } from "@/components/studio-context";
import { frontOf, readMachine, writeMachine, type Machine } from "@/lib/states";

/**
 * What a family built from states shares across its bench (Motion.md M19): its states and the tab in front, how to
 * change them, and the row selected. **Selecting a row holds the stage at the row's end**, the playhead there, so what
 * it sets is seen while it is configured, and the playhead follows the end as its span moves; letting go of it gives the
 * stage back, live. The stage reads it too — outside a bench (a concept study) it reads the saved states on its own and
 * nothing is selected.
 *
 * **Kept in the database** where the family says so (`saved: "database"`, the agent's motions, M20) and the studio
 * can: each state a draft, saved `SAVE_AFTER` ms after the last change on the `rev` it was loaded at — another device's
 * save first stops the saving until he loads it — made when its tab is, deleted with it if never published, and
 * published as versions. With no keys, or signed out, the states are the browser's, as M19's were.
 */
export type SaveStatus = "loading" | "saved" | "unsaved" | "saving" | "conflict" | "offline" | "signed-out" | "error";

export type Saving = {
  status: SaveStatus;
  /** Why the last thing asked of the database did not happen, in words. */
  message: string | null;
  /** A state's versions, newest first, and the one pages would play. */
  versionsOf: (id: string) => MotionVersion[];
  currentOf: (id: string) => string | null;
  /** Publish the tab in front under `label`; false with a message when it was not. */
  publish: (label: string) => Promise<boolean>;
  /** Make a version of the tab in front the one pages play, and its draft. */
  restore: (versionId: string) => Promise<boolean>;
  reload: () => Promise<void>;
};

export type MachineApi = {
  family: Family;
  machine: Machine;
  front: MotionState;
  update: (fn: (m: Machine) => Machine) => void;
  selected: StateRow | null;
  select: (id: string | null) => void;
  /** Where the playhead is, in the front state's ms. */
  playhead: () => number;
  /** How its states are kept in the database, where they are. */
  saving?: Saving;
};

const MachineContext = React.createContext<MachineApi | null>(null);

const nothing = () => {};

/** How long after the last change a draft is saved, ms: once a drag is over, not at every step of it. */
const SAVE_AFTER = 500;

/** The version's states, each under a UUID, so the first time the database has none they can be made there. */
function seeded(start: readonly MotionState[]): MotionState[] {
  const ids = new Map(start.map((s) => [s.id, crypto.randomUUID()]));
  return start.map((s) => ({
    ...(JSON.parse(JSON.stringify(s)) as MotionState),
    id: ids.get(s.id)!,
    rows: s.rows.map((r) => (r.kind === "state" ? { ...r, state: ids.get(r.state) ?? r.state } : r)),
  }));
}

/** The states in the database, kept as he goes: `null` until they have loaded, and when there is no database. */
function useSavedMachine(family: Family, on: boolean) {
  const [machine, setMachine] = React.useState<Machine | null>(null);
  const [status, setStatus] = React.useState<SaveStatus>(on ? "loading" : "offline");
  const [message, setMessage] = React.useState<string | null>(null);
  const [kept, setKept] = React.useState<Record<string, { versions: MotionVersion[]; currentId: string | null }>>({});
  // What the saver works from: refs, so a save in flight reads the newest states, not the render's.
  const latest = React.useRef<Machine | null>(null);
  const saved = React.useRef(new Map<string, { json: string; rev: number }>());
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = React.useRef<Promise<boolean> | null>(null);
  const halted = React.useRef(false);
  // One load at a time; and edits since a load began are not undone by it (React's development double mount loads
  // twice, and the second came back after a new tab and put the page back to the database's).
  const loading = React.useRef<Promise<void> | null>(null);
  const edits = React.useRef(0);

  const keep = React.useCallback((motion: SavedMotion) => {
    saved.current.set(motion.state.id, { json: JSON.stringify(motion.state), rev: motion.rev });
    setKept((k) => ({ ...k, [motion.state.id]: { versions: motion.versions, currentId: motion.currentId } }));
  }, []);

  const failed = React.useCallback((outcome: Extract<Outcome<unknown>, { ok: false }>) => {
    setMessage(outcome.message);
    if (outcome.reason === "offline") return setStatus("offline");
    if (outcome.reason === "signed-out") return setStatus("signed-out");
    if (outcome.reason === "conflict") {
      halted.current = true;
      return setStatus("conflict");
    }
    setStatus("error");
  }, []);

  const apply = React.useCallback((motions: SavedMotion[], front?: string) => {
    saved.current.clear();
    setKept({});
    motions.forEach(keep);
    const states = motions.map((m) => m.state);
    const next = { states, front: front && states.some((s) => s.id === front) ? front : states[0]!.id };
    latest.current = next;
    halted.current = false;
    setMachine(next);
    setStatus("saved");
    setMessage(null);
  }, [keep]);

  const load = React.useCallback((force = false): Promise<void> => {
    if (loading.current) return loading.current;
    const since = edits.current;
    const settle = (motions: SavedMotion[]) => {
      if (force || edits.current === since) apply(motions, latest.current?.front);
    };
    const run = async () => {
      const outcome = await loadMotions();
      if (!outcome.ok) return failed(outcome);
      if (outcome.value.length) return settle(outcome.value);
      // The first time: the version's motions, made in the database.
      const made: SavedMotion[] = [];
      for (const state of seeded(family.machine!.start)) {
        const created = await createMotion(state);
        if (!created.ok) return failed(created);
        made.push(created.value);
      }
      settle(made);
    };
    loading.current = run().finally(() => {
      loading.current = null;
    });
    return loading.current;
  }, [apply, failed, family]);

  React.useEffect(() => {
    if (!on) return;
    let live = true;
    void (async () => {
      if (live) await load();
    })();
    return () => {
      live = false;
    };
  }, [on, load]);

  /** Save every state that changed, make the new ones, delete the gone; one pass at a time. True when all is saved. */
  const flush = React.useCallback((): Promise<boolean> => {
    if (saving.current) return saving.current;
    const run = async (): Promise<boolean> => {
      const m = latest.current;
      if (!m || halted.current) return false;
      setStatus("saving");
      let ok = true;
      for (const state of m.states) {
        const json = JSON.stringify(state);
        const was = saved.current.get(state.id);
        if (was?.json === json) continue;
        if (!was) {
          const created = await createMotion(state);
          if (!created.ok) {
            failed(created);
            ok = false;
            continue;
          }
          keep(created.value);
          continue;
        }
        const outcome = await saveMotion(state, was.rev);
        if (!outcome.ok) {
          failed(outcome);
          if (outcome.reason === "conflict") return false;
          ok = false;
          continue;
        }
        saved.current.set(state.id, { json, rev: outcome.value.rev });
      }
      for (const id of [...saved.current.keys()]) {
        if (m.states.some((s) => s.id === id)) continue;
        const gone = await deleteMotion(id);
        if (!gone.ok) {
          // A published motion stays: it comes back.
          failed(gone);
          await load(true);
          return false;
        }
        saved.current.delete(id);
      }
      if (latest.current !== m) return run();
      if (ok) {
        setStatus("saved");
        setMessage(null);
      }
      return ok;
    };
    saving.current = run().finally(() => {
      saving.current = null;
    });
    return saving.current;
  }, [failed, keep, load]);

  const update = React.useCallback((fn: (m: Machine) => Machine) => {
    const m = latest.current;
    if (!m) return;
    const next = fn(m);
    if (next === m) return;
    edits.current++;
    latest.current = next;
    setMachine(next);
    // Only the tab in front moved: nothing to save.
    if (next.states === m.states) return;
    setStatus("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_AFTER);
  }, [flush]);

  /** A state as the database now has it, in place of the one on the page (a publish pins; going back replaces). */
  const replace = React.useCallback((motion: SavedMotion) => {
    keep(motion);
    const m = latest.current;
    if (!m) return;
    const next = { ...m, states: m.states.map((s) => (s.id === motion.state.id ? motion.state : s)) };
    latest.current = next;
    setMachine(next);
  }, [keep]);

  const publish = React.useCallback(async (label: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!(await flush())) return false;
    const m = latest.current!;
    const front = frontOf(m);
    const was = saved.current.get(front.id);
    if (!was) return false;
    const outcome = await publishMotion(front.id, label, was.rev);
    if (!outcome.ok) {
      failed(outcome);
      return false;
    }
    replace(outcome.value);
    setStatus("saved");
    setMessage(null);
    return true;
  }, [flush, failed, replace]);

  const restore = React.useCallback(async (versionId: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!(await flush())) return false;
    const front = frontOf(latest.current!);
    const was = saved.current.get(front.id);
    if (!was) return false;
    const outcome = await restoreMotion(front.id, versionId, was.rev);
    if (!outcome.ok) {
      failed(outcome);
      return false;
    }
    replace(outcome.value);
    setStatus("saved");
    return true;
  }, [flush, failed, replace]);

  const reload = React.useCallback(async () => {
    halted.current = false;
    await load(true);
  }, [load]);

  const api = React.useMemo<Saving>(() => ({
    status,
    message,
    versionsOf: (id) => kept[id]?.versions ?? [],
    currentOf: (id) => kept[id]?.currentId ?? null,
    publish,
    restore,
    reload,
  }), [status, message, kept, publish, restore, reload]);

  return { machine, update, saving: api };
}

export function MachineProvider({ family, onSelect, children }: { family: Family; onSelect?: (id: string | null) => void; children: React.ReactNode }) {
  const studio = useStudio();
  const { transport, tempo, setData } = studio;
  const data = studio.dataOf(family.id);
  const database = family.machine?.saved === "database";
  const kept = useSavedMachine(family, database);
  const local = React.useMemo(() => readMachine(family, data), [family, data]);
  // The database's where it has loaded; the browser's until then, and where there is none.
  const machine = kept.machine ?? local;
  const front = frontOf(machine);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = front.rows.find((r) => r.id === selectedId) ?? null;
  const pick = React.useRef(onSelect);
  React.useLayoutEffect(() => {
    pick.current = onSelect;
  }, [onSelect]);

  const inBrowser = React.useCallback(
    (fn: (m: Machine) => Machine) => setData(family.id, (d) => writeMachine(family, d, fn(readMachine(family, d)))),
    [setData, family],
  );
  // While the database's are on their way, nothing is edited: an edit to the browser's copy would be lost.
  const update = kept.machine ? kept.update : database && kept.saving.status === "loading" ? nothing : inBrowser;
  const select = React.useCallback(
    (id: string | null) => {
      setSelectedId(id);
      pick.current?.(id);
      if (!id) transport.live();
    },
    [transport, setSelectedId],
  );

  // The playhead at the selected row's end, and after it as the end moves. A layout effect of the stage has put the
  // front state's play on the transport by now, so the seek is within it.
  const end = selected?.end ?? null;
  React.useEffect(() => {
    if (end !== null) transport.seek((end - front.start) * tempo);
  }, [end, front.start, tempo, transport]);

  const api = React.useMemo<MachineApi>(
    () => ({
      family,
      machine,
      front,
      update,
      selected,
      select,
      playhead: () => {
        const state = transport.get();
        return state.family === family.id ? front.start + state.t / tempo : front.start;
      },
      ...(database ? { saving: kept.saving } : {}),
    }),
    [family, machine, front, update, selected, select, transport, tempo, database, kept.saving],
  );
  return <MachineContext.Provider value={api}>{children}</MachineContext.Provider>;
}

export function useMachine(family: Family): MachineApi {
  const context = React.useContext(MachineContext);
  const studio = useStudio();
  const data = studio.dataOf(family.id);
  const own = React.useMemo<MachineApi>(() => {
    const machine = readMachine(family, data);
    const front = frontOf(machine);
    return { family, machine, front, update: nothing, selected: null, select: nothing, playhead: () => front.start };
  }, [family, data]);
  return context && context.family.id === family.id ? context : own;
}
