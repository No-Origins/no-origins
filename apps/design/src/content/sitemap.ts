/**
 * The showcase's pages, as the sidebar lists them: ten groups, each a list of pages (Components a list of categories
 * of pages). Every page is `/<group>/<page>` and, until its content is written, shows its purpose — what it should
 * cover — so whoever works on it knows what the page is for. A group's `brief` is what every page in it shows or keeps
 * in mind; a page's `notes` are its own.
 */

export type DocPage = { slug: string; title: string; purpose: string; notes?: string[] };
export type DocCategory = { id: string; title: string; pages: DocPage[] };
export type DocGroup = {
  id: string;
  title: string;
  /** What the group is for, and what every page in it shows. */
  brief?: { lead?: string; points?: string[] };
  pages?: DocPage[];
  categories?: DocCategory[];
};

/** A page and where it sits. */
export type DocEntry = { group: DocGroup; category?: DocCategory; page: DocPage; index: number; href: string };

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const page = (title: string, purpose: string, notes?: string[]): DocPage => ({ slug: slug(title), title, purpose, notes });

/** What every component page covers. */
const COMPONENT_PAGE = [
  "Purpose and when to use it.",
  "Anatomy, variants, sizes and supported states.",
  "Interactive examples in both themes.",
  "Keyboard, focus and screen-reader behaviour.",
  "Responsive behaviour and long-content handling.",
  "Content guidance and common mistakes.",
  "Related tokens, implementation API and composition examples.",
  "Readiness, known limitations, and replacement guidance if deprecated.",
];

const LOADER_NOTE = "Installed and available, but restricted: no page loads behind a loader (Grid.md D49).";

const component = (category: string, title: string, notes?: string[]): DocPage =>
  page(title, `The ${title} page, in ${category}: everything someone needs to use it well.`, notes);

const category = (title: string, items: (string | [string, string[]])[]): DocCategory => ({
  id: slug(title),
  title,
  pages: items.map((item) => (typeof item === "string" ? component(title, item) : component(title, item[0], item[1]))),
});

