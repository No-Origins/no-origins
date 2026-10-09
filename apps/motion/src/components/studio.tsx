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
import { CopySettings, jigSections, PresetJig, PresetSelect, ResetMotion, TokenJig, tokenNatural } from "@/components/studio-jigs";
import { JigColumns, JigWidth, perLineOf, type JigSpec } from "@/components/jig-columns";
import { AgentPreviewProvider, AgentSelect } from "@/components/agent-preview";
import { ActionCard, ActionDraftProvider, ActionSelect } from "@/components/action-draft";
import { actionFamilyOf } from "@/content/agent-actions";
import { studioLayout, type StudioBox } from "@/lib/layout";

/**
 * One measured field (Motion.md M15): a select picks the family; nothing reserves the bottom row except the transport.
 * The stage is at the field's centre, the jigs in a column either side of it, six cells wide at the most, and dragged
 * between them, and the timeline ten cells at the most, under the stage.
 */
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
 * The theme toggle: the lime bar's end, a circle at the centre of its round end, turning the page's colour under the
 * pointer, since the ghost's lime would not show on lime.
 */
function ThemeToggle() {
  const toggleTheme = useThemeToggle();
  return <Button size="icon-sm" variant="ghost" className="shrink-0 hover:bg-background hover:text-foreground hover:[&_svg]:text-foreground [&_svg:not([class*='size-'])]:size-4" aria-label="Toggle theme" onClick={toggleTheme}><SunMoon /></Button>;
}

/** How many picks a family's head makes: the agents' two (Motion.md M24), the action and the agent; every other's one. */
const picksOf = (family: Family): 1 | 2 => (family.agents ? 2 : 1);

/** A card that is a jig of the columns: what it is, and how it is drawn in the room its column gives it. */
function useJigs(family: Family): JigSpec[] {
  const metrics = useGridMetrics()!;
  const versioned = family.version !== undefined;
  // How many controls a column's card puts on a line: the columns' width, the same both sides.
  const width = studioLayout(metrics.cols, metrics.rows, picksOf(family)).columns?.[0];
  const perLine = perLineOf(width ? width.colSpan * (metrics.cell + metrics.gap) - metrics.gap : 0);
  return React.useMemo(() => {
    const sections = jigSections(family).map((section, index): JigSpec => {
      const natural = tokenNatural(section.tokens, perLine);
      return {
        id: `tokens:${section.title}`, title: section.title, natural, min: tokenNatural(section.tokens, perLine, 3), estimate: natural,
        render: (budget) => <TokenJig family={family} section={index} height={budget} />,
      };
    });
    // An action (M24) leads with its own card: what it is, its version and Publish. Its controls are the rest.
    if (family.action) return [{ id: "action", title: family.label, estimate: 220, render: () => <ActionCard /> }, ...sections];
    // A family designed version by version (the agent, his, 2026-09-30) has no scene: its tokens are all.
    return versioned ? sections : [...sections, { id: "scene", title: "Scene", estimate: 200, render: () => <Scene family={family} /> }];
  }, [family, versioned, perLine]);
}

function Scene({ family }: { family: Family }) {
  return <div className="w-full shrink-0 [&_[data-slot=card]]:[--card-spacing:--spacing(4)]"><Specimen family={family} title="Scene" compact /></div>;
}

/** The jigs either side of the stage, inside the family's providers: a card reads the row selected. */
function Columns({ family, boxes }: { family: Family; boxes: readonly [StudioBox, StudioBox] }) {
  const metrics = useGridMetrics()!;
  const jigs = useJigs(family);
  return <JigColumns family={family.id} jigs={jigs} boxes={boxes} pitch={metrics.cell + metrics.gap} gap={metrics.gap} />;
}

