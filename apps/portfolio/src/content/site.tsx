"use client";

import { BookOpenTextIcon, BriefcaseIcon, CodeXmlIcon, FolderGit2Icon, NewspaperIcon, PaletteIcon } from "lucide-react";

import { CellWrap, NoteCard, SkillPill, StatementCard, type SectionLabel } from "@/components/cards";
import { ProfileCard, ProfileFacts, ProfileLinks, ProfileSocials, SocialMark } from "@/components/profile-card";
import { PROJECTS_ROWS, ProfileProjects } from "@/components/profile-projects";
import { ProfileSections, type SectionTab } from "@/components/profile-sections";
import { ProfileTech, techRowsMost } from "@/components/profile-tech";
import { ProfileWork } from "@/components/profile-work";
import type { PortfolioItem, PortfolioPage, Span } from "@/content";
import { HOBBIES, profile, ROLES } from "@/content/resume";
import { BAND } from "@/lib/arrange";

/**
 * Spans per breakpoint, read against the decided cell (Grid.md D13). The band is 4 · 6 · 8 · 12 · 16 columns, so a
 * "half" is two to a row from `lg` up and one to a row below, and a "full" is the band. Six rows of 72 and seven of 60
 * are both 492px, eight of 60 are 564: the same physical card wherever the cell differs (Grid-v2.md §5 P3).
 */
/**
 * The profile: the avatar's card, two cells square, and the name's card beside it (Portfolio.md P4, amended
 * 2026-09-27), so two rows at every breakpoint — 156px on touch, 132px on a pointer. **Eight columns on a pointer, six
 * on touch** (his, 2026-09-26: three columns with this one "placed in the center"): eight is even, so the centre
 * column stands on the field's centre line with the tech and the work the same width either side of it. His mock had
 * seven, half a cell off the line. A phone's name card is four of its narrower cells, which hold the name on one line
 * in `heading`, so a phone's profile is two rows as well (it was three with the face beside the name).
 */
const PROFILE: Record<string, Span> = { base: { cols: 6, rows: 2 }, sm: { cols: 6, rows: 2 }, md: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 2 }, xl: { cols: 8, rows: 2 } };
/**
 * The profile's `narrow` span: touch's six by two, on a pointer where eight would leave the tech and the work four
 * cells either side — an eighteen-column field, 1308 to 1451 wide. Four cells are the four marks and no room for the
 * active one's name, so the centre gives up two and the sides are five (his pick, 2026-09-27). Everything under the
 * profile has a `narrow` span of six too (`*_NARROW`).
 */
const NARROW: Record<string, Span> = { base: { cols: 6, rows: 2 } };
/**
 * The profile's column under the avatar and the name, in his order (2026-09-27: "the about me text should be just
 * below the avatar and name row … and then under that we will have resume email and GitHub and then underneath that
 * we will have education and location"), and under those the social marks (his, the same day: "add social media icons
 * like X, Instagram along with GitHub. Put that row under education row"). Each is `below` the one before — the first screen's twenty-four-column band
 * would otherwise pack it beside — and as wide as the profile.
 *
 * What I am after, his six paragraphs (`profile.story`), `grow`s: it takes the rows the first screen leaves under the
 * flow, at most six, which hold every paragraph at six cells and at eight, and at least three (`FLOW_GROW_MIN`,
 * `arrange.ts`), the card letting paragraphs go as it shrinks (`NoteCard`). With fewer it is left off — on a phone and
 * a tablet, where the work takes the rows.
 */
const NOTE: Record<string, Span> = { base: { cols: 6, rows: 6 }, lg: { cols: 8, rows: 6 } };
const NOTE_NARROW: Record<string, Span> = { base: { cols: 6, rows: 6 } };
/**
 * Each of the column's rows under the note — Résumé and Email (GitHub went to the marks), the degree and Hyderabad,
 * and the social marks — is one row at every size, as wide as the profile.
 */
const ROW: Record<string, Span> = { base: { cols: 6, rows: 1 }, lg: { cols: 8, rows: 1 } };
const ROW_NARROW: Record<string, Span> = { base: { cols: 6, rows: 1 } };
/**
 * A pill one row tall (2026-09-27), as many whole cells as its words need with a round end of air each side: on a
 * phone's cells (51 to 56px), on touch's 72 and on a pointer's 60. Hobbies are wider than any phone.
 */
const pill = (phone: number, touch: number, pointer: number): Record<string, Span> => ({
  base: { cols: phone, rows: 1 },
  sm: { cols: touch, rows: 1 },
  md: { cols: touch, rows: 1 },
  lg: { cols: pointer, rows: 1 },
  xl: { cols: pointer, rows: 1 },
});
/**
 * The sections' labels (his, 2026-09-27: "add relevant icons to the section labels … make them part of the top first
 * cell within their section", then "instead of just showing icons let's expand them to also show the label of the
 * section name"): its icon and its word (`SectionCell`). **Each is its section's whole first row, with no border**
 * (2026-09-28, as the recruiter quick view drew them), the two centred on it, so every `wraps` starts with the label's
 * whole row (`LABEL_ROW`). They were transparent pills as many cells as the word needed, centred on the row.
 */
