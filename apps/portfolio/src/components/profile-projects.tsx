"use client";

import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import { GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { Text } from "@no-origins/ui/components/text";

import { SectionCell, type SectionLabel } from "@/components/cards";
import { icon, ICON_GAP } from "@/components/profile-card";
import { PROJECTS, type Project } from "@/content/resume";

/** A project's rows, every project's the same (his, 2026-09-28: "all cards should be of the same height"). */
const CARD_ROWS = 2;

/** The projects that are out first, as the recruiter quick view had them, then the rest as the résumé lists them. */
const SHOWN = [...PROJECTS].sort((a, b) => Number(!!b.href) - Number(!!a.href));

/** The section's rows: its label's and every project's. */
export const PROJECTS_ROWS = 1 + SHOWN.length * CARD_ROWS;

/** The air between the card's border and its image, a step of the spacing scale. */
const INSET = GRID_SPACING[2];

/**
 * The image's radius: the card's, less the inset (his, 2026-09-28: "the border radius of the image and the border
 * radius of the card is not aligning … reduce the border radius a little for the image", then "increase by 1 px" from
 * the card's less the inset and the border's pixel, 21px on a pointer's cell, to 22). Derived from the one radius,
 * never a number of its own (Grid.md D39's second exception).
 */
const IMAGE_RADIUS = `calc(var(--radius) - ${INSET}px)`;

/**
 * What stands in the image until there are pictures: lime and violet, the two accents, one card's lime over violet and
 * the next's the other way round (his, 2026-09-28: "instead of skeleton, fill it with nice lime and violet
 * gradients" — the no-gradient rule's one exception, Portfolio.md P4). Mixed in oklab through a pale step of each, so
 * the middle is light rather than the grey the two make straight; on the tokens, so they follow the accents.
 */
const FILLS = [
  "linear-gradient(160deg in oklab, var(--lime) 0%, color-mix(in oklab, var(--lime) 40%, white) 30%, color-mix(in oklab, var(--violet) 60%, white) 55%, var(--violet) 100%)",
  "linear-gradient(160deg in oklab, var(--violet) 0%, color-mix(in oklab, var(--violet) 60%, white) 45%, color-mix(in oklab, var(--lime) 40%, white) 70%, var(--lime) 100%)",
];

/**
 * Grain over the gradient (his, 2026-09-28: "add noise to the gradient"): fractal noise, grey, a 160px tile that
 * stitches, at 0.6 and blended `overlay`, so it lightens and darkens the fill around its own colour rather than greying
 * it. An SVG in a data URI, drawn once and tiled.
 */
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`;

/**
 * The projects (Portfolio.md P4, amended 2026-09-28, his: "I also liked what happened with projects cards … we'll add
 * a slot for image but for now use a skeleton", then "the image should be part of the card … inside the border of the
 * card", then "a project card's image will always be same width and height … all cards should be of the same
 * height"): the recruiter quick view's cards under the section's label, as wide as the column and two rows tall, each
 * holding a slot for its image at its left end, square, a step inside the border as the avatar is in its card. Beside
 * it, its name, its line, and the way out — "Explore the system ↗", in a new tab — or "Not published yet" where there
 * is none. The image is a lime and violet gradient until there are pictures (`FILLS`). Where the rows are fewer than
 * the label and the projects, the label goes first, then the last projects (P5).
 */
export function ProfileProjects({ cols, rows, lead }: { cols: number; rows: number; lead?: SectionLabel }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const labelled = !!lead && rows >= PROJECTS_ROWS;
  const top = labelled ? 2 : 1;
  const shown = SHOWN.slice(0, Math.max(0, Math.floor((rows - top + 1) / CARD_ROWS)));
  const image = CARD_ROWS * cell + (CARD_ROWS - 1) * gap - 2 * INSET;
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px`, gap }}>
      {lead && labelled ? (
        <div style={{ gridColumn: "1 / -1", gridRow: 1 }}>
          <SectionCell label={lead.label} icon={lead.icon} />
        </div>
      ) : null}
      {shown.map((project, i) => (
        <div key={project.name} className="min-w-0" style={{ gridColumn: "1 / -1", gridRow: `${top + i * CARD_ROWS} / span ${CARD_ROWS}` }}>
          <ProjectCard project={project} image={image} fill={FILLS[i % FILLS.length]} />
        </div>
      ))}
    </div>
  );
}

/**
 * A project's card: its image, `image` square — `fill` under `NOISE` for now — then its name, its line in `caption`, and its way out
 * where it has one, the quick view's.
 */
function ProjectCard({ project, image, fill }: { project: Project; image: number; fill: string }) {
  return (
    <Card data-load-box size="sm" className="h-full min-w-0 flex-row items-center gap-3 py-0" style={{ padding: INSET }}>
      <div
        aria-hidden
        data-project-image
        className="shrink-0"
        style={{ width: image, height: image, borderRadius: IMAGE_RADIUS, backgroundImage: `${NOISE}, ${fill}`, backgroundBlendMode: "overlay, normal" }}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 pe-3">
        <Text as="h3" className="shrink-0 truncate">
          {project.name}
        </Text>
        <Text role="caption">{project.short ?? project.line}</Text>
        {/* The way out stands a step (INSET) inside its fill, and is pulled back by the same step so its words start
            where the name's do; lit, the fill clears the image by what is left of the gap. */}
        {project.href ? (
          <Button asChild variant="ghost" className="-ms-2 h-9 justify-start self-start px-2 font-normal tracking-normal normal-case" style={{ gap: ICON_GAP }}>
            <a href={project.href} target="_blank" rel="noreferrer">
              <Text as="span">{project.action ?? project.name}</Text>
              <ArrowUpRightIcon aria-hidden className="shrink-0" style={icon} />
            </a>
          </Button>
        ) : (
          <Text as="span" role="caption" tone="foreground" className="flex h-9 items-center">
            Not published yet
          </Text>
        )}
      </div>
    </Card>
  );
}
