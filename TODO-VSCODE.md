# ENGIPILOT — Ce qui reste à faire dans VSCode

> Ce fichier liste les SEULS éléments à compléter pour avoir une plateforme 100% opérationnelle.
> Tout le reste est déjà fourni et fonctionnel.

---

## PRIORITÉ 1 — À faire en premier (infrastructure)

### 1.1 Configurer le .env
```bash
cp .env.example .env
# Ouvrir .env et changer :
# JWT_SECRET=<générer avec : openssl rand -base64 48>
# POSTGRES_PASSWORD=<votre_password>
# REDIS_PASSWORD=<votre_password>
```

### 1.2 Installer les dépendances frontend
```bash
cd frontend
pnpm install
```

### 1.3 Créer l'environnement Python
```bash
cd ia
python3.11 -m venv .venv
source .venv/bin/activate    # macOS/Linux
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

### 1.4 Entraîner les modèles ML (une seule fois)
```bash
make train-ia
# Génère 3 fichiers dans ia/models/ :
#   predicteur_retards_v1.joblib
#   predicteur_couts_v1.joblib
#   detecteur_anomalies_v1.joblib
```

---

## PRIORITÉ 2 — Compléter les données de démo

### 2.1 Vérifier et personnaliser les données démo
Fichier : `sql/seeds/01_demo.sql`

**Ce qui est déjà là :** 2 projets (Résidence Al Andalous + Usine Bouskoura), un utilisateur démo
**Ce que vous pouvez ajouter :** Vos vrais noms de clients, vos types de chantiers, vos données de test

---

## PRIORITÉ 3 — Adapter la configuration à votre entreprise

### 3.1 Nom et branding
**Fichier à modifier :** `frontend/src/app/layout.tsx`
```typescript
// Changer le titre
title: "VOTRE_ENTREPRISE — Supervision des Chantiers"
```

**Fichier à modifier :** `frontend/src/components/layout/Sidebar.tsx`
```typescript
// Changer le nom affiché dans la sidebar
<span>VOTRE_ENTREPRISE</span>
```

### 3.2 Couleur principale (optionnel)
**Fichier :** `frontend/tailwind.config.ts`
```typescript
// Remplacer #3b82f6 (bleu) par votre couleur corporate
primary: { DEFAULT: "#votre_couleur", hover: "#plus_sombre" }
```

---

## PRIORITÉ 4 — Ce qui est déjà fait et fonctionne

✅ **Infrastructure Docker** — PostgreSQL 17, Redis 7, Kafka, MinIO
✅ **Backend Spring Boot 3.5** — Auth JWT, 7 controllers REST, EVM, Kafka
✅ **16 pages frontend** — Dashboard, Kanban, Gantt, Rapports, HSE, NC, Analytics, IA, Chat...
✅ **Service IA** — FastAPI, 3 modèles ML, Chat Copilot BTP
✅ **Sécurité** — JWT multi-tenant, Spring Security 6, BCrypt
✅ **Monitoring** — Prometheus + Grafana 11
✅ **PDF génération** — Rapports journaliers
✅ **WebSocket** — Alertes temps réel
✅ **Tests** — JUnit 5, Pytest, Vitest

---

## PRIORITÉ 5 — Fonctionnalités à implémenter manuellement (avancé)

Ces fonctionnalités ont leur structure créée mais nécessitent un peu de travail côté backend pour être 100% connectées à la base de données réelle :

### 5.1 Upload de fichiers vers MinIO
**Fichier backend :** `backend/.../controller/DocumentController.java`
**Ce qu'il faut faire :** Implémenter le endpoint POST /documents pour uploader vers MinIO
**Complexité :** Moyenne (2-3h)

### 5.2 Envoi d'emails (notifications)
**Ce qu'il faut faire :** Configurer SMTP dans application.yml et créer EmailService.java
**Complexité :** Faible (1-2h)

### 5.3 Export Excel des rapports
**Ce qu'il faut faire :** Ajouter dépendance Apache POI dans pom.xml et créer ExportService.java
**Complexité :** Faible (2h)

---

## Vérification finale avant présentation client

```bash
# 1. Tout démarrer
make dev

# 2. Attendre 60 secondes, vérifier
docker compose ps

# 3. Test rapide
curl http://localhost:8080/actuator/health   # doit retourner {"status":"UP"}
curl http://localhost:8001/health            # doit retourner {"status":"ok"}

# 4. Ouvrir le frontend
open http://localhost:3000
# Login : demo@engipilot.ma / demo123

# 5. Charger les données démo si besoin
make db-seed
```

---

## Commandes VSCode utiles

```
Ctrl+Shift+P → "Run Task" → Choisir :
  🐳 Démarrer ENGIPILOT (docker compose)
  🌱 Charger données de démo
  🤖 Entraîner les modèles ML
  🧪 Tous les tests

F5 → Lancer backend / frontend / IA en mode debug
Ctrl+` → Ouvrir le terminal intégré
```
