import { expect, test } from '@playwright/test';

test('TC-E06: Mobile viewport (390x844) has zero horizontal overflow and clickable HUD', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByTestId('loading-screen')).toBeHidden({ timeout: 8000 });

  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  await page.getByRole('button', { name: 'Night' }).click();
  await page.getByRole('button', { name: /Rain/i }).click();
  await page.getByRole('button', { name: 'Toggle city navigation menu' }).click();
  await expect(page.getByTestId('ride-along-btn')).toBeVisible();
});
