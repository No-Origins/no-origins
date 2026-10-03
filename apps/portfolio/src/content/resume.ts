/**
 * The résumé, as data (Portfolio.md P6) — every fact on the site comes from `bhargav.pdf` (2026-09) and nothing is
 * invented to fill a slot. Written in his voice where it is prose (Brand.md §5: first person, plain, warm, no hype);
 * kept as the résumé has it where it is a fact. A link with no `href` is not rendered.
 */

export type Company = { id: string; name: string; short: string; logo: string; href: string };

export const COMPANIES = {
  radise: { id: "radise", name: "Radise", short: "Radise", logo: "/logos/radise.svg", href: "https://radise.com" },
  dataflix: { id: "dataflix", name: "Dataflix", short: "Dataflix", logo: "/logos/dataflix.png", href: "https://dataflix.com" },
  hashnode: { id: "hashnode", name: "Hashnode", short: "Hashnode", logo: "/logos/hashnode.svg", href: "https://hashnode.com" },
  ttt: { id: "ttt", name: "Terribly Tiny Tales", short: "TTT", logo: "/logos/ttt.png", href: "https://www.terriblytinytales.com" },
} satisfies Record<string, Company>;

export const profile = {
  name: "Bhargav",
  handle: "hiddenstack",
  // His words on the first screen (his mock, 2026-09-26). The Radise role in `ROLES` says "Senior" too, where it kept
  // the résumé's "Sr" (his, 2026-09-27: "instead of SR, write senior").
  role: "Senior Full Stack Developer",
  company: COMPANIES.radise,
  location: "Hyderabad, India",
  blurb:
    "I build editors, design systems and agent tools. Six years across four startups: the Fambase front end at Terribly Tiny Tales, the Neptune editor at Hashnode, RAG and agent applications at Dataflix, and now the platform team and the agent harness behind Sia at Radise. No Origins is where I keep what I make.",
  // A fact under the card (his mock, 2026-09-26; Portfolio.md P4). The figure is the résumé's "6+ years"; the words
  // after it are his. Not on the page since 2026-09-27, when his row under the note became Résumé, Email and GitHub.
  years: { figure: "6+ Years", line: "Building Products" },
  // Where he is, beside the degree under the links (2026-09-27).
  city: "Hyderabad",
  // Not from the résumé: his line under the profile, where the note was (2026-10-01, his: "I want to have the following
  // tagline I'm a developer at the intersection of system design and design systems").
  lead: "I'm a developer at the intersection of system design and design systems.",
  // Not from the résumé: his words for the note under the profile, a paragraph each (2026-09-27, his: "I want to replace
  // the what I am after content with the following"). As he wrote them, "sooo" and all; only the spelling is mended
  // ("I've love", "keep track off", "over night", "optinionated", "mutiple", "deciplines"). Since 2026-10-01 they are
  // behind "More about me", under his line (`AboutCard`).
  story: [
    "I worked as a full stack developer for over 6 years now.",
    "I love building systems and interfaces as part of process.",
    "In all these years, I shipped 3 products and sooo many features, that I can't keep track of, into production.",
    "I've led teams from optimising and securing platforms, migrating age old stacks to the modern web stack and also to building new opinionated agentic harnesses.",
    "From the times of piled up incomplete personal projects to shipping multiple features overnight, I've realised it's important to stay curious, be optimistic and keep experimenting.",
    "And now, I'm looking forward to the exciting roles that emerge at the intersection of multiple disciplines.",
  ],
  // Not from the résumé: the note broken down into statements, a card each on the first screen (2026-09-28, his: "I
  // want to break down that large piece about me into small statements. So let's not remove the about me card yet").
  // As he said them; "Love be in" was heard as "Love being in".
  statements: {
    roles: "Love being in new roles that are shaping up at the intersection of disciplines.",
    ai: "Today, AI shortens the path from idea to execution, creating more room for exploration and experimentation.",
  },
  // Not from the résumé: his tagline, for the first screen, 2026-09-25 (Portfolio.md P4). A sentence a line.
  tagline: ["Start with curiosity.", "Let the stack overflow."],
  avatar: { src: "/avatar.png", alt: "Bhargav, drawn: round glasses, a black tee, arms crossed, smiling." },
  // The faces the avatar's "HEY!" wears, one picked at random each time (his, 2026-09-24). 768px WebP, cut down from
  // his 2048px PNGs: the face is never shown wider than ~370px.
  heyFaces: [
    { src: "/avatar-bolt.webp", alt: "Bhargav, drawn: round shades, a blue jacket with a pink lightning bolt, arms crossed." },
    { src: "/avatar-flame.webp", alt: "Bhargav, drawn: round shades, a black jacket with flames, arms crossed." },
  ],
  initials: "BR",
  // His address on the first screen, with a button that copies it (2026-09-27, his: "replace Email button with card
  // containing my email hiddenstack@no-origins.com and copy button to copy email to clipboard").
  email: "hiddenstack@no-origins.com",
};

