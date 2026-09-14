import { head, legend, group, item, swatch, HUES, chip } from "../lib.mjs";

const ROLES_LIGHT = [["--ground","oklch(0.95 0.004 90)"],["--ground-2","oklch(0.92 0.005 90)"],["--surface","oklch(0.985 0.003 90)"],["--ink","oklch(0.30 0.012 60)"],["--ink-2","oklch(0.42 0.012 60)"],["--muted","oklch(0.55 0.01 60)"],["--rule","oklch(0.86 0.006 90)"],["--eye","#474747"],["--shade","= --ink"]];

const family = () => `<div class="rv-col">${HUES.map((h) => `<div class="rv-row" style="gap:12px">
  <span class="noo-dot" data-hue="${h}" style="margin-right:4px"></span>
  ${swatch(`--${h}`, "fill")}${swatch(`--${h}-deep`, "deep · text")}${swatch(`--${h}-tint`, "tint · glass")}${swatch(`--${h}-ink`, "ink · on tile")}
  <div class="rv-col" style="gap:6px;margin-left:8px">
    <span style="display:inline-block;padding:8px 14px;border-radius:var(--r-sm);background:var(--${h});color:var(--${h}-ink);font:600 14px/1 var(--ff-sans)">${h}-ink on ${h}</span>
    <span style="color:var(--${h}-deep);font:600 14px/1 var(--ff-sans)">${h}-deep on ground</span>
  </div>
</div>`).join("")}</div>`;

const ladders = () => `<div class="rv-col">
  <p class="rv-cap">the same hue ladder, typed out in twelve places in components.css (blob skips grey; roadmap-item carries two rows)</p>
  <div class="rv-row" style="gap:8px">${["noo-blob","noo-chip","noo-dot","noo-bubble","noo-steps","noo-media-card","noo-profile","noo-rail__group","noo-bento","noo-block-card","noo-roadmap-item","noo-ill"].map((c) => `<code style="font:400 12px/1 var(--ff-mono);padding:6px 10px;border-radius:var(--r-pill);background:var(--ground-2);color:var(--ink-2)">.${c}[data-hue]</code>`).join("")}</div>
  <p class="rv-cap" style="margin-top:8px">proposed — declared once, in tokens.css</p>
  <pre style="margin:0;font:400 12.5px/1.6 var(--ff-mono);color:var(--ink-2);background:var(--ground-2);padding:16px 20px;border-radius:var(--r-md);overflow:auto">[data-hue="peach"] { --hue: var(--peach); --hue-deep: var(--peach-deep); --hue-tint: var(--peach-tint); --hue-ink: var(--peach-ink); }
/* …one row per hue; and the block accent is the same four names at the root */
:root, [data-block] { --hue: var(--accent); --hue-deep: var(--accent-deep); --hue-tint: var(--accent-tint); --hue-ink: var(--accent-ink); }

.noo-chip { background: color-mix(in oklch, var(--hue) 45%, var(--surface)); }   /* no ladder */
.noo-chip__dot { background: var(--hue-deep); }</pre>
</div>`;

const glass = () => `<div class="rv-row rv-row--start" style="gap:20px">
  ${[1,2,3].map((n) => `<div class="glass glass-${n} noo-r-lg" style="width:240px;padding:20px 22px"><p class="noo-label" style="margin:0 0 8px;color:var(--muted)">glass-${n}</p><p class="noo-body" style="margin:0">${["58% · blur 14 · e1","66% · blur 18 · e2","74% · blur 22 · e4"][n-1]}</p><p class="noo-body-sm" style="margin:6px 0 0;color:var(--ink-2)">${["chips, bubbles, small cards","nav, chat input, panels","sheets, dialogs — no consumer yet"][n-1]}</p></div>`).join("")}
</div>`;

const radius = () => `<div class="rv-row" style="gap:20px;align-items:flex-end">${["xs","sm","md","lg","xl","2xl","pill"].map((r) => `<div class="rv-col" style="align-items:center;gap:8px"><span style="width:72px;height:72px;background:var(--surface);box-shadow:var(--e1);border-radius:var(--r-${r})"></span><span class="rv-cap">--r-${r} · ${{xs:6,sm:10,md:14,lg:20,xl:28,"2xl":48,pill:999}[r]}</span></div>`).join("")}</div>`;

