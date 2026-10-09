"use client";

import * as React from "react";
import { Mountain } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { Text } from "@no-origins/ui/components/text";
import { Toggle } from "@no-origins/ui/components/toggle";
import { cn } from "@no-origins/ui/lib/utils";

import { AssetSelect, Field, Jig } from "@/components/jigs";
import { findAsset } from "@/engine/assets";
import type { AssetBook, Cell, GridSpec } from "@/engine/types";

/**
 * The world's own jigs, beside its controls (his, 2026-10-09: "I want to call this an asset… save this configuration…
 * then use this asset to build a grid of assets", rules first, then cells by hand).
 */

/** Saving the world as it is now as an asset, under the name he types: a new asset, or the next version of one. */
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
    <Jig title="Save as asset" note="This configuration, under your name">
      <div className="col-span-2 flex min-w-0 flex-col gap-2">
        <Label htmlFor={id} className="sr-only">The asset&rsquo;s name</Label>
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
          <Text role="caption">No assets yet.</Text>
        )}
      </div>
    </Jig>
  );
}

/**
 * The grid's cells as a map seen from above, a cell a square: a mountain where an asset stands, lime where he set the
 * cell by hand. A cell picked shows what stands there: from the rules, empty, or any of his assets; and gives it back
 * to the rules. Its copy's own values are the jigs that follow (the screen puts them under this card).
 */
export function CellsJig({ spec, cells, assets, selected, onSelect, onAsset, onClear }: {
  spec: GridSpec;
  cells: Record<string, Cell>;
  assets: AssetBook;
  selected: string | null;
  onSelect: (key: string | null) => void;
  onAsset: (key: string, asset: string) => void;
  onClear: (key: string) => void;
}) {
  const keys: string[] = [];
  for (let row = 1; row <= spec.rows; row++) for (let column = 1; column <= spec.columns; column++) keys.push(`${column},${row}`);
  const standing = (key: string) => {
    const [column, row] = key.split(",").map(Number) as [number, number];
    return findAsset(assets, cells[key]?.asset ?? spec.rule(column, row));
  };
  const cell = selected ? cells[selected] : undefined;
  const choice = !cell || cell.asset === undefined ? "rules" : cell.asset === "" ? "none" : cell.asset.split("@")[0]!;
  return (
    <Jig title="Cells" note={`${spec.columns} by ${spec.rows}; pick a cell to change it by hand`}>
      <div role="group" aria-label="The grid's cells, seen from above" className="col-span-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${spec.columns}, minmax(0, 1fr))` }}>
        {keys.map((key) => {
          const asset = standing(key);
          const byHand = cells[key] !== undefined;
          return (
            <Toggle
              key={key}
              variant="outline"
              size="sm"
              pressed={selected === key}
              onPressedChange={(on) => onSelect(on ? key : null)}
              aria-label={`Cell ${key}: ${asset ? asset.name : "empty"}${byHand ? ", set by hand" : ""}`}
              title={`${key}: ${asset ? asset.name : "empty"}${byHand ? " (by hand)" : ""}`}
              className="aspect-square h-auto min-h-0 min-w-0 px-0"
            >
              {asset ? <Mountain className={cn(byHand && "text-primary")} /> : null}
            </Toggle>
          );
        })}
      </div>
      {selected ? (
        <>
          <Field label={`Cell ${selected}`}>
            <AssetSelect
              label={`What stands in cell ${selected}`}
              value={choice}
              assets={assets}
              extra={[["rules", "From the rules"], ["none", "Empty"]]}
              onChange={(next) => onAsset(selected, next === "rules" ? "rules" : next === "none" ? "" : next)}
            />
          </Field>
          {cell ? (
            <div className="col-span-2">
              <Button variant="outline" size="sm" onClick={() => onClear(selected)}>Back to the rules</Button>
            </div>
          ) : null}
        </>
      ) : null}
    </Jig>
  );
}
