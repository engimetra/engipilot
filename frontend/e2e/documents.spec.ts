import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL ?? 'demo@engipilot.ma');
  await page.getByLabel(/mot de passe|password/i).fill(process.env.E2E_USER_PASSWORD ?? 'Demo1234!');
  await page.getByRole('button', { name: /connexion|login|se connecter/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
}

test.describe('Documents & Rapports', () => {

  test('page documents se charge', async ({ page }) => {
    await login(page);
    await page.goto('/fr/documents');
    await expect(page.getByRole('heading', { name: /document/i })).toBeVisible({ timeout: 8_000 });
  });

  test('page planning se charge', async ({ page }) => {
    await login(page);
    await page.goto('/fr/planning');
    await expect(page).not.toHaveURL(/login/);
    await expect(page).not.toHaveURL(/error/);
  });

  test('aucune erreur React critique visible', async ({ page }) => {
    await login(page);
    for (const route of ['/fr/dashboard', '/fr/chantiers', '/fr/documents', '/fr/planning']) {
      await page.goto(route);
      await expect(page.getByText('Application error')).not.toBeVisible();
      await expect(page.getByText('Internal Server Error')).not.toBeVisible();
    }
  });

});
