import { expect,test } from '@playwright/test';

test('opens the HOME plan for the active game section',async({page})=>{
  await page.addInitScript(()=>window.localStorage.setItem('living-dex:onboarding-completed','true'));
  await page.goto('/games/sv');

  await page.getByRole('button',{name:'Kitakami Dex'}).click();
  const shortcut=page.locator('.home-plan-shortcut');
  await expect(shortcut).toBeVisible({timeout:15_000});
  await shortcut.click();

  await expect(page.locator('.home-plan-panel')).toBeVisible();
  await expect(page.getByRole('button',{name:/Send to HOME/})).toHaveClass(/active/);
  await page.getByRole('button',{name:/Still missing/}).click();
  await expect(page.locator('.pokemon-box').first()).toContainText('Still missing');
  await expect(shortcut).toContainText('Back to game Dex');

  await shortcut.click();
  await expect(page.locator('.home-plan-panel')).toHaveCount(0);
});
