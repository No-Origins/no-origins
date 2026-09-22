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
  role: "Sr Full Stack Developer",
  company: COMPANIES.radise,
  location: "Hyderabad, India",
  years: "6+ years",
  blurb:
    "I build editors, design systems and agent tools. Six years across four startups: the Fambase front end at Terribly Tiny Tales, the Neptune editor at Hashnode, RAG and agent applications at Dataflix, and now the platform team and the agent harness behind Sia at Radise. No Origins is where I keep what I make.",
  avatar: { src: "/avatar.png", alt: "Bhargav, drawn: round glasses, a black tee, arms crossed, smiling." },
  initials: "BR",
};

export type Link = { id: "github" | "linkedin" | "email" | "resume"; label: string; href?: string };

export const LINKS: Link[] = [
  { id: "email", label: "Email", href: "mailto:hiddenstack@icloud.com" },
  { id: "github", label: "GitHub", href: "https://github.com/bhargavAtgithub" },
  // The résumé links a LinkedIn profile but does not print the URL; fill it and the button appears.
  { id: "linkedin", label: "LinkedIn" },
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
    title: "Sr Full Stack Developer",
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
    title: "Software Development Engineer",
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
  school: "Lovely Professional University",
  place: "Jalandhar, Punjab",
  from: "2017",
  to: "2021",
};

export const PROJECTS: { name: string; line: string; state: string; href?: string }[] = [
  {
    name: "Agents Society",
    line: "A cloud-based, self-governed and self-improving agent harness. Not here yet; this is where it will live.",
    state: "in progress",
  },
  {
    name: "No Origins",
    line: "This site, its design system and the tools around it, built as blocks over time, in the open.",
    state: "you are here",
    href: "https://design.no-origins.com",
  },
];
