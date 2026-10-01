"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Copy, RotateCcw, X } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import { ColourPicker } from "@no-origins/ui/components/colour-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@no-origins/ui/components/dialog";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { Slider } from "@no-origins/ui/components/slider";
import { Text } from "@no-origins/ui/components/text";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { cn } from "@no-origins/ui/lib/utils";
import { EASES, type Family, type PresetId, type Token, type Value } from "@/content/families";
import { useStudio } from "@/components/studio-context";
import { readMachine, resetFront, statesText, writeMachine } from "@/lib/states";
import { settingsText, tokenLabel } from "@/lib/tokens";

export type JigSection = { title: string; tokens: Token[] };
/** Presentation only: every parameter comes from the existing family; no settings invented by the mockup. */
export function jigSections(family: Family): JigSection[] {
  if (family.tokens.some((token) => token.group)) {
    return [...new Set(family.tokens.map((token) => token.group!))].map((title) => ({ title, tokens: family.tokens.filter((token) => token.group === title) }));
  }
  return [
    { title: "Timing", tokens: family.tokens.filter((token) => token.kind === "ms") },
    { title: "Shape", tokens: family.tokens.filter((token) => token.kind !== "ms" && token.kind !== "ease") },
    { title: "Easing", tokens: family.tokens.filter((token) => token.kind === "ease") },
  ].filter((section) => section.tokens.length);
}

export function JigCard({ title, action, children }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return <Card size="sm" className="h-fit max-h-full min-h-0 shrink-0 gap-3 shadow-none [--card-spacing:--spacing(4)]">
    <CardHeader className="flex min-h-7 items-center justify-between gap-2">{typeof title === "string" ? <Text role="label" as="h2">{title}</Text> : title}{action}</CardHeader>
    <CardContent className="flex min-h-0 flex-col gap-3">{children}</CardContent>
  </Card>;
}

function Parameter({ token, family }: { token: Token; family: Family }) {
  const studio = useStudio();
  const value = studio.values(family)[token.name];
  if (value === undefined) return null;
  return <ParameterControl token={token} value={value} swatches={token.swatches?.(studio.values(family))} onChange={(next) => studio.setValue(family, token.name, next)} />;
}

/**
 * One token's control, as every jig draws it: its label and its value typed beside it, the slider (or the select, for
 * an ease or a choice) under them, and what it moves in a line. A state's row (Motion.md M19) draws the same control
 * for a value it may or may not set: `unset`, it shows the value underneath, dimmed, and moving it sets it; `onClear`
 * takes it off the row again. `disabled`, for a locked row, it only shows. A choice of colours (`swatches`, what each
 * looks like now) is the design system's colour picker, as every pick of a colour is (Character-Studio.md C17).
 */