const LABEL_ROW: Record<string, Span> = { base: { cols: BAND, rows: 1 } };
const LABELS = {
  work: { label: "Work", icon: BriefcaseIcon },
  projects: { label: "Projects", icon: FolderGit2Icon },
  // The code mark says what kind of skill these are (his, 2026-09-27: "we have coding icon so we can treat them as
  // technical skills"); the art skills are under them.
  tech: { label: "Technical skills", icon: CodeXmlIcon },
  art: { label: "Art skills", icon: PaletteIcon },
  cases: { label: "Case studies", icon: BookOpenTextIcon },
  content: { label: "Content", icon: NewspaperIcon },
} satisfies Record<string, SectionLabel>;
/**
 * The work column (`side: 1`): its label's cell, and under it a row for each company, its mark's cell and a pill of
 * its role, name and years (his, 2026-09-27: "put the logos vertically under the work icon cell"). Five rows at every
 * size — it was six, the marks' and five for the active company's card, and seven on a phone. Beside the centre only
 * its rows count; where there is no room beside, it goes under the centre at these widths, as wide as the centre.
 */
const WORK_ROWS = 1 + ROLES.length;
const WORK: Record<string, Span> = {
  base: { cols: 6, rows: WORK_ROWS },
  sm: { cols: 6, rows: WORK_ROWS },
  md: { cols: 6, rows: WORK_ROWS },
  lg: { cols: 8, rows: WORK_ROWS },
  xl: { cols: 8, rows: WORK_ROWS },
};
/**
 * The projects (`side: 1`), under the work: the label's row and a card for each project beside a slot for its image
 * (`ProfileProjects`, 2026-09-28, the recruiter quick view's cards) — two rows for one that is out and one for one that
 * is not, four with the label, as the pills took. These are its widths where it goes under the centre. The
 * placeholders Project Three and Four (his, 2026-09-27: "add some dummy cards too") went with the pills: the quick
 * view shows only his.
 */
const PROJECT_LIST: Record<string, Span> = {
  base: { cols: 6, rows: PROJECTS_ROWS },
  sm: { cols: 6, rows: PROJECTS_ROWS },
  md: { cols: 6, rows: PROJECTS_ROWS },
  lg: { cols: 8, rows: PROJECTS_ROWS },
  xl: { cols: 8, rows: PROJECTS_ROWS },
};
/**
 * A section with nothing in it yet: its label's row and under it a pill that says "Work In Progress", as many whole
 * cells as its words need — two rows, in the room as well (`WIP_ROW`). The case studies under the projects (his,
 * 2026-09-27: "let's also add another section: case studies. It's something in which there is not content/work yet, so
 * we can put 'Work In Progress' for it"). The content under the art skills was one too (his, the same day: "Add another
 * section for content - same as coming soon from case studies") until it took the marks (`CONTENT`), and the socials,
 * under the content, until they became the profile column's row of marks the same day. Its label and its pill are a
 * loader ring each, as every card is (Grid.md D48, 2026-09-28).
 */
const WIP = "Work In Progress";
const WIP_PILL = pill(3, 2, 3);
const WIP_ROW: Record<string, Span> = { base: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 2 } };
const comingSoon = (id: string, label: SectionLabel, side: number, air: number): PortfolioItem => ({
  id,
  span: WIP_ROW,
  wraps: [LABEL_ROW, WIP_PILL],
  side,
  air,
  render: (placed) => (
    <CellWrap
      label={label}
      pieces={[{ key: "wip", span: WIP_PILL, render: () => <SkillPill name={WIP} /> }]}
      cols={placed.colSpan}
      rows={placed.rowSpan}
    />
  ),
});
/**
 * The content, under the art skills (`side: 2`): its label's row and under it the marks of where the content goes, X,
 * Instagram and YouTube, a cell each (`SocialMark`), from the column's start as the tech's marks are (2026-09-28, his:
 * "move Instagram X to content section, remove work in progress and also add YouTube"). Two rows, as the Work In
 * Progress pill took, so nothing else moves.
 */
