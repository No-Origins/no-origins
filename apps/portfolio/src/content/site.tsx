"use client";

import { BookOpenTextIcon, BriefcaseIcon, CodeXmlIcon, FolderGit2Icon, NewspaperIcon, PaletteIcon } from "lucide-react";

import { CellWrap, NoteCard, NotePill, SkillPill, type SectionLabel } from "@/components/cards";
import { ProfileCard, ProfileFacts, ProfileLinks, ProfileSocials } from "@/components/profile-card";
import { ProfileTech } from "@/components/profile-tech";
import { ProfileWork } from "@/components/profile-work";
import type { PortfolioItem, PortfolioPage, Span } from "@/content";
import { HOBBIES, profile, PROJECTS, ROLES, type Project } from "@/content/resume";
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
 * like X, Instagram along with GitHub. Put that row under education row"). Each is `below` the one before — the first screen's twenty-two-column band
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
 * section name"): its icon and its word in a transparent pill (`SectionCell`), as many whole cells as the two need
 * with a round end of air each side — the word in `caption`, measured off the page: two cells for every one on a
 * pointer but Technical skills, three; two for all on touch; on a phone's cells (48 to 56px), three for Case studies
 * and Technical skills. **Each stands alone on its section's first row, centred on it** (his, the same day: "the
 * labels should justify center in their own section. Move all the cards or boxes that are in the row of the label …
 * to the next row"), a cell wider where the row would not split evenly either side (`labelSpot`), so every `wraps`
 * starts with the label's whole row (`LABEL_ROW`).
 */
