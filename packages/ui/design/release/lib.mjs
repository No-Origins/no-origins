// Shared helpers for the release-review boards. Every board embeds the REAL package CSS, so the samples are the
// system, not a drawing of it. The review chrome (`rv-*`) reads the same tokens.
import fs from "node:fs";
import path from "node:path";

export const ROOT = "/Users/hiddenstack/Creatives/no-origins";
// The preview's frame-safety scan rejects any "<noscript>" string, even inside a CSS comment — so it is spelled without brackets here.
const css = (f) => fs.readFileSync(path.join(ROOT, "packages/ui/src/css", f), "utf8").replace(/<noscript>/gi, "noscript");
export const PKG_CSS =
  css("tokens.css") +
  "\n@layer components {\n" +
  [css("typography.css"), css("glass.css"), css("motion.css"), css("atoms.css"), css("molecules.css"), css("organisms.css"), css("templates.css")].join("\n") +
  "\n}\n";

export const FONTS =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">';

export const RV_CSS = `
html, body { margin: 0; background: var(--ground); color: var(--ink); font-family: var(--ff-sans); -webkit-font-smoothing: antialiased; }
a { color: var(--accent-deep); } a:hover { color: var(--ink); }
.rv-board { box-sizing: border-box; width: 1440px; padding: 64px 48px 96px; display: flex; flex-direction: column; gap: 0; }
.rv-head { display: flex; flex-direction: column; gap: 14px; max-width: 900px; margin-bottom: 40px; }
.rv-head .noo-label { color: var(--muted); }
.rv-head .noo-lead { color: var(--ink-2); max-width: 62ch; }
.rv-legend { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
.rv-legend .noo-body-sm { color: var(--muted); margin: 0 8px 0 0; }
.rv-group { margin-top: 56px; display: flex; flex-direction: column; gap: 6px; }
.rv-group .noo-h2 { margin: 0; }
.rv-group .noo-body { margin: 0; color: var(--ink-2); max-width: 70ch; }
.rv-item { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 24px 48px; padding: 36px 0; border-top: 1px solid var(--rule); align-items: start; }
.rv-item--wide { grid-template-columns: minmax(0, 1fr); }
.rv-item--wide .rv-spec { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 0 48px; align-items: start; }
.rv-item--wide .rv-spec .rv-verdict { grid-column: 2; }
.rv-spec { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.rv-name { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.rv-name .noo-h4 { margin: 0; }
.rv-name .noo-label { color: var(--muted); }
.rv-desc { margin: 0; color: var(--ink-2); font: 400 14.5px/1.5 var(--ff-sans); text-wrap: pretty; }
.rv-reads { margin: 0; font: 400 12px/1.8 var(--ff-mono); color: var(--muted); }
.rv-reads b { font-weight: 400; color: var(--ink-2); }
.rv-verdict { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; padding-top: 12px; border-top: 1px dotted var(--rule); }
.rv-verdict .noo-body-sm { margin: 0; color: var(--ink-2); }
.rv-demo { min-width: 0; display: flex; flex-direction: column; gap: 20px; padding: 28px; border: 1px dashed color-mix(in oklch, var(--ink) 18%, transparent); border-radius: var(--r-lg); }
.rv-demo--tight { padding: 0; border: 0; }
.rv-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }
.rv-row--start { align-items: flex-start; }
.rv-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.rv-cap { margin: 0; font: 500 12px/1.4 var(--ff-mono); color: var(--muted); letter-spacing: 0.04em; }
.rv-sw { display: flex; flex-direction: column; gap: 6px; width: 96px; }
.rv-sw__chip { height: 52px; border-radius: var(--r-sm); border: 1px solid var(--glass-border); box-shadow: inset 0 1px 0 color-mix(in oklch, white 30%, transparent); }
.rv-sw__name { font: 500 11.5px/1.3 var(--ff-mono); color: var(--ink-2); word-break: break-all; }
.rv-sw__val { font: 400 10.5px/1.3 var(--ff-mono); color: var(--muted); word-break: break-all; }
.rv-focus { outline: 2px solid var(--accent-deep); outline-offset: 2px; }
.rv-box { border: 1px dashed color-mix(in oklch, var(--accent-deep) 55%, transparent); border-radius: var(--r-sm); padding: 8px 12px; font: 500 12px/1 var(--ff-mono); color: var(--accent-deep); background: color-mix(in oklch, var(--accent) 22%, transparent); }
.rv-table { width: 100%; border-collapse: collapse; font: 400 14px/1.45 var(--ff-sans); }
.rv-table th { text-align: left; font: 500 12px/1.3 var(--ff-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); padding: 8px 12px; border-bottom: 1px solid var(--rule); }
.rv-table td { padding: 10px 12px; border-bottom: 1px solid color-mix(in oklch, var(--rule) 60%, transparent); vertical-align: top; color: var(--ink-2); }
.rv-table td:first-child { color: var(--ink); font-weight: 500; }
.rv-table code, .rv-desc code, .rv-verdict code { font: 400 0.92em/1 var(--ff-mono); color: var(--ink); background: var(--ground-2); padding: 1px 5px; border-radius: 4px; }
.rv-wire { border: 1px solid var(--rule); border-radius: var(--r-md); background: color-mix(in oklch, var(--surface) 60%, transparent); display: grid; place-items: center; font: 500 12px/1.3 var(--ff-mono); color: var(--muted); text-align: center; padding: 8px; }
.rv-wire--accent { border-color: color-mix(in oklch, var(--accent-deep) 50%, transparent); color: var(--accent-deep); background: color-mix(in oklch, var(--accent) 24%, transparent); }
.rv-wire--ink { background: var(--ink); color: var(--ground); border-color: var(--ink); }
.rv-callout { border-left: 2px solid var(--accent-deep); padding: 4px 0 4px 16px; margin: 0; color: var(--ink-2); font: 400 15px/1.5 var(--ff-sans); max-width: 62ch; }
`;