function Bench({ family, pick }: { family: Family; pick?: React.ReactNode }) {
  const metrics = useGridMetrics()!;
  // A family designed version by version (the agent, his, 2026-09-30) has no presets and no scene: its tokens are all.
  const versioned = family.version !== undefined;
  const layout = studioLayout(metrics.cols, metrics.rows, picksOf(family));
  const [view, setView] = React.useState("preview");
  const sections = jigSections(family);
  const height = (box: StudioBox) => box.rowSpan * (metrics.cell + metrics.gap) - metrics.gap;
  const width = (box: StudioBox) => box.colSpan * (metrics.cell + metrics.gap) - metrics.gap;
  const tokenChoices = sections.map((section, index) => ({ value: `tokens-${index}`, label: section.title }));
  const choices = family.action ? [{ value: "action", label: family.label }, ...tokenChoices]
    : versioned ? tokenChoices : [{ value: "scene", label: "Scene" }, ...tokenChoices, { value: "presets", label: "Presets" }];
  const previewHeading = <Slot fill="background" inset={12} alignY="center"><div className="flex items-center justify-between gap-3">
    <Text role="label">Live preview</Text><Text role="caption" className="truncate">{family.hint}</Text>
  </div></Slot>;
  const pill = layout.wide ? HEAD_PILL : `${HEAD_PILL} data-[size=sm]:ps-3 data-[size=sm]:pe-3`;
  // A narrow field shows one jig at a time, six cells wide at the most, centred where the stage stands.
  const work = layout.work;
  const oneJig = work && view !== "preview" ? <JigWidth value={width(work)}>
    {view === "action" ? <ActionCard /> : view === "scene" ? <Scene family={family} /> : view === "presets" ? <PresetJig family={family} /> :
      <TokenJig key={view} family={family} section={Number(view.split("-")[1]) || 0} height={height(work)} />}
  </JigWidth> : null;
  return <>
    {/* The heading is for a reader: the family select above says it to the eye. */}
    <Text role="heading" as="h1" className="sr-only">{family.label}</Text>
    <Placed box={layout.reset} name="reset"><Slot fill="background"><ResetMotion family={family} /></Slot></Placed>
    <Placed box={layout.copy} name="copy"><Slot fill="background"><CopySettings family={family} /></Slot></Placed>
    {/* The agents' first pick (Motion.md M24): the action on the bench. */}
    {layout.second && pick ? <Placed box={layout.second} name="action"><Slot fill="background">{pick}</Slot></Placed> : null}
    {/* A versioned family has nothing to pick: the version it starts from is said where the preset select stands. On the
        agents (Motion.md M23) the agent previewed is picked there. */}
    {family.agents ? <Placed box={layout.preset} name="agent"><Slot fill="background">
      <AgentSelect className={pill} />
    </Slot></Placed> : versioned ? <Placed box={layout.preset} name="version"><Slot fill="background" inset={12} alignY="center">
      <Text role="label" className="truncate ps-2">Version {family.version}</Text>
    </Slot></Placed> : <Placed box={layout.preset} name="preset"><Slot fill="background">
      <PresetSelect family={family} className={pill} />
    </Slot></Placed>}
    {layout.chooser ? <Placed box={layout.chooser} name="workspace-navigation"><Slot fill="background">
      <ViewSelect value={view} onChange={setView} options={[{ value: "preview", label: "Preview" }, ...choices]} className={HEAD_PILL} />
    </Slot></Placed> : null}
    {/* Keep the real stage mounted while a small screen visits its jigs: record, live state and the timeline survive.
        It is always at the field's centre (his, 2026-10-01), with the jigs either side of it. */}
    <Placed box={layout.preview} name="preview" hidden={!layout.wide && view !== "preview"}>
      <div className="grid h-full min-h-0" style={{ gridTemplateRows: layout.wide ? "minmax(0, 1fr)" : `${metrics.cell}px minmax(0, 1fr)`, gap: metrics.gap }}>
        {!layout.wide ? previewHeading : null}
        <Stage family={family} cols={layout.preview.colSpan} rows={Math.max(1, layout.preview.rowSpan - (layout.wide ? 0 : 1))} />
      </div>
    </Placed>
    {layout.columns ? <Columns family={family} boxes={layout.columns} />
      : oneJig && work ? <Placed box={work} name="jig"><div className="flex h-full min-h-0 flex-col gap-3 [&_[data-slot=card]]:h-fit [&_[data-slot=card]]:[--card-spacing:--spacing(4)] [&_[data-slot=slot]]:items-start">
        <div className="min-h-0 flex-1">{oneJig}</div>
      </div></Placed> : null}
    <Placed box={layout.timeline} name="transport"><Slot fill="card" inset={12} alignY="center">
      <Timeline dock family={family} />
    </Slot></Placed>
  </>;
}

/**
 * The agents' page (Motion.md M24, his: "One agent page with a picker"): the head picks an action, and the bench is that
 * action's — its controls, its stage, its timeline and its draft — previewed on the agent the head's other select picks.
 * The action picked is remembered in this browser.
 */
function AgentsBench({ family }: { family: Family }) {
  const studio = useStudio();
  const metrics = useGridMetrics()!;
  const wide = studioLayout(metrics.cols, metrics.rows, 2).wide;
  const bench = actionFamilyOf(studio.optionOf(family, "action", ""));
  const pick = <ActionSelect value={bench.action!} className={wide ? HEAD_PILL : `${HEAD_PILL} data-[size=sm]:ps-3 data-[size=sm]:pe-3`}
    onChange={(next) => { studio.transport.pause(); studio.setOption(family, "action", next); }} />;
  return <AgentPreviewProvider>
    <ActionDraftProvider key={bench.id} family={bench}>
      <Bench key={bench.id} family={bench} pick={pick} />
    </ActionDraftProvider>
  </AgentPreviewProvider>;
}

function Workspace() {
  const metrics = useGridMetrics()!;
  const [id, setId] = React.useState<FamilyId>("move");
  const family = FAMILIES.find((entry) => entry.id === id)!;
  const layout = studioLayout(metrics.cols, metrics.rows, picksOf(family));
  const studio = useStudio();
  return <>
    {/* The head's first row: the studio's name on a lime bar, and the family select a box of its own at the bar's far
        end. The bar is a surface slot in the system's lime, `--primary`: Slot's four fills (Grid.md D21) have none of
        lime. The nav is `contents`, so both boxes stay on the grid. */}
    <nav aria-label="Motion studio" className="contents">
      <Placed box={layout.nav} name="navigation"><Slot fill="muted" inset={12} alignY="center" className="bg-primary text-primary-foreground">
        <div className="flex min-w-0 items-center justify-between gap-3 ps-2">
          <Text role="label" className="truncate text-primary-foreground">{layout.wide && layout.nav.colSpan >= 4 ? "Motion studio" : "Studio"}</Text>
          <ThemeToggle />
        </div>
      </Slot></Placed>
      <Placed box={layout.family} name="family"><Slot fill="background">
        <Select value={id} onValueChange={(next) => { studio.transport.pause(); setId(next as FamilyId); }}>
          <SelectTrigger aria-label="Motion family" className={HEAD_PILL}><SelectValue /></SelectTrigger>
          <SelectContent>{FAMILIES.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.label}</SelectItem>)}</SelectContent>
        </Select>
      </Slot></Placed>
    </nav>
    {family.actions ? <AgentsBench key={family.id} family={family} /> : <Bench key={family.id} family={family} />}
  </>;
}

export function Studio() {
  return <StudioProvider><Grid overlay cursor><Workspace /></Grid></StudioProvider>;
}
