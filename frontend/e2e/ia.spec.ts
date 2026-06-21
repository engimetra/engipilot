import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL ?? 'demo@engipilot.ma');
  await page.getByLabel(/mot de passe|password/i).fill(process.env.E2E_USER_PASSWORD ?? 'Demo1234!');
  await page.getByRole('button', { name: /connexion|login|se connecter/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
}

test.describe('Service IA — Prédictions', () => {

  test('page prédictions IA se charge', async ({ page }) => {
    await login(page);
    await page.goto('/fr/chantiers');
    await expect(page).not.toHaveURL(/login/);
  });

  test('health check API IA répond 200', async ({ request }) => {
    const response = await request.get(
      `${process.env.IA_URL ?? 'http://localhost:8001'}/health`
    );
    expect(response.status()).toBe(200);
  });

  test('endpoint /metrics IA expose métriques Prometheus', async ({ request }) => {
    const response = await request.get(
      `${process.env.IA_URL ?? 'http://localhost:8001'}/metrics`
    );
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('http_requests');
  });

});
