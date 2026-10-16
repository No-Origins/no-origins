"use client";

import { useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { ClipboardListIcon, CloudUploadIcon, CopyIcon, CopyPlusIcon, LockIcon, PlayIcon, RotateCcwIcon, SaveIcon, Trash2Icon, type LucideIcon } from "lucide-react";

import { AUTH_APP, appOrigin } from "@no-origins/auth/apps";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import { ColourPicker } from "@no-origins/ui/components/colour-picker";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@no-origins/ui/components/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@no-origins/ui/components/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@no-origins/ui/components/select";
import { useSidebar } from "@no-origins/ui/components/sidebar";
import { Slider } from "@no-origins/ui/components/slider";
import { Switch } from "@no-origins/ui/components/switch";
import { Text } from "@no-origins/ui/components/text";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import { cn } from "@no-origins/ui/lib/utils";

import { formatValue, jigSettings, lockOf, type Jig, type JigControl, type NumberControl, type SwitchControl } from "@/world/jig";
import type { LibraryStore } from "@/world/library";
import type { SettingsStore } from "@/world/store";
import { nextName } from "@/world/variants";

/**
 * The card's library (World.md W72, W73, W75): the element's variants in the database, the settings the card would
 * save (its own store's, the world's for the World and Sectors cards, the whole environment's for an Environment
 * page's), how a picked variant is loaded, and whether the library is one item (the world, the environment) rather
 * than variants to choose among.
 */
export type CardLibrary<S> = { store: LibraryStore<S>; current?: S; apply?: (settings: S) => void; single?: boolean };

/** A jig's card pads at the pill's inset (Spacing.md SP6), between its parts too: folded to its name, it is a pill. */
const JIG_CARD = "shadow-none [--card-spacing:var(--space-inset-pill)]";

/**
 * A jig's card (World.md W14; W10: the interface is the design system, over the world): every control of the jig,
 * grouped as it groups them, each change in the world at once. Its actions are icon buttons beside its name, each a
 * click away and named in its tooltip (W76; his: "instead of giving options in the drop-down … convert them into icon
 * buttons for easy clicking"): Play, where the jig has a motion, plays it again; Reset goes back to his settings, or to
 * the variant picked as saved; Copy puts the settings on the clipboard, to send back.
 *
 * It is cards at the pill's padding (`inset-pill`, Spacing.md SP6), so a group folded to its name is a pill and an open
 * one keeps its name and controls on one edge, the card's own gap under its name. On a wide screen the column is six
 * cells wide (a studio's jig, Motion.md M15), so a family of nine swatches keeps its one row inside the inset; it stands
 * right of the sidebar, its middle at the page's (his: "Let the jigs align center"), held between the page's top
 * and foot, its height its own; on a phone, along the bottom, at most half the height. Either way its controls scroll
 * inside a constrained column, with separate foldable group cards adapted from Motion Studio (W52). The
 * world centres what it looks at in the room the card leaves (`data-world-aside`). A second card stands at the other
 * side (`side` "end", W89: the Sectors page's item card, his: "the controls related to the element should be on the
 * right"): on the right on a wide screen, along the top of a phone, both under the compass.
 *
 * A control is its label with its value after it, then the control under them, 8 below; two to a row, 12 apart; a
 * switch is its label with the switch after it and nothing under, or, where it turns its group's part on and off
 * (`heads`), on the group's header, before its arrow, a click away even while the group is folded (W76); a colour (its picked name after its label, its
 * swatches in rows by family), a choice or a name takes a row of its own. A group with no controls is drawn by the page (`sections`, by the
 * group's title), under its name and note (`notes`, where the page knows what to say), as the Sectors page's sectors and zones are. A
 * value the hand moves in the world moves here too (the camera's, as it is dragged or zoomed); one the hand cannot move
 * now carries a lock after its value, and says why (`lockOf`). `copy` replaces what Copy sends, where the page sends
 * more than the jig's settings.
 *
 * **With a library** (W72, W73; his: "I should just see the mountain and a dropdown of variants that I have created and
 * saved"), the card is the element's studio: a Variants group first, the picked one in a Select, its actions after it
 * (Save, Publish, New variant, and Delete, which asks first) and its Name under; the card tunes the one picked, the
 * version line says Unsaved while it is tuned away from the draft, and Reset goes back to it. The world's cards and the
 * environment's have one item each, unnamed (W75), so Save and Publish stand with the card's own actions, each Publish
 * the next version.
 * What the database says of the last save, and who may save, is said under the name;
 * a visitor is offered the sign-in (Orbit.md C24).
 */
export function JigCard<C extends object, S = C>({
  jig,
  store,
  onPlay,
  sections,
  notes,
  copy,
  library,
  open,
  embedded = false,
  resettable = true,
  side = "start",
  below,
  actions,
}: {
  jig: Jig<C>;
  store: SettingsStore<C>;
  onPlay?: () => void;
  sections?: Partial<Record<string, (config: C, set: (next: Partial<C>) => void) => ReactNode>>;
  notes?: Partial<Record<string, string>>;
  copy?: (config: C) => string;
  library?: CardLibrary<S>;
  /** The groups open as the card arrives: its first two, unless the page says which. */
  open?: readonly string[];
  embedded?: boolean;
  resettable?: boolean;
  /** Where the card stands: right of the sidebar ("start"), or at the far side ("end", W89), along the top of a phone. */
  side?: "start" | "end";
  /** How far down the far side's card starts on a wide screen: under the compass, or under the map where it is shown. */
  below?: string;
  /** The page's own actions, icon buttons first among the card's (the World page's Full view, W105). */
  actions?: ReactNode;
}) {
  const config = useSyncExternalStore(store.subscribe, store.get, store.start);
  const lib = useSyncExternalStore(library?.store.subscribe ?? noSubscribe, library?.store.get ?? noLibrary, library?.store.start ?? noLibrary);
  const picked = library ? library.store.picked() : undefined;
  // The settings the card would save: its own, or what the page says they are (the world's).
  const current = (library?.current ?? config) as S;
  const apply = library?.apply ?? ((settings: S) => store.set(settings as unknown as Partial<C>));
  const unsaved = !!picked && JSON.stringify(current) !== JSON.stringify(picked.settings);
  const editor = !!lib && lib.who === "editor";
  const reset = () => (picked ? apply(picked.settings) : store.reset());
  const { state } = useSidebar();
  const [copied, setCopied] = useState(false);
  // The sign-in, for a visitor (Orbit.md C24): the login app, coming back here; read off the window once the card is up.
  const here = useSyncExternalStore(noSubscribe, () => window.location.href, () => null);
  const signIn = lib?.who === "visitor" && here ? `${appOrigin(AUTH_APP, here)}/sign-in?next=${encodeURIComponent(here)}` : null;
  const ControlsFrame = embedded ? "div" : ScrollArea;
  const send = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true); window.setTimeout(() => setCopied(false), 1500);
    });
  };
  const standing = picked ? [picked.version ? `Published ${picked.version}` : "Not published", picked.ahead ? "draft ahead" : null].filter(Boolean).join(" · ") : null;
  const single = !!library?.single;
  const save = () => void library?.store.save(current);
  const publishNow = () => void library?.store.publish(current);
  const takeAway = async () => {
    if (!library) return;
    const gone = await library.store.remove();
    const now = library.store.picked();
    if (gone.ok && now) apply(now.settings);
  };

  return (
    <div
      data-world-aside={embedded ? undefined : ""}
      data-jig={jig.name}
      style={side === "end" ? ({ "--aside-below": below ?? "8rem" } as CSSProperties) : undefined}
      className={embedded ? "flex min-h-0 flex-col gap-gutter" : cn(
        "pointer-events-auto fixed inset-x-4 grid grid-rows-[auto_minmax(0,1fr)] gap-gutter",
        "md:inset-x-auto md:my-auto md:h-fit",
        // The far side's card stands under the compass (`world-compass.tsx`, top right), as the map does: on a phone
        // along the top, the first along the bottom, sharing the height; on a wide screen on the right, six cells wide
        // where there is room, and never over the first card: on a narrower screen it narrows to what is left (W91).
        side === "end"
          ? cn(
              "top-32 max-h-[30dvh] md:top-(--aside-below) md:bottom-4 md:right-4 md:ml-auto md:w-auto md:max-w-[calc(var(--grid-cell)*6+var(--space-gutter)*5)] md:max-h-[calc(100dvh-var(--aside-below)-1rem)]",
              state === "expanded" ? "md:left-[calc(var(--sidebar-width)+1.5rem+var(--grid-cell)*6+var(--space-gutter)*5)]" : "md:left-[calc(var(--sidebar-width-icon)+2.5rem+var(--grid-cell)*6+var(--space-gutter)*5)]",
            )
          : cn("bottom-4 max-h-[50dvh] md:inset-y-4 md:max-h-[calc(100dvh-2rem)] md:w-[calc(var(--grid-cell)*6+var(--space-gutter)*5)]", state === "expanded" ? "md:left-[calc(var(--sidebar-width)+0.5rem)]" : "md:left-[calc(var(--sidebar-width-icon)+1.5rem)]"),
      )}
    >
      <Card className={cn("shrink-0", JIG_CARD)}>
        <CardHeader className="flex items-center justify-between gap-inline">
          <div className="flex min-w-0 flex-col gap-stack-tight">
            <Text role="heading" as="h1">{jig.name}</Text>
            <Text role="caption">Version {jig.version}{unsaved ? " · Unsaved" : ""}{copied ? " · Copied" : ""}</Text>
          </div>
          <IconActions label={`${jig.name} actions`}>
            {actions}
            {onPlay ? <IconAction label="Play" icon={PlayIcon} onClick={onPlay} /> : null}
            {single && lib ? <IconAction label="Save" icon={SaveIcon} disabled={!editor || !unsaved} onClick={save} /> : null}
            {single && lib ? <IconAction label="Publish" icon={CloudUploadIcon} disabled={!editor || !lib.may.publish || !(unsaved || picked?.ahead || !picked?.version)} onClick={publishNow} /> : null}
            {resettable ? <IconAction label="Reset" icon={RotateCcwIcon} onClick={reset} /> : null}
            <IconAction label="Copy settings" icon={CopyIcon} onClick={() => send(copy ? copy(config) : jigSettings(jig, config))} />
            {lib && !single ? <IconAction label="Copy variants" icon={ClipboardListIcon} onClick={() => send([`${jig.name} variants, version ${jig.version}`, ...lib.variants.map((variant) => `${variant.name}: ${JSON.stringify(variant.settings)}`)].join("\n"))} /> : null}
          </IconActions>
        </CardHeader>
        {lib ? (
          <CardContent className="flex flex-col gap-stack-tight">
            <Text role="caption" tone="muted" aria-live="polite">{lib.who === "loading" ? "Reading the published ones…" : [standing, lib.note].filter(Boolean).join(" · ") || "Saved."}</Text>
            {signIn ? <Button asChild variant="link" size="sm" className="h-auto w-fit p-0"><a href={signIn}>Sign in</a></Button> : null}
          </CardContent>
        ) : null}
      </Card>
      <ControlsFrame className="min-h-0">
        <div className="flex flex-col gap-gutter">
          {library && lib && picked && !single ? (
            <Card className={JIG_CARD}>
              <CardHeader><Text role="label" as="h2">Variants</Text></CardHeader>
              <CardContent className="flex flex-col gap-gutter">
                <Text role="caption" tone="muted">{`The ${jig.name.toLowerCase()}'s variants, each named: the card tunes the one picked, Save keeps what is tuned as its draft, Publish makes the draft the version the world shows, New variant keeps it as another, and Reset goes back to the draft.`}</Text>
                <div className="flex min-w-0 items-center gap-inline">
                  <Select value={picked.id} onValueChange={(id) => { const variant = lib.variants.find((v) => v.id === id); if (!variant) return; library.store.pick(id); apply(variant.settings); }}>
                    <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label={`${jig.name} variant`}><SelectValue /></SelectTrigger>
                    <SelectContent>{lib.variants.map((variant) => <SelectItem key={variant.id} value={variant.id} textValue={variant.name}>{variant.name}{variant.version ? "" : " · not published"}{variant.ahead ? " · draft" : ""}</SelectItem>)}</SelectContent>
                  </Select>
                  <IconActions label={`${jig.name} variant actions`}>
                    <IconAction label="Save" icon={SaveIcon} disabled={!editor || !unsaved} onClick={save} />
                    <IconAction label="Publish" icon={CloudUploadIcon} disabled={!editor || !lib.may.publish || !(unsaved || picked.ahead || !picked.version)} onClick={publishNow} />
                    <IconAction label="New variant" icon={CopyPlusIcon} disabled={!editor} onClick={() => void library.store.create(nextName(picked.name, lib.variants.map((v) => v.name)), current)} />
                    <IconAction
                      label="Delete"
                      icon={Trash2Icon}
                      destructive
                      disabled={!editor || !!picked.version || lib.variants.length < 2}
                      onClick={() => void takeAway()}
                      confirm={{ title: `Delete ${picked.name}?`, description: "It was never published, so its draft goes with it. This cannot be undone." }}
                    />
                  </IconActions>
                </div>
                <Control label="Name"><TypedText key={picked.id} value={picked.name} name={`${jig.name} variant name`} onCommit={(name) => void library.store.rename(name)} /></Control>
              </CardContent>
            </Card>
          ) : null}
          <Accordion type="multiple" defaultValue={open ? [...open] : jig.groups.slice(0, 2).map((g) => g.title)} className="flex flex-col gap-gutter">
            {jig.groups.map((group) => {
              const note = notes?.[group.title] ?? group.note?.(config);
              // A switch that heads its group stands on the group's header, between its name and its arrow (W76).
              const heads = group.controls.find((c): c is SwitchControl<C> => c.kind === "switch" && !!c.heads);
              const controls = heads ? group.controls.filter((c) => c !== heads) : group.controls;
              return <Card key={group.title} className={JIG_CARD}>
                <AccordionItem value={group.title} className="border-0">
                  <CardHeader>
                    {heads ? (
                      // The arrow stays last (his: "It should be on the right"): the trigger runs the header's width, its
                      // arrow at the far end, and the switch stands over it in the same row, the arrow's width and a gap
                      // before that end. A switch cannot go inside the trigger, a button in a button. The gap is inline
                      // and inline-tight, 12px, no one job's: the system's switch takes a press 12px past its edge
                      // (sera's `after:-inset-x-3`), and at inline's 8px it would take the arrow's.
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center">
                        <div className="col-[1/-1] row-start-1">
                          <AccordionTrigger className="py-0"><Text role="label" as="h2">{group.title}</Text></AccordionTrigger>
                        </div>
                        <span className="relative col-start-2 row-start-1 me-[calc(var(--spacing)*3.5+var(--space-inline)+var(--space-inline-tight))] inline-flex justify-self-end">
                          <Tooltip>
                            {/* On a span: the trigger's own `data-state` would overwrite the switch's, and its on and off. */}
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Switch checked={config[heads.key] as boolean} onCheckedChange={(checked) => store.set({ [heads.key]: checked } as Partial<C>)} aria-label={heads.label} />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{heads.label}</TooltipContent>
                          </Tooltip>
                        </span>
                      </div>
                    ) : (
                      <AccordionTrigger className="py-0"><Text role="label" as="h2">{group.title}</Text></AccordionTrigger>
                    )}
                  </CardHeader>
                  {/* The card's own gap between its head and its content (`--card-spacing`), inside the part that folds. */}
                  <AccordionContent className="pt-(--card-spacing) pb-0">
                    <CardContent className="flex flex-col gap-gutter">
                      {note ? <Text role="caption" tone="muted">{note}</Text> : null}
                      {sections?.[group.title] ? sections[group.title]?.(config, store.set) : controls.length ? <JigControls jig={jig} title={group.title} controls={controls} config={config} set={store.set} /> : null}
                    </CardContent>
                  </AccordionContent>
                </AccordionItem>
              </Card>;
            })}
          </Accordion>
        </div>
      </ControlsFrame>
    </div>
  );
}

