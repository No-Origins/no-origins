"use client";

import { BarsCard, ChipGroupsCard, CompanyMark, ContactCard, EducationCard, HobbiesCard, NoteCard, SectionHeader } from "@/components/cards";
import { ProfileCard, ProfileCity, ProfileLinks, ProfileShipping, ProfileTagline } from "@/components/profile-card";
import type { PortfolioItem, PortfolioPage, Span } from "@/content";
import { LANGUAGES, PROJECTS, ROLES, SKILLS, STACK } from "@/content/resume";
import { BAND } from "@/lib/arrange";

/**
 * Spans per breakpoint, read against the decided cell (Grid.md D13). The band is 4 · 6 · 8 · 12 · 16 columns, so a
 * "half" is two to a row from `lg` up and one to a row below, and a "full" is the band. Six rows of 72 and seven of 60
 * are both 492px, eight of 60 are 564: the same physical card wherever the cell differs (Grid-v2.md §5 P3).
 */
const HEADER: Record<string, Span> = { base: { cols: BAND, rows: 1 } };
/**
 * The Work header, over marks that have no card padding to lend it air (Portfolio.md P12): a row of air under it from
 * `sm` up. On a phone that row is the one the second pair of marks needs to stay on the screen, so the header keeps
 * one row there and its text goes to the top of it.
 */
const WORK_HEADER: Record<string, Span> = { base: { cols: BAND, rows: 1 }, sm: { cols: BAND, rows: 2 } };
/**
 * The profile card: one row, the avatar with the name and role beside it (Portfolio.md P4, amended 2026-09-25), so
 * two rows at every breakpoint — 156px on touch, 132px on a pointer. Six columns on `md`, not eight: the row is about
 * 470px, and on eight the rest pooled as one hole at its end (P9's rule), so a tablet gets the 492px card `sm` has.
 * A pointer keeps eight because six, 420px, is short of the row and seven is not even (Grid.md D26).
 */
const PROFILE: Record<string, Span> = { base: { cols: 4, rows: 2 }, sm: { cols: 6, rows: 2 }, md: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 2 }, xl: { cols: 8, rows: 2 } };
/**
 * His tagline over the card: as wide as it, and two rows for its two lines. It is `above`, out of the flow, so the card
 * is centred where it was alone and the tagline takes the rows over it (Portfolio.md P4).
 */
const TAGLINE: Record<string, Span> = PROFILE;
/**
 * A line under the card — a mark on one cell and its words beside it — as wide as the card and one row tall. Each goes
 * `below` what came before it; on `xl` the sixteen-column band would otherwise pack it beside the card.
 */
const FACT: Record<string, Span> = Object.fromEntries(Object.entries(PROFILE).map(([bp, { cols }]) => [bp, { cols, rows: 1 }]));
/**
 * The row of links under the city — five cells, one each — with a row of air above it (his: "leave a row"). As wide as
 * the card; a phone's four columns wrap the fifth cell, so there it is two rows.
 */
const LINK_ROW: Record<string, Span> = { ...FACT, base: { cols: 4, rows: 2 } };
/**
 * A company on the Work screen: its mark on a square of cells two a side and a row for the name under it (Portfolio.md
 * P12). From `lg` up the four stand in one row, a quarter of the band each (P10, his, 2026-09-21); below it two to a
 * row, so the section is still one screen on a phone. The mark is the same two cells everywhere — 132px on a pointer,
 * 156px on touch — centred in the slot with its name centred under it; the columns either side are air, for now.
 */
const MARK: Record<string, Span> = { base: { cols: 2, rows: 3 }, sm: { cols: 3, rows: 3 }, md: { cols: 4, rows: 3 }, lg: { cols: 3, rows: 3 }, xl: { cols: 4, rows: 3 } };
const STACK_SPAN: Record<string, Span> = { base: { cols: 4, rows: 5 }, sm: { cols: 6, rows: 5 }, md: { cols: 8, rows: 5 }, lg: { cols: 7, rows: 5 }, xl: { cols: 10, rows: 5 } };
const SKILLS_SPAN: Record<string, Span> = { base: { cols: 4, rows: 4 }, sm: { cols: 6, rows: 4 }, md: { cols: 8, rows: 4 }, lg: { cols: 5, rows: 5 }, xl: { cols: 6, rows: 5 } };
const NOTE: Record<string, Span> = { base: { cols: 4, rows: 2 }, sm: { cols: 6, rows: 3 }, md: { cols: 8, rows: 3 }, lg: { cols: 6, rows: 3 }, xl: { cols: 8, rows: 3 } };
/** Bars and a wrapping row of chips need a third row on a phone; a note does with two. */
const TALL_NOTE: Record<string, Span> = { ...NOTE, base: { cols: 4, rows: 3 } };
const CONTACT: Record<string, Span> = { base: { cols: 4, rows: 4 }, sm: { cols: 6, rows: 4 }, md: { cols: 8, rows: 4 }, lg: { cols: 8, rows: 4 }, xl: { cols: 8, rows: 4 } };

const header = (id: string, index: string, label: string, title: string, span = HEADER, alignY: "start" | "end" = "end"): PortfolioItem => ({
  id,
  span,
  render: (placed) => <SectionHeader index={index} label={label} title={title} cols={placed.colSpan} alignY={alignY} />,
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
      items: [
        { id: "profile", span: PROFILE, render: (placed) => <ProfileCard colSpan={placed.colSpan} rowSpan={placed.rowSpan} /> },
        { id: "tagline", span: TAGLINE, above: true, render: (placed) => <ProfileTagline colSpan={placed.colSpan} /> },
        { id: "shipping", span: FACT, below: true, render: () => <ProfileShipping /> },
        { id: "city", span: FACT, below: true, render: () => <ProfileCity /> },
        { id: "links", span: LINK_ROW, below: true, air: 1, render: () => <ProfileLinks /> },
      ],
    },
    {
      id: "work",
      items: [
        header("work-header", "01", "Work", "Four startups, six years", WORK_HEADER, "start"),
        // Oldest first, so the row reads left to right as the six years ran (Portfolio.md P12); `ROLES` stays newest first, as the résumé has it.
        ...[...ROLES].reverse().map<PortfolioItem>(({ company }, index) => ({
          id: `company-${company.id}`,
          span: MARK,
          // The hover band alternates along the row, violet first (P13, his mock).
          render: (placed) => <CompanyMark company={company} accent={index % 2 ? "lime" : "violet"} cols={placed.colSpan} rows={placed.rowSpan} />,
        })),
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