const elevation = () => `<div class="rv-row" style="gap:32px">${[1,2,3,4].map((e) => `<div class="rv-col" style="align-items:center;gap:10px"><span style="width:120px;height:72px;background:var(--surface);border-radius:var(--r-lg);box-shadow:var(--e${e})"></span><span class="rv-cap">--e${e}</span></div>`).join("")}</div>`;

const motion = () => `<table class="rv-table"><tr><th>token</th><th>value</th><th>class today</th><th>proposed</th></tr>
<tr><td>--d-fast · --d-base · --d-slow · --d-ambient</td><td>140 · 220 · 380 · 6000 ms</td><td>—</td><td>keep</td></tr>
<tr><td>--ease · --ease-enter · --ease-spring</td><td>three curves</td><td>—</td><td>keep</td></tr>
<tr><td>rise-in</td><td>380ms enter, stagger 40</td><td><code>.rise-in</code></td><td><code>.noo-rise</code></td></tr>
<tr><td>bubble-pop</td><td>220ms spring</td><td><code>.pop-in</code></td><td><code>.noo-pop</code></td></tr>
<tr><td>glass-hover</td><td>−1px, e1→e2</td><td><code>.lift</code></td><td><code>.noo-lift</code></td></tr>
<tr><td>blob-breathe</td><td>6s sine, random phase</td><td><code>.breathe</code></td><td><code>.noo-breathe</code></td></tr></table>`;

const space = () => `<div class="rv-col">
<div class="rv-row" style="gap:14px;align-items:flex-end">${[4,8,12,16,20,24,32,40,48,64,80,96].map((s,i) => `<div class="rv-col" style="align-items:center;gap:6px"><span style="width:${s}px;height:${s}px;background:var(--accent-deep);border-radius:2px"></span><span class="rv-cap">${[1,2,3,4,5,6,8,10,12,16,20,24][i]}</span></div>`).join("")}</div>
<p class="rv-cap">§6 names these twelve steps. tokens.css declares none of them. found in components.css as literals:</p>
<div class="rv-row" style="gap:6px">${["gap: 8px","gap: 16px","gap: 24px","gap: 40px","padding: 24px","padding: 20px","padding: 28px","padding: 40px","padding: 10px 16px","gap: 6px","gap: 10px","gap: 14px","margin-top: 64px","padding-block: 32px"].map((v) => `<code style="font:400 12px/1 var(--ff-mono);padding:6px 10px;border-radius:var(--r-pill);background:var(--ground-2);color:var(--ink-2)">${v}</code>`).join("")}</div>
</div>`;

const type = () => `<div class="rv-col" style="gap:18px">
${[["noo-display-1","display-1 · Bowlby 72/1"],["noo-h1","h1 · Bowlby 44/1.02"],["noo-h2","h2 · Bowlby 34/1.05 — the smallest Bowlby"],["noo-h3","h3 · Hanken 600 · 26/1.15"],["noo-h4","h4 · Hanken 600 · 21/1.25"],["noo-lead","lead · 19/1.5"],["noo-body","body · 16/1.55"],["noo-body-sm","body-sm · 14.5/1.5"],["noo-caption","caption · 13/1.45 · 500"],["noo-label","label · JetBrains 12 · 0.1em · upper"]].map(([c,l]) => `<div class="rv-col" style="gap:2px"><p class="rv-cap">${l}</p><p class="${c}" style="margin:0">Curious &amp; bold</p></div>`).join("")}
<p class="rv-cap" style="margin-top:8px">sizes set as literals in component CSS — the first nine are on no step of the scale; the rest are steps, typed out instead of read:</p>
<div class="rv-row" style="gap:6px">${["13.5 · Button sm","12.5 · contrast name","11.5 · contrast floor","11 · Placeholder tag","10 · attribution","22 · Bento title","20 · Bento text","48 · Bento word","96 · Bento figure","15 · Button · Bubble · Nav link","14 · Rail link","14.5 · Footer","13 · Chip · Rail sub · Footer meta · ThemeSwitch"].map((v) => `<code style="font:400 12px/1 var(--ff-mono);padding:6px 10px;border-radius:var(--r-pill);background:var(--ground-2);color:var(--ink-2)">${v}</code>`).join("")}</div>
</div>`;

