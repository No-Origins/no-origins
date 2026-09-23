import { SAMPLE, sample } from "./sample";

/**
 * Site facts the map reads. Everything here is either from Brand.md and the brand interview, or a slot that
 * renders only once it has a value. Fill the slots; nothing else needs to change.
 *
 * The seven sections are Brand.md §9. Five of them have no copy yet (Design-System.md §13). Until they do, the
 * slots are filled from `sample.ts` so the whole design can be reviewed at once — every panel drawn that way
 * carries a visible `sample` tag, and `SAMPLE = false` empties them again in one edit. A slot that has a real
 * value below always wins: fill it, and the sample for that slot is never read.
 */

/**
 * A real value beats the sample, and the sample beats nothing — and every slot the sample filled is remembered,
 * so the interface can tag exactly those panels and no others.
 */
const filled = new Set<string>();
const or = <T,>(key: string, real: T | undefined, dummy: T): T | undefined => {
  if (real !== undefined) return real;
  if (!SAMPLE) return undefined;
  filled.add(key);
  return dummy;
};
export const site = {
  name: "Bhargav",
  domain: "bhargav.no-origins.com",
  tagline: "I build editors, design systems and agent tools. No Origins is where I keep them.",

  // ── Slots — not in Brand.md or the interview; each renders only when it exists ──

  /** "Me": where he's based, e.g. "Hyderabad, India". Nothing in any doc says. */
  location: or<string>("location", undefined, sample.location),

  /** "Current Status": what he's looking for, in his words. One or two sentences. */
  status: or<string>("status", undefined, sample.status),

  /** "Interests": what he's curious about outside the work. */
  interests: or<string[]>("interests", undefined, [...sample.interests]),

  /** "Philosophy": how he thinks about building things. One paragraph per idea. */
  philosophy: or<string[]>("philosophy", undefined, [...sample.philosophy]),

  /** "Case Studies": problem → approach → outcome. Candidates live inside `work.ts` — Neptune, Project Vault, GenIQ. */
  caseStudies: or<Array<{ title: string; problem: string; approach: string; outcome: string; hue?: string }>>("caseStudies", undefined, sample.caseStudies.map((c) => ({ ...c }))),

  /** "Projects": his own. Brand.md §9 — nothing has shipped; everything was deleted for a clean slate. */
  projects: undefined as Array<{ title: string; line: string; href?: string }> | undefined,

  contact: {
    email: or<string>("email", undefined, sample.contact.email), // a personal address for the site, e.g. "hi@no-origins.com"
    github: or<string>("github", undefined, sample.contact.github), // full URL
    linkedin: or<string>("linkedin", undefined, sample.contact.linkedin), // full URL
    x: or<string>("x", undefined, sample.contact.x), // full URL
  },
  /** The résumé, as a download inside Work Experience (Brand.md §11 decision 5). Put the PDF in public/. */
  resumeHref: or<string>("resumeHref", undefined, sample.resumeHref),
  /**
   * The photo in "Me" (Design-System.md §13). Filling it makes that panel much taller — re-measure the column.
   * NOT sampled: no real images anywhere on the platform (decided 2026-09-10), so the stand-in would have to be
   * drawn in code, and what to draw is a design decision rather than a placeholder.
   */
  photo: undefined as { src: string; alt: string; width: number; height: number } | undefined,
};

/** Which slots the sample filled. The interface tags exactly these panels, so nothing else is called a draft. */
export const sampled = (key: string) => filled.has(key);
