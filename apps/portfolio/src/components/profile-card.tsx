"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { preload } from "react-dom";
import { ArrowUpRightIcon, DownloadIcon, MailIcon } from "lucide-react";
import { siDiscord, siGithub, siInstagram, siX, type SimpleIcon } from "simple-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@no-origins/ui/components/avatar";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent } from "@no-origins/ui/components/card";
import { GRID_SPACING, useGridMetrics } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import { drawBand, MarkBand } from "@/components/band";
import { HEY_MOTIONS, HeyOverlay, type HeyMotion, type HeyOrigin } from "@/components/hey-overlay";
import { LINKS, profile, type Link } from "@/content/resume";

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

/**
 * The profile card — the first thing on the portfolio (Portfolio.md P4): one row, his avatar and beside it his name
 * with the role line under it, and nothing else — his call, 2026-09-25: everything under the role line went. An
 * app-specific island composed from the design system and nothing else. A Card is already a box, so it goes on the
 * grid unwrapped (Grid.md D21).
 *
 * **No company marks here** — his call, 2026-09-21 (P9): the first screen is who he is, and the four marks say where
 * he has been, which is what the Work screen is for.
 *
 * It is sized by the slot it is in, and a slot clips (Slots.md), so the card reads its own size off the grid (P5): a
 * narrow card — a phone's — steps the avatar and the name down, and on a pointer's two rows, 40px short of a touch pair, the face
 * gives up 8px so the row still clears the card's padding. Nothing in it scrolls.
 */
export function ProfileCard({ colSpan, rowSpan }: { colSpan: number; rowSpan: number }) {
  const m = useGridMetrics();
  const height = m ? rowSpan * m.cell + (rowSpan - 1) * m.gap : 564;
  const width = m ? colSpan * m.cell + (colSpan - 1) * m.gap : 564;
  // A phone's card: since every field is six across (Grid.md D33) a phone's is the whole field, 294 to 402px wide.
  const narrow = width < 420;
  // The padding is the small card's whenever the row is short, which on two rows it always is; the face is the full
  // 96px where the room under that padding holds it, 88px where it does not.
  const short = height < 180;
  const face = narrow ? "size-16" : height - 40 >= 96 ? "size-24" : "size-22";

  // A ring round the face in the HEY's two colours (his, 2026-09-24): lime 70%, violet 25%, and the 5% left as two
  // equal gaps where they meet. Violet is the lower-right quarter, 3 o'clock to 6, and lime the rest — the split turned
  // 45° off the vertical, as he had the two halves before he set the shares. One dashed circle per colour in an SVG
  // inside the Avatar, 3px clear of its edge, so the box the overlay measures is still the face's. The stroke is the
  // design system's `--stroke-accent` (3px — his, after a pass at 5), and everything is laid out from it in CSS: the
  // SVG is the ring's centre line (the face, the 3px clearance and half a stroke each side), the circle is 50% of it,
  // and `pathLength` makes the dashes hundredths of the circle at any size. They start at 3 o'clock and run clockwise.
  // The focus outline sits 3px outside the ring.

  // The face is page 1's one image that the intro cannot see: Radix's AvatarImage renders no <img> until it has loaded,
  // so there is nothing in the field for the intro's wait (Grid.md D31) to hold for. Preloaded from the head, it is
  // fetched at once and holds the window's load, which the intro does wait for.
  preload(profile.avatar.src, { as: "image", fetchPriority: "high" });

  // Click the face and it pops out to say hello (`useHey`). We grab the avatar's own rect off the event so the clone
  // leaps from exactly where it sits — no ref, because Avatar forwards onClick to its root but not a ref.
  const { pop: popHey, overlay: heyOverlay } = useHey();

  return (
    <>
    <Card size={narrow || short ? "sm" : "default"} className="h-full min-h-0" data-density={narrow ? "compact" : "full"}>
      <CardContent className={cn("flex min-h-0 flex-1 items-center", narrow ? "gap-5" : "gap-6")}>
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
          className={cn(
            "cursor-pointer transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-[calc(6px_+_var(--stroke-accent))] focus-visible:outline-ring",
            face
          )}
        >
          <AvatarImage src={profile.avatar.src} alt={profile.avatar.alt} className="bg-muted" />
          <AvatarFallback>{profile.initials}</AvatarFallback>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-[calc(-3px_-_var(--stroke-accent)_/_2)] left-[calc(-3px_-_var(--stroke-accent)_/_2)] size-[calc(100%_+_6px_+_var(--stroke-accent))] overflow-visible fill-none stroke-(length:--stroke-accent)"
          >
            <circle cx="50%" cy="50%" r="50%" pathLength={100} className="stroke-violet" strokeDasharray="25 75" />
            <circle cx="50%" cy="50%" r="50%" pathLength={100} className="stroke-lime" strokeDasharray="70 30" strokeDashoffset={-27.5} />
          </svg>
        </Avatar>
        <div className="min-w-0">
          {/* Balanced, so a phone's two lines are "Bhargav / Reddy V" rather than "Bhargav Reddy / V". */}
          <Text role={narrow ? "title" : "display"} as="h1" className="text-balance">
            {profile.name}
          </Text>
          <Text role="label" tone="muted" className="mt-1.5 text-balance">
            {profile.role} @ {profile.company.name}
          </Text>
        </div>
      </CardContent>
    </Card>
    {heyOverlay}
    </>
  );
}

