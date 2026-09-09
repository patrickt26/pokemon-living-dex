import { test, expect } from '@playwright/test';

test('production smoke test loads the app and a Pokémon sprite', async ({ page }) => {
  const failedSpriteRequests: string[] = [];
  page.on('requestfailed', request => {
    if (request.resourceType() === 'image' && request.url().includes('sprites')) {
      failedSpriteRequests.push(request.url());
    }
  });

  await page.goto('/national');
  await expect(page).toHaveTitle('Living Dex');
  await expect(page.locator('.sidebar')).toBeVisible();

  const sprite = page.locator('.pokemon-sprite').first();
  await expect(sprite).toBeVisible();
  await expect.poll(() => sprite.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(failedSpriteRequests).toEqual([]);
});
