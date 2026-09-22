"use client"

import * as React from "react"

import type { GridBreakpoint } from "@no-origins/ui/components/grid"

/**
 * The registry (Slots.md §3, S6): every component the composer's palette offers, with the slot a fresh drop makes,
 * the props the inspector edits (S4), and a lazy renderer. It lives in the package so the showcase's composer and
 * the admin's read the same list; each entry loads its component on first render, so a page rendering an exported
 * layout with one Input in it does not pull all sixty components.
 *
 * Not here yet: the components that are a trigger and a portal — Dialog, Sheet, Drawer, the menus, Popover, Tooltip,
 * HoverCard. In a slot they would show only their trigger; what that should look like is Slots.md §6.
 */

export type PropField =
  | { key: string; label: string; kind: "text"; default: string }
  | { key: string; label: string; kind: "select"; options: readonly string[]; default: string }
  | { key: string; label: string; kind: "boolean"; default: boolean }

export type RegistryGroup = "atom" | "molecule"

export type RegistryEntry = {
  kind: string
  name: string
  group: RegistryGroup
  /** The slot a drop makes, in cells — at the desktop cell; `spans` may say otherwise for a breakpoint. */
  span: { colSpan: number; rowSpan: number }
  spans?: Partial<Record<GridBreakpoint, { colSpan: number; rowSpan: number }>>
  /**
   * Whether the composer's Add list offers it. False for a component that only works somewhere particular — the
   * pager's arrows, which read the turn from context and so mean nothing outside the bar (Grid.md D29). It is still
   * registered, because `Placed` has to be able to render it.
   */
  palette?: boolean
  props: PropField[]
  /** Renders the component with its props. Lazy: the module is imported on first render. */
  View: React.ComponentType<{ props: Record<string, unknown> }>
}

