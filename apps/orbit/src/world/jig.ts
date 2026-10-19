import type { ColourOption } from "@no-origins/ui/components/colour-picker";

/**
 * A jig (World.md W14): the card of controls for one thing in the world, its settings and how the card shows them. A
 * jig is data, so every card is the one `JigCard` (`src/components/jig-card.tsx`), and Copy writes every jig's settings
 * the same way. Nothing here is three.js, so a page reads it without loading the world.
 */

type KeyOf<C, T> = { [K in keyof C]: C[K] extends T ? K : never }[keyof C] & string;

/**
 * A number: its label, range and step, and unit. With `to`, it sets a range, from `key` to `to`, on one slider of two
 * heads. The slider marks every step where there are at most twenty; a longer range marks every `marks` of its units,
 * from `min`, and the value still moves by its step between them.
 *
 * A value the hand can move in the world as well as on its slider lists what moves it (`movedBy`: the jig's `inputs`,
 * such as a drag's modes and the wheel). Where none of them is on, the card shows it locked (his: "If there is some
 * control that will not change when a mode is selected, it should have a lock icon"); `[]` is moved by no drag.
 */
export type NumberControl<C> = {
  kind: "number";
  key: KeyOf<C, number>;
  to?: KeyOf<C, number>;
  label: string;
  min: number;
  max: number;
  step: number;
  marks?: number;
  unit?: string;
  movedBy?: readonly string[];
};

/** A colour, picked from swatches (the root CLAUDE.md: every pick of a colour is a `ColourPicker`). */
export type ColourControl<C> = { kind: "colour"; key: KeyOf<C, string>; label: string; options: readonly ColourOption[] };

/**
 * Several colours, picked from swatches (the `ColourPicker`'s several picked; World.md W92, his: "I should be able to
 * select multiple colors in the swatch"): never none, kept in the swatches' order, every name after its label.
 */
export type ColoursControl<C> = { kind: "colours"; key: KeyOf<C, readonly string[]>; label: string; options: readonly ColourOption[] };

/** One of a few named choices, side by side (the design system's `ToggleGroup`). */
export type ChoiceControl<C> = {
  kind: "choice";
  key: KeyOf<C, string>;
  label: string;
  options: readonly { value: string; label: string }[];
};

/**
 * Several of a few named choices, side by side (the design system's `ToggleGroup`, several pressed; World.md W98, his:
 * "I should be able to multi select flower shapes"): never none, kept in the options' order, every picked one named
 * after its label.
 */
export type ChoicesControl<C> = {
  kind: "choices";
  key: KeyOf<C, readonly string[]>;
  label: string;
  options: readonly { value: string; label: string }[];
};

/** A name, typed (his, World.md W24: "when creating anything from the level of zones and above, I should be able to name them"). */
export type TextControl<C> = { kind: "text"; key: KeyOf<C, string>; label: string };

/**
 * On or off (the design system's `Switch`), beside its label; Copy sends it as On or Off. One that `heads` its group
 * turns the group's part on and off and stands in the group's header instead, named by its label in a tooltip (World.md
 * W76; his: "the toggle has to be on the card header").
 */
export type SwitchControl<C> = { kind: "switch"; key: KeyOf<C, boolean>; label: string; heads?: boolean };

export type JigControl<C> = NumberControl<C> | ColourControl<C> | ColoursControl<C> | ChoiceControl<C> | ChoicesControl<C> | TextControl<C> | SwitchControl<C>;

/**
 * Controls under one name, two to a row (a switch beside its label, in a number's room); a colour or several, a choice
 * or several, or a name takes a row of its own. A `note` says, under the
 * name, what the controls cannot show: what has been built with them, and how. A group with no controls is drawn by its
 * page (`JigCard`'s `sections`), as the Sectors page's sectors and zones are.
 */
export type JigGroup<C> = { title: string; note?: (config: C) => string; controls: readonly JigControl<C>[] };

export type Jig<C> = {
  /** What the card is called. */
  name: string;
  /**
   * What can move its values in the world besides their sliders: the choice that says which mode the hand is in
   * (`key`), and what is always on (`always`, such as the wheel). A control's `movedBy` is read against them.
   */
  inputs?: { key: KeyOf<C, string>; always: readonly string[] };
  /** The version the card tunes: a version he has seen is frozen, and a change to what it can be is the next. */
  version: number;
  /** His settings: what the world shows, and what the card starts from and Reset goes back to. */
  start: C;
  groups: readonly JigGroup<C>[];
  /** What Copy sends back besides the controls: what has been built (the environment's blocks), a line each. */
  copy?: (config: C) => string[];
};

/**
 * A control's value as the card shows it and Copy sends it: its step's decimals, a range as from–to, a colour's name,
 * several colours' names.
 */
