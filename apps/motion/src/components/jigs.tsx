"use client";

import * as React from "react";
import { ArrowDown, ArrowRight, GripVertical, Pause, Play as PlayIcon, RotateCcw } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import { Label } from "@no-origins/ui/components/label";
import { Separator } from "@no-origins/ui/components/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Slot } from "@no-origins/ui/components/slot";
import { Switch } from "@no-origins/ui/components/switch";
import { Text } from "@no-origins/ui/components/text";
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
export function Jig({ title, note, children, action, fit = false }: { title: string; note?: string; children: React.ReactNode; action?: React.ReactNode; fit?: boolean }) {
  return (
    <Slot fill="transparent" inset={0} className={fit ? "h-auto" : undefined}>
      <Card size="sm" className={cn("min-h-0 gap-3 shadow-none", fit ? "h-auto" : "h-full")}>
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
export function Control({ label, value, touches, className, children }: { label: string; value?: string; touches?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
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
export function Controls({ children }: { children: React.ReactNode }) {
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
 * **Drawn as his player** (2026-09-29, his: "I like … the player control designs … place it in the right half, under
 * preview"): ↺ in an outline circle and play or pause in a lime one, the time, the slider with a violet thumb over the
 * phases, each a pill with its name and its ms, the one the playhead is in lime, and a violet line from the thumb down
 * through them; Loop a switch, Tempo a select. The slider and the phases are one axis: the phases stand a thumb's
 * half in from the slider's ends, where its centre is at the play's start and end, so the line crosses each phase at
 * the moment the thumb is at. Since 2026-09-30 the slider is the system's thick bar and the thumb its square head, the
 * bar's height (his), so the half is half `--slider-height` (4px since his second tuning of the grip; 8 at his pick, 12 before) and the line starts at
 * the bar's middle, behind the head. Both are reckoned from the token, never a number, so a new height moves them too.
 *
 * Docked — the studio's transport, a half field wide and two rows tall — the buttons, the time, Loop and Tempo are the
 * first line, and the slider and the phases the second, from under the time to the end. Undocked — a
 * concept study's one-row slot — it is his mock's one line: the buttons, the time, the slider over its phases, Loop and
 * Tempo. Narrower than 26rem either way — a phone — the buttons, the time, Loop and Tempo take the first line, the
 * slider and the phases the second.
 *
 * While a phase is dragged the timeline keeps the scale it had when the phase was pressed, so its end stays with the
 * pointer and what it pushes past the end is cut off; it fits the play again on letting go.
 *
 * A family with more to say about how its play runs hands its own controls in as `extra`, drawn beside Loop and Tempo.
 */
export function Timeline({ family, extra, dock = false }: { family: Family; extra?: React.ReactNode; dock?: boolean }) {
  const { transport, play, loop, setLoop, tempo, setTempo } = useStudio();
  const state = React.useSyncExternalStore(transport.subscribe, transport.get, transport.get);
  const [frozen, setFrozen] = React.useState<number | null>(null);
  const loopId = React.useId();
  const mine = state.family === family.id;
  const phases = mine ? state.phases : [];
  const total = lengthOf(phases);
  const span = frozen ?? total;
  const t = mine ? Math.min(state.t, total) : 0;
  const playing = mine && state.mode === "playing";
  const held = mine && state.mode !== "live";
  const current = held ? Math.max(0, phases.findIndex((_, i) => t < lengthOf(phases.slice(0, i + 1)))) : -1;
  const at = Math.min(t, span) / Math.max(span, 1);
  return (
    <Slot fill="transparent" alignY="center">
      <div className="@container/timeline w-full">
        <div
          className={cn(
            "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5",
            !dock && "@min-[26rem]:grid-cols-[auto_auto_minmax(0,1fr)_auto] @min-[26rem]:items-start",
          )}
        >
          <div className="col-start-1 row-start-1 flex items-center gap-2">
            <Button size={dock ? "icon-sm" : "icon-xs"} variant="outline" aria-label="Play from the start" onClick={play}>
              <RotateCcw />
            </Button>
            <Button
              size={dock ? "icon-lg" : "icon-sm"}
              className={cn(dock && "@max-[26rem]:size-9")}
              aria-label={playing ? "Pause" : "Play from the playhead"}
              onClick={() => (playing ? transport.pause() : transport.play())}
            >
              {playing ? <Pause className="size-4 fill-current" /> : <PlayIcon className="size-4 fill-current" />}
            </Button>
          </div>
          <Text role="body" as="span" className={cn("col-start-2 row-start-1 whitespace-nowrap tabular-nums", !dock && "@min-[26rem]:flex @min-[26rem]:h-9 @min-[26rem]:items-center")}>
            {Math.round(t)} / {Math.round(total)} ms
          </Text>
          <div className={cn("col-start-3 row-start-1 flex items-center justify-end gap-3", !dock && "@min-[26rem]:col-start-4 @min-[26rem]:h-9")}>
            {extra}
            <div className="flex items-center gap-2">
              <Switch id={loopId} checked={loop} onCheckedChange={setLoop} aria-label="Loop" />
              <Label htmlFor={loopId} className="@max-[26rem]:sr-only">Loop</Label>
            </div>
            <Select value={String(tempo)} onValueChange={(v) => setTempo(Number(v) as Tempo)}>
              <SelectTrigger size="sm" aria-label={`Tempo, ${tempo}×`}>
                <SelectValue>{tempo}×</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectGroup>
                  <SelectLabel>Tempo</SelectLabel>
                  {TEMPOS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n === 1 ? "1× real time" : `${n}× slower`}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {/* The axis: the slider over the phases, and the playhead through both. */}
          <div
            className={cn(
              "relative col-span-3 row-start-2 flex min-w-0 flex-col",
              // Docked, the transport's two rows hold the bar with the phases its head's gap under it.
              dock
                ? "gap-0.5 @min-[26rem]:col-span-2 @min-[26rem]:col-start-2"
                : "gap-1.5 @min-[26rem]:col-span-1 @min-[26rem]:col-start-3 @min-[26rem]:row-start-1 @min-[26rem]:pt-1.5",
            )}
          >
            <Slider
              className="relative z-20 **:data-[slot=slider-thumb]:bg-secondary! **:data-[slot=slider-thumb]:ring-secondary/30!"
              min={0}
              max={Math.max(1, span)}
              step={1}
              value={[Math.min(t, span)]}
              onValueChange={([v]) => v !== undefined && transport.seek(v)}
              aria-label="Timeline"
            />
            {held ? (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-[calc(var(--slider-height)/2)] bottom-0 z-10 w-0.5 -translate-x-1/2 bg-secondary",
                  !dock && "@min-[26rem]:top-[calc(0.375rem+var(--slider-height)/2)]",
                )}
                style={{ left: `calc(${at} * (100% - var(--slider-height)) + var(--slider-height) / 2)` }}
              />
            ) : null}
            <Phases phases={phases} current={current} span={span} onGrip={setFrozen} tall={dock} className="mx-[calc(var(--slider-height)/2)]" />
          </div>
        </div>
      </div>
    </Slot>
  );
}

/**
 * The play's phases under the slider, each as long as it lasts: a pill with its name and its ms, the one the playhead
 * is in lime (the muted tint), the rest the slider's grey. Each pill stands 2px in from its share on each side, so the
 * gaps between them do not bend the axis the playhead reads. Tall, docked, the name stands over the ms; otherwise they
 * share a line. **A phase that is a setting of the play is dragged** (his, 2026-09-27: "Hold should also be a hold and drag
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
  tall = false,
  className,
}: {
  phases: readonly Phase[];
  current: number;
  span: number;
  onGrip: (span: number | null) => void;
  tall?: boolean;
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
    <div ref={strip} className={cn("flex min-w-0 overflow-hidden", tall ? "h-7 @min-[26rem]:h-9" : "h-6", className)}>
      {phases.map((phase, i) => {
        const on = i === current || i === dragging;
        const style = { flexBasis: `${(phase.ms / Math.max(span, 1)) * 100}%` };
        // Each pill is a container, so what does not fit it gives way: on one line the ms goes first, stacked only when
        // the pill is thinner than its ms, and the grip where it would sit on the text; a pill thinner still loses its
        // inset and sets its name a size down, so a hold between long phases still says so.
        const pill = cn(
          "@container/phase relative flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-lg px-0.5 transition-colors",
          tall && "@min-[26rem]:flex-col @min-[26rem]:gap-0",
          on ? "bg-muted" : "bg-input/50",
        );
        const label = (
          <>
            <Text role="body" as="span" className="max-w-full truncate px-1 @max-[3.5rem]/phase:px-0 @max-[3.5rem]/phase:text-xs">{phase.label.charAt(0).toUpperCase() + phase.label.slice(1)}</Text>
            <Text
              role="caption"
              as="span"
              className={cn(
                "max-w-full shrink-0 truncate px-1 tabular-nums",
                tall ? "@max-[3rem]/phase:hidden @max-[26rem]/timeline:@max-[6.5rem]/phase:hidden" : "@max-[6.5rem]/phase:hidden",
              )}
            >
              {Math.round(phase.ms)} ms
            </Text>
          </>
        );
        if (!phase.drag) {
          return (
            <div key={i} className="flex min-w-0 shrink-0 px-0.5" style={style}>
              <div className={pill} title={phase.note} data-phase={phase.label}>{label}</div>
            </div>
          );
        }
        const value = Math.round(phase.ms / phase.drag.scale);
        return (
          <div key={i} className="flex min-w-0 shrink-0 px-0.5" style={style}>
            <div
              role="slider"
              tabIndex={0}
              aria-label={phase.label}
              aria-orientation="horizontal"
              aria-valuemin={phase.drag.min}
              aria-valuemax={phase.drag.max}
              aria-valuenow={value}
              aria-valuetext={`${value}ms`}
              title={phase.note}
              data-phase={phase.label}
              className={cn(pill, "group outline-none select-none touch-none focus-visible:ring-2 focus-visible:ring-ring/30")}
              onPointerDown={onPointerDown(i)}
              onPointerMove={onPointerMove}
              onPointerUp={release}
              onPointerCancel={release}
              onKeyDown={onKeyDown(i)}
            >
              {label}
              <GripVertical
                aria-hidden
                className={cn("absolute end-1.5 top-1/2 size-3 -translate-y-1/2 group-hover:text-foreground @max-[5.5rem]/phase:hidden", i === dragging ? "text-foreground" : "text-muted-foreground")}
              />
            </div>
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
export function Specimen({ family, title = "Specimen", compact = false }: { family: Family; title?: string; compact?: boolean }) {
  const studio = useStudio();
  const block = studio.blockOf(family);
  return (
    <Jig title={title} note={compact ? undefined : family.hint} fit={compact}>
      <Controls>
        <Control label="Columns" value={String(block.columns)}>
          <Slider min={1} max={family.block.max} step={1} value={[block.columns]} onValueChange={([v]) => v && studio.setOption(family, "columns", v)} aria-label="Columns" />
        </Control>
        <Control label="Rows" value={String(block.rows)}>
          <Slider min={1} max={family.block.max} step={1} value={[block.rows]} onValueChange={([v]) => v && studio.setOption(family, "rows", v)} aria-label="Rows" />
        </Control>
      </Controls>
      <Separator />
      {SPECIMEN[family.id]?.({ family })}
    </Jig>
  );
}

/**
 * A family's own specimen options, after the block — not motion, so never in the settings.
 */
const SPECIMEN: Partial<Record<Family["id"], (props: { family: Family }) => React.ReactNode>> = {
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
 * Focus mode's own options (Motion.md M14): which vertical a play on the timeline starts on — it switches on to the
 * other two in order — and whether the cloth's rings are drawn over the page, each with the blur it reaches.
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

// ── the tokens ────────────────────────────────────────────────────────────────────────────────────────────────

export function Tokens({ family }: { family: Family }) {
  const studio = useStudio();
  const values = studio.values(family);
  // A family whose tokens are grouped shows one group at a time, picked from a select: focus's, and focus mode's.
  const groups = [...new Set(family.tokens.flatMap((t) => (t.group ? [t.group] : [])))];
  const savedGroup = studio.optionOf(family, "jig", groups[0] ?? "");
  const group = groups.includes(savedGroup) ? savedGroup : groups[0];
  return (
    <Jig title="Tokens">
      {groups.length ? <Select value={group} onValueChange={(v) => studio.setOption(family, "jig", v)}>
        <SelectTrigger size="sm" className="w-full" aria-label="Token group"><SelectValue /></SelectTrigger>
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
  const groups = [...new Set(family.tokens.flatMap((t) => (t.group ? [t.group] : [])))];
  const savedGroup = studio.optionOf(family, "jig", groups[0] ?? "");
  const group = groups.includes(savedGroup) ? savedGroup : groups[0];
  const shownCss = group
    ? css.split("\n").filter((line, i) => i === 0 || family.tokens.some((t) => t.group === group && line.startsWith(`${t.name}:`))).join("\n")
    : css;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css);
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
      <Text role="mono" as="pre" className="whitespace-pre-wrap">{shownCss}</Text>
      {group ? <Text role="caption">{group} shown. Copy takes all {family.tokens.length}.</Text> : null}
    </Jig>
  );
}
