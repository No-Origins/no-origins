"use client";
import { useEffect, useId, useMemo, useState } from "react";
import { cx } from "../cx";
import { Chip } from "../atoms/Chip";
import { Label } from "../atoms/Label";
import { Text } from "../atoms/Text";
import { Field } from "../molecules/Field";
import { SectionHeader } from "../molecules/SectionHeader";
import { Segmented } from "../molecules/Segmented";
import { entries as allEntries, layers } from "../registry/index";
import type { NodeKind, RegistryEntry, RegistryLayer } from "../registry/types";

/**
 * The palette (Admin.md §6.1, §6.5 row 1, §6.5c S2 + D).
 *
 * **It grows on its own.** The list is the registry, so a new export with a catalogue entry appears here without
 * the admin being touched — the answer to "the components library should evolve with more components". Grouped by
 * the Atomic layer (Atomic.md rule 4); node kind stays the FILTER, for where a thing may land.
 *
 * Two ways in, and both end at the same place:
 *
 * - **Drag** (S2 A). Each item carries `application/x-noo-component` with the entry's name. The canvas reads it on
 *   drop, snaps to box corners and places the component on its defaults. The package never touches the document.
 * - **`/`** (S2 D, the keyboard companion). Opens a command list; Enter places the top match at the selection. A
 *   gesture nobody can discover is a gesture for one person, so the hint reads under the filter.
 */
export const PALETTE_MIME = "application/x-noo-component";

export interface PaletteProps {
  /** Defaults to the whole registry. */
  entries?: readonly RegistryEntry[];
  /** Show only what may be hosted by this node kind. `undefined` shows everything. */
  kind?: NodeKind;
  onKindChange?: (kind: NodeKind | undefined) => void;
  /** Place this component at the selection — the command list's Enter, and a click on an item. */
  onPlace?: (entry: RegistryEntry) => void;
  /** The kinds the filter offers. */
  kinds?: readonly NodeKind[];
  className?: string;
}

const KINDS: readonly NodeKind[] = ["widget", "panel", "slot"];

export function Palette({ entries = allEntries, kind, onKindChange, onPlace, kinds = KINDS, className }: PaletteProps) {
  const [query, setQuery] = useState("");
  const [commanding, setCommanding] = useState(false);
  const findId = useId();

  // `/` anywhere on the screen opens the command list — unless the caret is already in a field, where `/` is a slash.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      setCommanding(true);
      requestAnimationFrame(() => document.getElementById(findId)?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [findId]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => (!kind || e.kind.includes(kind)) && (!q || e.name.toLowerCase().includes(q) || e.line.toLowerCase().includes(q)));
  }, [entries, kind, query]);

  const groups = layers
    .map((layer: RegistryLayer) => ({ layer, items: shown.filter((e) => e.layer === layer) }))
    .filter((g) => g.items.length);

  const place = (entry: RegistryEntry) => {
    onPlace?.(entry);
    setQuery("");
    setCommanding(false);
  };

  return (
    <div className={cx("noo-palette", className)}>
      <SectionHeader level={4} rhythm={false} label="palette" title="Components" lead="The registry, by layer. Drag one onto the canvas, or press / to place one at the selection." />
      <Field
        id={findId}
        label="Find a component"
        value={query}
        placeholder={commanding ? "place…" : "filter"}
        hint={commanding ? "Enter places the first match; Esc closes" : undefined}
        onChange={(e) => setQuery(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQuery("");
            setCommanding(false);
            e.currentTarget.blur();
          }
          if (e.key === "Enter" && shown[0]) {
            e.preventDefault();
            place(shown[0]);
          }
        }}
      />
      {onKindChange ? (
        <Segmented
          label="Where it lands"
          size="sm"
          options={[{ value: "all", label: "All" }, ...kinds.map((k) => ({ value: k, label: k }))]}
          value={kind ?? "all"}
          onChange={(v) => onKindChange(v === "all" ? undefined : (v as NodeKind))}
        />
      ) : null}
      {groups.map((g) => (
        <div key={g.layer} className="noo-palette__group">
          <Label as="p" className="noo-palette__layer">{g.layer}s</Label>
          <ul className="noo-palette__list">
            {g.items.map((e) => (
              <li key={e.name}>
                <button
                  type="button"
                  className="noo-palette__item"
                  draggable
                  title={e.line}
                  data-component={e.name}
                  onDragStart={(ev) => {
                    ev.dataTransfer.setData(PALETTE_MIME, e.name);
                    ev.dataTransfer.setData("text/plain", e.name);
                    ev.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => place(e)}
                >
                  <span className="noo-palette__name">{e.name}</span>
                  {e.status === "draft" ? <Chip hue="yellow" dot={false} className="noo-palette__status">draft</Chip> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {groups.length ? null : <Text size="small" tone="muted">Nothing in the registry matches.</Text>}
    </div>
  );
}
