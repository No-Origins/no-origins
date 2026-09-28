"use client";

import * as React from "react";
import { ArrowDown, ArrowRight, ChevronDown, GripVertical, Pause, Play as PlayIcon, Repeat, SkipBack } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@no-origins/ui/components/dropdown-menu";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { Separator } from "@no-origins/ui/components/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Slot } from "@no-origins/ui/components/slot";
import { Switch } from "@no-origins/ui/components/switch";
import { Text } from "@no-origins/ui/components/text";
import { Toggle } from "@no-origins/ui/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { cn } from "@no-origins/ui/lib/utils";

import { EASES, PRESET_IDS, type Family, type PresetId, type Token } from "@/content/families";
import { TEMPOS, useStudio, type Phase, type Tempo } from "@/components/studio-context";
import { FOCUS_SAMPLE_COUNT } from "@/components/focus-stage";
import { settingsText, tokenLabel } from "@/lib/tokens";

/**
 * The jigs (Motion.md M5, M6): slots on the grid around the stage, each a Card. Every control names the token it moves
 * and what it touches; the specimen and the presets sit left of the stage, the tokens and the settings right of it.
 * A jig is sized by its slot and clips like everything on the grid — a jig that is cut off is in a slot too small.
 *
 * **Each control lives with what it is about** (his, 2026-09-27: "Organise the controls that specifically belong to
 * timeline should be in time[line] and across all the motions"). The timeline under the stage holds how a play runs —
 * Play, Loop, Tempo, and the phases that are settings (the hold, dragged; loading's page time) — the same on every
 * motion. The specimen's jig holds what plays: its block's Columns and Rows, every family's, then its own. The tokens
 * are the motion.
 *
 * **One rhythm** (his, 2026-09-27: "no spacing is being followed among the controls in the jigs, it's very
 * confusing"): everything in a jig is 12 apart down — its head and its content, one control and the next — and two
 * controls side by side are 24 apart, so each reads as its own; a control sits 8 under its own head. A control is the
 * same three parts every time: its label with its value right after it (never at the far edge, where it read as the
 * next control's), a caption on the next line where it has one (a token's, saying what it moves: one line, never
 * wrapping), then the control in a band as tall as the tallest control in its row — a toggle group's or a select's
 * 36, a slider's 20 — centred, so a slider beside a select stands level with it. A jig's groups are split by a
 * separator.
 */

/** A jig: a card filling its slot, a label for a head. */
function Jig({ title, note, children, action }: { title: string; note?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Slot fill="transparent" inset={0}>
      <Card size="sm" className="h-full min-h-0 gap-3 shadow-none">
        <CardHeader className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Text role="label" as="h2">{title}</Text>
            {note ? <Text role="caption">{note}</Text> : null}
          </div>
          {action}
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3">{children}</CardContent>
      </Card>
    </Slot>
  );
}

/**
 * One control: its label and value on one line, what it touches on the next (one line), then the control, 8 below, in
 * a band that fills its row — a grid stretches every control to its row, as tall as its tallest, and the band takes
 * the rest and centres the control in it — and is never shorter than a slider's 20.
 */
function Control({ label, value, touches, className, children }: { label: string; value?: string; touches?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 items-baseline gap-2">
          <Label>{label}</Label>
          {value ? <Text role="mono" as="span" className="shrink-0">{value}</Text> : null}
        </div>
        {touches ? <Text role="caption" className="truncate">{touches}</Text> : null}
      </div>
      <div className="flex min-h-5 min-w-0 flex-1 items-center">{children}</div>
    </div>
  );
}

