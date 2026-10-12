import type { ColourOption } from "@no-origins/ui/components/colour-picker";

/**
 * The world's swatches, every colour a jig picks (the portal's, the sky and the ground): seven taken from his first
 * mock (mine, named for what they look like), and black (his: "We need black in the color palette"). Not the agents'
 * paints, which are theirs alone (Orbit.md C20).
 */
export const COLOURS: readonly ColourOption[] = [
  { value: "#f7f1f2", label: "Cream", colour: "#f7f1f2" },
  { value: "#efe5e8", label: "Sand", colour: "#efe5e8" },
  { value: "#f2bfa6", label: "Peach", colour: "#f2bfa6" },
  { value: "#e6a3ad", label: "Rose", colour: "#e6a3ad" },
  { value: "#a7aae6", label: "Lavender", colour: "#a7aae6" },
  { value: "#6d6290", label: "Dusk", colour: "#6d6290" },
  { value: "#7ddde3", label: "Teal", colour: "#7ddde3" },
  { value: "#9caee5", label: "Sky blue", colour: "#9caee5" },
  { value: "#ffdfbd", label: "Apricot", colour: "#ffdfbd" },
  { value: "#8b82b3", label: "Lilac shade", colour: "#8b82b3" },
  { value: "#80bfce", label: "Sea blue", colour: "#80bfce" },
  { value: "#b6c5b4", label: "Sage", colour: "#b6c5b4" },
  { value: "#bbcedc", label: "Powder blue", colour: "#bbcedc" },
  { value: "#a9cad0", label: "Milky aqua", colour: "#a9cad0" },
  { value: "#f1dfd0", label: "Warm cream", colour: "#f1dfd0" },
  { value: "#90a590", label: "Sage shade", colour: "#90a590" },
  { value: "#fff0d5", label: "Powder cream", colour: "#fff0d5" },
  { value: "#f6b9c9", label: "Powder blush", colour: "#f6b9c9" },
  { value: "#000000", label: "Black", colour: "#000000" },
];
