"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@no-origins/ui/components/collapsible";
import { ColourPicker, type ColourOption } from "@no-origins/ui/components/colour-picker";
import { Label } from "@no-origins/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Switch } from "@no-origins/ui/components/switch";
import { Text } from "@no-origins/ui/components/text";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { cn } from "@no-origins/ui/lib/utils";

import { resolve } from "@/engine/controls";
import type { AssetBook, AssetVersion, Control as ControlSpec, Entry, Value, Values } from "@/engine/types";

/**
 * The jigs (Cinema-Engine.md E1, E4): every control an entry declares, drawn from its declaration, so a new control in
 * code is on the screen with nothing else written. The grammar is the motion studio's, so the studios read as one
 * system: a card a group, its label for a head; each control its label and value on a line and its widget under it,
 * two to a row; one widget a kind — a slider for a number or an angle, a toggle group for a choice, a switch, the
 * colour picker for a colour, and a list of his saved assets, by name, for an asset. A card folds to its head.
 */

export function Jig({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card size="sm" data-cinema-jig={title} className="shrink-0 gap-3 shadow-none">
        <CardHeader className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Text role="label" as="h2" className="truncate">{title}</Text>
            {note ? <Text role="caption" className="truncate">{note}</Text> : null}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={open ? `Fold ${title}` : `Open ${title}`}>
              <ChevronDown className={cn(open && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent asChild>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

const decimals = (step: number) => (step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step))));
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** A value as read beside its label: its unit, or degrees for an angle. */
function shown(control: ControlSpec, value: Value) {
  if (control.kind === "number") return `${(value as number).toFixed(decimals(control.step))}${control.unit ? ` ${control.unit}` : ""}`;
  if (control.kind === "angle") return `${(value as number).toFixed(decimals(control.step))}°`;
  return undefined;
}

/** The asset list's entry for none. */
const NONE = "none";

/** A list of his saved assets by name, the newest version of each; `none` for nothing. */
export function AssetSelect({ id, label, value, assets, onChange, extra, accept }: {
  id?: string;
  label: string;
  value: string;
  assets: AssetBook;
  onChange: (value: string) => void;
  /** Choices before the assets, as [value, label]. */
  extra?: readonly (readonly [string, string])[];
  /** Which assets it offers: by default, all of them. */
  accept?: (asset: AssetVersion) => boolean;
}) {
  const named = Object.values(assets).map((versions) => versions.at(-1)!).filter((a) => accept?.(a) ?? true).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} size="sm" aria-label={label} className="w-full">
        <SelectValue placeholder="No asset" />
      </SelectTrigger>
      <SelectContent>
        {(extra ?? [[NONE, "No asset"]]).map(([v, text]) => (
          <SelectItem key={v} value={v}>{text}</SelectItem>
        ))}
        {named.map((asset) => (
          <SelectItem key={asset.id} value={asset.id}>{`${asset.name} · v${asset.version}`}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ControlRow({ control, value, palette, assets, onChange }: { control: ControlSpec; value: Value; palette: readonly ColourOption[]; assets: AssetBook; onChange: (value: Value) => void }) {
  const id = React.useId();
  const wide = control.kind === "choice" || control.kind === "colour" || control.kind === "asset";
  let widget: React.ReactNode;
  switch (control.kind) {
    case "number":
    case "angle":
      widget = (
        <Slider id={id} aria-label={control.label} min={control.min} max={control.max} step={control.step} value={[value as number]} onValueChange={([next]) => next !== undefined && onChange(next)} />
      );
      break;
    case "choice":
      widget = (
        <ToggleGroup id={id} type="single" variant="outline" size="sm" aria-label={control.label} value={String(value)} onValueChange={(next) => next && onChange(next)} className="flex-wrap">
          {control.options.map((option) => (
            <ToggleGroupItem key={option} value={option}>{capital(option)}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
      break;
    case "switch":
      widget = <Switch id={id} aria-label={control.label} checked={value as boolean} onCheckedChange={onChange} />;
      break;
    case "asset":
      widget = (
        <AssetSelect
          id={id}
          label={control.label}
          value={String(value).split("@")[0] || NONE}
          assets={assets}
          accept={control.of ? (asset) => asset.use.entry === control.of : undefined}
          onChange={(next) => onChange(next === NONE ? "" : next)}
        />
      );
      break;
    case "colour": {
      const options = palette.some((option) => option.value === value) ? palette : [...palette, { value: String(value), label: String(value), colour: String(value) }];
      widget = <ColourPicker aria-label={control.label} options={options} value={String(value)} onValueChange={onChange} className="w-full" />;
      break;
    }
  }
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", wide && "col-span-2")} title={control.help}>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <Label htmlFor={id}>{control.label}</Label>
        {shown(control, value) ? <Text role="mono" as="span" className="shrink-0 tabular-nums">{shown(control, value)}</Text> : null}
      </div>
      <div className="flex min-h-5 min-w-0 items-center">{widget}</div>
    </div>
  );
}

/** A control that is not an entry's (which shot, which frame), in the same grammar: its label, its widget under it. */
export function Field({ label, wide = true, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", wide && "col-span-2")}>
      <Label>{label}</Label>
      <div className="flex min-h-5 min-w-0 items-center">{children}</div>
    </div>
  );
}

/** An entry's controls as jigs, a card for each of its groups; `title` heads a card when the entry has no groups. */
export function EntryJigs({ entry, values, title, note, palette, assets, onChange }: {
  entry: Entry;
  values: Values;
  title: string;
  note?: string;
  palette: readonly ColourOption[];
  assets: AssetBook;
  onChange: (control: string, value: Value) => void;
}) {
  const resolved = resolve(entry.controls, values);
  const groups = new Map<string, ControlSpec[]>();
  for (const control of entry.controls) {
    const group = control.group ?? title;
    groups.set(group, [...(groups.get(group) ?? []), control]);
  }
  return (
    <>
      {[...groups].map(([group, controls], index) => (
        <Jig key={group} title={group === title ? title : `${title} · ${group}`} note={index === 0 ? note : undefined}>
          {controls.map((control) => (
            <ControlRow key={control.id} control={control} value={resolved[control.id]!} palette={palette} assets={assets} onChange={(value) => onChange(control.id, value)} />
          ))}
        </Jig>
      ))}
    </>
  );
}
