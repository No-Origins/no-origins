import { blobSizes, hues } from "../tokens/tokens";
import { patternNames } from "../atoms/patterns/patterns";
import type { PropSchema, PropSpec, PropType, RegistryEntry } from "../registry/types";

/**
 * The small, dependency-free half of the inspector: what a fresh value of each type is, what several selections
 * agree on, and the labels. Kept out of `PropsForm` so the multi-select rule (Admin.md §6.5c S4) can be read on
 * its own — the intersection of the schemas, and "mixed" for a value they disagree on.
 */

/** A value several selections disagree on. Not `undefined`: "all unset" is agreement, and reads differently. */
export const MIXED = Symbol("mixed");
export type Value = unknown | typeof MIXED;

export interface Selected {
  entry: RegistryEntry;
  /** The node's authored props, refs and all. */
  props: Record<string, unknown>;
}

/** What a freshly added item of this type is. The registry's `default` wins where an entry states one. */
export function freshValue(spec: PropType): unknown {
  switch (spec.type) {
    case "hue":
      return hues[0];
    case "text":
    case "markdown":
    case "href":
      return "";
    case "enum":
      return spec.of[0];
    case "number":
      return spec.min ?? 0;
    case "boolean":
      return false;
    case "list":
      return [];
    case "object":
      return {};
    case "pattern":
      return patternNames[0];
    case "blobSize":
      return "md";
    case "ref":
      return undefined;
  }
}

/** What a freshly dropped instance of a component starts with (Scene-Schema.md §3: `default`, never applied on read). */
export function freshProps(schema: PropSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(schema)) {
    if (spec.default !== undefined) out[name] = spec.default;
    else if (spec.required) out[name] = freshValue(spec);
  }
  return out;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * The props form's rows for one or more selections: every prop each selection's schema declares identically,
 * in the first entry's declaration order. A prop one of them does not have is not shown — editing it would
 * write a prop that component cannot take, which §2.2 calls a defect.
 */
export function intersection(selection: readonly Selected[]): Array<[string, PropSpec]> {
  const first = selection[0];
  if (!first) return [];
  return Object.entries(first.entry.props).filter(([name, spec]) =>
    selection.every((s) => s.entry.props[name] && same(s.entry.props[name], spec)),
  );
}

/** What the control shows: the shared value, or `MIXED` where they disagree. */
export function sharedValue(selection: readonly Selected[], name: string): Value {
  const first = selection[0];
  if (!first) return undefined;
  const v = first.props[name];
  return selection.every((s) => same(s.props[name], v)) ? v : MIXED;
}

/** `cellHead` → "Cell head". The schema's own `label` wins. */
export function fieldLabel(name: string, spec: PropSpec): string {
  if (spec.label) return spec.label;
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const blobSizeNames = Object.keys(blobSizes);
