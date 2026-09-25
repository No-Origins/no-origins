"use client";

import { ArrowRightIcon, BellIcon, CheckIcon, PlusIcon } from "lucide-react";

import { AspectRatio } from "@no-origins/ui/components/aspect-ratio";
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@no-origins/ui/components/avatar";
import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Checkbox } from "@no-origins/ui/components/checkbox";
import { Input } from "@no-origins/ui/components/input";
import { Kbd, KbdGroup } from "@no-origins/ui/components/kbd";
import { Label } from "@no-origins/ui/components/label";
import { Marker, MarkerContent, MarkerIcon } from "@no-origins/ui/components/marker";
import { NativeSelect, NativeSelectOption } from "@no-origins/ui/components/native-select";
import { Progress } from "@no-origins/ui/components/progress";
import { Separator } from "@no-origins/ui/components/separator";
import { Skeleton } from "@no-origins/ui/components/skeleton";
import { Slider } from "@no-origins/ui/components/slider";
import { Spinner } from "@no-origins/ui/components/spinner";
import { Switch } from "@no-origins/ui/components/switch";
import { Textarea } from "@no-origins/ui/components/textarea";
import { Toggle } from "@no-origins/ui/components/toggle";

import { band, half, quarter, SectionHeader, Specimen } from "@/components/specimen";
import type { PageContent } from "@/content";

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const;
const BADGE_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;

/**
 * Every specimen, in reading order, with its size in cells — the one design decision each one carries now that the
 * page is a field (Grid.md D1) rather than a column. A box that clips its content is too small; make it bigger here.
 */
