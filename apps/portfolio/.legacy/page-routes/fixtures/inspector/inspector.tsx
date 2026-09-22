"use client";
import { useState } from "react";
import {
  Field, HueSwatch, PatternPicker, PatternStudio, Range, Repeater, Segmented, Select, Tree, libraryPatterns,
  type Hue, type HueValue, type PatternOption, type TreeNode,
} from "@no-origins/ui";

/**
 * Every inspector control, wired, at the inspector's real width (Admin.md §6.5a). The state here is what the
 * editor will hold in a document; the controls do not know the difference.
 */
interface ChipItem { label: string; hue: Hue }

const OUTLINE: TreeNode[] = [
  { id: "me", label: "Me", children: [{ id: "me-blob", label: "The blob" }, { id: "me-intro", label: "Intro" }, { id: "me-story", label: "Story" }] },
  { id: "work", label: "Work", children: [{ id: "work-widget", label: "Widget" }, { id: "work-full", label: "Full view", children: [{ id: "work-roles", label: "Four roles" }, { id: "work-chips", label: "The through-line" }] }] },
  { id: "status", label: "Status", children: [{ id: "status-widget", label: "Widget" }] },
  { id: "menu", label: "Sections menu" },
];

export function InspectorFixture() {
  const [hue, setHue] = useState<HueValue>("peach");
  const [pattern, setPattern] = useState("fan");
  const [mine, setMine] = useState<PatternOption[]>([]);
  const [studio, setStudio] = useState(false);
  const [chips, setChips] = useState<ChipItem[]>([
    { label: "design systems", hue: "peach" },
    { label: "editors", hue: "blue" },
    { label: "agent tools", hue: "lavender" },
  ]);
  const [details, setDetails] = useState<string[]>(["Built the design system the admin is made of.", "Wrote the schema the editor writes."]);
  const [nodes, setNodes] = useState<TreeNode[]>(OUTLINE);
  const [breath, setBreath] = useState(28);

  return (
    <div className="fx-insp">
      <section className="fx-insp__col" aria-label="Inspector">
        <h3 className="noo-caption text-ink-2">Inspector · a Bento widget</h3>
        <Field label="Eyebrow" defaultValue="WORK EXPERIENCE" maxLength={24} />
        <div className="fx-insp__row">
          <span className="noo-field__label">Hue</span>
          <HueSwatch label="Hue" value={hue} onChange={setHue} accent />
        </div>
        <div className="fx-insp__row">
          <span className="noo-field__label">Tone</span>
          <Segmented label="Tone" options={[{ value: "quiet", label: "quiet" }, { value: "fill", label: "fill" }, { value: "ink", label: "ink" }, { value: "bare", label: "bare" }]} defaultValue="fill" />
        </div>
        <Select label="Size" defaultValue="md" options={[{ value: "sm", label: "sm" }, { value: "md", label: "md" }, { value: "lg", label: "lg" }, { value: "hero", label: "hero" }, { value: "favicon", label: "favicon" }]} />
        <div className="fx-insp__row">
          <span className="noo-field__label">Pattern</span>
          <PatternPicker label="Pattern" hue={hue} value={pattern} onChange={setPattern} extra={mine} onNew={() => setStudio(true)} />
        </div>
        <Repeater<ChipItem>
          label="Chips"
          itemName="chip"
          items={chips}
          onChange={setChips}
          max={5}
          newItem={() => ({ label: "new", hue: "grey" })}
          renderItem={(c, _i, set) => (
            <>
              <Field label="Label" value={c.label} maxLength={24} onChange={(e) => set({ ...c, label: e.target.value })} />
              <HueSwatch label="Hue" value={c.hue} onChange={(h) => set({ ...c, hue: h as Hue })} />
            </>
          )}
        />
        <Repeater<string>
          label="Details"
          itemName="detail"
          density="chips"
          items={details}
          onChange={setDetails}
          max={6}
          newItem={() => "Another line."}
          chipLabel={(d) => (d.length > 18 ? `${d.slice(0, 18)}…` : d)}
          chipHue={() => "grey"}
          renderItem={(d, _i, set) => <Field label="Detail" value={d} maxLength={120} onChange={(e) => set(e.target.value)} />}
        />
        <Range label="breath" hint="units between lines" value={breath} onChange={setBreath} min={12} max={60} />
      </section>

      <section className="fx-insp__col" aria-label="Outline">
        <h3 className="noo-caption text-ink-2">Outline · Alt + arrows or drag</h3>
        <Tree label="Outline" nodes={nodes} defaultSelected="work-widget" defaultExpanded={["work", "me"]} onReorder={setNodes} />
        <p className="noo-caption text-muted">
          Order now: {nodes.map((n) => n.id).join(" · ")}
        </p>
      </section>

      <PatternStudio
        open={studio}
        onClose={() => setStudio(false)}
        hue={hue}
        taken={[...libraryPatterns, ...mine].map((p) => p.name)}
        onSave={(p) => { setMine((m) => [...m, p]); setPattern(p.name); }}
      />
    </div>
  );
}
