import { expect, test } from '@playwright/test';

test.describe('Landing page', () => {
  test('charge sans erreur et affiche le hero CTA', async ({ page }) => {
    await page.goto('/');

    // Hero title visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // CTA "Essai gratuit" présent (header)
    await expect(page.getByRole('link', { name: /essai gratuit/i }).first()).toBeVisible();

    // Aucune erreur JS critique
    page.on('pageerror', (err) => {
      throw new Error(`Page error: ${err.message}`);
    });
  });

  test('navigue vers /signup depuis le CTA', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /essai gratuit/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByRole('heading', { name: /crée ton compte/i })).toBeVisible();
  });
});
