"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@no-origins/ui/components/button";
import { Card } from "@no-origins/ui/components/card";
import { Grid, GridItem, useGridMetrics } from "@no-origins/ui/components/grid";
import { Slot } from "@no-origins/ui/components/slot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@no-origins/ui/components/tabs";
import { Text } from "@no-origins/ui/components/text";
import { cn } from "@no-origins/ui/lib/utils";

import { AllSkillsDialog, FOCUS, Identity, Interest, Introduction, Learning, ProfileContactRow, ProfileFacts, ProfileUtilities, ProjectCard, SECTION_ICONS, SectionLabel, SkillCard, UnfinishedProject, WorkRow } from "@/components/screening-cards";
import { HOBBIES, profile, STACK } from "@/content/resume";
import { SCREENING, SCREENING_WORK } from "@/content/screening";

type Viewport = { width: number; height: number; font: number };

/**
 * Portfolio.md P17. The screening view has no artificial loading hold or wake: its first useful frame is readable.
 * A reading alternative is server-rendered too. Very short/narrow fields and enlarged text use that alternative,
 * rather than discarding information. This exception does not change Grid or the other apps' no-scroll policy.
 */
export function RecruiterView() {
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [requestedReading, setRequestedReading] = useState(false);
  const [fitReading, setFitReading] = useState(false);
  const probe = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const read = () => {
      const next = { width: window.innerWidth, height: window.innerHeight, font: parseFloat(getComputedStyle(document.documentElement).fontSize) };
      setViewport((previous) => previous?.width === next.width && previous.height === next.height && previous.font === next.font ? previous : next);
      setFitReading(false);
    };
    read();
    window.addEventListener("resize", read);
    const observer = new ResizeObserver(read);
    if (probe.current) observer.observe(probe.current);
    return () => { window.removeEventListener("resize", read); observer.disconnect(); };
  }, []);

  const forcedReading = !!viewport && (viewport.width < 360 || viewport.height < 640 || viewport.font > 18);
  const reading = !viewport || forcedReading || requestedReading || fitReading;
  const openReading = useCallback(() => {
    setRequestedReading(true);
    requestAnimationFrame(() => main.current?.querySelector<HTMLElement>("h1")?.focus());
  }, []);
  const onFitFailure = useCallback(() => setFitReading(true), []);

  return (
    <main ref={main} aria-label="Bhargav Reddy’s profile" data-view={reading ? "reading" : "quick"}>
      {/* Measures the user's text scale without changing any typography token or forcing a grid breakpoint. */}
      <div ref={probe} aria-hidden className="pointer-events-none invisible fixed h-[1em] w-[1em]" />
      {reading ? (
        <ReadingProfile onQuick={viewport && !forcedReading && !fitReading ? () => setRequestedReading(false) : undefined} />
      ) : (
        <Grid overlay cursor>
          <ScreeningField onRead={openReading} onFitFailure={onFitFailure} />
        </Grid>
      )}
    </main>
  );
}

function Box({ col, row, cols, rows = 1, children, name }: { col: number; row: number; cols: number; rows?: number; children: ReactNode; name?: string }) {
  return <GridItem col={col} row={row} colSpan={cols} rowSpan={rows} data-screening={name}><Slot>{children}</Slot></GridItem>;
}

