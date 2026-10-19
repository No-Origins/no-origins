import * as THREE from "three/webgpu";
import { easing, motionMs } from "@no-origins/ui/lib/motion";
import { DEFAULT_GRID_CONFIG, resolveField } from "@no-origins/ui/components/grid";
import { FIELD_PAD, gridFieldPainter, type FieldMessage, type FieldRgba } from "@no-origins/ui/lib/grid-field";
import { SCREEN_BASE, SCREEN_CENTER_Z, SCREEN_HEIGHT, SCREEN_RADIUS, SCREEN_WIDTH } from "./clearing-screen";
import { SCREEN_MENU, SCREEN_MENU_FOCUS, SCREEN_MENU_SHOWN, openScreenPage, type ScreenMenuItem } from "./screen-menu-items";

// The screen is a grid's box (Grid.md D11): 1024 CSS px across, as tall as the slab's aspect allows, so a CSS pixel
// on the docked view is about a pixel of the window, and the field's 1px rings still read.
const BOX_W = 1024;
const BOX_H = (BOX_W * SCREEN_HEIGHT) / SCREEN_WIDTH;
const DPR = 2;
// The grid's own lit-cell fade and reveal lace (grid.tsx).
const LIT_FADE_MS = 500;
const LACE_MS = 90;
const BUTTON_CELLS = 2;

type Button = { item: ScreenMenuItem; x: number; y: number; w: number; h: number; at: number };

/**
 * The screen menu, version 1 (World.md W112): once the NO ORIGINS title has played, the design system's field reveals
 * over it from the centre, cell by cell, and three button cells sit centred on the upper of the field's two middle
 * rows. The field is painted by the grid's own painter (`gridFieldPainter`, Grid.md D38) on the world's clock.
 * Motion.md M3: undecided `--motion-screen-menu-*` fallbacks, read when it starts.
 */
