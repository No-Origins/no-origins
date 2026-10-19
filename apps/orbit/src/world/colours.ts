import type { ColourOption } from "@no-origins/ui/components/colour-picker";

/**
 * The world's swatches, every colour a jig picks (the portal's, the sky and the ground). Seven were taken from his
 * first mock (mine, named for what they look like), then black (his: "We need black in the color palette") and the
 * pale three of the ceiling clouds' paint (W36, W38). Not the agents' seven paints, which are theirs alone (Orbit.md
 * C20).
 *
 * Fifty-three now, in eight families, a row each on the picker (his, 2026-10-14: "I'm unable to recognise colors from
 * color palettes. Organize them and break them into rows"; 2026-10-15: "we need more colors … I'm also missing white
 * color", "Our brand colors are also missing - like Lime"): Brand (the theme's lime and violet as hex, since a shader
 * takes a colour and not a variable; they are the same in both themes), Neutrals (white and the creams), Greys (fog to
 * black), Warm (apricot to rosewood), Earth (butter to umber), Greens, Blues and Violets, each row light to dark by
 * relative luminance. Every colour past his and the clouds' is mine, named for what it looks like, his to cut or
 * rename. A value is its hex, so no saved setting moved.
 */
export const COLOURS: readonly ColourOption[] = [
  // Brand: `--lime` and `--violet` (globals.css), resolved.
  { value: "#ceee38", label: "Lime", colour: "#ceee38", group: "Brand" },
  { value: "#9262f3", label: "Violet", colour: "#9262f3", group: "Brand" },
  // Neutrals
  { value: "#ffffff", label: "White", colour: "#ffffff", group: "Neutrals" },
  { value: "#fff6e8", label: "Pale cream", colour: "#fff6e8", group: "Neutrals" },
  { value: "#f7f1f2", label: "Cream", colour: "#f7f1f2", group: "Neutrals" },
  { value: "#fff0d5", label: "Powder cream", colour: "#fff0d5", group: "Neutrals" },
  { value: "#efe5e8", label: "Sand", colour: "#efe5e8", group: "Neutrals" },
  { value: "#f1dfd0", label: "Warm cream", colour: "#f1dfd0", group: "Neutrals" },
  { value: "#e9dfd2", label: "Linen", colour: "#e9dfd2", group: "Neutrals" },
  // Greys
  { value: "#e4e5e8", label: "Fog", colour: "#e4e5e8", group: "Greys" },
  { value: "#c3c6cb", label: "Silver", colour: "#c3c6cb", group: "Greys" },
  { value: "#9a9ea5", label: "Pewter", colour: "#9a9ea5", group: "Greys" },
  { value: "#827e77", label: "Stone", colour: "#827e77", group: "Greys" },
  { value: "#5c6068", label: "Slate", colour: "#5c6068", group: "Greys" },
  { value: "#33353a", label: "Charcoal", colour: "#33353a", group: "Greys" },
  { value: "#000000", label: "Black", colour: "#000000", group: "Greys" },
  // Warm
  { value: "#ffdfbd", label: "Apricot", colour: "#ffdfbd", group: "Warm" },
  { value: "#f7cdd8", label: "Pale rose", colour: "#f7cdd8", group: "Warm" },
  { value: "#f2bfa6", label: "Peach", colour: "#f2bfa6", group: "Warm" },
  { value: "#f6b9c9", label: "Powder blush", colour: "#f6b9c9", group: "Warm" },
  { value: "#e6a3ad", label: "Rose", colour: "#e6a3ad", group: "Warm" },
  { value: "#e3917f", label: "Coral", colour: "#e3917f", group: "Warm" },
  { value: "#c86b7e", label: "Raspberry", colour: "#c86b7e", group: "Warm" },
  { value: "#9c5260", label: "Rosewood", colour: "#9c5260", group: "Warm" },
  // Earth
  { value: "#fff1bf", label: "Butter", colour: "#fff1bf", group: "Earth" },
  { value: "#f3e09a", label: "Straw", colour: "#f3e09a", group: "Earth" },
  { value: "#dcc6a8", label: "Tan", colour: "#dcc6a8", group: "Earth" },
  { value: "#e6c36f", label: "Honey", colour: "#e6c36f", group: "Earth" },
  { value: "#d1a043", label: "Amber", colour: "#d1a043", group: "Earth" },
  { value: "#c99a78", label: "Clay", colour: "#c99a78", group: "Earth" },
  { value: "#b8755a", label: "Terracotta", colour: "#b8755a", group: "Earth" },
  { value: "#8b6346", label: "Bark", colour: "#8b6346", group: "Earth" },
  { value: "#5c4231", label: "Umber", colour: "#5c4231", group: "Earth" },
  // Greens
  { value: "#c5e4cf", label: "Mint", colour: "#c5e4cf", group: "Greens" },
  { value: "#cdd4c3", label: "Pale sage", colour: "#cdd4c3", group: "Greens" },
  { value: "#b6c5b4", label: "Sage", colour: "#b6c5b4", group: "Greens" },
  { value: "#90a590", label: "Sage shade", colour: "#90a590", group: "Greens" },
  { value: "#6f8f63", label: "Fern", colour: "#6f8f63", group: "Greens" },
  { value: "#526137", label: "Moss", colour: "#526137", group: "Greens" },
  { value: "#3f5a3f", label: "Forest", colour: "#3f5a3f", group: "Greens" },
  // Blues
  { value: "#7ddde3", label: "Teal", colour: "#7ddde3", group: "Blues" },
  { value: "#bbcedc", label: "Powder blue", colour: "#bbcedc", group: "Blues" },
  { value: "#a9cad0", label: "Milky aqua", colour: "#a9cad0", group: "Blues" },
  { value: "#80bfce", label: "Sea blue", colour: "#80bfce", group: "Blues" },
  { value: "#9caee5", label: "Sky blue", colour: "#9caee5", group: "Blues" },
  { value: "#4f7fa3", label: "Ocean", colour: "#4f7fa3", group: "Blues" },
  { value: "#2f4566", label: "Navy", colour: "#2f4566", group: "Blues" },
  // Violets
  { value: "#d9c9ec", label: "Lilac", colour: "#d9c9ec", group: "Violets" },
  { value: "#a7aae6", label: "Lavender", colour: "#a7aae6", group: "Violets" },
  { value: "#8b82b3", label: "Lilac shade", colour: "#8b82b3", group: "Violets" },
  { value: "#a07aa6", label: "Mauve", colour: "#a07aa6", group: "Violets" },
  { value: "#6d6290", label: "Dusk", colour: "#6d6290", group: "Violets" },
  { value: "#4e3d66", label: "Plum", colour: "#4e3d66", group: "Violets" },
];

/**
 * A jig's own reference colours ahead of the palette (a mock's stone, a sheet's blue, a bulb's warmth). One the
 * palette already holds (the mountain's stone and its algae, Stone and Moss here; clear white, White) stands once, as
 * the palette names it, so no two swatches share a value and both show pressed.
 */
export const paletteWith = (...references: readonly ColourOption[]): ColourOption[] => [
  ...references.filter((reference) => !COLOURS.some((colour) => colour.value.toLowerCase() === reference.value.toLowerCase())),
  ...COLOURS,
];
