"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@no-origins/ui/components/collapsible";
import { ColourPicker, type ColourOption } from "@no-origins/ui/components/colour-picker";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Label } from "@no-origins/ui/components/label";
import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Slot } from "@no-origins/ui/components/slot";
import { Switch } from "@no-origins/ui/components/switch";
import { Text } from "@no-origins/ui/components/text";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { cn } from "@no-origins/ui/lib/utils";

import { resolve } from "@/engine/controls";
import type { Library } from "@/engine/library";
import type { AssetBook, AssetVersion, Control as ControlSpec, Entry, Value, Values } from "@/engine/types";

/**
 * The jigs (Cinema-Engine.md E1, E4): every control an entry declares, drawn from its declaration, so a new control in
 * code is on the screen with nothing else written. The grammar is the motion studio's, so the studios read as one
 * system: a card a group, its label for a head; each control its label and value on a line and its widget under it,
 * two to a row; one widget a kind — a slider for a number or an angle (marked over each step, across the card, when
 * its steps are few enough to draw), a toggle group for a choice, a switch, the colour picker for a colour (a row of
 * swatches a palette, his named colours first), and a list of his saved assets, by name, for an asset. A card folds to
 * its head.
 */

/** A row of swatches a colour control offers: his named colours first, then each further palette under its name. */
export type ColourRow = { label: string; options: readonly ColourOption[] };

/**
 * A box as tall as whole rows of the field (his, 2026-10-09: "the cards are not following the background grid"): the
 * height its content needs, rounded up to the rows it reaches, so its edges stand on the field's lines (Grid.md D12).
 * Measured from where its first part starts to where its last ends, so a box never grows by its own rounding, nor by
 * where its parts sit in it (a folded card centres its name).
 */
function useRows<T extends HTMLElement>() {
  const metrics = useGridMetrics();
  const pitch = metrics ? metrics.cell + metrics.gap : 0;
  const gap = metrics?.gap ?? 0;
  const ref = React.useRef<T>(null);
  const [height, setHeight] = React.useState<number>();
  React.useLayoutEffect(() => {
    const box = ref.current;
    if (!box || !pitch) return;
    const measure = () => {
      const first = box.firstElementChild, last = box.lastElementChild;
      if (!first || !last) return;
      const style = getComputedStyle(box);
      const edges = ["paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"] as const;
      const natural = last.getBoundingClientRect().bottom - first.getBoundingClientRect().top + edges.reduce((sum, edge) => sum + parseFloat(style[edge]), 0);
      const rows = Math.max(1, Math.ceil((natural + gap - 0.5) / pitch));
      setHeight(rows * pitch - gap);
    };
    // Its parts change size as their content does, and come and go as it folds.
    const sizes = new ResizeObserver(measure);
    const watch = () => {
      sizes.disconnect();
      for (const part of box.children) sizes.observe(part);
    };
    watch();
    measure();
    const parts = new MutationObserver(() => {
      watch();
      measure();
    });
    parts.observe(box, { childList: true });
    return () => {
      sizes.disconnect();
      parts.disconnect();
    };
  }, [pitch, gap]);
  return [ref, height] as const;
}

/**
 * A column of cards on the field: each card whole rows tall, the field's gap between them, so every edge is on one of
 * its lines. A column with more than it can hold scrolls its own content (Grid.md D52) and comes to rest on a row,
 * never between two.
 */
