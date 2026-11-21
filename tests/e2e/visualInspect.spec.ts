import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Visual Inspection: Verify all enrichment details, animals, playground, and performance', async ({ page }) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  // Wait for loading screen to disappear
  await expect(page.getByTestId('loading-screen')).toBeHidden({ timeout: 12000 });
  await page.waitForTimeout(2000); // Allow scene to stabilize

  const outputDir = path.resolve('test-results', 'inspection');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Overview shot
  await page.screenshot({ path: path.join(outputDir, '01_overview.png') });

  // Helper to open top-right nav menu safely
  const openMenu = async () => {
    const toggleBtn = page.getByRole('button', { name: 'Toggle city navigation menu' });
    const isExpanded = await toggleBtn.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }
  };

  // 2. Central Pocket Park (Children's Playground + Botanical Garden)
  await openMenu();
  await page.getByTestId('poi-jump-central-pocket-park').click();
  await page.waitForTimeout(1600); // Camera smooth glide
  await page.keyboard.press('Escape'); // Dismiss inspector card
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outputDir, '02_pocket_park_playground.png') });

  // 3. Harbor Plaza (Fountain with hollow basin, 2 vending machines against wall, burger stall)
  await openMenu();
  await page.getByTestId('poi-jump-harbor-plaza').click();
  await page.waitForTimeout(1600);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outputDir, '03_harbor_plaza.png') });

  // 4. Sakura Ramen Corner (Patio umbrellas, blossoming Sakura tree, sidewalk details)
  await openMenu();
  await page.getByTestId('poi-jump-sakura-ramen-corner').click();
  await page.waitForTimeout(1600);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outputDir, '04_sakura_ramen.png') });

  // 5. Top-down view
  await openMenu();
  await page.getByRole('button', { name: 'Top-Down' }).click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(outputDir, '05_top_down.png') });

  // Verify telemetry & performance budgets
  const stats = await page.evaluate(() => window.__CITY_STATS__);
  expect(stats).toBeDefined();
  console.log('=== CITY TELEMETRY STATS ===', stats);
  expect(stats!.drawCalls).toBeLessThan(100);
  expect(stats!.triangles).toBeLessThan(150_000);

  console.log('=== CONSOLE WARNINGS ===', warnings);
  console.log('=== CONSOLE ERRORS ===', errors);
  expect(errors).toEqual([]);
});
