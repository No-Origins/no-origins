"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { preload } from "react-dom";
import { ArrowUpRightIcon, CheckIcon, CopyIcon, DownloadIcon, GraduationCapIcon, MailIcon, MapPinIcon } from "lucide-react";
import { siDiscord, siGithub, siInstagram, siX, siYoutube, type SimpleIcon } from "simple-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@no-origins/ui/components/avatar";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent } from "@no-origins/ui/components/card";
import { GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { Text } from "@no-origins/ui/components/text";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import { cn } from "@no-origins/ui/lib/utils";

import { HEY_MOTIONS, HeyOverlay, type HeyMotion, type HeyOrigin } from "@/components/hey-overlay";
import { EDUCATION, LINKS, profile, type Link } from "@/content/resume";

/** A link with a value, and the way it is drawn: mail gets the envelope, a file the arrow down, the web the arrow out. */
export function LinkButtons({ ids, size }: { ids: Link["id"][]; size: "xs" | "sm" | "default" }) {
  const links = LINKS.filter((link): link is Link & { href: string } => !!link.href && ids.includes(link.id));
  return (
    <>
      {links.map((link) => {
        const kind = link.href.startsWith("mailto:") ? "mail" : link.href.startsWith("/") ? "file" : "web";
        return (
          <Button key={link.id} asChild variant="outline" size={size}>
            <a href={link.href} target={kind === "web" ? "_blank" : undefined} rel={kind === "web" ? "noreferrer" : undefined} download={kind === "file" ? "" : undefined}>
              {kind === "mail" ? <MailIcon data-icon="inline-start" /> : null}
              {kind === "file" ? <DownloadIcon data-icon="inline-start" /> : null}
              {link.label}
              {kind === "web" ? <ArrowUpRightIcon data-icon="inline-end" /> : null}
            </a>
          </Button>
        );
      })}
    </>
  );
}

// The two motions on trial take turns, the new slap first, until he picks one (hey-overlay.tsx, HEY_MOTIONS) — one count
// for the page, so the face and the handle share it.
let heys = 0;

/**
 * The avatar's HEY! (hey-overlay.tsx), for anything that can set it off: the face itself, and the @hiddenstack under
 * the tagline. The face always leaps from the avatar — the overlay measures the box it is given — so `pop` takes the
 * element to leap from, and the handle hands it the avatar (`data-hey-face`), or itself if there is no avatar on the
 * page. A HEY face is picked at random per pop; both are preloaded, at low priority, so the one picked is already
 * there when it is flung rather than showing the initials mid-leap.
 */
function useHey() {
  for (const face of profile.heyFaces) preload(face.src, { as: "image", fetchPriority: "low" });
  const [hey, setHey] = useState<{ origin: HeyOrigin; face: (typeof profile.heyFaces)[number]; motion: HeyMotion } | null>(null);
  const pop = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const face = profile.heyFaces[Math.floor(Math.random() * profile.heyFaces.length)];
    const motion = HEY_MOTIONS[heys++ % HEY_MOTIONS.length];
    setHey({ origin: { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width }, face, motion });
  };
  const overlay = hey ? (
    <HeyOverlay
      origin={hey.origin}
      avatar={{ src: hey.face.src, alt: hey.face.alt, initials: profile.initials }}
      motion={hey.motion}
      onDone={() => setHey(null)}
    />
  ) : null;
  return { pop, overlay };
}

/** How many cells square the avatar's card is (Portfolio.md P4, 2026-09-27: "the two by two card"). */
const AVATAR_CELLS = 2;

/**
 * The profile — the first thing on the portfolio (Portfolio.md P4): two cards side by side, **his avatar in a card two
 * cells square and his name with the role line under it in the card beside it** (his, 2026-09-27: "divide the avatar
 * and name section into two cards … put the avatar in the two by two card which is above Hyderabad and then keep the
 * text in another card"). One item on the grid, the way the facts under it are: each card on the field's own cells,
 * a gutter between them, so the avatar's card stands over the pill under it and the name's card over the rest. An
 * app-specific island composed from the design system and nothing else. A Card is already a box, so it goes on the
 * grid unwrapped (Grid.md D21).
 *
 * **No company marks here** — his call, 2026-09-21 (P9): the first screen is who he is, and the four marks say where
 * he has been, which is what the work column is for.
 *
 * It is sized by the slot it is in, and a slot clips (Slots.md), so it reads its own size off the grid (P5). The face
 * fills its card less a gutter all round, ring and all — 96px on a pointer, 120 on touch, 78 on a phone. The name
 * steps down as its card narrows: `display` on a pointer's six cells, `title` on a tablet's four, `heading` on a
 * phone's four, where it would otherwise run to two lines and the role to two more. Nothing in it scrolls. The name
 * and the role are centred in their card, so what the span has over them is split either side rather than pooled at
 * their end (his mock, 2026-09-26).
 *
 * The role line is the role alone, in lime (his mock, 2026-09-26): the company it named went to the work column.
 */
