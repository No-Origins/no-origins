"use client";

import type { ReactNode } from "react";
import { EraserIcon, LocateFixedIcon, MinusIcon, PlusIcon, ShuffleIcon, SquaresSubtractIcon, SquaresUniteIcon, Trash2Icon, XIcon } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Text } from "@no-origins/ui/components/text";

import { IconAction, IconActions, Control, JigCard, JigControls, TypedText, TypedValue } from "@/components/jig-card";
import { areaTrees, cellOf, emptyGroves, groveTrees } from "@/world/grove";
import {
  assetsOf,
  blockOf,
  groveOf,
  isBlock,
  isGrove,
  keptBecause,
  makeSector,
  metresOf,
  overlapsOf,
  placeAt,
  placedOf,
  roomOf,
  remove,
  rename,
  sectorInside,
  sectorOf,
  sectorsOf,
  skeletonsOf,
  solidInside,
  solidsOf,
  stepOf,
  withBlocksChanged,
  withBlocksMoved,
  withCut,
  withGrove,
  withoutAsset,
  withoutAssets,
  withPlaced,
  withSector,
  withSkeleton,
  type BlockAsset,
  type GroveAsset,
  type Placed,
  type Skeleton,
  type SkeletonKind,
  type WorldData,
} from "@/world/hierarchy";
import { HUMAN_JIG } from "@/world/human";
import type { Jig, JigControl, NumberControl } from "@/world/jig";
import type { Library } from "@/world/library";
import { MOUNTAIN_JIG, type MountainConfig } from "@/world/mountain-jig";
import { mountainExtent } from "@/world/mountain-profile";
import { BASE_BLOCK, WORLD_SIZE } from "@/world/orbit";
import { PIPE_CONTROLS, PIPE_VERSION, pipeEndsOf, type PipeLook } from "@/world/pipe";
import { heightsIn, LENGTH_CONTROL, nextSeed, PLACE_START, SPACING_CONTROL, type PlaceState } from "@/world/place";
import { ROAD_CONTROLS, ROAD_VERSION, type RoadLook } from "@/world/road";
import { jointName, JOINTS_MOST, reachOf, wayAlong, withJointAfter, withoutJoint, type Point, type Way } from "@/world/skeleton";
import {
  areaCard,
  areaControls,
  areaFromCard,
  cardOf,
  HOLLOW_SWITCH,
  hollowControls,
  ITEM_CONTROL,
  ITEMS,
  ROTATION_CONTROLS,
  SECTOR_CONTROLS,
  shapeControls,
  shapeOf,
  sizeOf,
  SPACES_VERSION,
  TOOL_CONTROL,
  turnedOf,
  type AreaCard,
  type BlockCard,
  type BuildState,
  type SectorShape,
} from "@/world/spaces";
import { buildStore, placeStore, sectorFraming, worldStore } from "@/world/store";
import { FLOWER_CONTROLS, tallestTurnOf, TREES_VERSION, TRUNK_CONTROLS, TRUNK_LENGTH, type TreeLook } from "@/world/tree";
import type { Area } from "@/world/area";

/**
 * The Sectors page's two cards (World.md W81, W89, W91, W93; his: "when I am placing that in the sector, the controls
 * related to the element should be on the right", then "We'll only have sectors, and inside sectors, I will place the
 * elements"). On the left, the Sectors card: where and what. The sector picked, its siblings in a `Select`, New, Go to
 * it and Delete as icon buttons, its name, and where it stands and how big it is, X, Y and Z in the world's metres and
 * its width, length and height, each a slider with its value typed; then Build's Tool and Item. What is built and
 * placed goes into the sector picked. On the right, the item's card (`ItemJig`): how, what the next one placed takes,
 * or, once one is picked, the picked one's own. A block, a pipe, a road and a grove take their whole look there (W93;
 * his: "These will be decided while they are being placed in the sector", and of the others, "As they are placed, like
 * a block"); a mountain and a human their variant. All of it is the world's data (`worldStore`); which sector is picked
 * is the builder's (`buildStore`), the next one's values the placing's (`placeStore`). The camera goes to the sector
 * picked, made, moved or sized (`world.tsx`), and again with Go to it (`sectorFraming`).
 */

const plural = (count: number, kind: string) => `${count} ${count === 1 ? kind : `${kind}s`}`;

/** The sector picked. */
export function SectorControls({ world, build }: { world: WorldData; build: BuildState }) {
  const sector = sectorOf(world, build.sector);
  const kept = keptBecause(world);
  const pick = (id: string) => buildStore.set({ sector: id, picked: [] });
  const empty = emptyGroves(world, sector.id);
  const [x, y, z] = metresOf(sector.at);
  const shape: SectorShape = { x, y, z, width: sector.size[0], length: sector.size[1], height: sector.size[2] };
  const setShape = (next: Partial<SectorShape>) => {
    const to = { ...shape, ...next };
    worldStore.set(withSector(world, sector.id, { at: placeAt([to.x, to.z], Math.round(to.y / BASE_BLOCK.height)), size: [to.width, to.length, to.height] }));
  };

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex min-w-0 items-center gap-inline">
        <Select value={sector.id} onValueChange={pick}>
          <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label="Sector">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sectorsOf(world).map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                {candidate.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <IconActions label="Sector: actions">
          <IconAction
            label="New sector"
            icon={PlusIcon}
            onClick={() => {
              const made = makeSector(world);
              worldStore.set(made.world);
              buildStore.set({ sector: made.id, picked: [] });
            }}
          />
          <IconAction label="Go to it" icon={LocateFixedIcon} onClick={sectorFraming.go} />
          {/* A grove with no trees cannot be clicked to pick it (W97): its sector clears them, after asking. */}
          <IconAction
            label={empty.length ? `Remove the empty groves (${empty.length})` : "Remove the empty groves: none"}
            icon={EraserIcon}
            disabled={!empty.length}
            onClick={() => {
              worldStore.set(withoutAssets(world, empty.map((grove) => grove.id)));
              if (empty.some((grove) => grove.id === placeStore.get().picked)) placeStore.set({ picked: null });
            }}
            confirm={{ title: `Remove ${plural(empty.length, "empty grove")} from ${sector.name}?`, description: "They hold no trees at their Spacing, so nothing in the world changes. This cannot be undone." }}
          />
          <IconAction
            label="Delete, with what it holds"
            icon={Trash2Icon}
            destructive
            disabled={!!kept}
            onClick={() => {
              const next = remove(world, sector.id);
              worldStore.set(next);
              buildStore.set({ sector: sectorsOf(next)[0].id, picked: [] });
            }}
            confirm={{ title: `Delete ${sector.name}?`, description: "Every block and element in it goes with it." }}
          />
        </IconActions>
      </div>
      <Control label="Name">
        <TypedText key={sector.id} value={sector.name} name="Sector name" onCommit={(name) => worldStore.set(rename(world, sector.id, name))} />
      </Control>
      <JigControls title="Sector" controls={SECTOR_CONTROLS} config={shape} set={setShape} />
    </div>
  );
}

