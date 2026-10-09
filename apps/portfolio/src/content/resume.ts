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
  // His words under his name. The Radise role in `ROLES` says "Senior" too, where the résumé says "Sr".
  role: "Senior Full Stack Developer",
  company: COMPANIES.radise,
  location: "Hyderabad, India",
  blurb:
    "I build editors, design systems and agent tools. Six years across four startups: the Fambase front end at Terribly Tiny Tales, the Neptune editor at Hashnode, RAG and agent applications at Dataflix, and now the platform team and the agent harness behind Sia at Radise. No Origins is where I keep what I make.",
  // The figure is the résumé's "6+ years"; the words after it are his. Not on the page.
  years: { figure: "6+ Years", line: "Building Products" },
  // Where he is, beside the degree under the links.
  city: "Hyderabad",
  // Not from the résumé: his line under the profile.
  lead: "I'm a developer at the intersection of system design and design systems.",
  // Not from the résumé: his words about himself, a paragraph each, behind "More about me" under his line
  // (`AboutCard`). As he wrote them, "sooo" and all; only the spelling is mended.
  story: [
    "I worked as a full stack developer for over 6 years now.",
    "I love building systems and interfaces as part of process.",
    "In all these years, I shipped 3 products and sooo many features, that I can't keep track of, into production.",
    "I've led teams from optimising and securing platforms, migrating age old stacks to the modern web stack and also to building new opinionated agentic harnesses.",
    "From the times of piled up incomplete personal projects to shipping multiple features overnight, I've realised it's important to stay curious, be optimistic and keep experimenting.",
    "And now, I'm looking forward to the exciting roles that emerge at the intersection of multiple disciplines.",
  ],
  // Not from the résumé: his statements, a card each (`StatementCard`). As he said them; "Love be in" was heard as
  // "Love being in". The one about roles is not on the page.
  statements: {
    roles: "Love being in new roles that are shaping up at the intersection of disciplines.",
    ai: "Today, AI shortens the path from idea to execution, creating more room for exploration and experimentation.",
  },
  // Not from the résumé: his tagline, a sentence a line. Not on the page.
  tagline: ["Start with curiosity.", "Let the stack overflow."],
  avatar: { src: "/avatar.png", alt: "Bhargav, drawn: round glasses, a black tee, arms crossed, smiling." },
  // The faces the avatar's "HEY!" wears, one picked at random each time. 768px WebP, cut down from
  // his 2048px PNGs: the face is never shown wider than ~370px.
  heyFaces: [
    { src: "/avatar-bolt.webp", alt: "Bhargav, drawn: round shades, a blue jacket with a pink lightning bolt, arms crossed." },
    { src: "/avatar-flame.webp", alt: "Bhargav, drawn: round shades, a black jacket with flames, arms crossed." },
  ],
  initials: "BR",
  // His address, in a card with a button that copies it (`EmailCard`).
  email: "hiddenstack@no-origins.com",
};

export type Link = { id: "github" | "linkedin" | "email" | "resume" | "discord" | "x" | "instagram" | "youtube"; label: string; href?: string };

export const LINKS: Link[] = [
  { id: "email", label: "Email", href: `mailto:${profile.email}` },
  { id: "github", label: "GitHub", href: "https://github.com/bhargavAtgithub" },
  // The résumé links a LinkedIn profile but does not print the URL; fill it and its mark in the socials becomes a link.
  { id: "linkedin", label: "LinkedIn" },
  // The socials' marks (Portfolio.md P4). X and Instagram are @hiddenstack; Discord's URL, and LinkedIn's above, are
  // his to give — until then the socials draw their marks with no link.
  { id: "discord", label: "Discord" },
  { id: "x", label: "X", href: "https://x.com/hiddenstack" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/hiddenstack" },
  // The URL is his to give; until then its mark stands with no link, as LinkedIn's and Discord's do.
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
    // His: SDE II, in Roman numerals; the résumé has no level.
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

// The interests, his.
export const HOBBIES = ["Sketching", "Oil painting", "Designing", "Editing", "Ukulele"];

export const EDUCATION = {
  degree: "B.Tech in Computer Science (Hons.)",
  // What the degree's pill says.
  subject: "Computer Science (Hons.)",
  school: "Lovely Professional University",
  // What the degree's pill says under it, with the years.
  short: "LPU",
  place: "Jalandhar, Punjab",
  from: "2017",
  to: "2021",
};

/**
 * Orbit, where the agents are made (Orbit.md): where an agent's ↗ goes, in a new tab (P24). Open to everyone
 * (Orbit.md C24): a visitor plays with the published agents, and publishing is his.
 */
export const ORBIT_URL = "https://orbit.no-origins.com";
/** The status page (Portfolio.md P25), public: where every app stands. */
export const STATUS_URL = "https://status.no-origins.com";

/**
 * A project. Its card shows its name; `line`, `short`, `action` and `state` are its words, kept for when a card says
 * more. One with an `href` is a link.
 */
export type Project = { name: string; line: string; short?: string; action?: string; state?: string; href?: string };

export const PROJECTS: Project[] = [
  {
    // The lines are Agents Society's, Orbit's name before; the cards do not show them.
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
    // No state: the card is the way out, to the showcase in a new tab.
    href: "https://design.no-origins.com",
  },
];

/**
 * Not his projects: two dummies after them, so the projects' carousel has somewhere to turn. Numbered, since in words
 * they run past a two-cell card at `heading`. Take them out when his own are in `PROJECTS`.
 */
export const DUMMY_PROJECTS: Project[] = [
  { name: "Project 3", line: "A placeholder." },
  { name: "Project 4", line: "A placeholder." },
];
