import { head, group, item, chip, ico, wordmark, blob } from "../lib.mjs";

/* The Menu drawn in our tokens: glass-2 column, radius xl, 44px pill items, the current item ink-on-ground (the
   primary button’s material), children on a 1px rule, section eyebrows as Label with a count. */
const MENU_CSS = `
.mn { --mn-w: 280px; display:flex; flex-direction:column; gap:8px; width:var(--mn-w); padding:12px; box-sizing:border-box; border-radius:var(--r-xl); }
.mn--rail { --mn-w: 72px; align-items:center; }
.mn__brand { display:flex; align-items:center; gap:10px; height:44px; padding:0 14px; color:var(--ink); font:600 15px/1 var(--ff-sans); }
.mn--rail .mn__brand { padding:0; justify-content:center; width:44px; }
.mn__rule { height:1px; margin:4px 8px; background:var(--glass-border); }
.mn__list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:2px; }
.mn__item { position:relative; display:flex; align-items:center; gap:12px; min-height:44px; padding:0 14px; border-radius:var(--r-pill); color:var(--ink-2); font:500 15px/1.2 var(--ff-sans); text-decoration:none; }
.mn--rail .mn__item { width:44px; justify-content:center; padding:0; }
.mn__item:hover { color:var(--ink); background:color-mix(in oklch, var(--ink) 4%, transparent); }
.mn__item[aria-current="page"] { background:var(--ink); color:var(--ground); box-shadow:var(--e1); }
.mn__item .noo-icon { flex:none; }
.mn__label { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mn__badge { display:grid; place-items:center; min-width:22px; height:22px; padding:0 6px; border-radius:var(--r-pill); background:var(--ink); color:var(--ground); font:600 12px/1 var(--ff-sans); }
.mn__item[aria-current="page"] .mn__badge { background:var(--ground); color:var(--ink); }
.mn__add { display:grid; place-items:center; width:28px; height:28px; border-radius:var(--r-pill); color:var(--muted); background:none; border:0; }
.mn__sub { list-style:none; margin:2px 0 6px 24px; padding:0 0 0 14px; border-left:1px solid var(--rule); display:flex; flex-direction:column; gap:2px; }
.mn__sub .mn__item { min-height:40px; font-weight:400; }
.mn__sub .mn__item[aria-current="page"] { background:var(--surface); color:var(--ink); box-shadow:var(--e1); }
.mn__section { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 14px 4px; color:var(--muted); }
.mn__section .noo-label { margin:0; }
.mn__section b { font-weight:500; color:var(--ink-2); margin-left:4px; }
.mn--two { display:grid; grid-template-columns: 280px 1px 240px; gap:0 12px; width:auto; }
.mn--two > .mn__col { display:flex; flex-direction:column; gap:8px; }
.mn--two > .mn__divider { background:var(--glass-border); margin:8px 0; }
.mn--floating { --mn-w: 188px; padding:8px; }                       /* the column’s radii, unchanged: xl outside, pill items (Bhargav, 2026-09-14) */
.mn--floating .mn__item { min-height:36px; font-size:14px; padding:0 14px; }
`;

const it = (icon, label, opts = {}) => `<li><a href="#" class="mn__item"${opts.current ? ' aria-current="page"' : ""}>${ico(icon, opts.current && opts.duo ? "duotone" : "regular", 20)}<span class="mn__label">${label}</span>${opts.badge ? `<span class="mn__badge">${opts.badge}</span>` : ""}${opts.add ? `<button type="button" class="mn__add" aria-label="Add">${ico("plus","regular",16)}</button>` : ""}${opts.open ? `<span style="color:currentColor;opacity:.7">${ico("plus","regular",16).replace('d="M12 5v14M5 12h14"','d="M5 12h14"')}</span>` : ""}</a>${opts.children ?? ""}</li>`;

const railIt = (icon, current) => `<li><a href="#" class="mn__item" aria-label="${icon}"${current ? ' aria-current="page"' : ""}>${ico(icon, "regular", 20)}</a></li>`;