/** An element placed of a variant (W73, W89): a mountain or a human. */
type VariantKind = "mountain" | "human";
/** What Place puts in that is not a block: an element of a variant, trees (a grove), or a pipe or a road. */
type ElementKind = VariantKind | "tree" | SkeletonKind;

/** The elements' libraries, each its variants (W72, W73, W89): a mountain and a human are placed of one. */
export type Libraries = Record<VariantKind, Library<unknown>>;

/** The element Place puts in, if the item is one (W82, W84): none with Select, or with Block the item. */
export const elementOf = (build: BuildState): ElementKind | null =>
  build.tool === "place" && build.item !== "block" ? (build.item as ElementKind) : null;

const LABELS: Record<ElementKind, string> = { mountain: "Mountain", tree: "Tree", human: "Human", pipe: "Pipe", road: "Road" };

/** A variant's name in its library, or what it is when it is no longer there. */
const variantName = (libraries: Libraries, kind: VariantKind, id: string) => libraries[kind].variants.find((variant) => variant.id === id)?.name ?? "a variant no longer in the library";

/** The variant of a library picked: the one asked for while it is there, else the library's first. */
const variantIn = (library: Library<unknown>, id: string) => (library.variants.some((v) => v.id === id) ? id : library.variants[0]?.id ?? "");

/**
 * The builder's controls on the Sectors card (W24, W82, W89): the Tool and, with Place, the Item it puts in. What the
 * item takes is on the item's card, on the right.
 */
export function BuildControls({ build }: { build: BuildState }) {
  const controls = build.tool !== "place" ? [TOOL_CONTROL] : [TOOL_CONTROL, ITEM_CONTROL];
  return <JigControls title="Build" controls={controls} config={build} set={buildStore.set} />;
}

