import { head, group, item, chip, blob, swatch, verdictChip, VERDICTS, wordmark } from "../lib.mjs";

const LAYERS = [
  ["Tokens", "the values", ["colour roles", "the family + hue slot", "semantic", "block accent", "glass", "radius", "elevation", "motion", "space ✚", "type steps ✚", "control heights ✚", "icon sizes ✚", "grid · grain"], "green"],
  ["Atoms", "one job, no children of their kind", ["Ground", "Blob", "Wordmark", "Glass", "Text", "Heading", "Label", "Dot", "Divider", "Image", "Icon ✚", "Button", "Chip", "Toggle", "Bubble", "Card", "Placeholder", "Stack · Row", "Illustration"], "peach"],
  ["Molecules", "atoms combined, still one job", ["Field", "Segmented (ThemeSwitch)", "ChatInput", "SectionHeader (+Intro)", "CellHead", "Figure", "Steps", "Speaker ✚", "Dots (out of Carousel)", "ContrastRow", "Select · Checkbox ✚", "Tabs · Toast ✚", "Dialog · Menu · Tooltip ✚", "Tree ✚"], "yellow"],
  ["Organisms", "a distinct section of a screen", ["NavBar", "Menu ✚ (absorbs Rail)", "Footer", "BlockCard", "MediaCard", "Quote", "ProfileCard", "Deck · Carousel", "Bento · BentoCell", "Catalogue", "ContrastReport", "canvas nodes", "Table ✚", "Inspector (with the editor)"], "lavender"],
  ["Templates", "the shells", ["Page", "Tool ✚", "Canvas", "Document ✚"], "blue"],
  ["Pages", "instances — the apps", ["portfolio", "design", "admin", "…the next block"], "pink"],
];

const layerCards = () => `<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:16px;align-items:start">${LAYERS.map(([n,l,list,h],i) => `<div class="noo-card noo-card--pad-sm" style="display:flex;flex-direction:column;gap:12px;min-height:100%"><div class="rv-col" style="gap:4px"><div class="rv-row" style="gap:8px"><span class="noo-dot" data-hue="${h}"></span><p class="noo-label" style="margin:0;color:var(--muted)">layer ${i+1}</p></div><h3 class="noo-h4" style="margin:0">${n}</h3><p class="noo-body-sm" style="margin:0;color:var(--muted)">${l}</p></div><ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px;font:400 13.5px/1.35 var(--ff-sans);color:var(--ink-2)">${list.map((x) => `<li>${x.includes("✚") ? `<span style="color:var(--blue-deep)">${x}</span>` : x}</li>`).join("")}</ul></div>`).join("")}</div>
<div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:16px;margin-top:10px"><p class="rv-cap" style="grid-column:1 / span 6;text-align:center">reads →&nbsp;&nbsp;&nbsp;&nbsp; each layer reads only the layers to its left · <span style="color:var(--blue-deep)">✚ does not exist yet</span></p></div>`;

const cascade = () => `<div class="rv-col" style="gap:20px"><div class="rv-row" style="gap:24px;align-items:center;flex-wrap:nowrap"><div class="rv-sw" style="width:123px"><div class="rv-sw__chip" style="background:var(--accent);width:120px;border-radius:var(--r-pill)"></div><div class="rv-sw__name">--accent</div><div class="rv-sw__val">the block’s hue</div></div>${blob({ size: "md" })}${chip("a chip")}<button type="button" class="noo-btn noo-btn--secondary glass glass-1 rv-focus"><span class="noo-btn__text">a focused button</span></button><div class="glass glass-1 noo-field__box" style="width:160px;flex:none;box-shadow:inset 0 0 0 1.5px var(--accent-deep),0 0 0 3px color-mix(in oklch, var(--accent) 25%, transparent),var(--e1)"><input class="noo-field__input" value="a field, focused"></div><div class="noo-bento" style="padding:0;align-self:center;display:flex"><div class="noo-bento__cell noo-bento__cell--fill" style="width:96px;height:96px;padding:12px"><p class="noo-label" style="margin:0">loud</p><p class="noo-bento__figure noo-bento__figure--md" style="gap:2px"><span class="noo-bento__value" style="font-size:36px">1</span></p></div></div><a href="#" class="noo-nav__link" aria-current="page" style="position:relative">a current link</a><p class="glass glass-1 noo-bubble noo-bubble--tint">and a tinted bubble</p></div>
<p class="rv-callout">Change the <strong>block</strong> tweak above this board. Every one of these recolours and no component was restyled — they all read <code>--accent</code>, <code>--accent-deep</code>, <code>--accent-tint</code>. That is the cascade the release generalises: the same four names, <code>--hue*</code>, for anything with a <code>data-hue</code>, and the same idea for space, type and control size. Then <strong>a change to a token is a change to every component, by construction.</strong></p></div>`;

