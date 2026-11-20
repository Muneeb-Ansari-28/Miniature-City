import { expect, test } from '@playwright/test';

test('TC-E05: Live scene meets draw-call, triangle, agent count, and zero-leak budgets', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('loading-screen')).toBeHidden({ timeout: 8000 });

  await page.waitForTimeout(2000);
  const earlyStats = await page.evaluate(() => window.__CITY_STATS__);
  expect(earlyStats).toBeDefined();

  await page.waitForTimeout(8000);
  const lateStats = await page.evaluate(() => window.__CITY_STATS__);
  expect(lateStats).toBeDefined();

  expect(lateStats!.drawCalls).toBeLessThan(100);
  expect(lateStats!.triangles).toBeLessThan(150_000);
  expect(lateStats!.activeVehicles).toBeGreaterThanOrEqual(10);
  expect(lateStats!.activePedestrians).toBeGreaterThanOrEqual(20);

  // Zero geometry/texture leak between t=2s and t=10s
  expect(lateStats!.geometries).toBe(earlyStats!.geometries);
  expect(lateStats!.textures).toBe(earlyStats!.textures);
});
