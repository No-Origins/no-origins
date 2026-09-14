import type { ComponentType, ReactNode } from "react";

/**
 * The registry contract (Scene-Schema.md §2).
 *
 * A document may only name components the registry exports, which makes this three things at once: the editor's
 * palette, the security model (a document is data, and data can never introduce code), and the compatibility
 * model (`registryHash` goes on every published version, so two publishes with equal hashes render alike).
 */

/** Where a component may appear. `slot` means inside another component, never placed at a coordinate. */
export type NodeKind = "blob" | "panel" | "widget" | "region" | "page" | "slot";

/**
 * What the inspector can render, and therefore what a document may set (Scene-Schema.md §3.1).
 *
 * This is the AUTHORABLE surface and it is deliberately narrower than the React props — a subset, never an
 * extension (§2.2). `className`, `as`, `style` and every event handler are missing on purpose: they are the
 * styling and behaviour escape hatches, and a document that could set `className` would break §11.2 rule 3
 * from a database row.
 */
export type PropType =
  | { type: "hue"; accent?: boolean }
  | { type: "text"; max?: number }
  | { type: "markdown" }
  | { type: "enum"; of: readonly string[] }
  | { type: "number"; unit?: string; min?: number; max?: number }
  | { type: "boolean" }
  | { type: "list"; of: PropType; max?: number }
  | { type: "object"; fields: Record<string, PropType> }
  | { type: "pattern" }
  | { type: "blobSize" }
  | { type: "href" }
  | { type: "ref" };

export type PropSpec = PropType & {
  required?: boolean;
  /** What a freshly dropped instance uses. Must satisfy the schema: a component that fails validation before the
   *  author has typed anything makes the editor feel broken on first use. */
  default?: unknown;
  /** Overrides the field name in the inspector. */
  label?: string;
  help?: string;
  /**
   * A prop that is going: the note says what replaced it (Scene-Schema.md §5 — a removal ships its migration).
   * A document may still carry it for one minor: the adapter accepts it, drops it with a warning, and the
   * inspector does not show it.
   */
  deprecated?: string;
};

export type PropSchema = Record<string, PropSpec>;

/** A named child collection. `"blocks"` is every entry whose `kind` includes `slot`. */
export interface SlotSpec {
  admits: readonly string[] | "blocks";
  min?: number;
  max?: number;
  /** What the editor's outline calls it. */
  label: string;
}

export type RegistryGroup = "text" | "marks" | "actions" | "controls" | "feedback" | "layout" | "surfaces" | "figures" | "composites";

/** The Atomic layer the component lives in (Atomic.md §1). The catalogue reads it; the palette reads `group`. */
export type RegistryLayer = "atom" | "molecule" | "organism";

export interface RegistryEntry {
  name: string;
  kind: readonly NodeKind[];
  group: RegistryGroup;
  layer: RegistryLayer;
  component: ComponentType<never>;
  props: PropSchema;
  slots?: Record<string, SlotSpec>;
  defaults: Record<string, unknown>;
  /** The catalogue's live sample — **real content, never lorem** (Scene-Schema.md §3.2a). The catalogue is also
   *  the public showcase, and placeholder text demonstrates nothing about a system built on measured type. */
  example: () => ReactNode;
  /** The `@no-origins/ui` version it appeared in. */
  since: string;
  /** `stable` is a claim, not a default. A new entry stays `draft` until it has been used in anger. */
  status: "stable" | "draft" | "deprecated";
  /** One line, for the palette and the catalogue. */
  line: string;
  /**
   * The authored prop the adapter renders as the component's `children` (Scene-Schema.md §2.2: a `ReactNode`
   * prop is re-typed as `text` or `markdown`, and this names which one it was). `Heading.text`, `Chip.label`,
   * `Text.markdown`. Without it every authored prop is passed by name.
   */
  childrenFrom?: string;
  /**
   * Maps the authored shape onto the React one where the two differ — `BentoCell.span` is authored as
   * `{ cols, rows }` (an `object` the inspector can render) and taken as `[cols, rows]`. Receives the parent
   * component's authored props, so a cell can inherit its bento's hue. Pure; never adds behaviour.
   */
  adapt?: (props: Record<string, unknown>, parent?: Record<string, unknown>) => Record<string, unknown>;
}

export type Registry = Record<string, RegistryEntry>;