export function ProfileCard({ colSpan, rowSpan }: { colSpan: number; rowSpan: number }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const height = cells(rowSpan, cell, gap);
  const side = Math.min(cells(AVATAR_CELLS, cell, gap), height);
  const nameWidth = cells(colSpan - AVATAR_CELLS, cell, gap);
  // The name's card: a pointer's six cells are 420px, a tablet's four 324, a phone's four 240 at most.
  const name = nameWidth >= 400 ? "display" : nameWidth >= 300 ? "title" : "heading";
  const narrow = nameWidth < 300;

  // A ring round the face: one unbroken circle of line in lime (his, 2026-09-25 — "we don't need a violet there"; it
  // was lime 70% and violet 25% with two gaps, 2026-09-24). A circle in an SVG inside the Avatar, 3px clear of its
  // edge, so the box the overlay measures is still the face's. The stroke is the design system's `--stroke-accent`
  // (3px — his, after a pass at 5), and everything is laid out from it in CSS: the SVG is the ring's centre line (the
  // face, the 3px clearance and half a stroke each side) and the circle is 50% of it. The focus outline sits 3px
  // outside the ring. So the face is the card less a gutter each side, less the clearance and the stroke each side.
  const face = `calc(${side - 2 * gap - 6}px - 2 * var(--stroke-accent))`;

  // The face is page 1's one image that the intro cannot see: Radix's AvatarImage renders no <img> until it has loaded,
  // so there is nothing in the field for the intro's wait (Grid.md D31) to hold for. Preloaded from the head, it is
  // fetched at once and holds the window's load, which the intro does wait for.
  preload(profile.avatar.src, { as: "image", fetchPriority: "high" });

  // Click the face and it pops out to say hello (`useHey`). We grab the avatar's own rect off the event so the clone
  // leaps from exactly where it sits — no ref, because Avatar forwards onClick to its root but not a ref.
  const { pop: popHey, overlay: heyOverlay } = useHey();

  return (
    // The avatar and the name are one profile, in focus as one (Portfolio.md P18: one component, one focus).
    <div data-focus-group className="flex h-full min-h-0" style={{ gap }}>
      <Card data-load-box className="h-full shrink-0 items-center justify-center gap-0 py-0" style={{ width: side }}>
        <Avatar
          role="button"
          tabIndex={0}
          data-hey-face
          aria-label={`Say hi to ${profile.name}`}
          onClick={(e) => popHey(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              popHey(e.currentTarget);
            }
          }}
          className="cursor-pointer transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-[calc(6px_+_var(--stroke-accent))] focus-visible:outline-ring"
          style={{ width: face, height: face }}
        >
          <AvatarImage src={profile.avatar.src} alt={profile.avatar.alt} className="bg-muted" />
          <AvatarFallback>{profile.initials}</AvatarFallback>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-[calc(-3px_-_var(--stroke-accent)_/_2)] left-[calc(-3px_-_var(--stroke-accent)_/_2)] size-[calc(100%_+_6px_+_var(--stroke-accent))] overflow-visible fill-none stroke-(length:--stroke-accent)"
          >
            <circle cx="50%" cy="50%" r="50%" className="stroke-lime" />
          </svg>
        </Avatar>
      </Card>
      <Card data-load-box size="sm" className="h-full min-h-0 min-w-0 flex-1 justify-center" data-density={narrow ? "compact" : "full"}>
        <CardContent className="flex min-h-0 flex-col justify-center">
          {/* Balanced, so a role line that runs to two is "Senior Full / Stack Developer", not a word on its own. */}
          <Text role={name} as="h1" align="center" className="text-balance">
            {profile.name}
          </Text>
          <Text role="label" tone="lime" align="center" className={cn("text-balance", narrow ? "mt-1" : "mt-1.5")}>
            {profile.role}
          </Text>
        </CardContent>
      </Card>
      {heyOverlay}
    </div>
  );
}

