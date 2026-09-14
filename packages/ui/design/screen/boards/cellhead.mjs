import { head, group, option, bento, cell, cellhead, lbl, ttl, SCREEN_CSS } from "../lib.mjs";

// Four cells beside a loud one, as the Work widget has them, drawn five ways. The hand-written version is the
// reference: `<p class="noo-label">` and `<p class="noo-bento__title">` as two direct children of the cell, which
// the cell spreads apart — label top-left, title bottom-left, the dot inline in the title's first line.
const four = (headFn) =>
  bento(
    [cell(headFn("now", "Radise", "peach")), cell(headFn("before", "Dataflix", "green")), cell(headFn("one year", "Hashnode", "blue")), cell(headFn("two years", "Terrible Tiny Tales", "pink"))].join(""),
    { cols: 2, hue: "peach", label: "Four roles" },
  );
const written = (l, t, d) => lbl(l) + ttl(t, d);

export const title = "F1 · A widget cell’s head";
export const block = "design";
export const body = `<style>${SCREEN_CSS}</style>
${head({ eyebrow: "the editor · finding F1 of 5 · pick one by its letter", title: "A widget cell’s head", lead: "A bento cell is a column that pushes its children apart, so a hand-written cell puts the mono label top-left and the title bottom-left — the diagonal Design-System.md §8.3 asks for. <code>CellHead</code> wraps both in one block at the top, and sets the dot beside a wrapped title instead of inline in its first line. Every widget’s 3 % in the proof is mostly this. Below: the same four Work cells, five ways, at 1:1." })}
${group("The reference", "content/sections.tsx today — two paragraphs as direct children of the cell. This is what the document should reproduce.")}
<div class="rv-demo rv-demo--tight">${four(written)}</div>
${group("Five directions", "Each drawn with the package’s cell; only the head changes.")}
${option({ id: "A", name: "CellHead fills its cell and spreads", rec: true,
  desc: "<code>CellHead</code> takes the cell’s height (<code>flex: 1</code>) and pushes its two parts apart, so the label sits at the top and the title at the bottom; the dot goes inline in the title’s first line, so a three-line title reads as text with a mark, not as a mark beside a block.",
  fits: "one CSS change · no prop · every existing CellHead moves to the diagonal",
  why: "A component that composes two things should compose them the way the cell would have. The diagonal is the cell’s rule (§8.3), and this puts it back without the author knowing it was ever gone. Cost: a CellHead placed in a page cell (rows that grow) spreads too — a page cell is <code>justify-content: flex-start</code>, so it collapses back to a block there, which is right.",
  demo: four((l, t, d) => cellhead(l, t, d, "sc-cellhead--fill")) })}
${option({ id: "B", name: "As built — the head is one block at the top",
  desc: "Keep <code>CellHead</code> as it is: label over title, both at the top, the dot beside the title as a flex row.",
  fits: "no change · the hand-written widgets move to it instead",
  why: "Honest about what a composed head is, and simpler to reason about in a page cell. But it gives up the diagonal, which is the one thing the six widgets share at map size — from 0.27 the label-top, title-bottom shape is what tells a cell from a paragraph. The 3 % is what this costs.",
  demo: four((l, t, d) => cellhead(l, t, d)) })}
${option({ id: "C", name: "No CellHead — two slot children",
  desc: "The document places a <code>Label</code> and a title as two children of the cell, and the cell spreads them. <code>CellHead</code> is retired; the title needs a component at the widget scale (board F2 or F3’s question again).",
  fits: "two nodes per cell · the outline shows both · no composite",
  why: "It is exactly the hand-written markup, so it matches by construction. But it makes every cell head two nodes in the outline and two drags in the palette, and Scene-Schema.md §9.3 ⑨ registered CellHead precisely so that authoring a cell is one node, not four.",
  demo: four(written) })}
${option({ id: "D", name: "Inverted — title top, label bottom",
  desc: "The head spreads, but the other way up: the title reads first, the mono label sits at the foot of the cell as a caption.",
  fits: "one CSS change · a different diagonal",
  why: "A caption under a title is the page’s shape (SectionHeader: label, then title). In a widget the eyebrow is what you read from a distance and the title is what you read when you arrive, and the loud cell already puts its word at the top — so the quiet cells would contradict it.",
  demo: four((l, t, d) => cellhead(l, t, d, "sc-cellhead--rev")) })}
${option({ id: "E", name: "Centred — the head floats mid-cell",
  desc: "Label over title as one block, vertically centred in the cell.",
  fits: "one CSS change",
  why: "Reads well in a single cell and badly beside the loud one: the loud cell’s label is at the top and its figure at the bottom, so a centred head beside it sits on neither line. A widget is one grid, and its cells agree on where things are.",
  demo: four((l, t, d) => cellhead(l, t, d, "sc-cellhead--mid")) })}
`;
