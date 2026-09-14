"use client";
import { useState, type ReactNode } from "react";
import { cx } from "../cx";
import { Label } from "../atoms/Label";
import { Text } from "../atoms/Text";
import { Checkbox } from "../molecules/Checkbox";
import { Field } from "../molecules/Field";
import { HueSwatch, type HueValue } from "../molecules/HueSwatch";
import { PatternPicker, libraryPatterns, type PatternOption } from "../molecules/PatternPicker";
import { Repeater } from "../molecules/Repeater";
import { SectionHeader } from "../molecules/SectionHeader";
import { Segmented } from "../molecules/Segmented";
import { Select } from "../molecules/Select";
import { PatternStudio } from "../organisms/PatternStudio";
import type { Family } from "../atoms/patterns/generator";
import { isRef } from "../document/refs";
import type { PropSpec } from "../registry/types";
import type { Hue } from "../tokens/tokens";
import { MIXED, blobSizeNames, fieldLabel, freshValue, intersection, sharedValue, type Selected, type Value } from "./values";

/**
 * The inspector's form (Admin.md §6.1, §6.5; Scene-Schema.md §3.1).
 *
 * **No component gets a hand-built form.** One control per prop TYPE, and a component's inspector is whatever its
 * schema says — which is why a new component appears here the day it is registered, with no admin change. The
 * table §3.1 states is the whole of the mapping and every case below is one of its rows.
 *
 * Controlled, and the patch is the unit: `onChange({ hue: "blue" })` says what changed, never the whole props
 * object, so the host applies the same patch to every selected node (S4) without the form knowing how many
 * there are.
 *
 * Three rules that are easy to lose:
 *
 * - **A ref is shown, not edited.** A prop whose authored value is `{ $ref: … }` reads from the project's content
 *   (§3.4). A control that overwrote it with a literal would silently unlink the copy, so refs render as a
 *   read-only field naming the key, and the ref picker offers the content's keys where the host passes them.
 * - **`mixed` is not `empty`.** Several selections that disagree show the mixed placeholder; typing sets all of
 *   them. Several that are all unset agree, and show an empty control.
 * - **Nothing here validates.** The adapter does, on every render, and its `issues` are the inspector's foot.
 *   A second copy of the rules in the form is a second copy that drifts.
 */
export interface PropsFormProps {
  /** One selection, or several (S4). Empty renders nothing — the host shows `DocumentForm` instead. */
  selection: readonly Selected[];
  /** What changed. The host applies it to every node in `selection`. */
  onChange: (patch: Record<string, unknown>) => void;
  /** The project's content keys, dotted, for a `ref` prop (§3.4). */
  contentKeys?: readonly string[];
  /** The document's own patterns (Admin.md §6.5b), listed after the library's eighteen. */
  patterns?: Readonly<Record<string, Family>>;
  /** A pattern made in the studio. The host writes it into the document's `patterns`. */
  onPatternCreate?: (option: PatternOption) => void;
  /** The selected node's hue, so every pattern thumbnail is drawn in it. */
  hue?: Hue | "accent";
  /** Under the controls: the adapter's issues for this node, a caption, whatever the host has. */
  foot?: ReactNode;
  className?: string;
}

interface Ctx {
  contentKeys: readonly string[];
  patterns: Readonly<Record<string, Family>>;
  onPatternCreate?: (option: PatternOption) => void;
  hue: Hue | "accent";
  openStudio: (prop: string, name?: string) => void;
}

const isMixed = (v: Value): boolean => v === MIXED;
const str = (v: Value): string => (isMixed(v) || v === undefined || v === null ? "" : String(v));

/** A prop whose value came from content. Read, never overwritten (§3.4). */
function RefRow({ label, path }: { label: string; path: string }) {
  return <Field label={label} value={path} readOnly hint="reads from content — a ref (§3.4)" leading="$ref" />;
}

