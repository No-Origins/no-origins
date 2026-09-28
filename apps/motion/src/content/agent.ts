import type { Family, Token, Values } from "./families";
const tokens: Token[] = [];
const defaults: Values = {};
function number(key: string, label: string, group: string, value: number, min: number, max: number, step: number, touches: string, kind: Token["kind"] = "scale") {
  const name = `--motion-agent-${key}` as const;
  const unit: Token["unit"] = key.endsWith("rotation") || key === "rock" ? "degrees" : key === "waves" ? "count" : key.endsWith("grow") ? "multiplier" : /-(x|y|dx|dy)$/.test(key) || key === "lift" || key === "sway" ? "cells" : undefined;
  tokens.push({ name, label, group, min, max, step, touches, kind, unit, half: true }); defaults[name] = value;
}
function choice(key: string, label: string, group: string, choices: string[]) {
  const name = `--motion-agent-${key}` as const;
  tokens.push({ name, label, group, touches: "", kind: "choice", half: true, choices: choices.map(value => ({value, label: value})) }); defaults[name] = choices[0]!;
}
choice("colour", "Colour", "Body", ["violet", "lime", "neutral"]);
number("opacity", "Opacity", "Body", 1, 0, 1, .05, "Whole character");
for (const phase of ["start", "end"]) {
 const group = phase === "start" ? "Start pose" : "End pose";
 number(`${phase}-x`, "Horizontal", group, 0, -2, 2, .05, "Cells from centre");
 number(`${phase}-y`, "Vertical", group, 0, -2, 2, .05, "Cells down from centre");
 number(`${phase}-rotation`, "Rotation", group, 0, -180, 180, 5, "Degrees");
}
number("lift", "Lift", "Path", 0, -1.5, 1.5, .05, "Cells above the path");
number("sway", "Sway", "Path", 0, -1, 1, .05, "Cells across the path");
number("waves", "Waves", "Path", 1, 1, 6, 1, "Sway cycles per gesture");
number("rock", "Rock", "Path", 0, -90, 90, 5, "Rotation during travel");
for (const side of ["left", "right"]) {
 const group = side === "left" ? "Left eye" : "Right eye";
 number(`${side}-size`, "Eye size", group, .16, .02, .5, .01, "Diameter / cell height");
 number(`${side}-x`, "Eye horizontal", group, side === "left" ? -.5 : .5, -.75, .75, .025, "Cells from body centre");
 number(`${side}-y`, "Eye vertical", group, 0, -.3, .3, .025, "Cells from body centre");
 number(`${side}-dx`, "Look horizontal", group, 0, -.3, .3, .025, "Travel to end pose");
 number(`${side}-dy`, "Look vertical", group, 0, -.3, .3, .025, "Travel to end pose");
 number(`${side}-grow`, "End size", group, 1, .25, 2, .05, "Size multiplier at end");
}
number("blink-depth", "Blink depth", "Blink", 0, 0, 1, .05, "Circular shrink to closed");
number("blink-at", "Blink position", "Blink", .5, .1, .9, .05, "Within each gesture");
number("blink-width", "Blink length", "Blink", .2, .05, .5, .025, "Share of gesture");
number("blink-offset", "Eye delay", "Blink", 0, -.3, .3, .025, "Right eye timing offset");
number("duration", "Outward", "Timing", 700, 100, 4000, 50, "Travel to end pose", "ms");
number("return", "Return", "Timing", 700, 100, 4000, 50, "Travel to start pose", "ms");
number("delay", "Delay", "Timing", 0, 0, 3000, 50, "Before each play", "ms");
choice("ease", "Outward ease", "Timing", ["smooth", "linear", "in", "out", "back"]);
choice("return-ease", "Return ease", "Timing", ["smooth", "linear", "in", "out", "back"]);
export const AGENT_GROUPS = [...new Set(tokens.map(t => t.group!))];
export const AGENT_FAMILY: Family = {
 id: "agent", label: "Agent", title: "Your personal guide", touches: "Author your own character movement.",
 hint: "Set the poses and path, then Play.", block: { columns: 2, rows: 1, max: 2 }, tokens,
 presets: [{id: "A", name: "Blank", why: "Your starting canvas.", risk: "", values: defaults}],
};
