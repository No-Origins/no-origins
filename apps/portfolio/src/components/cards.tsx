"use client";

import { ArrowUpRightIcon, CalendarIcon, GraduationCapIcon, MapPinIcon } from "lucide-react";
import * as React from "react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Progress } from "@no-origins/ui/components/progress";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import { drawBand, MarkBand } from "@/components/band";
import { CompanyLogo } from "@/components/logo";
import { LinkButtons } from "@/components/profile-card";
import { EDUCATION, HOBBIES, type Company } from "@/content/resume";

/**
 * A section's name, on the row above its cards: the number and the section in small caps, the title under them. The
 * title steps down a role on a narrow slot (a phone's four columns) so it stays one line. It sits at the foot of its
 * slot, a gutter above a card whose own padding is the rest of the air; over content with no box of its own it sits
 * at the head instead (`alignY="start"`), so the rows under it are the air (Portfolio.md P12).
 */
export function SectionHeader({ index, label, title, cols, alignY = "end" }: { index: string; label: string; title: string; cols: number; alignY?: "start" | "end" }) {
  const m = useGridMetrics();
  const width = m ? cols * m.cell + (cols - 1) * m.gap : 999;
  return (
    <Slot fill="transparent" alignY={alignY}>
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
 * One company on the Work screen (Portfolio.md P12): its mark straight on the cells and its name under it, both
 * centred in the slot — nothing else, for now. The mark takes a square of cells as many a side as the slot is wide or
 * the rows above the last one, whichever is less, and the name the rows under it, a gutter down. Where the slot is an
 * even number of cells wider than the mark (four and two on `xl`, `md` and a phone; two and two when they match), the
 * centred mark's edges are the field's lines; a three-column slot (`lg`, `sm`) centres it half a cell off them.
 */
export function CompanyMark({ company, accent, cols, rows }: { company: Company; accent: "lime" | "violet"; cols: number; rows: number }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  // Two cells a side (P12), never more than the slot holds — and ONE on a phone (his, 2026-09-25: "in mobile, in work
  // reduce the logos size more"), where the cell has given way to the six columns (Grid.md D33) and two were 104 to
  // 126px. One cell is the grid's next size down: 46 to 57px. The name has the rows under it.
  const side = Math.max(1, Math.min(cell < 60 ? 1 : 2, cols, rows - 1));
  const px = side * cell + (side - 1) * gap;
  const fill = React.useRef<HTMLSpanElement>(null);
  const onPointer = (event: React.PointerEvent) => {
    if (event.pointerType === "touch" || !fill.current) return;
    drawBand(fill.current, event.type === "pointerenter");
  };
  return (
    <div className="flex h-full min-h-0 cursor-pointer flex-col items-center overflow-hidden" style={{ gap }} onPointerEnter={onPointer} onPointerLeave={onPointer}>
      <div className="relative shrink-0" style={{ width: px, height: px }}>
        <MarkBand box={px} mark={px} accent={accent} fill={fill} />
        <CompanyLogo company={company} className="relative size-full" />
      </div>
      <Text role="heading" as="h3" align="center" className="line-clamp-2">
        {company.name}
      </Text>
    </div>
  );
}

/** Groups of names as chips — the stack. */
export function ChipGroupsCard({ title, groups }: { title: string; groups: { group: string; items: string[] }[] }) {
  return (
    <Card size="sm" className="h-full min-h-0 gap-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {groups.map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-1.5">
            <Text role="caption">{group}</Text>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {items.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Names with a bar each — the résumé's skills and languages, drawn as it draws them.
 *
 * The bars GROW into place, one after the next — his call, 2026-09-21. `GridPages` only mounts the page it shows, so
 * a card's first render is the moment its page arrives: the growth needs no visibility test, it is simply what the
 * card does when it appears, and it happens again every time the page is turned back to. `BARS_AFTER` holds it until
 * the turn's in-phase is done (`TURN_MS` is 160), so the fills read as the card settling rather than as a second
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

/** A short card: a title, a line, a state — a project, or a note about me. Two rows tall it keeps two lines of the line. */
export function NoteCard({ title, line, state, href, rows = 3, className }: { title: string; line: string; state?: string; href?: string; rows?: number; className?: string }) {
  return (
    <Card size="sm" className={cn("h-full min-h-0 gap-3", className)}>
      <CardHeader className="gap-1">
        <CardTitle className="truncate">{title}</CardTitle>
        <CardDescription className={rows <= 2 ? "line-clamp-2" : "line-clamp-3"}>{line}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto justify-between gap-2">
        {state ? <Badge variant="secondary">{state}</Badge> : <span />}
        {href ? (
          <Button asChild variant="ghost" size="xs">
            <a href={href} target="_blank" rel="noreferrer">
              Open <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

export function EducationCard() {
  return (
    <Card size="sm" className="h-full min-h-0 gap-3">
      <CardHeader className="gap-1">
        {/* Two lines, not an ellipsis: on a phone the degree is wider than the card, and the card has the room. */}
        <CardTitle className="line-clamp-2">{EDUCATION.degree}</CardTitle>
        <CardDescription>{EDUCATION.school}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto flex-wrap gap-x-4 gap-y-1">
        <Badge variant="secondary">
          <GraduationCapIcon /> {EDUCATION.from} — {EDUCATION.to}
        </Badge>
        <Badge variant="secondary">
          <MapPinIcon /> {EDUCATION.place}
        </Badge>
      </CardFooter>
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
          04 — Say hello
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
