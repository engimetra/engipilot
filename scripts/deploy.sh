#!/usr/bin/env bash
# ================================================================
# ENGIPILOT — Script de déploiement (exécuté avec l'user engipilot)
# NE PAS exécuter en root
# ================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[⚠]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

[[ $EUID -eq 0 ]] && error "Ne pas exécuter en root — utiliser l'user '${USER}'"

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${APP_DIR}"

log "=== Déploiement ENGIPILOT depuis : ${APP_DIR} ==="

# 1. Vérifications
[[ -f ".env" ]] || error ".env absent — cp .env.example .env et configurer"
command -v docker &>/dev/null || error "Docker absent"

# 2. Pull des dernières images (versions épinglées)
log "Mise à jour des images Docker..."
docker compose pull --quiet

# 3. Construire les images applicatives
log "Build des images ENGIPILOT..."
docker compose build --no-cache --quiet

# 4. Démarrer les services
log "Démarrage des services..."
docker compose up -d

# 5. Attendre la disponibilité
log "Attente de la disponibilité des services..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8080/actuator/health &>/dev/null; then
        log "Backend opérationnel !"
        break
    fi
    echo -n "."
    sleep 3
done

# 6. Charger les données si première installation
if [[ "${1:-}" == "--first-install" ]]; then
    log "Première installation — chargement des données démo..."
    sleep 10
    docker exec -i engipilot-db psql -U admin -d engipilot < sql/seeds/01_demo.sql
fi

log "=== Déploiement terminé ==="
echo ""
echo "  Frontend  → http://localhost:3000"
echo "  Swagger   → http://localhost:8080/swagger-ui.html"
echo "  IA docs   → http://localhost:8001/docs"
echo "  Grafana   → http://localhost:3001"