const VERDICT_HUE = { Keep: "green", Fix: "yellow", Merge: "lavender", Retire: "pink", Missing: "blue" };
export const VERDICTS = Object.keys(VERDICT_HUE);

export const chip = (text, hue, opts = {}) =>
  `<span class="noo-chip${opts.interactive ? " noo-chip--interactive" : ""}"${hue && hue !== "accent" ? ` data-hue="${hue}"` : ""}${opts.pressed ? ' aria-pressed="true"' : ""}>${opts.dot === false ? "" : '<span class="noo-chip__dot" aria-hidden="true"></span>'}${text}</span>`;

export const verdictChip = (v) => chip(v, VERDICT_HUE[v]);

export const legend = () =>
  `<div class="rv-legend"><p class="noo-body-sm">Verdicts</p>${VERDICTS.map(verdictChip).join("")}</div>`;

export const head = ({ eyebrow, title, lead }) =>
  `<header class="rv-head"><p class="noo-label">${eyebrow}</p><h1 class="noo-h1" style="margin:0">${title}</h1><p class="noo-lead" style="margin:0">${lead}</p></header>`;

export const group = (title, lead) =>
  `<div class="rv-group"><h2 class="noo-h2">${title}</h2>${lead ? `<p class="noo-body">${lead}</p>` : ""}</div>`;

/** One reviewed thing: the spec on the left, the live sample on the right. `wide` puts the sample under the spec. */
export function item({ name, layer, desc, reads, verdict, note, demo, wide, tight }) {
  const spec = `<div class="rv-spec">
    <div class="rv-name"><h3 class="noo-h4">${name}</h3>${layer ? `<span class="noo-label">${layer}</span>` : ""}</div>
    <p class="rv-desc">${desc}</p>
    ${reads ? `<p class="rv-reads"><b>reads</b> ${reads}</p>` : ""}
    <div class="rv-verdict">${verdictChip(verdict)}<p class="noo-body-sm">${note}</p></div>
  </div>`;
  const sample = `<div class="rv-demo${tight ? " rv-demo--tight" : ""}">${demo}</div>`;
  return `<section class="rv-item${wide ? " rv-item--wide" : ""}">${spec}${sample}</section>`;
}

