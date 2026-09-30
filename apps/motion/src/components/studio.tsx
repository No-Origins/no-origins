"use client";

import * as React from "react";
import { SunMoon } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { Grid, GridItem, useGridMetrics } from "@no-origins/ui/components/grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { useThemeToggle } from "@no-origins/ui/components/theme-provider";
import { FAMILIES, type Family, type FamilyId } from "@/content/families";
import { Specimen, Timeline } from "@/components/jigs";
import { Stage } from "@/components/stage";
import { StudioProvider, useStudio } from "@/components/studio-context";
import { CellButton, CopySettings, jigSections, PresetJig, PresetSelect, ResetMotion, TokenJig } from "@/components/studio-jigs";
import { MachineProvider } from "@/components/machine";
import { MachineRail, MachineView, StatesPlayer } from "@/components/states";
import { studioLayout, type StudioBox } from "@/lib/layout";

/** M15: one measured field. Navigation replaces the family pager; nothing reserves the bottom row except transport. */
function Placed({ box, children, hidden = false, name }: { box: StudioBox; children: React.ReactNode; hidden?: boolean; name: string }) {
  return <GridItem {...box} data-studio-part={name} style={hidden ? { display: "none" } : undefined}>
    <Slot fill="transparent" inset={0}>{children}</Slot>
  </GridItem>;
}

/** A select that is a box of the head: its cells' pill, its text as far in as the bar's label. */
const HEAD_PILL = "size-full data-[size=default]:h-full data-[size=default]:ps-5 data-[size=default]:pe-4 data-[size=sm]:h-full data-[size=sm]:ps-5 data-[size=sm]:pe-4";

function ViewSelect({ value, onChange, options, label = "Workspace view", className }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; label?: string; className?: string }) {
  return <Select value={value} onValueChange={onChange}>
    <SelectTrigger size="sm" aria-label={label} className={className ?? "w-full"}><SelectValue /></SelectTrigger>
    <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
  </Select>;
}

/**
 * The theme toggle. On the lime bar it is the bar's end, a circle at the centre of its round end, and turns the page's
 * colour under the pointer, since the ghost's lime would not show on lime; a cell of its own where the bar is too narrow.
 */
function ThemeToggle({ cell = false }: { cell?: boolean }) {
  const toggleTheme = useThemeToggle();
  return cell ? <CellButton label="Toggle theme" onClick={toggleTheme}><SunMoon /></CellButton>
    : <Button size="icon-sm" variant="ghost" className="shrink-0 hover:bg-background hover:text-foreground hover:[&_svg]:text-foreground [&_svg:not([class*='size-'])]:size-4" aria-label="Toggle theme" onClick={toggleTheme}><SunMoon /></Button>;
}

