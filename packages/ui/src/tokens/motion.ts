/**
 * Motion (Design-System.md §7) — the values a script reads. tokens.css declares the same numbers as custom
 * properties for the stylesheet; these are for the code that has to agree with it: a scroll that waits `--d-base`,
 * a Deck that eases the way a Card does. Change one, change the other — that is the one duplication the system
 * carries, and it is here so it is visible.
 *
 * Motion is a brand asset (Brand.md §8), which is exactly why it is rationed: four durations, three easings, five
 * named patterns, and every one of them behind `prefers-reduced-motion`.
 */
export const durations = {
  /** State on a control: hover, press, a toggle. */
  fast: 140,
  /** Most transitions: a bubble arriving, a panel opening. */
  base: 220,
  /** An arrival, a section rising in. */
  slow: 380,
  /** Breathing. Nothing else is this slow. */
  ambient: 6000,
} as const;
export type Duration = keyof typeof durations;

export const easings = {
  /** The default: out fast, settle slow. */
  standard: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  /** Something arriving on the page. */
  enter: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** A bubble popping: overshoots a little. */
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
export type Easing = keyof typeof easings;

/** The named patterns — each is a class in motion.css (`.noo-rise`) and an `effect` on the `Motion` atom. */
export const motionPatterns = ["rise", "pop", "breathe", "lift", "blink"] as const;
export type MotionPattern = (typeof motionPatterns)[number];

export const motionNotes: Record<MotionPattern, { duration: Duration; easing: Easing | "ease-in-out"; line: string }> = {
  rise: { duration: "slow", easing: "enter", line: "Opacity 0.35 → 1, 8px up. Siblings stagger 40ms. Always from a visible state — nothing waits at opacity 0 for an observer." },
  pop: { duration: "base", easing: "spring", line: "Scale 0.92 → 1 with the opacity. Origin bottom-left, toward the blob that is speaking." },
  breathe: { duration: "ambient", easing: "ease-in-out", line: "Scale 1 → 1.03 → 1, forever. Every blob starts at a different phase so none breathe in step." },
  lift: { duration: "fast", easing: "standard", line: "On hover: one pixel up, one level up (e1 → e2). The only motion a surface makes." },
  blink: { duration: "fast", easing: "standard", line: "The eyes close to a tenth and open, every 4–9 seconds, never in sync. The one motion reduced-motion keeps, slowed to 8–14." },
};

/** True when the person has asked for less motion. Safe on the server: false there. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
