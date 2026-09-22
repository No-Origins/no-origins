"use client";

import { ArrowUpRightIcon, CalendarIcon, GraduationCapIcon, MapPinIcon } from "lucide-react";

import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@no-origins/ui/components/card";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Progress } from "@no-origins/ui/components/progress";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import { CompanyLogo } from "@/components/logo";
import { LinkButtons } from "@/components/profile-card";
import { EDUCATION, HOBBIES, type Role } from "@/content/resume";

/**
 * A section's name, on the row above its cards: the number and the section in small caps, the title under them. The
 * title steps down a role on a narrow slot (a phone's four columns) so it stays one line.
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
 * As many lines as the room holds, in order, costed one by one.
 *
 * A fixed count clipped Terribly Tiny Tales, whose lines are twice the length of Radise's, on the very card where
 * Radise's four fitted — so each line is costed instead: characters per line from the card's width, 20px a line, 6px
 * between. The estimate is deliberately pessimistic, because over-counting drops a line, which is fine, while
 * under-counting clips one, which is the card lying about its span. It stops at the first line that does not fit
 * rather than skipping it, so what is shown is always the start of the list.
 */
function linesThatFit(lines: readonly string[], charsPerLine: number, bodyPx: number): string[] {
  const out: string[] = [];
  let used = 0;
  for (const line of lines) {
    const cost = Math.ceil(line.length / charsPerLine) * 20 + 6;
    if (used + cost > bodyPx) break;
    used += cost;
    out.push(line);
  }
  return out;
}

/**
 * One role: the company's mark and name, the title and the dates, what I did there, and the stack, as chips.
 *
 * How many lines it shows is a function of the slot, because a slot clips (Slots.md) and a bullet cut in half is the
 * card saying its span is wrong. A NARROW card — a phone's four columns — wraps every line to two or three, so a
 * short one carries the first two rather than all four; the résumé itself is one click away for the rest.
 */
export function RoleCard({ role, cols = 8, rows = 4 }: { role: Role; cols?: number; rows?: number }) {
  const m = useGridMetrics();
  const height = m ? rows * m.cell + (rows - 1) * m.gap : 276;
  const width = m ? cols * m.cell + (cols - 1) * m.gap : 564;
  // A column card — a quarter of the band from `lg` up — has no room for the mark beside the name, so it goes above it.
  const stacked = width < 300;
  // How many lines the card carries is a budget (`linesThatFit`), not a count.
  const charsPerLine = Math.max(16, Math.floor((width - 56) / 7.6));
  const fitted = linesThatFit(role.did, charsPerLine, height - (stacked ? 210 : 150));
  // A card always says at least one thing; if even that does not fit, the slot is too small and the clip is the report.
  const did = fitted.length ? fitted : role.did.slice(0, 1);
  return (
    <Card size="sm" className="h-full min-h-0 gap-4">
      <CardHeader className="gap-0">
        <div className={cn("flex gap-3", stacked ? "flex-col items-start" : "items-center")}>
          <CompanyLogo company={role.company} />
          <div className="min-w-0 flex-1">
            <Text role="heading" as="h3" className={stacked ? "wrap-break-word" : "truncate"}>
              {role.company.name}
            </Text>
            <Text role="caption" className={stacked ? "line-clamp-3" : "line-clamp-2"}>
              {role.title} · {role.from} — {role.to}
              {role.location ? ` · ${role.location}` : ""}
            </Text>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden">
        <ul className="marker:text-muted-foreground/60 flex flex-col gap-1.5 ps-4">
          {did.map((line) => (
            <li key={line} className="list-disc">
              <Text role="body" tone="muted">
                {line}
              </Text>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto flex-wrap gap-x-3 gap-y-1">
        {role.stack.map((tech) => (
          <Badge key={tech} variant="secondary">
            {tech}
          </Badge>
        ))}
      </CardFooter>
    </Card>
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
        <CardTitle className="truncate">{EDUCATION.degree}</CardTitle>
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
