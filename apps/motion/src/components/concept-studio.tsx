"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Copy, RotateCcw } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import { ColourPicker } from "@no-origins/ui/components/colour-picker";
import { Grid, useGridMetrics } from "@no-origins/ui/components/grid";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Slot } from "@no-origins/ui/components/slot";
import { Tabs, TabsList, TabsTrigger } from "@no-origins/ui/components/tabs";
import { Text } from "@no-origins/ui/components/text";
import { EASES, FAMILIES, type Family, type PresetId, type Token } from "@/content/families";
import { StudioProvider, useStudio } from "@/components/studio-context";
import { Stage } from "@/components/stage";
import { Specimen, Timeline } from "@/components/jigs";
import { settingsText, tokenLabel } from "@/lib/tokens";

type Concept = "split" | "dock" | "inspector";
const CONCEPTS = {
  split: { title: "Split bench", note: "Two equal halves. Tune on the left, watch on the right." },
  dock: { title: "Stage with a dock", note: "A wide stage, with a short workbench underneath." },
  inspector: { title: "Focused inspector", note: "More room to watch. One jig at a time." },
};
// These are layout proposals, not additional motions on the bench: every family on the studio's own stage.
const SAMPLES = FAMILIES;

function Placed({ at, children }: { at: number[]; children: React.ReactNode }) {
  const [col, row, width, height] = at;
  return <Slot style={{ gridColumn: `${col} / span ${width}`, gridRow: `${row} / span ${height}` }}>{children}</Slot>;
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <Card size="sm" className="h-fit gap-3 shadow-none">
    <CardHeader className="flex items-center justify-between gap-3">
      <Text role="label" as="h2">{title}</Text>{action}
    </CardHeader>
    <CardContent className="flex min-h-0 flex-col gap-3">{children}</CardContent>
  </Card>;
}

function Parameter({ token, family }: { token: Token; family: Family }) {
  const studio = useStudio();
  const value = studio.values(family)[token.name];
  const id = React.useId();
  const [draft, setDraft] = React.useState<string | null>(null);
  if (value === undefined) return null;
  const set = (next: number | string) => studio.setValue(family, token.name, next);
  const choices = token.kind === "ease" ? EASES : token.choices;
  const commit = () => {
    if (draft !== null && draft.trim() && Number.isFinite(Number(draft))) {
      const step = token.step ?? 1;
      set(Number(Math.min(token.max ?? 1, Math.max(token.min ?? 0, Math.round(Number(draft) / step) * step)).toFixed(5)));
    }
    setDraft(null);
  };
  return <div className="flex min-w-0 flex-col gap-2">
    <div className="flex min-w-0 items-center justify-between gap-2">
      <Label htmlFor={id}>{token.label}</Label>
      {!choices ? <div className="flex items-center gap-1">
        <Input id={id} aria-label={`${token.label} value`} type="number" min={token.min} max={token.max} step={token.step}
          className="h-7 w-16 px-2.5 text-right" value={draft ?? String(value)} onChange={(event) => setDraft(event.target.value)}
          onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setDraft(null); }} />
        <Text role="caption">{token.kind === "ms" ? "ms" : token.unit ?? "×"}</Text>
      </div> : null}
    </div>
    {/* A choice of colours is the colour picker, as every pick of a colour is (Character-Studio.md C17). */}
    {choices && token.swatches ? <ColourPicker id={id} aria-label={token.label} value={String(value)} onValueChange={set}
      options={choices.map((choice) => ({ ...choice, colour: token.swatches!(studio.values(family))[choice.value] ?? "transparent" }))} />
    : choices ? <Select value={String(value)} onValueChange={set}>
      <SelectTrigger id={id} size="sm" className="w-full" aria-label={token.label}><SelectValue /></SelectTrigger>
      <SelectContent>
        {!choices.some((choice) => choice.value === value) ? <SelectItem value={String(value)}>{String(value)}</SelectItem> : null}
        {choices.map((choice) => <SelectItem key={choice.value} value={choice.value}>{choice.label}</SelectItem>)}
      </SelectContent>
    </Select> : <Slider min={token.min} max={token.max} step={token.step} value={[Number(value)]}
      aria-label={token.label} aria-valuetext={tokenLabel(token, value)} onValueChange={([next]) => next !== undefined && set(next)} />}
    <Text role="caption" className="truncate" title={token.touches}>{token.touches}</Text>
  </div>;
}

