import type { ColourRow } from "@/components/jigs";
import type { Library } from "@/engine/library";
import type { Palette, PaletteColour, Use } from "@/engine/types";

/**
 * The palette as it stands (Cinema.md F10: it grows with the scenes), a row of swatches each: first the colours he has
 * named (`PALETTE`, in his private folder), then every colour the library's entries start from, named by what it
 * colours, then every colour already in use (`uses`: a shot's, or a bench's); after it, each further palette of his
 * (`PALETTES`: the vibrant ones, his ask of 2026-10-09), a row of its own. A colour stands in one row only, the first
 * that has it.
 */
export function palettesOf(lib: Library, uses: readonly Use[], his: readonly PaletteColour[], more: readonly Palette[]): ColourRow[] {
  const elsewhere = new Set(more.flatMap((palette) => palette.colours.map((colour) => colour.value.toLowerCase())));
  const named = new Map<string, string>();
  for (const colour of his) if (!named.has(colour.value.toLowerCase())) named.set(colour.value.toLowerCase(), colour.label);
  for (const entry of lib.entries)
    for (const control of entry.controls)
      if (control.kind === "colour" && !named.has(control.default.toLowerCase())) named.set(control.default.toLowerCase(), `${entry.label} ${control.label.toLowerCase()}`);
  for (const use of uses)
    for (const value of Object.values(use.values))
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) && !named.has(value.toLowerCase())) named.set(value.toLowerCase(), value);
  const first = [...named].filter(([value]) => !elsewhere.has(value) || his.some((colour) => colour.value.toLowerCase() === value));
  const taken = new Set(first.map(([value]) => value));
  return [
    { label: "Palette", options: first.map(([value, label]) => ({ value, label, colour: value })) },
    ...more.map((palette) => ({
      label: palette.label,
      options: palette.colours.filter((colour) => !taken.has(colour.value.toLowerCase())).map((colour) => ({ value: colour.value.toLowerCase(), label: colour.label, colour: colour.value })),
    })).filter((row) => row.options.length),
  ];
}
