import { test, expect } from "@playwright/test";

test("screening keeps contact first and compact sections reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('main')).toHaveAttribute('data-view', 'quick');
  await expect(page.getByRole('link', { name: 'Résumé (PDF, opens in a new tab)' })).toBeVisible();
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
  await expect(page.locator('[data-social-cell]')).toHaveCount(5);
  expect(await page.locator('[data-social-cell]').evaluateAll((cells) => cells.every((cell) => cell.clientWidth === cell.clientHeight))).toBe(true);
  const tabs = page.getByRole('tab');
  if (await tabs.count()) {
    for (const name of ['Projects', 'Skills', 'Work']) {
      await page.getByRole('tab', { name, exact: true }).click();
      await expect(page.locator('main')).toHaveAttribute('data-view', 'quick');
      await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
    }
    await page.getByRole('tab', { name: 'Skills', exact: true }).click();
  } else {
    await expect(page.locator('[data-real-project]')).toBeVisible();
    await expect(page.locator('[data-work-company]')).toHaveCount(4);
  }
  await page.getByRole('button', { name: 'All skills', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('JavaScript');
  await expect(page.getByRole('dialog')).toContainText('LangChain');
  await page.getByRole('button', { name: 'Close' }).click();
  const read = page.getByRole('button', { name: 'Read profile', exact: true });
  if (await read.count()) {
    await read.click();
    await expect(page.locator('[data-reading-profile]')).toBeVisible();
    await expect(page.locator('[data-work-company]')).toHaveCount(4);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  }
});

test("enlarged text reflows instead of clipping the profile", async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.locator('main')).toHaveAttribute('data-view', 'reading');
  await expect(page.locator('[data-work-company]')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("small phone retains every section in a reading layout", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-view', 'reading');
  await expect(page.locator('[data-work-company]')).toHaveCount(4);
  await expect(page.locator('[data-real-project]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
