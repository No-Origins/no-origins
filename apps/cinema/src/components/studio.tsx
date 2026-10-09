"use client";

import * as React from "react";
import { Move3d, Pause, Play } from "lucide-react";
import { ENTRIES, PALETTE } from "@cinema/content";

import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import type { ColourOption } from "@no-origins/ui/components/colour-picker";
import { Grid, GridItem, GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { Toggle } from "@no-origins/ui/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@no-origins/ui/components/tooltip";

import { EntryJigs, Field, Jig } from "@/components/jigs";
import { Picture } from "@/components/picture";
import { setControls } from "@/engine/edit";
import { makeLibrary, type Library } from "@/engine/library";
import { shotLength } from "@/engine/shot";
import type { Aspect, PaletteColour, Shot, Use, Value, Values } from "@/engine/types";
import { studioLayout } from "@/lib/layout";

const library = makeLibrary(ENTRIES);
/** The air inside the bar's round ends, a step of the spacing scale, as Home's player has it. */
const PAD = GRID_SPACING[4];
/** How often the screen asks whether the shot has changed, while the commands run. */
const WATCH_MS = 1500;
/** A change is saved once the jigs have stood still this long (as the motion studio's drafts are, Motion.md M24). */
const SAVE_MS = 500;

const clock = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
const seconds = (t: number) => `${Number(t.toFixed(2))}s`;

/**
 * The palette as it stands (Cinema.md F10: it grows with the scenes): the colours he has named first (`PALETTE`, in
 * his private folder), then every colour the library's entries start from, named by what it colours, then every
 * colour the shot already uses. A new colour is added by naming it.
 */
function paletteOf(lib: Library, shot: Shot | null, his: readonly PaletteColour[]): ColourOption[] {
  const named = new Map<string, string>();
  for (const colour of his) if (!named.has(colour.value.toLowerCase())) named.set(colour.value.toLowerCase(), colour.label);
  for (const entry of lib.entries)
    for (const control of entry.controls)
      if (control.kind === "colour" && !named.has(control.default.toLowerCase())) named.set(control.default.toLowerCase(), `${entry.label} ${control.label.toLowerCase()}`);
  const uses: Use[] = shot ? [...(shot.world ? [shot.world] : []), ...shot.cast, ...shot.tracks.flatMap((t) => t.items)] : [];
  for (const use of uses)
    for (const value of Object.values(use.values))
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) && !named.has(value.toLowerCase())) named.set(value.toLowerCase(), value);
  return [...named].map(([value, label]) => ({ value, label, colour: value }));
}

type Save = { state: "idle" | "saving" | "saved" | "refused"; note?: string };

/**
 * The studio's screen (Cinema-Engine.md E1), version 2. The shot at the centre, with its name and a bar of play, the
 * time to scrub and free look. The jigs either side: the world's controls on the left; on the right the shot (which
 * one, and the frame to see it in, wide or vertical: the screen's view; the shot's own frame is a command's), then its
 * camera, lights and cast, every control its entry declares. A change shows at once and is saved to the
 * draft once the jigs stand still, from the revision the screen last saw; a command run meanwhile wins, and the screen
 * shows what it did. Built from the system (F2); the placing is mine.
 */
