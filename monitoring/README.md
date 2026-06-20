# Supervision ENGIPILOT — Grafana + Prometheus

Stack de supervision complète basée sur Docker Compose, incluant Prometheus, Grafana, node-exporter, cAdvisor et postgres-exporter.

## Prérequis

Le réseau Docker `engipilot_network` doit exister avant de démarrer la stack de supervision. Ce réseau est créé automatiquement lors du démarrage de la stack principale :

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Démarrage de la stack de supervision

```bash
docker compose -f monitoring/docker-compose.monitoring.yml --env-file monitoring/.env.monitoring up -d
```

Pour arrêter la stack :

```bash
docker compose -f monitoring/docker-compose.monitoring.yml down
```

## Accès aux interfaces

| Service    | URL                              | Description                    |
|------------|----------------------------------|--------------------------------|
| Grafana    | http://&lt;ip-serveur&gt;:3001   | Tableaux de bord — login : admin |
| Prometheus | http://&lt;ip-serveur&gt;:9090   | Interface de requêtes PromQL   |

Le mot de passe Grafana est défini par la variable `GF_SECURITY_ADMIN_PASSWORD` dans `monitoring/.env.monitoring`.

## Intégration avec le compose principal

Pour intégrer la supervision dans le fichier `docker-compose.prod.yml`, il suffit d'ajouter les services ci-dessous et de s'assurer que le réseau `engipilot_network` est déclaré dans les deux fichiers Compose :

```yaml
# Extrait à ajouter dans docker-compose.prod.yml
include:
  - monitoring/docker-compose.monitoring.yml
```

Ou lancer les deux fichiers simultanément :

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f monitoring/docker-compose.monitoring.yml \
  --env-file .env \
  --env-file monitoring/.env.monitoring \
  up -d
```

## Tableaux de bord disponibles

- **ENGIPILOT — Vue d'ensemble** : CPU, mémoire, requêtes HTTP, redémarrages conteneurs, disque, connexions PostgreSQL.
- **ENGIPILOT — Backend Java** : Heap JVM, latence p95, connexions HikariCP, taux d'erreurs HTTP.

## Sécurité

> **Important** : Modifier impérativement les mots de passe dans `monitoring/.env.monitoring` avant tout déploiement en production. Ne jamais committer ce fichier avec des credentials réels.

Les ports 9090 (Prometheus) et 3001 (Grafana) ne doivent pas être exposés publiquement. Utiliser un reverse proxy avec authentification (nginx, Caddy) pour sécuriser l'accès.
