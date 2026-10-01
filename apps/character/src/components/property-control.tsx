"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { ColourPicker } from "@no-origins/ui/components/colour-picker";
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
 * - **Every pick of a colour is the design system's `ColourPicker`** (C17, his, 2026-10-01: *"color pickers should
 *   always be like the paint"*), across the same two columns: a paint — a choice whose options are colours (`fills`) —
 *   and a colour by name, one of the agent's — its paint, its dark, its ink — each swatch what that name is on the agent
 *   now and named in its title, since two can look alike (on a violet body "paint" and "violet" are one colour).
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

export function PropertyControl({ property, value, onChange, scope, fills, dots, more, children }: {
  property: Property;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
  /** The section's name, which its accessible names start with: "Eyes size", "Brows style". */
  scope: string;
  /** A choice whose options are colours, shown in the colour picker: each option's colour, as CSS. */
  fills?: Record<string, string>;
  /** A colour's swatches, where its names are drawn otherwise than on the body (the eyes', `eyeColours`); the agent's own when left out. */
  dots?: Record<ColourName, string>;
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
      <Control id={id} name={name} property={property} value={value} onChange={onChange} fills={fills} dots={dots} more={more} />
      {children}
    </Line>
  );
}

function Control({ id, name, property: p, value, onChange, fills, dots, more }: {
  id: string;
  name: string;
  property: Property;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
  fills?: Record<string, string>;
  dots?: Record<ColourName, string>;
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
        const options = p.options.map((o) => ({ ...o, colour: fills[o.value] ?? "transparent" }));
        return <ColourPicker id={id} aria-label={name} value={current} options={options} onValueChange={onChange} className="col-span-2" />;
      }
      return <Choice id={id} name={name} value={current} options={p.options} more={more} onChange={onChange} />;
    }
    case "colour":
      return <ColourChoice id={id} name={name} value={String(value ?? p.default)} options={p.options} dots={dots} onChange={onChange} />;
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

/** A named colour's picker, each swatch the colour that name is on the agent now (`agentColours`, or `dots`). */
function ColourChoice({ id, name, value, options, dots, onChange }: {
  id: string;
  name: string;
  value: string;
  options: readonly ColourName[];
  dots?: Record<ColourName, string>;
  onChange: (value: PropertyValue) => void;
}) {
  const { look } = useCharacter();
  const own = React.useMemo(() => agentColours(sphereMotionOf(look)), [look]);
  const colours = dots ?? own;
  return (
    <ColourPicker
      id={id}
      aria-label={name}
      value={value}
      options={options.map((o) => ({ value: o, label: colourLabel(o), colour: colours[o] }))}
      onValueChange={onChange}
      className="col-span-2"
    />
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
