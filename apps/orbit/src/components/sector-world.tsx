"use client";

import { MoreHorizontalIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@no-origins/ui/components/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";

import { Control, JigControls, TypedText, TypedValue } from "@/components/jig-card";
import {
  assetsOf,
  boxesOf,
  chainOf,
  childrenOf,
  entryZoneOf,
  isEntry,
  keptBecause,
  make,
  makeEntry,
  metresOf,
  moveTo,
  originsOf,
  overlapsOf,
  pickedZone,
  remove,
  rename,
  unitOf,
  type Kind,
  type WorldData,
} from "@/world/hierarchy";
import type { NumberControl } from "@/world/jig";
import { BASE_BLOCK } from "@/world/orbit";
import { BUILD_CONTROLS, levelInMetres, sizeInMetres, type BuildState } from "@/world/sector";
import { buildStore, worldStore } from "@/world/store";

/**
 * The world's hierarchy on the sector's card (World.md W4, W25), a group a kind, from the ecosystem down to the zone:
 * the one picked at each, its siblings in a `Select` (the entry marked), its actions in its own menu (the root CLAUDE.md:
 * New, Make it the entry, Delete with all it holds), its name, and its coordinates, X, Y and Z in metres, from the
 * origin of what holds it (his: "Let's go relative"). Picking a unit picks its entry zone, following the entries down
 * (W25: a pointer), and blocks are built into the zone picked. All of it is the world's data (`worldStore`); which zone
 * is picked is the builder's (`buildStore`).
 */

const LABELS: Record<Kind, string> = { ecosystem: "Ecosystem", habitat: "Habitat", sector: "Sector", zone: "Zone" };
const plural = (count: number, kind: string) => `${count} ${count === 1 ? kind : `${kind}s`}`;

/** A coordinate across or along: a whole metre, inside the world's square either way (mine). */
const ACROSS: NumberControl<{ at: number }> = { kind: "number", key: "at", label: "X", min: -500, max: 500, step: 1, unit: "m" };
/** A coordinate up: a whole level, 0.25 m (W4), up to 50 m above or below what holds it (mine). */
const UP: NumberControl<{ at: number }> = { kind: "number", key: "at", label: "Y", min: -50, max: 50, step: BASE_BLOCK.height, unit: "m" };

/** One kind's group: the unit picked, its menu, its name and its coordinates. */
export function UnitControls({ kind, world, build }: { kind: Kind; world: WorldData; build: BuildState }) {
  const unit = chainOf(world, pickedZone(world, build.zone).id)[kind];
  const label = LABELS[kind];
  const siblings = childrenOf(world, unit.parent);
  const kept = keptBecause(world, unit);
  const pick = (id: string) => buildStore.set({ zone: entryZoneOf(world, id) });
  const [x, y, z] = metresOf(unit.at);
  const setAt = (axis: 0 | 1 | 2, metres: number) => {
    const at = [...unit.at] as [number, number, number];
    at[axis] = Math.round(metres / (axis === 2 ? BASE_BLOCK.height : axis === 0 ? BASE_BLOCK.width : BASE_BLOCK.length));
    worldStore.set(moveTo(world, unit.id, at));
  };

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex min-w-0 items-center gap-inline">
        <Select value={unit.id} onValueChange={pick}>
          <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {siblings.map((sibling) => (
              <SelectItem key={sibling.id} value={sibling.id}>
                {sibling.name}
                {isEntry(world, sibling) ? " · entry" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`${label}: actions`}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                const made = make(world, kind, unit.parent);
                worldStore.set(made.world);
                buildStore.set({ zone: entryZoneOf(made.world, made.id) });
              }}
            >
              New {kind}
            </DropdownMenuItem>
            {kind === "ecosystem" ? null : (
              <DropdownMenuItem disabled={isEntry(world, unit)} onSelect={() => worldStore.set(makeEntry(world, unit.id))}>
                Make it the entry
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={!!kept}
              onSelect={() => {
                const next = remove(world, unit.id);
                worldStore.set(next);
                buildStore.set({ zone: entryZoneOf(next, unit.parent ?? childrenOf(next, null)[0].id) });
              }}
            >
              Delete, with all it holds
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Control label="Name">
        <TypedText key={unit.id} value={unit.name} name={`${label} name`} onCommit={(name) => worldStore.set(rename(world, unit.id, name))} />
      </Control>
      <div className="grid grid-cols-3 gap-gutter">
        <Control label="X" value={<TypedValue control={ACROSS} value={x} name={`${label} x`} onCommit={(metres) => setAt(0, metres)} />} />
        <Control label="Y" value={<TypedValue control={UP} value={y} name={`${label} y`} onCommit={(metres) => setAt(2, metres)} />} />
        <Control label="Z" value={<TypedValue control={{ ...ACROSS, label: "Z" }} value={z} name={`${label} z`} onCommit={(metres) => setAt(1, metres)} />} />
      </div>
    </div>
  );
}

/** The builder's controls (`BUILD_CONTROLS`): the tool, the level, the next block's size and colour. */
export function BuildControls({ build }: { build: BuildState }) {
  return <JigControls title="Build" controls={BUILD_CONTROLS} config={build} set={buildStore.set} />;
}

/**
 * What each group says under its name: what the unit is in, whether it is the entry, what it holds and its entry, and
 * where its origin is in the world; under Build, where blocks go and how.
 */
export function notesOf(world: WorldData, build: BuildState): Record<string, string> {
  const zone = pickedZone(world, build.zone);
  const chain = chainOf(world, zone.id);
  const origins = originsOf(world);
  const inWorld = (id: string) => {
    const [x, y, z] = metresOf(origins.get(id) ?? [0, 0, 0]);
    return `in the world, ${x}, ${y}, ${z} m`;
  };
  const held = (kind: Kind) => {
    const unit = chain[kind];
    const parent = unit.parent ? unitOf(world, unit.parent) : undefined;
    const where = parent ? `In ${parent.name}${isEntry(world, unit) ? ", its entry" : ""}. ` : "";
    const from = parent ? `X, Y and Z from ${parent.name}'s origin; ${inWorld(unit.id)}.` : "X, Y and Z are its place in the world, in metres.";
    return { unit, where, from };
  };
  const notes: Record<string, string> = {};
  for (const kind of ["ecosystem", "habitat", "sector"] as const) {
    const { unit, where, from } = held(kind);
    const own = childrenOf(world, unit.id);
    const child = kind === "ecosystem" ? "habitat" : kind === "habitat" ? "sector" : "zone";
    notes[LABELS[kind]] = `${where}${plural(own.length, child)}; its entry ${unitOf(world, unit.entry ?? "")?.name}. ${from}`;
  }
  const { where, from } = held("zone");
  const blocks = assetsOf(world, zone.id);
  const over = overlapsOf(boxesOf(world));
  const overlapping = blocks.filter((block) => over.has(block.id)).length;
  notes.Zone = `${where}${plural(blocks.length, "block")}${overlapping ? `, ${overlapping} overlapping another's` : ""}. ${from}`;
  notes.Build =
    build.tool === "remove"
      ? `Click a block to take it away, from any zone. Drag to look round, right-drag to move, the wheel to come nearer.`
      : `Blocks go into ${zone.name}, on level ${build.level}, ${levelInMetres(build.level)} m over its origin, or against a block. The next is ${sizeInMetres(build)}. Drag to look round, right-drag to move, the wheel to come nearer.`;
  return notes;
}
