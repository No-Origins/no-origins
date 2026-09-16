// Assembles the editor-screen boards (step 3) into .dc.html artboards. `node build.mjs`
import fs from "node:fs";
import { page, OPTION_CSS } from "./lib.mjs";
import * as main from "./boards/main.mjs";
import * as cellhead from "./boards/cellhead.mjs";
import * as widgettext from "./boards/widgettext.mjs";
import * as word from "./boards/word.mjs";
import * as sample from "./boards/sample.mjs";
import * as list from "./boards/list.mjs";
import * as selected from "./boards/selected.mjs";
import * as palette from "./boards/palette.mjs";
import * as autosave from "./boards/autosave.mjs";
import * as inspector from "./boards/inspector.mjs";

const boards = { Main: main, CellHead: cellhead, WidgetText: widgettext, Word: word, Sample: sample, List: list, Selected: selected, Palette: palette, Autosave: autosave, Inspector: inspector };
for (const [name, b] of Object.entries(boards)) {
  fs.writeFileSync(`${name}.dc.html`, page({ title: b.title, body: `<style>${OPTION_CSS}</style>\n${b.body}`, block: b.block }));
}
console.log("built", Object.keys(boards).join(", "));