export function formatValue<C>(control: JigControl<C>, config: C): string {
  if (control.kind === "text") return config[control.key] as string;
  if (control.kind === "colours") {
    const values = config[control.key] as readonly string[];
    return values.map((value) => control.options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label ?? value).join(", ");
  }
  if (control.kind === "choices") {
    const values = config[control.key] as readonly string[];
    return values.map((value) => control.options.find((option) => option.value === value)?.label ?? value).join(", ");
  }
  if (control.kind === "switch") return config[control.key] ? "On" : "Off";
  if (control.kind !== "number") {
    const value = config[control.key] as string;
    return control.options.find((option) => option.value === value)?.label ?? value;
  }
  const decimals = (String(control.step).split(".")[1] ?? "").length;
  const at = (key: KeyOf<C, number>) => (config[key] as number).toFixed(decimals);
  const value = control.to ? `${at(control.key)}–${at(control.to)}` : at(control.key);
  // A unit that is a word stands apart (2 m, 300 ms); a sign follows the number (9°, 1.5×).
  const unit = control.unit ? (/^[a-z]/i.test(control.unit) ? ` ${control.unit}` : control.unit) : "";
  return `${value}${unit}`;
}

/**
 * Whether the hand cannot move a control's value now, and why: none of what moves it is on. Undefined for a control
 * that is a setting, not a value the hand moves.
 */
export function lockOf<C>(jig: Jig<C>, control: JigControl<C>, config: C): string | undefined {
  if (control.kind !== "number" || !control.movedBy || !jig.inputs) return undefined;
  const mode = config[jig.inputs.key] as string;
  const on = [mode, ...jig.inputs.always];
  if (control.movedBy.some((input) => on.includes(input))) return undefined;
  if (control.movedBy.length === 0) return "No drag moves this";
  const choice = jig.groups.flatMap((group) => group.controls).find((c) => c.kind === "choice" && c.key === jig.inputs?.key);
  const label = choice && choice.kind === "choice" ? choice.options.find((option) => option.value === mode)?.label : mode;
  return `${label ?? mode} doesn't move this`;
}

/**
 * Settings as something kept them, read against the jig (World.md W72, a variant as the browser kept it): each control's
 * value where it is one the control allows (a number within its range, a colour a hex, several colours hexes, at least
 * one, each once, in the swatches' order, a choice one of its options, several choices at least one of them, a switch
 * on or off, a name a string), else the jig's start; nothing, or not an object, is null.
 */
export function configOf<C extends object>(jig: Jig<C>, saved: unknown): C | null {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
  const given = saved as Record<string, unknown>;
  const config: Record<string, unknown> = { ...(jig.start as unknown as Record<string, unknown>) };
  const number = (key: string, control: NumberControl<C>) => {
    const value = given[key];
    if (typeof value === "number" && Number.isFinite(value)) config[key] = Math.max(control.min, Math.min(control.max, value));
  };
  for (const control of jig.groups.flatMap((group) => group.controls)) {
    const value = given[control.key];
    if (control.kind === "number") {
      number(control.key, control);
      if (control.to) number(control.to, control);
    } else if (control.kind === "colour") {
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) config[control.key] = value;
    } else if (control.kind === "colours") {
      const colours = coloursOf(control.options, value);
      if (colours.length) config[control.key] = colours;
    } else if (control.kind === "choice") {
      if (typeof value === "string" && control.options.some((option) => option.value === value)) config[control.key] = value;
    } else if (control.kind === "choices") {
      const picked = choicesOf(control.options, value);
      if (picked.length) config[control.key] = picked;
    } else if (control.kind === "switch") {
      if (typeof value === "boolean") config[control.key] = value;
    } else if (typeof value === "string") config[control.key] = value;
  }
  return config as C;
}

/** Several choices as kept, read against their options (W98): each one of them, once, in the options' order; none where nothing is. */
export function choicesOf<T extends string>(options: readonly { value: T }[], kept: unknown): T[] {
  if (!Array.isArray(kept)) return [];
  return options.map((option) => option.value).filter((value) => kept.includes(value));
}

/**
 * Several colours as kept, read against their swatches: each a hex, once, lowercase where a swatch is, in the swatches'
 * order (as the picker gives them), one that is no swatch after them; none where nothing is a hex.
 */
export function coloursOf(options: readonly ColourOption[], kept: unknown): string[] {
  if (!Array.isArray(kept)) return [];
  const hexes = kept.filter((value): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)).map((value) => value.toLowerCase());
  const order = options.map((option) => option.value.toLowerCase());
  const rank = (value: string) => (order.includes(value) ? order.indexOf(value) : order.length);
  return [...new Set(hexes)].sort((a, b) => rank(a) - rank(b));
}

/** The settings, as the lines Copy sends back: the jig and its version, then a line a group. */
export function jigSettings<C>(jig: Jig<C>, config: C): string {
  return [
    `${jig.name}, version ${jig.version}`,
    ...jig.groups
      .filter((group) => group.controls.length)
      .map((group) => `${group.title}: ${group.controls.map((c) => `${c.label} ${formatValue(c, config)}`).join(" · ")}`),
    ...(jig.copy?.(config) ?? []),
  ].join("\n");
}
