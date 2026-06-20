// ================================================================
// ENGIPILOT — Script de charge k6
// Cible : endpoint de santé du backend (http://localhost:8080)
// Scénario : montée progressive en charge sur 1 minute
// ================================================================
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métrique personnalisée : taux d'erreurs HTTP
const tauxErreurs = new Rate('taux_erreurs');

// Configuration des étapes de charge
export const options = {
  stages: [
    // Montée progressive : 0 → 10 utilisateurs en 20 secondes
    { duration: '20s', target: 10 },
    // Maintien de la charge : 10 utilisateurs pendant 30 secondes
    { duration: '30s', target: 10 },
    // Descente progressive : 10 → 0 utilisateurs en 10 secondes
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // 95% des requêtes doivent répondre en moins de 500ms
    http_req_duration: ['p(95)<500'],
    // Moins de 1% d'erreurs tolérées
    taux_erreurs: ['rate<0.01'],
  },
};

// Adresse du backend (injectée via variable d'environnement ou valeur par défaut)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // ── Test de l'endpoint de santé ──────────────────────────────
  const reponseSante = http.get(`${BASE_URL}/actuator/health`);

  check(reponseSante, {
    // Vérification du code HTTP 200
    'health: statut 200': (r) => r.status === 200,
    // Vérification que le corps contient "UP"
    'health: corps contient UP': (r) => r.body && r.body.includes('UP'),
  });

  // Enregistrement des erreurs dans la métrique personnalisée
  tauxErreurs.add(reponseSante.status !== 200);

  // Pause entre les requêtes pour simuler un comportement réaliste
  sleep(1);
}
