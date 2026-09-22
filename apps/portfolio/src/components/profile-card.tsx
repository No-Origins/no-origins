"use client";

import { ArrowUpRightIcon, AtSignIcon, BriefcaseIcon, DownloadIcon, MailIcon, MapPinIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@no-origins/ui/components/avatar";
import { Badge } from "@no-origins/ui/components/badge";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader } from "@no-origins/ui/components/card";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

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

/**
 * The profile card — the first thing on the portfolio (Portfolio.md P4): his avatar, his name, then what he does and
 * where, a few lines about him, and the ways to reach him. An app-specific island composed from the design system and
 * nothing else. A Card is already a box, so it goes on the grid unwrapped (Grid.md D21).
 *
 * **No company marks here** — his call, 2026-09-21 (P9): the first screen is who he is, and the four marks say where
 * he has been, which is what the Work screen is for. They earned their room there and were noise here. The blurb
 * takes the row they were on.
 *
 * It is sized by the slot it is in, and a slot clips (Slots.md), so the card reads its own size off the grid and gets
 * denser as it gets smaller rather than cutting its footer off (P5): a narrow card steps the avatar and the name down;
 * a short card clamps the blurb, then drops it. Nothing in it scrolls.
 */
export function ProfileCard({ colSpan, rowSpan }: { colSpan: number; rowSpan: number }) {
  const m = useGridMetrics();
  const height = m ? rowSpan * m.cell + (rowSpan - 1) * m.gap : 564;
  const width = m ? colSpan * m.cell + (colSpan - 1) * m.gap : 564;
  const narrow = width < 360;
  const short = height < 480;
  const compact = narrow || short;
  const showBlurb = height >= 340;
  // The marks' row went back to the blurb, so a tall card runs a line or two more of it than it used to.
  const blurbLines = short ? "line-clamp-4" : narrow ? undefined : "line-clamp-7";

  return (
    <Card size={compact ? "sm" : "default"} className="h-full min-h-0 gap-5" data-density={compact ? "compact" : "full"}>
      <CardHeader className="gap-0">
        <Avatar className={cn("mb-4", compact ? "size-16" : "size-24")}>
          <AvatarImage src={profile.avatar.src} alt={profile.avatar.alt} className="bg-muted" />
          <AvatarFallback>{profile.initials}</AvatarFallback>
        </Avatar>
        <Text role={compact ? "title" : "display"} as="h1">
          {profile.name}
        </Text>
        <Text role="label" tone="muted" className="mt-1.5">
          {profile.role} · {profile.company.name}
        </Text>
      </CardHeader>

      {/* justify-between: a taller slot spreads the air between the blurb and the facts rather than pooling it in one
          hole above the footer (seen on the phone once the top row was given back, 2026-09-21). */}
      <CardContent className="flex min-h-0 flex-1 flex-col justify-between gap-4">
        {showBlurb ? (
          <Text role="body" tone="muted" className={cn("max-w-prose", blurbLines)}>
            {profile.blurb}
          </Text>
        ) : null}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <Badge variant="secondary">
            <MapPinIcon /> {profile.location}
          </Badge>
          <Badge variant="secondary">
            <BriefcaseIcon /> {profile.years}
          </Badge>
          <Badge variant="secondary">
            <AtSignIcon /> {profile.handle}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex-wrap gap-2">
        <LinkButtons ids={["email", "github", "resume"]} size={compact ? "xs" : "sm"} />
      </CardFooter>
    </Card>
  );
}
