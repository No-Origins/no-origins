import { head, group, item, chip, ico, GLYPHS, ICON_STYLES } from "../lib.mjs";

const NAMES = Object.keys(GLYPHS);
const row = (style) => `<div class="rv-row" style="gap:18px;flex-wrap:nowrap">${NAMES.map((n) => ico(n, style, 24)).join("")}</div>`;

const STYLE_OPTIONS = [
  ["A · Light 1.25", "light", "The reference’s weight. Airy; reads well at 24, thins out at 16 on a warm ground.", "Elegant beside Hanken 400; too faint for a 16px chip icon."],
  ["B · Regular 1.5 (recommended)", "regular", "One stroke weight for everything, 16 to 24. Matches Hanken 500/600 and the 1.5px hairlines the system already draws (dotted rules, threads).", "The safe middle; the one the blob’s rim (0.8 at 96 → ≈1.5 at 20) already agrees with."],
  ["C · Bold 2", "bold", "Lucide’s weight. Legible at 16, heavy at 24 next to Hanken.", "Reads as the shadcn default — the look you asked to leave behind."],
  ["D · Duotone", "duotone", "Regular stroke with the body filled in the hue at 38%. The tint tier doing what it does for glass.", "Only where a hue means something: the current item, a chip’s leading glyph. Everywhere would be noise."],
  ["E · Solid", "solid", "Filled shapes. Reads at 12, loses the drawn quality at 24.", "Favicon-scale only, if ever."],
];

const SOURCES = [
  ["1 · Draw our own", "On this 24-grid, round caps, one weight, the blob’s corner radius. Nothing to license; grows as needed.", "≈60 to start; every new screen may need one drawn. Slow, and slowness is the reason icons are missing today.", "—"],
  ["2 · Phosphor (recommended)", "MIT · 1 200+ glyphs · six weights including duotone, so B and D above come from one set. Rounded, 1.5 at regular. `@phosphor-icons/react` as an optional peer, like `@xyflow/react`.", "A dependency in the package — rule 1 (React and our CSS only) gains one named exception, the same shape as React Flow.", "B + D"],
  ["3 · Lucide", "ISC · 1 500+ · the shadcn default. 2px stroke.", "Its ubiquity is the generic look; rule 1 exception either way.", "C"],
  ["4 · Hugeicons", "The reference image. 4 000+ free stroke-rounded; other styles paid.", "A licence to track for the styles worth having; the free set alone is A.", "A"],
  ["5 · Iconoir", "MIT · 1 500+ · 1.5 stroke, rounded. Closest free single-weight set to B.", "One weight only — no duotone for the current state.", "B"],
];

export const title = "Icons";
export const block = "portfolio";
export const body = `
${head({ eyebrow: "release review · addition · from your note", title: "Icons", lead: "“We are still missing icons.” Yes — the package draws two arrows and a magnifier inline and has no icon layer at all, which is why the admin and the menu have nothing to reach for. Below: the atom, five weights drawn on the same eight glyphs so the choice is visible, and five places the set could come from." })}

${group("The Icon atom", "One component, three sizes, one stroke, currentColor. It reads three tokens the system does not have yet.")}
${item({ name: "Icon", layer: "atom · missing", desc: "<code>&lt;Icon name size /&gt;</code>. Sizes <code>sm</code> 16 · <code>md</code> 20 · <code>lg</code> 24, drawn on a 24 grid; stroke from one token; colour from <code>currentColor</code> so an icon in a muted label is muted and one in the accent is accented. Decorative by default (<code>aria-hidden</code>); a <code>label</code> makes it an image.", reads: "--icon-sm/md/lg ✚ · --icon-stroke ✚ · currentColor · --hue (duotone)", verdict: "Missing",
  note: "Tokens: <code>--icon-sm 16 · --icon-md 20 · --icon-lg 24 · --icon-stroke 1.5</code>. Rule: one weight everywhere; duotone only on a current or loud item. Button, Chip, Field, Menu and Rail take an Icon in their existing slots — none of them changes shape.",
  demo: `<div class="rv-col" style="gap:20px"><div class="rv-row" style="gap:28px;align-items:flex-end">${[16,20,24].map((s) => `<div class="rv-col" style="align-items:center;gap:8px">${ico("folder","regular",s)}<span class="rv-cap">${s}</span></div>`).join("")}<div class="rv-col" style="align-items:center;gap:8px"><span style="color:var(--muted)">${ico("folder","regular",24)}</span><span class="rv-cap">muted</span></div><div class="rv-col" style="align-items:center;gap:8px"><span style="color:var(--accent-deep)">${ico("folder","regular",24)}</span><span class="rv-cap">accent-deep</span></div><div class="rv-col" style="align-items:center;gap:8px"><span style="color:var(--accent-deep)">${ico("folder","duotone",24)}</span><span class="rv-cap">duotone · current</span></div></div>
  <div class="rv-row" style="gap:12px"><button type="button" class="noo-btn noo-btn--secondary glass glass-1"><span class="noo-btn__icon">${ico("plus","regular",20)}</span><span class="noo-btn__text">New document</span></button>${chip("archive","lavender",{dot:false}).replace('">archive','">'+ico("archive","regular",14)+' archive')}<div class="glass glass-1 noo-field__box" style="width:220px"><span class="noo-field__adorn">${ico("search","regular",18)}</span><input class="noo-field__input" placeholder="Search the blocks"></div></div></div>` })}

${group("Five weights, one set of glyphs", "Pick one; it becomes --icon-stroke. Every row is the same eight paths.")}
${STYLE_OPTIONS.map(([n, s, why, cost]) => item({ name: n, layer: `stroke ${ICON_STYLES[s].w}${ICON_STYLES[s].fill !== "none" ? " · " + ICON_STYLES[s].fill : ""}`, desc: why, verdict: s === "regular" ? "Keep" : s === "duotone" ? "Fix" : "Retire", note: cost,
  demo: `<div class="rv-col" style="gap:16px">${row(s)}<div style="color:var(--muted)">${row(s)}</div><div class="rv-row" style="gap:18px;flex-wrap:nowrap">${NAMES.map((n) => ico(n, s, 16)).join("")}<span class="rv-cap" style="margin-left:8px">at 16</span></div></div>` })).join("")}

${group("Where the set comes from")}
${item({ name: "Five sources", layer: "decision D8", desc: "The style decides the weight; this decides who draws the other 1 100 glyphs. The recommendation is 2, with B as the weight and D reserved for the current state.", verdict: "Missing", note: "Whichever is picked, the package exposes only <code>Icon</code>. No app imports an icon library directly — that is how a set gets swapped once without touching a screen.", wide: true, tight: true,
  demo: `<table class="rv-table"><tr><th>source</th><th>what it is</th><th>cost</th><th>gives</th></tr>${SOURCES.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>` })}
`;
