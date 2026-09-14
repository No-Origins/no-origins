import type { BlockCardProps } from "@no-origins/ui";

/**
 * The four roles, told as blocks (Brand.md §9, from the interview in Bhargav's words). Newest first.
 * Chip hues follow the through-line: editors → lavender (the editor block), design systems → peach,
 * agents → blue (the harness), full-stack → green; tools and stacks are grey.
 */
export const throughLine = {
  editors: { label: "editors", hue: "lavender" },
  designSystems: { label: "design systems", hue: "peach" },
  agents: { label: "agent systems", hue: "blue" },
  fullStack: { label: "full-stack", hue: "green" },
} as const;

const tech = (label: string) => ({ label, hue: "grey" as const });

export const roles: Array<Pick<BlockCardProps, "hue" | "meta" | "title" | "line" | "details" | "chips">> = [
  {
    hue: "peach",
    meta: "Radise · now",
    title: "The whole stack of SmartInfra Hub",
    line: "Auth, servers, storage, licensing and performance, end to end.",
    details: [
      "Moved authentication to NextAuth and migrated the Express server to Nest.",
      "Built Project Vault: a storage layer on Azure Blob Storage with a unified file explorer for SmartInfra Hub projects.",
      "Built the licensing feature.",
      "Migrated legacy LabVIEW and .NET projects to Nest, with Claude.",
      "Optimised the Next.js app end to end.",
    ],
    chips: [throughLine.fullStack, tech("next.js"), tech("nest"), tech("azure")],
  },
  {
    hue: "green",
    meta: "Dataflix",
    title: "GenIQ: RAG and agentic applications",
    line: "Full-stack retrieval apps, an internal alternative to ChatGPT, and agents that do work.",
    details: [
      "Designed and built GenIQ, full-stack RAG applications.",
      "Built an internal ChatGPT alternative on Next.js, Tailwind, shadcn, Supabase, Clerk and Auth0.",
      "Built agentic applications with LangChain, LangGraph, Atomic Agents and AutoGen.",
    ],
    chips: [throughLine.agents, throughLine.fullStack, tech("langgraph")],
  },
  {
    hue: "blue",
    meta: "Hashnode · one year",
    title: "Neptune, Hashnode's editor",
    line: "The WYSIWYG editor on tiptap was mine for a year, plus a seat on the design-system core team.",
    details: [
      "Owned Neptune: foundational blocks and an OpenAI integration that helps people write.",
      "Core team member building Hashnode's design system.",
    ],
    chips: [throughLine.editors, throughLine.designSystems, tech("tiptap")],
  },
  {
    hue: "pink",
    meta: "Terrible Tiny Tales · two years, intern then full time",
    title: "Fambase, and my first editor",
    line: "Set up the Fambase frontend as an intern; then built and maintained the tiptap WYSIWYG editor.",
    chips: [throughLine.editors, throughLine.fullStack, tech("react")],
  },
];
