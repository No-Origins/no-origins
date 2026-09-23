"use client";

import { BarsCard, ChipGroupsCard, ContactCard, EducationCard, HobbiesCard, NoteCard, RoleCard, SectionHeader } from "@/components/cards";
import { ProfileCard } from "@/components/profile-card";
import type { PortfolioItem, PortfolioPage, Span } from "@/content";
import { LANGUAGES, PROJECTS, ROLES, SKILLS, STACK } from "@/content/resume";
import { BAND } from "@/lib/arrange";

/**
 * Spans per breakpoint, read against the decided cell (Grid.md D13). The band is 4 · 6 · 8 · 12 · 16 columns, so a
 * "half" is two to a row from `lg` up and one to a row below, and a "full" is the band. Six rows of 72 and seven of 60
 * are both 492px, eight of 60 are 564: the same physical card wherever the cell differs (Grid-v2.md §5 P3).
 */
const HEADER = { base: { cols: BAND, rows: 1 } };
/**
 * The profile card. A row shorter at every breakpoint than it was, and three shorter on a tablet, since the company
 * marks left it on 2026-09-21 (Portfolio.md P9) — and the slack they had been hiding left with them. The numbers are
 * measured, not guessed: `e2e/.mcp/profile-slack.mjs` reports the gap `justify-between` opens inside the card, which
 * is exactly the height the span was over-asking for.
 */
const PROFILE: Record<string, Span> = { base: { cols: 4, rows: 6 }, sm: { cols: 6, rows: 6 }, md: { cols: 8, rows: 6 }, lg: { cols: 8, rows: 6 }, xl: { cols: 8, rows: 7 } };
/**
 * A role card. From `lg` up the four stand **side by side in one row**, a quarter of the band each, and they are tall
 * — his call, 2026-09-21: "instead of having two cards in rows and two cards in columns, let's have four cards
 * vertically in a row." Below `lg` the band is too narrow to divide four ways (a quarter of a tablet's eight columns
 * is 156px), so they stay one to a row and stack down the pages. The row counts ask for most of the field's height;
 * where the window is shorter the packer gives rows back, equally to all four (`arrange`).
 */
const ROLE: Record<string, Span> = { base: { cols: 4, rows: 6 }, sm: { cols: 6, rows: 4 }, md: { cols: 8, rows: 4 }, lg: { cols: 3, rows: 9 }, xl: { cols: 4, rows: 9 } };
const STACK_SPAN: Record<string, Span> = { base: { cols: 4, rows: 5 }, sm: { cols: 6, rows: 5 }, md: { cols: 8, rows: 5 }, lg: { cols: 7, rows: 5 }, xl: { cols: 10, rows: 5 } };
const SKILLS_SPAN: Record<string, Span> = { base: { cols: 4, rows: 4 }, sm: { cols: 6, rows: 4 }, md: { cols: 8, rows: 4 }, lg: { cols: 5, rows: 5 }, xl: { cols: 6, rows: 5 } };
const NOTE: Record<string, Span> = { base: { cols: 4, rows: 2 }, sm: { cols: 6, rows: 3 }, md: { cols: 8, rows: 3 }, lg: { cols: 6, rows: 3 }, xl: { cols: 8, rows: 3 } };
/** Bars and a wrapping row of chips need a third row on a phone; a note does with two. */
const TALL_NOTE: Record<string, Span> = { ...NOTE, base: { cols: 4, rows: 3 } };
const CONTACT: Record<string, Span> = { base: { cols: 4, rows: 4 }, sm: { cols: 6, rows: 4 }, md: { cols: 8, rows: 4 }, lg: { cols: 8, rows: 4 }, xl: { cols: 8, rows: 4 } };

const header = (id: string, index: string, label: string, title: string): PortfolioItem => ({
  id,
  span: HEADER,
  render: (placed) => <SectionHeader index={index} label={label} title={title} cols={placed.colSpan} />,
});

/**
 * The portfolio, top to bottom — one section a screen, the way the résumé reads (Portfolio.md §4): who I am, where
 * I have worked, what I work with, the rest of me, and how to reach me. Scrolling up turns the page (Grid.md D27).
 */
export const SITE: PortfolioPage = {
  title: "Bhargav Reddy V",
  sections: [
    {
      id: "home",
      items: [{ id: "profile", span: PROFILE, render: (placed) => <ProfileCard colSpan={placed.colSpan} rowSpan={placed.rowSpan} /> }],
    },
    {
      id: "work",
      items: [
        header("work-header", "01", "Work", "Four startups, six years"),
        ...ROLES.map<PortfolioItem>((role) => ({ id: `role-${role.id}`, span: ROLE, render: (placed) => <RoleCard role={role} cols={placed.colSpan} rows={placed.rowSpan} /> })),
      ],
    },
    {
      id: "stack",
      items: [
        header("stack-header", "02", "Stack", "What I work with"),
        { id: "stack", span: STACK_SPAN, render: () => <ChipGroupsCard title="Stack" groups={STACK} /> },
        { id: "skills", span: SKILLS_SPAN, render: () => <BarsCard title="Skills" rows={SKILLS} /> },
      ],
    },
    {
      id: "beyond",
      items: [
        header("beyond-header", "03", "Beyond", "The rest of me"),
        {
          id: "looking",
          span: NOTE,
          render: (placed) => (
            <NoteCard
              title="What I am after"
              line="A fast-paced startup with highly driven people, where innovation is encouraged and I can contribute to work that matters while I keep learning."
              state="open to it"
              rows={placed.rowSpan}
            />
          ),
        },
        ...PROJECTS.map<PortfolioItem>((project) => ({
          id: `project-${project.name}`,
          span: NOTE,
          render: (placed) => <NoteCard title={project.name} line={project.line} state={project.state} href={project.href} rows={placed.rowSpan} />,
        })),
        { id: "education", span: NOTE, render: () => <EducationCard /> },
        { id: "languages", span: TALL_NOTE, render: () => <BarsCard title="Languages" rows={LANGUAGES} /> },
        { id: "hobbies", span: TALL_NOTE, render: () => <HobbiesCard /> },
      ],
    },
    {
      id: "contact",
      items: [{ id: "contact", span: CONTACT, render: () => <ContactCard /> }],
    },
  ],
};
