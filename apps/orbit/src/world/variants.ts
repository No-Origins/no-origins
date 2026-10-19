/**
 * An element's variants (World.md W72, W73; his: "I can configure, save as a variant, configure, save as a variant"):
 * a variant is one element's settings, named and saved, within the element's version (a version is the jig's code, a
 * variant data within it). An element's library is its variants and the one picked (`library.ts`): the card tunes the
 * element's own settings store, a pick loads a variant into it, Save keeps it as the variant's draft and Publish as a
 * version, in the database; his published copy is in code (`published.ts`). The world places variants by their ids.
 * Nothing here is three.js.
 */
export type Variant<C> = { id: string; name: string; settings: C };

/** The variants by id, as the world places them. */
export const byId = <C,>(variants: readonly Variant<C>[]): Record<string, C> => Object.fromEntries(variants.map((variant) => [variant.id, variant.settings]));

/** A new variant's id: a uuid, the one its item in the database gets (W73: the ids are the database's from the start). */
export const newVariantId = (): string => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`);

/** A name for a new variant, after the one it comes from: its stem and the next number not taken. */
export function nextName(from: string | undefined, taken: readonly string[]): string {
  const stem = (from ?? "Variant").replace(/ \d+$/, "");
  const names = new Set(taken);
  let n = 2;
  while (names.has(`${stem} ${n}`)) n++;
  return `${stem} ${n}`;
}
