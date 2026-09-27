import { ROLES } from "@/content/resume";

/** Portfolio.md P17: a recruiter's first glance, not the whole future portfolio. */
export const SCREENING = {
  introduction: "I build editors, design systems and agent tools.",
  experience: "Six years across four startups.",
  outlook: "I stay curious, keep experimenting, and enjoy work across disciplines.",
  skills: ["TypeScript", "React", "Next.js", "Postgres", "Python", "LangGraph"],
  learning: ["Elixir", "Rust"],
};

// Short versions of the contributions already recorded in resume.ts; no invented outcomes or metrics.
const CONTRIBUTIONS: Record<string, string> = {
  radise: "Built the agent harness behind Sia.",
  dataflix: "Built GenIQ, a full-stack RAG application.",
  hashnode: "Worked on Neptune and the design system.",
  ttt: "Built the Fambase front end from scratch.",
};

export const SCREENING_WORK = ROLES.map((role) => ({ ...role, contribution: CONTRIBUTIONS[role.id] }));
