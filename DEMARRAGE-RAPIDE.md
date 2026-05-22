# ENGIPILOT — Démarrage Rapide

## Stack officielle
- Node.js 22 LTS · Java 21 LTS · Python 3.11
- Next.js 15 · Spring Boot 3.5.1 · TailwindCSS 3.4
- PostgreSQL 17 · Redis 7 · Kafka 7.5

---

## Étape 1 — Prérequis (installer une seule fois)

```bash
# Node.js 22 LTS (via nvm)
nvm install 22 && nvm use 22 && nvm alias default 22
corepack enable   # Active pnpm

# Java 21 — Temurin sur https://adoptium.net/

# Python 3.11 — sur https://python.org/downloads/

# Docker Desktop — sur https://docker.com/products/docker-desktop
```

---

## Étape 2 — Configurer le projet

```bash
# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env et changer au minimum JWT_SECRET

# Générer un JWT_SECRET fort :
openssl rand -base64 48
```

---

## Étape 3 — Démarrer l'infrastructure

```bash
# Lance PostgreSQL 17, Redis, Kafka, MinIO, Grafana
docker compose up -d

# Vérifier que tout tourne
docker compose ps

# Charger les données de démo
make db-seed
```

---

## Étape 4 — Démarrer les services applicatifs

### Option A : Via Docker (tout en une commande)
```bash
make dev
```

### Option B : Via VSCode (recommandé pour le développement)
```bash
# Ouvrir le workspace
code engipilot.code-workspace

# Dans VSCode :
# 1. F5 → "▶ Backend Spring Boot (dev)"     (port 8080)
# 2. F5 → "▶ Frontend Next.js (dev)"        (port 3000)
# 3. F5 → "▶ IA Service (dev)"              (port 8001)

# Ou via les tâches : Ctrl+Shift+P → "Run Task" → "Démarrer ENGIPILOT"
```

---

## Étape 5 — Entraîner les modèles IA

```bash
# Créer l'environnement Python
cd ia
python3.11 -m venv .venv
source .venv/bin/activate   # macOS/Linux
.venv\Scripts\activate       # Windows
pip install -r requirements.txt

# Entraîner les 3 modèles ML (à faire une fois)
make train-ia
```

---

## Accès aux services

| Service | URL | Login |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | demo@engipilot.ma / demo123 |
| **Swagger API** | http://localhost:8080/swagger-ui.html | — |
| **IA Service** | http://localhost:8001/docs | — |
| **Grafana** | http://localhost:3001 | admin / admin |
| **MinIO** | http://localhost:9001 | minioadmin / minioadmin123 |

---

## Commandes utiles

```bash
make dev          # Tout démarrer
make stop         # Tout arrêter (garde les données)
make db-seed      # Recharger les données démo
make train-ia     # Entraîner les modèles ML
make test-all     # Lancer tous les tests
make clean        # Supprimer toutes les données
```
