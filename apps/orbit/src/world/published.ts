import type { EnvironmentData } from "./environment";
import type { HumanConfig } from "./human";
import type { WorldData } from "./hierarchy";
import type { MountainConfig } from "./mountain-jig";
import type { PipeConfig } from "./pipe-v1";
import type { PortalConfig } from "./portal";
import type { RoadConfig } from "./road-v1";
import type { TreeConfig } from "./tree-v7";
import type { Variant } from "./variants";
import data from "./published.json";

/**
 * His published elements and world, copied into code (World.md W73, rule 3; Admin.md §0.6): what every page draws
 * when the database cannot be read (no keys, CI, a fresh clone, a failed fetch), and what the libraries start from.
 * `published.json` holds the copy; each variant's id is its item's in the database, so the copy and the database
 * agree, and the world's placed assets name variants by those ids. Written by `pnpm --filter orbit copy:published`
 * from the published versions (`scripts/copy-published.mjs`); the first copy (2026-10-14) was made from the code's
 * own values before anything was published: his six mountains, the seventh and eighth as the ring's layout derived
 * them, his tree, human and portal, and the start world with the ring and the grove of W71 placed as assets; the
 * environment's (2026-10-15, W75) from the code's own starts, the same way, and so were the first pipe and road's (W84).
 * Do not edit by hand: publish, then copy.
 */
export const PUBLISHED_MOUNTAINS = data.mountain as unknown as readonly Variant<MountainConfig>[];
export const PUBLISHED_TREES = data.tree as unknown as readonly Variant<TreeConfig>[];
export const PUBLISHED_HUMANS = data.human as unknown as readonly Variant<HumanConfig>[];
export const PUBLISHED_PORTALS = data.portal as unknown as readonly Variant<PortalConfig>[];
/** The pipe's and the road's (W84), shaped by their skeletons where they are placed. */
export const PUBLISHED_PIPES = data.pipe as unknown as readonly Variant<PipeConfig>[];
export const PUBLISHED_ROADS = data.road as unknown as readonly Variant<RoadConfig>[];
/** The world item (W73): one, named World, its data the hierarchy with what is placed in it. */
export const PUBLISHED_WORLD = data.world as unknown as Variant<WorldData>;
/** The environment item (W75): one, unnamed on its cards, its data what the Environment's pages tune. */
export const PUBLISHED_ENVIRONMENT = data.environment as unknown as Variant<EnvironmentData>;
