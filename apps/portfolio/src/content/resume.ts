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
  name: "Bhargav Reddy V",
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
  // Not from the résumé: his words for the note under the profile, a paragraph each (2026-09-27, his: "I want to replace
  // the what I am after content with the following"). As he wrote them, "sooo" and all; only the spelling is mended
  // ("I've love", "keep track off", "over night", "optinionated", "mutiple", "deciplines").
  story: [
    "I worked as a full stack developer for over 6 years now.",
    "I love building systems and interfaces as part of process.",
    "In all these years, I shipped 3 products and sooo many features, that I can't keep track of, into production.",
    "I've led teams from optimising and securing platforms, migrating age old stacks to the modern web stack and also to building new opinionated agentic harnesses.",
    "From the times of piled up incomplete personal projects to shipping multiple features overnight, I've realised it's important to stay curious, be optimistic and keep experimenting.",
    "And now, I'm looking forward to the exciting roles that emerge at the intersection of multiple disciplines.",
  ],
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

export type Link = { id: "github" | "linkedin" | "email" | "resume" | "discord" | "x" | "instagram"; label: string; href?: string };

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

export const HOBBIES = ["Sketching", "UI/UX in Figma", "Video editing in DaVinci Resolve", "Ukulele"];

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

export type Project = { name: string; line: string; state?: string; href?: string };

export const PROJECTS: Project[] = [
  {
    name: "Agents Society",
    line: "A cloud-based, self-governed and self-improving agent harness. Not here yet; this is where it will live.",
    state: "in progress",
  },
  {
    name: "No Origins",
    line: "This site, its design system and the tools around it, built as blocks over time, in the open.",
    // No state (his, 2026-09-27: "remove 'you are here'"): the pill is the way out, to the showcase in a new tab.
    href: "https://design.no-origins.com",
  },
];