export function ParameterControl({ token, value, onChange, swatches, unset = false, onClear, disabled = false }: {
  token: Token;
  value: Value;
  onChange: (value: Value) => void;
  swatches?: Record<string, string>;
  unset?: boolean;
  onClear?: () => void;
  disabled?: boolean;
}) {
  const id = React.useId();
  const [draft, setDraft] = React.useState<string | null>(null);
  const choices = token.kind === "ease" ? EASES : token.choices;
  const commit = () => {
    if (draft !== null && draft.trim() && Number.isFinite(Number(draft))) {
      const step = token.step ?? 1;
      const min = token.min ?? 0;
      const snapped = min + Math.round((Number(draft) - min) / step) * step;
      onChange(Number(Math.min(token.max ?? 1, Math.max(min, snapped)).toFixed(5)));
    }
    setDraft(null);
  };
  const unit = token.kind === "ms" ? "ms" : token.unit ?? "ratio";
  // Unset on a row (M19), the value underneath is the field's placeholder, so typing any number, that one too, sets it.
  return <div className={cn("flex min-w-0 flex-col gap-1", unset && "[&_[data-slot=slider]]:opacity-45 [&_[data-slot=colour-picker]]:opacity-45")} data-unset={unset ? "" : undefined}>
    <div className="flex min-h-6 items-center justify-between gap-2">
      <Label htmlFor={id} className={cn("min-w-0", unset && "text-muted-foreground")}>{token.label}</Label>
      {!choices ? <div className="flex shrink-0 items-center gap-1">
        <Input id={id} className="h-6 w-14 px-2 text-right" type="number" aria-label={`${token.label} value`} min={token.min} max={token.max} step={token.step}
          disabled={disabled} value={draft ?? (unset ? "" : String(value))} placeholder={unset ? String(value) : undefined}
          onChange={(event) => setDraft(event.target.value)} onBlur={commit}
          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setDraft(null); }} />
        <Text role="caption">{unit}</Text>
      </div> : null}
    </div>
    {choices && swatches ? <ColourPicker id={id} aria-label={token.label} value={String(value)} disabled={disabled} onValueChange={onChange}
      options={choices.map((choice) => ({ ...choice, colour: swatches[choice.value] ?? "transparent" }))} />
    : choices ? <Select value={String(value)} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} size="sm" className="w-full" aria-label={token.label}><SelectValue /></SelectTrigger>
      <SelectContent>
        {!choices.some((choice) => choice.value === value) ? <SelectItem value={String(value)}>{String(value)}</SelectItem> : null}
        {choices.map((choice) => <SelectItem key={choice.value} value={choice.value}>{choice.label}</SelectItem>)}
      </SelectContent>
    </Select> : <Slider className="min-h-4" min={token.min} max={token.max} step={token.step} value={[Number(value)]} aria-label={token.label} disabled={disabled}
      aria-valuetext={tokenLabel(token, value)} onValueChange={([next]) => next !== undefined && onChange(next)} />}
    <div className="flex min-w-0 items-center justify-between gap-1">
      <Text role="caption" className="truncate" title={token.touches}>{token.touches}</Text>
      {/* On a state's row, a value it sets can be taken off it again (Motion.md M19). */}
      {onClear && !unset && !disabled ? <Button size="icon-xs" variant="ghost" className="-my-1 size-5 shrink-0" aria-label={`Clear ${token.label}`} title="Take it off this row" onClick={onClear}><X /></Button> : null}
    </div>
  </div>;
}

export function TokenJig({ family, initial, height, chooseSection = false, compact = false }: { family: Family; initial: number; height: number; chooseSection?: boolean; compact?: boolean }) {
  const sections = jigSections(family);
  const [selected, setSelected] = React.useState(sections[initial]?.title ?? sections[0]?.title ?? "");
  const [page, setPage] = React.useState(0);
  const grouped = family.tokens.some((token) => token.group);
  const section = compact && !grouped ? { title: "Motion", tokens: family.tokens } : sections.find((item) => item.title === selected) ?? sections[0];
  if (!section) return <PresetJig family={family} />;
  // Reserve the header, card insets and the taller select controls, including the gap between parameters.
  const capacity = Math.max(1, Math.floor((height - 84) / 96)) * (compact ? 2 : 1);
  const pages = Math.ceil(section.tokens.length / capacity);
  const current = Math.min(page, pages - 1);
  return <JigCard title={chooseSection || grouped ? <Select value={section.title} onValueChange={(value) => { setSelected(value); setPage(0); }}>
    <SelectTrigger size="sm" aria-label={`Control group ${initial + 1}`} className="min-w-0 flex-1"><SelectValue /></SelectTrigger>
    <SelectContent>{sections.map((item) => <SelectItem key={item.title} value={item.title}>{item.title}</SelectItem>)}</SelectContent>
  </Select> : section.title} action={pages > 1 ? <div className="flex shrink-0 items-center gap-1">
    <Button size="icon-xs" variant="ghost" aria-label={`Previous ${section.title} controls`} disabled={current === 0} onClick={() => setPage(current - 1)}><ArrowLeft /></Button>
    <Text role="mono">{current + 1}/{pages}</Text>
    <Button size="icon-xs" variant="ghost" aria-label={`Next ${section.title} controls`} disabled={current + 1 === pages} onClick={() => setPage(current + 1)}><ArrowRight /></Button>
  </div> : null}>
    <div className={cn("grid gap-x-6 gap-y-3", compact && "grid-cols-2")}>
      {section.tokens.slice(current * capacity, (current + 1) * capacity).map((token) => <Parameter key={token.name} token={token} family={family} />)}
    </div>
  </JigCard>;
}

