"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import { ColourPicker } from "@no-origins/ui/components/colour-picker";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@no-origins/ui/components/dropdown-menu";
import { Label } from "@no-origins/ui/components/label";
import { Progress } from "@no-origins/ui/components/progress";
import { Separator } from "@no-origins/ui/components/separator";
import { Slider } from "@no-origins/ui/components/slider";
import { Switch } from "@no-origins/ui/components/switch";
import { Text } from "@no-origins/ui/components/text";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";

/**
 * The accent jig (2026-09-27, his: "for the questions that you have, give me a jig so that I can tweak and check").
 * Dev only, on `?jig`: a panel that retunes the live page — the design system's primary, secondary, the hover-and-
 * active fill (`--muted`) and the menus' highlight (`--accent`) as neutral, lime or violet, and the work column's
 * active tab (Portfolio.md P4) — by writing one stylesheet over globals.css, and prints the settings to send back.
 * `d` still flips the theme, so both can be checked.
 *
 * His settings from it are what shipped the same day (globals.css, `profile-work.tsx`), and they are its `DEFAULTS`,
 * so an untouched jig changes nothing. **It stays** (his: "do not remove the jig. I want them to be showcased later in
 * experiments"). "Neutral" writes shadcn's neutral greys back, per theme, so the old system is one press away.
 */

type Hue = "neutral" | "lime" | "violet";
type NameOnLight = "lime" | "dark" | "deep";
type Settings = {
  primary: Hue;
  secondary: Hue;
  fill: Hue;
  fillStrength: number;
  menu: Hue;
  menuStrength: number;
  tabFill: number;
  tabRing: "1" | "3";
  tabNameLight: NameOnLight;
  deepL: number;
};

/** What shipped on 2026-09-27, his settings from this jig. */
const DEFAULTS: Settings = {
  primary: "lime",
  secondary: "violet",
  fill: "lime",
  fillStrength: 14,
  menu: "lime",
  menuStrength: 4,
  tabFill: 12,
  tabRing: "1",
  tabNameLight: "dark",
  deepL: 0.62,
};

/** shadcn's neutral values, as globals.css had them until 2026-09-27: [colour, ink] per theme. */
const NEUTRAL = {
  light: { primary: ["oklch(0.205 0 0)", "oklch(0.985 0 0)"], secondary: ["oklch(0.97 0 0)", "oklch(0.205 0 0)"], muted: "oklch(0.97 0 0)", accent: "oklch(0.97 0 0)" },
  dark: { primary: ["oklch(0.922 0 0)", "oklch(0.205 0 0)"], secondary: ["oklch(0.269 0 0)", "oklch(0.985 0 0)"], muted: "oklch(0.269 0 0)", accent: "oklch(0.269 0 0)" },
} as const;

const KEY = "no-origins:jig";
/** The ink on a solid lime or violet: globals.css's `--lime-foreground`, and the dark theme's white on violet. */
const INK: Record<Exclude<Hue, "neutral">, string> = { lime: "var(--lime-foreground)", violet: "oklch(0.985 0 0)" };

const tint = (hue: Exclude<Hue, "neutral">, strength: number, over: string) => `color-mix(in oklch, var(--${hue}) ${strength}%, var(${over}))`;

