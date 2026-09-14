import type { Hue } from "@no-origins/ui";

/**
 * Real photographs, web-sized from `~/Creatives/bhargav/photos` into `public/faces/`.
 *
 * Photographs became allowed on 2026-09-11 (Design-System.md §13), and these are the six supplied on 2026-09-09
 * for the About slot. They are here so the Deck is reviewed against real faces rather than drawn stand-ins — a
 * card built for a photograph and never shown one is a card nobody has checked.
 *
 * The names and roles are stand-ins; the pictures are not.
 */
export const FACES: Array<{ name: string; role: string; hue: Hue; src: string }> = [
  { name: "Sophia Brooks", role: "Teacher", hue: "peach", src: "/faces/p2.jpg" },
  { name: "Natalie Ramirez", role: "Software Engineer", hue: "blue", src: "/faces/p1.jpg" },
  { name: "James Whitman", role: "Researcher", hue: "lavender", src: "/faces/p3.jpg" },
  { name: "Amara Okafor", role: "Designer", hue: "yellow", src: "/faces/p4.jpg" },
  { name: "Tomas Lind", role: "Producer", hue: "green", src: "/faces/p5.jpg" },
];
