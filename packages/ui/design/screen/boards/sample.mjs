import { head, group, option, bento, cell, lbl, insp, tag, tree, trow, chip, SCREEN_CSS } from "../lib.mjs";

const LINES = ["How editors decide what a document <em>is</em>", "Type on screen, and the parts of it nobody notices", "Small tools that do one thing without asking permission", "Maps, and why a good one is mostly what it leaves out"];
const lines = (pre = "") => `<ul class="sc-lines sc-tw">${LINES.map((l, i) => `<li>${i === 0 ? pre : ""}${l}</li>`).join("")}</ul>`;
const cellOf = (inner) => bento(cell(inner, { span: [2, 2] }), { cols: 2, hue: "yellow", label: "Interests" });

export const title = "F4 · Marking sample copy";
export const block = "design";
export const body = `<style>${SCREEN_CSS}</style>
${head({ eyebrow: "the editor · finding F4 of 5 · pick one by its letter", title: "Marking sample copy", lead: "Five sections still run on sample copy, and every panel drawn from it wears a <em>sample copy</em> tag so nobody mistakes scaffolding for writing (Design-System.md §13). <code>site.ts</code> knows exactly which slots the sample filled. The document has nowhere to carry that — Scene-Schema.md §3.4 says the tag is a field on the content record, and nothing renders one — so the document version of Interests and Philosophy is silently unmarked. Until this is decided a document must not carry sampled copy." })}
${group("Five directions", "The Interests cell whose four lines are sample copy today, and what marks them.")}
${option({ id: "A", name: "The host names the sampled keys; the adapter tags what read them", rec: true,
  desc: "<code>DocumentContext</code> gains <code>sampled: (path) => boolean</code> — the <code>sampled()</code> that site.ts already exports. Any node whose props resolved a ref into a sampled key renders the tag as its first child; the inspector says which ref, and the outline marks the row.",
  fits: "no document field · no authoring · leaves with the sample",
  why: "The knowledge already exists in exactly one place and this reads it there. Nobody types the tag, nobody forgets it, and the day a real value fills the slot the tag is gone from every node that read it, with no document edit. It also keeps sample copy out of documents proper: a document that inlines sample text cannot be tagged, and the adapter warns.",
  demo: `<div class="rv-row rv-row--start">${cellOf(tag() + lines())}${insp([["Text", "reads site.interests · <b style='color:var(--warn)'>sample</b>", `<p class="sc-note">Four lines from a sampled slot. The tag is drawn by the adapter and goes when the slot is filled.</p>`]])}</div>` })}
${option({ id: "B", name: "A draft flag on the node",
  desc: "The document schema gains <code>draft: true</code> on any node; the adapter renders the tag. The author sets it.",
  fits: "one boolean · a Checkbox in the inspector",
  why: "Simple, and it puts the honesty of the interface in the hands of the person most likely to forget it. §3.4 was written against exactly this: <em>“the sample copy tag is a field on the content record, not something an author remembers to type.”</em> A tag someone remembers is a tag someone will not.",
  demo: cellOf(tag() + lines()) })}
${option({ id: "C", name: "A Tag component the author places",
  desc: "<code>Placeholder</code>’s tag becomes its own slot component, <code>Tag</code> (text ≤ 16), placed like any block.",
  fits: "one new entry · visible in the outline",
  why: "The most explicit: the tag is a node, so it shows in the outline and can be moved or removed. But it is copy pretending to be structure — the tag is not part of the composition, it is a fact about the words — and the same forgetting applies as in B.",
  demo: cellOf(tag() + lines()) })}
${option({ id: "D", name: "Editor-only — never on the live site",
  desc: "The tag shows in the editor (a chip on the outline row, a wash on the canvas node) and is not rendered by the live route at all.",
  fits: "no live markup · the author sees it, the visitor does not",
  why: "Clean for the visitor, and the wrong way round: the tag exists so that a <em>visitor</em> never takes sample copy for Bhargav’s words (Brand.md §9, Design-System.md §13). Hiding it from them removes the reason it exists.",
  demo: `<div class="rv-row rv-row--start">${cellOf(lines())}<div class="noo-glass noo-glass--1 sc-side">${lbl("outline")}${tree(trow("Interests", { caret: "⌄" }) + `<ul class="sc-tree__group">${trow("Widget", { on: true, caret: "" , trailing: chip("sample", "yellow") })}</ul></li>`)}</div></div>` })}
${option({ id: "E", name: "The words carry the mark — as sample.ts does today",
  desc: "Sampled copy begins with “Sample copy. ”; the renderer strips the prefix and draws the tag.",
  fits: "no schema change · the convention already exists",
  why: "It is how the prose slots work now, and it stops at prose: a list, a location, an email cannot begin with a sentence. A marker inside the value is also invisible to validation — a stray prefix is a bug, a missing one is silence.",
  demo: cellOf(tag() + lines("<span style='color:var(--muted)'>Sample copy. </span>")) })}
`;
