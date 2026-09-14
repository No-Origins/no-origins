import { head, group, option, bento, cell, cellhead, lbl, fig, text, SCREEN_CSS } from "../lib.mjs";

const LINE = "Pick the path that fits; none of them needs an agenda.";
const status = (textCell) =>
  bento(
    [
      cell(lbl("status") + fig("4", "ways in"), { span: [2, 2], tone: "fill", pat: "status" }),
      cell(cellhead("hiring", "Recognise the work", undefined, "sc-cellhead--fill")),
      cell(cellhead("collaborating", "Bring an idea", undefined, "sc-cellhead--fill")),
      cell(cellhead("following", "Watch it land", undefined, "sc-cellhead--fill")),
      cell(cellhead("saying hi", "No agenda", undefined, "sc-cellhead--fill")),
      cell(textCell, { span: [4, 1] }),
    ].join(""),
    { hue: "blue", label: "Current status" },
  );

export const title = "F2 · The widget text scale";
export const block = "design";
export const body = `<style>${SCREEN_CSS}</style>
${head({ eyebrow: "the editor · finding F2 of 5 · pick one by its letter", title: "The widget text scale", lead: "A widget is read from about twice the distance of a document, so its type is roughly double (§8.3): <code>--t-widget-text</code> is 20/1.35 and the hand-written cells use it as <code>.noo-bento__text</code>. No registered component renders that size — <code>Text size='small'</code> is the document’s 15 and visibly smaller. Status, cases, projects and both glass cells show it. Below: the Status widget’s last row, five ways." })}
${group("Five directions", "The bottom row is the one that changes; the rest is the widget as the document already renders it (with F1 A applied to the heads).")}
${option({ id: "A", name: "Text gains size='widget'", rec: true,
  desc: "A fourth step on the one prose component: <code>lead · body · small · widget</code>, where widget is <code>--t-widget-text</code>. The registry’s enum grows by one; the inspector’s Segmented shows four options, which is its limit.",
  fits: "one enum value · Text stays the only prose · F5 inherits it",
  why: "The prose component already carries the scale; the widget’s step was simply missing from it. Nothing new to register, nothing new to name, and a list in a cell (board F5) gets its size from the same prop. Cost: an author can put widget-size text in a page panel — which is also what a Heading can do, and the inspector shows the size live.",
  demo: status(text(LINE, "sc-tw")) })}
${option({ id: "B", name: "The cell sets the scale — no prop at all",
  desc: "Context, not a value: inside <code>.noo-bento__cell</code>, <code>Text</code>’s sizes remap (small → widget-text, body → widget-title). The document says <code>size: small</code> and the cell makes it 20.",
  fits: "CSS only · the same node reads right in a cell and in a panel",
  why: "Elegant, and invisible: the inspector says small and the canvas shows 20, so the author cannot tell what they are choosing. A remap is also a second scale nobody can read off the tokens. Rejected for the same reason the tiers were retired — a trick standing in for a design.",
  demo: status(text(LINE, "sc-tw")) })}
${option({ id: "C", name: "CellHead gains a line",
  desc: "Widget prose only ever sits under a head, so <code>CellHead</code> takes an optional <code>line</code> (text, ≤ 120) at the widget scale under its title.",
  fits: "one prop on one composite · no free-standing text in a cell",
  why: "True for the Status row — but the through-line row has a label, then chips, and the Projects row has a label and a line with no title. A line that can only follow a title makes those two cells unauthorable again, which is how the ten new components came to exist (§9.3 ⑨).",
  demo: status(cellhead("the path", "Pick what fits", undefined, "sc-cellhead--fill").replace("</div>", `${text("None of them needs an agenda.", "sc-tw")}</div>`)) })}
${option({ id: "D", name: "A BentoText component",
  desc: "A slot-only component for a widget’s prose: markdown at <code>--t-widget-text</code>, nothing else. The registry grows by one, kind <code>slot</code>.",
  fits: "one new entry · names the thing exactly",
  why: "Names exactly what it is, and that is also the problem: two prose components with one prop between them. The palette gets longer for a size, and every future scale step would ask for its own component.",
  demo: status(text(LINE, "sc-tw")) })}
${option({ id: "E", name: "Keep small — and quieten the hand-written widgets",
  desc: "Leave <code>Text</code> as it is and move content/sections.tsx to <code>size='small'</code>, so the two match by making the widgets quieter.",
  fits: "no package change · the live portfolio changes",
  why: "Matches the document to the code by changing the design, not the library, and it is the design that was measured: 20 was chosen so a line reads at map zoom. It also touches what a visitor sees, which steps 1–6 promised not to.",
  demo: status(text(LINE, "noo-body-sm")) })}
`;
