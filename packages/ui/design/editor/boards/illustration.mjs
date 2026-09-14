import { head, group, option, insp, illo, chip } from "../lib.mjs";

const NAMES = [["status", "a wide sweep — curl alone"], ["work", "taper: the family opens one way"], ["cases", "pinch: bows in the middle"], ["projects", "quick tempo, low drift"], ["interests", "slow swell, high spread"], ["philosophy", "steady, near-parallel"]];
const CSS = `
.ip-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.ip-thumb { display: flex; flex-direction: column; gap: 6px; padding: 0; border: 0; background: none; cursor: pointer; text-align: left; }
.ip-thumb__pic { aspect-ratio: 1; border-radius: var(--r-md); background: var(--hue); overflow: hidden; position: relative; box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--ink) 8%, transparent); }
.ip-thumb__pic .noo-ill { position: absolute; inset: 0; width: 100%; height: 100%; }
.ip-thumb--on .ip-thumb__pic { box-shadow: 0 0 0 2px var(--ground), 0 0 0 4px var(--ink); }
.ip-thumb__name { font: 500 var(--t-label)/1 var(--ff-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2); }
.ip-strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
.ip-strip .ip-thumb { flex: none; width: 88px; }
.ip-preview { aspect-ratio: 4 / 3; border-radius: var(--r-lg); background: var(--hue); position: relative; overflow: hidden; }
.ip-preview .noo-ill { position: absolute; inset: 0; width: 100%; height: 100%; }
.ip-list { display: flex; flex-direction: column; gap: 4px; }
.ip-row { display: flex; align-items: center; gap: 12px; padding: 6px 8px; border-radius: var(--r-md); cursor: pointer; }
.ip-row--on { background: color-mix(in oklch, var(--ink) 6%, transparent); }
.ip-row__pic { width: 44px; height: 44px; flex: none; border-radius: var(--r-sm); background: var(--hue); position: relative; overflow: hidden; }
.ip-row__pic .noo-ill { position: absolute; inset: 0; width: 100%; height: 100%; }
.ip-row__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ip-row__name { font: 500 var(--t-ui-sm)/1.2 var(--ff-sans); color: var(--ink); }
.ip-row__line { font: 400 var(--t-caption)/1.3 var(--ff-sans); color: var(--muted); }
`;
const pic = (cls = "") => illo(cls).replace('style="color:inherit"', 'style="color:var(--hue-deep)"');
const thumb = (name, on) => `<button type="button" class="ip-thumb${on ? " ip-thumb--on" : ""}" aria-pressed="${on}"><span class="ip-thumb__pic" data-hue="peach">${pic()}</span><span class="ip-thumb__name">${name}</span></button>`;

const grid = (on = "work") => `<div class="ip-grid" role="radiogroup" aria-label="Illustration">${NAMES.map(([n]) => thumb(n, n === on)).join("")}</div>`;
const select = (on = "work") => `<div class="noo-field noo-field--select"><div class="noo-glass noo-glass--1 noo-field__box"><select class="noo-field__input noo-field__select">${NAMES.map(([n]) => `<option${n === on ? " selected" : ""}>${n}</option>`).join("")}</select><span class="noo-field__adorn"><svg class="noo-field__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" style="fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"/></svg></span></div></div>`;
const strip = (on = "work") => `<div class="ip-strip" role="radiogroup" aria-label="Illustration">${NAMES.map(([n]) => thumb(n, n === on)).join("")}</div>`;
const segPreview = (on = "work") => `<div class="ip-preview" data-hue="peach">${pic()}</div><div class="noo-glass noo-glass--1 noo-segmented" role="group" aria-label="Illustration" style="flex-wrap:wrap">${NAMES.map(([n]) => `<button type="button" class="noo-segmented__btn" aria-pressed="${n === on}">${n}</button>`).join("")}</div>`;
const list = (on = "work") => `<div class="ip-list" role="radiogroup" aria-label="Illustration">${NAMES.map(([n, l]) => `<div class="ip-row${n === on ? " ip-row--on" : ""}" role="radio" aria-checked="${n === on}"><span class="ip-row__pic" data-hue="peach">${pic()}</span><span class="ip-row__text"><span class="ip-row__name">${n}</span><span class="ip-row__line">${l}</span></span></div>`).join("")}</div>`;

export const title = "Illustration picker";
export const block = "design";
export const body = `<style>${CSS}</style>
${head({ eyebrow: "the editor · inspector controls · 2 of 3 · pick one by its letter", title: "Illustration picker", lead: "The control an <code>illustration</code> prop renders: one of the six measured families from fields.ts, drawn (§3.6 — the parameters are measured, never typed). The thumbnails here are a stand-in field; the real control draws each family with the generator, in the node's own hue." })}
${group("Five directions", "Inside the inspector at its real width; the node's hue is peach, the chosen family is work.")}
${option({ id: "A", name: "A grid of drawn thumbnails, named", rec: true,
  desc: "Six families in a 3 × 2 grid, each drawn in the node’s hue at 84px with its name under; the chosen one wears the ink ring. Picking one redraws the node on the canvas at once.",
  fits: "illustration · ~240px tall · grows by a row per three families",
  why: "A picture is chosen by looking, so the picture has to be there. Six fit in two rows; the names carry the meaning a thumbnail cannot (which section each family was measured for). The same ring as the hue swatch, so “chosen” looks the same everywhere in the inspector.",
  demo: insp([["Illustration", "illustration", grid("work")]]) })}
${option({ id: "B", name: "A Select of names",
  desc: "The Select molecule listing the six names.",
  fits: "illustration · 44px tall",
  why: "Smallest, and blind: you choose a drawing without seeing it, then look at the canvas, then choose again. The canvas is the preview in every option; this one makes it the only preview.",
  demo: insp([["Illustration", "illustration", select("work")]]) })}
${option({ id: "C", name: "A scrolling strip",
  desc: "The same thumbnails in one row that scrolls sideways.",
  fits: "illustration · ~112px tall · any number of families",
  why: "Shorter than the grid and it scales past six, but three of the six are off screen at any moment, and a row you have to scroll to compare is not a comparison. Worth returning to if the library passes nine.",
  demo: insp([["Illustration", "illustration", strip("work")]]) })}
${option({ id: "D", name: "One large preview and a pill of names",
  desc: "A 4:3 preview of the chosen family above a Segmented of the six names.",
  fits: "illustration · ~290px tall",
  why: "Beautiful, and redundant: the preview shows what the canvas node already shows, larger, and the Segmented wraps to two rows at six names. It spends the most height to add the least.",
  demo: insp([["Illustration", "illustration", segPreview("work")]]) })}
${option({ id: "E", name: "A list with a line each",
  desc: "Six rows: a 44px thumbnail, the name, and one line saying what the family does (“taper: opens one way”).",
  fits: "illustration · ~330px tall",
  why: "The most explanatory — each family’s one line is the fields.ts comment, surfaced. Also the tallest, and the line repeats what a reader learns after picking twice. The lines belong in a tooltip on A rather than a row here.",
  demo: insp([["Illustration", "illustration", list("work")]]) })}
`;
