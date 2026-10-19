import * as THREE from "three/webgpu";
import { easing, motionMs, motionNumber } from "@no-origins/ui/lib/motion";
import { SCREEN_BASE, SCREEN_CENTER_Z, SCREEN_HEIGHT, SCREEN_RADIUS, SCREEN_WIDTH } from "./clearing-screen";

/** Screen intro, version 1: two seeds become the O's. Motion.md M3: undecided token fallbacks. */
export function buildScreenIntro(host: HTMLCanvasElement) {
  const artwork = document.createElement("canvas");
  artwork.width = 2048;
  artwork.height = 1214;
  const ctx = artwork.getContext("2d")!;
  const texture = new THREE.CanvasTexture(artwork);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, fog: false });
  const geometry = new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT, 128, 1);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const angle = vertices.getX(i) / SCREEN_RADIUS;
    const radius = SCREEN_RADIUS - 0.105;
    vertices.setXYZ(i, radius * Math.sin(angle), vertices.getY(i), SCREEN_CENTER_Z - radius * Math.cos(angle));
  }
  geometry.computeVertexNormals();
  const object = new THREE.Mesh(geometry, material);
  object.position.y = SCREEN_BASE + SCREEN_HEIGHT / 2;
  object.name = "no-origins-screen-intro";
  object.visible = false;
  let started = false, finished = false, clock = 0;
  let timing = { seed: 0, hold: 0, travel: 0, letters: 0, stagger: 0, distance: 0 };
  let curve = easing("cubic-bezier(0.22, 1, 0.36, 1)");
  const font = getComputedStyle(host).getPropertyValue("--font-heading").trim() || "Montserrat, sans-serif";
  // Wait for the host's actual heading face before measuring the wordmark.
  let fontReady = false;
  void document.fonts.load(`800 160px ${font}`).then(() => { fontReady = true; }, () => { fontReady = true; });
  const phase = (start: number, duration: number) => curve(THREE.MathUtils.clamp((clock - start) / Math.max(1, duration), 0, 1));
  function paint() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, artwork.width, artwork.height);
    ctx.font = `800 160px ${font}`;
    ctx.textBaseline = "alphabetic";
    const letters = [..."NO ORIGINS"];
    const widths = letters.map(letter => letter === "O" ? 132 : ctx.measureText(letter).width);
    const gap = 12;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (letters.length - 1);
    let x = (artwork.width - total) / 2;
    const travelStart = timing.seed + timing.hold;
    const travel = phase(travelStart, timing.travel);
    let order = 0;
    letters.forEach((letter, i) => {
      const center = x + widths[i] / 2;
      if (letter === "O") {
        const index = i === 1 ? 0 : 1;
        const seedX = artwork.width / 2 + (index ? 86 : -86);
        const seed = phase(0, timing.seed);
        const radius = 66 * seed;
        ctx.fillStyle = index ? "#9262f3" : "#ceee38";
        ctx.beginPath();
        ctx.arc(THREE.MathUtils.lerp(seedX, center, travel), artwork.height / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (letter !== " ") {
        // Unmask each letter sideways from its own O-facing edge; no floating text or perpetual loop.
        const reveal = phase(travelStart + timing.travel * 0.65 + order++ * timing.stagger, timing.letters);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - gap / 2, artwork.height / 2 - 100, (widths[i] + gap) * reveal, 200);
        ctx.clip();
        ctx.fillStyle = "#fff6e8";
        ctx.globalAlpha = reveal;
        ctx.fillText(letter, x + timing.distance * (1 - reveal), artwork.height / 2 + 58);
        ctx.restore();
      }
      x += widths[i] + gap;
    });
    texture.needsUpdate = true;
  }
  return {
    object,
    step(ms: number, docked: boolean, reduced: boolean) {
      if (!started && docked && fontReady) {
        started = true;
        timing = {
          seed: motionMs(host, "--motion-screen-intro-seed", 600),
          hold: motionMs(host, "--motion-screen-intro-hold", 320),
          travel: motionMs(host, "--motion-screen-intro-travel", 1000),
          letters: motionMs(host, "--motion-screen-intro-letters", 640),
          stagger: motionMs(host, "--motion-screen-intro-stagger", 70),
          distance: motionNumber(host, "--motion-screen-intro-shift", 28),
        };
        const custom = getComputedStyle(host).getPropertyValue("--motion-screen-intro-ease").trim();
        curve = easing(custom || "cubic-bezier(0.22, 1, 0.36, 1)");
        object.visible = true;
      }
      if (!started) return docked;
      const end = timing.seed + timing.hold + timing.travel + timing.letters + timing.stagger * 5;
      if (clock >= end) return false;
      clock = reduced ? end : Math.min(end, clock + ms);
      finished = clock >= end;
      paint();
      host.dataset.screenIntro = clock >= end ? "complete" : "playing";
      return clock < end;
    },
    /** The title has finished playing; the screen menu follows it (World.md W112). */
    get complete() { return finished; },
    dispose() { texture.dispose(); },
  };
}
