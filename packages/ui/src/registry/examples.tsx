"use client";
import { useState } from "react";
import type { Hue } from "../tokens/tokens";
import { Button } from "../atoms/Button";
import { Motion } from "../atoms/Motion";
import { Text } from "../atoms/Text";
import { Field } from "../molecules/Field";
import { HueSwatch, type HueValue } from "../molecules/HueSwatch";
import { PatternPicker, libraryPatterns, type PatternOption } from "../molecules/PatternPicker";
import { Repeater } from "../molecules/Repeater";
import { PatternStudio } from "../organisms/PatternStudio";
import { Tree, type TreeNode } from "../organisms/Tree";

/**
 * Catalogue samples that need state or a handler. A registry `example()` runs on the server and cannot pass a
 * function to a client component ("Event handlers cannot be passed to Client Component props"), so the controls
 * that only make sense wired up are wired here, in one client file, on real content.
 */

export function PatternPickerExample() {
  const [value, setValue] = useState("fan");
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<PatternOption[]>([]);
  return (
    <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 16 }}>
      <PatternPicker label="Pattern" hue="peach" value={value} onChange={setValue} extra={mine} onNew={() => setOpen(true)} />
      <PatternStudio
        open={open}
        onClose={() => setOpen(false)}
        hue="peach"
        taken={[...libraryPatterns, ...mine].map((p) => p.name)}
        onSave={(p) => { setMine((m) => [...m, p]); setValue(p.name); }}
      />
    </div>
  );
}

interface ChipItem { label: string; hue: Hue }

export function RepeaterExample() {
  const [chips, setChips] = useState<ChipItem[]>([
    { label: "design systems", hue: "peach" },
    { label: "editors", hue: "blue" },
    { label: "agent tools", hue: "lavender" },
  ]);
  const [details, setDetails] = useState<string[]>([
    "Built the design system the admin is made of.",
    "Wrote the schema the editor writes.",
  ]);
  return (
    <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 24 }}>
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
    </div>
  );
}

const OUTLINE: TreeNode[] = [
  { id: "me", label: "Me", children: [{ id: "me-blob", label: "The blob" }, { id: "me-intro", label: "Intro" }, { id: "me-story", label: "Story" }] },
  { id: "work", label: "Work", children: [{ id: "work-widget", label: "Widget" }, { id: "work-full", label: "Full view", children: [{ id: "work-roles", label: "Four roles" }, { id: "work-chips", label: "The through-line" }] }] },
  { id: "status", label: "Status", children: [{ id: "status-widget", label: "Widget" }] },
  { id: "menu", label: "Sections menu" },
];

export function TreeExample() {
  const [nodes, setNodes] = useState<TreeNode[]>(OUTLINE);
  return (
    <div style={{ width: 260 }}>
      <Tree label="Outline" nodes={nodes} defaultSelected="work-widget" defaultExpanded={["work", "me"]} onReorder={setNodes} />
    </div>
  );
}

export type { HueValue };

const EFFECTS = ["rise", "pop", "lift", "breathe"] as const;

/** The four patterns side by side, replayed on demand — an animation the eye missed is one it cannot judge. */
export function MotionExample() {
  const [run, setRun] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div key={run} style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {EFFECTS.map((effect, i) => (
          <Motion key={effect} effect={effect} delay={i * 60} className="noo-surface noo-surface--1 noo-r-lg" style={{ padding: "16px 20px" }}>
            <Text size="small"><code className="noo-code">{effect}</code></Text>
          </Motion>
        ))}
      </div>
      <div>
        <Button variant="secondary" size="sm" onClick={() => setRun((n) => n + 1)}>Play again</Button>
      </div>
    </div>
  );
}
