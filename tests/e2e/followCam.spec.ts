import { expect, test } from '@playwright/test';

test('TC-E04: Ride-Along Follow Mode displays live vehicle HUD and exits cleanly on Escape', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('loading-screen')).toBeHidden({ timeout: 8000 });

  await page.getByRole('button', { name: 'Toggle city navigation menu' }).click();
  await page.getByTestId('ride-along-btn').click();

  const followCard = page.getByTestId('follow-cam-card');
  await expect(followCard).toBeVisible();
  await expect(followCard).toContainText('Ride-Along Follow Mode');
  await expect(followCard).toContainText('km/h');

  await page.keyboard.press('Escape');
  await expect(followCard).toBeHidden();
});