/** A Select of a library's variants (W73; his, of the mountain: "I just need a drop down of variants to select from on the right"). */
function VariantSelect({ library, value, name, onChange }: { library: Library<unknown>; value: string; name: string; onChange: (id: string) => void }) {
  const picked = variantIn(library, value);
  return (
    <Control label="Variant" value={<Text role="caption" tone="muted">{library.variants.length ? "" : "none yet: make one on its page"}</Text>}>
      <div className="flex min-w-0">
        <Select value={picked} onValueChange={onChange}>
          <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label={name}>
            <SelectValue placeholder="Pick a variant">{library.variants.find((v) => v.id === value)?.name ?? (value && !picked ? "a variant no longer in the library" : undefined)}</SelectValue>
          </SelectTrigger>
          <SelectContent>{library.variants.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </Control>
  );
}

/** Let it go and Remove, the picked one's actions, as icon buttons at the head of its group. */
function PickedActions({ label, letGo, remove: removeIt }: { label: string; letGo: () => void; remove: () => void }) {
  return (
    <div className="flex min-w-0 items-center justify-end gap-inline">
      <IconActions label={label}>
        <IconAction label="Let it go" icon={XIcon} onClick={letGo} />
        <IconAction label="Remove" icon={Trash2Icon} destructive onClick={removeIt} />
      </IconActions>
    </div>
  );
}

/**
 * A grove's Length (his: "Trunk will have min and max lenth - from 1m to 100m"): one slider of two heads, as a jig's range
 * is, the shortest and the tallest typed beside its label, each kept within the other; each tree stands at its own
 * height between them.
 */
function Lengths({ low, high, name, onChange }: { low: number; high: number; name: string; onChange: (low: number, high: number) => void }) {
  const control = LENGTH_CONTROL;
  const [from, to] = heightsIn(low, high);
  return (
    <Control
      label={control.label}
      value={
        <span className="flex shrink-0 items-center gap-inline-tight">
          <TypedValue control={{ ...control, max: to }} value={from} name={`${name} shortest`} onCommit={(value) => onChange(value, to)} />
          <Text role="caption" tone="muted" as="span">to</Text>
          <TypedValue control={{ ...control, min: from }} value={to} name={`${name} tallest`} onCommit={(value) => onChange(from, value)} />
        </span>
      }
    >
      <Slider
        min={control.min}
        max={control.max}
        step={control.step}
        marks={control.marks ?? true}
        value={[from, to]}
        onValueChange={([a, b]) => {
          if (a !== undefined && b !== undefined) onChange(a, b);
        }}
        aria-label={`${name} length`}
      />
    </Control>
  );
}

/** A grove's numbers on its card (W89, W93, W97): its Spacing, and its trees' Length, shortest and tallest. */
type GroveValues = { spacing: number; heightFrom: number; heightTo: number };

/** A grove's Spacing and Length (W89, W93, W97): the next grove's on the item's card while placing, a grove's own once it is picked. */
function GroveControls({ values, name, set }: { values: GroveValues; name: string; set: (next: Partial<GroveValues>) => void }) {
  return (
    <div className="flex flex-col gap-gutter">
      <JigControls title={name} controls={[SPACING_CONTROL]} config={{ spacing: values.spacing }} set={(next) => set(next)} />
      <Lengths low={values.heightFrom} high={values.heightTo} name={name} onChange={(heightFrom, heightTo) => set({ heightFrom, heightTo })} />
    </div>
  );
}

/** The placing's values as a grove's (W89): what the next grove takes, so the next starts from the last set. */
const placeFromGrove = (next: Partial<GroveValues>): Partial<PlaceState> => ({
  ...(next.spacing !== undefined ? { spacing: next.spacing } : {}),
  ...(next.heightFrom !== undefined ? { treeHeight: next.heightFrom } : {}),
  ...(next.heightTo !== undefined ? { treeHeightTo: next.heightTo } : {}),
});

/** A tree's look as two groups of the item's card (W93, W98): Trunk (Colour, Bend radius) and Flower (Shapes, Colours). */
const treeLookGroups = (look: TreeLook, tallest: number, name: string, set: (next: Partial<TreeLook>) => void): ItemGroup[] => [
  {
    title: "Trunk",
    note: `A smooth trunk bent from its foot along one continuous curve. Its radius follows its length. Bend radius is the tallest tree's; a shorter one bends on its share of it, so every tree is the same shape at its own size (a bend too tight is widened so a tip turns at most 120°; the tallest's turns ${tallestTurnOf(look, tallest)}° here).`,
    draw: () => <JigControls title={`${name} trunk`} controls={TRUNK_CONTROLS} config={look} set={set} />,
  },
  {
    title: "Flower",
    note: "At the trunk's tip: a cube or a closed cylinder on its tangent, or an allium's head, a ball of star florets. Its size follows the trunk's length. It is its colour, lit by the sun, and lights nothing. Pick several Shapes and Colours to mix them: each tree is one shape and one colour, drawn by its own seed; Scatter anew draws them again.",
    draw: () => <JigControls title={`${name} flower`} controls={FLOWER_CONTROLS} config={look} set={(next) => {
      // A tree keeps a colour at least: letting the last one go keeps it.
      if (next.colours && !next.colours.length) return;
      set(next);
    }} />,
  },
];

/** A turn, in degrees round from north (W73). */
const TURN: NumberControl<{ turn: number }> = { kind: "number", key: "turn", label: "Turn", min: 0, max: 360, step: 1, unit: "°" };
/** A coordinate across or along: a whole metre, inside the world's square either way (mine). */
const ACROSS: NumberControl<{ at: number }> = { kind: "number", key: "at", label: "X", min: -500, max: 500, step: 1, unit: "m" };
/** A height in the world, in metres: a quarter metre a step, from the floor up to the clouds (mine). */
const HIGH: NumberControl<{ at: number }> = { kind: "number", key: "at", label: "Y", min: 0, max: 1000, step: BASE_BLOCK.height, unit: "m" };
/** A joint's place across or along, in the world's metres: a quarter metre a step (W87), inside the world's square. */
const JOINT_ACROSS: NumberControl<{ at: number }> = { kind: "number", key: "at", label: "X", min: -500, max: 500, step: 0.25, unit: "m" };
/** A tree placed alone's height (W86, W93): 1 to 100 m. */
const HEIGHT: NumberControl<{ height: number }> = { kind: "number", key: "height", label: "Height", min: TRUNK_LENGTH.least, max: TRUNK_LENGTH.most, step: 1, marks: 10, unit: "m" };

/**
 * The element picked with Select, or just placed (W73, W82, W89): Let it go and Remove (Backspace's) as icon buttons; a
 * mountain's or a human's variant in a Select; and X, Y, Z and Turn typed, X and Z in the world's metres. A tree placed
 * alone before groves (W93) has no variant: its own look is its card's next groups, its Height here.
 */
function PickedElement({ world, picked, libraries }: { world: WorldData; picked: Placed; libraries: Libraries }) {
  const { asset } = picked;
  const kind = asset.kind;
  const mountain = kind === "mountain" ? (libraries.mountain.variants.find((v) => v.id === asset.variant)?.settings as MountainConfig | undefined) : undefined;
  return (
    <div className="flex flex-col gap-gutter">
      <PickedActions label="Picked element actions" letGo={() => placeStore.set({ picked: null })} remove={() => { worldStore.set(withoutAsset(world, asset.id)); placeStore.set({ picked: null }); }} />
      {kind !== "tree" ? <VariantSelect library={libraries[kind]} value={asset.variant} name="Picked variant" onChange={(id) => worldStore.set(withPlaced(world, asset.id, { variant: id }))} /> : null}
      <div className="grid grid-cols-3 gap-gutter">
        <Control label="X" value={<TypedValue control={ACROSS} value={Math.round(picked.x)} name="Picked x" onCommit={(x) => worldStore.set(withPlaced(world, asset.id, { worldAt: [x, picked.z] }))} />} />
        {/* Where it stands up and down (W88: anything moves any way), a level a step. */}
        <Control label="Y" value={<TypedValue control={HIGH} value={picked.y} name="Picked y" onCommit={(y) => worldStore.set(withPlaced(world, asset.id, { worldAt: [picked.x, picked.z], level: Math.round(y / BASE_BLOCK.height) }))} />} />
        <Control label="Z" value={<TypedValue control={{ ...ACROSS, label: "Z" }} value={Math.round(picked.z)} name="Picked z" onCommit={(z) => worldStore.set(withPlaced(world, asset.id, { worldAt: [picked.x, z] }))} />} />
        <Control label="Turn" value={<TypedValue control={TURN} value={Math.round(asset.turn)} name="Picked turn" onCommit={(turn) => worldStore.set(withPlaced(world, asset.id, { turn }))} />} />
      </div>
      {kind === "tree" ? <JigControls title="Picked" controls={[HEIGHT]} config={{ height: Math.round(asset.height ?? 50) }} set={(next) => worldStore.set(withPlaced(world, asset.id, { height: next.height }))} /> : null}
      {mountain ? <Text role="caption" tone="muted">{`Its foot reaches ${Math.round(mountainExtent(mountain).radius)} m from where it stands.`}</Text> : null}
    </div>
  );
}

/** A joint's way on the card (W87): free, the curve deciding it, or set, its turn and tilt in degrees. */
type WaySettings = { way: string; turn: number; tilt: number };

/**
 * The way of the picked joint (W87; his: "Turn and Tilt on the card"): Free or Set, and set, its Turn round from north
 * and its Tilt up from level, each a slider with its value typed; a road's tilts less, since its deck stays level from
 * side to side and a steep one is a wall.
 */
const wayControls = (kind: SkeletonKind, set: boolean): readonly JigControl<WaySettings>[] => [
  { kind: "choice", key: "way", label: "Way", options: [{ value: "free", label: "Free" }, { value: "set", label: "Set" }] },
  ...(set
    ? ([
        { kind: "number", key: "turn", label: "Turn", min: 0, max: 359, step: 1, marks: 90, unit: "°" },
        { kind: "number", key: "tilt", label: "Tilt", min: kind === "road" ? -45 : -90, max: kind === "road" ? 45 : 90, step: 1, marks: 45, unit: "°" },
      ] as const)
    : []),
];

/**
 * The pipe or the road picked (World.md W84, W87, W93): Let it go and Remove (Backspace's) as icon buttons; then its
 * joints, the one picked in a Select (the start, the joints between, the end), with Add a joint after it (half way to the
 * next) and Take it out (never below the start and the end); the picked joint's X, Y and Z, in the world's metres, typed,
 * each moving it there; and its Way, Free or Set with its Turn and Tilt. Its look is its card's next group.
 */
function PickedSkeleton({ world, picked, joint }: { world: WorldData; picked: Skeleton; joint: number | null }) {
  const { asset, joints, ways } = picked;
  const index = joint !== null && joint < joints.length ? joint : null;
  const at = index === null ? null : joints[index];
  const reshape = (next: { joints: readonly Point[]; ways: readonly (Way | null)[] }, pick: number | null) => {
    worldStore.set(withSkeleton(world, asset.id, next));
    placeStore.set({ joint: pick });
  };
  const moveTo = (point: Point) => reshape({ joints: joints.map((one, i) => (i === index ? point : one)), ways }, index);
  const way = index === null ? null : ways[index];
  const shown = way ?? (index === null ? null : wayAlong(joints, index));
  const setWay = (next: Partial<WaySettings>) => {
    if (index === null || !shown) return;
    const settings = { way: way ? "set" : "free", turn: shown[0], tilt: shown[1], ...next };
    const kept: Way | null = settings.way === "set" ? [settings.turn, asset.kind === "road" ? Math.max(-45, Math.min(45, settings.tilt)) : settings.tilt] : null;
    reshape({ joints, ways: ways.map((one, i) => (i === index ? kept : one)) }, index);
  };
  return (
    <div className="flex flex-col gap-gutter">
      <PickedActions label="Picked element actions" letGo={() => placeStore.set({ picked: null, joint: null })} remove={() => { worldStore.set(withoutAsset(world, asset.id)); placeStore.set({ picked: null, joint: null }); }} />
      <Control label="Joint">
        <div className="flex min-w-0 items-center gap-inline">
          <Select value={index === null ? "" : String(index)} onValueChange={(value) => placeStore.set({ joint: Number(value) })}>
            <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label="Picked joint"><SelectValue placeholder="Pick a joint" /></SelectTrigger>
            <SelectContent>{joints.map((_, i) => <SelectItem key={i} value={String(i)}>{jointName(i, joints.length)}{ways[i] ? " · way set" : ""}</SelectItem>)}</SelectContent>
          </Select>
          <IconActions label="Joint actions">
            <IconAction
              label="Add a joint after it"
              icon={PlusIcon}
              disabled={joints.length >= JOINTS_MOST}
              onClick={() => {
                const { added, ...next } = withJointAfter(joints, ways, index ?? joints.length - 2);
                reshape(next, added);
              }}
            />
            <IconAction label="Take the joint out" icon={MinusIcon} disabled={index === null || joints.length <= 2} onClick={() => index !== null && reshape(withoutJoint(joints, ways, index), null)} />
          </IconActions>
        </div>
      </Control>
      {at && shown ? (
        <>
          <div className="grid grid-cols-3 gap-gutter">
            <Control label="X" value={<TypedValue control={JOINT_ACROSS} value={at[0]} name="Joint x" onCommit={(x) => moveTo([x, at[1], at[2]])} />} />
            <Control label="Y" value={<TypedValue control={HIGH} value={at[1]} name="Joint y" onCommit={(y) => moveTo([at[0], y, at[2]])} />} />
            <Control label="Z" value={<TypedValue control={{ ...JOINT_ACROSS, label: "Z" }} value={at[2]} name="Joint z" onCommit={(z) => moveTo([at[0], at[1], z])} />} />
          </div>
          <JigControls title="Joint" controls={wayControls(asset.kind, !!way)} config={{ way: way ? "set" : "free", turn: shown[0], tilt: shown[1] }} set={setWay} />
        </>
      ) : null}
    </div>
  );
}

/**
 * The grove picked (W89, W91): Let it go, Scatter anew (another seed) and Remove (Backspace's), whole; and its middle,
 * X and Z, typed in the world's metres, a whole metre a step.
 */
function PickedGrove({ world, grove }: { world: WorldData; grove: GroveAsset }) {
  const [sx, , sz] = metresOf(sectorOf(world, grove.sector).at);
  const moveTo = (x: number, z: number) => worldStore.set(withGrove(world, grove.id, { at: [Math.round(x - sx), Math.round(z - sz)] }));
  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex min-w-0 items-center justify-end gap-inline">
        <IconActions label="Picked grove actions">
          <IconAction label="Let it go" icon={XIcon} onClick={() => placeStore.set({ picked: null })} />
          <IconAction label="Scatter anew" icon={ShuffleIcon} onClick={() => worldStore.set(withGrove(world, grove.id, { seed: nextSeed(grove.seed) }))} />
          <IconAction label="Remove" icon={Trash2Icon} destructive onClick={() => { worldStore.set(withoutAsset(world, grove.id)); placeStore.set({ picked: null }); }} />
        </IconActions>
      </div>
      <div className="grid grid-cols-3 gap-gutter">
        <Control label="X" value={<TypedValue control={ACROSS} value={sx + grove.at[0]} name="Grove x" onCommit={(x) => moveTo(x, sz + grove.at[1])} />} />
        <Control label="Z" value={<TypedValue control={{ ...ACROSS, label: "Z" }} value={sz + grove.at[1]} name="Grove z" onCommit={(z) => moveTo(sx + grove.at[0], z)} />} />
      </div>
    </div>
  );
}

