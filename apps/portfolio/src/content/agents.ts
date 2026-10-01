import type { IntroAgent } from "@no-origins/ui/lib/intro-motion";

/**
 * The six agents (brand/Agents.md), as the intro plays them (Grid.md D50, Motion.md M22, version 5, Portfolio.md P23):
 * each its CURRENT version in Orbit, copied here whole, because this page holds no database key for
 * anything it renders (Admin.md §0.6: the page is static). A snapshot, not a link: when he publishes a new version of
 * one, copy it again — `node e2e/.mcp/intro-snapshot.mjs` copies every look in `studio_versions.data` of its
 * character's `current_version_id`, and the actions with them — or the page keeps the old one. Publish (Admin.md)
 * baking them from the `publish` bucket is the way this stops being a copy.
 *
 * In Agents.md's order. Each `id` is what a box of the page names it by (`data-intro-by`, `by` on a PortfolioItem).
 */
export const INTRO_AGENTS: readonly IntroAgent[] = [
  // Bali, the Guide: version 15.4, published 2026-10-01.
  {
    id: "bali",
    look: {
      "body": {
        "body": "slime",
        "depth": 0,
        "length": 0.8,
        "paint": "violet",
        "rotate-x": -5,
        "rotate-y": 0,
        "rotate-z": 0,
        "shade": 0.72,
        "shape": "sphere",
        "size": 0.8,
        "spread": 0.06,
        "taper": 0.05,
        "texture": "none",
        "texture-colour": "light",
        "texture-opacity": 0.45,
        "texture-size": 0.16,
        "texture-wobble": 0.6
      },
      "face": {
        "brows": {
          "style": "none",
          "values": {
            "brow-angle": -8,
            "brow-arch": 0,
            "brow-colour": "shade",
            "brow-height": 0.19,
            "brow-length": 1.01,
            "brow-thickness": 0.08
          }
        },
        "eyes": {
          "values": {
            "eye-colour": "light",
            "eye-height": 0.3,
            "eye-size": 0.24,
            "eye-spacing": 0.3
          }
        },
        "lower-lids": {
          "style": "plain",
          "values": {
            "lower-curve": 0,
            "lower-raise": 0,
            "lower-slant": 0
          }
        },
        "pupils": {
          "style": "none",
          "values": {
            "pupil-size": 0.55,
            "shine-angle": -45,
            "shine-size": 0.3
          }
        },
        "upper-lids": {
          "style": "plain",
          "values": {
            "lid-curve": -0.04,
            "lid-open": 1,
            "lid-slant": 0
          }
        }
      }
    },
  },
  // Kino, the Maker: version 1.6, published 2026-10-01.
  {
    id: "kino",
    look: {
      "body": {
        "body": "ball",
        "depth": 0,
        "length": 0,
        "paint": "lime",
        "rotate-x": -10,
        "rotate-y": 2,
        "rotate-z": 0,
        "shade": 0.64,
        "shape": "cube",
        "size": 0.9,
        "spread": 0,
        "tail": true,
        "taper": 0,
        "texture": "none",
        "texture-colour": "light",
        "texture-opacity": 0.18,
        "texture-size": 0.08,
        "texture-wobble": 0
      },
      "face": {
        "brows": {
          "style": "none",
          "values": {
            "brow-angle": -6,
            "brow-arch": 0.3,
            "brow-colour": "deep",
            "brow-height": 0.12,
            "brow-length": 1.2,
            "brow-thickness": 0.07
          }
        },
        "eyes": {
          "values": {
            "eye-colour": "ink",
            "eye-height": 0.38,
            "eye-size": 0.24,
            "eye-spacing": 0.34
          }
        },
        "lower-lids": {
          "style": "none",
          "values": {
            "lower-curve": 0.6,
            "lower-raise": 0.2,
            "lower-slant": 0
          }
        },
        "pupils": {
          "style": "shine",
          "values": {
            "pupil-size": 0.5,
            "shine-angle": -45,
            "shine-size": 0.3
          }
        },
        "upper-lids": {
          "style": "heavy",
          "values": {
            "lid-curve": 0,
            "lid-open": 0.64,
            "lid-slant": 0.29
          }
        }
      }
    },
  },
  // Zaza, the Scout: version 1.3, published 2026-10-01.
  {
    id: "zaza",
    look: {
      "body": {
        "body": "jelly",
        "depth": 1,
        "length": 0.8,
        "paint": "green",
        "rotate-x": 3,
        "rotate-y": 0,
        "rotate-z": 0,
        "shade": 0.57,
        "shape": "cone",
        "size": 0.62,
        "spread": 0.05,
        "tail": false,
        "taper": 0,
        "texture": "scales",
        "texture-colour": "light",
        "texture-opacity": 0.64,
        "texture-size": 0.2,
        "texture-wobble": 0.38
      },
      "face": {
        "brows": {
          "style": "none",
          "values": {
            "brow-angle": -12,
            "brow-arch": 0.6,
            "brow-colour": "deep",
            "brow-height": 0.06,
            "brow-length": 1.2,
            "brow-thickness": 0.06
          }
        },
        "eyes": {
          "values": {
            "eye-colour": "ink",
            "eye-height": 0.25,
            "eye-size": 0.29,
            "eye-spacing": 0.33
          }
        },
        "lower-lids": {
          "style": "none",
          "values": {
            "lower-curve": 0,
            "lower-raise": 0,
            "lower-slant": 0
          }
        },
        "pupils": {
          "style": "dot",
          "values": {
            "pupil-size": 0.76,
            "shine-angle": -45,
            "shine-size": 0.32
          }
        },
        "upper-lids": {
          "style": "plain",
          "values": {
            "lid-curve": 0.6,
            "lid-open": 1,
            "lid-slant": -0.41
          }
        }
      }
    },
  },
  // Oru, the Keeper: version 1.5, published 2026-10-01.
  {
    id: "oru",
    look: {
      "body": {
        "body": "ball",
        "depth": 0,
        "length": 0.8,
        "paint": "blue",
        "rotate-x": -24,
        "rotate-y": 16,
        "rotate-z": 6,
        "shade": 0.7,
        "shape": "hexagonal-prism",
        "size": 0.9,
        "spread": 0,
        "tail": false,
        "taper": 0.65,
        "texture": "none",
        "texture-colour": "light",
        "texture-opacity": 0.45,
        "texture-size": 0.16,
        "texture-wobble": 0.6
      },
      "face": {
        "brows": {
          "style": "none",
          "values": {
            "brow-angle": 0,
            "brow-arch": 0.3,
            "brow-colour": "deep",
            "brow-height": 0.12,
            "brow-length": 1.2,
            "brow-thickness": 0.06
          }
        },
        "eyes": {
          "values": {
            "eye-colour": "lime",
            "eye-height": 0.54,
            "eye-size": 0.49,
            "eye-spacing": 0.19
          }
        },
        "lower-lids": {
          "style": "plain",
          "values": {
            "lower-curve": 0,
            "lower-raise": 1,
            "lower-slant": 0.01
          }
        },
        "pupils": {
          "style": "none",
          "values": {
            "pupil-size": 0.5,
            "shine-angle": -45,
            "shine-size": 0.3
          }
        },
        "upper-lids": {
          "style": "plain",
          "values": {
            "lid-curve": -0.01,
            "lid-open": 0.12,
            "lid-slant": 0
          }
        }
      }
    },
  },
  // Mira, the Editor: version 1.6, published 2026-10-01.
  {
    id: "mira",
    look: {
      "body": {
        "body": "ball",
        "depth": 1,
        "length": 0,
        "paint": "orange",
        "rotate-x": -1,
        "rotate-y": 0,
        "rotate-z": 0,
        "shade": 0.5,
        "shape": "cylinder",
        "size": 0.72,
        "spread": 0,
        "tail": false,
        "taper": 0,
        "texture": "honeycomb",
        "texture-colour": "light",
        "texture-opacity": 0.42,
        "texture-size": 0.12,
        "texture-wobble": 0
      },
      "face": {
        "brows": {
          "style": "line",
          "values": {
            "brow-angle": 8,
            "brow-arch": 0,
            "brow-colour": "deep",
            "brow-height": 0.06,
            "brow-length": 0.8,
            "brow-thickness": 0.04
          }
        },
        "eyes": {
          "values": {
            "eye-colour": "deep",
            "eye-height": 0.3,
            "eye-size": 0.24,
            "eye-spacing": 0.44
          }
        },
        "lower-lids": {
          "style": "none",
          "values": {
            "lower-curve": 0,
            "lower-raise": 0,
            "lower-slant": 0
          }
        },
        "pupils": {
          "style": "none",
          "values": {
            "pupil-size": 0.6,
            "shine-angle": -45,
            "shine-size": 0.3
          }
        },
        "upper-lids": {
          "style": "plain",
          "values": {
            "lid-curve": 0,
            "lid-open": 0.69,
            "lid-slant": 0.6
          }
        }
      }
    },
  },
  // Lola, the Muse: version 1.2, published 2026-10-01.
  {
    id: "lola",
    look: {
      "body": {
        "body": "slime",
        "bounces": 0,
        "bounciness": 0,
        "breath": 3400,
        "breath-depth": 0.12,
        "columns": 1,
        "come-back": 500,
        "crouch": 60,
        "depth": 0.78,
        "energy": 0.53,
        "first": 0,
        "give": 0,
        "hang": 600,
        "height": 1.2,
        "land-at": -30,
        "length": 0.8,
        "paint": "pink",
        "rotate-x": 0,
        "rotate-y": 0,
        "rotate-z": 0,
        "rows": 6,
        "shade": 0.65,
        "shape": "hemisphere",
        "size": 0.69,
        "slide-way": "with",
        "slippery": 1,
        "spread": 0.16,
        "squash": 0.2,
        "squat": 0.25,
        "squeeze": 0.4,
        "stiffness": 0,
        "stretch": 0,
        "sway": 0.5,
        "swing": 0,
        "taper": 0,
        "texture": "waves",
        "texture-colour": "light",
        "texture-opacity": 0.7,
        "texture-size": 0.09,
        "texture-wobble": 0.29,
        "wobble": 400,
        "wobble-speed": 40
      },
      "face": {
        "brows": {
          "style": "arch",
          "values": {
            "brow-angle": 0,
            "brow-arch": 0.8,
            "brow-colour": "deep",
            "brow-height": 0.16,
            "brow-length": 1,
            "brow-thickness": 0.06
          }
        },
        "eyes": {
          "values": {
            "eye-colour": "ink",
            "eye-height": 0.39,
            "eye-size": 0.26,
            "eye-spacing": 0.45,
            "look": 0.8,
            "look-lead": 1000,
            "look-x": 0,
            "look-y": 0
          }
        },
        "lower-lids": {
          "style": "plain",
          "values": {
            "lower-curve": 0.9,
            "lower-raise": 0.25,
            "lower-slant": 0
          }
        },
        "pupils": {
          "style": "shine",
          "values": {
            "pupil-size": 0.55,
            "shine-angle": 37,
            "shine-size": 0.4
          }
        },
        "symbols": {
          "style": "none",
          "values": {
            "symbol-at": 45,
            "symbol-colour": "paint",
            "symbol-size": 0.35
          }
        },
        "upper-lids": {
          "style": "plain",
          "values": {
            "blink": 170,
            "blink-every": 3600,
            "lid-curve": 0.5,
            "lid-open": 0.9,
            "lid-slant": 0,
            "squint": 0.6
          }
        }
      }
    },
  },
];
