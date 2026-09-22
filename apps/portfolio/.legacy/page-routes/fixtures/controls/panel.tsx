"use client";

/**
 * The panel (Patterns.md §8b) — every variable in the generator, on one screen, against the real thing.
 *
 * > *“With all the conditions we arrived on, can we create a layout with all the controls where we can customise
 * > and control the variables in the function/formulas?”* — Bhargav, 2026-09-11
 *
 * Two things this is NOT. It is not a second copy of the generator: it imports the same `illoLines` the studio's
 * batches draw with, so a setting found here is a setting that ships. And it is not a preview of a picture — it
 * is a preview of a CELL, with the real text on top, the real card wash and grain underneath, at the three
 * sizes an illustration has to survive: the loud tile, a quiet one, and the 0.27 overview.
 *
 * The controls split in two, and the split matters. GEOMETRY is what the function takes. LOOK is what the card
 * and the stroke do with it — weight, contrast, grain, blur, bands — and none of it is geometry, which is why
 * changing it can never make two lines touch.
 */

import { useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BentoFigure, PatternCanvas, Section, SectionHeader, ill, illoLines, poly, type Family, type Hue, type Pt } from "@no-origins/ui";

// The generator comes from the package, not from the studio fixture next door — that is the whole point of
// promoting it. Nothing here reaches into another route's folder any more.
const { SIZE } = ill;

/* ── the three cells, with their text boxes measured rather than guessed (node e2e/.mcp/words.mjs) ─────────── */

interface Cell { key: string; hue: Hue; label: string; value: string; caption: string; words: Array<[number, number, number, number]> }

const CELLS: Cell[] = [
  { key: "work", hue: "peach", label: "work", value: "4", caption: "roles", words: [[16, 15, 42, 28], [16, 105, 69, 224]] },
  { key: "case studies", hue: "lavender", label: "case studies", value: "3", caption: "worth telling", words: [[16, 15, 95, 28], [16, 105, 155, 224]] },
  { key: "projects", hue: "green", label: "projects", value: "0", caption: "shipped yet", words: [[16, 15, 69, 28], [16, 105, 134, 224]] },
];

/* ── what an angle costs (principle 7). The same measure as e2e/.mcp/flow.mjs, so the panel and the probe agree ─ */

const PAD = 7;
function blockedAt(words: Cell["words"], flow: number) {
  const r = (flow / 180) * Math.PI, c = Math.cos(r), s = Math.sin(r);
  const v = (x: number, y: number) => -x * s + y * c;
  let lo = Infinity, hi = -Infinity;
  for (const [x, y] of [[0, 0], [SIZE, 0], [SIZE, SIZE], [0, SIZE]]) { lo = Math.min(lo, v(x!, y!)); hi = Math.max(hi, v(x!, y!)); }
  const bands = words
    .map(([x0, y0, x1, y1]) => {
      const vs = [[x0 - PAD, y0 - PAD], [x1 + PAD, y0 - PAD], [x1 + PAD, y1 + PAD], [x0 - PAD, y1 + PAD]].map(([x, y]) => v(x!, y!));
      return [Math.min(...vs), Math.max(...vs)] as [number, number];
    })
    .sort((a, b) => a[0] - b[0]);
  let total = 0, cur = -Infinity;
  for (const [a, b] of bands) {
    const s0 = Math.max(a, cur, lo), s1 = Math.min(b, hi);
    if (s1 > s0) total += s1 - s0;
    cur = Math.max(cur, b);
  }
  return total / (hi - lo);
}

/* ── grain is code, not a bitmap: the same feTurbulence as tokens.css, with its frequency made a variable ───── */

const grainUrl = (freq: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq.toFixed(2)}' numOctaves='3' stitchTiles='stitch' seed='7'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23g)'/%3E%3C/svg%3E")`;

/* ── state ─────────────────────────────────────────────────────────────────────────────────────────────────── */

type Geom = Required<Omit<Family, "words" | "res" | "interrupt">>;
interface Look { weight: number; contrast: number; soft: number; band: number; grain: number; grainScale: number }

const START: Geom = { seed: 13, flow: 118, scale: 1.3, swing: 44, breath: 30, waves: 2, drift: 0.6, spread: 0.7, taper: 0.35, curl: 0, tempo: 0, pinch: 0 };
const LOOK: Look = { weight: 1.7, contrast: 46, soft: 0, band: 0, grain: 0.13, grainScale: 0.9 };

