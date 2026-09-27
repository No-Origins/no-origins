"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRightIcon, BookOpenIcon, BriefcaseBusinessIcon, CheckIcon, CodeXmlIcon, CopyIcon, FolderGit2Icon, GraduationCapIcon, MailIcon, MoonIcon, PaletteIcon, SunIcon, type LucideIcon } from "lucide-react";
import { siGithub, siInstagram, siLanggraph, siNextdotjs, siPostgresql, siPython, siReact, siTypescript, siX, type SimpleIcon } from "simple-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@no-origins/ui/components/avatar";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent } from "@no-origins/ui/components/card";
import { useGridMetrics } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Text } from "@no-origins/ui/components/text";
import { useThemeToggle } from "@no-origins/ui/components/theme-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@no-origins/ui/components/tooltip";
import { cn } from "@no-origins/ui/lib/utils";

import { CompanyLogo } from "@/components/logo";
import { EDUCATION, LINKS, profile, PROJECTS } from "@/content/resume";
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

export function ContactActions() {
  return (
    <div className="grid h-full grid-cols-2 gap-3">
      <Button asChild className={cn("h-full min-h-11", actionType, FOCUS)}>
        <a href={RESUME_URL} target="_blank" rel="noreferrer" aria-label="Résumé (PDF, opens in a new tab)">
          <Text as="span" className="text-primary-foreground">Résumé</Text><ArrowUpRightIcon aria-hidden />
        </a>
      </Button>
      <Button asChild variant="outline" className={cn("h-full min-h-11 bg-card", actionType, FOCUS)}>
        <a href={`mailto:${profile.email}`}><MailIcon aria-hidden /><Text as="span">Email</Text></a>
      </Button>
    </div>
  );
}

export function EmailAddress() {
  const address = useRef<HTMLSpanElement>(null);
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
    <Card size="sm" className="h-full min-h-11 justify-center gap-0 py-0" data-fit-check>
      <CardContent className="flex items-center justify-between gap-2 px-4">
        <span ref={address} className="min-w-0 select-all"><Text as="span" className="break-all">{profile.email}</Text></span>
        <TooltipProvider>
          <Tooltip open={status ? true : undefined}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-lg" className={cn("shrink-0", FOCUS)} aria-label={status && copied ? "Email address copied" : `Copy ${profile.email}`} onClick={copy}>
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

export function Education() {
  return (
    <Card size="sm" className="h-full justify-center gap-0 px-4 py-1" data-fit-check>
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

const socialMarks: Record<string, SimpleIcon> = { github: siGithub, x: siX, instagram: siInstagram };

export function ThemeButton() {
  const toggle = useThemeToggle();
  return (
    <Button variant="outline" size="icon-lg" className={cn("shrink-0 bg-card", FOCUS)} onClick={toggle} aria-label="Toggle light and dark theme">
      <SunIcon aria-hidden className="hidden dark:block" /><MoonIcon aria-hidden className="dark:hidden" />
    </Button>
  );
}

export function ProfileFooter({ onRead, reading = false }: { onRead?: () => void; reading?: boolean }) {
  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-3">
      <TooltipProvider>
        {LINKS.filter((link) => link.href && socialMarks[link.id]).map((link) => (
          <Tooltip key={link.id}>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="icon-lg" className={cn("bg-card", FOCUS)}>
                <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                  <svg aria-hidden viewBox="0 0 24 24" className="size-5 fill-current"><path d={socialMarks[link.id].path} /></svg>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{link.label}</TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
      {onRead && <Button variant="outline" className={cn("h-11 bg-card px-4", actionType, FOCUS)} onClick={onRead}>
        <BookOpenIcon aria-hidden /><Text as="span" role="caption" tone="foreground">{reading ? "Quick view" : "Read profile"}</Text>
      </Button>}
      <ThemeButton />
    </div>
  );
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