let blobN = 0;
/** The blob exactly as `Blob.tsx` renders it, minus the measured refraction pattern (it needs the runtime). */
export function blob({ size = "md", hue, host = false, sleep = false, logotype = false, px } = {}) {
  const id = `rvb${++blobN}`;
  const cls = ["noo-blob", logotype ? "noo-blob--logotype" : "noo-blob--character", typeof size === "string" ? `noo-blob--${size}` : "", host ? "noo-blob--host" : "", sleep ? "noo-blob--sleep" : "", logotype ? "" : "noo-blob--breathe"].filter(Boolean).join(" ");
  const style = px ? ` style="--blob-w:${px}px"` : "";
  const eyes = sleep
    ? '<rect class="noo-blob__eye" x="20" y="29.75" width="20" height="4.5" rx="2.25"/><rect class="noo-blob__eye" x="56" y="29.75" width="20" height="4.5" rx="2.25"/>'
    : '<circle class="noo-blob__eye" cx="30" cy="32" r="10"/><circle class="noo-blob__eye" cx="66" cy="32" r="10"/>';
  if (logotype) {
    return `<span class="${cls}"${style} aria-hidden="true"><svg class="noo-blob__svg" viewBox="0 0 96 64" aria-hidden="true"><rect class="noo-blob__outline" x="2.75" y="2.75" width="90.5" height="58.5" rx="29.25" fill="none"/><g class="noo-blob__eyes">${eyes}</g></svg></span>`;
  }
  return `<span class="${cls}"${hue && !host ? ` data-hue="${hue}"` : ""}${style} aria-hidden="true"><span class="noo-blob__glass"><svg class="noo-blob__svg" viewBox="0 0 96 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0.146" y1="0.146" x2="0.854" y2="0.854"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.4" stop-color="#fff" stop-opacity="0.171"/><stop offset="1" stop-color="#fff" stop-opacity="0.4"/></linearGradient></defs><rect class="noo-blob__body" width="96" height="64" rx="32"/><rect class="noo-blob__rim" x="0.5" y="0.5" width="95" height="63" rx="31.5" fill="none" stroke="url(#${id})"/><g class="noo-blob__eyes">${eyes}</g></svg></span></span>`;
}

export const wordmark = (px = 22) =>
  `<span class="noo-wordmark" role="img" aria-label="No Origins" style="font-size:${px}px"><span aria-hidden="true">N</span>${blob({ logotype: true, size: "inline" }).replace('class="noo-blob', 'class="noo-wordmark__blob noo-blob')}<span aria-hidden="true">RIGINS</span></span>`;

export const swatch = (name, val, bg) =>
  `<div class="rv-sw"><div class="rv-sw__chip" style="background:${bg ?? `var(${name})`}"></div><div class="rv-sw__name">${name}</div>${val ? `<div class="rv-sw__val">${val}</div>` : ""}</div>`;

export const HUES = ["pink", "green", "grey", "lavender", "peach", "yellow", "blue"];

/** A stand-in for a generated illustration: fine lines, one hue, none touching. The real one is drawn by `illo()`. */
export const illo = (extra = "") =>
  `<svg class="noo-ill noo-bento__ill noo-bento__ill--field ${extra}" viewBox="0 0 288 288" fill="none" aria-hidden="true" style="color:inherit"><g style="stroke:var(--ill-line)" stroke-width="1.7" stroke-linecap="round"><path d="M-10 40 C 60 20, 90 90, 150 70 S 240 10, 300 40"/><path d="M-10 92 C 60 72, 90 142, 150 122 S 240 62, 300 92"/><path d="M-10 144 C 60 124, 90 194, 150 174 S 240 114, 300 144"/><path d="M-10 196 C 60 176, 90 246, 150 226 S 240 166, 300 196"/><path d="M-10 248 C 60 228, 90 298, 150 278 S 240 218, 300 248"/></g></svg>`;

export const icon = (d) => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
export const ARROW = "M4 10h12M11 5l5 5-5 5";
export const SEARCH = "M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM17 17l-3.3-3.3";