/**
 * His tagline over the card (Portfolio.md P4, 2026-09-25): in the display face — the app's `--font-display`, Anton,
 * the HEY!'s — at the `display` size, in the `faint` tone (Type.md T3), in quotes, a sentence a line. Straight on the
 * grid with no box, at the foot of its slot so it stands a gutter over the card. It is out of the flow (`above`): the
 * card is centred as if it were alone and this takes the rows over it. Anton has one weight, so the role's bold is put
 * back to normal rather than let the browser fake a heavier one. On a phone (under 420px wide) it steps down to
 * `title`, as the card's name does: the second line is 326px at `display`, and a phone's six columns are 294 to 402.
 *
 * After the second line, on its baseline, **— @hiddenstack** in `caption` and the `lime` tone (Type.md T4), his: a
 * button, and pressing it sets off the avatar's HEY! (`useHey`), the face leaping from the card as if it had been
 * clicked. On a phone it takes its own line under the second, at its own height, rather than break the sentence.
 */
export function ProfileTagline({ colSpan }: { colSpan: number }) {
  const m = useGridMetrics();
  const width = m ? colSpan * m.cell + (colSpan - 1) * m.gap : 564;
  const [first, second] = profile.tagline;
  const { pop, overlay } = useHey();
  return (
    <Slot fill="transparent" alignY="end">
      <Text role={width < 420 ? "title" : "display"} tone="faint" as="blockquote" className="font-(family-name:--font-display) font-normal">
        <span className="block whitespace-nowrap">&ldquo;{first}</span>
        <span className="block">
          <span className="whitespace-nowrap">{second}&rdquo;</span>{" "}
          <Text
            as="button"
            role="caption"
            tone="lime"
            aria-label={`Say hi to ${profile.name}`}
            onClick={(e) => pop(document.querySelector<HTMLElement>("[data-hey-face]") ?? e.currentTarget)}
            // On a phone its own line, at its own height: wrapped inline, its line took the tagline's 36px and the tagline
            // ran past its two rows on the narrowest phones.
            className={cn(
              "cursor-pointer whitespace-nowrap underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              width < 420 ? "mt-1 block" : "inline"
            )}
          >
            &mdash; @{profile.handle}
          </Text>
        </span>
      </Text>
      {overlay}
    </Slot>
  );
}

/**
 * One line under the card (Portfolio.md P4, 2026-09-25): a mark on exactly one cell of the grid — no tile, no ring, no
 * box, the way the company marks sit on theirs (P12) — and what it says beside it, starting on the next cell's line.
 * The item is one row tall, so the cell is the slot's own height and its left edge is a field line.
 */
function FactLine({ mark, children }: { mark: ReactNode; children: ReactNode }) {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  return (
    <Slot fill="transparent">
      <div className="flex h-full min-w-0 items-center" style={{ gap }}>
        <div className="flex shrink-0 items-center justify-center" style={{ width: cell, height: cell }}>
          {mark}
        </div>
        {/* A phone's cell has given way to the six columns (Grid.md D33), 39 to 57px: `heading` wraps the years to two
            lines there, 56px, and the row clips it, so a phone's words are `body`. */}
        <Text role={cell < 60 ? "body" : "heading"} tone="muted">
          {children}
        </Text>
      </div>
    </Slot>
  );
}

/** "6+" in the display face (Anton, one weight, so not bolded), then how long he has been shipping. */
export function ProfileShipping() {
  return (
    <FactLine
      mark={
        <Text role="display" as="span" className="font-(family-name:--font-display) font-normal">
          {profile.shipping.figure}
        </Text>
      }
    >
      {profile.shipping.line}
    </FactLine>
  );
}

/**
 * The Charminar, his picture of Hyderabad, straight on its cell: black ink with the white made transparent, so the
 * field shows through it and the dark theme turns the ink light. It keeps its proportion — upright, the cell's full
 * height. The name is printed beside it, so the picture has no alt of its own.
 */
