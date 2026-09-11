import type { Hue } from "@no-origins/ui";

/**
 * Stand-in faces for the Deck fixture.
 *
 * There is no photograph on the platform yet (Design-System.md §13 allowed them on 2026-09-11; none has been
 * supplied). Rather than invent portraits of people who do not exist, these are drawn: a hue wash with a soft
 * light in it, as data URIs the browser really fetches and lays out. They prove the mechanism — the card, the
 * bloom, the scrim, the scale — and they are honest about not being anybody.
 *
 * Swap `src` for real photographs and nothing else changes.
 */
const face = (a: string, b: string, light: string) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>` +
      `<radialGradient id="l" cx="0.34" cy="0.3" r="0.6">` +
      `<stop offset="0" stop-color="${light}" stop-opacity="0.85"/>` +
      `<stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient></defs>` +
      `<rect width="600" height="600" fill="url(#g)"/>` +
      `<rect width="600" height="600" fill="url(#l)"/>` +
      `<ellipse cx="300" cy="330" rx="128" ry="150" fill="${light}" fill-opacity="0.22"/>` +
      `<circle cx="300" cy="188" r="78" fill="${light}" fill-opacity="0.28"/>` +
    `</svg>`,
  );

export const FACES: Array<{ name: string; role: string; hue: Hue; src: string }> = [
  { name: "Natalie Ramirez", role: "Software Engineer", hue: "blue", src: face("#5b8fd6", "#8fd6a8", "#ffffff") },
  { name: "Sophia Brooks", role: "Teacher", hue: "peach", src: face("#e8c9a8", "#d69a7a", "#fff4e8") },
  { name: "James Whitman", role: "Researcher", hue: "lavender", src: face("#3a3550", "#6b5f9e", "#cfc4ff") },
  { name: "Amara Okafor", role: "Designer", hue: "yellow", src: face("#e3c85a", "#e89a4f", "#fffbe8") },
  { name: "Tomas Lind", role: "Producer", hue: "green", src: face("#5aa87a", "#9ed46b", "#f0ffe8") },
];
