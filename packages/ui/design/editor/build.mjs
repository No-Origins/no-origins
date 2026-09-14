// Assembles the editor's option boards into .dc.html artboards. `node build.mjs`
import fs from "node:fs";
import { page, OPTION_CSS } from "./lib.mjs";
import * as main from "./boards/main.mjs";
import * as hue from "./boards/hue.mjs";
import * as illustration from "./boards/illustration.mjs";
import * as repeater from "./boards/repeater.mjs";
import * as tree from "./boards/tree.mjs";
import * as patterns from "./boards/patterns.mjs";

const boards = { Main: main, Hue: hue, Illustration: illustration, Repeater: repeater, Tree: tree, Patterns: patterns };
for (const [name, b] of Object.entries(boards)) {
  fs.writeFileSync(`${name}.dc.html`, page({ title: b.title, body: `<style>${OPTION_CSS}</style>\n${b.body}`, block: b.block }));
}
console.log("built", Object.keys(boards).join(", "));