/** All positions derive from the actual field. Content access never depends on the first-fit packer's leftovers. */
function ScreeningField({ onRead, onFitFailure }: { onRead: () => void; onFitFailure: () => void }) {
  const m = useGridMetrics()!;
  const three = m.cols >= 18 && m.rows >= 10;
  const two = !three && m.cols >= 14 && m.rows >= 8;
  const available = Math.min(m.cols, 22);
  const profileCols = three ? (available >= 20 ? 8 : 6) : two ? 6 : Math.min(m.cols, 6);
  const sideCols = three ? Math.floor((available - profileCols - 2) / 2) : two ? Math.min(8, m.cols - profileCols - 1) : 0;
  const band = three ? profileCols + sideCols * 2 + 2 : two ? profileCols + sideCols + 1 : profileCols;
  const start = Math.floor((m.cols - band) / 2) + 1;
  const height = three ? 10 : two ? 8 : Math.min(m.rows, 12);
  const top = Math.floor((m.rows - height) / 2) + 1;
  const second = start + profileCols + 1;
  const third = second + sideCols + 1;
  const compact = !three && !two;
  const panelRows = compact ? height - 6 : height;

  useEffect(() => {
    let live = true;
    const check = () => {
      if (!live) return;
      const cards = document.querySelectorAll<HTMLElement>('[data-view="quick"] [data-fit-check]');
      if ([...cards].some((card) => card.scrollHeight > card.clientHeight + 2 || card.scrollWidth > card.clientWidth + 2)) onFitFailure();
    };
    // Also checks late font metrics and text-spacing overrides: failure offers the complete readable composition.
    void document.fonts.ready.then(check);
    const observer = new ResizeObserver(check);
    document.querySelectorAll('[data-view="quick"] [data-fit-check]').forEach((card) => observer.observe(card));
    return () => { live = false; observer.disconnect(); };
  }, [m.cols, m.rows, onFitFailure]);

  return (
    <>
      <Box name="identity" col={start} row={top} cols={profileCols} rows={2}><Identity /></Box>
      <Box name="summary" col={start} row={top + 2} cols={profileCols} rows={compact ? 1 : 2}><Introduction compact={compact} /></Box>
      <Box name="contact" col={start} row={top + (compact ? 3 : 4)} cols={profileCols}><ProfileContactRow /></Box>
      <Box name="facts" col={start} row={top + (compact ? 4 : 5)} cols={profileCols}><ProfileFacts /></Box>
      <Box name="profile-tools" col={start} row={top + (compact ? 5 : 6)} cols={profileCols} rows={compact ? 1 : 2}><ProfileUtilities onRead={compact ? undefined : onRead} /></Box>

      {three ? <>
        <Box col={second} row={top} cols={sideCols}><SectionLabel icon={SECTION_ICONS.work}>Work</SectionLabel></Box>
        {SCREENING_WORK.map((work, index) => <Box key={work.id} col={second} row={top + 1 + index} cols={sideCols}><WorkRow index={index} /></Box>)}
        <Box col={second} row={top + 6} cols={sideCols}><SectionLabel icon={SECTION_ICONS.projects}>Projects</SectionLabel></Box>
        <Box name="project" col={second} row={top + 7} cols={sideCols} rows={2}><ProjectCard /></Box>
        <Box col={second} row={top + 9} cols={sideCols}><UnfinishedProject /></Box>
        <Box col={third} row={top} cols={sideCols}><SectionLabel icon={SECTION_ICONS.skills}>Technical skills</SectionLabel></Box>
        {SCREENING.skills.map((name, index) => {
          const left = Math.floor(sideCols / 2);
          return <Box key={name} col={third + (index % 2 ? left : 0)} row={top + 1 + Math.floor(index / 2)} cols={index % 2 ? sideCols - left : left}><SkillCard name={name} /></Box>;
        })}
        <Box col={third} row={top + 4} cols={sideCols}><Learning /></Box>
        <Box col={third} row={top + 5} cols={sideCols}><AllSkillsDialog /></Box>
        <Box col={third} row={top + 6} cols={sideCols}><SectionLabel icon={SECTION_ICONS.interests}>Beyond code</SectionLabel></Box>
        <Box col={third} row={top + 7} cols={Math.floor(sideCols / 2)}><Interest>Sketching</Interest></Box>
        <Box col={third + Math.floor(sideCols / 2)} row={top + 7} cols={Math.ceil(sideCols / 2)}><Interest>UI/UX in Figma</Interest></Box>
        <Box col={third} row={top + 8} cols={sideCols}><Interest>Video editing in DaVinci Resolve</Interest></Box>
        <Box col={third} row={top + 9} cols={sideCols}><Interest>Ukulele</Interest></Box>
      </> : (
        <Box name="sections" col={compact ? start : second} row={compact ? top + 6 : top} cols={compact ? profileCols : sideCols} rows={panelRows}>
          <CompactSections rows={panelRows} onRead={onRead} />
        </Box>
      )}
    </>
  );
}

