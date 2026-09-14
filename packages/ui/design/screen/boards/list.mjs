import { head, group, option, bento, cell, lbl, dot, SCREEN_CSS } from "../lib.mjs";

const LINES = ["How editors decide what a document <em>is</em>", "Type on screen, and the parts of it nobody notices", "Small tools that do one thing without asking permission", "Maps, and why a good one is mostly what it leaves out"];
const cellOf = (inner) => bento(cell(inner, { span: [2, 2] }), { cols: 2, hue: "yellow", label: "Interests" });
const ul = (cls, li = (l) => l) => `<ul class="sc-lines sc-tw ${cls}">${LINES.map((l) => `<li>${li(l)}</li>`).join("")}</ul>`;
const HUES = ["lavender", "peach", "blue", "green"];

export const title = "F5 · A list inside a widget";
export const block = "design";
export const body = `<style>${SCREEN_CSS}</style>
${head({ eyebrow: "the editor · finding F5 of 5 · pick one by its letter", title: "A list inside a widget", lead: "The Interests cell is four lines with no markers at the widget scale. In the document it is a <code>Text</code> whose markdown is a list, and markdown renders bullets at the document scale. Scene-Schema.md §9.3 ⑩ ruled out a loop over a ref because each item was a measured height — in a fixed cell nothing is measured, so the question is open again: what is a list, inside a widget?" })}
${group("Five directions", "The same four lines, at 1:1 in a 2 × 2 cell. F2’s size applies to all of them.")}
${option({ id: "A", name: "A Text list in a cell is unmarkered, at widget scale", rec: true,
  desc: "One <code>Text</code> node, markdown with four <code>-</code> lines. Inside a bento cell the list drops its markers and keeps its rhythm; the size is F2’s <code>widget</code> step.",
  fits: "no new component · one node · the outline shows one row",
  why: "The four lines are one run of writing, which is what Text is for; a cell is not a document, so it reads a list the way a widget reads everything — quieter than the page. The adapter already parses lists; this is one CSS rule inside the cell. Cost: the markers cannot be chosen, which the next option offers.",
  demo: cellOf(ul("")) })}
${option({ id: "B", name: "A Stack of four Texts",
  desc: "Four <code>Text</code> nodes in a <code>Stack gap=8</code> — each line its own node, reorderable in the outline, deletable one by one.",
  fits: "existing components · four rows in the outline",
  why: "Everything the editor already does works on it: drag a line up, delete one, select one and change its tone. But four lines are not four compositions; the outline fills with rows nobody will move, and a fifth interest is a drag from the palette instead of a new line.",
  demo: cellOf(`<div class="noo-stack noo-stack--g8">${LINES.map((l) => `<p class="noo-text sc-tw">${l}</p>`).join("")}</div>`) })}
${option({ id: "C", name: "A List component",
  desc: "A slot component: <code>items</code> (list of text ≤ 6, a Repeater in chips density) and <code>marker: none | dot | number</code>. Widget scale inside a cell, document scale outside.",
  fits: "one new entry · markers are a choice · the Repeater edits it",
  why: "The list becomes a thing with a shape rather than a side effect of markdown, and the inspector edits it as the Repeater it already has. The extra component is the cost, and the reason it might still be right: the through-line cells could be this with dots and no chips.",
  demo: cellOf(ul("sc-lines--dots", (l, i) => `${dot(HUES[LINES.indexOf(l) % 4])}<span>${l}</span>`)) })}
${option({ id: "D", name: "Bullets — as tested",
  desc: "Leave it: markdown’s list renders with disc markers, at whatever scale F2 gives it.",
  fits: "no change",
  why: "Free and honest markdown. But a bullet at 20px in a 304px cell takes a fifth of the line, and the hand-written cell was designed without them for that reason; at map zoom four dots read as noise beside the loud cell’s pattern.",
  demo: cellOf(ul("sc-lines--bullets")) })}
${option({ id: "E", name: "Numbered — a list says how many",
  desc: "Markdown’s ordered list, numbers in the mono voice, at the widget scale.",
  fits: "no component · one CSS rule",
  why: "Numbers earn their place when order matters — a roadmap, steps — and the platform has <code>Steps</code> for that. Interests are not ranked, and a number in front of “coffee, made badly” claims a precision the copy does not have (Patterns.md principle 8, honest counts).",
  demo: cellOf(ul("sc-lines--num")) })}
`;
