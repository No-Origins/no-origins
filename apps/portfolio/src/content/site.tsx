"use client";

import { AtSignIcon, BookOpenTextIcon, BriefcaseIcon, CodeXmlIcon, FolderGit2Icon, PaletteIcon } from "lucide-react";

import { AboutCard, CellWrap, SkillPill, StatementCard, type SectionLabel } from "@/components/cards";
import { ProfileCard, ProfileFacts, ProfileLinks, SocialMark } from "@/components/profile-card";
import { PROJECTS_ROWS, ProfileProjects } from "@/components/profile-projects";
import { ProfileSections, type SectionTab } from "@/components/profile-sections";
import { ProfileTech } from "@/components/profile-tech";
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
 * we will have education and location"). The social marks were a row under those from the same day (his: "Put that row
 * under education row") until LinkedIn and Discord went into the socials (2026-10-01, `SOCIALS`). Each is `below` the
 * one before — the first screen's twenty-four-column band would otherwise pack it beside — and as wide as the profile.
 *
 * His line and More about me (`AboutCard`, 2026-10-01, his: "the tag line should replace the card like other
 * taglines"): three rows at six cells and at eight, two for the line — two lines of it on eight cells, three on six —
 * and one for the button. It `grow`s, so it stands only where the first screen leaves it its three rows
 * (`FLOW_GROW_MIN`, `arrange.ts`) and is left off where it does not — on a phone and a tablet, where the work takes
 * the rows, as the note was. The note it replaced, his six paragraphs (`profile.story`), took up to six rows and is in
 * the button's dialog now.
 */
const ABOUT: Record<string, Span> = { base: { cols: 6, rows: 3 }, lg: { cols: 8, rows: 3 } };
const ABOUT_NARROW: Record<string, Span> = { base: { cols: 6, rows: 3 } };
/** The column's row under the links — the degree and Hyderabad — is one row at every size, as wide as the profile. */
const ROW: Record<string, Span> = { base: { cols: 6, rows: 1 }, lg: { cols: 8, rows: 1 } };
const ROW_NARROW: Record<string, Span> = { base: { cols: 6, rows: 1 } };
/**
 * Email · GitHub · Résumé (2026-10-01, his: "place GitHub between email and resume … give it the size of the resume
 * button"): one row on eight cells, 4 · 2 · 2, and two rows on six, the address alone and then GitHub · Résumé (his
 * pick, the same day), since the address and its button need four of the six (`ProfileLinks`).
 */
const LINKS_ROW: Record<string, Span> = { base: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 1 } };
const LINKS_NARROW: Record<string, Span> = { base: { cols: 6, rows: 2 } };
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
  // technical skills"); the interests are under them.
  tech: { label: "Technical skills", icon: CodeXmlIcon },
  // The art skills until 2026-10-01 (his: "Rename art skills to interests"), the palette kept.
  interests: { label: "Interests", icon: PaletteIcon },
  cases: { label: "Case studies", icon: BookOpenTextIcon },
  // The content until 2026-10-01 (his: "rename content as socials and update the icon accordingly"): the at sign,
  // which the socials wore when they were a section of their own (2026-09-27), where the content wore a newspaper.
  socials: { label: "Socials", icon: AtSignIcon },
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
 * The projects (`side: 1`), under the work: the label's row and under it the projects' cards, two cells by three rows,
 * side by side in a carousel (`ProfileProjects`, 2026-10-01, his: "these projects have to be like a carousel … only two
 * columns width and three rows height") — four rows, where the cards stacked took five. These are its widths where it
 * goes under the centre. The
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
 * section for content - same as coming soon from case studies") until it took the marks (`SOCIALS`), and the socials,
 * under the content, until they became the profile column's row of marks the same day.
 */
const WIP = "Work In Progress";
const WIP_PILL = pill(3, 2, 3);
const WIP_ROW: Record<string, Span> = { base: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 2 } };
const comingSoon = (id: string, label: SectionLabel, side: number, air: number, by?: string): PortfolioItem => ({
  id,
  by,
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
 * The socials, under the interests (`side: 2`): its label's row and under it every social mark, a cell each
 * (`SocialMark`), from the column's start as the tech's marks are. It was the content, with X, Instagram and YouTube
 * (2026-09-28, his: "move Instagram X to content section, remove work in progress and also add YouTube"), until
 * LinkedIn and Discord came from the row under the degree (2026-10-01, his: "rename content as socials … and also move
 * LinkedIn and Discord logos into socials"), after the three: the two with a URL first, so the keys reach them first.
 * Two rows, the five marks on one at the column's five cells or six, as the Work In Progress pill took, so nothing else
 * moves.
 */
const SOCIAL_LINKS = ["x", "instagram", "youtube", "linkedin", "discord"] as const;
const MARK = pill(1, 1, 1);
const SOCIALS: PortfolioItem = {
  id: "socials",
  by: "lola",
  span: WIP_ROW,
  wraps: [LABEL_ROW, ...SOCIAL_LINKS.map(() => MARK)],
  side: 2,
  air: 1,
  render: (placed) => (
    <CellWrap
      label={LABELS.socials}
      pieces={SOCIAL_LINKS.map((id) => ({ key: id, span: MARK, render: () => <SocialMark id={id} /> }))}
      cols={placed.colSpan}
      rows={placed.rowSpan}
    />
  ),
};
/**
 * The tech stack (`grow`), in the profile's column under his line since 2026-10-01 — first in the third column from
 * 2026-09-27 until then: its label's row and a mark a cell under it. It takes the rows the column leaves under its other
 * boxes, at most its label's row, the rows twenty-three marks need at the column's width and one more, for what a
 * hovered mark pushes over as it grows to spell its name (2026-09-27, movement) — six of six, five of eight — and at
 * least three (`FLOW_GROW_MIN`), else it is not shown there; it shows as many marks as its rows hold.
 */
const TECH: Record<string, Span> = { base: { cols: 6, rows: 6 }, sm: { cols: 6, rows: 6 }, md: { cols: 6, rows: 6 }, lg: { cols: 8, rows: 5 }, xl: { cols: 8, rows: 5 } };
const TECH_NARROW: Record<string, Span> = { base: { cols: 6, rows: 6 } };
/**
 * The interests (`side: 2`), under the tech stack (his, 2026-09-27: "move the sketching, UI/UX in Figma, video
 * editing in DaVinci … to something called art skills … under tech skills"; named interests since 2026-10-01): the
 * hobbies, each a pill of its own words, wrapped under the label's row as the projects are. Each is as many whole cells
 * as its words need on a phone's, touch's and a pointer's cells, measured off the page. These spans are its widths
 * where it goes under the centre.
 */
/**
 * His statement, a card (`StatementCard`), where he put it (2026-09-28, his: "break down that large piece about me into
 * small statements … place the first one between projects and case studies and second one above technical skills"):
 * the one about AI at the top of the tech's column (`side: 2`), a row of air under it. The one about roles, under the
 * projects, came off on 2026-10-01 (his: "remove the love being in new roles that are shaping up at the intersection
 * of disciplines tagline"); its words are still `profile.statements.roles`. It is the rows its words take in Anton at
 * the display size (2026-10-01, `StatementWords`), measured: four at five cells of 60, where they are six lines (five
 * at six cells, which three rows only just hold), and on touch, where it is not shown since the tabs, three on 72 and
 * five on a phone's narrower cells. It was three in `heading`. It takes its rows from the tech, which grows into what is
 * left.
 */
const STATEMENT_AI: Record<string, Span> = { base: { cols: 6, rows: 5 }, sm: { cols: 6, rows: 3 }, lg: { cols: 8, rows: 4 } };
const INTEREST_PILLS: Record<string, Record<string, Span>> = {
  Sketching: pill(2, 2, 2),
  "Oil painting": pill(3, 2, 2),
  Designing: pill(2, 2, 2),
  Editing: pill(2, 2, 2),
  Ukulele: pill(2, 2, 2),
};
const INTERESTS = HOBBIES.map((name) => ({ name, span: INTEREST_PILLS[name] ?? pill(4, 3, 4) }));
const INTEREST_LIST: Record<string, Span> = {
  base: { cols: 6, rows: INTERESTS.length },
  sm: { cols: 6, rows: INTERESTS.length },
  md: { cols: 6, rows: INTERESTS.length },
  lg: { cols: 8, rows: INTERESTS.length },
  xl: { cols: 8, rows: INTERESTS.length },
};
/**
 * The first screen's sections as tabs (`compact`), where the columns cannot stand beside the profile — a phone and a
 * tablet (2026-09-28, his, from the recruiter quick view: "I loved the mobile layout … take references from that and
 * update ours too"). Where only the work stood under the profile's column, the tab bar and a panel: the work, the
 * projects, the tech and the interests, each drawn as it is beside the profile, without its label. Six rows, the bar's
 * and the tech's five — its label's, its marks' four at six cells and one for a grown mark — and fewer where the field
 * is short (an iPhone SE's five). The case studies and the socials are not in it.
 */
const SECTIONS: Record<string, Span> = { base: { cols: 6, rows: 6 } };
const SECTIONS_SHORT = [5, 4, 3].map((rows) => ({ base: { cols: 6, rows } }));
const TABS: SectionTab[] = [
  { id: "work", label: LABELS.work, render: (cols, rows) => <ProfileWork cols={cols} rows={rows} /> },
  { id: "projects", label: LABELS.projects, render: (cols, rows) => <ProfileProjects cols={cols} rows={rows} /> },
  { id: "tech", label: { ...LABELS.tech, label: "Tech" }, render: (cols, rows) => <ProfileTech cols={cols} rows={rows} /> },
  {
    id: "interests",
    label: LABELS.interests,
    render: (cols, rows) => (
      <CellWrap pieces={INTERESTS.map(({ name, span }) => ({ key: name, span, render: () => <SkillPill name={name} /> }))} cols={cols} rows={rows} />
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
        { id: "profile", span: PROFILE, narrow: NARROW, by: "bali", render: (placed) => <ProfileCard colSpan={placed.colSpan} rowSpan={placed.rowSpan} /> },
        // His tagline, behind the field at the foot of the room (`backdrop`, P4), came off on 2026-09-27 (his: "remove
        // the quote from the bottom too"), and the @hiddenstack after it with it; `ProfileTagline` is kept.
        // His line and More about me, then the address, GitHub and the résumé (2026-10-01), then the degree and the
        // city. The social marks under them (2026-09-27) went into the socials (2026-10-01).
        { id: "looking", span: ABOUT, narrow: ABOUT_NARROW, below: true, grow: true, by: "bali", render: () => <AboutCard words={profile.lead} paragraphs={profile.story} /> },
        // The technical skills between his line and the address (his, 2026-10-01: "move the technical skills between the
        // tagline in the first vertical and email"); they were the third column's, over the interests.
        {
          id: "tech",
          span: TECH,
          narrow: TECH_NARROW,
          below: true,
          grow: true,
          by: "mira",
          render: (placed) => <ProfileTech cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.tech} />,
        },
        { id: "links", span: LINKS_ROW, narrow: LINKS_NARROW, below: true, by: "zaza", render: (placed) => <ProfileLinks cols={placed.colSpan} /> },
        { id: "facts", span: ROW, narrow: ROW_NARROW, below: true, by: "zaza", render: () => <ProfileFacts /> },
        // Where the columns cannot stand beside the profile, the tabs take their place under it (`compact`).
        {
          id: "sections",
          span: SECTIONS,
          fallback: SECTIONS_SHORT,
          below: true,
          compact: { base: true, lg: false },
          // Its tabs, one agent a tab: the Keeper on the work, the Maker on the projects, the Editor on the tech, the
          // Muse on the interests.
          by: "oru kino mira lola",
          render: (placed) => <ProfileSections tabs={TABS} cols={placed.colSpan} rows={placed.rowSpan} />,
        },
        { id: "work", span: WORK, side: 1, by: "oru", render: (placed) => <ProfileWork cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.work} /> },
        // The projects under the work (his, 2026-09-27: "Swap education and projects"); the degree, first in the third
        // column until then, went to the profile's the same day.
        {
          id: "projects",
          span: PROJECT_LIST,
          side: 1,
          air: 1,
          by: "kino",
          render: (placed) => <ProfileProjects cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.projects} />,
        },
        // His statement, the third column's first (2026-09-28), over the interests since the tech went to the first
        // column (2026-10-01). The one between the projects and the case studies came off the same day.
        // Lola opens it with the rest of the column since the tech, Mira's, left it: an agent lands on the middle of
        // its boxes, which across two columns was the work's.
        { id: "statement-ai", span: STATEMENT_AI, side: 2, by: "lola", render: () => <StatementCard words={profile.statements.ai} /> },
        {
          id: "interests",
          span: INTEREST_LIST,
          wraps: [LABEL_ROW, ...INTERESTS.map((each) => each.span)],
          side: 2,
          air: 1,
          by: "lola",
          render: (placed) => (
            <CellWrap
              label={LABELS.interests}
              pieces={INTERESTS.map(({ name, span }) => ({ key: name, span, render: () => <SkillPill name={name} /> }))}
              cols={placed.colSpan}
              rows={placed.rowSpan}
            />
          ),
        },
        // Last in the order, though they stand under the projects and the interests (their `side`s): where the columns
        // go under the profile, the room gives the work, the projects and the skills their rows first. The socials take
        // rows the tech stack gives up under the interests, a row of air over them (his, 2026-09-27: "add one row
        // spacing between art skills and content"). They were a section here until the same day, then the profile
        // column's row of marks, and are a section again since 2026-10-01, where the content was.
        comingSoon("cases", LABELS.cases, 1, 1, "kino"),
        SOCIALS,
      ],
    },
    // Beyond — What I am after and Say hello's links, in the room the first screen left — is empty since 2026-09-27:
    // the note and the links are the profile's column, the projects, the degree and the hobbies (as interests) are
    // the first screen's, and the languages came off.
  ],
};
