import { head, group, option, bento, cell, lbl, figMd, SCREEN_CSS } from "../lib.mjs";

// The loud cell of Interests, five ways. The word is two lines of the display face at --t-widget-word (48).
const loud = (inner) => bento(cell(inner, { span: [2, 2], tone: "fill", pat: "interests" }), { cols: 2, hue: "yellow", label: "Interests" });
const word = (t, cls = "sc-word") => `<p class="${cls}">${t}</p>`;

export const title = "F3 · The loud cell’s word";
export const block = "design";
export const body = `<style>${SCREEN_CSS}</style>
${head({ eyebrow: "the editor · finding F3 of 5 · pick one by its letter", title: "The loud cell’s word", lead: "Where a section has nothing to count, the loud cell carries a word instead of a figure — Interests says <em>outside the work</em>, Philosophy says <em>how I build</em> — in the display face at <code>--t-widget-word</code> (48), two lines. <code>Figure</code> caps its value at four characters, rightly for a number; <code>Heading</code> level 2 was the nearest thing and is smaller. Most of those two widgets’ 9 % is this." })}
${group("Five directions", "Interests’ loud cell at 1:1, the pattern behind it as the package draws it.")}
${option({ id: "A", name: "Figure gains kind='word'", rec: true,
  desc: "<code>Figure</code> takes <code>kind: figure | word</code>. As a word the value cap lifts to 24, the face stays display, the size drops from 96 to 48 and it wraps to two lines; the label under it is optional.",
  fits: "one enum on one existing component · same corner, same job",
  why: "The word is a figure that happens to be letters: it sits where the number sits, it does what the number does — say the one thing that reads at 0.27 — and content/sections.tsx already treats <code>figure</code> and <code>word</code> as the same slot. The inspector shows one control; the enum decides the cap.",
  demo: loud(lbl("interests") + word("outside<br>the work")) })}
${option({ id: "B", name: "Heading gains size='widget'",
  desc: "<code>Heading</code> keeps its levels and takes a <code>size</code> that overrides the scale: <code>widget</code> is 48/0.95 in the display face.",
  fits: "one prop on Heading · a heading in a cell is a real h3",
  why: "Semantically a word in a loud cell is a heading of sorts, and this gives it a level. But it puts a second axis on Heading (level and size), and a heading that is not the size of its level is the exception every later author has to learn.",
  demo: loud(lbl("interests") + word("outside<br>the work", "noo-heading sc-word")) })}
${option({ id: "C", name: "A Word atom",
  desc: "A new slot-only component that renders <code>.noo-bento__word</code> and nothing else: text ≤ 24, display face, two lines.",
  fits: "one new entry · exact",
  why: "Exact and tiny, which is also why it is thin: a component that only exists inside one cell of one grid is a class with a palette entry. Board F2 rejected the same shape for the text scale; consistency says reject it here too.",
  demo: loud(lbl("interests") + word("outside<br>the work")) })}
${option({ id: "D", name: "Keep Heading level 2 — as tested",
  desc: "Leave it: the document uses <code>Heading level 2</code> (34px) and the widgets become a little quieter.",
  fits: "no change",
  why: "Free, and it is what the proof already renders. But 34 was measured to be too small for the map: at 0.27 the word is what a widget without a number has to say, and this is why <code>--t-widget-word</code> exists at all.",
  demo: loud(lbl("interests") + `<h2 class="noo-heading noo-h2" style="margin:0">outside<br>the work</h2>`) })}
${option({ id: "E", name: "No word — the loud cell carries the label and the pattern",
  desc: "Where nothing counts, the loud cell says only its eyebrow; the words move to a quiet cell beside it.",
  fits: "no component · a design change",
  why: "The most honest reading of “honest counts only” — and the emptiest cell on the ring. Two of six widgets would have a loud cell with a word missing from its bottom-left, and the diagonal that ties the six together would have a gap in it.",
  demo: loud(lbl("interests")) })}
`;
