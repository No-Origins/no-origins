"use client";

import * as React from "react";
import { Cloud as CloudIcon, Mountain } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { Text } from "@no-origins/ui/components/text";
import { Toggle } from "@no-origins/ui/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { cn } from "@no-origins/ui/lib/utils";

import { AssetSelect, Field, Jig } from "@/components/jigs";
import { findAsset } from "@/engine/assets";
import type { Library } from "@/engine/library";
import type { AssetBook, AssetVersion, Cell, GridSpec } from "@/engine/types";

/**
 * The world's own jigs, beside its controls (his, 2026-10-09: "I want to call this an asset… save this configuration…
 * then use this asset to build a grid of assets", rules first, then cells by hand).
 */

/**
 * Saving the world as it is now as a configuration (his word, 2026-10-09; the code's asset, from before Cinema.md F11),
 * under the name he types: a new one, or the next version of one.
 */
export function SaveAsset({ assets, onSave }: { assets: AssetBook; onSave: (name: string) => Promise<string> }) {
  const [name, setName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const id = React.useId();
  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setNote(await onSave(name.trim()));
    setSaving(false);
  };
  const saved = Object.values(assets).map((versions) => versions.at(-1)!).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Jig title="Save as configuration" note="The world as it is now, under your name">
      <div className="col-span-2 flex min-w-0 flex-col gap-2">
        <Label htmlFor={id} className="sr-only">The configuration&rsquo;s name</Label>
        <div className="flex min-w-0 gap-2">
          <Input
            id={id}
            value={name}
            placeholder="Name it"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && save()}
            className="h-9 min-w-0 flex-1"
          />
          <Button size="sm" onClick={save} disabled={!name.trim() || saving}>Save</Button>
        </div>
        {note ? <Text role="caption" aria-live="polite">{note}</Text> : null}
        {saved.length ? (
          <Text role="caption">Saved: {saved.map((a) => `${a.name} (v${a.version})`).join(" · ")}. The same name saves its next version.</Text>
        ) : (
          <Text role="caption">No configurations yet.</Text>
        )}
      </div>
    </Jig>
  );
}

/**
 * The grid's cells as a map seen from above, a cell a square, one layer at a time (the ground, and the layers over it,
 * as the clouds): a mark where an asset stands, lime where he set the cell by hand. A cell picked shows what stands
 * there: from the rules, empty, or any of his assets of the layer's kind; and gives it back to the rules. Its copy's own
 * values are the jigs that follow (the screen puts them under this card). A layer's cell is keyed "<layer>:column,row".
 */
export function CellsJig({ spec, cells, assets, library, selected, onSelect, onAsset, onClear, disabled }: {
  /** Read-only, as a published version is: cells can be picked to see them, not changed. */
  disabled?: boolean;
  spec: GridSpec;
  cells: Record<string, Cell>;
  assets: AssetBook;
  library: Library;
  selected: string | null;
  onSelect: (key: string | null) => void;
  onAsset: (key: string, asset: string) => void;
  onClear: (key: string) => void;
}) {
  const layers = layersOf(spec, library);
  const [layerId, setLayerId] = React.useState(selected?.includes(":") ? selected.split(":")[0]! : "ground");
  const layer = layers.find((l) => l.id === layerId) ?? layers[0]!;
  const keyOf = (column: number, row: number) => (layer.id === "ground" ? `${column},${row}` : `${layer.id}:${column},${row}`);
  const places: [number, number][] = [];
  for (let row = 1; row <= spec.rows; row++) for (let column = 1; column <= spec.columns; column++) places.push([column, row]);
  const Mark = layer.id === "ground" ? Mountain : CloudIcon;
  const cell = selected ? cells[selected] : undefined;
  const choice = !cell || cell.asset === undefined ? "rules" : cell.asset === "" ? "none" : cell.asset.split("@")[0]!;
  const where = selected ? selected.split(":").at(-1)! : "";
  return (
    <Jig title="Cells" note={`${spec.columns} by ${spec.rows}; pick a cell to change it by hand`}>
      {layers.length > 1 ? (
        <Field label="Layer">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="Layer"
            value={layer.id}
            onValueChange={(next) => {
              if (!next) return;
              setLayerId(next);
              onSelect(null);
            }}
          >
            {layers.map((l) => (
              <ToggleGroupItem key={l.id} value={l.id}>{l.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      ) : null}
      <div role="group" aria-label={`The grid's cells, seen from above: ${layer.label.toLowerCase()}`} className="col-span-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${spec.columns}, minmax(0, 1fr))` }}>
        {places.map(([column, row]) => {
          const key = keyOf(column, row);
          const asset = findAsset(assets, cells[key]?.asset ?? layer.rule(column, row));
          const byHand = cells[key] !== undefined;
          return (
            <Toggle
              key={key}
              variant="outline"
              size="sm"
              pressed={selected === key}
              onPressedChange={(on) => onSelect(on ? key : null)}
              aria-label={`Cell ${column},${row}: ${asset ? asset.name : "empty"}${byHand ? ", set by hand" : ""}`}
              title={`${column},${row}: ${asset ? asset.name : "empty"}${byHand ? " (by hand)" : ""}`}
              className="aspect-square h-auto min-h-0 min-w-0 px-0"
            >
              {asset ? <Mark className={cn(byHand && "text-primary")} /> : null}
            </Toggle>
          );
        })}
      </div>
      {selected ? (
        <>
          <Field label={`Cell ${where}`}>
            <AssetSelect
              label={`What stands in cell ${where}`}
              value={choice}
              assets={assets}
              accept={layer.accept}
              disabled={disabled}
              extra={[["rules", "From the rules"], ["none", "Empty"]]}
              onChange={(next) => onAsset(selected, next === "rules" ? "rules" : next === "none" ? "" : next)}
            />
          </Field>
          {cell && !disabled ? (
            <div className="col-span-2">
              <Button variant="outline" size="sm" onClick={() => onClear(selected)}>Back to the rules</Button>
            </div>
          ) : null}
        </>
      ) : null}
    </Jig>
  );
}

/** The ground and the layers over it, each with its rule and the assets it takes. */
export function layersOf(spec: GridSpec, library: Library) {
  const over = spec.layers ?? [];
  const taken = new Set(over.flatMap((l) => (l.of ? [library.idOf(l.of)] : [])));
  return [
    { id: "ground", label: "Ground", rule: spec.rule, accept: (a: AssetVersion) => !taken.has(library.idOf(a.use.entry)) },
    ...over.map((l) => ({ id: l.id, label: l.label, rule: l.rule, accept: l.of ? (a: AssetVersion) => library.idOf(a.use.entry) === library.idOf(l.of!) : undefined })),
  ];
}
