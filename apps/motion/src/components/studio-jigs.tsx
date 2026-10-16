"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Copy, RotateCcw } from "lucide-react";
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
import { perLineOf, useJigHandle, useJigWidth } from "@/components/jig-columns";
import { useStudio } from "@/components/studio-context";
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

/** A jig's card: its head — the grip it is dragged by, where it stands in a column, then its title and its action — and its controls. */
export function JigCard({ title, action, children }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  const grip = useJigHandle();
  return <Card size="sm" className="h-fit max-h-full min-h-0 shrink-0 gap-3 shadow-none [--card-spacing:--spacing(4)]">
    <CardHeader className="flex min-h-7 items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-1">{grip}{typeof title === "string" ? <Text role="label" as="h2" className="truncate">{title}</Text> : title}</div>
      {action}
    </CardHeader>
    <CardContent className="flex min-h-0 flex-col gap-3">{children}</CardContent>
  </Card>;
}

/**
 * How tall a token's control stands in a jig, with the gap under it, px: its label, its control and its caption — a
 * select's or a picker's 36, a slider's 16. A picker's swatches stand at the small size in rows (Orbit.md C17), so one
 * with more than its line holds across (`room`, px) is a row taller for each row they wrap into. The card round them
 * takes `TOKEN_CARD_CHROME`: its insets, its head and the gap under the head, less the last control's gap.
 */
const SWATCH = 36;
const SWATCH_GAP = 4;
const swatchRows = (token: Token, room: number) =>
  token.choices && token.swatches ? Math.ceil(token.choices.length / Math.max(1, Math.floor((room + SWATCH_GAP) / (SWATCH + SWATCH_GAP)))) : 1;
const tokenPitch = (token: Token, room: number) =>
  (token.kind === "ease" || token.choices ? 96 : 76) + (swatchRows(token, room) - 1) * (SWATCH + SWATCH_GAP);
const TOKEN_CARD_CHROME = 80;
/** The card's inset either side (`--card-spacing`, 16) and the gap between two controls on a line (`gap-x-6`). */
const CARD_INSETS = 32;
const LINE_GAP = 24;
/** The width of a six-cell card at the narrower cell, what a card is before it is measured. */
const SIX_CELLS = 420;

/**
 * A section's tokens in lines of `perLine`, each line as tall as its tallest. A choice of colours takes a line of its
 * own (as Orbit's cards give it), so its swatches have the card's width and the agent's nine paints stand in one row.
 */
const linesOf = (tokens: readonly Token[], perLine: number) => {
  const lines: Token[][] = [];
  for (const token of tokens) {
    const last = lines[lines.length - 1];
    if (!last || token.swatches || last[0]?.swatches || last.length >= perLine) lines.push([token]);
    else last.push(token);
  }
  return lines;
};
/** The room a line's control has across, px: the card's content, shared by two with the gap between. */
const roomOf = (line: readonly Token[], perLine: number, width: number) => {
  const content = (width || SIX_CELLS) - CARD_INSETS;
  return perLine === 2 && line.length > 1 ? (content - LINE_GAP) / 2 : content;
};
const pitchOf = (line: readonly Token[], perLine: number, width: number) =>
  Math.max(...line.map((token) => tokenPitch(token, roomOf(line, perLine, width))));

/** A token jig's height with every control on it, px — or with its first `lines` of them, the least it reads in. */
export const tokenNatural = (tokens: readonly Token[], perLine: number, lines = Infinity, width = 0) =>
  TOKEN_CARD_CHROME + linesOf(tokens, perLine).slice(0, lines).reduce((sum, line) => sum + pitchOf(line, perLine, width), 0);

/** Tokens in pages of lines of `perLine`, each page's lines standing in `room` px — a line at the least a page. */
function linePages(tokens: readonly Token[], perLine: number, width: number, room: number): Token[][] {
  const pages: Token[][] = [];
  let page: Token[] = [];
  let used = 0;
  for (const line of linesOf(tokens, perLine)) {
    const pitch = pitchOf(line, perLine, width);
    if (page.length && used + pitch > room) {
      pages.push(page);
      page = [];
      used = 0;
    }
    page.push(...line);
    used += pitch;
  }
  if (page.length) pages.push(page);
  return pages;
}

function Parameter({ token, family, className }: { token: Token; family: Family; className?: string }) {
  const studio = useStudio();
  const value = studio.values(family)[token.name];
  if (value === undefined) return null;
  return <ParameterControl token={token} value={value} swatches={token.swatches?.(studio.values(family))} onChange={(next) => studio.setValue(family, token.name, next)} className={className} />;
}

