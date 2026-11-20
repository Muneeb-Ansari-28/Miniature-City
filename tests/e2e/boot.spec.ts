import { expect, test } from '@playwright/test';

test('TC-E01: WebGL scene boots cleanly with zero errors and non-blank canvas', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  // Wait for loading screen to disappear within 8s
  await expect(page.getByTestId('loading-screen')).toBeHidden({ timeout: 8000 });

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(300);
  expect(box!.height).toBeGreaterThan(300);

  const screenshot = await canvas.screenshot();
  expect(screenshot.byteLength).toBeGreaterThan(4000);
  expect(errors).toEqual([]);
});