/**
 * A grove's area on its card (W91; his: "give me dimensions to set and once I set the dimensions I should see that
 * placeholder with that dimension"): Width and Length, Corners (to a pill or a circle), and Hollow, a switch, with the
 * hollow's own X and Width, Z and Length and Corners from the area's middle (W89's, moved from the zone to the grove).
 */
function AreaControls({ area, sector, set }: { area: Area; sector: readonly [number, number]; set: (area: Area) => void }) {
  const card = areaCard(area);
  const change = (next: Partial<AreaCard>) => set(areaFromCard({ ...card, ...next }, area));
  return (
    <div className="flex flex-col gap-gutter">
      <JigControls title="Area" controls={areaControls(sector)} config={card} set={change} />
      <JigControls title="Area" controls={[HOLLOW_SWITCH]} config={card} set={change} />
      {area.hollow ? <JigControls title="Hollow" controls={hollowControls(area.size)} config={card} set={change} /> : null}
    </div>
  );
}

/** The pipe or the road picked with Select or just drawn, where it still runs. */
const pickedSkeleton = (world: WorldData, place: PlaceState): Skeleton | undefined => (place.picked ? skeletonsOf(world).find(({ asset }) => asset.id === place.picked) : undefined);

/** The element picked with Select, where it still stands. */
const pickedElement = (world: WorldData, place: PlaceState): Placed | undefined => (place.picked ? placedOf(world).find(({ asset }) => asset.id === place.picked) : undefined);

/** Whether a placed element stands within its own sector's footprint. */
const inItsSector = (world: WorldData, picked: Placed) => {
  const { min, max } = roomOf(sectorOf(world, picked.asset.sector));
  return picked.x >= min[0] && picked.x <= max[0] && picked.z >= min[2] && picked.z <= max[2];
};

/** A block's name on the card (mine): its number, from its id (`block-3` is Block 3). */
const blockName = (id: string) => {
  const numbered = id.match(/^block-(\d+)$/);
  return numbered ? `Block ${numbered[1]}` : id;
};

/** A pipe's name on the card (mine): its number, from its id (`pipe-1` is Pipe 1). */
const pipeName = (id: string) => {
  const numbered = id.match(/^pipe-(\d+)$/);
  return numbered ? `Pipe ${numbered[1]}` : id;
};

/** Names in a line: "Block 1", "Block 1 and Block 2", "Block 1, Block 2 and Block 3". */
const namesOf = (names: readonly string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] ?? "");

/**
 * A pipe and blocks picked together (W95; his: "I need option to subtract while I select two items at once using
 * cmd"): Subtract cuts the pipe out of every block picked, Put back makes each whole of it again.
 */
