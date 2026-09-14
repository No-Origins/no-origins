"use client";
import { cx } from "../cx";
import { Label } from "../atoms/Label";
import { Text } from "../atoms/Text";
import { Field } from "../molecules/Field";
import { Repeater } from "../molecules/Repeater";
import { SectionHeader } from "../molecules/SectionHeader";
import type { SceneDocument } from "../document/schema";

/**
 * The inspector with nothing selected (Admin.md §6.5c S4 A): the document's own props.
 *
 * "Nothing selected" is not "nothing to edit" — the title, the description, the grid, the reading order, the views
 * and the document's own patterns are all document-level and have nowhere else to live. An empty inspector would
 * make them unreachable, which is how a grid box ends up being changed in SQL.
 *
 * `order` is the reading order by SECTION (Scene-Schema.md §1.2), which is also tab order (§12): the outline
 * reorders nodes within a section, and this reorders the sections themselves.
 */
export interface DocumentFormProps {
  doc: SceneDocument;
  /** A shallow patch of the document. The host merges it immutably. */
  onChange: (patch: Partial<SceneDocument>) => void;
  className?: string;
}

type View = NonNullable<SceneDocument["views"]>[number];

export function DocumentForm({ doc, onChange, className }: DocumentFormProps) {
  const meta = doc.meta ?? {};
  const grid = doc.grid ?? { box: 160, pad: 8 };
  const patterns = Object.keys(doc.patterns ?? {});

  return (
    <div className={cx("noo-props", className)}>
      <SectionHeader level={4} rhythm={false} label="document" title={meta.title || doc.id} lead="Nothing is selected, so this is the document itself." />
      <Field label="Title" value={meta.title ?? ""} onChange={(e) => onChange({ meta: { ...meta, title: e.currentTarget.value } })} />
      <Field label="Description" multiline rows={3} value={meta.description ?? ""} onChange={(e) => onChange({ meta: { ...meta, description: e.currentTarget.value } })} />

      <fieldset className="noo-props__group">
        <legend className="noo-label noo-props__legend">Grid</legend>
        <Field label="Box" type="number" inputMode="numeric" trailing="px" value={String(grid.box)} hint="every coordinate is quantised to this (§6.2)" onChange={(e) => onChange({ grid: { ...grid, box: Number(e.currentTarget.value) || grid.box } })} />
        <Field label="Pad" type="number" inputMode="numeric" trailing="px" value={String(grid.pad)} onChange={(e) => onChange({ grid: { ...grid, pad: Number(e.currentTarget.value) || 0 } })} />
      </fieldset>

      <div className="noo-props__row">
        <Repeater<string>
          label="Reading order"
          itemName="section"
          density="chips"
          items={doc.order ?? []}
          chipLabel={(s) => s}
          newItem={() => ""}
          onChange={(order) => onChange({ order })}
          renderItem={(item, i, set) => <Field label={`Section ${i + 1}`} value={item} onChange={(e) => set(e.currentTarget.value)} />}
        />
        <Text size="small" tone="muted" className="noo-props__mixed">Sections, in reading order — which is also tab order (§12).</Text>
      </div>

      <div className="noo-props__row">
        <Repeater<View>
          label="Views"
          itemName="view"
          items={doc.views ?? []}
          newItem={() => ({ id: "", label: "", nodeIds: [] })}
          onChange={(views) => onChange({ views })}
          renderItem={(view, i, set) => (
            <>
              <Field label="Id" value={view.id} onChange={(e) => set({ ...view, id: e.currentTarget.value })} />
              <Field label="Label" value={view.label} onChange={(e) => set({ ...view, label: e.currentTarget.value })} />
              <Field label="Href" value={view.href ?? ""} placeholder="/work" onChange={(e) => set({ ...view, href: e.currentTarget.value })} />
              <Text size="small" tone="muted">{view.nodeIds.length} node{view.nodeIds.length === 1 ? "" : "s"} anchored{i === 0 ? " · the view the canvas opens at" : ""}</Text>
            </>
          )}
        />
      </div>

      <div className="noo-props__row">
        <Label as="p" className="noo-props__label">Patterns in this document</Label>
        {patterns.length ? (
          <Text size="small" tone="muted">{patterns.join(" · ")}</Text>
        ) : (
          <Text size="small" tone="muted">None yet. A pattern made in the picker&apos;s studio is saved here and listed after the library&apos;s eighteen.</Text>
        )}
      </div>
    </div>
  );
}