/** A photograph stand-in: an inline SVG so the board carries no bytes it does not own. */
export const PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9c3ad"/><stop offset="1" stop-color="#7a5b47"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="200" cy="150" r="70" fill="#f1e2d3"/><path d="M60 400 C 80 260, 320 260, 340 400 Z" fill="#e8d5c2"/></svg>')}`;

const BLOCKS = ["portfolio", "editor", "agents", "tools", "writing", "next"];

export function page({ title, body, block = "portfolio" }) {
  const props = JSON.stringify({
    theme: { editor: "enum", options: ["light", "dark"], default: "light", section: "Cascade" },
    block: { editor: "enum", options: BLOCKS, default: block, section: "Cascade" },
  }).replace(/&/g, "&amp;").replace(/'/g, "&#39;");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
${FONTS}
<style>
${PKG_CSS}
${RV_CSS}
</style>
</helmet>
<div class="noo-ground rv-board">
${body}
</div>
</x-dc>
<script data-dc-script data-props='${props}'>
class Component extends DCLogic {
  apply() {
    // The two tweaks are the two theming axes every component already honours (Design-System.md §10):
    // <html data-theme> and <html data-block>. Nothing on the board is restyled — the tokens cascade.
    const root = document.documentElement;
    root.setAttribute("data-theme", this.props.theme ?? "light");
    root.setAttribute("data-block", this.props.block ?? "${block}");
  }
  componentDidMount() { this.apply(); }
  componentDidUpdate() { this.apply(); }
  renderVals() { return {}; }
}
</script>
</body>
</html>
`;
}

/* ===== Icons — eight glyphs on a 24 grid, rendered in one of five styles. `body` is the closed shape a duotone
   or solid rendering fills; `line` is what every style strokes. Round caps and joins throughout. ===== */
export const GLYPHS = {
  home:     { body: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z", line: "M10 20v-6h4v6" },
  search:   { body: "M10.5 16.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", line: "M15 15l5 5" },
  folder:   { body: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", line: "" },
  message:  { body: "M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4V6a1 1 0 0 1 1-1z", line: "" },
  plus:     { body: "", line: "M12 5v14M5 12h14" },
  pin:      { body: "M9 4h6l-1 6 3 3H7l3-3z", line: "M12 13v7" },
  sliders:  { body: "", line: "M4 7h16M4 12h16M4 17h16", knobs: [[9,7],[15,12],[8,17]] },
  user:     { body: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", line: "M4 21a8 8 0 0 1 16 0" },
  archive:  { body: "M3 5h18v4H3z", line: "M5 9v10h14V9M10 13h4" },
  heart:    { body: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z", line: "" },
  grid:     { body: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z", line: "" },
  layers:   { body: "M12 4l8 4-8 4-8-4z", line: "M4 12l8 4 8-4M4 16l8 4 8-4" },
};
export const ICON_STYLES = {
  light:   { w: 1.25, fill: "none" },
  regular: { w: 1.5,  fill: "none" },
  bold:    { w: 2,    fill: "none" },
  duotone: { w: 1.5,  fill: "tint" },
  solid:   { w: 1.5,  fill: "solid" },
};
export function ico(name, style = "regular", size = 20, extra = "") {
  const g = GLYPHS[name]; const s = ICON_STYLES[style];
  const fillAttr = s.fill === "none" ? "none" : s.fill === "tint" ? "color-mix(in oklch, var(--hue, var(--accent)) 38%, transparent)" : "currentColor";
  const body = g.body ? `<path d="${g.body}" style="fill:${fillAttr}"${s.fill === "solid" ? ' stroke="none"' : ""}/>` : "";
  const line = g.line ? `<path d="${g.line}" fill="none"${s.fill === "solid" ? ` stroke-width="${s.w + 1}"` : ""}/>` : "";
  const knobs = (g.knobs ?? []).map(([x,y]) => `<circle cx="${x}" cy="${y}" r="2" style="fill:${s.fill === "none" ? "var(--surface)" : "currentColor"}"/>`).join("");
  return `<svg class="noo-icon ${extra}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${s.w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}${line}${knobs}</svg>`;
}
