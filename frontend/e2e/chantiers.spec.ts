import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL ?? 'demo@engipilot.ma');
  await page.getByLabel(/mot de passe|password/i).fill(process.env.E2E_USER_PASSWORD ?? 'Demo1234!');
  await page.getByRole('button', { name: /connexion|login|se connecter/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
}

test.describe('Gestion des chantiers', () => {

  test('liste des chantiers se charge', async ({ page }) => {
    await login(page);
    await page.goto('/fr/chantiers');
    await expect(page.getByRole('heading', { name: /chantier/i })).toBeVisible({ timeout: 8_000 });
  });

  test('créer un nouveau chantier', async ({ page }) => {
    await login(page);
    await page.goto('/fr/chantiers');
    await page.getByRole('button', { name: /nouveau|créer|ajouter/i }).click();
    await page.getByLabel(/nom|titre/i).fill('Chantier Test E2E');
    await page.getByRole('button', { name: /enregistrer|créer|valider/i }).click();
    await expect(page.getByText('Chantier Test E2E')).toBeVisible({ timeout: 8_000 });
  });

  test('dashboard affiche les KPIs', async ({ page }) => {
    await login(page);
    await page.goto('/fr/dashboard');
    await expect(page.getByText(/chantier|projet/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('page kanban se charge', async ({ page }) => {
    await login(page);
    await page.goto('/fr/kanban');
    await expect(page.getByRole('heading', { name: /kanban|tâche/i })).toBeVisible({ timeout: 8_000 });
  });

});
