/**
 * SAMPLE COPY — none of this is true. (Bhargav, 2026-09-11: “let's just fill in dummy data … the goal is to get
 * to a final version 1 of complete portfolio design”.)
 *
 * Five of the seven sections had no words, so the map stood up as `draft` placeholders and the design could not
 * be judged whole. This fills every empty slot in `site.ts` with copy of the RIGHT SHAPE — the right number of
 * items, the right sentence lengths, the right structure — so the layout is real even though the writing is not.
 *
 * Three rules it follows, and they are the reason this file exists instead of the values being typed into
 * `site.ts` directly:
 *
 * 1. **It is one import and one flag.** `site.ts` merges this only while `SAMPLE` is true. Real copy arrives by
 *    filling the slot above it; the day all of them are filled, the flag goes and this file is deleted.
 * 2. **Everything it produces is marked in the interface.** Every panel drawn from it carries a `sample` tag, the
 *    same one `Placeholder` uses for `draft`. Nothing here can be mistaken for finished writing on screen.
 * 3. **Anything checkable is unmistakably fake.** Prose can be realistic because prose is obviously a draft, but
 *    a location, an email or a profile URL is a claim someone could act on — so those are reserved dummies
 *    (`example.com`) or an open slot shape, never a plausible guess at the truth.
 *
 * What is deliberately NOT filled: `photo` (no real images anywhere on the platform, decided 2026-09-10 — a
 * coded stand-in is a design decision, not a placeholder) and `projects`, whose v1 is the honest empty state
 * rather than a list, because nothing has shipped (Brand.md §9, principle 4).
 */

export const SAMPLE = true;

export const sample = {
  /** A claim someone could check, so it stays a slot shape rather than a plausible guess. */
  location: "City, Country",

  status:
    "Sample copy. Looking for the kind of work where the interface is the hard part — editors, design systems, the surfaces agents act through. Open to a full-time role, and to a short collaboration if the problem is interesting enough.",

  interests: [
    "How editors decide what a document *is*",
    "Type on screen, and the parts of it nobody notices",
    "Small tools that do one thing without asking permission",
    "Maps, and why a good one is mostly what it leaves out",
    "Coffee, made badly and often",
    "Long walks with a podcast about something useless",
  ],

  philosophy: [
    "Sample copy. Build the smallest thing that is honestly finished, then put it somewhere people can use it. A finished small thing teaches you more in a week than an unfinished large one teaches you in a year.",
    "The interface is not a layer on top of the work. It is where the work becomes usable, which means it is where most of the thinking has to happen — and it is the part that is easiest to leave until last and hardest to fix then.",
    "Say what a thing does not do. Every product I have liked was clear about its edges, and every one I have distrusted was vague about them in a way that turned out to be deliberate.",
  ],

  caseStudies: [
    {
      title: "Neptune, an editor people write in every day",
      problem:
        "Sample copy. Writers were losing structure between drafting and publishing, and the old editor made every block feel like a different tool.",
      approach:
        "Rebuilt the block model on tiptap so one set of rules covered every block, then added an assist that suggests rather than rewrites.",
      outcome: "Sample copy. Fewer support threads about lost formatting, and a block model the team could extend without asking.",
      hue: "blue",
    },
    {
      title: "Project Vault, storage that behaves like a folder",
      problem:
        "Sample copy. Project files lived in several places with no shared idea of where anything was, so people kept their own copies.",
      approach:
        "Put one file explorer over Azure Blob Storage, with the same tree, permissions and search everywhere the product touches files.",
      outcome: "Sample copy. One place to look, and a storage layer the rest of the product could build on instead of around.",
      hue: "peach",
    },
    {
      title: "GenIQ, retrieval that answers with its sources",
      problem:
        "Sample copy. Teams wanted answers from their own documents and did not trust a system that could not show where an answer came from.",
      approach:
        "Built the retrieval and the agent loop so every answer carries its passages, and a wrong answer is traceable to the passage that caused it.",
      outcome: "Sample copy. Answers people could check, which is the only kind that gets used twice.",
      hue: "green",
    },
  ],

  contact: {
    email: "hello@example.com",
    github: "https://example.com/github",
    linkedin: "https://example.com/linkedin",
    x: "https://example.com/x",
  },

  /** A real file lives at this path so the button is a working download rather than a 404 in review. */
  resumeHref: "/sample-resume.pdf",
} as const;
