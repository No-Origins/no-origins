import { ASSETS, EFFECTS } from "@cinema/content";

/**
 * The home page's sections (Cinema.md F11), in order: Assets, the art department's, and Effects, the effects
 * department's (his, 2026-10-09: "effects like thunder and rain"). Each lists the library entries his folder names for
 * it, and each entry opens on its own page at `<path>/<id>`.
 */
export const SECTIONS = [
  { id: "assets", label: "Assets", one: "asset", path: "/asset", entries: ASSETS },
  { id: "effects", label: "Effects", one: "effect", path: "/effect", entries: EFFECTS },
] as const;
export type Section = (typeof SECTIONS)[number];
export type SectionId = Section["id"];

/** The section an entry is in, if any. */
export const sectionOf = (id: string): Section | undefined => SECTIONS.find((section) => section.entries.includes(id));
