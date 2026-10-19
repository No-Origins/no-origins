"use client";

import { useId, useState } from "react";
import { Switch } from "@no-origins/ui/components/switch";
import { Label } from "@no-origins/ui/components/label";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { Card, CardContent } from "@no-origins/ui/components/card";
import { Text } from "@no-origins/ui/components/text";
import { sendClayInput } from "@/world/clay-input";

const directions = [["ArrowLeft", "Move left", ArrowLeft], ["ArrowUp", "Move forward", ArrowUp], ["ArrowDown", "Move back", ArrowDown], ["ArrowRight", "Move right", ArrowRight]] as const;
export function ClayControls() {
  const [followCursor, setFollowCursor] = useState(true);
  const followId = useId();
  const hold = (code: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); sendClayInput({ code, pressed: true }); },
    onPointerUp: () => sendClayInput({ code, pressed: false }),
    onPointerCancel: () => sendClayInput({ code, pressed: false }),
    onLostPointerCapture: () => sendClayInput({ code, pressed: false }),
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); sendClayInput({ code, pressed: true }); } },
    onKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); sendClayInput({ code, pressed: false }); } },
    onBlur: () => sendClayInput({ code, pressed: false }),
  });
  return <Card size="sm" className="pointer-events-auto fixed bottom-4 left-4 max-w-[calc(100vw-32px)]">
    <CardContent className="flex flex-col gap-stack-tight">
      <div className="flex items-center justify-between gap-inline">
        <Text role="label">Move Clay</Text>
        <div className="flex items-center gap-inline-tight">
          <Label htmlFor={followId}><Text role="caption">Follow cursor</Text></Label>
          <Switch id={followId} checked={followCursor} onCheckedChange={enabled => {
            setFollowCursor(enabled);
            sendClayInput({ action: "follow-cursor", enabled });
          }} />
        </div>
      </div>
      <Text role="caption" tone="muted" className="hidden md:block">W toward cursor · double-tap W or double-click Walk to auto-run</Text>
      <div className="flex flex-wrap items-center gap-inline-tight">
        {directions.map(([code, label, Icon]) => <Button key={code} variant="outline" size="icon-sm" aria-label={label} className="touch-none" {...hold(code)}><Icon /></Button>)}
        <Button variant="outline" size="sm" className="touch-none" {...hold("KeyW")} onDoubleClick={() => sendClayInput({ action: "auto-walk" })}>Walk</Button>
        <Button variant="outline" size="sm" className="touch-none" {...hold("ShiftLeft")}>Run / descend</Button>
        <Button variant="outline" size="sm" className="touch-none" {...hold("Space")}>Jump / rise</Button>
        <Button variant="outline" size="sm" onClick={() => sendClayInput({ action: "flight" })}>Fly / land</Button>
        <Button variant="ghost" size="sm" onClick={() => sendClayInput({ action: "reset" })}>Reset</Button>
      </div>
    </CardContent>
  </Card>;
}
