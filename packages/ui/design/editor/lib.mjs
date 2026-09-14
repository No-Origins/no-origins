// The editor's option boards borrow the release canvas's chrome; only the option chip is new.
export { PKG_CSS, RV_CSS, FONTS, page, head, group, chip, blob, illo, HUES } from "../release/lib.mjs";
import { chip } from "../release/lib.mjs";

export const OPTION_CSS = `
.op { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 24px 48px; padding: 32px 0; border-top: 1px solid var(--rule); align-items: start; }
.op__spec { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.op__id { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: var(--r-pill); background: var(--ink); color: var(--ground); font: 600 var(--t-ui-sm)/1 var(--ff-sans); }
.op__name { display: flex; align-items: center; gap: 12px; }
.op__name .noo-h4 { margin: 0; }
.op__desc { margin: 0; color: var(--ink-2); font: 400 var(--t-body-sm)/1.5 var(--ff-sans); text-wrap: pretty; }
.op__for { margin: 0; font: 400 var(--t-label)/1.8 var(--ff-mono); color: var(--muted); }
.op__for b { font-weight: 400; color: var(--ink-2); }
.op__verdict { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; padding-top: 12px; border-top: 1px dotted var(--rule); }
.op__verdict .noo-body-sm { margin: 0; color: var(--ink-2); }
.op__demo { min-width: 0; display: flex; flex-direction: column; gap: 20px; padding: 28px; border: 1px dashed color-mix(in oklch, var(--ink) 18%, transparent); border-radius: var(--r-lg); }
.op--rec { background: color-mix(in oklch, var(--accent) 10%, transparent); margin: 0 -24px; padding-inline: 24px; border-radius: var(--r-lg); border-top: 0; }
/* the inspector, as the frame every control lives in */
.insp { width: 320px; padding: 20px; border-radius: var(--r-xl); display: flex; flex-direction: column; gap: 20px; }
.insp__row { display: flex; flex-direction: column; gap: 6px; }
.insp__label { font: 500 var(--t-caption)/1.45 var(--ff-sans); color: var(--ink-2); display: flex; justify-content: space-between; }
.insp__label span:last-child { color: var(--muted); font-family: var(--ff-mono); font-size: var(--t-label); }
`;

/** One option: an id chip, the name, what it is, what it is for, and the reasoning. `rec` marks the recommendation. */
export function option({ id, name, desc, fits, why, demo, rec }) {
  return `<section class="op${rec ? " op--rec" : ""}">
  <div class="op__spec">
    <div class="op__name"><span class="op__id">${id}</span><h3 class="noo-h4">${name}</h3>${rec ? chip("recommended", "green") : ""}</div>
    <p class="op__desc">${desc}</p>
    ${fits ? `<p class="op__for"><b>fits</b> ${fits}</p>` : ""}
    <div class="op__verdict"><p class="noo-body-sm">${why}</p></div>
  </div>
  <div class="op__demo">${demo}</div>
</section>`;
}

export const insp = (rows) => `<aside class="noo-glass noo-glass--1 insp" aria-label="Inspector">${rows.map(([label, meta, control]) => `<div class="insp__row"><p class="insp__label"><span>${label}</span>${meta ? `<span>${meta}</span>` : ""}</p>${control}</div>`).join("")}</aside>`;