type Props = Record<string, unknown>
const str = (p: Props, key: string, fallback = "") => (typeof p[key] === "string" ? (p[key] as string) : fallback)
const bool = (p: Props, key: string, fallback = false) => (typeof p[key] === "boolean" ? (p[key] as boolean) : fallback)
const list = (p: Props, key: string, fallback: string) =>
  str(p, key, fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

/** A lazy view over a module: `load` imports it, `view` draws it. */
function lazy<M>(load: () => Promise<M>, view: (m: M, props: Props) => React.ReactNode): RegistryEntry["View"] {
  const Lazy = React.lazy(() => load().then((m) => ({ default: ({ props }: { props: Props }) => <>{view(m, props)}</> })))
  return function View({ props }) {
    return (
      <React.Suspense fallback={<div className="bg-muted/40 h-full w-full" aria-hidden />}>
        <Lazy props={props} />
      </React.Suspense>
    )
  }
}

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const

export const REGISTRY: RegistryEntry[] = [
  // ── atoms ────────────────────────────────────────────────────────────────────────────────────────────────
  {
    kind: "text",
    name: "Text",
    group: "atom",
    span: { colSpan: 4, rowSpan: 1 },
    props: [
      { key: "text", label: "Text", kind: "text", default: "Some text" },
      { key: "role", label: "Role", kind: "select", options: ["display", "title", "heading", "label", "body", "caption", "mono"], default: "body" },
      { key: "tone", label: "Tone", kind: "select", options: ["foreground", "muted"], default: "foreground" },
      { key: "align", label: "Align", kind: "select", options: ["start", "center", "end"], default: "start" },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/text"),
      (m, p) => (
        <m.Text
          role={str(p, "role", "body") as (typeof m.TEXT_ROLES)[number]}
          tone={str(p, "tone", "foreground") as (typeof m.TEXT_TONES)[number]}
          align={str(p, "align", "start") as (typeof m.TEXT_ALIGNS)[number]}
        >
          {str(p, "text", "Some text")}
        </m.Text>
      ),
    ),
  },
  {
    kind: "button",
    name: "Button",
    group: "atom",
    span: { colSpan: 2, rowSpan: 1 },
    props: [
      { key: "label", label: "Label", kind: "text", default: "Button" },
      { key: "variant", label: "Variant", kind: "select", options: BUTTON_VARIANTS, default: "default" },
      { key: "size", label: "Size", kind: "select", options: BUTTON_SIZES, default: "default" },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/button"),
      (m, p) => (
        <m.Button variant={str(p, "variant", "default") as (typeof BUTTON_VARIANTS)[number]} size={str(p, "size", "default") as (typeof BUTTON_SIZES)[number]}>
          {str(p, "label", "Button")}
        </m.Button>
      ),
    ),
  },
  {
    kind: "badge",
    name: "Badge",
    group: "atom",
    span: { colSpan: 1, rowSpan: 1 },
    props: [
      { key: "label", label: "Label", kind: "text", default: "Badge" },
      { key: "variant", label: "Variant", kind: "select", options: BUTTON_VARIANTS, default: "default" },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/badge"),
      (m, p) => <m.Badge variant={str(p, "variant", "default") as (typeof BUTTON_VARIANTS)[number]}>{str(p, "label", "Badge")}</m.Badge>,
    ),
  },
  {
    kind: "input",
    name: "Input",
    group: "atom",
    span: { colSpan: 4, rowSpan: 1 },
    props: [
      { key: "placeholder", label: "Placeholder", kind: "text", default: "Type here" },
      { key: "type", label: "Type", kind: "select", options: ["text", "email", "password", "number", "search"], default: "text" },
      { key: "disabled", label: "Disabled", kind: "boolean", default: false },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/input"),
      (m, p) => <m.Input placeholder={str(p, "placeholder")} type={str(p, "type", "text")} disabled={bool(p, "disabled")} />,
    ),
  },
  {
    kind: "textarea",
    name: "Textarea",
    group: "atom",
    span: { colSpan: 4, rowSpan: 2 },
    props: [{ key: "placeholder", label: "Placeholder", kind: "text", default: "Write here" }],
    View: lazy(() => import("@no-origins/ui/components/textarea"), (m, p) => <m.Textarea placeholder={str(p, "placeholder")} className="h-full resize-none" />),
  },
  {
    kind: "label",
    name: "Label",
    group: "atom",
    span: { colSpan: 2, rowSpan: 1 },
    props: [{ key: "text", label: "Text", kind: "text", default: "A label" }],
    View: lazy(() => import("@no-origins/ui/components/label"), (m, p) => <m.Label>{str(p, "text", "A label")}</m.Label>),
  },
  {
    kind: "checkbox",
    name: "Checkbox",
    group: "atom",
    span: { colSpan: 2, rowSpan: 1 },
    props: [
      { key: "label", label: "Label", kind: "text", default: "Option" },
      { key: "checked", label: "Checked", kind: "boolean", default: false },
    ],
    View: lazy(
      () => Promise.all([import("@no-origins/ui/components/checkbox"), import("@no-origins/ui/components/label")]),
      ([c, l], p) => (
        <span className="flex items-center gap-2">
          <c.Checkbox defaultChecked={bool(p, "checked")} />
          <l.Label>{str(p, "label", "Option")}</l.Label>
        </span>
      ),
    ),
  },
  {
    kind: "switch",
    name: "Switch",
    group: "atom",
    span: { colSpan: 2, rowSpan: 1 },
    props: [
      { key: "label", label: "Label", kind: "text", default: "Setting" },
      { key: "checked", label: "On", kind: "boolean", default: false },
    ],
    View: lazy(
      () => Promise.all([import("@no-origins/ui/components/switch"), import("@no-origins/ui/components/label")]),
      ([c, l], p) => (
        <span className="flex items-center gap-2">
          <c.Switch defaultChecked={bool(p, "checked")} />
          <l.Label>{str(p, "label", "Setting")}</l.Label>
        </span>
      ),
    ),
  },
  {
    kind: "toggle",
    name: "Toggle",
    group: "atom",
    span: { colSpan: 2, rowSpan: 1 },
    props: [
      { key: "label", label: "Label", kind: "text", default: "Toggle" },
      { key: "variant", label: "Variant", kind: "select", options: ["default", "outline"], default: "outline" },
      { key: "pressed", label: "Pressed", kind: "boolean", default: false },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/toggle"),
      (m, p) => (
        <m.Toggle variant={str(p, "variant", "outline") as "default" | "outline"} defaultPressed={bool(p, "pressed")}>
          {str(p, "label", "Toggle")}
        </m.Toggle>
      ),
    ),
  },
  {
    kind: "slider",
    name: "Slider",
    group: "atom",
    span: { colSpan: 4, rowSpan: 1 },
    props: [{ key: "value", label: "Value", kind: "text", default: "40" }],
    View: lazy(() => import("@no-origins/ui/components/slider"), (m, p) => <m.Slider defaultValue={[Number(str(p, "value", "40")) || 0]} max={100} step={1} />),
  },
  {
    kind: "progress",
    name: "Progress",
    group: "atom",
    span: { colSpan: 4, rowSpan: 1 },
    props: [{ key: "value", label: "Value", kind: "text", default: "32" }],
    View: lazy(() => import("@no-origins/ui/components/progress"), (m, p) => <m.Progress value={Number(str(p, "value", "32")) || 0} />),
  },
  {
    kind: "spinner",
    name: "Spinner",
    group: "atom",
    span: { colSpan: 1, rowSpan: 1 },
    props: [],
    View: lazy(() => import("@no-origins/ui/components/spinner"), (m) => <m.Spinner />),
  },
  {
    kind: "skeleton",
    name: "Skeleton",
    group: "atom",
    span: { colSpan: 4, rowSpan: 1 },
    props: [],
    View: lazy(() => import("@no-origins/ui/components/skeleton"), (m) => <m.Skeleton className="h-full w-full" />),
  },
  {
    kind: "separator",
    name: "Separator",
    group: "atom",
    span: { colSpan: 4, rowSpan: 1 },
    props: [{ key: "orientation", label: "Orientation", kind: "select", options: ["horizontal", "vertical"], default: "horizontal" }],
    View: lazy(
      () => import("@no-origins/ui/components/separator"),
      (m, p) => <m.Separator orientation={str(p, "orientation", "horizontal") as "horizontal" | "vertical"} />,
    ),
  },
  {
    kind: "avatar",
    name: "Avatar",
    group: "atom",
    span: { colSpan: 1, rowSpan: 1 },
    props: [{ key: "fallback", label: "Initials", kind: "text", default: "NO" }],
    View: lazy(
      () => import("@no-origins/ui/components/avatar"),
      (m, p) => (
        <m.Avatar>
          <m.AvatarFallback>{str(p, "fallback", "NO")}</m.AvatarFallback>
        </m.Avatar>
      ),
    ),
  },
  {
    kind: "kbd",
    name: "Kbd",
    group: "atom",
    span: { colSpan: 1, rowSpan: 1 },
    props: [{ key: "keys", label: "Keys (comma-separated)", kind: "text", default: "⌘, K" }],
    View: lazy(
      () => import("@no-origins/ui/components/kbd"),
      (m, p) => (
        <m.KbdGroup>
          {list(p, "keys", "⌘, K").map((key, i) => (
            <m.Kbd key={i}>{key}</m.Kbd>
          ))}
        </m.KbdGroup>
      ),
    ),
  },
  {
    kind: "native-select",
    name: "NativeSelect",
    group: "atom",
    span: { colSpan: 3, rowSpan: 1 },
    props: [{ key: "options", label: "Options (comma-separated)", kind: "text", default: "Portfolio, Design, Admin" }],
    View: lazy(
      () => import("@no-origins/ui/components/native-select"),
      (m, p) => (
        <m.NativeSelect>
          {list(p, "options", "Portfolio, Design, Admin").map((option) => (
            <m.NativeSelectOption key={option} value={option}>
              {option}
            </m.NativeSelectOption>
          ))}
        </m.NativeSelect>
      ),
    ),
  },
  {
    kind: "marker",
    name: "Marker",
    group: "atom",
    span: { colSpan: 2, rowSpan: 1 },
    props: [
      { key: "text", label: "Text", kind: "text", default: "Marked" },
      { key: "variant", label: "Variant", kind: "select", options: ["default", "separator", "border"], default: "default" },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/marker"),
      (m, p) => (
        <m.Marker variant={str(p, "variant", "default") as "default" | "separator" | "border"}>
          <m.MarkerContent>{str(p, "text", "Marked")}</m.MarkerContent>
        </m.Marker>
      ),
    ),
  },
  {
    kind: "aspect-ratio",
    name: "AspectRatio",
    group: "atom",
    span: { colSpan: 4, rowSpan: 3 },
    props: [{ key: "ratio", label: "Ratio", kind: "select", options: ["16/9", "4/3", "1/1"], default: "16/9" }],
    View: lazy(
      () => import("@no-origins/ui/components/aspect-ratio"),
      (m, p) => {
        const [w, h] = str(p, "ratio", "16/9").split("/").map(Number)
        return (
          <m.AspectRatio ratio={(w || 16) / (h || 9)} className="bg-muted flex items-center justify-center">
            <span className="text-muted-foreground font-mono text-xs">{str(p, "ratio", "16/9")}</span>
          </m.AspectRatio>
        )
      },
    ),
  },

  // ── molecules ────────────────────────────────────────────────────────────────────────────────────────────
  {
    kind: "card",
    name: "Card",
    group: "molecule",
    span: { colSpan: 5, rowSpan: 4 },
    props: [
      { key: "title", label: "Title", kind: "text", default: "Title" },
      { key: "description", label: "Description", kind: "text", default: "A line under the title." },
      { key: "body", label: "Body", kind: "text", default: "What the card is about." },
      { key: "action", label: "Action", kind: "text", default: "Open" },
    ],
    View: lazy(
      () => Promise.all([import("@no-origins/ui/components/card"), import("@no-origins/ui/components/button")]),
      ([c, b], p) => (
        <c.Card className="h-full">
          <c.CardHeader>
            <c.CardTitle>{str(p, "title", "Title")}</c.CardTitle>
            {str(p, "description") ? <c.CardDescription>{str(p, "description")}</c.CardDescription> : null}
          </c.CardHeader>
          {str(p, "body") ? <c.CardContent className="text-sm">{str(p, "body")}</c.CardContent> : null}
          {str(p, "action") ? (
            <c.CardFooter className="mt-auto">
              <b.Button size="sm">{str(p, "action")}</b.Button>
            </c.CardFooter>
          ) : null}
        </c.Card>
      ),
    ),
  },
  {
    kind: "alert",
    name: "Alert",
    group: "molecule",
    span: { colSpan: 6, rowSpan: 1 },
    props: [
      { key: "title", label: "Title", kind: "text", default: "Heads up" },
      { key: "description", label: "Description", kind: "text", default: "Something worth knowing." },
      { key: "variant", label: "Variant", kind: "select", options: ["default", "destructive"], default: "default" },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/alert"),
      (m, p) => (
        <m.Alert variant={str(p, "variant", "default") as "default" | "destructive"}>
          <m.AlertTitle>{str(p, "title", "Heads up")}</m.AlertTitle>
          {str(p, "description") ? <m.AlertDescription>{str(p, "description")}</m.AlertDescription> : null}
        </m.Alert>
      ),
    ),
  },
  {
    kind: "accordion",
    name: "Accordion",
    group: "molecule",
    span: { colSpan: 5, rowSpan: 3 },
    props: [{ key: "items", label: "Items (comma-separated)", kind: "text", default: "First, Second, Third" }],
    View: lazy(
      () => import("@no-origins/ui/components/accordion"),
      (m, p) => (
        <m.Accordion type="single" collapsible className="w-full">
          {list(p, "items", "First, Second, Third").map((item, i) => (
            <m.AccordionItem key={i} value={String(i)}>
              <m.AccordionTrigger>{item}</m.AccordionTrigger>
              <m.AccordionContent>About {item.toLowerCase()}.</m.AccordionContent>
            </m.AccordionItem>
          ))}
        </m.Accordion>
      ),
    ),
  },
  {
    kind: "tabs",
    name: "Tabs",
    group: "molecule",
    span: { colSpan: 5, rowSpan: 2 },
    props: [{ key: "tabs", label: "Tabs (comma-separated)", kind: "text", default: "Overview, Routes, Settings" }],
    View: lazy(
      () => import("@no-origins/ui/components/tabs"),
      (m, p) => {
        const tabs = list(p, "tabs", "Overview, Routes, Settings")
        return (
          <m.Tabs defaultValue={tabs[0]} className="w-full">
            <m.TabsList>
              {tabs.map((tab) => (
                <m.TabsTrigger key={tab} value={tab}>
                  {tab}
                </m.TabsTrigger>
              ))}
            </m.TabsList>
            {tabs.map((tab) => (
              <m.TabsContent key={tab} value={tab} className="pt-3 text-sm">
                {tab}
              </m.TabsContent>
            ))}
          </m.Tabs>
        )
      },
    ),
  },
  {
    kind: "breadcrumb",
    name: "Breadcrumb",
    group: "molecule",
    span: { colSpan: 4, rowSpan: 1 },
    props: [{ key: "path", label: "Path (comma-separated)", kind: "text", default: "Design, Molecules, Breadcrumb" }],
    View: lazy(
      () => import("@no-origins/ui/components/breadcrumb"),
      (m, p) => {
        const path = list(p, "path", "Design, Molecules, Breadcrumb")
        return (
          <m.Breadcrumb>
            <m.BreadcrumbList>
              {path.map((crumb, i) => (
                <React.Fragment key={i}>
                  <m.BreadcrumbItem>
                    {i === path.length - 1 ? <m.BreadcrumbPage>{crumb}</m.BreadcrumbPage> : <m.BreadcrumbLink href="#">{crumb}</m.BreadcrumbLink>}
                  </m.BreadcrumbItem>
                  {i < path.length - 1 ? <m.BreadcrumbSeparator /> : null}
                </React.Fragment>
              ))}
            </m.BreadcrumbList>
          </m.Breadcrumb>
        )
      },
    ),
  },
  {
    kind: "pagination",
    name: "Pagination",
    group: "molecule",
    span: { colSpan: 5, rowSpan: 1 },
    props: [
      { key: "page", label: "Page", kind: "text", default: "2" },
      { key: "count", label: "Pages", kind: "text", default: "5" },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/pagination"),
      (m, p) => {
        const page = Number(str(p, "page", "2")) || 1
        const count = Math.max(1, Number(str(p, "count", "5")) || 1)
        const pages = Array.from({ length: Math.min(count, 3) }, (_, i) => Math.max(1, Math.min(count - 2, page - 1)) + i)
        return (
          <m.Pagination>
            <m.PaginationContent>
              <m.PaginationItem>
                <m.PaginationPrevious href="#" />
              </m.PaginationItem>
              {pages.map((n) => (
                <m.PaginationItem key={n}>
                  <m.PaginationLink href="#" isActive={n === page}>
                    {n}
                  </m.PaginationLink>
                </m.PaginationItem>
              ))}
              {count > 3 ? (
                <m.PaginationItem>
                  <m.PaginationEllipsis />
                </m.PaginationItem>
              ) : null}
              <m.PaginationItem>
                <m.PaginationNext href="#" />
              </m.PaginationItem>
            </m.PaginationContent>
          </m.Pagination>
        )
      },
    ),
  },
  {
    kind: "button-group",
    name: "ButtonGroup",
    group: "molecule",
    span: { colSpan: 4, rowSpan: 1 },
    props: [{ key: "labels", label: "Buttons (comma-separated)", kind: "text", default: "Day, Week, Month" }],
    View: lazy(
      () => Promise.all([import("@no-origins/ui/components/button-group"), import("@no-origins/ui/components/button")]),
      ([g, b], p) => (
        <g.ButtonGroup>
          {list(p, "labels", "Day, Week, Month").map((label) => (
            <b.Button key={label} variant="outline">
              {label}
            </b.Button>
          ))}
        </g.ButtonGroup>
      ),
    ),
  },
  {
    kind: "toggle-group",
    name: "ToggleGroup",
    group: "molecule",
    span: { colSpan: 4, rowSpan: 1 },
    props: [{ key: "labels", label: "Toggles (comma-separated)", kind: "text", default: "Day, Week, Month" }],
    View: lazy(
      () => import("@no-origins/ui/components/toggle-group"),
      (m, p) => {
        const labels = list(p, "labels", "Day, Week, Month")
        return (
          <m.ToggleGroup type="single" variant="outline" defaultValue={labels[0]}>
            {labels.map((label) => (
              <m.ToggleGroupItem key={label} value={label}>
                {label}
              </m.ToggleGroupItem>
            ))}
          </m.ToggleGroup>
        )
      },
    ),
  },
  {
    kind: "field",
    name: "Field",
    group: "molecule",
    span: { colSpan: 4, rowSpan: 2 },
    props: [
      { key: "label", label: "Label", kind: "text", default: "Name" },
      { key: "placeholder", label: "Placeholder", kind: "text", default: "" },
      { key: "description", label: "Description", kind: "text", default: "Shown in the menu and the page title." },
    ],
    View: lazy(
      () => Promise.all([import("@no-origins/ui/components/field"), import("@no-origins/ui/components/input")]),
      ([f, i], p) => (
        <f.Field>
          <f.FieldLabel>{str(p, "label", "Name")}</f.FieldLabel>
          <i.Input placeholder={str(p, "placeholder")} />
          {str(p, "description") ? <f.FieldDescription>{str(p, "description")}</f.FieldDescription> : null}
        </f.Field>
      ),
    ),
  },
  {
    kind: "input-group",
    name: "InputGroup",
    group: "molecule",
    span: { colSpan: 4, rowSpan: 1 },
    props: [
      { key: "placeholder", label: "Placeholder", kind: "text", default: "no-origins" },
      { key: "addon", label: "Addon", kind: "text", default: ".com" },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/input-group"),
      (m, p) => (
        <m.InputGroup>
          <m.InputGroupInput placeholder={str(p, "placeholder")} />
          {str(p, "addon") ? (
            <m.InputGroupAddon align="inline-end">
              <m.InputGroupText>{str(p, "addon")}</m.InputGroupText>
            </m.InputGroupAddon>
          ) : null}
        </m.InputGroup>
      ),
    ),
  },
  {
    kind: "empty",
    name: "Empty",
    group: "molecule",
    span: { colSpan: 4, rowSpan: 4 },
    props: [
      { key: "title", label: "Title", kind: "text", default: "Nothing yet" },
      { key: "description", label: "Description", kind: "text", default: "Create one and it will show up here." },
      { key: "action", label: "Action", kind: "text", default: "New" },
    ],
    View: lazy(
      () => Promise.all([import("@no-origins/ui/components/empty"), import("@no-origins/ui/components/button")]),
      ([e, b], p) => (
        <e.Empty className="h-full w-full border">
          <e.EmptyHeader>
            <e.EmptyTitle>{str(p, "title", "Nothing yet")}</e.EmptyTitle>
            {str(p, "description") ? <e.EmptyDescription>{str(p, "description")}</e.EmptyDescription> : null}
          </e.EmptyHeader>
          {str(p, "action") ? (
            <e.EmptyContent>
              <b.Button size="sm">{str(p, "action")}</b.Button>
            </e.EmptyContent>
          ) : null}
        </e.Empty>
      ),
    ),
  },
  {
    kind: "item",
    name: "Item",
    group: "molecule",
    span: { colSpan: 5, rowSpan: 1 },
    props: [
      { key: "title", label: "Title", kind: "text", default: "A row" },
      { key: "description", label: "Description", kind: "text", default: "Its second line." },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/item"),
      (m, p) => (
        <m.Item className="border">
          <m.ItemContent>
            <m.ItemTitle>{str(p, "title", "A row")}</m.ItemTitle>
            {str(p, "description") ? <m.ItemDescription>{str(p, "description")}</m.ItemDescription> : null}
          </m.ItemContent>
        </m.Item>
      ),
    ),
  },
  {
    kind: "calendar",
    name: "Calendar",
    group: "molecule",
    span: { colSpan: 4, rowSpan: 5 },
    props: [],
    View: lazy(() => import("@no-origins/ui/components/calendar"), (m) => <m.Calendar mode="single" className="border" />),
  },
  {
    kind: "table",
    name: "Table",
    group: "molecule",
    span: { colSpan: 6, rowSpan: 3 },
    props: [
      { key: "columns", label: "Columns (comma-separated)", kind: "text", default: "ID, Name, Status" },
      { key: "rows", label: "Rows (; between rows, , between cells)", kind: "text", default: "1, Portfolio, Live; 2, Design, Live; 3, Admin, Draft" },
    ],
    View: lazy(
      () => import("@no-origins/ui/components/table"),
      (m, p) => {
        const columns = list(p, "columns", "ID, Name, Status")
        const rows = str(p, "rows", "1, Portfolio, Live; 2, Design, Live; 3, Admin, Draft")
          .split(";")
          .map((row) => row.split(",").map((cell) => cell.trim()))
        return (
          <m.Table>
            <m.TableHeader>
              <m.TableRow>
                {columns.map((column) => (
                  <m.TableHead key={column}>{column}</m.TableHead>
                ))}
              </m.TableRow>
            </m.TableHeader>
            <m.TableBody>
              {rows.map((row, i) => (
                <m.TableRow key={i}>
                  {row.map((cell, j) => (
                    <m.TableCell key={j}>{cell}</m.TableCell>
                  ))}
                </m.TableRow>
              ))}
            </m.TableBody>
          </m.Table>
        )
      },
    ),
  },
  {
    // The pager's ↑ ↓ as one molecule (Grid.md D29) — the first entry that reads the grid rather than only its props,
    // since the turn comes from context. It means nothing outside the pager's bar, so it is registered (Placed has to
    // render it) but kept out of the Add list. The lazy import is also what keeps grid-pager → slot → registry from
    // being a static cycle.
    kind: "pager-arrows",
    name: "Pager arrows",
    group: "molecule",
    palette: false,
    span: { colSpan: 2, rowSpan: 1 },
    props: [],
    View: lazy(
      () => import("@no-origins/ui/components/grid-pager"),
      (m) => <m.GridPagerArrows />,
    ),
  },
]

const BY_KIND = new Map(REGISTRY.map((entry) => [entry.kind, entry]))

/** What the composer's Add list offers — everything but the components that only work in one place (D29). */
export const PALETTE = REGISTRY.filter((entry) => entry.palette !== false)

/** The entry for a kind, or undefined for a kind the registry does not know (an old export, a typo). */
export function registryEntry(kind: string) {
  return BY_KIND.get(kind)
}

/** Every prop's default, for a fresh drop (S4). */
export function defaultProps(entry: RegistryEntry): Record<string, unknown> {
  return Object.fromEntries(entry.props.map((field) => [field.key, field.default]))
}

/** A component from the registry, drawn with its props. Unknown kinds say so rather than rendering nothing. */
export function Placed({ kind, props }: { kind: string; props?: Record<string, unknown> }) {
  const entry = registryEntry(kind)
  if (!entry) {
    return (
      <div className="text-destructive border-destructive flex h-full w-full items-center justify-center border border-dashed p-2 font-mono text-[10px]">
        {kind}?
      </div>
    )
  }
  return <entry.View props={{ ...defaultProps(entry), ...props }} />
}
