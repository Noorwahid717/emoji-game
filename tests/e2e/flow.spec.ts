import { expect, test } from '@playwright/test';

const URL = process.env.PREVIEW_URL ?? 'http://localhost:4173/emoji-game/';

test('auto navigate to Main Menu after preload (desktop)', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await expect(page.locator('text=Emoji Match')).toBeVisible();
  await expect(page.getByRole('button', { name: /mulai|start/i })).toBeVisible({ timeout: 3_000 });
});

test.describe('mobile', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  });

  test('mobile does not hang at 100% & shows menu', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Emoji Match')).toBeVisible();
    await expect(page.getByRole('button', { name: /mulai|start/i })).toBeVisible({
      timeout: 4_000,
    });
  });
});
