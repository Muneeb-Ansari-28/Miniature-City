import { expect, test } from '@playwright/test';

test('TC-E03: POI inspection card opens with live occupancy and closes on Escape', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('loading-screen')).toBeHidden({ timeout: 8000 });

  await page.getByRole('button', { name: 'Toggle city navigation menu' }).click();
  await page.getByTestId('poi-jump-sakura-ramen-corner').click();

  const card = page.getByTestId('inspector-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Sakura Ramen Corner');
  await expect(page.getByTestId('poi-occupancy')).toHaveText(/\d+\s*\/\s*\d+/);

  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
});
