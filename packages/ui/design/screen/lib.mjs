// The editor-screen boards (step 3) borrow the inspector-controls canvas's chrome and its option layout; what is new
// here is a set of bento helpers — the widgets are drawn with the package's real classes at 1:1, because the
// findings this canvas decides came from comparing exactly those pixels (Scene-Schema.md §10).
import fs from "node:fs";
export { PKG_CSS, RV_CSS, FONTS, page, head, group, chip, blob, HUES, option, insp, OPTION_CSS } from "../editor/lib.mjs";

const PATTERNS = JSON.parse(fs.readFileSync(new URL("../editor/patterns.json", import.meta.url), "utf8"));
/** A pattern as the generator drew it, without its own hue so it takes the cell's. */
export const pattern = (name) => (PATTERNS.find((p) => p.name === name)?.svg ?? "").replace(/ data-hue="[^"]*"/, "").replace('class="noo-ill"', 'class="noo-ill sc-field"');

export const SCREEN_CSS = `
.sc-field { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
.noo-bento__cell > .sc-field { position: absolute; }
.sc-kbd { display: inline-block; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--rule); font: 500 11px/1 var(--ff-mono); color: var(--ink-2); background: var(--surface); }
.sc-well { position: relative; flex: 1 1 480px; min-width: 480px; overflow: hidden; border-radius: var(--r-lg); background-color: var(--ground);
  background-image: linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px); background-size: 80px 80px; background-position: 20px 20px; }
.sc-half { position: absolute; transform: scale(0.5); transform-origin: top left; }
.sc-sel { outline: 2px solid var(--accent-deep); outline-offset: 4px; border-radius: var(--r-lg); }
.sc-sel--ink { outline-color: var(--ink); }
.sc-sel--hair { outline: 1px solid color-mix(in oklch, var(--ink) 30%, transparent); outline-offset: 2px; }
.sc-tag { position: absolute; left: 0; top: -30px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: var(--r-sm); background: var(--ink); color: var(--ground); font: 500 var(--t-label)/1 var(--ff-mono); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
.sc-tag .noo-dot { width: 8px; height: 8px; }
.sc-handle { position: absolute; width: 10px; height: 10px; border-radius: 2px; background: var(--surface); box-shadow: 0 0 0 1.5px var(--ink); }
.sc-bar { position: absolute; display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: var(--r-pill); }
.sc-bar__b { display: inline-grid; place-items: center; height: 28px; padding: 0 10px; border-radius: var(--r-pill); font: 500 var(--t-ui-sm)/1 var(--ff-sans); color: var(--ink-2); }
.sc-faded { opacity: 0.12; }
.sc-ghost { position: absolute; border: 2px dashed var(--accent-deep); border-radius: var(--r-lg); background: color-mix(in oklch, var(--accent) 24%, transparent); display: grid; place-items: center; color: var(--accent-deep); font: 500 var(--t-label)/1.4 var(--ff-mono); letter-spacing: 0.06em; text-transform: uppercase; text-align: center; }
.sc-boxes { position: absolute; background: color-mix(in oklch, var(--accent) 14%, transparent); border-radius: 2px; }
.sc-side { width: 240px; padding: 16px; border-radius: var(--r-xl); display: flex; flex-direction: column; gap: 10px; }
.sc-side .noo-label { color: var(--muted); }
.sc-pal { display: flex; flex-direction: column; gap: 2px; }
.sc-pal__i { display: flex; align-items: center; gap: 10px; min-height: var(--ctl-sm); padding: 0 10px; border-radius: var(--r-pill); font: 500 var(--t-ui-sm)/1 var(--ff-sans); color: var(--ink-2); }
.sc-pal__i--on { background: var(--ink); color: var(--ground); }
.sc-pal__i--drag { background: var(--surface); box-shadow: var(--e2); color: var(--ink); }
.sc-pal__glyph { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid currentColor; opacity: 0.7; flex: none; }
.sc-hdr { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: var(--bar); padding: 8px 32px; border-bottom: 1px solid var(--rule); background: color-mix(in oklch, var(--ground) 92%, transparent); }
.sc-hdr__h { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 16px; }
.sc-hdr__h .noo-label { color: var(--muted); }
.sc-hdr__h .noo-h4 { margin: 0; }
.sc-meta { display: flex; align-items: center; gap: 8px; font: 400 var(--t-body-sm)/1 var(--ff-sans); color: var(--muted); }
.sc-meta .noo-dot { width: 8px; height: 8px; }
.sc-meta--busy .noo-dot { animation: sc-pulse 1.2s ease-in-out infinite; }
@keyframes sc-pulse { 50% { opacity: 0.25; } }
.sc-actions { display: flex; align-items: center; gap: 12px; }
.sc-status { display: flex; flex-direction: column; gap: 10px; }
.sc-status__row { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 16px; align-items: center; }
.sc-status__row .rv-cap { color: var(--ink-2); }
.sc-toast { position: relative; display: flex; gap: 12px; padding: 14px 16px 14px 20px; border-radius: var(--r-lg); width: 400px; }
.sc-toast__mark { position: absolute; left: 0; top: 16px; bottom: 16px; width: 3px; border-radius: 0 2px 2px 0; background: var(--toast-tone, var(--muted)); }
.sc-tree { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; font: 500 var(--t-ui-sm)/1.3 var(--ff-sans); }
.sc-tree__row { display: flex; align-items: center; gap: 8px; min-height: var(--ctl-sm); padding: 0 12px 0 8px; border-radius: var(--r-pill); color: var(--ink-2); }
.sc-tree__row--on { background: var(--ink); color: var(--ground); }
.sc-tree__group { list-style: none; margin: 1px 0 4px 16px; padding-left: 12px; border-left: 1px solid var(--rule); display: flex; flex-direction: column; gap: 1px; }
.sc-tree__caret { width: 16px; text-align: center; opacity: 0.6; }
.sc-mixed .noo-field__input { color: var(--muted); font-style: italic; }
.sc-note { margin: 0; font: 400 var(--t-caption)/1.45 var(--ff-sans); color: var(--muted); }
.sc-cmd { width: 420px; padding: 8px; border-radius: var(--r-xl); display: flex; flex-direction: column; gap: 6px; }
.sc-cmd__in { display: flex; align-items: center; gap: 10px; padding: 10px 12px; font: 400 var(--t-ui)/1 var(--ff-sans); color: var(--ink); border-bottom: 1px solid var(--rule); }
.sc-cmd__in span:first-child { color: var(--muted); font-family: var(--ff-mono); }
.sc-cmd .sc-pal__i { justify-content: space-between; }
.sc-cmd .sc-pal__i small { font: 400 var(--t-caption)/1 var(--ff-sans); color: var(--muted); }
.sc-pal__i--on small { color: var(--ground); opacity: 0.7; }
.sc-two { display: grid; grid-template-columns: 320px 320px; gap: 24px; align-items: start; }
.sc-insp-head { display: flex; flex-direction: column; gap: 4px; }
.sc-insp-head .noo-label { color: var(--muted); }
.sc-insp-head .noo-h4 { margin: 0; }
.sc-insp-head .noo-body-sm { margin: 0; color: var(--ink-2); }
.sc-cellhead--fill { flex: 1; justify-content: space-between; }
.sc-cellhead--fill .noo-cellhead__title { display: block; }
.sc-cellhead--fill .noo-cellhead__title .noo-dot { margin-right: 8px; vertical-align: 2px; }
.sc-cellhead--rev { flex-direction: column-reverse; flex: 1; justify-content: space-between; }
.sc-cellhead--mid { flex: 1; justify-content: center; }
.sc-tw { font: 400 var(--t-widget-text)/1.35 var(--ff-sans); color: var(--ink-2); margin: 0; text-wrap: pretty; }
.sc-word { margin: 0; font: 400 var(--t-widget-word)/0.95 var(--ff-display); letter-spacing: -0.01em; }
.sc-lines { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
.sc-lines--dots li { display: flex; gap: 10px; align-items: baseline; }
.sc-lines--dots .noo-dot { width: 8px; height: 8px; vertical-align: 2px; flex: none; }
.sc-lines--num { counter-reset: n; }
.sc-lines--num li::before { counter-increment: n; content: counter(n) "  "; font: 500 var(--t-label)/1 var(--ff-mono); color: var(--muted); margin-right: 6px; }
.sc-lines--bullets { list-style: disc; padding-left: 20px; }
`;

