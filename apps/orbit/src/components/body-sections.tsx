"use client";

import { Grip, Moon, Palette, Rotate3d, Shapes, Spline } from "lucide-react";

import { bodySettings } from "@no-origins/ui/lib/agent-body";
import { AGENT_PAINTS } from "@no-origins/ui/lib/agent-colours";
import type { Setting } from "@no-origins/ui/lib/properties";

import { useCharacter } from "@/components/character-context";
import { PropertyControl } from "@/components/property-control";
import { cardBlock, type Section } from "@/components/section";

/**
 * The body's sections beside the Body card (Orbit.md C10; his, 2026-09-30: *"I want more controls. Rest
 * section: Spread, Breathing, Squeeze. I need shape controls too … I also need colors and textures options"*): its
 * **Shape**, its **Colour**, its **Surface** (C15: hand-drawn textures; C14: depth) and its **Rest**, each a heading and a card, as every section is (C7). Each
 * setting is the package's (`@no-origins/ui/lib/agent-body`), and each is the character's, saved in its draft.
 *
 * **Rotation** (C12, his, 2026-09-30: *"I will also need control over rotation in 3D axis"*) is X, Y and Z: a shape turns
 * whole, the sphere its face.
 *
 * **Only the look is here** (C22, Motion.md M23): Rest is Spread, how far it settles into its nest. Its Breath, Breath
 * depth and Squeeze are how every agent moves, and are the motion studio's with the rest of its motion. **Material**
 * (what it is made of) is a line of Shape, and the **Tail** (its Length and Taper) a section of its own. The tail is
 * behind the page at rest,
 * so the agent here does not show it. **Its first line is whether it has one** (C23, his, 2026-10-01: *"an option to
 * have a tail or not"*): a switch, and off, the section is that line alone.
 */

const setting = (id: string): Setting => bodySettings().find((s) => s.id === id)!

/** The paints in the colour picker (C11, C17): each paint's colour, as the agent wears it. */
const PAINT_FILLS = Object.fromEntries(AGENT_PAINTS.map((p) => [p.value, p.fill]));

/** A body setting's line, named by its section, `label` in place of the declaration's where the section needs it. */
function bodyLine(character: ReturnType<typeof useCharacter>, scope: string, id: string, label?: string, fills?: Record<string, string>) {
  const s = setting(id);
  return (
    <PropertyControl
      key={id}
      scope={scope}
      property={label ? { ...s, label } : s}
      value={character.look.body[id] ?? s.default}
      onChange={(v) => character.setBody(id, v)}
      fills={fills}
    />
  );
}

export function useShapeSection(): Section {
  const character = useCharacter();
  return {
    id: "shape",
    label: "Shape",
    icon: Shapes,
    blocks: [cardBlock("controls", "Shape", [bodyLine(character, "Shape", "shape"), bodyLine(character, "Shape", "body", "Material")])],
  };
}

export function useTailSection(): Section {
  const character = useCharacter();
  const line = (id: string) => bodyLine(character, "Tail", id);
  // Off, it has no tail, and its Length and Taper go as a face slot's settings do at None (C23).
  const tailed = (character.look.body.tail ?? setting("tail").default) === true;
  const lines = [line("tail"), ...(tailed ? [line("length"), line("taper")] : [])];
  return { id: "tail", label: "Tail", icon: Spline, blocks: [cardBlock("controls", "Tail", lines)] };
}

export function useRotationSection(): Section {
  const character = useCharacter();
  const line = (id: string) => bodyLine(character, "Rotation", id);
  return {
    id: "rotation",
    label: "Rotation",
    icon: Rotate3d,
    blocks: [cardBlock("controls", "Rotation", [line("rotate-x"), line("rotate-y"), line("rotate-z")])],
  };
}

export function useColourSection(): Section {
  const character = useCharacter();
  return { id: "colour", label: "Colour", icon: Palette, blocks: [cardBlock("controls", "Colour", [bodyLine(character, "Colour", "paint", undefined, PAINT_FILLS)])] };
}

export function useTextureSection(): Section {
  const character = useCharacter();
  const line = (id: string, label?: string) => bodyLine(character, "Surface", id, label);
  const worn = String(character.look.body.texture ?? setting("texture").default);
  // A texture's size, wobble and colour only once it wears one, as a face slot's settings follow its style (C15).
  const lines = [line("texture"), ...(worn === "none" ? [] : [line("texture-size"), line("texture-wobble"), line("texture-colour"), line("texture-opacity")]), line("depth")];
  return { id: "surface", label: "Surface", icon: Grip, blocks: [cardBlock("controls", "Surface", lines)] };
}

export function useRestSection(): Section {
  const character = useCharacter();
  const line = (id: string) => bodyLine(character, "Rest", id);
  return {
    id: "rest",
    label: "Rest",
    icon: Moon,
    blocks: [cardBlock("controls", "Rest", [line("spread")])],
  };
}