export function ProfileCity() {
  return (
    <FactLine
      // eslint-disable-next-line @next/next/no-img-element -- a static mark at its own size, no optimisation wanted
      mark={<img src={profile.city.mark} alt="" className="size-full object-contain dark:invert" />}
    >
      {profile.city.name}
    </FactLine>
  );
}

/** The brand marks, from simple-icons (CC0): path data on a 24-unit box, drawn in the text's own colour. */
const BRAND: Partial<Record<Link["id"], SimpleIcon>> = { github: siGithub, discord: siDiscord, x: siX, instagram: siInstagram };

/**
 * Marks drawn a step of the spacing scale smaller than half the cell — his, 2026-09-25: "reduce the size of X icon by
 * one token, and also the download icon". X fills its whole 24-unit box, and lucide's arrow is stroked, so at the
 * same size both read bigger than the three filled marks beside them.
 */
const SMALLER: Link["id"][] = ["x", "resume"];

/**
 * The row of links under the city (Portfolio.md P4, 2026-09-25, his): GitHub, Discord, X, Instagram and the résumé,
 * each on exactly one cell and nothing else in it — the mark at half the cell, centred (X and the download a step
 * smaller, `SMALLER`), and the Work page's hover band
 * under it (P13): violet, lime, violet along the row, drawn in on the pointer and out when it leaves — but the cell's
 * full width, edge to edge, rather than sized off the mark, so the whole icon stands on it (`MarkBand`'s `edge`). Where
 * it has reached, a lime band shows the icon in its own dark ink (`--lime-foreground`), so it reads in both themes. Each cell is a `Button` (`ghost`, its hover fill taken off: the band is the hover),
 * a link out in a new tab, or the résumé's download. A link with no URL yet shows its mark and goes nowhere — no cursor,
 * not focusable — until he gives it one. Five cells fit every band, a phone's six included (Grid.md D33).
 */
export function ProfileLinks() {
  const m = useGridMetrics();
  const cell = m?.cell ?? 60;
  const gap = m?.gap ?? 12;
  const ids: Link["id"][] = ["github", "discord", "x", "instagram", "resume"];
  const links = ids.map((id) => LINKS.find((link) => link.id === id)).filter((link): link is Link => !!link);
  return (
    <Slot fill="transparent">
      <div className="flex flex-wrap content-start" style={{ gap }}>
        {links.map((link, index) => (
          <LinkCell key={link.id} link={link} cell={cell} accent={index % 2 ? "lime" : "violet"} />
        ))}
      </div>
    </Slot>
  );
}

function LinkCell({ link, cell, accent }: { link: Link; cell: number; accent: "lime" | "violet" }) {
  const fill = useRef<HTMLSpanElement>(null);
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === "touch" || !fill.current) return;
    drawBand(fill.current, event.type === "pointerenter");
  };
  const icon = Math.round(cell / 2) - (SMALLER.includes(link.id) ? GRID_SPACING[1] : 0);
  const file = link.href?.startsWith("/");
  const label = file ? `Download ${link.label.toLowerCase()}` : link.label;
  return (
    // No border: the Button's own transparent 1px would sit the band a pixel inside the cell's edges.
    <Button asChild variant="ghost" className="relative border-0 p-0 hover:bg-transparent dark:hover:bg-transparent" style={{ width: cell, height: cell }}>
      <a
        href={link.href}
        // Without a URL it is a picture of the mark, not a link: an <a> with no href has no role to carry its name.
        role={link.href ? undefined : "img"}
        aria-label={link.href ? label : `${label} (link to come)`}
        title={label}
        target={link.href && !file ? "_blank" : undefined}
        rel={link.href && !file ? "noreferrer" : undefined}
        download={file ? "" : undefined}
        className={link.href ? "cursor-pointer" : "cursor-default"}
        onPointerEnter={onPointer}
        onPointerLeave={onPointer}
      >
        <LinkMark link={link} size={icon} />
        {/* The band goes over the mark and carries it again as ink: dark on lime, which the theme's light mark is not
            on the dark page (1.3 : 1); on violet the mark's own colour, which reads in both themes. */}
        <MarkBand box={cell} mark={icon} edge accent={accent} fill={fill} ink={<LinkMark link={link} size={icon} className={accent === "lime" ? "text-lime-foreground" : undefined} />} />
      </a>
    </Button>
  );
}

/** A link's mark: its brand's path from simple-icons, or lucide's arrow down for the résumé. */
function LinkMark({ link, size, className }: { link: Link; size: number; className?: string }) {
  const brand = BRAND[link.id];
  return brand ? (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("shrink-0 fill-current", className)} style={{ width: size, height: size }}>
      <path d={brand.path} />
    </svg>
  ) : (
    <DownloadIcon aria-hidden className={cn("shrink-0", className)} style={{ width: size, height: size }} />
  );
}
