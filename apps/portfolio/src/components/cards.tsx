"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ArrowUpRightIcon, CalendarIcon, type LucideIcon } from "lucide-react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { useGridMetrics, type Responsive } from "@no-origins/ui/components/grid";
import { Progress } from "@no-origins/ui/components/progress";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import { FactCard, LinkButtons } from "@/components/profile-card";
import type { Span } from "@/content";
import { HOBBIES } from "@/content/resume";
import { wrap, wrapCells } from "@/lib/arrange";

/** A section's label: its word and its icon. */
export type SectionLabel = { label: string; icon: LucideIcon };

/**
 * A section's label, on its section's first row (his, 2026-09-27: "add relevant icons to the section labels … make
 * them part of the top first cell within their section", then "move all the cards or boxes that are in the row of the
 * label … to the next row"): the section's icon in the secondary colour, the violet (his, the same day: "let's try
 * making the section label icons to secondary color"), and its word after it in `body`, the section's heading. **The
 * whole row, with no border** (2026-09-28, his, from the recruiter quick view: "I just want the labels … to be
 * updated"; it was a transparent pill as many cells as the word needed, the word in `caption`): a `background` slot,
 * so the field's lines stop at it, the icon and the word centred on the column (his, 2026-09-27: "the labels should
 * justify center in their own section").
 */
export function SectionCell({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  return (
    <Slot data-load-box fill="background" inset={12} alignX="center" alignY="center">
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
 * words wrap** — the projects (his, 2026-09-27: "let the projects wrap instead of behaving like a column of cards"),
 * the art skills and the sections with nothing in them yet. Each piece is only as many whole cells as its words need
 * ("most take only the size that they need"), declared per cell size in `site.tsx`, straight on the field's cells and
 * placed by the same `wrap` that gave `arrange` the rows they take (`wraps`, whose first is the label's row). Where the
 * rows do not hold the label's row and the pieces, the label goes and the pieces keep the rows (P5); a piece past the
 * rows it is given is not drawn rather than cut.
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
  // No label where something else names the section (the tabs' panels, 2026-09-28).
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
    <Card ref={card} data-load-box size="sm" className={cn("h-full min-h-0", className)}>
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

/**
 * One of his statements, in quotes, on a card of its own (2026-09-28, his: "break down that large piece about me into
 * small statements … place that in a card … have some opaque background color … the text should also be bold and big
 * but also subtle"). The card wears the muted surface, lime mixed 14% into the page: the system's tint is a colour at
 * an opacity and still opaque, since nothing see-through goes over the grid. The words are `heading`, the biggest
 * role a column holds them in (two or three rows; `title` took four), in the muted tone, centred down the card.
 */
export function StatementCard({ words }: { words: string }) {
  return (
    <Card data-load-box size="sm" className="h-full min-h-0 justify-center bg-muted">
      <CardContent>
        <Text as="blockquote" role="heading" tone="muted">
          “{words}”
        </Text>
      </CardContent>
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