const column = () => `<nav class="glass glass-2 mn" aria-label="Menu"><div class="mn__brand">${wordmark(18)}</div><div class="mn__rule"></div><ul class="mn__list">
${it("home","Overview")}${it("message","Messages",{badge:"2"})}${it("grid","Integrations",{add:true})}${it("layers","Finance")}
${it("folder","Threads",{current:true,open:true,children:`<ul class="mn__sub">${it("folder","Fignuts")}${it("folder","Enlarz System",{current:true})}${it("folder","Hugeicons")}</ul>`})}
${it("user","Contacts")}${it("archive","Explore",{add:true})}
</ul></nav>`;

const rail = () => `<nav class="glass glass-2 mn mn--rail" aria-label="Menu"><div class="mn__brand">${blob({ logotype: true, size: "nav" })}</div><div class="mn__rule" style="width:32px"></div><ul class="mn__list">${railIt("home")}${railIt("message")}${railIt("grid")}${railIt("layers")}${railIt("folder",true)}</ul><div style="flex:1;width:1px;min-height:48px;background:var(--rule);margin:8px 0"></div><ul class="mn__list">${railIt("user")}${railIt("archive")}</ul></nav>`;

const two = () => `<nav class="glass glass-2 mn mn--two" aria-label="Menu"><div class="mn__col"><div class="mn__brand">${wordmark(18)}</div><div class="mn__rule"></div><ul class="mn__list">
${it("home","Overview")}${it("message","Messages",{badge:"2"})}${it("grid","Integrations",{add:true})}${it("layers","Finance")}
${it("folder","Threads",{current:true,open:true,children:`<ul class="mn__sub">${it("folder","Fignuts")}${it("folder","Enlarz System",{current:true})}${it("folder","Hugeicons")}</ul>`})}
${it("user","Contacts")}${it("archive","Explore",{add:true})}</ul></div><div class="mn__divider"></div><div class="mn__col" style="padding-top:60px">
<ul class="mn__list">${it("archive","Archive")}${it("heart","Favourites")}</ul><div class="mn__rule"></div>
<div class="mn__section"><p class="noo-label">drafts <b>3</b></p>${ico("pin","regular",16)}</div><ul class="mn__list">${it("folder","General")}${it("folder","Drafts")}${it("folder","Feedback")}</ul><div class="mn__rule"></div>
<div class="mn__section"><p class="noo-label">folders <b>6</b></p>${ico("folder","regular",16)}</div><ul class="mn__list">${it("folder","Stroke LLC")}${it("folder","Duotone",{current:true})}${it("folder","Solid")}${it("folder","Animations")}</ul></div></nav>`;

const floating = () => `<div class="noo-ground" style="position:relative;width:560px;height:300px;border:1px solid var(--rule);border-radius:var(--r-md);background-position:20px 20px"><nav class="glass glass-2 mn mn--floating" aria-label="Views" style="position:absolute;left:16px;bottom:16px"><ul class="mn__list">${["Me","Status","Work","Cases","Projects","Interests","Philosophy"].map((v,i) => `<li><a href="#" class="mn__item"${i===0?' aria-current="page"':""}><span class="mn__label">${v}</span></a></li>`).join("")}</ul></nav><span style="position:absolute;right:16px;top:16px;max-width:30ch;text-align:right" class="rv-cap">the canvas — menu bottom-left, as today, but as a placed component</span></div>`;

