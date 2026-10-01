import type { IntroAgent } from "@no-origins/ui/lib/intro-motion";

import { INTRO_AGENTS } from "./agents";

/**
 * Who bounces while the six stand in their row (Grid.md D50, Motion.md M22, version 5, Portfolio.md P23; his,
 * 2026-10-01: "not all the agents will bounce um, let's only make uh, Bali Kino and uh, Mira to bounce"). Zaza, Oru and
 * Lola sit in their nests, breathing, until they leave. Kept apart from `agents.ts`, which the snapshot rewrites.
 */
const BOUNCERS = new Set(["bali", "kino", "mira"]);

/** The intro's cast: the six as `agents.ts` copies them, each with whether it bounces. */
export const INTRO_CAST: readonly IntroAgent[] = INTRO_AGENTS.map((agent) => ({ ...agent, bounces: BOUNCERS.has(agent.id) }));
