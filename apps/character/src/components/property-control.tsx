"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Switch } from "@no-origins/ui/components/switch";
import { Text } from "@no-origins/ui/components/text";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { sphereMotionOf } from "@no-origins/ui/lib/agent-body";
import { agentColours } from "@no-origins/ui/lib/agent-colours";
import { checkValue, type ColourName, type Property, type PropertyValue } from "@no-origins/ui/lib/properties";

import { useCharacter } from "@/components/character-context";
import { Line } from "@/components/section";

/**
 * One setting's control, made from its type (Motion.md M20's property model, `@no-origins/ui/lib/properties`): every
 * control in the studio is one of these, a line of a card (`Line`, C7) so it stands on one row of the field — its
 * label, then the control, then its value, in the three columns every line of its room shares (C11). What it touches
 * is its title. It is named by its section as well (`scope`): a card's Size is one of five.
 *
 * **One grammar for every line** (C11, his, 2026-09-30: *"they are not consistent … not aesthetically good looking"*):
 *
 * - A **number**, an angle or a duration is a slider in the control's column and its value, typed, in the value's.
 * - A **choice** is a select across the control's column and the value's, always, so every select in a room is one
 *   width; what a choice also offers that is not a value — an upload, a template — is at the end of its list (`more`).
 * - A **paint** — a choice whose options are colours (`fills`) — is swatches across the same two columns, one a colour,
 *   what a paint is seen, not read.
 * - A **colour** is one of the agent's by name — its paint, its dark, its ink — so it is a select like any choice, each
 *   name with a dot of what it is on the agent now: the name says what it follows when the paint changes, which a
 *   swatch alone would not (on a violet body, "paint" and "violet" are one colour, "ink" and "light" another).
 * - A **switch** stands at the control column's start.
 *
 * Nothing else stands in the value's column: it holds a number or nothing. Every box in a line — a select, a value —
 * is the system's small size, 36px; swatches share their columns out, each at most that.
 */

/** A named colour as its option reads: its name, capitalised, so a name the package adds needs nothing here. */
const colourLabel = (name: ColourName) => name.charAt(0).toUpperCase() + name.slice(1);

/** How many decimals a step shows: 0.01 two, 0.005 three, 10 none. */
const decimals = (step: number) => (Number.isInteger(step) ? 0 : (String(step).split(".")[1]?.length ?? 2));

/** What a choice offers at the end of its list that is not one of its values: running it leaves the value as it is. */
export type ChoiceAction = { value: string; label: string; icon: LucideIcon; run: () => void; disabled?: boolean; title?: string };

/** The end of a choice's list, under its own heading: more of its values (his uploads), then its actions. */
export type ChoiceMore = { label: string; options: { value: string; label: string }[]; actions: ChoiceAction[] };

export function PropertyControl({ property, value, onChange, scope, fills, more, children }: {
  property: Property;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
  /** The section's name, which its accessible names start with: "Eyes size", "Brows style". */
  scope: string;
  /** A choice shown as swatches: each option's colour, as CSS. */
  fills?: Record<string, string>;
  /** A choice's more: the end of its list. */
  more?: ChoiceMore;
  /** What the line also holds that takes no column of it: an upload's file picker and its dialog. */
  children?: React.ReactNode;
}) {
  const id = React.useId();
  // Its section's name alone where its label says the same: the Shape section's Shape is "Shape", not "Shape shape".
  const name = property.label.toLowerCase() === scope.toLowerCase() ? scope : `${scope} ${property.label.toLowerCase()}`;
  return (
    <Line data-property={property.id} title={property.touches}>
      <Label htmlFor={id}>{property.label}</Label>
      <Control id={id} name={name} property={property} value={value} onChange={onChange} fills={fills} more={more} />
      {children}
    </Line>
  );
}