/** Controls two to a row, 12 apart down and 24 across; a control marked `col-span-2` takes the row. */
function Controls({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>;
}

// ── the header ────────────────────────────────────────────────────────────────────────────────────────────────

/** The row over the stage: the family's number and name. The tempo it is slowed by is on the timeline. */
export function Header({ family, index }: { family: Family; index: number }) {
  return (
    <Slot fill="transparent" alignY="end">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Text role="label" tone="muted">
          {String(index + 1).padStart(2, "0")} — {family.label}
        </Text>
        <Text role="heading" as="h1" className="truncate">{family.title}</Text>
      </div>
    </Slot>
  );
}

// ── the timeline ──────────────────────────────────────────────────────────────────────────────────────────────

const lengthOf = (phases: readonly Phase[]) => phases.reduce((sum, p) => sum + p.ms, 0);

/**
 * The timeline (Motion.md M6; his, 2026-09-27: "While playing for any jiggle motion show a timeline bar", then "I don't
 * think we need scrub we can just have timeline but I also want control over the timeline … a slider on every frame
 * and … information on milliseconds at each section", then "Play, Loop, Tempo should be part of the timeline
 * controls"): the row under the stage, holding every control of how a play runs, the same on every motion. Play from
 * the start and play or pause from the playhead; one play of the motion as a slider — drag it to any frame and the
 * stage holds there — and the time so far; then Loop and Tempo. Under the slider, the play's phases (`Phases`), where a
 * phase that is a setting is dragged. It reads the transport every frame; nothing else on the page does.
 *
 * Two lines where the row is wide enough: the buttons, the slider, Loop and Tempo, and under them the phases and the
 * time, so the slider and the phases take the width. Narrower — a phone's stage — the buttons, the time, Loop and Tempo
 * take a line of their own over the slider, and the layout gives the timeline two rows.
 *
 * While a phase is dragged the timeline keeps the scale it had when the phase was pressed, so its end stays with the
 * pointer and what it pushes past the end is cut off; it fits the play again on letting go.
 */
export function Timeline({ family }: { family: Family }) {
  const { transport, play, loop, setLoop, tempo, setTempo } = useStudio();
  const state = React.useSyncExternalStore(transport.subscribe, transport.get, transport.get);
  const [frozen, setFrozen] = React.useState<number | null>(null);
  const mine = state.family === family.id;
  const phases = mine ? state.phases : [];
  const total = lengthOf(phases);
  const span = frozen ?? total;
  const t = mine ? Math.min(state.t, total) : 0;
  const playing = mine && state.mode === "playing";
  const held = mine && state.mode !== "live";
  const current = held ? Math.max(0, phases.findIndex((_, i) => t < lengthOf(phases.slice(0, i + 1)))) : -1;
  // The slider and the phases share the second column; on a phone each spans a line of its own.
  const line = "@min-[26rem]:col-span-1 @min-[26rem]:col-start-2";
  return (
    <Slot fill="transparent" alignY="center">
      <div className="@container w-full">
        {/* The third column has a fixed width, so the slider does not shift as the time's digits change. */}
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 @min-[26rem]:grid-cols-[auto_minmax(0,1fr)_7.5rem]">
          <div className="col-start-1 row-start-1 flex gap-1">
            <Button size="icon-xs" variant="outline" aria-label="Play from the start" onClick={play}>
              <SkipBack />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              aria-label={playing ? "Pause" : "Play from the playhead"}
              onClick={() => (playing ? transport.pause() : transport.play())}
            >
              {playing ? <Pause /> : <PlayIcon />}
            </Button>
          </div>
          <Slider
            className={cn("col-span-3 row-start-2 @min-[26rem]:row-start-1", line)}
            min={0}
            max={Math.max(1, span)}
            step={1}
            value={[Math.min(t, span)]}
            onValueChange={([v]) => v !== undefined && transport.seek(v)}
            aria-label="Timeline"
          />
          <Text role="mono" as="span" align="end" className="col-start-2 row-start-1 whitespace-nowrap @min-[26rem]:col-start-3 @min-[26rem]:row-start-2">
            {Math.round(t)} / {Math.round(total)}ms
          </Text>
          <div className="col-start-3 row-start-1 flex justify-end gap-1">
            {/* A toggle and a button as tall as the play buttons, so the row is one height. */}
            <Toggle variant="outline" size="sm" className="h-7 min-w-7 px-0" pressed={loop} onPressedChange={setLoop} aria-label="Loop">
              <Repeat className="size-3" />
            </Toggle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="xs" variant="outline" aria-label={`Tempo, ${tempo}×`}>
                  {tempo}×
                  <ChevronDown data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuLabel>Tempo</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={String(tempo)} onValueChange={(v) => setTempo(Number(v) as Tempo)}>
                  {TEMPOS.map((n) => (
                    <DropdownMenuRadioItem key={n} value={String(n)}>
                      {n === 1 ? "1× real time" : `${n}× slower`}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Phases
            phases={phases}
            current={current}
            span={span}
            onGrip={setFrozen}
            className={cn("col-span-3 row-start-3 @min-[26rem]:row-start-2", line)}
          />
        </div>
      </div>
    </Slot>
  );
}

/**
 * The play's phases under the slider, each as long as it lasts and labelled with its ms, the one the playhead is in
 * brighter. **A phase that is a setting of the play is dragged** (his, 2026-09-27: "Hold should also be a hold and drag
 * on the time line"): the hold on every motion, and loading's page time on loading's. It wears a grip at its end; press
 * it anywhere and drag, right to lengthen it, left to shorten it. The timeline holds its scale for the drag (`onGrip`),
 * so the phase's end moves with the pointer, a step at a time. From the keyboard the arrows move it a step, Page Up
 * and Page Down ten, Home and End to its ends.
 *
 * Each phase is its share of `span`: the play's length, or while a drag holds the scale, the length when it was pressed.
 *
 * The grip is the one control on the studio's jigs that is not a system component: nothing in the system drags a
 * length the whole grows by — `Resizable` hands one panel's room to the next, which would shrink the play's other phases.
 */
function Phases({
  phases,
  current,
  span,
  onGrip,
  className,
}: {
  phases: readonly Phase[];
  current: number;
  span: number;
  onGrip: (span: number | null) => void;
  className?: string;
}) {
  const strip = React.useRef<HTMLDivElement>(null);
  // Where a drag took hold: the phase, the pointer and the phase's ms then, and the scale it holds.
  const grip = React.useRef<{ index: number; x: number; ms: number; msPerPx: number } | null>(null);
  const [dragging, setDragging] = React.useState<number | null>(null);

  const commit = (i: number, ms: number) => {
    const phase = phases[i];
    const drag = phase?.drag;
    if (!phase || !drag) return;
    const value = Math.min(drag.max, Math.max(drag.min, Math.round(ms / drag.scale / drag.step) * drag.step));
    if (value !== Math.round(phase.ms / drag.scale)) drag.set(value);
  };

  const onPointerDown = (i: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    const box = strip.current?.getBoundingClientRect();
    if (!box?.width || !span || event.button !== 0) return;
    grip.current = { index: i, x: event.clientX, ms: phases[i]!.ms, msPerPx: span / box.width };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(i);
    onGrip(span);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const g = grip.current;
    if (g) commit(g.index, g.ms + (event.clientX - g.x) * g.msPerPx);
  };
  const release = () => {
    if (!grip.current) return;
    grip.current = null;
    setDragging(null);
    onGrip(null);
  };
  const onKeyDown = (i: number) => (event: React.KeyboardEvent<HTMLDivElement>) => {
    const phase = phases[i];
    const drag = phase?.drag;
    if (!phase || !drag) return;
    const steps: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
    let ms: number;
    if (event.key === "Home") ms = drag.min * drag.scale;
    else if (event.key === "End") ms = drag.max * drag.scale;
    else if (steps[event.key] !== undefined) ms = phase.ms + steps[event.key]! * drag.step * drag.scale;
    else return;
    // Taken here, so the grid does not turn the page on the same key (Grid.md D42).
    event.preventDefault();
    commit(i, ms);
  };

  return (
    <div ref={strip} className={cn("flex min-w-0 overflow-hidden", className)}>
      {phases.map((phase, i) => {
        const cell = "flex min-w-0 shrink-0 items-center border-s ps-1.5 first:border-s-0 first:ps-0";
        const style = { flexBasis: `${(phase.ms / Math.max(span, 1)) * 100}%` };
        const label = (
          <Text role="caption" tone={i === current || i === dragging ? "foreground" : "muted"} className="truncate">
            {phase.label} {Math.round(phase.ms)}ms
          </Text>
        );
        if (!phase.drag) {
          return (
            <div key={i} className={cell} style={style}>
              {label}
            </div>
          );
        }
        const value = Math.round(phase.ms / phase.drag.scale);
        return (
          <div
            key={i}
            role="slider"
            tabIndex={0}
            aria-label={phase.label}
            aria-orientation="horizontal"
            aria-valuemin={phase.drag.min}
            aria-valuemax={phase.drag.max}
            aria-valuenow={value}
            aria-valuetext={`${value}ms`}
            className={cn(cell, "group gap-1 rounded-lg outline-none select-none touch-none focus-visible:ring-2 focus-visible:ring-ring/30")}
            style={style}
            onPointerDown={onPointerDown(i)}
            onPointerMove={onPointerMove}
            onPointerUp={release}
            onPointerCancel={release}
            onKeyDown={onKeyDown(i)}
          >
            {label}
            <GripVertical aria-hidden className={cn("ms-auto size-3 shrink-0 group-hover:text-foreground", i === dragging ? "text-foreground" : "text-muted-foreground")} />
          </div>
        );
      })}
    </div>
  );
}

// ── the specimen ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The specimen's jig: what plays on the stage, which is not motion and never goes into the settings (Motion.md M6).
 * Every specimen is a block of the stage's cells, so its Columns and Rows come first on every family's (his, 2026-09-27:
 * "Replace Across and Down options labels with Rows and Columns. Treat them as common"): movement's elements fill the
 * block, loading's page is laid in it. The family's own options follow, past a separator. How a play runs is the
 * timeline's.
 */
export function Specimen({ family }: { family: Family }) {
  const studio = useStudio();
  const block = studio.blockOf(family);
  return (
    <Jig title="Specimen" note={family.hint}>
      {family.id === "agent" ? <Text role="caption">Body · 2 cells wide × 1 cell high</Text> : <Controls>
        <Control label="Columns" value={String(block.columns)}>
          <Slider min={1} max={family.block.max} step={1} value={[block.columns]} onValueChange={([v]) => v && studio.setOption(family, "columns", v)} aria-label="Columns" />
        </Control>
        <Control label="Rows" value={String(block.rows)}>
          <Slider min={1} max={family.block.max} step={1} value={[block.rows]} onValueChange={([v]) => v && studio.setOption(family, "rows", v)} aria-label="Rows" />
        </Control>
      </Controls>}
      <Separator />
      {SPECIMEN[family.id]({ family })}
    </Jig>
  );
}

/** A family's own specimen options, after the block — not motion, so never in the settings. */
function AgentOptions() {
 return <Text role="body">Define a start pose, an end pose, and the path between them. Eyes have independent controls. Hold, loop and speed are on the timeline.</Text>;
}

const SPECIMEN: Record<Family["id"], (props: { family: Family }) => React.ReactNode> = {
  agent: () => <AgentOptions />,
  move: (p) => <MoveOptions {...p} />,
  load: (p) => <LoadOptions {...p} />,
  // Enter and exit's elements flow the same way: the order they come in, and which way `through` passes.
  enter: (p) => <MoveOptions {...p} />,
  focus: (p) => <FocusOptions {...p} />,
  mode: (p) => <ModeOptions {...p} />,
};

/**
 * Which way movement's elements fill the block (his, 2026-09-27: "an option to have both rows and columns … it can
 * overflow to the next column"): along rows, a full row going on to the next, as the tech column's marks fill, or down
 * columns. A row of cells is a block one row high; the tech verticals, one column wide filling down. Arrows, so the
 * choice does not read as the block's Rows and Columns.
 */
function MoveOptions({ family }: { family: Family }) {
  const studio = useStudio();
  const flow = studio.optionOf(family, "flow", "row");
  return (
    <Controls>
      <Control label="Flow" value={flow === "column" ? "down columns" : "along rows"}>
        <ToggleGroup type="single" variant="outline" size="sm" value={flow} onValueChange={(v) => v && studio.setOption(family, "flow", v)} aria-label="Flow">
          <ToggleGroupItem value="row" aria-label="Along rows">
            <ArrowRight />
          </ToggleGroupItem>
          <ToggleGroupItem value="column" aria-label="Down columns">
            <ArrowDown />
          </ToggleGroupItem>
        </ToggleGroup>
      </Control>
    </Controls>
  );
}

/**
 * The loading specimen's own options (Motion.md M10): which page — the sample, or a random one, dealt afresh by every
 * press of Random (his: "give me option to randomized layouts of cells") — and how many sections it has; the loader has
 * a cell for each, his "the x is defined by the number of cards or sections in the page". How long the page takes to
 * be ready is the play's first phase, dragged on the timeline.
 */
function LoadOptions({ family }: { family: Family }) {
  const studio = useStudio();
  const sections = studio.optionOf(family, "sections", 6);
  const layout = studio.optionOf(family, "layout", "sample");
  const seed = studio.optionOf(family, "seed", 1);
  // Every press of Random deals a new page: another seed, never the one on the stage (his: "every time I click on random
  // button, I would want the layout to be randomized").
  const deal = () => {
    let next = seed;
    while (next === seed) next = 1 + Math.floor(Math.random() * 9999);
    studio.setOption(family, "seed", next);
    studio.setOption(family, "layout", "random");
  };
  return (
    <Controls>
      <Control label="Layout" value={layout === "random" ? `#${seed}` : "sample"} className="col-span-2">
        {/* Pressing the Random already pressed hands back "" from the group: that is a press too, and deals again. */}
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={layout}
          onValueChange={(v) => {
            if (v === "sample") studio.setOption(family, "layout", "sample");
            else if (v === "random" || layout === "random") deal();
          }}
          aria-label="Layout"
        >
          <ToggleGroupItem value="sample">Sample</ToggleGroupItem>
          <ToggleGroupItem value="random">Random</ToggleGroupItem>
        </ToggleGroup>
      </Control>
      <Control label="Sections" value={String(sections)}>
        <Slider min={1} max={8} step={1} value={[sections]} onValueChange={([v]) => v && studio.setOption(family, "sections", v)} aria-label="Sections" />
      </Control>
    </Controls>
  );
}

/**
 * The focus specimen's own options (Motion.md M13): which card a play on the timeline starts on — it moves on to the
 * next in reading order — and whether the field's rings are drawn over the page, each with the blur it reaches, so
 * the Intensity jig can be read on the stage.
 */
function FocusOptions({ family }: { family: Family }) {
  const studio = useStudio();
  const card = studio.optionOf(family, "card", 3);
  const rings = studio.optionOf(family, "rings", true);
  return (
    <Controls>
      <Control label="Play starts on" value={`card ${card}`}>
        <Slider min={1} max={FOCUS_SAMPLE_COUNT} step={1} value={[card]} onValueChange={([v]) => v && studio.setOption(family, "card", v)} aria-label="Play starts on" />
      </Control>
      <Control label="Rings" value={rings ? "shown" : "hidden"}>
        <Switch checked={rings} onCheckedChange={(on) => studio.setOption(family, "rings", on)} aria-label="Rings" />
      </Control>
    </Controls>
  );
}

/**
 * Focus mode's own options (Motion.md M14): which vertical a play on the timeline starts on — it slides on to the other
 * two in order — and whether the cloth's rings are drawn over the page, each with the blur it reaches.
 */
function ModeOptions({ family }: { family: Family }) {
  const studio = useStudio();
  const vertical = studio.optionOf(family, "vertical", 1);
  const rings = studio.optionOf(family, "rings", false);
  return (
    <Controls>
      <Control label="Play starts on" value={`vertical ${vertical}`}>
        <Slider min={1} max={3} step={1} value={[vertical]} onValueChange={([v]) => v && studio.setOption(family, "vertical", v)} aria-label="Play starts on" />
      </Control>
      <Control label="Rings" value={rings ? "shown" : "hidden"}>
        <Switch checked={rings} onCheckedChange={(on) => studio.setOption(family, "rings", on)} aria-label="Rings" />
      </Control>
    </Controls>
  );
}

// ── the presets ───────────────────────────────────────────────────────────────────────────────────────────────

export function Presets({ family }: { family: Family }) {
  const studio = useStudio();
  if (family.id === "agent") return <AgentPresets family={family} />;
  const matched = studio.presetOf(family);
  const shown = family.presets.find((p) => p.id === (matched ?? studio.fromOf(family))) ?? family.presets[0]!;
  return (
    <Jig title="Presets" note="Round 1: five mechanisms. Pick one, then tune it.">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={matched ?? ""}
        onValueChange={(v) => v && studio.applyPreset(family, v as PresetId)}
        aria-label="Presets"
      >
        {PRESET_IDS.map((id) => (
          <ToggleGroupItem key={id} value={id}>{id}</ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex flex-col gap-1">
        <Text role="heading" as="p">
          {shown.id} · {shown.name}
          {matched ? "" : ", tuned"}
        </Text>
        <Text role="body">{shown.why}</Text>
        <Text role="caption">Could fail: {shown.risk}</Text>
      </div>
    </Jig>
  );
}

function AgentPresets({ family }: { family: Family }) {
 const studio = useStudio();
 const [selected, setSelected] = React.useState("");
 const [name, setName] = React.useState("");
 const [message, setMessage] = React.useState("");
 const valid = name.trim().length > 0;
 return <Jig title="Your presets" note="Save the movement you design.">
  <Select value={selected} onValueChange={id => { const p=studio.agentPresets.find(p=>p.id===id)!; setSelected(id); setName(p.name); studio.loadAgentPreset(family,id); setMessage("Loaded"); }}>
   <SelectTrigger aria-label="Your presets"><SelectValue placeholder="Choose a saved preset" /></SelectTrigger>
   <SelectContent>{studio.agentPresets.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
  </Select>
  <Input aria-label="Preset name" placeholder="Name your movement" value={name} maxLength={80} onChange={e=>setName(e.target.value)} />
  <div className="flex flex-wrap gap-2">
   <Button size="sm" disabled={!valid} onClick={()=>{setSelected(studio.saveAgentPreset(family,name));setMessage("Saved as a new preset");}}>Save new</Button>
   <Button size="sm" variant="outline" disabled={!selected || !valid} onClick={()=>{studio.saveAgentPreset(family,name,selected);setMessage("Preset updated");}}>Update</Button>
   <Button size="sm" variant="ghost" disabled={!selected} onClick={()=>{studio.deleteAgentPreset(selected);setSelected("");setMessage("Preset deleted");}}>Delete</Button>
  </div>
  <Text role="caption">Includes all controls, hold, loop and speed. Stored in this browser.</Text>
  <Text role="caption" aria-live="polite">{message || "No suggested personalities. Start with your own."}</Text>
 </Jig>;
}

// ── the tokens ────────────────────────────────────────────────────────────────────────────────────────────────

export function Tokens({ family }: { family: Family }) {
  const studio = useStudio();
  const values = studio.values(family);
  // A family whose tokens are grouped shows one group at a time, picked from a select: the agent's, and focus's.
  const groups = [...new Set(family.tokens.flatMap((t) => (t.group ? [t.group] : [])))];
  const savedGroup = studio.optionOf(family, "jig", groups[0] ?? "");
  const group = groups.includes(savedGroup) ? savedGroup : groups[0];
  return (
    <Jig title={family.id === "agent" ? "Design" : "Tokens"}>
      {groups.length ? <Select value={group} onValueChange={(v) => studio.setOption(family, "jig", v)}>
        <SelectTrigger size="sm" className="w-full" aria-label={family.id === "agent" ? "Design group" : "Token group"}><SelectValue /></SelectTrigger>
        <SelectContent>{groups.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
      </Select> : null}
      {/* Two columns: a token marked half sits beside its pair, an in beside its out; any other takes the row. */}
      <Controls>
        {family.tokens.filter((token) => !token.group || token.group === group).map((token) => (
          <TokenControl key={token.name} token={token} value={values[token.name]} onChange={(v) => studio.setValue(family, token.name, v)} />
        ))}
      </Controls>
    </Jig>
  );
}

function TokenControl({ token, value, onChange }: { token: Token; value: number | string | undefined; onChange: (v: number | string) => void }) {
  if (value === undefined) return null;
  const span = token.half ? "col-span-1" : "col-span-2";
  if (token.kind === "ease") {
    const known = EASES.some((e) => e.value === value);
    return (
      <Control label={token.label} touches={token.touches} className={span}>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="w-full" aria-label={token.label} size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {known ? null : <SelectItem value={String(value)}>{String(value)}</SelectItem>}
            {EASES.map((e) => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Control>
    );
  }
  if (token.kind === "choice" && token.half) {
    // Half a jig is too narrow for a row of toggles: a half choice is a select, like an ease.
    return (
      <Control label={token.label} touches={token.touches} className={span}>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="w-full" aria-label={token.label} size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {token.choices?.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Control>
    );
  }
  if (token.kind === "choice") {
    return (
      <Control label={token.label} touches={token.touches} className={span}>
        <ToggleGroup type="single" variant="outline" size="sm" value={String(value)} onValueChange={(v) => v && onChange(v)} aria-label={token.label}>
          {token.choices?.map((c) => (
            <ToggleGroupItem key={c.value} value={c.value}>{c.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Control>
    );
  }
  return (
    <Control label={token.label} value={tokenLabel(token, value)} touches={token.touches} className={span}>
      <Slider min={token.min} max={token.max} step={token.step} value={[Number(value)]} onValueChange={([v]) => v !== undefined && onChange(v)} aria-label={token.label} />
    </Control>
  );
}

// ── the settings ──────────────────────────────────────────────────────────────────────────────────────────────

export function Settings({ family }: { family: Family }) {
  const studio = useStudio();
  const [copied, setCopied] = React.useState(false);
  const matched = studio.presetOf(family);
  const from = family.presets.find((p) => p.id === (matched ?? studio.fromOf(family))) ?? family.presets[0]!;
  const css = settingsText(family, studio.values(family), studio.decided?.[family.id] ?? {}, `${from.id} ${from.name}${matched ? "" : ", tuned"}`);
  // A grouped family's block is longer than the jig: it shows the group on the tokens' jig, and Copy takes every group.
  const groups = family.id === "agent" ? [] : [...new Set(family.tokens.flatMap((t) => (t.group ? [t.group] : [])))];
  const savedGroup = studio.optionOf(family, "jig", groups[0] ?? "");
  const group = groups.includes(savedGroup) ? savedGroup : groups[0];
  const shownCss = group
    ? css.split("\n").filter((line, i) => i === 0 || family.tokens.some((t) => t.group === group && line.startsWith(`${t.name}:`))).join("\n")
    : css;
  const text = family.id === "agent" ? JSON.stringify({
    character: "Personal guide", temperament: "Energetic and expressive",
    tempo: studio.tempo, loop: studio.loop, presets: studio.agentPresets,
    block: { columns: 2, rows: 1 }, hold: studio.hold, values: studio.values(family),
  }, null, 2) : css;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <Jig
      title="Settings"
      action={
        <div className="flex shrink-0 gap-1">
          <Button size="xs" variant="outline" onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
          <Button size="xs" variant="ghost" onClick={() => studio.reset(family)}>Reset</Button>
        </div>
      }
    >
      {family.id === "agent" ? <>
        <Text role="body">Energetic · expressive</Text>
        <Text role="caption">Saved in this browser. Copy includes all controls, your presets and playback settings.</Text>
        <Text role="caption">Reset clears the current design to a blank pose. Your saved presets stay.</Text>
      </> : <>
        <Text role="mono" as="pre" className="whitespace-pre-wrap">{shownCss}</Text>
        {group ? <Text role="caption">{group} shown. Copy takes all {family.tokens.length}.</Text> : null}
      </>}
    </Jig>
  );
}