function Tuning({ family, compact = false }: { family: Family; compact?: boolean }) {
  const [page, setPage] = React.useState(0);
  const size = compact ? 4 : 3;
  const groups = [...new Set(family.tokens.map((token) => token.group ?? "Motion"))];
  const pages = groups.flatMap((group) => {
    const tokens = family.tokens.filter((token) => (token.group ?? "Motion") === group);
    return Array.from({ length: Math.ceil(tokens.length / size) }, (_, index) => ({ group, tokens: tokens.slice(index * size, (index + 1) * size) }));
  });
  const current = Math.min(page, pages.length - 1);
  const shown = pages[current];
  return <Panel title={shown?.group ?? "Motion"} action={<div className="flex items-center gap-1">
    <Button size="icon-xs" variant="ghost" aria-label="Previous controls" disabled={current === 0} onClick={() => setPage(current - 1)}><ArrowLeft /></Button>
    <Text role="caption">{current + 1}/{pages.length}</Text>
    <Button size="icon-xs" variant="ghost" aria-label="Next controls" disabled={current === pages.length - 1} onClick={() => setPage(current + 1)}><ArrowRight /></Button>
  </div>}>
    <div className={compact ? "grid grid-cols-2 gap-x-6 gap-y-3" : "flex flex-col gap-6"}>
      {shown?.tokens.map((token) => <Parameter key={token.name} family={family} token={token} />)}
    </div>
  </Panel>;
}

function PresetPicker({ family }: { family: Family }) {
  const studio = useStudio();
  const matched = studio.presetOf(family);
  return <Select value={matched ?? "tuned"} onValueChange={(value) => value !== "tuned" && studio.applyPreset(family, value as PresetId)}>
    <SelectTrigger size="sm" aria-label="Preset" className="w-full"><SelectValue /></SelectTrigger>
    <SelectContent>
      {!matched ? <SelectItem value="tuned">Custom tuning</SelectItem> : null}
      {family.presets.map((preset) => <SelectItem key={preset.id} value={preset.id}>{preset.id} · {preset.name}</SelectItem>)}
    </SelectContent>
  </Select>;
}

function PresetNote({ family }: { family: Family }) {
  return <Panel title="Starting point"><PresetPicker family={family} /><Text role="body">{family.touches}</Text><Text role="caption">Choose a starting point, then tune its controls. Reset returns to Today.</Text></Panel>;
}

function Inspector({ family, height, initialTab = "motion" }: { family: Family; height: number; initialTab?: string }) {
  const [tab, setTab] = React.useState(initialTab);
  return <div className="flex h-full min-h-0 flex-col gap-3">
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full"><TabsTrigger value="motion">Motion</TabsTrigger><TabsTrigger value="specimen">Scene</TabsTrigger><TabsTrigger value="presets">Presets</TabsTrigger></TabsList>
    </Tabs>
    <div className="min-h-0 flex-1 [&_[data-slot=card]]:h-fit">
      {tab === "motion" ? <Tuning family={family} compact={height < 6} /> : tab === "specimen" ? <Specimen family={family} /> : <PresetNote family={family} />}
    </div>
  </div>;
}