export const SITEMAP: DocGroup[] = [
  {
    id: "overview",
    title: "Overview",
    brief: { lead: "An entry point for a newcomer, before they meet a long catalogue." },
    pages: [
      page("Introduction", "What No Origins is, who the system serves, its scope, and how its layers connect."),
      page("Design principles", "The principles used to judge decisions, with concrete examples."),
      page("Getting started", "How to use the system in design and code; a small working example."),
      page("System map", "Tokens, components, patterns, studios, and their relationships."),
      page("What’s available", "Inventory, readiness, known gaps, and current priorities."),
    ],
  },
  {
    id: "brand",
    title: "Brand",
    brief: {
      lead: "These pages reflect Brand.md, including its open decisions.",
      points: ["Character appearance is edited in Orbit; this application documents how characters are used."],
    },
    pages: [
      page("Identity", "Name, purpose, personality, and how apps belong to No Origins."),
      page("Mark & wordmark", "Approved assets, sizing, placement, backgrounds, and misuse."),
      page("Brand expression", "How colour, typography, shape, and motion express the brand."),
      page("Imagery & illustration", "Image selection, cropping, placeholders, and illustration rules where defined."),
      page("Characters", "Orbit’s role, character identities, permitted uses, and links to published looks.", [
        "Character appearance editing belongs in Orbit; this page documents how characters are used.",
      ]),
    ],
  },
  {
    id: "tokens",
    title: "Tokens",
    brief: {
      lead: "The reference for named values and relationships. Every token entry shows:",
      points: [
        "Its name, type, and value or formula.",
        "Its reference, and a description.",
        "Its theme values and a preview.",
        "Usage restrictions, and status.",
        "The Design Tokens specification supports typed values, references, descriptions and deprecation metadata.",
      ],
    },
    pages: [
      page("Token architecture", "Foundation and semantic layers; component tokens where needed; naming and references."),
      page("Colour", "Base colours; surfaces, text, borders, actions, focus, and feedback roles; permitted pairings."),
      page("Typography", "Font families, sizes, weights, line heights, letter spacing, and composed text roles."),
      page("Spacing", "Approved steps and their use for gaps, padding, and insets."),
      page("Sizing", "Shared control heights, icon dimensions, and other approved dimensions."),
      page("Grid & breakpoints", "Cell and gutter values, breakpoint thresholds, and derived dimensions."),
      page("Shape & borders", "Radius, border width, stroke styles, and derivation rules.", [
        "The radius entry explains half the grid cell (Grid.md D39); it does not invent a conventional small, medium and large radius scale.",
      ]),
      page("Motion", "Durations, easing, travel, scale, and spring parameters organised by purpose."),
      page("Layers & overlays", "Stacking order, overlay values, and surface separation decisions."),
      page("Themes & modes", "Light and dark mappings and any approved context-specific overrides."),
    ],
  },
  {
    id: "foundations",
    title: "Foundations",
    brief: {
      lead: "How to apply the decisions the tokens represent.",
      points: [
        "Tokens → Colour answers “What is primary?”; Foundations → Colour answers “Where should I use it?”",
        "Material similarly documents layout, interaction states, accessibility and tokens as foundations.",
      ],
    },
    pages: [
      page("Colour & themes", "Choosing surfaces and emphasis, colour pairing, contrast, and theme behaviour."),
      page("Typography", "Hierarchy, choosing text roles, wrapping, truncation, and readable content."),
      page("Grid & Slots", "Cell placement, spans, gutters, slot fills, insets, alignment, and overflow pages."),
      page("Responsive layout", "How arrangements adapt to width and height; reading order and content fit."),
      page("Shape & surfaces", "Pills, circles, containers, borders, and material rules."),
      page("Iconography", "Icon source, sizes, stroke consistency, alignment, meaning, and accessible labels."),
      page("Motion", "When movement helps, motion families, interruption, and reduced motion."),
      page("Interaction states", "Default, hover, focus, pressed, selected, disabled, pending, and invalid where applicable."),
      page("Cursor", "The pointer: the violet ring, and what it tells — where the pointer is, a press, a held slider, and how far a box is scrolled."),
      page("Layers & portals", "Where menus and dialogs appear, clipping, stacking, and overlay behaviour."),
    ],
  },
  {
    id: "components",
    title: "Components",
    brief: {
      lead: "Familiar names, grouped by purpose, a page each. These are catalogue categories, not a requirement to build everything at once; an installed component's page says whether it is approved for use. Every component page covers:",
      points: [...COMPONENT_PAGE, "The WAI-ARIA Authoring Practices give interaction guidance for widgets such as dialogs, tabs, menus and comboboxes."],
    },
    categories: [
      category("Actions", ["Button", "Button Group", "Toggle", "Toggle Group"]),
      category("Text & identity", ["Text", "Label", "Link", "Badge", "Avatar", "Keyboard Key"]),
      category("Form controls", [
        "Input",
        "Textarea",
        "Input Group",
        "Checkbox",
        "Radio Group",
        "Switch",
        "Select",
        "Combobox",
        "Slider",
        "Colour Picker",
        "Input OTP",
        "Calendar",
      ]),
      category("Form structure", ["Field", "Labels", "Descriptions", "Required indicators", "Validation messages"]),
      category("Navigation", ["Sidebar", "Navigation Menu", "Breadcrumb", "Tabs", "Pagination", "Grid Pager"]),
      category("Menus & discovery", ["Dropdown Menu", "Context Menu", "Menubar", "Command"]),
      category("Containers & disclosure", ["Card", "Item", "Separator", "Accordion", "Collapsible", "Resizable", "Aspect Ratio"]),
      category("Overlays", ["Dialog", "Alert Dialog", "Sheet", "Drawer", "Popover", "Tooltip", "Hover Card"]),
      category("Feedback", ["Alert", "Toast", "Empty State", "Progress", ["Spinner", [LOADER_NOTE]], ["Skeleton", [LOADER_NOTE]]]),
      category("Data display", ["Table", "Chart"]),
      category("Messaging", ["Message", "Bubble", "Attachment", "Message Scroller", "Questionnaire"]),
      category("No Origins components", ["Grid", "Grid Pages", "Slot", "Grid Intro", "Agent", "Liquid", "Hiddenstack Avatar"]),
    ],
  },
  {
    id: "patterns",
    title: "Patterns",
    brief: {
      lead: "A recurring user problem solved by several components. Each pattern shows:",
      points: [
        "The problem and the flow.",
        "The components it is composed of.",
        "Edge cases and accessibility.",
        "A complete example.",
        "USWDS’s pattern guidance similarly centres common user interactions rather than individual widgets.",
      ],
    },
    pages: [
      page("Forms & validation", "Field order, grouping, help, validation timing, errors, and submission."),
      page("Drafts & saving", "Changed values, Save and Discard, pending saves, failures, and leaving with unsaved work."),
      page("Navigation & page turns", "Route navigation, grid pages, current location, keyboard behaviour, and mobile navigation."),
      page("Search & filtering", "Queries, filters, result counts, clearing, and no results."),
      page("Selection & bulk actions", "Single and multiple selection, selected counts, actions, and cancellation."),
      page("Confirmation & recovery", "Destructive actions, confirmation, undo where possible, and recovery."),
      page("Status & feedback", "Success, error, warning, empty, unavailable, and pending experiences."),
      page("Authentication & access", "Sign-in, verification, no access, and session expiry experiences."),
      page("Data browsing", "Tables, sorting, pagination, details, and handling dense content."),
      page("Studio interaction", "Stage, control groups, draggable jigs, tuning, and version selection."),
      page("Character interaction", "Introductions, guidance, actions, and reduced-motion alternatives."),
    ],
  },
  {
    id: "templates",
    title: "Templates",
    brief: {
      lead: "A complete page arrangement using approved patterns.",
      points: ["Every template demonstrates the grid’s rules.", "A template is a reusable arrangement, not a copy of one app’s page."],
    },
    pages: [
      page("Application shell", "Navigation, main content, global actions, and mobile adaptation."),
      page("Documentation & specimens", "Browsing the library, examples, guidance, and references."),
      page("Collection & detail", "Browsing items and opening an individual item."),
      page("Settings & administration", "Grouped controls, permissions, drafts, and saving."),
      page("Studio", "Stage, control columns, timeline, and overflow."),
      page("Authentication & access", "Sign-in, verification, and no-access layouts."),
      page("Portfolio & editorial", "Profile, projects, articles, and reading order."),
      page("Error & unavailable", "Missing routes, unavailable content, and next actions."),
    ],
  },
  {
    id: "accessibility",
    title: "Accessibility",
    brief: {
      lead: "A visible home for accessibility, which is also documented on every relevant component and pattern.",
      points: ["The grid needs particular attention: page turning, clipped slots and keyboard reading order need explicit guidance and verification."],
    },
    pages: [
      page("Accessibility approach", "Target standards, responsibilities, and known limitations."),
      page("Keyboard & focus", "Reading order, shortcuts, focus visibility, trapping, and restoration."),
      page("Semantics & assistive technology", "Headings, landmarks, names, descriptions, and announcements."),
      page("Colour & contrast", "Text and control contrast, and meaning beyond colour."),
      page("Zoom & responsive access", "Content fit, text enlargement, and access at narrow viewport sizes."),
      page("Motion & input", "Reduced motion, pointer alternatives, touch targets, and drag alternatives."),
      page("Testing", "Manual checks, automated checks, and recorded findings."),
    ],
  },
  {
    id: "content",
    title: "Content",
    brief: {
      lead: "How No Origins writes.",
      points: ["Atlassian’s content guidance treats voice, inclusive language, formatting and messages as part of its system."],
    },
    pages: [
      page("Voice & tone", "How No Origins speaks in ordinary, successful, and difficult situations."),
      page("Labels & instructions", "Buttons, navigation, field labels, descriptions, and tooltips."),
      page("Messages", "Errors, warnings, confirmations, success, and empty states."),
      page("Formatting", "Capitalisation, punctuation, numbers, dates, times, and units."),
      page("Inclusive language & localisation", "Clear language, translation, text expansion, and RTL behaviour."),
      page("Terminology", "Approved names and consistent terms across apps."),
    ],
  },
  {
    id: "resources",
    title: "Resources & Maintenance",
    pages: [
      page("Design resources", "Available design libraries, assets, and how to use them."),
      page("Development resources", "Installation, imports, theming, fonts, utilities, and integration."),
      page("Playground & studios", "Links to specimens, Motion, and Orbit; what each tool owns."),
      page("Contribution", "Proposing a token, component, or pattern; evidence and review requirements."),
      page("Quality checklist", "Accessibility, themes, responsive behaviour, content edges, and visual review."),
      page("Status & roadmap", "Proposed, experimental, approved, and deprecated items; unresolved decisions."),
      page("Releases & migration", "Changes, compatibility, replacements, and migration instructions."),
      page("Decision reference", "Links to the documents that establish the system’s rules."),
    ],
  },
];

/** Every page with its group, category, and the group's number (from 1). */
export const DOC_ENTRIES: DocEntry[] = SITEMAP.flatMap((group, i) => {
  const at = (p: DocPage, c?: DocCategory): DocEntry => ({ group, category: c, page: p, index: i + 1, href: `/${group.id}/${p.slug}` });
  return [...(group.pages ?? []).map((p) => at(p)), ...(group.categories ?? []).flatMap((c) => c.pages.map((p) => at(p, c)))];
});

/** The page at `/<group>/<page>`, if there is one. */
export function findDoc(groupId: string, pageSlug: string): DocEntry | undefined {
  return DOC_ENTRIES.find((entry) => entry.group.id === groupId && entry.page.slug === pageSlug);
}

/** The page whose href is `pathname`, if any. */
export function docAt(pathname: string): DocEntry | undefined {
  return DOC_ENTRIES.find((entry) => entry.href === pathname);
}
