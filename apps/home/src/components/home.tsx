"use client";

import * as React from "react";
import { Map as MapIcon, Pause, Play, SkipBack, SkipForward } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { ButtonGroup } from "@no-origins/ui/components/button-group";
import { Card } from "@no-origins/ui/components/card";
import { Grid, GridItem, GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { Toggle } from "@no-origins/ui/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import { useFarewellMotion } from "@no-origins/ui/hooks/use-farewell-motion";

import { ModelView, type ModelViewHandle, type ModelViewStatus } from "@/components/model-view";
import { farewellLayout, homeLayout } from "@/lib/layout";
import { houseBounds, type House } from "@/lib/house";
import type { Tour } from "@/lib/tour";
import type { TourState } from "@/lib/viewer";

/** The air inside the player's round ends, a step of the spacing scale, as the portfolio's pills have it. */
const PAD = GRID_SPACING[4];
const DESTINATIONS = [
  { label: "Design", href: "https://design.no-origins.com" },
  { label: "Portfolio", href: "https://hiddenstack.no-origins.com" },
  { label: "Motion", href: "https://motion.no-origins.com" },
  { label: "Orbit", href: "https://orbit.no-origins.com" },
] as const;

/**
 * The page (Home.md H3, H9): the model on a stage that takes the field, and on the last rows, its name over the
 * player. The name is one `hero` (Type.md T5) — "The house" on the long shot, the stop's name at a stop, "Plan" on the
 * plan; nothing else, his — right over the
 * player, and a new name arrives as a surface does, fading in and rising by the surface's shift (Motion.md M4; the
 * enter · exit of M11 is not decided, so this is the system's placeholder). The player is a pill as wide as its
 * controls, not its row (his: "remove the extra padding"): back, play or pause, forward; the stops, one numbered
 * circle each, the one the camera is at pressed; the speed, 1× or 2×; and the plan.
 * The page opens on the tour's long shot, the whole house, no stop pressed; Play glides in to the first stop, then
 * walks the stops in order and waits at each; a drag on the model pauses it; a stop pressed walks there if it is next
 * door and cuts there if not. The plan pressed shows the plan and no stop is pressed until one is picked again.
 * The screen is his to design.
 */
function Workspace({ house, tour: homeTour }: { house: House; tour: Tour }) {
  const metrics = useGridMetrics();
  const planView = house.views[0]?.id ?? "plan";
  const planAspect = React.useMemo(() => {
    const bounds = houseBounds(house);
    return (bounds.max[0] - bounds.min[0]) / (bounds.max[1] - bounds.min[1]);
  }, [house]);
  const viewer = React.useRef<ModelViewHandle>(null);
  const [status, setStatus] = React.useState<ModelViewStatus>("loading");
  const [plan, setPlan] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [tour, setTour] = React.useState<TourState>({ stop: homeTour.opening ? -1 : 0, phase: "at", playing: false, progress: 0, completed: false, overview: false });
  const farewell = React.useRef<HTMLDivElement>(null);
  const stage = React.useRef<HTMLDivElement>(null);
  useFarewellMotion(farewell, tour.completed && !plan, stage, planAspect);
  const leave = React.useCallback(() => setPlan(false), []);
  if (!metrics) return null;
  const layout = homeLayout(metrics.cols, metrics.rows, metrics.cell, metrics.gap);
  const stops = homeTour.stops;
  // Before the first stop the camera is on the long shot (H9, version 4): the opening's words, no stop pressed.
  const opening = tour.stop < 0 ? homeTour.opening : undefined;
  const stop = stops[tour.stop];
  const first = homeTour.opening ? -1 : 0;
  const ready = status === "ready";
  const finished = tour.completed && !plan;
  const closing = farewellLayout(metrics.cols, metrics.rows, metrics.cell, metrics.gap, layout.bar, planAspect);
  const name = plan || tour.overview ? "Plan" : ((stop ?? opening)?.label ?? "");
  const goTo = (index: number) => {
    setPlan(false);
    viewer.current?.tour.go(index);
  };
  return (
    <>
      <GridItem
        ref={stage}
        {...(finished ? closing.stage : layout.stage)}
        data-home-part="stage"
        data-plan-columns={finished ? closing.planCols : undefined}
        className={finished ? "w-(--home-plan-width) justify-self-center" : undefined}
        style={finished ? { "--home-plan-width": `${closing.planWidth}px` } as React.CSSProperties : undefined}
      >
        <Slot fill="background" inset={0}>
          <ModelView
            ref={viewer}
            house={house}
            tour={homeTour}
            view={plan ? planView : ""}
            onStatusChange={setStatus}
            onMoved={leave}
            onTour={setTour}
          />
        </Slot>
      </GridItem>
      {finished ? (
        <div ref={farewell} data-home-farewell="true" className="contents">
          <GridItem {...closing.hero}>
            <Slot fill="transparent" inset={0} alignX="center" alignY="center">
              <Text data-farewell-hero role="hero" weight="heavy" as="h2" align="center" aria-live="polite" className="max-w-full text-balance">
                Thanks for visiting,<br />have a good day
              </Text>
            </Slot>
          </GridItem>
          <nav aria-label="Explore No Origins" className="contents">
            {DESTINATIONS.map(({ label, href }, index) => (
              <GridItem key={label} {...closing.links[index]!} data-home-part="destination">
                <Slot fill="transparent" inset={0}>
                  <Button data-farewell-link asChild variant="outline" className="size-full min-w-0 border-primary px-0">
                    <a href={href}>{label}</a>
                  </Button>
                </Slot>
              </GridItem>
            ))}
          </nav>
        </div>
      ) : (
        <GridItem {...layout.caption} data-home-part="guide">
          <Slot fill="transparent" inset={0} alignX="center" alignY="center">
            {/* The live region stays put; the name in it is keyed, so each new one is mounted and arrives. */}
            <div aria-live="polite" className="flex w-full justify-center">
              <Text
                key={name}
                role="hero"
                as="h2"
                align="center"
                className="motion-surface animate-in fade-in-0 slide-in-from-bottom-(length:--motion-surface-shift) text-balance"
              >
                {name}
              </Text>
            </div>
          </Slot>
        </GridItem>
      )}
      {(!finished || closing.showPlayer) && (
        <GridItem {...layout.bar} data-home-part="tour">
          <Slot fill="transparent" inset={0} alignX="center" alignY="stretch">
            <Card size="sm" className="max-w-full flex-row flex-wrap items-center justify-center gap-2 py-0" style={{ paddingInline: PAD }}>
              <ButtonGroup aria-label="Play">
                <Button variant="outline" size="icon-sm" aria-label="Back a stop" disabled={!ready || tour.stop <= first} onClick={() => goTo(tour.stop - 1)}>
                  <SkipBack />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={tour.playing ? "Pause the tour" : "Play the tour"}
                  aria-pressed={tour.playing}
                  disabled={!ready}
                  onClick={() => {
                    setPlan(false);
                    if (tour.playing) viewer.current?.tour.pause();
                    else viewer.current?.tour.play();
                  }}
                >
                  {tour.playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
                </Button>
                <Button variant="outline" size="icon-sm" aria-label="On a stop" disabled={!ready || tour.stop >= stops.length - 1} onClick={() => goTo(tour.stop + 1)}>
                  <SkipForward />
                </Button>
              </ButtonGroup>
              <ToggleGroup
                type="single"
                value={plan || tour.overview || !stop ? "" : stop.id}
                onValueChange={(next) => {
                  const index = stops.findIndex((candidate) => candidate.id === next);
                  if (index >= 0) goTo(index);
                }}
                variant="outline"
                size="sm"
                aria-label="Stops"
                disabled={!ready}
                className="flex-wrap justify-center"
              >
                {stops.map((candidate, index) => (
                  // The tooltip's trigger is inside the item, not round it: a trigger round a toggle writes its own
                  // `data-state` over the toggle's on/off, and the pressed stop would not show.
                  <ToggleGroupItem key={candidate.id} value={candidate.id} aria-label={candidate.label} className="w-9 px-0 tabular-nums">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex size-full items-center justify-center">{index + 1}</span>
                      </TooltipTrigger>
                      <TooltipContent>{candidate.label}</TooltipContent>
                    </Tooltip>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <ToggleGroup
                type="single"
                value={String(rate)}
                onValueChange={(next) => {
                  // One speed is always pressed: a press on the pressed one changes nothing.
                  if (!next) return;
                  setRate(Number(next));
                  viewer.current?.tour.rate(Number(next));
                }}
                variant="outline"
                size="sm"
                aria-label="Speed"
                disabled={!ready}
              >
                {[1, 2].map((times) => (
                  <ToggleGroupItem key={times} value={String(times)} aria-label={`${times}× speed`} className="w-9 px-0 tabular-nums">
                    {times}×
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Toggle
                variant="outline"
                size="sm"
                pressed={plan || tour.overview}
                onPressedChange={(next) => {
                  setPlan(next);
                  if (!next) viewer.current?.tour.go(tour.stop);
                }}
                aria-label="The plan"
                disabled={!ready}
              >
                <MapIcon data-icon="inline-start" />
                Plan
              </Toggle>
            </Card>
          </Slot>
        </GridItem>
      )}
    </>
  );
}

/**
 * The studios' grid: the field drawn, the pointer a violet ring, no intro (Grid.md D49). The house and its tour come
 * from the page (`app/page.tsx`), which reads them where they live (Home.md H4, `lib/store.ts`).
 */
export function Home({ house, tour }: { house: House; tour: Tour }) {
  return (
    <Grid overlay cursor>
      <h1 className="sr-only">Home</h1>
      <Workspace house={house} tour={tour} />
    </Grid>
  );
}