const RULES = [
  ["A component reads tokens and the hue slot. Never a literal.", "No px on a font-size, gap, padding or height; no colour that is not a <code>var()</code>. Checked by stylelint on the package (<code>declaration-property-value-disallowed-list</code>), so it is a failing build and not a memory."],
  ["Hue by attribute, declared once.", "<code>[data-hue=\"x\"]</code> sets <code>--hue · --hue-deep · --hue-tint · --hue-ink</code> in tokens.css. Component CSS never lists a hue. The block accent is the same four names at the root."],
  ["Layers read downward only.", "Atoms import tokens. Molecules import atoms. Organisms import both. Templates import anything. Nothing imports sideways or up. Enforced with <code>no-restricted-imports</code> per folder."],
  ["One registry entry per component, grouped by layer.", "The catalogue renders the registry by layer, so the showcase, the admin’s catalogue and the editor’s palette all show this architecture — not a seven-group list that only the registry knows."],
  ["Apps compose; apps do not style.", "Zero Tailwind utilities for spacing or colour in an app file. If a screen needs one, a component is missing — Scene-Schema found ten that way. The <code>@theme</code> layer stays for hosts we do not own."],
];

const rules = () => `<ol class="noo-steps" data-hue="lavender" style="max-width:820px">${RULES.map(([t,b]) => `<li class="noo-step"><span class="noo-step__marker" aria-hidden="true"></span><div class="noo-step__body"><p class="noo-h4 noo-step__title">${t}</p><div class="noo-body-sm noo-step__text" style="max-width:70ch">${b}</div></div></li>`).join("")}</ol>`;

const DECISIONS = [
  ["D1 · The hue slot", "Add <code>--hue*</code> once in tokens.css; every component drops its ladder.", "Yes, as proposed", "This is the release. Without it “connected” stays a slogan."],
  ["D2 · The missing token groups", "Space (12 steps), two control type steps (<code>ui</code> 15, <code>ui-sm</code> 13) plus four widget steps, control heights (28 · 36 · 44 · 56 · 60).", "All three, now", "Type could wait; space and heights cannot — they are why every component carries literals."],
  ["D3 · Merges", "Intro → SectionHeader · RoadmapItem → BlockCard · ThemeSwitch → Segmented · Dots out of Carousel · Quote onto Card · ContrastReport into the package.", "All six", "Each removes one place a value can drift. None changes what a visitor sees."],
  ["D4 · Prefix the unprefixed", "<code>.glass*</code> and the four motion classes become <code>.noo-*</code>; old names alias for one release.", "Yes", "Cheap, and the only way the package is safe on a host with a <code>.lift</code> of its own."],
  ["D5 · Blocks are apps", "Rename block accents to the apps that exist — <code>portfolio · design · admin</code> — and settle the admin’s hue (Admin.md says lavender; the code says yellow).", "Rename; admin = lavender, design = grey-as-glass or blue", "A block name that no app wears is a promise, not a token. Your call on the two hues."],
  ["D6 · The admin layout", "Option A patch Page · <strong>B build a Tool template</strong> · C canvas-first (already rejected).", "B", "See the Templates board. Table, Tabs and Segmented come first either way."],
  ["D7 · Contrast fixes", "<code>--muted</code> → L 0.52 · <code>pink-ink</code> → L 0.42 · <code>blue-ink</code> → L 0.40.", "Yes", "Three numbers; the showcase’s own report flags them today."],
  ["D8 · Icons (your note)", "An <code>Icon</code> atom; pick a weight (A–E) and a source (1–5) on the Icons board.", "Weight B, regular 1.5; source 2, Phosphor, as an optional peer; duotone only on the current item", "One weight everywhere is the rule; Phosphor is the one free set that carries both weights we would use."],
  ["D9 · Menu (your note)", "A <code>Menu</code> organism replaces the Rail, the canvas’s built-in menu and the NavBar sheet; placeable on a canvas; items edited in the inspector.", "Yes; current marker = ink pill (your reference), replacing the Rail’s 2px edge bar", "Three hand-built menus become one. The marker change is the one visible rule it rewrites."],
];

const decisions = () => `<table class="rv-table"><tr><th>decision</th><th>what it is</th><th>my recommendation</th><th>why</th></tr>${DECISIONS.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;

const TREE = `packages/ui/src/
├─ tokens/        tokens.css · tailwind.css · tokens.ts · theme.ts        ← layer 1: values, the hue slot, both themes
├─ atoms/         *.tsx + atoms.css                                       ← layer 2
├─ molecules/     *.tsx + molecules.css                                   ← layer 3
├─ organisms/     *.tsx + organisms.css                                   ← layer 4
├─ templates/     Page · Tool · Document · canvas/ (CanvasShell + nodes)  ← layer 5, canvas keeps its own entry
├─ registry/      entries with a layer · Catalogue (by layer) · ContrastReport
├─ icons/         Icon + the curated glyph list (@no-origins/ui/icons, Phosphor as an optional peer)
└─ css/index.css  @import tokens; typography · glass · motion; atoms|molecules|organisms|templates layer(components)

