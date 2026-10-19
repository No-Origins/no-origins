import type { HumanConfig } from "./human";
import type { Variant } from "./variants";
import data from "./published-humans.json";

/** Existing character settings retained when the former world was removed (World.md W108). */
export const PUBLISHED_HUMANS = data as unknown as readonly Variant<HumanConfig>[];