export function buildScreenMenu(host: HTMLCanvasElement, request: () => void) {
  const artwork = document.createElement("canvas");
  artwork.width = Math.round(BOX_W * DPR);
  artwork.height = Math.round(BOX_H * DPR);
  const ctx = artwork.getContext("2d")!;
  const texture = new THREE.CanvasTexture(artwork);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, fog: false });
  const geometry = new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT, 128, 1);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const angle = vertices.getX(i) / SCREEN_RADIUS;
    // Just in front of the title, which it covers as it reveals.
    const radius = SCREEN_RADIUS - 0.13;
    vertices.setXYZ(i, radius * Math.sin(angle), vertices.getY(i), SCREEN_CENTER_Z - radius * Math.cos(angle));
  }
  geometry.computeVertexNormals();
  const object = new THREE.Mesh(geometry, material);
  object.position.y = SCREEN_BASE + SCREEN_HEIGHT / 2;
  object.name = "no-origins-screen-menu";
  object.visible = false;

  const field = resolveField(DEFAULT_GRID_CONFIG, BOX_W, BOX_H);
  const { cols, rows, cell, gap } = field;
  const pitch = cell + gap;
  const gridW = cell * cols + gap * (cols - 1);
  const gridH = cell * rows + gap * (rows - 1);
  const fx = (BOX_W - gridW) / 2;
  const fy = (BOX_H - gridH) / 2;

  // The page's tokens in the dark theme: the screen is black.
  const tokens = (() => {
    const probe = document.createElement("div");
    probe.className = "dark";
    probe.hidden = true;
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const pixel = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true })!;
    const rgba = (token: string, alpha = 1): FieldRgba => {
      pixel.clearRect(0, 0, 1, 1);
      pixel.fillStyle = "rgba(0, 0, 0, 0)";
      pixel.fillStyle = style.getPropertyValue(token).trim() || "rgba(0, 0, 0, 0)";
      pixel.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = pixel.getImageData(0, 0, 1, 1).data;
      return [r!, g!, b!, (a! / 255) * alpha];
    };
    const read = {
      dash: rgba("--border", 0.7), border: rgba("--border"), lime: rgba("--lime"), violet: rgba("--violet"),
      ground: rgba("--background"), card: rgba("--card"), foreground: rgba("--foreground"),
      primary: rgba("--primary"), ink: rgba("--primary-foreground"), ring: rgba("--ring"), focus: rgba("--ring", 0.3),
    };
    probe.remove();
    return read;
  })();
  const css = (c: FieldRgba) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
  const sans = getComputedStyle(host).getPropertyValue("--font-sans").trim() || "Inter, sans-serif";
  let fontReady = false;
  void document.fonts.load(`600 12px ${sans}`).then(() => { fontReady = true; }, () => { fontReady = true; });

  // The grid's painter, run here with the world's frame as its frame.
  const fieldCv = document.createElement("canvas");
  const linesCv = document.createElement("canvas");
  let handler: ((message: FieldMessage) => void) | null = null;
  let frame: (() => void) | null = null;
  gridFieldPainter({
    listen: (h) => { handler = h; },
    frame: (callback) => { frame = callback; },
    canvas: (width, height) => Object.assign(document.createElement("canvas"), { width, height }),
    now: () => performance.timeOrigin + performance.now(),
  });
  const post = (message: FieldMessage) => handler?.(message);
  post({ type: "init", field: fieldCv, lines: linesCv, fade: LIT_FADE_MS, pad: FIELD_PAD, lace: LACE_MS });

  // Each cell lights in turn outward from the field's centre, where the title was.
  const centre = { c: (cols - 1) / 2, r: (rows - 1) / 2 };
  const reach = Math.hypot(centre.c, centre.r) || 1;
  const reveal = (spread: number) => {
    const delays = new Float64Array(cols * rows);
    for (let i = 0; i < delays.length; i++) delays[i] = (Math.hypot((i % cols) - centre.c, Math.floor(i / cols) - centre.r) / reach) * spread;
    return delays;
  };

  // Three pills, a cell of air between, centred; on the upper middle row (the field's centre is a line, D26).
  const span = SCREEN_MENU.length * BUTTON_CELLS + SCREEN_MENU.length - 1;
  const firstCol = Math.max(0, (cols - span) / 2);
  const row = rows / 2 - 1;
  let buttons: Button[] = [];
  const place = (delays: Float64Array | null) => {
    buttons = SCREEN_MENU.map((item, i) => {
      const col = firstCol + i * (BUTTON_CELLS + 1);
      let at = 0;
      if (delays) for (let k = 0; k < BUTTON_CELLS; k++) at = Math.max(at, delays[row * cols + col + k]!);
      return { item, x: fx + col * pitch, y: fy + row * pitch, w: BUTTON_CELLS * cell + (BUTTON_CELLS - 1) * gap, h: cell, at: at + LACE_MS };
    });
  };

  let state: "off" | "hold" | "revealing" | "shown" = "off";
  let holdLeft = 0, zero = 0, revealEnd = 0, buttonFade = 1;
  let curve = easing("cubic-bezier(0.22, 1, 0.36, 1)");
  let hover: Button | null = null, focus: Button | null = null, cursor = -1, dirty = false;

  const paintButton = (b: Button, alpha: number) => {
    if (alpha <= 0) return;
    const lit = !!b.item.page && (hover === b || focus === b);
    ctx.save();
    ctx.globalAlpha = alpha;
    // A card slot (bg-card, a hairline border) holding a ghost Button: lime with its ink on hover.
    ctx.beginPath();
    ctx.roundRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1, b.h / 2 - 0.5);
    ctx.fillStyle = css(lit ? tokens.primary : tokens.card);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = css(focus === b ? tokens.ring : tokens.border);
    ctx.stroke();
    if (focus === b) {
      ctx.beginPath();
      ctx.roundRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2, b.h / 2 + 1);
      ctx.lineWidth = 2;
      ctx.strokeStyle = css(tokens.focus);
      ctx.stroke();
    }
    if (b.item.label) {
      // The Button's label: text-xs, semibold, tracking-widest, uppercase.
      ctx.font = `600 12px ${sans}`;
      ctx.letterSpacing = "1.2px";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = css(lit ? tokens.ink : tokens.foreground);
      ctx.fillText(b.item.label.toUpperCase(), b.x + b.w / 2 + 0.6, b.y + b.h / 2 + 0.5);
    }
    ctx.restore();
  };

  const compose = (now: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, artwork.width, artwork.height);
    if (state === "shown") {
      ctx.fillStyle = css(tokens.ground);
      ctx.fillRect(0, 0, artwork.width, artwork.height);
    }
    ctx.drawImage(fieldCv, 0, 0);
    ctx.drawImage(linesCv, Math.round((fx - FIELD_PAD) * DPR), Math.round((fy - FIELD_PAD) * DPR));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (const b of buttons) paintButton(b, state === "shown" ? 1 : curve(THREE.MathUtils.clamp((now - zero - b.at) / buttonFade, 0, 1)));
    texture.needsUpdate = true;
  };

  const show = () => {
    state = "shown";
    post({ type: "reveal" });
    host.dataset.screenMenu = "shown";
    host.dispatchEvent(new CustomEvent(SCREEN_MENU_SHOWN));
  };

  const onFocus = (event: Event) => {
    const id = (event as CustomEvent<string | null>).detail;
    focus = buttons.find(b => b.item.id === id) ?? null;
    dirty = true;
    request();
  };
  host.addEventListener(SCREEN_MENU_FOCUS, onFocus);

  // Where a ray meets the screen, in the box's CSS px.
  const at = (ray: THREE.Raycaster) => {
    const uv = ray.intersectObject(object, false)[0]?.uv;
    return uv ? { x: uv.x * BOX_W, y: (1 - uv.y) * BOX_H } : null;
  };
  const buttonAt = (point: { x: number; y: number } | null) =>
    point ? buttons.find(b => b.item.page && point.x >= b.x && point.x <= b.x + b.w && point.y >= b.y && point.y <= b.y + b.h) ?? null : null;

  return {
    object,
    step(ms: number, introComplete: boolean, reduced: boolean) {
      const now = performance.timeOrigin + performance.now();
      if (state === "off") {
        if (!introComplete || !fontReady) return false;
        holdLeft = reduced ? 0 : motionMs(host, "--motion-screen-menu-hold", 900);
        state = "hold";
        host.dataset.screenMenu = "hold";
        object.visible = true;
      }
      if (state === "hold") {
        holdLeft -= ms;
        if (holdLeft > 0) return true;
        post({ type: "geometry", geometry: { cols, rows, cell, gap, gridW, gridH, boxW: BOX_W, boxH: BOX_H, fx, fy, dpr: DPR } });
        post({ type: "colours", colours: { dash: tokens.dash, lines: [tokens.lime, tokens.violet], glow: 0, cursor: tokens.violet, ground: tokens.ground } });
        if (reduced) {
          place(null);
          post({ type: "overlay", on: true });
          show();
        } else {
          const spread = motionMs(host, "--motion-screen-menu-reveal", 600);
          buttonFade = Math.max(1, motionMs(host, "--motion-screen-menu-buttons", 240));
          const custom = getComputedStyle(host).getPropertyValue("--motion-screen-menu-ease").trim();
          curve = easing(custom || "cubic-bezier(0.22, 1, 0.36, 1)");
          const delays = reveal(spread);
          place(delays);
          zero = now;
          revealEnd = Math.max(spread + LACE_MS, ...buttons.map(b => b.at + buttonFade));
          post({ type: "reveal", delays, span: spread, zero });
          post({ type: "overlay", on: true });
          state = "revealing";
          host.dataset.screenMenu = "revealing";
        }
      }
      if (state === "revealing" && now - zero >= revealEnd) show();
      const painting = frame;
      frame = null;
      painting?.();
      if (painting || dirty || state === "revealing") compose(now);
      dirty = false;
      return state === "revealing" || frame !== null;
    },
    /** The pointer over the screen, or null when it leaves: its cell lights (D34), and a button under it is hovered. */
    point(ray: THREE.Raycaster | null) {
      if (state !== "shown") return;
      const point = ray ? at(ray) : null;
      let next = -1;
      if (point) {
        const c = Math.floor((point.x - fx + gap / 2) / pitch);
        const r = Math.floor((point.y - fy + gap / 2) / pitch);
        if (c >= 0 && c < cols && r >= 0 && r < rows) next = r * cols + c;
      }
      if (next !== cursor) {
        cursor = next;
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        post({ type: "cursor", cell: next, at: performance.timeOrigin + performance.now(), fade: still ? 0 : LIT_FADE_MS });
      }
      const over = buttonAt(point);
      if (over !== hover) {
        hover = over;
        dirty = true;
      }
    },
    /** A click on the screen: true when it opened a button's page on the screen. */
    press(ray: THREE.Raycaster) {
      if (state !== "shown") return false;
      const b = buttonAt(at(ray));
      if (!b) return false;
      hover = null;
      dirty = true;
      openScreenPage(host, b.item);
      return true;
    },
    dispose() {
      host.removeEventListener(SCREEN_MENU_FOCUS, onFocus);
      post({ type: "stop" });
      texture.dispose();
    },
  };
}
