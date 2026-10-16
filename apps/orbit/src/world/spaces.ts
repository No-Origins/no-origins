import { COLOURS } from "./colours";
import type { Jig, JigControl, NumberControl } from "./jig";
import { BLOCK_LEAST, BLOCK_MOST, BLOCK_START, SECTOR_LEAST, SECTOR_MOST, type BlockShape, type BlockTexture, type BlockUnit, type Size } from "./hierarchy";
import { newHollow, OUTLINE_LEAST, type Area } from "./area";

/**
 * Spaces (World.md W81; his, 2026-10-15: "Let's remove sector from elements and create another section called Spaces.
 * So basically, spaces is where we will see the world, and I should be able to create spatial units - Zones and
 * Sectors"): the builder's section where the world's spatial units are made, its one page, Sectors. A sector has a
 * name, a place in the world and a size, its width, length and height each 50 to 1000 m; the camera goes to it once it
 * is made and wherever it is put; blocks are built and elements placed into it, inside it alone (W82; his: "we will not
 * place anything in the world explicitly"). The world is seen as it is placed, the sectors drawn by their edges.
 *
 * Version 2 (W89) put what the item takes, and what is picked, on the item's card on the right (`spaces-world.tsx`);
 * version 3 (W91) took the zones away. Version 4 (W93; his: "A block is a simple basic block. It will have length,
 * width, height, rotation, color and texture. These will be decided while they are being placed in the sector"): a
 * block is any size, 1 to 100 each way in metres or centimetres (his pick, a switch), turned any way (his pick, "as in
 * Blender"), Smooth or Grain (his pick); the Portal went from the items (his: "Let's remove Portal because Pipes can be
 * portals now"). Version 3 is frozen (`spaces-v3.ts`).
 *
 * What is built is kept apart from how it is tuned and how it is being built (W25): the world's data is `hierarchy.ts`
 * (`worldStore`), this jig's settings are its tuning alone, the grain of the blocks that wear it (Reset puts it back, and
 * never touches what is built), and the builder's state is `BuildState` (`buildStore`). Nothing here is three.js.
 */
export const SPACES_VERSION = 4;

/** The grain of every block whose texture is Grain: how much it darkens and lightens a colour (0 smooth), and how fine, in metres. */
export type SpacesConfig = { grain: number; grainSize: number };

export const SPACES_START: SpacesConfig = { grain: 0.1, grainSize: 0.06 };

/**
 * A block's shape as the card sets it (W93): its unit, its width, length and height in it, its rotation round X, Y and Z
 * in degrees, its colour and its texture.
 */
export type BlockCard = { unit: string; width: number; length: number; height: number; rotationX: number; rotationY: number; rotationZ: number; colour: string; texture: string };

/** A block's shape on the card. */
export const cardOf = (shape: BlockShape): BlockCard => ({
  unit: shape.unit, width: shape.size[0], length: shape.size[1], height: shape.size[2],
  rotationX: shape.rotation[0], rotationY: shape.rotation[1], rotationZ: shape.rotation[2], colour: shape.colour, texture: shape.texture,
});

/** The shape the card's values make. */
export const shapeOf = (card: BlockCard): BlockShape => ({
  size: [card.width, card.length, card.height],
  unit: card.unit === "m" ? "m" : "cm",
  rotation: [card.rotationX, card.rotationY, card.rotationZ],
  colour: card.colour,
  texture: card.texture === "smooth" ? "smooth" : "grain",
});

/**
 * How a sector is being built into (W25: the builder's state, neither what is built nor its tuning): the sector picked,
 * the tool (Place or Select), what Place puts in (`item`: a block, or an element, W82), the next block's shape (W93),
 * and the blocks picked with Select, in the order picked, the last the one whose values the card shows (let go on a
 * reload). Which variant an element is placed of, the next pipe's, road's and grove's and the element picked are the
 * placing's (`place.ts`).
 */
export type BuildState = BlockCard & { sector: string; tool: string; item: string; picked: string[] };

/** Building starts in the first sector, placing blocks, the default block (`BLOCK_START`), nothing picked (mine). */
export const BUILD_START: BuildState = { sector: "sector-1", tool: "place", item: "block", ...cardOf(BLOCK_START), picked: [] };

/**
 * What Place puts into the sector picked (W82): a block, or one of the elements (his: "group of items"); a pipe or a
 * road a joint a click (W93); trees as a grove over an area (W89, W91), and a human (W89).
 */
export const ITEMS = [
  { value: "block", label: "Block" },
  { value: "mountain", label: "Mountain" },
  { value: "tree", label: "Trees" },
  { value: "human", label: "Human" },
  { value: "pipe", label: "Pipe" },
  { value: "road", label: "Road" },
] as const;

