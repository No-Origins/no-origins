"use client";
import { useEffect, useState } from "react";
import { Row, Text } from "@no-origins/ui";

/**
 * The contrast report (Admin.md §5.2, Design-System.md §12).
 *
 * **R3 is why this exists in this shape.** The admin displays tokens and never writes them, so it cannot refuse a
 * value that breaks a floor the way an editor could — its job is to make a broken floor impossible to miss after
 * the deploy that caused it. A rule that lives only in a document is a rule that gets broken quietly.
 *
 * The floors are §12's: `--ink` on `--ground` about 8:1, and every `*-deep` tier at least 4.5:1 on `--ground`.
 *
 * It measures rather than computes. Tokens are `oklch()` and the theme is chosen at runtime, so the only honest
 * source is what the browser actually paints: set `color` to the token, read `getComputedStyle` back as `rgb()`,
 * and take the relative luminance of that. Which also means it re-measures when the theme changes.
 */

type Pair = { label: string; fg: string; bg: string; floor: number };

const PAIRS: Pair[] = [
  { label: "ink on ground", fg: "--ink", bg: "--ground", floor: 8 },
  { label: "ink-2 on ground", fg: "--ink-2", bg: "--ground", floor: 4.5 },
  { label: "muted on ground", fg: "--muted", bg: "--ground", floor: 4.5 },
  { label: "ink on surface", fg: "--ink", bg: "--surface", floor: 8 },
  ...(["pink", "green", "grey", "lavender", "peach", "yellow", "blue"] as const).map((h) => ({
    label: `${h}-deep on ground`,
    fg: `--${h}-deep`,
    bg: "--ground",
    floor: 4.5,
  })),
  ...(["pink", "green", "grey", "lavender", "peach", "yellow", "blue"] as const).map((h) => ({
    label: `${h}-ink on ${h}`,
    fg: `--${h}-ink`,
    bg: `--${h}`,
    floor: 4.5,
  })),
];

/**
 * Resolve a token to sRGB bytes.
 *
 * Two steps, and the second one is not optional. `getComputedStyle` resolves the `var()` but **keeps the colour
 * in the space it was authored in** — every token here is `oklch()`, so Chrome hands back `oklch(0.3 0.012 60)`
 * rather than `rgb(...)`. Reading three numbers out of that and calling them R, G and B makes every colour
 * near-black and every ratio about 1:1, which is exactly the wrong answer in the most convincing possible form.
 *
 * So the resolved colour is painted into a 1×1 canvas and the pixel is read back: whatever space it was written
 * in, the bytes are what the screen actually shows, which is what a contrast ratio is about in the first place.
 */
function rgb(node: HTMLElement, ctx: CanvasRenderingContext2D, token: string): [number, number, number] {
  node.style.color = `var(${token})`;
  const resolved = getComputedStyle(node).color;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = resolved;                 // a value canvas cannot parse leaves fillStyle at #000
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0]!, d[1]!, d[2]!];
}

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

const ratio = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

export function ContrastReport() {
  const [rows, setRows] = useState<Array<Pair & { value: number }> | null>(null);

  useEffect(() => {
    const measure = () => {
      const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const probe = document.createElement("span");
      probe.style.display = "none";
      document.body.appendChild(probe);
      setRows(PAIRS.map((p) => ({ ...p, value: ratio(rgb(probe, ctx, p.fg), rgb(probe, ctx, p.bg)) })));
      probe.remove();
    };
    measure();
    // The theme switch stamps data-theme on <html>; the report has to follow it, or it reports the other theme.
    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", measure);
    };
  }, []);

  if (!rows) return <Text size="small" tone="muted">Measuring…</Text>;

  const failing = rows.filter((r) => r.value < r.floor);

  return (
    <div>
      <Row gap={8} className="mb-5">
        <span className={failing.length ? "noo-chip" : "noo-chip"} data-hue={failing.length ? "pink" : "green"}>
          <span className="noo-chip__dot" />
          {failing.length ? `${failing.length} below the floor` : "every pair clears its floor"}
        </span>
        <Text size="small" tone="muted" as="span">measured in the theme you are looking at</Text>
      </Row>

      <div className="noo-contrast">
        {rows.map((r) => (
          <div key={r.label} className="noo-contrast__row" data-fail={r.value < r.floor ? "" : undefined}>
            <span
              className="noo-contrast__chip"
              style={{ background: `var(${r.bg})`, color: `var(${r.fg})` }}
              aria-hidden="true"
            >
              Aa
            </span>
            <span className="noo-contrast__name">{r.label}</span>
            <span className="noo-contrast__num noo-nums">{r.value.toFixed(2)}:1</span>
            <span className="noo-contrast__floor noo-nums">floor {r.floor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
