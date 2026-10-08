import type { IntroActions } from "@no-origins/ui/lib/intro-motion";

/**
 * How the six bounce, jump and dive in the intro (Grid.md D50, Motion.md M22, M24, Portfolio.md P23): each
 * action's CURRENT version in the motion studio, copied here whole, because this page holds no database key for anything
 * it renders (Admin.md §0.6: the page is static), as `agents.ts` copies their looks. A snapshot, not a link: when he
 * publishes a new version of one, copy it again — `node e2e/.mcp/intro-snapshot.mjs` copies the `values` in
 * `studio_versions.data` of its action's `current_version_id` (`studio_items` of kind `action`), and the looks with
 * them — or the page keeps the old one.
 */
export const INTRO_ACTIONS: IntroActions = {
  // Bounce, version 1.1, published 2026-10-01.
  bounce: {
    "bounces": 0,
    "bounciness": 0,
    "come-back": 200,
    "crouch": 0,
    "energy": 0.55,
    "first": 0,
    "give": 0.08,
    "hang": 500,
    "height": 0.8,
    "land-at": 0,
    "look": 0.4,
    "slide-way": "with",
    "slippery": 1,
    "squash": 0,
    "squat": 0,
    "squeeze": 0,
    "squint": 0,
    "stiffness": 0,
    "stretch": 0,
    "sway": 0.05,
    "swing": 0,
    "wobble": 160,
    "wobble-speed": 180
  },
  // Jump, version 1.3, published 2026-10-01.
  // Its Columns and Rows are where the studio sent it; the intro sends it to its box.
  jump: {
    "bounces": 0,
    "bounciness": 0,
    "columns": 0,
    "come-back": 500,
    "crouch": 60,
    "energy": 0.53,
    "first": 0,
    "give": 0.2,
    "hang": 320,
    "height": 0.95,
    "land-at": -60,
    "look": 0.18,
    "look-lead": 1000,
    "rows": -4,
    "slide-way": "with",
    "slippery": 1,
    "squash": 0,
    "squat": 0.4,
    "squeeze": 0.4,
    "squint": 0.6,
    "stiffness": 0,
    "stretch": 0,
    "sway": 0,
    "swing": 0,
    "wobble": 20,
    "wobble-speed": 40
  },
  // Dive, version 1.4, published 2026-10-01.
  dive: {
    "bounces": 0,
    "bounciness": 0,
    "columns": 3,
    "come-back": 200,
    "crouch": 50,
    "dive": 120,
    "energy": 0.4,
    "first": 0,
    "give": 0.2,
    "look": 0.4,
    "pop": 0,
    "rows": 0,
    "slide-way": "with",
    "slippery": 1,
    "spring": 0,
    "squash": 0,
    "squat": 0.4,
    "squeeze": 0.2,
    "squint": 0.2,
    "stiffness": 0,
    "stretch": 0,
    "sway": 0.4,
    "swing": 0,
    "under": 100,
    "wobble": 90,
    "wobble-speed": 360
  },
};