/**
 * His tagline, behind the field (Portfolio.md P4, amended 2026-09-27, his: "move the tagline from the top of the card
 * to just above the nav bar, make it much more bigger. Instead of making it part of the grid it should look like it's
 * behind the cells"). It is no box on the grid: the first page keeps rows free for it over the pager's
 * (`PortfolioItem.backdrop`), and the renderer draws it there before the grid, so the field's dashes and the pointer's
 * ring are drawn over its letters and the cards stand in front of it.
 *
 * **A letter a cell, and a space an empty cell** (his, 2026-09-27: "divide each letter between each cell, and space
 * will be an empty cell") — `TaglineCells`, wherever the backdrop's cells hold it: every word whole on a row, a sentence
 * starting a row. Where they do not — a word longer than the band, more rows than the page keeps — it is two lines of
 * text, a sentence a line (`TaglineText`). Either way it is the role line's text, `label` — the heading face, bold, in
 * capitals, at its own size — and keeps the `faint` tone (his, the same day: "use the text that is used for senior full
 * stack developer. Do not change the text color … I wanted the same font size too"); it was Anton, the HEY!'s face,
 * scaled to the box.
 *
 * After the last line, on its baseline, **— @hiddenstack** in `caption` and the `lime` tone (Type.md T4): a button
 * that sets off the avatar's HEY! (`useHey`). It is the one thing in the tagline that is drawn over the grid, so it
 * can be pressed.
 */
export function ProfileTagline({ cols, rows }: { cols: number; rows: number }) {
  const { pop, overlay } = useHey();
  const [first, second] = profile.tagline;
  const lines = taglineRows([`“${first}`, `${second}”`], cols, rows);
  const press = (e: MouseEvent<HTMLElement>) => pop(document.querySelector<HTMLElement>("[data-hey-face]") ?? e.currentTarget);
  return (
    <>
      {lines ? <TaglineCells lines={lines} cols={cols} onPress={press} /> : <TaglineText first={first} second={second} onPress={press} />}
      {overlay}
    </>
  );
}

/**
 * The tagline's words on rows of `cols` cells, first-fit, every sentence starting a row — or null where the cells do
 * not hold it: a word longer than a row, more rows than `rows`, or a last row with no cell after it for the handle.
 */
function taglineRows(sentences: string[], cols: number, rows: number): string[] | null {
  const out: string[] = [];
  for (const sentence of sentences) {
    let line = "";
    for (const word of sentence.split(" ")) {
      if (word.length > cols) return null;
      if (line && line.length + 1 + word.length > cols) {
        out.push(line);
        line = word;
      } else line = line ? `${line} ${word}` : word;
    }
    out.push(line);
  }
  return out.length <= rows && out[out.length - 1].length < cols ? out : null;
}

/**
 * A letter a cell: the backdrop is laid out on the field's own cells (the renderer hands it `--grid-cell` and
 * `--grid-gap`), each row centred on the band — an odd remainder leans left, as `arrange` centres a block — and the rows
 * at its foot, over the pager's. Each letter is centred in its cell. The letters are hidden from assistive technology
 * and the sentence is read once, whole.
 */
function TaglineCells({ lines, cols, onPress }: { lines: string[]; cols: number; onPress: (e: MouseEvent<HTMLElement>) => void }) {
  const from = (line: string) => Math.floor((cols - line.length) / 2) + 1;
  const last = lines[lines.length - 1];
  return (
    <Text
      role="label"
      tone="faint"
      as="blockquote"
      // The label's own tracking is dropped: a letter alone in a cell is spaced by the grid, and the tracking after it
      // would only push it off its cell's centre.
      className="grid size-full content-end tracking-normal"
      style={{ gridTemplateColumns: `repeat(${cols}, var(--grid-cell))`, gridAutoRows: "var(--grid-cell)", gap: "var(--grid-gap)" }}
    >
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.flatMap((line, row) =>
        [...line].map((letter, i) =>
          letter === " " ? null : (
            <span key={`${row}-${i}`} aria-hidden className="flex items-center justify-center" style={{ gridRow: row + 1, gridColumn: from(line) + i }}>
              {letter}
            </span>
          ),
        ),
      )}
      {/* From the cell after the last letter to the row's end. Its inner line is the letters' — the label's, centred in
          the cell — so the handle sits on their baseline. */}
      <span className="flex items-center" style={{ gridRow: lines.length, gridColumn: `${from(last) + last.length} / -1` }}>
        <span className="whitespace-nowrap">
          <TaglineHandle onPress={onPress} />
        </span>
      </span>
    </Text>
  );
}

