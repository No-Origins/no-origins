"use client";

import { Fragment, useState, useSyncExternalStore, type ReactNode } from "react";
import { LockIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader } from "@no-origins/ui/components/card";
import { ColourPicker } from "@no-origins/ui/components/colour-picker";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import { Separator } from "@no-origins/ui/components/separator";
import { useSidebar } from "@no-origins/ui/components/sidebar";
import { Slider } from "@no-origins/ui/components/slider";
import { Text } from "@no-origins/ui/components/text";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import { cn } from "@no-origins/ui/lib/utils";

import { formatValue, jigSettings, lockOf, type Jig, type JigControl, type NumberControl } from "@/world/jig";
import type { SettingsStore } from "@/world/store";

/**
 * A jig's card (World.md W14; W10: the interface is the design system, over the world): every control of the jig,
 * grouped as it groups them, each change in the world at once. Play, where the jig has a motion, plays it again; Reset
 * goes back to his settings; Copy puts the settings on the clipboard, to send back.
 *
 * It is a card at a card's padding (`inset`, Spacing.md SP3; his: "I think we need more padding"). On a wide screen it
 * stands right of the sidebar, its middle at the page's (his: "Let the jigs align center"), held between the page's top
 * and foot, its height its own; on a phone, along the bottom, at most half the height. Either way its controls scroll
 * inside it (a grid, so the scrolling row has a height under the card's maximum, where a flex column's has none). The
 * world centres what it looks at in the room the card leaves (`data-world-aside`).
 *
 * A control is its label with its value after it, then the control under them, 8 below; two to a row, 12 apart; a
 * colour, a choice or a name takes a row of its own. A group with no controls is drawn by the page (`sections`, by the
 * group's title), under its name and note (`notes`, where the page knows what to say), as the sector's hierarchy is. A
 * value the hand moves in the world moves here too (the camera's, as it is dragged or zoomed); one the hand cannot move
 * now carries a lock after its value, and says why (`lockOf`). `copy` replaces what Copy sends, where the page sends
 * more than the jig's settings.
 */
export function JigCard<C extends object>({
  jig,
  store,
  onPlay,
  sections,
  notes,
  copy,
}: {
  jig: Jig<C>;
  store: SettingsStore<C>;
  onPlay?: () => void;
  sections?: Partial<Record<string, (config: C, set: (next: Partial<C>) => void) => ReactNode>>;
  notes?: Partial<Record<string, string>>;
  copy?: (config: C) => string;
}) {
  const config = useSyncExternalStore(store.subscribe, store.get, store.start);
  const { state } = useSidebar();
  const [copied, setCopied] = useState(false);

  return (
    <Card
      data-world-aside
      className={cn(
        "pointer-events-auto fixed inset-x-4 bottom-4 grid max-h-[50dvh] grid-rows-[auto_minmax(0,1fr)_auto] shadow-none",
        "md:inset-x-auto md:inset-y-4 md:my-auto md:h-fit md:max-h-[calc(100dvh-2rem)] md:w-96",
        state === "expanded" ? "md:left-[calc(var(--sidebar-width)+0.5rem)]" : "md:left-[calc(var(--sidebar-width-icon)+1.5rem)]",
      )}
    >
      <CardHeader>
        <Text role="heading" as="h1">{jig.name}</Text>
        <Text role="caption">Version {jig.version}</Text>
      </CardHeader>
      <ScrollArea className="min-h-0 flex-1">
        <CardContent className="flex flex-col gap-gutter">
          {jig.groups.map((group, i) => {
            const note = notes?.[group.title] ?? group.note?.(config);
            return (
              <Fragment key={group.title}>
                {i > 0 ? <Separator /> : null}
                <section className="flex flex-col gap-gutter">
                  {note ? (
                    <div className="flex flex-col gap-stack-tight">
                      <Text role="label" as="h2">{group.title}</Text>
                      <Text role="caption" tone="muted">{note}</Text>
                    </div>
                  ) : (
                    <Text role="label" as="h2">{group.title}</Text>
                  )}
                  {sections?.[group.title] ? (
                    sections[group.title]?.(config, store.set)
                  ) : (
                    <JigControls jig={jig} title={group.title} controls={group.controls} config={config} set={store.set} />
                  )}
                </section>
              </Fragment>
            );
          })}
        </CardContent>
      </ScrollArea>
      <CardFooter className="gap-inline">
        {onPlay ? <Button variant="outline" size="sm" className="mr-auto" onClick={onPlay}>Play</Button> : null}
        <Button variant="outline" size="sm" className={onPlay ? undefined : "ml-auto"} onClick={() => store.reset()}>Reset</Button>
        <Button
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(copy ? copy(config) : jigSettings(jig, config)).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * A group's controls, two to a row, bound to a store's settings: a jig's, or another its page draws with them (the
 * sector's builder, `BUILD_CONTROLS`). With its jig, a control the hand cannot move now is locked (`lockOf`).
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
    if (c.kind === "colour") {
      return (
        <Control key={c.key} label={c.label} className="col-span-2">
          <ColourPicker options={c.options} value={config[c.key] as string} onValueChange={(value) => set({ [c.key]: value })} aria-label={name} />
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
    if (c.kind === "choice") {
      return (
        <Control key={c.key} label={c.label} className="col-span-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={config[c.key] as string}
            onValueChange={(value) => value && set({ [c.key]: value })}
            aria-label={name}
          >
            {c.options.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>{option.label}</ToggleGroupItem>
            ))}
          </ToggleGroup>
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

  return <div className="grid grid-cols-2 gap-gutter">{controls.map((c) => control(title, c))}</div>;
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
      <div className="flex min-h-6 min-w-0 items-center gap-inline">
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
      {children ? <div className="flex min-h-5 min-w-0 items-center">{children}</div> : null}
    </div>
  );
}