const CONTENT_MARKS = ["x", "instagram", "youtube"] as const;
const MARK = pill(1, 1, 1);
const CONTENT: PortfolioItem = {
  id: "content",
  span: WIP_ROW,
  wraps: [LABEL_ROW, ...CONTENT_MARKS.map(() => MARK)],
  side: 2,
  air: 1,
  render: (placed) => (
    <CellWrap
      label={LABELS.content}
      pieces={CONTENT_MARKS.map((id) => ({ key: id, span: MARK, render: () => <SocialMark id={id} /> }))}
      cols={placed.colSpan}
      rows={placed.rowSpan}
    />
  ),
};
/**
 * The tech stack (`side: 2`, `grow`), first in the third column since the degree went to the profile's (2026-09-27):
 * its label's row and a mark a cell under it. Beside the centre it takes the rows the art skills and the sections
 * under them leave and shows as many marks as they hold; under it, it takes its label's row, the rows twenty-three
 * marks need at the centre's width and one more, for what a hovered mark pushes over as it grows to spell its name
 * (2026-09-27, movement) — six of six, five of eight.
 */
const TECH: Record<string, Span> = { base: { cols: 6, rows: 6 }, sm: { cols: 6, rows: 6 }, md: { cols: 6, rows: 6 }, lg: { cols: 8, rows: 5 }, xl: { cols: 8, rows: 5 } };
/**
 * The art skills (`side: 2`), under the tech stack (his, 2026-09-27: "move the sketching, UI/UX in Figma, video
 * editing in DaVinci … to something called art skills … under tech skills"): the hobbies, each a pill of its own
 * words, wrapped under the label's row as the projects are. Each is as many whole cells as its words need on a
 * phone's, touch's and a pointer's cells, measured off the page. These spans are its widths where it goes under the
 * centre.
 */
/**
 * His statements, a card each (`StatementCard`), where he put them (2026-09-28, his: "break down that large piece about
 * me into small statements … place the first one between projects and case studies and second one above technical
 * skills"): the one about roles in the work's column, under the projects (`side: 1`), and the one about AI at the top
 * of the tech's (`side: 2`), a row of air under it. Each is the rows its words take in `heading`, measured: at five
 * and six cells of 60 the first holds in two and the second in three; on touch's 72 both hold in two; a phone's
 * narrower cells take a row more. Where a column is short, its last items go first (`arrange.ts`), so at 1440 × 900 the
 * first stands where the case studies did; the second takes its rows from the tech, which grows into what is left.
 */
const STATEMENT_ROLES: Record<string, Span> = { base: { cols: 6, rows: 3 }, sm: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 2 } };
const STATEMENT_AI: Record<string, Span> = { base: { cols: 6, rows: 4 }, sm: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 3 } };
const ART_PILLS: Record<string, Record<string, Span>> = {
  Sketching: pill(2, 2, 2),
  "UI/UX in Figma": pill(3, 2, 2),
  "Video editing in DaVinci Resolve": pill(4, 3, 4),
  Ukulele: pill(2, 2, 2),
};
const ART_SKILLS = HOBBIES.map((name) => ({ name, span: ART_PILLS[name] ?? pill(4, 3, 4) }));
const ART: Record<string, Span> = {
  base: { cols: 6, rows: ART_SKILLS.length },
  sm: { cols: 6, rows: ART_SKILLS.length },
  md: { cols: 6, rows: ART_SKILLS.length },
  lg: { cols: 8, rows: ART_SKILLS.length },
  xl: { cols: 8, rows: ART_SKILLS.length },
};
/**
 * The first screen's sections as tabs (`compact`), where the columns cannot stand beside the profile — a phone and a
 * tablet (2026-09-28, his, from the recruiter quick view: "I loved the mobile layout … take references from that and
 * update ours too"). Where only the work stood under the profile's column, the tab bar and a panel: the work, the
 * projects, the tech and the art skills, each drawn as it is beside the profile, without its label. Six rows, the bar's
 * and the tech's five — its label's, its marks' four at six cells and one for a grown mark — and fewer where the field
 * is short (an iPhone SE's five). The case studies and the content, which say "Work In Progress", are not in it.
 */
const SECTIONS: Record<string, Span> = { base: { cols: 6, rows: 6 } };
const SECTIONS_SHORT = [5, 4, 3].map((rows) => ({ base: { cols: 6, rows } }));
const TABS: SectionTab[] = [
  { id: "work", label: LABELS.work, render: (cols, rows) => <ProfileWork cols={cols} rows={rows} /> },
  { id: "projects", label: LABELS.projects, render: (cols, rows) => <ProfileProjects cols={cols} rows={rows} /> },
  { id: "tech", label: { ...LABELS.tech, label: "Tech" }, render: (cols, rows) => <ProfileTech cols={cols} rows={rows} /> },
  {
    id: "art",
    label: { ...LABELS.art, label: "Art" },
    render: (cols, rows) => (
      <CellWrap pieces={ART_SKILLS.map(({ name, span }) => ({ key: name, span, render: () => <SkillPill name={name} /> }))} cols={cols} rows={rows} />
    ),
  },
];
/**
 * The portfolio (Portfolio.md §4), one page since 2026-09-27 (P15). The first screen is three columns (P4, amended
 * 2026-09-26), in this order since 2026-09-27: who I am and how to reach me, where I have worked and what I make, and
 * what I make it with, each section's label its first cell. The Work and Stack screens went into its columns the same
 * day, and Beyond and Say hello, which were a screen each, into the room it leaves and then into the profile's column,
 * and what the field has no room for is not shown (`arrange`).
 */