/** The stylesheet the settings come to, written after globals.css so it wins at the same specificity. */
function stylesheet(s: Settings) {
  const tokens = (theme: keyof typeof NEUTRAL) => {
    const n = NEUTRAL[theme];
    const solid = (hue: Hue, [colour, ink]: readonly [string, string]) => (hue === "neutral" ? [colour, ink] : [`var(--${hue})`, INK[hue]]);
    const [primary, primaryInk] = solid(s.primary, n.primary);
    const [secondary, secondaryInk] = solid(s.secondary, n.secondary);
    return [
      `--primary: ${primary}; --primary-foreground: ${primaryInk};`,
      `--secondary: ${secondary}; --secondary-foreground: ${secondaryInk};`,
      `--muted: ${s.fill === "neutral" ? n.muted : tint(s.fill, s.fillStrength, "--background")};`,
      `--accent: ${s.menu === "neutral" ? n.accent : tint(s.menu, s.menuStrength, "--popover")};`,
    ].join(" ");
  };
  const nameOnLight = { lime: "var(--lime)", dark: "var(--foreground)", deep: `oklch(${s.deepL} 0.196 119.552)` }[s.tabNameLight];
  return [
    `:root:not(.dark), .light { ${tokens("light")} }`,
    `.dark { ${tokens("dark")} }`,
    `[data-tab][aria-selected="true"] { background-color: ${tint("lime", s.tabFill, "--card")} !important; border-width: ${s.tabRing}px !important; }`,
    `:root:not(.dark) [data-tab][aria-selected="true"] [data-name] { color: ${nameOnLight} !important; }`,
  ].join("\n");
}

function settingsText(s: Settings) {
  const hue = (h: Hue, strength?: number) => (h === "neutral" ? "neutral (shadcn)" : strength === undefined ? h : `${h} ${strength}%`);
  const name = { lime: "lime", dark: "dark ink", deep: `deeper lime, L ${s.deepL.toFixed(2)}` }[s.tabNameLight];
  return [
    `primary: ${hue(s.primary)}`,
    `secondary: ${hue(s.secondary)}`,
    `hover and active fill (--muted): ${hue(s.fill, s.fillStrength)}`,
    `menu highlight (--accent): ${hue(s.menu, s.menuStrength)}`,
    `work tab: lime ring ${s.tabRing}px, lime fill ${s.tabFill}%, name on light ${name}`,
  ].join("\n");
}

const never = () => () => {};

/** On `?jig` in development only; the server and the first client render never have it, so nothing mismatches. */
export function Jig() {
  const on = useSyncExternalStore(
    never,
    () => process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("jig"),
    () => false,
  );
  return on ? <JigPanel /> : null;
}