/** What the generator assumes when a parameter is left out — anything else has to appear in the emitted call. */
const DEFAULTS: Partial<Geom> = { waves: 2, drift: 0.5, spread: 0.5, taper: 0, curl: 0, tempo: 0, pinch: 0 };

/** Every batch that was liked, as a starting point rather than a picture. */
const PRESETS: Array<{ name: string; note: string; geom: Partial<Geom> }> = [
  { name: "9C", note: "a family — every dial on, none at the top", geom: { seed: 13, flow: 118, scale: 1.3, swing: 44, breath: 30, drift: 0.6, spread: 0.7, taper: 0.35 } },
  { name: "10A", note: "sweep — curl alone", geom: { seed: 4, flow: 96, scale: 1.5, swing: 42, breath: 30, drift: 0.4, spread: 0.5, curl: 0.85 } },
  { name: "10C", note: "waist — pinch alone", geom: { seed: 2, flow: 104, scale: 1.4, swing: 44, breath: 38, drift: 0.5, spread: 0.5, pinch: -0.8 } },
  { name: "10D", note: "swept and quickening — two at half", geom: { seed: 13, flow: 88, scale: 1.3, swing: 44, breath: 30, drift: 0.5, spread: 0.65, curl: 0.55, tempo: 0.5 } },
  { name: "11C", note: "by distance — the strategy that survives 0.27", geom: { seed: 4, flow: 90, scale: 1.6, swing: 42, breath: 34, drift: 0.45, spread: 0.5, curl: 0.5 } },
  { name: "angled", note: "45° — an angle costs lines, and a tighter breath buys them back", geom: { seed: 7, flow: 45, scale: 1.4, swing: 44, breath: 19, drift: 0.5, spread: 0.6, curl: 0.35 } },
];

/** The four things asked for on 2026-09-11, as places to start rather than as settings anyone has to find. */
const LOOKS: Array<{ name: string; note: string; look: Partial<Look> }> = [
  { name: "as it ships", note: "the library's own defaults", look: LOOK },
  { name: "quieter", note: "thinner and lower contrast still", look: { weight: 1.2, contrast: 32, grain: 0.18 } },
  { name: "soft", note: "the stroke blurred and a filled ramp between every two lines", look: { soft: 2.2, band: 0.26 } },
  { name: "coarse grain", note: "more texture, bigger grain", look: { grain: 0.3, grainScale: 0.55 } },
];

/* ── the drawing ───────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Six tiles show the same settings, so without this the generator would run six times per keystroke on a slider.
 * It is a pure function of its arguments, which is what makes a cache correct rather than a risk.
 */
const cache = new Map<string, ReturnType<typeof illoLines>>();
function draw(geom: Geom, cell: Cell) {
  const key = `${cell.key}|${Object.values(geom).join(",")}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = illoLines({ ...geom, words: cell.words });
    if (cache.size > 240) cache.clear();
    cache.set(key, hit);
  }
  return hit;
}

/** A closed ribbon between two neighbouring lines, for the intensity ramp. This is a FILL — see the note in §4c. */
const ribbon = (a: Pt[], b: Pt[]) => `${poly(a)} L ${b.slice().reverse().map(([x, y]) => `${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}`).join(" L ")} Z`;

function Drawing({ geom, look, cell, id: ill }: { geom: Geom; look: Look; cell: Cell; id?: string }) {
  const id = useId();
  const { lines, breath } = useMemo(() => draw(geom, cell), [geom, cell]);
  const ramps = useMemo(() => {
    if (!look.band) return [];
    const out: Array<{ d: string; t: number }> = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]!.s - lines[i - 1]!.s > breath * 1.9) continue;      // a level was dropped here: that is the words
      out.push({ d: ribbon(lines[i - 1]!.pts, lines[i]!.pts), t: lines.length > 1 ? i / (lines.length - 1) : 1 });
    }
    return out;
  }, [lines, breath, look.band]);

  return (
    <PatternCanvas
      hue={cell.hue}
      data-ill={ill}
      preserveAspectRatio="xMidYMid slice"
      className="noo-bento__ill noo-bento__ill--field"
    >
      {(line) => (
        <>
          <defs>
            <filter id={`${id}-soft`} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation={look.soft} />
            </filter>
            <filter id={`${id}-band`} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation={Math.max(1, breath / 2.5)} />
            </filter>
          </defs>
          {ramps.length ? (
            <g filter={`url(#${id}-band)`}>
              {ramps.map((r, i) => (
                <path key={`b${i}`} d={r.d} fill="var(--ill-line)" fillOpacity={look.band * r.t} stroke="none" />
              ))}
            </g>
          ) : null}
          <g filter={look.soft > 0 ? `url(#${id}-soft)` : undefined}>
            {lines.flatMap((l, i) => l.runs.map((r, j) => <path key={`${i}-${j}`} d={poly(r)} style={line()} />))}
          </g>
        </>
      )}
    </PatternCanvas>
  );
}