export const title = "Menu";
export const block = "portfolio";
export const body = `
${head({ eyebrow: "release review · addition · from your notes · built 2026-09-14", title: "Menu", lead: "“Remove Menu from the Canvas layout; Menu should also be a component.” Agreed, and it goes further: the canvas’s view switcher, the admin’s Rail and the NavBar’s mobile sheet are three hand-built menus. One Menu organism, drawn here in our tokens from your reference, replaces all three and can be dragged onto a canvas with its items edited in the inspector." })}
<style>${MENU_CSS}</style>

${group("Anatomy, in tokens", "Your reference translated: the black active pill is our primary button’s material (ink on ground); the white sub-item is a surface card; the connecting line is a 1px rule; the badge is a chip-sized count; the section header is a Label with a count and a trailing icon; the whole column is glass-2 at radius xl.")}
${item({ name: "Menu · column", layer: "organism · missing · 280 wide", desc: "Brand at the top, a hairline, then items at 44: icon 20, label at <code>ui</code>, an optional badge or add button. One level of children on a rule; the current child is a surface pill. Trailing slot at the bottom for the theme switch and who is signed in.", reads: "glass-2 · --r-xl · --r-pill · --ink · --ground · --surface · --rule · --e1 · Icon · Label", verdict: "Missing",
  note: "This replaces <code>Rail</code>: same groups, same one level of nesting, same skip link — but the current marker moves from a 2px edge bar to the ink pill your reference uses, which reads at a glance and survives the icon-only rail. That is a rule change (Admin.md §10), confirmed in D9. <b>Built:</b> <code>Menu</code> in <code>organisms/</code>; the admin's rail and the NavBar's sheet render it.",
  demo: column() })}
${item({ name: "Menu · rail", layer: "organism · 72 wide · icons only", desc: "The same items with their labels removed; each shows its label as a tooltip and to assistive tech. Groups keep their hairline. Below 900 this is what the column becomes; on a wide screen it is the collapsed state.", reads: "the same", verdict: "Missing",
  note: "The reference’s vertical line between groups is our <code>--rule</code>; its white active circle is our surface pill, and in the rail the current item keeps the ink pill so the two states agree.",
  demo: `<div class="rv-row rv-row--start" style="gap:40px">${rail()}<div class="rv-col" style="max-width:34ch;gap:10px;padding-top:12px"><p class="noo-body-sm" style="margin:0;color:var(--ink-2)">Collapsing is a width change, not a different component: the labels hide, the pills go square, the brand becomes the blob alone.</p><p class="noo-body-sm" style="margin:0;color:var(--ink-2)"><b>Built:</b> the label lifts into an ink bubble on hover and focus — CSS only, the accessible name untouched, so the rail needed no Tooltip after all.</p></div></div>` })}
${item({ name: "Menu · two columns", layer: "organism · 280 + 240", desc: "A second column for a section that has its own children: archives, favourites, then two labelled groups with counts and a trailing action (pin, new folder). The current folder is a surface pill. This is the layout in your image.", reads: "the same · Label · Icon", verdict: "Missing",
  note: "Appears at ≥1200 when the current item declares a <code>panel</code>; below that the panel folds into the column as children. The admin’s Systems → Design System screen is the first consumer (tokens · components · illustrations · blobs).",
  demo: two(), wide: true })}
${item({ name: "Menu · floating, on the canvas", layer: "organism · a placed node", desc: "The view switcher as a Menu: the same glass-2 at radius xl and the same pill items, at 36 instead of 44, no brand, bottom-left by default. A <code>menu</code> node in the scene, so the editor places it, and its items are edited in the inspector like any list prop.", reads: "glass-2 · --r-xl · --r-pill · Icon", verdict: "Missing",
  note: "<code>CanvasShell</code> loses its hardcoded <code>menu</code> panel; the portfolio’s scene gains one <code>menu</code> node. Items: <code>{ icon?, label, view | href, badge? }</code>, added, removed and reordered in the inspector. ← / → still walk the declared reading order. <b>Built:</b> a <code>menu</code> scene node. First anchored to a viewport corner; then, on your call (2026-09-14), a node in canvas space — position in canvas units, dragged and dropped like any other, panning with the map. The portfolio's scene has one beside the Me column.",
  demo: floating() })}

${group("Responsive, in one table", "One component, four widths. Nothing is a separate build.")}
${item({ name: "Breakpoints", layer: "template rule", desc: "What the Menu wears at each width, for a page and for the canvas.", verdict: "Missing", note: "The NavBar’s mobile bottom sheet becomes the Menu’s <code>sheet</code> form too, so the page and the canvas share one small-screen menu.", wide: true, tight: true,
  demo: `<table class="rv-table"><tr><th>width</th><th>page (admin, showcase)</th><th>canvas (portfolio)</th></tr>
<tr><td>≥ 1200</td><td>two columns when the current item has a panel, else column</td><td>floating column, bottom-left</td></tr>
<tr><td>900 – 1200</td><td>column; a panel folds into children</td><td>floating column</td></tr>
<tr><td>640 – 900</td><td>rail; labels as tooltips</td><td>hidden — the chat’s suggestions are the menu (§8.6, unchanged)</td></tr>
<tr><td>&lt; 640</td><td>bottom sheet with ≤ 5 items, else rail</td><td>hidden</td></tr></table>` })}
`;
