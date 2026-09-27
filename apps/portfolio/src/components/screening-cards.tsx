"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRightIcon, BookOpenIcon, BriefcaseBusinessIcon, CheckIcon, CodeXmlIcon, CopyIcon, FolderGit2Icon, GraduationCapIcon, MapPinIcon, MoonIcon, PaletteIcon, SunIcon, type LucideIcon } from "lucide-react";
import { siDiscord, siGithub, siInstagram, siLanggraph, siNextdotjs, siPostgresql, siPython, siReact, siTypescript, siX, type SimpleIcon } from "simple-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@no-origins/ui/components/avatar";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent } from "@no-origins/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@no-origins/ui/components/dialog";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { ScrollArea } from "@no-origins/ui/components/scroll-area";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { useThemeToggle } from "@no-origins/ui/components/theme-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import { cn } from "@no-origins/ui/lib/utils";

import { CompanyLogo } from "@/components/logo";
import { EDUCATION, LINKS, profile, PROJECTS, STACK } from "@/content/resume";
import { SCREENING, SCREENING_WORK } from "@/content/screening";

export const RESUME_URL = LINKS.find((link) => link.id === "resume")!.href!;
export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-foreground";
const actionType = "font-normal tracking-normal normal-case";

export function SectionLabel({ children, icon: Icon }: { children: ReactNode; icon: LucideIcon }) {
  return (
    <Slot fill="background" inset={12} alignX="center" alignY="center">
      <div className="flex items-center gap-2">
        <Icon aria-hidden className="size-5 shrink-0 text-secondary" />
        <Text as="h2">{children}</Text>
      </div>
    </Slot>
  );
}

export const SECTION_ICONS = { work: BriefcaseBusinessIcon, projects: FolderGit2Icon, skills: CodeXmlIcon, interests: PaletteIcon };

export function Identity({ reading = false }: { reading?: boolean }) {
  const metrics = useGridMetrics();
  const side = reading ? 96 : 2 * (metrics?.cell ?? 60) + (metrics?.gap ?? 12);
  const avatar = reading ? 72 : side - 32;
  return (
    <div className="flex h-full min-w-0 gap-3" data-profile-identity>
      <Card className="shrink-0 items-center justify-center gap-0 py-0" style={{ width: side, minHeight: side }}>
        <Avatar className="ring-(length:--stroke-accent) ring-lime ring-offset-4 ring-offset-card" style={{ width: avatar, height: avatar }}>
          <AvatarImage src={profile.avatar.src} alt={profile.avatar.alt} />
          <AvatarFallback>{profile.initials}</AvatarFallback>
        </Avatar>
      </Card>
      <Card size="sm" className="min-w-0 flex-1 justify-center gap-1 px-3 py-3" data-fit-check>
        <Text as="h1" role="heading" align="center" className="text-balance" tabIndex={-1}>{profile.name}</Text>
        <Text role="caption" tone="foreground" align="center" className="text-balance">{profile.role}</Text>
        <Text role="caption" align="center">6+ years · Hyderabad</Text>
      </Card>
    </div>
  );
}

export function Introduction({ compact = false }: { compact?: boolean }) {
  return (
    <Card size="sm" className={cn("h-full justify-center gap-2 px-5 py-3", compact && "px-4 py-1")} data-fit-check>
      <Text align={compact ? "center" : "start"}>{SCREENING.introduction}</Text>
      {!compact && <>
        <Text tone="muted">{SCREENING.experience}</Text>
        <Text role="caption">{SCREENING.outlook}</Text>
      </>}
    </Card>
  );
}

function ResumeAction({ width }: { width?: number }) {
  return (
      <Button asChild className={cn("h-full min-h-11 shrink-0", actionType, FOCUS)} style={width ? { width } : undefined}>
        <a href={RESUME_URL} target="_blank" rel="noreferrer" aria-label="Résumé (PDF, opens in a new tab)">
          <Text as="span" className="text-primary-foreground">Résumé</Text><ArrowUpRightIcon aria-hidden />
        </a>
      </Button>
  );
}

