import { expect, test } from '@playwright/test';

test('shows only compatible alternate forms inside a game Dex',async({page})=>{
  await page.addInitScript(()=>window.localStorage.setItem('living-dex:onboarding-completed','true'));
  await page.goto('/games/sv');

  const toggle=page.getByRole('button',{name:/Variants available in this game/i});
  await expect(toggle).toBeVisible({timeout:15_000});
  await expect(toggle).toHaveAttribute('aria-expanded','false');

  await page.locator('.game-variants-shortcut').click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect.poll(()=>toggle.evaluate(element=>{const bounds=element.getBoundingClientRect();return bounds.top>=0&&bounds.bottom<=window.innerHeight})).toBe(true);
  await expect(page.locator('.game-variants-content')).toBeVisible();
  await expect(page.getByText('White-Striped',{exact:true})).toBeVisible();
  await expect(page.getByText('Bloodmoon',{exact:true})).toBeVisible();
  await expect(page.getByText('Sky Forme',{exact:true})).toHaveCount(0);
  await expect(page.locator('.game-variants-content .dex-number')).toHaveCount(0);
});