const controls = () => `<div class="rv-row" style="gap:18px;align-items:flex-end">${[["nav bar",60],["chat bar",56],["field",48],["button · toggle hit",44],["nav link · step marker",40],["button sm · send",36],["rail link",34],["rail sub-link",30],["chip · theme btn",28],["toggle track",26]].map(([n,h]) => `<div class="rv-col" style="align-items:center;gap:8px"><span style="width:64px;height:${h}px;border-radius:var(--r-pill);background:color-mix(in oklch, var(--accent) 45%, var(--surface));border:1px solid var(--glass-border)"></span><span class="rv-cap" style="text-align:center">${h}<br>${n}</span></div>`).join("")}</div>
<p class="rv-cap">proposed: --ctl-xs 28 · --ctl-sm 36 · --ctl-md 44 · --ctl-lg 56 · --bar 60 — every control height reads one of five names</p>`;

const blocks = () => `<div class="rv-col">
<div class="rv-row" style="gap:12px">${["portfolio","editor","agents","tools","writing","next"].map((b) => `<div data-block="${b}" class="rv-col" style="gap:8px;align-items:center"><span style="width:96px;height:48px;border-radius:var(--r-pill);background:var(--accent)"></span><span class="rv-cap">${b}</span>${chip(b, "accent")}</div>`).join("")}</div>
<table class="rv-table"><tr><th>app that exists</th><th>data-block it wears</th><th>what Admin.md says</th></tr>
<tr><td>apps/portfolio</td><td>portfolio · peach</td><td>peach ✓</td></tr>
<tr><td>apps/design</td><td><code>editor</code> · lavender (borrowed)</td><td>lavender, but as “the showcase”</td></tr>
<tr><td>apps/admin</td><td><code>tools</code> · yellow (borrowed)</td><td>§2: “Proposed hue: lavender” — the code disagrees with the doc</td></tr></table>
</div>`;

