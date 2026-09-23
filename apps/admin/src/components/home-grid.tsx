"use client";

import * as React from "react";
import Link from "next/link";
import { PackageIcon, PaletteIcon, SettingsIcon, SwordsIcon } from "lucide-react";

import { cn } from "@no-origins/ui/lib/utils";
import { Badge } from "@no-origins/ui/components/badge";
import { GridEditor } from "@no-origins/ui/components/grid-editor";
import type { GridLayout, GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

/**
 * The admin home (Admin.md §0.5): the control surface rendered in the base layout every quest is composed in.
 * Each feature is a card on the grid. Read-only — the field is the point, not the editing — and the cards are the
 * design system's `Card` grammar wearing a `Link`.
 */

type Feature = {
  title: string;
  blurb: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
};

const FEATURES: Record<string, Feature> = {
  quests: {
    title: "Quests",
    blurb: "The surfaces we deploy. Compose one on the grid.",
    href: "/quests",
    icon: SwordsIcon,
  },
  design: {
    title: "Design System",
    blurb: "Every component and token, live in both themes.",
    href: "https://design.no-origins.com",
    icon: PaletteIcon,
    soon: true,
  },
  products: {
    title: "Products",
    blurb: "Plugins that register into a system by contract.",
    href: "#",
    icon: PackageIcon,
    soon: true,
  },
  settings: {
    title: "Settings",
    blurb: "Your account, passkeys and password.",
    href: "/settings",
    icon: SettingsIcon,
  },
};

// Authored on a 12 × 6 field at lg as a 2 × 2 of features; every other field derives by packing (grid-layout.ts) —
// since Grid.md D12 the counts are the box's, so that is most screens.
const LAYOUT: GridLayout = {
  shapes: { lg: { cols: 12, rows: 6 } },
  authored: {
    lg: [
      {
        id: "home",
        items: [
          { id: "quests", label: "Quests", col: 1, row: 1, colSpan: 6, rowSpan: 3 },
          { id: "design", label: "Design System", col: 7, row: 1, colSpan: 6, rowSpan: 3 },
          { id: "products", label: "Products", col: 1, row: 4, colSpan: 6, rowSpan: 3 },
          { id: "settings", label: "Settings", col: 7, row: 4, colSpan: 6, rowSpan: 3 },
        ],
      },
    ],
  },
};

function FeatureCard({ item }: { item: GridLayoutItem }) {
  const feature = FEATURES[item.id];
  if (!feature) return null;
  const Icon = feature.icon;
  const external = feature.href.startsWith("http");

  const inner = (
    <div
      className={cn(
        "bg-card group hover:border-foreground focus-visible:ring-ring flex h-full w-full flex-col justify-between border p-5 transition-colors outline-none focus-visible:ring-2",
        feature.soon && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Icon className="text-muted-foreground group-hover:text-foreground size-6 transition-colors" />
        {feature.soon ? (
          <Badge variant="outline" className="font-mono text-[10px] tracking-wide uppercase">
            soon
          </Badge>
        ) : null}
      </div>
      <div className="space-y-1">
        <h2 className="font-heading text-xl leading-tight font-semibold">{feature.title}</h2>
        <p className="text-muted-foreground text-sm">{feature.blurb}</p>
      </div>
    </div>
  );

  if (feature.href === "#") return <div className="h-full w-full cursor-default">{inner}</div>;

  return (
    <Link
      href={feature.href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="block h-full w-full"
    >
      {inner}
    </Link>
  );
}

export function HomeGrid() {
  const [page, setPage] = React.useState(0);
  return (
    <div className="h-dvh">
      <GridEditor
        layout={LAYOUT}
        onLayoutChange={() => {}}
        page={page}
        onPageChange={setPage}
        readOnly
        overlay
        className="h-full"
        renderItem={(item) => <FeatureCard item={item} />}
      />
    </div>
  );
}