/**
 * A group's controls, two to a row, bound to a store's settings: a jig's, or another its page draws with them (the
 * Sectors page's builder, `BUILD_CONTROLS`). With its jig, a control the hand cannot move now is locked (`lockOf`).
 */
export function JigControls<C extends object>({
  jig,
  title,
  controls,
  config,
  set: setTo,
}: {
  jig?: Jig<C>;
  title: string;
  controls: readonly JigControl<C>[];
  config: C;
  set: (next: Partial<C>) => void;
}) {
  const set = (next: Record<string, unknown>) => setTo(next as Partial<C>);

  // Each control is named with its group, so two of one name (View's Height and Focus's) are told apart.
  const control = (group: string, c: JigControl<C>) => {
    const name = `${group} ${c.label.toLowerCase()}`;
    // A colour's picked name stands after its label, as a number's value does (his, 2026-10-14: he cannot tell the
    // pale ones apart by eye); the swatches stand in rows by family (`COLOURS`, Orbit.md C17).
    if (c.kind === "colour") {
      return (
        <Control key={c.key} label={c.label} value={<Text role="caption">{formatValue(c, config)}</Text>} className="col-span-2">
          <ColourPicker options={c.options} value={config[c.key] as string} onValueChange={(value) => set({ [c.key]: value })} aria-label={name} />
        </Control>
      );
    }
    // Several colours (World.md W92): the same swatches, each pressed one picked, every picked one named after the label.
    if (c.kind === "colours") {
      return (
        <Control key={c.key} label={c.label} value={<Text role="caption">{formatValue(c, config)}</Text>} className="col-span-2">
          <ColourPicker multiple options={c.options} value={config[c.key] as readonly string[]} onValueChange={(value) => set({ [c.key]: value })} aria-label={name} />
        </Control>
      );
    }
    // Several of a few choices (World.md W98): the design system's toggles, several pressed, in the options' order, never
    // none (letting the last one go keeps it), every picked one named after the label, as the Colours are.
    if (c.kind === "choices") {
      const picked = config[c.key] as readonly string[];
      return (
        <Control key={c.key} label={c.label} value={<Text role="caption">{formatValue(c, config)}</Text>} className="col-span-2">
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            className="w-full"
            value={[...picked]}
            onValueChange={(value) => {
              if (value.length) set({ [c.key]: c.options.map((option) => option.value).filter((option) => value.includes(option)) });
            }}
            aria-label={name}
          >
            {c.options.map((option) => <ToggleGroupItem key={option.value} value={option.value} className="flex-1">{option.label}</ToggleGroupItem>)}
          </ToggleGroup>
        </Control>
      );
    }
    if (c.kind === "text") {
      return (
        <Control key={c.key} label={c.label} className="col-span-2">
          <TypedText value={config[c.key] as string} name={name} onCommit={(text) => set({ [c.key]: text })} />
        </Control>
      );
    }
    if (c.kind === "switch") {
      return (
        <Control key={c.key} label={c.label} value={<Switch size="sm" checked={config[c.key] as boolean} onCheckedChange={(checked) => set({ [c.key]: checked })} aria-label={name} />} />
      );
    }
    if (c.kind === "choice") {
      return (
        <Control key={c.key} label={c.label} className="col-span-2">
          <Select value={config[c.key] as string} onValueChange={(value) => set({ [c.key]: value })}>
            <SelectTrigger size="sm" className="w-full" aria-label={name}><SelectValue /></SelectTrigger>
            <SelectContent>{c.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </Control>
      );
    }
    // A control with `to` is a range: one slider, a head at each end, its two values shown. A single number has its value
    // typed beside its label, as the motion studio's controls do: the slider is the design system's, snapping to its
    // marks as it does everywhere, and the field takes any value on its step (his: "Angle still doesn't provide 1
    // degree level control").
    const { key, to } = c;
    const value = to ? (
      <Text role="mono" as="span" className="shrink-0">{formatValue(c, config)}</Text>
    ) : (
      <TypedValue control={c} value={config[key] as number} name={name} onCommit={(typed) => set({ [key]: typed })} />
    );
    return (
      <Control key={key} label={c.label} value={value} locked={jig ? lockOf(jig, c, config) : undefined}>
        <Slider
          min={c.min}
          max={c.max}
          step={c.step}
          marks={c.marks ?? true}
          value={to ? [config[key] as number, config[to] as number] : [config[key] as number]}
          onValueChange={([value, end]) => {
            if (value === undefined) return;
            set(to && end !== undefined ? { [key]: value, [to]: end } : { [key]: value });
          }}
          aria-label={name}
        />
      </Control>
    );
  };

  return <div className="grid grid-cols-2 gap-x-inline gap-y-gutter">{controls.map((c) => control(title, c))}</div>;
}

/**
 * A number's value typed beside its label (the motion studio's `ParameterControl`): what it is now, moving as it moves,
 * or what is being typed. Enter, or leaving the field, sets it, on its step from its least, within its range; Escape lets
 * the typing go. Its unit follows it.
 */
export function TypedValue<C>({ control, value, name, onCommit }: { control: NumberControl<C>; value: number; name: string; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const decimals = (String(control.step).split(".")[1] ?? "").length;
  const commit = () => {
    if (draft !== null && draft.trim() && Number.isFinite(Number(draft))) {
      const stepped = control.min + Math.round((Number(draft) - control.min) / control.step) * control.step;
      onCommit(Number(Math.min(control.max, Math.max(control.min, stepped)).toFixed(decimals)));
    }
    setDraft(null);
  };
  return (
    <span className="flex shrink-0 items-center gap-inline-tight">
      <Input
        className="h-6 w-16 px-2 text-right"
        type="number"
        aria-label={`${name} value`}
        min={control.min}
        max={control.max}
        step={control.step}
        value={draft ?? value.toFixed(decimals)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setDraft(null);
        }}
      />
      {control.unit ? <Text role="caption">{control.unit}</Text> : null}
    </span>
  );
}

/**
 * A name typed in full (his, World.md W24): what it is now, or what is being typed. Enter, or leaving the field, sets
 * it; an empty one keeps the name it had; Escape lets the typing go.
 */
export function TypedText({ value, name, onCommit }: { value: string; name: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null && draft.trim() && draft.trim() !== value) onCommit(draft.trim());
    setDraft(null);
  };
  return (
    <Input
      aria-label={name}
      value={draft ?? value}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setDraft(null);
      }}
    />
  );
}

