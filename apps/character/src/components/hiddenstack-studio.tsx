"use client";

import * as React from "react";
import { Bone, PersonStanding, Rotate3D } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Grid, GridItem, useGridMetrics } from "@no-origins/ui/components/grid";
import { HiddenstackAvatar, type HiddenstackAvatarHandle, type HiddenstackAvatarStatus } from "@no-origins/ui/components/hiddenstack-avatar";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { HUMAN_JOINTS, HUMAN_RIG_START, setHumanJoint, type Axis, type HumanGait, type HumanRigState, type JointId } from "@no-origins/ui/lib/human-motion";

import { PropertyControl } from "@/components/property-control";
import { cardBlock, Flow, FoldProvider, Line, PlacedSection, type Section } from "@/components/section";
import { coveredCells, stageDiameter, studioLayout, type StudioLayout } from "@/lib/stage";

function Portrait() {
  const { cols, rows, cell, gap } = useGridMetrics()!;
  const standard = studioLayout(cols, rows, cell, gap);
  // A landscape phone has room beside the figure, not below it. Its controls still flow page by page.
  const compact = rows < 6 && cols >= 8;
  const layout: Pick<StudioLayout, "stage" | "body" | "face" | "looks"> = compact ? {
    stage: { col: 2, row: 2, colSpan: 2, rowSpan: 2 }, body: null, looks: null,
    face: { columns: [{ col: 5, colSpan: Math.min(6, cols - 4) }], row: 1, rows: rows - 1,
      pager: { col: 5, row: rows, colSpan: Math.min(6, cols - 4), rowSpan: 1 } },
  } : { ...standard, face: { ...standard.face, rows: standard.face.rows + (standard.looks ? 0 : 1) } };
  const size = stageDiameter(layout.stage.colSpan, cell, gap);
  const covered = coveredCells(layout.stage.colSpan, cell, gap);
  const viewer = React.useRef<HiddenstackAvatarHandle>(null);
  const [status, setStatus] = React.useState<HiddenstackAvatarStatus>("loading");
  const [rig, setRig] = React.useState<HumanRigState>(HUMAN_RIG_START);
  const joint = HUMAN_JOINTS.find((joint) => joint.id === rig.selected)!;
  const ready = status === "ready";
  const play = (gait: HumanGait) => setRig((value) => ({ ...value, gait, playing: gait !== "rest" }));
  const reset = () => setRig((value) => ({ ...value, pose: {}, gait: "rest", playing: false }));
  const movement: Section = {
    id: "human-movement", label: "Movement", icon: PersonStanding,
    blocks: [cardBlock("motion", "Movement controls", [
      <Line key="gait"><div className="col-span-full flex items-center justify-center gap-2" role="group" aria-label="Movement">
        {(["rest", "walk", "run"] as const).map((gait) => <Button key={gait} size="sm" variant={rig.gait === gait ? "default" : "ghost"} aria-pressed={rig.gait === gait} disabled={!ready} onClick={() => play(gait)}>{gait === "rest" ? "Rest" : gait === "walk" ? "Walk" : "Run"}</Button>)}
      </div></Line>,
      <Line key="play"><Text role="caption" className="col-span-2">{rig.gait === "rest" ? "Pose the joints" : `${rig.gait === "walk" ? "Walking" : "Running"} in place`}</Text><Button size="sm" variant="ghost" disabled={!ready || rig.gait === "rest"} onClick={() => setRig((value) => ({ ...value, playing: !value.playing }))}>{rig.playing ? "Pause" : "Play"}</Button></Line>,
      <PropertyControl key="speed" scope="Movement" property={{ id: "speed", label: "Speed", type: "number", min: 0.25, max: 2, step: 0.25, default: 1, touches: "Playback speed of the walk or run" }} value={rig.speed} onChange={(value) => setRig((current) => ({ ...current, speed: Number(value) }))} />,
      <PropertyControl key="skeleton" scope="Movement" property={{ id: "skeleton", label: "Skeleton", type: "switch", default: false, touches: "Show the bones and highlight the selected joint" }} value={rig.skeleton} onChange={(value) => setRig((current) => ({ ...current, skeleton: value === true }))} />,
    ])],
  };
  const pose: Section = {
    id: "human-pose", label: "Pose", icon: Bone,
    blocks: [cardBlock("joints", "Joint controls", [
      <PropertyControl key="joint" scope="Pose" property={{ id: "joint", label: "Joint", type: "choice", options: HUMAN_JOINTS.map(({ id, label }) => ({ value: id, label })), default: "head", touches: "The joint to rotate; its children follow it" }} value={rig.selected} onChange={(selected) => setRig((current) => ({ ...current, selected: selected as JointId }))} />,
      ...(["Bend", "Turn", "Tilt"] as const).map((label, index) => {
        const axis = index as Axis;
        // A knee is a hinge: it has one axis, not disabled sliders pretending it can twist.
        if (joint.limits[0][axis] === joint.limits[1][axis]) return null;
        return <PropertyControl key={`${joint.id}-${axis}`} scope={joint.label} property={{ id: `axis-${axis}`, label, type: "angle", min: joint.limits[0][axis], max: joint.limits[1][axis], step: 1, default: 0, touches: `${joint.label}: rotation in degrees. Editing returns to the manual pose.` }} value={rig.pose[joint.id]?.[axis] ?? 0} onChange={(value) => setRig((current) => ({ ...current, gait: "rest", playing: false, pose: setHumanJoint(current.pose, joint.id, axis, Number(value)) }))} />;
      }).filter(Boolean),
      <Line key="reset"><Button className="col-span-full justify-self-center" size="sm" variant="ghost" onClick={reset}>Reset pose</Button></Line>,
    ])],
  };
  const view: Section = {
    id: "human-view", label: "View", icon: Rotate3D,
    blocks: [cardBlock("views", "Avatar views", [
      <Line key="views"><div className="col-span-full flex items-center justify-center gap-1" role="group" aria-label="Avatar views">
        <Button variant="ghost" size="sm" disabled={!ready} onClick={() => viewer.current?.view("front")}>Front</Button>
        <Button variant="ghost" size="sm" disabled={!ready} aria-label="Three-quarter view" onClick={() => viewer.current?.view("three-quarter")}>¾</Button>
        <Button variant="ghost" size="sm" disabled={!ready} onClick={() => viewer.current?.view("back")}>Back</Button>
      </div></Line>,
      <Line key="help"><Text role="caption" align="center" className="col-span-full" aria-live="polite">{ready ? "Drag to turn. Arrow keys when focused." : status === "loading" ? "Loading your character…" : "3D is unavailable here. Showing your original avatar."}</Text></Line>,
    ])],
  };

  return (
    <>
      <GridItem col={compact ? 1 : layout.stage.col} row={1} colSpan={compact ? 4 : layout.stage.colSpan} rowSpan={1}>
        <Slot fill="background" inset={8} alignX="center" alignY="center"><Text as="h1" role="heading" align="center">Hiddenstack</Text></Slot>
      </GridItem>
      <GridItem {...layout.stage} data-studio-part="hiddenstack">
        <Slot fill="transparent" inset={0}>
          <div className="relative size-full">
            <svg aria-hidden viewBox={`0 0 ${size} ${size}`} className="pointer-events-none absolute inset-0 size-full">
              <g fill="var(--background)">{covered.map((c) => <circle key={`${c.x}-${c.y}`} cx={c.x} cy={c.y} r={cell / 2 + 1} />)}</g>
              <circle cx={size / 2} cy={size / 2} r={size / 2 - 0.5} fill="var(--muted)" stroke="var(--lime)" strokeWidth={1} />
            </svg>
            <HiddenstackAvatar ref={viewer} poster="/hiddenstack-original.png" onStatusChange={setStatus} rig={rig} />
          </div>
        </Slot>
      </GridItem>
      {layout.body ? <PlacedSection section={view} label={layout.body.label} card={layout.body.card} /> : null}
      {layout.looks ? <>
        <Flow name="Movement" room={layout.face} sections={layout.body ? [movement] : [movement, view]} />
        <Flow name="Pose" room={layout.looks} sections={[pose]} />
      </> : <Flow name="Character" room={layout.face} sections={[movement, pose, view]} />}
    </>
  );
}

export function HiddenstackStudio() {
  return <FoldProvider><Grid overlay cursor><Portrait /></Grid></FoldProvider>;
}
