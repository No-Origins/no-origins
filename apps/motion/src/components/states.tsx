"use client";

import * as React from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CopyPlus, Link2, Lock, LockOpen, Pause, Play as PlayIcon, Plus, RotateCcw, Trash2,
} from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Switch } from "@no-origins/ui/components/switch";
import { Tabs, TabsList, TabsTrigger } from "@no-origins/ui/components/tabs";
import { Text } from "@no-origins/ui/components/text";
import { Toggle } from "@no-origins/ui/components/toggle";
import {
  canAttach, formatStateTime, STATE_UNIT_MS, STATE_UNIT_STEP,
  type MotionState, type StateEvent, type StateRow, type StateUnit,
} from "@no-origins/ui/lib/motion-states";
import { cn } from "@no-origins/ui/lib/utils";

import { EASES, familyById, type Family, type Token } from "@/content/families";
import { Control } from "@/components/jigs";
import { useMachine } from "@/components/machine";
import { TEMPOS, useStudio, type Tempo } from "@/components/studio-context";
import { JigCard, ParameterControl } from "@/components/studio-jigs";
import {
  addPartRow, addState, attachState, deleteState, duplicateState, moveRow, newId, partsOf, removeRow, rightOf, rowLabel, setEase,
  setLocked, setMirrored, setParts, setRowValue, setSpan, setState, unmirrored,
} from "@/lib/states";

/**
 * The bench of a family built from states (Motion.md M19; his, 2026-09-30, on the agent: "select which component … will
 * be configured. And then once I configure, I can lock it … its own … start and end … open another tab … we shall name
 * it … attach motions from different tabs … overlap states … The higher, the more preference"). Three pieces, every
 * one of them the system's components:
 *
 * - **The states** (`StatesCard`): a tab a state (`Tabs`), a new one, a copy, a delete; its name, what plays it, and its
 *   window — a start and an end in one unit, ms · s · min.
 * - **The row selected** (`RowCard`): its span, its ease, its lock (`Toggle`), its place in the priority, and its
 *   part's controls — the studio's own, each setting its value on this row only, and cleared off it again.
 * - **The player** (`StatesPlayer`): the transport as every bench has it, and under the playhead one lane a row, top to
 *   bottom as they stand in the priority, each a `Slider` with two heads, its span, on the playhead's axis; where the
 *   field has no room for lanes (a phone), they are a card of their own (`RowsCard`).
 */

// ── measuring ────────────────────────────────────────────────────────────────────────────────────────────────────

/** An element's height as laid out, following it as the field resizes; a callback ref, so one mounted later is measured. */
function useHeight<T extends HTMLElement>(): [(el: T | null) => void, number] {
  const [el, setEl] = React.useState<T | null>(null);
  const [height, setHeight] = React.useState(0);
  React.useLayoutEffect(() => {
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, [el]);
  return [setEl, height];
}

// ── fields ───────────────────────────────────────────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<StateEvent, string> = {
  start: "Start · Play",
  enter: "Pointer enters",
  leave: "Pointer leaves",
  press: "Press",
  release: "Release",
  click: "Click",
};
const UNITS: StateUnit[] = ["ms", "s", "min"];

/** A time typed in the state's unit and kept in ms: committed on Enter or on leaving the field, Escape to forget it. */
function TimeField({ ms, unit, label, onCommit, disabled = false }: { ms: number; unit: StateUnit; label: string; onCommit: (ms: number) => void; disabled?: boolean }) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const commit = () => {
    if (draft !== null && draft.trim() && Number.isFinite(Number(draft))) onCommit(Math.round(Number(draft) * STATE_UNIT_MS[unit]));
    setDraft(null);
  };
  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      <Input
        type="number"
        className="h-8 min-w-0 flex-1 px-3 text-right tabular-nums"
        aria-label={label}
        step={STATE_UNIT_STEP[unit]}
        disabled={disabled}
        value={draft ?? formatStateTime(ms, unit)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(null);
        }}
      />
      <Text role="caption" className="shrink-0">{unit}</Text>
    </div>
  );
}

