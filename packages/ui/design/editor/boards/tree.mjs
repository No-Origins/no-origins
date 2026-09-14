import { head, group, option, insp } from "../lib.mjs";

const CSS = `
.tr { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; font: 500 var(--t-ui-sm)/1.3 var(--ff-sans); }
.tr-row { display: flex; align-items: center; gap: 8px; min-height: var(--ctl-sm); padding: 0 8px 0 8px; border-radius: var(--r-pill); color: var(--ink-2); position: relative; }
.tr-row--on { background: var(--ink); color: var(--ground); }
.tr-row--focus { outline: 2px solid var(--accent-deep); outline-offset: 2px; }
.tr-caret { width: 16px; height: 16px; display: grid; place-items: center; flex: none; }
.tr-caret svg { width: 100%; height: 100%; }
.tr-grip { margin-left: auto; color: var(--muted); font: 500 14px/1 var(--ff-mono); letter-spacing: -2px; opacity: 0; }
.tr-row:hover .tr-grip, .tr-row--focus .tr-grip { opacity: 1; }
.tr-row--on .tr-grip { color: var(--ground); }
.tr-group { list-style: none; margin: 1px 0 4px 16px; padding-left: 12px; border-left: 1px solid var(--rule); display: flex; flex-direction: column; gap: 1px; }
.tr-drop { height: 2px; background: var(--accent-deep); border-radius: 1px; margin: 1px 8px 1px 32px; position: relative; }
.tr-drop::before { content: ""; position: absolute; left: -6px; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--accent-deep); }
.tr-btns { display: inline-flex; gap: 2px; margin-left: auto; }
.tr-btn { width: 24px; height: 24px; border: 0; border-radius: var(--r-pill); background: color-mix(in oklch, var(--ink) 6%, transparent); color: var(--ink-2); cursor: pointer; font: 500 12px/1 var(--ff-sans); }
.tr-num { width: 28px; text-align: right; font: 500 var(--t-label)/1 var(--ff-mono); color: var(--muted); }
.tr-kbd { display: inline-block; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--rule); font: 500 11px/1 var(--ff-mono); color: var(--ink-2); background: var(--surface); }
`;
const caret = (open) => `<span class="tr-caret" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="${open ? "M4 6l4 4 4-4" : "M6 4l4 4-4 4"}" style="fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"/></svg></span>`;
const row = (label, { on, focus, open, leaf, trailing = "", num } = {}) => `<li><div class="tr-row${on ? " tr-row--on" : ""}${focus ? " tr-row--focus" : ""}">${num !== undefined ? `<span class="tr-num">${num}</span>` : ""}${leaf ? '<span class="tr-caret"></span>' : caret(open)}<span>${label}</span>${trailing}</div>`;
const base = (variant) => {
  const grip = variant === "grip" ? '<span class="tr-grip" aria-hidden="true">⋮⋮</span>' : "";
  const btns = variant === "btns" ? '<span class="tr-btns"><button type="button" class="tr-btn" aria-label="Move up">↑</button><button type="button" class="tr-btn" aria-label="Move down">↓</button></span>' : "";
  const n = (i) => (variant === "num" ? i : undefined);
  return `<ul class="tr" role="tree" aria-label="Outline">
${row("Me", { open: true, num: n(1) })}<ul class="tr-group">${row("The blob", { leaf: true, num: n(1) })}</li>${row("Intro", { leaf: true, num: n(2) })}</li>${row("Story", { leaf: true, num: n(3) })}</li></ul></li>
${row("Work", { open: true, num: n(2) })}<ul class="tr-group">${variant === "grip" || variant === "drag" ? '<li><div class="tr-drop" aria-hidden="true"></div></li>' : ""}${row("Widget", { on: true, focus: variant !== "num", trailing: grip + btns, num: n(1) })}</li>${row("Full view", { num: n(2) })}</li></ul></li>
${row("Status", { num: n(3) })}</li>
</ul>`;
};

