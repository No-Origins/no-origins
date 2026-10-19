"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@no-origins/ui/components/button";
import { Slot } from "@no-origins/ui/components/slot";
import { SCREEN_MENU, SCREEN_MENU_FOCUS, SCREEN_MENU_SHOWN, SCREEN_PAGE, SCREEN_PAGE_RECT, openScreenPage, type ScreenPageRect } from "@/world/screen-menu-items";
import { ClayVisor } from "./clay-visor";
import { ClayBag } from "./clay-bag";
import { ClayControls } from "./clay-controls";

/** Narrower than this, an open page lays out at this width and is scaled down onto the screen (World.md W112). */
const PAGE_MIN_WIDTH = 640;

/** The clearing replaces the former world and builder (World.md W108). */
export function World() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [menu, setMenu] = useState(false);
  const [page, setPage] = useState<string | null>(null);
  const [rect, setRect] = useState<ScreenPageRect | null>(null);
  const open = SCREEN_MENU.find(item => item.id === page && item.page);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const cursor = () => document.body.toggleAttribute("data-cursor", pointer.matches);
    cursor();
    pointer.addEventListener("change", cursor);
    const shown = () => setMenu(true);
    canvas.addEventListener(SCREEN_MENU_SHOWN, shown);
    const paged = (event: Event) => setPage((event as CustomEvent<string | null>).detail);
    const placed = (event: Event) => setRect((event as CustomEvent<ScreenPageRect | null>).detail);
    canvas.addEventListener(SCREEN_PAGE, paged);
    canvas.addEventListener(SCREEN_PAGE_RECT, placed);
    import("@/world/clearing").then(async ({ createClearing }) => {
      if (disposed) return;
      const cleanup = await createClearing(canvas);
      if (disposed) cleanup();
      else stop = cleanup;
    }).catch(() => { canvas.dataset.unavailable = "true"; });
    return () => {
      disposed = true;
      stop?.();
      pointer.removeEventListener("change", cursor);
      canvas.removeEventListener(SCREEN_MENU_SHOWN, shown);
      canvas.removeEventListener(SCREEN_PAGE, paged);
      canvas.removeEventListener(SCREEN_PAGE_RECT, placed);
      document.body.removeAttribute("data-cursor");
    };
  }, []);
  return (
    <div data-slot="world" className="fixed inset-0 bg-[#eadbc9]">
      {/* The open page lies behind the canvas, seen through the screen's window; the screen is black round it. */}
      {/* Mounted once the camera faces the screen, so the page's own intro plays where it is seen. */}
      {open && rect && (() => {
        const scale = Math.min(1, rect.page.w / PAGE_MIN_WIDTH);
        return <>
          <div aria-hidden="true" className="absolute bg-black" style={{ left: rect.frame.x, top: rect.frame.y, width: rect.frame.w, height: rect.frame.h }} />
          <iframe key={open.id} src={open.page} title={`${open.label} on the screen`} data-screen-page={open.id}
            onLoad={event => event.currentTarget.focus()} className="absolute origin-top-left border-0"
            style={{ left: rect.page.x, top: rect.page.y, width: rect.page.w / scale, height: rect.page.h / scale, transform: `scale(${scale})` }} />
        </>;
      })()}
      <canvas ref={ref} tabIndex={0}
        aria-label="Orbit: a hovering circular sandy island with a faceted rocky underside, four grassy hills and wildflowers, with one continuous curved blank black screen, a clay figure and six colorful companions. Drag to look around freely, including above and below the island. Right-drag or Shift-drag to pan without changing the angle; on touch, drag with two fingers to pan. Scroll or pinch to zoom. With Follow cursor enabled, the violet ring sits on the island, Clay looks at it, and W or the forward arrow walks toward it. Double-tap W or double-click the island or Walk to run there automatically, flying over obstacles and landing at the destination; any movement key stops auto-run. With Follow cursor off, WASD or arrows move relative to the camera. Shift runs; Space jumps; double Space toggles flight. In flight Space rises and Shift descends. Home resets the camera."
        className={`${open ? "pointer-events-none " : ""}relative block size-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring`} />
      {/* The screen's button cells are painted (World.md W112); these are the same buttons for keys and readers. Focus lights the painted one. */}
      {menu && (
        <nav aria-label="Screen" className="sr-only">
          {SCREEN_MENU.filter(item => item.page).map(item => (
            <Button key={item.id} variant="ghost" onClick={() => ref.current && openScreenPage(ref.current, item)}
              onFocus={() => ref.current?.dispatchEvent(new CustomEvent(SCREEN_MENU_FOCUS, { detail: item.id }))}
              onBlur={() => ref.current?.dispatchEvent(new CustomEvent(SCREEN_MENU_FOCUS, { detail: null }))}>
              {item.label}
            </Button>
          ))}
        </nav>
      )}
      <nav aria-label="World controls" className={`fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 grid -translate-x-1/2 ${open ? "grid-cols-[repeat(4,var(--grid-cell))]" : "grid-cols-[repeat(3,var(--grid-cell))]"} auto-rows-[var(--grid-cell)] gap-[12px]`}>
        <Slot fill="card" inset={0}><ClayControls /></Slot>
        <Slot fill="card" inset={0}><ClayBag /></Slot>
        <Slot fill="card" inset={0}><ClayVisor /></Slot>
        {open && <Slot fill="card" inset={0}>
          <Button variant="ghost" size="icon" className="size-full" title={`Close ${open.label}`} aria-label={`Close ${open.label} on the screen`}
            onClick={() => ref.current && openScreenPage(ref.current, null)}><X className="size-5" /></Button>
        </Slot>}
      </nav>
    </div>
  );
}