export type Link = { id: "github" | "linkedin" | "email" | "resume" | "discord" | "x" | "instagram" | "youtube"; label: string; href?: string };

export const LINKS: Link[] = [
  { id: "email", label: "Email", href: `mailto:${profile.email}` },
  { id: "github", label: "GitHub", href: "https://github.com/bhargavAtgithub" },
  // The résumé links a LinkedIn profile but does not print the URL; fill it and its mark in the row becomes a link.
  { id: "linkedin", label: "LinkedIn" },
  // His, for the row of marks under the degree (Portfolio.md P4, 2026-09-27; a row of cells on the first screen
  // 2026-09-25 to 26). X and Instagram are @hiddenstack (his, 2026-09-27); Discord's URL, and LinkedIn's above, are his
  // to give ("we'll add the URLs later") — until then the row draws their marks with no link.
  { id: "discord", label: "Discord" },
  { id: "x", label: "X", href: "https://x.com/hiddenstack" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/hiddenstack" },
  // His, for the content section with X and Instagram (2026-09-28: "also add YouTube"). The URL is his to give; until
  // then its mark stands with no link, as LinkedIn's and Discord's do.
  { id: "youtube", label: "YouTube" },
  // The résumé itself, as the download Brand.md §11 decision 5 asked for.
  { id: "resume", label: "Résumé", href: "/bhargav-reddy-v.pdf" },
];

export type Role = {
  id: string;
  company: Company;
  title: string;
  from: string;
  to: string;
  location?: string;
  /** What I did there, three or four lines, each one thing. */
  did: string[];
  stack: string[];
};

export const ROLES: Role[] = [
  {
    id: "radise",
    company: COMPANIES.radise,
    title: "Senior Full Stack Developer",
    from: "Mar 2025",
    to: "Present",
    location: "Hyderabad",
    did: [
      "Lead the platform team; I have since I joined.",
      "Built the AI agent harness that powers Sia, Radise's assistant.",
      "Own Project Vault, and Products, Projects and Licensing.",
      "Moved the backend from Express to NestJS; auth on Auth.js; notifications, external systems integration and system accounts.",
    ],
    stack: ["Next.js", "NestJS", "Postgres", "Auth.js", "TypeScript"],
  },
  {
    id: "dataflix",
    company: COMPANIES.dataflix,
    // His, 2026-09-27: "in Dataflix it has to be SDE 2, two in Roman"; the résumé has no level.
    title: "Software Development Engineer II",
    from: "Oct 2023",
    to: "Feb 2025",
    location: "Hyderabad",
    did: [
      "Designed and built GenIQ, a full-stack RAG application.",
      "Built an internal alternative to ChatGPT on Next.js, shadcn and Supabase.",
      "Agentic applications with LangChain, LangGraph, Atomic Agents and AutoGen.",
      "Shipped on three clouds: GCP, IBM and AWS.",
    ],
    stack: ["LangChain", "LangGraph", "AutoGen", "Python", "React", "AWS CDK"],
  },
  {
    id: "hashnode",
    company: COMPANIES.hashnode,
    title: "Software Development Engineer",
    from: "Sep 2022",
    to: "Sep 2023",
    did: [
      "Neptune, Hashnode's WYSIWYG editor, was mine for a year: new blocks and the OpenAI integration.",
      "Core team on the Hashnode design system.",
    ],
    stack: ["Next.js", "Tiptap", "ProseMirror", "GraphQL", "OpenAI", "MongoDB"],
  },
  {
    id: "ttt",
    company: COMPANIES.ttt,
    title: "Software Development Engineer",
    from: "Sep 2020",
    to: "Sep 2022",
    did: [
      "Architected and built the Fambase front end from scratch as an intern, then led front-end and helped with system design and the backend.",
      "Built the audio player for the Paytm mini-app, where writers share stories under 120 words.",
    ],
    stack: ["Next.js", "Express", "MySQL", "JavaScript"],
  },
];

export const STACK: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["JavaScript", "TypeScript", "Python", "Elixir · learning", "Rust · learning"] },
  {
    group: "Full stack",
    items: [
      "React", "Next.js", "Tailwind", "shadcn", "Redux", "Zustand", "Jotai", "Node.js", "Express", "NestJS", "GraphQL",
      "Apollo", "gRPC", "ProseMirror", "Tiptap", "MongoDB", "Postgres", "SQL", "Auth.js", "AWS", "AWS CDK", "GCP", "IBM", "Flutter",
    ],
  },
  { group: "LLMs and agents", items: ["LangChain", "LangGraph", "AutoGen", "Atomic Agents", "Ollama", "OpenAI"] },
];