function Subtract({ world, pipe, blocks }: { world: WorldData; pipe: string; blocks: readonly BlockAsset[] }) {
  const ids = blocks.map((block) => block.id);
  const cut = blocks.filter((block) => block.cuts?.includes(pipe)).length;
  return (
    <IconActions label="Subtract actions">
      <IconAction label={`Subtract ${pipeName(pipe)} from ${blocks.length > 1 ? "the blocks" : blockName(ids[0])}`} icon={SquaresSubtractIcon} disabled={cut === blocks.length} onClick={() => worldStore.set(withCut(world, ids, pipe, true))} />
      <IconAction label={`Put ${blocks.length > 1 ? "the blocks" : blockName(ids[0])} back whole`} icon={SquaresUniteIcon} disabled={!cut} onClick={() => worldStore.set(withCut(world, ids, pipe, false))} />
    </IconActions>
  );
}

/** What a Subtract group says: what is picked, what Subtract does, and what is cut already. */
function subtractNote(pipe: string, blocks: readonly BlockAsset[]): string {
  const cut = blocks.filter((block) => block.cuts?.includes(pipe)).map((block) => blockName(block.id));
  const picked = `${pipeName(pipe)} and ${namesOf(blocks.map((block) => blockName(block.id)))} are picked.`;
  const does = `Subtract cuts the pipe out of ${blocks.length > 1 ? "each block" : "the block"}: where it passes through, the block is open onto it, the pipe its side, and an open end shows through; the pipe stays as it is, and the hole follows it as it is reshaped.`;
  const now = !cut.length ? "Nothing is cut yet." : cut.length === blocks.length ? `${namesOf(cut)} ${cut.length > 1 ? "are" : "is"} cut by it; Put back makes ${cut.length > 1 ? "them" : "it"} whole.` : `${namesOf(cut)} ${cut.length > 1 ? "are" : "is"} cut by it already.`;
  return `${picked} ${does} ${now}`;
}

/** The blocks picked with Select that still stand, in the order picked: the last is the one whose values the card shows. */
const pickedBlocks = (world: WorldData, build: BuildState): BlockAsset[] => build.picked.flatMap((id) => blockOf(world, id) ?? []);

/** Where a block's middle stands from its sector's floor's, typed (W93): a quarter metre or a centimetre a step, by its unit. */
const blockAt = (axis: "X" | "Y" | "Z", block: BlockAsset): NumberControl<{ at: number }> =>
  ({ kind: "number", key: "at", label: axis, min: -500, max: axis === "Y" ? 1000 : 500, step: stepOf(block.unit), unit: "m" });

/**
 * The blocks picked with Select (World.md W24, W93; his, 2026-10-15: "add Select option too, so that I can edit the
 * existing items", "We should be able to do multi-select"): a Select of the sector's blocks, the one last picked in it,
 * or how many are picked, so one is picked here without a click too, with Let it go and Remove (Backspace's); and X, Y
 * and Z, where its middle stands from the middle of its sector's floor, typed: with several picked a typed value moves
 * them all by the same metres. Their shape and rotation are the card's next groups. With nothing picked, the Select
 * alone, listing the sector picked.
 */
