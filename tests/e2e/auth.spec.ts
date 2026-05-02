import { expect, test } from '@playwright/test';

test.describe('Auth pages', () => {
  test('/login affiche le form et redirige vers /signup', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /se connecter/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();

    // Lien vers signup
    await page.getByRole('link', { name: /crée-en un/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('/signup valide les champs avant submit', async ({ page }) => {
    await page.goto('/signup');

    const submit = page.getByRole('button', { name: /créer mon compte/i });
    // Bouton désactivé tant que les champs ne sont pas remplis
    await expect(submit).toBeDisabled();

    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('shortpw'); // < 8 chars

    // Toujours désactivé (password trop court)
    await expect(submit).toBeDisabled();

    await page.locator('input[type="password"]').fill('longenoughpw');
    await expect(submit).toBeEnabled();
  });

  test('/forgot-password affiche le form', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /mot de passe oublié/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
