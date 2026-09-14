import { head, group, option, insp, chip, blob, HUES, decided } from "../lib.mjs";

const CSS = `
.hs-dots { display: flex; align-items: center; gap: 10px; }
.hs-dot { width: 20px; height: 20px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; background: var(--hue-deep); box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--ink) 12%, transparent); }
.hs-dot--on { box-shadow: 0 0 0 2px var(--ground), 0 0 0 4px var(--ink); }
.hs-dot--accent { background: var(--glass-bg, color-mix(in oklch, var(--surface) 70%, transparent)); box-shadow: inset 0 0 0 1.5px var(--ink); }
.hs-name { font: 500 var(--t-ui-sm)/1 var(--ff-sans); color: var(--ink); margin-left: 6px; }
.hs-blobs { display: flex; align-items: center; gap: 4px; }
.hs-cells { display: flex; padding: 3px; gap: 2px; border-radius: var(--r-pill); }
.hs-cell { flex: 1; height: 28px; border-radius: var(--r-pill); background: var(--hue); border: 0; cursor: pointer; font: 500 var(--t-ui-sm)/1 var(--ff-sans); color: var(--hue-ink); }
.hs-cell--on { flex: 2.6; box-shadow: inset 0 0 0 2px var(--hue-deep); }
.hs-cell:not(.hs-cell--on) { color: transparent; }
.hs-chips { display: flex; flex-wrap: wrap; gap: 8px; }
`;

const dots = (on = "peach", accent = true) => `<div class="hs-dots" role="radiogroup" aria-label="Hue">${HUES.map((h) => `<button type="button" role="radio" aria-checked="${h === on}" aria-label="${h}" class="hs-dot${h === on ? " hs-dot--on" : ""}" data-hue="${h}"></button>`).join("")}${accent ? `<button type="button" role="radio" aria-checked="false" aria-label="the block's accent" class="hs-dot hs-dot--accent"></button>` : ""}<span class="hs-name">${on}</span></div>`;
const blobs = (on = "peach") => `<div class="hs-blobs" role="radiogroup" aria-label="Hue">${HUES.map((h) => blob({ size: "nav", hue: h, sleep: h !== on })).join("")}</div>`;
const chips = (on = "peach") => `<div class="hs-chips" role="radiogroup" aria-label="Hue">${HUES.map((h) => chip(h, h, { interactive: true, pressed: h === on })).join("")}${chip("accent", "accent", { interactive: true, dot: false })}</div>`;
const cells = (on = "peach") => `<div class="noo-glass noo-glass--1 hs-cells" role="radiogroup" aria-label="Hue">${HUES.map((h) => `<button type="button" role="radio" aria-checked="${h === on}" class="hs-cell${h === on ? " hs-cell--on" : ""}" data-hue="${h}">${h}</button>`).join("")}</div>`;
const select = (on = "peach") => `<div class="noo-field noo-field--select"><div class="noo-glass noo-glass--1 noo-field__box"><span class="noo-field__adorn"><span class="noo-dot" data-hue="${on}"></span></span><select class="noo-field__input noo-field__select">${HUES.map((h) => `<option${h === on ? " selected" : ""}>${h}</option>`).join("")}<option>accent (the block's)</option></select><span class="noo-field__adorn"><svg class="noo-field__chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" style="fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"/></svg></span></div></div>`;

export const title = "Hue swatch";
export const block = "design";
export const body = `<style>${CSS}</style>
${head({ eyebrow: "the editor · inspector controls · 1 of 3 · pick one by its letter", title: "Hue swatch", lead: "The control a <code>hue</code> prop renders (Scene-Schema.md §3.1). Seven hues from tokens.ts, plus the block's accent where the component allows it — never a free colour, because R3 put colour in code. It lives in a 320px inspector column, so width is the constraint: 280px of it after padding." })}
${decided({ pick: "A — seven dots, a ring on the chosen one", built: "Shipped as <code>HueSwatch</code> in @no-origins/ui 0.2.0: the Dot at 20px, an ink ring on the chosen one, the name beside, the accent as an eighth glass dot. On <code>/fixtures/inspector</code> and in the catalogue." })}
${group("Five directions", "Each is drawn inside the inspector at its real width. The selected hue is peach in every one so they compare.")}
${option({ id: "A", name: "Seven dots, a ring on the chosen one", rec: true,
  desc: "The Dot atom at 20px in each hue's deep tier, in one row; the chosen one wears a 2px ink ring with a gap; the name reads beside the row. The block's accent is an eighth, glass dot with an ink hairline.",
  fits: "hue · hue | accent · 44px tall · 280 wide with room to spare",
  why: "It is the Dot the whole system already uses for a hue — on chips, in the rail, on cellheads — so the inspector speaks the same word. One row, one line of height, keyboard as a radiogroup. The name beside the row is what makes seven unlabelled circles honest.",
  demo: insp([["Hue", "hue", dots("peach")], ["Hue", "hue | accent", dots("blue", true)]]) })}
${option({ id: "B", name: "Seven blobs, the chosen one awake",
  desc: "The seven-blob swatch §6.1 named: a nav-size blob per hue, the chosen one awake and the others asleep.",
  fits: "hue · 36px tall · 276 wide, no room for accent",
  why: "The brand’s own picture, and it is charming. But Brand.md §9 makes the blob the mark for an <em>agent</em>, and a row of seven sleeping faces in a form is seven agents that are not there. It also has no room for the accent option. Kept here because §6.1 asked for it; not recommended for that reason.",
  demo: insp([["Hue", "hue", blobs("peach")]]) })}
${option({ id: "C", name: "Chips with names",
  desc: "A Chip per hue, the chosen one pressed, wrapping to two rows; accent as a chip without a dot.",
  fits: "hue · hue | accent · ~72px tall",
  why: "Every option is named, which is the most readable of the five — and the tallest. Two rows for one prop is a lot of inspector for a colour, and the pressed chip goes ink-on-ground, which hides the very colour being chosen.",
  demo: insp([["Hue", "hue | accent", chips("peach")]]) })}
${option({ id: "D", name: "A pill of cells",
  desc: "A Segmented-shaped glass pill; each cell is the hue’s fill; the chosen cell widens and shows its name in the hue’s ink tier.",
  fits: "hue · 34px tall · 280 wide",
  why: "Compact and colourful, but the unchosen cells are colour with no name, the widening animates layout, and it invents a control shape that is neither Segmented nor Dot. New shapes need a reason.",
  demo: insp([["Hue", "hue", cells("peach")]]) })}
${option({ id: "E", name: "A Select with a dot",
  desc: "The Select molecule with the chosen hue’s Dot as its leading adornment.",
  fits: "hue · hue | accent · 44px tall",
  why: "The smallest, and the only one that hides the palette until opened — you cannot compare seven colours in a dropdown. Right for a long list; wrong for seven.",
  demo: insp([["Hue", "hue | accent", select("peach")]]) })}
`;
