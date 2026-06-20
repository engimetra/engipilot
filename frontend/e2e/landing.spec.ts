// ================================================================
// ENGIPILOT — Test E2E : Page d'accueil
// Vérifie que la page d'accueil se charge correctement
// ================================================================
import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil', () => {

  test('la page d\'accueil se charge sans erreur', async ({ page }) => {
    // Navigation vers la racine de l'application
    const response = await page.goto('/');

    // Vérification que le serveur répond avec un code HTTP 200
    expect(response?.status()).toBe(200);
  });

  test('le titre de la page est défini', async ({ page }) => {
    await page.goto('/');

    // Le titre de la page doit être non vide
    const titre = await page.title();
    expect(titre).toBeTruthy();
  });

  test('la page ne contient pas d\'erreur critique visible', async ({ page }) => {
    await page.goto('/');

    // Vérification qu'aucun message d'erreur React n'est affiché
    const erreurReact = page.getByText('Application error');
    await expect(erreurReact).not.toBeVisible();
  });

});