function PickedBlocks({ world, build }: { world: WorldData; build: BuildState }) {
  const picked = pickedBlocks(world, build);
  const block = picked[picked.length - 1];
  const ids = picked.map((candidate) => candidate.id);
  const sector = block ? sectorOf(world, block.sector) : sectorOf(world, build.sector);
  const blocks = assetsOf(world, sector.id).filter(isBlock);
  const them = picked.length > 1;
  const picker = (
    <div className="flex min-w-0 items-center gap-inline">
      <Select value={block?.id ?? ""} onValueChange={(id) => buildStore.set({ picked: [id] })}>
        <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label="Picked block">
          <SelectValue placeholder={`Pick a block of ${sector.name}`}>{them ? `${picked.length} blocks picked` : undefined}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {blocks.map((candidate) => (
            <SelectItem key={candidate.id} value={candidate.id}>
              {blockName(candidate.id)} · {sizeOf(candidate.size, candidate.unit)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <IconActions label="Picked block actions">
        <IconAction label={them ? "Let them go" : "Let it go"} icon={XIcon} disabled={!block} onClick={() => buildStore.set({ picked: [] })} />
        <IconAction
          label="Remove"
          icon={Trash2Icon}
          destructive
          disabled={!block}
          onClick={() => {
            if (!ids.length) return;
            worldStore.set(withoutAssets(world, ids));
            buildStore.set({ picked: [] });
          }}
        />
      </IconActions>
    </div>
  );
  if (!block) return picker;
  // A typed coordinate is the last picked block's; the others move with it by the same metres.
  const setAt = (axis: 0 | 1 | 2, metres: number) => {
    const by: [number, number, number] = [0, 0, 0];
    by[axis] = metres - block.at[axis];
    worldStore.set(withBlocksMoved(world, ids, by));
  };
  return (
    <div className="flex flex-col gap-gutter">
      {picker}
      <div className="grid grid-cols-3 gap-gutter">
        {(["X", "Y", "Z"] as const).map((axis, i) => (
          <Control key={axis} label={axis} value={<TypedValue control={blockAt(axis, block)} value={block.at[i]} name={`Picked block ${axis.toLowerCase()}`} onCommit={(metres) => setAt(i as 0 | 1 | 2, metres)} />} />
        ))}
      </div>
    </div>
  );
}

/** How anything picked moves any way (W88; his: "options like blender"). */
const MOVE = "Whatever is picked wears three arrows, X red, Y green (up) and Z blue: drag one to move it along that axis; or press G and move the pointer, X, Y or Z to keep to that axis, then click or Enter to keep it, Escape to put it back.";
/** How the blocks picked turn (W93, his pick "Any axis, as in Blender"). */
const TURN_KEYS = "Press R and move the pointer round them to turn them round the line of sight, X, Y or Z to turn round that axis, Control or Command for 5° steps, then click or Enter to keep it, Escape to put it back.";
const LOOK = "Drag to look round, right-drag to move, the wheel to come nearer.";
/** The Tool's keys (W93, his). */
const TOOL_KEYS = "V is Select, P is Place.";

/**
 * What the Sectors card's groups say under their names: under Sector, how many there are, its size, where it stands
 * and what it holds; under Build, what a click does with the Tool.
 */
export function notesOf(world: WorldData, build: BuildState): Record<string, string> {
  const sector = sectorOf(world, build.sector);
  const [sx, sy, sz] = metresOf(sector.at);
  const own = assetsOf(world, sector.id);
  const blocks = own.filter(isBlock);
  const groves = own.filter(isGrove).length;
  const empty = emptyGroves(world, sector.id).length;
  const elements = own.length - blocks.length - groves;
  const over = overlapsOf(solidsOf(world));
  const overlapping = blocks.filter((block) => over.has(block.id)).length;
  const notes: Record<string, string> = {};
  notes.Sector = `${plural(sectorsOf(world).length, "sector")} in the world. ${sector.name} is ${sector.size.join(" × ")} m, the middle of its floor at ${sx}, ${sy}, ${sz} m${sectorInside(sector, WORLD_SIZE) ? "" : ", part of it outside the world"}; it holds ${plural(blocks.length, "block")}${overlapping ? ` (${overlapping} overlapping another's)` : ""}, ${plural(elements, "element")} and ${plural(groves, "grove")}${empty ? ` (${empty} holding no trees, which Remove the empty groves clears)` : ""}. X and Z are its middle over the world's floor, Y its floor.`;
  notes.Build =
    build.tool === "select"
      ? `Click a block, an element or a grove's tree to pick it, from any sector; Shift-click picks more blocks, and Command-click (Shift, Control) picks a pipe with blocks, to subtract it from them. What is picked is on the card on the right. ${TOOL_KEYS} ${LOOK}`
      : `A click puts the Item into ${sector.name}, inside it alone; what it takes is on the card on the right. ${TOOL_KEYS} ${LOOK}`;
  return notes;
}

/** A group of the item's card: its title, what it says under it, and what it draws. */
type ItemGroup = { title: string; note?: string; draw: () => ReactNode };
/** The item's card (W89): its name, version, groups, and what Copy sends. */
type ItemShown = { key: string; name: string; version: number; groups: ItemGroup[]; copy: string; resettable: boolean };

/** What a picked thing says under Picked: what it is, where it stands, and how it moves. */
function pickedNote(world: WorldData, libraries: Libraries, picked: Placed): string {
  const home = sectorOf(world, picked.asset.sector);
  const kind = picked.asset.kind;
  const named = kind === "tree" ? "Tree, placed alone before groves" : `${LABELS[kind]}, ${variantName(libraries, kind, picked.asset.variant)}`;
  return `${named}, in ${home.name}, at ${Math.round(picked.x)}, ${Math.round(picked.z)} m${inItsSector(world, picked) ? "" : `, outside ${home.name}`}. Drag it to slide it over the ground within its sector, drag its arrows or press G to move it any way, or type where it stands; Backspace removes it, Escape lets it go.`;
}

/** A pipe's or a road's look as a group of the item's card (W93, W94): Pipe (Colour, Radius, Start face, End face) or Road (Colour, Width, Thickness). */
function skeletonLookGroup(kind: SkeletonKind, look: PipeLook | RoadLook, note: string, set: (next: Partial<PipeLook> | Partial<RoadLook>) => void): ItemGroup {
  return kind === "pipe"
    ? { title: "Pipe", note, draw: () => <JigControls title="Pipe" controls={PIPE_CONTROLS} config={look as PipeLook} set={set} /> }
    : { title: "Road", note, draw: () => <JigControls title="Road" controls={ROAD_CONTROLS} config={look as RoadLook} set={set} /> };
}

/** A block's shape and rotation as two groups of the item's card (W93): Block (Unit, Width, Length, Height, Colour, Texture) and Rotation (X, Y, Z). */
function blockGroups(card: BlockCard, blockNote: string, set: (next: Partial<BlockCard>) => void): ItemGroup[] {
  return [
    { title: "Block", note: blockNote, draw: () => <JigControls title="Block" controls={shapeControls(card.unit)} config={card} set={set} /> },
    { title: "Rotation", note: `Round X (east), Y (up) and Z (south), in degrees, turned round Y, then X, then Z of its own. ${TURN_KEYS}`, draw: () => <JigControls title="Rotation" controls={ROTATION_CONTROLS} config={card} set={set} /> },
  ];
}

/**
 * What the item's card shows (W89; his: "the controls related to the element should be on the right"): what is picked,
 * the picked one's own, whatever the tool; else, with Place, what the next Item placed takes; else, with Select, how to
 * pick, and the sector's blocks to pick from.
 */
function itemShown(world: WorldData, build: BuildState, place: PlaceState, libraries: Libraries): ItemShown {
  const sector = sectorOf(world, build.sector);
  const sectorSize = [sector.size[0], sector.size[1]] as const;

  // A pipe or a road picked (W84, W87, W93).
  const shaped = pickedSkeleton(world, place);
  if (shaped) {
    const { asset, joints } = shaped;
    const withBlocks = pickedBlocks(world, build);
    const home = sectorOf(world, asset.sector);
    const { min, max } = roomOf(home);
    const outside = joints.some(([x, y, z]) => x < min[0] || x > max[0] || z < min[2] || z > max[2] || y < min[1] || y > max[1]);
    const index = place.joint !== null && place.joint < joints.length ? place.joint : null;
    const at = index === null ? "" : ` ${jointName(index, joints.length)} is picked, at ${joints[index].join(", ")} m.`;
    const kind = LABELS[asset.kind].toLowerCase();
    const way = index === null ? "" : shaped.ways[index] ? ` Its way is set, ${shaped.ways[index]![0]}° round from north and ${shaped.ways[index]![1]}° up.` : " Its way is free: the curve decides it.";
    const note = `${LABELS[asset.kind]} in ${home.name}: ${joints.length} joints, ${Math.round(reachOf(joints))} m from joint to joint${outside ? `, part of it outside ${home.name}` : ""}.${at}${way} Drag a joint to move it over the ground, Option-drag (Alt) to raise or lower it, or type where it stands; drag the arrow's head to aim its way${asset.kind === "road" ? " (a road's stays level)" : ", Option-drag to keep it level"}, or set it below; ${MOVE} Backspace takes the joint picked out, or with none picked removes the ${kind}; Escape lets the joint go, then the ${kind}.`;
    const setLook = (next: Partial<PipeLook> | Partial<RoadLook>) => {
      worldStore.set(withSkeleton(world, asset.id, { look: next }));
      // The next one drawn starts from the look last set (W89's way).
      placeStore.set(asset.kind === "pipe" ? { pipeLook: { ...asset.look, ...(next as Partial<PipeLook>) } as PipeLook } : { roadLook: { ...asset.look, ...(next as Partial<RoadLook>) } as RoadLook });
    };
    return {
      key: `picked ${asset.id}`,
      name: LABELS[asset.kind],
      version: asset.kind === "pipe" ? PIPE_VERSION : ROAD_VERSION,
      groups: [
        // A pipe picked with blocks (Shift- or Command-click) can be subtracted from them (W95).
        ...(asset.kind === "pipe" && withBlocks.length ? [{ title: "Subtract", note: subtractNote(asset.id, withBlocks), draw: () => <Subtract world={world} pipe={asset.id} blocks={withBlocks} /> }] : []),
        { title: "Picked", note, draw: () => <PickedSkeleton world={world} picked={shaped} joint={place.joint} /> },
        skeletonLookGroup(asset.kind, asset.look, asset.kind === "pipe" ? `Its own: a tube of one radius along its joints, ${pipeEndsOf(asset.look)}. A face switched off opens that end.` : "Its own: a slab of one width and thickness along its joints, level from side to side.", setLook),
      ],
      copy: `${LABELS[asset.kind]} picked: ${JSON.stringify(asset)}`,
      resettable: false,
    };
  }

  // A grove picked (W89, W91, W93): where it stands, its area, its trees' numbers and look.
  const grove = groveOf(world, place.picked);
  if (grove) {
    const home = sectorOf(world, grove.sector);
    const count = groveTrees(world, grove).length;
    const thinned = cellOf(grove) > grove.spacing + 1e-6;
    const values: GroveValues = { spacing: grove.spacing, heightFrom: grove.heightFrom, heightTo: grove.heightTo };
    const set = (next: Partial<GroveValues>) => {
      worldStore.set(withGrove(world, grove.id, next));
      placeStore.set(placeFromGrove(next));
    };
    const setArea = (area: Area) => {
      worldStore.set(withGrove(world, grove.id, { area }));
      placeStore.set({ area });
    };
    const setLook = (next: Partial<TreeLook>) => {
      const look = { ...grove.look, ...next };
      worldStore.set(withGrove(world, grove.id, { look }));
      placeStore.set({ treeLook: look });
    };
    return {
      key: `picked ${grove.id}`,
      name: "Trees",
      version: TREES_VERSION,
      groups: [
        {
          title: "Picked",
          note: `A grove in ${home.name}, planted ${Math.round(grove.y * 10) / 10} m over its floor: ${plural(count, "tree")} on its area, ${thinned ? `about ${Math.round(cellOf(grove))} m apart, thinned from its ${grove.spacing} m so the grove holds no more than it can draw quickly` : `${grove.spacing} m apart`}${count ? "" : ` (none fits: make Spacing smaller or the area larger)`}, outside its hollow, inside ${home.name} alone, each on whatever stands under it: a block, a mountain, a pipe, a road or the floor. Drag one of its trees to move it whole, drag its arrows or press G, or type where its middle stands; Scatter anew draws its trees again; Backspace removes it, Escape lets it go.`,
          draw: () => <PickedGrove world={world} grove={grove} />,
        },
        { title: "Area", note: "Its outline is drawn round it, over whatever its trees stand on. Corners at 100% make a pill, and a circle where Width and Length are equal; no tree stands in its hollow.", draw: () => <AreaControls area={grove.area} sector={[home.size[0], home.size[1]]} set={setArea} /> },
        { title: "Grove", note: "Each tree stands at its own height between the shortest and the tallest of Length.", draw: () => <GroveControls values={values} name="Grove" set={set} /> },
        ...treeLookGroups(grove.look, grove.heightTo, "Grove", setLook),
      ],
      copy: `Grove picked: ${JSON.stringify(grove)}`,
      resettable: false,
    };
  }

  // An element picked: a mountain, a human, or a tree placed alone before groves.
  const element = pickedElement(world, place);
  if (element) {
    const { asset } = element;
    const groups: ItemGroup[] = [{ title: "Picked", note: pickedNote(world, libraries, element), draw: () => <PickedElement world={world} picked={element} libraries={libraries} /> }];
    if (asset.kind === "tree" && asset.look) {
      const look = asset.look;
      groups.push(...treeLookGroups(look, asset.height ?? 50, "Tree", (next) => worldStore.set(withPlaced(world, asset.id, { look: { ...look, ...next } }))));
    }
    const version = asset.kind === "mountain" ? MOUNTAIN_JIG.version : asset.kind === "human" ? HUMAN_JIG.version : TREES_VERSION;
    return { key: `picked ${asset.id}`, name: LABELS[asset.kind], version, groups, copy: `${LABELS[asset.kind]} picked: ${JSON.stringify(asset)}`, resettable: false };
  }

  // The blocks picked, or with Select and nothing picked, the sector's blocks to pick from.
  const blocks = pickedBlocks(world, build);
  if (blocks.length || build.tool === "select") {
    const last = blocks[blocks.length - 1];
    const solids = solidsOf(world);
    const over = overlapsOf(solids);
    const outsideWorld = (id: string) => { const solid = solids.find((candidate) => candidate.id === id); return !!solid && !solidInside(solid, WORLD_SIZE); };
    const outsideSector = (block: BlockAsset) => {
      const { min, max } = roomOf(sectorOf(world, block.sector));
      const [ox, oy, oz] = metresOf(sectorOf(world, block.sector).at);
      const [x, y, z] = [ox + block.at[0], oy + block.at[1], oz + block.at[2]];
      return x < min[0] || x > max[0] || y < min[1] || y > max[1] || z < min[2] || z > max[2];
    };
    let note: string;
    if (!last) {
      note = `Nothing is picked. Click a block, an element or a grove's tree, Shift-click for more blocks, or pick one of ${sector.name}'s blocks below.`;
    } else if (blocks.length === 1) {
      const home = sectorOf(world, last.sector).name;
      const trouble = [over.has(last.id) ? "overlapping another" : null, outsideSector(last) ? `its middle outside ${home}` : null, outsideWorld(last.id) ? "reaching outside the world, not drawn" : null].filter(Boolean).join(", ");
      note = `${blockName(last.id)} in ${home}, ${sizeOf(last.size, last.unit)}${turnedOf(last.rotation)}, its middle at ${last.at.join(", ")} m from the middle of its floor${trouble ? `; ${trouble}` : ""}${last.cuts?.length ? `; ${namesOf(last.cuts.map(pipeName))} cut out of it (Command-click the pipe to put it back)` : ""}. Drag its arrows or press G to move it, R to turn it, or type where it stands; size, turn, colour and texture it below; Command-click a pipe to subtract it from it; Backspace removes it, Escape lets it go.`;
    } else {
      const names = blocks.map((candidate) => blockName(candidate.id));
      const overlapping = blocks.filter((candidate) => over.has(candidate.id)).length;
      const outside = blocks.filter((candidate) => outsideWorld(candidate.id)).length;
      const trouble = [overlapping ? `${overlapping} overlapping another` : null, outside ? `${outside} reaching outside the world, not drawn` : null].filter(Boolean).join(", ");
      note = `${blocks.length} blocks picked: ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}${trouble ? `; ${trouble}` : ""}. The values are ${blockName(last.id)}'s: a change below sizes, turns, colours or textures them all, and a typed X, Y or Z moves them together. ${MOVE} R turns them round their middle. Backspace removes them, Escape lets them go.`;
    }
    const ids = blocks.map((block) => block.id);
    const card = last ? cardOf(last) : null;
    const setShape = (next: Partial<BlockCard>) => {
      if (!card) return;
      const changed = shapeOf({ ...card, ...next });
      // What changed alone goes to every block picked: each keeps the rest of its own.
      const change = Object.fromEntries(Object.entries({
        size: next.width !== undefined || next.length !== undefined || next.height !== undefined ? changed.size : undefined,
        unit: next.unit !== undefined ? changed.unit : undefined,
        rotation: next.rotationX !== undefined || next.rotationY !== undefined || next.rotationZ !== undefined ? changed.rotation : undefined,
        colour: next.colour,
        texture: next.texture !== undefined ? changed.texture : undefined,
      }).filter(([, value]) => value !== undefined));
      worldStore.set(withBlocksChanged(world, ids, change));
    };
    return {
      key: "picked blocks",
      name: blocks.length > 1 ? "Blocks" : last ? "Block" : "Picked",
      version: SPACES_VERSION,
      groups: [
        { title: "Picked", note, draw: () => <PickedBlocks world={world} build={build} /> },
        ...(card ? blockGroups(card, "Width, Length and Height are 1 to 100 in the Unit; a switched Unit keeps the numbers. Grain wears the Sectors card's grain.", setShape) : []),
      ],
      copy: blocks.length ? `Blocks picked: ${JSON.stringify(blocks)}` : "Nothing picked.",
      resettable: false,
    };
  }

  // Placing: what the next one placed takes.
  const item = elementOf(build);
  const into = `${sector.name}, inside it alone`;
  if (!item) {
    const shape = shapeOf(build);
    return {
      key: "place block",
      name: "Block",
      version: SPACES_VERSION,
      groups: blockGroups(build, `Blocks go into ${into}: a click puts the next flush on what the pointer meets, a block's face, an element or the floor. The next is ${sizeOf(shape.size, shape.unit)}${turnedOf(shape.rotation)}. Width, Length and Height are 1 to 100 in the Unit; a switched Unit keeps the numbers. Grain wears the Sectors card's grain.`, buildStore.set),
      copy: `Next block: ${JSON.stringify(shape)}`,
      resettable: false,
    };
  }
  const label = ITEMS.find((candidate) => candidate.value === item)?.label ?? item;
  if (item === "tree") {
    const values: GroveValues = { spacing: place.spacing, heightFrom: place.treeHeight, heightTo: place.treeHeightTo };
    // How many trees the next grove's area holds at its Spacing (W97): none, and a click plants nothing.
    const holds = areaTrees({ area: place.area, spacing: place.spacing, seed: place.seed }).length;
    const none = `No tree fits: at ${place.spacing} m apart, a ${place.area.size.join(" × ")} m area holds none, so a click plants nothing. Make Spacing smaller or the area larger.`;
    return {
      key: "place tree",
      name: "Trees",
      version: TREES_VERSION,
      groups: [
        {
          title: "Area",
          note: `${holds ? "" : `${none} `}Its outline follows the pointer over ${sector.name}, draped over what stands there: a click plants a grove there, its middle where the outline's is, and picks it, to tune. Trees stand inside the outline alone, outside its hollow, inside ${sector.name}, each on whatever stands under it: a block's top, a mountain, a pipe, a road or the floor.`,
          draw: () => <AreaControls area={place.area} sector={sectorSize} set={(area) => placeStore.set({ area })} />,
        },
        {
          title: "Grove",
          note: holds ? `${plural(holds, "tree")} on this area, ${place.spacing} m apart (fewer where it reaches past ${sector.name}), each at its own height between the shortest and the tallest of Length.` : none,
          draw: () => <GroveControls values={values} name="Next grove" set={(next) => placeStore.set(placeFromGrove(next))} />,
        },
        ...treeLookGroups(place.treeLook, heightsIn(place.treeHeight, place.treeHeightTo)[1], "Next grove", (next) => placeStore.set({ treeLook: { ...place.treeLook, ...next } })),
      ],
      copy: `Next grove: ${JSON.stringify({ area: place.area, look: place.treeLook, ...values })}`,
      resettable: true,
    };
  }
  if (item === "pipe" || item === "road") {
    const look = item === "pipe" ? place.pipeLook : place.roadLook;
    const note = `${label}s go into ${into}, a joint a click: click where it starts, then each joint after; it takes shape as they are placed, reaching from the last to where the pointer would put the next. A click on its last joint, a double click, Enter or Escape ends it; Backspace takes the last joint back. On the floor it lies; on a block's face or another element it attaches, ${item === "road" ? "on a block's side running out of it level (on a top it lies)" : "leaving straight out of the face"}.${item === "pipe" ? " Start face and End face close its ends; switched off, that end is open." : ""}`;
    return {
      key: `place ${item}`,
      name: label,
      version: item === "pipe" ? PIPE_VERSION : ROAD_VERSION,
      groups: [skeletonLookGroup(item, look, note, (next) => placeStore.set(item === "pipe" ? { pipeLook: { ...place.pipeLook, ...(next as Partial<PipeLook>) } } : { roadLook: { ...place.roadLook, ...(next as Partial<RoadLook>) } }))],
      copy: `Next ${label.toLowerCase()}: ${JSON.stringify(look)}`,
      resettable: true,
    };
  }
  const library = libraries[item];
  return {
    key: `place ${item}`,
    name: label,
    version: item === "mountain" ? MOUNTAIN_JIG.version : HUMAN_JIG.version,
    groups: [{
      title: "Variant",
      note: `${label}s go into ${into}: click its floor or a block's top; a ring shows where.${item === "mountain" ? " A mountain faces the world's middle." : ` A human stands still in its variant's Posture, facing ${sector.name}'s middle.`}`,
      draw: () => <VariantSelect library={library} value={place[item]} name="Build variant" onChange={(id) => placeStore.set({ [item]: id })} />,
    }],
    copy: `Next ${label.toLowerCase()}: ${JSON.stringify({ variant: place[item] })}`,
    resettable: true,
  };
}

/**
 * The item's card, on the right of the Sectors page (W89; his: "So when I am placing that in the sector, the controls
 * related to the element should be on the right"): named for what it shows, its groups open; Reset puts the next one's
 * values back to their starts, and Copy sends what it shows.
 */
export function ItemJig({ world, build, place, libraries, below }: { world: WorldData; build: BuildState; place: PlaceState; libraries: Libraries; below?: string }) {
  const shown = itemShown(world, build, place, libraries);
  const jig: Jig<PlaceState> = { name: shown.name, version: shown.version, start: PLACE_START, groups: shown.groups.map((group) => ({ title: group.title, controls: [] })) };
  const sections = Object.fromEntries(shown.groups.map((group) => [group.title, group.draw]));
  const notes = Object.fromEntries(shown.groups.flatMap((group) => (group.note ? [[group.title, group.note]] : [])));
  return (
    <JigCard
      // Made anew when its groups change (a block picked brings Block and Rotation), so every group it shows opens.
      key={`${shown.key} ${shown.groups.map((group) => group.title).join(" ")}`}
      jig={jig}
      store={placeStore}
      side="end"
      below={below}
      sections={sections}
      notes={notes}
      open={shown.groups.map((group) => group.title)}
      resettable={shown.resettable}
      copy={() => shown.copy}
    />
  );
}