/**
 * The tagline as two lines of text where its cells do not hold it: in quotes, a sentence a line, centred, at the foot
 * of its rows. The handle takes no width in the second line, so the two lines are centred on each other and it hangs
 * past the second (his, 2026-09-27: "text align center the portfolio tagline"); where the box has no room for it
 * there, under TAGLINE_NARROW, it takes its own line under the second.
 */
function TaglineText({ first, second, onPress }: { first: string; second: string; onPress: (e: MouseEvent<HTMLElement>) => void }) {
  return (
    <div className="@container flex size-full flex-col items-center justify-end">
      <Text role="label" tone="faint" as="blockquote" align="center">
        <span className="block whitespace-nowrap">&ldquo;{first}</span>
        <span className="block whitespace-nowrap">
          {second}&rdquo;
          {/* No width of its own, so the line alone is centred and the handle hangs past its end, on its baseline. */}
          <span className="inline-block w-0 @max-[420px]:block @max-[420px]:w-auto">
            {/* A step of the spacing scale after the quote (ms-2, ICON_GAP); its own line where the box is narrow. */}
            <TaglineHandle onPress={onPress} className="ms-2 @max-[420px]:mx-auto @max-[420px]:mt-1 @max-[420px]:block" />
          </span>
        </span>
      </Text>
    </div>
  );
}

/**
 * **— @hiddenstack**, the tagline's one pressable piece. Its own tracking, weight and case: the tagline's are the
 * label's, and its wide tracking is an em of the tagline's size that inherits as a length, and a button inherits its
 * bold (and its capitals, where the browser's own style does not take them off).
 */
