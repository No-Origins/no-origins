"use client";

import { MoreHorizontalIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { ColourPicker } from "@no-origins/ui/components/colour-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@no-origins/ui/components/dropdown-menu";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@no-origins/ui/components/item";
import { Label } from "@no-origins/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@no-origins/ui/components/radio-group";

import { Control, TypedText } from "@/components/jig-card";
import { countOf, ENTRY, newZone, ZONE_OPTIONS, zoneOf, zonesOf, type SectorConfig, type SectorZone } from "@/world/sector-v3";

/**
 * The sector's zones, on its card (World.md W24; his: "I can also create multiple zones in a sector … I should be able to
 * name them. And then I should be able to group the items in it"): every zone a row, the entry first, each with how
 * many blocks it groups; the one picked is the one blocks are built into. A zone's actions are in its own menu (the root
 * CLAUDE.md), and the entry has none: it is always there. Under the rows, a new zone, and the picked zone's name and
 * colour.
 *
 * Frozen with the sector's version 3 (`sector-v3.ts`); nothing draws it.
 */
export function SectorZones({ sector, set }: { sector: SectorConfig; set: (next: Partial<SectorConfig>) => void }) {
  const zones = zonesOf(sector);
  const current = zoneOf(sector);
  const change = (id: string, next: Partial<SectorZone>) => set({ zones: zones.map((zone) => (zone.id === id ? { ...zone, ...next } : zone)) });
  const remove = (id: string) => set({ zones: zones.filter((zone) => zone.id !== id), zone: id === current.id ? ENTRY : current.id });

  return (
    <div className="flex flex-col gap-gutter">
      <RadioGroup value={current.id} onValueChange={(zone) => set({ zone })} aria-label="Zones" className="gap-stack-tight">
        <ItemGroup className="gap-stack-tight">
          {zones.map((zone) => {
            const count = countOf(sector, zone);
            return (
              <Item key={zone.id} variant={zone.id === current.id ? "muted" : "outline"} size="xs">
                <RadioGroupItem value={zone.id} id={`zone-${zone.id}`} />
                <ItemContent>
                  <ItemTitle>
                    <Label htmlFor={`zone-${zone.id}`}>{zone.name}</Label>
                  </ItemTitle>
                  <ItemDescription>
                    {count} {count === 1 ? "block" : "blocks"}
                    {zone.id === ENTRY ? " · the entry" : ""}
                  </ItemDescription>
                </ItemContent>
                {zone.id === ENTRY ? null : (
                  <ItemActions>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`${zone.name}: actions`}>
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(zone.id)}>
                          Delete, with its blocks
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ItemActions>
                )}
              </Item>
            );
          })}
        </ItemGroup>
      </RadioGroup>
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => {
          const zone = newZone(sector);
          set({ zones: [...zones, zone], zone: zone.id });
        }}
      >
        New zone
      </Button>
      <div className="grid grid-cols-2 gap-gutter">
        <Control label="Name" className="col-span-2">
          <TypedText key={current.id} value={current.name} name="Zones name" onCommit={(name) => change(current.id, { name })} />
        </Control>
        <Control label="Colour" className="col-span-2">
          <ColourPicker options={ZONE_OPTIONS} value={current.colour} onValueChange={(colour) => change(current.id, { colour })} aria-label="Zones colour" />
        </Control>
      </div>
    </div>
  );
}
