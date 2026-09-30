"use client";

import { Circle } from "lucide-react";

import { bodySettings } from "@no-origins/ui/lib/agent-body";

import { useCharacter } from "@/components/character-context";
import { PropertyControl } from "@/components/property-control";
import { cardBlock, type Section } from "@/components/section";

/**
 * The body (Character-Studio.md C4, his, 2026-09-30: *"a card that takes up four columns and two rows. And the first
 * item in it will be size and slider. And then the next one will be shade"*, then *"even the size and shade should have
 * the heading of body"*): its heading, and under it the card, four cells across and two down, one setting a row. They
 * are the body's `size` and `shade` as the package declares them (`@no-origins/ui/lib/agent-body`), and they are the
 * character's: saved in its draft as he goes (C6). It stands under the circle, or first where the sections flow under it.
 */

const CARD = ["size", "shade"].map((id) => bodySettings().find((s) => s.id === id)!);

export function useBodySection(): Section {
  const { look, setBody } = useCharacter();
  const lines = CARD.map((setting) => (
    <PropertyControl
      key={setting.id}
      scope="Body"
      property={setting}
      value={look.body[setting.id] ?? setting.default}
      onChange={(v) => setBody(setting.id, v)}
    />
  ));
  return { id: "body", label: "Body", icon: Circle, blocks: [cardBlock("controls", "Body", lines)] };
}
