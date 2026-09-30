"use client";

import * as React from "react";

import { Grid, GridItem, useGridMetrics } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";

import { AgentCell } from "@/components/agent-cell";
import { useBodySection } from "@/components/appearance-card";
import { useColourSection, useRestSection, useRotationSection, useShapeSection, useTextureSection } from "@/components/body-sections";
import { CharacterProvider } from "@/components/character-context";
import { useFaceSections } from "@/components/face-panel";
import { FoldProvider, Flow, PlacedSection } from "@/components/section";
import { DraftBar } from "@/components/versions-panel";
import { studioLayout } from "@/lib/stage";

/**
 * The studio's page (Character-Studio.md C2, C4, C7, C11): the agent's cell at the top, one row above it; the body under
 * it, its heading on the row between; **the face's sections to its left and the body's own — its shape, colour,
 * texture and rest — to its right** (his, 2026-09-30: *"the controls … are all over the place … reorganize them"*),
 * each a heading and its cards (his: *"like we did for projects and case studies or work"*), a column of air from the
 * circle; and **the draft's bar** on the last row under it, between the rooms' pagers. Where the body's card and the bar
 * do not both fit under the circle, the body goes first in the right room. Where the field is too narrow for rooms
 * beside the circle, the body and the face flow under it, in that order, a page at a time, the bar over their pager.
 * Nothing else stands round the cell: what does is his to name.
 *
 * The cell paints out the field's cells it overlaps itself (`AgentCell`), and leaves the corner ones it misses, so its
 * slot is `transparent`: the `background` fill (Grid.md D21) would take the corners too. A card is a `Card` in a
 * transparent slot, so its own border shows.
 */

function Workspace() {
  const metrics = useGridMetrics()!;
  const layout = studioLayout(metrics.cols, metrics.rows, metrics.cell, metrics.gap);
  const body = useBodySection();
  const face = useFaceSections();
  // The body's own sections (C10): its shape, colour, texture and rest.
  const looks = [useShapeSection(), useRotationSection(), useColourSection(), useTextureSection(), useRestSection()];
  return (
    <>
      <GridItem {...layout.stage} data-studio-part="stage">
        <Slot fill="transparent" inset={0}>
          <AgentCell span={layout.stage.colSpan} cell={metrics.cell} gap={metrics.gap} />
        </Slot>
      </GridItem>
      {layout.body ? <PlacedSection section={body} label={layout.body.label} card={layout.body.card} /> : null}
      {layout.looks ? (
        <>
          <Flow name="Face" room={layout.face} sections={face} />
          <Flow name="Body" room={layout.looks} sections={layout.body ? looks : [body, ...looks]} />
        </>
      ) : (
        <Flow name="Character" room={layout.face} sections={[body, ...looks, ...face]} />
      )}
      <DraftBar box={layout.draft} />
    </>
  );
}

/** The motion studio's grid (Motion.md M15): the field drawn, the pointer a violet ring. */
export function Studio() {
  return (
    <CharacterProvider>
      <FoldProvider>
        <Grid overlay cursor>
          <h1 className="sr-only">Character studio</h1>
          <Workspace />
        </Grid>
      </FoldProvider>
    </CharacterProvider>
  );
}