function Workspace({ shots, initial }: { shots: { id: string; title: string }[]; initial: Shot | null }) {
  const metrics = useGridMetrics();
  const [shot, setShot] = React.useState(initial);
  const [aspect, setAspect] = React.useState<Aspect>(initial?.frame.aspect ?? "wide");
  const [playing, setPlaying] = React.useState(false);
  const [free, setFree] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [seek, setSeek] = React.useState({ t: 0, n: 0 });
  const [problems, setProblems] = React.useState<string[]>([]);
  const [save, setSave] = React.useState<Save>({ state: "idle" });
  const rev = React.useRef(initial?.rev ?? 0);
  const pending = React.useRef(new Map<string, Values>());
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const busy = React.useRef(false);
  const id = shot?.id;

  /** Takes a shot as the server has it, dropping whatever was waiting to be saved. */
  const adopt = React.useCallback((next: Shot) => {
    pending.current.clear();
    rev.current = next.rev;
    setShot(next);
  }, []);

  React.useEffect(() => {
    if (!id) return;
    const watch = setInterval(async () => {
      if (busy.current || pending.current.size) return;
      const response = await fetch(`/shot/${id}`, { cache: "no-store" }).catch(() => undefined);
      if (!response?.ok || busy.current || pending.current.size) return;
      const next = (await response.json()) as Shot;
      if (next.id === id && next.rev !== rev.current) adopt(next);
    }, WATCH_MS);
    return () => clearInterval(watch);
  }, [id, adopt]);

  const flush = React.useCallback(async () => {
    if (!id || busy.current) return;
    busy.current = true;
    setSave({ state: "saving" });
    try {
      while (pending.current.size) {
        const [target, values] = pending.current.entries().next().value!;
        pending.current.delete(target);
        const response = await fetch(`/shot/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rev: rev.current, target, values }),
        });
        const body = await response.json();
        if (response.ok) {
          rev.current = (body as Shot).rev;
          setShot((current) => (current ? { ...current, rev: rev.current } : current));
        } else {
          if (response.status === 409) adopt(body.shot as Shot);
          else pending.current.clear();
          setSave({ state: "refused", note: response.status === 409 ? "The shot changed while you tuned it; here it is as it is now." : String(body.refused) });
          return;
        }
      }
      setSave({ state: "saved" });
    } finally {
      busy.current = false;
    }
  }, [id, adopt]);

  const change = (target: string, control: string, value: Value) => {
    setShot((current) => {
      if (!current) return current;
      try {
        return setControls(current, target, { [control]: value }, library);
      } catch {
        return current;
      }
    });
    pending.current.set(target, { ...pending.current.get(target), [control]: value });
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_MS);
  };

  const open = async (next: string) => {
    const response = await fetch(`/shot/${next}`, { cache: "no-store" });
    if (!response.ok) return;
    const loaded = (await response.json()) as Shot;
    setPlaying(false);
    setFree(false);
    adopt(loaded);
    setAspect(loaded.frame.aspect);
    setTime(0);
    setSeek((s) => ({ t: 0, n: s.n + 1 }));
    setSave({ state: "idle" });
  };

  const palette = React.useMemo(() => paletteOf(library, shot, PALETTE), [shot]);
  if (!metrics) return null;
  const layout = studioLayout(metrics.cols, metrics.rows);
  const length = shot ? shotLength(shot) : 0;
  const step = shot ? 1 / shot.frame.fps : 0.1;
  const scrub = (t: number) => {
    setPlaying(false);
    setTime(t);
    setSeek((s) => ({ t, n: s.n + 1 }));
  };

  const entryOf = (use: Use) => library.find(use.entry, use.version);
  const worldJigs = shot?.world && entryOf(shot.world) ? (
    <EntryJigs entry={entryOf(shot.world)!} values={shot.world.values} title={entryOf(shot.world)!.label} note="The world" palette={palette} onChange={(c, v) => change("world", c, v)} />
  ) : null;
  const shotJigs = shot ? (
    <>
      <Jig title="Shot" note={`${shots.length} ${shots.length === 1 ? "shot" : "shots"}, ${shot.frame.aspect} ${shot.frame.size}px at ${shot.frame.fps} fps`}>
        <Field label="Which">
          <Select value={shot.id} onValueChange={open}>
            <SelectTrigger size="sm" aria-label="Shot" className="w-full">
              <SelectValue placeholder="Shot" />
            </SelectTrigger>
            <SelectContent>
              {shots.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="See it">
          <ToggleGroup type="single" value={aspect} onValueChange={(next) => (next === "wide" || next === "vertical") && setAspect(next)} variant="outline" size="sm" aria-label="Frame">
            <ToggleGroupItem value="wide">Wide</ToggleGroupItem>
            <ToggleGroupItem value="vertical">Vertical</ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </Jig>
      {shot.tracks.flatMap((track) =>
        track.items.map((item) => {
          const entry = entryOf(item);
          return entry ? (
            <EntryJigs key={item.id} entry={entry} values={item.values} title={`${track.kind === "camera" ? "Camera" : "Light"} · ${entry.label}`} note={`${item.id}, from ${seconds(item.start)} for ${seconds(item.length)}`} palette={palette} onChange={(c, v) => change(item.id, c, v)} />
          ) : null;
        }),
      )}
      {shot.cast.map((placement) => {
        const entry = entryOf(placement);
        return entry ? (
          <EntryJigs key={placement.id} entry={entry} values={placement.values} title={`Cast · ${placement.name}`} note={`${placement.id}, at ${placement.at.join(", ")}`} palette={palette} onChange={(c, v) => change(placement.id, c, v)} />
        ) : null;
      })}
    </>
  ) : null;
  const column = (children: React.ReactNode, label: string) => (
    <Slot fill="transparent" inset={0}>
      <ScrollArea className="size-full" aria-label={label}>
        <div className="flex flex-col gap-3">{children}</div>
      </ScrollArea>
    </Slot>
  );

  return (
    <>
      <GridItem {...layout.picture} data-cinema-part="picture">
        <Slot fill="background" inset={0}>
          {shot ? (
            <Picture shot={shot} aspect={aspect} length={length} playing={playing} seek={seek} free={free} onFree={setFree} onTime={setTime} onProblems={setProblems} />
          ) : (
            <div className="flex size-full items-center justify-center p-4">
              <Text role="body" tone="muted" align="center">No shots yet. Tell Claude what to make.</Text>
            </div>
          )}
        </Slot>
      </GridItem>
      {shot && (
        <GridItem {...layout.world} data-cinema-part="world">
          {column(layout.shot ? worldJigs : <>{worldJigs}{shotJigs}</>, layout.shot ? "The world's controls" : "The controls")}
        </GridItem>
      )}
      {shot && layout.shot && (
        <GridItem {...layout.shot} data-cinema-part="shot">
          {column(shotJigs, "The shot's controls")}
        </GridItem>
      )}
      <GridItem {...layout.caption} data-cinema-part="name">
        <Slot fill="transparent" inset={0} alignX="center" alignY="center">
          <div aria-live="polite" className="flex min-w-0 flex-col items-center">
            <Text role="title" as="h2" align="center" className="truncate">{shot?.title ?? "Cinema"}</Text>
            {problems.length > 0 ? (
              <Text role="caption" align="center">{problems.join(" · ")}</Text>
            ) : save.state === "refused" ? (
              <Text role="caption" align="center">{save.note}</Text>
            ) : save.state !== "idle" ? (
              <Text role="caption" align="center">{save.state === "saving" ? "Saving…" : `Saved to the draft, revision ${shot?.rev}`}</Text>
            ) : null}
          </div>
        </Slot>
      </GridItem>
      <GridItem {...layout.bar} data-cinema-part="bar">
        <Slot fill="transparent" inset={0} alignX="center" alignY="stretch">
          <Card size="sm" className="w-full max-w-full flex-row flex-wrap items-center justify-center gap-3 py-0" style={{ paddingInline: PAD }}>
            <Button variant="outline" size="icon-sm" aria-label={playing ? "Pause" : "Play"} aria-pressed={playing} disabled={!shot} onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            </Button>
            <Slider aria-label="Time" min={0} max={Math.max(step, length)} step={step} value={[Math.min(time, length)]} onValueChange={([t]) => scrub(t ?? 0)} disabled={!shot} className="min-w-24 flex-1" />
            <Text role="mono" className="tabular-nums">{clock(time)} / {clock(length)}</Text>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Toggle variant="outline" size="sm" aria-label="Free look" pressed={free} onPressedChange={setFree} disabled={!shot} className="w-9 px-0">
                    <Move3d />
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent>{free ? "Free look: back to the shot's camera" : "Free look: drag the picture to look round"}</TooltipContent>
            </Tooltip>
          </Card>
        </Slot>
      </GridItem>
    </>
  );
}

/** The studios' grid: the field drawn, the pointer a violet ring, no intro (Grid.md D49). */
export function Studio({ shots, initial }: { shots: { id: string; title: string }[]; initial: Shot | null }) {
  return (
    <Grid overlay cursor>
      <h1 className="sr-only">Cinema</h1>
      <Workspace shots={shots} initial={initial} />
    </Grid>
  );
}