/** The résumé's six skills with the bar it draws for each, as a share of the bar. */
export const SKILLS: { name: string; value: number }[] = [
  { name: "Coding and scripting", value: 100 },
  { name: "Software design and development", value: 80 },
  { name: "Principles and practices of engineering", value: 80 },
  { name: "Creative problem solving", value: 80 },
  { name: "Performance optimisation", value: 80 },
  { name: "Analytical thinking", value: 80 },
];

export const LANGUAGES: { name: string; value: number }[] = [
  { name: "Telugu", value: 100 },
  { name: "English", value: 80 },
  { name: "Hindi", value: 80 },
  { name: "French", value: 20 },
];

// The interests (his, 2026-10-01: "my interests are sketching oil painting designing editing ukulele"). They were
// Sketching, UI/UX in Figma, Video editing in DaVinci Resolve and Ukulele.
export const HOBBIES = ["Sketching", "Oil painting", "Designing", "Editing", "Ukulele"];

export const EDUCATION = {
  degree: "B.Tech in Computer Science (Hons.)",
  // What the degree's pill says (his, 2026-09-27: "remove B.Tech in and put in only computer science honors").
  subject: "Computer Science (Hons.)",
  school: "Lovely Professional University",
  // What the degree's pill says under it (his, 2026-09-27: "add LPU and years").
  short: "LPU",
  place: "Jalandhar, Punjab",
  from: "2017",
  to: "2021",
};

/**
 * Orbit, where the agents are made (Orbit.md): where an agent's ↗ goes, in a new tab (P24, his, 2026-10-03: "it should
 * open orbit application"). Open to everyone since Orbit.md C24 (2026-10-03): a visitor plays with the published agents,
 * and publishing is his.
 */
export const ORBIT_URL = "https://orbit.no-origins.com";
/** The status page (Portfolio.md P25), public: where every app stands. */
export const STATUS_URL = "https://status.no-origins.com";

/**
 * A project. `short` is its card's line and `action` the words on its way out, the recruiter quick view's
 * (2026-09-28): the card has two rows for a project that is out and one for one that is not, and `line` is longer
 * than either holds. One with no `href` says it is not published yet.
 */
export type Project = { name: string; line: string; short?: string; action?: string; state?: string; href?: string };

export const PROJECTS: Project[] = [
  {
    // Orbit since 2026-10-01 (his: "the second project agent society, let's name it as orbit"); the lines are Agents
    // Society's still, and the cards no longer show them.
    name: "Orbit",
    line: "A cloud-based, self-governed and self-improving agent harness. Not here yet; this is where it will live.",
    short: "An agent harness I’m building.",
    state: "in progress",
  },
  {
    name: "No Origins",
    line: "This site, its design system and the tools around it, built as blocks over time, in the open.",
    short: "This site, its design system and the tools around it. Built in the open.",
    action: "Explore the system",
    // No state (his, 2026-09-27: "remove 'you are here'"): the pill is the way out, to the showcase in a new tab.
    href: "https://design.no-origins.com",
  },
];

/**
 * Not his projects: two dummies after them, so the projects' carousel has somewhere to turn (his, 2026-10-01: "add two
 * more dummy projects so that it feels like a carousel"). The dummies of 2026-09-27 were Project Three and Four; in
 * words they run past a two-cell card at `heading`, so these are numbered. Take them out when his own are in `PROJECTS`.
 */
export const DUMMY_PROJECTS: Project[] = [
  { name: "Project 3", line: "A placeholder." },
  { name: "Project 4", line: "A placeholder." },
];