export const ATOMS: PageContent = {
  title: "Atoms",
  variant: "card",
  sections: [
    {
      id: "atoms",
      items: [
      {
        id: "header",
        span: band(1),
        variant: "none",
        render: (placed) => <SectionHeader index="01" label="Atoms · 18 components" title="The indivisible ones" cols={placed.colSpan} />,
      },
      {
        id: "Button",
        // Six columns on lg (420px) wrap the variants and the sizes to two rows each: a row more there.
        span: { ...half(4), lg: { cols: 6, rows: 5 } },
        render: () => (
          <Specimen name="Button" note="Six variants, four sizes, four icon sizes. `asChild` hands the styling to a link.">
            <div className="flex flex-wrap items-center gap-3">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant}
                </Button>
              ))}
            </div>
            <div className="flex w-full flex-wrap items-center gap-3">
              {BUTTON_SIZES.map((size) => (
                <Button key={size} size={size} variant="outline">
                  {size}
                </Button>
              ))}
              <Button size="icon" aria-label="Add">
                <PlusIcon />
              </Button>
              <Button size="icon-sm" variant="outline" aria-label="Add">
                <PlusIcon />
              </Button>
              <Button disabled>disabled</Button>
              <Button>
                Continue <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </Specimen>
        ),
      },
      {
        id: "Badge",
        span: half(2),
        render: () => (
          <Specimen name="Badge" note="A label that counts or states. Same six variants as the button, at label scale.">
            {BADGE_VARIANTS.map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ))}
            <Badge>
              <CheckIcon /> shipped
            </Badge>
          </Specimen>
        ),
      },
      {
        id: "Input",
        // Six columns on lg stack the three fields: a row more there.
        span: { ...half(4), lg: { cols: 6, rows: 5 } },
        render: () => (
          <Specimen name="Input" note="One line of text, and the same box every other field is measured against.">
            <div className="w-64 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@no-origins.com" />
            </div>
            <div className="w-64 space-y-2">
              <Label htmlFor="disabled">Disabled</Label>
              <Input id="disabled" placeholder="Not now" disabled />
            </div>
            <div className="w-64 space-y-2">
              <Label htmlFor="invalid">Invalid</Label>
              <Input id="invalid" defaultValue="nope" aria-invalid />
            </div>
          </Specimen>
        ),
      },
      {
        id: "Textarea",
        span: half(3),
        render: () => (
          <Specimen name="Textarea" note="The same box, several lines tall.">
            <Textarea className="w-80" placeholder="What are you building?" rows={3} />
          </Specimen>
        ),
      },
      {
        id: "Label",
        span: quarter(3),
        render: () => (
          <Specimen name="Label" note="Names a control and clicks through to it.">
            <Label htmlFor="named">A label</Label>
            <Input id="named" className="w-48" placeholder="…names this" />
          </Specimen>
        ),
      },
      {
        id: "Checkbox",
        span: half(3),
        render: () => (
          <Specimen name="Checkbox" note="Three states: off, on, indeterminate.">
            <div className="flex items-center gap-2">
              <Checkbox id="c1" />
              <Label htmlFor="c1">Off</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="c2" defaultChecked />
              <Label htmlFor="c2">On</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="c3" checked="indeterminate" />
              <Label htmlFor="c3">Indeterminate</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="c4" disabled />
              <Label htmlFor="c4">Disabled</Label>
            </div>
          </Specimen>
        ),
      },
      {
        id: "Switch",
        span: half(2),
        render: () => (
          <Specimen name="Switch" note="An instant setting — it commits on flip, never on submit.">
            <div className="flex items-center gap-2">
              <Switch id="s1" />
              <Label htmlFor="s1">Off</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="s2" defaultChecked />
              <Label htmlFor="s2">On</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="s3" disabled />
              <Label htmlFor="s3">Disabled</Label>
            </div>
          </Specimen>
        ),
      },
      {
        id: "Toggle",
        span: half(3),
        render: () => (
          <Specimen name="Toggle" note="A button that stays pressed.">
            <Toggle>Default</Toggle>
            <Toggle variant="outline">Outline</Toggle>
            <Toggle defaultPressed>Pressed</Toggle>
            <Toggle size="sm" variant="outline">
              Small
            </Toggle>
            <Toggle size="lg" variant="outline">
              Large
            </Toggle>
          </Specimen>
        ),
      },
      {
        id: "Slider",
        span: half(2),
        render: () => (
          <Specimen name="Slider" note="One value or a range, on a track.">
            <Slider defaultValue={[40]} max={100} step={1} className="w-72" />
            <Slider defaultValue={[20, 70]} max={100} step={1} className="w-72" />
          </Specimen>
        ),
      },
      {
        id: "Progress",
        span: half(2),
        render: () => (
          <Specimen name="Progress" note="Determinate only — if you cannot measure it, use the spinner.">
            <Progress value={32} className="w-72" />
            <Progress value={78} className="w-72" />
          </Specimen>
        ),
      },
      {
        id: "Spinner",
        span: quarter(2),
        render: () => (
          <Specimen name="Spinner" note="The indeterminate wait.">
            <Spinner />
            <Spinner className="size-6" />
            <Button disabled>
              <Spinner /> Saving
            </Button>
          </Specimen>
        ),
      },
      {
        id: "Skeleton",
        span: { ...half(2), base: { cols: 4, rows: 3 } },
        render: () => (
          <Specimen name="Skeleton" note="The shape of content that has not arrived.">
            <div className="w-72 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
            <Skeleton className="size-12 rounded-full" />
          </Specimen>
        ),
      },
      {
        id: "Separator",
        span: half(3),
        render: () => (
          <Specimen name="Separator" note="A hairline, either way.">
            <div className="w-72">
              <p className="text-sm">Above</p>
              <Separator className="my-3" />
              <p className="text-sm">Below</p>
            </div>
            <div className="flex h-12 items-center gap-3 text-sm">
              <span>Left</span>
              <Separator orientation="vertical" />
              <span>Right</span>
            </div>
          </Specimen>
        ),
      },
      {
        id: "Avatar",
        span: half(2),
        render: () => (
          <Specimen name="Avatar" note="A person, with a fallback for when there is no picture — and a group for when there are many.">
            <Avatar>
              <AvatarFallback>BR</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>NO</AvatarFallback>
              <AvatarBadge />
            </Avatar>
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>B</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+4</AvatarGroupCount>
            </AvatarGroup>
          </Specimen>
        ),
      },
      {
        id: "Kbd",
        span: quarter(2),
        render: () => (
          <Specimen name="Kbd" note="A key, and a chord of them.">
            <Kbd>K</Kbd>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
          </Specimen>
        ),
      },
      {
        id: "NativeSelect",
        span: quarter(2),
        render: () => (
          <Specimen name="NativeSelect" note="The platform's own dropdown — the right one on a phone.">
            <NativeSelect className="w-56" defaultValue="portfolio">
              <NativeSelectOption value="portfolio">Portfolio</NativeSelectOption>
              <NativeSelectOption value="design">Design</NativeSelectOption>
              <NativeSelectOption value="admin">Admin</NativeSelectOption>
            </NativeSelect>
          </Specimen>
        ),
      },
      {
        id: "Marker",
        span: quarter(3),
        render: () => (
          <Specimen name="Marker" note="A bullet with a job — it marks a line rather than decorating it.">
            <div className="space-y-2">
              <Marker>
                <MarkerIcon>
                  <BellIcon />
                </MarkerIcon>
                <MarkerContent>Default</MarkerContent>
              </Marker>
              <Marker variant="separator">
                <MarkerContent>Separator</MarkerContent>
              </Marker>
              <Marker variant="border">
                <MarkerContent>Border</MarkerContent>
              </Marker>
            </div>
          </Specimen>
        ),
      },
      {
        id: "AspectRatio",
        // The boxes are sized so the two stand side by side inside a half on lg (380 of the 396px inside the inset) and stack on a phone.
        span: half(4),
        render: () => (
          <Specimen name="AspectRatio" note="Holds a box's shape while what goes in it loads.">
            <div className="w-60">
              <AspectRatio ratio={16 / 9} className="bg-muted flex items-center justify-center">
                <span className="text-muted-foreground font-mono text-xs">16 / 9</span>
              </AspectRatio>
            </div>
            <div className="w-32">
              <AspectRatio ratio={1} className="bg-muted flex items-center justify-center">
                <span className="text-muted-foreground font-mono text-xs">1 / 1</span>
              </AspectRatio>
            </div>
          </Specimen>
        ),
      },
      ],
    },
  ],
};
