import { expect, test } from "@playwright/test";

test("Orbit buttons retain Space activation alongside travel controls", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://localhost:3005", { waitUntil: "networkidle" });
  const canvas = page.locator('[data-slot="world"] canvas');
  await expect(canvas).toHaveAttribute("data-ready", "true", { timeout: 60_000 });

  await page.getByRole("button", { name: /Open Clay’s bag/ }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog", { name: "Clay’s bag" })).toBeVisible();
  const position = await canvas.getAttribute("data-clay-position");
  await page.keyboard.press("w");
  await expect(canvas).toHaveAttribute("data-clay-position", position!);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: /Open Clay’s visor/ }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog", { name: /Clay’s visor/ })).toBeVisible();
  await page.getByRole("button", { name: "Esc · Return" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