const LABEL_ROW: Record<string, Span> = { base: { cols: BAND, rows: 1 } };
const LABELS = {
  work: { label: "Work", icon: BriefcaseIcon, span: pill(2, 2, 2) },
  projects: { label: "Projects", icon: FolderGit2Icon, span: pill(2, 2, 2) },
  // The code mark says what kind of skill these are (his, 2026-09-27: "we have coding icon so we can treat them as
  // technical skills"); the art skills are under them.
  tech: { label: "Technical skills", icon: CodeXmlIcon, span: pill(3, 2, 3) },
  art: { label: "Art skills", icon: PaletteIcon, span: pill(2, 2, 2) },
  cases: { label: "Case studies", icon: BookOpenTextIcon, span: pill(3, 2, 2) },
  content: { label: "Content", icon: NewspaperIcon, span: pill(2, 2, 2) },
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
 * Placeholders, NOT his projects (2026-09-27, his: "add some dummy cards too, just to see how more work items will look
 * like"), so they are here and not in `resume.ts`, which holds only facts (P6). Take them out when he has seen them.
 */
const DUMMY_PROJECTS: Project[] = [
  { name: "Project Three", line: "" },
  { name: "Project Four", line: "" },
];
/**
 * Each project's pill in whole cells on a phone's, touch's and a pointer's cells, as the room's pills are (`pill`):
 * its name and its arrow at their own width and a step of air inside each round end, measured off the page
 * (2026-09-27; the states came off the same day, his: "replace them with the link icon that No Origins has"). The
 * projects wrap along the column's rows on these (`wraps`).
 */
const PROJECT_PILLS: Record<string, Record<string, Span>> = {
  "Agents Society": pill(3, 2, 3),
  "No Origins": pill(3, 2, 2),
  "Project Three": pill(3, 2, 3),
  "Project Four": pill(3, 2, 3),
};
const LEFT_PROJECTS = [...PROJECTS, ...DUMMY_PROJECTS].map((project) => ({ project, span: PROJECT_PILLS[project.name] ?? pill(4, 3, 4) }));
/**
 * The projects (`side: 1`), under the work: the label's row and the pills wrapped under it. Its rows are the wrap's
 * (`wraps`, the label's row first) — four at five cells and three at six; these are its widths where it goes under
 * the centre, where the wrap gives it three.
 */
const PROJECT_ROWS = LEFT_PROJECTS.length;
const PROJECT_LIST: Record<string, Span> = {
  base: { cols: 6, rows: PROJECT_ROWS },
  sm: { cols: 6, rows: PROJECT_ROWS },
  md: { cols: 6, rows: PROJECT_ROWS },
  lg: { cols: 8, rows: PROJECT_ROWS },
  xl: { cols: 8, rows: PROJECT_ROWS },
};
/**
 * A section with nothing in it yet: its label's row and under it a pill that says "Work In Progress", as many whole
 * cells as its words need — two rows, in the room as well (`WIP_ROW`). The case studies under the projects (his,
 * 2026-09-27: "let's also add another section: case studies. It's something in which there is not content/work yet, so
 * we can put 'Work In Progress' for it"), and the content under the art skills (his, the same day: "Add another section
 * for content - same as coming soon from case studies"). The socials were one too, under the content, until they became
 * the profile column's row of marks the same day. Each is its own loader ring (Grid.md D48).
 */
const WIP = "Work In Progress";
const WIP_PILL = pill(3, 2, 3);
const WIP_ROW: Record<string, Span> = { base: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 2 } };
const comingSoon = (id: string, label: SectionLabel, side: number, air: number): PortfolioItem => ({
  id,
  load: id,
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
 * The portfolio (Portfolio.md §4), one page since 2026-09-27 (P15). The first screen is three columns (P4, amended
 * 2026-09-26), in this order since 2026-09-27: who I am and how to reach me, where I have worked and what I make, and
 * what I make it with, each section's label its first cell. The Work and Stack screens went into its columns the same
 * day, and Beyond and Say hello, which were a screen each, into the room it leaves and then into the profile's column,
 * and what the field has no room for is not shown (`arrange`).
 */
export const SITE: PortfolioPage = {
  title: "Bhargav Reddy V",
  sections: [
    {
      id: "home",
      // Twenty-two columns where the field has them: the profile's eight, then the work's six and the projects' six
      // (`SIDE_MAX`, his, 2026-09-27: "for large screens can we go up to six columns"; the order his, the same day:
      // "put the profile vertical in the left, then work and then projects"), a column of air between each two
      // (`SIDE_GAP`); on twenty, five each; on eighteen, five each beside a profile of six (`NARROW`).
      band: { lg: 22, xl: 22 },
      items: [
        { id: "profile", span: PROFILE, narrow: NARROW, load: "profile", render: (placed) => <ProfileCard colSpan={placed.colSpan} rowSpan={placed.rowSpan} /> },
        // His tagline, behind the field at the foot of the room (`backdrop`, P4), came off on 2026-09-27 (his: "remove
        // the quote from the bottom too"), and the @hiddenstack after it with it; `ProfileTagline` is kept.
        // His words, then the résumé and the address, then the degree and the city, then the social marks
        // (2026-09-27). The note has no heading and no state (his, 2026-09-27: "remove the 'What I'm after' heading
        // and 'Open to it' text").
        { id: "looking", span: NOTE, narrow: NOTE_NARROW, below: true, grow: true, load: "profile", render: () => <NoteCard paragraphs={profile.story} /> },
        { id: "links", span: ROW, narrow: ROW_NARROW, below: true, load: "profile", render: () => <ProfileLinks /> },
        { id: "facts", span: ROW, narrow: ROW_NARROW, below: true, load: "profile", render: () => <ProfileFacts /> },
        { id: "socials", span: ROW, narrow: ROW_NARROW, below: true, load: "profile", render: (placed) => <ProfileSocials cols={placed.colSpan} /> },
        { id: "work", span: WORK, side: 1, load: "work", render: (placed) => <ProfileWork cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.work} /> },
        // The projects under the work (his, 2026-09-27: "Swap education and projects"); the degree, first in the third
        // column until then, went to the profile's the same day.
        {
          id: "projects",
          load: "projects",
          span: PROJECT_LIST,
          wraps: [LABEL_ROW, ...LEFT_PROJECTS.map((each) => each.span)],
          side: 1,
          air: 1,
          render: (placed) => (
            <CellWrap
              label={LABELS.projects}
              pieces={LEFT_PROJECTS.map(({ project, span }) => ({
                key: project.name,
                span,
                render: () => <NotePill title={project.name} href={project.href} />,
              }))}
              cols={placed.colSpan}
              rows={placed.rowSpan}
            />
          ),
        },
        {
          id: "tech",
          load: "tech",
          span: TECH,
          side: 2,
          air: 1,
          grow: true,
          render: (placed) => <ProfileTech cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.tech} />,
        },
        {
          id: "art",
          load: "tools",
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
        comingSoon("content", LABELS.content, 2, 1),
      ],
    },
    // Beyond — What I am after and Say hello's links, in the room the first screen left — is empty since 2026-09-27:
    // the note and the links are the profile's column, the projects, the degree and the hobbies (as art skills) are
    // the first screen's, and the languages came off.
  ],
};
