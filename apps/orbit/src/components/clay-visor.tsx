"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Glasses } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@no-origins/ui/components/dialog";
import { useVisorMotion } from "@no-origins/ui/hooks/use-visor-motion";
import { Text } from "@no-origins/ui/components/text";
import { sendClayInput } from "@/world/clay-input";

// Approved concept previews, not promises of finished destination environments (World.md W109).
const zones = [
  { name: "The Agents", x: 175, y: 340, radius: 100 },
  { name: "Tech", x: 426, y: 335, radius: 105 },
  { name: "Art", x: 778, y: 300, radius: 160 },
  { name: "Future Societies", x: 1107, y: 335, radius: 94 },
  { name: "Experiments", x: 1324, y: 340, radius: 88 },
  { name: "Games", x: 1533, y: 342, radius: 85 },
];
function preview(zone: typeof zones[number]): CSSProperties {
  const diameter = zone.radius * 2;
  return { backgroundImage: "url('/references/visor-world-previews-v1.png')", backgroundSize: `${1664 / diameter * 100}% ${941 / diameter * 100}%`, backgroundPosition: `${(zone.x - zone.radius) / (1664 - diameter) * 100}% ${(zone.y - zone.radius) / (941 - diameter) * 100}%` };
}

export function ClayVisor() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(2);
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const mount = useCallback((node: HTMLDivElement | null) => { root.current = node; setSurface(node); }, []);
  const { close, reveal } = useVisorMotion(open && !!surface, root, viewport);
  const dismiss = () => close(() => setOpen(false));
  const trigger = useRef<HTMLButtonElement>(null);
  const choices = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    sendClayInput({ action: "visor", open });
    document.querySelector('[data-slot="world"]')?.toggleAttribute("data-visor-open", open);
    return () => {
      sendClayInput({ action: "visor", open: false });
      document.querySelector('[data-slot="world"]')?.removeAttribute("data-visor-open");
    };
  }, [open]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === "KeyT" && !event.repeat && !(event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]'))) {
        event.preventDefault(); if (open) close(() => setOpen(false)); else setOpen(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, close]);
  return <Dialog open={open} onOpenChange={value => { if (value) setOpen(true); else dismiss(); }}>
      <DialogTrigger asChild>
        <Button ref={trigger} data-clay-visor-trigger style={{ visibility: "visible", opacity: open ? 0 : 1, pointerEvents: open ? "none" : undefined }} variant="ghost" size="icon" className="size-full" title="Visor · Ctrl T" aria-label="Open Clay’s visor, Control T"><Glasses className="size-5" /></Button>
      </DialogTrigger>
      <DialogContent ref={mount} data-slot="clay-visor" className="clay-visor" style={{ translate: "none", transform: "none", insetInlineStart: 0, top: 0 }} showCloseButton={false} onKeyDown={event => {
          const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
          if (!direction && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? zones.length - 1 : (selected + direction + zones.length) % zones.length;
          setSelected(next); choices.current[next]?.focus({ preventScroll: true }); reveal(choices.current[next]);
        }}
        onEscapeKeyDown={event => { event.preventDefault(); dismiss(); }}
        onOpenAutoFocus={event => { event.preventDefault(); root.current?.focus({ preventScroll: true }); }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          document.querySelector('[data-slot="world"]')?.removeAttribute("data-visor-open");
          // Wait until the modal focus guard has detached before focusing the external trigger.
          window.setTimeout(() => document.querySelector<HTMLButtonElement>("[data-clay-visor-trigger]")?.focus({ preventScroll: true }), 0);
        }}>
        <DialogTitle asChild><Text className="sr-only" role="heading">Clay’s visor — choose a zone</Text></DialogTitle>
        <DialogDescription asChild><Text className="sr-only">Preview six worlds. Move the pointer left or right, hold A or D, or use arrow keys to explore. Swipe on touch screens. The Agents is open; the other environments are concept previews. Escape returns to Clay.</Text></DialogDescription>
        <div className="visor-shade" aria-hidden="true" />
        <svg className="visor-rim" viewBox="0 0 1664 941" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#232126" fillRule="evenodd" d="M0 0H1664V941H0Z M110 15C400 -4 1264 -4 1554 15C1620 28 1645 160 1648 365L1648 586C1640 804 1615 907 1525 925C1330 947 1040 938 934 925C882 920 877 902 832 902C787 902 782 920 730 925C624 938 334 947 139 925C49 907 24 804 16 586L16 365C19 160 44 28 110 15Z"/>
          <path fill="none" stroke="#59565e" strokeOpacity=".45" strokeWidth="2" d="M110 15C400 -4 1264 -4 1554 15C1620 28 1645 160 1648 365L1648 586C1640 804 1615 907 1525 925C1330 947 1040 938 934 925C882 920 877 902 832 902C787 902 782 920 730 925C624 938 334 947 139 925C49 907 24 804 16 586L16 365C19 160 44 28 110 15Z"/>
        </svg>
        <div ref={viewport} className="visor-viewport">
        <div className="visor-choices" role="group" aria-label="Zones">
          {zones.map((zone, index) => <Button key={zone.name} ref={element => { choices.current[index] = element; }} variant="outline" className="visor-choice" data-selected={selected === index} aria-pressed={selected === index} tabIndex={selected === index ? 0 : -1} onFocus={() => { setSelected(index); reveal(choices.current[index]); }} onClick={() => setSelected(index)}>
            <span className="visor-preview" style={preview(zone)} aria-hidden="true" />
            <Text as="span" role="label" className="visor-label">{zone.name}</Text>
          </Button>)}
        </div>
        </div>
        <div className="visor-actions">
          <Text role="caption" className="visor-hint">Look left / right · A / D · swipe</Text>
          <Text role="caption" className="visor-note" aria-live="polite">{selected === 0 ? "The Agents · current zone" : `${zones[selected].name} · concept preview`}</Text>
          <div className="flex justify-center gap-inline">
            {selected === 0 ? <Button size="sm" onClick={dismiss}>Return to The Agents</Button> : <Text role="caption" className="visor-note">Environment not built yet</Text>}
            <Button variant="outline" size="sm" className="visor-exit" onClick={dismiss}>Esc · Return</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