function Tile({ geom, look, cell, px, tone, text, id }: {
  geom: Geom; look: Look; cell: Cell; px?: number; tone: "fill" | "quiet"; text: boolean; id?: string;
}) {
  const style = {
    aspectRatio: "1 / 1",
    width: px,
    padding: px && px < 200 ? 5 : undefined,
    "--bento-hue": `var(--${cell.hue})`,
    "--bento-hue-ink": `var(--${cell.hue}-ink)`,
    "--ill-w": look.weight,
    "--ill-line": `color-mix(in oklch, var(--ill-hue) ${look.contrast}%, currentColor)`,
    "--grain-strength": look.grain,
    "--grain": grainUrl(look.grainScale),
  } as CSSProperties;
  return (
    <div className={`noo-bento__cell noo-bento__cell--${tone}`} style={style}>
      <Drawing geom={geom} look={look} cell={cell} id={id} />
      {text ? (
        <>
          <p className="noo-label">{cell.label}</p>
          <BentoFigure value={cell.value} label={cell.caption} />
        </>
      ) : null}
    </div>
  );
}

/* ── controls ──────────────────────────────────────────────────────────────────────────────────────────────── */

function Dial({ label, hint, value, min, max, step, onChange }: {
  label: string; hint?: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between gap-2">
        <span className="noo-label text-ink">{label}</span>
        <span className="noo-label text-muted tabular-nums">{Number.isInteger(step) ? value : value.toFixed(2)}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
      {hint ? <span className="noo-body-sm text-muted">{hint}</span> : null}
    </label>
  );
}

function Group({ title, children, wide }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className={`flex flex-col gap-3${wide ? " sm:col-span-2" : ""}`}>
      <h3 className="noo-label text-muted">{title}</h3>
      {children}
    </section>
  );
}

/* ── the page ──────────────────────────────────────────────────────────────────────────────────────────────── */

