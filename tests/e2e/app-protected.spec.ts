import { expect, test } from '@playwright/test';

test.describe('Routes protégées', () => {
  test('/app redirige vers /login sans session', async ({ page }) => {
    await page.goto('/app');
    // L'app doit rediriger vers /login si pas authentifié
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('/app/history redirige vers /login sans session', async ({ page }) => {
    await page.goto('/app/history');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('/app/account redirige vers /login sans session', async ({ page }) => {
    await page.goto('/app/account');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
