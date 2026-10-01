"use client";

import * as React from "react";
import { CircleDot, Eye, EyeClosed, Smile, Spline, type LucideIcon } from "lucide-react";

import { Label } from "@no-origins/ui/components/label";
import { Switch } from "@no-origins/ui/components/switch";
import { ToggleGroup, ToggleGroupItem } from "@no-origins/ui/components/toggle-group";
import { sphereMotionOf } from "@no-origins/ui/lib/agent-body";
import { eyeColours } from "@no-origins/ui/lib/agent-colours";
import { AGENT_FACE, faceValue, isUploaded, settingsFor, UPLOADED, type FaceSlot, type FaceSlotId, type FaceWear } from "@no-origins/ui/lib/agent-face";

import { useCharacter } from "@/components/character-context";
import { PropertyControl } from "@/components/property-control";
import { cardBlock, Line, type Section } from "@/components/section";
import { uploadActions, UploadPicker } from "@/components/upload";
import { isUploadSlot } from "@/lib/drawing";

/**
 * The face (Orbit.md C5, C7): **a section for each slot it wears**, its heading and a card of its controls
 * under it (his, 2026-09-30: *"instead of drop down for eyes pupils and all of that I want individual cards of controls
 * for each of that with heading"*; it was one panel whose first line picked the slot). Built from the package's
 * declaration (`@no-origins/ui/lib/agent-face`), never a list of its own: a slot's card is the style it wears — or none
 * — his uploads, the template and the upload at the end of its list (C8, C11), then that style's settings, the ones whose rest is
 * designed here (`set: "look"`); what only a motion moves is the motion studio's. A pair is mirrored until the switch
 * sets its sides apart; then Left and Right say which side the settings move, and the right keeps its own values
 * (`FaceWear.right`), which is what gives one raised brow. The symbols are played by motions, not worn, so they are
 * not here.
 */

const WORN = AGENT_FACE.filter((slot) => slot.use === "worn");

const ICONS: Record<string, LucideIcon> = {
  eyes: Eye,
  pupils: CircleDot,
  "upper-lids": EyeClosed,
  // The lower lids arch up into the ^ ^ of a content face.
  "lower-lids": Smile,
  brows: Spline,
};

type Side = "left" | "right";

export function useFaceSections(): Section[] {
  const { look, setFace, drawings, connected } = useCharacter();
  // Which side of each pair set apart its settings move; the left until he picks.
  const [sides, setSides] = React.useState<Partial<Record<FaceSlotId, Side>>>({});
  // The eyes' colours as they are drawn — Ink is Deep under a pupil or a catchlight — so their Colour's swatches say true.
  const eyeDots = React.useMemo(() => eyeColours(sphereMotionOf(look)), [look]);

  return WORN.map((slot): Section => {
    const wear: FaceWear = look.face[slot.id] ?? { values: {} };
    const style = wear.style ?? slot.style?.default;
    const apart = !!wear.right;
    const editing: Side = apart ? (sides[slot.id] ?? "left") : "left";
    const settings = settingsFor(slot, style).filter((s) => s.set === "look");
    const lines: React.ReactNode[] = [];

    if (slot.style && slot.style.set === "look") {
      // The styles drawn in code, then, at the end of the list under "Your own" (C8, C11), the ones he uploaded for this
      // slot, by name, and the template and the upload; one it wears at an older version than the library's stays in
      // the list, so the select can show it.
      const uploaded = drawings.filter((d) => d.slot === slot.id).map((d) => ({ value: `${UPLOADED}${d.versionId}`, label: d.name }));
      if (isUploaded(style) && !uploaded.some((o) => o.value === style)) uploaded.push({ value: style, label: "Uploaded, an older version" });
      const upload = isUploadSlot(slot.id) ? slot.id : null;
      lines.push(
        <PropertyControl
          key="style"
          scope={slot.label}
          property={{ ...slot.style, label: "Style" }}
          value={style ?? slot.style.default}
          onChange={(next) => setFace(slot.id, (w) => ({ ...w, style: String(next) }))}
          more={
            upload || uploaded.length
              ? { label: "Your own", options: uploaded, actions: upload ? uploadActions(upload, look, connected) : [] }
              : undefined
          }
        >
          {upload ? <UploadPicker slot={upload} /> : null}
        </PropertyControl>,
      );
    }
    if (slot.paired && settings.length) {
      lines.push(
        <Mirrored
          key="mirror"
          slot={slot}
          apart={apart}
          side={editing}
          onSide={(side) => setSides((all) => ({ ...all, [slot.id]: side }))}
          onMirrored={(mirrored) => {
            // Set apart, the right starts as the left is; mirrored again, it follows the left.
            setFace(slot.id, (w) => {
              const next = { ...w };
              if (mirrored) delete next.right;
              else next.right = { ...w.values };
              return next;
            });
            setSides((all) => ({ ...all, [slot.id]: "left" }));
          }}
        />,
      );
    }
    for (const setting of settings) {
      lines.push(
        <PropertyControl
          key={`${setting.id}-${editing}`}
          scope={slot.label}
          property={setting}
          value={faceValue(look.face, slot, setting.id, editing)}
          dots={slot.id === "eyes" ? eyeDots : undefined}
          onChange={(next) =>
            setFace(slot.id, (w) =>
              editing === "right" ? { ...w, right: { ...w.right, [setting.id]: next } } : { ...w, values: { ...w.values, [setting.id]: next } },
            )
          }
        />,
      );
    }

    return { id: slot.id, label: slot.label, icon: ICONS[slot.id] ?? Eye, blocks: [cardBlock("controls", slot.label, lines)] };
  });
}

/** A pair's line: mirrored, or its sides apart and which of them the settings under it move. */
function Mirrored({ slot, apart, side, onSide, onMirrored }: {
  slot: FaceSlot;
  apart: boolean;
  side: Side;
  onSide: (side: Side) => void;
  onMirrored: (mirrored: boolean) => void;
}) {
  const id = `mirror-${slot.id}`;
  return (
    <Line data-property="mirrored">
      <Label htmlFor={id}>Mirrored</Label>
      <div className="col-span-2 flex min-w-0 items-center justify-between gap-3">
        <Switch id={id} aria-label={`${slot.label} mirrored`} checked={!apart} onCheckedChange={onMirrored} />
        {apart ? (
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={side}
            onValueChange={(next) => next && onSide(next as Side)}
            aria-label={`${slot.label}: the side the settings move`}
          >
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        ) : null}
      </div>
    </Line>
  );
}