function Bench({ family }: { family: Family }) {
  const metrics = useGridMetrics()!;
  // A family designed version by version (the agent, his, 2026-09-30) has no presets and no scene: its tokens are all.
  const versioned = family.version !== undefined;
  // A family built from states (Motion.md M19, the agent since version 2): its bench is the states and the row selected,
  // and its transport stands taller, so the rows' lanes are under the playhead.
  const machine = !!family.machine;
  const layout = studioLayout(metrics.cols, metrics.rows, true, machine);
  const [view, setView] = React.useState("preview");
  const sections = jigSections(family);
  const height = (box: StudioBox) => box.rowSpan * (metrics.cell + metrics.gap) - metrics.gap;
  const tokenChoices = machine ? [{ value: "states", label: "Motions" }, { value: "row", label: "Row" }]
    : sections.map((section, index) => ({ value: `tokens-${index}`, label: section.title }));
  const choices = versioned ? tokenChoices : [{ value: "scene", label: "Scene" }, ...tokenChoices, { value: "presets", label: "Presets" }];
  const selected = layout.wide && view === "preview" ? (machine ? "states" : "tokens-0") : view;
  const scene = <div className="w-full shrink-0 [&_[data-slot=card]]:[--card-spacing:--spacing(4)]"><Specimen family={family} title="Scene" compact /></div>;
  const previewHeading = <Slot fill="background" inset={12} alignY="center"><div className="flex items-center justify-between gap-3">
    <Text role="label">Live preview</Text><Text role="caption" className="truncate">{family.hint}</Text>
  </div></Slot>;
  const mobileJig = machine ? <MachineView family={family} view={selected === "row" ? "row" : "states"} budget={height(layout.work)} lanes={!layout.wide} />
    : selected === "scene" ? scene : selected === "presets" ? <PresetJig family={family} /> :
    <TokenJig key={selected} family={family} initial={Number(selected.split("-")[1]) || 0} height={height(layout.work)} />;
  const bench = <>
    {/* The heading's row (his, 2026-09-29): each piece a box of its own, none in another's. Each is on the page's colour,
        which masks the field's lines, and only the controls draw an edge. */}
    {layout.wide && !layout.mosaic ? <Placed box={layout.heading} name="workspace-navigation"><Slot fill="background">
      <ViewSelect value={selected} onChange={setView} options={choices} className={HEAD_PILL} />
    </Slot></Placed> : !layout.compact ? <Placed box={layout.heading} name="heading"><Slot fill="background" inset={12} alignY="center">
      <Text role="heading" as="h1" className="truncate ps-2">{family.label}</Text>
    </Slot></Placed> : <Text role="heading" as="h1" className="sr-only">{family.label}</Text>}
    {layout.toggleOut ? <Placed box={layout.toggle} name="theme"><Slot fill="background"><ThemeToggle cell /></Slot></Placed> : null}
    <Placed box={layout.reset} name="reset"><Slot fill="background"><ResetMotion family={family} /></Slot></Placed>
    <Placed box={layout.copy} name="copy"><Slot fill="background"><CopySettings family={family} /></Slot></Placed>
    {/* A versioned family has nothing to pick: the version it starts from is said where the preset select stands. */}
    {versioned ? <Placed box={layout.preset} name="version"><Slot fill="background" inset={12} alignY="center">
      <Text role="label" className="truncate ps-2">Version {family.version}</Text>
    </Slot></Placed> : <Placed box={layout.preset} name="preset"><Slot fill="background">
      <PresetSelect family={family} className={layout.wide ? HEAD_PILL : `${HEAD_PILL} data-[size=sm]:ps-3 data-[size=sm]:pe-3`} />
    </Slot></Placed>}
    {!layout.wide ? <Placed box={layout.chooser} name="workspace-navigation"><Slot fill="background">
      <ViewSelect value={view} onChange={setView} options={[{ value: "preview", label: "Preview" }, ...choices]} className={HEAD_PILL} />
    </Slot></Placed> : null}
    {layout.previewLabel ? <Placed box={{ ...layout.preview, row: 2, rowSpan: 1 }} name="preview-heading">{previewHeading}</Placed> : null}
    {/* Keep the real stage mounted while a small screen visits its jigs: record, live state and the timeline survive. */}
    <Placed box={layout.preview} name="preview" hidden={!layout.wide && view !== "preview"}>
      <div className="grid h-full min-h-0" style={{ gridTemplateRows: layout.wide ? "minmax(0, 1fr)" : `${metrics.cell}px minmax(0, 1fr)`, gap: metrics.gap }}>
        {!layout.wide ? previewHeading : null}
        <Stage family={family} cols={layout.preview.colSpan} rows={Math.max(1, layout.preview.rowSpan - (layout.wide ? 0 : 1))} />
      </div>
    </Placed>
    {layout.mosaic ? <Placed box={layout.work} name="instruments">
      {machine ? <MachineRail family={family} /> : <div className="flex h-full min-h-0 flex-col gap-3">
        <TokenJig family={family} initial={0} height={height(versioned ? layout.work : layout.jigs[0]!)} compact />
        {versioned ? null : scene}
      </div>}
    </Placed> : layout.wide || view !== "preview" ? <Placed box={layout.work} name="jig"><div className="flex h-full min-h-0 flex-col gap-3 [&_[data-slot=card]]:h-fit [&_[data-slot=card]]:[--card-spacing:--spacing(4)] [&_[data-slot=slot]]:items-start">
      <div className="min-h-0 flex-1">{mobileJig}</div>
    </div></Placed> : null}
    <Placed box={layout.timeline} name="transport"><Slot fill="card" inset={12} alignY={machine ? "stretch" : "center"}>
      {machine ? <StatesPlayer family={family} lanes={layout.wide} /> : <Timeline dock family={family} />}
    </Slot></Placed>
  </>;
  // Selecting a row shows its controls where the field has room for one view at a time.
  return machine ? <MachineProvider family={family} onSelect={(id) => { if (id && !layout.mosaic) setView("row"); }}>{bench}</MachineProvider> : bench;
}

function Workspace() {
  const metrics = useGridMetrics()!;
  const layout = studioLayout(metrics.cols, metrics.rows);
  const [id, setId] = React.useState<FamilyId>("move");
  const family = FAMILIES.find((entry) => entry.id === id)!;
  const studio = useStudio();
  return <>
    {/* The head's first row (his, 2026-09-29): the studio's name on a lime bar, and the family select a box of its own
        at the bar's far end. The bar is a surface slot in the system's lime, `--primary`: Slot's four fills (Grid-v2.md
        D21) have none of lime. The nav is `contents`, so both boxes stay on the grid. */}
    <nav aria-label="Motion studio" className="contents">
      <Placed box={layout.nav} name="navigation"><Slot fill="muted" inset={12} alignY="center" className="bg-primary text-primary-foreground">
        <div className="flex min-w-0 items-center justify-between gap-3 ps-2">
          <Text role="label" className="truncate text-primary-foreground">{layout.wide ? "Motion studio" : "Studio"}</Text>
          {!layout.toggleOut ? <ThemeToggle /> : null}
        </div>
      </Slot></Placed>
      <Placed box={layout.family} name="family"><Slot fill="background">
        <Select value={id} onValueChange={(next) => { studio.transport.pause(); setId(next as FamilyId); }}>
          <SelectTrigger aria-label="Motion family" className={HEAD_PILL}><SelectValue /></SelectTrigger>
          <SelectContent>{FAMILIES.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.label}</SelectItem>)}</SelectContent>
        </Select>
      </Slot></Placed>
    </nav>
    <Bench key={family.id} family={family} />
  </>;
}

export function Studio() {
  return <StudioProvider><Grid overlay cursor><Workspace /></Grid></StudioProvider>;
}
