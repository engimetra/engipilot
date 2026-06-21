import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {

  test('login avec identifiants valides → dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL ?? 'demo@engipilot.ma');
    await page.getByLabel(/mot de passe|password/i).fill(process.env.E2E_USER_PASSWORD ?? 'Demo1234!');
    await page.getByRole('button', { name: /connexion|login|se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test('login avec mauvais mot de passe → message erreur', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('demo@engipilot.ma');
    await page.getByLabel(/mot de passe|password/i).fill('mauvais_mdp');
    await page.getByRole('button', { name: /connexion|login|se connecter/i }).click();
    await expect(page.getByText(/invalide|incorrect|erreur|error/i)).toBeVisible({ timeout: 5_000 });
  });

  test('accès dashboard sans auth → redirection login', async ({ page }) => {
    await page.goto('/fr/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
  });

  test('déconnexion → retour login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL ?? 'demo@engipilot.ma');
    await page.getByLabel(/mot de passe|password/i).fill(process.env.E2E_USER_PASSWORD ?? 'Demo1234!');
    await page.getByRole('button', { name: /connexion|login|se connecter/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
    await page.getByRole('button', { name: /déconnexion|logout/i }).click();
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
  });

});