function Workbench({ concept }: { concept: Concept }) {
  const { cols, rows } = useGridMetrics()!;
  const [familyId, setFamilyId] = React.useState("move");
  const [mobileTab, setMobileTab] = React.useState("view");
  const [copyState, setCopyState] = React.useState("Copy settings");
  const studio = useStudio();
  const family = SAMPLES.find((entry) => entry.id === familyId)!;
  const narrow = cols < 14 || rows < 10 || (concept === "dock" && rows < 12);
  const half = Math.floor(cols / 2);
  const contentRows = Math.min(7, rows - 4);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(settingsText(family, studio.values(family), studio.decided?.[family.id] ?? {}, studio.fromOf(family)));
      setCopyState("Copied");
    } catch { setCopyState("Copy failed — retry"); }
  };
  const stage = (at: number[]) => <Placed at={at}><Stage key={family.id} family={family} cols={at[2]!} rows={at[3]!} /></Placed>;
  const line = (at: number[]) => <Placed at={at}><Timeline family={family} /></Placed>;
  return <>
    <Placed at={[1, 1, cols, 1]}><Slot fill="background" inset={12} alignY="center">
      <div className="flex items-center justify-between gap-3">
        <Text role="heading" as="h1" className="hidden min-[700px]:block">Motion studio</Text>
        <div className="flex gap-1">
          {(Object.keys(CONCEPTS) as Concept[]).map((key) => <Button key={key} asChild size="sm" variant={concept === key ? "default" : "ghost"}>
            <Link href={`/concepts/${key}`} aria-current={concept === key ? "page" : undefined}>{key === "split" ? "Split bench" : key === "dock" ? "Dock" : "Inspector"}</Link>
          </Button>)}
        </div>
        <Button asChild size="sm" variant="ghost" className="hidden min-[700px]:inline-flex"><Link href="/">Current studio</Link></Button>
      </div>
    </Slot></Placed>
    <Placed at={[1, 2, cols, 1]}><Slot fill="background" inset={12} alignY="center">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Select value={family.id} onValueChange={(id) => { studio.transport.pause(); setFamilyId(id); setCopyState("Copy settings"); }}>
            <SelectTrigger aria-label="Motion family" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{SAMPLES.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.label}</SelectItem>)}</SelectContent>
          </Select>
          <Text role="caption" className="hidden min-[1100px]:block">{CONCEPTS[concept].note}</Text>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="icon-sm" variant="ghost" aria-label="Reset motion" onClick={() => studio.reset(family)}><RotateCcw /></Button>
          <Button size="sm" variant="outline" aria-label={copyState} onClick={copy}><Copy /><span className="hidden min-[700px]:inline" aria-live="polite">{copyState}</span></Button>
        </div>
      </div>
    </Slot></Placed>
    {narrow ? <>
      <Placed at={[1, 3, cols, 1]}><Slot fill="background" inset={12} alignY="center"><Tabs value={mobileTab} onValueChange={setMobileTab}><TabsList className="w-full"><TabsTrigger value="view">Preview</TabsTrigger><TabsTrigger value="jigs">Jigs</TabsTrigger></TabsList></Tabs></Slot></Placed>
      {mobileTab === "view" ? <>{stage([1, 4, cols, Math.max(1, rows - 6)])}{line([1, rows - 2, cols, 2])}</> : <Placed at={[1, 4, cols, Math.max(1, rows - 4)]}><Inspector key={family.id} family={family} height={rows - 4} /></Placed>}
    </> : concept === "split" ? <>
      <Placed at={[1, 4, Math.ceil(half / 2), 6]}><Tuning key={family.id} family={family} /></Placed>
      <Placed at={[Math.ceil(half / 2) + 1, 4, Math.floor(half / 2), 4]}><div className="h-full [&_[data-slot=card]]:h-fit"><Specimen key={family.id} family={family} /></div></Placed>
      <Placed at={[Math.ceil(half / 2) + 1, 8, Math.floor(half / 2), 1]}><Slot fill="background" inset={12} alignY="center"><PresetPicker family={family} /></Slot></Placed>
      {stage([half + 1, 3, cols - half, contentRows])}
      {line([half + 1, 3 + contentRows, cols - half, 1])}
    </> : concept === "dock" ? <>
      {stage([1, 3, cols, rows - 9])}
      {line([1, rows - 6, cols, 1])}
      <Placed at={[1, rows - 5, half, 5]}><Tuning key={family.id} family={family} compact /></Placed>
      <Placed at={[half + 1, rows - 5, cols - half, 5]}><Inspector key={family.id} family={family} height={5} initialTab="presets" /></Placed>
    </> : <>
      {stage([1, 3, cols - 6, contentRows])}
      {line([1, 3 + contentRows, cols - 6, 1])}
      <Placed at={[cols - 5, 4, 6, 6]}><Inspector key={family.id} family={family} height={6} /></Placed>
    </>}
    <Placed at={[1, rows, cols, 1]}><Slot fill="transparent" alignY="center" inset={12}>
      <Text role="caption">{CONCEPTS[concept].title} · Layout study {narrow ? "· Preview / jigs" : "· Live controls · D to change theme"}</Text>
    </Slot></Placed>
  </>;
}

export function ConceptStudio({ concept }: { concept: Concept }) {
  return <StudioProvider><Grid overlay cursor><Workbench concept={concept} /></Grid></StudioProvider>;
}
