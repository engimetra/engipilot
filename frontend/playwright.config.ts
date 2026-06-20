// ================================================================
// ENGIPILOT — Configuration Playwright
// Tests E2E sur l'application Next.js
// ================================================================
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Répertoire contenant les fichiers de tests
  testDir: './e2e',

  // Délai maximum par test
  timeout: 30_000,

  // Nombre de tentatives en cas d'échec (utile en CI)
  retries: process.env.CI ? 2 : 0,

  // Exécution parallèle désactivée en CI pour la stabilité
  workers: process.env.CI ? 1 : undefined,

  // Rapport HTML généré après chaque exécution
  reporter: [['html', { outputFolder: 'playwright-report' }]],

  use: {
    // URL de base de l'application
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',

    // Capture d'écran uniquement en cas d'échec
    screenshot: 'only-on-failure',

    // Trace enregistrée lors du premier retry
    trace: 'on-first-retry',
  },

  projects: [
    {
      // Tests uniquement sur Chromium pour réduire la durée en CI
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Lancement automatique du serveur Next.js avant les tests
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
