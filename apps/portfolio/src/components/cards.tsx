"use client";

import { type ReactNode } from "react";
import { ArrowRightIcon, type LucideIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent } from "@no-origins/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@no-origins/ui/components/dialog";
import { useGridMetrics, type Responsive } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import { cn } from "@no-origins/ui/lib/utils";

import { FactCard, icon } from "@/components/profile-card";
import type { Span } from "@/content";
import { wrap, wrapCells } from "@/lib/arrange";

/** A section's label: its word and its icon. */
export type SectionLabel = { label: string; icon: LucideIcon };

/**
 * A section's label, on its section's first row: the section's icon in the secondary colour, the violet, and its word
 * after it in `body`, the section's heading. The whole row, with no border: a `background` slot, so the field's lines
 * stop at it, the icon and the word centred on the column.
 */
export function SectionCell({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <Slot fill="background" inset={12} alignX="center" alignY="center">
      <div className="flex min-w-0 items-center gap-2">
        <Icon aria-hidden className="size-5 shrink-0 text-secondary" />
        <Text as="h2" className="truncate">
          {label}
        </Text>
      </div>
    </Slot>
  );
}

/** One piece a `CellWrap` wraps: its cells per breakpoint, and what it draws, told whether the label is over it. */
export type WrapPiece = { key: string; span: Responsive<Span>; render: (labelled: boolean) => ReactNode };

/**
 * A section's label (`SectionCell`) across the first row, and its pieces under it, **wrapped along the rows as
 * words wrap** — the interests, the case studies and the socials. Each piece is only as many whole cells as its words
 * need, declared per cell size in `site.tsx`, straight on the field's cells and placed by the same `wrap` that gave
 * `arrangeAgent` the rows they take (`wraps`, whose first is the label's row). Where the rows do not hold the label's
 * row and the pieces, the label goes and the pieces keep the rows (P5); a piece past the rows it is given is not drawn
 * rather than cut.
 */
export function CellWrap({ label, pieces, cols, rows }: { label?: SectionLabel; pieces: WrapPiece[]; cols: number; rows: number }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const bp = m?.bp ?? "xl";
  const flow = wrap(
    wrapCells(
      pieces.map((piece) => piece.span),
      bp,
    ),
    cols,
  );
  // No label where something else names the section.
  const labelled = !!label && 1 + flow.rows <= rows;
  const top = labelled ? 1 : 0;
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px`, gap }}>
      {label && labelled ? (
        <div style={{ gridColumn: "1 / -1", gridRow: 1 }}>
          <SectionCell label={label.label} icon={label.icon} />
        </div>
      ) : null}
      {pieces.map((piece, i) =>
        flow.at[i].row + top <= rows ? (
          <div
            key={piece.key}
            className="min-w-0"
            style={{ gridColumn: `${flow.at[i].col} / span ${flow.at[i].span}`, gridRow: flow.at[i].row + top }}
          >
            {piece.render(labelled)}
          </div>
        ) : null,
      )}
    </div>
  );
}

/**
 * His statements' words: in quotes, in Anton, the HEY!'s face (`--font-display`, the portfolio's own), at the display
 * role's size, in the muted tone. Anton has one weight, so the role's bold is taken off rather than faked, and its
 * tracking is normal, as the HEY!'s is.
 *
 * `after` stands at the end of the last line, held to the last word and the closing quote so it never wraps alone.
 */
function StatementWords({ words, after }: { words: string; after?: ReactNode }) {
  const cut = after ? words.lastIndexOf(" ") + 1 : words.length;
  return (
    <Text as="blockquote" role="display" tone="muted" className="font-normal tracking-normal" style={{ fontFamily: "var(--font-display)" }}>
      “{words.slice(0, cut)}
      {after ? (
        <span className="whitespace-nowrap">
          {words.slice(cut)}”{after}
        </span>
      ) : (
        "”"
      )}
    </Text>
  );
}

/**
 * One of his statements on a card of its own. The card is the page's colour with no border: still opaque, so the
 * field's lines stop at it, and nothing edges it. Its words (`StatementWords`) are centred down the card, a card's
 * padding in from its sides, so the card's clip never takes the opening quote's overhang. No padding top and bottom:
 * the rows round the card are its air.
 */
export function StatementCard({ words, after, className }: { words: string; after?: ReactNode; className?: string }) {
  return (
    <Card size="sm" className={cn("h-full min-h-0 justify-center border-0 py-0 shadow-none", className)}>
      <CardContent className="relative">
        <StatementWords words={words} after={after} />
      </CardContent>
    </Card>
  );
}

/**
 * His line under the profile, and the rest of what he says about himself behind a button: a `StatementCard`, as his
 * statements are, with **More about me** on its last line — one cell, the lime fill and a →, centred on the line at the
 * card's right edge, which is the column's last cell. The line keeps a cell's room and a gutter after the closing
 * quote, so the words never run under it. The cell is taller than the line, so the last line is as tall as the cell
 * and the circle never runs into the descenders of the line above. Its name is its label and its tooltip. It opens
 * the system's `Dialog` with the paragraphs, all of them: the dialog does not clip.
 */
export function AboutCard({ words, paragraphs }: { words: string; paragraphs: string[] }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const more = (
    <span className="inline-block align-middle" style={{ width: cell, height: cell, marginInlineStart: gap }}>
      {/* The button keeps this cell's line and leaves the cell itself as room at the line's end, and stands at the
          card's right edge (`end-0` of the card's content, whose padding is the card's own). */}
      <span className="absolute end-0" style={{ width: cell, height: cell }}>
      <Dialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button aria-label="More about me" className="size-full px-0">
                  <ArrowRightIcon aria-hidden style={icon} />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>More about me</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>About me</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="mt-0 flex flex-col gap-3">
              {paragraphs.map((paragraph) => (
                <Text key={paragraph} tone="muted">
                  {paragraph}
                </Text>
              ))}
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
      </span>
    </span>
  );
  return <StatementCard words={words} after={more} />;
}

/** Words in a pill of their own — each of the interests, and the case studies' Work In Progress. */
export function SkillPill({ name }: { name: string }) {
  return (
    <FactCard className="h-full">
      <Text as="span">{name}</Text>
    </FactCard>
  );
}

