import type { IntroAgent } from "@no-origins/ui/lib/intro-motion";

import { INTRO_AGENTS } from "./agents";
import { PAGES } from "./site";

/** Where an agent's page is in the order; one with none, after them all. */
const order = (id: string) => {
  const at = (PAGES as readonly string[]).indexOf(id);
  return at < 0 ? PAGES.length : at;
};

/**
 * Who bounces while the six stand in their row (Grid.md D50, Motion.md M22, Portfolio.md P23): Bali, Kino and Mira.
 * Zaza, Oru and
 * Lola sit in their nests, breathing, until they leave. Kept apart from `agents.ts`, which the snapshot rewrites.
 */
const BOUNCERS = new Set(["bali", "kino", "mira"]);

/**
 * The intro's cast: the six as `agents.ts` copies them, each with whether it bounces, in the order of the pages they
 * show (`PAGES`, Portfolio.md P24): the order they stand in at home, Bali first, so the page goes down them as it turns.
 */
export const INTRO_CAST: readonly IntroAgent[] = [...INTRO_AGENTS]
  .sort((a, b) => order(a.id) - order(b.id))
  .map((agent) => ({ ...agent, bounces: BOUNCERS.has(agent.id) }));