apps/*            layer 6 — compose; never style. data-block names the app.`;

const problems = () => `<table class="rv-table"><tr><th>you said</th><th>what the review found</th><th>where</th></tr>
<tr><td>Inconsistent implementation</td><td>The values are decided and mostly right; the <em>wiring</em> is not. Twelve hue ladders, nine font sizes on no step of the scale and nine more typed as literals, ten control heights, no space tokens at all, two ground classes, two focus rules. Every component is styled by hand against a spec instead of reading it.</td><td>Tokens · Atoms</td></tr>
<tr><td>Generic Claude UI</td><td>Where the system is used as designed — the canvas, the widgets, ProfileCard — it is not generic. Where an app composes its own screens with cards, muted paragraphs, chips and utility spacing — the admin, the showcase overview — it is. The generic look is what happens when a layer is missing and the app fills it.</td><td>Templates</td></tr>
<tr><td>Doesn’t feel like the discussions</td><td>Two decisions never reached the code: the admin’s hue, and “glass only over something worth seeing through” (the catalogue’s demo wells are solid). Two components the discussions retired are still exported. The rest of the discussion is in the code — it is the composition that lost it.</td><td>Organisms · Templates</td></tr>
<tr><td>Bad layouts, e.g. the admin</td><td>A tool poured into a reading template. Rail is right; everything to its right is a landing page with stat cards. It needs a template the package does not have, and the four components that template is made of.</td><td>Templates</td></tr></table>`;

export const title = "The system, organised";
export const block = "portfolio";
export function body(tallies) {
  const layers = Object.keys(tallies);
  const tally = `<table class="rv-table"><tr><th>board</th>${VERDICTS.map((v) => `<th>${v}</th>`).join("")}<th>items</th></tr>${layers.map((l) => `<tr><td>${l}</td>${VERDICTS.map((v) => `<td>${tallies[l][v] || "·"}</td>`).join("")}<td>${Object.values(tallies[l]).reduce((a,b) => a+b, 0)}</td></tr>`).join("")}<tr><td><strong>all</strong></td>${VERDICTS.map((v) => `<td><strong>${layers.reduce((a,l) => a + (tallies[l][v]||0), 0)}</strong></td>`).join("")}<td><strong>${layers.reduce((a,l) => a + Object.values(tallies[l]).reduce((x,y) => x+y, 0), 0)}</strong></td></tr></table>`;
  return `
${head({ eyebrow: "no origins · design system · @no-origins/ui 0.1.0 · reviewed 2026-09-13 · built 2026-09-14", title: "Six layers, one cascade", lead: "This board is the record of a release. On the 13th the package was reviewed against Atomic Design — every token and component, 62 verdicts, nine decisions. On the 14th all nine were decided as recommended and the six build steps in Atomic.md §6 were carried through: tokens, atoms, molecules, organisms, templates, release. The five boards beside this one hold the items with their verdicts and, on each, what became of them; the two past them hold the icon and menu decisions. The tweaks above every board switch theme and block hue — nothing on any board is restyled by them, which is the whole argument." })}
${group("What you said, and what the review found")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight">${problems()}</div></section>
${group("The organisation", "Six layers. A layer reads only the layers to its left. The names marked ✚ did not exist on the 13th; every one of them exists now, in the package, registered.")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight">${layerCards()}</div></section>
${group("The cascade — what “connected” means here")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo">${cascade()}</div></section>
${group("Five wiring rules", "The ones that make a token change reach every component, and a check for each. Rule 1 is checked by stylelint on the package since 0.1.0; rule 4 by the catalogue rendering the registry by layer; rule 5 by the admin, which composes with zero utility classes.")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight">${rules()}</div></section>
${group("The verdicts, counted — and what became of them", "Every Fix was fixed, every Merge merged, the Retire retired, and every Missing built, across steps 1–5. The counts are kept as the review left them; the per-item notes on each board say what was done.")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight">${tally}<p class="rv-cap" style="margin-top:12px">Keep = ship as is · Fix = same component, reads tokens it should · Merge = fold into a neighbour · Retire = remove the export · Missing = build, in the package</p></div></section>
${group("The nine decisions — decided", "Seven from the review, two from your notes on the canvas. All nine were taken as recommended on 2026-09-14 and are rules in Atomic.md §4. The table is kept as it was put to you.")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight">${decisions()}</div></section>
${group("What the release looks like on disk", "As built. The canvas keeps its own entry at @no-origins/ui/canvas and the icons theirs at @no-origins/ui/icons.")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight"><pre style="margin:0;font:400 13px/1.65 var(--ff-mono);color:var(--ink-2);background:var(--ground-2);padding:20px 24px;border-radius:var(--r-md);overflow:auto">${TREE}</pre></div></section>
`;
}