function CompactSections({ rows, onRead }: { rows: number; onRead: () => void }) {
  const m = useGridMetrics()!;
  const count = Math.min(SCREENING_WORK.length, rows - 2);
  const [tab, setTab] = useState("work");
  return (
    <Tabs value={tab} onValueChange={setTab} className="h-full min-h-0 gap-3">
      <TabsList aria-label="Explore my work, projects and skills" className="w-full shrink-0 bg-card border p-1" style={{ height: m.cell }}>
        {(["work", "projects", "skills"] as const).map((section) => {
          const Icon = SECTION_ICONS[section];
          return <TabsTrigger key={section} value={section} className={cn("gap-2 px-2 font-normal tracking-normal normal-case data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground", FOCUS)}>
            <Icon aria-hidden /><Text as="span" role="caption" className="text-inherit">{section === "work" ? "Work" : section === "projects" ? "Projects" : "Skills"}</Text>
          </TabsTrigger>;
        })}
      </TabsList>
      <TabsContent value="work" className="m-0 min-h-0">
        <div className="grid gap-3" style={{ gridAutoRows: m.cell }}>
          {SCREENING_WORK.slice(0, count).map((work, index) => <WorkRow key={work.id} index={index} />)}
          <Button variant="outline" className={cn("h-full bg-card font-normal tracking-normal normal-case", FOCUS)} onClick={onRead}><Text as="span">Read full work history</Text></Button>
          {rows >= 8 && <div style={{ gridRow: "span 2" }}><ProjectCard /></div>}
        </div>
      </TabsContent>
      <TabsContent value="projects" className="m-0 min-h-0">
        <div className="grid gap-3" style={{ gridAutoRows: m.cell }}>
          <div style={{ gridRow: "span 2" }}><ProjectCard /></div><UnfinishedProject />
        </div>
      </TabsContent>
      <TabsContent value="skills" className="m-0 min-h-0">
        <Card size="sm" className="h-full justify-center gap-3 px-5 py-3" data-fit-check>
          <Text>TypeScript · React · Next.js</Text>
          <Text>Postgres · Python · LangGraph</Text>
          <Text role="caption">Learning: Elixir, Rust</Text>
          <AllSkillsDialog className="h-11" />
        </Card>
      </TabsContent>
    </Tabs>
  );
}

/** The accessible alternate composition, not a second portfolio application. No details are silently dropped. */
function ReadingProfile({ onQuick }: { onQuick?: () => void }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 p-3 sm:p-6" data-reading-profile>
      <Identity reading />
      <Introduction />
      <ProfileContactRow />
      <ProfileFacts />
      <ProfileUtilities onRead={onQuick} reading />
      <div className="mt-3"><SectionLabel icon={SECTION_ICONS.work}>Work</SectionLabel></div>
      {SCREENING_WORK.map((work, index) => <WorkRow key={work.id} index={index} full />)}
      <div className="mt-3"><SectionLabel icon={SECTION_ICONS.projects}>Projects</SectionLabel></div>
      <ProjectCard /><UnfinishedProject />
      <div className="mt-3"><SectionLabel icon={SECTION_ICONS.skills}>Technical skills</SectionLabel></div>
      <Card size="sm" className="gap-5 px-5">
        {STACK.map((group) => <div key={group.group} className="space-y-2"><Text as="h3" role="heading">{group.group}</Text><Text>{group.items.join(", ")}</Text></div>)}
      </Card>
      <SectionLabel icon={SECTION_ICONS.interests}>Beyond code</SectionLabel>
      <Card size="sm" className="gap-2 px-5">{HOBBIES.map((hobby) => <Text key={hobby}>{hobby}</Text>)}</Card>
      <Card size="sm" className="gap-3 px-5">
        <Text as="h2" role="heading">A little more about me</Text>
        {profile.story.map((paragraph) => <Text key={paragraph}>{paragraph}</Text>)}
      </Card>
    </div>
  );
}
