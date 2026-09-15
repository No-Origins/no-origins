/**
 * The token screens (Design-System.md §14 step 14, reorganised 2026-09-15).
 *
 * `/tokens` used to be one page with seven `<Group>`s down it. It is now seven screens, and this array is what
 * both halves of that read: the menu builds its children from it and each screen takes its own title and lead
 * from it by slug. One declaration — the alternative is a heading in the nav and a different heading on the page,
 * which is exactly the drift the registry exists to prevent on the component side.
 *
 * **Pure data, no React**: the menu is a client island, so anything it imports lands in the browser bundle. This
 * costs a few hundred bytes there; importing the registry would cost the whole package.
 */
export interface TokenPage {
  /** The route segment under `/tokens`. */
  slug: string;
  title: string;
  /** The screen's lead, and the card's line on the index. */
  line: string;
}

export const tokenPages: readonly TokenPage[] = [
  {
    slug: "colour",
    title: "Colour",
    line: "Seven hues. Each has a pastel fill, a deep tier that works as text on the ground, and a saturated tint — the line colour a pattern draws with. Grey is the host: it has a tint too, and it is the only one with no colour left in it.",
  },
  {
    slug: "contrast",
    title: "Contrast",
    line: "The floors from §12, measured in the theme you are looking at. The showcase cannot refuse a value that breaks one — tokens are code — so its job is to make a broken floor impossible to miss.",
  },
  {
    slug: "type",
    title: "Type",
    line: "The Bowlby rule: the display face appears at h2 and above, and in the wordmark. Everything smaller is Hanken 600 or 400.",
  },
  {
    slug: "space",
    title: "Space",
    line: "A 4px base. Section rhythm is 96 desktop, 64 mobile; card padding 20–24.",
  },
  { slug: "radius", title: "Radius", line: "Round is the brand." },
  {
    slug: "elevation",
    title: "Elevation",
    line: "Warm shadows, never grey: all four are built on --shade, which is warm ink in the light theme and black in the dark one.",
  },
  {
    slug: "motion",
    title: "Motion",
    line: "Four durations, three easings, five named patterns. Every one of them sits behind a reduced-motion block; nothing ambient survives it.",
  },
];

/** A screen's own entry. Throws at build time rather than rendering a page with no title. */
export function tokenPage(slug: string): TokenPage {
  const found = tokenPages.find((p) => p.slug === slug);
  if (!found) throw new Error(`No token page "${slug}" — add it to tokenPages or fix the route.`);
  return found;
}
