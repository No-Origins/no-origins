"use client";

import * as React from "react";
import { FileDown, Upload } from "lucide-react";

import { Button } from "@no-origins/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@no-origins/ui/components/dialog";
import { Input } from "@no-origins/ui/components/input";
import { Label } from "@no-origins/ui/components/label";
import { Text } from "@no-origins/ui/components/text";
import { sphereMotionOf } from "@no-origins/ui/lib/agent-body";
import { agentColours, colourCss } from "@no-origins/ui/lib/agent-colours";
import { faceSlot, type DrawingData } from "@no-origins/ui/lib/agent-face";
import type { CharacterLook } from "@no-origins/ui/lib/agent-body";
import type { SphereMotion } from "@no-origins/ui/lib/sphere-motion";

import { useCharacter } from "@/components/character-context";
import type { ChoiceAction } from "@/components/property-control";
import { cleanSvg, type Cleaned } from "@/lib/clean-svg";
import { templatePartOf, templateSvg, UNIT, type UploadSlot } from "@/lib/drawing";

/**
 * Uploading a style (Orbit.md C8): the end of a slot's style list (C11, where two buttons stood at the end of
 * its Style line). **Download the template** hands him the slot's template, drawn round the agent as it is now;
 * **Upload a drawing** takes an SVG drawn on it, cleans it in the page (`cleanSvg`), and shows what it made — the
 * drawing on the agent's head where it will sit, a pair's right side mirrored — or why it was refused, before anything
 * is kept. Kept, it is a style of the slot, and the slot wears it. `UploadPicker` is the file picker and the dialog,
 * which take no column of the line; `uploadActions` the two entries of the list that open them.
 */

const HOW = "Draw on the slot's template and keep its Guides; flat colours only. A shape in a layer named paint, shade, deep, ink, light, lime or violet wears the agent's colour.";

/** The file input of a slot's picker, which its style list's Upload presses: one picker a slot on the page. */
const inputId = (slot: UploadSlot) => `agent-upload-${slot}`;

/** The slot's template, drawn round the agent as `motion` draws it, handed over as a file. */
function downloadTemplate(slot: UploadSlot, motion: SphereMotion) {
  const svg = templateSvg(slot, templatePartOf(slot, motion));
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `agent-${slot}-template.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * A style list's two entries for uploading: the template, then the upload, which waits for the database and is the
 * owner's (C24) — `why` says why it is not offered, or is null when it is.
 */
export function uploadActions(slot: UploadSlot, look: CharacterLook, why: string | null): ChoiceAction[] {
  const label = faceSlot(slot).label.toLowerCase();
  return [
    {
      value: "action:template",
      label: "Download the template",
      icon: FileDown,
      title: `The template to draw ${label} on`,
      run: () => downloadTemplate(slot, sphereMotionOf(look)),
    },
    {
      value: "action:upload",
      label: "Upload a drawing…",
      icon: Upload,
      disabled: why !== null,
      title: why ?? HOW,
      run: () => document.getElementById(inputId(slot))?.click(),
    },
  ];
}

export function UploadPicker({ slot }: { slot: UploadSlot }) {
  const { look, upload } = useCharacter();
  const motion = React.useMemo(() => sphereMotionOf(look), [look]);
  const [pending, setPending] = React.useState<{ file: string; cleaned: Cleaned } | null>(null);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const label = faceSlot(slot).label.toLowerCase();

  const choose = async (file: File) => {
    const text = await file.text();
    setPending({ file: text, cleaned: cleanSvg(text) });
    setName(file.name.replace(/\.svg$/i, "").replace(/[-_]+/g, " ").trim());
    setError(null);
  };

  const save = async () => {
    if (!pending?.cleaned.ok) return;
    setSaving(true);
    const result = await upload(slot, name, pending.file, pending.cleaned.data);
    setSaving(false);
    if (result.ok) setPending(null);
    else setError(result.message);
  };

  const cleaned = pending?.cleaned;
  return (
    <>
      <Input
        id={inputId(slot)}
        type="file"
        accept=".svg,image/svg+xml"
        aria-label={`Upload a ${label} style`}
        tabIndex={-1}
        className="sr-only h-px w-px"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void choose(file);
        }}
      />
      <Dialog open={!!pending} onOpenChange={(open) => { if (!open) setPending(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload a style for the {label}</DialogTitle>
            <DialogDescription>{cleaned?.ok ? "Where it will sit on the agent. Name it, and the slot wears it." : "It was not taken."}</DialogDescription>
          </DialogHeader>
          {cleaned?.ok ? (
            <>
              <DrawingPreview slot={slot} data={cleaned.data} motion={motion} />
              <div className="flex min-w-0 items-center gap-3">
                <Label htmlFor={`upload-name-${slot}`} className="w-20 shrink-0">Name</Label>
                <Input id={`upload-name-${slot}`} value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1" />
              </div>
            </>
          ) : (
            <Text role="body" data-upload-refused>{cleaned?.reason}</Text>
          )}
          {error ? <Text role="caption" data-upload-error>{error}</Text> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>{cleaned?.ok ? "Cancel" : "Back"}</Button>
            {cleaned?.ok ? <Button disabled={!name.trim() || saving} onClick={() => void save()}>{saving ? "Saving…" : "Save and wear it"}</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * A cleaned drawing on the agent's head, where the agent will put it: the head in its paint, the eyes for reference,
 * the drawing at its slot's anchor (`faceAnchors` via the template's part), a pair's right side mirrored, in the agent's
 * colours (`agentColours`, what the agent paints with). Abstract geometry, as the cell and the agent are.
 */
function DrawingPreview({ slot, data, motion }: { slot: UploadSlot; data: DrawingData; motion: SphereMotion }) {
  const part = templatePartOf(slot, motion);
  const colours = agentColours(motion);
  const k = UNIT / data.unit;
  const at = { x: part.anchor.x * UNIT, y: part.anchor.y * UNIT };
  const paired = faceSlot(slot).paired;
  const shapes = data.shapes.map((s, i) => (
    <path
      key={i}
      d={s.d}
      fill={colourCss(s.fill, colours)}
      fillRule={s.rule}
      stroke={colourCss(s.stroke, colours)}
      strokeWidth={s.width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ));
  return (
    <svg data-upload-preview role="img" aria-label="The upload on the agent's head" viewBox="-145 -145 290 290" className="mx-auto size-56">
      <circle r={UNIT} fill={colours.paint} />
      {part.eyes
        ? [part.eyes.left, part.eyes.right].map((e, i) => <circle key={i} cx={e.x * UNIT} cy={e.y * UNIT} r={part.eyes!.r * UNIT} fill={colours.ink} />)
        : null}
      <g transform={`translate(${at.x} ${at.y}) scale(${k})`}>{shapes}</g>
      {paired ? <g transform={`translate(${-at.x} ${at.y}) scale(${-k} ${k})`}>{shapes}</g> : null}
    </svg>
  );
}
