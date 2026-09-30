import { test, expect, type Page } from "@playwright/test";

/**
 * The agent in the motion studio (Motion.md M17, version 15, 2026-09-30): the sphere is the agent now (his: "we'll
 * remove agent and the sphere will become the agent. And agent can have eyes"), and its face has parts (M20's face
 * version 1). Driven rather than looked at: the head says the version; the jigs have an Eyes group and one for each part;
 * both eyes sit on the head; in the crouch before it leaps they turn toward the nest it is going to; and each part a
 * Style puts on is drawn. It runs with the sweep on every project and writes its screenshot beside it.
 */
const STUDIO = "http://localhost:3004";

async function pick(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

/** The eyes' centres, and the head's box, on the page. */
const eyesAndHead = (page: Page) =>
  page.locator("[data-sphere-preview]").evaluate((svg) => {
    const box = (el: Element) => el.getBoundingClientRect();
    const eyes = [...svg.querySelectorAll("[data-sphere-eye] [data-agent-eyeball]")].map((c) => {
      const b = box(c);
      return { x: b.x + b.width / 2, y: b.y + b.height / 2, r: b.width / 2 };
    });
    const head = box(svg.querySelector("[data-sphere-body] > path")!);
    const nest = (which: string) => {
      const b = box(svg.querySelector(`[data-sphere-nest="${which}"] circle`)!);
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    };
    return { eyes, head: { left: head.left, right: head.right, top: head.top, bottom: head.bottom }, from: nest("from"), to: nest("to") };
  });

/** The timeline's playhead at `ms`, from the keyboard: Home, then ten ms a Page Up. */
async function seek(page: Page, ms: number) {
  const thumb = page.getByRole("slider", { name: "Timeline", exact: true });
  await thumb.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < Math.floor(ms / 10); i++) await page.keyboard.press("PageUp");
}

test("motion agent, version 15: the sphere with eyes and a face", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto(STUDIO, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));
  await pick(page, "Motion family", "Agent");

  // Designed version by version: the head names the version, and there is no preset to pick.
  await expect(page.locator('[data-studio-part="version"]')).toHaveText("Version 15");
  await expect(page.getByRole("combobox", { name: "Preset", exact: true })).toHaveCount(0);

  // An Eyes group among its controls, and one for each part of the face.
  const mobile = await page.getByRole("combobox", { name: "Workspace view", exact: true }).isVisible();
  const chooser = mobile ? "Workspace view" : "Control group 1";
  await page.getByRole("combobox", { name: chooser, exact: true }).click();
  for (const group of ["Eyes", "Pupils", "Upper lids", "Lower lids", "Brows", "Symbols"])
    await expect(page.getByRole("option", { name: group, exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  // At the play's start, sitting in its nest: two eyes, the same size, both on the head.
  await page.getByRole("button", { name: "Play from the start", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await seek(page, 0);
  const rest = await eyesAndHead(page);
  expect(rest.eyes).toHaveLength(2);
  expect(Math.abs(rest.eyes[0]!.r - rest.eyes[1]!.r)).toBeLessThan(0.2);
  for (const e of rest.eyes) {
    expect(e.x).toBeGreaterThan(rest.head.left);
    expect(e.x).toBeLessThan(rest.head.right);
    expect(e.y).toBeGreaterThan(rest.head.top);
    expect(e.y).toBeLessThan(rest.head.bottom);
  }
  await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/motion__agent.png` });

  // In the crouch, just before it leaps, its eyes have turned toward the nest it is going to: moved that way against
  // the head, whichever way the jump goes.
  await seek(page, 50);
  const crouch = await eyesAndHead(page);
  const way = { x: rest.to.x - rest.from.x, y: rest.to.y - rest.from.y };
  const length = Math.hypot(way.x, way.y) || 1;
  const along = (s: typeof rest) => {
    const x = (s.eyes[0]!.x + s.eyes[1]!.x) / 2 - (s.head.left + s.head.right) / 2;
    const y = (s.eyes[0]!.y + s.eyes[1]!.y) / 2 - (s.head.top + s.head.bottom) / 2;
    return (x * way.x + y * way.y) / length;
  };
  expect(along(crouch)).toBeGreaterThan(along(rest) + 0.5);

  // Version 12's face wears no part; a Style puts each one on, drawn.
  const drawn = () =>
    page.locator("[data-sphere-preview]").evaluate((svg) => ({
      pupil: Number(svg.querySelector("[data-agent-pupil]")?.getAttribute("r") ?? 0),
      brows: [...svg.querySelectorAll("[data-agent-brows] path")].filter((p) => (p.getAttribute("d") ?? "") !== "").length,
      symbol: [...svg.querySelectorAll("[data-agent-symbol] path")].some((p) => (p.getAttribute("d") ?? "") !== ""),
      lid: (svg.querySelector("[data-agent-lid] path")?.getAttribute("d") ?? "") !== "",
    }));
  expect(await drawn()).toEqual({ pupil: 0, brows: 0, symbol: false, lid: false });
  const style = async (group: string, option: string) => {
    await page.getByRole("combobox", { name: chooser, exact: true }).click();
    await page.getByRole("option", { name: group, exact: true }).click();
    await page.getByRole("combobox", { name: "Style", exact: true }).first().click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };
  await style("Pupils", "Dot");
  await style("Upper lids", "Heavy");
  await style("Brows", "Arch");
  await style("Symbols", "Zzz");
  await seek(page, 0);
  const worn = await drawn();
  expect(worn.pupil).toBeGreaterThan(0);
  expect(worn.brows).toBe(2);
  expect(worn.symbol).toBe(true);
  expect(worn.lid).toBe(true);

  expect(errors).toEqual([]);
});