/** One control: its label with its value right after it, a lock where the hand cannot move it, and the control under them. */
export function Control({ label, value, locked, className, children }: { label: string; value?: ReactNode; locked?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-stack", className)}>
      <div className="flex min-h-6 min-w-0 flex-wrap items-center gap-inline-tight">
        <Label>{label}</Label>
        {value}
        {locked ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex shrink-0 self-center text-muted-foreground" aria-label={locked} role="img">
                <LockIcon className="size-3" aria-hidden />
              </span>
            </TooltipTrigger>
            <TooltipContent>{locked}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      {children ? <div className="flex min-h-5 min-w-0 flex-1 items-center">{children}</div> : null}
    </div>
  );
}

/** A row of a card's actions, after its name or its picker, named for a screen reader. */
export function IconActions({ label, children }: { label: string; children: ReactNode }) {
  return <div role="group" aria-label={label} className="flex shrink-0 items-center gap-inline-tight">{children}</div>;
}

/**
 * One of a card's actions as an icon button (World.md W76): a click does it, its tooltip and its accessible name say
 * what it is, and when it cannot be done now it is drawn off, its tooltip still naming it. One that cannot be undone
 * asks first (`confirm`), in the design system's alert dialog.
 */
export function IconAction({ label, icon: Icon, onClick, disabled, destructive, confirm }: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  confirm?: { title: string; description: string };
}) {
  const button = (
    <Button variant={destructive ? "destructive" : "ghost"} size="icon-sm" aria-label={label} disabled={disabled} onClick={confirm ? undefined : onClick}>
      <Icon />
    </Button>
  );
  // A disabled button takes no pointer, so the tooltip hangs on a span round it.
  const named = (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">{confirm ? <AlertDialogTrigger asChild>{button}</AlertDialogTrigger> : button}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
  if (!confirm) return named;
  return (
    <AlertDialog>
      {named}
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onClick}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** A card without a library: nothing to subscribe to, and no variants. */
const noSubscribe = () => () => {};
const noLibrary = () => null;
