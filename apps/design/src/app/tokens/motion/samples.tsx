"use client";
import { useState } from "react";
import { Blob, Button, Chip, Label, Motion, Stack, Surface, Text, motionNotes, useReducedMotion, type MotionEffect } from "@no-origins/ui";

/**
 * The live half of the motion screen: the patterns actually moving, and whether this browser wants them to.
 *
 * A pattern is the one token you cannot read off a table — 380ms of `cubic-bezier(0.16, 1, 0.3, 1)` is four numbers
 * until something rises. So this is a client island, and it is the only one on the token screens: everything else
 * here is a value printed on the server.
 *
 * `rise` and `pop` play once on mount, which is why `Play again` exists: it bumps a key and React discards the
 * whole set, so the animations start from the beginning rather than being restarted by hand. `breathe` runs
 * forever and `lift` is a hover transition, so neither needs the button — they are in the same set because the
 * point is to compare the four, and a sample that never moves would read as broken next to three that do.
 *
 * Nothing here decides anything: every duration, easing and line comes from `motionNotes`, and the reduced-motion
 * block that stops all of it lives in the package's motion.css.
 */
const EFFECTS: readonly MotionEffect[] = ["rise", "pop", "lift", "breathe"];

/** In the screen's header, because "is this browser moving at all" is a fact about the whole screen. */
export function ReducedMotionChip() {
  const reduced = useReducedMotion();
  if (!reduced) return null;
  return <Chip hue="yellow">reduced motion is on</Chip>;
}

export function MotionSamples() {
  const [run, setRun] = useState(0);

  return (
    <Stack gap={16}>
      <div key={run} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EFFECTS.map((effect, i) => (
          <Motion key={effect} effect={effect} delay={i * 60}>
            <Surface level={1} style={{ padding: "20px", height: "100%" }}>
              <Stack gap={8}>
                <Label>{effect}</Label>
                <Text size="small" tone="muted">{motionNotes[effect].line}</Text>
                <Text size="small" tone="muted">
                  <code className="noo-code">{motionNotes[effect].duration}</code>{" · "}
                  <code className="noo-code">{motionNotes[effect].easing}</code>
                </Text>
              </Stack>
            </Surface>
          </Motion>
        ))}
      </div>

      <div>
        <Button variant="secondary" size="sm" onClick={() => setRun((n) => n + 1)}>Play again</Button>
      </div>

      <Surface level={1} style={{ padding: "20px" }}>
        <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
          {/* No `blink` prop: a blob blinks because it is alive, which is the whole difference between this and the four above. */}
          <Blob size="sm" label="A blob, blinking on its own schedule" />
          <Stack gap={8}>
            <Label>blink</Label>
            <Text size="small" tone="muted">{motionNotes.blink.line}</Text>
            <Text size="small" tone="muted">
              <code className="noo-code">{motionNotes.blink.duration}</code>{" · "}
              <code className="noo-code">{motionNotes.blink.easing}</code>
            </Text>
          </Stack>
        </div>
      </Surface>
    </Stack>
  );
}
