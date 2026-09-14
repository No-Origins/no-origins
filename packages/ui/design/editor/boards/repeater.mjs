import { head, group, option, insp, chip, decided } from "../lib.mjs";

const CSS = `
.rp { display: flex; flex-direction: column; gap: 2px; }
.rp-row { display: flex; align-items: center; gap: 8px; padding: 6px 4px 6px 0; border-bottom: 1px solid var(--rule); }
.rp-grip { width: 16px; height: 24px; flex: none; color: var(--muted); display: grid; place-items: center; cursor: grab; font: 500 14px/1 var(--ff-mono); letter-spacing: -2px; }
.rp-row .noo-field { flex: 1; }
.rp-row .noo-field--select { flex: none; width: 108px; }
.rp-row .noo-field__box { min-height: var(--ctl-sm); padding: 0 10px; }
.rp-row .noo-field__input { font-size: var(--t-ui-sm); padding: 6px 0; }
.rp-x { width: 28px; height: 28px; flex: none; border: 0; border-radius: var(--r-pill); background: none; color: var(--muted); cursor: pointer; font: 400 16px/1 var(--ff-sans); }
.rp-add { align-self: flex-start; margin-top: 4px; }
.rp-drop { height: 2px; background: var(--accent-deep); border-radius: 1px; margin: 2px 0 2px 24px; }
.rp-cards { display: flex; flex-direction: column; gap: 8px; }
.rp-card { padding: 10px 12px; border-radius: var(--r-md); background: var(--surface); box-shadow: var(--e1); display: flex; flex-direction: column; gap: 8px; }
.rp-card__head { display: flex; align-items: center; justify-content: space-between; font: 500 var(--t-ui-sm)/1 var(--ff-sans); color: var(--ink); }
.rp-table { width: 100%; border-collapse: collapse; font: 400 var(--t-caption)/1.3 var(--ff-sans); }
.rp-table th { text-align: left; font: 500 10px/1 var(--ff-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); padding: 4px 6px; border-bottom: 1px solid var(--rule); }
.rp-table td { padding: 6px; border-bottom: 1px solid var(--rule); color: var(--ink); }
.rp-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.rp-chip-x { margin-left: 4px; opacity: 0.6; }
`;
const CHIPS = [["editors", "lavender"], ["design systems", "peach"], ["tiptap", "grey"]];
const fieldBox = (v, w) => `<div class="noo-field"${w ? ` style="flex:none;width:${w}"` : ""}><div class="noo-glass noo-glass--1 noo-field__box"><input class="noo-field__input" value="${v}"></div></div>`;
const hueSel = (h) => `<div class="noo-field noo-field--select"><div class="noo-glass noo-glass--1 noo-field__box"><span class="noo-field__adorn"><span class="noo-dot" data-hue="${h}"></span></span><select class="noo-field__input noo-field__select"><option>${h}</option></select></div></div>`;
const ghost = (t) => `<button type="button" class="noo-btn noo-btn--ghost noo-btn--sm rp-add"><span class="noo-btn__text">${t}</span></button>`;

const rows = () => `<div class="rp" role="list">${CHIPS.map(([l, h], i) => `${i === 1 ? '<div class="rp-drop" aria-hidden="true"></div>' : ""}<div class="rp-row" role="listitem"><span class="rp-grip" aria-hidden="true">⋮⋮</span>${fieldBox(l)}${hueSel(h)}<button type="button" class="rp-x" aria-label="Remove ${l}">×</button></div>`).join("")}</div>${ghost("+ Add a chip")}<p class="rv-cap" style="margin-top:6px">3 of 5 · drag the grip, or Alt + ↑ / ↓ on a focused row</p>`;
const textarea = () => `<div class="noo-field noo-field--multiline"><div class="noo-glass noo-glass--1 noo-field__box"><textarea class="noo-field__input" rows="4">Owned Neptune: foundational blocks and an OpenAI integration.
Core team member building Hashnode’s design system.</textarea></div><p class="noo-field__hint">One per line · 2 of 6</p></div>`;
const chips = () => `<div class="rp-chips">${CHIPS.map(([l, h]) => chip(`${l}<span class="rp-chip-x" aria-hidden="true">×</span>`, h, { interactive: true })).join("")}${chip("+ add", "grey", { interactive: true, dot: false })}</div>`;
const cards = () => `<div class="rp-cards">${CHIPS.map(([l, h]) => `<div class="rp-card"><div class="rp-card__head"><span>${l}</span><span style="color:var(--muted)">⌄</span></div>${fieldBox(l)}${hueSel(h)}</div>`).join("")}</div>${ghost("+ Add a chip")}`;
const table = () => `<table class="rp-table"><thead><tr><th>label</th><th>hue</th><th></th></tr></thead><tbody>${CHIPS.map(([l, h]) => `<tr><td contenteditable="true">${l}</td><td><span class="noo-dot" data-hue="${h}"></span> ${h}</td><td><button type="button" class="rp-x" aria-label="Remove">×</button></td></tr>`).join("")}</tbody></table>${ghost("+ Add a row")}`;