export function JigColumn({ label, children }: { label: string; children: React.ReactNode }) {
  const metrics = useGridMetrics();
  const pitch = metrics ? metrics.cell + metrics.gap : 0;
  const content = React.useRef<HTMLDivElement>(null);
  const [extent, setExtent] = React.useState(0);
  React.useLayoutEffect(() => {
    const box = content.current;
    if (!box) return;
    const measure = () => setExtent(box.scrollHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <Slot fill="transparent" inset={0}>
      <ScrollArea className="size-full [&>[data-slot=scroll-area-viewport]]:snap-y [&>[data-slot=scroll-area-viewport]]:snap-mandatory" aria-label={label}>
        <div ref={content} className="relative flex flex-col" style={{ gap: metrics?.gap }}>
          {/* Where a scroll may come to rest: the top of every row. */}
          {pitch
            ? Array.from({ length: Math.ceil(extent / pitch) }, (_, row) => (
                <span key={row} aria-hidden className="pointer-events-none absolute inset-x-0 h-px snap-start" style={{ top: row * pitch }} />
              ))
            : null}
          {children}
        </div>
      </ScrollArea>
    </Slot>
  );
}

export function Jig({ title, note, lead, children }: {
  title: string;
  note?: string;
  /** Before the title, in its row: a way back (an asset's card on its bench). */
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  const [ref, height] = useRows<HTMLDivElement>();
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card
        ref={ref}
        size="sm"
        data-cinema-jig={title}
        data-folded={open ? undefined : ""}
        // Folded, a card closes into one row (his, 2026-10-09): its name and its arrow, centred in it, the note gone.
        className={cn("shrink-0 gap-3 shadow-none", !open && "justify-center")}
        style={{ minHeight: height, ...(open ? {} : { paddingBlock: 0 }) }}
      >
        <CardHeader className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {lead}
            {/* A card with a way back is the page's own: its name wraps rather than being cut short. */}
            <div className="flex min-w-0 flex-col gap-0.5">
              <Text role="label" as="h2" className={lead ? "break-words" : "truncate"}>{title}</Text>
              {note && open ? <Text role="caption" className={lead ? "break-words" : "truncate"}>{note}</Text> : null}
            </div>
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

/**
 * The most steps a slider marks one by one: a dot over each step's place, the system's steps (Motion.md M21; his,
 * 2026-10-09: "for steps, in a slider, we have a different view of it"). A marked slider spans its card, so twenty fit
 * apart; one with more steps than that is drawn without marks, as a slider that runs smoothly.
 */
const MARKED_STEPS = 20;
const marked = (control: ControlSpec) => (control.kind === "number" || control.kind === "angle") && Math.round((control.max - control.min) / control.step) <= MARKED_STEPS;

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
export function AssetSelect({ id, label, value, assets, onChange, extra, accept, disabled }: {
  id?: string;
  label: string;
  value: string;
  assets: AssetBook;
  onChange: (value: string) => void;
  /** Choices before the assets, as [value, label]. */
  extra?: readonly (readonly [string, string])[];
  /** Which assets it offers: by default, all of them. */
  accept?: (asset: AssetVersion) => boolean;
  disabled?: boolean;
}) {
  const named = Object.values(assets).map((versions) => versions.at(-1)!).filter((a) => accept?.(a) ?? true).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
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

function ControlRow({ control, value, palettes, assets, library, disabled, onChange }: { control: ControlSpec; value: Value; palettes: readonly ColourRow[]; assets: AssetBook; library: Library; disabled?: boolean; onChange: (value: Value) => void }) {
  const id = React.useId();
  const wide = control.kind === "choice" || control.kind === "colour" || control.kind === "asset" || marked(control);
  let widget: React.ReactNode;
  switch (control.kind) {
    case "number":
    case "angle":
      widget = (
        <Slider id={id} aria-label={control.label} min={control.min} max={control.max} step={control.step} marks={marked(control) || undefined} value={[value as number]} onValueChange={([next]) => next !== undefined && onChange(next)} disabled={disabled} />
      );
      break;
    case "choice":
      widget = (
        <ToggleGroup id={id} type="single" variant="outline" size="sm" aria-label={control.label} value={String(value)} onValueChange={(next) => next && onChange(next)} disabled={disabled} className="flex-wrap">
          {control.options.map((option) => (
            <ToggleGroupItem key={option} value={option}>{capital(option)}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
      break;
    case "switch":
      widget = <Switch id={id} aria-label={control.label} checked={value as boolean} onCheckedChange={onChange} disabled={disabled} />;
      break;
    case "asset":
      widget = (
        <AssetSelect
          id={id}
          label={control.label}
          value={String(value).split("@")[0] || NONE}
          assets={assets}
          accept={control.of ? (asset) => library.idOf(asset.use.entry) === library.idOf(control.of!) : undefined}
          disabled={disabled}
          onChange={(next) => onChange(next === NONE ? "" : next)}
        />
      );
      break;
    case "colour": {
      // A row a palette, each a picker of its own so none grows past one row; a colour in none joins the first.
      const colour = String(value).toLowerCase();
      const found = palettes.some((row) => row.options.some((option) => option.value.toLowerCase() === colour));
      widget = (
        <div className="flex w-full min-w-0 flex-col gap-1">
          {palettes.map((row, index) => (
            <ColourPicker
              key={row.label}
              aria-label={index === 0 ? control.label : `${control.label}: ${row.label}`}
              options={index === 0 && !found ? [...row.options, { value: colour, label: colour, colour }] : row.options}
              value={colour}
              onValueChange={onChange}
              disabled={disabled}
              className="w-full"
            />
          ))}
        </div>
      );
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
export function EntryJigs({ entry, values, title, note, palettes, assets, library, disabled, bare, onChange }: {
  entry: Entry;
  values: Values;
  title: string;
  /** Head each card with its group alone, where the page already says whose controls they are (a bench). */
  bare?: boolean;
  note?: string;
  palettes: readonly ColourRow[];
  assets: AssetBook;
  library: Library;
  /** Read-only, as a published version is. */
  disabled?: boolean;
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
        <Jig key={group} title={group === title || bare ? group : `${title} · ${group}`} note={index === 0 ? note : undefined}>
          {controls.map((control) => (
            <ControlRow key={control.id} control={control} value={resolved[control.id]!} palettes={palettes} assets={assets} library={library} disabled={disabled} onChange={(value) => onChange(control.id, value)} />
          ))}
        </Jig>
      ))}
    </>
  );
}
