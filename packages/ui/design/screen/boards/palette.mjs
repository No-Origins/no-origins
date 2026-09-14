import { head, group, option, well, half, workWidget, cellhead, lbl, kbd, SCREEN_CSS } from "../lib.mjs";

const w = (l, t, d) => cellhead(l, t, d, "sc-cellhead--fill");
const ITEMS = ["Bento", "Card", "Text", "Intro", "BlockCard", "Placeholder"];
const palette = (on, drag) => `<div class="noo-glass noo-glass--1 sc-side">${lbl("palette · organisms")}<div class="sc-pal">${ITEMS.map((n) => `<div class="sc-pal__i${n === on ? " sc-pal__i--on" : ""}${n === drag ? " sc-pal__i--drag" : ""}"><span class="sc-pal__glyph"></span>${n}</div>`).join("")}</div></div>`;
const ghost = (x, y, wd, h, text) => `<div class="sc-ghost" style="left:${x}px;top:${y}px;width:${wd}px;height:${h}px">${text}</div>`;
const boxes = (x, y, wd, h) => `<div class="sc-boxes" style="left:${x}px;top:${y}px;width:${wd}px;height:${h}px"></div>`;
const scene = (extra = "", h = 340) => well(half(60, 60, workWidget(w)) + extra, { h });

export const title = "S2 · How a palette item lands";
export const block = "design";
export const body = `<style>${SCREEN_CSS}</style>
${head({ eyebrow: "the editor · screen question S2 of 4 · pick one by its letter", title: "How a palette item lands", lead: "The palette is the registry, grouped by layer, in the ToolScreen’s sidebar. Admin.md §6.1 says “drag onto the canvas, or select a node and press a key”, and §6.3 says the editor enforces the grid: a widget lands on box corners, a panel is placed freely. What is open is the gesture — how a thing goes from the list to the canvas, and what the author sees on the way. Below: the Work widget at half zoom, a second Bento arriving." })}
${group("Five directions", "The sidebar’s palette on the left, the canvas on the right; the grid’s boxes are 80px here (160 at 1:1).")}
${option({ id: "A", name: "Drag; a ghost snaps to box corners; the boxes it will take light up", rec: true,
  desc: `Drag an item off the palette. A ghost at the component’s default size (a Bento: 4 × 3) follows the pointer and snaps to box corners; the boxes under it wash in the accent, the drop indicator’s colour. Release places it, selected, with the inspector open on its defaults. ${kbd("Esc")} cancels; a held ${kbd("⌥")} places freely (§1.1).`,
  fits: "one gesture · the grid is visible before the drop · panels and widgets differ only in the snap",
  why: "The grid is the editor’s whole promise (§6.3), and this shows the promise being kept before the drop rather than after: the author sees the four boxes it will take, and that they do not touch the neighbour. The ghost is the same shape the Tree and the Repeater use for a drop — the one indicator, extended to two dimensions.",
  demo: `<div class="rv-col">${palette(undefined, "Bento")}${scene(boxes(420, 60, 320, 240) + ghost(420, 60, 320, 240, "bento · 4 × 3<br>drop"), 340)}</div>` })}
${option({ id: "B", name: "Click to place at the centre, then drag it",
  desc: "Click an item; it lands at the viewport’s centre, snapped to the nearest box corner, selected; then it is dragged like any node.",
  fits: "one click · no drag across two regions",
  why: "The simplest gesture and the most common second step: almost every placement is followed by a move, because the centre is rarely where it goes. It also lands on whatever is already at the centre; the editor must then either overlap (forbidden, §6 rule 7) or search for a free spot, which is a guess.",
  demo: `<div class="rv-col">${palette("Bento")}${scene(boxes(420, 60, 320, 240) + ghost(420, 60, 320, 240, "landed · centre<br>now drag"), 340)}</div>` })}
${option({ id: "C", name: "Select a node, then click an item: it lands beside it",
  desc: "With a node selected, clicking a palette item inserts the new one after it in reading order — into the same slot for a block, one empty box to the right for a canvas node.",
  fits: "keyboard-friendly · reading order set by insertion",
  why: "Right inside a slot, where “after the selected one” is exactly what an author means, and the outline and the palette agree. On the canvas “beside” is a guess in two dimensions — right? below? — and the ring has six widgets whose neighbours are all one box away already.",
  demo: `<div class="rv-col">${palette("Bento")}${scene(`<div class="sc-sel" style="position:absolute;left:60px;top:60px;width:320px;height:240px"></div>` + boxes(460, 60, 320, 240) + ghost(460, 60, 320, 240, "after · work"), 340)}</div>` })}
${option({ id: "D", name: "A command palette: type the name, Enter places it",
  desc: `${kbd("/")} opens a list over the canvas; typing filters the registry; ${kbd("↵")} places the match at the selection (or the viewport centre) and opens the inspector. The sidebar’s palette stays for browsing.`,
  fits: "keyboard first (Admin.md §6.3: every action has a key) · fast for someone who knows the names",
  why: "Admin.md §6.1 asks for exactly this as the second path — “select a node and press a key” — and it is the fastest way to place the fortieth Text. It is not the first path: a palette you cannot see is not a palette, and the point of the registry is that it grows. Recommended as the companion to A, not instead of it.",
  demo: `<div class="rv-row rv-row--start">${scene(`<div class="noo-glass noo-glass--3 sc-cmd" style="position:absolute;left:100px;top:40px"><div class="sc-cmd__in"><span>/</span><span>ben</span><span style="opacity:.35">|</span></div><div class="sc-pal"><div class="sc-pal__i sc-pal__i--on">Bento <small>organism · widget, page</small></div><div class="sc-pal__i">BentoCell <small>organism · slot</small></div></div></div>`, 340)}</div>` })}
${option({ id: "E", name: "Draw a box first, then choose what fills it",
  desc: "Drag on empty grid to draw a box, snapped to boxes; release, and the palette opens filtered to what fits that size and kind.",
  fits: "size first · fits are honest",
  why: "A drawing tool’s gesture, and the wrong order for a registry: a Bento has one size, a panel has a width and a measured height, and a page cell has no size at all. Drawing a box then discovering nothing fits it is the failure this would teach on the first try.",
  demo: `<div class="rv-row rv-row--start">${scene(ghost(420, 60, 240, 160, "3 × 2<br>nothing fits: a widget is 4 × 3"), 340)}</div>` })}
`;
