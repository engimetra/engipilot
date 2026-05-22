# 🏗️ ENGIPILOT — Plateforme Intelligente de Supervision des Chantiers BTP

> SaaS production-ready · Next.js 14 · Spring Boot 3 · Python IA · PostgreSQL · Kafka · Docker · K8s

---

## 🚀 Démarrage en 3 commandes

```bash
cp .env.example .env
make dev
open http://localhost:3000   # Login : demo@engipilot.ma / demo123
```

---

## 📦 Architecture complète

```
ENGIPILOT-SAAS/
│
├── 📄 engipilot.code-workspace    ← Ouvrir dans VSCode
├── 📄 docker-compose.yml           ← 10 services
├── 📄 Makefile                     ← Commandes dev
│
├── ⚛️  frontend/                   ← Next.js 14 + TypeScript
│   ├── src/app/                    ← 16 pages (toutes implémentées)
│   ├── src/components/             ← Sidebar, Topbar, Charts, Kanban, Gantt
│   ├── src/services/               ← projetService, iaService, pdfService
│   ├── src/hooks/                  ← useProjet, useWebSocket
│   ├── src/store/                  ← Zustand (user, projetActif)
│   ├── src/types/                  ← Tous les types TypeScript
│   └── src/middleware.ts           ← Auth guard JWT
│
├── ☕  backend/                    ← Java 21 + Spring Boot 3.2
│   └── src/main/java/com/engipilot/
│       ├── config/                 ← SecurityConfig + JwtAuthFilter
│       ├── controller/             ← Auth, Projets, Tâches, Rapports, NC, HSE, KPI
│       ├── domain/                 ← 7 entités JPA
│       ├── dto/                    ← Request/Response records
│       ├── repository/             ← 6 Spring Data JPA
│       ├── service/                ← Auth, Projet, KPI, Tache, Rapport, NC, HSE
│       ├── kafka/                  ← Producer + Consumer
│       ├── websocket/              ← STOMP + NotificationService
│       └── util/                   ← JWT, Security, Audit AOP
│
├── 🤖  ia/                        ← Python 3.11 + FastAPI
│   ├── src/api/routers/            ← predictions, anomalies, chat, health
│   ├── src/data/                   ← Collectors PostgreSQL + Feature Engineering
│   ├── src/training/               ← train_all.py (3 modèles ML)
│   ├── src/kafka/consumer.py       ← Consumer événements KPI
│   ├── tests/                      ← 15 tests pytest
│   └── models/                     ← Modèles .joblib (après make train-ia)
│
├── 🗄️  sql/
│   ├── migrations/V1__init.sql    ← 10 tables PostgreSQL
│   └── seeds/01_demo.sql          ← Données démo
│
├── ⚙️  infra/
│   ├── k8s/                        ← Manifests Kubernetes
│   └── terraform/main.tf           ← IaC AWS (VPC, RDS, ECS, S3)
│
└── 🔧  nginx/ · monitoring/ · .github/workflows/
```

---

## 🎯 Modules implémentés

| Module | Frontend | Backend | IA |
|--------|----------|---------|-----|
| Dashboard KPIs | ✅ | ✅ EVM complet | ✅ |
| Chantiers table | ✅ Monday.com | ✅ CRUD + multi-tenant | — |
| Kanban | ✅ Drag & drop | ✅ Statuts | — |
| Planning Gantt | ✅ | — | — |
| Rapports | ✅ + PDF | ✅ Validation | — |
| Documents | ✅ Upload UI | ✅ MinIO ready | — |
| HSE | ✅ Matrice risques | ✅ TF/TG | — |
| Qualité NC | ✅ Table + form | ✅ Référence auto | — |
| Analytics | ✅ 4 graphiques | ✅ KPI API | — |
| IA Prédictions | ✅ | — | ✅ XGBoost |
| Chat IA Copilot | ✅ Temps réel | — | ✅ FastAPI |
| Équipes | ✅ | — | — |
| Approvisionnement | ✅ Stock + commandes | — | — |
| Notifications | ✅ | ✅ WebSocket | — |
| Facturation SaaS | ✅ Plans + usage | — | — |
| Onboarding | ✅ 7 étapes | — | — |
| Paramètres | ✅ Profil + notifs | ✅ Auth JWT | — |

---

## 🛠️ Commandes Makefile

```bash
make dev          # Démarrer tous les services Docker
make stop         # Arrêter
make build        # Rebuilder les images
make test-all     # Tests backend + frontend + IA
make db-seed      # Injecter les données démo
make train-ia     # Entraîner les modèles ML
make clean        # Tout nettoyer
```

---

## 📊 KPIs EVM calculés

| Formule | Description |
|---------|-------------|
| `SPI = VA / VP` | Schedule Performance Index |
| `CPI = VA / CR` | Cost Performance Index |
| `EAC = BAT / CPI` | Estimé à l'achèvement |
| `ETC = EAC - CR` | Estimé pour terminer |
| `VAC = BAT - EAC` | Écart à l'achèvement |
| `TCPI = (BAT-VA)/(BAT-CR)` | To-Complete Performance Index |

---

## 🔐 Auth & Sécurité

- JWT Bearer tokens (Spring Security stateless)
- BCrypt password hashing (strength 12)
- Multi-tenant par `organisationId` sur chaque query
- Audit logs automatiques via AOP `@Auditable`
- CORS configuré pour localhost:3000

---

## 📡 API Endpoints

```
POST /api/v1/auth/login          → JWT token
POST /api/v1/auth/register       → Nouveau compte
GET  /api/v1/projets             → Liste projets (paginée)
GET  /api/v1/projets/{id}/kpis/evm → Calcul EVM complet
POST /api/v1/projets/{id}/taches → Créer tâche Kanban
POST /api/v1/projets/{id}/rapports → Rapport journalier
POST /api/v1/projets/{id}/nc     → Non-conformité
POST /api/v1/projets/{id}/hse/incidents → Incident HSE
GET  /swagger-ui.html            → Documentation Swagger
```

---

## 🤖 IA Service (http://localhost:8001)

```
POST /api/v1/predictions/retard-budget → XGBoost + EVM
POST /api/v1/anomalies/detecter        → Isolation Forest
POST /api/v1/chat                      → Chat Copilot
GET  /docs                             → Swagger IA
```

---

## 🏭 Production

```bash
# Kubernetes
kubectl apply -f infra/k8s/namespace/
kubectl apply -f infra/k8s/secrets/
kubectl apply -f infra/k8s/backend/
kubectl apply -f infra/k8s/frontend/

# Terraform AWS
cd infra/terraform
terraform init && terraform plan && terraform apply
```
