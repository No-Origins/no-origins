import type { Control, Value, Values } from "./types.ts";

/** Every control at its default (Cinema-Engine.md E4). */
export function defaults(controls: readonly Control[]): Values {
  return Object.fromEntries(controls.map((control) => [control.id, control.default]));
}

/** The values a builder is given: the defaults, with what was set over them. Keys a control no longer has are dropped. */
export function resolve(controls: readonly Control[], values: Values): Values {
  const out = defaults(controls);
  for (const control of controls) if (control.id in values) out[control.id] = values[control.id]!;
  return out;
}

const COLOUR = /^#[0-9a-f]{6}$/i;

/** What is wrong with a value for its control, or nothing. A refusal says why (E6). */
export function problem(control: Control, value: Value): string | undefined {
  switch (control.kind) {
    case "number":
    case "angle":
      if (typeof value !== "number" || !Number.isFinite(value)) return `${control.id} takes a number`;
      if (value < control.min || value > control.max) return `${control.id} runs from ${control.min} to ${control.max}`;
      return undefined;
    case "choice":
      return control.options.includes(String(value)) ? undefined : `${control.id} is one of ${control.options.join(", ")}`;
    case "switch":
      return typeof value === "boolean" ? undefined : `${control.id} is true or false`;
    case "colour":
      return typeof value === "string" && COLOUR.test(value) ? undefined : `${control.id} is a colour like #a3e635`;
    case "asset":
      return typeof value === "string" && /^([a-z0-9][a-z0-9-]*(@\d+)?)?$/.test(value) ? undefined : `${control.id} is an asset's id (see \`assets\`), or nothing`;
  }
}

/** Every problem with a set of values: an unknown control, or a value its control refuses. */
export function check(controls: readonly Control[], values: Values): string[] {
  const byId = new Map(controls.map((control) => [control.id, control]));
  const problems: string[] = [];
  for (const [id, value] of Object.entries(values)) {
    const control = byId.get(id);
    if (!control) problems.push(`no control called ${id} (it has ${controls.map((c) => c.id).join(", ")})`);
    else {
      const wrong = problem(control, value);
      if (wrong) problems.push(wrong);
    }
  }
  return problems;
}

/** A value as typed on the command line, read as its control's kind: `height=12`, `shadows=true`, `colour=#a3e635`. */
export function parse(control: Control, raw: string): Value {
  switch (control.kind) {
    case "number":
    case "angle":
      return raw.trim() === "" ? Number.NaN : Number(raw);
    case "switch":
      return raw === "true" ? true : raw === "false" ? false : raw;
    default:
      return raw;
  }
}

/** Numbers read from values a builder was given, already checked and resolved. */
export const num = (values: Values, id: string) => values[id] as number;
export const str = (values: Values, id: string) => values[id] as string;
export const bool = (values: Values, id: string) => values[id] as boolean;