export function EmailAddress({ className }: { className?: string }) {
  const address = useRef<HTMLAnchorElement>(null);
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 3500);
    return () => window.clearTimeout(timer);
  }, [status]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setStatus("Email address copied.");
    } catch {
      if (address.current) window.getSelection()?.selectAllChildren(address.current);
      setCopied(false);
      setStatus("Address selected. Use your device’s copy command, or choose Email.");
    }
  };
  return (
    <Card size="sm" className={cn("h-full min-h-11 min-w-0 justify-center gap-0 py-0", className)} data-fit-check>
      <CardContent className="flex items-center justify-between gap-2 px-3">
        <a ref={address} href={`mailto:${profile.email}`} className={cn("min-w-0 select-all", FOCUS)}>
          <Text as="span" role="caption" tone="foreground" className="break-all">{profile.email}</Text>
        </a>
        <TooltipProvider>
          <Tooltip open={status ? true : undefined}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" className={cn("shrink-0", FOCUS)} aria-label={status && copied ? "Email address copied" : `Copy ${profile.email}`} onClick={copy}>
                {status && copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64"><Text role="caption" className="text-background">{status || "Copy email address"}</Text></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only"><Text>{status}</Text></div>
      </CardContent>
    </Card>
  );
}

export function ProfileContactRow() {
  const metrics = useGridMetrics();
  const cell = metrics?.cell ?? 60;
  const gap = metrics?.gap ?? 12;
  return <div className="flex h-full min-w-0" style={{ gap }}><ResumeAction width={cell * 2 + gap} /><EmailAddress className="flex-1" /></div>;
}

export function Education({ className }: { className?: string }) {
  return (
    <Card size="sm" className={cn("h-full min-w-0 justify-center gap-0 px-4 py-1", className)} data-fit-check>
      <div className="flex items-center justify-center gap-2">
        <GraduationCapIcon aria-hidden className="size-5 shrink-0" />
        <div>
          <Text align="center">{EDUCATION.subject}</Text>
          <Text role="caption" align="center">{EDUCATION.short} · {EDUCATION.from} — {EDUCATION.to}</Text>
        </div>
      </div>
    </Card>
  );
}

export function ProfileFacts() {
  const metrics = useGridMetrics();
  const cell = metrics?.cell ?? 60;
  const gap = metrics?.gap ?? 12;
  const locationWidth = cell * 2 + gap;
  return <div className="flex h-full min-w-0" style={{ gap }}>
    <Education className="flex-1" />
    <Card size="sm" className="h-full shrink-0 justify-center gap-1 px-3 py-1" style={{ width: locationWidth }} data-fit-check>
      <div className="flex items-center justify-center gap-2">{locationWidth >= 130 ? <MapPinIcon aria-hidden className="size-5 shrink-0" /> : null}<Text as="span">{profile.city}</Text></div>
    </Card>
  </div>;
}