export function Panel() {
  const [geom, setGeom] = useState<Geom>(START);
  const [look, setLook] = useState<Look>(LOOK);
  const [cellKey, setCellKey] = useState(CELLS[0]!.key);
  const cell = CELLS.find((c) => c.key === cellKey)!;
  const set = <K extends keyof Geom>(k: K) => (v: Geom[K]) => setGeom((g) => ({ ...g, [k]: v }));
  const setL = <K extends keyof Look>(k: K) => (v: Look[K]) => setLook((l) => ({ ...l, [k]: v }));

  const measured = useMemo(() => draw(geom, cell), [geom, cell]);
  const cost = blockedAt(cell.words, geom.flow);
  const best = useMemo(() => {
    let bf = 0, bv = Infinity;
    for (let f = 0; f < 180; f += 1) { const v = blockedAt(cell.words, f); if (v < bv) { bv = v; bf = f; } }
    return { flow: bf, cost: bv };
  }, [cell]);
  const px = (u: number) => (u * 304) / 240;                          // viewBox units at the size a loud cell renders

  const call = useMemo(() => {
    const parts = (Object.entries(geom) as Array<[keyof Geom, number]>)
      .filter(([k, v]) => !(k in DEFAULTS) || v !== DEFAULTS[k])
      .map(([k, v]) => `${k}: ${v}`);
    const words = cell.key === "work" ? "WORK" : cell.key === "projects" ? "PROJ" : "CASE";
    return `illo({ ...${words}, ${parts.join(", ")} })`;
  }, [geom, cell]);

  return (
    <Section aria-labelledby="controls-title">
      <SectionHeader
        level={1}
        label="studio · controls"
        title="The panel"
        titleId="controls-title"
        lead="Every variable the generator takes, on the real card, with the real text on top. Geometry is what the function takes; look is what the card and the stroke do with it, and nothing under Look can make two lines touch. The readouts are the same measures probe11 and probe10 use, so what passes here passes there."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(520px,560px)_1fr]">
        {/* ── the rail ── */}
        <div className="noo-card grid gap-x-6 gap-y-6 sm:grid-cols-2 xl:sticky xl:top-4">
          <Group title="cell" wide>
            <div className="flex flex-wrap gap-2">
              {CELLS.map((c) => (
                <button
                  key={c.key} type="button" onClick={() => setCellKey(c.key)}
                  className="noo-label rounded-full px-3 py-1"
                  style={{
                    backgroundColor: cellKey === c.key ? `var(--${c.hue})` : "transparent",
                    color: cellKey === c.key ? `var(--${c.hue}-ink)` : "var(--muted)",
                    boxShadow: cellKey === c.key ? "none" : "inset 0 0 0 1px var(--rule)",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Group>

          <Group title="travel">
            <Dial label="flow" value={geom.flow} min={0} max={179} step={1}
              hint={`this angle costs ${(cost * 100).toFixed(0)}% of the family · cheapest is ${best.flow}° at ${(best.cost * 100).toFixed(0)}%`}
              onChange={set("flow")} />
            <AngleStrip words={cell.words} flow={geom.flow} onPick={set("flow")} />
            <Dial label="scale" hint="wavelength — how close the card stands" value={geom.scale} min={0.5} max={3} step={0.05} onChange={set("scale")} />
            <Dial label="swing" hint="degrees — the openness of the bend" value={geom.swing} min={10} max={70} step={1} onChange={set("swing")} />
            <Dial label="waves" hint="how varied each undulation is" value={geom.waves} min={1} max={4} step={1} onChange={set("waves")} />
            <Dial label="seed" hint="which picture — the only one that is not a design decision" value={geom.seed} min={1} max={64} step={1} onChange={set("seed")} />
          </Group>

          <Group title="spacing">
            <Dial label="breath" hint="units between lines — the count is what fits" value={geom.breath} min={12} max={60} step={1} onChange={set("breath")} />
            <Dial label="spread" hint="how unequal the gaps are" value={geom.spread} min={0} max={1} step={0.05} onChange={set("spread")} />
            <Dial label="taper" hint="the family opens one way along its travel" value={geom.taper} min={0} max={0.9} step={0.05} onChange={set("taper")} />
            <Dial label="pinch" hint="a waist (−) or a flare (+) mid-travel" value={geom.pinch} min={-0.9} max={0.9} step={0.05} onChange={set("pinch")} />
          </Group>

          <Group title="difference">
            <Dial label="drift" hint="how much each line differs from its neighbour" value={geom.drift} min={0} max={1} step={0.05} onChange={set("drift")} />
            <Dial label="tempo" hint="wavelength differing across the family — supporting, not leading" value={geom.tempo} min={0} max={1} step={0.05} onChange={set("tempo")} />
            <Dial label="curl" hint="the family sweeps around a centre off the frame" value={geom.curl} min={0} max={1} step={0.05} onChange={set("curl")} />
          </Group>

          <Group title="look — none of this is geometry">
            <Dial label="weight" hint="stroke width in viewBox units" value={look.weight} min={0.6} max={4} step={0.1} onChange={setL("weight")} />
            <Dial label="contrast" hint="% of the hue in the line; the rest is the text colour" value={look.contrast} min={15} max={80} step={1} onChange={setL("contrast")} />
            <Dial label="blur" hint="softens the stroke itself" value={look.soft} min={0} max={5} step={0.1} onChange={setL("soft")} />
            <Dial label="bands" hint="a filled ramp between every two lines — this breaks principle 2" value={look.band} min={0} max={0.5} step={0.01} onChange={setL("band")} />
            <Dial label="grain" hint="texture on the card, not on the drawing" value={look.grain} min={0} max={0.4} step={0.01} onChange={setL("grain")} />
            <Dial label="grain scale" hint="feTurbulence base frequency — lower is coarser" value={look.grainScale} min={0.25} max={2} step={0.05} onChange={setL("grainScale")} />
          </Group>

          <Group title="start from" wide>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name} type="button" title={p.note}
                  onClick={() => setGeom({ ...START, curl: 0, tempo: 0, pinch: 0, taper: 0, ...p.geom })}
                  className="noo-label rounded-full px-3 py-1 text-muted"
                  style={{ boxShadow: "inset 0 0 0 1px var(--rule)" }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </Group>

          <Group title="look, to start from" wide>
            <div className="flex flex-wrap gap-2">
              {LOOKS.map((l) => (
                <button
                  key={l.name} type="button" title={l.note}
                  onClick={() => setLook({ ...LOOK, ...l.look })}
                  className="noo-label rounded-full px-3 py-1 text-muted"
                  style={{ boxShadow: "inset 0 0 0 1px var(--rule)" }}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </Group>
        </div>

        {/* ── the preview ── */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start gap-5">
            <Tile geom={geom} look={look} cell={cell} px={304} tone="fill" text id="panel-loud" />
            <div className="flex flex-col items-center gap-1.5">
              <Tile geom={geom} look={look} cell={cell} px={116} tone="quiet" text={false} />
              <span className="noo-label text-muted">quiet</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Tile geom={geom} look={look} cell={cell} px={82} tone="fill" text={false} />
              <span className="noo-label text-muted">at 0.27</span>
            </div>
          </div>

          <div className="noo-card">
            <p className="noo-label text-muted">measured</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
              <Stat k="lines" v={String(measured.lines.length)} />
              <Stat k="tightest gap" v={`${px(measured.gap).toFixed(1)}px`} note="centre to centre at 304px" />
              <Stat k="between edges" v={`${(px(measured.gap) - px(look.weight)).toFixed(1)}px`} note="what probe11 reports" />
              <Stat k="words cost" v={`${(cost * 100).toFixed(0)}%`} note="of the family, at this angle" />
            </dl>
          </div>

          <div className="noo-card">
            <p className="noo-label text-muted">the whole row, at these settings</p>
            <div className="mt-3 flex flex-wrap gap-4">
              {CELLS.map((c) => <Tile key={c.key} geom={geom} look={look} cell={c} px={196} tone="fill" text id={`panel-${c.key.replace(/\s+/g, "-")}`} />)}
            </div>
            <p className="noo-body-sm mt-3 text-muted">
              One parameter set across three cells. The captions are different lengths, so the same angle costs each of them
              a different amount of picture — which is why `flow` is a constraint and not a difference.
            </p>
          </div>

          <div className="noo-card">
            <p className="noo-label text-muted">the call</p>
            <pre className="noo-body-sm mt-2 overflow-x-auto text-ink-2"><code>{call}</code></pre>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Stat({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="noo-label text-muted">{k}</dt>
      <dd className="noo-body text-ink tabular-nums">{v}</dd>
      {note ? <dd className="noo-body-sm text-muted">{note}</dd> : null}
    </div>
  );
}

/** What every angle costs this cell, as a strip. Click it to take that angle — the choice is a measurement. */
function AngleStrip({ words, flow, onPick }: { words: Cell["words"]; flow: number; onPick: (v: number) => void }) {
  const bars = useMemo(() => Array.from({ length: 60 }, (_, i) => ({ f: i * 3, v: blockedAt(words, i * 3) })), [words]);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-10 items-end gap-px" role="group" aria-label="what each angle costs">
        {bars.map((b) => {
          const on = Math.abs(((b.f - flow + 90 + 180) % 180) - 90) < 1.5;
          return (
            <button
              key={b.f} type="button" onClick={() => onPick(b.f)} title={`${b.f}° · ${(b.v * 100).toFixed(0)}%`}
              className="flex-1 rounded-t-[1px]"
              style={{ height: `${Math.max(6, b.v * 100).toFixed(1)}%`, backgroundColor: on ? "var(--accent)" : "color-mix(in oklch, var(--ink) 18%, transparent)" }}
            />
          );
        })}
      </div>
      <span className="noo-body-sm text-muted">0° … 180°, taller is more of the picture lost to the words</span>
    </div>
  );
}
