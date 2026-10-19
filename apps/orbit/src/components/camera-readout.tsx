"use client";

import { useEffect, useState, type RefObject } from "react";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent } from "@no-origins/ui/components/card";
import { Text } from "@no-origins/ui/components/text";

type CameraReading = {
  position: number[];
  target: number[];
  azimuth: number;
  elevation: number;
  fov: number;
};

/** Temporary tuning readout: values describe the rendered camera, including manual adjustments. */
export function CameraReadout({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement | null> }) {
  const [reading, setReading] = useState<CameraReading | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const read = () => {
      const value = canvas.dataset.cameraReading;
      if (value) setReading(JSON.parse(value) as CameraReading);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(canvas, { attributes: true, attributeFilter: ["data-camera-reading"] });
    return () => observer.disconnect();
  }, [canvasRef]);
  const copy = async () => {
    const value = canvasRef.current?.dataset.cameraReading;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(`Orbit camera\n${JSON.stringify(JSON.parse(value), null, 2)}`);
      setCopyStatus("Copied camera settings");
    } catch {
      setCopyStatus("Copy unavailable — select the values below");
    }
  };
  return <Card size="sm" className="fixed right-4 top-16 max-w-[calc(100vw-32px)]">
    <CardContent className="flex flex-col gap-stack-tight">
      <div className="flex items-center justify-between gap-inline">
        <Text role="label">Camera · testing</Text>
        <Button size="sm" variant="outline" disabled={!reading} onClick={copy}>Copy camera</Button>
      </div>
      {reading && <div className="flex select-text flex-col gap-stack-tight">
        <Text role="mono">Angle: {reading.azimuth}° around · {reading.elevation}° up</Text>
        <Text role="mono">Position: {reading.position.join(", ")}</Text>
        <Text role="mono">Target: {reading.target.join(", ")}</Text>
        <Text role="mono">Field of view: {reading.fov}°</Text>
      </div>}
      <Text role="caption" tone="muted">Drag to orbit · scroll to zoom · Shift-drag to pan</Text>
      {copyStatus && <Text role="caption" aria-live="polite">{copyStatus}</Text>}
    </CardContent>
  </Card>;
}
