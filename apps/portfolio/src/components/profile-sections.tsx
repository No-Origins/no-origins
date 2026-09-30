"use client";

import { useState, type ReactNode } from "react";

import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@no-origins/ui/components/tabs";
import { Text } from "@no-origins/ui/components/text";

import type { SectionLabel } from "@/components/cards";

/** One tab: its id, the section's label (its icon and a short word), and its panel, drawn `cols` × `rows`. */
export type SectionTab = { id: string; label: SectionLabel; render: (cols: number, rows: number) => ReactNode };

/**
 * The first screen's sections as tabs, where its columns cannot stand beside the profile — a phone and a tablet
 * (Portfolio.md P4, 2026-09-28, his, from the recruiter quick view: "I loved the mobile layout … take references from
 * that and update ours too"). The quick view's tab bar, one row on the field's own cells: a card-filled pill, each tab
 * its section's icon and word in `caption`, the one shown filled with the primary, the lime. Under it the panel, the
 * rows that are left, holding the section as it is drawn beside the profile, without its label — the tab names it.
 */
export function ProfileSections({ tabs, cols, rows }: { tabs: SectionTab[]; cols: number; rows: number }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const [tab, setTab] = useState(tabs[0]?.id ?? "");
  return (
    <Tabs value={tab} onValueChange={setTab} className="h-full min-h-0" style={{ gap }}>
      <TabsList aria-label="My work, projects and skills" className="w-full shrink-0 border bg-card p-1" style={{ height: cell }}>
        {tabs.map(({ id, label: { label, icon: Icon } }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="gap-1.5 px-1 font-normal tracking-normal normal-case data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground"
          >
            <Icon aria-hidden />
            <Text as="span" role="caption" className="text-inherit">
              {label}
            </Text>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(({ id, render }) => (
        <TabsContent key={id} value={id} className="m-0 min-h-0">
          {render(cols, Math.max(1, rows - 1))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
