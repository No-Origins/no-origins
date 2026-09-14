import { z } from "zod";
import { hues, blobSizes } from "../tokens/tokens";
import type { PropSchema, PropSpec, PropType, RegistryEntry } from "../registry/types";

/**
 * A registry entry's prop schema (Scene-Schema.md §3), turned into Zod. One function per authorable type, so a new
 * type in §3.1 is one case here and one control in the inspector — never a bespoke validator per component.
 *
 * Three rules the conversion carries:
 *
 * - **Refs are resolved before validation.** What is checked is the value a prop will actually take, so a `ref`
 *   typed prop is `unknown` here — the content decides its shape — and a ref used in place of any other prop is
 *   checked against that prop's type once resolved.
 * - **Numeric enums are numbers on the way out.** The registry writes `of: ["2", "3", "4"]` because an enum is a
 *   set of names, and `Heading` takes `level: 2`. Where every option is numeric the value is coerced, so a document
 *   may write `"2"` or `2` and the component always receives the number.
 * - **Registry `default`s are not applied on read.** They are what a freshly dropped instance starts with in the
 *   editor; a component's own defaults are what an absent prop means when it renders. Applying both would make the
 *   document say more than the author did.
 */
export interface PropContext {
  /** Every name a `pattern` prop may take: the library's eighteen plus the document's own. */
  patternNames: readonly string[];
}

const numeric = (of: readonly string[]) => of.length > 0 && of.every((o) => o.trim() !== "" && Number.isFinite(Number(o)));

export function propType(spec: PropType, ctx: PropContext): z.ZodType<unknown> {
  switch (spec.type) {
    case "hue":
      return z.enum(spec.accent ? [...hues, "accent"] : [...hues]);
    case "text": {
      const s = z.string();
      return spec.max ? s.max(spec.max, `at most ${spec.max} characters`) : s;
    }
    case "markdown":
      return z.string();
    case "enum": {
      const names = z.enum(spec.of as [string, ...string[]]);
      if (!numeric(spec.of)) return names;
      return z
        .union([names, z.number().refine((n) => spec.of.includes(String(n)), { message: `one of ${spec.of.join(", ")}` })])
        .transform((v) => Number(v));
    }
    case "number": {
      let n = z.number();
      if (spec.min !== undefined) n = n.min(spec.min);
      if (spec.max !== undefined) n = n.max(spec.max);
      return n;
    }
    case "boolean":
      return z.boolean();
    case "list": {
      const a = z.array(propType(spec.of, ctx));
      return spec.max ? a.max(spec.max, `at most ${spec.max} items`) : a;
    }
    case "object": {
      const shape: Record<string, z.ZodType<unknown>> = {};
      for (const [k, f] of Object.entries(spec.fields)) shape[k] = propType(f, ctx).optional();
      return z.strictObject(shape);
    }
    case "pattern":
      return z.string().refine((n) => ctx.patternNames.includes(n), { message: "not a pattern in the library or in this document" });
    case "blobSize":
      return z.union([z.enum(Object.keys(blobSizes) as [string, ...string[]]), z.number().positive()]);
    case "href":
      return z.string().min(1);
    case "ref":
      return z.unknown();
  }
}

export function propsSchema(schema: PropSchema, ctx: PropContext): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodType<unknown>> = {};
  for (const [name, spec] of Object.entries(schema) as Array<[string, PropSpec]>) {
    const t = propType(spec, ctx);
    shape[name] = spec.required ? t : t.optional();
  }
  // strict: an authored prop the schema does not know is a defect, not a passthrough — §2.2's whole point.
  return z.strictObject(shape) as unknown as z.ZodType<Record<string, unknown>>;
}

/** Schemas are built per entry and per set of pattern names, and kept: a document renders many nodes of few kinds. */
const cache = new WeakMap<RegistryEntry, Map<string, z.ZodType<Record<string, unknown>>>>();
export function schemaFor(entry: RegistryEntry, ctx: PropContext): z.ZodType<Record<string, unknown>> {
  const key = ctx.patternNames.join(" ");
  let byKey = cache.get(entry);
  if (!byKey) cache.set(entry, (byKey = new Map()));
  let s = byKey.get(key);
  if (!s) byKey.set(key, (s = propsSchema(entry.props, ctx)));
  return s;
}