/** A size as the card says it, in its unit: 100 × 100 × 25 cm. */
export const sizeOf = (size: Size, unit: BlockUnit) => `${size[0]} × ${size[1]} × ${size[2]} ${unit}`;

/** A rotation as the card says it, or nothing where the block stands square. */
export const turnedOf = (rotation: readonly number[]) => (rotation.some(Boolean) ? `, turned ${rotation.map((degrees, i) => `${degrees}° round ${"XYZ"[i]}`).filter((_, i) => rotation[i]).join(", ")}` : "");

/** A block's texture (his pick, "Smooth and Grain"). */
export const TEXTURES: readonly { value: BlockTexture; label: string }[] = [
  { value: "smooth", label: "Smooth" },
  { value: "grain", label: "Grain" },
];

/**
 * A block's shape on the card (W93; his: "length, width, height, rotation, color and texture … The min and max for
 * length, width and height should be 1 m/cm to 100 m/cm", his pick "1–100 with a m/cm switch"): Unit, metres or
 * centimetres, and Width, Length and Height, 1 to 100 in it (a switched unit keeps the numbers: 50 m is 50 cm); then
 * Colour and Texture. The next block's, and the picked block's own.
 */
export function shapeControls(unit: string): JigControl<BlockCard>[] {
  const along = (key: "width" | "length" | "height", label: string): JigControl<BlockCard> => ({ kind: "number", key, label, min: BLOCK_LEAST, max: BLOCK_MOST, step: 1, marks: 25, unit: unit === "m" ? "m" : "cm" });
  return [
    { kind: "choice", key: "unit", label: "Unit", options: [{ value: "m", label: "Metres" }, { value: "cm", label: "Centimetres" }] },
    along("width", "Width"),
    along("length", "Length"),
    along("height", "Height"),
    { kind: "colour", key: "colour", label: "Colour", options: COLOURS },
    { kind: "choice", key: "texture", label: "Texture", options: TEXTURES },
  ];
}

/**
 * A block's rotation on the card (W93, his pick "Any axis, as in Blender"): round X (east), Y (up) and Z (south), each
 * −180 to 180°, a whole degree a step, turned round Y, then X, then Z of the block's own; R turns it in the world.
 */
export const ROTATION_CONTROLS: readonly JigControl<BlockCard>[] = (["X", "Y", "Z"] as const).map((axis) => ({
  kind: "number" as const, key: `rotation${axis}` as const, label: axis, min: -180, max: 180, step: 1, marks: 90, unit: "°",
}));

/** The builder's tool (W24): Place puts the item in, Select picks what is there. */
export const TOOL_CONTROL: JigControl<BuildState> = {
  kind: "choice",
  key: "tool",
  label: "Tool",
  // Remove went (his: "I can select and then use backspace"): with Select, Backspace removes what is picked.
  options: [
    { value: "place", label: "Place" },
    { value: "select", label: "Select" },
  ],
};

/** What Place puts in (W82). */
export const ITEM_CONTROL: JigControl<BuildState> = { kind: "choice", key: "item", label: "Item", options: ITEMS };

/** A sector's place and size on the card, in metres (W81): X and Z the middle of its floor, Y its floor; its width, length and height. */
export type SectorShape = { x: number; y: number; z: number; width: number; length: number; height: number };

/**
 * A sector's controls (W81; his: "I can have the control to set the sector width, length and height. Up to the maximum
 * of thousand meters. And minimum of 50 meters"). *Mine:* its place is the middle of its floor, X and Z anywhere over the
 * world's floor, a metre a step, Y from the floor up to where the least sector still fits under the clouds; its place
 * and its size are never refused, and the card says where it stands outside the world.
 */
export const SECTOR_CONTROLS: readonly JigControl<SectorShape>[] = [
  // A row a way (mine): where along it, and how far it reaches; east and west, north and south, up.
  { kind: "number", key: "x", label: "X", min: -500, max: 500, step: 1, marks: 100, unit: "m" },
  { kind: "number", key: "width", label: "Width", min: SECTOR_LEAST, max: SECTOR_MOST, step: 1, marks: 50, unit: "m" },
  { kind: "number", key: "z", label: "Z", min: -500, max: 500, step: 1, marks: 100, unit: "m" },
  { kind: "number", key: "length", label: "Length", min: SECTOR_LEAST, max: SECTOR_MOST, step: 1, marks: 50, unit: "m" },
  { kind: "number", key: "y", label: "Y", min: 0, max: SECTOR_MOST - SECTOR_LEAST, step: 1, marks: 50, unit: "m" },
  { kind: "number", key: "height", label: "Height", min: SECTOR_LEAST, max: SECTOR_MOST, step: 1, marks: 50, unit: "m" },
];

/**
 * A grove's area on the card (W91; his: "give me dimensions to set"), in metres, its corners in hundredths: its Width
 * and Length, its Corners, and whether it has a hollow and the hollow's, from the area's middle.
 */