export const title = "Outline reordering";
export const block = "design";
export const body = `<style>${CSS}</style>
${head({ eyebrow: "the editor · the outline · Admin.md §6.5 decided this; confirm or change it", title: "Reordering the outline", lead: "The Outline is the scene in DOM order — which is reading order and tab order (§12) — and §6.1 says it is reorderable and not optional, because it is the only place tab order can be seen and fixed. <code>Tree</code> renders and selects; the WAI-ARIA tree pattern has no gesture for moving an item, so one has to be chosen. §6.5 recorded keyboard moves plus drag; here are the five that were weighed." })}
${group("Five directions", "The outline of the portfolio’s first two sections, with Work’s widget selected.")}
${option({ id: "A", name: "Keyboard moves and drag, one rule", rec: true,
  desc: "On the focused row: <span class='tr-kbd'>Alt</span> + <span class='tr-kbd'>↑</span> / <span class='tr-kbd'>↓</span> moves it among its siblings, <span class='tr-kbd'>Alt</span> + <span class='tr-kbd'>←</span> / <span class='tr-kbd'>→</span> changes depth. A grip appears on hover and focus; dragging shows the drop as a 2px accent line with a dot at its head, the same line the Repeater uses.",
  fits: "Tree · the Repeater’s rows · anything with an order",
  why: "Reading order is an accessibility property, so it has to be fixable without a pointer; that rules out drag alone. The Alt-arrow scheme is what outliners and every major editor’s block list already use, so it costs nothing to learn. Drag stays for the mouse, and the two share one drop indicator with the Repeater — one gesture for “this goes here” across the editor.",
  demo: insp([["Outline", "DOM order = tab order", base("grip")]]) })}
${option({ id: "B", name: "Move buttons on the row",
  desc: "Up and down buttons appear on the selected row.",
  fits: "Tree",
  why: "Discoverable and keyboard-reachable, but two extra tab stops per row for a keyboard user who already has arrow keys, and no way to change depth without a third and fourth button. It is A with more chrome and less reach.",
  demo: insp([["Outline", "DOM order = tab order", base("btns")]]) })}
${option({ id: "C", name: "Drag only",
  desc: "A grip and a drop line; nothing on the keyboard.",
  fits: "Tree",
  why: "The least to build and the one §12 forbids: an outline that exists to fix tab order must itself be operable from the keyboard.",
  demo: insp([["Outline", "DOM order = tab order", base("drag")]]) })}
${option({ id: "D", name: "A “Move to…” menu",
  desc: "The row’s menu offers Move up · Move down · Move into · Move out of.",
  fits: "Tree",
  why: "Accessible and explicit, and slow: four menu picks to move an item two places. A fine addition for discoverability; too heavy as the only way.",
  demo: insp([["Outline", "DOM order = tab order", base("plain") + '<div class="noo-glass noo-glass--3 noo-menu noo-menu--floating" style="width:160px;--menu-item:var(--ctl-xs);margin-top:8px" aria-label="Move"><div class="noo-menu__col"><div class="noo-menu__groups"><div class="noo-menu__group"><ul class="noo-menu__list">' + ["Move up", "Move down", "Move into Work", "Move out of Work"].map((l) => `<li class="noo-menu__item"><div class="noo-menu__row"><button type="button" class="noo-menu__link"><span class="noo-menu__label">${l}</span></button></div></li>`).join("") + '</ul></div></div></div></div>']]) })}
${option({ id: "E", name: "An order number per row",
  desc: "Each row shows its index; type a number to move it there.",
  fits: "Tree",
  why: "Precise and unpleasant: numbers renumber as you type, depth is not a number, and an outline of thirty nodes becomes arithmetic. Order is a position, not a value — Steps made the same call with its CSS counter.",
  demo: insp([["Outline", "DOM order = tab order", base("num")]]) })}
`;
