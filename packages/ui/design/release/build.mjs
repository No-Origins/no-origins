// Assembles the review boards into .dc.html artboards. Each board embeds the live package CSS, so re-running this
// after a token change re-renders every sample. `node build.mjs`.
import fs from "node:fs";
import { page, VERDICTS } from "./lib.mjs";
import * as tokens from "./boards/tokens.mjs";
import * as atoms from "./boards/atoms.mjs";
import * as molecules from "./boards/molecules.mjs";
import * as organisms from "./boards/organisms.mjs";
import * as templates from "./boards/templates.mjs";
import * as main from "./boards/main.mjs";
import * as icons from "./boards/icons.mjs";
import * as menu from "./boards/menu.mjs";

const boards = { Tokens: tokens, Atoms: atoms, Molecules: molecules, Organisms: organisms, Templates: templates };
const tallies = {};
for (const [name, b] of Object.entries(boards)) {
  const t = Object.fromEntries(VERDICTS.map((v) => [v, 0]));
  for (const m of b.body.matchAll(/rv-verdict"><span class="noo-chip"[^>]*><span class="noo-chip__dot"[^>]*><\/span>(\w+)<\/span>/g)) t[m[1]]++;
  tallies[name] = t;
  fs.writeFileSync(`${name}.dc.html`, page({ title: b.title, body: b.body, block: b.block }));
}
fs.writeFileSync("Main.dc.html", page({ title: main.title, body: main.body(tallies), block: main.block }));
for (const [name, b] of Object.entries({ Icons: icons, Menu: menu })) fs.writeFileSync(`${name}.dc.html`, page({ title: b.title, body: b.body, block: b.block }));
console.log(JSON.stringify(tallies));