export type AreaCard = { width: number; length: number; corners: number; hollow: boolean; hollowX: number; hollowZ: number; hollowWidth: number; hollowLength: number; hollowCorners: number };

/** An area as the card shows it. */
export function areaCard(area: Area): AreaCard {
  const hollow = area.hollow ?? newHollow(area);
  return {
    width: area.size[0], length: area.size[1], corners: Math.round(area.corners * 100),
    hollow: !!area.hollow, hollowX: hollow.at[0], hollowZ: hollow.at[1], hollowWidth: hollow.size[0], hollowLength: hollow.size[1], hollowCorners: Math.round(hollow.corners * 100),
  };
}

/** The area the card's values make; a hollow switched on starts at the area's middle, half its size (`newHollow`). */
export function areaFromCard(card: AreaCard, was: Area): Area {
  const outline = { size: [Math.max(OUTLINE_LEAST, card.width), Math.max(OUTLINE_LEAST, card.length)] as const, corners: card.corners / 100 };
  if (!card.hollow) return { ...outline, hollow: null };
  if (!was.hollow) return { ...outline, hollow: newHollow(outline) };
  return { ...outline, hollow: { at: [card.hollowX, card.hollowZ], size: [Math.max(OUTLINE_LEAST, card.hollowWidth), Math.max(OUTLINE_LEAST, card.hollowLength)], corners: card.hollowCorners / 100 } };
}

const CORNERS: NumberControl<AreaCard> = { kind: "number", key: "corners", label: "Corners", min: 0, max: 100, step: 1, marks: 25, unit: "%" };

/**
 * A grove's area on the card (W91; his: "give me dimensions to set"), *mine*: Width and Length, a metre to its sector's
 * (a grove past its sector's edge plants nothing there), and Corners, 0 square to 100% a pill (a circle where Width and
 * Length are equal, W89's).
 */
export function areaControls(sector: readonly [width: number, length: number]): JigControl<AreaCard>[] {
  const along = (key: "width" | "length", label: string, size: number): JigControl<AreaCard> => ({ kind: "number", key, label, min: OUTLINE_LEAST, max: Math.max(OUTLINE_LEAST + 1, size), step: 1, marks: size > 200 ? 100 : 10, unit: "m" });
  return [along("width", "Width", sector[0]), along("length", "Length", sector[1]), CORNERS];
}

/** Whether the area has a hollow (W89, W91; his: "allowing me to create a hollow within the shape … so that when I place trees, I can only place them on the zone which is not hollow"). */
export const HOLLOW_SWITCH: JigControl<AreaCard> = { kind: "switch", key: "hollow", label: "Hollow" };

/** The hollow's own outline (W89, Z3): its middle from the area's, anywhere in it, its size up to the area's, its own Corners. */
export function hollowControls(area: readonly [width: number, length: number]): JigControl<AreaCard>[] {
  const across = (key: "hollowX" | "hollowZ", label: string, size: number): JigControl<AreaCard> => ({ kind: "number", key, label, min: -Math.floor(size / 2), max: Math.floor(size / 2), step: 1, marks: size > 200 ? 100 : 10, unit: "m" });
  const along = (key: "hollowWidth" | "hollowLength", label: string, size: number): JigControl<AreaCard> => ({ kind: "number", key, label, min: OUTLINE_LEAST, max: Math.max(OUTLINE_LEAST + 1, size), step: 1, marks: size > 200 ? 100 : 10, unit: "m" });
  return [across("hollowX", "X", area[0]), along("hollowWidth", "Width", area[0]), across("hollowZ", "Z", area[1]), along("hollowLength", "Length", area[1]), { ...CORNERS, key: "hollowCorners" }];
}

/**
 * The Sectors card (World.md W81, W82, W89, W91): the sector picked, and Build's Tool and Item, drawn by its page from
 * the world's data and the builder's state (`spaces-world.tsx`); then Grain, its own settings. What the item takes and
 * what is picked are the item's card's, on the right. Copy adds what is built.
 */
export const SPACES_JIG: Jig<SpacesConfig> = {
  name: "Sectors",
  version: SPACES_VERSION,
  start: SPACES_START,
  groups: [
    { title: "Sector", controls: [] },
    { title: "Build", controls: [] },
    {
      title: "Grain",
      note: () => "Every block's whose Texture is Grain: how much it darkens and lightens its colour, and how fine.",
      controls: [
        { kind: "number", key: "grain", label: "Grain", min: 0, max: 0.5, step: 0.01, marks: 0.1 },
        { kind: "number", key: "grainSize", label: "Grain size", min: 0.02, max: 0.3, step: 0.01, marks: 0.07, unit: "m" },
      ],
    },
  ],
};