/**
 * One token's control, as every jig draws it: its label and its value typed beside it, the slider (or the select, for
 * an ease or a choice) under them, and what it moves in a line. A choice of colours (`swatches`, what each looks like
 * now) is the design system's colour picker, as every pick of a colour is (Orbit.md C17).
 */
function ParameterControl({ token, value, onChange, swatches, className }: {
  token: Token;
  value: Value;
  onChange: (value: Value) => void;
  swatches?: Record<string, string>;
  className?: string;
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
  return <div className={cn("flex min-w-0 flex-col gap-1", className)}>
    <div className="flex min-h-6 items-center justify-between gap-2">
      <Label htmlFor={id} className="min-w-0">{token.label}</Label>
      {!choices ? <div className="flex shrink-0 items-center gap-1">
        <Input id={id} className="h-6 w-14 px-2 text-right" type="number" aria-label={`${token.label} value`} min={token.min} max={token.max} step={token.step}
          value={draft ?? String(value)}
          onChange={(event) => setDraft(event.target.value)} onBlur={commit}
          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setDraft(null); }} />
        <Text role="caption">{unit}</Text>
      </div> : null}
    </div>
    {choices && swatches ? <ColourPicker id={id} aria-label={token.label} value={String(value)} onValueChange={onChange}
      options={choices.map((choice) => ({ ...choice, colour: swatches[choice.value] ?? "transparent" }))} />
    : choices ? <Select value={String(value)} onValueChange={onChange}>
      <SelectTrigger id={id} size="sm" className="w-full" aria-label={token.label}><SelectValue /></SelectTrigger>
      <SelectContent>
        {!choices.some((choice) => choice.value === value) ? <SelectItem value={String(value)}>{String(value)}</SelectItem> : null}
        {choices.map((choice) => <SelectItem key={choice.value} value={choice.value}>{choice.label}</SelectItem>)}
      </SelectContent>
    </Select> : <Slider className="min-h-4" min={token.min} max={token.max} step={token.step} value={[Number(value)]} aria-label={token.label}
      aria-valuetext={tokenLabel(token, value)} onValueChange={([next]) => next !== undefined && onChange(next)} />}
    <Text role="caption" className="truncate" title={token.touches}>{token.touches}</Text>
  </div>;
}

/**
 * One section's tokens (a group's, or Timing, Shape or Easing for a family with none), a card of its own: two to a line
 * where the card is six cells wide, one where it is narrower, paged to the `height` it is given.
 */
export function TokenJig({ family, section: index, height }: { family: Family; section: number; height: number }) {
  const section = jigSections(family)[index];
  const width = useJigWidth();
  const [page, setPage] = React.useState(0);
  if (!section) return <PresetJig family={family} />;
  const perLine = perLineOf(width);
  const pages = linePages(section.tokens, perLine, width, height - TOKEN_CARD_CHROME);
  const current = Math.min(page, pages.length - 1);
  return <JigCard title={section.title} action={pages.length > 1 ? <div className="flex shrink-0 items-center gap-1">
    <Button size="icon-xs" variant="ghost" aria-label={`Previous ${section.title} controls`} disabled={current === 0} onClick={() => setPage(current - 1)}><ArrowLeft /></Button>
    <Text role="mono">{current + 1}/{pages.length}</Text>
    <Button size="icon-xs" variant="ghost" aria-label={`Next ${section.title} controls`} disabled={current + 1 === pages.length} onClick={() => setPage(current + 1)}><ArrowRight /></Button>
  </div> : null}>
    <div className={cn("grid gap-x-6 gap-y-3", perLine === 2 && "grid-cols-2")}>
      {(pages[current] ?? []).map((token) => <Parameter key={token.name} token={token} family={family} className={cn(perLine === 2 && token.swatches && "col-span-2")} />)}
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

/**
 * Reset: the family back to Today, its decided values — or, designed version by version, to the version's. An action
 * (Motion.md M24) goes back to its version's values, and its draft saves them.
 */
export function ResetMotion({ family }: { family: Family }) {
  const studio = useStudio();
  const [message, setMessage] = React.useState("");
  const start = family.version !== undefined ? `Version ${family.version}` : "Today";
  return <>
    <CellButton label="Reset motion" title={`Reset motion to ${start}`} onClick={() => {
      studio.reset(family);
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
      await navigator.clipboard.writeText(settingsText(family, studio.values(family), studio.decided?.[family.id] ?? {}, `${from}${matched ? "" : ", tuned"}`));
      setMessage("Copied settings");
    } catch { setMessage("Copy failed. Try again."); }
  };
  return <>
    <CellButton label="Copy settings" title={message || "Copy settings"} onClick={copy}><Copy /></CellButton>
    <Text role="caption" className="sr-only" aria-live="polite">{message}</Text>
  </>;
}
