import fs from "node:fs";
import { head, group, HUES } from "../lib.mjs";

// The eighteen, as the package draws them: `patterns.json` is the real SVG the generator produced on
// /fixtures/inspector (extracted with Playwright), so this board shows what ships and not a stand-in.
const ITEMS = JSON.parse(fs.readFileSync(new URL("../patterns.json", import.meta.url), "utf8"));
const NOTES = {
  status: "curl alone — a wide sweep, measured for the status widget",
  work: "taper — the family opens out along its travel",
  cases: "pinch — a waist mid-travel",
  projects: "no device, the widest breath — absence said by geometry",
  interests: "curl and tempo at half — the one that travels horizontally",
  philosophy: "high drift and spread — no two undulations agree",
  sweep: "curl at the top, nothing else — one long turn",
  fan: "full taper with a little curl — gathers at one edge, opens at the other",
  waist: "pinch in — squeezes through the middle and flares at both ends",
  bloom: "pinch out — flares in the middle and gathers at both ends",
  quicken: "tempo — calm at one edge, quick at the other",
  tide: "near-horizontal, a long curl, a slow change of pace",
  hush: "the widest breath and the least drift — a few lines, far apart",
  lean: "forty-five degrees and a tight breath — an angle costs lines, breath buys them back",
  swell: "spread at the top — the rhythm does all the work",
  ridge: "drift at the top with three waves — every line its own crest",
  gather: "taper and a pinch — the family closes toward one corner",
  arc: "curl at the top with a taper — a fan of arcs",
};
const CSS = `
.pt-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 24px 16px; }
.pt-tile { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.pt-pic { position: relative; aspect-ratio: 1; border-radius: var(--r-lg); background: var(--hue); color: var(--hue-ink); overflow: hidden; box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--ink) 8%, transparent); }
.pt-pic > .noo-ill { position: absolute; inset: 0; width: 100%; height: 100%; }
.pt-name { font: 500 var(--t-label)/1 var(--ff-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink); }
.pt-name small { font: inherit; text-transform: none; letter-spacing: 0; color: var(--muted); margin-left: 6px; }
.pt-note { font: 400 var(--t-caption)/1.4 var(--ff-sans); color: var(--muted); }
.pt-row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 16px; }
.pt-row .pt-pic { aspect-ratio: 4 / 3; }
`;
const bare = (svg) => svg.replace(/ data-hue="[^"]*"/, "");
const tile = ({ name, svg }, i) => `<div class="pt-tile"><span class="pt-pic" data-hue="peach">${bare(svg)}</span><span class="pt-name">${name}${i < 6 ? "<small>measured</small>" : ""}</span><span class="pt-note">${NOTES[name] ?? ""}</span></div>`;
const fan = ITEMS.find((p) => p.name === "fan") ?? ITEMS[0];

export const title = "Patterns — the eighteen";
export const block = "design";
export const body = `<style>${CSS}</style>
${head({ eyebrow: "the editor · patterns · built 2026-09-14 · from your two notes", title: "The eighteen", lead: "Six measured for the portfolio widgets and twelve named for what shapes them — all drawn by the one generator (Patterns.md §6.0b), here as the package renders them, in peach. Any of these can be replaced by a studio round; a nineteenth is made in the picker with <em>New pattern</em> and saved to the document." })}
${group("Eighteen, in peach", "The first six carry the words their widgets were measured for; the twelve carry none — the editor measures a cell's words where the pattern lands.")}
<div class="pt-grid">${ITEMS.map(tile).join("")}</div>
${group("One pattern, seven hues", "fan across the family hues. The line takes its contrast from the hue's own ink, so it reads on every tile in both themes — the fix the first fixture needed in dark.")}
<div class="pt-row">${HUES.map((h) => `<div class="pt-tile"><span class="pt-pic" data-hue="${h}">${bare(fan.svg)}</span><span class="pt-name">${h}</span></div>`).join("")}</div>
`;
