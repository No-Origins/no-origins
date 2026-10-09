"use client";

import { AtSignIcon, BookOpenTextIcon, BriefcaseIcon, CodeXmlIcon, FolderGit2Icon, PaletteIcon } from "lucide-react";

import { AboutCard, CellWrap, SkillPill, StatementCard, type SectionLabel } from "@/components/cards";
import { ProfileCard, ProfileFacts, ProfileLinks, SocialMark } from "@/components/profile-card";
import { PROJECTS_ROWS, ProfileProjects } from "@/components/profile-projects";
import { ProfileTech } from "@/components/profile-tech";
import { ProfileWork } from "@/components/profile-work";
import type { PortfolioItem, PortfolioPage, Span } from "@/content";
import { HOBBIES, profile, ROLES } from "@/content/resume";
import { BAND } from "@/lib/arrange";

/**
 * Spans per breakpoint, read against the decided cell (Grid.md D13): 72px on touch (`base`, `sm`, `md`), 60 on a
 * pointer (`lg`, `xl`), so eight cells on a pointer and six on touch are about the same physical width.
 */
/**
 * The profile: the avatar's card, two cells square, and the name's card beside it (Portfolio.md P4), so two rows at
 * every breakpoint — 156px on touch, 132px on a pointer. **Eight columns on a pointer, six on touch**: eight is even,
 * so it stands on the field's centre line. A phone's name card is four of its narrower cells, which hold the name on one
 * line in `heading`.
 */
const PROFILE: Record<string, Span> = { base: { cols: 6, rows: 2 }, sm: { cols: 6, rows: 2 }, md: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 2 }, xl: { cols: 8, rows: 2 } };
/**
 * His line and More about me (`AboutCard`): three rows at six cells and at eight, two for the line — two lines of it on
 * eight cells, three on six — and one for the button. It `grow`s, so it gives up rows where the page is short of them.
 */
const ABOUT: Record<string, Span> = { base: { cols: 6, rows: 3 }, lg: { cols: 8, rows: 3 } };
/** The row under the links — the degree and Hyderabad — is one row at every size, as wide as the profile. */
const ROW: Record<string, Span> = { base: { cols: 6, rows: 1 }, lg: { cols: 8, rows: 1 } };
/**
 * Email · GitHub · Résumé: one row on eight cells, 4 · 2 · 2, and two rows on six, the address alone and then
 * GitHub · Résumé, since the address and its button need four of the six (`ProfileLinks`).
 */
const LINKS_ROW: Record<string, Span> = { base: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 1 } };
/**
 * A pill one row tall, as many whole cells as its words need with a round end of air each side: on a phone's cells
 * (51 to 56px), on touch's 72 and on a pointer's 60.
 */
const pill = (phone: number, touch: number, pointer: number): Record<string, Span> => ({
  base: { cols: phone, rows: 1 },
  sm: { cols: touch, rows: 1 },
  md: { cols: touch, rows: 1 },
  lg: { cols: pointer, rows: 1 },
  xl: { cols: pointer, rows: 1 },
});
/**
 * The sections' labels: its icon and its word (`SectionCell`). **Each is its section's whole first row, with no
 * border**, the two centred on it, so every `wraps` starts with the label's whole row (`LABEL_ROW`).
 */
const LABEL_ROW: Record<string, Span> = { base: { cols: BAND, rows: 1 } };
const LABELS = {
  work: { label: "Work", icon: BriefcaseIcon },
  projects: { label: "Projects", icon: FolderGit2Icon },
  tech: { label: "Tech stack", icon: CodeXmlIcon },
  interests: { label: "Interests", icon: PaletteIcon },
  cases: { label: "Case studies", icon: BookOpenTextIcon },
  socials: { label: "Socials", icon: AtSignIcon },
} satisfies Record<string, SectionLabel>;
/**
 * The work: its label's cell, and under it a row for each company, its mark's cell and a pill of its role, name and
 * years. A row a company and one for the label, at every size.
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
 * The projects: the label's row and under it the projects' cards, two cells by three rows, side by side in a carousel
 * (`ProfileProjects`) — four rows.
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
 * cells as its words need — two rows (`WIP_ROW`). The case studies, under the projects.
 */