/* ── bento helpers: the package's classes, at 1:1 ───────────────────────────────────────────────────────────── */
export const bento = (cells, { cols = 4, hue = "peach", label = "A section" } = {}) =>
  `<div class="noo-bento" role="group" aria-label="${label}" data-hue="${hue}" style="--bento-cols:${cols}">${cells}</div>`;
export const cell = (inner, { span = [1, 1], tone = "quiet", pat } = {}) =>
  `<div class="noo-bento__cell noo-bento__cell--${tone}${tone === "glass" ? " noo-glass noo-glass--1" : ""}" style="grid-column: span ${span[0]}; grid-row: span ${span[1]}">${inner}${pat ? pattern(pat) : ""}</div>`;
export const lbl = (t) => `<p class="noo-label">${t}</p>`;
export const ttl = (t, dot) => `<p class="noo-bento__title">${dot ? `<span class="noo-dot" data-hue="${dot}"></span> ` : ""}${t}</p>`;
export const fig = (v, l) => `<p class="noo-bento__figure"><span class="noo-bento__value">${v}</span>${l ? `<span class="noo-label noo-bento__figure-label">${l}</span>` : ""}</p>`;
export const figMd = (v, l) => `<p class="noo-bento__figure noo-bento__figure--md"><span class="noo-bento__value">${v}</span>${l ? `<span class="noo-label noo-bento__figure-label">${l}</span>` : ""}</p>`;
/** CellHead as `CellHead.tsx` renders it; `cls` adds one of the board's variants. */
export const cellhead = (label, title, dot, cls = "") =>
  `<div class="noo-cellhead${cls ? ` ${cls}` : ""}">${label ? `<p class="noo-label">${label}</p>` : ""}<p class="noo-bento__title noo-cellhead__title">${dot ? `<span class="noo-dot" data-hue="${dot}"></span>` : ""}${title}</p></div>`;