export const title = "Repeater";
export const block = "design";
export const body = `<style>${CSS}</style>
${head({ eyebrow: "the editor · inspector controls · 3 of 3 · pick one by its letter", title: "Repeater", lead: "The control a <code>list</code> prop renders (§3.1: “reorderable rows of <code>of</code>, capped at <code>max</code>”). Two shapes of list exist in the registry: lists of text — BlockCard’s <code>details</code>, Menu’s items — and lists of objects — BlockCard’s <code>chips</code> <code>{ label, hue }</code>, Select’s options, RadioGroup’s options. The sample is BlockCard’s chips, three of a maximum five." })}
${decided({ pick: "A, with C as the compact form", built: "Shipped as <code>Repeater</code> with <code>density=\"rows\"</code> (hairlines, grip, ×, ghost Add, the count) and <code>density=\"chips\"</code> (a Chip per item, the chosen chip's fields below). Alt + ↑/↓ and drag; the drop is the one accent line the Tree shares." })}
${group("Five directions", "Inside the inspector at its real width.")}
${option({ id: "A", name: "Rows on hairlines, a grip, an add button", rec: true,
  desc: "One row per item; the item’s fields inline, from the same schema the inspector already renders (a text → Field, a hue → the swatch or a Select); a grip to drag, × to remove, a ghost “Add” under the last row, the count against `max` in a caption. Drop position is a 2px accent line.",
  fits: "list of text · list of object · Alt + ↑/↓ reorders from the keyboard",
  why: "It is the only shape that keeps every item’s fields visible and editable at once, and it reuses the controls the rest of the inspector is made of — no new form vocabulary. Rows of text-only lists collapse to one Field each, so the same component serves both list shapes. Drag and keyboard are the same rule the Outline gets (§6.5).",
  demo: insp([["Chips", "list · max 5", rows()]]) })}
${option({ id: "B", name: "One per line",
  desc: "A multiline Field; each line is an item. Reorder by cutting and pasting.",
  fits: "list of text only",
  why: "The cheapest thing that works, and honest for `details`. It cannot hold an object, cannot show a hue, and reordering is text editing. Fine as the fallback a schema opts into for plain lists; not the answer to the type.",
  demo: insp([["Details", "list · max 6", textarea()]]) })}
${option({ id: "C", name: "Chips in a row",
  desc: "Each item is a Chip with a remove mark; a grey “+ add” chip opens a field. Drag chips to reorder.",
  fits: "list of text ≤ 24 · list of { label, hue } when the chip shows the hue",
  why: "The list looks like what it produces — for chips, that is a real advantage. But it hides every field but the label, and a `details` list of 120-character sentences does not fit in chips. A good second density for A, not a replacement.",
  demo: insp([["Chips", "list · max 5", chips()]]) })}
${option({ id: "D", name: "A card per item, collapsible",
  desc: "Each item is a small surface card with its fields stacked; cards collapse to their label.",
  fits: "list of object with three or more fields",
  why: "The usual form-array pattern. Three items become three cards become a scroll; the stacked fields spend height A’s inline row does not. Right only when an item has more fields than a row can hold — none in the registry does today.",
  demo: insp([["Chips", "list · max 5", cards()]]) })}
${option({ id: "E", name: "A table with editable cells",
  desc: "The Table organism with one column per field, cells edited in place, an “Add a row” under it.",
  fits: "list of object · many items",
  why: "Dense and familiar from spreadsheets, but 280px holds two columns before it scrolls, editing a hue in a cell needs a popover, and dragging table rows is the worst-supported reorder there is. This is the Versions screen’s shape, not the inspector’s.",
  demo: insp([["Chips", "list · max 5", table()]]) })}
`;