/** The saved settings, read once the panel mounts — in the browser only, since `Jig` never renders it on the server. */
function saved(): Settings {
  try {
    const text = window.localStorage.getItem(KEY);
    return text ? { ...DEFAULTS, ...(JSON.parse(text) as Partial<Settings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function JigPanel() {
  const [open, setOpen] = useState(true);
  const [s, setS] = useState<Settings>(saved);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.jig = "";
    style.textContent = stylesheet(s);
    document.head.append(style);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
    return () => style.remove();
  }, [s]);

  const set = (next: Partial<Settings>) => setS((prev) => ({ ...prev, ...next }));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(settingsText(s));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="fixed top-4 left-4 z-[60] bg-card" onClick={() => setOpen(true)}>
        Jig
      </Button>
    );
  }

  return (
    <Card size="sm" className="fixed top-4 left-4 z-[60] max-h-[calc(100dvh-2rem)] w-80 gap-4 overflow-y-auto shadow-lg">
      <CardHeader className="flex items-center justify-between">
        <Text role="heading" as="h2">Accent jig</Text>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setS(DEFAULTS)}>Reset</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Hide</Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Text role="caption">Changes the live page. Press d to flip the theme.</Text>

        <HueControl label="Primary" touches="Default buttons, the pager's current page, progress, checkbox, switch, slider" value={s.primary} onChange={(primary) => set({ primary })} />
        <HueControl label="Secondary" touches="Secondary buttons, bubbles" value={s.secondary} onChange={(secondary) => set({ secondary })} />
        <HueControl
          label="Hover and active fill"
          touches="--muted: the gray on toggles, outline and ghost hovers, the work tabs' hover"
          value={s.fill}
          onChange={(fill) => set({ fill })}
          strength={s.fillStrength}
          onStrength={(fillStrength) => set({ fillStrength })}
        />
        <HueControl
          label="Menu highlight"
          touches="--accent: the highlighted item in menus and selects"
          value={s.menu}
          onChange={(menu) => set({ menu })}
          strength={s.menuStrength}
          onStrength={(menuStrength) => set({ menuStrength })}
        />

        <Separator />
        <Text role="label">Work tab, active</Text>
        <Control label="Ring" touches="Lime outline width">
          <ToggleGroup type="single" variant="outline" size="sm" value={s.tabRing} onValueChange={(v) => v && set({ tabRing: v as Settings["tabRing"] })}>
            <ToggleGroupItem value="1">1px</ToggleGroupItem>
            <ToggleGroupItem value="3">3px (accent stroke)</ToggleGroupItem>
          </ToggleGroup>
        </Control>
        <Control label={`Lime fill ${s.tabFill}%`} touches="Lime mixed into the card, opaque">
          <Slider min={0} max={40} step={1} value={[s.tabFill]} onValueChange={([v]) => set({ tabFill: v ?? 0 })} />
        </Control>
        <Control label="Name on light" touches="Lime is about 1.3 : 1 on white">
          <ColourPicker
            aria-label="Name on light"
            value={s.tabNameLight}
            onValueChange={(v) => set({ tabNameLight: v as NameOnLight })}
            options={[
              { value: "lime", label: "Lime", colour: "var(--lime)" },
              { value: "dark", label: "Dark", colour: "var(--foreground)" },
              { value: "deep", label: "Deeper lime", colour: `oklch(${s.deepL} 0.196 119.552)` },
            ]}
          />
          {s.tabNameLight === "deep" ? (
            <Slider min={0.4} max={0.85} step={0.01} value={[s.deepL]} onValueChange={([v]) => set({ deepL: v ?? DEFAULTS.deepL })} />
          ) : null}
        </Control>

        <Separator />
        <Text role="label">What the tokens touch</Text>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Default</Button>
          <Button size="sm" variant="secondary">Secondary</Button>
          <Button size="sm" variant="outline">Outline</Button>
          <Button size="sm" variant="ghost">Ghost</Button>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox defaultChecked aria-label="A checkbox" />
          <Switch defaultChecked aria-label="A switch" />
          <ToggleGroup type="single" variant="outline" size="sm" defaultValue="on">
            <ToggleGroupItem value="on">On</ToggleGroupItem>
            <ToggleGroupItem value="off">Off</ToggleGroupItem>
          </ToggleGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Radise</DropdownMenuItem>
              <DropdownMenuItem>Dataflix</DropdownMenuItem>
              <DropdownMenuItem>Hashnode</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Progress value={60} aria-label="Progress" />

        <Separator />
        <Text role="label">Settings to send me</Text>
        <Text role="mono" as="pre" className="whitespace-pre-wrap">{settingsText(s)}</Text>
        <Button size="sm" variant="outline" onClick={copy}>{copied ? "Copied" : "Copy settings"}</Button>
      </CardContent>
    </Card>
  );
}

function Control({ label, touches, children }: { label: string; touches: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <Label>{label}</Label>
        <Text role="caption">{touches}</Text>
      </div>
      {children}
    </div>
  );
}

/** The hues as swatches, every pick of a colour being the colour picker (Character-Studio.md C17): Neutral, shadcn's grey. */
const HUE_SWATCHES = [
  { value: "neutral", label: "Neutral", colour: "oklch(0.556 0 0)" },
  { value: "lime", label: "Lime", colour: "var(--lime)" },
  { value: "violet", label: "Violet", colour: "var(--violet)" },
];

function HueControl({
  label, touches, value, onChange, strength, onStrength,
}: {
  label: string;
  touches: string;
  value: Hue;
  onChange: (hue: Hue) => void;
  strength?: number;
  onStrength?: (strength: number) => void;
}) {
  return (
    <Control label={strength !== undefined && value !== "neutral" ? `${label}, ${strength}%` : label} touches={touches}>
      <ColourPicker aria-label={label} value={value} onValueChange={(v) => onChange(v as Hue)} options={HUE_SWATCHES} />
      {strength !== undefined && onStrength && value !== "neutral" ? (
        <Slider min={4} max={60} step={1} value={[strength]} onValueChange={([v]) => onStrength(v ?? strength)} />
      ) : null}
    </Control>
  );
}
