// The reading edition: the same boards as the canvas, as one static page for a phone. No editor, no iframes —
// the package CSS once, every board a section. `node build-reader.mjs` → no-origins-design-system-reader.html
import fs from "node:fs";
import { PKG_CSS, RV_CSS, FONTS, VERDICTS } from "./lib.mjs";
import * as tokens from "./boards/tokens.mjs";
import * as atoms from "./boards/atoms.mjs";
import * as molecules from "./boards/molecules.mjs";
import * as organisms from "./boards/organisms.mjs";
import * as templates from "./boards/templates.mjs";
import * as main from "./boards/main.mjs";
import * as icons from "./boards/icons.mjs";
import * as menu from "./boards/menu.mjs";

const layers = { Tokens: tokens, Atoms: atoms, Molecules: molecules, Organisms: organisms, Templates: templates };
const tallies = {};
for (const [name, b] of Object.entries(layers)) {
  const t = Object.fromEntries(VERDICTS.map((v) => [v, 0]));
  for (const m of b.body.matchAll(/rv-verdict"><span class="noo-chip"[^>]*><span class="noo-chip__dot"[^>]*><\/span>(\w+)<\/span>/g)) t[m[1]]++;
  tallies[name] = t;
}

const SECTIONS = [
  ["read-first", "Read first", "accent", main.body(tallies)],
  ["tokens", "1 · Tokens", "green", tokens.body],
  ["atoms", "2 · Atoms", "peach", atoms.body],
  ["molecules", "3 · Molecules", "lavender", molecules.body],
  ["organisms", "4 · Organisms", "yellow", organisms.body],
  ["templates", "5 · Templates", "blue", templates.body],
  ["icons", "Icons", "grey", icons.body],
  ["menu", "Menu", "pink", menu.body],
];

const READER_CSS = `
/* ── the reading edition: the review chrome in one column, samples scrolling in their own wells ── */
html { -webkit-text-size-adjust: 100%; }
body { background: var(--ground); color: var(--ink); }
.rd { max-width: 1120px; margin: 0 auto; padding: var(--s-8) var(--s-4) var(--s-24); }
.rd-head { display: flex; flex-direction: column; gap: var(--s-3); padding-bottom: var(--s-8); border-bottom: 1px solid var(--rule); }
.rd-head .noo-label { color: var(--muted); }
.rd-head .noo-h1 { margin: 0; text-wrap: balance; }
.rd-head .noo-lead { margin: 0; color: var(--ink-2); max-width: 60ch; text-wrap: pretty; }
.rd-nav { display: flex; flex-wrap: wrap; gap: var(--s-2); padding: var(--s-5) 0; position: sticky; top: 0; z-index: 10;
  background: color-mix(in oklch, var(--ground) 92%, transparent); backdrop-filter: blur(10px); }
.rd-nav .noo-chip { flex: none; }
.rd-nav .noo-chip { text-decoration: none; }
.rd-section { padding-top: var(--s-12); }
.rd-section + .rd-section { margin-top: var(--s-12); border-top: 1px solid var(--rule); }
.rd-section:target { scroll-margin-top: 72px; }
.rv-board { width: auto; padding: 0; }
.rv-head { margin-bottom: var(--s-8); }
.rv-item { grid-template-columns: 320px minmax(0, 1fr); gap: var(--s-6) var(--s-10); padding: var(--s-8) 0; }
.rv-item--wide .rv-spec { grid-template-columns: 320px minmax(0, 1fr); gap: 0 var(--s-10); }
.rv-demo { overflow-x: auto; overscroll-behavior-x: contain; max-width: 100%; }
.rv-demo > * { flex: none; }
.rv-demo table, .rv-demo pre { max-width: none; }
.rv-demo--tight { padding: var(--s-1) 0; }
pre { overflow-x: auto; }
img, svg { max-width: 100%; }
@media (max-width: 899.98px) {
  .rd { padding: var(--s-6) var(--s-4) var(--s-16); }
  .rv-item, .rv-item--wide .rv-spec { grid-template-columns: minmax(0, 1fr); }
  .rv-item--wide .rv-spec .rv-verdict { grid-column: auto; }
  .rv-group { margin-top: var(--s-10); }
  .rv-demo { padding: var(--s-4); }
  .rv-table { font-size: var(--t-caption); }
  .rv-table th, .rv-table td { padding: 6px 8px; }
  .noo-h1 { font-size: 30px; }
  /* one scrolling row on a phone; three stuck rows would take a third of the screen */
  .rd-nav { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: var(--s-3) 0; margin: 0 calc(-1 * var(--s-4)); padding-inline: var(--s-4); }
  .rd-nav::-webkit-scrollbar { display: none; }
  .rd-section:target { scroll-margin-top: 56px; }
}
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
html { scroll-behavior: smooth; }
`;

const nav = SECTIONS.map(([id, label, hue]) => `<a class="noo-chip noo-chip--interactive" data-hue="${hue}" href="#${id}"><span class="noo-chip__dot" aria-hidden="true"></span>${label}</a>`).join("");
const sections = SECTIONS.map(([id, , , body]) => `<section class="rd-section rv-board" id="${id}">${body}</section>`).join("\n");

const html = `<title>No Origins Design System 0.1.0</title>
${FONTS}
<style>
${PKG_CSS}
${RV_CSS}
${READER_CSS}
</style>
<main class="noo-ground rd" data-block="design">
<header class="rd-head">
  <p class="noo-label">no origins · design system · @no-origins/ui 0.1.0 · 2026-09-14</p>
  <h1 class="noo-h1">The release, to read</h1>
  <p class="noo-lead">The same eight boards as the design canvas, stacked as one page for a phone. Every sample is rendered from the package's own stylesheet; the notes under each item say what was decided and what was built. Wide samples scroll sideways inside their well.</p>
</header>
<nav class="rd-nav" aria-label="Boards">${nav}</nav>
${sections}
</main>
`;
fs.writeFileSync("no-origins-design-system-reader.html", html);
console.log(`reader: ${(html.length / 1024).toFixed(0)} KB, ${SECTIONS.length} sections`);
