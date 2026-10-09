"use client";

import * as React from "react";
import Link from "next/link";
import { Boxes, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader } from "@no-origins/ui/components/card";
import type { GridMetrics } from "@no-origins/ui/components/grid";
import { GridPages } from "@no-origins/ui/components/grid-pages";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import type { GridLayout, GridLayoutItem } from "@no-origins/ui/lib/grid-layout";

import { homePages } from "@/lib/layout";
import type { SectionId } from "@/lib/sections";

/** An entry as the home page shows it: what it is called and is, its version, and how many controls it has. */
export type EntryCard = { id: string; label: string; description: string; version: number; controls: number };
/** A section as the home page shows it: its word, where its entries open, and its cards. */
export type HomeSection = { id: SectionId; label: string; path: string; cards: EntryCard[] };

const ICONS: Record<SectionId, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = { assets: Boxes, effects: Sparkles };
const NONE: GridLayout = { authored: {} };

/**
 * The home page (Cinema.md F11; the placing mine): its name, then each section, a heading row (the section's icon in
 * violet and its word, centred, no border, as the portfolio's sections have) with its cards side by side under it, a
 * cell of air between them: Assets, then Effects. An entry's card opens its page. Pages of the grid (Grid.md D5): what
 * does not fit turns onto the next page, and `section` opens on the page where that section starts (an entry's back
 * arrow comes home to its own section).
 */
export function Home({ sections, section }: { sections: HomeSection[]; section?: string }) {
  const [metrics, setMetrics] = React.useState<GridMetrics | null>(null);
  const [turned, setTurned] = React.useState<number | null>(null);

  const pages = React.useMemo(
    () => (metrics ? homePages(metrics.cols, metrics.rows, sections.map((s) => ({ id: s.id, cards: s.cards.map((card) => card.id) }))) : null),
    [metrics, sections],
  );
  const layout = React.useMemo<GridLayout>(
    () =>
      metrics && pages
        ? {
            shapes: { [metrics.bp]: { cols: metrics.cols, rows: metrics.rows } },
            authored: { [metrics.bp]: pages.map((items, index) => ({ id: `home-${index + 1}`, items })) },
          }
        : NONE,
    [metrics, pages],
  );
  const start = Math.max(0, pages?.findIndex((items) => items.some((item) => item.id.startsWith(`heading:${section}:`))) ?? 0);

  const renderItem = (item: GridLayoutItem) => {
    const [kind, sectionId, id] = item.id.split(":");
    if (kind === "title")
      return (
        <Slot fill="transparent" inset={0} alignX="center" alignY="center">
          <Text role="display" as="h1" align="center">Cinema Studio</Text>
        </Slot>
      );
    const at = sections.find((s) => s.id === sectionId);
    if (!at) return null;
    if (kind === "heading") {
      const Icon = ICONS[at.id];
      return (
        <Slot fill="background" inset={12} alignX="center" alignY="center">
          <div className="flex min-w-0 items-center gap-2">
            <Icon aria-hidden className="size-5 shrink-0 text-secondary" />
            <Text as="h2" className="truncate">{at.label}</Text>
          </div>
        </Slot>
      );
    }
    if (kind === "empty")
      return (
        <Slot fill="transparent" inset={0} alignX="center" alignY="center">
          <Text role="body" tone="muted" align="center">{`No ${at.label.toLowerCase()} yet. Ask Claude for one.`}</Text>
        </Slot>
      );
    const card = at.cards.find((c) => c.id === id);
    if (!card) return null;
    return (
      <Slot fill="transparent" inset={0} alignX="stretch" alignY="stretch">
        <Link href={`${at.path}/${card.id}`} className="block size-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Card size="sm" className="size-full shadow-none">
            <CardHeader>
              <Text role="heading" as="h3" className="truncate">{card.label}</Text>
              <Text role="caption">{`Version ${card.version} · ${card.controls} controls`}</Text>
            </CardHeader>
            <CardContent>
              <Text role="body" tone="muted" className="line-clamp-3">{card.description}</Text>
            </CardContent>
          </Card>
        </Link>
      </Slot>
    );
  };

  // The studios' grid: the field drawn, the pointer a violet ring, no intro (Grid.md D49).
  return <GridPages layout={layout} overlay cursor page={turned ?? start} onPageChange={setTurned} onMetrics={setMetrics} renderItem={renderItem} />;
}
