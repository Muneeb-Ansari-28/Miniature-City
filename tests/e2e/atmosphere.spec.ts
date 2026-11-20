import { expect, test } from '@playwright/test';

test('TC-E02: Atmosphere switches visually between Noon and Night presets', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('loading-screen')).toBeHidden({ timeout: 8000 });

  const canvas = page.locator('canvas').first();

  await page.getByRole('button', { name: 'Noon' }).click();
  await page.waitForTimeout(800);
  const noonShot = await canvas.screenshot();

  await page.getByRole('button', { name: 'Night' }).click();
  await page.waitForTimeout(1000);
  const nightShot = await canvas.screenshot();

  const timeOfDay = await page.evaluate(() => window.__CITY_STATS__?.timeOfDay ?? -1);
  expect(timeOfDay).toBeGreaterThanOrEqual(18.5);
  expect(noonShot.toString('base64')).not.toBe(nightShot.toString('base64'));
});
