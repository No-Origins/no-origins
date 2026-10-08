"use client";

import { useEffect, useState } from "react";

import { Card } from "@no-origins/ui/components/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel } from "@no-origins/ui/components/carousel";
import { GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import { SectionCell, type SectionLabel } from "@/components/cards";
import { CARD_LINK, LINK_CARD } from "@/components/profile-card";
import { DUMMY_PROJECTS, PROJECTS, type Project } from "@/content/resume";

/** A project's rows, every project's the same: its image's two and its name's one. */
const CARD_ROWS = 3;
/** A project's cells across. */
const CARD_COLS = 2;

/** The projects that are out first, then the rest as the résumé lists them, then the two dummies. */
const SHOWN = [...[...PROJECTS].sort((a, b) => Number(!!b.href) - Number(!!a.href)), ...DUMMY_PROJECTS];

/** The section's rows: its label's (with the carousel's arrows, when it turns) and the cards'. */
export const PROJECTS_ROWS = 1 + CARD_ROWS;

/** The air between the card's border and its image, a step of the spacing scale. */
const INSET = GRID_SPACING[2];
/** The air under a project's name, to the card's foot, a step of the spacing scale: the round foot's corners take some. */
const NAME_FOOT = GRID_SPACING[3];

/**
 * The image's radius: the card's, less the inset. Derived from the one radius, never a number of its own (Grid.md
 * D39's second exception).
 */
const IMAGE_RADIUS = `calc(var(--radius) - ${INSET}px)`;

/**
 * What stands in the image until there are pictures: lime and violet, the two accents, one card's lime over violet and
 * the next's the other way round — the no-gradient rule's one exception, his (Portfolio.md P4). Mixed in oklab through a pale step of each, so
 * the middle is light rather than the grey the two make straight; on the tokens, so they follow the accents.
 */
const FILLS = [
  "linear-gradient(160deg in oklab, var(--lime) 0%, color-mix(in oklab, var(--lime) 40%, white) 30%, color-mix(in oklab, var(--violet) 60%, white) 55%, var(--violet) 100%)",
  "linear-gradient(160deg in oklab, var(--violet) 0%, color-mix(in oklab, var(--violet) 60%, white) 45%, color-mix(in oklab, var(--lime) 40%, white) 70%, var(--lime) 100%)",
];

/**
 * Grain over the gradient: fractal noise, grey, a 160px tile that
 * stitches, at 0.6 and blended `overlay`, so it lightens and darkens the fill around its own colour rather than greying
 * it. An SVG in a data URI, drawn once and tiled.
 */
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`;

/**
 * The projects (Portfolio.md P4): cards two cells wide and three rows tall, each its image over its name, all the same
 * size, side by side from the column's start **in a carousel**, the system's `Carousel`, as many at a time as the
 * column holds. Over the cards is the section's label, its first row. **Where there are more cards than the column
 * holds**, the carousel's ‹ and › stand on that row's first and last cells, circles, the label between them; with no
 * label they stand on the row under the cards, with which of how many is first between them. The arrows, a swipe and
 * a drag turn it; ← and → do not, since they move the page's focus (Grid.md D45). Four cards, his two and two dummies,
 * are more than any column holds. The image is a lime and violet gradient until there are pictures (`FILLS`). Where
 * the rows do not hold the label, it goes and the cards stay (P5).
 */
export function ProfileProjects({ cols, rows, lead }: { cols: number; rows: number; lead?: SectionLabel }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  if (rows < CARD_ROWS || cols < CARD_COLS) return null;
  const bar = rows >= PROJECTS_ROWS && cols >= 3;
  const labelled = bar && !!lead;
  // The carousel's window is as many whole cards as the column holds, so its last stop is on the field's cells too.
  const span = Math.floor(cols / CARD_COLS) * CARD_COLS;
  return (
    <Carousel
      aria-label="Projects"
      // From the column's start, a card a turn, so every stop puts the cards back on the field's cells.
      opts={{ align: "start" }}
      className="grid"
      style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px`, gap }}
    >
      {bar ? <ProjectsBar cols={cols} row={labelled ? 1 : 1 + CARD_ROWS} lead={labelled ? lead : undefined} /> : null}
      <div className="min-w-0" style={{ gridColumn: `1 / span ${span}`, gridRow: `${labelled ? 2 : 1} / span ${CARD_ROWS}` }}>
        {/* The system's slides stand a gutter apart; here the gutter is the field's, and a slide is a card's cells. */}
        <CarouselContent style={{ marginInlineStart: -gap }}>
          {SHOWN.map((project, i) => (
            <CarouselItem key={project.name} style={{ flexBasis: CARD_COLS * (cell + gap), paddingInlineStart: gap }}>
              <ProjectCard project={project} height={CARD_ROWS * cell + (CARD_ROWS - 1) * gap} fill={FILLS[i % FILLS.length]} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </div>
    </Carousel>
  );
}

/**
 * The projects' bar, row `row`: the label across it, or, where the carousel has somewhere to turn, ‹ and › on its
 * first and last cells with the label — or which of how many is first, where there is no label — between them.
 */
function ProjectsBar({ cols, row, lead }: { cols: number; row: number; lead?: SectionLabel }) {
  const { canScrollPrev, canScrollNext } = useCarousel();
  const turns = canScrollPrev || canScrollNext;
  if (!turns && !lead) return null;
  return (
    <>
      {turns ? <CarouselPrevious className="static size-full" style={{ gridColumn: 1, gridRow: row }} /> : null}
      <div className="min-w-0" style={{ gridColumn: turns ? `2 / span ${cols - 2}` : "1 / -1", gridRow: row }}>
        {lead ? <SectionCell label={lead.label} icon={lead.icon} /> : <ProjectCount />}
      </div>
      {turns ? <CarouselNext className="static size-full" style={{ gridColumn: cols, gridRow: row }} /> : null}
    </>
  );
}

/** Which card is first of how many places the carousel stops at, "1 / 2", where the bar has no label to carry. */
function ProjectCount() {
  const { api } = useCarousel();
  const [at, setAt] = useState({ index: 0, of: 1 });
  useEffect(() => {
    if (!api) return;
    const select = () => setAt({ index: api.selectedScrollSnap(), of: api.scrollSnapList().length });
    select();
    api.on("select", select);
    api.on("reInit", select);
    return () => {
      api.off("select", select);
      api.off("reInit", select);
    };
  }, [api]);
  return (
    <div className="flex size-full items-center justify-center">
      <Text as="span" role="caption" aria-live="polite">
        {at.index + 1} / {at.of}
      </Text>
    </div>
  );
}

/**
 * A project's card, `height` tall: its image a step inside the border at the top and the sides — `fill` under `NOISE`
 * for now — and its name under it, centred, a step (`INSET`) from it and `NAME_FOOT` from the card's foot; the image
 * takes the rest. **A project with a URL is its card**: the card is the link, in a new tab, its border lime under the pointer and the keys'
 * focus, as the address's and GitHub's are (`LINK_CARD`); one without is its image and its name, not a Tab stop.
 */
function ProjectCard({ project, height, fill }: { project: Project; height: number; fill: string }) {
  return (
    <Card size="sm" className={cn(project.href && LINK_CARD, "min-w-0 py-0")} style={{ height, padding: `${INSET}px ${INSET}px ${NAME_FOOT}px`, gap: INSET }}>
      <div
        aria-hidden
        data-project-image
        className="min-h-0 flex-1"
        style={{ borderRadius: IMAGE_RADIUS, backgroundImage: `${NOISE}, ${fill}`, backgroundBlendMode: "overlay, normal" }}
      />
      {/* The name in `heading`. On a card narrower than No Origins needs at it, 109px and its air — a phone's two
          cells — it steps back to the body's size, still semibold, as the address and the degree step (P5). */}
      <div className="@container flex shrink-0 items-center justify-center">
        <Text as="h3" role="heading" className="truncate @max-[112px]:text-sm">
          {project.href ? (
            <a href={project.href} target="_blank" rel="noreferrer" aria-label={`${project.name} (opens in a new tab)`} className={CARD_LINK}>
              {project.name}
            </a>
          ) : (
            project.name
          )}
        </Text>
      </div>
    </Card>
  );
}
