import { head, group, chip } from "../lib.mjs";

const PROOF = [
  ["The map at home", "/ against /fixtures/document, 1440 × 900", "1 %", "the minimap draws the hand-written full views; then the widget differences below, at map size"],
  ["Widgets at 1:1", "/fixtures/bento against the document’s six", "status 3 · work 3 · cases 3 · projects 2 · interests 9 · philosophy 9 %", "five findings, boards F1–F5; the loud cells are identical in all six"],
  ["Adapter issues on the document", "every node, prop, ref, box corner", "none", "the schema held; what differs is what the registry cannot yet say"],
];

const BOARDS = [
  ["F1", "A widget cell’s head", "A — CellHead fills its cell and spreads: label top, title bottom, the dot inline", "The diagonal is the cell’s rule; a component that groups the two defeats it. Every widget’s 3 % is mostly this."],
  ["F2", "The widget text scale", "A — Text gains size=\"widget\" (20/1.35, the scale a widget is read at)", "One more step on one existing control; the inspector’s Segmented gets a fourth option and nothing new is registered."],
  ["F3", "The loud cell’s word", "A — Figure gains kind=\"word\": the display face at 48, two lines, 24 characters", "The word is a figure that happens to be letters — same corner, same job (honest counts, or a word where nothing counts)."],
  ["F4", "Marking sample copy", "A — the host names sampled content keys; the adapter tags any node that read one", "site.ts already knows which slots the sample filled. Nobody types the tag, nobody forgets it, and it leaves with the sample."],
  ["F5", "A list inside a widget", "A — a Text list in a cell is unmarkered, at widget scale", "The four lines are one run of writing; a cell is not a document. One component, and F2 gives it the size."],
  ["S1", "A selected node on the canvas", "A — the accent ring the canvas already draws for focus, plus a name tag", "Selection and focus are one idea; a second ring would be a second idea. The tag says what, in the mono voice."],
  ["S2", "How a palette item lands", "A — drag from the palette; a ghost at default size snaps to box corners; the drop is the accent", "The grid is the whole promise of the editor (§6.3): the drop shows the boxes it will take before it takes them."],
  ["S3", "How autosave shows", "A — a dot and a few words in the header’s meta slot: saved · saving · unsaved · kept here · stale", "It sits where the header already says draft and saved 2 min ago (Tool template). Five states, one place, never a toast."],
  ["S4", "The inspector with none or several selected", "A — none: the document’s own props; several: the shared props, mixed values shown as mixed", "The inspector always has a subject. With none it is the document; with several it is what they share."],
];

export const title = "Editor screen — read first";
export const block = "design";
export const body = `
${head({ eyebrow: "no origins · the editor · step 3 · 2026-09-14", title: "Nine decisions before the editor screen", lead: "Step 2 wrote the portfolio as a document and rendered it beside the hand-written scene (Scene-Schema.md §10). The map matched to 1 %; the widgets did not, and every difference was a place the registry cannot yet say what the hand-written composition says — five findings, boards F1–F5. Step 3 is the editor screen itself, and four of its questions were left open for boards — S1–S4. Each board shows five directions with a recommendation; pick by letter, add notes, and each pick becomes a rule in Admin.md §6.5c before code." })}
${group("What step 2 proved", "Playwright’s comparator, the hand-written render as the baseline on every run, the blob masked.")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight"><table class="rv-table"><tr><th>compared</th><th>how</th><th>ratio</th><th>what the pixels are</th></tr>${PROOF.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>
<p class="rv-cap" style="margin-top:12px">Section routes were not compared: /work opens the hand-written full view, and a document has no full views — they are pages (Design-System.md §8.4), which the adapter returns and nothing mounts yet.</p></div></section>
${group("Nine boards", "My recommendation on each; your pick and notes outrank it. F is a finding from the proof, S is a screen question from the handoff.")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight"><table class="rv-table"><tr><th>board</th><th>question</th><th>recommendation</th><th>why</th></tr>${BOARDS.map(([id, q, rec, why]) => `<tr><td>${chip(id, id.startsWith("F") ? "peach" : "lavender")}</td><td>${q}</td><td>${rec}</td><td>${why}</td></tr>`).join("")}</table></div></section>
${group("What happens after the picks", "In this order: F1–F5 land in the package and the registry, and the comparison thresholds in e2e/document.spec.ts drop to what they then measure; the picks are written into Admin.md §6.5c; then the editor screen at /projects/portfolio/edit — palette, canvas, inspector, outline, autosave — composes the ToolScreen sidebar, the inspector controls and the adapter, with S1–S4 as its rules; full views as pages come with it.")}
`;
