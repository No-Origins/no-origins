"use client";

import * as React from "react";
import { Pause, Play } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import { Grid, GridItem, GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";

import { Picture } from "@/components/picture";
import { shotLength } from "@/engine/shot";
import type { Aspect, Shot } from "@/engine/types";
import { studioLayout } from "@/lib/layout";

/** The air inside the bar's round ends, a step of the spacing scale, as Home's player has it. */
const PAD = GRID_SPACING[4];
/** How often the screen asks whether the shot has changed, while the commands run. */
const WATCH_MS = 1500;

const clock = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;

/**
 * The studio's screen (Cinema-Engine.md E1), version 1: for watching and checking, since he directs through Claude
 * (Cinema.md F8). The shot in its box; its name; and a bar of play, the time to scrub, the frame to see it in (wide or
 * vertical, the screen's view only: the shot's own frame is a command's) and, with more than one, which shot. It
 * watches the shot and draws each change the commands make. Built from the system (F2); the placing is mine.
 */
function Workspace({ shots, initial }: { shots: { id: string; title: string }[]; initial: Shot | null }) {
  const metrics = useGridMetrics();
  const [shot, setShot] = React.useState(initial);
  const [aspect, setAspect] = React.useState<Aspect>(initial?.frame.aspect ?? "wide");
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [seek, setSeek] = React.useState({ t: 0, n: 0 });
  const [problems, setProblems] = React.useState<string[]>([]);
  const id = shot?.id;

  React.useEffect(() => {
    if (!id) return;
    const timer = setInterval(async () => {
      const response = await fetch(`/shot/${id}`, { cache: "no-store" }).catch(() => undefined);
      if (!response?.ok) return;
      const next = (await response.json()) as Shot;
      setShot((current) => (current && current.id === next.id && current.rev !== next.rev ? next : current));
    }, WATCH_MS);
    return () => clearInterval(timer);
  }, [id]);

  const open = async (next: string) => {
    const response = await fetch(`/shot/${next}`, { cache: "no-store" });
    if (!response.ok) return;
    const loaded = (await response.json()) as Shot;
    setPlaying(false);
    setShot(loaded);
    setAspect(loaded.frame.aspect);
    setTime(0);
    setSeek((s) => ({ t: 0, n: s.n + 1 }));
  };

  if (!metrics) return null;
  const layout = studioLayout(metrics.cols, metrics.rows);
  const length = shot ? shotLength(shot) : 0;
  const step = shot ? 1 / shot.frame.fps : 0.1;
  const scrub = (t: number) => {
    setPlaying(false);
    setTime(t);
    setSeek((s) => ({ t, n: s.n + 1 }));
  };

  return (
    <>
      <GridItem {...layout.picture} data-cinema-part="picture">
        <Slot fill="background" inset={0}>
          {shot ? (
            <Picture shot={shot} aspect={aspect} length={length} playing={playing} seek={seek} onTime={setTime} onProblems={setProblems} />
          ) : (
            <div className="flex size-full items-center justify-center p-4">
              <Text role="body" tone="muted" align="center">No shots yet. Tell Claude what to make.</Text>
            </div>
          )}
        </Slot>
      </GridItem>
      <GridItem {...layout.caption} data-cinema-part="name">
        <Slot fill="transparent" inset={0} alignX="center" alignY="center">
          <div aria-live="polite" className="flex flex-col items-center">
            <Text role="title" as="h2" align="center" className="text-balance">{shot?.title ?? "Cinema"}</Text>
            {problems.length > 0 && <Text role="caption" align="center">{problems.join(" · ")}</Text>}
          </div>
        </Slot>
      </GridItem>
      <GridItem {...layout.bar} data-cinema-part="bar">
        <Slot fill="transparent" inset={0} alignX="center" alignY="stretch">
          <Card size="sm" className="w-full max-w-full flex-row flex-wrap items-center justify-center gap-3 py-0" style={{ paddingInline: PAD }}>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={playing ? "Pause" : "Play"}
              aria-pressed={playing}
              disabled={!shot}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            </Button>
            <Slider
              aria-label="Time"
              min={0}
              max={Math.max(step, length)}
              step={step}
              value={[Math.min(time, length)]}
              onValueChange={([t]) => scrub(t ?? 0)}
              disabled={!shot}
              className="min-w-32 flex-1"
            />
            <Text role="mono" className="tabular-nums" aria-label="Time">{clock(time)} / {clock(length)}</Text>
            <ToggleGroup
              type="single"
              value={aspect}
              onValueChange={(next) => {
                if (next === "wide" || next === "vertical") setAspect(next);
              }}
              variant="outline"
              size="sm"
              aria-label="Frame"
              disabled={!shot}
            >
              <ToggleGroupItem value="wide">Wide</ToggleGroupItem>
              <ToggleGroupItem value="vertical">Vertical</ToggleGroupItem>
            </ToggleGroup>
            {shots.length > 1 && (
              <Select value={shot?.id} onValueChange={open}>
                <SelectTrigger size="sm" aria-label="Shot" className="w-40">
                  <SelectValue placeholder="Shot" />
                </SelectTrigger>
                <SelectContent>
                  {shots.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