/** A state's name, typed; an empty one keeps the name it had. */
function NameField({ state, onCommit }: { state: MotionState; onCommit: (name: string) => void }) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const commit = () => {
    if (draft !== null && draft.trim()) onCommit(draft.trim());
    setDraft(null);
  };
  return (
    <Input
      className="h-8 w-full min-w-0 px-3"
      aria-label="Motion name"
      value={draft ?? state.name}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setDraft(null);
      }}
    />
  );
}

// ── the states ───────────────────────────────────────────────────────────────────────────────────────────────────

/** The states as tabs, and the one in front: its name, what plays it, and its window. */
export function StatesCard({ family, publish = true }: { family: Family; publish?: boolean }) {
  const { machine, front, update, select, saving } = useMachine(family);
  const events = family.machine!.events;
  const published = saving ? saving.versionsOf(front.id).length > 0 : false;
  return (
    <JigCard
      title="Motions"
      action={
        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon-xs" variant="ghost" aria-label="New motion" title="New motion" onClick={() => { update(addState); select(null); }}>
            <Plus />
          </Button>
          <Button size="icon-xs" variant="ghost" aria-label="Duplicate motion" title="A copy of this motion, to try it another way" onClick={() => { update(duplicateState); select(null); }}>
            <CopyPlus />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
              aria-label="Delete motion"
            title={machine.states.length < 2 ? "The last motion stays" : published ? "A published motion stays: its versions keep it" : "Delete this motion"}
            disabled={machine.states.length < 2 || published}
            onClick={() => { update(deleteState); select(null); }}
          >
            <Trash2 />
          </Button>
        </div>
      }
    >
      <Tabs value={front.id} onValueChange={(id) => { update((m) => ({ ...m, front: id })); select(null); }}>
        <TabsList aria-label="Motions" className="w-full flex-wrap justify-start group-data-horizontal/tabs:h-auto">
          {machine.states.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="h-8 max-w-full flex-none">
              <span className="truncate">{s.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Control label="Name">
          <NameField key={front.id} state={front} onCommit={(name) => update((m) => setState(m, front.id, { name }))} />
        </Control>
        <Control label="Plays on">
          <Select value={front.event} onValueChange={(event) => update((m) => setState(m, front.id, { event: event as StateEvent }))}>
            <SelectTrigger size="sm" className="h-8 w-full" aria-label="Plays on"><SelectValue /></SelectTrigger>
            <SelectContent>
              {events.map((e) => <SelectItem key={e} value={e}>{EVENT_LABELS[e]}</SelectItem>)}
            </SelectContent>
          </Select>
        </Control>
      </div>
      <PartsField family={family} />
      {saving && publish ? <PublishField family={family} /> : null}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem] gap-x-6 gap-y-3">
        <Control label="Start">
          <TimeField key={`${front.id}-start-${front.unit}`} ms={front.start} unit={front.unit} label="Window start" onCommit={(start) => update((m) => setState(m, front.id, { start }))} />
        </Control>
        <Control label="End">
          <TimeField key={`${front.id}-end-${front.unit}`} ms={front.end} unit={front.unit} label="Window end" onCommit={(end) => update((m) => setState(m, front.id, { end }))} />
        </Control>
        <Control label="Unit">
          <Select value={front.unit} onValueChange={(unit) => update((m) => setState(m, front.id, { unit: unit as StateUnit }))}>
            <SelectTrigger size="sm" className="h-8 w-full" aria-label="Unit"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </Control>
      </div>
    </JigCard>
  );
}

/** How the motion in front stands in the database, in a few words. */
const SAVE_WORDS: Record<string, string> = {
  loading: "Loading…",
  saved: "Saved",
  unsaved: "Not saved yet",
  saving: "Saving…",
  conflict: "Changed elsewhere",
  offline: "In this browser only",
  "signed-out": "Sign in to save",
  error: "Not saved",
};

/**
 * The motion in front in the database (Motion.md M20): saved as he goes, and published as a version under a name he
 * types — the next number, frozen, the motions it places pinned — or taken back to one it was. Refused, it says why.
 */
function PublishField({ family, inline = false }: { family: Family; inline?: boolean }) {
  const { front, saving } = useMachine(family);
  const [label, setLabel] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  if (!saving) return null;
  const versions = saving.versionsOf(front.id);
  const current = versions.find((v) => v.id === saving.currentOf(front.id));
  const next = (versions[0]?.number ?? 0) + 1;
  const connected = !["offline", "signed-out", "loading"].includes(saving.status);
  const publish = async () => {
    setBusy(true);
    if (await saving.publish(label.trim())) setLabel("");
    setBusy(false);
  };
  const heading = current ? `Version ${current.number} · ${current.label}` : "Not published";
  const field = (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {inline ? <Text role="label" className="max-w-40 shrink-0 truncate" title={heading}>{heading}</Text> : null}
          <Text role="caption" className="shrink-0" data-save-status={saving.status}>{SAVE_WORDS[saving.status]}</Text>
          {saving.status === "conflict" ? <Button size="xs" variant="outline" onClick={() => void saving.reload()}>Load it</Button> : null}
          <Input
            className="h-8 min-w-0 flex-1 px-3"
            aria-label="Version name"
            placeholder={`Name v${next}`}
            value={label}
            disabled={!connected || busy}
            onChange={(event) => setLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && label.trim()) void publish();
            }}
          />
          <Button size="xs" disabled={!connected || busy || !label.trim()} onClick={() => void publish()}>Publish</Button>
          {versions.length > 1 ? (
            <Select value="" onValueChange={(id) => void saving.restore(id)} disabled={!connected || busy}>
              <SelectTrigger size="sm" className="h-7 w-auto gap-2" aria-label="Go back to a version"><SelectValue placeholder="Back to" /></SelectTrigger>
              <SelectContent>
                {versions.map((v) => <SelectItem key={v.id} value={v.id}>v{v.number} · {v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
        </div>
        {saving.message && saving.status !== "saved" ? <Text role="caption" className="text-destructive">{saving.message}</Text> : null}
      </div>
  );
  return inline ? field : <Control label={heading}>{field}</Control>;
}

/**
 * The parts the motion moves, ticked (M20, his: "I will just check the checkbox and then I will see [the] eyes"): a row
 * is added only for a ticked part, and a part unticked is not touched by the motion — its rows kept, not played.
 */
function PartsField({ family }: { family: Family }) {
  const { front, update } = useMachine(family);
  const all = family.machine!.parts;
  const ticked = new Set(front.parts ?? all.map((p) => p.id));
  const id = React.useId();
  return (
    <Control label="Parts">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        {all.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <Checkbox
              id={`${id}-${p.id}`}
              checked={ticked.has(p.id)}
              onCheckedChange={(on) =>
                update((m) => setParts(m, front.id, all.map((x) => x.id).filter((x) => (x === p.id ? on === true : ticked.has(x)))))
              }
            />
            <Label htmlFor={`${id}-${p.id}`} className="text-xs font-normal">{p.label}</Label>
          </div>
        ))}
      </div>
    </Control>
  );
}

// ── adding rows ──────────────────────────────────────────────────────────────────────────────────────────────────

/** A row for each part the motion ticks, and another motion placed in it: from the playhead, above the row selected. */
function AddRows({ family, className }: { family: Family; className?: string }) {
  const { machine, front, update, selected, select, playhead } = useMachine(family);
  const others = machine.states.filter((s) => s.id !== front.id && canAttach(machine.states, front.id, s.id));
  // The row's id is made here, so it is selected at once; it is found as soon as the edit lands.
  const add = (part: string) => {
    const id = newId("row");
    update((m) => addPartRow(m, family, part, playhead(), selected?.id ?? null, id));
    select(id);
  };
  const attach = (state: string) => {
    const id = newId("row");
    update((m) => attachState(m, state, playhead(), selected?.id ?? null, id));
    select(id);
  };
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      {partsOf(family, front).map((p) => (
        <Button key={p.id} size="xs" variant="outline" onClick={() => add(p.id)} aria-label={`Add a row: ${p.label}`}>
          <Plus /> {p.label}
        </Button>
      ))}
      <Select value="" onValueChange={attach} disabled={!others.length}>
        <SelectTrigger size="sm" className="h-7 w-auto gap-2" aria-label="Place a motion" title={others.length ? "Place another motion in this one, at its own length" : "No other motion can be placed here"}>
          <SelectValue placeholder="Place" />
        </SelectTrigger>
        <SelectContent>
          {others.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── the row selected ─────────────────────────────────────────────────────────────────────────────────────────────

/** A control's height and the gap under it, and what the card takes besides its controls, in px: what a page holds. */
const CONTROL_PITCH = 88;
const ROW_CARD_REST = 214;

/**
 * The row selected: its span, its ease, its lock and its place in the priority, then its part's controls, two to a
 * line, paged to the room `budget` leaves. A value the row does not set shows what is underneath, dimmed; moving it sets
 * it on this row, and ✕ takes it off. Locked, nothing on it moves.
 */
export function RowCard({ family, budget }: { family: Family; budget: number }) {
  const studio = useStudio();
  const { machine, front, update, selected, select } = useMachine(family);
  // The page a row's controls are turned to is that row's: another row opens on its first.
  const [turned, setTurned] = React.useState<{ row: string | null; page: number }>({ row: null, page: 0 });
  const page = turned.row === selected?.id ? turned.page : 0;
  const setPage = (n: number) => setTurned({ row: selected?.id ?? null, page: n });
  // Which side of a pair set apart the controls edit: the row's own choice, the left when it is selected.
  const [sideOf, setSideOf] = React.useState<{ row: string | null; side: "left" | "right" }>({ row: null, side: "left" });
  if (!selected) {
    return (
      <JigCard title="Row">
        <Text role="caption">Pick a row on the timeline to set its part, or add one here. A row sets only the values you move on it.</Text>
        <AddRows family={family} />
      </JigCard>
    );
  }
  const row = selected;
  const index = front.rows.indexOf(row);
  const part = row.kind === "part" ? family.machine!.parts.find((p) => p.id === row.part) : undefined;
  const tokens = (part?.tokens ?? []).map((name) => family.tokens.find((t) => t.name === name)).filter((t): t is Token => !!t);
  const perPage = Math.max(1, Math.floor((budget - ROW_CARD_REST + 12) / CONTROL_PITCH)) * 2;
  const pages = Math.max(1, Math.ceil(tokens.length / perPage));
  const current = Math.min(page, pages - 1);
  const rest = family.machine!.restFrom ? studio.values(familyById(family.machine!.restFrom) ?? family) : family.machine!.rest;
  const attached = row.kind === "state" ? machine.states.find((s) => s.id === row.state) : undefined;
  // A pair set apart (M20): the row holds a right side, and its sided controls edit the side chosen.
  const paired = !!part?.sided?.length;
  const apart = row.kind === "part" && !!part && unmirrored(row, part);
  const side = apart && sideOf.row === row.id ? sideOf.side : "left";
  const sided = new Set(part?.sided ?? []);
  const keyOf = (name: string) => (apart && side === "right" && sided.has(name) ? rightOf(name) : name);

  return (
    <JigCard
      title={
        <div className="flex min-w-0 items-baseline gap-2">
          <Text role="label" as="h2" className="truncate">{rowLabel(family, machine, front, row)}</Text>
          <Text role="caption" className="shrink-0">priority {index + 1} of {front.rows.length}</Text>
        </div>
      }
      action={
        <Toggle
          size="sm"
          variant="outline"
          className="h-7 shrink-0"
          pressed={row.locked}
          onPressedChange={(locked) => update((m) => setLocked(m, row.id, locked))}
          aria-label="Lock row"
          title={row.locked ? "Unlock it to change it" : "Lock it, so nothing on it moves"}
        >
          {row.locked ? <Lock /> : <LockOpen />} {row.locked ? "Locked" : "Lock"}
        </Toggle>
      }
    >
      <div className="grid grid-cols-3 gap-x-6">
        <Control label="Start">
          <TimeField key={`${row.id}-s-${front.unit}`} ms={row.start} unit={front.unit} label="Row start" disabled={row.locked} onCommit={(start) => update((m) => setSpan(m, row.id, start, row.end))} />
        </Control>
        <Control label="End">
          <TimeField key={`${row.id}-e-${front.unit}`} ms={row.end} unit={front.unit} label="Row end" disabled={row.locked} onCommit={(end) => update((m) => setSpan(m, row.id, row.start, end))} />
        </Control>
        {row.kind === "part" ? (
          <Control label="Ease">
            <Select value={row.ease} onValueChange={(ease) => update((m) => setEase(m, row.id, ease))} disabled={row.locked}>
              <SelectTrigger size="sm" className="h-8 w-full" aria-label="Row ease"><SelectValue /></SelectTrigger>
              <SelectContent>
                {!EASES.some((e) => e.value === row.ease) ? <SelectItem value={row.ease}>{row.ease}</SelectItem> : null}
                {EASES.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Control>
        ) : (
          <Control label="Placed">
            <Button size="xs" variant="outline" className="h-8 w-full min-w-0" disabled={!attached} onClick={() => { update((m) => ({ ...m, front: row.state })); select(null); }}>
              <Link2 /> <span className="truncate">Open</span>
            </Button>
          </Control>
        )}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        <Button size="xs" variant="ghost" disabled={index === 0} onClick={() => update((m) => moveRow(m, row.id, -1))}><ArrowUp /> Higher</Button>
        <Button size="xs" variant="ghost" disabled={index === front.rows.length - 1} onClick={() => update((m) => moveRow(m, row.id, 1))}><ArrowDown /> Lower</Button>
        <Button size="xs" variant="ghost" onClick={() => { update((m) => removeRow(m, row.id)); select(null); }}><Trash2 /> Remove</Button>
        {paired && part ? (
          <div className="flex items-center gap-2 ps-1">
            <Switch id={`${row.id}-mirror`} size="sm" checked={!apart} disabled={row.locked} aria-label="Mirrored"
              onCheckedChange={(mirrored) => { update((m) => setMirrored(m, row.id, part, mirrored)); setSideOf({ row: row.id, side: "left" }); }} />
            <Label htmlFor={`${row.id}-mirror`} className="text-xs font-normal">Mirrored</Label>
            {apart ? (
              <Tabs value={side} onValueChange={(v) => setSideOf({ row: row.id, side: v as "left" | "right" })}>
                <TabsList aria-label="Side" className="h-7">
                  <TabsTrigger value="left" className="h-6 px-2 text-xs">Left</TabsTrigger>
                  <TabsTrigger value="right" className="h-6 px-2 text-xs">Right</TabsTrigger>
                </TabsList>
              </Tabs>
            ) : null}
          </div>
        ) : null}
        {pages > 1 ? (
          <div className="ms-auto flex shrink-0 items-center gap-1">
            <Button size="icon-xs" variant="ghost" aria-label="Previous controls" disabled={current === 0} onClick={() => setPage(current - 1)}><ArrowLeft /></Button>
            <Text role="mono">{current + 1}/{pages}</Text>
            <Button size="icon-xs" variant="ghost" aria-label="Next controls" disabled={current + 1 === pages} onClick={() => setPage(current + 1)}><ArrowRight /></Button>
          </div>
        ) : null}
      </div>
      {row.kind === "part" ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {tokens.slice(current * perPage, (current + 1) * perPage).map((token) => {
            const key = keyOf(token.name);
            const set = key in row.values;
            // The right side unset stands where the left does, and the left where the rest is.
            const under = key === token.name ? rest[token.name] : row.values[token.name] ?? rest[token.name];
            const own = side === "right" && sided.has(token.name);
            return (
              <ParameterControl
                key={key}
                token={own ? { ...token, label: `${token.label} · right` } : token}
                value={set ? row.values[key]! : under ?? 0}
                swatches={token.swatches?.({ ...rest, ...row.values })}
                unset={!set}
                disabled={row.locked || (side === "right" && !sided.has(token.name))}
                onChange={(value) => update((m) => setRowValue(m, row.id, key, value))}
                onClear={() => update((m) => setRowValue(m, row.id, key, null))}
              />
            );
          })}
        </div>
      ) : (
        <Text role="caption">{attached ? `${attached.name} plays over this span, stretched to it, and changes wherever it is edited.` : "The motion placed here is gone."}</Text>
      )}
    </JigCard>
  );
}

// ── lanes ────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A lane's height and the gap under it, in px. */
const LANE = 32;

/** A row's name at the head of its lane: pressed, it is the row selected; pressed again, it lets go. */
function LaneHead({ family, row }: { family: Family; row: StateRow }) {
  const { machine, front, selected, select } = useMachine(family);
  const on = selected?.id === row.id;
  const label = rowLabel(family, machine, front, row);
  return (
    <Button
      size="xs"
      variant={on ? "secondary" : "ghost"}
      className="h-7 w-full min-w-0 justify-start gap-1.5 px-2"
      aria-pressed={on}
      aria-label={`Row ${label}`}
      title={`${label}, ${formatStateTime(row.start, front.unit)}–${formatStateTime(row.end, front.unit)} ${front.unit}${row.locked ? ", locked" : ""}`}
      onClick={() => select(on ? null : row.id)}
    >
      {row.kind === "state" ? <Link2 /> : null}
      <span className="truncate">{label}</span>
      {row.locked ? <Lock className="ms-auto" /> : null}
    </Button>
  );
}

/**
 * A row's span on the axis: the system's slider with two heads, a thinner bar than the playhead's. Its heads are half
 * the playhead's head, so it stands in by the difference on each side and its heads' centres meet the playhead's axis.
 */
function Lane({ family, row }: { family: Family; row: StateRow }) {
  const { machine, front, update, selected } = useMachine(family);
  const idle = row.kind === "part" && !!front.parts && !front.parts.includes(row.part);
  return (
    <div className={cn("flex h-7 items-center px-1", selected && selected.id !== row.id && "opacity-60", idle && "opacity-30")} title={idle ? "Its part is not ticked: not played" : undefined}>
      <Slider
        className="[--slider-height:16px]"
        min={front.start}
        max={front.end}
        step={1}
        minStepsBetweenThumbs={10}
        value={[row.start, row.end]}
        disabled={row.locked}
        aria-label={`${rowLabel(family, machine, front, row)} span`}
        onValueChange={([a, b]) => a !== undefined && b !== undefined && update((m) => setSpan(m, row.id, a, b))}
      />
    </div>
  );
}

/** The page of lanes the playhead's axis holds, following the row selected to its page. */
function useLanePage(rows: readonly StateRow[], capacity: number, selectedId: string | null) {
  // A page turned by hand holds while the same row is selected; selecting another turns to that row's page.
  const [turned, setTurned] = React.useState<{ page: number; for: string | null }>({ page: 0, for: null });
  const pages = Math.max(1, Math.ceil(rows.length / Math.max(1, capacity)));
  const at = selectedId ? rows.findIndex((r) => r.id === selectedId) : -1;
  const page = turned.for === selectedId || at < 0 ? turned.page : Math.floor(at / Math.max(1, capacity));
  const current = Math.min(page, pages - 1);
  const setPage = (n: number) => setTurned({ page: n, for: selectedId });
  return { current, pages, setPage, shown: rows.slice(current * capacity, (current + 1) * capacity) };
}

function Pager({ current, pages, setPage }: { current: number; pages: number; setPage: (n: number) => void }) {
  if (pages < 2) return null;
  return (
    <div className="ms-auto flex shrink-0 items-center gap-1">
      <Button size="icon-xs" variant="ghost" aria-label="Previous rows" disabled={current === 0} onClick={() => setPage(current - 1)}><ArrowLeft /></Button>
      <Text role="mono">{current + 1}/{pages}</Text>
      <Button size="icon-xs" variant="ghost" aria-label="Next rows" disabled={current + 1 === pages} onClick={() => setPage(current + 1)}><ArrowRight /></Button>
    </div>
  );
}

/** The lanes as a card of their own, where the player has no room for them (a phone): heads and spans, no playhead. */
export function RowsCard({ family, budget }: { family: Family; budget: number }) {
  const { front, selected } = useMachine(family);
  const capacity = Math.max(1, Math.floor((budget - 150) / LANE));
  const { current, pages, setPage, shown } = useLanePage(front.rows, capacity, selected?.id ?? null);
  return (
    <JigCard title="Rows" action={<Pager current={current} pages={pages} setPage={setPage} />}>
      {front.rows.length ? (
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-1">
          {shown.map((row) => (
            <React.Fragment key={row.id}>
              <LaneHead family={family} row={row} />
              <Lane family={family} row={row} />
            </React.Fragment>
          ))}
        </div>
      ) : (
        <Text role="caption">{"No rows yet. Add a part's row, or place another motion."}</Text>
      )}
      <AddRows family={family} />
    </JigCard>
  );
}

// ── the player ───────────────────────────────────────────────────────────────────────────────────────────────────

/** What the player takes besides its lanes, in px: the transport's line, the playhead, the adding line and their gaps. */
const PLAYER_REST = 164;

/**
 * The transport of a family built from states (M19): ↺ and play or pause, the time in the state's unit, Loop and Tempo,
 * as every bench has them; the playhead over the state's window; and under it one lane a row, in the priority's order,
 * with a violet line from the playhead down through them, so the moment it is at is read on every row. Where there is
 * no room for a lane (`lanes` off, or a field too short), it is the transport and the playhead only.
 */
export function StatesPlayer({ family, lanes }: { family: Family; lanes: boolean }) {
  const { transport, play, loop, setLoop, tempo, setTempo } = useStudio();
  const { front, selected, saving } = useMachine(family);
  const state = React.useSyncExternalStore(transport.subscribe, transport.get, transport.get);
  const [box, height] = useHeight<HTMLDivElement>();
  const loopId = React.useId();
  const mine = state.family === family.id;
  const total = mine ? state.phases.reduce((sum, p) => sum + p.ms, 0) : 0;
  const t = mine ? Math.min(state.t, total) : 0;
  const playing = mine && state.mode === "playing";
  const held = mine && state.mode !== "live";
  const at = t / Math.max(total, 1);
  const time = front.start + t / tempo;
  const capacity = lanes ? Math.floor((height - PLAYER_REST) / LANE) : 0;
  const { current, pages, setPage, shown } = useLanePage(front.rows, Math.max(1, capacity), selected?.id ?? null);
  const withLanes = capacity >= 1;

  const playhead = (
    <Slider
      className="relative z-20 **:data-[slot=slider-thumb]:bg-secondary! **:data-[slot=slider-thumb]:ring-secondary/30!"
      min={0}
      max={Math.max(1, total)}
      step={1}
      value={[t]}
      onValueChange={([v]) => v !== undefined && transport.seek(v)}
      aria-label="Timeline"
    />
  );

  return (
    <div ref={box} className="@container flex size-full min-h-0 flex-col justify-center gap-2" data-states-player>
      {lanes && saving ? <PublishField family={family} inline /> : null}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4">
        <div className={cn("flex items-center gap-2", withLanes && "w-28")}>
          <Button size="icon-sm" variant="outline" aria-label="Play from the start" onClick={play}><RotateCcw /></Button>
          <Button size="icon-lg" className="@max-[26rem]:size-9" aria-label={playing ? "Pause" : "Play from the playhead"} onClick={() => (playing ? transport.pause() : transport.play())}>
            {playing ? <Pause className="size-4 fill-current" /> : <PlayIcon className="size-4 fill-current" />}
          </Button>
        </div>
        <div className="flex min-w-0 items-baseline gap-3">
          <Text role="body" as="span" className="shrink-0 whitespace-nowrap tabular-nums">
            {formatStateTime(time, front.unit)} / {formatStateTime(front.end, front.unit)} {front.unit}
          </Text>
          <Text role="caption" className="truncate @max-[30rem]:hidden">{front.name} · {EVENT_LABELS[front.event]}</Text>
        </div>
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <Switch id={loopId} checked={loop} onCheckedChange={setLoop} aria-label="Loop" />
            <Label htmlFor={loopId} className="max-sm:sr-only">Loop</Label>
          </div>
          <Select value={String(tempo)} onValueChange={(v) => setTempo(Number(v) as Tempo)}>
            <SelectTrigger size="sm" aria-label={`Tempo, ${tempo}×`}><SelectValue>{tempo}×</SelectValue></SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectGroup>
                <SelectLabel>Tempo</SelectLabel>
                {TEMPOS.map((n) => <SelectItem key={n} value={String(n)}>{n === 1 ? "1× real time" : `${n}× slower`}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      {withLanes ? (
        <>
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="h-7" />
              {shown.map((row) => <LaneHead key={row.id} family={family} row={row} />)}
            </div>
            <div className="relative flex min-w-0 flex-col gap-1">
              <div className="flex h-7 items-center">{playhead}</div>
              {shown.map((row) => <Lane key={row.id} family={family} row={row} />)}
              {held ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-3.5 bottom-0 z-10 w-0.5 -translate-x-1/2 bg-secondary"
                  style={{ left: `calc(${at} * (100% - var(--slider-height)) + var(--slider-height) / 2)` }}
                />
              ) : null}
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            {front.rows.length ? null : <Text role="caption">No rows yet:</Text>}
            <AddRows family={family} />
            <Pager current={current} pages={pages} setPage={setPage} />
          </div>
        </>
      ) : (
        <div className="flex h-7 items-center">{playhead}</div>
      )}
    </div>
  );
}

// ── the rail ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** The states over the row selected, as the wide field's instruments have room for both; the row gets what is left. */
export function MachineRail({ family }: { family: Family }) {
  const [rail, railHeight] = useHeight<HTMLDivElement>();
  const [states, statesHeight] = useHeight<HTMLDivElement>();
  return (
    <div ref={rail} className="flex h-full min-h-0 flex-col gap-3">
      <div ref={states} className="shrink-0">
        <StatesCard family={family} publish={false} />
      </div>
      <RowCard family={family} budget={railHeight - statesHeight - 12} />
    </div>
  );
}

/** One view of the bench where the field shows one at a time: the states (and the lanes, `lanes`), or the row. */
export function MachineView({ family, view, budget, lanes }: { family: Family; view: "states" | "row"; budget: number; lanes: boolean }) {
  const [states, statesHeight] = useHeight<HTMLDivElement>();
  if (view === "row") return <RowCard family={family} budget={budget} />;
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div ref={states} className="shrink-0">
        <StatesCard family={family} publish={lanes} />
      </div>
      {lanes ? <RowsCard family={family} budget={budget - statesHeight - 12} /> : null}
    </div>
  );
}
