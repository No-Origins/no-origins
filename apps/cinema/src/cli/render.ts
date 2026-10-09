import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { chromium, type Page } from "@playwright/test";

import { frameSize } from "../engine/shot.ts";
import type { AssetBook, Frame, Shot } from "../engine/types.ts";

/**
 * Rendering (Cinema-Engine.md E7). A headless browser opens the engine's page, `/render`, and asks it to draw the shot
 * at each moment in turn, never in real time, so a slow frame is never dropped; what an agent checks is exactly what he
 * sees. The frames go to ffmpeg, which encodes the video.
 */

const STUDIO = process.env.CINEMA_URL ?? "http://localhost:3009";

async function studioIsUp() {
  try {
    return (await fetch(`${STUDIO}/render`, { method: "HEAD" })).ok;
  } catch {
    return false;
  }
}

/** Opens the engine on a shot at its frame, runs `work`, and closes. The GPU on a Mac (Metal), else SwiftShader. */
export async function withEngine<T>(shot: Shot, assets: AssetBook, work: (draw: (t: number, format: "png" | "jpeg") => Promise<Buffer>) => Promise<T>) {
  if (!(await studioIsUp())) throw new Error(`The studio is not running at ${STUDIO}: start it with \`pnpm --filter cinema dev\`.`);
  const browser = await chromium.launch({ args: process.platform === "darwin" ? ["--use-angle=metal"] : ["--enable-unsafe-swiftshader"] });
  try {
    const { width, height } = frameSize(shot.frame);
    const page: Page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`${STUDIO}/render`);
    await page.waitForFunction(() => window.cinema?.ready === true, undefined, { timeout: 60_000 });
    const problems = await page.evaluate(([loaded, book]) => window.cinema!.load(loaded, book), [shot, assets] as const);
    if (problems.length) throw new Error(`The shot did not load: ${problems.join("; ")}.`);
    return await work(async (t, format) => {
      const url = await page.evaluate(([at, type]) => window.cinema!.draw(at, type, 0.92), [t, `image/${format}`] as const);
      return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    });
  } finally {
    await browser.close();
  }
}

/** Runs ffmpeg, feeding it `input` on stdin when there is any, and fails loudly with its own words. */
function ffmpeg(args: string[], feed?: (stdin: NodeJS.WritableStream) => Promise<void>) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: [feed ? "pipe" : "ignore", "ignore", "pipe"] });
    let said = "";
    child.stderr?.on("data", (chunk) => (said += chunk));
    child.on("error", (error) => reject(new Error(`ffmpeg could not start (${error.message}); it is needed for sheets and video.`)));
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg failed: ${said.trim()}`))));
    if (feed && child.stdin) feed(child.stdin).then(() => child.stdin!.end(), reject);
  });
}

/** A frame scaled down for quick looks; its sides kept even for the encoder. */
export const scaled = (frame: Frame, scale: number): Frame => ({ ...frame, size: Math.max(90, Math.round((frame.size * scale) / 2) * 2) });

export async function still(shot: Shot, t: number, file: string, assets: AssetBook) {
  await withEngine(shot, assets, async (draw) => writeFileSync(file, await draw(t, "png")));
}

/** A contact sheet: stills across the shot, tiled in rows (E6). */
export async function sheet(shot: Shot, times: number[], columns: number, file: string, assets: AssetBook) {
  const dir = mkdtempSync(path.join(tmpdir(), "cinema-sheet-"));
  try {
    await withEngine(shot, assets, async (draw) => {
      for (const [index, t] of times.entries()) writeFileSync(path.join(dir, `${String(index).padStart(3, "0")}.png`), await draw(t, "png"));
    });
    const rows = Math.ceil(times.length / columns);
    await ffmpeg(["-framerate", "1", "-i", path.join(dir, "%03d.png"), "-vf", `tile=${columns}x${rows}:padding=6:margin=6:color=white`, "-frames:v", "1", file]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * A video of the shot at `times`, at the shot's frame rate. A clip for checking is quick (JPEG frames, a fast preset);
 * an export is at full quality (PNG frames, a slow preset) and takes as long as it takes.
 */
export async function video(shot: Shot, times: number[], file: string, quality: "check" | "final", assets: AssetBook, progress?: (done: number) => void) {
  await withEngine(shot, assets, async (draw) => {
    const format = quality === "final" ? "png" : "jpeg";
    await ffmpeg(
      [
        "-f", "image2pipe", "-framerate", String(shot.frame.fps), "-c:v", format === "png" ? "png" : "mjpeg", "-i", "-",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", quality === "final" ? "16" : "23", "-preset", quality === "final" ? "slow" : "veryfast",
        "-movflags", "+faststart", file,
      ],
      async (stdin) => {
        for (const [index, t] of times.entries()) {
          const frame = await draw(t, format);
          if (!stdin.write(frame)) await new Promise((resolve) => stdin.once("drain", resolve));
          progress?.(index + 1);
        }
      },
    );
  });
}