export const text = (t, size = "noo-body-sm", extra = "") => `<p class="noo-text ${size}${extra ? ` ${extra}` : ""}">${t}</p>`;
export const btn = (t, v = "secondary", size = "sm") => `<button type="button" class="noo-btn noo-btn--${v} noo-btn--${size}${v === "secondary" ? " noo-glass noo-glass--1" : ""}"><span class="noo-btn__text">${t}</span></button>`;
export const kbd = (k) => `<kbd class="sc-kbd">${k}</kbd>`;
export const dot = (h) => `<span class="noo-dot" data-hue="${h}"></span>`;
export const field = (label, value, { meta, mixed, placeholder, w } = {}) =>
  `<div class="noo-field${mixed ? " sc-mixed" : ""}"${w ? ` style="width:${w}"` : ""}><p class="noo-field__label" style="display:flex;justify-content:space-between"><span>${label}</span>${meta ? `<span style="color:var(--muted);font-family:var(--ff-mono);font-size:var(--t-label)">${meta}</span>` : ""}</p><div class="noo-glass noo-glass--1 noo-field__box"><input class="noo-field__input"${value !== undefined ? ` value="${value}"` : ""}${placeholder ? ` placeholder="${placeholder}"` : ""}></div></div>`;
export const seg = (label, opts, on) =>
  `<div class="noo-segmented" role="radiogroup" aria-label="${label}"><div class="noo-glass noo-glass--1 noo-segmented__track">${opts.map((o) => `<button type="button" role="radio" aria-checked="${o === on}" class="noo-segmented__btn">${o}</button>`).join("")}</div></div>`;
export const tag = (t = "sample copy") => `<span class="noo-placeholder__tag" style="white-space:nowrap">${t}</span>`;

/** The canvas at half zoom: a grid well with a real widget scaled to 0.5 inside it. */
export const well = (inner, { h = 340, w } = {}) => `<div class="sc-well"${w || h ? ` style="${w ? `width:${w}px;` : ""}height:${h}px"` : ""}>${inner}</div>`;
export const half = (x, y, inner, cls = "", extra = "") => `<div class="sc-half${cls ? ` ${cls}` : ""}" style="left:${x}px;top:${y}px;${extra}">${inner}</div>`;

/** The Work widget, as the document composes it (Scene-Schema.md §10.2 — identical loud cell). */
export const workWidget = (headFn = (l, t, d) => cellhead(l, t, d)) =>
  bento(
    [
      cell(lbl("work") + fig("4", "roles"), { span: [2, 2], tone: "fill", pat: "work" }),
      cell(headFn("now", "Radise", "peach")),
      cell(headFn("before", "Dataflix", "green")),
      cell(headFn("one year", "Hashnode", "blue")),
      cell(headFn("two years", "Terrible Tiny Tales", "pink")),
      cell(lbl("the through-line") + `<div class="noo-bento__chips">${[["editors", "lavender"], ["design systems", "peach"], ["agent systems", "blue"], ["full-stack", "green"]].map(([l, h]) => `<span class="noo-chip" data-hue="${h}"><span class="noo-chip__dot" aria-hidden="true"></span>${l}</span>`).join("")}</div>`, { span: [4, 1] }),
    ].join(""),
    { hue: "peach", label: "Work experience" },
  );

export const tree = (rows) => `<ul class="sc-tree" role="tree">${rows}</ul>`;
export const trow = (label, { on, caret, trailing = "" } = {}) => `<li><div class="sc-tree__row${on ? " sc-tree__row--on" : ""}"><span class="sc-tree__caret">${caret ?? ""}</span><span style="flex:1">${label}</span>${trailing}</div>`;
