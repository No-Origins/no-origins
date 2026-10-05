import type { House, Pillar, Slab, Wall } from "@/lib/house";
import type { Tour } from "@/lib/tour";

/**
 * A made-up house (Home.md H4): what the app shows wherever the real one is not — CI, the review sweep, a fresh clone,
 * and Vercel's build, whose page reads the real one from the private store instead. The house is private and the repo
 * is public, so nothing here is his: a pavilion of two rooms, 24 by 16 ft, on a plinth, with a front door, a door
 * between the rooms and a window in each end wall, and a tour of three stops with no pictures. It exercises what the
 * viewer draws — pillars, walls with openings, slabs, a block, the plan, the long shot, legs through doors — and
 * nothing more. Feet, and the page's directions: x across, y down the page.
 */

const PLINTH = 1;
const STOREY = 10;
const SLAB = 0.5;
const CEILING = PLINTH + STOREY;
const WALL = 0.75;
const W = 24;
const D = 16;
const M = WALL / 2;
/** The eye, 5½ ft over the floor. */
const EYE = PLINTH + 5.5;

const pillars: Pillar[] = ([[0, 0], [W, 0], [W, D], [0, D]] as const).map(([x, y], i) => ({
  id: `pillar-${i + 1}`,
  at: [x, y],
  size: [1, 1],
  base: 0,
  height: CEILING + SLAB,
  material: "concrete",
}));

const wall = (id: string, from: readonly [number, number], to: readonly [number, number], openings: Wall["openings"] = [], thickness = WALL): Wall => ({
  id,
  from,
  to,
  thickness,
  base: PLINTH,
  height: STOREY,
  material: "plaster",
  openings,
});

const walls: Wall[] = [
  wall("north", [0, 0], [W, 0]),
  wall("east", [W, 0], [W, D], [{ kind: "window", id: "east-window", at: D / 2, width: 4, height: 4, sill: 3 }]),
  wall("south", [W, D], [0, D], [{ kind: "door", id: "front-door", at: W / 2, width: 3.5, height: 7 }]),
  wall("west", [0, D], [0, 0], [{ kind: "window", id: "west-window", at: D / 2, width: 4, height: 4, sill: 3 }]),
  wall("between", [15, 0], [15, D], [{ kind: "door", id: "study-door", at: 9, width: 3, height: 7 }], 1 / 3),
];

const outline = [[-M, -M], [W + M, -M], [W + M, D + M], [-M, D + M]] as const;
const slabs: Slab[] = [
  { id: "floor", outline, top: PLINTH, thickness: PLINTH, material: "floor" },
  { id: "ceiling", outline, top: CEILING + SLAB, thickness: SLAB, material: "concrete" },
];

export const HOME: House = {
  name: "Sample house",
  version: 1,
  units: "ft",
  materials: [
    { id: "plaster", label: "Plaster, painted", colour: "#e7e1d5" },
    { id: "concrete", label: "Concrete", colour: "#aaa59c" },
    { id: "floor", label: "Floor", colour: "#d8d1c4" },
    { id: "door", label: "Door, wood", colour: "#8a5a36" },
    { id: "frame", label: "Window frame", colour: "#3a3a3a" },
    { id: "wood", label: "Wood, the table", colour: "#a2713f" },
  ],
  pillars,
  walls,
  slabs,
  blocks: [{ id: "table", corners: [[5, 6], [9, 9]], base: PLINTH, height: 2.5, material: "wood" }],
  stairs: [],
  flights: [],
  railings: [],
  views: [{ id: "plan", label: "Plan", kind: "plan", cut: CEILING }],
};

export const HOME_TOUR: Tour = {
  opening: {
    label: "A sample house",
    say: "A made-up house: the real one is private and is read from the store once you are signed in on the site.",
    look: { from: [44, 26, 44], to: [12, 4, 8], fov: 42 },
    approach: { via: [[26, 12, 34]], look: "blend", seconds: 6 },
  },
  stops: [
    { id: "front", label: "Front door", say: "The front door, from the path.", look: { from: [12, EYE, 26], to: [12, EYE - 1, D], fov: 60 } },
    { id: "room", label: "Room", say: "The larger room, its table under the west window.", look: { from: [12, EYE, 13], to: [4, EYE - 1.5, 6], fov: 70 } },
    { id: "study", label: "Study", say: "The study, through the door in the wall between.", look: { from: [17, EYE, 9.5], to: [22, EYE - 1.5, 3], fov: 70 } },
  ],
  legs: [
    { via: [[12, EYE, D + 2], [12, EYE, D - 2]], doors: ["front-door"] },
    { via: [[13, EYE, 9], [17, EYE, 9]], doors: ["study-door"] },
  ],
};
