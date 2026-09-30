"use client";

import { type RefObject, useLayoutEffect, useRef, useState } from "react";

import { Card } from "@no-origins/ui/components/card";
import { GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { Text } from "@no-origins/ui/components/text";

import { SectionCell, type SectionLabel } from "@/components/cards";
import { CompanyLogo } from "@/components/logo";
import { FactCard } from "@/components/profile-card";
import { ROLES } from "@/content/resume";

/**
 * The work column (Portfolio.md P4, amended 2026-09-27, his: "Work is too much information … instead of horizontal
 * placing of logos and changing them like tabs, I want to remove all the dense information in the cards and put the
 * logos vertically under the work icon cell, and each company cell (similar to education) can have up to maximum of
 * two rows height and minimum amount of information required in it"). The section's label (`lead`), the briefcase and
 * the word centred on the first row (his, the same day: "the labels should justify center in their own section"), and
 * under it a row for each company, newest first as the résumé lists them: its mark on a cell of its own, bordered and
 * filled as the tabs' cells were, which the one radius makes a circle (Grid.md D39), so the marks stand in a column
 * under the briefcase; and beside it, on the column's other cells, a pill with the role and, under it in `caption`,
 * the company and the years, left-aligned since 2026-09-28 (his: "make the company names also left aligned"; they were
 * centred as the degree's pill is). The company is its short name (TTT) where the full one does not fit beside the
 * years.
 *
 * **One row each**: the two lines fit a row at every width the column takes, five cells and up, so no company takes
 * the second row he allowed. The tabs, the active company's growth and its card — what I did there and the stack —
 * went; the lines are still in `resume.ts` (P6). Nothing here is pressed, so nothing is a Tab stop. Where the rows are
 * fewer than the label and the companies, the label goes first, then the oldest companies (P5).
 */
export function ProfileWork({ cols, rows, lead }: { cols: number; rows: number; lead?: SectionLabel }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const mark = Math.round(cell / 2) - GRID_SPACING[1];
  // The pill's words: its cells, less a pixel of border and a step of air inside each round end.
  const words = Math.max(1, cols - 1) * (cell + gap) - gap - 2 * (1 + PAD);
  const labelled = !!lead && rows > ROLES.length;
  const shown = ROLES.slice(0, Math.max(0, rows - (labelled ? 1 : 0)));
  const list = useRef<HTMLOListElement>(null);
  const names = useCompanyNames(list, words);
  return (
    <div className="flex h-full min-h-0 flex-col" style={{ gap }}>
      {lead && labelled ? (
        // The label's row: the whole column, its icon and its word centred on it.
        <div className="flex-none" style={{ height: cell }}>
          <SectionCell label={lead.label} icon={lead.icon} />
        </div>
      ) : null}
      <ol ref={list} aria-label="Where I have worked" className="flex flex-col" style={{ gap }}>
        {shown.map((role) => (
          <li key={role.id} className="flex flex-none" style={{ gap, height: cell }}>
            <FactCard className="flex-none" style={{ width: cell }}>
              <CompanyLogo company={role.company} style={{ height: mark, width: "auto", maxWidth: mark * 1.5 }} />
            </FactCard>
            {/* Left-aligned (his, 2026-09-28: "make the company names also left aligned"), as the projects' cards are. */}
            <Card size="sm" className="min-h-0 min-w-0 flex-1 justify-center gap-0 py-0" style={{ paddingInline: PAD }}>
              <Text as="span" className="truncate">
                {role.title}
              </Text>
              <Text as="span" role="caption" data-company className="truncate">
                {names[role.id] ?? role.company.name} · {year(role.from)} — {year(role.to)}
              </Text>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * The tech column's grown mark's fill: lime at 12%, mixed into the card so it is opaque (his, 2026-09-27, from the
 * accent jig, for the work's active tab, which went the same day).
 */
export const ACTIVE_FILL = "color-mix(in oklch, var(--lime) 12%, var(--card))";

/** The air inside a pill's round ends, a step of the spacing scale: the words start after the curve. */
const PAD = GRID_SPACING[4];

/** The year of a date as the résumé writes it ("Mar 2025"), or the word it is ("Present"), as the degree's are. */
const year = (date: string) => date.match(/\d{4}/)?.[0] ?? date;

/**
 * Each company's name for its caption: the full one where it and the years fit `room`, in the caption's own font,
 * else the short one. Again when the fonts arrive, since they change how wide it is.
 */
function useCompanyNames(list: RefObject<HTMLElement | null>, room: number) {
  const [names, setNames] = useState<Record<string, string>>({});
  useLayoutEffect(() => {
    const el = list.current;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!el || !ctx) return;
    let live = true;
    const measure = () => {
      const line = el.querySelector<HTMLElement>("[data-company]");
      if (!live || !line) return;
      const font = getComputedStyle(line);
      ctx.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
      const next: Record<string, string> = {};
      for (const role of ROLES) {
        const full = `${role.company.name} · ${year(role.from)} — ${year(role.to)}`;
        next[role.id] = ctx.measureText(full).width <= room ? role.company.name : role.company.short;
      }
      setNames(next);
    };
    measure();
    void document.fonts.ready.then(measure);
    return () => {
      live = false;
    };
  }, [list, room]);
  return names;
}