/** One prop, one control. The switch IS Scene-Schema.md §3.1. */
function Control({ name, spec, value, onChange, ctx, nested }: { name: string; spec: PropSpec; value: Value; onChange: (next: unknown) => void; ctx: Ctx; nested?: boolean }) {
  const label = fieldLabel(name, spec);
  const mixed = isMixed(value);
  const placeholder = mixed ? "mixed" : undefined;
  const help = spec.help;

  if (!mixed && isRef(value)) return <RefRow label={label} path={value.$ref} />;

  switch (spec.type) {
    case "hue":
      return (
        <div className="noo-props__row">
          <Label as="span" className="noo-props__label">{label}</Label>
          <HueSwatch label={label} accent={spec.accent} value={mixed ? undefined : (str(value) as HueValue) || undefined} onChange={onChange} hideName={false} />
          {mixed ? <Text size="small" tone="muted" className="noo-props__mixed">mixed — pick one to set them all</Text> : null}
        </div>
      );

    case "text": {
      const v = str(value);
      return (
        <Field
          label={label}
          value={v}
          placeholder={placeholder}
          maxLength={spec.max}
          hint={spec.max ? `${v.length}/${spec.max}` : help}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      );
    }

    case "markdown":
      return <Field label={label} multiline rows={nested ? 3 : 5} value={str(value)} placeholder={placeholder} hint={help ?? "markdown, plus the two directives (§3.5)"} onChange={(e) => onChange(e.currentTarget.value)} />;

    case "enum": {
      const numeric = spec.of.every((o) => o.trim() !== "" && Number.isFinite(Number(o)));
      const set = (v: string) => onChange(numeric ? Number(v) : v);
      // Four or fewer is a Segmented, above four a Select (Admin.md §6.5a: a chip is a mark, not a control).
      if (spec.of.length <= 4) {
        return (
          <div className="noo-props__row">
            <Label as="span" className="noo-props__label">{label}</Label>
            <Segmented label={label} options={spec.of.map((o) => ({ value: o, label: o }))} value={mixed ? undefined : str(value) || undefined} onChange={set} />
            {mixed ? <Text size="small" tone="muted" className="noo-props__mixed">mixed</Text> : null}
          </div>
        );
      }
      return <Select label={label} value={str(value)} placeholder={mixed ? "mixed" : "—"} options={spec.of.map((o) => ({ value: o, label: o }))} hint={help} onChange={(e) => set(e.currentTarget.value)} />;
    }

    case "number":
      return (
        <Field
          label={label}
          type="number"
          inputMode="numeric"
          value={str(value)}
          placeholder={placeholder}
          min={spec.min}
          max={spec.max}
          trailing={spec.unit}
          hint={help}
          onChange={(e) => onChange(e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value))}
        />
      );

    case "boolean":
      return <Checkbox label={label} checked={value === true} indeterminate={mixed} hint={help} onChange={(e) => onChange(e.currentTarget.checked)} />;

    case "list": {
      const items: unknown[] = Array.isArray(value) ? (value as unknown[]) : [];
      const of = spec.of;
      const chips = of.type === "text" || (of.type === "object" && Object.keys(of.fields).every((k) => k === "label" || k === "hue"));
      return (
        <div className="noo-props__row">
          <Repeater<unknown>
            label={label}
            itemName={label.toLowerCase()}
            max={spec.max}
            items={items}
            density={chips ? "chips" : "rows"}
            chipLabel={(it) => (typeof it === "string" ? it : String((it as Record<string, unknown>)?.label ?? ""))}
            chipHue={(it) => (typeof it === "object" && it ? ((it as Record<string, unknown>).hue as Hue | undefined) : undefined)}
            newItem={() => freshValue(of)}
            onChange={onChange}
            renderItem={(item, i, set) => <Control name={`${label} ${i + 1}`} spec={of} value={item} onChange={set} ctx={ctx} nested />}
          />
          {mixed ? <Text size="small" tone="muted" className="noo-props__mixed">mixed</Text> : null}
        </div>
      );
    }

    case "object": {
      const obj = (typeof value === "object" && value && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
      return (
        <fieldset className="noo-props__group">
          <legend className="noo-label noo-props__legend">{label}</legend>
          {Object.entries(spec.fields).map(([k, f]) => (
            <Control key={k} name={k} spec={f} value={mixed ? MIXED : obj[k]} onChange={(next) => onChange({ ...obj, [k]: next })} ctx={ctx} nested />
          ))}
        </fieldset>
      );
    }

    case "pattern": {
      const extra = Object.entries(ctx.patterns).map(([n, family]) => ({ name: n, family }));
      return (
        <div className="noo-props__row">
          <Label as="span" className="noo-props__label">{label}</Label>
          <PatternPicker label={label} hue={ctx.hue} value={mixed ? undefined : str(value) || undefined} extra={extra} onChange={onChange} onNew={ctx.onPatternCreate ? () => ctx.openStudio(name, str(value)) : undefined} />
          {mixed ? <Text size="small" tone="muted" className="noo-props__mixed">mixed</Text> : null}
        </div>
      );
    }

    case "blobSize":
      return (
        <div className="noo-props__row">
          <Label as="span" className="noo-props__label">{label}</Label>
          <Segmented label={label} options={blobSizeNames.map((n) => ({ value: n, label: n }))} value={mixed ? undefined : str(value) || undefined} onChange={onChange} />
        </div>
      );

    case "href":
      return <Field label={label} value={str(value)} placeholder={placeholder ?? "/work"} hint={help ?? "a view id pans; a path routes"} onChange={(e) => onChange(e.currentTarget.value)} />;

    case "ref":
      return (
        <Select
          label={label}
          value={!mixed && isRef(value) ? value.$ref : ""}
          placeholder={mixed ? "mixed" : "—"}
          hint={help ?? "a key in the project's content (§3.4)"}
          options={ctx.contentKeys.map((k) => ({ value: k, label: k }))}
          onChange={(e) => onChange(e.currentTarget.value ? { $ref: e.currentTarget.value } : undefined)}
        />
      );
  }
}