export const SITE: PortfolioPage = {
  title: "Bhargav",
  sections: [
    {
      id: "home",
      // Twenty-four columns where the field has them: the profile's eight, then the work's six and the projects' six
      // (`SIDE_MAX`, his, 2026-09-27: "for large screens can we go up to six columns"; the order his, the same day:
      // "put the profile vertical in the left, then work and then projects"), two columns of air between each two
      // (`SIDE_GAPS`, his, 2026-09-28: "add two column gap in large screen"); on twenty-two, five each, the air still
      // two; on twenty, five each and one column of air; on eighteen, the same beside a profile of six (`NARROW`).
      band: { lg: 24, xl: 24 },
      items: [
        { id: "profile", span: PROFILE, narrow: NARROW, render: (placed) => <ProfileCard colSpan={placed.colSpan} rowSpan={placed.rowSpan} /> },
        // His tagline, behind the field at the foot of the room (`backdrop`, P4), came off on 2026-09-27 (his: "remove
        // the quote from the bottom too"), and the @hiddenstack after it with it; `ProfileTagline` is kept.
        // His words, then the résumé and the address, then the degree and the city, then the social marks
        // (2026-09-27). The note has no heading and no state (his, 2026-09-27: "remove the 'What I'm after' heading
        // and 'Open to it' text").
        { id: "looking", span: NOTE, narrow: NOTE_NARROW, below: true, grow: true, render: () => <NoteCard paragraphs={profile.story} /> },
        { id: "links", span: ROW, narrow: ROW_NARROW, below: true, render: () => <ProfileLinks /> },
        { id: "facts", span: ROW, narrow: ROW_NARROW, below: true, render: () => <ProfileFacts /> },
        { id: "socials", span: ROW, narrow: ROW_NARROW, below: true, render: (placed) => <ProfileSocials cols={placed.colSpan} /> },
        // Where the columns cannot stand beside the profile, the tabs take their place under it (`compact`).
        {
          id: "sections",
          span: SECTIONS,
          fallback: SECTIONS_SHORT,
          below: true,
          compact: { base: true, lg: false },
          render: (placed) => <ProfileSections tabs={TABS} cols={placed.colSpan} rows={placed.rowSpan} />,
        },
        { id: "work", span: WORK, side: 1, render: (placed) => <ProfileWork cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.work} /> },
        // The projects under the work (his, 2026-09-27: "Swap education and projects"); the degree, first in the third
        // column until then, went to the profile's the same day.
        {
          id: "projects",
          span: PROJECT_LIST,
          side: 1,
          air: 1,
          render: (placed) => <ProfileProjects cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.projects} />,
        },
        // His statements (2026-09-28): the first between the projects and the case studies, the second over the tech.
        {
          id: "statement-roles",
          span: STATEMENT_ROLES,
          side: 1,
          air: 1,
          render: () => <StatementCard words={profile.statements.roles} />,
        },
        { id: "statement-ai", span: STATEMENT_AI, side: 2, render: () => <StatementCard words={profile.statements.ai} /> },
        {
          id: "tech",
          span: TECH,
          side: 2,
          air: 1,
          grow: true,
          growMost: techRowsMost,
          render: (placed) => <ProfileTech cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.tech} />,
        },
        {
          id: "art",
          span: ART,
          wraps: [LABEL_ROW, ...ART_SKILLS.map((each) => each.span)],
          side: 2,
          air: 1,
          render: (placed) => (
            <CellWrap
              label={LABELS.art}
              pieces={ART_SKILLS.map(({ name, span }) => ({ key: name, span, render: () => <SkillPill name={name} /> }))}
              cols={placed.colSpan}
              rows={placed.rowSpan}
            />
          ),
        },
        // Last in the order, though they stand under the projects and the art skills (their `side`s): where the columns
        // go under the profile, the room gives the work, the projects and the skills their rows first. The content takes
        // rows the tech stack gives up under the art skills, a row of air over it (his, 2026-09-27: "add one row
        // spacing between art skills and content"). The socials were a section here until the same day, and are the
        // profile column's row of marks since.
        comingSoon("cases", LABELS.cases, 1, 1),
        CONTENT,
      ],
    },
    // Beyond — What I am after and Say hello's links, in the room the first screen left — is empty since 2026-09-27:
    // the note and the links are the profile's column, the projects, the degree and the hobbies (as art skills) are
    // the first screen's, and the languages came off.
  ],
};