const WIP = "Work In Progress";
const WIP_PILL = pill(3, 2, 3);
const WIP_ROW: Record<string, Span> = { base: { cols: 6, rows: 2 }, lg: { cols: 8, rows: 2 } };
const comingSoon = (id: string, label: SectionLabel, air: number, by?: string): PortfolioItem => ({
  id,
  by,
  span: WIP_ROW,
  wraps: [LABEL_ROW, WIP_PILL],
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
 * The socials: its label's row and under it every social mark, a cell each (`SocialMark`), the two with a URL first,
 * so the keys reach them first. Two rows.
 */
const SOCIAL_LINKS = ["x", "instagram", "youtube", "linkedin", "discord"] as const;
const MARK = pill(1, 1, 1);
const SOCIALS: PortfolioItem = {
  id: "socials",
  by: "zaza",
  span: WIP_ROW,
  wraps: [LABEL_ROW, ...SOCIAL_LINKS.map(() => MARK)],
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
 * The tech stack (`grow`): its label's row and a mark a cell under it — its label's row, the rows twenty-three marks
 * need at its width and one more, for what a hovered mark pushes over as it grows to spell its name (movement) — six
 * of six, five of eight. It shows as many marks as its rows hold.
 */
const TECH: Record<string, Span> = { base: { cols: 6, rows: 6 }, sm: { cols: 6, rows: 6 }, md: { cols: 6, rows: 6 }, lg: { cols: 8, rows: 5 }, xl: { cols: 8, rows: 5 } };
/**
 * His statement about AI, a card (`StatementCard`): the rows its words take in Anton at the display size
 * (`StatementWords`), measured — three at eight cells, where its words are four lines, and five on a phone's narrower
 * cells.
 */
const STATEMENT_AI: Record<string, Span> = { base: { cols: 6, rows: 5 }, sm: { cols: 6, rows: 3 }, lg: { cols: 8, rows: 3 } };
/**
 * The interests: the hobbies, each a pill of its own words, wrapped under the label's row. Each is as many whole cells
 * as its words need on a phone's, touch's and a pointer's cells, measured off the page.
 */
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
 * The pages, one an agent's section, in the order the page turns to them (Portfolio.md P24): who he is, with the
 * address, GitHub, the résumé, the degree and the city; the tech stack; the work; the projects with the case studies
 * under them; the statement about AI with the interests; and the socials last. The agents stand at home in this order
 * too (`INTRO_CAST`), so the page goes down their column as it turns.
 */
export const PAGES = ["bali", "mira", "oru", "kino", "lola", "zaza"] as const;

/** Each page's name, said by the agent at home that brings it (`AgentHome`): its section's label; who he is for Bali's. */
export const PAGE_TITLES: Record<(typeof PAGES)[number], string> = {
  bali: "About me",
  mira: LABELS.tech.label,
  oru: LABELS.work.label,
  kino: LABELS.projects.label,
  lola: LABELS.interests.label,
  zaza: LABELS.socials.label,
};

/**
 * The portfolio (Portfolio.md §4), one agent's section a page (P24): each item is on the page of the agent that opens
 * it (`by`, `arrangeAgent`), in this order, one under the other.
 */
export const SITE: PortfolioPage = {
  title: "Bhargav",
  sections: [
    {
      id: "home",
      items: [
        { id: "profile", span: PROFILE, by: "bali", render: (placed) => <ProfileCard colSpan={placed.colSpan} rowSpan={placed.rowSpan} /> },
        { id: "looking", span: ABOUT, grow: true, by: "bali", render: () => <AboutCard words={profile.lead} paragraphs={profile.story} /> },
        {
          id: "tech",
          span: TECH,
          grow: true,
          by: "mira",
          render: (placed) => <ProfileTech cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.tech} />,
        },
        { id: "links", span: LINKS_ROW, by: "bali", render: (placed) => <ProfileLinks cols={placed.colSpan} /> },
        { id: "facts", span: ROW, by: "bali", render: () => <ProfileFacts /> },
        { id: "work", span: WORK, by: "oru", render: (placed) => <ProfileWork cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.work} /> },
        {
          id: "projects",
          span: PROJECT_LIST,
          air: 1,
          by: "kino",
          render: (placed) => <ProfileProjects cols={placed.colSpan} rows={placed.rowSpan} lead={LABELS.projects} />,
        },
        { id: "statement-ai", span: STATEMENT_AI, by: "lola", render: () => <StatementCard words={profile.statements.ai} /> },
        {
          id: "interests",
          span: INTEREST_LIST,
          wraps: [LABEL_ROW, ...INTERESTS.map((each) => each.span)],
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
        comingSoon("cases", LABELS.cases, 1, "kino"),
        SOCIALS,
      ],
    },
  ],
};