export const items = [
  item({ name: "Ground & ink", layer: "token · colour roles", desc: "Nine roles: three grounds, three inks, a rule, the eye, and the shade every shadow is made of. Light is primary; dark redefines the same names and nothing else.", reads: "—  (this is where reading starts)", verdict: "Fix",
    note: "<code>--muted</code> on <code>--ground</code> measures 4.20:1 against the 4.5 floor the showcase’s own report enforces. Lift it to <code>oklch(0.52 0.01 60)</code>; captions keep the token, nothing under 13px uses it.",
    demo: `<div class="rv-row" style="gap:12px">${ROLES_LIGHT.map(([n,v]) => swatch(n, v)).join("")}</div><p class="rv-cap">dark: --ground 0.20 · --surface 0.25 · --ink 0.93 · --shade black · color-scheme dark</p>` }),
  item({ name: "The family", layer: "token · seven hues", desc: "Each hue is four values: the pastel fill it reads as, a deep tier that works as text on the ground (flips in dark), a saturated tint for glass at 24%, and an ink for writing on a tile of the hue (never flips).", reads: "—", verdict: "Fix",
    note: "Two ink tiers fail the floor on their own tile: <code>pink-ink</code> on pink 4.47:1, <code>blue-ink</code> on blue 4.05:1. Drop them to L 0.42 and L 0.40. The fourth tier is right; the numbers need a nudge.",
    demo: family() }),
  item({ name: "The hue slot", layer: "token · proposed", desc: "How a component learns its hue. Today every component that takes <code>data-hue</code> carries its own seven-row ladder mapping hue → its private variable (<code>--chip</code>, <code>--dot</code>, <code>--bento-hue</code>, <code>--pf-hue</code>, <code>--rail-hue</code> …).", reads: "the whole family, eleven times over", verdict: "Missing",
    note: "This is the single change that makes the system <em>connected</em>. One <code>[data-hue]</code> rule sets <code>--hue · --hue-deep · --hue-tint · --hue-ink</code>; every component reads those four names and drops its ladder. Adding an eighth hue becomes one line instead of eleven; a component that wants a hue costs zero CSS.",
    demo: ladders() }),
  item({ name: "Block accent", layer: "token · --accent*", desc: "A block sets three variables at its root — <code>--accent</code>, <code>--accent-deep</code>, <code>--accent-tint</code> — through <code>data-block</code> on <code>&lt;html&gt;</code>. Focus rings, active links, the send button and the block’s own blob read them.", reads: "one hue of the family", verdict: "Fix",
    note: "Three fixes. (1) <code>--accent-ink</code> is missing, so a loud cell in the accent hue has no text token — <code>Bento</code> hardcodes <code>--peach-ink</code> as its default, which is wrong in every block but the portfolio. (2) The six block names are future apps; the two apps that exist borrow <code>editor</code> and <code>tools</code>. Name blocks after apps that ship: <code>portfolio · design · admin</code>. (3) Admin.md says lavender, the code says yellow — decide once.",
    demo: blocks() }),
  item({ name: "Semantic", layer: "token · good · warn · bad · info", desc: "Four states, separate from the accent, never decorative. <code>--good</code> and <code>--info</code> alias the green and blue deep tiers; warn and bad are their own values in both themes.", reads: "green-deep · blue-deep", verdict: "Keep",
    note: "Field already uses <code>--bad</code> for its ring and error text. A Toast will need a wash behind a message: derive it with <code>color-mix(var(--bad) 12%, var(--surface))</code> — no new token.",
    demo: `<div class="rv-row" style="gap:12px">${["good","warn","bad","info"].map((s) => swatch(`--${s}`)).join("")}<div class="rv-col" style="gap:6px;margin-left:12px">${["good","warn","bad","info"].map((s) => `<span style="color:var(--${s});font:600 14px/1 var(--ff-sans)">${s} as text on the ground</span>`).join("")}</div></div>` }),
  item({ name: "Glass", layer: "token · material", desc: "One recipe, three levels: fill, blur, highlight and shadow per level; a hairline border; a 118° specular sweep under the content. Dark lowers the highlights and turns the border white at 10%.", reads: "--surface · --shade · --glass-*", verdict: "Fix",
    note: "The recipe is right and no consumer of <code>glass-3</code> exists yet — the admin’s Dialog will be the first. The fix is naming: <code>.glass</code>, <code>.glass-1..3</code> and the <code>--gf/--gb/--gh/--gs</code> knobs are the only unprefixed classes in the package. Rename to <code>.noo-glass</code>, <code>.noo-glass--2</code>; keep the old names as aliases for one release.",
    demo: glass() }),
  item({ name: "Radius", layer: "token · --r-*", desc: "Seven stops from 6 to pill. Round is the brand: pills for anything you press, 20 for cards, 48 for large-format media.", reads: "—", verdict: "Keep",
    note: "One recorded exception on the platform — ProfileCard’s proportional 15% — and it is written down with its reason. Nothing else may invent a radius.",
    demo: radius() }),
  item({ name: "Elevation", layer: "token · --e1..4", desc: "Warm shadows built on <code>--shade</code>, so the dark theme turns them black without touching a component. Hover lifts exactly one level and one pixel.", reads: "--shade", verdict: "Keep",
    note: "Used consistently: e1 on cards, e2 on glass-2 and lifted cards, e3 on MediaCard hover and ProfileCard, e4 only on glass-3.",
    demo: elevation() }),
  item({ name: "Motion", layer: "token · durations · eases", desc: "Four durations, three curves, four named patterns. Every ambient animation sits behind a reduced-motion block.", reads: "—", verdict: "Fix",
    note: "Values stay. The four pattern classes are unprefixed (<code>.rise-in</code>, <code>.pop-in</code>, <code>.lift</code>, <code>.breathe</code>) and will collide with the first host that has a <code>.lift</code> of its own. Prefix them.",
    demo: motion() }),
  item({ name: "Space", layer: "token · missing", desc: "Design-System.md §6 defines a 4px scale of twelve steps. tokens.css declares none of them, so <code>Stack</code>, <code>Row</code>, <code>Card</code>, <code>Bubble</code> and every organism carry their spacing as literals.", reads: "nothing — that is the problem", verdict: "Missing",
    note: "Add <code>--s-1 … --s-24</code> (4 → 96). <code>Stack</code>/<code>Row</code> keep their four allowed gaps but map them to tokens; card padding becomes <code>--s-6</code> / <code>--s-5</code>. A change to the scale then reaches every component, which today it cannot.",
    demo: space() }),
  item({ name: "Type", layer: "token · scale as classes", desc: "Thirteen named steps shipped as <code>.noo-*</code> classes; the Bowlby rule (display face at h2 and above only) is carried by the classes rather than remembered.", reads: "--ff-display · --ff-sans · --ff-mono", verdict: "Fix",
    note: "The ramp is right. The problem is what is <em>beside</em> it: nine font sizes in component CSS on no step of the scale, and nine more that are steps but typed as literals rather than read. Two control steps close the first group — <code>ui</code> (today’s <code>bubble-text</code>, 15, renamed for what it is used for: buttons, links, bubbles) and <code>ui-sm</code> (13, <code>caption</code> at weight 600) — and the widget scale (96 · 48 · 22 · 20) becomes four named tokens instead of literals in Bento. Then a rule: a component reads a step or it does not set a size.",
    demo: type() }),
  item({ name: "Control heights", layer: "token · missing", desc: "Ten different heights across the controls, each a literal in its own rule.", reads: "—", verdict: "Missing",
    note: "Five names cover them: <code>--ctl-xs</code> 28 · <code>--ctl-sm</code> 36 · <code>--ctl-md</code> 44 · <code>--ctl-lg</code> 56 · <code>--bar</code> 60. Rail link (34), its sub-link (30) and the toggle track (26) move to 36, 28 and 28; the 40px nav link becomes 44, which is also the hit target §12 asks for.",
    demo: controls() }),
  item({ name: "Grid & grain", layer: "token · the ground", desc: "Boxes of 160 with 8 of padding, so a bento cell is 144 and a 4 × 3 widget is 640 × 480 by construction. The grain is an SVG turbulence filter masked in <code>currentColor</code>, never a bitmap.", reads: "--ink · --ground", verdict: "Keep",
    note: "Two classes draw the ground — <code>.noo-ground</code> and <code>.noo-graph</code> — with the same declarations. Merge into one.",
    demo: `<div class="rv-row" style="gap:24px"><div class="rv-col"><div class="noo-ground" style="width:336px;height:176px;border:1px solid var(--rule);border-radius:var(--r-md);background-position:8px 8px"></div><p class="rv-cap">--grid-box 160 · --grid-pad 8 · --grid-line ink 9%</p></div><div class="rv-col"><div class="noo-textured" style="position:relative;width:224px;height:176px;border-radius:var(--r-lg);background:linear-gradient(135deg, color-mix(in oklch, var(--accent) 34%, var(--surface)), var(--surface) 66%);box-shadow:var(--e1)"></div><p class="rv-cap">--grain-strength 0.13 · --grain-scale 0.9</p></div></div>` }),
  item({ name: "Fonts & breakpoints", layer: "token · host-provided", desc: "Fonts are the host’s job: it sets <code>--ff-display / --ff-sans / --ff-mono</code>; the package ships fallback stacks in a low layer. Breakpoints are 640 · 900 · 1200 in the spec.", reads: "—", verdict: "Fix",
    note: "Fonts: keep exactly as is. Breakpoints: CSS cannot read a variable inside <code>@media</code>, so they stay literals — 640 and 900 appear in components.css, 1200 nowhere in the code, and an undocumented 760 sits under <code>Quote</code>. Only <code>NARROW_QUERY</code> (900) is exported, and from the canvas entry, not tokens.ts. Export the three named ones from tokens.ts; retire 760 to 640.",
    demo: `<div class="rv-col" style="gap:10px"><p class="noo-display-2" style="margin:0">Bowlby One</p><p class="noo-h3" style="margin:0">Hanken Grotesk 600 · and 400 for reading</p><p class="noo-code" style="margin:0">JetBrains Mono · labels, code, the contrast report</p><p class="rv-cap" style="margin-top:8px">sm 640 · md 900 in components.css · lg 1200 only in the spec · an unnamed 760 under Quote · one export, NARROW_QUERY, from canvas/scene.ts</p></div>` }),
];

export const title = "Tokens";
export const block = "portfolio";
export const body = `
${head({ eyebrow: "release review · layer 1 of 6", title: "Tokens", lead: "Every value the system has, rendered from tokens.css itself. The verdicts say what a production release changes: three contrast fixes, a hue slot so components stop repeating the family, and the three token groups the spec names but the stylesheet never declared — space, type steps for controls, and control heights." })}
${legend()}
${items.join("")}
`;