export function PropsForm({ selection, onChange, contentKeys = [], patterns = {}, onPatternCreate, hue = "accent", foot, className }: PropsFormProps) {
  const [studio, setStudio] = useState<{ prop: string; from?: string } | null>(null);
  const rows = intersection(selection);
  const ctx: Ctx = { contentKeys, patterns, onPatternCreate, hue, openStudio: (prop, from) => setStudio({ prop, from }) };

  if (!selection.length) return null;
  const names = [...new Set(selection.map((s) => s.entry.name))];
  const title = selection.length === 1 ? selection[0]!.entry.name : `${selection.length} selected`;
  const lead = selection.length === 1 ? selection[0]!.entry.line : names.map((n) => `${selection.filter((s) => s.entry.name === n).length} × ${n}`).join(" · ");
  const taken = [...libraryPatterns.map((p) => p.name), ...Object.keys(patterns)];

  return (
    <div className={cx("noo-props", className)}>
      <SectionHeader level={4} rhythm={false} label="selected" title={title} lead={lead} />
      {rows.length ? (
        rows.map(([name, spec]) => (
          <Control key={name} name={name} spec={spec} value={sharedValue(selection, name)} onChange={(next) => onChange({ [name]: next })} ctx={ctx} />
        ))
      ) : (
        <Text size="small" tone="muted">
          {selection.length > 1 ? "These components share no prop. Select one at a time to edit them." : "This component takes no authorable props."}
        </Text>
      )}
      {foot ? <div className="noo-props__foot">{foot}</div> : null}
      {studio ? (
        <PatternStudio
          open
          hue={hue}
          taken={taken}
          initialName={studio.from}
          onClose={() => setStudio(null)}
          onSave={(option) => {
            onPatternCreate?.(option);
            onChange({ [studio.prop]: option.name });
            setStudio(null);
          }}
        />
      ) : null}
    </div>
  );
}