function TaglineHandle({ onPress, className }: { onPress: (e: MouseEvent<HTMLElement>) => void; className?: string }) {
  return (
    <Text
      as="button"
      data-handle
      role="caption"
      tone="lime"
      aria-label={`Say hi to ${profile.name}`}
      onClick={onPress}
      className={cn(
        "pointer-events-auto relative z-10 inline-block cursor-pointer font-normal tracking-normal normal-case whitespace-nowrap underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      &mdash; @{profile.handle}
    </Text>
  );
}

/** The width of a run of `n` cells and the gutters between them. */
const cells = (n: number, cell: number, gap: number) => n * cell + (n - 1) * gap;

/**
 * The first screen's line icons — the pin, the briefcase and the résumé's arrow — are one size, 20px, the line of the
 * `body` text they sit with, and so one weight: lucide's line grows with its box, and at the marks' 26px the briefcase
 * drew a 2.17px line where the pin's 16px drew 1.33 (his, 2026-09-26: "they are inconsistent"). The lines between the
 * marks are as tall as an icon, and an icon and its words are a step of the spacing scale apart. The size is an inline
 * style so that it wins over a Button's own icon size. The row of marks (`profile-work.tsx`) shares them.
 */
export const ICON = 20;
export const icon = { width: ICON, height: ICON };
export const ICON_GAP = GRID_SPACING[2];

/**
 * The row under the address (Portfolio.md P4, amended 2026-09-27, his: "underneath that we will have education and
 * location"): GitHub's mark on a cell of its own (2026-09-28, his: "shrink the width of the education and on the left
 * of it add GitHub link button"), the degree's pill taking what the mark and the city leave, and a pin and Hyderabad
 * on two cells, each a Card one row tall, which the radius (Grid.md D39) makes a pill, its content centred. One row at
 * every size: the degree is five cells on a pointer's eight, three on six, where it gets denser (`EducationPill`). The
 * pin and the city are about 100px, which two of a phone's cells (108 to 114px) only touch, so there the city goes
 * without its pin (P5): the word alone is 66px.
 */
export function ProfileFacts() {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const two = cells(2, cell, gap);
  return (
    <div className="flex h-full min-h-0" style={{ gap }}>
      <div className="flex-none" style={{ width: cell }}>
        <SocialMark id="github" />
      </div>
      <EducationPill className="flex-1" />
      <FactCard className="flex-none" style={{ width: two }}>
        {two >= 130 ? <MapPinIcon aria-hidden className="shrink-0" style={icon} /> : null}
        <Text as="span">{profile.city}</Text>
      </FactCard>
    </div>
  );
}

/**
 * The degree under its cap, and the school and the years under the degree in `caption`, the two lines centred in a
 * pill a row tall (2026-09-27, his: "increase the Btech card to two rows and add LPU and years", then "can we fit the
 * same in 1 row?"). Two lines are 36px, which a row's pill holds inside its round ends. It says the subject alone
 * (his, the same day: "remove B.Tech in and put in only computer science honors"), and it is in the profile's column
 * since then, with no section label beside it, so it keeps its cap. **Denser as it narrows** (P5, 2026-09-28, when
 * GitHub took a cell of its row): the subject is 175px and 203 with its cap, so under 228px (three cells of 60, 1440 ×
 * 900) the cap goes, and under 190 (three of a phone's cells) the subject steps down to the caption's size.
 */
export function EducationPill({ className }: { className?: string }) {
  return (
    <FactCard className={cn("@container h-full", className)}>
      <GraduationCapIcon aria-hidden className="shrink-0 @max-[227px]:hidden" style={icon} />
      <span className="flex flex-col items-center">
        <Text as="span" className="@max-[189px]:text-xs">
          {EDUCATION.subject}
        </Text>
        <Text as="span" role="caption">
          {EDUCATION.short} · {EDUCATION.from} — {EDUCATION.to}
        </Text>
      </span>
    </FactCard>
  );
}

/** A fact's pill, its content centred — across the whole pill: the pill's round ends are its air. */
export function FactCard({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <Card data-load-box size="sm" className={cn("min-h-0 min-w-0 justify-center py-0", className)} style={style}>
      <CardContent className="flex items-center justify-center px-0 whitespace-nowrap" style={{ gap: ICON_GAP }}>
        {children}
      </CardContent>
    </Card>
  );
}

/**
 * The résumé: Résumé ↗ on a lime button two cells wide and one row tall — the system's own Button, filled with the
 * primary (2026-09-28, his, from the recruiter quick view: "I also like the resume button with filled lime color"; it
 * was the lime word on a card, the muted fill under the pointer). It opens in a new tab, as the arrow says.
 */
function ResumeButton({ width }: { width: number }) {
  const link = LINKS.find((each) => each.id === "resume");
  if (!link?.href) return null;
  return (
    <Button asChild data-load-box className="h-full shrink-0 px-0 font-normal tracking-normal normal-case" style={{ width, gap: ICON_GAP }}>
      <a href={link.href} target="_blank" rel="noreferrer" aria-label={`${link.label} (PDF, opens in a new tab)`}>
        <Text as="span" className="text-primary-foreground">
          {link.label}
        </Text>
        <ArrowUpRightIcon aria-hidden className="shrink-0" style={icon} />
      </a>
    </Button>
  );
}

/**
 * The address and the résumé, under his words (his, 2026-09-27: "under that we will have resume email and GitHub"):
 * his address in a card with a button that copies it (`EmailCard`), then Résumé ↗ on two cells at the row's right end
 * (2026-09-28, his: "instead of placing resume on the left of email place it on the right side of email"), the address
 * taking what the résumé leaves — one row at every size, 6 · 2 on a pointer's eight cells and 4 · 2 on six, which the
 * address and its button need. GitHub went to the row of marks under the degree the same day, and into the degree's
 * own row on 2026-09-28 (`ProfileFacts`).
 */
export function ProfileLinks() {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  return (
    <div className="flex h-full min-h-0" style={{ gap }}>
      <EmailCard className="flex-1" />
      <ResumeButton width={cells(2, cell, gap)} />
    </div>
  );
}

/**
 * LinkedIn's mark, the "in" in its rounded square: simple-icons drew it until LinkedIn asked icon sets to take it out
 * (v10), and lucide has no brand marks, so its path is here — the mark as simple-icons last drew it, on the same 24-unit
 * box as the others.
 */
const LINKEDIN = {
  path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

/** Each social link's mark — simple-icons' (CC0) as GitHub's pill had it, and LinkedIn's. */
const SOCIAL_MARKS: Partial<Record<Link["id"], Pick<SimpleIcon, "path">>> = {
  github: siGithub,
  x: siX,
  instagram: siInstagram,
  youtube: siYoutube,
  linkedin: LINKEDIN,
  discord: siDiscord,
};
/**
 * The marks left in the row under the degree. GitHub went into the degree's row, and X and Instagram into the content
 * section with YouTube (2026-09-28, his: "move Instagram X to content section … and also add YouTube").
 */
const SOCIALS: Link["id"][] = ["linkedin", "discord"];

/**
 * One social link's mark on the cell it is given: a Card the radius makes a circle, as the company marks are, the mark
 * in the text's colour — as the tech's marks and the cap and the pin are (his, 2026-09-27: "why are the social icons
 * lime color? It looks very inconsistent"; they were lime, as the links are) — and its name as its tooltip. **One with
 * a URL is a link out in a new tab; one without is its mark alone**, not pressed and not a Tab stop, until he gives it
 * (his, the same day: "add them too, we'll add the URLs later" — LinkedIn and Discord, then YouTube; the one exception
 * to P6's "a link with no value is not rendered"). GitHub's stands in the degree's row, X, Instagram and YouTube in the
 * content section (`site.tsx`), LinkedIn and Discord in the row under the degree (`ProfileSocials`).
 */
export function SocialMark({ id }: { id: Link["id"] }) {
  const link = LINKS.find((each) => each.id === id);
  const path = SOCIAL_MARKS[id]?.path;
  if (!link || !path) return null;
  const mark = (
    <svg aria-hidden viewBox="0 0 24 24" className="shrink-0 fill-current text-foreground" style={icon}>
      <path d={path} />
    </svg>
  );
  return (
    <TooltipProvider>
      <Card data-load-box size="sm" className="size-full justify-center py-0">
        <Tooltip>
          <TooltipTrigger asChild>
            {link.href ? (
              <Button asChild variant="ghost" className="size-full px-0">
                <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                  {mark}
                </a>
              </Button>
            ) : (
              <span role="img" aria-label={link.label} className="flex size-full items-center justify-center">
                {mark}
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent>{link.label}</TooltipContent>
        </Tooltip>
      </Card>
    </TooltipProvider>
  );
}

/**
 * The row of social marks under the degree, the last of the profile's column (his, 2026-09-27: "remove socials as a
 * section and add social media icons like X, Instagram along with GitHub. Put that row under education row"): a mark a
 * cell (`SocialMark`), LinkedIn and Discord since 2026-09-28. The marks stand on the field's own cells, centred on the
 * column, an odd remainder leaning left as a block does (P8).
 */
export function ProfileSocials({ cols }: { cols: number }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const ids = SOCIALS.filter((id) => LINKS.some((each) => each.id === id) && SOCIAL_MARKS[id]).slice(0, cols);
  const lead = Math.max(0, Math.floor((cols - ids.length) / 2));
  return (
    <ul aria-label="Elsewhere" className="flex h-full min-h-0" style={{ gap, paddingInlineStart: lead * (cell + gap) }}>
      {ids.map((id) => (
        <li key={id} className="flex-none" style={{ width: cell }}>
          <SocialMark id={id} />
        </li>
      ))}
    </ul>
  );
}

/** How long the copy button wears its check after a copy. */
const COPIED_MS = 1600;

/**
 * His address and a button that copies it (2026-09-27, his: "replace Email button with card containing my email …
 * and copy button to copy email to clipboard"): the address in the text's colour, which a click selects whole (the
 * grid's boxes are otherwise not selectable), and the button in lime, the colour of what is pressed here. A copy
 * swaps the button's icon for a check for a moment; where the browser refuses the clipboard, the address is selected
 * instead, for the keys to copy.
 */
function EmailCard({ className }: { className?: string }) {
  const address = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
    } catch {
      if (address.current) window.getSelection()?.selectAllChildren(address.current);
    }
  };
  return (
    <Card data-load-box size="sm" className={cn("@container h-full min-h-0 min-w-0 justify-center py-0", className)}>
      {/* The address and its button a step of the spacing scale apart, as an icon and its words are everywhere on the
          first screen (`ICON_GAP`, gap-2; his, 2026-09-27: "add some spacing between email and copy icon, feels too
          tight"). It was a half step, which a card too narrow for the step keeps — an iPhone SE's four cells, 228px,
          where the step would push the address into the card's round ends. */}
      <CardContent className="flex items-center justify-center gap-2 px-0 whitespace-nowrap @max-[235px]:gap-1">
        {/* A step down in a card as narrow as an SE's or narrower, as the education pill's subject steps: a 360px
            phone's card is 220px, and the address, the gap and the button need 223 — at the body size they ran past it. */}
        <span ref={address} className="select-all">
          <Text as="span" className="@max-[227px]:text-xs">{profile.email}</Text>
        </span>
        <Button variant="ghost" size="icon-xs" aria-label={copied ? "Copied" : `Copy ${profile.email}`} onClick={copy}>
          {copied ? <CheckIcon aria-hidden className="text-lime" style={icon} /> : <CopyIcon aria-hidden className="text-lime" style={icon} />}
        </Button>
      </CardContent>
    </Card>
  );
}
