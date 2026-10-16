/**
 * A light's Strength (World.md W90; his, 2026-10-15: "we can replace reach and brightness with strength"): one control
 * where a light had two, Brightness and Reach. Its light weakens with the square of the distance, and its reach follows
 * from its strength: it ends where it has faded to `FAINT`. Nothing here is three.js, so a card can say how far a light
 * reaches.
 */

/**
 * Where a light ends (mine, his to tune): where it has faded to a twentieth of the world's sun (2, `build-orbit.ts`).
 * A strength of 150 reaches about 39 m, 1000 about 100 m, 5000 about 224 m.
 */
export const FAINT = 0.1;

/** How far a light of this strength reaches, in metres: where `strength / d²` falls to `FAINT`; 0 for no light. */
export const reachOf = (strength: number): number => (strength > 0 ? Math.sqrt(strength / FAINT) : 0);
