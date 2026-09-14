import { entries } from "./entries";
import type { Registry, RegistryEntry, RegistryGroup, RegistryLayer } from "./types";

export type { NodeKind, PropType, PropSpec, PropSchema, SlotSpec, RegistryGroup, RegistryLayer, RegistryEntry, Registry } from "./types";
export { entries } from "./entries";
export { Catalogue } from "./Catalogue";
export type { CatalogueProps } from "./Catalogue";
export { ContrastReport } from "./ContrastReport";

/** Every authorable component, by name. A `component` value a document names must be a key here or it does not render. */
export const registry: Registry = Object.fromEntries(entries.map((e) => [e.name, e]));

/** Names in palette order — the grouping of Scene-Schema.md §2.3, which is also the catalogue's reading order. */
export const registryNames: readonly string[] = entries.map((e) => e.name);

export const byGroup = (group: RegistryGroup): readonly RegistryEntry[] => entries.filter((e) => e.group === group);

export const groups: readonly RegistryGroup[] = ["text", "marks", "actions", "controls", "feedback", "layout", "surfaces", "figures", "composites"];

export const layers: readonly RegistryLayer[] = ["atom", "molecule", "organism"];
export const byLayer = (layer: RegistryLayer): readonly RegistryEntry[] => entries.filter((e) => e.layer === layer);

/** Entries a slot admitting `"blocks"` will take: everything placeable inside another component. */
export const blockEntries: readonly RegistryEntry[] = entries.filter((e) => e.kind.includes("slot"));

/**
 * A stable fingerprint of the authorable surface — names, kinds, prop schemas and slots, and nothing else.
 *
 * It goes on every published version (Admin.md §7). Two publishes with equal hashes are guaranteed to render
 * alike; a change is a flag to look at, not a failure. Deliberately blind to `example`, `line`, `defaults` and
 * `status`, because none of them can change how an existing document renders — only the schema can.
 */
export function registryHash(reg: Registry = registry): string {
  const shape = Object.keys(reg)
    .sort()
    .map((name) => {
      const e = reg[name]!;
      const props = Object.keys(e.props)
        .sort()
        .map((k) => `${k}:${JSON.stringify(e.props[k])}`)
        .join(",");
      const slots = Object.keys(e.slots ?? {})
        .sort()
        .map((k) => `${k}:${JSON.stringify(e.slots![k])}`)
        .join(",");
      return `${name}|${[...e.kind].sort().join("+")}|${props}|${slots}`;
    })
    .join("\n");
  // FNV-1a, 32-bit: short, deterministic, and no dependency. Not a security hash and does not need to be.
  let h = 0x811c9dc5;
  for (let i = 0; i < shape.length; i++) {
    h ^= shape.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
