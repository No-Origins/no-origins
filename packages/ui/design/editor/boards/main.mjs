import { head, group, chip } from "../lib.mjs";

const TYPES = [
  ["hue", "the seven-blob swatch row", "HueSwatch ✓ — seven dots, an ink ring, the name beside (E1 A)", "built"],
  ["text", "Field with the live count against max", "Field ✓ · the count is a caption to add", "built"],
  ["markdown", "text area with the ⌘K directive control", "Field multiline ✓ · the directive control comes with the renderer (step 6)", "built"],
  ["enum", "chip row, pressed on the selection", "Segmented ✓ up to four options, Select ✓ past four — replaces the chip row", "changed"],
  ["number", "Field, mono, units stated", "Field ✓ with a mono adornment for the unit", "built"],
  ["boolean", "Toggle", "Checkbox ✓ in a form; Toggle stays for a live switch (theme, grid)", "changed"],
  ["list", "reorderable rows of of, capped at max", "Repeater ✓ — rows on hairlines, or chips (E3 A + C)", "built"],
  ["object", "a labelled group of the above", "a fieldset of the above ✓", "built"],
  ["pattern (was illustration)", "the six named families, drawn", "PatternPicker ✓ — eighteen drawn in the node's hue, plus New pattern → PatternStudio (E2 A + notes)", "built"],
  ["blobSize", "the seven names, or a number", "Segmented ✓ of the names; a number is not authorable", "changed"],
  ["href", "Field plus an internal/external toggle", "Field ✓ + Segmented ✓ (view · page)", "built"],
  ["ref", "picker of the project’s content keys", "Select ✓ over the keys", "built"],
];
const STATE = { built: "green", changed: "yellow", open: "blue" };

const DECISIONS = [
  ["E1 · Hue swatch", "Board 1", "A — seven Dots, an ink ring on the chosen one, the name beside", "The Dot is already the system’s word for a hue; one row; the blob is the mark for an agent, not a swatch."],
  ["E2 · Illustration picker", "Board 2", "A — a grid of drawn thumbnails, named", "A picture is chosen by looking. Six fit in two rows; the canvas node is the live preview."],
  ["E3 · Repeater", "Board 3", "A — rows on hairlines, with C as the compact form for lists of short text", "One component, two densities; the rows reuse the inspector’s own controls; drag and Alt-arrows share the Outline’s rule."],
  ["E4 · Outline reordering", "Board 4", "A — Alt + arrows and drag, one drop line shared with the Repeater", "Recorded in Admin.md §6.5; here to confirm. Reading order must be fixable without a pointer."],
];

export const title = "Inspector controls";
export const block = "design";
export const body = `
${head({ eyebrow: "no origins · the editor · inspector controls · 2026-09-14", title: "Three controls, and a gesture", lead: "The release left the inspector one row short of complete. Scene-Schema.md §3.1 lists twelve prop types the inspector renders; nine map onto controls the package now has, three do not — hue, illustration and list — and the outline needs a way to reorder. Each of the four boards beside this one shows five directions, with a recommendation; pick by letter, add notes, and each pick becomes a rule in Admin.md §6.5 before any code." })}
${group("The twelve types, after the release", "What §3.1 said each type renders, and what renders it now. All twelve render now; the three this canvas decided are marked built (2026-09-14).")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight"><table class="rv-table"><tr><th>type</th><th>§3.1 said</th><th>now</th><th></th></tr>${TYPES.map(([t, was, now, st]) => `<tr><td><code>${t}</code></td><td>${was}</td><td>${now}</td><td>${chip(st, STATE[st])}</td></tr>`).join("")}</table>
<p class="rv-cap" style="margin-top:12px">Two things §3.1 said that the release overruled: enum is a Segmented or a Select, not a chip row — a pressed chip goes ink-on-ground and hides its hue; boolean is a Checkbox in a form, because a Toggle promises an immediate effect and a form field does not have one until save.</p></div></section>
${group("Four decisions", "My recommendation on each; your pick and notes outrank it.")}
<section class="rv-item rv-item--wide" style="border-top:0;padding-top:20px"><div class="rv-demo rv-demo--tight"><table class="rv-table"><tr><th>decision</th><th>where</th><th>recommendation</th><th>why</th></tr>${DECISIONS.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div></section>
${group("What happens after the picks", "In this order, all in the package: HueSwatch, IllustrationPicker and Repeater as molecules, registered; Tree gains reordering; ToolScreen gains its left sidebar; then the editor screen at /projects/portfolio/edit composes them.")}
`;
