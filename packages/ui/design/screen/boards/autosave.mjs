import { head, group, option, btn, chip, dot, tree, trow, seg, SCREEN_CSS, decided } from "../lib.mjs";

const STATES = [
  ["saved", "grey", "saved 2 min ago", "the resting state; the time is relative and updates"],
  ["saving", "accent", "saving…", "the debounced write is in flight (~800 ms after the last edit)"],
  ["unsaved", "yellow", "unsaved changes", "edits since the last successful save — shown, not alarmed"],
  ["failed", "pink", "couldn’t save — kept here", "the write was refused or the network is gone; the draft is in the browser and a Retry follows"],
  ["stale", "pink", "stale — saved elsewhere at 14:02", "the rev on the server moved (Admin.md §6.4): refused, never merged; Reload follows"],
];
const meta = (hue, text, busy, action = "") => `<span class="sc-meta${busy ? " sc-meta--busy" : ""}"><span class="noo-dot" data-hue="${hue === "accent" ? "peach" : hue}"></span>${text}${action}</span>`;
const header = (metaHtml, actions = btn("Preview") + btn("Publish", "primary")) =>
  `<div class="sc-hdr"><div class="sc-hdr__h"><p class="noo-label">Projects</p><h1 class="noo-h4">Portfolio</h1>${chip("draft", "grey")}${metaHtml}</div><div class="sc-actions">${actions}</div></div>`;
const rows = (render) => `<div class="sc-status">${STATES.map(([k, hue, text, note]) => `<div class="sc-status__row"><p class="rv-cap">${k} — ${note}</p>${render(k, hue, text)}</div>`).join("")}</div>`;

export const title = "S3 · How autosave shows";
export const block = "design";
export const body = `<style>${SCREEN_CSS}</style>
${head({ eyebrow: "the editor · screen question S3 of 4 · pick one by its letter", title: "How autosave shows", lead: "Admin.md §6.4: autosave is a debounced write to the draft with the rev bumped, and a stale write is refused, not merged. So there are five states an author can be in — saved, saving, unsaved, failed, stale — and the screen has to show which, all the time, without nagging. The ToolScreen header already carries <em>draft</em> and <em>saved 2 minutes ago</em> in its meta slot. Below: the five states, five places." })}
${decided({ pick: "A — a dot and a few words in the header's meta", built: "Built: <code>SaveState</code> — saved · saving (pulsing, unless reduced motion) · unsaved · couldn't save with Retry · stale with Reload. Autosave PATCHes the draft with the rev rule of §6.4; a stale write is refused (409), never merged. Publish is disabled in every state but saved." })}
${group("Five directions", "Every option shows all five states; most show them in the editor’s header at its real width.")}
${option({ id: "A", name: "A dot and a few words in the header’s meta", rec: true,
  desc: "The meta slot carries a Dot and a short line: grey <em>saved 2 min ago</em>, accent <em>saving…</em> (the dot pulses), yellow <em>unsaved changes</em>, pink <em>couldn’t save — kept here</em> with a ghost Retry, pink <em>stale — saved elsewhere</em> with a ghost Reload. Publish is disabled while anything but saved.",
  fits: "the slot exists · one place · the Dot is the system’s mark for a state",
  why: "It sits where the header already says draft and saved, next to the title, in the reading line — glanceable and never in the way. The Dot carries the state at a glance and the words say it exactly; the two failures get their one action beside them. Nothing arrives, nothing leaves: the state is a fact about the document and lives with its name.",
  demo: rows((k, hue, text) => header(meta(hue, text, k === "saving", k === "failed" ? `&nbsp;${btn("Retry", "ghost")}` : k === "stale" ? `&nbsp;${btn("Reload", "ghost")}` : ""), btn("Preview") + (k === "saved" ? btn("Publish", "primary") : `<button type="button" class="noo-btn noo-btn--primary noo-btn--sm" disabled style="opacity:.45"><span class="noo-btn__text">Publish</span></button>`))) })}
${option({ id: "B", name: "The Publish button carries it",
  desc: "The primary button’s label is the state: <em>Publish</em> when saved, <em>Saving…</em>, <em>Unsaved</em>, <em>Retry save</em>, <em>Reload</em>.",
  fits: "no extra element · the action is where the state is",
  why: "Economical, and it makes the one button that must always mean the same thing mean five things. Publish is a deliberate act behind a confirm (R1); a button whose label changes under the pointer is how a save becomes a publish by accident.",
  demo: rows((k, hue, text) => header("", btn("Preview") + btn({ saved: "Publish", saving: "Saving…", unsaved: "Unsaved", failed: "Retry save", stale: "Reload" }[k], k === "saved" ? "primary" : "secondary"))) })}
${option({ id: "C", name: "A Toast for each change of state",
  desc: "The Toast molecule, bottom-right: <em>Saved</em>, <em>Saving</em>, <em>Couldn’t save</em>, <em>Someone else saved</em> — each arriving as the state changes and leaving after a while.",
  fits: "the component exists · the admin’s voice lives here",
  why: "Toasts are for something that happened once; autosave happens every two seconds. Fifty toasts an hour is noise the author learns to ignore, and then the one that matters — stale — is ignored too. Right for publish; wrong for save.",
  demo: `<div class="rv-col">${STATES.filter(([k]) => k !== "unsaved").map(([k, hue, text]) => `<div class="noo-glass noo-glass--2 sc-toast" style="--toast-tone:var(--${hue === "accent" ? "accent-deep" : hue === "grey" ? "muted" : hue === "yellow" ? "warn" : "bad"})"><span class="sc-toast__mark"></span><div class="noo-toast__body"><p class="noo-toast__title">${{ saved: "Saved", saving: "Saving", failed: "Couldn’t save", stale: "Someone else saved" }[k]}</p><p class="noo-toast__text">${text}</p></div></div>`).join("")}</div>` })}
${option({ id: "D", name: "The footer bar’s left slot",
  desc: "The bar under the canvas — zoom, theme, viewport — gains a left slot with the state, in the same voice as <em>zoom 0.9</em>.",
  fits: "a slot with room · beside the other live readings",
  why: "It groups the state with the viewport’s readings, which is the wrong family: zoom and theme are about how you are looking, saving is about the document. And the bar is furthest from the title and the Publish button, which is what the state qualifies.",
  demo: rows((k, hue, text) => `<div class="noo-glass noo-glass--2" style="display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:var(--ctl-md);padding:4px 12px;border-radius:var(--r-xl)">${meta(hue, text, k === "saving")}<span style="display:flex;gap:12px;align-items:center">${seg("Viewport", ["Desktop", "Phone"], "Desktop")}<span class="sc-meta">zoom 0.9</span></span></div>`) })}
${option({ id: "E", name: "A dot on the outline’s root",
  desc: "The document’s row at the top of the outline carries the Dot; hover says the words.",
  fits: "the smallest · the outline is always open",
  why: "The quietest, and too quiet: a dot with no words is a state you have to hover to read, and the outline is the region an author looks at least. A failed save is the one state that must not be quiet.",
  demo: `<div class="noo-glass noo-glass--1 sc-side" style="width:280px">${tree(STATES.map(([k, hue, text]) => trow(`portfolio/home`, { caret: "⌄", trailing: `<span class="sc-meta" title="${text}">${dot(hue === "accent" ? "peach" : hue)}</span>` })).join(""))}</div>` })}
`;