function Control({ id, name, property: p, value, onChange, fills, more }: {
  id: string;
  name: string;
  property: Property;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
  fills?: Record<string, string>;
  more?: ChoiceMore;
}) {
  switch (p.type) {
    case "number":
    case "angle":
    case "duration":
      return <Numeric id={id} name={name} property={p} value={typeof value === "number" ? value : p.default} onChange={onChange} />;
    case "choice": {
      const current = String(value ?? p.default);
      if (fills) {
        const options = p.options.map((o) => ({ ...o, fill: fills[o.value] ?? "transparent" }));
        return <Swatches id={id} name={name} value={current} options={options} onChange={onChange} />;
      }
      return <Choice id={id} name={name} value={current} options={p.options} more={more} onChange={onChange} />;
    }
    case "colour":
      return <ColourChoice id={id} name={name} value={String(value ?? p.default)} options={p.options} onChange={onChange} />;
    case "switch":
      return <Switch id={id} aria-label={name} checked={value === true} onCheckedChange={onChange} className="col-span-2 justify-self-start" />;
    case "drawing":
      return <Text role="caption" className="col-span-2 truncate">Uploaded from the style list</Text>;
  }
}

function Choice({ id, name, value, options, more, onChange }: {
  id: string;
  name: string;
  value: string;
  options: readonly { value: string; label: string }[];
  more?: ChoiceMore;
  onChange: (value: PropertyValue) => void;
}) {
  const actions = more?.actions ?? [];
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const action = actions.find((a) => a.value === next);
        if (action) action.run();
        else onChange(next);
      }}
    >
      <SelectTrigger id={id} size="sm" aria-label={name} className="col-span-2 w-full min-w-0"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        {more ? (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>{more.label}</SelectLabel>
              {more.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              {actions.map(({ value: key, label, icon: Icon, disabled, title }) => (
                <SelectItem key={key} value={key} disabled={disabled} title={title}>
                  <Icon aria-hidden />
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        ) : null}
      </SelectContent>
    </Select>
  );
}

/** A named colour's select, each name with a dot of the colour it is on the agent now (`agentColours`). */
function ColourChoice({ id, name, value, options, onChange }: {
  id: string;
  name: string;
  value: string;
  options: readonly ColourName[];
  onChange: (value: PropertyValue) => void;
}) {
  const { look } = useCharacter();
  const colours = React.useMemo(() => agentColours(sphereMotionOf(look)), [look]);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} size="sm" aria-label={name} className="col-span-2 w-full min-w-0"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            <Dot fill={colours[o]} />
            {colourLabel(o)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** A colour's dot, ringed so the page's white shows on the page. */
const Dot = ({ fill }: { fill: string }) => <span aria-hidden className="size-4 shrink-0 rounded-lg ring-1 ring-border" style={{ background: fill }} />;

/**
 * Swatches, one a colour, the one worn pressed: what a colour is is seen, not read. They share the line's two columns
 * out equally, each at most the small size across, so seven fit a room's narrowest card.
 */
function Swatches({ id, name, value, options, onChange }: {
  id: string;
  name: string;
  value: string;
  options: readonly { value: string; label: string; fill: string }[];
  onChange: (value: PropertyValue) => void;
}) {
  return (
    <ToggleGroup
      id={id}
      type="single"
      size="sm"
      variant="outline"
      value={value}
      onValueChange={(next) => next && onChange(next)}
      aria-label={name}
      className="col-span-2 grid w-full justify-between gap-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 2.25rem))` }}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          aria-label={o.label}
          title={o.label}
          className="aspect-square h-auto w-full min-w-0 px-0 data-[state=on]:border-foreground"
        >
          <Dot fill={o.fill} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function Numeric({ id, name, property: p, value, onChange }: {
  id: string;
  name: string;
  property: Extract<Property, { type: "number" | "angle" | "duration" }>;
  value: number;
  onChange: (value: PropertyValue) => void;
}) {
  // What is typed, until it is committed (Enter or leaving the field) or dropped (Escape).
  const [draft, setDraft] = React.useState<string | null>(null);
  const places = decimals(p.step);
  const commit = () => {
    if (draft !== null && draft.trim() !== "" && Number.isFinite(Number(draft))) onChange(checkValue(p, Number(draft)));
    setDraft(null);
  };
  return (
    <>
      <Slider
        aria-label={name}
        min={p.min}
        max={p.max}
        step={p.step}
        value={[value]}
        onValueChange={([next]) => onChange(checkValue(p, next))}
        className="min-w-0"
      />
      <Input
        id={id}
        type="number"
        aria-label={`${name} value`}
        min={p.min}
        max={p.max}
        step={p.step}
        value={draft ?? value.toFixed(places)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(null);
        }}
        className="h-9 w-full min-w-0 px-2 text-right tabular-nums"
      />
    </>
  );
}