const LINKEDIN = { path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" };
const socialMarks: Record<string, Pick<SimpleIcon, "path">> = { github: siGithub, x: siX, instagram: siInstagram, linkedin: LINKEDIN, discord: siDiscord };
const socialOrder = ["github", "x", "instagram", "linkedin", "discord"];

export function ThemeButton() {
  const toggle = useThemeToggle();
  return (
    <Button variant="ghost" className={cn("size-full shrink-0 p-0", FOCUS)} onClick={toggle} aria-label="Toggle light and dark theme">
      <SunIcon aria-hidden className="hidden dark:block" /><MoonIcon aria-hidden className="dark:hidden" />
    </Button>
  );
}

export function ProfileUtilities({ onRead, reading = false }: { onRead?: () => void; reading?: boolean }) {
  const metrics = useGridMetrics();
  const cell = metrics?.cell ?? 60;
  const gap = metrics?.gap ?? 12;
  const socials = socialOrder.flatMap((id) => {
    const link = LINKS.find((item) => item.id === id);
    const mark = link ? socialMarks[link.id] : undefined;
    return link && mark ? [{ link, mark }] : [];
  });
  return (
    <div className="flex h-full flex-wrap content-start justify-center" style={{ gap }}>
      <TooltipProvider>
        {socials.map(({ link, mark }) => (
          <Tooltip key={link.id}>
            <TooltipTrigger asChild>
              <Card size="sm" className="shrink-0 justify-center p-0" style={{ width: cell, height: cell }} data-social-cell={link.id}>
                {link.href ? <Button asChild variant="ghost" className={cn("size-full p-0", FOCUS)}><a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}><svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current"><path d={mark.path} /></svg></a></Button>
                  : <span role="img" aria-label={`${link.label} — link coming soon`} className="flex size-full items-center justify-center"><svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current"><path d={mark.path} /></svg></span>}
              </Card>
            </TooltipTrigger>
            <TooltipContent>{link.href ? link.label : `${link.label} — link coming soon`}</TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
      {onRead && <Button variant="outline" className={cn("shrink-0 bg-card px-4", actionType, FOCUS)} style={{ width: cell * 2 + gap, height: cell }} onClick={onRead}>
        <BookOpenIcon aria-hidden /><Text as="span" role="caption" tone="foreground">{reading ? "Quick view" : "Read profile"}</Text>
      </Button>}
      <Card size="sm" className="shrink-0 justify-center p-0" style={{ width: cell, height: cell }}><ThemeButton /></Card>
    </div>
  );
}

export function AllSkillsDialog({ className }: { className?: string }) {
  return <Dialog>
    <DialogTrigger asChild><Button variant="outline" className={cn("h-full w-full bg-card", actionType, FOCUS, className)}><CodeXmlIcon aria-hidden /><Text as="span">All skills</Text></Button></DialogTrigger>
    <DialogContent className="max-h-[calc(100dvh-2rem)] sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle asChild><Text as="h2" role="heading">Technical skills</Text></DialogTitle>
        <DialogDescription asChild><Text>Languages, frameworks, infrastructure and agent tools I have worked with.</Text></DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[min(65dvh,36rem)] pe-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {STACK.map((group) => <Card key={group.group} size="sm" className="gap-2 px-5 py-4"><Text as="h3">{group.group}</Text><Text role="caption">{group.items.join(" · ")}</Text></Card>)}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>;
}

export function WorkRow({ index, full = false }: { index: number; full?: boolean }) {
  const role = SCREENING_WORK[index];
  const year = (date: string) => date.match(/\d{4}/)?.[0] ?? date;
  const cell = useGridMetrics()?.cell ?? 60;
  return (
    <div className="flex h-full gap-3" data-work-company={role.company.id}>
      <Card className="shrink-0 items-center justify-center p-0" style={{ width: cell }}>
        <CompanyLogo company={role.company} style={{ width: 28, height: 28 }} />
      </Card>
      <Card size="sm" className={cn("min-w-0 flex-1 justify-center gap-0.5 px-4 py-1", full && "gap-2 py-5")} data-fit-check>
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <Text as="h3">{role.company.short}</Text>
          <Text role="caption">{full ? role.from : year(role.from)} — {full ? role.to : year(role.to)}</Text>
        </div>
        {full && <Text tone="muted">{role.title}</Text>}
        <Text role="caption">{role.contribution}</Text>
        {full && <ul className="mt-1 list-disc space-y-2 ps-4">{role.did.map((line) => <li key={line}><Text>{line}</Text></li>)}</ul>}
      </Card>
    </div>
  );
}

export function ProjectCard() {
  const project = PROJECTS.find((item) => item.name === "No Origins")!;
  return (
    <Card size="sm" className="h-full justify-center gap-0.5 px-5 py-1" data-fit-check data-real-project>
      <Text as="h3">{project.name}</Text>
      <Text role="caption">This site, its design system and the tools around it. Built in the open.</Text>
      <Button asChild variant="ghost" className={cn("h-9 justify-start self-start px-0", actionType, FOCUS)}>
        <a href={project.href} target="_blank" rel="noreferrer"><Text as="span">Explore the system</Text><ArrowUpRightIcon aria-hidden /></a>
      </Button>
    </Card>
  );
}

export function UnfinishedProject() {
  return (
    <Card size="sm" className="h-full justify-center gap-0.5 px-5 py-1" data-fit-check>
      <Text>Agents Society</Text>
      <Text role="caption">An agent harness I’m building. Not published yet.</Text>
    </Card>
  );
}

const skillMarks: Record<string, SimpleIcon> = { TypeScript: siTypescript, React: siReact, "Next.js": siNextdotjs, Postgres: siPostgresql, Python: siPython, LangGraph: siLanggraph };

export function SkillCard({ name }: { name: string }) {
  return (
    <Card size="sm" className="h-full justify-center px-3 py-1" data-fit-check>
      <div className="flex items-center justify-center gap-2">
        <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0 fill-current"><path d={skillMarks[name].path} /></svg>
        <Text as="span">{name}</Text>
      </div>
    </Card>
  );
}

export function Learning() {
  return <Card size="sm" className="h-full justify-center px-4 py-1" data-fit-check><Text role="caption" align="center">Learning: {SCREENING.learning.join(", ")}</Text></Card>;
}

export function Interest({ children }: { children: ReactNode }) {
  return <Card size="sm" className="h-full justify-center px-4 py-1" data-fit-check><Text align="center">{children}</Text></Card>;
}
