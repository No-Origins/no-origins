"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ArrowUpRightIcon, CalendarIcon, type LucideIcon } from "lucide-react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { useGridMetrics, type GridBreakpoint, type Responsive } from "@no-origins/ui/components/grid";
import { Progress } from "@no-origins/ui/components/progress";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import { FactCard, icon, ICON_GAP, LinkButtons } from "@/components/profile-card";
import type { Span } from "@/content";
import { HOBBIES } from "@/content/resume";
import { wrap, wrapCells } from "@/lib/arrange";

/**
 * A section's label: its word, its icon, and the whole cells the two take in a pill, per cell size — measured off the
 * page and declared in `site.tsx`, as the projects' pills are.
 */
export type SectionLabel = { label: string; icon: LucideIcon; span: Responsive<Span> };

/**
 * Where a section's label stands on its row, `cols` wide: centred on it (his, 2026-09-27: "the labels should justify
 * center in their own section"), on the field's own cells — so its cells are the ones its word needs and one more
 * where the row's other cells would not split evenly either side (Work, two cells, is three on a five-cell column).
 * `col` is 1-based, like the grid's lines.
 */
export function labelSpot(label: SectionLabel, bp: GridBreakpoint, cols: number) {
  const need = Math.min(cols, wrapCells([label.span], bp)[0]);
  const span = (cols - need) % 2 ? need + 1 : need;
  return { col: (cols - span) / 2 + 1, span };
}

/**
 * A section's label, on its section's first row (his, 2026-09-27: "add relevant icons to the section labels … make
 * them part of the top first cell within their section", then "move all the cards or boxes that are in the row of the
 * label … to the next row"): a transparent pill — the facts' own with the card's fill taken off, so the field shows
 * through it ("labels … should be still kept in a pill, but a transparent pill") — holding the section's icon in the
 * secondary colour, the violet (his, 2026-09-27: "let's try making the section label icons to secondary color"; they
 * were muted), **and the section's word after it** (his, the same day: "expand them to also show the label of the
 * section name"), in `caption`, the narrowest of the roles. The word is the section's heading. It stands centred on the
 * row, alone (`labelSpot`).
 */
export function SectionCell({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <FactCard className="size-full bg-transparent">
      <Icon aria-hidden className="shrink-0 text-secondary" style={icon} />
      <Text as="h2" role="caption">
        {label}
      </Text>
    </FactCard>
  );
}

/** One piece a `CellWrap` wraps: its cells per breakpoint, and what it draws, told whether the label is over it. */
export type WrapPiece = { key: string; span: Responsive<Span>; render: (labelled: boolean) => ReactNode };

/**
 * A section's label (`SectionCell`) on the first row, centred, and its pieces under it, **wrapped along the rows as
 * words wrap** — the projects (his, 2026-09-27: "let the projects wrap instead of behaving like a column of cards"),
 * the art skills and the sections with nothing in them yet. Each piece is only as many whole cells as its words need
 * ("most take only the size that they need"), declared per cell size in `site.tsx`, straight on the field's cells and
 * placed by the same `wrap` that gave `arrange` the rows they take (`wraps`, whose first is the label's row). Where the
 * rows do not hold the label's row and the pieces, the label goes and the pieces keep the rows (P5); a piece past the
 * rows it is given is not drawn rather than cut.
 */
