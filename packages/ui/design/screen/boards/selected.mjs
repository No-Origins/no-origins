import { head, group, option, well, half, workWidget, cellhead, dot, insp, SCREEN_CSS } from "../lib.mjs";

// The Work widget at half zoom (0.5) on the grid, so a 640 × 480 widget is a 320 × 240 box — the map at reading
// distance. `sel` decorates the wrapper around the scaled widget.
const w = (l, t, d) => cellhead(l, t, d, "sc-cellhead--fill");
const node = (cls = "", extra = "", after = "") => half(60, 60, workWidget(w), cls, extra) + after;
const box = (x, y, wd, h, cls = "", inner = "") => `<div class="${cls}" style="position:absolute;left:${x}px;top:${y}px;width:${wd}px;height:${h}px">${inner}</div>`;

export const title = "S1 · A selected node on the canvas";
export const block = "design";
export const body = `<style>${SCREEN_CSS}</style>
${head({ eyebrow: "the editor · screen question S1 of 4 · pick one by its letter", title: "A selected node on the canvas", lead: "Click a node and it is selected: the inspector shows its props, the outline marks its row, Delete removes it. The canvas has to say so without changing how the node renders (Admin.md §6.1: “nothing that changes how a node renders”). The canvas already draws one ring — 2px accent, 4px offset — for keyboard focus on a widget. Below: the Work widget on the grid at half zoom, selected five ways." })}
${group("Five directions", "The same widget, the same grid; only the selection differs.")}
${option({ id: "A", name: "The focus ring, plus a name tag", rec: true,
  desc: "Selection wears exactly the ring focus wears — 2px accent at 4px offset — and a tag sits above its top-left corner: the node’s kind and name in the mono voice, with its hue dot. Hover shows a 1px hairline; a full view’s page shows the same ring on its cell.",
  fits: "one ring the canvas has · a tag the Repeater’s count already uses",
  why: "Selection and focus are one idea on a canvas — the thing the keyboard would act on — so they should be one ring; a second colour would be a second idea to learn. The tag answers the question a ring cannot: what is this. Cost: on a tiny node at map zoom the tag is bigger than the node, so it hides below 0.4.",
  demo: well(box(60, 60, 320, 240, "sc-sel", `<span class="sc-tag">${dot("peach")}widget · work</span>`) + node()) })}
${option({ id: "B", name: "An ink ring with corner handles",
  desc: "A 2px ink ring and four square handles at the corners, the shape every drawing tool uses for a selected object.",
  fits: "familiar · handles promise resizing",
  why: "Handles say “drag me to resize” and a widget cannot be resized — it is 4 × 3 by rule (§6.3) — and a panel resizes in width only. A promise the canvas cannot keep is worse than no promise; and ink competes with the ink pills the menu node wears.",
  demo: well(box(60, 60, 320, 240, "sc-sel sc-sel--ink", [[-9, -9], [316, -9], [-9, 236], [316, 236]].map(([x, y]) => `<span class="sc-handle" style="left:${x}px;top:${y}px"></span>`).join("")) + node()) })}
${option({ id: "C", name: "A floating toolbar above the node",
  desc: "The ring, and a small glass bar above the node: its name, its hue dot, duplicate and delete.",
  fits: "actions at hand · one more surface",
  why: "Puts two actions where the pointer is, at the cost of a second inspector floating over the canvas. Everything on the bar is already in the inspector or on a key (⌘D, Delete); a canvas that grows chrome around every click stops being a canvas. Kept as the shape a contextual menu could take later.",
  demo: well(box(60, 60, 320, 240, "sc-sel", `<div class="noo-glass noo-glass--2 sc-bar" style="left:0;top:-46px"><span class="sc-bar__b">${dot("peach")}&nbsp;Work experience</span><span class="sc-bar__b">Duplicate</span><span class="sc-bar__b">Delete</span></div>`) + node()) })}
${option({ id: "D", name: "Everything else fades",
  desc: "The selected node stays; the rest of the canvas drops to 12 % — the focus-mode mechanism the ring already has for an open section.",
  fits: "existing mechanism · unmistakable",
  why: "Unmistakable, and it takes away the one thing an editor needs while placing: the neighbours. You select a widget to move it a box to the left of the one beside it, and the one beside it has just vanished. Focus mode is for reading; editing is about relations.",
  demo: well(box(60, 60, 320, 240, "sc-sel") + node() + half(420, 60, workWidget(w), "sc-faded") + half(420, 340, workWidget(w), "sc-faded"), { h: 340 }) })}
${option({ id: "E", name: "The outline carries it; the canvas shows a hairline",
  desc: "The selected row in the outline is the marker; on the canvas the node gets a 1px hairline only.",
  fits: "quiet canvas · the outline is the truth",
  why: "The canvas stays clean, and the author’s eye is on the canvas, not the outline — at map zoom a hairline around one of thirty nodes is invisible. The outline should agree with the canvas, not replace it.",
  demo: `<div class="rv-row rv-row--start">${well(box(60, 60, 320, 240, "sc-sel sc-sel--hair") + node(), { w: 460 })}${insp([["Outline", "", `<ul class="sc-tree"><li><div class="sc-tree__row"><span class="sc-tree__caret">⌄</span><span>Work</span></div><ul class="sc-tree__group"><li><div class="sc-tree__row sc-tree__row--on"><span class="sc-tree__caret"></span><span>Widget</span></div></li><li><div class="sc-tree__row"><span class="sc-tree__caret"></span><span>Full view</span></div></li></ul></li></ul>`]])}</div>` })}
`;