export function PresetSelect({ family, className }: { family: Family; className?: string }) {
  const studio = useStudio();
  const matched = studio.presetOf(family);
  return <Select value={matched ?? "tuned"} onValueChange={(value) => value !== "tuned" && studio.applyPreset(family, value as PresetId)}>
    <SelectTrigger size="sm" aria-label="Preset" className={cn("w-full min-w-0", className)}><SelectValue /></SelectTrigger>
    <SelectContent>
      {!matched ? <SelectItem value="tuned">Custom tuning</SelectItem> : null}
      {family.presets.map((preset) => <SelectItem key={preset.id} value={preset.id}>{preset.id} · {preset.name}</SelectItem>)}
    </SelectContent>
  </Select>;
}

export function PresetJig({ family }: { family: Family }) {
  const studio = useStudio();
  const matched = studio.presetOf(family);
  const shown = family.presets.find((preset) => preset.id === (matched ?? studio.fromOf(family)))!;
  return <JigCard title="Presets">
    <ToggleGroup type="single" size="sm" variant="outline" value={matched ?? ""} onValueChange={(value) => value && studio.applyPreset(family, value as PresetId)} aria-label="Presets">
      {family.presets.map((preset) => <ToggleGroupItem key={preset.id} value={preset.id}>{preset.id}</ToggleGroupItem>)}
    </ToggleGroup>
    <Text role="heading">{shown.name}{matched ? "" : ", tuned"}</Text>
    <Text role="caption">Pick a starting point, then tune its controls.</Text>
    <Dialog><DialogTrigger asChild><Button size="sm" variant="outline">About this preset</Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>{shown.name}</DialogTitle><DialogDescription>{shown.why}</DialogDescription></DialogHeader><Text role="body">Could fail: {shown.risk}</Text></DialogContent>
    </Dialog>
  </JigCard>;
}

/** A button a cell of the head (his, 2026-09-29): the cell's own circle, outlined. */
export function CellButton({ label, title, onClick, children }: { label: string; title?: string; onClick: () => void; children: React.ReactNode }) {
  return <Button size="icon" variant="outline" className="size-full [&_svg:not([class*='size-'])]:size-4.5" aria-label={label} title={title ?? label} onClick={onClick}>{children}</Button>;
}

/** Reset: the family back to Today, its decided values — or, designed version by version, to the version's. */
export function ResetMotion({ family }: { family: Family }) {
  const studio = useStudio();
  const [message, setMessage] = React.useState("");
  const start = family.version !== undefined ? `Version ${family.version}` : "Today";
  return <>
    <CellButton label="Reset motion" title={family.machine ? `Reset this state to ${start}` : `Reset motion to ${start}`} onClick={() => {
      // A family built from states (Motion.md M19) resets the tab in front, never the other states he has made.
      if (family.machine) studio.setData(family.id, (data) => writeMachine(family, data, resetFront(readMachine(family, data), family.machine!)));
      else studio.reset(family);
      setMessage(`Reset to ${start}`);
    }}><RotateCcw /></CellButton>
    <Text role="caption" className="sr-only" aria-live="polite">{message}</Text>
  </>;
}

/** Copy: every token of the family as the settings block, even those on another jig page. */
export function CopySettings({ family }: { family: Family }) {
  const studio = useStudio();
  const [message, setMessage] = React.useState("");
  const copy = async () => {
    const matched = studio.presetOf(family);
    const preset = family.presets.find((entry) => entry.id === (matched ?? studio.fromOf(family)))!;
    try {
      // A versioned family's one start is named by its version alone: there is no letter to pick it by.
      const from = family.version !== undefined ? preset.name : `${preset.id} ${preset.name}`;
      // A family built from states hands back its states, as data: a state is not a token (Motion.md M19).
      await navigator.clipboard.writeText(family.machine ? statesText(family, readMachine(family, studio.dataOf(family.id)))
        : settingsText(family, studio.values(family), studio.decided?.[family.id] ?? {}, `${from}${matched ? "" : ", tuned"}`));
      setMessage("Copied settings");
    } catch { setMessage("Copy failed. Try again."); }
  };
  return <>
    <CellButton label="Copy settings" title={message || "Copy settings"} onClick={copy}><Copy /></CellButton>
    <Text role="caption" className="sr-only" aria-live="polite">{message}</Text>
  </>;
}