export function CellWrap({ label, pieces, cols, rows }: { label: SectionLabel; pieces: WrapPiece[]; cols: number; rows: number }) {
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
  const labelled = 1 + flow.rows <= rows;
  const spot = labelSpot(label, bp, cols);
  const top = labelled ? 1 : 0;
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px`, gap }}>
      {labelled ? (
        <div style={{ gridColumn: `${spot.col} / span ${spot.span}`, gridRow: 1 }}>
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
 * A section's name, on the row above its cards: the number and the section in small caps, the title under them. The
 * title steps down a role on a narrow slot (a phone's four columns) so it stays one line. It sits at the foot of its
 * slot, a gutter above a card whose own padding is the rest of the air.
 */
export function SectionHeader({ index, label, title, cols }: { index: string; label: string; title: string; cols: number }) {
  const m = useGridMetrics();
  const width = m ? cols * m.cell + (cols - 1) * m.gap : 999;
  return (
    <Slot fill="transparent" alignY="end">
      <div className="flex min-w-0 flex-col justify-end gap-0.5">
        <Text role="label" tone="muted">
          {index} — {label}
        </Text>
        <Text role={width < 400 ? "heading" : "title"} as="h2" className="truncate">
          {title}
        </Text>
      </div>
    </Slot>
  );
}

/**
 * Names with a bar each — the résumé's skills and languages, drawn as it draws them.
 *
 * The bars GROW into place, one after the next — his call, 2026-09-21. `GridPages` only mounts the page it shows, so
 * a card's first render is the moment its page arrives: the growth needs no visibility test, it is simply what the
 * card does when it appears, and it happens again every time the page is turned back to. `BARS_AFTER` holds it until
 * the page has faded in (the turn's in-phase, `TURN_MS`, 160), so the fills read as the card settling rather than as a second
 * motion competing with the turn; `BARS_STEP` is the stagger down the rows.
 */
const BARS_AFTER = 180;
const BARS_STEP = 70;

export function BarsCard({ title, rows, note }: { title: string; rows: { name: string; value: number }[]; note?: string }) {
  return (
    <Card size="sm" className="h-full min-h-0 gap-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {note ? <CardDescription>{note}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col justify-start gap-3 overflow-hidden">
        {rows.map((row, index) => (
          <div key={row.name} className="flex flex-col gap-1.5">
            <Text role="caption" tone="foreground" className="truncate">
              {row.name}
            </Text>
            <Progress value={row.value} animate delay={BARS_AFTER + index * BARS_STEP} aria-label={`${row.name}: ${row.value} of 100`} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * A note: paragraphs, under a title and a state where it has them — his own words about himself, under the facts in
 * the first screen's first column (2026-09-27, his: "replace the what I am after content with the following"; it was
 * one line), with neither since the same day ("remove the 'What I'm after' heading and 'Open to it' text"). The state
 * stands beside the title and the paragraphs run under both, and the whole is centred down the card, so what the span
 * has over it is split above and below rather than pooled over a footer (the mirror of P5). It gets denser as the card
 * gets smaller rather than clip (P5): where the paragraphs do not fit, they go from the one before the last backward,
 * each whole, and **the last stays** — his, what he is after. A note with somewhere to go keeps its Open ↗ under the
 * words.
 */
export function NoteCard({ title, paragraphs, state, href, className }: { title?: string; paragraphs: string[]; state?: string; href?: string; className?: string }) {
  const card = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    let live = true;
    const fit = () => {
      if (!live) return;
      const parts = [...el.querySelectorAll<HTMLElement>("[data-fit]")].sort((a, b) => Number(a.dataset.fit) - Number(b.dataset.fit));
      for (const part of parts) part.hidden = false;
      for (const part of parts) {
        if (el.scrollHeight <= el.clientHeight) break;
        part.hidden = true;
      }
    };
    fit();
    void document.fonts.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [paragraphs]);
  return (
    <Card ref={card} size="sm" className={cn("h-full min-h-0", className)}>
      {/* An auto margin rather than justify-center: it centres the words while they fit and lets them overflow at the
          foot, where the fit can see it, when they do not. */}
      <div className="my-auto flex flex-col gap-3">
        {title || state ? (
          <CardHeader className="gap-1">
            {title ? <CardTitle className="truncate">{title}</CardTitle> : null}
            {state ? (
              <CardAction className="row-span-1 self-center">
                <Badge variant="secondary">{state}</Badge>
              </CardAction>
            ) : null}
          </CardHeader>
        ) : null}
        <CardContent className="flex flex-col gap-2">
          {paragraphs.map((paragraph, index) => (
            <CardDescription key={paragraph} data-fit={index < paragraphs.length - 1 ? paragraphs.length - 1 - index : undefined}>
              {paragraph}
            </CardDescription>
          ))}
        </CardContent>
      </div>
      {href ? (
        <CardFooter className="justify-end">
          <Button asChild variant="ghost" size="xs">
            <a href={href} target="_blank" rel="noreferrer">
              Open <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function HobbiesCard() {
  return (
    <Card size="sm" className="h-full min-h-0 gap-3">
      <CardHeader className="gap-1">
        <CardTitle>Outside the work</CardTitle>
        <CardDescription>What I do when I am not building.</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto flex-wrap gap-x-3 gap-y-1">
        {HOBBIES.map((hobby) => (
          <Badge key={hobby} variant="outline">
            {hobby}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}

/** The last card: how to reach me. */
export function ContactCard() {
  return (
    <Card className="h-full min-h-0 gap-5">
      <CardHeader className="gap-1">
        <Text role="label" tone="muted">
          02 — Say hello
        </Text>
        <Text role="title" as="h2">
          Write to me.
        </Text>
        <CardDescription className="mt-2 max-w-prose">
          If you are hiring, the work is a scroll away. If you have an idea, I would like to hear it. Come back — this grows.
        </CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto flex-wrap gap-2">
        <LinkButtons ids={["email", "github", "linkedin", "resume"]} size="sm" />
        <Badge variant="secondary" className="ms-auto">
          <CalendarIcon /> Hyderabad · IST
        </Badge>
      </CardFooter>
    </Card>
  );
}

/**
 * The pieces of the pages that went, one row tall (2026-09-27): each is the facts' own pill (`FactCard`, profile-card.tsx),
 * a Card the radius makes a pill with its content centred, in the room the first screen leaves. They carry the facts,
 * not the cards' prose, and each is as many whole cells as its words need (`site.tsx`).
 */

/**
 * A project: its name and the arrow out, No Origins' (his, 2026-09-27: "remove in progress, idea, shipped labels from
 * the projects boxes and replace them with the link icon that No Origins has"). The whole pill is the link where it
 * has somewhere to go; the arrow stands on the rest too, which have no URL yet.
 */
export function NotePill({ title, href }: { title: string; href?: string }) {
  const body = (
    <>
      <Text as="span">{title}</Text>
      <ArrowUpRightIcon aria-hidden className="shrink-0 text-lime" style={icon} />
    </>
  );
  if (!href) return <FactCard className="h-full">{body}</FactCard>;
  return (
    <Card size="sm" className="h-full justify-center py-0">
      <Button asChild variant="ghost" className="h-full w-full px-0 font-normal tracking-normal normal-case" style={{ gap: ICON_GAP }}>
        <a href={href} target="_blank" rel="noreferrer">
          {body}
        </a>
      </Button>
    </Card>
  );
}

/**
 * A skill in words, one pill of its own — the art skills under the tech stack (his, 2026-09-27: "move the sketching,
 * UI/UX in Figma, video editing in DaVinci … to something called art skills … under tech skills"), which were one pill
 * of four words with a line between each two in the room.
 */
export function SkillPill({ name }: { name: string }) {
  return (
    <FactCard className="h-full">
      <Text as="span">{name}</Text>
    </FactCard>
  );
}

