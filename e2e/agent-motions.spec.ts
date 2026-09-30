import { test, expect, type Page } from "@playwright/test";

/**
 * The agent's motions (Motion.md M20, his model of a motion, built 2026-09-30): a motion of its own, made here and
 * deleted after — Body and Eyes ticked, a Body row setting Columns (a hop) and an Eyes row setting Look X — plays the
 * hop and turns the eyes; and a Brows row set apart raises one brow. Where the studio saves to the database (his machine, signed in), it is saved there first, and
 * deleted from there after; with no keys (CI) it is the browser's. Driven, not looked at; its screenshot beside the
 * sweep's.
 */
const STUDIO = "http://localhost:3004";

async function pick(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

/** The timeline's playhead at `ms`, from the keyboard: Home, then ten ms a Page Up. */
async function seek(page: Page, ms: number) {
  const thumb = page.getByRole("slider", { name: "Timeline", exact: true });
  await thumb.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < Math.floor(ms / 10); i++) await page.keyboard.press("PageUp");
}

const where = (page: Page) =>
  page.locator("[data-sphere-preview]").evaluate((svg) => {
    const centre = (el: Element) => {
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    };
    return {
      head: centre(svg.querySelector("[data-sphere-body] > path")!),
      eyes: [...svg.querySelectorAll("[data-sphere-eye] [data-agent-eyeball]")].map(centre),
    };
  });

/** Set a control on the row selected, turning the row's pages until it is there. */
async function set(page: Page, label: string, value: string) {
  const field = page.locator(`input[aria-label="${label} value"]`).first();
  for (let i = 0; i < 12 && !(await field.isVisible()); i++) await page.getByRole("button", { name: "Next controls", exact: true }).click();
  await field.fill(value);
  await field.press("Enter");
}

/** Let the saving settle, where there is saving. */
async function saved(page: Page) {
  const status = page.locator("[data-save-status]");
  if (!(await status.count())) return;
  await expect.poll(() => status.first().getAttribute("data-save-status"), { timeout: 10_000 }).toMatch(/^(saved|offline)$/);
}

test("motion agent motions: a motion of its own, a hop and a look", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one pass: it writes to his local database");
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto(STUDIO, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));
  await pick(page, "Motion family", "Agent motions");
  await expect(page.locator('[data-studio-part="version"]')).toHaveText("Version 1");
  await saved(page);

  const name = `Spec ${Date.now().toString(36)}`;
  await page.getByRole("button", { name: "New motion", exact: true }).click();
  const field = page.getByRole("textbox", { name: "Motion name", exact: true });
  await field.fill(name);
  await field.press("Enter");
  await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute("data-state", "active");
  for (const part of ["Body", "Eyes"]) {
    const box = page.getByRole("checkbox", { name: part, exact: true });
    if ((await box.getAttribute("data-state")) !== "checked") await box.click();
  }
  await expect(page.getByRole("button", { name: "Add a row: Pupils", exact: true })).toHaveCount(0);

  // The rows start at the playhead: at the start.
  await page.getByRole("button", { name: "Play from the start", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await seek(page, 0);
  await page.getByRole("button", { name: "Add a row: Body", exact: true }).first().click();
  await set(page, "Columns", "1");
  await page.getByRole("button", { name: /^Row Body/ }).first().click();
  await page.getByRole("button", { name: "Add a row: Eyes", exact: true }).first().click();
  await set(page, "Look X", "1");
  await page.getByRole("button", { name: /^Row Eyes/ }).first().click();
  await saved(page);

  await page.getByRole("button", { name: "Play from the start", exact: true }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await seek(page, 0);
  const before = await where(page);
  await seek(page, 3000);
  const after = await where(page);
  // It hopped a column across, and its eyes turned further than the hop carried them.
  expect(after.head.x - before.head.x).toBeGreaterThan(20);
  expect(after.eyes[0]!.x - before.eyes[0]!.x - (after.head.x - before.head.x)).toBeGreaterThan(1);
  await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/motion__agent-motions.png` });

  // A pair set apart (his: "fix the mirror pairs"): a Brows row wearing Arch, Mirrored off, the right brow's angle its
  // own; the two brows then draw differently.
  await page.getByRole("checkbox", { name: "Brows", exact: true }).click();
  await page.getByRole("button", { name: "Add a row: Brows", exact: true }).first().click();
  await page.getByRole("combobox", { name: "Style", exact: true }).first().click();
  await page.getByRole("option", { name: "Arch", exact: true }).click();
  await set(page, "Angle", "-30");
  const mirrored = page.getByRole("switch", { name: "Mirrored", exact: true });
  await expect(mirrored).toHaveAttribute("aria-checked", "true");
  await mirrored.click();
  await page.getByRole("tab", { name: "Right", exact: true }).click();
  await set(page, "Angle · right", "35");
  const brows = () => page.locator("[data-agent-brows] path").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  await expect.poll(brows).toHaveLength(2);
  const [left, right] = await brows();
  expect(Math.abs(left! - right!)).toBeGreaterThan(0.5);
  await page.getByRole("button", { name: /^Row Brows/ }).first().click();
  await saved(page);

  // A reload finds it where it is saved; then it goes, never published.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.querySelector('[data-slot="grid"][data-intro]'));
  await pick(page, "Motion family", "Agent motions");
  await saved(page);
  await page.getByRole("tab", { name, exact: true }).click();
  await page.getByRole("button", { name: "Delete motion", exact: true }).click();
  await expect(page.getByRole("tab", { name, exact: true })).toHaveCount(0);
  await saved(page);
  expect(errors).toEqual([]);
});
